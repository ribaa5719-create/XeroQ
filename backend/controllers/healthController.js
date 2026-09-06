const mongoose = require('mongoose')

const healthCheck = (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1

  res.status(dbConnected ? 200 : 503).json({
    status: 'success',
    message: 'XeroQ backend is running successfully.',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      state: dbConnected ? 'connected' : 'disconnected',
    },
  })
}

module.exports = { healthCheck }
