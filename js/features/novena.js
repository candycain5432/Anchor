// Nine-day novena tracker.
import { NOVENAS } from '../data/novenas.js';
import { PRAYERS } from '../data/prayers.js';
import * as store from '../store.js';
import { openSheet, closeSheet, esc, prayerHTML, toast, confirmSheet } from '../ui.js';
import { icon } from '../icons.js';
import { bumpCount, complete } from '../practices.js';

export function active() { return store.get('novenas', {}); }

/** { day, prayedToday, done } for an active novena, or null. */
export function progress(id) {
  const n = active()[id];
  if (!n) return null;
  const prayedToday = n.days.includes(store.isoDate());
  return { ...n, prayedToday, day: Math.min(9, n.days.length + (prayedToday ? 0 : 1)), count: n.days.length };
}

export function dotsHTML(id) {
  const p = progress(id);
  const count = p?.count || 0;
  return `<div class="dots">${Array.from({ length: 9 }, (_, i) =>
    `<i class="${i < count ? 'on' : ''} ${p && !p.prayedToday && i === count ? 'today' : ''}"></i>`).join('')}</div>`;
}

export function openNovena(id, onChange) {
  const nov = NOVENAS.find(n => n.id === id);
  if (!nov) return;
  const p = progress(id);
  if (!p) return start(nov, onChange);

  const d = nov.daily(p.day);
  const body = openSheet({
    title: nov.name,
    full: true,
    html: `
      <div style="text-align:center;margin-bottom:14px">
        <div class="eyebrow" style="color:var(--gold)">Day ${p.day} of 9</div>
        <div style="display:flex;justify-content:center;margin:10px 0">${dotsHTML(id)}</div>
        ${p.intention ? `<p class="serif" style="font-size:1.15rem;font-style:italic;margin:6px 0 0">For: ${esc(p.intention)}</p>` : ''}
      </div>
      ${d.intro ? `<h3 class="serif" style="text-align:center;font-size:1.4rem;margin:0 0 12px">${esc(d.intro)}</h3>` : ''}
      <div class="card prayer">${prayerHTML(d.prayer)}</div>
      ${d.then ? `<p class="serif muted" style="text-align:center;font-size:1.1rem;font-style:italic">${esc(d.then)}</p>` : ''}
      ${d.chaplet ? `<button class="btn btn-soft btn-block" data-act="chaplet" style="margin-bottom:10px">${icon('mercy')} Pray the Chaplet now</button>` : ''}
      ${/Hail, Holy Queen/.test(d.then || '') ? `<details class="card"><summary class="small" style="cursor:pointer;font-weight:700">Hail, Holy Queen</summary><div class="prayer" style="padding-top:12px">${prayerHTML(PRAYERS['Hail Holy Queen'])}</div></details>` : ''}
      <button class="btn btn-ghost btn-block small" data-act="end">End this novena</button>`,
    foot: p.prayedToday
      ? `<button class="btn btn-soft btn-block btn-lg" disabled>${icon('check')} Day ${p.count} prayed — see you tomorrow</button>`
      : `<button class="btn btn-primary btn-block btn-lg" data-act="pray">${icon('check')} I prayed Day ${p.day}</button>`,
    onMount(b, foot) {
      foot.onclick = e => { if (e.target.closest('[data-act="pray"]')) markDay(nov, onChange); };
    },
  });

  body.onclick = async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'chaplet') (await import('./beads.js')).openChaplet();
    if (act === 'end' && await confirmSheet({ title: 'End novena?', message: 'Your progress for this novena will be cleared.', confirm: 'End novena', danger: true })) {
      store.update('novenas', {}, all => { delete all[id]; return all; });
      onChange?.();
    }
  };
}

function start(nov, onChange) {
  openSheet({
    title: nov.name,
    html: `
      <p class="muted" style="margin:0 0 16px">${esc(nov.sub)}. Pray once a day for nine days. Anchor keeps your place and will be here each day.</p>
      <label class="small faint" for="nv-int" style="display:block;margin:0 4px 6px">Your intention (optional, stays on this device)</label>
      <textarea id="nv-int" class="field" maxlength="200" placeholder="For my mother’s healing…"></textarea>`,
    foot: `<button class="btn btn-primary btn-block btn-lg" data-act="start">Begin Day 1</button>`,
    onMount(body, foot) {
      foot.onclick = e => {
        if (!e.target.closest('[data-act="start"]')) return;
        const intention = body.querySelector('#nv-int').value.trim();
        store.update('novenas', {}, all => ({ ...all, [nov.id]: { intention, start: store.isoDate(), days: [] } }));
        onChange?.();
        openNovena(nov.id, onChange);
      };
    },
  });
}

function markDay(nov, onChange) {
  const iso = store.isoDate();
  let finished = false;
  store.update('novenas', {}, all => {
    const n = all[nov.id];
    if (n && !n.days.includes(iso)) n.days.push(iso);
    if (n && n.days.length >= 9) { finished = true; delete all[nov.id]; }
    return all;
  });
  complete('novena', { quiet: true });
  onChange?.();
  if (finished) {
    bumpCount('novenaDone');
    closeSheet();
    toast('Novena complete! Thanks be to God.', { ms: 4000 });
    import('../practices.js').then(m => m.checkMilestones());
  } else {
    openNovena(nov.id, onChange);
  }
}
