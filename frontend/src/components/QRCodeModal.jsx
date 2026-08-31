import { X } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import TokenDisplay from './TokenDisplay'

function QRCodeModal({ order, onClose }) {
  const [qrUrl, setQrUrl] = useState('')
  const payload = JSON.stringify({ orderId: order.id, token: order.token })

  useEffect(() => {
    let isMounted = true
    QRCode.toDataURL(payload, { width: 260, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (isMounted) setQrUrl(url)
      })
      .catch(() => {
        if (isMounted) setQrUrl('')
      })

    return () => {
      isMounted = false
    }
  }, [payload])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div><span className="card-kicker">Order Ready</span><h2 id="qr-modal-title">Show QR Code</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close QR code" title="Close QR code"><X size={18} /></button>
        </div>
        <TokenDisplay token={order.token} />
        {qrUrl ? <img className="qr-image" src={qrUrl} alt={`Collection QR code for token ${order.token}`} /> : <p className="qr-loading">Generating QR code...</p>}
        <p className="qr-instruction">Show this QR code at the Xerox shop.</p>
        <button type="button" className="secondary-button modal-close-button" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

export default QRCodeModal
