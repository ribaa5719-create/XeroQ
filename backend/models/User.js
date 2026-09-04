const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'shop_owner', 'admin'],
      default: 'student',
      required: true,
    },
    recoveryCodeHash: {
      type: String,
      select: false,
      default: null,
    },
    recoveryCodeFailedAttempts: {
      type: Number,
      default: 0,
    },
    recoveryCodeLockedUntil: {
      type: Date,
      default: null,
    },
    resetAuthorizationHash: {
      type: String,
      select: false,
      default: null,
    },
    resetAuthorizationExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password
        return ret
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password
        return ret
      },
    },
  },
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
