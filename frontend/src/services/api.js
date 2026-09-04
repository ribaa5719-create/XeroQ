import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: ({ identifier, recoveryCode, securityAnswer, recoveryMethod }) => api.post('/auth/forgot-password', { identifier, recoveryCode, securityAnswer, recoveryMethod }),
  resetPassword: ({ resetAuthorization, password, confirmPassword }) => api.post('/auth/reset-password', { resetAuthorization, password, confirmPassword }),
  getCurrentUser: () => api.get('/auth/me'),
}

export default api
