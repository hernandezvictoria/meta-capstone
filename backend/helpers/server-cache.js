const { PriorityQueue } = require("@datastructures-js/priority-queue");
const { fetchImageFromDB, placeholderImage, resetCounters } = require("./db-cache.js");
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const { InteractionTypes, ActivityTypes } = require("../enums.js");

// ============ CONSTANTS ============
const MAX_CACHE_SIZE = 70; // largest size dynamic cache can reach
const MIN_CACHE_SIZE = 50;
const PRIORITY_BOOST = 5; // how much to boost priority score by if product gets viewed multiple times from cache
const ONE_DAY_MILLISECONDS = 1000 * 60 * 60 * 24;
const ONE_HOUR_MILLISECONDS = 1000 * 60 * 60;
const ONE_WEEK_MILLISECONDS = 1000 * 60 * 60 * 24 * 7;
const CACHE_SIZE_LIMITOR = 1; // can be adjusted to less than 1 if app gets popular

// ============ STATS ============
let potentialAPICalls = 0;
let cacheHits = 0;

// ============ OTHER DATA ============
let productQueue;
let productImageCache;
let numActiveUsers = 0; // number of users active in the last hour
let userToActivityScore; // map userID -> number of logins in past week normalized by max logins in that week by one user (between 0 and 1)
let currentUserId = null;
let dynamicCacheLifetime = 1000 * 60 * 60 * 24; // time to live for each product in cache, 1 day for now
let dynamicFlushSize = 10; // number of products to flush from cache when cache is at capacity
let dynamicCacheSize = MIN_CACHE_SIZE;

/**
 * Initializes cache and priority queue.
 */
const createQueueAndCache = () => {
  // priority queue for products, less interacted with products have lower priority (first to be flushed from cache)
  productQueue = new PriorityQueue((a, b) => {
    if (a.priority === b.priority) {
      // if they are tied, sort by recency
      const aTime = productImageCache.has(a.productId)
        ? productImageCache.get(a.productId).timestamp.getTime()
        : Date.now();
      const bTime = productImageCache.has(b.productId)
        ? productImageCache.get(b.productId).timestamp.getTime()
        : Date.now();
      return aTime - bTime;
    }
    return a.priority - b.priority;
  });
  productImageCache = new Map(); // productId -> image url, timestamp
};

/**
 * Resizes cache based on number of active users in last hour.
 */
const resizeCache = () => {
  dynamicCacheSize = MIN_CACHE_SIZE + (numActiveUsers * CACHE_SIZE_LIMITOR);
  dynamicCacheSize = Math.min(dynamicCacheSize, MAX_CACHE_SIZE); // cap the cache size at MAX_CACHE_SIZE
  dynamicCacheLifetime = ONE_DAY_MILLISECONDS / (dynamicCacheSize / MIN_CACHE_SIZE); // larger caches have shorter lifetimes
  dynamicFlushSize = Math.floor(dynamicCacheSize / 5); // flush size is 1/5 of cache size

  // if existing cache is larger than new cache size
  if(productImageCache.size > dynamicCacheSize){
    const sizeDifference = productImageCache.size - dynamicCacheSize;
    const numFlushes = Math.ceil(sizeDifference / dynamicFlushSize); // use math.ceil to round up to the integer
    for(let i = 0; i < numFlushes; i++){
      flushCache(); // flush until below max cache size
    }
  }
}

/**
 * Sets number of active users in past hour (numActiveUsers) and activity scores of each user (userToActivityScore).
 */
const setUserActivity = async() => {
  numActiveUsers = 0;
  userToActivityScore = new Map();

  const allUserLogins = await prisma.userActivity.findMany({
    where: {activity_type : ActivityTypes.LOGIN}
  });

  const userLoginsInPastWeek = allUserLogins.filter((login) =>
    (Date.now() - login.activity_time.getTime() <= ONE_WEEK_MILLISECONDS)
  );

  const allUserLogouts = await prisma.userActivity.findMany({
    where: {
      activity_type : ActivityTypes.LOGOUT
    }
  });

  const userLogoutsInPastHour = allUserLogouts.filter((logout) =>
    (Date.now() - logout.activity_time.getTime() <= ONE_HOUR_MILLISECONDS)
  );

  let maxScore = 1;
  for(const loginActivity of userLoginsInPastWeek){
    if(Date.now() - loginActivity.activity_time.getTime() <= ONE_HOUR_MILLISECONDS){ // if activity happened in last hour
      // if the user hasn't logged out yet
      if(!userLogoutsInPastHour.some((logoutActivity) => {
          logoutActivity.user_id === loginActivity.user_id
          && logoutActivity.activity_time.getTime() > loginActivity.activity_time.getTime() // user logged out after logging in
      })){
        numActiveUsers++;
      }
    }

    // add each login to userActivity score
    if(userToActivityScore.has(loginActivity.user_id)){
      userToActivityScore.set(loginActivity.user_id, (userToActivityScore.get(loginActivity.user_id) + 1))
      if(userToActivityScore.get(loginActivity.user_id) > maxScore){
        maxScore = userToActivityScore.get(loginActivity.user_id);
      }
    }
    else{
      userToActivityScore.set(loginActivity.user_id, 1);
    }
  }

  // normalize scores based on the maxScore
  for(const key of userToActivityScore.keys()){
    userToActivityScore.set(key, userToActivityScore.get(key) / maxScore) // now score is between 0 and 1
  }
  resizeCache(); // update cache size after updating number of active users
}

