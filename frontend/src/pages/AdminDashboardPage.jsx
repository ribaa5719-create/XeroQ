import { AlertCircle, LoaderCircle, ShieldCheck, Users, UserRoundCheck, Store, UserCog } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/adminApi'

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminApi.getUsers({ limit: 1 })
      setSummary(response.data.data.summary)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 403 ? 'You do not have permission to view the admin dashboard.' : 'Unable to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(loadSummary, 0)
    return () => window.clearTimeout(request)
  }, [loadSummary])

  return (
    <div className="app-shell admin-shell">
      <div className="container admin-container">
        <div className="admin-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/" className="back-link">Back to Home</Link></div>
        <div className="admin-heading"><div><span className="section-tag"><ShieldCheck size={15} /> Admin</span><h1>Platform overview</h1><p>Manage the people who keep XeroQ moving.</p></div><div className="admin-heading-actions"><Link to="/admin/users" className="primary-button"><Users size={17} /> User Management</Link><Link to="/admin/shops" className="primary-button"><Store size={17} /> Shop Management</Link></div></div>
        {errorMessage && <div className="auth-error admin-message"><AlertCircle size={18} /> {errorMessage} <button type="button" className="text-button" onClick={loadSummary}>Retry</button></div>}
        {isLoading ? <div className="admin-empty dashboard-card"><LoaderCircle size={28} className="spin-icon" /><p>Loading dashboard...</p></div> : <div className="admin-metric-grid">
          <AdminMetric icon={Users} label="Total Users" value={summary?.totalUsers ?? 0} />
          <AdminMetric icon={UserRoundCheck} label="Students" value={summary?.students ?? 0} />
          <AdminMetric icon={Store} label="Shop Owners" value={summary?.shopOwners ?? 0} />
          <AdminMetric icon={UserCog} label="Admins" value={summary?.admins ?? 0} />
        </div>}
        <div className="admin-dashboard-note dashboard-card"><ShieldCheck size={22} /><div><strong>Admin foundation</strong><p>Use User Management to inspect current accounts. Shop, order, reports, and analytics administration will be added separately.</p></div></div>
      </div>
    </div>
  )
}

function AdminMetric({ icon: Icon, label, value }) {
  return <div className="admin-metric dashboard-card"><div className="admin-metric-icon"><Icon size={20} /></div><span>{label}</span><strong>{value}</strong></div>
}

export default AdminDashboardPage
