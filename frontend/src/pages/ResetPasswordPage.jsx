import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const resetAuthorization = new URLSearchParams(location.search).get('authorization') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!resetAuthorization) {
      setError('This password reset authorization is invalid or incomplete.')
      return
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.resetPassword({ resetAuthorization, password, confirmPassword })
      setMessage(response.data.message)
      setPassword('')
      setConfirmPassword('')
      navigate('/login', { replace: true, state: { message: response.data.message, recoveryCode: response.data.recoveryCode } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset the password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to finish resetting your account.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!resetAuthorization ? <div className="auth-error">This password reset authorization is invalid or expired.</div> : null}

        {resetAuthorization && <><div className="field-group">
          <label htmlFor="password">New password</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <Lock size={18} className="field-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="visibility-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <Lock size={18} className="field-icon" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="visibility-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <span className="field-error">{error}</span>}
        </div></>}

        {message && <div className="auth-success">{message}</div>}

        {resetAuthorization && <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>}
      </form>

      <div className="auth-switch">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  )
}

export default ResetPasswordPage
