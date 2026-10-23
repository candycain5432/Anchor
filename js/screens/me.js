// Me: progress, milestones, Daily Rule, reminders, appearance, data, about.
import * as store from '../store.js';
import { esc, openSheet, closeSheet, toast, confirmSheet, downloadFile, sealSVG, relDay } from '../ui.js';
import { icon } from '../icons.js';
import { PRACTICES, rule, setRule, log, streak, bestStreak, totalDays, MILESTONES, unlocked, onChange } from '../practices.js';
import * as push from '../push.js';

export const VERSION = '9.0';
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
    <div class="page stagger">
      <div class="card">
        <div class="card-label">Last 12 weeks</div>
        ${heatmap()}
      </div>

      <div class="card">
        <div class="card-label">Milestones<span class="spacer"></span><span class="faint" style="letter-spacing:.04em">${Object.keys(unlocked()).length}/${MILESTONES.length}</span></div>
        <div class="seal-grid">${MILESTONES.map(m => `
          <button class="seal-cell ${unlocked()[m.id] ? '' : 'locked'}" data-milestone="${m.id}">${sealSVG(m.glyph)}<div class="sn">${esc(m.name)}</div></button>`).join('')}</div>
      </div>

      <div class="list-label">Your Daily Rule</div>
      <div class="list">
        ${Object.entries(PRACTICES).map(([id, p]) => `
          <label class="row">
            <span class="row-icon">${p.icon}</span>
            <span class="row-main"><span class="row-title" style="display:block">${esc(p.name)}</span><span class="row-sub" style="display:block">${esc(p.sub)} · ~${p.min} min</span></span>
            <span class="switch"><input type="checkbox" data-rule="${id}" ${rule().includes(id) ? 'checked' : ''} aria-label="${esc(p.name)}"><span></span></span>
          </label>`).join('')}
      </div>

      <div class="list-label">Reminders</div>
      <div class="list" data-reminders>${remindersHTML()}</div>

      <div class="list-label">Confession</div>
      <div class="list">
        <div class="row">
          <span class="row-icon">🗝️</span>
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
      <div class="list">
        <button class="row" data-act="onboarding"><span class="row-icon">✦</span><span class="row-main"><span class="row-title">Personalize Anchor again</span></span><span class="row-end">${icon('chev')}</span></button>
        <button class="row" data-act="privacy"><span class="row-icon">🔒</span><span class="row-main"><span class="row-title">Privacy Policy</span></span><span class="row-end">${icon('chev')}</span></button>
        <div class="row"><span class="row-icon">⚓</span><span class="row-main"><span class="row-title" style="display:block">Anchor ${VERSION}</span><span class="row-sub" style="display:block">Made with love by William Cain · AI by OpenAI</span></span></div>
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

