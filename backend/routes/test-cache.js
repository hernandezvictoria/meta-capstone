const {flushCache, insertProduct, replaceProduct, getProductImage, getQueue, getCache}= require('./local-cache.js');
const wait = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

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


testGetImage();
