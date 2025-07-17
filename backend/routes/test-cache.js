const {flushCache, insertProduct, replaceProduct, getProductImage, getQueue, getCache}= require('./local-cache.js');
const wait = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const {fetchImageFromAPI, fetchImageFromDB}= require('./server-cache.js');

const testQueueOrdering = async () => {
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);
    await insertProduct(55); // 3 x open modal #1
    await wait(1000);
    await insertProduct(6); // like, remove like, dislike #4 (tied with 5)
    await wait(1000);
    await insertProduct(5); // none #3 (tied with 6)

    console.log(getCache());
    console.log(getQueue());
    console.log("queue size: " + getQueue().size());
    const queue = getQueue();
    console.log("queue size: " + queue.size());
    for (let i = 0; i < 4; i++) {
        console.log("iteration")
        console.log(queue.dequeue());
        console.log("size after dequeue: " + queue.size());
    }
}

const testReplacement = () => {
    insertProduct(1);
    insertProduct(3);
    insertProduct(4);
    insertProduct(2);
    console.log(getCache());
    console.log(getQueue());

    replaceProduct(3);

    console.log(getCache());
    console.log(getQueue());
}

const testFlush = async () => {
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);
    await insertProduct(55); // 3 x open modal #1
    await wait(1000);
    await insertProduct(6); // like, remove like, dislike #4 (tied with 5)
    await wait(1000);
    await insertProduct(5); // none #3 (tied with 6)

    console.log(getCache());
    console.log(getQueue());

    flushCache();

    console.log(getCache());
    console.log(getQueue());
}

const testFlushAfterExpire = async () => {
    // even though 55 has higher priority, it will be flushed first because it's expired
    await insertProduct(55); // 3 x open modal #1
    await wait(2000);
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);

    console.log(getCache());
    console.log(getQueue());

    flushCache();

    console.log(getCache());
    console.log(getQueue());
}

const testGetImage = async () => {
    // even though 55 has higher priority, it will be flushed first because it's expired
    await insertProduct(55); // 3 x open modal #1
    await wait(2000);
    await insertProduct(53); // save, like, open modal #2
    await wait(1000);

    console.log(getQueue().toArray());
    getProductImage(1, 53);
    console.log(getQueue().toArray());
}

const testAPICall = async () => {
    await fetchImageFromAPI(1);
    console.log("finished executing fetchImageFromAPI");
    // checked in prisma that the image was inserted and fetch time was updated
}

const testDBCall = async () => {
    const image = await fetchImageFromDB(3);
    console.log("finished executing fetchImageFromDB");
    console.log("image url: " + image);
    // test cases:
    // 1. image is in DB and not expired, fetched from DB
    // 2. image is in DB and expired, fetched from API
    // 3. image is not in DB, fetched from API
    // 4. image is in DB but has no timestamp, fetched from API
}

const testTTL = async () => {
    //changed TTL to 1 second and verified that it is refetcheda
    const image = await fetchImageFromDB(3);
    console.log("finished executing fetchImageFromDB");
    console.log("image url: " + image);
}

testDBCall();
