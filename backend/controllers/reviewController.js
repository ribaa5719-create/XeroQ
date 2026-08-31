const mongoose = require('mongoose')
const Review = require('../models/Review')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const User = require('../models/User')
const AppError = require('../utils/AppError')

const safeReview = (review) => ({
  id: review._id,
  orderId: review.order,
  rating: review.rating,
  comment: review.comment,
  reviewerName: review.user?.name || 'Student',
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
})

const createReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      throw new AppError('Only students can create reviews.', 403)
    }

    const { orderId, rating, comment = '' } = req.body
    if (!mongoose.isValidObjectId(orderId)) throw new AppError('A valid order ID is required.', 400)
    const parsedRating = Number(rating)
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) throw new AppError('Rating must be a whole number from 1 to 5.', 400)
    if (typeof comment !== 'string' || comment.trim().length > 500) throw new AppError('Comment cannot exceed 500 characters.', 400)

    const order = await Order.findOne({ _id: orderId, user: req.user.id })
    if (!order) throw new AppError('Order not found.', 404)
    if (order.status !== 'completed') throw new AppError('Only completed orders can be reviewed.', 409)
    if (!mongoose.isValidObjectId(order.shop)) throw new AppError('Order shop is unavailable.', 400)
    const shop = await Shop.findOne({ _id: order.shop, approvalStatus: 'approved' })
    if (!shop) throw new AppError('Approved shop not found.', 404)

    const existingReview = await Review.findOne({ order: order._id })
    if (existingReview) throw new AppError('This order has already been reviewed.', 409)

    const review = await Review.create({ user: req.user.id, order: order._id, shop: shop._id, rating: parsedRating, comment: comment.trim() })
    const aggregate = await Review.aggregate([{ $match: { shop: shop._id } }, { $group: { _id: '$shop', ratingAverage: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }])
    await Shop.findByIdAndUpdate(shop._id, { $set: { ratingAverage: aggregate[0].ratingAverage, ratingCount: aggregate[0].ratingCount } })

    res.status(201).json({ status: 'success', message: 'Review submitted successfully.', review: safeReview(review) })
  } catch (error) {
    if (error.code === 11000) return next(new AppError('This order has already been reviewed.', 409))
    next(error)
  }
}

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json({ status: 'success', count: reviews.length, reviews: reviews.map(safeReview) })
  } catch (error) { next(error) }
}

const getOrderReview = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) throw new AppError('Review not found.', 404)
    const review = await Review.findOne({ order: req.params.orderId, user: req.user.id }).populate('user', 'name')
    if (!review) throw new AppError('Review not found.', 404)
    res.status(200).json({ status: 'success', review: safeReview(review) })
  } catch (error) { next(error) }
}

const getShopReviews = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.shopId)) throw new AppError('Shop not found.', 404)
    const shop = await Shop.findOne({ _id: req.params.shopId, approvalStatus: 'approved' })
    if (!shop) throw new AppError('Shop not found.', 404)
    const reviews = await Review.find({ shop: shop._id }).populate('user', 'name').sort({ createdAt: -1 })
    res.status(200).json({ status: 'success', count: reviews.length, reviews: reviews.map(safeReview) })
  } catch (error) { next(error) }
}

module.exports = { createReview, getMyReviews, getOrderReview, getShopReviews }
