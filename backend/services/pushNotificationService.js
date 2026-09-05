const webpush = require('web-push')
const PushSubscription = require('../models/PushSubscription')

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT
let isConfigured = false

if (publicKey && privateKey && subject) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    isConfigured = true
  } catch (error) {
    console.error('Web Push is disabled because VAPID configuration is invalid:', error.message)
  }
}

const sendPushNotification = async ({ userId, title, message, orderId, token, status }) => {
  if (!isConfigured || !userId) return

  const subscriptions = await PushSubscription.find({ user: userId }).lean()
  const payload = JSON.stringify({
    title,
    message,
    data: {
      orderId: String(orderId),
      token: token || null,
      status,
      url: `/live-queue?orderId=${encodeURIComponent(String(orderId))}`,
    },
  })

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, payload)
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id })
        return
      }
      console.error(`Failed to send push notification for subscription ${subscription._id}:`, error.message)
    }
  }))
}

module.exports = { sendPushNotification, isConfigured }
