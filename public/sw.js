// Service worker: shows push notifications and opens the app when one is tapped.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const { title = 'Wish', body = '', url = '/' } = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: '/icon-192.png', data: { url } }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // Reuse the app if it is already open; otherwise, or if that fails, open it.
      const open = windows.find((client) => 'navigate' in client);
      if (!open) return self.clients.openWindow(url);
      return open
        .navigate(url)
        .then((client) => (client ?? open).focus())
        .catch(() => self.clients.openWindow(url));
    }),
  );
});
