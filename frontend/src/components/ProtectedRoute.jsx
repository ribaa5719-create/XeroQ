import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><p>Loading your XeroQ session...</p></div></div></div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    const redirectMap = {
      student: '/',
      shop_owner: '/shop/dashboard',
      admin: '/admin/dashboard',
    }

    return <Navigate to={redirectMap[user?.role] || '/'} replace />
  }

  return children
}

export default ProtectedRoute
