import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Hash, ListOrdered, LoaderCircle, Store } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { queueApi } from '../services/queueApi'

const terminalStatuses = ['completed', 'rejected', 'cancelled']

const statusCopy = {
  pending: 'Waiting for shop acceptance',
  accepted: 'Accepted',
  printing: 'Printing now',
  ready: 'Ready for collection',
  completed: 'Completed',
  rejected: 'Order rejected',
  cancelled: 'Order cancelled',
}

function LiveQueuePage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const orderId = location.state?.orderId || searchParams.get('orderId')
  const shopName = location.state?.shop?.name || 'Selected shop'
  const [queue, setQueue] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(orderId))
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const queueRef = useRef(null)

  const fetchQueue = useCallback(async (showLoading = false) => {
    if (!orderId) return
    if (showLoading) setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await queueApi.getStudentQueue(orderId)
      setQueue(response.data.queue)
      queueRef.current = response.data.queue
    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const orderResponse = await queueApi.getOrder(orderId)
          const order = orderResponse.data.order
          const terminalQueue = { orderId: order.id, token: order.token, status: order.status, priority: order.priority || 'normal', currentServingToken: null, ordersAhead: null, queuePosition: null, estimatedWaitSeconds: 0, estimatedWaitMinutes: 0 }
          setQueue(terminalQueue)
          queueRef.current = terminalQueue
          return
        } catch (orderError) {
          setErrorMessage(orderError.response?.data?.message || 'Unable to load order information.')
          return
        }
      }

      setErrorMessage(error.response?.status === 404 ? 'This order could not be found.' : error.response?.status === 401 ? 'Please log in to view this queue.' : error.response?.data?.message || 'Unable to load queue information.')
    } finally {
      if (showLoading) setIsLoading(false)
      setIsUpdating(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId) return undefined
    const initialRequest = window.setTimeout(() => fetchQueue(true), 0)
    const interval = window.setInterval(() => {
      if (!queueRef.current || !terminalStatuses.includes(queueRef.current.status)) {
        setIsUpdating(true)
        fetchQueue()
      }
    }, 5000)
    return () => {
      window.clearTimeout(initialRequest)
      window.clearInterval(interval)
    }
  }, [fetchQueue, orderId])

  if (!orderId) {
    return <QueueEmptyState title="No active queue information available." description="Open Live Queue from an order created in the connected print flow." />
  }

  if (isLoading) {
    return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><LoaderCircle className="spin-icon" size={30} /><p>Loading your live queue...</p></div></div></div>
  }

  if (errorMessage) {
    return <QueueEmptyState title="Unable to load queue" description={errorMessage} error />
  }

  const currentStatus = queue?.status || 'pending'
  const isTerminal = terminalStatuses.includes(currentStatus)
  const waitMessage = currentStatus === 'printing'
    ? 'Printing now'
    : currentStatus === 'ready'
      ? 'Ready for collection'
      : currentStatus === 'pending'
        ? 'Waiting for shop acceptance'
        : isTerminal
          ? 'Waiting time unavailable'
          : queue?.estimatedWaitMinutes === undefined || queue?.estimatedWaitMinutes === null
            ? 'Waiting time unavailable'
            : queue.estimatedWaitMinutes === 0
              ? 'Printing soon'
              : `Estimated wait: ${queue.estimatedWaitMinutes} min`

  return (
    <div className="app-shell queue-shell">
      <div className="container queue-container">
        <div className="queue-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link></div>
        <div className="queue-heading"><span className="section-tag"><ListOrdered size={15} /> Live queue</span><h1>Track your print order</h1><p>Follow your order status as it moves through the shop.</p></div>
        <div className="queue-shop-strip"><Store size={20} /><div><span className="card-kicker">Printing at</span><strong>{shopName}</strong></div>{isUpdating && <span className="updating-label"><LoaderCircle size={14} className="spin-icon" /> Updating queue...</span>}</div>
        <div className={`priority-badge ${queue?.priority === 'urgent' ? 'urgent' : 'normal'}`}>{queue?.priority === 'urgent' ? 'Urgent Print 🚨' : 'Normal Print'}</div>
        <div className="queue-status-banner"><CheckCircle2 size={23} /><div><strong>{statusCopy[currentStatus] || 'Order status updated'}</strong><span>Last updated: {queue ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span></div></div>
        <div className="queue-metrics">
          <QueueMetric icon={Hash} label="Your Token" value={queue?.token || '—'} />
          <QueueMetric icon={Store} label="Now Serving" value={queue?.currentServingToken || '—'} />
          <QueueMetric icon={Clock3} label="Orders Ahead" value={queue?.ordersAhead ?? '—'} />
          <QueueMetric icon={ListOrdered} label="Queue Position" value={queue?.queuePosition ?? '—'} />
        </div>
        <div className={`wait-time-card ${currentStatus}`}>
          <Clock3 size={20} />
          <div><span>Estimated Waiting Time</span><strong>{waitMessage}</strong></div>
        </div>
        {isTerminal && <div className="queue-terminal-note"><CheckCircle2 size={18} /> This order has reached a final status. Live updates are paused.</div>}
      </div>
    </div>
  )
}

function QueueMetric({ icon: Icon, label, value }) {
  return <div className="queue-metric"><div className="queue-metric-icon"><Icon size={20} /></div><span>{label}</span><strong>{value}</strong></div>
}

function QueueEmptyState({ title, description, error = false }) {
  return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card">{error ? <AlertCircle size={30} /> : <ListOrdered size={30} />}<h1>{title}</h1><p>{description}</p><Link to="/orders" className="primary-button">View My Orders</Link></div></div></div>
}

export default LiveQueuePage
