// FAQ and Privacy Policy: one source each (faq.html, privacy.html), shown in a sheet inside the app
// and as normal pages on the web. Any <a data-doc-link href="faq.html"> opens in the sheet.
import { openSheet, track } from './ui.js';

const TITLES = { 'faq.html': 'Questions & answers', 'privacy.html': 'Privacy Policy' };

export async function openDoc(path) {
  const title = TITLES[path] || '';
  track('doc_open', { doc: path.replace('.html', '') });
  const body = openSheet({ title, page: '/' + path.replace('.html', ''), full: true, html: `<div class="doc"><p class="faint">Loading…</p></div>` });
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(r.status);
    const page = new DOMParser().parseFromString(await r.text(), 'text/html');
    const article = page.querySelector('[data-doc]');
    if (!article) throw new Error('no content');
    // The sheet body is shared: bail if another sheet replaced this one while loading.
    const sheet = document.getElementById('sheet');
    if (!sheet.classList.contains('open') || sheet.querySelector('.sheet-title').textContent !== title) return;
    body.innerHTML = `<div class="doc">${article.innerHTML}</div>`;
    // Links between docs stay in the sheet; external links open in a new tab.
    body.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (TITLES[href]) a.setAttribute('data-doc-link', '');
      else if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    });
  } catch {
    location.href = path; // fall back to the real page
  }
}

document.addEventListener('click', e => {
  const a = e.target.closest?.('a[data-doc-link]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  openDoc(a.getAttribute('href'));
});
