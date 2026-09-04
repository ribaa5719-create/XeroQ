import { KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!identifier.trim() || !recoveryCode.trim()) {
      setError('Email or username and recovery code are required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.forgotPassword({ identifier, recoveryCode })
      setMessage(response.data.message)
      window.location.assign(`/reset-password?authorization=${encodeURIComponent(response.data.resetAuthorization)}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify your recovery details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Use your account identifier and saved recovery code to continue."
    >
      <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="identifier">Email or username</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <UserRound size={18} className="field-icon" />
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email or username"
              autoComplete="username"
            />
          </div>
          {error && <span className="field-error">{error}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="recoveryCode">Recovery code</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <KeyRound size={18} className="field-icon" />
            <input
              id="recoveryCode"
              name="recoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
              placeholder="Enter your recovery code"
              autoComplete="off"
            />
          </div>
        </div>

        {message && <div className="auth-success">{message}</div>}

        <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking...' : 'Continue'}
        </button>
      </form>

      <div className="auth-switch">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
