// Shared UI: escaping, the bottom sheet, toasts, haptics, sharing, analytics.
import { icon } from './icons.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Renders prayer text: blank lines = stanzas, "V."/"R." get a gold marker. */
export function prayerHTML(text) {
  return text.split('\n\n').map(st =>
    `<p>${esc(st.trim()).replace(/^(V\.|R\.)/gm, '<span class="vr">$1</span>').replace(/\n/g, '<br>')}</p>`
  ).join('');
}

export function haptic(pattern = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

export function track(event, params = {}) {
  try { window.gtag?.('event', event, params); } catch {}
}

// ---- Toast ----
let toastTimer;
export function toast(msg, { action, onAction, ms = 2600 } = {}) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { el.classList.remove('show'); onAction?.(); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---- Bottom sheet ----
// openSheet({ title, html | node, full, foot, onClose, onMount }) — one sheet at a time.
let sheetClose = null;

export function openSheet({ title = '', html = '', node = null, full = false, foot = '', onClose, onMount, back } = {}) {
  const wrap = $('#sheet');
  const sheet = $('.sheet', wrap);
  if (sheetClose && wrap.classList.contains('open')) {
    const prev = sheetClose; sheetClose = null; prev(true);
  }
  sheet.classList.toggle('full', full);
  sheet.style.transform = '';
  $('.sheet-title', wrap).textContent = title;
  const backBtn = $('.sheet-back', wrap);
  backBtn.hidden = !back;
  backBtn.onclick = back || null;
  const body = $('.sheet-body', wrap);
  // The body/foot elements are reused by every sheet: drop the previous sheet's handlers.
  body.onclick = body.oninput = body.onchange = null;
  body.innerHTML = html;
  if (node) body.append(node);
  body.scrollTop = 0;
  const footEl = $('.sheet-foot', wrap);
  footEl.onclick = null;
  footEl.innerHTML = foot;
  footEl.hidden = !foot;
  wrap.classList.add('open');
  wrap.setAttribute('aria-hidden', 'false');
  document.body.dataset.sheet = 'open';
  sheetClose = (replacing) => { onClose?.(replacing); };
  onMount?.(body, footEl);
  setTimeout(() => $('.sheet-close', wrap).focus({ preventScroll: true }), 50);
  return body;
}

export function closeSheet() {
  const wrap = $('#sheet');
  if (!wrap.classList.contains('open')) return;
  wrap.classList.remove('open');
  wrap.setAttribute('aria-hidden', 'true');
  delete document.body.dataset.sheet;
  const fn = sheetClose; sheetClose = null;
  fn?.(false);
}

export function setSheetTitle(t) { $('#sheet .sheet-title').textContent = t; }

export function initSheet() {
  const wrap = $('#sheet');
  const sheet = $('.sheet', wrap);
  $('.sheet-scrim', wrap).onclick = closeSheet;
  $('.sheet-close', wrap).onclick = closeSheet;
  $('.sheet-close', wrap).innerHTML = icon('x');
  $('.sheet-back', wrap).innerHTML = icon('back');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  // Drag the grab handle down to dismiss.
  const grab = $('.sheet-grab', wrap);
  let y0 = 0, dy = 0, dragging = false;
  grab.addEventListener('pointerdown', e => {
    dragging = true; y0 = e.clientY; dy = 0;
    sheet.style.transition = 'none';
    grab.setPointerCapture(e.pointerId);
  });
  grab.addEventListener('pointermove', e => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - y0);
    sheet.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (dy > 110) closeSheet();
  };
  grab.addEventListener('pointerup', end);
  grab.addEventListener('pointercancel', end);
}

// ---- Confirm dialog (in-sheet) ----
export function confirmSheet({ title, message, confirm = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    let done = false;
    openSheet({
      title,
      html: `<p class="muted" style="margin:0 0 6px">${esc(message)}</p>`,
      foot: `<button class="btn btn-soft btn-block" data-act="no">Cancel</button><button class="btn ${danger ? 'btn-dark' : 'btn-primary'} btn-block" data-act="yes">${esc(confirm)}</button>`,
      onMount: (_b, foot) => {
        foot.onclick = e => {
          const a = e.target.closest('[data-act]')?.dataset.act;
          if (!a) return;
          done = true; resolve(a === 'yes'); closeSheet();
        };
      },
      onClose: () => { if (!done) resolve(false); },
    });
  });
}

// ---- Share / copy ----
export async function shareText({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); track('share', { kind: 'text' }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  await copyText([text, url].filter(Boolean).join('\n'));
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch { toast('Could not copy'); }
}

export function downloadFile(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ---- Misc ----
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? 'Peace be with you' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function fmtDate(d, opts = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return d.toLocaleDateString(undefined, opts);
}

export function relDay(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, dd] = iso.split('-').map(Number);
  const diff = Math.round((today - new Date(y, m - 1, dd)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(y, m - 1, dd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diff > 300 ? 'numeric' : undefined });
}

/** Ornamental seal SVG used for milestones and the onboarding mark. */
export function sealSVG(glyph = '✦', cls = 'seal') {
  const teeth = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return `${50 + Math.cos(a) * 47},${50 + Math.sin(a) * 47} ${50 + Math.cos(a + Math.PI / 24) * 42},${50 + Math.sin(a + Math.PI / 24) * 42}`;
  }).join(' ');
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <polygon class="rim" points="${teeth}"/>
    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>
    <circle cx="50" cy="50" r="31" fill="rgba(0,0,0,.08)"/>
    <text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="28">${glyph}</text>
  </svg>`;
}
