const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();

const placeholderImage =
    "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";
const TTL = 1000 * 60 * 60 * 24 * 7; // time to live for each product in DB, 1 week for now

let actualAPICalls = 0;
let DBHits = 0;

/**
 * Fetches the image URL from the DB if it exists and is not expired, otherwise fetches it from the API.
 * @param {number} productId - ID of the product whose image to fetch.
 * @returns {string} - The image URL.
 */
const fetchImageFromDB = async (productId) => {
    const productInfo = await prisma.productInfo.findUnique({
        where: { id: productId },
    });

    if (!productInfo) {
        throw new Error("no product info in DB");
    } else {
        if (productInfo.image) {
            // if image is in the DB
            // if image fetch time is not set or if image is expired
            if (
                !productInfo.image_fetch_time ||
                Date.now() - productInfo.image_fetch_time.getTime() >= TTL
            ) {
                actualAPICalls++;
                const image = await fetchImageFromAPI(
                    productId,
                    productInfo.name,
                    productInfo.brand
                );
                return image;
            } else {
                DBHits++;
                return productInfo.image; // return the image from the DB
            }
        } else {
            // if image is not in the DB
            actualAPICalls++;
            const image = await fetchImageFromAPI(
                productId,
                productInfo.name,
                productInfo.brand
            );
            return image;
        }
    }
};

/**
 * Fetches the image URL from the API.
 * @param {number} productId - ID of the product whose image to fetch.
 * @param {string} name - Name of the product whose image to fetch.
 * @param {string} brand - Brand of the product whose image to fetch.
 * @returns
 */
const fetchImageFromAPI = async (productId, name, brand) => {
    const url = `https://real-time-sephora-api.p.rapidapi.com/search-by-keyword?sortBy=BEST_SELLING&keyword=${name}&brandFilter=${brand}`;
    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": process.env.API_KEY,
            "x-rapidapi-host": "real-time-sephora-api.p.rapidapi.com",
        },
    };

    try {
        const response = await fetch(url, options);
        const res = await response.json();
        const products_list = res.data.products;
        if (products_list.length === 0) {
            throw new Error("no products in products list");
        }
        const fetchedImage = products_list[0].heroImage;
        await updateImageInDb(productId, fetchedImage);
        return fetchedImage;
    } catch (error) {
        await updateImageInDb(productId, placeholderImage);
        return placeholderImage;
    }
};

/**
 * Updates the image in the DB based on API call result.
 * @param {number} id - ID of the product whose image to update.
 * @param {string} image - Updated image URL of product.
 */
const updateImageInDb = async (id, image) => {
    try {
        // update the product's image
        await prisma.productInfo.update({
            where: { id: id },
            data: {
                image: image,
                image_fetch_time: new Date(),
            },
        });
    } catch (error) {
        throw new Error("an error occurred while updating the product's image");
    }
};

const resetCounters = () => {
    actualAPICalls = 0;
    DBHits = 0;
};

const getActualAPICalls = () => actualAPICalls;
const getDBHits = () => DBHits;

module.exports = {
    fetchImageFromDB,
    resetCounters,
    getActualAPICalls,
    getDBHits,
};