/**
 * Computes priority of a product based on how much interaction it gets.
 * Higher priority scores are less likely to be flushed from the cache.
 * @param {number} productId - ID of the product whose priority score to compute.
 * @returns {number} - Computed priority score (float).
 */
const computeInitialPriority = async (productId) => {
  await setUserActivity();
  if (productImageCache.has(productId)) {
    const currentTime = Date.now();
    const productTime = productImageCache.get(productId).timestamp.getTime();
    if (currentTime - productTime >= dynamicCacheLifetime) {
      return Number.MIN_SAFE_INTEGER; // if product data is stale, return lowest priority (first to be flushed)
    }

    const totalProductClicks = await prisma.userProductInteraction.findMany({
      where: {
        product_id: productId,
      },
    });

    if (totalProductClicks.length === 0) {
      return 0;
    }
    const userClicksInLastDay = totalProductClicks.filter((interaction) =>
      interaction.interaction_time.getTime() >= currentTime - ONE_DAY_MILLISECONDS
    );

    const interactionUsers = new Map(); // maps interaction type -> set of unqiue user ids
    const interactionScores = new Map(); // maps interaction type -> score (sum of each unique user activity score)

    const incrementFrequency = (interactionType, userId) => {
      let userSet;
      let isUserInSet = false;
      if (interactionUsers.has(interactionType)) {
        userSet = interactionUsers.get(interactionType);
        if(userSet.has(userId)){
          isUserInSet = true;
        } else{
          userSet.add(userId); // use a set to only track distinct users
        }
      }
      else{ // first time interaction is being added to the maps
        userSet = new Set();
        userSet.add(userId);
      }
      interactionUsers.set(interactionType, userSet);

      if(!isUserInSet){ // if user not already documented for this interaction, add user score to interactionScores
        const userActivityScore = userToActivityScore.get(userId);
        if (interactionScores.has(interactionType)){
          interactionScores.set(interactionType, interactionScores.get(interactionType) + userActivityScore) // add user's score to existing score sum
        }
        else{
          interactionScores.set(interactionType, userActivityScore);
        }
      }
    }

    // update interaction frequencies based on all clicks that happened in the last day
    for (const interaction of userClicksInLastDay) {
      switch (interaction.interaction_type) {
        case InteractionTypes.OPEN_MODAL:
          incrementFrequency(InteractionTypes.OPEN_MODAL, interaction.user_id);
          break;
        case InteractionTypes.LIKE:
          incrementFrequency(InteractionTypes.LIKE, interaction.user_id);
          break;
        case InteractionTypes.REMOVE_LIKE:
          incrementFrequency(InteractionTypes.REMOVE_LIKE, interaction.user_id);
          break;
        case InteractionTypes.SAVE:
          incrementFrequency(InteractionTypes.SAVE, interaction.user_id);
          break;
        case InteractionTypes.REMOVE_SAVE:
          incrementFrequency(InteractionTypes.REMOVE_SAVE, interaction.user_id);
          break;
        case InteractionTypes.DISLIKE:
          incrementFrequency(InteractionTypes.DISLIKE, interaction.user_id);
          break;
        case InteractionTypes.REMOVE_DISLIKE:
          incrementFrequency(InteractionTypes.REMOVE_DISLIKE, interaction.user_id);
          break;
      }
    }

    // higher user interaction -> higher priority score -> less likely to be flushed from cache
    const openModalScore = interactionScores.get(InteractionTypes.OPEN_MODAL)
    const likeScore = interactionScores.get(InteractionTypes.LIKE) - interactionScores.get(InteractionTypes.REMOVE_LIKE);
    const saveScore = interactionScores.get(InteractionTypes.SAVE) - interactionScores.get(InteractionTypes.REMOVE_SAVE);
    const dislikeScore = interactionScores.get(InteractionTypes.DISLIKE) - interactionScores.get(InteractionTypes.REMOVE_DISLIKE);

    // opening modal carries most weight
    return ( openModalScore + (likeScore + saveScore + dislikeScore) * 0.5 );
  } else {
    return Number.MIN_SAFE_INTEGER; // edge case if product not in cache, should never happen, but if it does, will get flushed first
  }
};

