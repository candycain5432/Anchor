// Journal: prayer intentions, gratitude, notes. Everything stays on the device.
import * as store from '../store.js';
import * as api from '../api.js';
import { esc, openSheet, closeSheet, toast, relDay, confirmSheet, haptic } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount } from '../practices.js';

let root, tab = 'intentions', filter = 'active';
const uid = () => crypto.randomUUID?.() || String(Date.now() + Math.random());

// ---- Data helpers (used by other features too) ----
export function saveGratitude(items) {
  const iso = store.isoDate();
  const all = store.get('gratitude', {});
  const first = !all[iso]?.length;
  all[iso] = [...(all[iso] || []), ...items].slice(0, 12);
  store.set('gratitude', all);
  if (first) bumpCount('gratitude');
  complete('gratitude', { quiet: true });
  if (root && tab === 'gratitude') render();
}

export function saveNote({ title, text }) {
  store.update('notes', [], n => [{ id: uid(), title, text, created: Date.now() }, ...n]);
  if (root && tab === 'notes') render();
}

export function openGratitude() {
  const today = store.get('gratitude', {})[store.isoDate()] || [];
  openSheet({
    title: 'Gratitude',
    html: `
      <p class="serif muted" style="font-size:1.15rem;margin:0 0 14px">“Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.” — 1 Thessalonians 5:18</p>
      ${today.length ? `<div class="card"><div class="card-label">Already today</div>${today.map(g => `<div style="padding:4px 0">✦ ${esc(g)}</div>`).join('')}</div>` : ''}
      ${[0, 1, 2].map(i => `<div class="grat-input"><span class="n">${i + 1}</span><input class="field" data-g placeholder="Today I’m grateful for…" maxlength="140"></div>`).join('')}`,
    foot: `<button class="btn btn-primary btn-block btn-lg" data-act="save">Thank You, Lord</button>`,
    onMount(body, foot) {
      setTimeout(() => body.querySelector('[data-g]').focus(), 300);
      foot.onclick = e => {
        if (!e.target.closest('[data-act="save"]')) return;
        const items = [...body.querySelectorAll('[data-g]')].map(i => i.value.trim()).filter(Boolean);
        if (!items.length) return toast('Write at least one thing');
        saveGratitude(items);
        toast('Gratitude saved 🙏');
        closeSheet();
      };
    },
  });
}

// ---- Screen ----
export function mount(el) {
  root = el;
  el.innerHTML = `
    <header class="hero hero-compact">
      <div class="ribbon" aria-hidden="true"></div>
      <div class="hero-top"><span class="eyebrow">Your spiritual journal</span></div>
      <h1 class="hero-title">Journal</h1>
      <p class="hero-sub">Intentions, gratitude, and what God is saying</p>
      <div class="seg seg-hero" role="tablist">
        <button role="tab" data-tab="intentions">Intentions</button>
        <button role="tab" data-tab="gratitude">Gratitude</button>
        <button role="tab" data-tab="notes">Notes</button>
      </div>
    </header>
    <div class="page" data-body></div>`;
  el.addEventListener('click', onClick);
  render();
}

export function show() { render(); }

function render() {
  root.querySelectorAll('[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', b.dataset.tab === tab);
  });
  const body = root.querySelector('[data-body]');
  body.className = 'page stagger';
  body.innerHTML = tab === 'intentions' ? intentionsHTML() : tab === 'gratitude' ? gratitudeHTML() : notesHTML();
}

function intentionsHTML() {
  const all = store.get('intentions', []);
  const answered = all.filter(i => i.answered);
  const list = filter === 'active' ? all.filter(i => !i.answered) : answered;
  return `
    <form class="card" data-form="intention" style="padding:14px">
      <label class="sr-only" for="new-int">New intention</label>
      <textarea id="new-int" class="field" style="min-height:70px;border:0;padding:4px 2px;box-shadow:none" maxlength="300" placeholder="What would you like to pray for?"></textarea>
      <div style="display:flex;justify-content:flex-end"><button class="btn btn-primary btn-sm" type="submit">${icon('plus')} Add intention</button></div>
    </form>
    <div class="seg" style="margin:4px 0 14px">
      <button data-filter="active" class="${filter === 'active' ? 'active' : ''}">Praying for (${all.length - answered.length})</button>
      <button data-filter="answered" class="${filter === 'answered' ? 'active' : ''}">Answered (${answered.length})</button>
    </div>
    ${list.length ? list.map(intentionCard).join('') : `<div class="empty"><div class="big">${filter === 'active' ? '🤲' : '🕊️'}</div><p>${filter === 'active'
      ? 'Add the people and needs you’re carrying. Pray for them here each day.'
      : 'When God answers a prayer, mark it here — a record of His faithfulness.'}</p></div>`}`;
}

