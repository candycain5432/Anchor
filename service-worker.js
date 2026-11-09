// Maintenance mode: this replaces the app's service worker on the `maintenance` branch.
// Installed copies of Anchor pick it up on their next visit. It clears the app's caches and unregisters
// itself, then reloads open tabs so they show the maintenance page instead of the cached app.
// Journals, intentions and streaks live in localStorage, so they are not touched.
// Switching GitHub Pages back to `main` restores the normal service worker on the next visit.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
