// First-run welcome: welcome (privacy) → about the maker → install (only in a browser tab) → where to begin.
// It must never block the app: it's marked seen as soon as it opens, Skip/Esc always close it,
// and if anything goes wrong it removes itself.
import * as store from './store.js';
import { esc, track } from './ui.js';
import { icon } from './icons.js';
import { PRACTICES } from './practices.js';
import { isStandalone, installHTML, installDemoHTML, playDemos, onInstallChange, canPrompt } from './install.js';
import { overlayView, overlayClosed, via } from './analytics.js';

export function needsOnboarding() { return !store.get('onboarded'); }

const LINKS = [
  ['globe', 'Portfolio', 'williamcain.net', 'https://williamcain.net'],
  ['github', 'GitHub', 'github.com/candycain5432', 'https://github.com/candycain5432'],
  ['mail', 'Email', 'contact@williamcain.net', 'mailto:contact@williamcain.net'],
];

/** A short prayer that fits the time of day, offered on the last step. */
function prayerForNow(h = new Date().getHours()) {
  return h >= 4 && h < 12 ? 'morning' : h < 15 ? 'angelus' : h < 17 ? 'chaplet' : 'night';
}

function beginChoices() {
  const now = prayerForNow();
  return [
    { id: 'rosary', ic: 'rosary', title: 'Pray the Rosary', sub: 'Guided, bead by bead' },
    { id: 'readings', ic: 'book', title: 'Today’s readings', sub: 'The Mass readings for today' },
    { id: now, ic: PRACTICES[now].icon, title: PRACTICES[now].name, sub: `A short prayer · ~${PRACTICES[now].min} min` },
    { id: 'ask', ic: 'spark', title: 'Ask Anchor', sub: 'A question about the faith' },
  ];
}

export function openOnboarding(again = false) {
  if (document.querySelector('.onb')) return;
  if (!again) store.set('onboarded', store.isoDate()); // seen once is enough, even if the tab closes mid-way
  const steps = ['welcome', 'about', ...(isStandalone() ? [] : ['install']), 'begin'];
  let step = 0;

  const el = document.createElement('div');
  el.className = 'onb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Welcome to Anchor');
  document.body.append(el);
  track(again ? 'onboarding_reopen' : 'onboarding_start', { install_step: steps.includes('install') });

  const offInstall = onInstallChange(() => { if (steps[step] === 'install') render(); });

  function render() {
    const id = steps[step];
    overlayView(`/welcome/${id}`, { welcome: 'Welcome', about: 'About the maker', install: 'Install step', begin: 'Where to begin' }[id]);
    let html = `<button class="onb-skip" data-act="close">${again ? 'Close' : 'Skip'}</button>`;
    if (id === 'welcome') {
      html += `<div class="onb-step">
        <img class="onb-mark" src="icons/icon.svg" alt="" width="84" height="84">
        <h1>Welcome to <em>Anchor</em></h1>
        <p class="lead">A daily companion for Catholic prayer: the Rosary bead by bead, today’s readings, the saints, and a quiet place for your intentions.</p>
        <div class="onb-privacy">${icon('lock')}<span><b>Free, private, no account.</b> Your journal and prayers stay on this device. No ads, ever.</span></div>
      </div>`;
    } else if (id === 'about') {
      html += `<div class="onb-step">
        <div class="onb-maker" aria-hidden="true">WC</div>
        <div class="eyebrow" style="color:var(--gold-2);margin-bottom:8px">The person behind Anchor</div>
        <h1>Hi, I’m <em>William</em></h1>
        <p class="lead">I made Anchor to help people pray every day. It’s free, with no ads and no account, and everything you write stays on your device.</p>
        ${LINKS.map(([ic, label, sub, href]) => `
          <a class="onb-link" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
            <span class="i">${icon(ic)}</span><span class="t"><b>${label}</b><span>${sub}</span></span>${icon(href.startsWith('http') ? 'external' : 'chev')}
          </a>`).join('')}
        <p class="serif" style="color:rgba(255,255,255,.6);font-style:italic;font-size:1.1rem;margin:14px 0 0">If Anchor helps you pray, say one for me too.</p>
      </div>`;
    } else if (id === 'install') {
      const demo = installDemoHTML();
      html += `<div class="onb-step">
        <div class="eyebrow" style="color:var(--gold-2);margin-bottom:8px">Optional</div>
        <h1>Keep Anchor <em>close</em></h1>
        <p class="lead">${demo
          ? 'Add it to your home screen. It opens like an app and works offline.'
          : 'Add it to your home screen. It opens like an app, works offline, and can send gentle reminders to pray.'}</p>
        ${demo}
        <div class="onb-install">${installHTML()}</div>
      </div>`;
    } else {
      html += `<div class="onb-step">
        <h1>Where would you like to <em>begin?</em></h1>
        <p class="lead">Pick one to start now. Everything else is a tap away.</p>
        <div class="onb-begin">${beginChoices().map(c => `
          <button data-begin="${c.id}"><span class="i">${icon(c.ic)}</span><span class="t"><b>${esc(c.title)}</b><span>${esc(c.sub)}</span></span>${icon('chev')}</button>`).join('')}
        </div>
      </div>`;
    }
    const last = step === steps.length - 1;
    html += `<div class="onb-foot">
      <div class="onb-dots" aria-hidden="true">${steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
      ${last
        ? `<button class="btn btn-ghost" data-act="close" style="color:rgba(255,255,255,.8)">Just look around</button>`
        : `<button class="btn ${id === 'install' && canPrompt() ? 'btn-ghost' : 'btn-primary'} btn-lg" data-act="next" ${id === 'install' && canPrompt() ? 'style="color:rgba(255,255,255,.8)"' : ''}>${id === 'install' ? (canPrompt() ? 'Not now' : 'Continue') : id === 'welcome' ? 'Get started' : 'Continue'} ${icon('chev')}</button>`}
    </div>`;
    el.innerHTML = html;
    el.scrollTop = 0;
    playDemos(el);
    setTimeout(() => el.querySelector('.onb-step button, .onb-foot .btn')?.focus({ preventScroll: true }), 350);
  }

  let closed = false;
  async function close(target) {
    if (closed) return;
    closed = true;
    offInstall();
    document.removeEventListener('keydown', onKey);
    if (!again) track('onboarding_complete', { step: steps[step], begin: target || 'none' });
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
    overlayClosed();
    if (target) {
      try { via('onboarding'); (await import('./app.js')).openTarget(target, 'onboarding'); } catch (e) { console.error(e); }
    }
  }

  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  el.addEventListener('click', e => {
    const begin = e.target.closest('[data-begin]');
    if (begin) return close(begin.dataset.begin);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') return close();
    if (act === 'next') { step = Math.min(step + 1, steps.length - 1); render(); }
  });
  // Accepting the browser's install dialog moves straight on.
  window.addEventListener('appinstalled', () => { if (!closed && steps[step] === 'install') { step++; render(); } }, { once: true });

  try { render(); }
  catch (err) { console.error('[Anchor] onboarding failed:', err); close(); }
}
