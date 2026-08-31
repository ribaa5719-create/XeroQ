const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'XeroQ backend is running successfully.',
    timestamp: new Date().toISOString(),
  })
}

module.exports = { healthCheck }
