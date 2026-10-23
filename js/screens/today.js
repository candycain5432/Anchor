// Today: the home screen.
import * as store from '../store.js';
import * as api from '../api.js';
import { esc, greeting, fmtDate, track } from '../ui.js';
import { icon } from '../icons.js';
import { PRACTICES, rule, dayLog, streak, launch, onChange, complete } from '../practices.js';
import { season, rank, isFeria, litColor, isSaint, saintFallback, COLOR_NAMES, COLOR_HEX, mysterySet } from '../liturgy.js';

let root, day = null, bound = false;

export function mount(el) {
  root = el;
  const name = store.get('profile', {}).name;
  const now = new Date();
  el.innerHTML = `
    <header class="hero">
      <div class="ribbon" aria-hidden="true"></div>
      <div class="hero-top">
        <span class="eyebrow">${esc(fmtDate(now))}</span>
        <div class="hero-actions"><button class="hero-btn flame" data-go="me" aria-label="Your streak" data-streak></button></div>
      </div>
      <h1 class="hero-title">${esc(greeting(now))}${name ? `,<br><em>${esc(name)}</em>` : ''}</h1>
      <p class="hero-sub" data-day-name>&nbsp;</p>
      <div class="hero-day" data-day-pills></div>
    </header>
    <div class="page stagger">
      <div class="card now-card" role="button" tabindex="0" data-now></div>
      <div class="card rule-card" data-rule></div>
      <div class="card" data-confession hidden></div>

      <div class="card verse-card" data-verse>
        <div class="card-label">Verse of the Day</div>
        <p class="verse-text skel">Loading the verse of the day…</p>
        <div class="verse-cite">&nbsp;</div>
      </div>

      <div class="card" data-reflect>
        <div class="card-label">Daily Reflection</div>
        <p class="reflect-text skel">Loading today’s reflection, one moment…</p>
      </div>

      <div class="card saint-card" role="button" tabindex="0" data-saint>
        <div class="saint-art"><span class="glyph">✝︎</span></div>
        <div class="saint-body"><div class="card-label" style="margin-bottom:6px">Saint of the Day</div><h3 class="saint-name skel">Loading…</h3></div>
      </div>

      <div class="card" data-readings>
        <div class="card-label">Mass Readings<span class="spacer"></span></div>
        <div class="skel skel-line"></div><div class="skel skel-line" style="width:70%"></div>
      </div>

      <div class="section-head"><h2 class="section-title">This week in the Church</h2></div>
      <div class="week" data-week></div>

      <div class="card" data-churches>
        <div class="card-label">Catholic Churches Near You</div>
        <div data-church-list></div>
      </div>

      <div class="card" data-install hidden></div>

      <p class="faint small serif" style="text-align:center;font-style:italic;font-size:1rem;margin:22px 0 0">“We have this as a sure and steadfast anchor of the soul.” — Hebrews 6:19</p>
    </div>`;

  el.addEventListener('click', onClick);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-now],[data-saint]')) onClick(e); });
  if (!bound) { onChange(() => { renderPractice(); renderConfession(); }); bound = true; }

  renderPractice();
  renderConfession();
  loadDay();
  loadVerse();
  loadReflection();
  loadReadings();
  renderChurches();
  setupInstall();
}

export function show() {
  renderPractice();
}

// ---- Practice cards ----
const NOW = [
  { until: 5,  kicker: 'Before you rest',     ids: ['night', 'examen', 'gratitude'] },
  { until: 11, kicker: 'This morning',        ids: ['morning', 'readings', 'rosary'] },
  { until: 14, kicker: 'At midday',           ids: ['angelus', 'readings', 'rosary'] },
  { until: 15, kicker: 'This afternoon',      ids: ['readings', 'rosary', 'lectio'] },
  { until: 16, kicker: 'The Hour of Mercy',   ids: ['chaplet', 'rosary', 'silence'] },
  { until: 20, kicker: 'This evening',        ids: ['rosary', 'lectio', 'silence', 'readings'] },
  { until: 24, kicker: 'Before you rest',     ids: ['examen', 'night', 'gratitude'] },
];

