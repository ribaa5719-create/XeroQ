const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { signToken } = require('../utils/jwt')

const RESET_AUTH_EXPIRY_MINUTES = 15
const MAX_RECOVERY_ATTEMPTS = 5
const RECOVERY_LOCK_MINUTES = 15
const recoveryFailureMessage = 'The account identifier or recovery code is invalid.'

const hashResetAuthorization = (token) => crypto.createHash('sha256').update(token).digest('hex')

const generateRecoveryCode = () => crypto.randomBytes(18).toString('hex').toUpperCase()

const generateResetAuthorization = () => crypto.randomBytes(32).toString('hex')

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

    if (typeof email !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' })
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

    const recoveryCode = generateRecoveryCode()
    const recoveryCodeHash = await bcrypt.hash(recoveryCode, 12)
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: finalRole,
      recoveryCodeHash,
    })

    const safeUser = sanitizeUser(user)
    const token = signToken({ id: user._id, email: user.email, role: user.role })

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      token,
      user: safeUser,
      recoveryCode,
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

const requestPasswordReset = async (req, res, next) => {
  try {
    const { identifier, recoveryCode } = req.body || {}

    if (typeof identifier !== 'string' || typeof recoveryCode !== 'string' || !identifier.trim() || !recoveryCode.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email or username and recovery code are required.',
      })
    }

    const normalizedIdentifier = identifier.trim().toLowerCase()
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { name: new RegExp(`^${escapeRegex(identifier.trim())}$`, 'i') },
      ],
    }).select('+recoveryCodeHash')

    if (!user || !user.recoveryCodeHash || (user.recoveryCodeLockedUntil && user.recoveryCodeLockedUntil > new Date())) {
      return res.status(400).json({ status: 'error', message: recoveryFailureMessage })
    }

    const isRecoveryCodeValid = await bcrypt.compare(recoveryCode.trim().toUpperCase(), user.recoveryCodeHash)
    if (!isRecoveryCodeValid) {
      const failedAttempts = user.recoveryCodeFailedAttempts + 1
      await User.updateOne(
        { _id: user._id },
        {
          $set: failedAttempts >= MAX_RECOVERY_ATTEMPTS
            ? { recoveryCodeLockedUntil: new Date(Date.now() + RECOVERY_LOCK_MINUTES * 60 * 1000) }
            : {},
          $inc: { recoveryCodeFailedAttempts: 1 },
        },
      )
      return res.status(400).json({ status: 'error', message: recoveryFailureMessage })
    }

    const resetAuthorization = generateResetAuthorization()
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          recoveryCodeHash: null,
          resetAuthorizationHash: hashResetAuthorization(resetAuthorization),
          resetAuthorizationExpires: new Date(Date.now() + RESET_AUTH_EXPIRY_MINUTES * 60 * 1000),
          recoveryCodeFailedAttempts: 0,
          recoveryCodeLockedUntil: null,
        },
      },
    )

    return res.status(200).json({
      status: 'success',
      message: 'Recovery code accepted.',
      resetAuthorization,
    })
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { resetAuthorization, password } = req.body || {}

    if (typeof resetAuthorization !== 'string' || typeof password !== 'string' || !resetAuthorization || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset authorization and new password are required.',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.',
      })
    }

    const newRecoveryCode = generateRecoveryCode()
    const passwordHash = await bcrypt.hash(password, 12)
    const newRecoveryCodeHash = await bcrypt.hash(newRecoveryCode, 12)
    const updatedUser = await User.findOneAndUpdate(
      {
        resetAuthorizationHash: hashResetAuthorization(resetAuthorization),
        resetAuthorizationExpires: { $gt: new Date() },
      },
      {
        $set: {
          password: passwordHash,
          recoveryCodeHash: newRecoveryCodeHash,
          recoveryCodeFailedAttempts: 0,
          recoveryCodeLockedUntil: null,
          resetAuthorizationHash: null,
          resetAuthorizationExpires: null,
        },
      },
      { new: true },
    )

    if (!updatedUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Password reset verification is invalid or expired. Start again.',
      })
    }

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
      recoveryCode: newRecoveryCode,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { registerUser, loginUser, getMe, requestPasswordReset, resetPassword }
