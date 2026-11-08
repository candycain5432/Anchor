// Support the maker: the Ko-fi link (Me → About) and a one-time pop-up once Anchor has been used for a day.
import * as store from './store.js';
import { icon } from './icons.js';
import { esc, track } from './ui.js';
import { overlayView, overlayClosed } from './analytics.js';

// Donations go through Ko-fi: one-off or monthly, card or PayPal, no account needed.
export const DONATE_URL = 'https://ko-fi.com/williamcain';

// The goal shown in the pop-up. Keep it in step with the goal on your Ko-fi page.
// `amount` is optional (e.g. '$40 a month'); when empty, the pop-up just links to the goal on Ko-fi.
export const DONATE_GOAL = {
  title: 'Monthly goal: keep Anchor running',
  text: 'Covers the server that sends reminders, the AI behind Ask Anchor, and hosting.',
  amount: '',
};

export const hasDonate = () => !!DONATE_URL;

/** A tappable banner card that opens the donation page in a new tab ('' when no URL is set). */
export function donateBanner({ title = 'Keep Anchor free & ad-free', sub = 'Running Anchor costs money every month. A donation keeps it free for everyone, and it’s very appreciated.' } = {}) {
  if (!hasDonate()) return '';
  return `<a class="card donate-card" href="${DONATE_URL}" target="_blank" rel="noopener" data-donate>
    <span class="donate-icon" aria-hidden="true">${icon('heart')}</span>
    <span class="donate-body"><b>${title}</b><span>${sub}</span></span>
    <span class="donate-go" aria-hidden="true">${icon('external')}</span>
  </a>`;
}

// ---- One-time pop-up ----

/** The date Anchor was first used on this device (set at boot by app.js). */
export function firstUse() { return store.get('firstUse') || store.isoDate(); }

/** True if the pop-up hasn't been shown yet and Anchor was first used on an earlier day. */
export function shouldAskDonate() {
  return hasDonate() && !store.get('donateAsked') && firstUse() < store.isoDate();
}

/** Shows the pop-up once. Dismissing it (any way) is remembered. */
export function showDonatePopup() {
  store.set('donateAsked', store.isoDate());
  const days = Math.round((store.fromISO(store.isoDate()) - store.fromISO(firstUse())) / 86400000);
  track('donate_popup', { days_since_first_use: days });
  const el = document.createElement('div');
  el.className = 'nudge';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'nudge-title');
  el.innerHTML = `<div class="nudge-card">
    <button class="icon-btn nudge-x" data-close aria-label="Close">${icon('x')}</button>
    <div class="nudge-mark" aria-hidden="true">${icon('heart')}</div>
    <div class="eyebrow">Thank you for praying with Anchor</div>
    <h3 id="nudge-title">Help keep Anchor <em>free</em></h3>
    <p>Anchor has no ads and no subscriptions, and it stays that way because people chip in. If it’s helping you pray, would you help cover this month’s costs?</p>
    <div class="nudge-goal">
      <b>${esc(DONATE_GOAL.title)}${DONATE_GOAL.amount ? ` · ${esc(DONATE_GOAL.amount)}` : ''}</b>
      <span>${esc(DONATE_GOAL.text)} <a href="${DONATE_URL}" target="_blank" rel="noopener" data-donate>See the goal on Ko-fi</a></span>
    </div>
    <a class="btn btn-primary btn-lg btn-block" href="${DONATE_URL}" target="_blank" rel="noopener" data-donate>${icon('heart')} Support on Ko-fi</a>
    <button class="btn btn-ghost btn-block" data-close>Maybe later</button>
    <p class="nudge-foot">You won’t see this again. Ko-fi is always in Me → About.</p>
  </div>`;
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', onKey); overlayClosed(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('[data-close]')) close();
    else if (e.target.closest('[data-donate]')) setTimeout(close, 300);
  });
  document.addEventListener('keydown', onKey);
  document.body.append(el);
  overlayView('/prompt/donate', 'Support Anchor');
  setTimeout(() => el.querySelector('.btn-primary')?.focus({ preventScroll: true }), 60);
}

// Count taps on any donate link, wherever it's rendered.
document.addEventListener('click', e => {
  const a = e.target.closest?.('a[data-donate]');
  if (a) track('donate_click', { from: a.closest('.nudge') ? 'popup' : a.closest('[data-screen]')?.dataset.screen || 'other' });
});