function suggestion() {
  const h = new Date().getHours();
  const slot = NOW.find(s => h < s.until);
  const done = dayLog();
  const id = slot.ids.find(p => !done[p]) || rule().find(p => !done[p]);
  return id ? { id, kicker: slot.kicker } : null;
}

function renderPractice() {
  if (!root) return;
  const s = streak();
  const st = root.querySelector('[data-streak]');
  st.innerHTML = `${icon('flame')}<span>${s}</span>`;
  st.setAttribute('aria-label', `${s} day prayer streak`);

  const now = root.querySelector('[data-now]');
  const sug = suggestion();
  if (sug) {
    const p = PRACTICES[sug.id];
    const sub = sug.id === 'rosary' ? `${mysterySet(new Date(), day?.season)} Mysteries · ~${p.min} min` : `${p.sub} · ~${p.min} min`;
    now.dataset.now = sug.id;
    now.innerHTML = `
      <div class="now-icon" aria-hidden="true">${p.icon}</div>
      <div class="now-body"><div class="now-kicker">${sug.kicker}</div><div class="now-title">${esc(p.name)}</div><div class="now-sub">${esc(sub)}</div></div>
      <div class="now-go" aria-hidden="true">${icon('play')}</div>`;
  } else {
    now.dataset.now = 'gratitude';
    now.innerHTML = `
      <div class="now-icon" aria-hidden="true">🕊️</div>
      <div class="now-body"><div class="now-kicker">All done for today</div><div class="now-title">Rest in His peace</div><div class="now-sub">Add a note of gratitude before bed</div></div>
      <div class="now-go" aria-hidden="true">${icon('plus')}</div>`;
  }

  const ids = rule();
  const done = dayLog();
  const n = ids.filter(id => done[id]).length;
  const C = 2 * Math.PI * 44;
  root.querySelector('[data-rule]').innerHTML = `
    <div class="ring" role="img" aria-label="${n} of ${ids.length} practices done today">
      <svg viewBox="0 0 104 104"><circle class="track" cx="52" cy="52" r="44" fill="none" stroke-width="10"/>
      <circle class="fill" cx="52" cy="52" r="44" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - n / ids.length)}"/></svg>
      <div class="ring-label"><div><div class="ring-num">${n}<span style="font-size:1.1rem;color:var(--ink-3)">/${ids.length}</span></div><div class="ring-of">Daily Rule</div></div></div>
    </div>
    <div class="rule-list">
      ${ids.map(id => `<button class="rule-item ${done[id] ? 'done' : ''}" data-practice="${id}">
        <span class="rule-check">${icon('check')}</span><span class="rule-name">${esc(PRACTICES[id].name)}</span></button>`).join('')}
    </div>`;
}

function renderConfession() {
  const card = root.querySelector('[data-confession]');
  const weeks = store.get('confessionWeeks', 0);
  const last = store.get('lastConfession');
  const days = last ? Math.round((store.fromISO(store.isoDate()) - store.fromISO(last)) / 86400000) : null;
  if (!weeks || (days !== null && days < weeks * 7)) { card.hidden = true; return; }
  card.hidden = false;
  card.innerHTML = `
    <div class="card-label">Sacrament of Reconciliation</div>
    <p class="serif" style="font-size:1.2rem;margin:0 0 4px">${days === null ? 'When did you last go to Confession?' : `It’s been ${days >= 14 ? Math.floor(days / 7) + ' weeks' : days + ' days'} since your last Confession.`}</p>
    <p class="muted small" style="margin:0">“If we confess our sins, he is faithful and just and will forgive our sins.” — 1 John 1:9</p>
    <div class="card-actions"><button class="btn btn-primary btn-sm" data-launch="confession">${icon('check')} Prepare</button></div>`;
}

// ---- Liturgical day ----
async function loadDay() {
  try {
    day = await api.liturgicalDay();
  } catch {
    day = { season: store.get('lastSeason') || 'Ordinary Time', name: '', type: 'FERIA' };
  }
  store.set('lastSeason', day.season);
  const color = litColor(day);
  applyLit(color);

  const feria = isFeria(day);
  root.querySelector('[data-day-name]').textContent = feria ? (day.name || season(day.season).label) : day.name;
  root.querySelector('[data-day-pills]').innerHTML = `
    <span class="pill"><span class="dot"></span>${esc(season(day.season).label)}</span>
    ${rank(day.type) ? `<span class="pill">${esc(rank(day.type))}</span>` : ''}
    <span class="pill" title="Liturgical color">${esc(COLOR_NAMES[color])}</span>`;
  renderPractice();
  renderSaint();
  loadWeek();
}

