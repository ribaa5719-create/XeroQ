import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, FileText, LoaderCircle, MapPin, RefreshCw, Star, Store, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '../services/orderApi'
import QRCodeModal from '../components/QRCodeModal'
import TokenDisplay from '../components/TokenDisplay'
import RatingReviewForm from '../components/RatingReviewForm'
import { reviewApi } from '../services/reviewApi'

const statusLabels = {
  pending: 'Pending', accepted: 'Accepted', printing: 'Printing', ready: 'Ready for Collection', completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
}

const statusIcons = { completed: CheckCircle2, rejected: XCircle, cancelled: XCircle }
const activeStatuses = ['pending', 'accepted', 'printing', 'ready']
const reorderStatuses = ['completed', 'rejected', 'cancelled']

function OrderDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [review, setReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const loadOrder = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await orderApi.getById(id)
      setOrder(response.data.order)
      if (response.data.order.status === 'completed') {
        const reviewResponse = await reviewApi.getForOrder(id).catch(() => null)
        if (reviewResponse) setReview(reviewResponse.data.review)
      }
    } catch (error) {
      setErrorMessage(error.response?.status === 401 ? 'Please log in to view this order.' : error.response?.status === 403 ? 'You do not have access to this order.' : error.response?.status === 404 ? 'Order not found.' : 'Unable to load order details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    const request = window.setTimeout(loadOrder, 0)
    return () => window.clearTimeout(request)
  }, [loadOrder])

  if (isLoading) return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><LoaderCircle size={30} className="spin-icon" /><p>Loading order details...</p></div></div></div>
  if (errorMessage) return <div className="app-shell page-shell"><div className="container placeholder-wrap"><div className="placeholder-card"><AlertCircle size={30} /><h1>Order unavailable</h1><p>{errorMessage}</p><div className="details-actions"><Link to="/orders" className="secondary-button">Back to Orders</Link><button type="button" className="primary-button" onClick={loadOrder}><RefreshCw size={17} /> Retry</button></div></div></div></div>

  const StatusIcon = statusIcons[order.status] || Clock3
  const shop = order.shopDetails
  const isActive = activeStatuses.includes(order.status)
  const canReorder = reorderStatuses.includes(order.status) && shop

  const handleReorder = () => {
    if (!shop || shop.approvalStatus !== 'approved' || shop.availability === 'closed') return
    navigate('/upload-print', {
      state: {
        reorder: order,
        shop,
      },
    })
  }

  return (
    <div className="app-shell orders-shell">
      <div className="container order-details-container">
        <div className="orders-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/orders" className="back-link"><ArrowLeft size={16} /> Back to Orders</Link></div>
        <div className="order-details-heading"><div><span className="section-tag"><FileText size={15} /> Order details</span><h1>Order {String(order.id).slice(-8)}</h1><p>Placed {new Date(order.createdAt).toLocaleString()}</p></div><span className={`order-status ${order.status}`}><StatusIcon size={15} /> {statusLabels[order.status] || order.status}</span></div>
        <div className="order-details-grid">
          <section className="dashboard-card order-details-card">
            <div className="detail-section-heading"><Store size={19} /><h2>Shop</h2></div>
            <div className="order-detail-shop"><strong>{shop?.name || 'Shop details unavailable'}</strong>{shop && <span><MapPin size={15} /> {shop.address}, {shop.city}</span>}</div>
            <div className="detail-section-heading"><FileText size={19} /><h2>Print setup</h2></div>
            <div className="summary-list">
              <div><span>PDF filename</span><strong>{order.originalFileName}</strong></div>
              <div><span>Page count</span><strong>{order.pageCount}</strong></div>
              <div><span>Copies</span><strong>{order.copies}</strong></div>
              <div><span>Print type</span><strong>{order.printType === 'bw' ? 'B/W' : 'Colour'}</strong></div>
              <div><span>Paper size</span><strong>{order.paperSize}</strong></div>
              <div><span>Print side</span><strong>{order.printSide === 'single' ? 'Single-side' : 'Double-side'}</strong></div>
              <div><span>Priority</span><strong>{order.priority === 'urgent' ? 'Urgent Print 🚨' : 'Normal Print'}</strong></div>
              <div><span>Estimated total</span><strong>₹{order.estimatedTotal}</strong></div>
              <div><span>Payment Method</span><strong>{order.paymentMethod === 'online' ? 'Online Payment' : 'Pay at Shop'}</strong></div>
              <div><span>Payment Status</span><strong>{order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'failed' ? 'Failed' : order.paymentStatus === 'not_applicable' ? 'Not applicable' : 'Unpaid'}</strong></div>
            </div>
            <div className="detail-section-heading"><Clock3 size={19} /><h2>Status timeline</h2></div>
            <div className="order-timestamps"><span>Created: {new Date(order.createdAt).toLocaleString()}</span>{order.updatedAt && <span>Updated: {new Date(order.updatedAt).toLocaleString()}</span>}</div>
          </section>
          <aside className="dashboard-card order-action-card">
            <span className="card-kicker">Collection token</span>
            {order.token ? <TokenDisplay token={order.token} /> : <strong className="details-token">Not assigned yet</strong>}
            {order.status === 'ready' && <div className="collection-actions"><button type="button" className="primary-button" onClick={() => setShowQr(true)}>Show QR Code</button><button type="button" className="secondary-button">Show Token</button></div>}
            {isActive && <Link to={`/live-queue?orderId=${order.id}`} className="primary-button"><Clock3 size={17} /> Track Queue</Link>}
            {order.status === 'completed' && (review ? <div className="existing-review"><strong><Star size={16} fill="currentColor" /> Your Rating: {review.rating}/5</strong>{review.comment && <span>{review.comment}</span>}</div> : showReviewForm ? <RatingReviewForm orderId={order.id} onCancel={() => setShowReviewForm(false)} onSubmitted={(submittedReview) => { setReview(submittedReview); setShowReviewForm(false) }} /> : <button type="button" className="secondary-button" onClick={() => setShowReviewForm(true)}><Star size={17} /> Rate Shop</button>)}
            {order.status === 'rejected' && <p className="final-state-copy">This order was rejected by the shop.</p>}
            {order.status === 'cancelled' && <p className="final-state-copy">This order was cancelled.</p>}
            {canReorder && <button type="button" className="primary-button" onClick={handleReorder}><RefreshCw size={17} /> Reorder</button>}
            {reorderStatuses.includes(order.status) && shop && (shop.approvalStatus !== 'approved' || shop.availability === 'closed') && <p className="final-state-copy">This shop is currently unavailable. Please choose another shop.</p>}
          </aside>
        </div>
      </div>
      {showQr && <QRCodeModal order={order} onClose={() => setShowQr(false)} />}
    </div>
  )
}

export default OrderDetailsPage
