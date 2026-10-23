// First-run welcome: name → appearance → Daily Rule → about the maker → reminders.
import * as store from './store.js';
import { esc, toast } from './ui.js';
import { icon } from './icons.js';
import { PRACTICES, rule, setRule } from './practices.js';
import * as push from './push.js';

export function needsOnboarding() { return !store.get('onboarded'); }

const STEPS = ['welcome', 'theme', 'rule', 'about', 'remind'];
const THEMES = [['auto', 'Automatic', 'Matches your device'], ['light', 'Light', 'Parchment & gold'], ['dark', 'Dark', 'Easy on the eyes at night']];
const LINKS = [
  ['globe', 'Portfolio', 'williamcain.net', 'https://williamcain.net'],
  ['github', 'GitHub', 'github.com/candycain5432', 'https://github.com/candycain5432'],
  ['mail', 'Email', 'contact@williamcain.net', 'mailto:contact@williamcain.net'],
];

export function openOnboarding(again = false) {
  let step = 0;
  const data = {
    name: store.get('profile', {}).name || '',
    theme: store.get('theme', 'auto'),
    rule: [...rule()],
    reminders: { ...push.reminders() },
  };
  const el = document.createElement('div');
  el.className = 'onb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Welcome to Anchor');
  document.body.append(el);

  function render() {
    let html = `<button class="onb-skip" data-act="skip">${again ? 'Close' : 'Skip'}</button>`;
    const id = STEPS[step];
    if (id === 'welcome') {
      html += `<div class="onb-step">
        <img class="onb-mark" src="icons/icon.svg" alt="" width="84" height="84">
        <h1>Welcome to <em>Anchor</em></h1>
        <p class="lead">A daily companion for prayer — the Rosary bead by bead, today’s readings, the saints, and a place to bring your intentions to God.</p>
        <label class="eyebrow" for="onb-name" style="display:block;margin-bottom:8px">What should we call you?</label>
        <input id="onb-name" class="field field-hero" value="${esc(data.name)}" placeholder="Your first name (optional)" maxlength="40" autocomplete="given-name">
      </div>`;
    } else if (id === 'theme') {
      html += `<div class="onb-step">
        <h1>Light or <em>dark?</em></h1>
        <p class="lead">Pick what’s easiest on your eyes. You can change it anytime in Me → Appearance.</p>
        <div class="themes">${THEMES.map(([v, label, sub]) => `
          <button class="${data.theme === v ? 'on' : ''}" data-theme-pick="${v}" aria-pressed="${data.theme === v}">
            <span class="tp tp-${v}" aria-hidden="true"><i></i><i></i><i></i></span>
            <b>${label}</b><span>${sub}</span>
          </button>`).join('')}</div>
      </div>`;
    } else if (id === 'rule') {
      html += `<div class="onb-step">
        <h1>Your <em>Daily Rule</em></h1>
        <p class="lead">Choose a few practices to make your own. Anchor will help you keep them — and celebrate when you do. You can change this anytime.</p>
        <div class="pick">${Object.entries(PRACTICES).map(([id, p]) => `
          <button class="${data.rule.includes(id) ? 'on' : ''}" data-pick="${id}" aria-pressed="${data.rule.includes(id)}"><span class="e">${icon(p.icon)}</span><b>${esc(p.name)}</b><span>~${p.min} min</span></button>`).join('')}</div>
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
    } else {
      html += `<div class="onb-step">
        <h1>A gentle <em>nudge</em></h1>
        <p class="lead">Small reminders, at the times you choose. Never spam — just an invitation to pray.</p>
        ${push.SLOTS.map(sl => `
          <div class="remind">
            <div class="t"><b>${sl.label}</b><span>${sl.sub}</span></div>
            <input type="time" data-time="${sl.id}" value="${data.reminders[sl.id] || sl.def}" aria-label="${sl.label} time">
            <span class="switch"><input type="checkbox" data-slot="${sl.id}" ${data.reminders[sl.id] ? 'checked' : ''} aria-label="${sl.label} reminder"><span></span></span>
          </div>`).join('')}
        <p class="small" style="color:rgba(255,255,255,.55);margin-top:6px">${push.supported() ? 'Your browser will ask for permission.' : 'On iPhone, add Anchor to your Home Screen first to receive reminders.'}</p>
      </div>`;
    }
    html += `<div class="onb-foot">
      <div class="onb-dots">${STEPS.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
      ${id === 'remind' ? `<button class="btn btn-ghost" data-act="finish" style="color:rgba(255,255,255,.7)">Maybe later</button>` : ''}
      <button class="btn btn-primary btn-lg" data-act="next">${id === 'remind' ? `${icon('bell')} Turn on` : `Continue ${icon('chev')}`}</button>
    </div>`;
    el.innerHTML = html;
    if (id === 'welcome') setTimeout(() => el.querySelector('#onb-name')?.focus(), 400);
  }

  function collect() {
    const n = el.querySelector('#onb-name');
    if (n) data.name = n.value.trim();
    el.querySelectorAll('[data-slot]').forEach(cb => {
      const t = el.querySelector(`[data-time="${cb.dataset.slot}"]`).value;
      data.reminders[cb.dataset.slot] = cb.checked ? t : null;
    });
  }

  async function finish(enablePush) {
    collect();
    store.update('profile', {}, p => ({ ...p, name: data.name }));
    if (data.rule.length) setRule(data.rule);
    store.set('reminders', data.reminders);
    store.set('onboarded', store.isoDate());
    if (enablePush) {
      try { await push.enable(); toast('Reminders are on'); }
      catch (err) { toast(err.message, { ms: 5000 }); }
    }
    el.style.transition = 'opacity .35s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
    (await import('./app.js')).refreshAll();
  }

  el.addEventListener('click', e => {
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const id = pick.dataset.pick;
      data.rule = data.rule.includes(id) ? data.rule.filter(x => x !== id) : [...data.rule, id];
      pick.classList.toggle('on');
      pick.setAttribute('aria-pressed', data.rule.includes(id));
      return;
    }
    const th = e.target.closest('[data-theme-pick]');
    if (th) {
      data.theme = th.dataset.themePick;
      el.querySelectorAll('[data-theme-pick]').forEach(b => {
        b.classList.toggle('on', b === th);
        b.setAttribute('aria-pressed', b === th);
      });
      import('./app.js').then(m => m.applyTheme(data.theme));
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'skip') { if (again) el.remove(); else finish(false); }
    if (act === 'finish') finish(false);
    if (act === 'next') {
      collect();
      if (STEPS[step] === 'rule' && !data.rule.length) return toast('Choose at least one practice');
      if (step < STEPS.length - 1) { step++; render(); } else finish(true);
    }
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'onb-name') el.querySelector('[data-act="next"]').click(); });
  render();
}
