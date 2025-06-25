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


module.exports = router;
