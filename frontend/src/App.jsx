import {
  ArrowRight,
  Clock3,
  FileText,
  MapPin,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Upload,
} from 'lucide-react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationBell from './components/NotificationBell'
import { useAuth } from './context/useAuth'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PlaceholderPage from './pages/PlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import ShopDashboardPage from './pages/ShopDashboardPage'
import ShopDetailsPage from './pages/ShopDetailsPage'
import ShopsPage from './pages/ShopsPage'
import OrderSummaryPage from './pages/OrderSummaryPage'
import UploadPrintPage from './pages/UploadPrintPage'
import LiveQueuePage from './pages/LiveQueuePage'
import ShopQueuePage from './pages/ShopQueuePage'
import ShopOrdersPage from './pages/ShopOrdersPage'
import ShopAnalyticsPage from './pages/ShopAnalyticsPage'
import NotificationsPage from './pages/NotificationsPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminShopsPage from './pages/AdminShopsPage'
import './App.css'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Find Shops', path: '/shops' },
  { label: 'Login', path: '/login' },
  { label: 'Register', path: '/register' },
]

const flowSteps = [
  {
    icon: Upload,
    title: 'Upload PDF',
    description: 'Drop in your assignment, notes, or print-ready files.',
  },
  {
    icon: Search,
    title: 'Compare Shops',
    description: 'Check nearby stores, pricing, quality, and queue lengths.',
  },
  {
    icon: Printer,
    title: 'Place Order',
    description: 'Pick paper, finish, and delivery options in seconds.',
  },
  {
    icon: Clock3,
    title: 'Track Queue',
    description: 'Follow your job live and know exactly when it is ready.',
  },
  {
    icon: QrCode,
    title: 'Collect',
    description: 'Use your QR token to pick up prints without waiting in line.',
  },
]

const featureCards = [
  {
    icon: MapPin,
    title: 'Nearby Xerox Shops',
    description: 'Discover trusted printing shops close to campus, home, or office.',
  },
  {
    icon: Search,
    title: 'Compare Prices',
    description: 'View transparent rates for black-and-white, color, and binding.',
  },
  {
    icon: Clock3,
    title: 'Live Queue Tracking',
    description: 'See which shop is fastest and estimate when your job will be ready.',
  },
  {
    icon: Printer,
    title: 'Fast Printing',
    description: 'Get reliable document printing without the usual back-and-forth hassle.',
  },
  {
    icon: TimerReset,
    title: 'Urgent Print Mode',
    description: 'Need it fast? Prioritize express jobs for same-day or urgent deadlines.',
  },
  {
    icon: QrCode,
    title: 'QR/Token Collection',
    description: 'Collect your order with a quick scan and minimal waiting at pickup.',
  },
]

const trustStats = [
  { value: '300+', label: 'Xerox shops' },
  { value: '4.8/5', label: 'student rating' },
  { value: '15 min', label: 'average queue' },
]

