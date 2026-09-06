const mongoose = require('mongoose')

const isProduction = process.env.NODE_ENV === 'production'
const mongoConnectionOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 0,
  bufferCommands: false,
}

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI
  }

  if (isProduction) {
    throw new Error('Missing required MONGO_URI environment variable in production.')
  }

  return 'mongodb://127.0.0.1:27017/xeroq'
}

const connectDB = async () => {
  const mongoUri = getMongoUri()

  try {
    await mongoose.connect(mongoUri, mongoConnectionOptions)
    console.log('MongoDB connected successfully.')
    return true
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

const isDatabaseReady = () => mongoose.connection.readyState === 1

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected. Database-backed requests will return 503 until the connection recovers.')
})

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message)
})

module.exports = { connectDB, isDatabaseReady }
