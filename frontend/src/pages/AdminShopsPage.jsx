import { AlertCircle, CheckCircle2, LoaderCircle, Search, ShieldCheck, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminShopApi } from '../services/adminShopApi'

const statusOptions = [
  { value: 'all', label: 'All Shops' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function AdminShopsPage() {
  const [shops, setShops] = useState([])
  const [filteredShops, setFilteredShops] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actioningShopId, setActioningShopId] = useState(null)

  const applyFilters = (shopList, status, search) => {
    let result = shopList

    if (status !== 'all') {
      result = result.filter((shop) => shop.approvalStatus === status)
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (shop) =>
          shop.name.toLowerCase().includes(lowerSearch) ||
          shop.city.toLowerCase().includes(lowerSearch),
      )
    }

    setFilteredShops(result)
  }

  const loadShops = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await adminShopApi.getAllShops()
      const allShops = response.data.shops || []
      setShops(allShops)
      applyFilters(allShops, statusFilter, searchQuery)
    } catch (error) {
      const status = error?.response?.status
      if (status === 403) {
        setErrorMessage('You do not have permission to manage shops.')
      } else if (status === 401) {
        setErrorMessage('Please log in as an administrator.')
      } else {
        setErrorMessage('Unable to load shops. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, searchQuery])

  useEffect(() => {
    const request = window.setTimeout(loadShops, 0)
    return () => window.clearTimeout(request)
  }, [loadShops])

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus)
    applyFilters(shops, newStatus, searchQuery)
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    applyFilters(shops, statusFilter, query)
  }

  const handleApprove = async (shopId) => {
    setActioningShopId(shopId)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await adminShopApi.approveShop(shopId)
      setSuccessMessage('Shop approved successfully!')
      await loadShops()
    } catch {
      setErrorMessage('Failed to approve shop. Please try again.')
    } finally {
      setActioningShopId(null)
    }
  }

  const handleReject = async (shopId) => {
    setActioningShopId(shopId)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await adminShopApi.rejectShop(shopId)
      setSuccessMessage('Shop rejected successfully!')
      await loadShops()
    } catch {
      setErrorMessage('Failed to reject shop. Please try again.')
    } finally {
      setActioningShopId(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { icon: AlertCircle, label: 'Pending', className: 'status-badge pending' },
      approved: { icon: CheckCircle2, label: 'Approved', className: 'status-badge approved' },
      rejected: { icon: XCircle, label: 'Rejected', className: 'status-badge rejected' },
    }
    const config = statusMap[status] || statusMap.pending
    const Icon = config.icon
    return (
      <span className={config.className}>
        <Icon size={14} />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  return (
    <div className="app-shell admin-shell">
      <div className="container admin-container">
        <div className="admin-topbar">
          <Link to="/" className="brand">
            <div className="brand-mark">X</div>
            <span>XeroQ</span>
          </Link>
          <Link to="/admin/dashboard" className="back-link">
            Back to Dashboard
          </Link>
        </div>

        <div className="admin-heading">
          <div>
            <span className="section-tag">
              <ShieldCheck size={15} /> Admin
            </span>
            <h1>Shop Management</h1>
            <p>Review registered Xerox shops, approve listings, and monitor platform onboarding.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-error admin-message">
            <AlertCircle size={18} /> {errorMessage}
            <button type="button" className="text-button" onClick={loadShops}>
              Retry
            </button>
          </div>
        )}

        {successMessage && (
          <div className="auth-success admin-message">
            <CheckCircle2 size={18} /> {successMessage}
          </div>
        )}

        <div className="admin-filters-section dashboard-card">
          <div className="filters-group">
            <div className="filter-item">
              <label htmlFor="status-filter">Status</label>
              <select id="status-filter" value={statusFilter} onChange={(e) => handleStatusFilterChange(e.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item search-filter">
              <label htmlFor="search-shops">Search</label>
              <div className="search-input-wrapper">
                <Search size={16} />
                <input
                  id="search-shops"
                  type="text"
                  placeholder="Search by shop name or city..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-empty dashboard-card">
            <LoaderCircle size={28} className="spin-icon" />
            <p>Loading shops...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="admin-empty dashboard-card">
            <AlertCircle size={28} />
            <p>{shops.length === 0 ? 'No shops found.' : 'No shops match your search or filters.'}</p>
          </div>
        ) : (
          <div className="admin-shops-table dashboard-card">
            <div className="shops-table-header">
              <div className="shop-info-col">Shop Information</div>
              <div className="shop-details-col">Details</div>
              <div className="shop-status-col">Status</div>
              <div className="shop-actions-col">Actions</div>
            </div>

            {filteredShops.map((shop) => (
              <div key={shop.id} className="shop-row">
                <div className="shop-info">
                  <div className="shop-name-city">
                    <strong>{shop.name}</strong>
                    <small>{shop.city}</small>
                  </div>
                  <div className="shop-address">
                    <small>{shop.address}</small>
                  </div>
                </div>

                <div className="shop-details">
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span>{shop.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">B/W Price:</span>
                    <span>₹{shop.bwPrice}/page</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Color Price:</span>
                    <span>₹{shop.colorPrice}/page</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Hours:</span>
                    <span>
                      {formatTime(shop.openingTime)} - {formatTime(shop.closingTime)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Added:</span>
                    <span>{formatDate(shop.createdAt)}</span>
                  </div>
                </div>

                <div className="shop-status">{getStatusBadge(shop.approvalStatus)}</div>

                <div className="shop-actions">
                  {shop.approvalStatus === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="success-button small-button"
                        onClick={() => handleApprove(shop.id)}
                        disabled={actioningShopId === shop.id}
                      >
                        {actioningShopId === shop.id ? (
                          <>
                            <LoaderCircle size={14} className="spin-icon" /> Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} /> Approve
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="danger-button small-button"
                        onClick={() => handleReject(shop.id)}
                        disabled={actioningShopId === shop.id}
                      >
                        {actioningShopId === shop.id ? (
                          <>
                            <LoaderCircle size={14} className="spin-icon" /> Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Reject
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <span className="action-status">
                      {shop.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="shops-summary">
              <small>Showing {filteredShops.length} of {shops.length} shops</small>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminShopsPage
