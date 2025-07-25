const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const {
    updateProductsWithScore,
} = require("../helpers/scoring-helper-functions.js");
const {
    computeSkincareRoutineScore,
    computeMissingProductsMultiplier,
    parseSkincareRoutine,
    updateProductsWithSkincareRoutineScore,
} = require("../helpers/skincare-routine.js");
const { ProductTypes } = require('../../common-enums.js');

const SUGGESTED_PRODUCT_LIMIT = 30; // maximum number of suggested products to calculate scores for

/**
 * Add/remove product to user's skincare routine.
 */
router.put("/toggle-add-to-routine/:productId", async (req, res) => {
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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { skincare_routine: true },
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const isInRoutine = user.skincare_routine.some(
            (p) => p.id === productId
        );

        await prisma.user.update({
            where: { id: userId },
            data: {
                skincare_routine: isInRoutine
                    ? { disconnect: { id: productId } } // Remove the product if already in routine
                    : { connect: { id: productId } }, // Add the product if not already in routine
            },
        });

        res.status(200).json({ removedAdd: isInRoutine });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message:
                "An error occurred while toggling the add to routine status.",
        });
    }
});

/**
 * Returns user's routine, score, message, and suggested products.
 */
router.get("/user-routine-and-recommendations", async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                loved_products: {
                    include: {
                        ingredients: true,
                        loved_by_user: true,
                        disliked_by_user: true,
                    },
                },
                disliked_products: {
                    include: {
                        ingredients: true,
                        loved_by_user: true,
                        disliked_by_user: true,
                    },
                },
                skincare_routine: {
                    include: {
                        ingredients: true,
                        loved_by_user: true,
                        disliked_by_user: true,
                    },
                },
            },
        });

        const computedScore = await computeSkincareRoutineScore(
            user.skincare_routine,
            user
        );

        const users = await prisma.user.findMany();
        const numUsers = users?.length;
        const currentSkincareRoutineWithScores = await updateProductsWithScore(
            user.skincare_routine,
            user,
            numUsers
        );

        const suggestedProducts = await getSuggestedProducts(
            user,
            user.skincare_routine,
            numUsers
        );

        res.status(200).json({
            currentSkincareRoutine: currentSkincareRoutineWithScores,
            currentSkincareRoutineScore: computedScore.score,
            message: computedScore.message,
            suggestedProducts: suggestedProducts,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while fetching user's skincare routine",
        });
    }
});

/**
 * Helper function to get suggested products to fill gaps in the routine.
 * @param {object} user - Current user to suggest products for.
 * @param {list} skincareRoutine - Current skincare routine to suggest products for.
 * @returns {list} - List of suggested products in order of skincare routine score.
 */
const getSuggestedProducts = async (user, skincareRoutine, numUsers) => {
    const parsedSkincareRoutine = parseSkincareRoutine(skincareRoutine);

    // see if skincare routine is missing any core products (cleanser, moisturizer, or sunscreen)
    const missingProducts = computeMissingProductsMultiplier(
        parsedSkincareRoutine.productTypesSet,
        skincareRoutine,
        user.id
    );
    const missingProductTypes = [];
    missingProducts.hasSunscreen
        ? null
        : missingProductTypes.push(ProductTypes.SUNSCREEN);
    missingProducts.hasMoisturizer
        ? null
        : missingProductTypes.push(ProductTypes.MOISTURIZER);
    missingProducts.hasCleanser
        ? null
        : missingProductTypes.push(ProductTypes.CLEANSER);

    let suggestedProducts = [];

    // if routine is missing cleanser, moisturizer, or sunscreen, only recommend those
    if (missingProductTypes.length > 0) {
        suggestedProducts = await prisma.productInfo.findMany({
            where: {
                product_type: { in: missingProductTypes },
            },
            include: {
                ingredients: true,
                loved_by_user: true,
                disliked_by_user: true,
            },
            take: SUGGESTED_PRODUCT_LIMIT,
        });
    }

    const dislikedProductIds = user.disliked_products.map((p) => p.id);

    // if routine is complete or no products found for missing product types
    if (suggestedProducts.length === 0) {
        suggestedProducts = await prisma.productInfo.findMany({
            where: {
                AND: [
                    // exclude products and product types already in routine or disliked by user
                    { id: { notIn: parsedSkincareRoutine.productIds } },
                    { id: { notIn: dislikedProductIds } },
                    {
                        product_type: {
                            notIn: Array.from(
                                parsedSkincareRoutine.productTypesSet
                            ),
                        },
                    },
                ],
            },
            include: {
                ingredients: true,
                loved_by_user: true,
                disliked_by_user: true,
            },
            take: SUGGESTED_PRODUCT_LIMIT,
        });
    }

    let scoredProducts = await updateProductsWithSkincareRoutineScore(
        suggestedProducts,
        user,
        numUsers
    );

    return scoredProducts.sort(
        (a, b) => b.skincareRoutineScore - a.skincareRoutineScore
    );
};

module.exports = router;
