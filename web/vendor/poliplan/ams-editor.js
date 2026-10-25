/**
 * ams-editor.js: the host's side of the embedded drawing editor. No dependencies, no build step.
 *
 *   import { createEditor } from './ams-editor.js';
 *   const editor = await createEditor(document.querySelector('#draw'), {
 *     src: './ams-editor/embed.html',          // where the built editor is served (same origin as the page)
 *     ns: 'my-app',                            // keeps its settings apart from other editors on this origin
 *     boards: [{ id: 'main', width: 512, height: 512, ground: '#ffffff' }],
 *     theme: 'auto',                           // dark | light | auto
 *     actions: [{ id: 'save', label: 'Save selection…' }]   // entries in the editor's right-click menu; editor.on('action', ({ id, ids }) => …)
 *   });
 *   editor.on('change', ({ rev }) => save(await editor.getDocument()));
 *   const { blob } = await editor.export({ board: 'main', format: 'png' });
 *
 * Protocol: docs/EMBEDDING.md (channel ams-editor-v1).
 */
const CHANNEL = 'ams-editor-v1';

/**
 * The host page's theme, 'dark' or 'light': window.theme if the host sets one, else data-theme (or data-bs-theme) or a
 * dark / light class on <html>, else the system's preference.
 */
/** A dark or light class (also dark-theme / light-theme, as ComfyUI has), or null. */
const pickClass = el => (!el ? null : el.classList.contains('dark') || el.classList.contains('dark-theme') ? 'dark' : el.classList.contains('light') || el.classList.contains('light-theme') ? 'light' : null);

