// Saint detail sheet + library helpers.
import { SAINTS } from '../data/saints.js';
import * as store from '../store.js';
import * as api from '../api.js';
import { openSheet, closeSheet, esc, prayerHTML, toast } from '../ui.js';
import { icon } from '../icons.js';
import { isSaint } from '../liturgy.js';

export const PATRON_TAGS = [
  ['students', /student|school|universit|teacher/],
  ['work', /worker|work|carpenter|lawyer|engineer|philanthrop/],
  ['the sick', /sick|cancer|healing|hospital|disease|leprosy|headache|physician|nurse|surgeon/],
  ['anxiety', /anxiety|mental|stress|nervous/],
  ['family', /famil|mother|father|marriage|wives|widow|children|pregnan|childbirth|unborn|adopted|parents/],
  ['travel', /travel|driver|journey|immigrant|sailor|exile/],
  ['lost things', /lost things/],
  ['hard cases', /hopeless|desperate|impossible/],
  ['youth', /youth|young|adolescent|World Youth/],
  ['internet', /internet|programmer|television|journalist|writer|editor/],
  ['protection', /protection|police|soldier|evil|civil defense/],
  ['creation', /animal|ecology|gardener|florist/],
];

export function searchSaints(q = '', tag = null) {
  const s = q.trim().toLowerCase();
  const re = tag ? PATRON_TAGS.find(t => t[0] === tag)?.[1] : null;
  return SAINTS.filter(x =>
    (!s || x.name.toLowerCase().includes(s) || x.patron.some(p => p.includes(s)) || x.bio.toLowerCase().includes(s)) &&
    (!re || x.patron.some(p => re.test(p))));
}

export function findSaint(name) {
  const key = name.toLowerCase().replace(/^(pope\s+)?(saint|st\.)\s+/, '').split(',')[0].trim();
  return SAINTS.find(x => {
    const n = x.name.toLowerCase().replace(/^(st\.|bl\.|the)\s+/, '');
    return n === key;
  });
}

export const isFavSaint = name => store.get('favSaints', []).includes(name);

function intercession(name) {
  const display = /^(St\.|Saint|The Blessed Virgin)/i.test(name) ? name.replace(/^St\./, 'Saint') : `Saint ${name.replace(/^(Pope\s+)?Saint\s+/i, '')}`;
  if (/Virgin Mary|Our Lady/i.test(name)) return `Holy Mary, Mother of God,\nyou said “yes” to the Lord with your whole heart.\nPray for me, and bring my needs to your Son,\nespecially… (name your intention).\n\nTeach me to do whatever He tells me.\n\nAmen.`;
  return `${display},\nyou followed Christ with your whole heart\nand now behold His face in glory.\n\nPray for me, that I may grow in faith, hope, and love,\nand intercede for me before the throne of God,\nespecially for… (name your intention).\n\nHelp me to follow your example of holiness.\n\nAmen.`;
}

export async function openSaint(name, { quote, description } = {}) {
  const local = findSaint(name);
  const saintish = isSaint(name) || !!local;
  const body = openSheet({
    title: local?.name || name,
    html: `
      <div data-img></div>
      ${quote ? `<p class="serif" style="font-size:1.3rem;font-style:italic;line-height:1.45;margin:0 0 14px">“${esc(quote)}”</p>` : ''}
      ${local ? `<div style="margin-bottom:12px"><span class="tag">Feast · ${esc(new Date(2024, +local.feast.slice(0, 2) - 1, +local.feast.slice(3)).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }))}</span><span class="tag">${esc(local.dates)}</span></div>` : ''}
      <p style="line-height:1.7;margin:0 0 12px">${esc(local?.bio || description || '')}</p>
      <div data-wiki><div class="skel skel-line"></div><div class="skel skel-line" style="width:80%"></div></div>
      ${local?.patron?.length ? `<div class="list-label" style="margin-top:14px">Patron of</div><div>${local.patron.map(p => `<span class="tag">${esc(p)}</span>`).join('')}</div>` : ''}
      ${saintish ? `<div class="list-label" style="margin-top:18px">Ask their intercession</div><div class="card prayer" style="text-align:left">${prayerHTML(intercession(local?.name || name))}</div>` : ''}`,
    foot: `
      ${saintish ? `<button class="icon-btn ${isFavSaint(local?.name || name) ? 'on' : ''}" data-act="fav" aria-label="Favorite">${icon('star')}</button>` : ''}
      <button class="btn btn-primary btn-block" data-act="ask">${icon('spark')} Ask Anchor about ${saintish ? 'this saint' : 'this feast'}</button>`,
    onMount(b, foot) {
      foot.onclick = async e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'fav') {
          const n = local?.name || name;
          const favs = store.get('favSaints', []);
          const on = !favs.includes(n);
          store.set('favSaints', on ? [...favs, n] : favs.filter(x => x !== n));
          e.target.closest('button').classList.toggle('on', on);
          toast(on ? 'Added to your saints' : 'Removed from your saints');
        }
        if (act === 'ask') {
          closeSheet();
          (await import('./ask.js')).askAbout({
            kind: 'saint', title: local?.name || name, text: [local?.bio, description, wikiText].filter(Boolean).join('\n\n'),
            prompt: `Tell me about ${local?.name || name}. What can I learn from ${saintish ? 'their life' : 'this feast'} today?`,
          });
        }
      };
    },
  });

  let wikiText = '';
  const info = await api.saintInfo(name).catch(() => null);
  const wikiEl = body.querySelector('[data-wiki]');
  if (!wikiEl) return;
  if (info) {
    wikiText = info.extract;
    if (info.image) body.querySelector('[data-img]').innerHTML = `<img class="saint-hero-img" src="${esc(info.image)}" alt="${esc(name)}">`;
    wikiEl.innerHTML = local ? '' : `<p style="line-height:1.7;margin:0 0 8px">${esc(info.extract)}</p>`;
    if (info.url) wikiEl.insertAdjacentHTML('beforeend', `<a class="small link" href="${esc(info.url)}" target="_blank" rel="noopener">Read more on Wikipedia ↗</a>`);
  } else {
    wikiEl.innerHTML = local || description ? '' : `<p class="muted">No biography found.</p>`;
  }
}
