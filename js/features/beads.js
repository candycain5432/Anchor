// Guided bead player for the Holy Rosary and the Divine Mercy Chaplet.
// One step per bead: the bead lights up, the prayer text is on screen, tap/swipe advances.
import { PRAYERS, ROSARY_MYSTERIES, ROSARY_CLOSING, CHAPLET } from '../data/prayers.js';
import * as store from '../store.js';
import { openSheet, closeSheet, esc, haptic, toast, sealSVG } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount, checkMilestones } from '../practices.js';
import { mysterySet } from '../liturgy.js';

// ---------- Geometry ----------
const CX = 150, CY = 150, RX = 118, RY = 132;
const MEDAL = { x: CX, y: CY + RY };
const SLOTS = 55; // slot 0 is the medal; 54 loop beads

function loopPos(slot) {
  const a = Math.PI / 2 - (slot * 2 * Math.PI) / SLOTS;
  return { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) };
}

function buildBeads() {
  const beads = {};
  let slot = 1;
  for (let d = 1; d <= 5; d++) {
    for (let h = 1; h <= 10; h++) beads[`d${d}h${h}`] = { ...loopPos(slot++), r: 6.2 };
    if (d < 5) beads[`D${d + 1}`] = { ...loopPos(slot++), r: 9 };
  }
  const y0 = MEDAL.y;
  beads.L1 = { x: CX, y: y0 + 30, r: 9 };
  beads.s3 = { x: CX, y: y0 + 54, r: 6.2 };
  beads.s2 = { x: CX, y: y0 + 72, r: 6.2 };
  beads.s1 = { x: CX, y: y0 + 90, r: 6.2 };
  beads.L0 = { x: CX, y: y0 + 114, r: 9 };
  return beads;
}
const BEADS = buildBeads();
const CROSS_Y = MEDAL.y + 136;

function svg() {
  let s = `<svg class="beads" viewBox="0 0 300 ${CROSS_Y + 46}" aria-hidden="true">
    <defs><filter id="beadGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <ellipse class="chain" cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}"/>
    <line class="chain" x1="${CX}" y1="${MEDAL.y}" x2="${CX}" y2="${CROSS_Y}"/>`;
  for (const [id, b] of Object.entries(BEADS)) {
    s += `<circle class="b" data-bead="${id}" cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${b.r}"/>`;
  }
  s += `<path class="medal" data-bead="medal" d="M${CX} ${MEDAL.y - 13} l11 9 -4 15 h-14 l-4 -15 z"/>`;
  s += `<g class="cross" data-bead="cross"><rect class="cross" data-bead="cross" x="${CX - 5}" y="${CROSS_Y}" width="10" height="40" rx="2"/><rect class="cross" data-bead="cross" x="${CX - 14}" y="${CROSS_Y + 9}" width="28" height="9" rx="2"/></g>`;
  return s + '</svg>';
}

// ---------- Step sequences ----------
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
const CREED = PRAYERS['Apostles Creed'];
const SIGN = PRAYERS['Sign of the Cross'];

function parseMystery([title, text]) {
  const parts = text.split('\n\n');
  const fruit = (/Fruit of the mystery:\s*(.+)/.exec(text) || [])[1] || '';
  return { title, meditation: parts[0], fruit };
}

function rosarySteps(set) {
  const m = ROSARY_MYSTERIES[set].map(parseMystery);
  const steps = [
    { bead: 'cross', k: 'Begin', t: `${SIGN}\n\n${CREED}` },
    { bead: 'L0', k: 'Our Father', t: PRAYERS['Our Father'] },
    { bead: 's1', k: 'Hail Mary · for Faith', t: PRAYERS['Hail Mary'], n: 1, of: 3 },
    { bead: 's2', k: 'Hail Mary · for Hope', t: PRAYERS['Hail Mary'], n: 2, of: 3 },
    { bead: 's3', k: 'Hail Mary · for Charity', t: PRAYERS['Hail Mary'], n: 3, of: 3 },
    { bead: 'L1', k: 'Glory Be', t: PRAYERS['Glory Be'] },
  ];
  m.forEach((my, i) => {
    const d = i + 1, decade = { ...my, d };
    steps.push({ bead: d === 1 ? 'L1' : `D${d}`, decade, announce: true, k: `The ${ORD[i]} ${set} Mystery`, t: `${my.meditation}\n\n${PRAYERS['Our Father']}` });
    for (let h = 1; h <= 10; h++) steps.push({ bead: `d${d}h${h}`, decade, k: 'Hail Mary', t: PRAYERS['Hail Mary'], n: h, of: 10 });
    steps.push({ bead: null, decade, k: 'Glory Be · Fatima Prayer', t: `${PRAYERS['Glory Be']}\n\n${PRAYERS['Fatima Prayer']}`, decadeEnd: true });
  });
  steps.push({ bead: 'medal', k: 'Hail, Holy Queen', t: PRAYERS['Hail Holy Queen'] });
  steps.push({ bead: 'cross', k: 'Closing Prayer', t: `${ROSARY_CLOSING}\n\n${SIGN}`, last: true });
  return steps;
}

