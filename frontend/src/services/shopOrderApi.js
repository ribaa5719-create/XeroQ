import api from './api'

export const shopOrderApi = {
  getPendingOrders: () => api.get('/shop/orders/pending'),
  getShopOrders: () => api.get('/shop/orders'),
  acceptOrder: (orderId) => api.patch(`/shop/orders/${orderId}/accept`),
  rejectOrder: (orderId) => api.patch(`/shop/orders/${orderId}/reject`),
  startPrinting: (orderId) => api.patch(`/shop/orders/${orderId}/start-printing`),
  markReady: (orderId) => api.patch(`/shop/orders/${orderId}/ready`),
  complete: (orderId) => api.patch(`/shop/orders/${orderId}/complete`),
  verifyCollection: (token) => api.post('/shop/orders/verify', { token }),
}
