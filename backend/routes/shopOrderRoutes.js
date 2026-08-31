const express = require('express')
const {
  getShopOrders,
  getPendingShopOrders,
  acceptShopOrder,
  rejectShopOrder,
  transitionShopOrder,
  verifyCollection,
} = require('../controllers/shopOrderController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect, requireRole('shop_owner'))
router.get('/', getShopOrders)
router.get('/pending', getPendingShopOrders)
router.post('/verify', verifyCollection)
router.patch('/:id/accept', acceptShopOrder)
router.patch('/:id/reject', rejectShopOrder)
router.patch('/:id/start-printing', (req, res, next) => {
  req.params.action = 'startPrinting'
  transitionShopOrder(req, res, next)
})
router.patch('/:id/ready', (req, res, next) => {
  req.params.action = 'ready'
  transitionShopOrder(req, res, next)
})
router.patch('/:id/complete', (req, res, next) => {
  req.params.action = 'complete'
  transitionShopOrder(req, res, next)
})

module.exports = router
