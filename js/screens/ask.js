// Ask Anchor: streaming chat with on-device history and optional context (a reading, saint…).
import * as store from '../store.js';
import * as api from '../api.js';
import { esc, openSheet, closeSheet, copyText, shareText, toast, track, relDay } from '../ui.js';
import { icon } from '../icons.js';
import { renderMarkdown, stripMarkdown } from '../markdown.js';
import { season, isFeria, saintFallback } from '../liturgy.js';

const MAX_CHATS = 30, HISTORY_TURNS = 12;
let root, chatEl, input, sendBtn, ctxEl;
let chat = null;        // current conversation
let pendingCtx = null;  // context attached to the next new conversation
let controller = null;  // AbortController while streaming

const chats = () => store.get('chats', []);
function saveChat() {
  if (!chat || !chat.messages.length) return;
  chat.updated = Date.now();
  const all = chats().filter(c => c.id !== chat.id);
  all.unshift(chat);
  store.set('chats', all.slice(0, MAX_CHATS));
  store.set('chat:current', chat.id);
}

function newChat(context = null) {
  chat = { id: (crypto.randomUUID?.() || String(Date.now())), title: '', updated: Date.now(), messages: [], context };
  store.del('chat:current');
}

export function mount(el) {
  root = el;
  el.innerHTML = `
    <header class="ask-head">
      <div class="ask-avatar" aria-hidden="true">${icon('spark')}</div>
      <div class="ask-title"><b>Ask Anchor</b><span>Grounded in Church teaching</span></div>
      <button class="icon-btn" data-act="history" aria-label="Past conversations">${icon('history')}</button>
      <button class="icon-btn" data-act="new" aria-label="New conversation">${icon('plus')}</button>
    </header>
    <div class="chat" data-chat aria-live="polite"></div>
    <div class="composer">
      <div data-ctx></div>
      <form class="composer-row" data-form>
        <label class="sr-only" for="ask-input">Ask a question</label>
        <textarea id="ask-input" rows="1" placeholder="Ask about faith, prayer, Scripture…" maxlength="2000"></textarea>
        <button class="send" type="submit" aria-label="Send">${icon('send')}</button>
      </form>
      <div class="disclaimer">Anchor can make mistakes. For serious matters, talk with a priest.</div>
    </div>`;
  chatEl = el.querySelector('[data-chat]');
  input = el.querySelector('textarea');
  sendBtn = el.querySelector('.send');
  ctxEl = el.querySelector('[data-ctx]');

  const current = store.get('chat:current');
  chat = chats().find(c => c.id === current) || null;
  if (!chat) newChat();

  el.querySelector('[data-form]').addEventListener('submit', e => { e.preventDefault(); controller ? stop() : send(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(hover: hover)').matches) { e.preventDefault(); send(); }
  });
  input.addEventListener('input', autosize);
  el.addEventListener('click', onClick);
  render();
}

export function show() {
  setTimeout(() => chatEl.scrollTop = chatEl.scrollHeight, 50);
}

function autosize() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}

// ---- Rendering ----
function starters() {
  const today = store.isoDate();
  const lit = store.get('cache:lit:' + today);
  const rd = store.get('cache:readings2:' + today);
  const gospel = rd?.sections?.find(s => s.id === 'gospel');
  const saint = lit && !isFeria(lit) ? lit.name : saintFallback().name;
  const s = season(lit?.season).key;
  const list = [
    { e: '✝️', t: `Tell me about ${saint}`, ctx: null },
    gospel && { e: '📖', t: `Explain today’s Gospel (${gospel.cite})`, ctx: { kind: 'reading', title: `Gospel — ${gospel.cite}`, text: gospel.text || gospel.cite } },
    s === 'ADVENT' && { e: '🕯️', t: 'How can I prepare my heart for Christmas?' },
    (s === 'LENT' || s === 'HOLY_WEEK') && { e: '🌿', t: 'Give me ideas for prayer, fasting and almsgiving this Lent' },
    s === 'EASTER' && { e: '🌅', t: 'How do I live the joy of Easter in daily life?' },
    { e: '🗝️', t: 'Help me prepare for Confession' },
    { e: '🤍', t: 'How do I pray when God feels distant?' },
    { e: '📿', t: 'Teach me how to pray the Rosary' },
  ].filter(Boolean);
  return list.slice(0, 5);
}

