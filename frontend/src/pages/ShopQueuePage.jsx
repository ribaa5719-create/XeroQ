import { AlertCircle, ArrowLeft, Banknote, CheckCircle2, Clock3, FileText, LoaderCircle, ListOrdered, Play, Printer, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { queueApi } from '../services/queueApi'
import { shopOrderApi } from '../services/shopOrderApi'
import CollectionVerification from '../components/CollectionVerification'

const actionByStatus = {
  accepted: { label: 'Start Printing', icon: Play, action: shopOrderApi.startPrinting },
  printing: { label: 'Mark Ready', icon: CheckCircle2, action: shopOrderApi.markReady },
  ready: { label: 'Complete', icon: CheckCircle2, action: shopOrderApi.complete },
}

function ShopQueuePage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeAction, setActiveAction] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadQueue = useCallback(async () => {
    try {
      const response = await queueApi.getShopQueue()
      setOrders(response.data.orders)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 403 ? 'You do not have permission to view this shop queue.' : error.response?.data?.message || 'Unable to load the shop queue.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialRequest = window.setTimeout(loadQueue, 0)
    return () => window.clearTimeout(initialRequest)
  }, [loadQueue])

  const handleAction = async (orderId, action) => {
    setActiveAction(orderId)
    setMessage('')
    setErrorMessage('')
    try {
      await action(orderId)
      setMessage('Order status updated successfully.')
      await loadQueue()
    } catch (error) {
      setErrorMessage(error.response?.status === 409 ? 'This order has already moved to another status.' : error.response?.data?.message || 'Unable to update order status.')
    } finally {
      setActiveAction('')
    }
  }

  return (
    <div className="app-shell queue-shell">
      <div className="container queue-container">
        <div className="queue-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/shop/dashboard" className="back-link"><ArrowLeft size={16} /> Dashboard</Link></div>
        <div className="queue-heading"><span className="section-tag"><ListOrdered size={15} /> Shop queue</span><h1>Active print queue</h1><p>Move accepted orders through printing and completion as work progresses.</p></div>
        {message && <div className="queue-success"><CheckCircle2 size={18} /> {message}</div>}
        {errorMessage && <div className="auth-error queue-message"><AlertCircle size={18} /> {errorMessage}</div>}
        {isLoading ? <div className="queue-empty dashboard-card"><LoaderCircle className="spin-icon" size={28} /><p>Loading active orders...</p></div> : orders.length === 0 ? <div className="queue-empty dashboard-card"><ListOrdered size={30} /><h2>No active orders in the queue.</h2><p>Accepted orders will appear here in token order.</p></div> : <div className="shop-queue-list">{orders.map((order) => <ShopQueueCard key={order.id} order={order} isWorking={activeAction === order.id} onAction={handleAction} />)}</div>}
        <CollectionVerification />
      </div>
    </div>
  )
}

function ShopQueueCard({ order, isWorking, onAction }) {
  const actionConfig = actionByStatus[order.status]
  const ActionIcon = actionConfig?.icon
  return (
    <article className="shop-queue-card dashboard-card">
      <div className="shop-queue-token"><span>{order.token}</span><span className={`queue-status ${order.status}`}>{order.status}</span><span className={`priority-badge compact ${order.priority === 'urgent' ? 'urgent' : 'normal'}`}>{order.priority === 'urgent' ? 'Urgent 🚨' : 'Normal'}</span></div>
      <div className="shop-queue-main"><div className="queue-customer"><UserCheck size={18} /><div><strong>{order.customer?.name || 'Customer'}</strong><span>{order.customer?.email || 'Customer details unavailable'}</span></div></div><div className="queue-order-details"><span><FileText size={15} /> {order.pageCount} page{order.pageCount === 1 ? '' : 's'} · {order.copies} cop{order.copies === 1 ? 'y' : 'ies'}</span><span><Printer size={15} /> {order.printType === 'bw' ? 'B/W' : 'Colour'} · {order.paperSize} · {order.printSide === 'single' ? 'Single-side' : 'Double-side'}</span><span><Clock3 size={15} /> {new Date(order.createdAt).toLocaleString()}</span><span><Banknote size={15} /> {order.paymentMethod === 'online' ? 'Online Payment' : 'Pay at Shop'} · {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</span></div></div>
      {actionConfig && <button type="button" className="primary-button queue-action" disabled={isWorking} onClick={() => onAction(order.id, actionConfig.action)}>{isWorking ? 'Updating...' : <><ActionIcon size={16} /> {actionConfig.label}</>}</button>}
    </article>
  )
}

export default ShopQueuePage
