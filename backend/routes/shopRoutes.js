const express = require('express')
const {
  getNearbyShops,
  getPublicShopById,
  createShop,
  getMyShop,
  updateMyShop,
  updateAvailability,
  getPendingShops,
  getAllShops,
  updateApprovalStatus,
} = require('../controllers/shopController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/', protect, requireRole('shop_owner'), createShop)
router.get('/nearby', getNearbyShops)
router.get('/my', protect, requireRole('shop_owner'), getMyShop)
router.put('/my', protect, requireRole('shop_owner'), updateMyShop)
router.patch('/my/availability', protect, requireRole('shop_owner'), updateAvailability)

router.get('/pending', protect, requireRole('admin'), getPendingShops)
router.get('/', protect, requireRole('admin'), getAllShops)
router.patch('/:id/approve', protect, requireRole('admin'), (req, res, next) => {
  req.body = { status: 'approved' }
  updateApprovalStatus(req, res, next)
})
router.patch('/:id/reject', protect, requireRole('admin'), (req, res, next) => {
  req.body = { status: 'rejected' }
  updateApprovalStatus(req, res, next)
})
router.get('/:id', getPublicShopById)

module.exports = router
