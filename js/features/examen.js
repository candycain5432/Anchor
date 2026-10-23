// Daily Examen (Ignatian) and Confession preparation.
import { EXAMEN_CATEGORIES, DAILY_EXAMEN, CONFESSION_STEPS, PRAYERS } from '../data/prayers.js';
import * as store from '../store.js';
import { openSheet, closeSheet, esc, prayerHTML, relDay, toast } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount, checkMilestones } from '../practices.js';

export function openDailyExamen() {
  let i = 0;
  const grat = ['', '', ''];
  const body = openSheet({ title: 'Daily Examen', full: true, html: '' });

  function render() {
    const s = DAILY_EXAMEN[i];
    const last = i === DAILY_EXAMEN.length - 1;
    body.innerHTML = `
      <div class="steps">${DAILY_EXAMEN.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="eyebrow" style="text-align:center;color:var(--gold)">Step ${i + 1} of ${DAILY_EXAMEN.length}</div>
      <h2 class="serif" style="text-align:center;font-size:2rem;font-weight:600;line-height:1.1;margin:8px 0 14px">${esc(s.title)}</h2>
      <p class="serif" style="text-align:center;font-size:1.22rem;line-height:1.6;margin:0 0 22px">${esc(s.body)}</p>
      ${s.gratitude ? `<div class="card"><div class="card-label">Three gifts from today</div>${grat.map((g, j) =>
        `<div class="grat-input"><span class="n">${j + 1}</span><input class="field" data-g="${j}" value="${esc(g)}" placeholder="I’m grateful for…" maxlength="140"></div>`).join('')}
        <div class="faint small">Saved to your Journal.</div></div>` : ''}
      ${s.prayer ? `<div class="card prayer">${prayerHTML(PRAYERS[s.prayer])}</div>` : ''}
      <div class="player-bar">
        <button class="icon-btn" data-act="prev" ${i === 0 ? 'disabled' : ''} aria-label="Previous">${icon('back')}</button>
        <button class="btn btn-primary btn-lg" data-act="next">${last ? `${icon('check')} Amen` : `Continue ${icon('chev')}`}</button>
      </div>`;
    body.scrollTop = 0;
  }

  body.oninput = e => { const g = e.target.dataset.g; if (g !== undefined) grat[g] = e.target.value; };
  body.onclick = async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'prev' && i > 0) { i--; render(); }
    if (act === 'next') {
      if (i < DAILY_EXAMEN.length - 1) { i++; render(); return; }
      const items = grat.map(g => g.trim()).filter(Boolean);
      if (items.length) (await import('../screens/journal.js')).saveGratitude(items);
      bumpCount('examen');
      complete('examen');
      checkMilestones();
      closeSheet();
    }
  };
  render();
}

export function openConfession() {
  const state = {};
  const total = EXAMEN_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const last = store.get('lastConfession');

  const html = `
    <div class="card" style="text-align:center">
      <div class="card-label" style="justify-content:center">Last Confession</div>
      <div class="serif" style="font-size:1.5rem;font-weight:600" data-last>${last ? esc(relDay(last)) : 'Not recorded'}</div>
      <div class="card-actions" style="justify-content:center">
        <button class="btn btn-soft btn-sm" data-act="went">${icon('check')} I went today</button>
        <label class="btn btn-ghost btn-sm" style="position:relative">${icon('edit')} Set date<input type="date" data-date max="${store.isoDate()}" style="position:absolute;inset:0;opacity:0"></label>
      </div>
    </div>

    <div class="list-label">How to go to Confession</div>
    <div class="card"><ol class="steps-list">${CONFESSION_STEPS.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>

    <div class="list-label">Examination of Conscience</div>
    <p class="serif muted" style="font-size:1.1rem;font-style:italic;margin:0 4px 12px">Ask the Holy Spirit to enlighten your conscience. Read each question slowly; tap it when you have reflected. Nothing here is saved.</p>
    <div class="card" style="padding:14px 16px">
      <div class="small faint" data-prog-t>0 of ${total} reflected upon</div>
      <div class="progress" style="margin-top:8px"><i data-prog style="width:0%"></i></div>
    </div>
    ${EXAMEN_CATEGORIES.map((c, ci) => `
      <div class="examen-cat">${esc(c.title)}</div>
      ${c.items.map((q, qi) => `<button class="examen-item" data-q="${ci}-${qi}"><span class="ck">${icon('check')}</span><span class="tx">${esc(q)}</span></button>`).join('')}
    `).join('')}

    <div class="list-label">Act of Contrition</div>
    <div class="card prayer">${prayerHTML(PRAYERS['Act of Contrition'])}</div>
    <p class="serif muted" style="text-align:center;font-size:1.15rem;font-style:italic">When you are ready, go to Confession and receive God’s mercy.</p>`;

  const body = openSheet({ title: 'Prepare for Confession', full: true, html });

  const setLast = iso => {
    store.set('lastConfession', iso);
    body.querySelector('[data-last]').textContent = relDay(iso);
    toast('Confession date saved. Go in peace!');
  };
  body.onclick = e => {
    const q = e.target.closest('[data-q]');
    if (q) {
      state[q.dataset.q] = !state[q.dataset.q];
      q.classList.toggle('on', state[q.dataset.q]);
      const done = Object.values(state).filter(Boolean).length;
      body.querySelector('[data-prog]').style.width = `${(done / total) * 100}%`;
      body.querySelector('[data-prog-t]').textContent = `${done} of ${total} reflected upon`;
    }
    if (e.target.closest('[data-act="went"]')) setLast(store.isoDate());
  };
  body.querySelector('[data-date]').onchange = e => { if (e.target.value) setLast(e.target.value); };
}
