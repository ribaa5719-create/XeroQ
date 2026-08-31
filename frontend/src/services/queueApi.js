import api from './api'

export const queueApi = {
  getStudentQueue: (orderId) => api.get(`/orders/${orderId}/queue`),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
  getShopQueue: () => api.get('/shop/queue'),
}
