const errorHandler = (err, req, res, next) => {
  const databaseUnavailable = err.name === 'MongoNotConnectedError'
    || (err.name === 'MongooseError' && /buffering timed out|bufferCommands = false|disconnected|not connected/i.test(err.message || ''))
  const statusCode = databaseUnavailable ? 503 : err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500)
  const message = databaseUnavailable ? 'Database is temporarily unavailable. Please try again shortly.' : err.message || 'Internal server error'

  res.status(statusCode).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}

module.exports = { errorHandler }
