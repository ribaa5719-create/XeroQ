import { AlertCircle, ArrowLeft, Bell, Check, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'
import PushNotificationSettings from '../components/PushNotificationSettings'

function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.list()
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.response?.status === 401 ? 'Please log in to view notifications.' : 'Unable to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialRequest = window.setTimeout(loadNotifications, 0)
    const interval = window.setInterval(loadNotifications, 5000)
    return () => {
      window.clearTimeout(initialRequest)
      window.clearInterval(interval)
    }
  }, [loadNotifications])

  const markRead = async (notification) => {
    if (!notification.read) {
      await notificationApi.markRead(notification.id)
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    }
    if (notification.orderId) navigate(`/live-queue?orderId=${notification.orderId}`)
  }

  const markAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await notificationApi.markAllRead()
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
      setUnreadCount(0)
    } catch {
      setErrorMessage('Unable to mark notifications as read.')
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div className="app-shell notifications-shell">
      <div className="container notifications-container">
        <div className="notifications-topbar"><Link to="/" className="brand"><div className="brand-mark">X</div><span>XeroQ</span></Link><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link></div>
        <div className="notifications-heading"><div><span className="section-tag"><Bell size={15} /> Updates</span><h1>Notifications</h1><p>Stay up to date with changes to your print orders.</p></div></div>
        {errorMessage && <div className="auth-error notification-message"><AlertCircle size={18} /> {errorMessage}</div>}
        <PushNotificationSettings />
        <section className="notifications-card dashboard-card">
          <div className="notifications-card-header"><div><span className="card-kicker">Your activity</span><h2>Unread: {unreadCount}</h2></div><button type="button" className="secondary-button mark-all-button" onClick={markAllRead} disabled={isMarkingAll || unreadCount === 0}>{isMarkingAll ? <LoaderCircle size={16} className="spin-icon" /> : <Check size={16} />} Mark all as read</button></div>
          {isLoading ? <div className="notification-empty"><LoaderCircle size={28} className="spin-icon" /><p>Loading notifications...</p></div> : notifications.length === 0 ? <div className="notification-empty"><Bell size={30} /><p>No notifications yet.</p></div> : <div className="notification-list">{notifications.map((notification) => <button type="button" key={notification.id} className={`notification-item ${notification.read ? '' : 'unread'}`} onClick={() => markRead(notification)}><div className="notification-item-icon"><Bell size={18} /></div><div className="notification-item-content"><strong>{notification.title}</strong><span>{notification.message}</span><small>{new Date(notification.createdAt).toLocaleString()}</small></div>{!notification.read && <span className="unread-dot" aria-label="Unread" />}</button>)}</div>}
        </section>
      </div>
    </div>
  )
}

export default NotificationsPage