function HomePage() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container navbar">
          <Link to="/" className="brand" aria-label="XeroQ home">
            <div className="brand-mark">X</div>
            <span>XeroQ</span>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.label} to={item.path} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                {user?.role === 'student' && <NotificationBell />}
                {user?.role === 'shop_owner' && <Link to="/shop/orders" className="ghost-button">Orders</Link>}
                <span className="user-badge">{user?.name || 'User'}</span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ghost-button">
                  Login
                </Link>
                <Link to="/register" className="primary-button small-button">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <Sparkles size={16} />
                Print smarter, faster, easier
              </div>

              <h1>Print Smarter with XeroQ</h1>

              <p className="hero-text">
                Find nearby Xerox shops, compare prices and queues, upload PDFs, and track
                your order from submission to collection—all in one simple student-friendly
                experience.
              </p>

              <div className="hero-actions">
                <Link to="/shops" className="primary-button">
                  Find Xerox Shops
                  <ArrowRight size={18} />
                </Link>
                <Link to="/upload-print" className="secondary-button">
                  <FileText size={18} />
                  Upload PDF
                </Link>
              </div>

              <div className="trust-row" aria-label="Key benefits">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="trust-item">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual" aria-label="How XeroQ works preview">
              <div className="visual-card main-panel">
                <div className="panel-header">
                  <span className="dot green" />
                  <span className="dot amber" />
                  <span className="dot blue" />
                </div>

                <div className="print-preview">
                  <div className="file-pill">
                    <FileText size={16} />
                    <span>assignment-final.pdf</span>
                  </div>

                  <div className="shop-list">
                    <div className="shop-row active-row">
                      <div>
                        <strong>PrintHub Campus</strong>
                        <small>₹35 / page</small>
                      </div>
                      <span className="queue-tag">Queue: 4</span>
                    </div>
                    <div className="shop-row">
                      <div>
                        <strong>BluePrint Studio</strong>
                        <small>₹42 / page</small>
                      </div>
                      <span className="queue-tag muted">Queue: 8</span>
                    </div>
                  </div>

                  <div className="mini-progress">
                    <div className="progress-topline">
                      <span>Order status</span>
                      <span>Ready in 12 min</span>
                    </div>
                    <div className="progress-bar">
                      <span className="progress-fill" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-card booking-card">
                <ShieldCheck size={18} />
                <div>
                  <strong>Verified shop</strong>
                  <small>Rated 4.9 by students</small>
                </div>
              </div>

              <div className="floating-card queue-card">
                <Clock3 size={18} />
                <div>
                  <strong>Live queue</strong>
                  <small>Updated 2 mins ago</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flow-section">
          <div className="container">
            <div className="section-heading">
              <span className="section-tag">How it works</span>
              <h2>Simple printing in five easy steps</h2>
            </div>

            <div className="flow-grid" aria-label="XeroQ process steps">
              {flowSteps.map((step, index) => {
                const Icon = step.icon

                return (
                  <div key={step.title} className="flow-step">
                    <div className="step-number">0{index + 1}</div>
                    <div className="step-icon">
                      <Icon size={22} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <div className="section-heading center-heading">
              <span className="section-tag">Why students choose XeroQ</span>
              <h2>Everything you need to print without the stress</h2>
            </div>

            <div className="feature-grid">
              {featureCards.map((feature) => {
                const Icon = feature.icon

                return (
                  <article key={feature.title} className="feature-card">
                    <div className="feature-icon">
                      <Icon size={22} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-box">
            <div>
              <span className="section-tag">Ready to print?</span>
              <h2>Find the best Xerox shop near you in minutes.</h2>
            </div>

            <Link to="/shops" className="primary-button">
              Start Printing
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Link to="/" className="brand footer-brand" aria-label="XeroQ home">
            <div className="brand-mark">X</div>
            <span>XeroQ</span>
          </Link>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/shops">Find Shops</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>

          <p className="footer-copy">© 2026 XeroQ. Student-first printing made simple.</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/shops" element={<ShopsPage />} />
      <Route path="/shops/:id" element={<ShopDetailsPage />} />

      <Route
        path="/upload-print"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <UploadPrintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-summary"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <OrderSummaryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-queue"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <LiveQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['student']}><OrderDetailsPage /></ProtectedRoute>} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <PlaceholderPage badge="Profile" title="My Profile" description="Manage your saved details, preferred print locations, and student account settings here." />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shop/dashboard"
        element={
          <ProtectedRoute allowedRoles={['shop_owner']}>
            <ShopDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/orders"
        element={
          <ProtectedRoute allowedRoles={['shop_owner']}>
            <ShopOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/queue"
        element={
          <ProtectedRoute allowedRoles={['shop_owner']}>
            <ShopQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/profile"
        element={
          <ProtectedRoute allowedRoles={['shop_owner']}>
            <PlaceholderPage badge="Shop Owner" title="Shop Profile" description="Manage shop details, service offerings, operating hours, and customer-facing listing information here." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/analytics"
        element={
          <ProtectedRoute allowedRoles={['shop_owner']}>
            <ShopAnalyticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shops"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminShopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlaceholderPage badge="Admin" title="Order Oversight" description="Track all orders processed across the platform and review the status of each transaction." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlaceholderPage badge="Admin" title="Reports" description="This placeholder page is for operational summaries, regional insights, and business reporting tools." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlaceholderPage badge="Admin" title="Platform Analytics" description="Analyze traffic, fulfillment trends, and marketplace activity across the entire XeroQ ecosystem." />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<PlaceholderPage badge="404" title="Page Not Found" description="The page you are looking for does not exist yet in the XeroQ frontend structure." />} />
    </Routes>
  )
}

export default App
