// "Advent with Anchor": the 26-day journey sheet, the wreath, the Today card and the Christmas closing screen.
// Content is static (js/data/advent.js), so nothing here touches the AI budget.
import * as store from '../store.js';
import { openSheet, closeSheet, esc, toast, track, haptic } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount, checkMilestones } from '../practices.js';
import { DAYS, WEEKS, ADVENT_YEAR, adventDay, dayDate, weekOf, daysUntil } from '../data/advent.js';

const KEY = 'advent' + ADVENT_YEAR;
const TOTAL = DAYS.length;
const CLOSING_UNTIL = `${ADVENT_YEAR}-12-31`;

export const progress = () => store.get(KEY, {});
const doneCount = () => Object.keys(progress()).length;
const today = () => adventDay(store.isoDate());

/** True while the Advent card/seals should be offered: before Christmas, or the closing week. */
export function adventVisible(iso = store.isoDate()) { return adventDay(iso) <= TOTAL || iso <= CLOSING_UNTIL; }
export function adventActive(iso = store.isoDate()) { return adventDay(iso) <= TOTAL; }

// ---- Wreath ----
/** SVG wreath: 4 candles (lit as each Sunday arrives) on a ring of 26 day beads. */
export function wreathSVG({ mini = false } = {}) {
  const t = today(), done = progress();
  const cx = 160, cy = 146, rx = 128, ry = 38;
  const candles = [[106, 62, '#6a4a9c'], [142, 74, '#6a4a9c'], [178, 74, '#d07a9c'], [214, 62, '#6a4a9c']];
  const lit = w => t >= (w - 1) * 7 + 1;
  const BASE = 178; // candle feet sit in the front of the ring, which is drawn over them
  // The ring is drawn in two halves: the back half behind the candles, the front half in front of them.
  const ring = back => {
    const [x0, x1] = back ? [cx - rx, cx + rx] : [cx + rx, cx - rx];
    const arc = (dy, w, paint) => `<path d="M${x0} ${cy + dy} A${rx} ${ry} 0 0 1 ${x1} ${cy + dy}" fill="none" stroke-width="${w}" ${paint}/>`;
    return arc(-2, 20, 'stroke="#1f4630"') + arc(0, 14, 'stroke="#2f5a3c"') + arc(0, 7, 'stroke="#3e7350" stroke-dasharray="2 11" opacity=".9"');
  };
  const beads = back => {
    let b = '';
    for (let n = 1; n <= TOTAL; n++) {
      const a = Math.PI / 2 + 0.35 + (n - 1) * (2 * Math.PI / TOTAL);
      if ((Math.sin(a) < 0) !== back) continue;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const cls = done[n] ? 'd-done' : n === t ? 'd-today' : n < t ? 'd-missed' : 'd-future';
      b += `<circle class="${cls}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${done[n] ? 5.4 : 4.4}"/>`;
    }
    return b;
  };
  let s = `<svg class="wreath${mini ? ' mini' : ''}" viewBox="${mini ? '24 30 272 160' : '0 0 320 200'}" role="img" aria-label="Advent wreath: ${doneCount()} of ${TOTAL} days prayed">
    <defs><radialGradient id="flm" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe39a"/><stop offset="1" stop-color="#f6a53c"/></radialGradient>
    <radialGradient id="hal" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,214,140,.55)"/><stop offset="1" stop-color="rgba(255,214,140,0)"/></radialGradient></defs>
    ${ring(true)}${beads(true)}`;
  candles.forEach(([x, h, c], i) => {
    const top = cy - h, on = lit(i + 1);
    if (on) s += `<circle cx="${x}" cy="${top - 14}" r="30" fill="url(#hal)"/>`;
    s += `<rect x="${x - 9}" y="${top}" width="18" height="${BASE - top}" rx="3" fill="${c}"/><rect x="${x - 9}" y="${top}" width="6" height="${BASE - top}" rx="3" fill="rgba(255,255,255,.18)"/>
      <line x1="${x}" y1="${top}" x2="${x}" y2="${top - 6}" stroke="#2a2320" stroke-width="1.6"/>`;
    if (on) s += `<path class="flame" d="M${x} ${top - 26} C${x + 6} ${top - 17} ${x + 6} ${top - 9} ${x} ${top - 6} C${x - 6} ${top - 9} ${x - 6} ${top - 17} ${x} ${top - 26}Z" fill="url(#flm)"/>`;
  });
  return s + ring(false) + beads(false) + '</svg>';
}

