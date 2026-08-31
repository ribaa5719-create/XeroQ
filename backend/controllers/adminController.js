const User = require('../models/User')
const AppError = require('../utils/AppError')

const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10))
    const skip = (page - 1) * limit
    const filter = {}

    if (req.query.role) {
      if (!['student', 'shop_owner', 'admin'].includes(req.query.role)) {
        throw new AppError('Invalid role filter.', 400)
      }
      filter.role = req.query.role
    }

    if (req.query.search?.trim()) {
      const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total, roleCounts] = await Promise.all([
      User.find(filter).select('_id name email phone role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ])

    res.status(200).json({
      status: 'success',
      data: {
        users: users.map(({ _id, ...user }) => ({ id: _id, ...user })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: {
          totalUsers: roleCounts.reduce((sum, item) => sum + item.count, 0),
          students: roleCounts.find((item) => item._id === 'student')?.count || 0,
          shopOwners: roleCounts.find((item) => item._id === 'shop_owner')?.count || 0,
          admins: roleCounts.find((item) => item._id === 'admin')?.count || 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAdminUsers }
