const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')

const prisma = new PrismaClient()
const router = express.Router()

// http://localhost:3000/products
router.get('/products', async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }



    try {
        const allProducts = await prisma.productInfo.findMany();
        res.status(200).json(allProducts);
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


module.exports = router;
