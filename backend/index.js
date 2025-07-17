const express = require('express')
const app = express()
const cors = require('cors')
const session = require('express-session')
const {createClient} = require('redis')
const {RedisStore} = require('connect-redis')

const client = createClient({
  url: "rediss://default:ActfAAIjcDE3MzNjNjJmNTUyMGY0NDFmODIwZWIzOWE0ZWI0MzBhNXAxMA@distinct-muskox-52063.upstash.io:6379"
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.connect().catch(console.error);

const PORT = 3000

app.get('/', (req, res) => {
    res.send('Welcome to my app!')
  })

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user-info');
const productRoutes = require('./routes/products');

const { ValidationError } = require('./middleware/CustomErrors')

// Configure CORS to allow requests from your frontend's origin and include credentials
app.use(cors({
    origin: process.env.FRONTEND_URL, // frontend's origin
    credentials: true
}))

app.use(express.json());

app.use(session({
    store: new RedisStore({ client: client }),
    secret: 'capstone',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
            domain:
            process.env.NODE_ENV === "production"
            ? ".meta-capstone-backend.onrender.com"
            : "localhost",
             httpOnly: true,
             maxAge: 1000 * 60 * 60 }
}))

app.set('trust proxy', 1)

app.use(authRoutes);
app.use(userRoutes);
app.use(productRoutes);


app.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({ error: err.message })
    }

    // Additional Prisma error checks can be placed here
    res.status(500).json({ error: "Internal Server Error" })
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
