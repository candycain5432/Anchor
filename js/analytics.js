// Google Analytics for a single-page app.
//
// Anchor is one HTML page, so GA would otherwise see a single "page". This module reports each
// screen, tab and sheet as its own virtual page (e.g. /today, /pray/rosary, /saint/st-joseph) so the
// Pages and screens report and Path exploration show what's used and how people move around.
//
// Rules: only fixed names, ids and counts are ever sent. Never journal text, chat text, names,
// search words, locations or anything else someone typed.
import * as store from './store.js';

const gtag = (...args) => { try { window.gtag?.(...args); } catch {} };
// Anywhere but the live site (localhost, your home network) counts as debug traffic: it shows in GA's
// DebugView and the "Developer traffic" filter keeps it out of reports.
// On the live site, open ?ga_debug=1 once to turn test mode on for this browser (it sticks, and shows an
// on-screen log of what's sent); ?ga_debug=0 turns it off again.
// (debug_mode is left out entirely otherwise: GA treats even `false` as on.)
const debugParam = /[?&]ga_debug=?([^&]*)/.exec(location.search);
if (debugParam) debugParam[1] === '0' ? store.del('gaDebug') : store.set('gaDebug', true);
const DEBUG_ON = !!store.get('gaDebug');
const DEV = DEBUG_ON || !/(^|\.)faithanchor\.net$|\.github\.io$/.test(location.hostname);
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
  debugLog('page_view', { page: path, from: prev, via: source });
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

export function event(name, params = {}) { gtag('event', name, withDebug(params)); debugLog(name, params); }

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

// ---- Test mode: an on-screen log of what's sent (only after ?ga_debug=1) ----
// Shows each event the app hands to Google Analytics, and each request that actually leaves for
// google-analytics.com, so you can tell "the app didn't send it" from "Google hasn't shown it yet".
let logEl = null, sent = 0, failed = 0;
const logLines = [];
function debugLog(name, params) {
  if (!DEBUG_ON) return;
  const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const detail = params.page || params.practice || params.setting || params.item || '';
  logLines.unshift(`${t}  ${name}${detail ? '  ' + detail : ''}`);
  logLines.length = Math.min(logLines.length, 12);
  renderLog();
}
function renderLog() {
  if (!logEl) return;
  const lib = !!(window.google_tag_data || window.google_tag_manager);
  logEl.querySelector('[data-s]').textContent =
    `GA library: ${lib ? 'loaded' : 'NOT loaded (blocked?)'} · requests to Google: ${sent} sent${failed ? `, ${failed} failed` : ''}`;
  logEl.querySelector('[data-l]').textContent = logLines.join('\n') || '(nothing sent yet)';
}
if (DEBUG_ON) {
  const isGA = url => /google-analytics\.com|googletagmanager\.com\/.*collect|\/g\/collect/.test(String(url));
  const beacon = navigator.sendBeacon?.bind(navigator);
  if (beacon) navigator.sendBeacon = (url, data) => { const ok = beacon(url, data); if (isGA(url)) { ok ? sent++ : failed++; renderLog(); } return ok; };
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    const p = realFetch(input, init);
    if (isGA(url)) p.then(() => { sent++; renderLog(); }, () => { failed++; renderLog(); });
    return p;
  };
  const show = () => {
    logEl = document.createElement('div');
    logEl.setAttribute('aria-hidden', 'true');
    logEl.style.cssText = 'position:fixed;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom) + 92px);z-index:99;max-width:420px;padding:8px 10px;border-radius:12px;background:rgba(10,15,30,.88);color:#e8f0ff;font:11px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:auto';
    logEl.innerHTML = '<b style="color:#d9b866">Analytics test mode</b> <span style="opacity:.6">(?ga_debug=0 to turn off · tap to hide)</span>\n<span data-s></span>\n<span data-l></span>';
    logEl.onclick = () => { logEl.style.display = 'none'; };
    document.body.append(logEl);
    renderLog();
    setInterval(renderLog, 2000);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', show) : show();
}
