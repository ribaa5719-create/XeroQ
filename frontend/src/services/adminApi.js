import api from './api'

export const adminApi = {
  getUsers: ({ page = 1, limit = 10, role = '', search = '' } = {}) =>
    api.get('/admin/users', { params: { page, limit, role: role || undefined, search: search || undefined } }),
}
