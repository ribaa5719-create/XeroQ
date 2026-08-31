import api from './api'

export const orderApi = {
  create: (formData) => api.post('/orders', formData, { headers: { 'Content-Type': undefined } }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  getMy: () => api.get('/orders/my'),
}
