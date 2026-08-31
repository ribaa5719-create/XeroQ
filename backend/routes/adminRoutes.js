const express = require('express')
const { getAdminUsers } = require('../controllers/adminController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect, requireRole('admin'))
router.get('/users', getAdminUsers)

module.exports = router
