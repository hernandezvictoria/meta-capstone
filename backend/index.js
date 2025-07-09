const express = require('express')
const app = express()
const cors = require('cors')
const session = require('express-session')

const { SkinTypes, SkinConcerns } = require('./enums');

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
    origin: 'http://localhost:5173', // frontend's origin
    credentials: true
}))

app.use(express.json());

app.use(session({
    secret: 'capstone',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 }
}))

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
