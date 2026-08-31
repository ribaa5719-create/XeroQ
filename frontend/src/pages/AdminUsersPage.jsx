import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, Search, UserRound, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/adminApi'

const roles = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'shop_owner', label: 'Shop owners' },
  { value: 'admin', label: 'Admins' },
]

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await adminApi.getUsers({ page: pagination.page, role, search })
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 403 ? 'You do not have permission to manage users.' : error.response?.status === 401 ? 'Please log in as an administrator.' : 'Unable to load users.')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, role, search])

  useEffect(() => {
    const request = window.setTimeout(loadUsers, 0)
    return () => window.clearTimeout(request)
  }, [loadUsers])

  const updateSearch = (event) => {
    setSearch(event.target.value)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const updateRole = (event) => {
    setRole(event.target.value)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  return (
    <div className="app-shell admin-shell">
      <div className="container admin-container">
        <div className="admin-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/admin/dashboard" className="back-link"><ArrowLeft size={16} /> Dashboard</Link></div>
        <div className="admin-heading"><div><span className="section-tag"><Users size={15} /> Admin</span><h1>User Management</h1><p>Review registered students, shop owners, and administrators.</p></div></div>
        <div className="admin-filters"><div className="admin-search"><Search size={17} /><input value={search} onChange={updateSearch} placeholder="Search name or email" aria-label="Search users" /></div><select value={role} onChange={updateRole} aria-label="Filter by role">{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        {errorMessage && <div className="auth-error admin-message"><AlertCircle size={18} /> {errorMessage} <button type="button" className="text-button" onClick={loadUsers}>Retry</button></div>}
        <section className="admin-users-card dashboard-card">
          {isLoading ? <div className="admin-empty"><Users size={28} /><p>Loading users...</p></div> : users.length === 0 ? <div className="admin-empty"><UserRound size={30} /><h2>No users found.</h2><p>Try a different search or role filter.</p></div> : <div className="users-table-wrap"><table className="users-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td data-label="Name">{user.name}</td><td data-label="Email">{user.email}</td><td data-label="Phone">{user.phone}</td><td data-label="Role"><span className={`admin-role ${user.role}`}>{user.role === 'shop_owner' ? 'Shop owner' : user.role}</span></td><td data-label="Created">{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
          {!isLoading && users.length > 0 && <div className="admin-pagination"><span>{pagination.total} user{pagination.total === 1 ? '' : 's'} total</span><div><button type="button" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft size={17} /></button><strong>Page {pagination.page} of {Math.max(pagination.pages, 1)}</strong><button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}><ChevronRight size={17} /></button></div></div>}
        </section>
      </div>
    </div>
  )
}

export default AdminUsersPage
