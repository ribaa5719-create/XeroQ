import api from './api'

export const shopOrderApi = {
  startPrinting: (orderId) => api.patch(`/shop/orders/${orderId}/start-printing`),
  markReady: (orderId) => api.patch(`/shop/orders/${orderId}/ready`),
  complete: (orderId) => api.patch(`/shop/orders/${orderId}/complete`),
  verifyCollection: (token) => api.post('/shop/orders/verify', { token }),
}
