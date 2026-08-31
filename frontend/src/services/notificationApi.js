import api from './api'

export const notificationApi = {
  list: (unread = false) => api.get('/notifications', { params: unread ? { unread: true } : {} }),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}
