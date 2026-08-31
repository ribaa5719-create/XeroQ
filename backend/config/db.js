const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/xeroq'

  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected successfully.')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    console.log('Continuing without database connection for local backend setup.')
  }
}

module.exports = { connectDB }
