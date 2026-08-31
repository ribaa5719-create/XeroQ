import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/useAuth'
import { authApi } from '../services/api'

const initialForm = {
  email: '',
  password: '',
  remember: true,
}

function LoginPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requestError, setRequestError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = (values) => {
    const nextErrors = {}

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.'
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    if (requestError) {
      setRequestError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setRequestError('')

    try {
      const response = await authApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })

      const authToken = response.data.token
      const user = response.data.user

      await login(user, authToken)

      if (user.role === 'student') {
        navigate('/')
      } else if (user.role === 'shop_owner') {
        navigate('/shop/dashboard')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      const backendMessage = error.response?.data?.message || 'Unable to log in. Please try again.'
      setRequestError(backendMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue printing smarter with XeroQ.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="email">Email</label>
          <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
            <Mail size={18} className="field-icon" />
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field-group">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <button type="button" className="text-button" onClick={(event) => event.preventDefault()}>
              Forgot password?
            </button>
          </div>

          <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
            <Lock size={18} className="field-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
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
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="form-options">
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
            />
            <span>Remember me</span>
          </label>
        </div>

        {requestError && <div className="auth-error">{requestError}</div>}

        <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="auth-switch">
        <span>New to XeroQ?</span>
        <Link to="/register">Create an account</Link>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
