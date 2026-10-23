// Anchor — boot, routing, theme, service worker.
import * as store from './store.js';
import { initSheet, closeSheet, $, $$ } from './ui.js';
import { icon } from './icons.js';
import { checkMilestones, launch } from './practices.js';
import * as push from './push.js';

store.migrate();

// ---- Theme ----
const THEME_COLORS = { light: '#14203f', dark: '#0a0f1e' };
export function applyTheme(theme) {
  store.set('theme', theme);
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]').content = dark ? THEME_COLORS.dark : THEME_COLORS.light;
}
export function applySize(size) {
  store.set('size', size);
  document.documentElement.dataset.size = size;
}
applyTheme(store.get('theme', 'auto'));
applySize(store.get('size', 'm'));

// ---- Screens ----
const SCREENS = {
  today:   () => import('./screens/today.js'),
  pray:    () => import('./screens/pray.js'),
  ask:     () => import('./screens/ask.js'),
  journal: () => import('./screens/journal.js'),
  me:      () => import('./screens/me.js'),
};
const mounted = {};
let current = null;

export async function navigate(name, opts = {}) {
  if (!SCREENS[name]) name = 'today';
  const el = $(`.screen[data-screen="${name}"]`);
  if (!mounted[name]) {
    const mod = await SCREENS[name]();
    mod.mount(el);
    mounted[name] = mod;
  }
  if (current !== name) {
    $$('.screen').forEach(s => s.classList.toggle('active', s === el));
    $$('.tab').forEach(t => {
      const on = t.dataset.nav === name;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    current = name;
  }
  mounted[name].show?.(opts);
  closeSheet();
}

/** Re-render everything (after onboarding, restore, etc). */
export async function refreshAll() {
  for (const [name, mod] of Object.entries(mounted)) {
    const el = $(`.screen[data-screen="${name}"]`);
    el.innerHTML = '';
    const fresh = el.cloneNode(false); // drop old listeners
    el.replaceWith(fresh);
    mod.mount(fresh);
  }
  const name = current; current = null;
  navigate(name || 'today');
}

function buildNav() {
  const nav = $('.tabbar');
  const tab = (id, ic, label) => `<button class="tab" data-nav="${id}">${icon(ic)}<span>${label}</span></button>`;
  nav.innerHTML =
    tab('today', 'sun', 'Today') +
    tab('pray', 'cross', 'Pray') +
    `<button class="tab tab-ask" data-nav="ask" aria-label="Ask Anchor"><span class="orb">${icon('spark')}</span><span>Ask</span></button>` +
    tab('journal', 'book', 'Journal') +
    tab('me', 'user', 'Me');
  nav.addEventListener('click', e => {
    const t = e.target.closest('[data-nav]');
    if (t) navigate(t.dataset.nav);
  });
}

// ---- Deep links: ./?open=rosary (notifications, manifest shortcuts) ----
async function openTarget(target) {
  if (!target) return;
  const screens = ['today', 'pray', 'ask', 'journal', 'me'];
  if (screens.includes(target)) return navigate(target);
  await navigate('today');
  if (target === 'readings') return launch('readings');
  if (target === 'confession') return launch('confession');
  launch(target);
}

function handleDeepLink() {
  const params = new URLSearchParams(location.search);
  const target = params.get('open');
  if (target) {
    history.replaceState(null, '', location.pathname);
    openTarget(target);
  }
}

// ---- Boot ----
async function boot() {
  initSheet();
  buildNav();
  await navigate('today');
  handleDeepLink();
  checkMilestones({ silent: true });

  const { needsOnboarding, openOnboarding } = await import('./onboarding.js');
  if (needsOnboarding()) setTimeout(() => openOnboarding(), 400);

  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store.get('theme', 'auto')));
  // Re-render Today when the date changes while the app is open.
  let lastDay = store.isoDate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && store.isoDate() !== lastDay) { lastDay = store.isoDate(); refreshAll(); }
  });
}

boot();

// ---- Service worker ----
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Don't yank the page out from under someone mid-prayer.
    if (refreshing || document.body.dataset.sheet === 'open') return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'open') openTarget(e.data.target);
    if (e.data === 'CACHES_CLEARED') location.reload();
  });

  const activate = reg => reg.waiting?.postMessage('SKIP_WAITING');
  let lastCheck = 0;
  window.addEventListener('load', async () => {
    let reg;
    try {
      reg = await navigator.serviceWorker.register('./service-worker.js');
    } catch (err) {
      console.warn('[Anchor] SW failed:', err);
      return;
    }
    if (reg.waiting) activate(reg);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') activate(reg); });
    });
    lastCheck = Date.now();
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > 5 * 60 * 1000) {
        lastCheck = Date.now();
        reg.update().catch(() => {});
      }
    });
    push.sync();
  });
}

// ---- Console helpers: Anchor.forceUpdate(), Anchor.clearCaches(), Anchor.listCaches() ----
const tools = {
  async listCaches() { const k = await caches.keys(); console.log('[Anchor] caches:', k); return k; },
  async checkForUpdate() { const r = await navigator.serviceWorker.getRegistration(); await r?.update(); return r; },
  async clearCaches() {
    navigator.serviceWorker?.controller?.postMessage('CLEAR_CACHES');
    await Promise.all((await caches.keys()).map(k => caches.delete(k)));
    location.reload();
  },
  async forceUpdate() {
    await Promise.all((await caches.keys()).map(k => caches.delete(k)));
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r => r.unregister()));
    location.reload();
  },
};
window.Anchor = tools;
window.DailyFaith = tools; // old name, kept for muscle memory
