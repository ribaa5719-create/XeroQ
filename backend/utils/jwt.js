const jwt = require('jsonwebtoken')

const getJwtSecret = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('Missing required JWT_SECRET environment variable in production.')
    }

    return process.env.JWT_SECRET
  }

  return process.env.JWT_SECRET || 'development-secret-change-me'
}

const JWT_SECRET = getJwtSecret()

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })

const verifyToken = (token) => jwt.verify(token, JWT_SECRET)

module.exports = { signToken, verifyToken }
