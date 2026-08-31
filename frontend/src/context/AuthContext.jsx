import { useEffect, useMemo, useState } from 'react'
import { authApi, setAuthToken } from '../services/api'
import { AuthContext } from './authContextValue'

const getStoredToken = () => localStorage.getItem('xeroq_token')
const getStoredUser = () => {
  const savedUser = localStorage.getItem('xeroq_user')
  return savedUser ? JSON.parse(savedUser) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())
  const [token, setToken] = useState(getStoredToken())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = getStoredToken()

      if (!storedToken) {
        setLoading(false)
        return
      }

      setAuthToken(storedToken)

      try {
        const response = await authApi.getCurrentUser()
        const currentUser = response.data.user
        setUser(currentUser)
        localStorage.setItem('xeroq_user', JSON.stringify(currentUser))
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem('xeroq_token')
        localStorage.removeItem('xeroq_user')
        setAuthToken(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const login = async (userData, authToken) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem('xeroq_token', authToken)
    localStorage.setItem('xeroq_user', JSON.stringify(userData))
    setAuthToken(authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('xeroq_token')
    localStorage.removeItem('xeroq_user')
    setAuthToken(null)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      loading,
    }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

