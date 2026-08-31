const express = require('express')
const { registerUser, loginUser, getMe } = require('../controllers/authController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)

router.get('/student-test', protect, requireRole('student'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Student access confirmed.',
    user: req.user,
  })
})

router.get('/shop-owner-test', protect, requireRole('shop_owner'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Shop owner access confirmed.',
    user: req.user,
  })
})

router.get('/admin-test', protect, requireRole('admin'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Admin access confirmed.',
    user: req.user,
  })
})

module.exports = router
