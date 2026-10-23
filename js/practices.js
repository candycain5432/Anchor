// Practices, the Daily Rule, the completion log, streaks and milestones.
import * as store from './store.js';
import { toast, track, haptic, sealSVG, esc } from './ui.js';

export const PRACTICES = {
  morning:   { name: 'Morning Offering',      icon: 'sunrise', min: 2,  sub: 'Offer the day to God' },
  readings:  { name: 'Daily Mass Readings',   icon: 'book', min: 8,  sub: 'The Word for today' },
  angelus:   { name: 'The Angelus',           icon: 'bell', min: 3,  sub: 'At noon, honor the Incarnation' },
  rosary:    { name: 'Holy Rosary',           icon: 'rosary', min: 20, sub: 'Guided, bead by bead' },
  chaplet:   { name: 'Divine Mercy Chaplet',  icon: 'mercy', min: 8,  sub: 'The Hour of Mercy' },
  lectio:    { name: 'Lectio Divina',         icon: 'candle', min: 15, sub: 'Pray with today’s Gospel' },
  silence:   { name: 'Silent Prayer',         icon: 'hourglass', min: 10, sub: 'Rest in His presence' },
  examen:    { name: 'Daily Examen',          icon: 'moon', min: 5,  sub: 'Review the day with God' },
  night:     { name: 'Evening Prayer',        icon: 'stars', min: 2,  sub: 'Entrust the night to Him' },
  gratitude: { name: 'Gratitude',             icon: 'sprout', min: 2,  sub: 'Three gifts from today' },
};

export const DEFAULT_RULE = ['morning', 'readings', 'rosary', 'examen'];

export function rule() {
  const r = store.get('rule', DEFAULT_RULE).filter(id => PRACTICES[id]);
  return r.length ? r : DEFAULT_RULE;
}
export function setRule(ids) { store.set('rule', ids); emit(); }

// ---- Log: { 'YYYY-MM-DD': { practiceId: timestamp } } ----
export function log() { return store.get('log', {}); }
export function dayLog(iso = store.isoDate()) { return log()[iso] || {}; }
export function isDone(id, iso = store.isoDate()) { return !!dayLog(iso)[id]; }

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

/** Marks a practice done today. Returns true the first time it's marked. */
export function complete(id, { quiet = false } = {}) {
  const iso = store.isoDate();
  const all = log();
  const day = (all[iso] ||= {});
  const first = !day[id];
  if (first) {
    day[id] = Date.now();
    delete day.legacy;
    store.set('log', all);
    bumpCount(id);
    track('practice_completed', { practice: id });
    if (!quiet) {
      haptic([10, 40, 10]);
      const r = rule();
      const doneCount = r.filter(p => day[p]).length;
      const msg = r.includes(id) && doneCount === r.length
        ? 'Your Daily Rule is complete. Deo gratias!'
        : `${PRACTICES[id]?.name || 'Prayer'} — prayed ✓`;
      toast(msg);
    }
    emit();
    checkMilestones();
  }
  return first;
}

// Lifetime counters (rosaries prayed, minutes in silence, ...)
export function counts() { return store.get('counts', {}); }
export function bumpCount(key, by = 1) {
  store.update('counts', {}, c => ({ ...c, [key]: (c[key] || 0) + by }));
}

// ---- Streaks ----
function dayHasPrayer(day) { return day && Object.keys(day).length > 0; }

export function streak() {
  const all = log();
  let d = new Date();
  if (!dayHasPrayer(all[store.isoDate(d)])) d = store.addDays(d, -1); // today isn't over yet
  let n = 0;
  while (dayHasPrayer(all[store.isoDate(d)])) { n++; d = store.addDays(d, -1); }
  return n;
}

export function bestStreak() {
  const all = log();
  const days = Object.keys(all).filter(k => dayHasPrayer(all[k])).sort();
  let best = 0, run = 0, prev = null;
  for (const iso of days) {
    run = prev && store.isoDate(store.addDays(store.fromISO(prev), 1)) === iso ? run + 1 : 1;
    best = Math.max(best, run);
    prev = iso;
  }
  return Math.max(best, store.get('bestStreak', 0));
}

export function totalDays() {
  return Object.values(log()).filter(dayHasPrayer).length;
}

