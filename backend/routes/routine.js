const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();

// add/remove product to user's skincare routine
router.put("/toggle-add/:productId", async (req, res) => {
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

module.exports = router;