// ---- Privacy policy ----
function openPrivacy() {
  const h = 'class="serif" style="font-size:1.25rem;font-weight:600;margin:22px 0 6px"';
  openSheet({
    title: 'Privacy Policy',
    full: true,
    html: `<div style="font-size:.92rem;line-height:1.7">
      <p class="faint small" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700">Last updated: October 2026</p>
      <p>Anchor is a free Catholic prayer companion built and maintained by William Cain. This policy explains plainly what data the app touches, why, and what we do (and don’t do) with it.</p>
      <h3 ${h}>The short version</h3>
      <p>There are no accounts, no ads, and we never sell data. Your journal, intentions, progress, and chat history live only on your device. Data leaves your phone only when you use AI features or turn on reminders, and none of it is tied to your identity. We use Google Analytics to understand, in aggregate, which features people use.</p>
      <h3 ${h}>What stays on your device</h3>
      <p>Stored only in your browser’s local storage and never sent to us: your name (if you give one), Daily Rule and prayer log, streaks and milestones, prayer intentions, gratitude entries and notes, Ask Anchor conversation history, favorites, novena progress, last-confession date, theme and text settings, your approximate location for finding churches, and cached readings for offline use. You can back it up or erase it anytime from the Me tab.</p>
      <h3 ${h}>Ask Anchor (AI chat)</h3>
      <p>When you send a message, its text — along with the last few messages of that conversation and, if you chose “Ask about this,” the reading or saint you’re asking about — is sent to our server to generate a reply using OpenAI. Our server does not log or store your messages and keeps no conversation history; your history stays on your device. OpenAI processes each request under its own privacy policy.</p>
      <h3 ${h}>“Help me pray” and Lectio Divina</h3>
      <p>If you ask Anchor to write a prayer for an intention, only that intention’s text is sent to generate the prayer. It is not stored on the server. Lectio Divina questions are generated once per day for everyone from the day’s Gospel — no personal data is involved.</p>
      <h3 ${h}>Reminders (push notifications)</h3>
      <p>If you turn on reminders, your browser creates a push subscription (a technical address for delivering notifications). Our server stores it with your timezone and chosen reminder times, only to send your reminders. It isn’t linked to your name, email, or location. Turning reminders off deletes it from our server.</p>
      <h3 ${h}>Third-party services</h3>
      <ul style="padding-left:1.2em">
        <li><b>Google Fonts</b> — loads the app’s typefaces.</li>
        <li><b>Catholic Readings API</b> (GitHub Pages) and <b>bible-api.com</b> — the liturgical calendar and reading texts.</li>
        <li><b>bible.org</b> — the verse of the day.</li>
        <li><b>Wikipedia</b> — saint biographies and images.</li>
        <li><b>OpenStreetMap (Overpass)</b> — nearby churches; your coordinates are sent only when you search.</li>
        <li><b>OpenAI</b> (via our server) — AI features, as described above.</li>
      </ul>
      <h3 ${h}>Google Analytics</h3>
      <p>Anchor uses Google Analytics to understand how the app is used — for example, how many people open it, which features are used, device type, and general (country-level) region. We also record anonymous events like “a Rosary was completed” so we know which features help people pray. This data is aggregated; we don’t use it to identify or target individuals. Google Analytics uses cookies and is governed by Google’s Privacy Policy (policies.google.com/privacy). You can opt out with the Google Analytics Opt-out Browser Add-on (tools.google.com/dlpage/gaoptout).</p>
      <h3 ${h}>Children’s privacy</h3>
      <p>Anchor does not knowingly collect personal information from children under 13 and requires no personal data to use.</p>
      <h3 ${h}>Changes</h3>
      <p>If this policy changes materially, the date above will change. The policy is always available from the Me tab.</p>
      <h3 ${h}>Contact</h3>
      <p>Questions? Reach out to <b>William Cain</b> at <a class="link" href="mailto:williamtylercain441@gmail.com">williamtylercain441@gmail.com</a>.</p>
    </div>`,
  });
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
      html: `<div style="text-align:center;padding:10px 0 20px">${sealSVG(ms.glyph).replace('class="seal"', `class="seal" style="width:120px;height:120px;margin:0 auto 14px;${got ? '' : 'filter:grayscale(1);opacity:.3'}"`)}
        <p class="serif" style="font-size:1.3rem;margin:0 0 6px">${esc(ms.desc)}</p>
        <p class="faint small">${got ? `Earned ${esc(relDay(got))}` : 'Not yet earned — keep praying!'}</p></div>`,
    });
  }

  const th = t.closest('[data-theme-set]');
  if (th) { (await import('../app.js')).applyTheme(th.dataset.themeSet); return render(); }
  const sz = t.closest('[data-size-set]');
  if (sz) { (await import('../app.js')).applySize(sz.dataset.sizeSet); return render(); }

  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'edit-name') {
    openSheet({
      title: 'Your name',
      html: `<input class="field" data-name value="${esc(store.get('profile', {}).name || '')}" placeholder="First name" maxlength="40" autocomplete="given-name">`,
      foot: `<button class="btn btn-primary btn-block" data-save>Save</button>`,
      onMount(body, foot) {
        foot.onclick = () => {
          store.update('profile', {}, p => ({ ...p, name: body.querySelector('[data-name]').value.trim() }));
          closeSheet();
          import('../app.js').then(m => m.refreshAll());
        };
      },
    });
  }
  if (act === 'test-push') push.test().catch(err => toast(err.message));
  if (act === 'privacy') openPrivacy();
  if (act === 'onboarding') (await import('../onboarding.js')).openOnboarding(true);
  if (act === 'export') {
    const data = JSON.stringify(store.exportAll(), null, 2);
    downloadFile(`anchor-backup-${store.isoDate()}.json`, new Blob([data], { type: 'application/json' }));
    toast('Backup downloaded');
  }
  if (act === 'reset' && await confirmSheet({ title: 'Erase everything?', message: 'Your journal, intentions, streaks, milestones, chats and settings will be permanently removed from this device. Consider backing up first.', confirm: 'Erase', danger: true })) {
    await push.disable();
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
  }
  if (t.matches('[data-confession]')) {
    store.set('confessionWeeks', +t.value);
    toast(+t.value ? 'We’ll gently remind you on the Today screen' : 'Confession reminder off');
  }
  if (t.matches('[data-import]') && t.files[0]) {
    try {
      store.importAll(JSON.parse(await t.files[0].text()));
      toast('Backup restored');
      setTimeout(() => location.reload(), 800);
    } catch (err) { toast(err.message || 'That file isn’t an Anchor backup'); }
  }
}
