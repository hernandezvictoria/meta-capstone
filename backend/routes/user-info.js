const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const {computeProductScore} = require('./helper-functions.js');
const prisma = new PrismaClient()
const router = express.Router()


// http://localhost:3000/change-skin-type
router.put('/change-skin-type', async (req, res) => {
    const skin_type = req.body

    const id = req.session.userId;
    if (!id) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    try {
        // Retrieve the user
        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // update the user's skin type
        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                skin_type: skin_type
            }
        });
        res.status(200).json(updatedUser);

    } catch (error) {
        res.status(500).send({ message: "an error occurred while updating the user's skin type" });
    }
})

router.get('/user-info', async(req, res) => {
    const id = req.session.userId;

    if (!id) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    // Retrieve the user
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            saved_products: {
                include: {
                    ingredients: true,
                    loved_by_user: true,
                    disliked_by_user: true
                },
            },
            loved_products: {
                include: {
                    ingredients: true,
                    loved_by_user: true,
                    disliked_by_user: true
                },
            },
            disliked_products: {
                include: {
                    ingredients: true,
                    loved_by_user: true,
                    disliked_by_user: true
                }
            }
        }
    });

    if (!user) {
        return res.status(404).send({ message: "user not found" });
    }

    console.log(user.loved_products)
    console.log(user.loved_products.map((product) => {
        return {
            id: product.id,
            brand: product.brand,
            name: product.name,
            image: product.image,
            product_type: product.product_type,
            price: product.price,
            concerns: product.concerns,
            skin_type: product.skin_type,
            ingredients: product.ingredients,
            loved_by_user: product.loved_by_user,
            disliked_by_user: product.disliked_by_user,
            // score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns)
}}));

    // do not include user id or user hashed password
    res.status(200).json({
        username: user.username,
        concerns: user.concerns,
        skin_type: user.skin_type,
        loved_products: user.loved_products.map((product) => {
            return {
                id: product.id,
                brand: product.brand,
                name: product.name,
                image: product.image,
                product_type: product.product_type,
                price: product.price,
                concerns: product.concerns,
                skin_type: product.skin_type,
                ingredients: product.ingredients,
                loved_by_user: product.loved_by_user,
                disliked_by_user: product.disliked_by_user,
                score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns)
            };
        }),
        saved_products: user.saved_products.map((product) => {
            return {
                id: product.id,
                brand: product.brand,
                name: product.name,
                image: product.image,
                product_type: product.product_type,
                price: product.price,
                concerns: product.concerns,
                skin_type: product.skin_type,
                ingredients: product.ingredients,
                loved_by_user: product.loved_by_user,
                disliked_by_user: product.disliked_by_user,
                score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns)};
        }),
        disliked_products: user.disliked_products.map((product) => {
            return {
                id: product.id,
                brand: product.brand,
                name: product.name,
                image: product.image,
                product_type: product.product_type,
                price: product.price,
                concerns: product.concerns,
                skin_type: product.skin_type,
                ingredients: product.ingredients,
                loved_by_user: product.loved_by_user,
                disliked_by_user: product.disliked_by_user,
                score: computeProductScore(product, user.loved_products, user.disliked_products, user.skin_type, user.concerns)};
        })
    })
})

// http://localhost:3000/change-skin-concerns
router.put('/change-skin-concerns', async (req, res) => {
    const concerns = req.body

    const id = req.session.userId;
    if (!id) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    try {
        // Retrieve the user
        const user = await prisma.user.findUnique({
            where: { id: id }
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // update the user's skin concern
        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                concerns: concerns
            }
        });
        res.status(200).json(updatedUser);

    } catch (error) {
        res.status(500).send({ message: "an error occurred while updating the user's skin concern" });
    }
})

// router.get('/user-liked-saved-disliked', async (req, res) => {
//     const userId = req.session.userId;

//     if (!userId) {
//         return res.status(401).json({ error: "you must be logged in to perform this action" });
//     }

//     try{
//         // Retrieve the current user
//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             include: {
//                 saved_products: {
//                     include: {
//                         ingredients: true
//                     },
//                 },
//                 loved_products: {
//                     include: {
//                         ingredients: true
//                     },
//                 },
//                 disliked_products: {
//                     include: {
//                         ingredients: true
//                     }
//                 }}
//         });
//         res.status(200).json({
//             saved_products: user.saved_products,
//             loved_products: user.loved_products,
//             disliked_products: user.disliked_products});
//     } catch(error){
//         console.error(error);
//         res.status(500).send({ message: "An error occurred while fetching user's liked, saved, and disliked products" });
//     }
// })

module.exports = router;
