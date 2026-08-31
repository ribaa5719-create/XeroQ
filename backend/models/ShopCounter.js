const mongoose = require('mongoose')

const shopCounterSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      unique: true,
      index: true,
    },
    nextToken: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('ShopCounter', shopCounterSchema)