function intentionCard(it) {
  const today = it.prayed?.includes(store.isoDate());
  const n = it.prayed?.length || 0;
  return `
    <div class="card intention ${it.answered ? 'answered' : ''}" data-id="${esc(it.id)}">
      <p class="it">${esc(it.text)}</p>
      <div class="meta">Added ${esc(relDay(store.isoDate(new Date(it.created))))}${n ? ` · prayed ${n} time${n === 1 ? '' : 's'}` : ''}${it.answered ? ` · answered ${esc(relDay(it.answered.date))}` : ''}</div>
      ${it.answered?.note ? `<div class="ans">🕊️ ${esc(it.answered.note)}</div>` : ''}
      ${it.composed ? `<div class="composed">${esc(it.composed)}</div>` : ''}
      ${it.answered ? `<div class="card-actions"><button class="btn btn-ghost btn-sm" data-i="delete">${icon('trash')}</button></div>` : `
      <div class="card-actions">
        <button class="btn ${today ? 'btn-soft' : 'btn-primary'} btn-sm" data-i="pray">${today ? `${icon('check')} Prayed today` : '🙏 Pray now'}</button>
        <button class="btn btn-soft btn-sm" data-i="compose">${icon('spark')} ${it.composed ? 'New prayer' : 'Help me pray'}</button>
        <button class="btn btn-soft btn-sm" data-i="answered">🕊️ Answered</button>
        <button class="btn btn-ghost btn-sm" data-i="delete" aria-label="Delete">${icon('trash')}</button>
      </div>`}
    </div>`;
}

function gratitudeHTML() {
  const all = store.get('gratitude', {});
  const days = Object.keys(all).sort().reverse().filter(d => all[d]?.length);
  return `
    <button class="card now-card" data-act="gratitude" style="width:100%;text-align:left">
      <div class="now-icon">🙏</div>
      <div class="now-body"><div class="now-kicker">${all[store.isoDate()]?.length ? 'Add more' : 'Today'}</div><div class="now-title">Count your blessings</div><div class="now-sub">Three gifts from today</div></div>
      <div class="now-go">${icon('plus')}</div>
    </button>
    ${days.length ? days.slice(0, 60).map(d => `
      <div class="card">
        <div class="card-label">${esc(relDay(d))}</div>
        ${all[d].map(g => `<div style="padding:3px 0" class="serif" ><span style="color:var(--gold)">✦</span> <span style="font-size:1.12rem">${esc(g)}</span></div>`).join('')}
      </div>`).join('') : `<div class="empty"><div class="big">🌾</div><p>Gratitude opens the heart to God. Your entries will gather here.</p></div>`}`;
}

function notesHTML() {
  const notes = store.get('notes', []);
  return `
    <button class="btn btn-primary btn-block" data-act="new-note" style="margin-bottom:14px">${icon('edit')} New note</button>
    ${notes.length ? notes.map(n => `
      <button class="card" data-note="${esc(n.id)}" style="display:block;width:100%;text-align:left">
        <div class="card-label">${esc(relDay(store.isoDate(new Date(n.created))))}</div>
        <div class="serif" style="font-size:1.25rem;font-weight:600;line-height:1.2;margin-bottom:4px">${esc(n.title || 'Note')}</div>
        <div class="muted small" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap">${esc(n.text)}</div>
      </button>`).join('') : `<div class="empty"><div class="big">📝</div><p>Notes from Lectio Divina, saved answers from Ask Anchor, and your own reflections live here.</p></div>`}`;
}

// ---- Editing ----
function updateIntention(id, fn) {
  store.update('intentions', [], all => all.map(i => (i.id === id ? fn({ ...i }) : i)));
}

