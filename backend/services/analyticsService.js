const Order = require('../models/Order')

const getDateRange = (days) => {
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  start.setUTCHours(0, 0, 0, 0)
  return { start, end }
}

const getShopAnalytics = async (shopId, days = 7) => {
  const { start, end } = getDateRange(days)
  const match = { shop: shopId }
  const dateMatch = { shop: shopId, createdAt: { $gte: start, $lte: end } }

  const [statusCounts, revenue, dailyOrders, peakHours, printTypes, priorities, paperSizes, averageWait] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { shop: shopId, status: 'completed' } }, { $group: { _id: null, totalCompletedOrderValue: { $sum: '$estimatedTotal' }, averageOrderValue: { $avg: '$estimatedTotal' } } }]),
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, orders: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $match: dateMatch }, { $group: { _id: { $hour: { date: '$createdAt', timezone: 'UTC' } }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$printType', orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$priority', orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$paperSize', orders: { $sum: 1 } } }, { $sort: { orders: -1 } }]),
    Order.aggregate([
      { $match: { shop: shopId, acceptedAt: { $exists: true }, createdAt: { $exists: true }, $expr: { $gte: ['$acceptedAt', '$createdAt'] } } },
      { $group: { _id: null, averageWaitSeconds: { $avg: { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 1000] } } } },
    ]),
  ])

  const statuses = ['pending', 'accepted', 'printing', 'ready', 'completed', 'rejected', 'cancelled']
  const statusMap = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]))
  const dailyMap = Object.fromEntries(dailyOrders.map((item) => [item._id, { date: item._id, orders: item.orders, completed: item.completed }]))
  const daily = []
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    daily.push(dailyMap[key] || { date: key, orders: 0, completed: 0 })
  }

  const peakHour = peakHours.length
    ? peakHours.reduce((highest, current) => (current.orders > highest.orders ? current : highest))._id
    : null

  return {
    summary: {
      totalOrders: statuses.reduce((total, status) => total + (statusMap[status] || 0), 0),
      pendingOrders: statusMap.pending || 0,
      acceptedOrders: statusMap.accepted || 0,
      printingOrders: statusMap.printing || 0,
      readyOrders: statusMap.ready || 0,
      completedOrders: statusMap.completed || 0,
      rejectedOrders: statusMap.rejected || 0,
      cancelledOrders: statusMap.cancelled || 0,
      totalCompletedOrderValue: revenue[0]?.totalCompletedOrderValue || 0,
      averageOrderValue: revenue[0]?.averageOrderValue || 0,
      averageWaitingTime: averageWait[0]?.averageWaitSeconds ?? null,
      urgentOrders: priorities.find((item) => item._id === 'urgent')?.orders || 0,
    },
    dailyOrders: daily,
    peakHours: peakHours.map((item) => ({ hour: item._id, orders: item.orders })),
    peakHour: peakHour === null ? null : `${String(peakHour).padStart(2, '0')}:00 - ${String((peakHour + 1) % 24).padStart(2, '0')}:00`,
    printTypes: { bwOrders: printTypes.find((item) => item._id === 'bw')?.orders || 0, colorOrders: printTypes.find((item) => item._id === 'color')?.orders || 0 },
    priorities: { normalOrders: priorities.find((item) => item._id === 'normal')?.orders || 0, urgentOrders: priorities.find((item) => item._id === 'urgent')?.orders || 0 },
    paperSizes: paperSizes.map((item) => ({ paperSize: item._id, orders: item.orders })),
    dateRange: { days, start: start.toISOString(), end: end.toISOString() },
  }
}

module.exports = { getShopAnalytics }
