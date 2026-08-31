const mongoose = require('mongoose')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const AppError = require('../utils/AppError')
const { calculateEstimatedWaitSeconds } = require('../services/waitingTimeService')
const { sortActiveOrders } = require('../services/queueOrderingService')

const activeStatuses = ['accepted', 'printing']

const safeQueueOrder = (order) => ({
  id: order._id,
  token: order.token,
  priority: order.priority || 'normal',
  paymentMethod: order.paymentMethod || 'pay_at_shop',
  paymentStatus: order.paymentStatus || 'unpaid',
  customer: order.user
    ? {
        id: order.user._id,
        name: order.user.name,
      }
    : null,
  pageCount: order.pageCount,
  copies: order.copies,
  printType: order.printType,
  paperSize: order.paperSize,
  printSide: order.printSide,
  status: order.status,
  createdAt: order.createdAt,
})

const getShopQueue = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id }).select('_id')

    if (!shop) {
      throw new AppError('No shop found for this owner.', 404)
    }

    const orders = await Order.find({
      shop: shop._id,
      status: { $in: activeStatuses },
      token: { $ne: null },
    })
      .populate('user', 'name')
      .select('-file')

    const orderedOrders = sortActiveOrders(orders)

    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders: orderedOrders.map(safeQueueOrder),
    })
  } catch (error) {
    next(error)
  }
}

const getStudentQueue = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Order not found.', 404)
    }

    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })

    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    if (!activeStatuses.includes(order.status) || !order.token) {
      throw new AppError('Queue information is available after the order is accepted.', 409)
    }

    const activeOrders = await Order.find({
      shop: order.shop,
      status: { $in: activeStatuses },
      token: { $ne: null },
    }).select('_id token status priority pageCount copies printType printSide')

    const orderedActiveOrders = sortActiveOrders(activeOrders)

    const orderIndex = orderedActiveOrders.findIndex((activeOrder) => activeOrder._id.toString() === order._id.toString())

    if (orderIndex === -1) {
      throw new AppError('Order is not currently in the active queue.', 409)
    }

    const ordersAhead = order.status === 'printing'
      ? 0
      : orderedActiveOrders.slice(0, orderIndex).filter((activeOrder) => activeOrder.status === 'accepted').length
    const estimatedWaitSeconds = calculateEstimatedWaitSeconds(order, orderedActiveOrders)

    res.status(200).json({
      status: 'success',
      queue: {
        orderId: order._id,
        token: order.token,
        priority: order.priority || 'normal',
        status: order.status,
        currentServingToken: orderedActiveOrders[0]?.token || null,
        ordersAhead,
        queuePosition: orderIndex + 1,
        estimatedWaitSeconds,
        estimatedWaitMinutes: Math.ceil(estimatedWaitSeconds / 60),
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getShopQueue, getStudentQueue }
