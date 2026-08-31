const mongoose = require('mongoose')

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
      unique: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+()\-\s]{7,15}$/, 'Please provide a valid phone number'],
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
    openingTime: {
      type: String,
      required: [true, 'Opening time is required'],
      validate: {
        validator: (value) => timeRegex.test(value),
        message: 'Opening time must be in HH:MM format',
      },
    },
    closingTime: {
      type: String,
      required: [true, 'Closing time is required'],
      validate: {
        validator: (value) => timeRegex.test(value),
        message: 'Closing time must be in HH:MM format',
      },
    },
    bwPrice: {
      type: Number,
      default: 0,
      min: [0, 'Black and white price cannot be negative'],
    },
    colorPrice: {
      type: Number,
      default: 0,
      min: [0, 'Color price cannot be negative'],
    },
    ratingAverage: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'closed'],
      default: 'available',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

shopSchema.index({ city: 1, approvalStatus: 1 })

module.exports = mongoose.model('Shop', shopSchema)
