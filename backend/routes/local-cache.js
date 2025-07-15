const { PriorityQueue } = require('@datastructures-js/priority-queue');
const {fetchImageFromDB} = require('./server-cache.js')

const MAX_CACHE_SIZE = 50; // max number of products in cache
const TTL = 1000*60*60; // time to live for each product in cache, 1 hour for now

const productQueue = new PriorityQueue((a, b) => {
    // priority queue for productIds in the cache based on computed priority
    // ordered from lowest priority to highest priority (where priority is computed based on how "used" the product is)
    return computePriority(a) - computePriority(b);
  }
);

const productImageCache = new Map(); // productId -> image url, timestamp

// returns a number representing the priority of the product (based on how used it is)
const computePriority = (productId) => {
    //higher click velocity -> higher priority
    if (productImageCache.has(productId)) {
        if (new Date() - productImageCache.get(productId).timestamp >= TTL) {
            return Math.min();
        }
    }
};

const flushCache = () => {
    // flushes 10 highest priority products from cache
}

const insertProduct = (productId) => {
    if(productImageCache.size >= MAX_CACHE_SIZE) {
        flushCache();
    }

    productQueue.enqueue(productId);
    productImageCache.set(productId, {image: fetchImageFromDB, timestamp: new Date()});
}

const getProductImage = (productId) => {
    // fetches image from cache, if not in cache or expired, flushes cache and fetches from DB

    // If product in cache
    // If fetched.time - current.time >= refreshTime
    // Flush stale data (from cache and queue)
    // Fetch new value and store (in cache and queue)
    // Return data from cache
    // Else (if the product is not in the cache)

    fetchImageFromDB(productId);
};
