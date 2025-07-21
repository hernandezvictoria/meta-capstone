const { PriorityQueue } = require("@datastructures-js/priority-queue");
const { fetchImageFromDB, placeholderImage, resetCounters } = require("./db-cache.js");
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const { InteractionTypes, ActivityTypes } = require("../enums.js");

const MAX_CACHE_SIZE = 50; // max number of products in cache
const TTL = 1000 * 60 * 60 * 24; // time to live for each product in cache, 1 day for now
const FLUSH_SIZE = 10; // number of products to flush from cache when cache is at capacity
const PRIORITY_BOOST = 5; // how much to boost priority score by if product gets viewed multiple times from cache
let currentUserId = null;
const oneDayMilliseconds = 1000 * 60 * 60 * 24;
const oneHourMilliseconds = 1000 * 60 * 60;
const oneWeekMilliseconds = 1000 * 60 * 60 * 24 * 7;

let potentialAPICalls = 0;
let cacheHits = 0;

let productQueue;
let productImageCache;

let numActiveUsers; // number of users active in the last hour
let userToActivityScore; // map userID -> number of logins in past week normalized by max logins in that week by one user (between 0 and 1)

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

// sets num online users and user activities
let maxScore = 1;
const setUserActivity = async() => {
  numActiveUsers = 0;
  userToActivityScore = new Map();
  const allUserLogins = await prisma.userActivity.findMany({
    where: {activity_type : ActivityTypes.LOGIN}
  });

  const userLoginsInPastWeek = allUserLogins.filter((login) =>
    (Date.now() - login.activity_time.getTime() <= oneWeekMilliseconds)
  );

  const allUserLogouts = await prisma.userActivity.findMany({
    where: {
      activity_type : ActivityTypes.LOGOUT
    }
  });

  const userLogoutsInPastHour = allUserLogouts.filter((logout) =>
    (Date.now() - logout.activity_time.getTime() <= oneHourMilliseconds)
  );

  for(const loginActivity of userLoginsInPastWeek){
    if(Date.now() - loginActivity.activity_time.getTime() <= oneHourMilliseconds){ // if activity happened in last hour
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
}

// returns a number representing the priority of the product (based on how used it is)
const computeInitialPriority = async (productId) => {
  await setUserActivity();
  //higher click velocity -> higher priority score, less likely to be flushed from cache
  if (productImageCache.has(productId)) {
    const currentTime = Date.now();
    const productTime = productImageCache.get(productId).timestamp.getTime();
    if (currentTime - productTime >= TTL) {
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
    const userClicksInLastDay = totalProductClicks.filter(
      (interaction) =>
        interaction.interaction_time.getTime() >=
        currentTime - oneDayMilliseconds
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
          userSet.add(userId); // use set to only track distinct users
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

    const openModalScore = interactionScores.get(InteractionTypes.OPEN_MODAL)
    const likeScore = interactionScores.get(InteractionTypes.LIKE) - interactionScores.get(InteractionTypes.REMOVE_LIKE);
    const saveScore = interactionScores.get(InteractionTypes.SAVE) - interactionScores.get(InteractionTypes.REMOVE_SAVE);
    const dislikeScore = interactionScores.get(InteractionTypes.DISLIKE) - interactionScores.get(InteractionTypes.REMOVE_DISLIKE);

    // opening modal carries most weight
    // higher velocity -> higher priority score -> less likely to be flushed from cache
    return ( openModalScore + (likeScore + saveScore + dislikeScore) * 0.5 );
  } else {
    return Number.MIN_SAFE_INTEGER; // edge case if product not in cache, should never happen, but if it does, will get flushed first
  }
};

const flushCache = () => {
  // flush stale data from cache or FLUSH_SIZE products from cache in priority order
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

    if (totalRemoved >= FLUSH_SIZE) {
      return; // if enough products have already been removed, return
    }

    // remove more items from cache if not enough products with stale data were removed
    for (let i = 0; i < FLUSH_SIZE - totalRemoved; i++) {
      if (productImageCache.size === 0 || productQueue.isEmpty()) {
        return; // if all products are removed, return
      }
      const dequeuedProduct = productQueue.dequeue();
      productImageCache.delete(dequeuedProduct.productId);
    }
  }
};

const insertProduct = async (productId) => {
  if (!productQueue) {
    createQueueAndCache(); // if queue and cache are not created, create them
  }

  if (productImageCache.size >= MAX_CACHE_SIZE) {
    flushCache(); // if cache is at capacity, flush FLUSH_SIZE products from cache
  }
  productImageCache.set(productId, {
    image: await fetchImageFromDB(productId),
    timestamp: new Date(),
  });
  const priority = await computeInitialPriority(productId);
  productQueue.enqueue({ productId, priority });
};

const replaceProduct = async (productId) => {
  productQueue.remove((p) => p.productId === productId);
  productImageCache.set(productId, {
    image: await fetchImageFromDB(productId),
    timestamp: new Date(),
  });
  const priority = await computeInitialPriority(productId);
  productQueue.enqueue({ productId, priority });
};

// returns the image url of the product, given the product ID
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
      if ( Date.now() - productImageCache.get(productId).timestamp.getTime() >= TTL ) {
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

module.exports = {
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
