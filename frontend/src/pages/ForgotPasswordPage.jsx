import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Email is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authApi.forgotPassword(email)
      setMessage(response.data.message)
      setEmail('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the password reset email right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we will send a secure reset link if an account exists.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <div className={`input-wrap ${error ? 'has-error' : ''}`}>
            <Mail size={18} className="field-icon" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {error && <span className="field-error">{error}</span>}
        </div>

        {message && <div className="auth-success">{message}</div>}

        <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className="auth-switch">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
