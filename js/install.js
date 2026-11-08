// Installing Anchor to the home screen, sharing it, and getting out of in-app browsers.
// Loaded at boot so `beforeinstallprompt` is never missed.
import * as store from './store.js';
import { esc, toast, track, openSheet, closeSheet } from './ui.js';
import { icon } from './icons.js';

export const APP_URL = 'https://faithanchor.net/';

const ua = navigator.userAgent || '';

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;

/** 'ios' | 'android' | 'desktop' (iPadOS reports itself as a Mac with touch). */
export function platform() {
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

/** Safari on iPhone/iPad (not Chrome, Firefox, Edge or Opera for iOS, whose Share button sits elsewhere). */
export const isIOSSafari = () => platform() === 'ios' && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

/** The name of the social app whose built-in browser we're in, or ''. */
export function inAppBrowser() {
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) return /Messenger/i.test(ua) ? 'Messenger' : 'Facebook';
  if (/musical_ly|Bytedance|TikTok|trill_/i.test(ua)) return 'TikTok';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn';
  return '';
}

// ---- beforeinstallprompt (Chrome, Edge, Samsung Internet) ----
let deferred = null;
const listeners = new Set();
/** Re-render callbacks for anything showing install UI. Returns an unsubscribe function. */
export function onInstallChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; emit(); });
window.addEventListener('appinstalled', () => { deferred = null; store.set('installed', store.isoDate()); emit(); });

export const canPrompt = () => !!deferred;

/** Shows the browser's own install dialog. Resolves 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall(from = 'other') {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  try {
    await e.prompt();
    const { outcome } = await e.userChoice;
    track('install_prompt', { outcome, from });
    if (outcome === 'accepted') toast('Installing Anchor…');
    emit();
    return outcome;
  } catch {
    emit();
    return 'unavailable';
  }
}

// ---- Walkthrough video ----
/**
 * A looping walkthrough video (media/onboarding-*.mp4), only where it matches what the person will
 * actually see: Safari on iPhone, or Android when Anchor's Install button is available. '' otherwise.
 */
export function installDemoHTML() {
  if (isStandalone() || inAppBrowser()) return '';
  const which = isIOSSafari() ? 'iphone' : platform() === 'android' && deferred ? 'android' : '';
  if (!which) return '';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = which === 'iphone'
    ? 'How to install: tap Share, then Add to Home Screen, then Add.'
    : 'How to install: tap Install Anchor, then Install.';
  return `<div class="install-demo">
    <video src="media/onboarding-${which}.mp4" poster="media/onboarding-${which}.jpg" muted loop playsinline
      ${still ? 'controls preload="none"' : 'autoplay preload="auto"'} aria-label="${label}"></video>
  </div>`;
}

/** Some browsers ignore autoplay on video inserted with innerHTML; nudge it (muted, so it's allowed). */
export function playDemos(root = document) {
  root.querySelectorAll('.install-demo video[autoplay]').forEach(v => { v.muted = true; v.play?.().catch(() => {}); });
}

// ---- Instructions ----
const step = (n, html) => `<li><span class="n">${n}</span><span>${html}</span></li>`;
const chip = (ic, label) => `<span class="ui-chip">${ic ? icon(ic) : ''}${esc(label)}</span>`;

/** The right install instructions for this device, as HTML. Buttons are wired by the global handler below. */
export function installHTML() {
  if (isStandalone()) {
    return `<p class="install-done">${icon('check')} Anchor is installed on this device.</p>`;
  }
  const app = inAppBrowser();
  if (app) return inAppHTML(app);

  if (deferred) {
    return `<button class="btn btn-primary btn-lg btn-block" data-install-now>${icon('download')} Install Anchor</button>
      <p class="install-note">Free, takes a second, and uses almost no space.</p>`;
  }

  const p = platform();
  if (p === 'ios') {
    const safari = isIOSSafari();
    return `<ol class="install-steps">
      ${step(1, `Tap the Share button ${chip('share', 'Share')} ${safari ? 'in Safari’s toolbar. If you don’t see it, tap ••• first.' : 'next to the address bar.'}`)}
      ${step(2, `Scroll down and tap ${chip('plus', 'Add to Home Screen')}`)}
      ${step(3, `Tap ${chip('', 'Add')}. Anchor will be on your Home Screen.`)}
    </ol>
    <p class="install-note">On iPhone, prayer reminders only work once Anchor is on your Home Screen.</p>`;
  }
  if (p === 'android') {
    return `<ol class="install-steps">
      ${step(1, `Open your browser’s menu ${chip('', '⋮')}`)}
      ${step(2, `Tap ${chip('download', 'Install app')} or ${chip('plus', 'Add to Home screen')}`)}
    </ol>`;
  }
  const mac = /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  if (mac) {
    return `<ol class="install-steps">${step(1, `In Safari’s menu bar, choose ${chip('', 'File')} → ${chip('', 'Add to Dock')}`)}</ol>`;
  }
  if (/Firefox/.test(ua)) {
    return `<p class="install-note" style="text-align:left">Firefox on a computer can’t install web apps. Open <b>faithanchor.net</b> in Chrome or Edge to install it, or just bookmark it here.</p>`;
  }
  return `<ol class="install-steps">
    ${step(1, `Click the install icon ${chip('download', '')} at the right of the address bar`)}
    ${step(2, `Or open the browser menu and choose ${chip('', 'Install Anchor')}`)}
  </ol>`;
}

