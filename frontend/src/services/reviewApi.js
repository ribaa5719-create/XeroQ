import api from './api'

export const reviewApi = {
  create: (review) => api.post('/reviews', review),
  getMy: () => api.get('/reviews/my'),
  getForOrder: (orderId) => api.get(`/reviews/order/${orderId}`),
  getForShop: (shopId) => api.get(`/reviews/shop/${shopId}`),
}