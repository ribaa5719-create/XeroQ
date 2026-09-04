import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import RecoveryCodeModal from '../components/RecoveryCodeModal'
import { useAuth } from '../context/useAuth'
import { authApi } from '../services/api'

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  securityHint: '',
  securityAnswer: '',
  role: 'student',
  acceptTerms: false,
}

function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = (values) => {
    const nextErrors = {}

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!values.phone.trim()) {
      nextErrors.phone = 'Phone number is required.'
    } else if (!/^[0-9]{10,15}$/.test(values.phone.replace(/\s+/g, ''))) {
      nextErrors.phone = 'Please enter a valid phone number.'
    }

    if (!values.password) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.'
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!values.securityHint.trim()) {
      nextErrors.securityHint = 'Security hint is required.'
    }

    if (!values.securityAnswer.trim()) {
      nextErrors.securityAnswer = 'Security answer is required.'
    }

    if (!values.role) {
      nextErrors.role = 'Please select a role.'
    }

    if (!values.acceptTerms) {
      nextErrors.acceptTerms = 'You must accept the terms and conditions.'
    }

    return nextErrors
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'radio' ? checked || value : value,
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
      const payload = {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        securityHint: form.securityHint.trim(),
        securityAnswer: form.securityAnswer,
        role: form.role === 'shop_owner' ? 'shop_owner' : 'student',
      }

      const response = await authApi.register(payload)
      const authToken = response.data.token
      const user = response.data.user
      setRecoveryCode(response.data.recoveryCode)

      await login(user, authToken)
    } catch (error) {
      const backendMessage = error.response?.data?.message || 'Unable to create your account. Please try again.'
      setRequestError(backendMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout title={recoveryCode ? 'Save your recovery code' : 'Create your account'} subtitle={recoveryCode ? 'This code is shown once. Store it securely to recover your account.' : 'Join XeroQ to discover nearby Xerox shops and print faster.'}>
      {!recoveryCode ? <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="fullName">Full name</label>
          <div className={`input-wrap ${errors.fullName ? 'has-error' : ''}`}>
            <User size={18} className="field-icon" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

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
          <label htmlFor="phone">Phone number</label>
          <div className={`input-wrap ${errors.phone ? 'has-error' : ''}`}>
            <Phone size={18} className="field-icon" />
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              autoComplete="tel"
            />
          </div>
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
            <Lock size={18} className="field-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
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
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className={`input-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
            <Lock size={18} className="field-icon" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="visibility-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="securityHint">Security hint</label>
          <input id="securityHint" name="securityHint" type="text" value={form.securityHint} onChange={handleChange} placeholder="e.g. My phone password" autoComplete="off" />
          {errors.securityHint && <span className="field-error">{errors.securityHint}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="securityAnswer">Security answer</label>
          <input id="securityAnswer" name="securityAnswer" type="text" value={form.securityAnswer} onChange={handleChange} placeholder="Enter your answer" autoComplete="off" />
          {errors.securityAnswer && <span className="field-error">{errors.securityAnswer}</span>}
        </div>

        <div className="field-group">
          <label>Role</label>
          <div className="role-options" role="radiogroup" aria-label="Select your role">
            <label className={`role-option ${form.role === 'student' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={form.role === 'student'}
                onChange={handleChange}
              />
              <span>Student/User</span>
            </label>

            <label className={`role-option ${form.role === 'shop_owner' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value="shop_owner"
                checked={form.role === 'shop_owner'}
                onChange={handleChange}
              />
              <span>Xerox Shop Owner</span>
            </label>
          </div>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </div>

        <div className="form-options">
          <label className="checkbox-row terms-row">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
            />
            <span>
              I agree to the <a href="#">terms and conditions</a>
            </span>
          </label>
          {errors.acceptTerms && <span className="field-error inline-error">{errors.acceptTerms}</span>}
        </div>

        {requestError && <div className="auth-error">{requestError}</div>}

        <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form> : <RecoveryCodeModal
        title="Account created successfully"
        message="Save your new recovery code somewhere safe."
        recoveryCode={recoveryCode}
        onContinue={() => navigate('/login', { replace: true })}
        onCopyError={setRequestError}
      />}

      <div className="auth-switch">
        <span>Already have an account?</span>
        <Link to="/login">Login here</Link>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
