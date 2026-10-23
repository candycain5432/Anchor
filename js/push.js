// Push notification subscription + per-slot reminder times (sent with the timezone).
import * as store from './store.js';
import * as api from './api.js';

// Must match VAPID_PUBLIC_KEY on the backend.
const VAPID_PUBLIC_KEY = 'BHj4SyHudAtLYj2oF8tIlyElHab33gn5Ip0nhu275oOhHdhS-wzN_os_bakSewPR96NVjrD-DtyT_Kd1iVMlF2s';

export const SLOTS = [
  { id: 'morning',   label: 'Morning',   sub: 'Saint & verse of the day', def: '08:00' },
  { id: 'afternoon', label: 'Afternoon', sub: 'The Hour of Mercy',         def: '15:00' },
  { id: 'night',     label: 'Night',     sub: 'Daily Examen before bed',   def: '21:00' },
];

export const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export const enabled = () => !!store.get('push');
export const reminders = () => store.get('reminders', { morning: '08:00', afternoon: '15:00', night: null });
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function registration() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, rej) => setTimeout(() => rej(new Error('Service worker not ready — try reloading the app')), 8000)),
  ]);
}

/** Asks permission, subscribes, and registers with the server. Throws a friendly Error on failure. */
export async function enable() {
  if (!supported()) {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    throw new Error(ios ? 'On iPhone, add Anchor to your Home Screen first, then enable reminders from there.' : 'Notifications aren’t supported in this browser.');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications are blocked — allow them in your browser settings.');
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY),
  });
  await api.subscribe({ subscription: sub.toJSON(), tz: tz(), reminders: reminders() });
  store.set('push', true);
}

export async function disable() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await api.unsubscribe(sub.endpoint).catch(() => {}); await sub.unsubscribe(); }
  } catch {}
  store.set('push', false);
}

export async function setReminders(r) {
  store.set('reminders', r);
  if (!enabled()) return;
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!sub) return;
    await api.updatePrefs({ endpoint: sub.endpoint, tz: tz(), reminders: r })
      .catch(() => api.subscribe({ subscription: sub.toJSON(), tz: tz(), reminders: r }));
  } catch {}
}

/**
 * Re-registers on every launch. The free server forgets subscriptions when it
 * restarts, so this is what keeps reminders flowing.
 */
export async function sync() {
  if (!enabled() || !supported()) return;
  try {
    const sub = await (await registration()).pushManager.getSubscription();
    if (!sub) { store.set('push', false); return; }
    await api.subscribe({ subscription: sub.toJSON(), tz: tz(), reminders: reminders() });
  } catch (err) {
    console.warn('[Anchor] push sync failed:', err.message);
  }
}

export async function test() {
  const reg = await registration();
  await reg.showNotification('✦ Anchor', {
    body: 'This is how your daily reminders will look. Peace be with you!',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',
    data: { url: './?open=today' },
  });
}