function chapletSteps() {
  const steps = [
    { bead: 'cross', k: 'Begin', t: `${SIGN}\n\n${CHAPLET.opening}` },
    { bead: 'L0', k: 'Our Father', t: PRAYERS['Our Father'] },
    { bead: 's1', k: 'Hail Mary', t: PRAYERS['Hail Mary'] },
    { bead: 's2', k: 'Apostles’ Creed', t: CREED },
  ];
  for (let d = 1; d <= 5; d++) {
    const decade = { title: `${ORD[d - 1]} Decade`, fruit: 'Mercy for the whole world', d };
    steps.push({ bead: d === 1 ? 'L1' : `D${d}`, decade, announce: true, k: 'Eternal Father', t: CHAPLET.eternalFather });
    for (let h = 1; h <= 10; h++) steps.push({ bead: `d${d}h${h}`, decade, k: 'For the sake of His sorrowful Passion', t: CHAPLET.passion, n: h, of: 10 });
  }
  for (let i = 1; i <= 3; i++) steps.push({ bead: 'medal', k: 'Holy God', t: CHAPLET.holyGod, n: i, of: 3 });
  steps.push({ bead: 'medal', k: 'Closing Prayer', t: CHAPLET.closing });
  steps.push({ bead: 'cross', k: 'Jesus, I trust in You', t: `${CHAPLET.trust}\n\n${SIGN}`, last: true });
  return steps;
}

// ---------- Player ----------
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}

export function openRosary({ set } = {}) {
  const saved = store.get('beads:rosary');
  const today = store.isoDate();
  const resume = saved && saved.date === today && saved.step > 0 ? saved : null;
  const lit = store.get('cache:lit:' + today);
  player({
    kind: 'rosary',
    title: 'The Holy Rosary',
    set: set || resume?.set || mysterySet(new Date(), lit?.season),
    step: set ? 0 : resume?.step || 0,
    resumed: !set && !!resume,
  });
}

export function openChaplet() {
  const saved = store.get('beads:chaplet');
  const resume = saved && saved.date === store.isoDate() && saved.step > 0 ? saved : null;
  player({ kind: 'chaplet', title: 'Divine Mercy Chaplet', step: resume?.step || 0, resumed: !!resume });
}

