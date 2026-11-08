// Google Analytics for a single-page app.
//
// Anchor is one HTML page, so GA would otherwise see a single "page". This module reports each
// screen, tab and sheet as its own virtual page (e.g. /today, /pray/rosary, /saint/st-joseph) so the
// Pages and screens report and Path exploration show what's used and how people move around.
//
// Delivery: everything goes into the dataLayer as gtag() commands. Google Tag Manager
// (GTM-P5RXXK6B, loaded in index.html) hands them to the GA4 Google tag configured in the container.
//
// Rules: only fixed names, ids and counts are ever sent. Never journal text, chat text, names,
// search words, locations or anything else someone typed.
import * as store from './store.js';

const gtag = (...args) => { try { window.gtag?.(...args); } catch {} };
// Anywhere but the live site (localhost, your home network) counts as debug traffic: it shows in GA's
// DebugView and the "Developer traffic" filter keeps it out of reports. Add ?ga_debug to test live.
// (debug_mode is left out entirely otherwise: GA treats even `false` as on.)
const DEV = !/(^|\.)faithanchor\.net$|\.github\.io$/.test(location.hostname) || /[?&]ga_debug/.test(location.search);
const withDebug = params => (DEV ? { ...params, debug_mode: true } : params);
const BASE = location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');

export const slug = s => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'untitled';

let current = null;     // { path, title } — what's on screen now (a screen, or a sheet/overlay on top of it)
let screen = null;      // the screen underneath any sheet
let source = 'launch';  // how the next page was reached; consumed by the next page view
let scrolled = false;   // 90% scroll already reported for the current page

/** How the next page view was reached: 'tab_bar' | 'sidebar' | 'deep_link' | 'notification' | 'onboarding' | 'in_app' … */
export function via(how) { source = how; }

function send(path, title) {
  const prev = current?.path || '(entrance)';
  current = { path, title };
  scrolled = false;
  const page_location = BASE + path;
  const page_title = `${title} · Anchor`;
  // Later events (practice_completed, chat_sent…) are attributed to this page too.
  gtag('set', { page_location, page_title });
  gtag('event', 'page_view', withDebug({ page_location, page_title, previous_page: prev, nav_source: source }));
  source = 'in_app';
}

/** A main screen or one of its tabs. */
export function screenView(path, title) {
  screen = { path, title };
  if (current?.path === path) return;
  send(path, title);
}

/** A sheet or full-screen overlay on top of the current screen. */
export function overlayView(path, title) {
  if (current?.path === path) return;
  send(path, title);
}

/** The overlay closed: later events belong to the screen underneath again (no extra page view). */
export function overlayClosed() {
  if (!screen || current?.path === screen.path) return;
  current = { ...screen };
  scrolled = false;
  gtag('set', { page_location: BASE + screen.path, page_title: `${screen.title} · Anchor` });
}

export function event(name, params = {}) { gtag('event', name, withDebug(params)); }

// ---- User properties (all non-personal settings) ----
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const layout = () => innerWidth >= 900 ? 'desktop' : innerWidth >= 600 ? 'tablet' : 'phone';

export function updateUserProperties() {
  const rule = store.get('rule', []);
  gtag('set', 'user_properties', {
    launch_mode: standalone() ? 'installed' : 'browser',
    layout: layout(),
    theme: store.get('theme', 'auto'),
    text_size: store.get('size', 'm'),
    reminders: store.get('push') ? 'on' : 'off',
    daily_rule_size: Array.isArray(rule) && rule.length ? String(rule.length) : 'default',
  });
}

// ---- Scroll depth inside screens and sheets (the page itself never scrolls, so GA's own scroll tracking can't see it) ----
document.addEventListener('scroll', e => {
  const el = e.target;
  if (scrolled || !current || !(el instanceof Element) || !el.matches('.screen.active, .sheet-body, .chat')) return;
  if (el.scrollHeight <= el.clientHeight * 1.3) return; // too short to count
  if ((el.scrollTop + el.clientHeight) / el.scrollHeight >= 0.9) {
    scrolled = true;
    event('scroll', { percent_scrolled: 90 });
  }
}, { capture: true, passive: true });

// ---- JavaScript errors (message only, capped per session) ----
let errors = 0;
function exception(msg) {
  if (++errors > 10) return;
  event('exception', { description: String(msg || 'unknown').slice(0, 150), fatal: false });
}
window.addEventListener('error', e => { if (e.message) exception(`${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno || 0}`); });
window.addEventListener('unhandledrejection', e => exception(e.reason?.message || e.reason));
