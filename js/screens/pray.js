// Pray: guided practices, novenas, prayer library, saints.
import * as store from '../store.js';
import { esc } from '../ui.js';
import { icon } from '../icons.js';
import { PRAYER_LIBRARY } from '../data/prayers.js';
import { NOVENAS } from '../data/novenas.js';
import { launch, dayLog, onChange } from '../practices.js';
import { mysterySet } from '../liturgy.js';
import { searchSaints, PATRON_TAGS, isFavSaint } from './saints.js';

let root, tab = 'guided', saintTag = null, bound = false;

export function mount(el) {
  root = el;
  el.innerHTML = `
    <header class="hero hero-compact">
      <div class="ribbon" aria-hidden="true"></div>
      <div class="hero-top"><span class="eyebrow">Ora et labora</span></div>
      <h1 class="hero-title">Pray</h1>
      <p class="hero-sub">Guided prayer, the Church’s treasury, and the saints</p>
      <div class="seg seg-hero" role="tablist">
        <button role="tab" data-tab="guided">Guided</button>
        <button role="tab" data-tab="prayers">Prayers</button>
        <button role="tab" data-tab="saints">Saints</button>
      </div>
    </header>
    <div class="page" data-body></div>`;
  el.addEventListener('click', onClick);
  el.addEventListener('input', onInput);
  if (!bound) { onChange(() => { if (tab === 'guided') render(); }); bound = true; }
  render();
}

export function show(opts = {}) {
  if (opts.tab) tab = opts.tab;
  render();
}

function render() {
  root.querySelectorAll('[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', b.dataset.tab === tab);
  });
  const body = root.querySelector('[data-body]');
  body.className = 'page stagger';
  if (tab === 'guided') body.innerHTML = guided();
  if (tab === 'prayers') { body.innerHTML = prayersShell(); renderPrayers(''); }
  if (tab === 'saints') { body.innerHTML = saintsShell(); renderSaints(''); }
}

// ---- Guided ----
function guided() {
  const done = dayLog();
  const lit = store.get('cache:lit:' + store.isoDate());
  const set = mysterySet(new Date(), lit?.season);
  const saved = store.get('beads:rosary');
  const resume = saved && saved.date === store.isoDate() && saved.step > 0;
  const novenas = store.get('novenas', {});
  const card = (id, ic, title, sub, extra = '') => `
    <button class="guide" data-launch="${id}">
      ${done[id] ? `<span class="badge done">${icon('check')}</span>` : extra}
      <span class="gi">${icon(ic)}</span>
      <span><span class="gt" style="display:block">${title}</span><span class="gs" style="display:block">${sub}</span></span>
    </button>`;

  return `
    <div class="guide-grid">
      <button class="guide feature" data-launch="rosary">
        <span class="badge">${done.rosary ? `${icon('check')} Prayed today` : resume ? 'Resume' : 'Today'}</span>
        <span class="gi">${icon('rosary')}</span>
        <span><span class="gt" style="display:block">The Holy Rosary</span><span class="gs" style="display:block">${set} Mysteries · guided bead by bead</span></span>
      </button>
      ${card('chaplet', 'mercy', 'Divine Mercy Chaplet', 'The Hour of Mercy · 8 min')}
      ${card('lectio', 'candle', 'Lectio Divina', 'Pray with today’s Gospel')}
      ${card('examen', 'moon', 'Daily Examen', 'Five steps with St. Ignatius')}
      ${card('silence', 'hourglass', 'Silent Prayer', 'Timer & bell · Holy Hour')}
      ${card('confession', 'key', 'Confession', 'Examination & how-to')}
      ${card('angelus', 'bell', 'The Angelus', 'Morning, noon & evening')}
    </div>

    <div class="section-head"><h2 class="section-title">Novenas</h2><span class="faint small">Nine days of prayer</span></div>
    <div class="list">
      ${NOVENAS.map(n => {
        const a = novenas[n.id];
        return `<button class="row" data-novena="${n.id}">
          <span class="row-icon">${icon(n.icon)}</span>
          <span class="row-main"><span class="row-title" style="display:block">${esc(n.name)}</span>
          <span class="row-sub" style="display:block">${a ? `Day ${Math.min(9, a.days.length + (a.days.includes(store.isoDate()) ? 0 : 1))} of 9${a.intention ? ' · ' + esc(a.intention) : ''}` : esc(n.sub)}</span>
          ${a ? `<span style="display:block;margin-top:8px"><span class="progress"><i style="width:${(a.days.length / 9) * 100}%"></i></span></span>` : ''}</span>
          <span class="row-end">${a ? (a.days.includes(store.isoDate()) ? `<span class="badge done">${icon('check')}</span>` : '<span class="badge">Pray</span>') : icon('chev')}</span>
        </button>`;
      }).join('')}
    </div>`;
}

