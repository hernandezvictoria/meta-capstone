const express = require("express");
const { PrismaClient } = require("../generated/prisma/index.js");
const {
    updateProductsWithScore,
} = require("../helpers/scoring-helper-functions.js");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * Retrieves the current user from the database.
 * @param {number} id - The id of the user to retrieve.
 * @returns {object} - The user object.
 */
const getCurrentUser = async (id) => {
    return await prisma.user.findUnique({
        where: { id: id },
    });
};

/**
 * Retrieves the current user and their products from the database.
 * @param {number} id - The id of the user to retrieve.
 * @returns {object} - The user object.
 */
const getUserAndProducts = async (id) => {
    return await prisma.user.findUnique({
        where: { id: id },
        include: {
            saved_products: {
                include: {
                    ingredients: true,
                    loved_by_user: true,
                    disliked_by_user: true,
                },
            },
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
};

router.put("/change-skin-type", async (req, res) => {
    const skin_type = req.body;

    const id = req.session.userId;
    if (!id) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const user = await getCurrentUser(id);

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                skin_type: skin_type,
            },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).send({
            message: "an error occurred while updating the user's skin type",
        });
    }
});

router.get("/user-info", async (req, res) => {
    const id = req.session.userId;

    if (!id) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    let user;
    try {
        user = await getUserAndProducts(id);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "An error occurred while fetching user's info",
        });
    }

    if (!user) {
        return res.status(404).send({ message: "user not found" });
    }

    const users = await prisma.user.findMany();

    res.status(200).json({
        username: user.username,
        concerns: user.concerns,
        skin_type: user.skin_type,
        loved_products: await updateProductsWithScore(
            user.loved_products,
            user,
            users?.length
        ),
        saved_products: await updateProductsWithScore(
            user.saved_products,
            user,
            users?.length
        ),
        disliked_products: await updateProductsWithScore(
            user.disliked_products,
            user,
            users?.length
        ),
        skincare_routine: await updateProductsWithScore(
            user.skincare_routine,
            user,
            users?.length
        ),
    });
});

router.get("/user-id", async (req, res) => {
    if (!req.session.userId) {
        res.status(401).json({
            error: "you must be logged in to perform this action",
        });
    } else {
        res.status(200).json({ id: req.session.userId });
    }
});

router.put("/change-skin-concerns", async (req, res) => {
    const concerns = req.body;

    const id = req.session.userId;
    if (!id) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const user = await getCurrentUser(id);

        if (!user) {
            return res.status(404).send({ message: "user not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: {
                concerns: concerns,
            },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).send({
            message: "an error occurred while updating the user's skin concern",
        });
    }
});

router.get("/user-liked-saved-disliked", async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }

    try {
        const user = await getUserAndProducts(userId);
        const users = await prisma.user.findMany();
        res.status(200).json({
            loved_products: await updateProductsWithScore(
                user.loved_products,
                user,
                users?.length
            ),
            saved_products: await updateProductsWithScore(
                user.saved_products,
                user,
                users?.length
            ),
            disliked_products: await updateProductsWithScore(
                user.disliked_products,
                user,
                users?.length
            ),
            skincare_routine: await updateProductsWithScore(
                user.skincare_routine,
                user,
                users?.length
            ),
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message:
                "An error occurred while fetching user's liked, saved, and disliked products",
        });
    }
});

router.get("/user-skin-types-and-concerns", async (req, res) => {
    const id = req.session.userId;
    if (!id) {
        return res
            .status(401)
            .json({ error: "you must be logged in to perform this action" });
    }
    try {
        const user = await getCurrentUser(id);
        res.status(200).json({
            skinTypes: user.skin_type,
            concerns: user.concerns,
        });
    } catch (error) {
        res.status(500).send({
            message:
                "An error occurred while fetching user's skin types and concerns",
        });
    }
});

module.exports = router;
