import { Link } from 'react-router-dom'

function PlaceholderPage({ title, description, badge = 'Page' }) {
  return (
    <div className="app-shell page-shell">
      <div className="container placeholder-wrap">
        <div className="placeholder-card">
          <span className="section-tag">{badge}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <Link to="/" className="primary-button">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage
