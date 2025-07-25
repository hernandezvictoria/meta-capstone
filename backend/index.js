const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("welcome to skinterest!");
});

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user-info");
const productRoutes = require("./routes/products");
const cacheRoutes = require("./routes/cache");
const routineRoutes = require("./routes/routine");

const { ValidationError } = require("./middleware/CustomErrors");

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

app.use(
    session({
        secret: "capstone",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            domain:
                process.env.NODE_ENV === "production"
                    ? ".meta-capstone-backend.onrender.com"
                    : "localhost",
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        },
    })
);

app.set("trust proxy", 1);

app.use(authRoutes);
app.use(userRoutes);
app.use(productRoutes);
app.use(cacheRoutes);
app.use(routineRoutes);

app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
