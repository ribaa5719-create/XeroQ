const priorityRank = {
  urgent: 0,
  normal: 1,
}

const tokenNumber = (token) => Number.parseInt(token.replace(/^Q/, ''), 10)

const sortActiveOrders = (orders) => {
  const printingOrder = orders.find((order) => order.status === 'printing')
  const otherOrders = orders
    .filter((order) => order.status !== 'printing')
    .sort((first, second) => {
      const firstRank = priorityRank[first.priority || 'normal']
      const secondRank = priorityRank[second.priority || 'normal']
      return firstRank - secondRank || tokenNumber(first.token) - tokenNumber(second.token)
    })

  return printingOrder ? [printingOrder, ...otherOrders] : otherOrders
}

module.exports = { sortActiveOrders }
