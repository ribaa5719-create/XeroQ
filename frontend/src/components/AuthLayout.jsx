import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="app-shell auth-shell">
      <div className="container auth-page">
        <div className="auth-panel">
          <div className="auth-brand" aria-label="XeroQ home">
            <Link to="/" className="brand auth-brand-link">
              <div className="brand-mark">X</div>
              <span>XeroQ</span>
            </Link>
          </div>

          <div className="auth-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          {children}

          <div className="auth-back-link">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
