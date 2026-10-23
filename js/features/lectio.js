// Lectio Divina with today's Gospel: Lectio → Meditatio → Oratio → Contemplatio.
import * as api from '../api.js';
import { PRAYERS } from '../data/prayers.js';
import { openSheet, closeSheet, esc, prayerHTML } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount } from '../practices.js';
import { countdown, bell } from './timer.js';

const FALLBACK_QUESTIONS = [
  'What word or phrase stood out to you? Why might God be drawing your attention to it?',
  'Where do you see yourself in this passage?',
  'What is Jesus inviting you to do, change, or trust today?',
];

export async function openLectio() {
  let gospel = null, prompts = null, step = 0, timer = null;
  const notes = { word: '', prayer: '' };

  const body = openSheet({
    title: 'Lectio Divina',
    full: true,
    html: `<div class="skel skel-line" style="width:50%;margin:30px auto"></div><div class="skel skel-line"></div><div class="skel skel-line"></div>`,
    onClose() { timer?.stop(); },
  });

  try {
    const r = await api.readings();
    gospel = r.sections.find(s => s.id === 'gospel');
  } catch {}
  if (!gospel) {
    body.innerHTML = `<div class="empty"><div class="big">📖</div><p>Couldn’t load today’s Gospel. Check your connection and try again.</p></div>`;
    return;
  }
  api.lectio().then(p => { prompts = p; if (step === 2) render(); }).catch(() => {});

  const STEPS = [
    { k: 'Prepare', t: 'Come, Holy Spirit' },
    { k: 'Lectio', t: 'Read' },
    { k: 'Meditatio', t: 'Reflect' },
    { k: 'Oratio', t: 'Respond' },
    { k: 'Contemplatio', t: 'Rest' },
  ];

  function nav(nextLabel = 'Continue') {
    return `<div class="player-bar">
      <button class="icon-btn" data-act="prev" ${step === 0 ? 'disabled' : ''} aria-label="Previous">${icon('back')}</button>
      <button class="btn btn-primary btn-lg" data-act="next">${nextLabel} ${icon('chev')}</button></div>`;
  }

  function header() {
    const s = STEPS[step];
    return `<div class="steps">${STEPS.map((_, j) => `<i class="${j <= step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="eyebrow" style="text-align:center;color:var(--gold)">${s.k}</div>
      <h2 class="serif" style="text-align:center;font-size:2.1rem;font-weight:600;margin:4px 0 16px">${s.t}</h2>`;
  }

  function render() {
    timer?.stop();
    let html = header();
    if (step === 0) {
      html += `<p class="serif muted" style="text-align:center;font-size:1.2rem;margin:0 0 18px">Find a quiet place. Take a slow breath. Ask the Holy Spirit to open your heart to God’s Word.</p>
        <div class="card prayer">${prayerHTML(PRAYERS['Come Holy Spirit'])}</div>${nav('Begin')}`;
    } else if (step === 1) {
      html += `<p class="muted small" style="text-align:center;margin:-6px 0 14px">Read slowly — perhaps twice. Notice the word or phrase that catches your heart.</p>
        <div class="card"><div class="card-label">${esc(gospel.cite)}</div><p class="reading-text">${esc(gospel.text || gospel.cite)}</p></div>${nav()}`;
    } else if (step === 2) {
      const qs = prompts?.questions?.length ? prompts.questions : FALLBACK_QUESTIONS;
      html += `<div class="card">${qs.map(q => `<p class="serif" style="font-size:1.2rem;line-height:1.5;margin:0 0 14px">✦ ${esc(q)}</p>`).join('')}</div>
        <label class="small faint" for="lx-word" style="display:block;margin:0 4px 6px">The word that stayed with me</label>
        <textarea id="lx-word" class="field" data-n="word" placeholder="Write a word, a phrase, a thought…">${esc(notes.word)}</textarea>${nav()}`;
    } else if (step === 3) {
      html += `<p class="serif muted" style="text-align:center;font-size:1.2rem;margin:0 0 16px">Speak to God about what you read — as a friend speaks to a friend. Thank Him, ask Him, tell Him the truth.</p>
        <textarea class="field" data-n="prayer" style="min-height:150px" placeholder="Lord, …">${esc(notes.prayer)}</textarea>${nav()}`;
    } else if (step === 4) {
      html += `<p class="serif muted" style="text-align:center;font-size:1.2rem;margin:0 0 6px">Now simply rest in God’s presence. No words are needed.</p>
        <div data-ring></div>
        <div class="chips" style="justify-content:center;margin-bottom:6px">${[2, 5, 10].map(m => `<button class="chip ${m === 5 ? 'active' : ''}" data-min="${m}">${m} min</button>`).join('')}</div>
        ${nav('Finish')}`;
    }
    body.innerHTML = html;
    body.scrollTop = 0;
    if (step === 4) startRest(5);
  }

  function startRest(min) {
    timer?.stop();
    bell(1);
    timer = countdown(body.querySelector('[data-ring]'), min, { onDone: () => bell(2) });
    timer.start();
  }

  async function finish() {
    timer?.stop();
    const word = notes.word.trim(), prayer = notes.prayer.trim();
    if (word || prayer) {
      (await import('../screens/journal.js')).saveNote({
        title: `Lectio Divina · ${gospel.cite}`,
        text: [word && `Word: ${word}`, prayer && `Prayer: ${prayer}`].filter(Boolean).join('\n\n'),
      });
    }
    bumpCount('lectio');
    complete('lectio', { quiet: true });
    const carry = prompts?.word || word;
    body.innerHTML = `<div style="text-align:center;padding:40px 10px">
      <div style="font-size:3rem">🕯️</div>
      <div class="eyebrow" style="color:var(--gold);margin-top:16px">A word to carry today</div>
      <h2 class="serif" style="font-size:2rem;font-weight:600;font-style:italic;margin:8px 0 6px">${esc(carry ? `“${carry}”` : 'Thy word is a lamp to my feet')}</h2>
      <p class="muted small" style="margin:0 0 28px">${word || prayer ? 'Your reflection was saved to your Journal.' : esc(gospel.cite)}</p>
      <button class="btn btn-primary btn-lg" data-act="close" style="min-width:200px">Amen</button></div>`;
  }

  body.oninput = e => { const n = e.target.dataset.n; if (n) notes[n] = e.target.value; };
  body.onclick = e => {
    const m = e.target.closest('[data-min]');
    if (m) {
      body.querySelectorAll('[data-min]').forEach(b => b.classList.toggle('active', b === m));
      startRest(+m.dataset.min);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'prev' && step > 0) { step--; render(); }
    if (act === 'next') { if (step < STEPS.length - 1) { step++; render(); } else finish(); }
    if (act === 'close') closeSheet();
  };
  render();
}
