import { Bell, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../services/notificationApi'

function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const menuRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.list()
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch {
      // Notification polling is non-blocking and should not disrupt the main app.
    } finally {
      setIsUpdating(false)
    }
  }, [])

  useEffect(() => {
    const initialRequest = window.setTimeout(loadNotifications, 0)
    const interval = window.setInterval(() => {
      setIsUpdating(true)
      loadNotifications()
    }, 5000)

    return () => {
      window.clearTimeout(initialRequest)
      window.clearInterval(interval)
    }
  }, [loadNotifications])

  const openNotification = async (notification) => {
    if (!notification.read) {
      await notificationApi.markRead(notification.id).catch(() => {})
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    }

    setIsOpen(false)
    if (notification.orderId) navigate(`/live-queue?orderId=${notification.orderId}`)
  }

  return (
    <div className="notification-wrap" ref={menuRef}>
      <button type="button" className="notification-button" onClick={() => setIsOpen((current) => !current)} aria-label="Notifications" aria-expanded={isOpen} title="Notifications">
        {isUpdating ? <LoaderCircle size={19} className="spin-icon" /> : <Bell size={19} />}
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-popover">
          <div className="notification-popover-header"><strong>Notifications</strong><button type="button" onClick={() => navigate('/notifications')}>View all</button></div>
          {notifications.length === 0 ? <p className="notification-empty">No notifications yet.</p> : notifications.slice(0, 4).map((notification) => <button type="button" key={notification.id} className={`notification-preview ${notification.read ? '' : 'unread'}`} onClick={() => openNotification(notification)}><strong>{notification.title}</strong><span>{notification.message}</span></button>)}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
