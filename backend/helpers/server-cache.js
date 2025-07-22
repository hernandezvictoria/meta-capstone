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
        where: { activity_type : ActivityTypes.LOGOUT }
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
            })) {
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
 * For a specific product, computes the interaction scores for each interaction type.
 * @param {list} userClicksInLastDay - List of UserProductInteraction objects that happened in the last day.
 * @returns {map} - Map from interaction type to interaction score (sum of users' activity score whom interacted with the product).
 */
const getInteractionScores = (userClicksInLastDay) => {
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
            } else{
                interactionScores.set(interactionType, userActivityScore);
            }
        }
    }

    // update interaction frequencies based on all clicks that happened in the last day
    for (const interaction of userClicksInLastDay) {
        incrementFrequency(interaction.interaction_type, interaction.user_id);
    }

    return interactionScores;
}

/**
 * Computes priority of a product based on how much interaction it gets.
 * Higher priority scores are less likely to be flushed from the cache.
 * @param {number} productId - ID of the product whose priority score to compute.
 * @returns {number} - Computed priority score (float).
 */
const computeInitialPriority = async (productId) => {
    await setUserActivity();

    const totalProductClicks = await prisma.userProductInteraction.findMany({
        where: { product_id: productId }
    });

    if (totalProductClicks.length === 0) {
          return 0; // priority is 0 if no interactions
    }

    const userClicksInLastDay = totalProductClicks.filter((interaction) =>
          interaction.interaction_time.getTime() >= Date.now() - ONE_DAY_MILLISECONDS
    );

    const interactionScores = getInteractionScores(userClicksInLastDay);

    // higher user interaction -> higher priority score -> less likely to be flushed from cache
    const openModalScore = interactionScores.get(InteractionTypes.OPEN_MODAL)
    const likeScore = interactionScores.get(InteractionTypes.LIKE) - interactionScores.get(InteractionTypes.REMOVE_LIKE);
    const saveScore = interactionScores.get(InteractionTypes.SAVE) - interactionScores.get(InteractionTypes.REMOVE_SAVE);
    const dislikeScore = interactionScores.get(InteractionTypes.DISLIKE) - interactionScores.get(InteractionTypes.REMOVE_DISLIKE);

    // opening modal carries most weight
    return ( openModalScore + (likeScore + saveScore + dislikeScore) * 0.5 );
};

/**
 * Flushes dynamicFlushSize products from cache in order of priority (lowest to highest).
 */
const flushCache = () => {
    if (productImageCache.size > 0) {
        for (let i = 0; i < dynamicFlushSize; i++) {
            if (productImageCache.size === 0 || productQueue.isEmpty()) {
                return; // if all products are removed, return early
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
    if (!currentUserId || !productImageCache || !productQueue) { // create cache if they don't exist
        createQueueAndCache();
        potentialAPICalls = 0;
        cacheHits = 0;
        resetCounters();
    }

    potentialAPICalls++;
    try {
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
    } catch (error) {
        return placeholderImage; // if there is an error, return a placeholder image
    }
};

// ====================== GETTERS USED FOR STATS ROUTING CALL ======================
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
