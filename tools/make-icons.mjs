// Generates Anchor's icon set: SVG sources + PNG renders (via headless Chromium).
// The mark is the early-Christian anchor-cross (crux dissimulata), Hebrews 6:19.
//
// Usage (from the repo root):
//   npm i --no-save playwright && npx playwright install chromium
//   node tools/make-icons.mjs icons icons
//   magick icons/og-image.png -quality 86 icons/og-image.jpg && rm icons/og-image.png
// Then bump CACHE_NAME in service-worker.js.
import { chromium } from 'playwright';
import fs from 'fs';

const OUT = process.argv[2] || 'icons';   // where PNGs go
const SRC = process.argv[3];             // where SVG sources go (optional)
fs.mkdirSync(OUT, { recursive: true });

const f = n => +n.toFixed(1);

/** Anchor-cross glyph in a 512 box. */
function glyph({ w = 28, ring = 30, fill = 'url(#gold)', stroke = fill } = {}) {
  const cx = 256, dy = 10;                       // optical centering
  const ringY = 112 + dy, shaftTop = ringY + ring, shaftBot = 400 + dy;
  const barY = 214 + dy, barHalf = 98;
  const ac = { x: cx, y: 290 + dy }, R = 114;
  const P = deg => { const a = deg * Math.PI / 180; return [ac.x + R * Math.cos(a), ac.y + R * Math.sin(a)]; };
  const [lx, ly] = P(158), [rx, ry] = P(22);

  // Barbed flukes at both arm tips, pointing up and outward along the arc.
  const fluke = (deg, side) => {
    const a = deg * Math.PI / 180;
    const end = P(deg);
    const dir = side < 0 ? [-Math.sin(a), Math.cos(a)] : [Math.sin(a), -Math.cos(a)];
    const nrm = [Math.cos(a), Math.sin(a)];
    const tip = [end[0] + dir[0] * (w * 2.3), end[1] + dir[1] * (w * 2.3)];
    const back = [end[0] - dir[0] * (w * 0.6), end[1] - dir[1] * (w * 0.6)];
    const o = [back[0] + nrm[0] * w * 1.45, back[1] + nrm[1] * w * 1.45];
    const i = [back[0] - nrm[0] * w * 0.5, back[1] - nrm[1] * w * 0.5];
    return `<path d="M${f(tip[0])} ${f(tip[1])} L${f(o[0])} ${f(o[1])} L${f(i[0])} ${f(i[1])} Z" fill="${fill}" stroke="${stroke}" stroke-width="${w * 0.25}" stroke-linejoin="round"/>`;
  };

  return `
    <circle cx="${cx}" cy="${ringY}" r="${ring}" fill="none" stroke="${stroke}" stroke-width="${w * 0.62}"/>
    <rect x="${cx - w / 2}" y="${shaftTop - 2}" width="${w}" height="${shaftBot - shaftTop + 2}" rx="${w / 2}" fill="${fill}"/>
    <path d="M${cx - barHalf} ${f(barY - w * .95)} Q${cx - barHalf + w * 1.2} ${f(barY - w / 2)} ${cx} ${f(barY - w / 2)} Q${cx + barHalf - w * 1.2} ${f(barY - w / 2)} ${cx + barHalf} ${f(barY - w * .95)} V${f(barY + w * .95)} Q${cx + barHalf - w * 1.2} ${f(barY + w / 2)} ${cx} ${f(barY + w / 2)} Q${cx - barHalf + w * 1.2} ${f(barY + w / 2)} ${cx - barHalf} ${f(barY + w * .95)} Z" fill="${fill}" stroke="${stroke}" stroke-width="${w * .18}" stroke-linejoin="round"/>
    <path d="M${f(lx)} ${f(ly)} A${R} ${R} 0 0 0 ${f(rx)} ${f(ry)}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>
    ${fluke(158, -1)}${fluke(22, 1)}`;
}

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2=".35" y2="1">
    <stop offset="0" stop-color="#22336a"/><stop offset=".55" stop-color="#14203f"/><stop offset="1" stop-color="#0a1128"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="40%" r="50%">
    <stop offset="0" stop-color="#e6c77d" stop-opacity=".34"/><stop offset=".6" stop-color="#c9a449" stop-opacity=".06"/><stop offset="1" stop-color="#c9a449" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2=".3" y2="1">
    <stop offset="0" stop-color="#fbe9b7"/><stop offset=".45" stop-color="#e2bf6a"/><stop offset="1" stop-color="#a87f2e"/>
  </linearGradient>
  <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".42"/>
  </filter>`;

/** App tile. shape: 'round' (transparent corners) | 'full' (full-bleed, for maskable/apple). */
function tile({ shape = 'round', scale = .9, w = 28, ring = 30, frame = true }) {
  const clip = shape === 'round' ? `<clipPath id="tile"><rect width="512" height="512" rx="114"/></clipPath>` : '';
  const g = `clip-path="${shape === 'round' ? 'url(#tile)' : ''}"`;
  const s = scale, t = 256 * (1 - s);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${DEFS}${clip}</defs>
  <g ${g}>
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#glow)"/>
    ${frame ? `<rect x="${shape === 'round' ? 26 : 50}" y="${shape === 'round' ? 26 : 50}" width="${shape === 'round' ? 460 : 412}" height="${shape === 'round' ? 460 : 412}" rx="${shape === 'round' ? 92 : 80}" fill="none" stroke="#d9b866" stroke-opacity=".28" stroke-width="3"/>` : ''}
    <g transform="translate(${t} ${t}) scale(${s})" filter="url(#lift)">${glyph({ w, ring })}</g>
  </g>
</svg>`;
}

