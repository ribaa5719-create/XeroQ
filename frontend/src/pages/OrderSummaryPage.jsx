import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, FileText, LoaderCircle, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { orderApi } from '../services/orderApi'
import { printFlowStore } from '../services/printFlowStore'
import PaymentMethodSelector from '../components/PaymentMethodSelector'

function OrderSummaryPage() {
  const { state } = useLocation()
  const shop = state?.shop
  const configuration = state?.configuration
  const options = configuration?.options
  const hasEstimate = Boolean(configuration?.pageCount && options && shop)
  const estimate = hasEstimate ? configuration.pageCount * options.copies * Number(options.printType === 'bw' ? shop.bwPrice : shop.colorPrice) : null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pay_at_shop')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const selectedFile = configuration?.file || printFlowStore.getFile()

  const handlePlaceOrder = async () => {
    if (isSubmitting) return

    if (!isAuthenticated) {
      setErrorMessage('Please log in before placing an order.')
      return
    }

    if (!selectedFile || !shop?.id || !options) {
      setErrorMessage('Your print setup is incomplete. Please return to Print Setup and try again.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('shopId', shop.id)
    formData.append('printType', options.printType)
    formData.append('copies', String(options.copies))
    formData.append('paperSize', options.paperSize)
    formData.append('printSide', options.side)
    formData.append('priority', options.priority || 'normal')
    formData.append('paymentMethod', paymentMethod)

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await orderApi.create(formData)
      const createdOrder = response.data.order
      setSuccessMessage('Order placed successfully.')
      printFlowStore.clear()
      navigate(`/live-queue?orderId=${createdOrder.id}`, {
        state: { orderId: createdOrder.id, shop },
      })
    } catch (error) {
      const status = error.response?.status
      const backendMessage = error.response?.data?.message
      setErrorMessage(status === 401 ? 'Your session has expired. Please log in again.' : status === 403 ? 'You are not authorized to place this order.' : status === 404 ? 'The selected shop could not be found or is not approved.' : status === 413 ? 'Your PDF is too large. Maximum size is 25 MB.' : backendMessage || 'Unable to place your order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!shop || !configuration || !options || !selectedFile) {
    return (
      <div className="app-shell page-shell">
        <div className="container placeholder-wrap">
          <div className="placeholder-card">
            <FileText size={30} />
            <h1>PDF no longer available</h1>
            <p>Your temporary PDF is no longer available. Return to Print Setup and select it again before placing an order.</p>
            <Link to="/upload-print" className="primary-button">Back to Print Setup</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell print-shell">
      <div className="container print-container summary-container">
        <div className="print-topbar">
          <Link to="/upload-print" state={{ shop, configuration }} className="back-link"><ArrowLeft size={16} /> Back to Edit</Link>
          <Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link>
        </div>

        <div className="print-heading">
          <span className="section-tag"><CheckCircle2 size={15} /> Review setup</span>
          <h1>Order summary</h1>
          <p>Review your print preferences before placing the order.</p>
        </div>

        <div className="summary-layout">
          <section className="dashboard-card summary-card">
            <div className="summary-shop"><Store size={20} /><div><span className="card-kicker">Selected shop</span><h2>{shop.name}</h2><p>{shop.address}, {shop.city}</p></div></div>
            <div className="summary-file"><FileText size={20} /><div><span className="card-kicker">PDF file</span><strong>{configuration.fileName}</strong><span>{(configuration.fileSize / (1024 * 1024)).toFixed(2)} MB</span></div></div>
            <div className="summary-list">
              <div><span>Print type</span><strong>{options.printType === 'bw' ? 'B/W' : 'Colour'}</strong></div>
              <div><span>Payment</span><strong>Pay at Shop</strong></div>
              <div><span>Priority</span><strong>{options.priority === 'urgent' ? 'Urgent Print 🚨' : 'Normal Print'}</strong></div>
              <div><span>Copies</span><strong>{options.copies}</strong></div>
              <div><span>Paper size</span><strong>{options.paperSize}</strong></div>
              <div><span>Printing side</span><strong>{options.side === 'single' ? 'Single-side' : 'Double-side'}</strong></div>
              <div><span>Page count</span><strong>{configuration.pageCount || 'Unavailable'}</strong></div>
              <div><span>Price per page</span><strong>₹{options.printType === 'bw' ? shop.bwPrice : shop.colorPrice}</strong></div>
            </div>
            <PaymentMethodSelector value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
            <div className="summary-total"><span>Estimated total</span><strong>{estimate === null ? 'Pending page count' : `₹${estimate}`}</strong></div>
            {errorMessage && <div className="auth-error summary-message"><AlertCircle size={18} /> {errorMessage}</div>}
            {successMessage && <div className="auth-success summary-message"><CheckCircle2 size={18} /> {successMessage}</div>}
            <div className="summary-actions"><Link to="/upload-print" state={{ shop, configuration }} className="secondary-button">Back to Edit</Link><button type="button" className="primary-button" onClick={handlePlaceOrder} disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle size={17} className="spin-icon" /> Placing Order...</> : <><Clock3 size={17} /> Place Order</>}</button></div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default OrderSummaryPage
