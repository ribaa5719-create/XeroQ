const mongoose = require('mongoose')

const isProduction = process.env.NODE_ENV === 'production'

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
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected successfully.')
    return true
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

module.exports = { connectDB }