// ---- Prayers ----
function prayersShell() {
  return `
    <div class="search" style="margin-bottom:14px">${icon('search')}<input class="field" type="search" data-search="prayers" placeholder="Search prayers" aria-label="Search prayers"></div>
    <div data-list></div>`;
}

function renderPrayers(q) {
  const favs = store.get('favPrayers', []);
  const s = q.trim().toLowerCase();
  const items = PRAYER_LIBRARY.filter(p => !s || (p.title || p.name).toLowerCase().includes(s) || p.sub.toLowerCase().includes(s));
  const groups = {};
  if (!s && favs.length) groups['★ Favorites'] = PRAYER_LIBRARY.filter(p => favs.includes(p.name));
  for (const p of items) (groups[p.cat] ||= []).push(p);
  const list = root.querySelector('[data-list]');
  list.innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([cat, ps]) => `
    <div class="list-label">${esc(cat)}</div>
    <div class="list">${ps.map(p => `
      <button class="row" data-prayer="${esc(p.name)}">
        <span class="row-main"><span class="row-title" style="display:block">${esc(p.title || p.name)}</span><span class="row-sub" style="display:block">${esc(p.sub)}</span></span>
        <span class="row-end">${favs.includes(p.name) ? `<span style="color:var(--gold)">${icon('star')}</span>` : ''}${icon('chev')}</span>
      </button>`).join('')}</div>`).join('')
    : `<div class="empty"><div class="big">${icon('search')}</div><p>No prayers match “${esc(q)}”. Try asking Anchor to teach you one.</p></div>`;
}

// ---- Saints ----
function saintsShell() {
  return `
    <div class="search" style="margin-bottom:12px">${icon('search')}<input class="field" type="search" data-search="saints" placeholder="Search saints or a need…" aria-label="Search saints"></div>
    <div class="list-label" style="margin-top:4px">Find a patron</div>
    <div class="chips scroll" style="margin-bottom:6px">${PATRON_TAGS.map(([t]) => `<button class="chip ${saintTag === t ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}</div>
    <div data-list></div>`;
}

// Illuminated-initial style: "St. Thérèse of Lisieux" → T, "The Blessed Virgin Mary" → M.
const monogram = name => name.replace(/^(St\.|Saint|The Blessed Virgin|The)\s+/, '').charAt(0);

function renderSaints(q) {
  const list = searchSaints(q, saintTag);
  const favs = list.filter(x => isFavSaint(x.name));
  const rest = list.filter(x => !isFavSaint(x.name));
  const row = x => `
    <button class="row" data-saint="${esc(x.name)}">
      <span class="row-icon mono" aria-hidden="true">${monogram(x.name)}</span>
      <span class="row-main"><span class="row-title" style="display:block">${esc(x.name)}</span><span class="row-sub" style="display:block">${esc(x.patron.slice(0, 3).join(' · '))}</span></span>
      <span class="row-end">${icon('chev')}</span>
    </button>`;
  root.querySelector('[data-list]').innerHTML =
    (favs.length ? `<div class="list-label">★ Your saints</div><div class="list">${favs.map(row).join('')}</div>` : '') +
    (rest.length ? `<div class="list-label">${saintTag ? `Patrons of ${esc(saintTag)}` : 'Saints'}</div><div class="list">${rest.map(row).join('')}</div>` : '') +
    (!list.length ? `<div class="empty"><div class="big">${icon('dove')}</div><p>No saints found. Try another word — or ask Anchor “Who is the patron saint of…?”</p></div>` : '');
}

// ---- Events ----
async function onClick(e) {
  const t = e.target;
  const tb = t.closest('[data-tab]');
  if (tb) { tab = tb.dataset.tab; return render(); }

  const ln = t.closest('[data-launch]');
  if (ln) return launch(ln.dataset.launch);

  const nv = t.closest('[data-novena]');
  if (nv) return (await import('../features/novena.js')).openNovena(nv.dataset.novena, () => tab === 'guided' && render());

  const pr = t.closest('[data-prayer]');
  if (pr) return (await import('../features/reader.js')).openPrayer(pr.dataset.prayer, { practice: pr.dataset.prayer === 'Angelus' ? 'angelus' : undefined });

  const tag = t.closest('[data-tag]');
  if (tag) {
    saintTag = saintTag === tag.dataset.tag ? null : tag.dataset.tag;
    root.querySelectorAll('[data-tag]').forEach(c => c.classList.toggle('active', c.dataset.tag === saintTag));
    return renderSaints(root.querySelector('[data-search="saints"]').value);
  }

  const st = t.closest('[data-saint]');
  if (st) return (await import('./saints.js')).openSaint(st.dataset.saint);
}

function onInput(e) {
  const s = e.target.dataset.search;
  if (s === 'prayers') renderPrayers(e.target.value);
  if (s === 'saints') renderSaints(e.target.value);
}
