// Bloomina Admin — Service Worker for Web Push Notifications
// This file MUST be at the root of public/ to have the correct scope.

const ADMIN_URL = self.location.origin;

// ─── Push Event ────────────────────────────────────────────────────────────────
// Fired whenever the server sends a Web Push message.
// Works even when the browser tab is completely closed.
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data?.json() || {};
    } catch (e) {
        data = { title: event.data?.text() || 'New Notification' };
    }

    const title = data.title || '🛒 New Bloomina Notification';
    const options = {
        body: data.body || '',
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: data,
        vibrate: [200, 100, 200],
        requireInteraction: data.type === 'order', // keep order alerts on screen until dismissed
        actions: data.type === 'order'
            ? [
                { action: 'view_orders', title: '📦 View Orders' },
                { action: 'dismiss',     title: 'Dismiss' },
              ]
            : [{ action: 'dismiss', title: 'Dismiss' }],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ─── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetPath = event.action === 'view_orders' || event.notification.data?.type === 'order'
        ? '/admin/orders'
        : '/admin';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If admin tab is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.startsWith(ADMIN_URL) && 'focus' in client) {
                    client.navigate(ADMIN_URL + targetPath);
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) {
                return clients.openWindow(ADMIN_URL + targetPath);
            }
        })
    );
});

// ─── Install & Activate ───────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

