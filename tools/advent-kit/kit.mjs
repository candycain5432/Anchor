// Builds the Advent parish kit from kit.html: flyer and bulletin insert (PDF), social image, link-preview image,
// plus the ready-to-use text. Output goes outside the repo (default /data/GitHub/Anchor-Media/advent-kit);
// the link-preview image is also written to icons/og-advent.jpg, which the /advent/ page uses.
// Usage: node tools/advent-kit/kit.mjs   (needs tools/reels/node_modules, and `qrencode` on the PATH)
import { chromium } from '../reels/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../..');
const OUT = path.resolve(process.env.OUT || '/data/GitHub/Anchor-Media/advent-kit');
fs.mkdirSync(OUT, { recursive: true });

const qr = source => execFileSync('qrencode', ['-t', 'SVG', '-m', '0', '-l', 'M', '--foreground=14203f', '-o', '-', `https://faithanchor.net/advent/?utm_source=${source}`]).toString();

const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
async function page(item, { width, height, scale = 1 }) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await p.goto('file://' + path.join(HERE, 'kit.html') + '?item=' + item, { waitUntil: 'networkidle' });
  await p.evaluate(() => window.ready);
  return p;
}

let p = await page('flyer', { width: 816, height: 1056 });
await p.evaluate(svg => window.setQR(svg), qr('flyer'));
await p.pdf({ path: path.join(OUT, 'flyer-letter.pdf'), width: '8.5in', height: '11in', printBackground: true, pageRanges: '1' });
await p.screenshot({ path: path.join(OUT, 'flyer-preview.png') });
await p.close();

p = await page('insert', { width: 816, height: 528 });
await p.evaluate(svg => window.setQR(svg), qr('bulletin'));
await p.pdf({ path: path.join(OUT, 'insert-half-letter.pdf'), width: '8.5in', height: '5.5in', printBackground: true, pageRanges: '1' });
await p.screenshot({ path: path.join(OUT, 'insert-preview.png') });
await p.close();

p = await page('social', { width: 540, height: 675, scale: 2 });
await p.screenshot({ path: path.join(OUT, 'social-1080x1350.png') });
await p.close();

p = await page('og', { width: 600, height: 315, scale: 2 });
await p.screenshot({ path: path.join(ROOT, 'icons/og-advent.jpg'), type: 'jpeg', quality: 88 });
fs.copyFileSync(path.join(ROOT, 'icons/og-advent.jpg'), path.join(OUT, 'link-preview-1200x630.jpg'));
await p.close();

fs.writeFileSync(path.join(OUT, 'qr-bulletin.svg'), qr('bulletin'));
fs.writeFileSync(path.join(OUT, 'qr-flyer.svg'), qr('flyer'));
fs.copyFileSync(path.join(HERE, 'announcements.md'), path.join(OUT, 'announcements.md'));
await browser.close();
console.log('wrote', fs.readdirSync(OUT).join(', '), '→', OUT);
