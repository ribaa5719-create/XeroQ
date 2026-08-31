import { AlertCircle, ArrowRight, Banknote, CheckCircle2, Clock3, FileText, ListFilter, LoaderCircle, RefreshCw, Store, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orderApi } from '../services/orderApi'
import { reviewApi } from '../services/reviewApi'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'finished', label: 'Cancelled / Rejected' },
]

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  printing: 'Printing',
  ready: 'Ready for Collection',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

const statusIcons = {
  pending: Clock3,
  accepted: CheckCircle2,
  printing: LoaderCircle,
  ready: CheckCircle2,
  completed: CheckCircle2,
  rejected: XCircle,
  cancelled: XCircle,
}

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await orderApi.getMy()
      setOrders(response.data.orders)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 401 ? 'Please log in to view your orders.' : 'Unable to load your orders.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(loadOrders, 0)
    return () => window.clearTimeout(request)
  }, [loadOrders])

  const visibleOrders = orders.filter((order) => {
    if (filter === 'active') return ['pending', 'accepted', 'printing', 'ready'].includes(order.status)
    if (filter === 'completed') return order.status === 'completed'
    if (filter === 'finished') return ['cancelled', 'rejected'].includes(order.status)
    return true
  })

  return (
    <div className="app-shell orders-shell">
      <div className="container orders-container">
        <div className="orders-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/" className="back-link">Back to Home</Link></div>
        <div className="orders-heading"><div><span className="section-tag"><FileText size={15} /> My orders</span><h1>Order history</h1><p>Keep track of your current and previous print orders.</p></div><ListFilter size={26} className="orders-heading-icon" /></div>
        <div className="order-filters" role="tablist" aria-label="Filter orders">{filters.map((item) => <button type="button" key={item.key} role="tab" aria-selected={filter === item.key} className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div>
        {errorMessage && <div className="auth-error orders-message"><AlertCircle size={18} /> {errorMessage} <button type="button" className="text-button" onClick={loadOrders}><RefreshCw size={14} /> Retry</button></div>}
        {isLoading ? <div className="orders-empty dashboard-card"><LoaderCircle size={28} className="spin-icon" /><p>Loading orders...</p></div> : visibleOrders.length === 0 ? <div className="orders-empty dashboard-card"><FileText size={30} /><h2>No orders yet.</h2><p>Your completed and current print orders will appear here.</p></div> : <div className="orders-list">{visibleOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>}
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const navigate = useNavigate()
  const StatusIcon = statusIcons[order.status] || Clock3
  const isReorderEligible = ['completed', 'rejected', 'cancelled'].includes(order.status)
  const shop = order.shopDetails
  const [review, setReview] = useState(null)

  useEffect(() => {
    if (order.status === 'completed') reviewApi.getForOrder(order.id).then((response) => setReview(response.data.review)).catch(() => {})
  }, [order.id, order.status])

  const handleReorder = () => {
    navigate('/upload-print', { state: { reorder: order, shop: { id: shop.id, ...shop } } })
  }

  return (
    <article className="order-card dashboard-card">
      <div className="order-card-header"><div className="order-shop"><div className="order-icon"><Store size={19} /></div><div><h2>{shop?.name || 'Shop details unavailable'}</h2><span>{shop ? `${shop.address}, ${shop.city}` : 'Shop information unavailable'}</span></div></div><span className={`order-status ${order.status}`}><StatusIcon size={14} /> {statusLabels[order.status] || order.status}</span></div>
      <div className="order-card-file"><FileText size={17} /><strong>{order.originalFileName}</strong></div>
      <div className="order-facts"><span>{order.pageCount} page{order.pageCount === 1 ? '' : 's'}</span><span>{order.copies} cop{order.copies === 1 ? 'y' : 'ies'}</span><span>{order.printType === 'bw' ? 'B/W' : 'Colour'}</span><span>{order.paperSize}</span><span>{order.printSide === 'single' ? 'Single-side' : 'Double-side'}</span><span className={order.priority === 'urgent' ? 'urgent-fact' : ''}>{order.priority === 'urgent' ? 'Urgent' : 'Normal'}</span></div>
      <div className="order-card-footer"><span className="order-total">Estimated total <strong>₹{order.estimatedTotal}</strong></span><span className="order-payment"><Banknote size={14} /> Pay at Shop</span><span className="order-date">{new Date(order.createdAt).toLocaleString()}</span><div className="order-actions"><Link to={`/orders/${order.id}`} className="secondary-button order-action">View details <ArrowRight size={15} /></Link>{order.status === 'completed' && <span className="order-rated">{review ? 'Rated' : 'Rate Shop'}</span>}{isReorderEligible && shop && (shop.approvalStatus !== 'approved' || shop.availability === 'closed' ? <span className="order-unavailable">Shop currently unavailable</span> : <button type="button" className="primary-button order-action" onClick={handleReorder}>Reorder</button>)}</div></div>
    </article>
  )
}

export default OrdersPage
