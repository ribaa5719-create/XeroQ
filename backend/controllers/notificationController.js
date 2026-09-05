const mongoose = require('mongoose')
const Notification = require('../models/Notification')
const PushSubscription = require('../models/PushSubscription')
const AppError = require('../utils/AppError')
const { isConfigured } = require('../services/pushNotificationService')

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

const validatePushSubscription = (payload) => {
  const endpoint = typeof payload?.endpoint === 'string' ? payload.endpoint.trim() : ''
  const p256dh = typeof payload?.keys?.p256dh === 'string' ? payload.keys.p256dh.trim() : ''
  const auth = typeof payload?.keys?.auth === 'string' ? payload.keys.auth.trim() : ''

  if (!endpoint || endpoint.length > 2048 || !/^https:\/\//i.test(endpoint) || !p256dh || p256dh.length > 512 || !auth || auth.length > 512) {
    throw new AppError('A valid push subscription is required.', 400)
  }

  return { endpoint, keys: { p256dh, auth } }
}

const getPushConfig = async (req, res) => {
  res.status(200).json({
    status: 'success',
    enabled: isConfigured,
    publicKey: isConfigured ? process.env.VAPID_PUBLIC_KEY : null,
  })
}

const registerPushSubscription = async (req, res, next) => {
  try {
    if (!isConfigured) throw new AppError('Push notifications are not configured.', 503)

    const subscription = validatePushSubscription(req.body)
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint })
    if (existing && existing.user.toString() !== req.user.id.toString()) {
      throw new AppError('This push subscription is already registered.', 409)
    }

    const savedSubscription = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint, user: req.user.id },
      { $set: subscription },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    )

    res.status(200).json({ status: 'success', subscriptionId: savedSubscription._id })
  } catch (error) {
    next(error)
  }
}

const removePushSubscription = async (req, res, next) => {
  try {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : ''
    if (!endpoint || endpoint.length > 2048) throw new AppError('A valid push endpoint is required.', 400)

    await PushSubscription.deleteOne({ endpoint, user: req.user.id })
    res.status(200).json({ status: 'success' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPushConfig,
  registerPushSubscription,
  removePushSubscription,
}
