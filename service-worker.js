const CACHE_NAME = 'anchor-v9.1';

// App shell. index.html is network-first (below) but precached for offline use.
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './css/tokens.css',
  './css/app.css',
  './js/app.js',
  './js/api.js',
  './js/icons.js',
  './js/liturgy.js',
  './js/markdown.js',
  './js/onboarding.js',
  './js/practices.js',
  './js/push.js',
  './js/store.js',
  './js/ui.js',
  './js/data/novenas.js',
  './js/data/prayers.js',
  './js/data/saints.js',
  './js/features/beads.js',
  './js/features/examen.js',
  './js/features/lectio.js',
  './js/features/novena.js',
  './js/features/reader.js',
  './js/features/share-card.js',
  './js/features/timer.js',
  './js/screens/ask.js',
  './js/screens/journal.js',
  './js/screens/me.js',
  './js/screens/pray.js',
  './js/screens/saints.js',
  './js/screens/today.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/badge-96.png'
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

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => event.source?.postMessage('CACHES_CLEARED'))
    );
  }
});

// ---- Push Notifications ----
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || '✦ Anchor', {
      body: data.body || 'A moment to pray.',
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png', // Android draws badges as a white silhouette
      vibrate: [200, 100, 200],
      tag: data.url || 'anchor',
      data: { url: data.url || './' }
    })
  );
});

// Focus an open window and route it to the deep link, or open a new one.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || './', self.registration.scope);
  const target = url.searchParams.get('open');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          if (target) client.postMessage({ type: 'open', target });
          return client.focus();
        }
      }
      return clients.openWindow(url.href);
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Backend API: network-only with a graceful offline reply
  if (url.hostname === 'project-veritas-backend.onrender.com') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'You appear to be offline. Please check your connection and try again.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Google Fonts: cache-first (rarely changes)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Navigation (index.html): network-first so updates are seen immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', clone));
        }
        return response;
      }).catch(() =>
        caches.match('./index.html').then(cached => cached || caches.match('./offline.html'))
      )
    );
    return;
  }

  // Same-origin CSS/JS: stale-while-revalidate, so the next open gets the new version
  if (url.origin === self.location.origin && /\.(css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Everything else from our origin (icons, manifest): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
});

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
      }
      return response;
    });
  });
}
