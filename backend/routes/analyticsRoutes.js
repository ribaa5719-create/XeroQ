const express = require('express')
const { getAnalytics } = require('../controllers/analyticsController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', protect, requireRole('shop_owner'), getAnalytics)

module.exports = router