function render() {
  renderCtx();
  if (!chat.messages.length) {
    const name = store.get('profile', {}).name;
    const st = starters();
    chatEl.innerHTML = `
      <div class="chat-empty">
        <div class="mark">${icon('spark')}</div>
        <h2>${name ? `How can I help, ${esc(name)}?` : 'How can I help?'}</h2>
        <p>Ask anything about the Catholic faith — Scripture, prayer, the saints, the sacraments, or what’s on your heart.</p>
        <div class="starters">${st.map((x, i) => `<button class="starter" data-starter="${i}"><span class="e">${x.e}</span>${esc(x.t)}</button>`).join('')}</div>
      </div>`;
    chatEl._starters = st;
    return;
  }
  chatEl.innerHTML = '';
  for (const m of chat.messages) appendMessage(m.role, m.content);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function renderCtx() {
  const c = chat.context || pendingCtx;
  ctxEl.innerHTML = c ? `<div class="ctx-pill"><span>About: ${esc(c.title)}</span><button data-act="clear-ctx" aria-label="Remove context">${icon('x')}</button></div>` : '';
}

function appendMessage(role, content) {
  chatEl.querySelector('.chat-empty')?.remove();
  const el = document.createElement('div');
  if (role === 'user') {
    el.className = 'msg-user';
    el.textContent = content;
  } else {
    el.className = 'msg-ai';
    el.innerHTML = `<div class="md">${renderMarkdown(content)}</div>${tools()}`;
  }
  chatEl.append(el);
  return el;
}

const tools = () => `<div class="msg-tools">
  <button data-tool="copy">${icon('copy')} Copy</button>
  <button data-tool="share">${icon('share')} Share</button>
  <button data-tool="save">${icon('book')} Save</button></div>`;

// ---- Sending ----
async function send(text) {
  const message = (text ?? input.value).trim();
  if (!message || controller) return;
  if (pendingCtx && !chat.messages.length) { chat.context = pendingCtx; }
  pendingCtx = null;
  input.value = ''; autosize();

  const history = chat.messages.slice(-HISTORY_TURNS).map(m => ({ role: m.role, content: m.content }));
  chat.messages.push({ role: 'user', content: message });
  if (!chat.title) chat.title = message.slice(0, 70);
  appendMessage('user', message);
  saveChat();
  renderCtx();
  track('chat_sent', { context: chat.context?.kind || 'none' });

  const el = document.createElement('div');
  el.className = 'msg-ai';
  el.innerHTML = `<div class="md"><span class="typing"><i></i><i></i><i></i></span></div>`;
  chatEl.append(el);
  chatEl.scrollTop = chatEl.scrollHeight;
  const md = el.querySelector('.md');

  controller = new AbortController();
  sendBtn.innerHTML = icon('stop');
  sendBtn.setAttribute('aria-label', 'Stop');
  const coldTimer = setTimeout(() => {
    if (!md.dataset.started) el.insertAdjacentHTML('afterend', `<div class="msg-note" data-cold>Waking up the server — the first answer can take up to 30 seconds…</div>`);
  }, 6000);

  let full = '', frame = 0;
  const paint = () => {
    frame = 0;
    md.innerHTML = renderMarkdown(full) + '<span class="cursor"></span>';
    const nearBottom = chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 120;
    if (nearBottom) chatEl.scrollTop = chatEl.scrollHeight;
  };

  try {
    full = await api.chat({
      message, history, context: chat.context, signal: controller.signal,
      onToken: (_t, all) => {
        md.dataset.started = '1';
        chatEl.querySelector('[data-cold]')?.remove();
        full = all;
        frame ||= requestAnimationFrame(paint);
      },
    });
  } catch (err) {
    if (controller?.signal.aborted) {
      full = full || '_Stopped._';
    } else {
      cancelAnimationFrame(frame);
      md.innerHTML = `<p>${esc(navigator.onLine ? err.message || 'Something went wrong.' : 'You appear to be offline. Check your connection and try again.')}</p>`;
      el.insertAdjacentHTML('beforeend', `<div class="msg-tools"><button data-retry>${icon('history')} Try again</button></div>`);
      el.querySelector('[data-retry]').onclick = () => {
        el.remove();
        chat.messages.pop();
        chatEl.lastElementChild?.classList.contains('msg-user') && chatEl.lastElementChild.remove();
        send(message);
      };
      finishSend(coldTimer);
      return;
    }
  }
  cancelAnimationFrame(frame);
  md.innerHTML = renderMarkdown(full);
  el.insertAdjacentHTML('beforeend', tools());
  chat.messages.push({ role: 'assistant', content: full });
  saveChat();
  finishSend(coldTimer);
}

function finishSend(coldTimer) {
  clearTimeout(coldTimer);
  chatEl.querySelector('[data-cold]')?.remove();
  controller = null;
  sendBtn.innerHTML = icon('send');
  sendBtn.setAttribute('aria-label', 'Send');
}

function stop() { controller?.abort(); }

/** Opens Ask with a fresh conversation about some content and sends the prompt. */
export async function askAbout({ kind, title, text, prompt }) {
  (await import('../app.js')).navigate('ask');
  if (controller) stop();
  saveChat();
  newChat({ kind, title, text: (text || '').slice(0, 4000) });
  render();
  if (prompt) send(prompt);
}

// ---- History ----
function openHistory() {
  const all = chats();
  openSheet({
    title: 'Conversations',
    html: all.length ? `<div class="list">${all.map(c => `
      <div class="row tap" data-open="${esc(c.id)}" role="button" tabindex="0">
        <span class="row-icon">${icon('chat')}</span>
        <span class="row-main"><span class="row-title" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.title || 'Conversation')}</span>
        <span class="row-sub" style="display:block">${esc(relDay(store.isoDate(new Date(c.updated))))} · ${c.messages.length} messages${c.context ? ' · ' + esc(c.context.title) : ''}</span></span>
        <button class="icon-btn" data-del="${esc(c.id)}" aria-label="Delete conversation" style="width:34px;height:34px">${icon('trash')}</button>
      </div>`).join('')}</div>
      <p class="faint small" style="text-align:center">Conversations are stored only on this device.</p>`
      : `<div class="empty"><div class="big">💬</div><p>No conversations yet.</p></div>`,
    onMount(body) {
      body.onclick = e => {
        const del = e.target.closest('[data-del]');
        if (del) {
          store.set('chats', chats().filter(c => c.id !== del.dataset.del));
          if (chat.id === del.dataset.del) { newChat(); render(); }
          del.closest('.row').remove();
          return;
        }
        const open = e.target.closest('[data-open]');
        if (open) {
          chat = chats().find(c => c.id === open.dataset.open) || chat;
          store.set('chat:current', chat.id);
          pendingCtx = null;
          render();
          closeSheet();
        }
      };
    },
  });
}

