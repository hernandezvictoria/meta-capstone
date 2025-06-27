const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const prisma = new PrismaClient()
const router = express.Router()

// http://localhost:3000/products
router.get('/products', async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1; // default to page 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10; //default to limit 10 products per page
    const offset = (page - 1) * limit;

    if (!req.session.userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    try {
        const products = await prisma.productInfo.findMany({
            skip: offset,
            take: limit
        });
        //RES NOW HAS TWO ELEMENTS IN JSON
        res.status(200).json({
            totalProducts: products.length,
            products});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "error fetching user products" })
    }

});

// http://localhost:3000/change-product-image
router.put('/change-product-image/:productId', async (req, res) => {
    const {image} = req.body
    const id = parseInt(req.params.productId)

    try {
        // Retrieve the product
        const product = await prisma.productInfo.findUnique({
            where: { id: id }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // update the product's image
        const updatedProduct = await prisma.productInfo.update({
            where: { id: id },
            data: {
                image: image
            }
        });
        res.status(200).json(updatedProduct);

    } catch (error) {
        res.status(500).send({ message: "an error occurred while updating the product's image" });
    }
})

// http://localhost:3000/search/:query
router.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    const queryArray = query.split(" ");
    let foundProducts = [];

    if (!req.session.userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    try {
        foundProducts = await prisma.productInfo.findMany({
            where: {
                AND: queryArray.map(q => ({
                    OR: [
                        { brand: { contains: q, mode: 'insensitive' } },
                        { name: { contains: q, mode: 'insensitive' } },
                        { product_type: { equals: ProductTypes[q.toLowerCase()] } },
                        { concerns: { has: q } }, // Use has for exact match in array
                        { skin_type: { has: q } } // Use has for exact match in array

                        //NEED HELP DEBUGGING THIS, CANNOT GET PARTIAL MATCH
                        // { concerns: { some: { contains: q, mode: 'insensitive' } } }, // Use some with contains for partial match
                        // { skin_type: { some: { contains: q, mode: 'insensitive' } } }  // Use some with contains for partial match
                        // {concerns : {some: (concern) => concern.includes(q)}},
                        // {skin_type : {some: (type) => type.includes(q)}}
                    ]
                }))
            }
        });

        // Remove duplicates based on product ID
        const uniqueFoundProducts = foundProducts.filter((product, index, self) =>
            index === self.findIndex((p) => p.id === product.id)
        );

        res.status(200).json(uniqueFoundProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "error fetching queried products" });
    }
});

module.exports = router;