export function applyLit(color) {
  document.documentElement.dataset.lit = color;
  store.set('lastLit', color);
}

async function renderSaint() {
  const card = root.querySelector('[data-saint]');
  const feria = isFeria(day) || !day.name;
  const fb = saintFallback();
  const name = feria ? fb.name : day.name;
  const label = feria ? 'Saint to Know Today' : isSaint(name) ? 'Saint of the Day' : 'Today’s Feast';
  const sub = feria ? fb.title : rank(day.type);
  card.dataset.saint = name;
  card.innerHTML = `
    <div class="saint-art"><span class="glyph">✝︎</span><img alt="" data-img></div>
    <div class="saint-body">
      <div class="card-label" style="margin-bottom:6px">${esc(label)}</div>
      <h3 class="saint-name">${esc(name)}</h3>
      ${sub ? `<div class="small faint">${esc(sub)}</div>` : ''}
      ${!feria && day.quote ? `<p class="saint-quote">“${esc(day.quote)}”</p>` : ''}
    </div>`;
  const info = await api.saintInfo(name).catch(() => null);
  if (info?.image) {
    const img = card.querySelector('[data-img]');
    img.onload = () => img.classList.add('loaded');
    img.src = info.image;
  }
}

async function loadWeek() {
  const el = root.querySelector('[data-week]');
  const days = Array.from({ length: 7 }, (_, i) => store.addDays(new Date(), i));
  el.innerHTML = days.map((d, i) => `<div class="day-chip ${i === 0 ? 'today' : ''}" data-i="${i}"><div class="d">${i === 0 ? 'Today' : esc(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }))}</div><div class="n skel" style="height:2.4em">…</div></div>`).join('');
  await Promise.all(days.map(async (d, i) => {
    const chip = el.querySelector(`[data-i="${i}"]`);
    try {
      const ld = i === 0 ? day : await api.liturgicalDay(store.isoDate(d));
      chip.style.setProperty('--c', COLOR_HEX[litColor(ld)]);
      chip.querySelector('.n').classList.remove('skel');
      chip.querySelector('.n').style.height = '';
      chip.querySelector('.n').textContent = ld.name || season(ld.season).label;
      const r = rank(ld.type);
      if (r) chip.insertAdjacentHTML('beforeend', `<div class="r">${esc(r)}</div>`);
    } catch {
      chip.querySelector('.n').classList.remove('skel');
      chip.querySelector('.n').textContent = '—';
    }
  }));
}

// ---- Verse, reflection, readings ----
let verse = null;
async function loadVerse() {
  const card = root.querySelector('[data-verse]');
  try {
    verse = await api.verseOfDay();
    card.innerHTML = `
      <div class="card-label">Verse of the Day</div>
      <p class="verse-text">${esc(verse.text)}</p>
      <div class="verse-cite">— ${esc(verse.cite)}</div>
      <div class="card-actions">
        <button class="btn btn-soft btn-sm" data-act="share-verse">${icon('share')} Share</button>
        <button class="btn btn-soft btn-sm" data-act="ask-verse">${icon('spark')} Reflect with Anchor</button>
      </div>`;
  } catch {
    card.innerHTML = `<div class="card-label">Verse of the Day</div><p class="verse-text">The Lord is my shepherd; I shall not want.</p><div class="verse-cite">— Psalm 23:1</div>`;
  }
}

let reflectionText = '', readingsData = null;
async function loadReflection() {
  const card = root.querySelector('[data-reflect]');
  const p = card.querySelector('.reflect-text');
  try {
    const r = await api.reflection();
    reflectionText = r.reflection;
    p.classList.remove('skel');
    p.textContent = reflectionText;
    card.insertAdjacentHTML('beforeend', `<div class="card-actions"><button class="btn btn-soft btn-sm" data-act="ask-reflection">${icon('chat')} Talk about this</button></div>`);
  } catch {
    p.classList.remove('skel');
    p.textContent = 'Today’s reflection couldn’t load. Pause for a moment and offer this day to God — He is near.';
  }
}

