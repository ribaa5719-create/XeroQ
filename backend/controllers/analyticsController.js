const Shop = require('../models/Shop')
const AppError = require('../utils/AppError')
const { getShopAnalytics } = require('../services/analyticsService')

const getAnalytics = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id }).select('_id')

    if (!shop) {
      return res.status(200).json({ status: 'success', data: { hasShop: false } })
    }

    const requestedDays = req.query.days === undefined ? 7 : Number(req.query.days)
    if (![7, 30].includes(requestedDays)) {
      throw new AppError('Days must be either 7 or 30.', 400)
    }

    const analytics = await getShopAnalytics(shop._id, requestedDays)
    res.status(200).json({ status: 'success', data: { hasShop: true, ...analytics } })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAnalytics }
