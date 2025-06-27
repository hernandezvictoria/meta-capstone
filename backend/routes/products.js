const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const prisma = new PrismaClient()
const router = express.Router()

// http://localhost:3000/products
router.get('/products', async (req, res) => {

    //TODO: PAGINATION
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

// router.get('/search/:query', async (req, res) => {
//     const query = req.params.query;
//     const queryArray = query.split(" ");
//     let foundProducts = [];

//     for (q of queryArray){
//         try {
//             const tempProducts = await prisma.productInfo.findMany({
//                 where: {
//                     OR: [{brand: {contains: q, mode: 'insensitive'}},
//                         {name: {contains: q, mode: 'insensitive'}},
//                         {product_type: {contains: q, mode: 'insensitive'}},
//                         {concerns: {contains: q, mode: 'insensitive'}},
//                         {skin_type: {contains: q, mode: 'insensitive'}}]}
//             });
//             foundProducts = [...foundProducts, ...tempProducts]
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: "error fetching queried products" })
//         }
//     }

//     const uniqueFoundProducts = foundProducts.filter((product, index, self) =>
//         index === self.findIndex((p) => p.id === product.id)
//     );

//     res.status(200).json(uniqueFoundProducts);
// })

// router.get('/search/:query', async (req, res) => {
//     const query = req.params.query;
//     const queryArray = query.split(" ");
//     let foundProducts = [];

//     try {
//         foundProducts = await prisma.productInfo.findMany({
//             where: {
//                 // have to use and so that every term in the search query must match at least one of the conditions in the or
//                 // can get rid of and to have more general search results, will think about with search algorithm
//                 AND: queryArray.map(q => ({
//                     OR: [
//                         { brand: { contains: q, mode: 'insensitive' } },
//                         { name: { contains: q, mode: 'insensitive' } },
//                         { product_type: { contains: q, mode: 'insensitive' } },
//                         { concerns: { contains: q, mode: 'insensitive' } },
//                         { skin_type: { contains: q, mode: 'insensitive' } }
//                     ]
//                 }))
//             }
//         });

//         // remove duplicates based on product ID
//         const uniqueFoundProducts = foundProducts.filter((product, index, self) =>
//             index === self.findIndex((p) => p.id === product.id)
//         );

//         res.status(200).json(uniqueFoundProducts);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "error fetching queried products" });
//     }
// });

router.get('/search/:query', async (req, res) => {
    const query = req.params.query;
    const queryArray = query.split(" ");
    let foundProducts = [];

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
