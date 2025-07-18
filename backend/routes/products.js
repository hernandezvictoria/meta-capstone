const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')
const {updateProductsWithScore} = require('./scoring-helper-functions.js');
const {cleanSearchQuery} = require('./search-helper-functions.js');
const prisma = new PrismaClient()
const router = express.Router()

// http://localhost:3000/products
router.get('/products', async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1; // default to page 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10; //default to limit 10 products per page
    const searchTerm = req.query.searchTerm ? req.query.searchTerm : ""; // default to "" if no search term
    const offset = (page - 1) * limit;
    const id = req.session.userId;

    if (!id) {
        return res.status(401).json({ error: "you must be logged in to perform this action" })
    }

    let userInfo;
    // Retrieve the user
    try{
        userInfo = await prisma.user.findUnique({
            where: { id: id },
            include: {
                loved_products: {
                    include: {
                        ingredients: true, // Include ingredients for loved products
                    },
                },
                disliked_products: {
                    include: {
                        ingredients: true
                    }
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "error fetching user" });
    }

    if (!userInfo) {
        return res.status(404).send({ message: "user not found" });
    }

    let productCandidates = [];
    if(searchTerm === ""){ // get all products if no search term
        try {
            productCandidates = await prisma.productInfo.findMany({
                where: {
                    OR : [
                        { skin_type: { hasSome: userInfo.skin_type } },
                        { concerns: { hasSome: userInfo.concerns } }
                    ]
                },
                include: { ingredients: true,
                            loved_by_user: true,
                            disliked_by_user: true },
                take: 200 // limit to 200 products for now (though there are only 70)
            });
            productCandidates = productCandidates.filter((p) => {
                if(!userInfo.disliked_products.some((d) => d.id === p.id)){
                    return p; // filter out products that are disliked by the user
                }
            })

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching products" })
        }
    }
    else{ // filter products based on search term
        //TODO: fix search
        const queryArray = cleanSearchQuery(searchTerm); // split search term into array of words

        try {
            productCandidates = await prisma.productInfo.findMany({
                where: {
                    AND: queryArray.map(q => ({
                        OR: [
                            { brand: { contains: q} },
                            { name: { contains: q} },
                            { product_type: { equals: ProductTypes[q] } },
                            { concerns: { has: q } }, // Use has for exact match in array
                            { skin_type: { has : (SkinTypes[q] ? SkinTypes[q] : null) } } // Use has for exact match in array
                        ]
                    }))},
                    include: { ingredients: true,
                        loved_by_user: true,
                        disliked_by_user: true },
                    take: 200 // limit to 200 products for now (though there are only 70)
            });

            // Remove duplicates based on product ID
            productCandidates = productCandidates.filter((product, index, self) =>
                index === self.findIndex((p) => p.id === product.id)
            );
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching queried products" });
        }
    }
    const users = await prisma.user.findMany();
    let scoredProducts = await updateProductsWithScore(productCandidates, userInfo, users?.length);
    scoredProducts = scoredProducts.sort((a, b) => b.score - a.score).slice(offset, offset + limit);
    res.status(200).json({
        totalProducts: scoredProducts.length,
        products: scoredProducts,
    });
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

router.get('/products/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId);

    try {
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
            include: { ingredients: true,
                loved_by_user: true,
                disliked_by_user: true }
        });

        res.status(200).json(product);

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while fetching product" });
    }
});

// like/unlike products
router.put('/toggle-like/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // Retrieve the current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { loved_products: true } // Include loved products to check if already liked
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // some is used on arrays to test whether at least one elt of the array passes a specified test implemented by a provided function
        const isLiked = user.loved_products.some(p => p.id === productId);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                loved_products: isLiked
                    ? { disconnect: { id: productId } } // Remove the product if already liked
                    : { connect: { id: productId } } // Add the product if not liked
            }
        });

        res.status(200).json({removedLike: isLiked});

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while toggling the like status." });
    }
});

// save/unsave products
router.put('/toggle-save/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId); // Corrected from postId to productId
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // Retrieve the current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { saved_products: true } // Include loved products to check if already liked
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // some is used on arrays to test whether at least one elt of the array passes a specified test implemented by a provided function
        const isSaved = user.saved_products.some(p => p.id === productId);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                saved_products: isSaved
                    ? { disconnect: { id: productId } } // Remove the product if already saved
                    : { connect: { id: productId } } // Add the product if not saved
            }
        });

        res.status(200).json({removedSave: isSaved});

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while toggling the like status." });
    }
});

// dislike products
router.put('/toggle-dislike/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId); // Corrected from postId to productId
    const userId = req.session.userId;


    if (!userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // Retrieve the current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { disliked_products: true } // Include loved products to check if already liked
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // some is used on arrays to test whether at least one elt of the array passes a specified test implemented by a provided function
        const isDisliked = user.disliked_products.some(p => p.id === productId);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                disliked_products: isDisliked
                    ? { disconnect: { id: productId } } // Remove the product if already disliked
                    : { connect: { id: productId } } // Add the product if not disliked
            }
        });

        res.status(200).json({removedDislike: isDisliked});

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while toggling the dislike status." });
    }
});


// get liked and saved status of product
router.get('/get-liked-and-saved-status/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId); // Corrected from postId to productId
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // Retrieve the current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { saved_products: true,
                    loved_products: true }
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // some is used on arrays to test whether at least one elt of the array passes a specified test implemented by a provided function
        const isSaved = user.saved_products.some(p => p.id === productId);
        const isLiked = user.loved_products.some(p => p.id === productId);

        res.status(200).json({isSaved, isLiked});

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while fetching the liked and saved status" });
    }
});

router.post('/log-interaction/:productId', async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;
    const { interactionType } = req.body

    if (!userId) {
        return res.status(401).json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Create a new interaction in the database
        const newInteraction = await prisma.UserProductInteraction.create({
            data: {
                product_id: productId,
                user_id: userId,
                interaction_time: new Date(),
                interaction_type: interactionType
            }
        })
        res.status(201).json({ message: "interaction successfully logged"})
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "something went wrong while logging interaction" })
    }

});
module.exports = router;
