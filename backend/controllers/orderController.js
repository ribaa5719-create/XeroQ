const fs = require('fs/promises')
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const AppError = require('../utils/AppError')
const { getFileExtension, getPrintablePageCount } = require('../services/printableFileService')

const safeOrder = (order) => ({
  id: order._id,
  user: order.user?._id || order.user,
  shop: order.shop?._id || order.shop,
  shopDetails: order.shop?.name
    ? {
        id: order.shop._id,
        name: order.shop.name,
        address: order.shop.address,
        city: order.shop.city,
        availability: order.shop.availability,
        approvalStatus: order.shop.approvalStatus,
      }
    : undefined,
  originalFileName: order.originalFileName,
  pageCount: order.pageCount,
  printType: order.printType,
  copies: order.copies,
  paperSize: order.paperSize,
  printSide: order.printSide,
  priority: order.priority || 'normal',
  paymentMethod: order.paymentMethod || 'pay_at_shop',
  paymentStatus: order.paymentStatus || 'unpaid',
  pricePerPage: order.pricePerPage,
  estimatedTotal: order.estimatedTotal,
  status: order.status,
  token: order.token,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
})

const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(', ')}.`, 400)
  }
}

const createOrder = async (req, res, next) => {
  let storedFilePath

  try {
    if (!req.file) {
      throw new AppError('A supported printable file is required.', 400)
    }

    storedFilePath = req.file.path
    const { shopId, printType, copies, paperSize, printSide, priority = 'normal', paymentMethod = 'pay_at_shop' } = req.body

    if (!mongoose.isValidObjectId(shopId)) {
      throw new AppError('A valid shop ID is required.', 400)
    }

    validateEnum(printType, ['bw', 'color'], 'Print type')
    validateEnum(paperSize, ['A4', 'A3', 'Letter'], 'Paper size')
    validateEnum(printSide, ['single', 'double'], 'Print side')
    validateEnum(priority, ['normal', 'urgent'], 'Priority')
    validateEnum(paymentMethod, ['pay_at_shop', 'online'], 'Payment method')

    if (paymentMethod === 'online') {
      throw new AppError('Online payment is coming soon.', 400)
    }

    const parsedCopies = Number(copies)
    if (!Number.isInteger(parsedCopies) || parsedCopies < 1) {
      throw new AppError('Copies must be a positive whole number.', 400)
    }

    const shop = await Shop.findOne({ _id: shopId, approvalStatus: 'approved' }).select('owner bwPrice colorPrice')
    if (!shop) {
      throw new AppError('Only an approved shop can receive new orders.', 404)
    }

    let pageCount
    try {
      pageCount = await getPrintablePageCount({ filePath: storedFilePath, originalFileName: req.file.originalname })
    } catch (error) {
      if (['OFFICE_CONVERSION_UNAVAILABLE', 'OFFICE_CONVERSION_FAILED', 'OFFICE_CONVERSION_TIMEOUT'].includes(error.code) || error.message?.includes('cannot currently be processed')) {
        throw new AppError('This file format cannot currently be processed for page counting. Please try PDF or another supported format.', 422)
      }
      throw new AppError(req.file.mimetype === 'application/pdf' ? 'The PDF page count could not be determined. Please upload a valid, readable PDF.' : 'The uploaded file could not be validated. Please choose a valid printable file.', 400)
    }

    const pricePerPage = printType === 'bw' ? shop.bwPrice : shop.colorPrice
    const estimatedTotal = pageCount * parsedCopies * pricePerPage

    const order = await Order.create({
      user: req.user.id,
      shop: shop._id,
      file: storedFilePath,
      originalFileName: req.file.originalname,
      pageCount,
      printType,
      copies: parsedCopies,
      paperSize,
      printSide,
      priority,
      paymentMethod,
      paymentStatus: 'unpaid',
      pricePerPage,
      estimatedTotal,
    })

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully.',
      order: safeOrder(order),
    })
  } catch (error) {
    if (storedFilePath) {
      await fs.unlink(storedFilePath).catch(() => {})
    }
    next(error)
  }
}

const analyzeUploadedFile = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('A supported printable file is required.', 400)
    const pageCount = await getPrintablePageCount({ filePath: req.file.path, originalFileName: req.file.originalname })
    res.status(200).json({ status: 'success', fileType: getFileExtension(req.file.originalname).slice(1).toUpperCase(), pageCount })
  } catch (error) {
    if (['OFFICE_CONVERSION_UNAVAILABLE', 'OFFICE_CONVERSION_FAILED', 'OFFICE_CONVERSION_TIMEOUT'].includes(error.code) || error.message?.includes('cannot currently be processed')) {
      error = new AppError('This file format cannot currently be processed for page counting. Please try PDF or another supported format.', 422)
    }
    next(error)
  } finally {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {})
  }
}

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('shop', 'name address city availability approvalStatus')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      count: orders.length,
      orders: orders.map(safeOrder),
    })
  } catch (error) {
    next(error)
  }
}

const getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError('Order not found.', 404)
    }

    const order = await Order.findById(req.params.id).populate('shop', 'owner name address city availability approvalStatus')
    if (!order) {
      throw new AppError('Order not found.', 404)
    }

    const isOwner = order.user.toString() === req.user.id.toString()
    const isShopOwner = order.shop?.owner?.toString() === req.user.id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isShopOwner && !isAdmin) {
      throw new AppError('You do not have permission to view this order.', 403)
    }

    res.status(200).json({ status: 'success', order: safeOrder(order) })
  } catch (error) {
    next(error)
  }
}

module.exports = { analyzeUploadedFile, createOrder, getMyOrders, getOrderById }
