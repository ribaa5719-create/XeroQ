const waitingTimeConfig = {
  secondsPerPage: {
    bw: 3,
    color: 6,
  },
  printSideMultiplier: {
    single: 1,
    double: 1.15,
  },
  orderHandlingOverheadSeconds: 30,
}

const { sortActiveOrders } = require('./queueOrderingService')

const calculateOrderProcessingSeconds = (order) => {
  const secondsPerPage = waitingTimeConfig.secondsPerPage[order.printType]
  const printSideMultiplier = waitingTimeConfig.printSideMultiplier[order.printSide]

  if (!secondsPerPage || !printSideMultiplier) {
    throw new Error('Waiting time cannot be calculated for this order.')
  }

  return (order.pageCount * order.copies * secondsPerPage * printSideMultiplier) + waitingTimeConfig.orderHandlingOverheadSeconds
}

const calculateEstimatedWaitSeconds = (targetOrder, activeOrders) => {
  if (targetOrder.status === 'printing' || targetOrder.status === 'ready') {
    return 0
  }

  const orderedActiveOrders = sortActiveOrders(activeOrders)
  const targetIndex = orderedActiveOrders.findIndex((order) => order._id.toString() === targetOrder._id.toString())
  const ordersAhead = targetIndex < 0 ? [] : orderedActiveOrders.slice(0, targetIndex)

  return Math.ceil(ordersAhead.reduce((total, order) => total + calculateOrderProcessingSeconds(order), 0))
}

module.exports = {
  waitingTimeConfig,
  sortActiveOrders,
  calculateOrderProcessingSeconds,
  calculateEstimatedWaitSeconds,
}