// ---- Events ----
async function onClick(e) {
  const t = e.target;
  const act = t.closest('[data-act]')?.dataset.act;
  if (act === 'new') { if (controller) stop(); newChat(); pendingCtx = null; render(); input.focus(); return; }
  if (act === 'history') return openHistory();
  if (act === 'clear-ctx') { chat.context = null; pendingCtx = null; saveChat(); renderCtx(); return; }

  const st = t.closest('[data-starter]');
  if (st) {
    const s = chatEl._starters[+st.dataset.starter];
    if (s.ctx) pendingCtx = s.ctx;
    return send(s.t);
  }

  const tool = t.closest('[data-tool]');
  if (tool) {
    const msgEl = tool.closest('.msg-ai');
    const idx = [...chatEl.querySelectorAll('.msg-ai')].indexOf(msgEl);
    const answer = chat.messages.filter(m => m.role === 'assistant')[idx]?.content || msgEl.querySelector('.md').innerText;
    const plain = stripMarkdown(answer);
    if (tool.dataset.tool === 'copy') copyText(plain);
    if (tool.dataset.tool === 'share') shareText({ title: 'From Ask Anchor', text: `${plain}\n\n— Ask Anchor` });
    if (tool.dataset.tool === 'save') {
      (await import('./journal.js')).saveNote({ title: chat.title || 'From Ask Anchor', text: plain });
      toast('Saved to your Journal');
    }
  }
}