function inAppHTML(app) {
  const android = platform() === 'android';
  const chrome = `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
  return `<p class="install-note" style="text-align:left;margin-top:0">You’re in ${esc(app)}’s built-in browser, which can’t install apps.</p>
    <ol class="install-steps">
      ${step(1, `Tap the ${chip('', android ? '⋮' : '•••')} menu at the top of the screen`)}
      ${step(2, `Choose ${chip('', android ? 'Open in Chrome' : 'Open in browser')} (it may say “Open in Safari” or “Open in external browser”)`)}
      ${step(3, 'Then add Anchor to your home screen from there')}
    </ol>
    <div class="install-actions">
      ${android ? `<a class="btn btn-primary btn-block" href="${chrome}">${icon('external')} Open in Chrome</a>` : ''}
      <button class="btn btn-soft btn-block" data-copy-link>${icon('copy')} Copy link</button>
    </div>`;
}

/** Me → About → Install Anchor, and anywhere else that wants the full instructions. */
export function openInstallSheet(from = 'other') {
  track('install_help', { from });
  let off = () => {};
  openSheet({
    title: 'Install Anchor',
    page: '/install',
    html: `<div class="install-sheet">
      <p class="muted" style="margin:0 0 16px">Put Anchor on your home screen. It opens like an app, works offline, and can send gentle prayer reminders.</p>
      <div data-install-body>${installDemoHTML()}${installHTML()}</div>
    </div>`,
    onMount(body) {
      playDemos(body);
      off = onInstallChange(() => {
        const el = body.querySelector('[data-install-body]');
        if (el) { el.innerHTML = installDemoHTML() + installHTML(); playDemos(el); }
      });
    },
    onClose: () => off(),
  });
}

// ---- Share Anchor ----
export async function shareApp(from = 'other') {
  const data = { title: 'Anchor', text: 'Anchor is a free Catholic prayer app: the Rosary, today’s readings, the saints and a prayer journal.', url: APP_URL };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      track('share_app', { from, method: 'native' });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
  }
  await copyLink(from);
}

async function copyLink(from) {
  try {
    await navigator.clipboard.writeText(APP_URL);
    toast('Link copied: faithanchor.net');
    track('share_app', { from, method: 'copy' });
  } catch {
    window.prompt('Copy this link to share Anchor:', APP_URL);
  }
}

// One handler for install / share buttons wherever they're rendered (sheets, onboarding, Today, banner).
document.addEventListener('click', e => {
  const t = e.target.closest?.('[data-install-now],[data-copy-link],[data-share-app]');
  if (!t) return;
  const from = t.closest('.onb') ? 'onboarding' : t.closest('.inapp-banner') ? 'banner' : t.closest('#sheet') ? 'sheet' : t.closest('[data-screen]')?.dataset.screen || 'other';
  if (t.matches('[data-install-now]')) promptInstall(from).then(o => { if (o === 'accepted' && t.closest('#sheet')) closeSheet(); });
  if (t.matches('[data-copy-link]')) copyLink(from);
  if (t.matches('[data-share-app]')) shareApp(from);
});

// ---- In-app browser banner ----
/** A slim banner at the top while inside Instagram / Facebook / TikTok etc. Dismissed for the session. */
export function showInAppBanner() {
  const app = inAppBrowser();
  if (!app || isStandalone()) return;
  try { if (sessionStorage.getItem('anchor:inappDismissed')) return; } catch {}
  const p = platform();
  const el = document.createElement('div');
  el.className = 'inapp-banner';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Open in your browser');
  el.innerHTML = `
    <span class="i" aria-hidden="true">${icon('external')}</span>
    <span class="t"><b>Open in ${p === 'ios' ? 'Safari' : p === 'android' ? 'Chrome' : 'your browser'} to install</b>
      <span>Tap ${p === 'android' ? '⋮' : '•••'} at the top, then “Open in browser”.</span></span>
    <button class="go" data-act="inapp-how">How</button>
    <button class="x" data-act="inapp-close" aria-label="Dismiss">${icon('x')}</button>`;
  el.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'inapp-how') openInstallSheet('banner');
    if (act === 'inapp-close') {
      try { sessionStorage.setItem('anchor:inappDismissed', '1'); } catch {}
      ro?.disconnect();
      document.documentElement.style.removeProperty('--inapp-h');
      el.remove();
    }
  });
  document.body.append(el);
  // Push the app down so the banner doesn't cover the header.
  const fit = () => document.documentElement.style.setProperty('--inapp-h', el.offsetHeight + 'px');
  const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
  ro?.observe(el);
  fit();
  track('inapp_browser', { app });
}
