const express = require('express')
const { getNotifications, markNotificationRead, markAllNotificationsRead, getPushConfig, registerPushSubscription, removePushSubscription } = require('../controllers/notificationController')
const { protect, requireRole } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)
router.get('/push-config', requireRole('student'), getPushConfig)
router.post('/push-subscription', requireRole('student'), registerPushSubscription)
router.delete('/push-subscription', requireRole('student'), removePushSubscription)
router.get('/', getNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)

module.exports = router
