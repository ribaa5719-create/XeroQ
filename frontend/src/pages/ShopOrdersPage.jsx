import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, FileText, LoaderCircle, PackageCheck, Store, UserCheck, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { shopOrderApi } from '../services/shopOrderApi'

const formatOrderId = (orderId) => String(orderId).slice(-8)
const uniqueOrders = (orders) => Array.from(new Map(orders.map((order) => [order.id, order])).values())

function ShopOrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeAction, setActiveAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const requestInFlight = useRef(false)
  const requestVersion = useRef(0)
  const isMounted = useRef(true)

  const loadPendingOrders = useCallback(async () => {
    if (requestInFlight.current) return

    requestInFlight.current = true
    const currentRequestVersion = requestVersion.current
    try {
      const response = await shopOrderApi.getPendingOrders()
      if (isMounted.current && currentRequestVersion === requestVersion.current) {
        setOrders(uniqueOrders(response.data.orders || []))
        setErrorMessage('')
      }
    } catch (error) {
      if (isMounted.current) {
        setErrorMessage(error.response?.status === 403 ? 'You do not have permission to view shop orders.' : error.response?.data?.message || 'Unable to load pending orders.')
      }
    } finally {
      requestInFlight.current = false
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    const initialRequest = window.setTimeout(loadPendingOrders, 0)
    const interval = window.setInterval(loadPendingOrders, 5000)

    return () => {
      isMounted.current = false
      window.clearTimeout(initialRequest)
      window.clearInterval(interval)
    }
  }, [loadPendingOrders])

  const handleAction = async (orderId, action) => {
    if (action === 'reject' && !window.confirm('Reject this order?')) return

    requestVersion.current += 1
    setActiveAction(`${action}:${orderId}`)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (action === 'accept') {
        await shopOrderApi.acceptOrder(orderId)
        setSuccessMessage('Order accepted and added to the shop queue.')
      } else {
        await shopOrderApi.rejectOrder(orderId)
        setSuccessMessage('Order rejected.')
      }
      if (isMounted.current) setOrders((currentOrders) => currentOrders.filter((order) => order.id !== orderId))
    } catch (error) {
      if (isMounted.current) setErrorMessage(error.response?.status === 409 ? 'This order has already changed status.' : error.response?.data?.message || 'Unable to update the order.')
    } finally {
      if (isMounted.current) setActiveAction('')
    }
  }

  return (
    <div className="app-shell queue-shell">
      <div className="container queue-container">
        <div className="queue-topbar">
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
          <div className="queue-navigation"><Link to="/shop/dashboard" className="back-link"><ArrowLeft size={16} /> Dashboard</Link><Link to="/shop/queue" className="back-link"><PackageCheck size={16} /> Shop Queue</Link></div>
        </div>
        <div className="queue-heading">
          <span className="section-tag"><PackageCheck size={15} /> Shop orders</span>
          <h1>Incoming print orders ({orders.length})</h1>
          <p>Review new customer requests and send accepted orders to the active print queue.</p>
        </div>
        {successMessage && <div className="queue-success"><CheckCircle2 size={18} /> {successMessage}</div>}
        {errorMessage && <div className="auth-error queue-message"><AlertCircle size={18} /> {errorMessage}</div>}
        {isLoading ? <div className="queue-empty dashboard-card"><LoaderCircle className="spin-icon" size={28} /><p>Loading pending orders...</p></div> : orders.length === 0 ? <div className="queue-empty dashboard-card"><PackageCheck size={30} /><h2>No pending orders.</h2><p>New customer orders will appear here when they are placed for your shop.</p></div> : <div className="shop-orders-list">{orders.map((order) => <PendingOrderCard key={order.id} order={order} activeAction={activeAction} onAction={handleAction} />)}</div>}
      </div>
    </div>
  )
}

function PendingOrderCard({ order, activeAction, onAction }) {
  const isWorking = activeAction.endsWith(`:${order.id}`)
  const isAccepting = activeAction === `accept:${order.id}`
  const isRejecting = activeAction === `reject:${order.id}`

  return (
    <article className="shop-order-card dashboard-card">
      <div className="shop-order-card-header">
        <div><span className="card-kicker">Order {formatOrderId(order.id)}</span><h2>{order.originalFileName}</h2></div>
        <span className="queue-status pending">Pending</span>
      </div>
      <div className="shop-order-customer"><UserCheck size={17} /><span>{order.customer?.name || 'Student customer'}</span></div>
      <div className="queue-order-details shop-order-details">
        <span><FileText size={15} /> {order.pageCount} page{order.pageCount === 1 ? '' : 's'} · {order.copies} cop{order.copies === 1 ? 'y' : 'ies'}</span>
        <span><Store size={15} /> {order.printType === 'bw' ? 'B/W' : 'Colour'} · {order.paperSize} · {order.printSide === 'single' ? 'Single-side' : 'Double-side'}</span>
        <span><Clock3 size={15} /> {new Date(order.createdAt).toLocaleString()}</span>
        <span><strong>₹{order.estimatedTotal}</strong> · {order.priority === 'urgent' ? 'Urgent' : 'Normal'}</span>
      </div>
      <div className="shop-order-actions">
        <button type="button" className="primary-button" disabled={isWorking} onClick={() => onAction(order.id, 'accept')}><CheckCircle2 size={16} /> {isAccepting ? 'Accepting...' : 'Accept'}</button>
        <button type="button" className="secondary-button" disabled={isWorking} onClick={() => onAction(order.id, 'reject')}><XCircle size={16} /> {isRejecting ? 'Rejecting...' : 'Reject'}</button>
      </div>
    </article>
  )
}

export default ShopOrdersPage