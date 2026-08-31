const { verifyToken } = require('../utils/jwt')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is missing or invalid.',
      })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid or expired.',
      })
    }

    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists.',
      })
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    }

    next()
  } catch (error) {
    next(error)
  }
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource.',
      })
    }

    next()
  }
}

module.exports = { protect, requireRole }
