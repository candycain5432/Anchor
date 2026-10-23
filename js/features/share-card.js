// Draws a shareable image (verse, saint quote, or "I prayed…") and shares it.
import { toast, downloadFile, track } from '../ui.js';
import { COLOR_HEX } from '../liturgy.js';

const W = 1080, H = 1350;

function wrap(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function draw({ kind, title, text, cite }) {
  await Promise.all([
    document.fonts.load('italic 500 60px "Cormorant Garamond"'),
    document.fonts.load('600 30px "Cinzel"'),
    document.fonts.load('700 30px "DM Sans"'),
  ]).catch(() => {});

  const lit = COLOR_HEX[document.documentElement.dataset.lit] || COLOR_HEX.white;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Background: navy with a glow in the liturgical color
  const bg = ctx.createLinearGradient(0, 0, W * .3, H);
  bg.addColorStop(0, '#1d2c56'); bg.addColorStop(1, '#0b1430');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W, 0, 0, W, 0, W * 1.1);
  glow.addColorStop(0, lit + 'aa'); glow.addColorStop(1, lit + '00');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(0, H, 0, 0, H, W);
  glow2.addColorStop(0, 'rgba(201,164,73,.28)'); glow2.addColorStop(1, 'rgba(201,164,73,0)');
  ctx.fillStyle = glow2; ctx.fillRect(0, 0, W, H);

  // Grain
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - .5) * 14;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  // Frame
  ctx.strokeStyle = 'rgba(217,184,102,.55)'; ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.strokeStyle = 'rgba(217,184,102,.22)';
  ctx.strokeRect(76, 76, W - 152, H - 152);

  // Ribbon
  ctx.fillStyle = lit;
  ctx.beginPath(); ctx.moveTo(W - 200, 0); ctx.lineTo(W - 160, 0); ctx.lineTo(W - 160, 190); ctx.lineTo(W - 180, 170); ctx.lineTo(W - 200, 190); ctx.closePath(); ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e9cb87';
  ctx.font = '600 30px "Cinzel", serif';
  const eyebrow = kind === 'verse' ? 'VERSE OF THE DAY' : kind === 'saint' ? 'SAINT OF THE DAY' : 'TODAY I PRAYED';
  ctx.fillText(eyebrow.split('').join(String.fromCharCode(8202)), W / 2, 220);
  ctx.font = '400 40px "Cormorant Garamond", serif';
  ctx.fillText('✦', W / 2, 290);

  // Body text, sized to fit
  let size = 76, lines;
  const body = kind === 'prayed' ? title : `“${text.trim().replace(/^[“"]+|[”"]+$/g, '')}”`;
  do {
    ctx.font = `italic 500 ${size}px "Cormorant Garamond", serif`;
    lines = wrap(ctx, body, W - 260);
    size -= 4;
  } while (lines.length * size * 1.32 > 640 && size > 36);
  size += 4;
  const lh = size * 1.32;
  let y = 330 + (680 - lines.length * lh) / 2 + size;
  ctx.fillStyle = '#ffffff';
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lh; }

  if (kind === 'prayed' && text) {
    ctx.font = 'italic 500 44px "Cormorant Garamond", serif';
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (const l of wrap(ctx, `“${text}”`, W - 300)) { y += 10; ctx.fillText(l, W / 2, y); y += 54; }
  }
  if (cite) {
    ctx.font = '700 32px "DM Sans", sans-serif';
    ctx.fillStyle = '#e9cb87';
    ctx.fillText(`— ${cite}`, W / 2, Math.min(y + 50, H - 250));
  }

  // Wordmark
  ctx.font = '600 44px "Cinzel", serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ANCHOR', W / 2, H - 150);
  ctx.font = '500 26px "DM Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillText('A daily Catholic prayer companion', W / 2, H - 108);

  return new Promise(res => c.toBlob(res, 'image/png'));
}

export async function shareCard(opts) {
  toast('Preparing image…', { ms: 1500 });
  const blob = await draw(opts);
  if (!blob) return toast('Could not create image');
  const file = new File([blob], 'anchor.png', { type: 'image/png' });
  track('share', { kind: opts.kind });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Anchor', text: opts.kind === 'verse' ? `${opts.text} — ${opts.cite}` : opts.title });
      return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  downloadFile('anchor.png', blob);
  toast('Image saved');
}
