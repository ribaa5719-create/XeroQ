self.addEventListener('push', (event) => {
  let payload

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { message: event.data ? event.data.text() : '' }
  }

  const title = typeof payload.title === 'string' && payload.title.trim()
    ? payload.title
    : 'XeroQ order update'
  const message = typeof payload.message === 'string' ? payload.message : 'Your print order has been updated.'
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {}
  const url = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//')
    ? data.url
    : '/notifications'

  event.waitUntil(self.registration.showNotification(title, {
    body: message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const requestedUrl = event.notification.data?.url
  const targetUrl = typeof requestedUrl === 'string' && requestedUrl.startsWith('/') && !requestedUrl.startsWith('//')
    ? new URL(requestedUrl, self.location.origin).href
    : new URL('/notifications', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.startsWith(self.location.origin))
      if (existingClient) return existingClient.navigate(targetUrl).then(() => existingClient.focus())
      return self.clients.openWindow(targetUrl)
    }),
  )
})
