const Shop = require('../models/Shop')
const User = require('../models/User')
const AppError = require('../utils/AppError')
const { calculateDistanceInKilometers } = require('../services/distanceService')

const allowedShopFields = [
  'name',
  'address',
  'city',
  'phone',
  'latitude',
  'longitude',
  'openingTime',
  'closingTime',
  'bwPrice',
  'colorPrice',
]

const validAvailability = ['available', 'busy', 'closed']

const sanitizePublicShop = (shop, distance) => ({
  id: shop._id,
  name: shop.name,
  address: shop.address,
  city: shop.city,
  phone: shop.phone,
  latitude: shop.latitude,
  longitude: shop.longitude,
  bwPrice: shop.bwPrice,
  colorPrice: shop.colorPrice,
  ratingAverage: shop.ratingAverage ?? null,
  ratingCount: shop.ratingCount || 0,
  availability: shop.availability,
  openingTime: shop.openingTime,
  closingTime: shop.closingTime,
  approvalStatus: shop.approvalStatus,
  ...(distance === undefined ? {} : { distance: distance === null ? null : Number(distance.toFixed(2)) }),
})

const parseCoordinate = (value, name, minimum, maximum) => {
  const parsed = Number(value)

  if (value === undefined || value === '' || !Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new AppError(`${name} must be a valid number between ${minimum} and ${maximum}.`, 400)
  }

  return parsed
}

const getNearbyShops = async (req, res, next) => {
  try {
    const mode = req.query.mode || 'nearby'
    if (!['nearby', 'all'].includes(mode)) {
      throw new AppError('Shop search mode must be nearby or all.', 400)
    }

    const latitude = mode === 'all' && (req.query.latitude === undefined || req.query.latitude === '')
      ? null
      : parseCoordinate(req.query.latitude, 'Latitude', -90, 90)
    const longitude = mode === 'all' && (req.query.longitude === undefined || req.query.longitude === '')
      ? null
      : parseCoordinate(req.query.longitude, 'Longitude', -180, 180)
    const radius = Number(req.query.radius || 5)

    if (mode === 'nearby' && (!Number.isFinite(radius) || radius <= 0 || radius > 50)) {
      throw new AppError('Radius must be greater than 0 and no more than 50 kilometers.', 400)
    }

    const shops = await Shop.find({
      approvalStatus: 'approved',
    }).select('name address city phone latitude longitude bwPrice colorPrice ratingAverage ratingCount availability openingTime closingTime approvalStatus')

    const nearbyShops = shops
      .map((shop) => ({
        shop,
        distance: latitude === null || longitude === null || !Number.isFinite(Number(shop.latitude)) || !Number.isFinite(Number(shop.longitude))
          ? null
          : calculateDistanceInKilometers(latitude, longitude, shop.latitude, shop.longitude),
      }))
      .filter(({ distance }) => mode === 'all' || (distance !== null && distance <= radius))
      .sort((first, second) => (first.distance ?? Number.POSITIVE_INFINITY) - (second.distance ?? Number.POSITIVE_INFINITY) || first.shop.name.localeCompare(second.shop.name))
      .map(({ shop, distance }) => sanitizePublicShop(shop, distance))

    res.status(200).json({
      status: 'success',
      count: nearbyShops.length,
      mode,
      ...(mode === 'nearby' ? { radius } : {}),
      shops: nearbyShops,
    })
  } catch (error) {
    next(error)
  }
}

const getPublicShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.id, approvalStatus: 'approved' }).select('name address city phone latitude longitude bwPrice colorPrice ratingAverage ratingCount availability openingTime closingTime approvalStatus')

    if (!shop) {
      throw new AppError('Approved shop not found.', 404)
    }

    res.status(200).json({
      status: 'success',
      shop: sanitizePublicShop(shop),
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return next(new AppError('Shop not found.', 404))
    }

    next(error)
  }
}

const sanitizeShop = (shop) => {
  const ownerName = shop.owner && typeof shop.owner === 'object' ? shop.owner.name : null

  return {
    id: shop._id,
    name: shop.name,
    owner: shop.owner,
    ownerName,
    address: shop.address,
    city: shop.city,
    phone: shop.phone,
    latitude: shop.latitude,
    longitude: shop.longitude,
    openingTime: shop.openingTime,
    closingTime: shop.closingTime,
    bwPrice: shop.bwPrice,
    colorPrice: shop.colorPrice,
    availability: shop.availability,
    approvalStatus: shop.approvalStatus,
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt,
  }
}

