const mongoose = require('mongoose')
const Notification = require('../models/Notification')
const AppError = require('../utils/AppError')

const safeNotification = (notification) => ({
  id: notification._id,
  orderId: notification.order,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  read: notification.read,
  createdAt: notification.createdAt,
})

const getNotifications = async (req, res, next) => {
  try {
    const filter = { user: req.user.id }
    if (req.query.unread === 'true') filter.read = false

    const notifications = await Notification.find(filter).sort({ createdAt: -1 })
    res.status(200).json({
      status: 'success',
      count: notifications.length,
      unreadCount: await Notification.countDocuments({ user: req.user.id, read: false }),
      notifications: notifications.map(safeNotification),
    })
  } catch (error) {
    next(error)
  }
}

const markNotificationRead = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Notification not found.', 404)

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } },
      { returnDocument: 'after', runValidators: true },
    )
    if (!notification) throw new AppError('Notification not found.', 404)

    res.status(200).json({ status: 'success', notification: safeNotification(notification) })
  } catch (error) {
    next(error)
  }
}

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } })
    res.status(200).json({ status: 'success', modifiedCount: result.modifiedCount })
  } catch (error) {
    next(error)
  }
}

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead }
