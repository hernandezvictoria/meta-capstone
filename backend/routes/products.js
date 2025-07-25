const express = require("express");
const { PrismaClient } = require("../generated/prisma/index.js");
const { SkinTypes, ProductTypes } = require("../../common-enums.js");
const {
    updateProductsWithScore,
} = require("../helpers/scoring-helper-functions.js");
const { cleanSearchQuery } = require("../helpers/search-helper-functions.js");
const prisma = new PrismaClient();
const router = express.Router();

const PRODUCT_CANDIDATE_LIMIT = 200; // maximum number of products to calculate scores for

/**
 * Retrieve the current user's information by their ID.
 * @param {number} id - User ID.
 * @returns {object} - User object containing current user's information.
 */
const getCurrentUser = async (id) => {
    return await prisma.user.findUnique({
        where: { id: id },
        include: {
            loved_products: {
                include: {
                    ingredients: true,
                },
            },
            saved_products: {
                include: {
                    ingredients: true,
                },
            },
            disliked_products: {
                include: {
                    ingredients: true,
                },
            },
        },
    });
};

/**
 * Retrieve all products to display on the home page.
 * Filter out products that the user has already disliked and products that don't match the user's skin type or concerns.
 * @param {object} userInfo - User object containing current user's information.
 * @returns - Array of product objects to display on the home page.
 */
const getAllProducts = async (userInfo) => {
    const dislikedProductIds = userInfo.disliked_products.map((p) => p.id);
    return await prisma.productInfo.findMany({
        where: {
            OR: [
                { skin_type: { hasSome: userInfo.skin_type } },
                { concerns: { hasSome: userInfo.concerns } },
            ],
            AND: [{ id: { notIn: dislikedProductIds } }],
        },
        include: {
            ingredients: true,
            loved_by_user: true,
            disliked_by_user: true,
        },
        take: PRODUCT_CANDIDATE_LIMIT,
    });
};

/**
 * Retrieve products matching the query to display on the home page.
 * @param {string} searchTerm - Search term to filter products by.
 * @returns - Array of product objects matching the query.
 */
const getSearchedProducts = async (searchTerm) => {
    const queryArray = cleanSearchQuery(searchTerm); // tokenize search term
    let productCandidates = await prisma.productInfo.findMany({
        where: {
            AND: queryArray.map((q) => ({
                OR: [
                    { brand: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                    {
                        product_type: {
                            equals: ProductTypes[q.toUpperCase()],
                        },
                    },
                    { concerns: { has: q } },
                    {
                        skin_type: {
                            has: SkinTypes[q.toUpperCase()]
                                ? SkinTypes[q.toUpperCase()]
                                : null,
                        },
                    },
                ],
            })),
        },
        include: {
            ingredients: true,
            loved_by_user: true,
            disliked_by_user: true,
        },
        take: PRODUCT_CANDIDATE_LIMIT,
    });
    // Remove duplicates
    productCandidates = productCandidates.filter(
        (product, index, self) =>
            index === self.findIndex((p) => p.id === product.id)
    );
    return productCandidates;
};

/**
 * Retrieve products to display on the home page.
 * Handle case of if user is searching.
 * Handles pagination and product recommendations.
 */
router.get("/products", async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1; // default to page 1
    const limit = req.query.limit ? parseInt(req.query.limit) : 10; //default to limit 10 products per page
    const searchTerm = req.query.searchTerm ? req.query.searchTerm : ""; // default to "" if no search term
    const offset = (page - 1) * limit;
    const id = req.session.userId;

    if (!id) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    let userInfo;
    try {
        userInfo = await getCurrentUser(id);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "error fetching user" });
    }

    if (!userInfo) {
        return res.status(404).send({ message: "user not found" });
    }

    let productCandidates = [];
    if (searchTerm === "") {
        try {
            productCandidates = await getAllProducts(userInfo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching products" });
        }
    } else {
        try {
            productCandidates = await getSearchedProducts(searchTerm);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "error fetching queried products" });
        }
    }

    const users = await prisma.user.findMany();
    let scoredProducts = await updateProductsWithScore(
        productCandidates,
        userInfo,
        users?.length
    );
    scoredProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(offset, offset + limit);

    res.status(200).json({
        totalProducts: scoredProducts.length,
        products: scoredProducts,
    });
});

router.put("/change-product-image/:productId", async (req, res) => {
    const { image } = req.body;
    const id = parseInt(req.params.productId);

    try {
        const product = await prisma.productInfo.findUnique({
            where: { id: id },
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        const updatedProduct = await prisma.productInfo.update({
            where: { id: id },
            data: {
                image: image,
            },
        });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).send({
            message: "an error occurred while updating the product's image",
        });
    }
});

/**
 * Get a specific product by its ID.
 */
router.get("/products/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);

    try {
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
            include: {
                ingredients: true,
                loved_by_user: true,
                disliked_by_user: true,
            },
        });

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while fetching product",
        });
    }
});

/**
 * Like/unlike a product for a user.
 */
router.put("/toggle-like/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        const user = await getCurrentUser(userId);

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const isLiked = user.loved_products.some((p) => p.id === productId);

        await prisma.user.update({
            where: { id: userId },
            data: {
                loved_products: isLiked
                    ? { disconnect: { id: productId } } // Remove the product if already liked
                    : { connect: { id: productId } }, // Add the product if not liked
            },
        });

        res.status(200).json({ removedLike: isLiked });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while toggling the like status.",
        });
    }
});

/**
 * Save/unsave a product for a user.
 */
router.put("/toggle-save/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        const user = await getCurrentUser(userId);

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const isSaved = user.saved_products.some((p) => p.id === productId);

        await prisma.user.update({
            where: { id: userId },
            data: {
                saved_products: isSaved
                    ? { disconnect: { id: productId } } // Remove the product if already saved
                    : { connect: { id: productId } }, // Add the product if not saved
            },
        });

        res.status(200).json({ removedSave: isSaved });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while toggling the like status.",
        });
    }
});

/**
 * Dislike/remove dislike a product for a user.
 */
router.put("/toggle-dislike/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        const user = await getCurrentUser(userId);

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const isDisliked = user.disliked_products.some(
            (p) => p.id === productId
        );

        await prisma.user.update({
            where: { id: userId },
            data: {
                disliked_products: isDisliked
                    ? { disconnect: { id: productId } } // Remove the product if already disliked
                    : { connect: { id: productId } }, // Add the product if not disliked
            },
        });

        res.status(200).json({ removedDislike: isDisliked });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while toggling the dislike status.",
        });
    }
});

/**
 * Log user clicks in UserProductInteraction table.
 */
router.post("/log-interaction/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const userId = req.session.userId;
    const { interactionType } = req.body;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        // Create a new interaction in the database
        await prisma.userProductInteraction.create({
            data: {
                product_id: productId,
                user_id: userId,
                interaction_time: new Date(),
                interaction_type: interactionType,
            },
        });
        res.status(201).json({ message: "interaction successfully logged" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "something went wrong while logging interaction",
        });
    }
});

module.exports = router;
