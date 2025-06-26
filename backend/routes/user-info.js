const express = require('express')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('../generated/prisma/index.js')

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


module.exports = router;
