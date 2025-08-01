const express = require("express");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma/index.js");
const { ActivityTypes } = require("../../common-enums.js");

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Sign up a new user.
 */
router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "username and password are required" });
        }

        if (password.length < 8) {
            return res
                .status(400)
                .json({ error: "password must be at least 8 characters long" });
        }

        // Check if username is already taken
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return res.status(400).json({ error: "username already exists" });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        res.status(201).json({ username: username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "something went wrong during signup" });
    }
});

/**
 * Log in an existing user.
 */
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "username and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res
                .status(401)
                .json({ error: "invalid username or password" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res
                .status(401)
                .json({ error: "invalid username or password" });
        }

        // Store user ID and username in the session
        req.session.userId = user.id;
        req.session.username = user.username;

        await prisma.userActivity.create({
            data: {
                user_id: user.id,
                activity_time: new Date(),
                activity_type: ActivityTypes.LOGIN,
            },
        });

        res.status(200).json({ id: user.id, username: user.username }); // Include id and username in the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "something went wrong during login" });
    }
});

/**
 * Check if the user is logged in.
 */
router.get("/me", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "not logged in" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { username: true },
        });

        res.json({ id: req.session.userId, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "error fetching user session data" });
    }
});

/**
 * Log out the current user.
 */
router.post("/logout", async (req, res) => {
    if (!req.session.userId) {
        return res
            .status(401)
            .json({ message: "You must be logged in to log out" });
    }

    try {
        await prisma.userActivity.create({
            data: {
                user_id: req.session.userId,
                activity_time: new Date(),
                activity_type: ActivityTypes.LOGOUT,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: "failed to log out" });
    }
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "failed to log out" });
        }
        res.clearCookie("connect.sid"); // Clear the session cookie
        res.json({ message: "Logout successful" });
    });
});

module.exports = router;
