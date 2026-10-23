// Silent prayer / Holy Hour timer with a soft synthesized bell.
import { openSheet, closeSheet, haptic, esc } from '../ui.js';
import { icon } from '../icons.js';
import { complete, bumpCount, checkMilestones } from '../practices.js';

let audio;
/** A gentle church-bell tone built from decaying partials. */
export function bell(times = 1) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    for (let k = 0; k < times; k++) {
      const t0 = audio.currentTime + k * 2.2;
      [[1, .5], [2.01, .22], [2.76, .14], [5.4, .06]].forEach(([mult, gain]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine';
        o.frequency.value = 392 * mult;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain * .5, t0 + .01);
        g.gain.exponentialRampToValueAtTime(.0001, t0 + 4.5 / mult + 1);
        o.connect(g).connect(audio.destination);
        o.start(t0);
        o.stop(t0 + 6);
      });
    }
  } catch {}
}

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}

const PRESETS = [5, 10, 15, 30, 60];
const PROMPTS = [
  'Be still, and know that I am God. — Psalm 46:10',
  'Come to me, all who labor and are burdened, and I will give you rest. — Matthew 11:28',
  'Speak, Lord, for your servant is listening. — 1 Samuel 3:9',
  'My soul rests in God alone. — Psalm 62:1',
  'Could you not watch one hour with me? — Matthew 26:40',
];

/**
 * A ring countdown rendered into `el`. Returns { start, pause, stop }.
 * onDone(minutesPrayed) fires when time runs out.
 */
export function countdown(el, minutes, { onDone, onTick } = {}) {
  const C = 2 * Math.PI * 108;
  el.innerHTML = `
    <div class="timer-ring">
      <svg viewBox="0 0 240 240"><circle class="track" cx="120" cy="120" r="108" fill="none" stroke-width="8"/><circle class="fill" cx="120" cy="120" r="108" fill="none" stroke-width="8" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
      <div class="lbl"><div><div class="time"></div><div class="cap">minutes of silence</div></div></div>
    </div>`;
  const total = minutes * 60;
  let left = total, iv = null, endAt = 0;
  const fill = el.querySelector('.fill'), time = el.querySelector('.time');
  const paint = () => {
    time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    fill.style.strokeDashoffset = String(C * (1 - left / total));
  };
  paint();
  const api = {
    running: false,
    start() {
      if (api.running) return;
      api.running = true;
      endAt = Date.now() + left * 1000;
      iv = setInterval(() => {
        left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        paint();
        onTick?.(left);
        if (left === 0) { api.stop(); onDone?.(minutes); }
      }, 250);
    },
    pause() { api.running = false; clearInterval(iv); },
    stop() { api.running = false; clearInterval(iv); },
    elapsedMin: () => Math.round((total - left) / 60),
  };
  return api;
}

export function openTimer({ minutes } = {}) {
  let t = null;
  const pickHTML = `
    <div style="text-align:center;padding:10px 0 4px">
      <div class="breath" style="margin:30px auto 40px"></div>
      <h2 class="serif" style="font-size:2rem;font-weight:600;margin:0 0 6px">Rest in His presence</h2>
      <p class="muted" style="margin:0 auto 26px;max-width:320px">Choose a time. A bell will sound at the beginning and the end. The screen stays awake.</p>
      <div class="chips" style="justify-content:center;margin-bottom:26px">${PRESETS.map(m => `<button class="chip ${m === (minutes || 10) ? 'active' : ''}" data-min="${m}">${m === 60 ? 'Holy Hour' : m + ' min'}</button>`).join('')}</div>
      <button class="btn btn-primary btn-lg" data-act="begin" style="min-width:220px">${icon('play')} Begin</button>
    </div>`;

  const body = openSheet({
    title: 'Silent Prayer',
    full: true,
    html: pickHTML,
    onClose() { t?.stop(); keepAwake(false); },
  });

  let chosen = minutes || 10;
  body.onclick = e => {
    const m = e.target.closest('[data-min]');
    if (m) {
      chosen = +m.dataset.min;
      body.querySelectorAll('[data-min]').forEach(b => b.classList.toggle('active', b === m));
    }
    if (e.target.closest('[data-act="begin"]')) run(chosen);
  };

  function run(min) {
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    body.innerHTML = `
      <div style="text-align:center;padding-top:10px">
        <div data-ring></div>
        <p class="serif muted" style="font-size:1.2rem;font-style:italic;max-width:330px;margin:0 auto 26px">${esc(prompt)}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-soft btn-lg" data-act="pause">${icon('pause')} Pause</button>
          <button class="btn btn-dark btn-lg" data-act="end">End</button>
        </div>
      </div>`;
    bell(1);
    keepAwake(true);
    t = countdown(body.querySelector('[data-ring]'), min, { onDone: () => done(min) });
    t.start();
    body.onclick = e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'pause') {
        if (t.running) { t.pause(); e.target.closest('button').innerHTML = `${icon('play')} Resume`; }
        else { t.start(); e.target.closest('button').innerHTML = `${icon('pause')} Pause`; }
      }
      if (act === 'end') {
        const m = t.elapsedMin();
        t.stop();
        if (m >= 1) done(m); else closeSheet();
      }
    };
  }

  function done(min) {
    bell(3);
    haptic([30, 80, 30]);
    keepAwake(false);
    bumpCount('silenceMin', min);
    complete('silence', { quiet: true });
    checkMilestones();
    body.innerHTML = `
      <div style="text-align:center;padding:50px 10px">
        <div class="done-mark">${icon('hourglass')}</div>
        <h2 class="serif" style="font-size:2.1rem;font-weight:600;margin:12px 0 6px">${min} minute${min === 1 ? '' : 's'} with the Lord</h2>
        <p class="muted" style="margin:0 auto 28px;max-width:320px">“Remain in me, as I remain in you.” — John 15:4</p>
        <button class="btn btn-primary btn-lg" data-act="close" style="min-width:200px">Amen</button>
      </div>`;
    body.onclick = e => { if (e.target.closest('[data-act="close"]')) closeSheet(); };
  }

  if (minutes) run(minutes);
}
