import api from './api'

export const orderApi = {
  analyze: (formData, config = {}) => api.post('/orders/analyze', formData, {
    ...config,
    timeout: config.timeout || 15 * 60 * 1000,
    headers: { 'Content-Type': undefined, ...config.headers },
  }),
  create: (formData, config = {}) => api.post('/orders', formData, {
    ...config,
    timeout: config.timeout || 15 * 60 * 1000,
    headers: { 'Content-Type': undefined, ...config.headers },
  }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  getMy: () => api.get('/orders/my'),
}
