// Single localStorage wrapper. Every read/write is guarded — storage can be
// unavailable (private mode, blocked site data) and the app must still run.
const NS = 'anchor:';

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function set(key, value) {
  try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch {}
  return value;
}

export function del(key) {
  try { localStorage.removeItem(NS + key); } catch {}
}

export function update(key, fallback, fn) {
  return set(key, fn(get(key, fallback)));
}

export function keys() {
  try { return Object.keys(localStorage).filter(k => k.startsWith(NS)).map(k => k.slice(NS.length)); }
  catch { return []; }
}

/** YYYY-MM-DD in local time. */
export function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export function fromISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }

// ---- Export / import (backup) ----
export function exportAll() {
  const data = {};
  for (const k of keys()) {
    if (k.startsWith('cache:')) continue; // network caches aren't worth backing up
    data[k] = get(k);
  }
  return { app: 'Anchor', version: 1, exported: new Date().toISOString(), data };
}

export function importAll(backup) {
  if (!backup || backup.app !== 'Anchor' || typeof backup.data !== 'object') throw new Error('Not an Anchor backup file');
  for (const [k, v] of Object.entries(backup.data)) set(k, v);
}

export function resetAll() {
  for (const k of keys()) del(k);
}

// ---- One-time migration from the pre-9.0 keys ----
function legacy(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function migrate() {
  if (get('migrated')) return;
  const log = get('log', {});

  // Habit tracker → practice log
  try {
    for (const k of Object.keys(localStorage)) {
      const m = /^habitTracker_(\d{4}-\d{2}-\d{2})$/.exec(k);
      if (!m) continue;
      const h = JSON.parse(localStorage.getItem(k) || '{}');
      const day = (log[m[1]] ||= {});
      if (h.morningPrayer) day.morning = 1;
      if (h.rosary) day.rosary = 1;
      if (h.readings) day.readings = 1;
    }
  } catch {}

  // Old app-open streak → keep the streak alive by backfilling "legacy" days.
  const streak = parseInt(legacy('streakCount') || '0', 10);
  const lastOpen = legacy('lastOpenDate');
  if (streak > 1 && lastOpen) {
    const last = new Date(lastOpen);
    const ageDays = Math.round((fromISO(isoDate()) - fromISO(isoDate(last))) / 86400000);
    if (!isNaN(ageDays) && ageDays <= 1) {
      for (let i = 0; i < Math.min(streak, 365); i++) {
        const day = (log[isoDate(addDays(last, -i))] ||= {});
        if (!Object.keys(day).length) day.legacy = 1;
      }
    }
  }
  set('log', log);

  const dark = legacy('darkMode');
  if (dark !== null) set('theme', dark === 'true' ? 'dark' : 'light');
  if (legacy('pushEnabled') === 'true') set('push', true);
  const lat = parseFloat(legacy('churchLat')), lon = parseFloat(legacy('churchLon'));
  if (lat && lon) set('loc', { lat, lon });

  set('migrated', isoDate());
}
