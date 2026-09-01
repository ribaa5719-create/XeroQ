require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { connectDB } = require('./config/db')
const healthRoutes = require('./routes/healthRoutes')
const authRoutes = require('./routes/authRoutes')
const { notFound } = require('./middleware/notFound')
const { errorHandler } = require('./middleware/errorHandler')
const shopRoutes = require('./routes/shopRoutes')
const orderRoutes = require('./routes/orderRoutes')
const shopOrderRoutes = require('./routes/shopOrderRoutes')
const queueRoutes = require('./routes/queueRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()
const PORT = Number(process.env.PORT) || 5000
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://xeroq-frontend.onrender.com',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.options(/.*/, cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json({
    app: 'XeroQ backend',
    status: 'running',
    message: 'Welcome to the XeroQ API foundation.',
  })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/shops', shopRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/shop/orders', shopOrderRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`XeroQ backend running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server because MongoDB connection did not succeed.')
    console.error(error.message)
    process.exit(1)
  })
