const express = require('express')
const { getShopQueue } = require('../controllers/queueController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/', protect, requireRole('shop_owner'), getShopQueue)

module.exports = router
