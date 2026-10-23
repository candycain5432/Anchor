// Prayer reader and the full Mass readings view.
import { PRAYERS, PRAYER_LIBRARY } from '../data/prayers.js';
import * as store from '../store.js';
import * as api from '../api.js';
import { openSheet, closeSheet, prayerHTML, esc, shareText, toast } from '../ui.js';
import { icon } from '../icons.js';
import { complete } from '../practices.js';

export function isFav(name) { return store.get('favPrayers', []).includes(name); }
export function toggleFav(name) {
  const favs = store.get('favPrayers', []);
  const on = !favs.includes(name);
  store.set('favPrayers', on ? [...favs, name] : favs.filter(n => n !== name));
  return on;
}

let readerScale = store.get('readerScale', 1);

export function openPrayer(name, { practice } = {}) {
  const text = PRAYERS[name];
  if (!text) return;
  const meta = PRAYER_LIBRARY.find(p => p.name === name);
  const title = meta?.title || name;

  openSheet({
    title,
    html: `
      <div class="prayer" style="--reader:${readerScale}">
        <div class="prayer-orn">✦ ✦ ✦</div>
        ${prayerHTML(text)}
        <div class="prayer-orn">✦</div>
      </div>
      <div class="prayer-tools">
        <button class="icon-btn" data-act="smaller" aria-label="Smaller text" style="font-weight:800">A−</button>
        <button class="icon-btn" data-act="bigger" aria-label="Larger text" style="font-weight:800">A+</button>
        <button class="icon-btn ${isFav(name) ? 'on' : ''}" data-act="fav" aria-label="Favorite">${icon('star')}</button>
        <button class="icon-btn" data-act="share" aria-label="Share">${icon('share')}</button>
      </div>`,
    foot: `<button class="btn btn-primary btn-block btn-lg" data-act="amen">Amen</button>`,
    onMount(body, foot) {
      const prayer = body.querySelector('.prayer');
      body.onclick = e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'smaller' || act === 'bigger') {
          readerScale = Math.min(1.6, Math.max(.85, readerScale + (act === 'bigger' ? .1 : -.1)));
          store.set('readerScale', readerScale);
          prayer.style.setProperty('--reader', readerScale);
        } else if (act === 'fav') {
          const on = toggleFav(name);
          e.target.closest('button').classList.toggle('on', on);
          toast(on ? 'Added to favorites' : 'Removed from favorites');
        } else if (act === 'share') {
          shareText({ title, text: `${title}\n\n${text}\n\n— shared from Anchor` });
        }
      };
      foot.onclick = e => {
        if (!e.target.closest('[data-act="amen"]')) return;
        if (practice) complete(practice);
        closeSheet();
      };
    },
  });
}

/** Full-screen readings with Ask + Lectio actions. */
export async function openReadings({ focus } = {}) {
  const body = openSheet({
    title: 'Today’s Readings',
    full: true,
    html: `<div class="skel skel-line" style="width:60%"></div><div class="skel skel-line"></div><div class="skel skel-line" style="width:80%"></div>`,
  });
  try {
    const r = await api.readings();
    body.innerHTML = r.sections.map(s => `
      <section class="card" id="rd-${s.id}">
        <div class="card-label">${esc(s.label)}<span class="spacer"></span><span class="faint" style="letter-spacing:.04em;text-transform:none;font-family:var(--font-ui)">${esc(s.cite)}</span></div>
        <p class="reading-text">${s.text ? esc(s.text) : `<em class="muted">Text unavailable — read ${esc(s.cite)} in your Bible.</em>`}</p>
        <div class="card-actions">
          <button class="btn btn-soft btn-sm" data-ask="${s.id}">${icon('spark')} Ask Anchor</button>
          ${s.id === 'gospel' ? `<button class="btn btn-soft btn-sm" data-lectio>${icon('candle')} Pray with Lectio</button>` : ''}
        </div>
      </section>`).join('') +
      (r.usccb ? `<p class="small" style="text-align:center"><a class="link" href="${esc(r.usccb)}" target="_blank" rel="noopener">Read the full NABRE readings at USCCB ↗</a></p>` : '') +
      `<button class="btn btn-primary btn-block btn-lg" data-done style="margin-top:8px">${icon('check')} I’ve read today’s readings</button>`;
    if (focus) body.querySelector(`#rd-${focus}`)?.scrollIntoView({ block: 'start' });
    body.onclick = async e => {
      const ask = e.target.closest('[data-ask]');
      if (ask) {
        const s = r.sections.find(x => x.id === ask.dataset.ask);
        closeSheet();
        (await import('../screens/ask.js')).askAbout({
          kind: 'reading', title: `${s.label} — ${s.cite}`, text: s.text || s.cite,
          prompt: `Help me understand today's ${s.label.toLowerCase()} (${s.cite}). What is it saying, and how can I live it today?`,
        });
      } else if (e.target.closest('[data-lectio]')) {
        (await import('./lectio.js')).openLectio();
      } else if (e.target.closest('[data-done]')) {
        complete('readings');
        closeSheet();
      }
    };
  } catch {
    body.innerHTML = `<div class="empty"><div class="big">📖</div><p>Couldn’t load today’s readings. Check your connection and try again.</p></div>`;
  }
}

