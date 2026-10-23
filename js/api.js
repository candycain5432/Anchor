// Every network call the app makes lives here. Daily content is cached per date.
import * as store from './store.js';

const DEFAULT_API = 'https://project-veritas-backend.onrender.com';
// Dev override: localStorage['anchor:apiBase'] = '"http://localhost:3000"'
export const API_BASE = store.get('apiBase') || DEFAULT_API;
const CAL = 'https://cpbjr.github.io/catholic-readings-api';

async function getJSON(url, opts = {}) {
  const r = await fetch(url, { ...opts, signal: opts.signal || AbortSignal.timeout?.(opts.timeout || 15000) });
  if (!r.ok) {
    let msg = `Request failed (${r.status})`;
    try { msg = (await r.json()).error || msg; } catch {}
    const err = new Error(msg); err.status = r.status; throw err;
  }
  return r.json();
}

function postJSON(path, body, opts = {}) {
  return getJSON(API_BASE + path, {
    ...opts,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Caches a per-date value in localStorage and prunes entries older than a week. */
async function daily(name, iso, make) {
  const key = `cache:${name}:${iso}`;
  const hit = store.get(key);
  if (hit) return hit;
  const value = await make();
  store.set(key, value);
  const cutoff = store.isoDate(store.addDays(new Date(), -7));
  for (const k of store.keys()) {
    const m = /^cache:[^:]+:(\d{4}-\d{2}-\d{2})$/.exec(k);
    if (m && m[1] < cutoff) store.del(k);
  }
  return value;
}

function calPath(iso) { const [y, m, d] = iso.split('-'); return `${y}/${m}-${d}.json`; }

// ---- Liturgical day ----
// { iso, season, name, type, quote, description }
export function liturgicalDay(iso = store.isoDate()) {
  return daily('lit', iso, async () => {
    const d = await getJSON(`${CAL}/liturgical-calendar/${calPath(iso)}`);
    const c = d.celebration || {};
    return { iso, season: d.season || 'Ordinary Time', name: c.name || '', type: c.type || 'FERIA', quote: c.quote || '', description: c.description || '' };
  });
}

// ---- Mass readings (references from cpbjr, text from bible-api.com, Douay-Rheims) ----
async function verseText(ref) {
  try {
    // Psalm citations like "Psalm 90:3-4, 5-6, 12-13, 14 and 17": bible-api accepts
    // comma-separated ranges but not "and", so "14 and 17" -> "14,17".
    const simplified = ref.replace(/\s+and\s+/gi, ',').replace(/\s+/g, ' ').trim();
    const d = await getJSON(`https://bible-api.com/${encodeURIComponent(simplified)}?translation=dra`);
    return (d.text || '').trim();
  } catch { return ''; }
}

export function readings(iso = store.isoDate()) {
  return daily('readings', iso, async () => {
    const ref = await getJSON(`${CAL}/readings/${calPath(iso)}`);
    const { firstReading, secondReading, psalm, gospel } = ref.readings || {};
    const list = [
      { id: 'first', label: 'First Reading', cite: firstReading },
      { id: 'psalm', label: 'Responsorial Psalm', cite: psalm },
      ...(secondReading ? [{ id: 'second', label: 'Second Reading', cite: secondReading }] : []),
      { id: 'gospel', label: 'Gospel', cite: gospel },
    ].filter(s => s.cite);
    const texts = await Promise.all(list.map(s => verseText(s.cite)));
    list.forEach((s, i) => { s.text = texts[i]; });
    return { sections: list, usccb: ref.usccbLink || '' };
  });
}

// ---- Verse of the day ----
export function verseOfDay(iso = store.isoDate()) {
  return daily('verse', iso, async () => {
    const verses = await getJSON('https://labs.bible.org/api/?passage=votd&type=json');
    const text = verses.map(v => v.text).join(' ').replace(/<[^>]+>/g, '');
    const first = verses[0], last = verses[verses.length - 1];
    const cite = first.verse !== last.verse
      ? `${first.bookname} ${first.chapter}:${first.verse}–${last.verse}`
      : `${first.bookname} ${first.chapter}:${first.verse}`;
    return { text, cite };
  });
}

// ---- Backend (AI + push) ----
export function reflection(iso = store.isoDate()) {
  return daily('reflection', iso, () => getJSON(`${API_BASE}/daily-reflection?date=${iso}`, { timeout: 45000 }));
}

export function lectio(iso = store.isoDate()) {
  return daily('lectio', iso, () => getJSON(`${API_BASE}/lectio?date=${iso}`, { timeout: 45000 }));
}

export function composePrayer(intention) {
  return postJSON('/prayer/compose', { intention }, { timeout: 45000 });
}

export function subscribe(body) { return postJSON('/subscribe', body); }
export function updatePrefs(body) { return postJSON('/subscription/prefs', body); }
export function unsubscribe(endpoint) { return postJSON('/unsubscribe', { endpoint }); }

/**
 * Streams a chat reply. Calls onToken(text) per chunk and resolves with the full reply.
 * Falls back to the non-streaming /chat route if streaming isn't available.
 */
export async function chat({ message, history, context, signal, onToken }) {
  const body = JSON.stringify({ message, history, context });
  let res;
  try {
    res = await fetch(`${API_BASE}/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    res = null;
  }

  if (res && res.ok && res.body && (res.headers.get('content-type') || '').includes('text/event-stream')) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', full = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 2);
        if (!line.startsWith('data:')) continue;
        const evt = JSON.parse(line.slice(5));
        if (evt.error) throw new Error(evt.error);
        if (evt.t) { full += evt.t; onToken?.(evt.t, full); }
      }
    }
    return full;
  }

  if (res && res.status === 429) {
    let msg = 'Please wait a moment and try again.';
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }

  // Fallback: one-shot reply
  const data = await postJSON('/chat', { message, history, context, sessionId: 'anchor' }, { signal, timeout: 60000 });
  const reply = data.reply || '';
  onToken?.(reply, reply);
  return reply;
}

// ---- Wikipedia (saint biographies & portraits) ----
async function wikiSummary(title) {
  try {
    const d = await getJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (d.type === 'disambiguation' || /may refer to/i.test(d.extract || '')) return null;
    return d.extract ? { extract: d.extract, image: d.thumbnail?.source || d.originalimage?.source || '', url: d.content_urls?.mobile?.page || '' } : null;
  } catch { return null; }
}

async function wikiSearch(q) {
  try {
    const d = await getJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=3`);
    for (const r of d.query?.search || []) {
      const s = await wikiSummary(r.title);
      if (s) return s;
    }
  } catch {}
  return null;
}

export async function saintInfo(name) {
  const key = `cache:wiki:${name.toLowerCase().slice(0, 80)}`;
  const hit = store.get(key);
  if (hit) return hit;
  const stripped = name
    .replace(/^(Pope\s+)?(Saints?|Sts?\.|Blesseds?|Bl\.)\s+/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .split(',')[0].split(' & ')[0].split(' and ')[0].trim();
  const info =
    await wikiSummary('Saint ' + stripped) ||
    await wikiSummary(stripped) ||
    await wikiSummary(name) ||
    await wikiSearch(stripped + ' saint Catholic');
  if (info) store.set(key, info);
  return info;
}

// ---- Nearby Catholic churches (OpenStreetMap Overpass) ----
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function nearbyChurches(lat, lon) {
  const area = `(around:16093,${lat},${lon})`;
  const sel = d => `node["amenity"="place_of_worship"]["religion"="christian"]["denomination"="${d}"]${area}; way["amenity"="place_of_worship"]["religion"="christian"]["denomination"="${d}"]${area};`;
  const query = `[out:json][timeout:12];(${sel('catholic')}${sel('roman_catholic')});out center 12;`;
  const data = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', body: query, timeout: 20000 });
  return (data.elements || [])
    .map(el => {
      const elLat = el.lat ?? el.center?.lat, elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;
      return {
        name: el.tags?.name || 'Catholic Church',
        addr: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(' '),
        website: el.tags?.website || el.tags?.['contact:website'] || '',
        lat: elLat, lon: elLon,
        dist: haversine(lat, lon, elLat, elLon),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);
}
