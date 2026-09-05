const Notification = require('../models/Notification')
const { sendPushNotification } = require('./pushNotificationService')

const createNotification = async ({ userId, orderId, type, title, message }) => {
  return Notification.create({
    user: userId,
    order: orderId,
    type,
    title,
    message,
  })
}

const notificationForTransition = {
  order_accepted: {
    title: 'Order Accepted',
    message: (order) => `Your order ${order.token} was accepted.`,
  },
  order_rejected: {
    title: 'Order Rejected',
    message: () => 'Your order was rejected by the shop.',
  },
  printing_started: {
    title: 'Printing Started',
    message: (order) => `Your order ${order.token} is now printing.`,
  },
  order_ready: {
    title: 'Order Ready',
    message: (order) => `Your order ${order.token} is ready for collection.`,
  },
  order_completed: {
    title: 'Order Completed',
    message: (order) => `Your order ${order.token} has been completed.`,
  },
}

const notifyOrderEvent = async (order, type) => {
  const template = notificationForTransition[type]
  if (!template) return

  const userId = order.user?._id || order.user
  const message = template.message(order)

  try {
    await createNotification({
      userId,
      orderId: order._id,
      type,
      title: template.title,
      message,
    })
  } catch (error) {
    console.error(`Failed to create ${type} notification for order ${order._id}:`, error.message)
  }

  try {
    await sendPushNotification({
      userId,
      orderId: order._id,
      token: order.token,
      status: type,
      title: template.title,
      message,
    })
  } catch (error) {
    console.error(`Failed to send ${type} push notification for order ${order._id}:`, error.message)
  }
}

module.exports = { createNotification, notifyOrderEvent }
