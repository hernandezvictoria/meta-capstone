const { PriorityQueue } = require('@datastructures-js/priority-queue');
const {fetchImageFromDB} = require('./server-cache.js')
const { PrismaClient } = require('../generated/prisma/index.js')
const prisma = new PrismaClient()
const express = require('express')
const router = express.Router()
const {InteractionTypes} = require('../enums.js')

const MAX_CACHE_SIZE = 50; // max number of products in cache
const TTL = 1000*60*60*24; // time to live for each product in cache, 1 day for now
const FLUSH_SIZE = 10; // number of products to flush from cache when cache is at capacity
let currentUserId = null;
const placeholderImage = "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";

let productQueue;
let productImageCache;

const createQueueAndCache = () => {
    // priority queue for products, less interacted with products have lower priority (first to be flushed from cache)
    productQueue = new PriorityQueue((a, b) => {
        if (a.priority === b.priority) { // if they are tied, sort by recency
            const aTime = productImageCache.has(a.productId) ? productImageCache.get(a.productId).timestamp.getTime() : Date.now();
            const bTime = productImageCache.has(b.productId) ? productImageCache.get(b.productId).timestamp.getTime() : Date.now();
            return aTime - bTime;
        }
        return a.priority - b.priority;
    });
    productImageCache = new Map(); // productId -> image url, timestamp
}

// returns a number representing the priority of the product (based on how used it is)
const computeInitialPriority = async (productId) => {
    //higher click velocity -> higher priority score, less likely to be flushed from cache
    if (productImageCache.has(productId)) {
        const currentTime = Date.now();
        const productTime = productImageCache.get(productId).timestamp.getTime()
        if (currentTime - productTime >= TTL) {
            return Number.MIN_SAFE_INTEGER; // if product data is stale, return lowest priority (first to be flushed)
        }

        const oneDayMilliseconds = 1000*60*60*24; // 1 day, but can be changed
        const totalUserClicks = await prisma.userProductInteraction.findMany({
            where: {
                user_id: currentUserId,
                product_id: productId
            }
        });

        if(totalUserClicks.length === 0) {
            return 0;
        }
        const userClicksInLastDay = totalUserClicks.filter(interaction => interaction.interaction_time.getTime() >= currentTime - oneDayMilliseconds);

        const openModalVelocity = userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.OPEN_MODAL).length / 24; // total opens per hour
        const likeVelocity = (userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.LIKE).length
                            -  userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.REMOVE_LIKE).length ) / 24; // net likes per hour
        const saveVelocity = (userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.SAVE).length
                            -  userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.REMOVE_SAVE).length ) / 24; // net saves per hour
        const dislikeVelocity = (userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.DISLIKE).length
                            -  userClicksInLastDay.filter(interaction => interaction.interaction_type === InteractionTypes.REMOVE_DISLIKE).length ) / 24; // net dislikes per hour

        // opening modal carries most weight
        return openModalVelocity + (likeVelocity + saveVelocity + dislikeVelocity) * 0.5; // higher velocity -> higher priority score -> less likely to be flushed from cache
    }
    else{
        return Number.MIN_SAFE_INTEGER; // edge case if product not in cache, should never happen, but if it does, will get flushed first
    }
};

const flushCache = () => {
    // flush stale data from cache or FLUSH_SIZE products from cache in priority order
    const totalRemoved = 0;
    if(productImageCache.size > 0) {
        // remove all the products with stale data from cache
        while(computeInitialPriority(productQueue.front()) === Number.MIN_SAFE_INTEGER){
            const dequeuedProduct = productQueue.dequeue();
            productImageCache.delete(dequeuedProduct.productId);
            totalRemoved++;
            if(productImageCache.size === 0) {
                return; // if all products are removed, return
            }
        }

        if (totalRemoved >= FLUSH_SIZE){
            return; // if enough products have already been removed, return
        }

        // remove more items from cache if not enough products with stale data were removed
        for (let i = 0; i < FLUSH_SIZE - totalRemoved; i++) {
            if(productImageCache.size === 0) {
                return; // if all products are removed, return
            }
            const dequeuedProduct = productQueue.dequeue();
            productImageCache.delete(dequeuedProduct.productId);
        }
    }
}

const insertProduct = async (productId) => {
    if(!productQueue) {
        createQueueAndCache(); // if queue and cache are not created, create them
    }

    if (productImageCache.size >= MAX_CACHE_SIZE) {
        flushCache(); // if cache is at capacity, flush FLUSH_SIZE products from cache
    }
    productImageCache.set(productId, { image: await fetchImageFromDB(productId), timestamp: new Date() });
    const priority = await computeInitialPriority(productId);
    productQueue.enqueue({ productId, priority });
};

const replaceProduct = async (productId) => {
    productQueue.remove((p) => p.productId === productId);
    productImageCache.set(productId, { image: await fetchImageFromDB(productId), timestamp: new Date() });
    const priority = await computeInitialPriority(productId);
    productQueue.enqueue({ productId, priority });
};


// returns the image url of the product, given the product ID
// TODO: change method to a router GET request
const getProductImage = async (userId, productId) => {
    try{
        if(!productImageCache) {
            createQueueAndCache(); // if queue and cache are not created, create them
        }

        currentUserId = userId; // set the current user id
        if (productImageCache.has(productId)) {
            if (Date.now() - productImageCache.get(productId).timestamp.getTime() >= TTL) {
                await replaceProduct(productId); // if product data is stale, replace it with new data
            } else {
                const removed = productQueue.remove((p) => p.productId === productId);
                if (removed[0]) {
                    productQueue.enqueue({ productId, priority: removed[0].priority + 1 });
                }
            }
        } else { // if product data is not in cache
            await insertProduct(productId);
        }
        return productImageCache.get(productId).image;
    } catch (err) {
        return placeholderImage; // if there is an error, return a placeholder image
    }
};


// ====================== GETTERS USED FOR TESTING ======================
const getQueue = () => {
    return productQueue;
}

const getCache = () => {
    return productImageCache;
}

module.exports = {flushCache, insertProduct, replaceProduct, getProductImage, getQueue, getCache};
