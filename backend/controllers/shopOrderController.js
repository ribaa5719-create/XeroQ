const mongoose = require('mongoose')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const ShopCounter = require('../models/ShopCounter')
const User = require('../models/User')
const AppError = require('../utils/AppError')
const { sortActiveOrders } = require('../services/queueOrderingService')
const { notifyOrderEvent } = require('../services/notificationService')

const safeShopOrder = (order) => ({
  id: order._id,
  customer: order.user
    ? {
        id: order.user._id,
        name: order.user.name,
        email: order.user.email,
      }
    : null,
  shop: order.shop?._id || order.shop,
  originalFileName: order.originalFileName,
  pageCount: order.pageCount,
  printType: order.printType,
  copies: order.copies,
  paperSize: order.paperSize,
  printSide: order.printSide,
  priority: order.priority || 'normal',
  paymentMethod: order.paymentMethod || 'pay_at_shop',
  paymentStatus: order.paymentStatus || 'unpaid',
  estimatedTotal: order.estimatedTotal,
  status: order.status,
  token: order.token,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
})

const getOwnerShop = async (ownerId) => {
  const shop = await Shop.findOne({ owner: ownerId }).select('_id')

  if (!shop) {
    throw new AppError('No shop found for this owner.', 404)
  }

  return shop
}

const getShopOrders = async (req, res, next) => {
  try {
    const shop = await getOwnerShop(req.user.id)
    const orders = await Order.find({ shop: shop._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders: orders.map(safeShopOrder),
    })
  } catch (error) {
    next(error)
  }
}

const getPendingShopOrders = async (req, res, next) => {
  try {
    const shop = await getOwnerShop(req.user.id)
    const orders = await Order.find({ shop: shop._id, status: 'pending' })
      .populate('user', 'name email')
      .sort({ createdAt: 1 })

    orders.sort((first, second) => {
      const firstPriority = first.priority === 'urgent' ? 0 : 1
      const secondPriority = second.priority === 'urgent' ? 0 : 1
      return firstPriority - secondPriority || first.createdAt - second.createdAt
    })

    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders: orders.map(safeShopOrder),
    })
  } catch (error) {
    next(error)
  }
}

const getOrderForShopOwner = async (orderId, ownerId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError('Order not found.', 404)
  }

  const shop = await getOwnerShop(ownerId)
  const order = await Order.findById(orderId).populate('user', 'name email')

  if (!order) {
    throw new AppError('Order not found.', 404)
  }

  if (order.shop.toString() !== shop._id.toString()) {
    throw new AppError('You do not have permission to manage this order.', 403)
  }

  return { order, shop }
}

const getNextShopToken = async (shopId) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const counter = await ShopCounter.findOneAndUpdate(
        { shop: shopId },
        { $inc: { nextToken: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )

      return `Q${String(counter.nextToken).padStart(3, '0')}`
    } catch (error) {
      if (error.code !== 11000 || attempt === 2) throw error
    }
  }
}

const acceptShopOrder = async (req, res, next) => {
  try {
    const { order, shop } = await getOrderForShopOwner(req.params.id, req.user.id)

    if (order.status !== 'pending') {
      throw new AppError('Only pending orders can be accepted.', 409)
    }

    const token = await getNextShopToken(shop._id)
    const acceptedOrder = await Order.findOneAndUpdate(
      { _id: order._id, shop: shop._id, status: 'pending', token: null },
      { $set: { status: 'accepted', token, acceptedAt: new Date() } },
      { new: true, runValidators: true },
    ).populate('user', 'name email')

    if (!acceptedOrder) {
      throw new AppError('Order is no longer pending.', 409)
    }

    await notifyOrderEvent(acceptedOrder, 'order_accepted')

    res.status(200).json({
      status: 'success',
      message: 'Order accepted successfully.',
      order: safeShopOrder(acceptedOrder),
    })
  } catch (error) {
    next(error)
  }
}

const rejectShopOrder = async (req, res, next) => {
  try {
    const { order, shop } = await getOrderForShopOwner(req.params.id, req.user.id)

    if (order.status !== 'pending') {
      throw new AppError('Only pending orders can be rejected.', 409)
    }

    const rejectedOrder = await Order.findOneAndUpdate(
      { _id: order._id, shop: shop._id, status: 'pending', token: null },
      { $set: { status: 'rejected', token: null } },
      { new: true, runValidators: true },
    ).populate('user', 'name email')

    if (!rejectedOrder) {
      throw new AppError('Order is no longer pending.', 409)
    }

    await notifyOrderEvent(rejectedOrder, 'order_rejected')

    res.status(200).json({
      status: 'success',
      message: 'Order rejected successfully.',
      order: safeShopOrder(rejectedOrder),
    })
  } catch (error) {
    next(error)
  }
}

const verifyCollection = async (req, res, next) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim().toUpperCase() : ''
    if (!token) throw new AppError('A collection token is required.', 400)

    const shop = await getOwnerShop(req.user.id)
    const order = await Order.findOne({ shop: shop._id, token })

    if (!order) throw new AppError('No order found for this token.', 404)
    if (order.status !== 'ready') throw new AppError('This order is not ready for collection.', 409)

    res.status(200).json({
      status: 'success',
      message: 'Order verified.',
      order: {
        orderId: order._id,
        token: order.token,
        status: order.status,
        customerName: (await User.findById(order.user).select('name'))?.name,
        printType: order.printType,
        copies: order.copies,
        paperSize: order.paperSize,
        printSide: order.printSide,
        pageCount: order.pageCount,
      },
    })
  } catch (error) {
    next(error)
  }
}

const transitionShopOrder = async (req, res, next) => {
  try {
    const transition = {
      startPrinting: { from: 'accepted', to: 'printing', message: 'Order moved to printing.' },
      ready: { from: 'printing', to: 'ready', message: 'Order marked ready.' },
      complete: { from: 'ready', to: 'completed', message: 'Order marked completed.' },
    }[req.params.action]

    if (!transition) {
      throw new AppError('Invalid order status transition.', 400)
    }

    const { order, shop } = await getOrderForShopOwner(req.params.id, req.user.id)

    if (transition.to === 'printing') {
      const currentPrintingOrder = await Order.exists({ shop: shop._id, status: 'printing' })
      if (currentPrintingOrder) {
        throw new AppError('Another order is already printing at this shop.', 409)
      }
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, shop: shop._id, status: transition.from },
      { $set: {
        status: transition.to,
        ...(transition.to === 'printing' ? { printingStartedAt: new Date() } : {}),
        ...(transition.to === 'ready' ? { readyAt: new Date() } : {}),
        ...(transition.to === 'completed' ? { completedAt: new Date() } : {}),
      } },
      { new: true, runValidators: true },
    ).populate('user', 'name email')

    if (!updatedOrder) {
      throw new AppError(`Only ${transition.from} orders can be moved to ${transition.to}.`, 409)
    }

    const notificationType = {
      printing: 'printing_started',
      ready: 'order_ready',
      completed: 'order_completed',
    }[transition.to]
    await notifyOrderEvent(updatedOrder, notificationType)

    res.status(200).json({
      status: 'success',
      message: transition.message,
      order: safeShopOrder(updatedOrder),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getShopOrders,
  getPendingShopOrders,
  acceptShopOrder,
  rejectShopOrder,
  verifyCollection,
  transitionShopOrder,
}
