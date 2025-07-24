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
const { ProductTypes } = require("../enums.js");

const SUGGESTED_PRODUCT_LIMIT = 50; // maximum number of suggested products to calculate scores for

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
        // Retrieve the current product
        const product = await prisma.productInfo.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).send({ message: "product not found" });
        }

        // Retrieve the current user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { skincare_routine: true },
        });

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        // some is used on arrays to test whether at least one elt of the array passes a specified test implemented by a provided function
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
        // Retrieve the current user
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

        // compute score for current skincare routine
        const computedScore = await computeSkincareRoutineScore(
            user.skincare_routine,
            user
        );

        // get user's skincare routine with product scores
        const users = await prisma.user.findMany();
        const numUsers = users?.length;
        const skincareRoutine = await updateProductsWithScore(
            user.skincare_routine,
            user,
            numUsers
        );

        // get suggested products to fill gaps in the routine
        const suggestedProducts = await getSuggestedProducts(
            user,
            user.skincare_routine,
            numUsers
        );

        res.status(200).json({
            currentSkincareRoutine: skincareRoutine,
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

    // if routine is missing cleanser, moisturizer, or sunscreen
    if (missingProductTypes.length > 0) {
        suggestedProducts = await prisma.productInfo.findMany({
            where: {
                // filter for products types that are not already in routine
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

    // if routine is complete or no products found for missing product types
    if (suggestedProducts.length === 0) {
        suggestedProducts = await prisma.productInfo.findMany({
            where: {
                OR: [
                    // filter for products that match at least one of the user's skin needs
                    { skin_type: { hasSome: user.skin_type } },
                    { concerns: { hasSome: user.concerns } },
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

    // filter out products that are already in routine or disliked by the user
    suggestedProducts = suggestedProducts.filter((p) => {
        if (
            !user.disliked_products.some((d) => d.id === p.id) ||
            !parsedSkincareRoutine.productIds.includes(p.id)
        ) {
            return p;
        }
    });

    // compute scores for suggested products
    let scoredProducts = await updateProductsWithSkincareRoutineScore(
        suggestedProducts,
        user,
        numUsers
    );

    // sort products by skincare routine score
    return scoredProducts.sort(
        (a, b) => b.skincareRoutineScore - a.skincareRoutineScore
    );
};

module.exports = router;