async function loadReadings() {
  const card = root.querySelector('[data-readings]');
  try {
    const r = await api.readings();
    readingsData = r;
    card.innerHTML = `
      <div class="card-label">Mass Readings<span class="spacer"></span>${dayLog().readings ? `<span class="badge done">${icon('check')} Read</span>` : ''}</div>
      ${r.sections.map(s => `
        <div class="reading" data-section="${s.id}">
          <button class="reading-head" data-toggle-reading="${s.id}" aria-expanded="false">
            <div><div class="t">${esc(s.label)}</div><div class="c">${esc(s.cite)}</div></div>${icon('chev', 'chev')}
          </button>
          <div class="reading-body">
            <p class="reading-text">${s.text ? esc(s.text) : `<em class="muted">Couldn’t load this text — open ${esc(s.cite)} in your Bible, or try again later.</em>`}</p>
            <div class="card-actions" style="margin-top:0">
              <button class="btn btn-soft btn-sm" data-ask-reading="${s.id}">${icon('spark')} Ask Anchor</button>
              ${s.id === 'gospel' ? `<button class="btn btn-soft btn-sm" data-launch="lectio">${icon('candle')} Lectio Divina</button>` : ''}
            </div>
          </div>
        </div>`).join('')}
      <div class="card-actions">
        <button class="btn btn-primary btn-sm" data-reading="first">${icon('book')} Open full readings</button>
      </div>`;
  } catch {
    card.innerHTML = `<div class="card-label">Mass Readings</div><p class="muted small" style="margin:0">Couldn’t load today’s readings. Check your connection.</p>`;
  }
}

// ---- Churches ----
function renderChurches(list) {
  const el = root.querySelector('[data-church-list]');
  const cache = store.get('churches');
  list ||= cache && Date.now() - cache.ts < 86400000 ? cache.list : null;
  if (!list) {
    el.innerHTML = `<p class="muted small" style="margin:0 0 12px">Find a parish for Mass, Confession, or a visit to the Blessed Sacrament.</p>
      <button class="btn btn-primary btn-block" data-act="churches">${icon('pin')} Find churches near me</button>`;
    if (store.get('loc')) findChurches(true);
    return;
  }
  if (!list.length) {
    el.innerHTML = `<p class="muted small">No Catholic churches found within 10 miles.</p><button class="btn btn-soft btn-block" data-act="churches">Search again</button>`;
    return;
  }
  el.innerHTML = list.map(c => {
    const q = encodeURIComponent(`${c.name} ${c.addr}`);
    return `<div class="church">
      <div style="flex:1;min-width:0"><div class="nm">${esc(c.name)}</div><div class="ad">${esc(c.addr || 'Address unavailable')}</div></div>
      <div class="mi">${c.dist < .1 ? '<0.1' : c.dist.toFixed(1)} mi</div>
      <div class="church-links">
        <a class="icon-btn" href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}" target="_blank" rel="noopener" aria-label="Directions to ${esc(c.name)}">${icon('map')}</a>
        <a class="icon-btn" href="https://www.google.com/search?q=${q}%20mass%20times" target="_blank" rel="noopener" aria-label="Mass times for ${esc(c.name)}">${icon('clock')}</a>
      </div></div>`;
  }).join('') + `<button class="btn btn-ghost btn-sm" data-act="churches" style="margin-top:6px">${icon('history')} Refresh</button>`;
}

