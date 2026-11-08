// Gentle, one-time asks:
//  - reminders: after the first completed prayer (that's when we ask for notification permission)
//  - donation:  once Anchor has been used for a day (first open on a later day, or after a prayer that day)
// At most one per session, and only once nothing else is on screen.
import * as store from './store.js';
import { openSheet, closeSheet, toast, track } from './ui.js';
import { icon } from './icons.js';
import * as push from './push.js';
import { shouldAskDonate, showDonatePopup } from './donate.js';

let busy = false;

const idle = () =>
  !document.body.dataset.sheet && !document.querySelector('.seal-pop, .onb, .nudge') && document.visibilityState === 'visible';

/** Runs fn once the screen is clear (sheets closed, milestone popup gone) for a moment. Gives up after 5 min. */
function whenIdle(fn) {
  const start = Date.now();
  let calm = 0;
  const t = setInterval(() => {
    calm = idle() ? calm + 1 : 0;
    if (calm >= 2) { clearInterval(t); fn(); }
    else if (Date.now() - start > 5 * 60 * 1000) { clearInterval(t); busy = false; }
  }, 800);
}

function shouldAskReminders() {
  return !store.get('remindAsked') && !push.enabled() && push.supported()
    && typeof Notification !== 'undefined' && Notification.permission !== 'denied';
}

/** Called by practices.complete() after any prayer is marked done. */
export function afterPrayer() {
  if (busy) return;
  if (shouldAskReminders()) {
    busy = true;
    whenIdle(() => { if (shouldAskReminders()) askReminders(); });
  } else {
    askDonateWhenIdle();
  }
}

/** Called at launch: the donation pop-up, if Anchor was first used on an earlier day. */
export function onLaunch() {
  if (!busy) askDonateWhenIdle();
}

function askDonateWhenIdle() {
  if (!shouldAskDonate()) return;
  busy = true;
  whenIdle(() => { if (shouldAskDonate()) showDonatePopup(); });
}

function askReminders() {
  store.set('remindAsked', store.isoDate());
  track('reminder_ask_shown');
  const r = { ...push.reminders() };
  let answered = false;
  openSheet({
    title: 'Pray again tomorrow?',
    page: '/prompt/reminders',
    html: `<p class="muted" style="margin:0 0 14px">Well done. Anchor can send a gentle reminder at the times you choose. Never spam, just an invitation to pray. You can change this anytime in Me.</p>
      <div class="list">${push.SLOTS.map(sl => `
        <div class="row">
          <span class="row-main"><span class="row-title" style="display:block">${sl.label}</span><span class="row-sub" style="display:block">${sl.sub}</span></span>
          <input type="time" class="field" data-time="${sl.id}" value="${r[sl.id] || sl.def}" aria-label="${sl.label} reminder time">
          <span class="switch"><input type="checkbox" data-slot="${sl.id}" ${r[sl.id] ? 'checked' : ''} aria-label="${sl.label} reminder"><span></span></span>
        </div>`).join('')}</div>`,
    foot: `<button class="btn btn-soft btn-block" data-act="no">Not now</button><button class="btn btn-primary btn-block" data-act="yes">${icon('bell')} Turn on</button>`,
    onMount(body, foot) {
      foot.onclick = async e => {
        const a = e.target.closest('[data-act]')?.dataset.act;
        if (!a) return;
        answered = true;
        if (a === 'no') { track('reminder_ask', { answer: 'no' }); return closeSheet(); }
        const picked = {};
        for (const sl of push.SLOTS) {
          picked[sl.id] = body.querySelector(`[data-slot="${sl.id}"]`).checked ? (body.querySelector(`[data-time="${sl.id}"]`).value || sl.def) : null;
        }
        if (!Object.values(picked).some(Boolean)) return toast('Choose at least one time');
        // enable() must start inside the tap (no await before it): Safari only shows the
        // permission prompt during a user gesture. It reads the times from storage.
        store.set('reminders', picked);
        const enabling = push.enable();
        closeSheet();
        track('reminder_ask', { answer: 'yes' });
        try { await enabling; toast('Reminders are on'); }
        catch (err) { toast(err.message, { ms: 5000 }); }
      };
    },
    onClose: () => { if (!answered) track('reminder_ask', { answer: 'dismissed' }); },
  });
}