const createShop = async (req, res, next) => {
  try {
    const ownerId = req.user.id
    const ownerUser = await User.findById(ownerId)

    if (!ownerUser) {
      throw new AppError('Shop owner not found.', 404)
    }

    if (ownerUser.role !== 'shop_owner') {
      throw new AppError('Only shop owners can create a shop profile.', 403)
    }

    const payload = {
      name: req.body.name,
      owner: ownerId,
      address: req.body.address,
      city: req.body.city,
      phone: req.body.phone,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      openingTime: req.body.openingTime,
      closingTime: req.body.closingTime,
      bwPrice: req.body.bwPrice,
      colorPrice: req.body.colorPrice,
      availability: req.body.availability || 'available',
      approvalStatus: 'approved',
    }

    const existingShop = await Shop.findOne({ owner: ownerId })
    if (existingShop) {
      throw new AppError('This shop owner already has a shop profile.', 409)
    }

    const shop = await Shop.create(payload)

    res.status(201).json({
      status: 'success',
      message: 'Shop profile created successfully.',
      shop: sanitizeShop(shop),
    })
  } catch (error) {
    next(error)
  }
}

const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id })

    if (!shop) {
      throw new AppError('No shop found for this owner.', 404)
    }

    res.status(200).json({
      status: 'success',
      shop: sanitizeShop(shop),
    })
  } catch (error) {
    next(error)
  }
}

const updateMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id })

    if (!shop) {
      throw new AppError('No shop found for this owner.', 404)
    }

    const filteredUpdates = {}

    allowedShopFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        filteredUpdates[field] = req.body[field]
      }
    })

    if (Object.keys(filteredUpdates).length === 0) {
      throw new AppError('No valid shop fields provided for update.', 400)
    }

    const updatedShop = await Shop.findOneAndUpdate(
      { owner: req.user.id },
      { $set: filteredUpdates },
      { new: true, runValidators: true },
    )

    res.status(200).json({
      status: 'success',
      message: 'Shop profile updated successfully.',
      shop: sanitizeShop(updatedShop),
    })
  } catch (error) {
    next(error)
  }
}

const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body

    if (!availability || !validAvailability.includes(availability)) {
      throw new AppError('Availability must be one of: available, busy, closed.', 400)
    }

    const shop = await Shop.findOne({ owner: req.user.id })

    if (!shop) {
      throw new AppError('No shop found for this owner.', 404)
    }

    shop.availability = availability
    await shop.save()

    res.status(200).json({
      status: 'success',
      message: 'Shop availability updated successfully.',
      shop: sanitizeShop(shop),
    })
  } catch (error) {
    next(error)
  }
}

const getPendingShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({ approvalStatus: 'pending' })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      count: shops.length,
      shops: shops.map(sanitizeShop),
    })
  } catch (error) {
    next(error)
  }
}

const getAllShops = async (req, res, next) => {
  try {
    const shops = await Shop.find().populate('owner', 'name').sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      count: shops.length,
      shops: shops.map(sanitizeShop),
    })
  } catch (error) {
    next(error)
  }
}

const updateApprovalStatus = async (req, res, next) => {
  try {
    const { status } = req.body

    if (!status || !['approved', 'rejected'].includes(status)) {
      throw new AppError('Approval status must be either approved or rejected.', 400)
    }

    const shop = await Shop.findById(req.params.id)

    if (!shop) {
      throw new AppError('Shop not found.', 404)
    }

    if (!shop.openingTime) {
      shop.openingTime = '09:00'
    }

    if (!shop.closingTime) {
      shop.closingTime = '18:00'
    }

    shop.approvalStatus = status
    if (status === 'approved') {
      shop.availability = shop.availability === 'closed' ? 'closed' : 'available'
    }

    await shop.save()

    res.status(200).json({
      status: 'success',
      message: `Shop ${status} successfully.`,
      shop: sanitizeShop(shop),
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNearbyShops,
  getPublicShopById,
  createShop,
  getMyShop,
  updateMyShop,
  updateAvailability,
  getPendingShops,
  getAllShops,
  updateApprovalStatus,
}