// ---- Today card ----
export function cardHTML() {
  const iso = store.isoDate(), t = adventDay(iso);
  if (t === 0) {
    const n = daysUntil(iso);
    return `<div class="advent-mini">${wreathSVG({ mini: true })}</div>
      <div class="now-body"><div class="now-kicker">Begins Sunday, Nov 29</div><div class="now-title">Advent with Anchor</div>
      <div class="now-sub">26 days of prayer · ${n === 1 ? 'starts tomorrow' : `in ${n} days`}</div></div>
      <div class="now-go" aria-hidden="true">${icon('chev')}</div>`;
  }
  if (t > TOTAL) {
    return `<div class="advent-mini">${wreathSVG({ mini: true })}</div>
      <div class="now-body"><div class="now-kicker">Merry Christmas</div><div class="now-title">You kept Advent</div>
      <div class="now-sub">${doneCount()} of ${TOTAL} days of prayer</div></div>
      <div class="now-go" aria-hidden="true">${icon('star')}</div>`;
  }
  const d = DAYS[t - 1], w = WEEKS[weekOf(t) - 1], done = progress()[t];
  return `<div class="advent-mini">${wreathSVG({ mini: true })}</div>
    <div class="now-body"><div class="now-kicker">Advent · Week ${w.n} · ${w.name}</div><div class="now-title">${esc(d.title)}</div>
    <div class="now-sub">${done ? `Day ${t} prayed · see you tomorrow` : `Day ${t} of ${TOTAL} · ${esc(d.cite)}`}</div></div>
    <div class="now-go" aria-hidden="true">${icon(done ? 'check' : 'play')}</div>`;
}

// ---- Sheet ----
export function openAdvent(opts = {}) {
  track('advent_open', { source: opts.source || 'in_app' });
  const t = today();
  if (t === 0) return openCountdown();
  if (t > TOTAL) return openClosing();
  openDay(opts.day && opts.day <= t ? opts.day : t);
}

function dayStrip(sel) {
  const t = today(), done = progress();
  return `<div class="advent-days" role="list">${DAYS.map((_, i) => {
    const n = i + 1, locked = n > t;
    return `<button role="listitem" class="ad ${done[n] ? 'done' : ''} ${n === sel ? 'sel' : ''} ${locked ? 'locked' : ''}" data-day="${n}" ${locked ? 'disabled' : ''}
      aria-label="Day ${n}${done[n] ? ', prayed' : locked ? ', not yet' : ''}">${n}</button>`;
  }).join('')}</div>`;
}

function openDay(n) {
  const d = DAYS[n - 1], w = WEEKS[weekOf(n) - 1], t = today();
  const done = !!progress()[n];
  const when = n === t ? 'Today' : new Date(dayDate(n) + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const body = openSheet({
    title: 'Advent with Anchor',
    page: `/advent/day-${n}`,
    full: true,
    html: `<div class="advent-sheet ${w.color === 'rose' ? 'rose' : ''}">
      ${wreathSVG()}
      <div class="eyebrow advent-eyebrow">Week ${w.n} · ${w.name} · Day ${n} of ${TOTAL}</div>
      <div class="faint small" style="text-align:center;margin-top:4px">${esc(when)}${d.feast ? ` · ${esc(d.feast)}` : ''}</div>
      <h2 class="serif advent-title">${esc(d.title)}</h2>
      <blockquote class="advent-verse serif">“${esc(d.verse)}”<cite>${esc(d.cite)}</cite></blockquote>
      <p class="advent-reflection">${esc(d.reflection)}</p>
      <div class="card advent-practice">
        <div class="card-label">Today’s practice</div>
        <p class="serif" style="font-size:1.18rem;line-height:1.4;margin:0">${esc(d.practice)}</p>
        ${d.go ? `<div class="card-actions"><button class="btn btn-soft btn-sm" data-go-practice="${d.go}">${esc(d.label || 'Begin')} ${icon('chev')}</button></div>` : ''}
      </div>
      <div class="list-label" style="margin-top:22px">Your Advent</div>
      ${dayStrip(n)}
    </div>`,
    foot: done
      ? `<button class="btn btn-soft btn-block" data-act="share">${icon('share')} Share</button><button class="btn btn-primary btn-block" data-act="close">${icon('check')} Day ${n} prayed</button>`
      : `<button class="btn btn-primary btn-block btn-lg" data-act="done">${icon('check')} Amen · I prayed Day ${n}</button>`,
    onMount(body, foot) {
      foot.onclick = e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'done') { markDone(n); openDay(n); }
        if (act === 'share') share(n);
        if (act === 'close') closeSheet();
      };
    },
  });
  body.onclick = async e => {
    const day = e.target.closest('[data-day]');
    if (day && !day.disabled) return openDay(+day.dataset.day);
    const go = e.target.closest('[data-go-practice]');
    if (go) {
      track('advent_practice', { day: n, target: go.dataset.goPractice });
      (await import('../app.js')).openTarget(go.dataset.goPractice, 'advent');
    }
  };
}

