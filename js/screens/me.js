// Me: progress, milestones, Daily Rule, reminders, appearance, data, about.
import * as store from '../store.js';
import { esc, openSheet, closeSheet, toast, confirmSheet, downloadFile, sealSVG, relDay } from '../ui.js';
import { icon } from '../icons.js';
import { PRACTICES, rule, setRule, log, streak, bestStreak, totalDays, MILESTONES, unlocked, onChange } from '../practices.js';
import * as push from '../push.js';
import { donateBanner } from '../donate.js';
import { isStandalone, openInstallSheet, shareApp } from '../install.js';
import { event, updateUserProperties } from '../analytics.js';
const settingEvent = (setting, value) => { event('setting_change', { setting, value: String(value) }); updateUserProperties(); };

export const VERSION = '10.0';
const SUPPORT_EMAIL = 'support@faithanchor.net';
let root, bound = false;

export function mount(el) {
  root = el;
  el.addEventListener('click', onClick);
  el.addEventListener('change', onChangeInput);
  if (!bound) { onChange(() => root.classList.contains('active') && render()); bound = true; }
  render();
}

export function show() { render(); }

function render() {
  const profile = store.get('profile', {});
  const s = streak();
  root.innerHTML = `
    <header class="hero">
      <div class="ribbon" aria-hidden="true"></div>
      <div class="hero-top"><span class="eyebrow">Your walk with God</span>
        <div class="hero-actions"><button class="hero-btn" data-act="edit-name" aria-label="Edit name">${icon('edit')}</button></div></div>
      <h1 class="hero-title">${profile.name ? esc(profile.name) : 'Me'}</h1>
      <p class="hero-sub">${s ? `You’ve prayed ${s} day${s === 1 ? '' : 's'} in a row. Keep going!` : 'Pray today to begin a new streak.'}</p>
      <div class="stats">
        <div class="stat"><b>${s}</b><span>Streak</span></div>
        <div class="stat"><b>${bestStreak()}</b><span>Best</span></div>
        <div class="stat"><b>${totalDays()}</b><span>Total days</span></div>
      </div>
    </header>
    <div class="page">
     <div class="cols">
      <div class="col col-main stagger">
      <div class="card">
        <div class="card-label">Last 12 weeks</div>
        ${heatmap()}
      </div>

      <div class="card">
        <div class="card-label">Milestones<span class="spacer"></span><span class="faint" style="letter-spacing:.04em">${Object.keys(unlocked()).length}/${MILESTONES.length}</span></div>
        <div class="seal-grid">${MILESTONES.map(m => `
          <button class="seal-cell ${unlocked()[m.id] ? '' : 'locked'}" data-milestone="${m.id}">${sealSVG(m.glyph)}<div class="sn">${esc(m.name)}</div></button>`).join('')}</div>
      </div>
      </div>
      <div class="col col-side stagger">

      <div class="list-label">Your Daily Rule</div>
      <div class="list">
        ${Object.entries(PRACTICES).map(([id, p]) => `
          <label class="row">
            <span class="row-icon">${icon(p.icon)}</span>
            <span class="row-main"><span class="row-title" style="display:block">${esc(p.name)}</span><span class="row-sub" style="display:block">${esc(p.sub)} · ~${p.min} min</span></span>
            <span class="switch"><input type="checkbox" data-rule="${id}" ${rule().includes(id) ? 'checked' : ''} aria-label="${esc(p.name)}"><span></span></span>
          </label>`).join('')}
      </div>

      <div class="list-label">Reminders</div>
      <div class="list" data-reminders>${remindersHTML()}</div>

      <div class="list-label">Confession</div>
      <div class="list">
        <div class="row">
          <span class="row-icon">${icon('key')}</span>
          <span class="row-main"><span class="row-title" style="display:block">Gentle reminder</span><span class="row-sub" style="display:block">Last confession: ${store.get('lastConfession') ? esc(relDay(store.get('lastConfession'))) : 'not recorded'}</span></span>
          <select class="field" data-confession style="width:auto;padding:8px 10px;font-size:.85rem">
            ${[[0, 'Off'], [2, 'Every 2 wks'], [4, 'Monthly'], [8, 'Every 2 mo']].map(([v, l]) => `<option value="${v}" ${store.get('confessionWeeks', 0) === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="list-label">Appearance</div>
      <div class="list">
        <div class="row"><span class="row-main"><span class="row-title">Theme</span></span>
          <div class="seg" style="width:210px">${[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button data-theme-set="${v}" class="${store.get('theme', 'auto') === v ? 'active' : ''}">${l}</button>`).join('')}</div></div>
        <div class="row"><span class="row-main"><span class="row-title">Text size</span></span>
          <div class="seg" style="width:210px">${[['s', 'A'], ['m', 'A'], ['l', 'A'], ['xl', 'A']].map(([v, l], i) => `<button data-size-set="${v}" class="${store.get('size', 'm') === v ? 'active' : ''}" style="font-size:${.72 + i * .14}rem" aria-label="Text size ${v.toUpperCase()}">${l}</button>`).join('')}</div></div>
      </div>

      <div class="list-label">Your data</div>
      <div class="list">
        <button class="row" data-act="export"><span class="row-icon">${icon('download')}</span><span class="row-main"><span class="row-title" style="display:block">Back up</span><span class="row-sub" style="display:block">Download your journal, progress & settings</span></span></button>
        <label class="row tap" style="cursor:pointer"><span class="row-icon">${icon('upload')}</span><span class="row-main"><span class="row-title" style="display:block">Restore a backup</span><span class="row-sub" style="display:block">From an Anchor backup file</span></span><input type="file" accept="application/json,.json" data-import hidden></label>
        <button class="row" data-act="reset"><span class="row-icon">${icon('trash')}</span><span class="row-main"><span class="row-title" style="display:block">Erase everything</span><span class="row-sub" style="display:block">Remove all Anchor data from this device</span></span></button>
      </div>

      <div class="list-label">About</div>
      ${donateBanner({ title: 'Support Anchor on Ko-fi', sub: 'Anchor is free and ad-free, but the server and AI behind it cost money every month. Donations keep it running, and every one is very appreciated.' })}
      <div class="list">
        ${isStandalone() ? '' : `<button class="row" data-act="install"><span class="row-icon">${icon('download')}</span><span class="row-main"><span class="row-title" style="display:block">Install Anchor</span><span class="row-sub" style="display:block">Add it to your home screen</span></span><span class="row-end">${icon('chev')}</span></button>`}
        <button class="row" data-act="share-app"><span class="row-icon">${icon('share')}</span><span class="row-main"><span class="row-title" style="display:block">Share Anchor</span><span class="row-sub" style="display:block">Send it to someone who’d pray with it</span></span><span class="row-end">${icon('chev')}</span></button>
        <a class="row" href="mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Anchor feedback (v${VERSION})`)}"><span class="row-icon">${icon('mail')}</span><span class="row-main"><span class="row-title" style="display:block">Send feedback</span><span class="row-sub" style="display:block">${SUPPORT_EMAIL}</span></span><span class="row-end">${icon('chev')}</span></a>
        <a class="row" href="faq.html" data-doc-link><span class="row-icon">${icon('chat')}</span><span class="row-main"><span class="row-title">Questions & answers</span></span><span class="row-end">${icon('chev')}</span></a>
        <a class="row" href="privacy.html" data-doc-link><span class="row-icon">${icon('lock')}</span><span class="row-main"><span class="row-title">Privacy Policy</span></span><span class="row-end">${icon('chev')}</span></a>
        <button class="row" data-act="onboarding"><span class="row-icon">${icon('spark')}</span><span class="row-main"><span class="row-title">Show the welcome again</span></span><span class="row-end">${icon('chev')}</span></button>
        <div class="row"><span class="row-icon" style="background:none;overflow:hidden"><img src="icons/icon.svg" alt="" width="40" height="40"></span><span class="row-main"><span class="row-title" style="display:block">Anchor ${VERSION}</span><span class="row-sub" style="display:block">Made with love by William Cain · AI by OpenAI</span></span></div>
        <a class="row" href="https://williamcain.net" target="_blank" rel="noopener"><span class="row-icon">${icon('globe')}</span><span class="row-main"><span class="row-title" style="display:block">William Cain’s portfolio</span><span class="row-sub" style="display:block">williamcain.net</span></span><span class="row-end">${icon('external')}</span></a>
        <a class="row" href="https://github.com/candycain5432" target="_blank" rel="noopener"><span class="row-icon">${icon('github')}</span><span class="row-main"><span class="row-title" style="display:block">William Cain on GitHub</span><span class="row-sub" style="display:block">github.com/candycain5432</span></span><span class="row-end">${icon('external')}</span></a>
        <a class="row" href="mailto:contact@williamcain.net"><span class="row-icon">${icon('mail')}</span><span class="row-main"><span class="row-title" style="display:block">Contact</span><span class="row-sub" style="display:block">contact@williamcain.net</span></span><span class="row-end">${icon('chev')}</span></a>
      </div>
      </div>
     </div>
      <p class="faint small serif" style="text-align:center;font-style:italic;font-size:1rem;margin-top:20px">Ad maiorem Dei gloriam</p>
    </div>`;
}

function heatmap() {
  const all = log();
  const today = new Date();
  // Columns are weeks (Sun–Sat); end on the current week.
  const end = store.addDays(today, 6 - today.getDay());
  const start = store.addDays(end, -83);
  const rule_ = rule();
  let cells = '';
  for (let i = 0; i < 84; i++) {
    const d = store.addDays(start, i);
    const iso = store.isoDate(d);
    const day = all[iso] || {};
    const n = Object.keys(day).length;
    const ruleDone = rule_.filter(p => day[p]).length;
    const level = !n ? 0 : day.legacy && n === 1 ? 1 : ruleDone >= rule_.length ? 4 : Math.min(3, 1 + Math.floor((ruleDone / rule_.length) * 3));
    const future = d > today;
    cells += `<i data-l="${level}" class="${iso === store.isoDate() ? 'today' : ''} ${future ? 'future' : ''}" title="${esc(iso)}${n ? ` · ${n} prayer${n === 1 ? '' : 's'}` : ''}"></i>`;
  }
  return `<div class="heat" role="img" aria-label="Prayer activity over the last 12 weeks">${cells}</div>
    <div class="heat-legend"><span>12 weeks ago</span><span>Darker = more of your Daily Rule</span><span>Today</span></div>`;
}

function remindersHTML() {
  const on = push.enabled();
  const r = push.reminders();
  return `
    <div class="row">
      <span class="row-icon">${icon('bell')}</span>
      <span class="row-main"><span class="row-title" style="display:block">Daily reminders</span><span class="row-sub" style="display:block" data-push-sub>${on ? 'On — gentle nudges at the times below' : 'Get a nudge to pray each day'}</span></span>
      <span class="switch"><input type="checkbox" data-push ${on ? 'checked' : ''} aria-label="Daily reminders"><span></span></span>
    </div>
    ${push.SLOTS.map(sl => `
      <div class="row" ${on ? '' : 'style="opacity:.5"'}>
        <span class="row-main"><span class="row-title" style="display:block">${sl.label}</span><span class="row-sub" style="display:block">${sl.sub}</span></span>
        <input type="time" class="field" data-slot-time="${sl.id}" value="${r[sl.id] || sl.def}" ${on && r[sl.id] ? '' : 'disabled'} aria-label="${sl.label} reminder time">
        <span class="switch"><input type="checkbox" data-slot="${sl.id}" ${r[sl.id] ? 'checked' : ''} ${on ? '' : 'disabled'} aria-label="${sl.label} reminder"><span></span></span>
      </div>`).join('')}
    ${on ? `<button class="row" data-act="test-push"><span class="row-main"><span class="row-title" style="color:var(--gold)">Send a test notification</span></span></button>` : ''}`;
}

// ---- Events ----
async function onClick(e) {
  const t = e.target;
  const m = t.closest('[data-milestone]');
  if (m) {
    const ms = MILESTONES.find(x => x.id === m.dataset.milestone);
    const got = unlocked()[ms.id];
    return openSheet({
      title: ms.name,
      page: `/me/milestone/${ms.id}`,
      html: `<div style="text-align:center;padding:10px 0 20px">${sealSVG(ms.glyph).replace('class="seal"', `class="seal" style="width:120px;height:120px;margin:0 auto 14px;${got ? '' : 'filter:grayscale(1);opacity:.3'}"`)}
        <p class="serif" style="font-size:1.3rem;margin:0 0 6px">${esc(ms.desc)}</p>
        <p class="faint small">${got ? `Earned ${esc(relDay(got))}` : 'Not yet earned — keep praying!'}</p></div>`,
    });
  }

  const th = t.closest('[data-theme-set]');
  if (th) { (await import('../app.js')).applyTheme(th.dataset.themeSet); settingEvent('theme', th.dataset.themeSet); return render(); }
  const sz = t.closest('[data-size-set]');
  if (sz) { (await import('../app.js')).applySize(sz.dataset.sizeSet); settingEvent('text_size', sz.dataset.sizeSet); return render(); }

  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'edit-name') {
    openSheet({
      title: 'Your name',
      page: '/me/name',
      html: `<input class="field" data-name value="${esc(store.get('profile', {}).name || '')}" placeholder="First name" maxlength="40" autocomplete="given-name">`,
      foot: `<button class="btn btn-primary btn-block" data-save>Save</button>`,
      onMount(body, foot) {
        foot.onclick = () => {
          store.update('profile', {}, p => ({ ...p, name: body.querySelector('[data-name]').value.trim() }));
          closeSheet();
          import('../app.js').then(m => m.refreshAll());
          settingEvent('name', 'changed');
        };
      },
    });
  }
  if (act === 'test-push') push.test().catch(err => toast(err.message));
  if (act === 'install') openInstallSheet('me');
  if (act === 'share-app') shareApp('me');
  if (act === 'onboarding') (await import('../onboarding.js')).openOnboarding(true);
  if (act === 'export') {
    const data = JSON.stringify(store.exportAll(), null, 2);
    downloadFile(`anchor-backup-${store.isoDate()}.json`, new Blob([data], { type: 'application/json' }));
    toast('Backup downloaded');
    event('data_action', { action: 'backup' });
  }
  if (act === 'reset' && await confirmSheet({ title: 'Erase everything?', message: 'Your journal, intentions, streaks, milestones, chats and settings will be permanently removed from this device. Consider backing up first.', confirm: 'Erase', danger: true })) {
    await push.disable();
    event('data_action', { action: 'erase' });
    store.resetAll();
    location.reload();
  }
}

async function onChangeInput(e) {
  const t = e.target;
  if (t.dataset.rule) {
    const ids = [...root.querySelectorAll('[data-rule]')].filter(i => i.checked).map(i => i.dataset.rule);
    if (!ids.length) { t.checked = true; return toast('Keep at least one practice in your Rule'); }
    setRule(ids);
    toast('Daily Rule updated');
    settingEvent('daily_rule', `${t.checked ? 'add' : 'remove'}:${t.dataset.rule}`);
  }
  if (t.matches('[data-push]')) {
    const sub = root.querySelector('[data-push-sub]');
    if (t.checked) {
      sub.textContent = 'Turning on…';
      try { await push.enable(); toast('Reminders are on'); }
      catch (err) { t.checked = false; toast(err.message, { ms: 5000 }); }
    } else {
      await push.disable();
    }
    root.querySelector('[data-reminders]').innerHTML = remindersHTML();
  }
  if (t.dataset.slot || t.dataset.slotTime) {
    const r = { ...push.reminders() };
    for (const sl of push.SLOTS) {
      const on = root.querySelector(`[data-slot="${sl.id}"]`).checked;
      const time = root.querySelector(`[data-slot-time="${sl.id}"]`).value || sl.def;
      r[sl.id] = on ? time : null;
    }
    await push.setReminders(r);
    root.querySelector('[data-reminders]').innerHTML = remindersHTML();
    toast('Reminder times saved');
    settingEvent('reminder_times', push.SLOTS.filter(sl => r[sl.id]).map(sl => sl.id).join('+') || 'none');
  }
  if (t.matches('[data-confession]')) {
    store.set('confessionWeeks', +t.value);
    settingEvent('confession_reminder', +t.value ? `${t.value}_weeks` : 'off');
    toast(+t.value ? 'We’ll gently remind you on the Today screen' : 'Confession reminder off');
  }
  if (t.matches('[data-import]') && t.files[0]) {
    try {
      store.importAll(JSON.parse(await t.files[0].text()));
      toast('Backup restored');
      event('data_action', { action: 'restore' });
      setTimeout(() => location.reload(), 800);
    } catch (err) { toast(err.message || 'That file isn’t an Anchor backup'); }
  }
}
