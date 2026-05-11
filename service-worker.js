const CACHE_NAME = 'daily-faith-v11';

// index.html is intentionally excluded — navigation is always network-first
const STATIC_ASSETS = [
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Allow the app to trigger an immediate SW swap without waiting for tab close
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ---- Push Notifications ----
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Daily Faith', {
      body: data.body || 'Your daily Catholic companion',
      icon: './icons/icon-192.svg',
      badge: './icons/icon-192.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || './');
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // External APIs: network-only with graceful offline fallback
  if (url.hostname === 'project-veritas-backend.onrender.com') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ reply: 'You appear to be offline. Please check your connection and try again.' }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Google Fonts: cache-first (rarely changes, safe to cache long-term)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation (index.html): network-first so updates are seen immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request)
          .then(cached => cached || caches.match('./offline.html'))
      )
    );
    return;
  }

  // Everything else (icons, manifest, etc.): cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {});
    })
  );
});
