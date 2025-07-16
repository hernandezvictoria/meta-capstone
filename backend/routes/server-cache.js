const { PrismaClient } = require('../generated/prisma/index.js')
const prisma = new PrismaClient()
const express = require('express')
const router = express.Router()

const placeholderImage = "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg";

const fetchImageFromDB = (productId) => {
    // TODO: implement this
    // fetches data from DB, if not in DB or expired, fetches from API
    return "image.com/url"
};

const fetchImageFromAPI = async (productId) => {
    const productInfo = await prisma.productInfo.findUnique({
        where: {id: productId}
    })

    if(!productInfo) {
        throw new Error("no product info in DB");
    }

    const name = productInfo.name;
    const brand = productInfo.brand;

    const url = `https://real-time-sephora-api.p.rapidapi.com/search-by-keyword?sortBy=BEST_SELLING&keyword=${name}&brandFilter=${brand}`;
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.API_KEY,
          'x-rapidapi-host': 'real-time-sephora-api.p.rapidapi.com'
        }
      };

    try {
        const response = await fetch(url, options);
        const res = await response.json();
        const products_list = res.data.products;
        if (products_list.length === 0) {
            throw new Error("no products in products list"); // throw error to be caught, sets display image to placeholder
        }
        const fetchedImage = products_list[0].heroImage;
        await updateImageInDb(productId, fetchedImage);
    } catch (error) {
        await updateImageInDb(productId, placeholderImage);
    }
}

const updateImageInDb = async (id, image) => {
    try {
        // update the product's image
        await prisma.productInfo.update({
            where: { id: id },
            data: {
                image: image,
                image_fetch_time: new Date()
            }
        });

    } catch (error) {
        throw new Error("an error occurred while updating the product's image");
    }
}

module.exports = {fetchImageFromDB};
module.exports = {fetchImageFromDB, fetchImageFromAPI};
