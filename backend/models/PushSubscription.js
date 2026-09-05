const mongoose = require('mongoose')

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true,
      },
      auth: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  { timestamps: true },
)

pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true })

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema)