function openNote(id) {
  const notes = store.get('notes', []);
  const n = notes.find(x => x.id === id) || { id: uid(), title: '', text: '', created: Date.now() };
  openSheet({
    title: id ? 'Note' : 'New note',
    html: `<input class="field" data-t placeholder="Title" value="${esc(n.title)}" style="margin-bottom:10px">
      <textarea class="field" data-x placeholder="Write…" style="min-height:240px">${esc(n.text)}</textarea>`,
    foot: `${id ? `<button class="icon-btn" data-act="del" aria-label="Delete note">${icon('trash')}</button>` : ''}<button class="btn btn-primary btn-block" data-act="save">Save</button>`,
    onMount(body, foot) {
      foot.onclick = async e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'save') {
          const t = body.querySelector('[data-t]').value.trim(), x = body.querySelector('[data-x]').value.trim();
          if (!t && !x) return closeSheet();
          store.set('notes', [{ ...n, title: t, text: x }, ...notes.filter(o => o.id !== n.id)]);
          closeSheet(); render();
        }
        if (act === 'del' && await confirmSheet({ title: 'Delete note?', message: 'This can’t be undone.', confirm: 'Delete', danger: true })) {
          store.set('notes', notes.filter(o => o.id !== n.id)); render();
        }
      };
    },
  });
}

async function compose(id, btn) {
  const it = store.get('intentions', []).find(i => i.id === id);
  if (!it) return;
  if (!store.get('composeConsent')) {
    const ok = await confirmSheet({
      title: 'Help me pray',
      message: 'Anchor will send this intention’s text (and nothing else) to its AI service to write a short prayer. It is not stored on the server. Continue?',
      confirm: 'Write a prayer',
    });
    if (!ok) return;
    store.set('composeConsent', true);
  }
  btn.disabled = true;
  btn.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
  try {
    const { prayer } = await api.composePrayer(it.text);
    updateIntention(id, i => ({ ...i, composed: prayer }));
    render();
  } catch (err) {
    toast(err.message || 'Couldn’t write a prayer right now');
    render();
  }
}

function markAnswered(id) {
  openSheet({
    title: 'Prayer answered 🕊️',
    html: `<p class="muted" style="margin:0 0 12px">How did God answer? A few words now will be a gift to remember later.</p>
      <textarea class="field" data-note maxlength="300" placeholder="He answered by…"></textarea>`,
    foot: `<button class="btn btn-primary btn-block btn-lg" data-act="save">Thanks be to God</button>`,
    onMount(body, foot) {
      foot.onclick = e => {
        if (!e.target.closest('[data-act="save"]')) return;
        updateIntention(id, i => ({ ...i, answered: { date: store.isoDate(), note: body.querySelector('[data-note]').value.trim() } }));
        bumpCount('answered');
        import('../practices.js').then(m => m.checkMilestones());
        haptic([10, 40, 10]);
        closeSheet();
        filter = 'answered';
        render();
      };
    },
  });
}

async function onClick(e) {
  const t = e.target;
  const tb = t.closest('[data-tab]');
  if (tb) { tab = tb.dataset.tab; return render(); }
  const f = t.closest('[data-filter]');
  if (f) { filter = f.dataset.filter; return render(); }

  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'gratitude') return openGratitude();
  if (act === 'new-note') return openNote(null);
  const note = t.closest('[data-note]');
  if (note) return openNote(note.dataset.note);

  const ia = t.closest('[data-i]');
  if (ia) {
    const id = ia.closest('[data-id]').dataset.id;
    const a = ia.dataset.i;
    if (a === 'pray') {
      const iso = store.isoDate();
      const it = store.get('intentions', []).find(i => i.id === id);
      if (it?.prayed?.includes(iso)) return;
      updateIntention(id, i => ({ ...i, prayed: [...(i.prayed || []), iso] }));
      bumpCount('intentionPrayed');
      haptic(12);
      toast('Lord, hear our prayer.');
      import('../practices.js').then(m => m.checkMilestones());
      render();
    }
    if (a === 'compose') compose(id, ia);
    if (a === 'answered') markAnswered(id);
    if (a === 'delete' && await confirmSheet({ title: 'Remove intention?', message: 'This can’t be undone.', confirm: 'Remove', danger: true })) {
      store.update('intentions', [], all => all.filter(i => i.id !== id));
      render();
    }
  }
}

// Intention form submit
document.addEventListener('submit', e => {
  if (e.target.dataset?.form !== 'intention') return;
  e.preventDefault();
  const ta = e.target.querySelector('textarea');
  const text = ta.value.trim();
  if (!text) return;
  store.update('intentions', [], all => [{ id: uid(), text, created: Date.now(), prayed: [] }, ...all]);
  filter = 'active';
  render();
  toast('Intention added');
});
