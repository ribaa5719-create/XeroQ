import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { notificationApi } from '../services/notificationApi'

const decodeVapidKey = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value.replace(/-/g, '+').replace(/_/g, '/')}${padding}`
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)))
}

const supportsPush = () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

function PushNotificationSettings() {
  const [state, setState] = useState(() => {
    if (!supportsPush()) return 'unsupported'
    if (Notification.permission === 'denied') return 'blocked'
    return 'idle'
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supportsPush() || Notification.permission !== 'granted') return undefined

    let isMounted = true
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (isMounted && subscription) setState('enabled')
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const enableNotifications = async () => {
    if (!supportsPush()) {
      setState('unsupported')
      setMessage('This browser does not support background notifications.')
      return
    }

    if (Notification.permission === 'denied') {
      setState('blocked')
      setMessage('Notifications are blocked. Enable them in your browser settings, then try again.')
      return
    }

    setState('working')
    setMessage('')
    try {
      const configResponse = await notificationApi.getPushConfig()
      if (!configResponse.data.enabled || !configResponse.data.publicKey) {
        throw new Error('Push notifications are not configured yet.')
      }

      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('blocked')
        setMessage('Notifications are blocked. Enable them in your browser settings, then try again.')
        return
      }

      const registration = await navigator.serviceWorker.register('/push-sw.js')
      const readyRegistration = await navigator.serviceWorker.ready
      const subscription = await readyRegistration.pushManager.getSubscription()
        || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(configResponse.data.publicKey),
        })

      await notificationApi.registerPushSubscription(subscription.toJSON())
      setState('enabled')
      setMessage('You will receive updates when your print order changes.')
    } catch (error) {
      setState('idle')
      setMessage(error.response?.data?.message || error.message || 'Unable to enable notifications right now.')
    }
  }

  const disableNotifications = async () => {
    setState('working')
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await notificationApi.removePushSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setState('idle')
      setMessage('Browser notifications disabled.')
    } catch (error) {
      setState('enabled')
      setMessage(error.response?.data?.message || 'Unable to disable notifications right now.')
    }
  }

  return (
    <section className="push-settings dashboard-card">
      <div className="push-settings-copy">
        {state === 'enabled' ? <Bell size={22} /> : <BellOff size={22} />}
        <div>
          <span className="card-kicker">Browser notifications</span>
          <h2>{state === 'enabled' ? 'Notifications enabled' : 'Get order updates outside XeroQ'}</h2>
          <p>Get updates when your print order is accepted, printing starts, or your documents are ready.</p>
        </div>
      </div>
      {state === 'unsupported' ? <span className="push-settings-note">Background notifications are not supported in this browser.</span> : state === 'blocked' ? <span className="push-settings-note">Notifications are blocked in browser settings.</span> : <button type="button" className={state === 'enabled' ? 'secondary-button' : 'primary-button'} onClick={state === 'enabled' ? disableNotifications : enableNotifications} disabled={state === 'working'}>{state === 'working' ? <LoaderCircle size={16} className="spin-icon" /> : state === 'enabled' ? <BellOff size={16} /> : <Bell size={16} />} {state === 'working' ? 'Updating...' : state === 'enabled' ? 'Disable notifications' : 'Enable notifications'}</button>}
      {message && <span className="push-settings-message">{message}</span>}
    </section>
  )
}

export default PushNotificationSettings
