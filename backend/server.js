require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { connectDB, isDatabaseReady } = require('./config/db')
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
const REQUEST_TIMEOUT_MS = 15 * 60 * 1000
const isProduction = process.env.NODE_ENV === 'production'
const frontendOrigin = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'
const allowedOrigins = isProduction ? [frontendOrigin] : ['http://localhost:5173']
const corsOptions = {
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
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

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
app.use((req, res, next) => {
  if (req.path === '/api/health' || isDatabaseReady()) {
    next()
    return
  }

  res.status(503).json({
    status: 'error',
    message: 'Database is temporarily unavailable. Please try again shortly.',
  })
})
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
    const server = app.listen(PORT, () => {
      console.log(`XeroQ backend running on port ${PORT}`)
    })
    server.requestTimeout = REQUEST_TIMEOUT_MS
    server.headersTimeout = REQUEST_TIMEOUT_MS + 10 * 1000
  })
  .catch((error) => {
    console.error('Failed to start server because MongoDB connection did not succeed.')
    console.error(error.message)
    process.exit(1)
  })
