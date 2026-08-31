import api from './api'

export const analyticsApi = {
  getShopAnalytics: (days) => api.get('/shop/analytics', { params: { days } }),
}
