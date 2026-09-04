import { KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState('recoveryCode')
  const [securityHint, setSecurityHint] = useState('')
  const navigate = useNavigate()
  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!identifier.trim()) {
      setError('Email or username is required.')
      return
    }

    if (!recoveryCode.trim()) {
      setError(mode === 'recoveryCode' ? 'Recovery code is required.' : 'Security answer is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.forgotPassword(mode === 'recoveryCode'
        ? { identifier, recoveryCode }
        : { identifier, securityAnswer: recoveryCode, recoveryMethod: 'securityHint' })
      navigate(`/reset-password?authorization=${encodeURIComponent(response.data.resetAuthorization)}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify your recovery details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectSecurityAnswerMode = async () => {
    setError('')
    setMessage('')
    if (!identifier.trim()) {
      setError('Enter your email or username first.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.forgotPassword({ identifier, recoveryMethod: 'securityHint' })
      const nextHint = response?.data?.securityHint?.trim()

      if (!nextHint) {
        throw new Error('Security hint is unavailable for this account.')
      }

      setSecurityHint(nextHint)
      setRecoveryCode('')
      setMode('securityAnswer')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Security hint fallback is unavailable.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectRecoveryCodeMode = () => {
    setMode('recoveryCode')
    setSecurityHint('')
    setRecoveryCode('')
    setError('')
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={mode === 'recoveryCode' ? 'Use your account identifier and saved recovery code to continue.' : 'Use your saved security hint to continue.'}
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
          <label htmlFor="recoveryCode">{mode === 'recoveryCode' ? 'Recovery Code' : 'Security Answer'}</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <KeyRound size={18} className="field-icon" />
            <input
              id="recoveryCode"
              name="recoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(mode === 'recoveryCode' ? event.target.value.toUpperCase() : event.target.value)}
              placeholder={mode === 'recoveryCode' ? 'Enter your recovery code' : 'Enter your security answer'}
              autoComplete="off"
            />
          </div>
        </div>

        {mode === 'securityAnswer' && securityHint && <div className="auth-success"><strong>Security Hint</strong><br />{securityHint}</div>}

        {message && <div className="auth-success">{message}</div>}

        <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Checking...' : 'Continue'}
        </button>

        {mode === 'recoveryCode' && <button type="button" className="secondary-button auth-submit" onClick={selectSecurityAnswerMode} disabled={isSubmitting}>
          Forgot your Recovery Code?
        </button>}

        {mode === 'securityAnswer' && <button type="button" className="secondary-button auth-submit" onClick={selectRecoveryCodeMode} disabled={isSubmitting}>
          Reset using Recovery Code
        </button>}
      </form>

      <div className="auth-switch">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
