import api from './api'

export const analyticsApi = {
  getShopAnalytics: (days) => api.get('/analytics', { params: { days } }),
}