// ---- Milestones ----
export const MILESTONES = [
  { id: 'first',      glyph: 'spark', name: 'First Light',        desc: 'Completed your first prayer in Anchor',  test: s => s.days >= 1 },
  { id: 'streak3',    glyph: 'flame', name: 'Kindled',            desc: 'Prayed 3 days in a row',                 test: s => s.best >= 3 },
  { id: 'streak7',    glyph: 'candle', name: 'A Faithful Week',    desc: 'Prayed 7 days in a row',                 test: s => s.best >= 7 },
  { id: 'streak30',   glyph: 'church', name: 'Rule of Life',       desc: 'Prayed 30 days in a row',                test: s => s.best >= 30 },
  { id: 'streak100',  glyph: 'crown', name: 'Persevering',        desc: 'Prayed 100 days in a row',               test: s => s.best >= 100 },
  { id: 'rosary1',    glyph: 'rosary', name: 'Ave Maria',          desc: 'Prayed your first full Rosary',          test: s => s.c.rosaryFull >= 1 },
  { id: 'rosary10',   glyph: 'rose', name: 'Crown of Roses',     desc: 'Prayed 10 full Rosaries',                test: s => s.c.rosaryFull >= 10 },
  { id: 'rosary4',    glyph: 'star', name: 'All the Mysteries',  desc: 'Prayed all four sets of mysteries',       test: s => ['Joyful', 'Sorrowful', 'Glorious', 'Luminous'].every(m => s.c['set:' + m]) },
  { id: 'chaplet',    glyph: 'mercy', name: 'Jesus, I Trust',     desc: 'Prayed the Divine Mercy Chaplet',        test: s => s.c.chapletFull >= 1 },
  { id: 'lectio',     glyph: 'book', name: 'Living Word',        desc: 'Prayed Lectio Divina',                   test: s => s.c.lectio >= 1 },
  { id: 'holyhour',   glyph: 'hourglass', name: 'Could You Not Watch', desc: '60 minutes of silent prayer in total',   test: s => s.c.silenceMin >= 60 },
  { id: 'examen7',    glyph: 'moon', name: 'Examined Life',      desc: 'Prayed the Daily Examen 7 times',        test: s => s.c.examen >= 7 },
  { id: 'novena',     glyph: 'IX', name: 'Nine Days',          desc: 'Completed a novena',                     test: s => s.c.novenaDone >= 1 },
  { id: 'intercessor', glyph: 'heart', name: 'Intercessor',       desc: 'Prayed for intentions 10 times',          test: s => s.c.intentionPrayed >= 10 },
  { id: 'answered',   glyph: 'dove', name: 'Answered',           desc: 'Marked a prayer as answered',            test: s => s.c.answered >= 1 },
  { id: 'grateful',   glyph: 'sprout', name: 'Grateful Heart',     desc: 'Wrote gratitude on 7 days',              test: s => s.c.gratitude >= 7 },
];

export function unlocked() { return store.get('milestones', {}); }

export function checkMilestones({ silent = false } = {}) {
  const s = { days: totalDays(), best: Math.max(bestStreak(), streak()), c: counts() };
  store.set('bestStreak', s.best);
  const got = unlocked();
  const fresh = MILESTONES.filter(m => !got[m.id] && m.test(s));
  if (!fresh.length) return;
  for (const m of fresh) got[m.id] = store.isoDate();
  store.set('milestones', got);
  if (!silent) fresh.forEach((m, i) => setTimeout(() => celebrate(m), 900 + i * 2600));
  track('milestone', { id: fresh.map(m => m.id).join(',') });
}

function celebrate(m) {
  const el = document.createElement('div');
  el.className = 'seal-pop';
  el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="inner">${sealSVG(m.glyph)}<div class="eyebrow">Milestone</div><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p><button class="btn btn-primary">Deo gratias</button></div>`;
  const close = () => el.remove();
  el.onclick = e => { if (e.target === el || e.target.closest('button')) close(); };
  document.body.append(el);
  haptic([15, 60, 15, 60, 30]);
  setTimeout(close, 8000);
}

// ---- Launching a practice ----
// Features are loaded on demand to keep first paint fast.
export async function launch(id, opts = {}) {
  switch (id) {
    case 'rosary':   return (await import('./features/beads.js')).openRosary(opts);
    case 'chaplet':  return (await import('./features/beads.js')).openChaplet(opts);
    case 'lectio':   return (await import('./features/lectio.js')).openLectio(opts);
    case 'silence':  return (await import('./features/timer.js')).openTimer(opts);
    case 'examen':   return (await import('./features/examen.js')).openDailyExamen(opts);
    case 'confession': return (await import('./features/examen.js')).openConfession(opts);
    case 'gratitude': return (await import('./screens/journal.js')).openGratitude();
    case 'readings': return (await import('./features/reader.js')).openReadings(opts);
    case 'morning':  return (await import('./features/reader.js')).openPrayer('Morning Offering', { practice: 'morning' });
    case 'angelus':  return (await import('./features/reader.js')).openPrayer('Angelus', { practice: 'angelus' });
    case 'night':    return (await import('./features/reader.js')).openPrayer('Evening Prayer', { practice: 'night' });
  }
}