function markDone(n) {
  if (progress()[n]) return;
  store.update(KEY, {}, p => ({ ...p, [n]: Date.now() }));
  bumpCount('adventDays');
  track('advent_day_complete', { day: n, catch_up: n !== today() });
  haptic([10, 40, 10]);
  // Counts toward today's streak like any prayer; complete() also checks milestones.
  if (!complete('advent', { quiet: true })) checkMilestones();
  toast(n === TOTAL ? 'Advent complete. Come, Lord Jesus!' : `Day ${n} prayed. A candle for your wreath.`);
}

function share(n) {
  const d = DAYS[n - 1];
  import('./share-card.js').then(m => m.shareCard({ kind: 'advent', title: `Advent with Anchor · Day ${n}`, text: d.verse, cite: d.cite, day: n, done: Object.keys(progress()).map(Number) }));
}

function openCountdown() {
  const n = daysUntil(store.isoDate());
  openSheet({
    title: 'Advent with Anchor',
    page: '/advent/countdown',
    html: `<div class="advent-sheet">
      ${wreathSVG()}
      <div class="eyebrow advent-eyebrow">Begins Sunday, November 29</div>
      <h2 class="serif advent-title">26 days to prepare your heart</h2>
      <p class="advent-reflection">Each day of Advent, Anchor will have a short Scripture, a reflection and one small practice waiting for you. Pray it, light a candle on your wreath, and arrive at Christmas ready to welcome Him.</p>
      <p class="faint small" style="text-align:center">${n === 1 ? 'Starts tomorrow.' : `Starts in ${n} days.`} Turn on a morning reminder so you don’t miss Day 1.</p>
    </div>`,
    foot: `<button class="btn btn-primary btn-block" data-act="remind">${icon('bell')} Set a reminder</button>`,
    onMount(body, foot) {
      foot.onclick = async e => { if (e.target.closest('[data-act="remind"]')) (await import('../app.js')).openTarget('me', 'advent'); };
    },
  });
}

function openClosing() {
  const n = doneCount();
  openSheet({
    title: 'Merry Christmas',
    page: '/advent/christmas',
    html: `<div class="advent-sheet">
      ${wreathSVG()}
      <div class="eyebrow advent-eyebrow">Christmas · ${ADVENT_YEAR}</div>
      <h2 class="serif advent-title">${n ? 'You kept Advent' : 'Christ is born'}</h2>
      ${n ? `<p class="advent-reflection" style="text-align:center">${n} of ${TOTAL} days of prayer. Every one of them was a gift to Him.</p>` : ''}
      <blockquote class="advent-verse serif">“Glory to God in the highest; and on earth peace to men of good will.”<cite>Luke 2:14</cite></blockquote>
      <p class="advent-reflection">Christmas is a season, not just a day. Keep praying through it with your Daily Rule, and let what began this Advent continue.</p>
    </div>`,
    foot: `${n ? `<button class="btn btn-soft btn-block" data-act="share">${icon('share')} Share</button>` : ''}<button class="btn btn-primary btn-block" data-act="close">Continue</button>`,
    onMount(body, foot) {
      foot.onclick = e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'close') closeSheet();
        if (act === 'share') import('./share-card.js').then(m => m.shareCard({ kind: 'advent', title: `I kept Advent with Anchor: ${n} days of prayer`,
          text: 'Glory to God in the highest; and on earth peace to men of good will.', cite: 'Luke 2:14', day: TOTAL, done: Object.keys(progress()).map(Number), christmas: true }));
      };
    },
  });
}