async function findChurches(quiet = false) {
  const el = root.querySelector('[data-church-list]');
  let loc = store.get('loc');
  if (!loc || !quiet) {
    el.innerHTML = `<p class="muted small">Getting your location…</p>`;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, maximumAge: 600000 }));
      loc = store.set('loc', { lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch (err) {
      if (quiet) return;
      el.innerHTML = `<p class="muted small">${err.code === 1 ? 'Location access was denied — you can enable it in your browser settings.' : 'Couldn’t get your location.'}</p>
        <button class="btn btn-soft btn-block" data-act="churches">Try again</button>`;
      return;
    }
  }
  if (!quiet) el.innerHTML = `<p class="muted small">Finding churches nearby…</p>`;
  try {
    const list = await api.nearbyChurches(loc.lat, loc.lon);
    store.set('churches', { ts: Date.now(), list });
    renderChurches(list);
  } catch {
    if (!quiet) el.innerHTML = `<p class="muted small">Couldn’t load churches. Check your connection.</p><button class="btn btn-soft btn-block" data-act="churches">Try again</button>`;
  }
}

// ---- Install prompt ----
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; setupInstall(); });

function setupInstall() {
  if (!root) return;
  const card = root.querySelector('[data-install]');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (standalone || store.get('installDismissed') || (!deferredInstall && !ios)) { card.hidden = true; return; }
  card.hidden = false;
  card.innerHTML = `
    <div class="card-label">Keep Anchor close<span class="spacer"></span><button class="icon-btn" style="width:30px;height:30px" data-act="dismiss-install" aria-label="Dismiss">${icon('x')}</button></div>
    <p class="muted small" style="margin:0 0 12px">${deferredInstall
      ? 'Add Anchor to your home screen for one-tap prayer, offline readings, and daily reminders.'
      : 'Tap the Share button in Safari, then “Add to Home Screen” — for one-tap prayer and daily reminders.'}</p>
    ${deferredInstall ? `<button class="btn btn-primary btn-block" data-act="install">${icon('download')} Add to Home Screen</button>` : ''}`;
}

// ---- Events ----
async function onClick(e) {
  const t = e.target;
  const go = t.closest('[data-go]');
  if (go) return (await import('../app.js')).navigate(go.dataset.go);

  const now = t.closest('[data-now]');
  if (now) return launch(now.dataset.now);

  const pr = t.closest('[data-practice]');
  if (pr) return launch(pr.dataset.practice);

  const ln = t.closest('[data-launch]');
  if (ln) return launch(ln.dataset.launch);

  const tg = t.closest('[data-toggle-reading]');
  if (tg) {
    const item = tg.closest('.reading');
    const open = item.classList.toggle('open');
    tg.setAttribute('aria-expanded', open);
    if (open && root.querySelectorAll('[data-readings] .reading.open').length === readingsData.sections.length) complete('readings');
    return;
  }
  const ar = t.closest('[data-ask-reading]');
  if (ar) {
    const s = readingsData.sections.find(x => x.id === ar.dataset.askReading);
    return (await import('./ask.js')).askAbout({
      kind: 'reading', title: `${s.label} — ${s.cite}`, text: s.text || s.cite,
      prompt: `Help me understand today's ${s.label.toLowerCase()} (${s.cite}). What is it saying, and how can I live it today?`,
    });
  }

  const rd = t.closest('[data-reading]');
  if (rd) return launch('readings', { focus: rd.dataset.reading });

  const saint = t.closest('[data-saint]');
  if (saint && saint.dataset.saint) {
    return (await import('./saints.js')).openSaint(saint.dataset.saint, isFeria(day) ? {} : { quote: day.quote, description: day.description });
  }

  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'share-verse' && verse) {
    (await import('../features/share-card.js')).shareCard({ kind: 'verse', text: verse.text, cite: verse.cite });
  } else if (act === 'ask-verse' && verse) {
    (await import('./ask.js')).askAbout({ kind: 'verse', title: verse.cite, text: verse.text, prompt: `Help me reflect on ${verse.cite}: what does it mean, and how can I live it today?` });
  } else if (act === 'ask-reflection') {
    (await import('./ask.js')).askAbout({ kind: 'reflection', title: 'Today’s reflection', text: reflectionText, prompt: 'I’d like to talk about today’s reflection. How can I put it into practice?' });
  } else if (act === 'churches') {
    findChurches(false);
  } else if (act === 'install' && deferredInstall) {
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    track('install_prompt', { outcome });
    deferredInstall = null;
    setupInstall();
  } else if (act === 'dismiss-install') {
    store.set('installDismissed', true);
    setupInstall();
  }
}

