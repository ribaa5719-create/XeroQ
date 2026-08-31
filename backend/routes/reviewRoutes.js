const express = require('express')
const { createReview, getMyReviews, getOrderReview, getShopReviews } = require('../controllers/reviewController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/', protect, createReview)
router.get('/my', protect, getMyReviews)
router.get('/order/:orderId', protect, getOrderReview)
router.get('/shop/:shopId', getShopReviews)

module.exports = router
