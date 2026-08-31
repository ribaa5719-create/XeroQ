const User = require('../models/User')
const { signToken } = require('../utils/jwt')

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, phone and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.',
      })
    }

    const allowedRoles = ['student', 'shop_owner']

    if (role && role === 'admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Admin accounts cannot be created through public registration.',
      })
    }

    const finalRole = allowedRoles.includes(role) ? role : 'student'

    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email already exists.',
      })
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: finalRole,
    })

    const safeUser = sanitizeUser(user)
    const token = signToken({ id: user._id, email: user.email, role: user.role })

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      token,
      user: safeUser,
    })
  } catch (error) {
    next(error)
  }
}

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail }).select('+password')

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      })
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role })

    res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
  })
}

module.exports = { registerUser, loginUser, getMe }
