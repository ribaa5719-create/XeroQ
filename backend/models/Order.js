const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order user is required'],
      index: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Order shop is required'],
      index: true,
    },
    file: {
      type: String,
      required: [true, 'Stored file is required'],
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    pageCount: {
      type: Number,
      required: [true, 'Page count is required'],
      min: [1, 'Page count must be at least 1'],
    },
    printType: {
      type: String,
      enum: ['bw', 'color'],
      required: [true, 'Print type is required'],
    },
    copies: {
      type: Number,
      required: [true, 'Copies are required'],
      min: [1, 'Copies must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Copies must be a whole number',
      },
    },
    paperSize: {
      type: String,
      enum: ['A4', 'A3', 'Letter'],
      required: [true, 'Paper size is required'],
    },
    printSide: {
      type: String,
      enum: ['single', 'double'],
      required: [true, 'Print side is required'],
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
    },
    pricePerPage: {
      type: Number,
      required: [true, 'Price per page is required'],
      min: [0, 'Price per page cannot be negative'],
    },
    estimatedTotal: {
      type: Number,
      required: [true, 'Estimated total is required'],
      min: [0, 'Estimated total cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['pay_at_shop', 'online'],
      default: 'pay_at_shop',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'not_applicable'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'printing', 'ready', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    token: {
      type: String,
      default: null,
    },
    acceptedAt: Date,
    printingStartedAt: Date,
    readyAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
)

orderSchema.index(
  { shop: 1, token: 1 },
  {
    name: 'shop_token_unique',
    unique: true,
    partialFilterExpression: { token: { $type: 'string' } },
  },
)

module.exports = mongoose.model('Order', orderSchema)
