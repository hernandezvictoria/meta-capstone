const {
    getUserActivityScore,
    createQueueAndCache,
    computeInitialPriority,
    setUserActivity,
    flushCache,
    insertProduct,
    replaceProduct,
    getProductImage,
    getQueue,
    getCache,
} = require("../helpers/server-cache.js");
const { fetchImageFromAPI, fetchImageFromDB } =
    require("../helpers/db-cache.js").default;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // timeout to ensure cache order is correct

test("test priority order", async () => {
    createQueueAndCache();
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);
    await insertProduct(55); // 3 x open modal #1
    await wait(1000);
    await insertProduct(6); // like, remove like, dislike #4 (tied with 5)
    await wait(1000);
    await insertProduct(5); // none #3 (tied with 6)

    const cache = getCache();
    const queue = getQueue();
    expect(cache.size).toBe(4);
    expect(queue.size()).toBe(4);
    expect(queue.dequeue().productId).toBe(55);
    expect(queue.dequeue().productId).toBe(53);
    expect(queue.dequeue().productId).toBe(5);
    expect(queue.dequeue().productId).toBe(6);
});

test("test product replacement", async () => {
    createQueueAndCache();
    insertProduct(1);
    await wait(1000);
    insertProduct(3);
    await wait(1000);
    insertProduct(4);
    await wait(1000);
    insertProduct(2);
    let cache = getCache();
    expect(queue.dequeue().productId).toBe(2);
    expect(queue.dequeue().productId).toBe(4);
    expect(queue.dequeue().productId).toBe(3);
    expect(queue.dequeue().productId).toBe(1);

    insertProduct(1);
    await wait(1000);
    insertProduct(3);
    await wait(1000);
    insertProduct(4);
    await wait(1000);
    insertProduct(2);
    await wait(1000);
    replaceProduct(3);
    cache = getCache();
    expect(queue.dequeue().productId).toBe(3);
    expect(queue.dequeue().productId).toBe(2);
    expect(queue.dequeue().productId).toBe(4);
    expect(queue.dequeue().productId).toBe(1);
});

test("test flush cache", async () => {
    createQueueAndCache();
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);
    await insertProduct(55); // 3 x open modal #1
    await wait(1000);
    await insertProduct(6); // like, remove like, dislike #4 (tied with 5)
    await wait(1000);
    await insertProduct(5); // none #3 (tied with 6)

    let cache = getCache();
    let queue = getQueue();
    expect(cache.size).toBe(4);
    expect(queue.size()).toBe(4);

    flushCache(); // set flush size to 2

    cache = getCache();
    queue = getQueue();
    expect(cache.size).toBe(2);
    expect(queue.size()).toBe(2);
    expect(queue.dequeue().productId).toBe(55);
    expect(queue.dequeue().productId).toBe(53);
});

test("test flush after expire", async () => {
    // manually set TTL to 2000 ms and flush size to 1
    createQueueAndCache();
    // even though 55 has higher priority, it will be flushed first because it's expired
    await insertProduct(55); // 3 x open modal #1
    await wait(2000);
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);

    let cache = getCache();
    let queue = getQueue();
    expect(cache.size).toBe(2);
    expect(queue.size()).toBe(2);
    expect(queue.dequeue().productId).toBe(55);
    expect(queue.dequeue().productId).toBe(53);

    // repest with flushed cache
    createQueueAndCache();
    // even though 55 has higher priority, it will be flushed first because it's expired
    await insertProduct(55); // 3 x open modal #1
    await wait(2000);
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);
    flushCache();

    cache = getCache();
    queue = getQueue();
    expect(cache.size).toBe(1);
    expect(queue.size()).toBe(1);
    expect(queue.dequeue().productId).toBe(53);
});

test("test getProductImage", async () => {
    createQueueAndCache();
    await insertProduct(55);
    await wait(1000);
    await insertProduct(3);
    await wait(1000);

    // test cases (manually do this):
    // 1. image is in cache and not expired, fetched from cache
    // 2. image is in cache and expired, fetched from DB
    // 3. image is not in cache, fetched from cache
    expect(getProductImage(1, 55)).toBe(
        "https://www.sephora.com/productimages/sku/s2031441-main-zoom.jpg?imwidth=270"
    );
    expect(getProductImage(1, 3)).toBe(
        "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg"
    );
    expect(getProductImage(1, 1)).toBe(
        "https://www.sephora.com/productimages/sku/s1863588-main-zoom.jpg?imwidth=270&pb=clean-at-sephora"
    );
    expect(getProductImage(1, 55)).toBe(
        "https://www.sephora.com/productimages/sku/s2031441-main-zoom.jpg?imwidth=270"
    );
});

test("test DB call", async () => {
    // test cases (manually removing from DB):
    // 1. image is in DB and not expired, fetched from DB
    // 2. image is in DB and expired, fetched from API
    // 3. image is not in DB, fetched from API
    // 4. image is in DB but has no timestamp, fetched from API
    expect(fetchImageFromDB(3)).toBe(
        "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg"
    );
});

test("test time to live", async () => {
    //changed TTL to 1 second and verified that it is refetched from API
    expect(fetchImageFromDB(3)).toBe(
        "https://www.sephora.com/productimages/sku/s2031391-main-zoom.jpg?imwidth=270"
    );
});

test("test user activity scores", async () => {
    setUserActivity();
    const userToActivityScore = getUserActivityScore();
    expect(userToActivityScore.get("open_modal")).toBe(1);
    expect(userToActivityScore.get("save")).toBe(1.6);
    expect(userToActivityScore.get("like")).toBe(1.6);
    expect(userToActivityScore.get("dislike")).toBe(0.6);
    expect(userToActivityScore.get("remove_dislike")).toBe(0.6);
    expect(userToActivityScore.get("remove_like")).toBe(0.6);
});