/** Monochrome silhouette (notification badge / mask-icon). */
function mono({ color = '#fff', w = 40, ring = 36 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g transform="translate(13 13) scale(.95)">${glyph({ w, ring, fill: color, stroke: color })}</g></svg>`;
}

// Shortcut glyphs (gold line art in the same tile)
const SHORTCUT = {
  rosary: `<g fill="none" stroke="url(#gold)" stroke-width="22" stroke-linecap="round">
      ${Array.from({ length: 17 }, (_, k) => { const i = k + 1, a = Math.PI / 2 + (i / 18) * Math.PI * 2; return `<circle cx="${f(256 + 128 * Math.cos(a))}" cy="${f(196 + 128 * Math.sin(a))}" r="${i % 6 === 3 ? 20 : 13}" fill="url(#gold)" stroke="none"/>`; }).join('')}
      <circle cx="256" cy="330" r="11" fill="url(#gold)" stroke="none"/><path d="M256 350 V470 M214 392 H298" stroke-width="26"/></g>`,
  readings: `<g fill="none" stroke="url(#gold)" stroke-width="22" stroke-linejoin="round" stroke-linecap="round">
      <path d="M256 160 C214 128 160 124 110 136 V366 C160 354 214 358 256 390 C298 358 352 354 402 366 V136 C352 124 298 128 256 160 Z"/>
      <path d="M256 160 V390"/><path d="M256 96 V138 M236 112 H276" stroke-width="16"/></g>`,
  ask: `<path d="M256 108 L288 214 L394 246 L288 278 L256 384 L224 278 L118 246 L224 214 Z" fill="url(#gold)"/>
      <circle cx="380" cy="128" r="16" fill="url(#gold)"/><circle cx="138" cy="382" r="12" fill="url(#gold)"/>`,
};
function shortcut(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${DEFS}</defs>
  <rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#glow)"/>
  <g transform="translate(41 31) scale(.84)" filter="url(#lift)">${SHORTCUT[name]}</g></svg>`;
}

// Link-preview card (1200×630)
function og() {
  return `<!doctype html><html><head>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=DM+Sans:wght@500;700&display=block" rel="stylesheet">
  <style>
    html,body{margin:0;width:1200px;height:630px;overflow:hidden}
    body{position:relative;font-family:'DM Sans',sans-serif;color:#fff;
      background:radial-gradient(45% 70% at 26% 50%,rgba(217,184,102,.16),transparent 70%),radial-gradient(60% 80% at 100% 0%,rgba(63,125,78,.35),transparent 60%),linear-gradient(160deg,#22336a,#14203f 55%,#0a1128)}
    .frame{position:absolute;inset:28px;border:1.5px solid rgba(217,184,102,.35);border-radius:22px}
    .ribbon{position:absolute;top:0;right:64px;width:34px;height:150px;background:linear-gradient(90deg,#9a7a2e,#d9b866 45%,#9a7a2e);clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)}
    .mark{position:absolute;left:78px;top:85px;width:460px;height:460px}
    .txt{position:absolute;left:560px;top:150px;right:120px}
    .eyebrow{font-family:Cinzel,serif;letter-spacing:.26em;color:#e9cb87;font-size:19px}
    h1{font-family:Cinzel,serif;font-weight:600;font-size:104px;letter-spacing:.06em;margin:16px 0 6px;line-height:1}
    .tag{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:40px;line-height:1.15;color:rgba(255,255,255,.88);margin:0 0 30px}
    .feat{font-size:20px;line-height:1.9;color:rgba(255,255,255,.72);letter-spacing:.02em}
    .feat span{white-space:nowrap;margin-right:18px}
    .feat b{color:#e9cb87;font-weight:700}
  </style></head><body>
  <div class="frame"></div><div class="ribbon"></div>
  <svg class="mark" viewBox="0 0 512 512"><defs>${DEFS}</defs><g filter="url(#lift)">${glyph({ w: 24, ring: 28 })}</g></svg>
  <div class="txt">
    <div class="eyebrow">CATHOLIC PRAYER COMPANION</div>
    <h1>ANCHOR</h1>
    <p class="tag">“A sure and steadfast<br>anchor of the soul.”</p>
    <div class="feat"><span><b>✦</b> Guided Rosary</span><span><b>✦</b> Daily Readings</span><br><span><b>✦</b> Saints &amp; Patrons</span><span><b>✦</b> Ask Anchor</span></div>
  </div></body></html>`;
}

// ---- Write SVG sources ----
const sources = {
  'icon.svg': tile({ shape: 'round', scale: .9 }),
  'icon-maskable.svg': tile({ shape: 'full', scale: .76, frame: false }),
  'badge.svg': mono(),
  'favicon.svg': tile({ shape: 'round', scale: 1, w: 42, ring: 38, frame: false }),
};
for (const [n, s] of Object.entries(sources)) fs.writeFileSync(`${OUT}/${n}`, s);
if (SRC) for (const [n, s] of Object.entries(sources)) fs.writeFileSync(`${SRC}/${n}`, s);

// ---- Render PNGs ----
const renders = [
  ['icon-192.png', sources['icon.svg'], 192],
  ['icon-512.png', sources['icon.svg'], 512],
  ['icon-maskable-192.png', sources['icon-maskable.svg'], 192],
  ['icon-maskable-512.png', sources['icon-maskable.svg'], 512],
  ['apple-touch-icon.png', tile({ shape: 'full', scale: .86, frame: false }), 180],
  ['favicon-32.png', sources['favicon.svg'], 32],
  ['badge-96.png', sources['badge.svg'], 96],
  ['shortcut-rosary.png', shortcut('rosary'), 192],
  ['shortcut-readings.png', shortcut('readings'), 192],
  ['shortcut-ask.png', shortcut('ask'), 192],
];
const b = await chromium.launch();
const page = await b.newPage();
for (const [name, svg, size] of renders) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: `${OUT}/${name}`, omitBackground: !name.startsWith('apple') });
}
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og(), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUT}/og-image.png` });
await b.close();
console.log('rendered', renders.length + 1, 'images');
