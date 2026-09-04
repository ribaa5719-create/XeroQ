import { Check, Clipboard } from 'lucide-react'
import { useEffect, useState } from 'react'

function RecoveryCodeModal({ title, message, recoveryCode, onContinue, onCopyError }) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return undefined

    const timeoutId = setTimeout(() => setIsCopied(false), 1800)
    return () => clearTimeout(timeoutId)
  }, [isCopied])

  const handleCopyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode)
      setIsCopied(true)
    } catch {
      onCopyError?.('Unable to copy the recovery code. Please copy it manually.')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="recovery-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-modal-title">
        <span className="recovery-modal-icon"><Check size={22} /></span>
        <h2 id="recovery-modal-title">{title}</h2>
        <p className="recovery-modal-message">{message}</p>
        <p className="recovery-code-label">Your Recovery Code</p>
        <div className="recovery-code-box" aria-label="Your recovery code">{recoveryCode}</div>
        <p className="recovery-modal-warning">Save this code somewhere safe. You won't be able to view it again.</p>
        <div className="recovery-modal-actions">
          <button type="button" className="secondary-button" onClick={handleCopyRecoveryCode}>
            {isCopied ? <Check size={18} /> : <Clipboard size={18} />}
            {isCopied ? 'Copied!' : 'Copy Recovery Code'}
          </button>
          <button type="button" className="primary-button" onClick={onContinue}>
            Continue to Login
          </button>
        </div>
      </section>
    </div>
  )
}

export default RecoveryCodeModal