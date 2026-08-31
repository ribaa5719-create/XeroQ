import { AlertCircle, CheckCircle2, ClipboardCheck, LoaderCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { shopOrderApi } from '../services/shopOrderApi'
import TokenDisplay from './TokenDisplay'

function CollectionVerification() {
  const [token, setToken] = useState('')
  const [order, setOrder] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCollecting, setIsCollecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const verifyOrder = async (event) => {
    event.preventDefault()
    if (!token.trim()) {
      setErrorMessage('Enter a collection token.')
      return
    }

    setIsVerifying(true)
    setErrorMessage('')
    setSuccessMessage('')
    setOrder(null)
    try {
      const response = await shopOrderApi.verifyCollection(token.trim().toUpperCase())
      setOrder(response.data.order)
      setSuccessMessage('Order verified')
    } catch (error) {
      setErrorMessage(error.response?.status === 409 ? 'This order is not ready for collection.' : error.response?.status === 404 ? 'No ready order found for this token.' : error.response?.data?.message || 'Unable to verify this order.')
    } finally {
      setIsVerifying(false)
    }
  }

  const markCollected = async () => {
    if (!order || isCollecting) return
    setIsCollecting(true)
    setErrorMessage('')
    try {
      await shopOrderApi.complete(order.orderId)
      setSuccessMessage('Order marked collected.')
      setOrder((current) => ({ ...current, status: 'completed' }))
    } catch (error) {
      setErrorMessage(error.response?.status === 409 ? 'This order is no longer ready for collection.' : error.response?.data?.message || 'Unable to mark order collected.')
    } finally {
      setIsCollecting(false)
    }
  }

  return (
    <section className="dashboard-card collection-card">
      <div className="card-title-row"><div><span className="card-kicker">Secure pickup</span><h2>Verify collection</h2></div><ClipboardCheck size={22} className="card-icon" /></div>
      <p>Enter the customer’s token to verify a ready order before handing over printed documents.</p>
      <form className="collection-form" onSubmit={verifyOrder}><label htmlFor="collection-token">Token</label><div className="collection-input"><input id="collection-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="e.g. Q003" autoComplete="off" /><button type="submit" className="primary-button" disabled={isVerifying}>{isVerifying ? <LoaderCircle size={17} className="spin-icon" /> : <Search size={17} />} Verify</button></div></form>
      {errorMessage && <div className="auth-error collection-message"><AlertCircle size={17} /> {errorMessage}</div>}
      {successMessage && <div className="auth-success collection-message"><CheckCircle2 size={17} /> {successMessage}</div>}
      {order && order.status !== 'completed' && <div className="verified-order"><TokenDisplay token={order.token} /><strong>Order verified</strong><span>Hand over the printed documents to the customer.</span><div className="verified-order-details"><span>{order.customerName}</span><span>{order.pageCount} page{order.pageCount === 1 ? '' : 's'} · {order.copies} cop{order.copies === 1 ? 'y' : 'ies'}</span><span>{order.printType === 'bw' ? 'B/W' : 'Colour'} · {order.paperSize} · {order.printSide === 'single' ? 'Single-side' : 'Double-side'}</span></div><button type="button" className="primary-button" onClick={markCollected} disabled={isCollecting}>{isCollecting ? 'Marking...' : 'Mark Collected'}</button></div>}
    </section>
  )
}

export default CollectionVerification