function player(state) {
  let steps = state.kind === 'rosary' ? rosarySteps(state.set) : chapletSteps();
  let i = Math.min(state.step, steps.length - 1);

  const html = `
    <div class="player">
      ${state.kind === 'rosary' ? `<div class="set-picker" role="radiogroup" aria-label="Mysteries">${['Joyful', 'Sorrowful', 'Glorious', 'Luminous'].map(s =>
        `<button class="chip ${s === state.set ? 'active' : ''}" data-set="${s}" role="radio" aria-checked="${s === state.set}">${s}</button>`).join('')}</div>` : ''}
      <div class="player-top" aria-live="polite"><div class="player-mystery"></div><div class="player-fruit"></div></div>
      ${svg()}
      <div class="player-card" role="button" tabindex="0" aria-label="Next prayer">
        <div class="k"></div><div class="pt"></div><div class="count"></div><div class="hint">Tap or swipe to continue</div>
      </div>
      <div class="player-bar">
        <button class="icon-btn" data-act="prev" aria-label="Previous">${icon('back')}</button>
        <button class="btn btn-primary btn-lg" data-act="next">Next ${icon('chev')}</button>
        <button class="icon-btn" data-act="restart" aria-label="Start over">${icon('history')}</button>
      </div>
    </div>`;

  const onKey = e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  const body = openSheet({
    title: state.title,
    full: true,
    html,
    onClose() {
      document.removeEventListener('keydown', onKey);
      keepAwake(false);
    },
  });
  document.addEventListener('keydown', onKey);
  keepAwake(true);

  const card = body.querySelector('.player-card');
  const nextBtn = body.querySelector('[data-act="next"]');

  function save() {
    store.set(`beads:${state.kind}`, { date: store.isoDate(), step: i, set: state.set });
  }

  function render(dir = 0) {
    const s = steps[i];
    // Beads before the current step are prayed; the current one glows.
    const doneBeads = new Set(steps.slice(0, i).map(x => x.bead).filter(Boolean));
    body.querySelectorAll('[data-bead]').forEach(el => {
      const id = el.dataset.bead;
      el.classList.toggle('cur', id === s.bead);
      el.classList.toggle('done', doneBeads.has(id) && id !== s.bead);
    });
    const top = body.querySelector('.player-top');
    top.querySelector('.player-mystery').textContent = s.decade ? s.decade.title : (state.kind === 'rosary' ? `The ${state.set} Mysteries` : 'The Chaplet of Divine Mercy');
    top.querySelector('.player-fruit').textContent = s.decade?.fruit ? `Fruit: ${s.decade.fruit}` : ' ';
    card.querySelector('.k').textContent = s.k;
    card.querySelector('.pt').textContent = s.t;
    card.querySelector('.count').innerHTML = s.of ? Array.from({ length: s.of }, (_, j) => `<i class="${j < s.n ? 'on' : ''}"></i>`).join('') : '';
    card.querySelector('.hint').textContent = `${i + 1} of ${steps.length}`;
    nextBtn.innerHTML = s.last ? `${icon('check')} Amen` : `Next ${icon('chev')}`;
    body.querySelector('[data-act="prev"]').disabled = i === 0;
    card.scrollTop = 0;
    fadeIfMore();
    if (dir) {
      card.style.setProperty('--dir', `${dir * 18}px`);
      card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip');
    }
  }

  let finished = false;
  // Fade the bottom edge while there's more prayer text to scroll to.
  function fadeIfMore() {
    card.classList.toggle('more', card.scrollHeight - card.scrollTop - card.clientHeight > 8);
  }
  card.addEventListener('scroll', fadeIfMore, { passive: true });

  function go(dir) {
    if (finished) return;
    if (dir > 0 && steps[i].last) return finish();
    const n = i + dir;
    if (n < 0 || n >= steps.length) return;
    i = n;
    haptic(steps[i].announce || steps[i - 1]?.decadeEnd ? [12, 50, 12] : 8);
    save();
    render(dir);
  }

  function finish() {
    finished = true;
    store.del(`beads:${state.kind}`);
    if (state.kind === 'rosary') { bumpCount('rosaryFull'); bumpCount('set:' + state.set); }
    else bumpCount('chapletFull');
    complete(state.kind === 'rosary' ? 'rosary' : 'chaplet', { quiet: true });
    checkMilestones(); // complete() only checks the first time per day
    haptic([20, 60, 20, 60, 40]);
    const label = state.kind === 'rosary' ? `the ${state.set} Mysteries` : 'the Divine Mercy Chaplet';
    body.innerHTML = `
      <div style="text-align:center;padding:30px 10px">
        ${sealSVG(state.kind === 'rosary' ? '📿' : '🌊', 'seal')}
        <h2 class="serif" style="font-size:2.2rem;font-weight:600;margin:18px 0 6px">Deo gratias</h2>
        <p class="muted" style="margin:0 0 26px">You prayed ${esc(label)}. May Our Lady keep you close to her Son.</p>
        <div style="display:grid;gap:10px;max-width:320px;margin:0 auto">
          <button class="btn btn-primary btn-lg" data-act="share">${icon('share')} Share</button>
          <button class="btn btn-soft btn-lg" data-act="close">Close</button>
        </div>
      </div>`;
    body.querySelector('.seal').style.cssText = 'width:130px;height:130px;margin:0 auto;animation:seal-in .9s var(--spring) both';
    body.onclick = async e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'close') closeSheet();
      if (act === 'share') (await import('./share-card.js')).shareCard({
        kind: 'prayed', title: state.kind === 'rosary' ? `I prayed the ${state.set} Mysteries today` : 'I prayed the Divine Mercy Chaplet today',
        text: state.kind === 'rosary' ? 'Hail Mary, full of grace, the Lord is with thee.' : 'Jesus, I trust in You.',
        cite: state.kind === 'rosary' ? 'Luke 1:28' : 'St. Faustina',
      });
    };
  }

  // Tap = next; horizontal swipe = next / previous.
  let x0 = null, moved = false;
  card.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
  card.addEventListener('pointermove', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 10) moved = true; });
  card.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (!moved) return go(1);
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });
  card.addEventListener('keydown', e => { if (e.key === 'Enter') go(1); });

  body.querySelector('.player-bar').onclick = e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'next') go(1);
    if (act === 'prev') go(-1);
    if (act === 'restart') { i = 0; save(); render(-1); toast('Starting from the beginning'); }
  };
  body.querySelector('.set-picker')?.addEventListener('click', e => {
    const b = e.target.closest('[data-set]');
    if (!b) return;
    state.set = b.dataset.set;
    steps = rosarySteps(state.set);
    body.querySelectorAll('.set-picker .chip').forEach(c => {
      c.classList.toggle('active', c === b);
      c.setAttribute('aria-checked', c === b);
    });
    save();
    render();
  });

  render();
  if (state.resumed && i > 0) toast('Resumed where you left off', { action: 'Restart', onAction: () => { i = 0; save(); render(-1); } });
}