/**
 * Flushes stale data from cache or dynamicFlushSize products from cache in order of priority (lowest to highest).
 */
const flushCache = () => {
  let totalRemoved = 0;
  if (productImageCache.size > 0) {
    // remove all the products with stale data from cache
    // products with stale data have priority of Number.MIN_SAFE_INTEGER
    while ( computeInitialPriority(productQueue.front()) === Number.MIN_SAFE_INTEGER ) {
      const dequeuedProduct = productQueue.dequeue();
      productImageCache.delete(dequeuedProduct.productId);
      totalRemoved++;
      if (productImageCache.size === 0) {
        return; // if all products are removed, return
      }
    }

    if (totalRemoved >= dynamicFlushSize) {
      return; // if enough products have already been removed, return
    }

    // remove more items from cache if not enough products with stale data were removed
    for (let i = 0; i < dynamicFlushSize - totalRemoved; i++) {
      if (productImageCache.size === 0 || productQueue.isEmpty()) {
        return; // if all products are removed, return
      }
      const dequeuedProduct = productQueue.dequeue();
      productImageCache.delete(dequeuedProduct.productId);
    }
  }
};

/**
 * Inserts product into the cache and priority queue.
 * @param {number} productId - ID of the product to be inserted.
 */
const insertProduct = async (productId) => {
  if (!productQueue) {
    createQueueAndCache(); // if queue and cache are not created, create them
  }

  if (productImageCache.size >= dynamicCacheSize) {
    flushCache(); // if cache is at capacity, flush FLUSH_SIZE products from cache
  }
  productImageCache.set(productId, {
    image: await fetchImageFromDB(productId),
    timestamp: new Date(),
  });
  const priority = await computeInitialPriority(productId);
  productQueue.enqueue({ productId, priority });
};

/**
 * Replaces stale product data with updated product data in cache and queue.
 * @param {number} productId - ID of product to be replaced.
 */
const replaceProduct = async (productId) => {
  productQueue.remove((p) => p.productId === productId);
  productImageCache.set(productId, {
    image: await fetchImageFromDB(productId),
    timestamp: new Date(),
  });
  const priority = await computeInitialPriority(productId);
  productQueue.enqueue({ productId, priority });
};

/**
 * Fetches the image URL of the product from the local cache, else from DB.
 * @param {number} userId - ID of the user who is fetching the product.
 * @param {number} productId - ID of the product whose image to fetch.
 * @returns {string} - The product image's URL.
 */
const getProductImage = async (userId, productId) => {
  if (!currentUserId) { // create cache if it doesn't exist
      createQueueAndCache();
      potentialAPICalls = 0;
      cacheHits = 0;
      resetCounters();
  }

  potentialAPICalls++;
  try {
    if (!productImageCache) {
      createQueueAndCache(); // if queue and cache are not created, create them
    }
    currentUserId = userId; // set the current user id
    if (productImageCache.has(productId)) {
      if ( Date.now() - productImageCache.get(productId).timestamp.getTime() >= dynamicCacheLifetime ) {
        await replaceProduct(productId); // if product data is stale, replace it with new data
      } else {
        cacheHits++; // if product data is not stale, increment cache hits
        const removed = productQueue.remove((p) => p.productId === productId);
        if (removed[0]) {
          productQueue.enqueue({
            productId,
            priority: removed[0].priority + PRIORITY_BOOST,
          });
        }
      }
    } else {
      // if product data is not in cache
      await insertProduct(productId);
    }
    return productImageCache.get(productId).image;
  } catch (err) {
    return placeholderImage; // if there is an error, return a placeholder image
  }
};

const getPotentialAPICalls = () => {
  return potentialAPICalls;
}

const getCacheHits = () => {
  return cacheHits;
}

// ====================== GETTERS USED FOR TESTING ======================
const getQueue = () => {
  return productQueue;
};

const getCache = () => {
  return productImageCache;
};

const getUserActivityScore = () => {
  return userToActivityScore;
}

module.exports = {
  getUserActivityScore,
  createQueueAndCache,
  flushCache,
  computeInitialPriority,
  insertProduct,
  replaceProduct,
  getProductImage,
  getQueue,
  getCache,
  getPotentialAPICalls,
  getCacheHits,
  setUserActivity
};
