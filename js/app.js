// Anchor — boot, routing, theme, service worker.
import * as store from './store.js';
import { initSheet, closeSheet, track, $, $$ } from './ui.js';
import { icon } from './icons.js';
import { checkMilestones, launch } from './practices.js';
import * as push from './push.js';
import { showInAppBanner } from './install.js'; // also starts listening for beforeinstallprompt
import './docs.js'; // FAQ / Privacy links open in a sheet
import * as analytics from './analytics.js';

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
const SCREEN_TITLES = { today: 'Today', pray: 'Pray', ask: 'Ask Anchor', journal: 'Journal', me: 'Me' };
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
  // Screens with tabs (Pray, Journal) report the tab too, e.g. /pray/saints.
  const page = mounted[name].page?.() || { path: '/' + name, title: SCREEN_TITLES[name] };
  analytics.screenView(page.path, page.title);
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
  // .nav-brand, .nav-foot and .wide-only only show in the desktop sidebar (see css/app.css).
  nav.innerHTML =
    `<div class="nav-brand" aria-hidden="true"><img src="icons/icon.svg" alt="" width="40" height="40"><span><b>Anchor</b><small>Catholic prayer companion</small></span></div>` +
    tab('today', 'sun', 'Today') +
    tab('pray', 'cross', 'Pray') +
    `<button class="tab tab-ask" data-nav="ask" aria-label="Ask Anchor"><span class="orb">${icon('spark')}</span><span>Ask<span class="wide-only"> Anchor</span></span></button>` +
    tab('journal', 'book', 'Journal') +
    tab('me', 'user', 'Me') +
    `<div class="nav-foot" aria-hidden="true"><span>“A sure and steadfast anchor of the soul.”</span><small>Hebrews 6:19</small></div>`;
  nav.addEventListener('click', e => {
    const t = e.target.closest('[data-nav]');
    if (!t) return;
    analytics.via(innerWidth >= 900 ? 'sidebar' : 'tab_bar');
    navigate(t.dataset.nav);
  });
}

// ---- Deep links: ./?open=rosary (notifications, manifest shortcuts) ----
/** `how` is reported as the page view's nav_source: 'deep_link', 'notification', 'onboarding'… */
export async function openTarget(target, how = 'in_app') {
  if (!target) return;
  const screens = ['today', 'pray', 'ask', 'journal', 'me'];
  analytics.via(how);
  if (screens.includes(target)) return navigate(target);
  await navigate('today');
  analytics.via(how); // the practice sheet is what they came for
  launch(target);
}

/** Opens ?open=… if present. Returns true when the visit came through a deep link. */
function handleDeepLink() {
  const params = new URLSearchParams(location.search);
  const target = params.get('open');
  if (target) {
    history.replaceState(null, '', location.pathname);
    openTarget(target, 'deep_link');
  }
  return !!target;
}

// ---- Boot ----
async function boot() {
  analytics.updateUserProperties();
  initSheet();
  buildNav();
  await navigate('today');
  const deepLinked = handleDeepLink();
  checkMilestones({ silent: !store.get('milestones') });
  showInAppBanner();

  // Onboarding sits on top of a fully working app and never blocks it. Someone arriving
  // through a deep link (notification, home-screen shortcut) goes straight where they asked.
  try {
    const { needsOnboarding, openOnboarding } = await import('./onboarding.js');
    if (needsOnboarding()) {
      if (deepLinked) store.set('onboarded', store.isoDate());
      else setTimeout(() => openOnboarding(), 400);
    }
  } catch (err) { console.warn('[Anchor] onboarding unavailable:', err); }

  // Remember the first day Anchor was used (for existing users: their earliest prayer or onboarding).
  if (!store.get('firstUse')) {
    const earliest = [store.isoDate(), store.get('onboarded'), ...Object.keys(store.get('log', {}))]
      .filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()[0];
    store.set('firstUse', earliest);
  }
  // One-time donation pop-up from day two on (waits until nothing else is on screen).
  setTimeout(() => import('./nudges.js').then(m => m.onLaunch()).catch(() => {}), 2500);

  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store.get('theme', 'auto')));
  // Re-render Today when the date changes while the app is open.
  let lastDay = store.isoDate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && store.isoDate() !== lastDay) { lastDay = store.isoDate(); refreshAll(); }
  });
}

boot();

// ---- Analytics: installs (page views and user properties: see js/analytics.js) ----
window.addEventListener('appinstalled', () => { track('app_installed'); analytics.updateUserProperties(); });

// ---- Service worker ----
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  let refreshing = false;
  // On a first visit the new worker just takes control of this page: nothing changed, so no reload
  // (it would also wipe the welcome screen). Reload only when an older version is being replaced.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Don't yank the page out from under someone mid-prayer, or mid-welcome.
    if (refreshing || !hadController || document.body.dataset.sheet === 'open' || document.querySelector('.onb, .nudge')) return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'open') openTarget(e.data.target, 'notification');
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