export function hostTheme() {
  const pick = v => { v = String(v || '').toLowerCase(); return v === 'dark' || v === 'light' ? v : null; };
  const d = document.documentElement;
  return pick(window.theme) || pick(d.dataset.theme) || pick(d.dataset.bsTheme) || (pickClass(d) || pickClass(document.body))
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function createEditor(container, { src, ns = 'ams-embed', theme = 'host', persist = false, timeout = 30000, ...config } = {}) {
  if (!src) throw new Error('createEditor needs src: the URL of the built editor (embed.html)');
  const url = new URL(src, location.href);
  url.searchParams.set('ns', ns);
  url.searchParams.set('origin', location.origin);
  let following = theme === 'host';   // 'host' (the default): the editor wears the host's theme and follows it
  const first = following ? hostTheme() : theme;
  if (first !== 'auto') url.searchParams.set('theme', first);
  if (persist) url.searchParams.set('persist', '1');
  const frame = document.createElement('iframe');
  Object.assign(frame.style, { border: '0', width: '100%', height: '100%', display: 'block' });
  frame.setAttribute('allow', 'clipboard-read; clipboard-write');
  frame.title = 'Drawing editor';

  const listeners = new Map();
  const pending = new Map();
  let seq = 0, ready;
  const readyPromise = new Promise((resolve, reject) => { ready = { resolve, reject }; setTimeout(() => ready.reject(new Error('The drawing editor did not start')), timeout); });
  const target = url.origin;

  const send = msg => frame.contentWindow.postMessage({ channel: CHANNEL, ...msg }, target);
  const request = (type, body = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${type} timed out`)); }, timeout);
    pending.set(id, { resolve: v => { clearTimeout(timer); resolve(v); }, reject: e => { clearTimeout(timer); reject(e); } });
    readyPromise.then(() => send({ type, id, ...body }), reject);
  });
  const emit = (name, data) => { for (const fn of listeners.get(name) || []) { try { fn(data); } catch (err) { console.error(err); } } };

  const onMessage = e => {
    if (e.source !== frame.contentWindow || e.origin !== target) return;
    const m = e.data;
    if (!m || m.channel !== CHANNEL) return;
    if (m.type === 'ready') { ready.resolve(m); return; }
    if (m.type === 'result' || m.type === 'error') {
      const p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id);
      if (m.type === 'result') p.resolve(m.value); else p.reject(new Error(m.message));
      return;
    }
    emit(m.type, m);
  };
  window.addEventListener('message', onMessage);
  frame.src = url.href;
  container.append(frame);

  const editor = {
    frame,
    on(name, fn) { (listeners.get(name) || listeners.set(name, new Set()).get(name)).add(fn); return () => listeners.get(name)?.delete(fn); },
    /** Replace the drawing: a studio document (the result of getDocument), or an Excalidraw scene. */
    load: (document, opts = {}) => request('load', { document, ...opts }),
    loadExcalidraw: scene => request('loadExcalidraw', { scene }),
    /** { rev, document }: the whole drawing as plain JSON. */
    getDocument: () => request('get-document'),
    /**
     * { format: png | bitmap | svg | json | excalidraw, blob | bitmap | text | document | scene, … } for one board, or with `ids` just those marks as png or svg (a blob, on no paper).
     * `draft: true` (png) also draws the stroke still being drawn, which is not in the document until the pointer is released:
     * answer the `draft` event with it for a live view (`change` only follows the release).
     * `format: 'bitmap'` answers `{ bitmap: ImageBitmap }`, with no encode, for live views (a PNG costs about 16 ms at 512 px, 33 ms at 1024, 60 ms at 2048, on the editor's own thread).
     * An editor without it answers "Unknown export format": fall back to png.
     */
    export: opts => request('export', opts),
    /**
     * The score as signals (see src/score/bus.js). subscribeScore({ names?, hz? }, onFrame, onEvent) → unsubscribe.
     * onFrame gets { t, playing, features: { 'lead.x': 0.4, 'lead.u': 0.2, … } } at hz (25 by default; names are prefixes).
     * onEvent gets { seq, t, name, phase: entry|exit|cross|end|arrive|collide, x, y, u, lat, dir, speed, traveler, other, tag }.
     */
    subscribeScore: ({ names, hz } = {}, onFrame, onEvent) => {
      const subId = Math.random().toString(36).slice(2, 10);
      const handler = e => { if (e.data?.channel === CHANNEL && e.data.subId === subId) { if (e.data.type === 'score-frame') onFrame?.(e.data); else if (e.data.type === 'score-event') onEvent?.(e.data); } };
      window.addEventListener('message', handler);
      request('score-subscribe', { names, hz, subId });
      return () => { window.removeEventListener('message', handler); request('score-unsubscribe', { subId }); };
    },
    /** Hide the editor's tools, zoom and transport; shortcuts keep working (Alt+Z does it too, in the editor or on the host page). zen() toggles, zen(true|false) sets; the `zen` event ({ on }) says when it changed. */
    zen: on => request('zen', on === undefined ? {} : { on }),
    /** Host clock: init({ clock: 'host' }) first; then transport({ time, playing, rate }) each frame (seconds). */
    transport: ({ time, playing, rate } = {}) => request('transport', { time, playing, rate }),
    /** A designated input (an element whose play.in is the name): setScoreInput('place', 0.5) places a traveler. */
    setScoreInput: (name, value) => request('score-input', { name, value }),
    /** The whole score as plain JSON (scoreExport), for the standalone runtime (score-runtime.js). */
    exportScore: () => request('score-export'),
    /** The current signals: readScore('lead') → { t, features } (prefix names). */
    readScore: name => request('score-read', { name }),
    /** Events since a sequence number, newest last: recentEvents(0, 'gate') → { events }. */
    recentEvents: (since = 0, name = null) => request('score-recent', { since, name }),
    /** Any studio tool call (ams_add, ams_board, ams_view, …); editor.listTools() lists them. */
    callTool: (name, args) => request('call', { name, args }),
    listTools: () => request('list-tools'),
    setUI: ui => request('set-ui', ui),
    /** 'dark' | 'light' | 'auto', or 'host' to follow the host page's theme again. */
    setTheme: t => { following = t === 'host'; return request('theme', { theme: following ? hostTheme() : t }); },
    /** 'overlay' (a layer over the host's canvas: the host owns the view and the interface) or 'standalone' (the editor on its own, with the studio's zoom, zen, panels and menus). */
    setMode: mode => request('mode', { mode }),
    setTool: tool => request('tool', { tool }),
    /** A picture under the main board to draw over (not exported): { url | blob, opacity, title }; call with nothing to hide it. */
    reference: opts => request('reference', opts || {}),
    /** Read ({ x, y, z, w, h }) or set the view: screen = world × z + (x, y). The `camera` event reports the editor's own pans and zooms. */
    camera: cam => request('camera', cam || {}),
    /** Select marks enclosed by a host selection box in shared world coordinates. */
    selectBox: box => request('select-box', box),
    key: event => request('host-key', event),
    fit: opts => request('fit', opts),
    focus: () => { frame.focus(); return request('focus'); },
    ready: () => readyPromise,
    destroy() { stopTheme(); window.removeEventListener('message', onMessage); frame.remove(); for (const p of pending.values()) p.reject(new Error('The editor was removed')); pending.clear(); }
  };
  // Following the host: its data-theme, class or window.theme changing, or the system's preference.
  const sync = () => { if (following) request('theme', { theme: hostTheme() }).catch(() => {}); };
  const watcher = new MutationObserver(sync);
  watcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-bs-theme', 'class'] });
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', sync);
  const stopTheme = () => { watcher.disconnect(); media.removeEventListener?.('change', sync); };
  return readyPromise.then(async () => { await request('init', { ...config, theme: following ? hostTheme() : theme }); return editor; });
}
