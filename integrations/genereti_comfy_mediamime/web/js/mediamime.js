import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';
import { attachExecutionMode, publishLive, subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import { routePreviewShortcut } from '/extensions/genereti_comfy_stream/js/preview-shortcuts.js';
import { BODY_BOARD, DRUM_PADS, bodyBoardFor } from './core/homunculus.js';
import { fromMediamime } from './core/mediamime-import.js';
import { defaultAction, defaultScore, normalizeRegion, parseScore, reconcile, regionsFromPoliplan } from './core/score.js';
import { createRuntime, PUPPET } from './runtime.js';
import { createInspector } from './ui/inspector.js';
import { ensureStyle, h, noteName, num, select, text } from './ui/dom.js';
import { colorOf, createStage } from './ui/stage.js';

// ꘇ mediamime: draw regions over a picture (or on the body, in the homunculus), say what each one sends, and the person's
// landmarks play them. The drawing is Poliplan in overlay mode; the landmarks are a Genereti perception stream (or a puppet).
const widgetOf = (node, name) => node.widgets?.find(w => w.name === name);
const SAVE_MS = 500, SYNC_MS = 120, LIVE_MS = 66;
const MASK_WIDTH = 160;

const bodyX = score => score.board.width + 300;
const boardsFor = score => [
  { id: 'main', title: 'image', width: score.board.width, height: score.board.height, ground: 'transparent', hideLabel: true },
  { id: 'body', title: 'body', x: bodyX(score), y: 0, width: BODY_BOARD.width, height: BODY_BOARD.height, ground: 'transparent', hideLabel: true },
];
const findBoard = (document, id) => (document?.boards ?? []).find(b => b.id === id);

function makeMediamime(node, name) {
  ensureStyle();
  let score = defaultScore();
  let documentJson = null, value = '';
  let editor = null, starting = null, disposed = false;
  let selected = null, mode = 'edit', tab = 'region';
  let saveTimer = 0, syncTimer = 0, syncToken = 0, liveUsers = 0, lastLive = 0;
  const pending = new Map();   // new mark id → the settings it should get when it shows up as a region
  let maskData = null;

  // ---- parts -------------------------------------------------------------------------------------------------------------
  const stage = createStage();
  const status = h('span', { class: 'mm-muted' });
  const say = message => { status.textContent = message || ''; };
  const log = h('div', { class: 'mm-log' });
  const side = h('div', { class: 'mm-side' });
  const inspector = createInspector({
    commit: region => { score = { ...score, regions: score.regions.map(r => (r.id === region.id ? region : r)) }; applyScore(); },
    remove: id => { score = { ...score, regions: score.regions.filter(r => r.id !== id) }; selected = null; applyScore(); showSelected(); },
  });

  const runtime = createRuntime({
    score, owner: node, getMask: () => maskData,
    fetchApi: (url, init) => api.fetchApi(url, init),
    onStatus: say,
    onTick: out => {
      if (out.events?.length) {
        const last = out.events.slice(-4).map(e => `${e.name || e.region} ${e.phase}`).join(' · ');
        log.textContent = last;
        if (tab === 'outputs') paintOutputs();
      }
    },
  });

  const frameCanvas = document.createElement('canvas');
  const unsubscribeImage = subscribeLive(node, ({ bitmap }) => {
    if (!bitmap) return;
    if (frameCanvas.width !== bitmap.width || frameCanvas.height !== bitmap.height) { frameCanvas.width = bitmap.width; frameCanvas.height = bitmap.height; }
    frameCanvas.getContext('2d').drawImage(bitmap, 0, 0);
    stage.scene.frame = frameCanvas;
  }, () => {}, { inputName: 'image' });
  const maskCanvas = document.createElement('canvas');
  const unsubscribeMask = subscribeLive(node, ({ bitmap }) => {
    if (!bitmap) return;
    const w = MASK_WIDTH, h2 = Math.max(1, Math.round(MASK_WIDTH * bitmap.height / bitmap.width));
    if (maskCanvas.width !== w || maskCanvas.height !== h2) { maskCanvas.width = w; maskCanvas.height = h2; }
    const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h2);
    const rgba = ctx.getImageData(0, 0, w, h2).data;
    const data = new Uint8Array(w * h2);
    for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4];
    maskData = { width: w, height: h2, data };
  }, () => {}, { inputName: 'mask' });

  // ---- the score ---------------------------------------------------------------------------------------------------------

  const regionById = id => score.regions.find(r => r.id === id) ?? null;

  /** The score changed (an edit, a new drawing, a load): the engine, the stage and the node's saved value follow. */
  function applyScore() {
    stage.board = { ...score.board };
    stage.scene.regions = score.regions;
    runtime.setScore(score);
    remember();
    paintRegions();
  }

  function remember() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (disposed) return;
      const next = JSON.stringify({ version: 1, score, document: documentJson });
      if (next !== value) { value = next; node.graph?.change?.(node); }
    }, SAVE_MS);
  }

  /** The drawing's marks become regions: new ones are inert, old ones keep their tracker and actions. */
  async function syncFromDocument() {
    if (!editor || disposed) return;
    const token = ++syncToken;
    let document;
    try { ({ document } = await editor.getDocument()); } catch { return; }
    if (token !== syncToken) return;
    documentJson = document;
    const bodyBoard = findBoard(document, 'body') ?? { id: 'body', x: bodyX(score), y: 0 };
    stage.body = { ...stage.body, x: bodyBoard.x ?? bodyX(score), y: bodyBoard.y ?? 0 };
    const extracted = regionsFromPoliplan(document, { image: score.board, body: bodyBoardFor({ ...bodyBoard, id: 'body', x: bodyBoard.x ?? bodyX(score), y: bodyBoard.y ?? 0 }) });
    const before = JSON.stringify(score.regions);
    let next = reconcile(score, extracted);
    next = { ...next, regions: next.regions.map(r => (pending.has(r.id) ? normalizeRegion({ ...r, ...pending.get(r.id) }) : r)) };
    for (const id of [...pending.keys()]) if (next.regions.some(r => r.id === id)) pending.delete(id);
    score = next;
    if (JSON.stringify(score.regions) !== before) applyScore(); else remember();
    if (selected && !regionById(selected)) selected = null;
    showSelected();
  }
  const syncSoon = () => { clearTimeout(syncTimer); syncTimer = setTimeout(syncFromDocument, SYNC_MS); };

  // ---- selection -----------------------------------------------------------------------------------------------------------

  function showSelected() {
    stage.scene.selected = selected;
    inspector.show(selected ? regionById(selected) : null);
    paintRegions();
  }
  function selectRegion(id) {
    selected = id;
    showSelected();
    if (id && tab !== 'region') setTab('region');
  }

  // ---- adding regions from outside the drawing (presets, imports) -------------------------------------------------------------

  const toBoard = (space, [a, b]) => (space === 'body'
    ? [BODY_BOARD.originX + a * BODY_BOARD.scale, BODY_BOARD.originY - b * BODY_BOARD.scale]
    : [a * score.board.width, b * score.board.height]);

  /** A region from a spec: its shape becomes a mark in the drawing, and the settings wait for the mark to arrive as a region. */
  async function addRegion({ name, space = 'image', shape, tracker, actions, color }) {
    const ed = await start();
    const role = shape.type === 'polyline' ? 'line' : 'plane';
    const points = shape.points.map(p => toBoard(space, p));
    const result = await ed.callTool('ams_add', { role, points, board: space === 'body' ? 'body' : 'main', why: name, ...(color ? { color } : {}), ...(role === 'plane' ? { path: 'straight' } : {}) });
    pending.set(result.id, { name, space, shape, ...(tracker ? { tracker } : {}), ...(actions ? { actions } : {}), ...(color ? { color } : {}) });
    return result.id;
  }

  async function drumKit() {
    setView('body');
    for (const [pad, u, v, r, note] of DRUM_PADS) {
      const action = defaultAction('midiNote', pad);
      Object.assign(action, { channel: 10, note, trigger: 'hit', length_ms: 100, velocity: { source: 'speed', in: [0, 6], out: [50, 127], curve: 'linear' } });
      const sides = 28;
      const shape = { type: 'polygon', points: Array.from({ length: sides }, (_, i) => [u + r * Math.cos((i / sides) * 6.2832), v + r * Math.sin((i / sides) * 6.2832)]) };
      await addRegion({ name: pad, space: 'body', shape, tracker: { kind: 'point', points: ['pose.right_wrist', 'pose.left_wrist', 'hands.*.index_tip'], min_confidence: 0.3, hysteresis: 0.02, dwell_ms: 0 }, actions: [action] });
    }
    await syncFromDocument();
    say('');
  }

  async function importFile(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch { say('Not a JSON file'); return; }
    try {
      if (data.score && data.document) {   // ours
        score = parseScore(data.score);
        documentJson = data.document;
        await (await start()).load(data.document, { boards: boardsFor(score) });
        await syncFromDocument();
        applyScore();
        return;
      }
      const { score: imported, skipped } = data.regions && data.version === 1 ? { score: parseScore(data), skipped: [] } : fromMediamime(data);
      for (const r of imported.regions) await addRegion({ name: r.name, space: r.space, shape: r.shape, tracker: r.tracker, actions: r.actions, color: r.color });
      score = { ...score, virtual: { ...score.virtual, ...imported.virtual } };
      await syncFromDocument();
      say(skipped.length ? `Imported; skipped ${skipped.length}` : 'Imported');
    } catch (error) { say(error.message); }
  }

  function exportFile() {
    const blob = new Blob([JSON.stringify({ version: 1, score, document: documentJson }, null, 1)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${score.name || 'mediamime'}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---- the editor ----------------------------------------------------------------------------------------------------------

  const start = async () => {
    if (editor) return editor;
    if (starting) return starting;
    say('Loading Poliplan…');
    starting = (async () => {
      try {
        const { createEditor } = await import(/* @vite-ignore */ api.apiURL('/genereti/poliplan/ams-editor.js'));
        editor = await createEditor(stage.layer, {
          src: api.apiURL('/genereti/poliplan/embed.html'), ns: 'genereti-mediamime',
          boards: boardsFor(score), document: documentJson ?? undefined,
          ui: { tools: true, view: false, zoom: false, panels: false },
        });
        editor.frame.style.colorScheme = 'normal';   // a transparent workspace only shows what is underneath without Comfy's dark scheme behind it
        await editor.setMode('overlay');
        await applyUI();
        stage.onCamera = cam => editor?.camera(cam).catch(() => {});
        editor.on('camera', cam => stage.follow(cam));
        editor.on('change', syncSoon);
        editor.on('draft', () => {});
        editor.on('selection', m => {
          const hit = (m.ids ?? []).find(id => regionById(id));
          if (hit) selectRegion(hit); else if (!(m.ids ?? []).length) { /* keep the last region in the inspector */ }
        });
        editor.on('key', m => {
          if (m.alt && m.code === 'KeyZ') { setPerform(mode === 'edit'); return; }
          routePreviewShortcut({ key: m.key, code: m.code, altKey: m.alt, ctrlKey: m.ctrl, metaKey: m.meta, shiftKey: m.shift,
            preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} });
        });
        stage.fit();
        say('');
        await syncFromDocument();
        return editor;
      } catch (error) {
        say(`Poliplan did not start: ${error.message}`);
        throw error;
      } finally { starting = null; }
    })();
    return starting;
  };

  const applyUI = async () => {
    if (!editor) return;
    await editor.setUI({ tools: mode === 'edit', view: false, zoom: false, panels: false });
  };

  function setPerform(on) {
    mode = on ? 'perform' : 'edit';
    stage.layer.classList.toggle('perform', on);
    modeButton.setAttribute('aria-pressed', String(on));
    modeButton.textContent = on ? '◉' : '✎';
    modeButton.title = on ? 'Perform: the drawing is locked (Alt+Z to edit)' : 'Edit: draw regions (Alt+Z to perform)';
    applyUI().catch(() => {});
  }

  function setView(view) {
    stage.setView(view);
    viewButtons.image.setAttribute('aria-pressed', String(view === 'image'));
    viewButtons.body.setAttribute('aria-pressed', String(view === 'body'));
  }

  // ---- toolbar and panels ----------------------------------------------------------------------------------------------------

  const button = (label, title, onClick, props = {}) => h('button', { type: 'button', title, onClick, ...props }, label);
  const modeButton = button('✎', 'Edit', () => setPerform(mode === 'edit'), { 'aria-pressed': 'false' });
  const viewButtons = {
    image: button('▭', 'Image: regions on the picture', () => setView('image'), { 'aria-pressed': 'true' }),
    body: button('☺', 'Body: regions on the homunculus, they follow the person', () => setView('body'), { 'aria-pressed': 'false' }),
  };
  const sourceSelect = h('select', { title: 'Landmark stream (ꘇ mediapipe.stream), or the puppet', onFocus: () => paintSources(), onChange: () => setSource(sourceSelect.value) });
  const puppetBar = h('span', { class: 'mm-row', style: { display: 'none' } });
  const panic = button('⏹', 'All notes off', () => runtime.panic());
  const testNote = button('♪', 'Send a test note (channel 1, middle C)', () => { runtime.hub.send([{ kind: 'midiNote', phase: 'on', channel: 1, note: 60, velocity: 100, length_ms: 250 }]); if (!runtime.midi.connected) runtime.connectMidi().then(paintOutputs); });
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onChange: () => { const f = fileInput.files[0]; fileInput.value = ''; if (f) importFile(f); } });

  const tabs = {};
  const tabBar = h('div', { class: 'mm-tabs' }, [['region', '◧', 'Selected region'], ['regions', '☰', 'All regions, virtual points, files'], ['outputs', '⇄', 'Outputs: MIDI, OSC, WebSocket']].map(([id, glyph, title]) => {
    tabs[id] = button(glyph, title, () => setTab(id));
    return tabs[id];
  }));
  const panels = { region: inspector.el, regions: h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }), outputs: h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }) };
  side.append(tabBar, panels.region, panels.regions, panels.outputs);
  function setTab(id) {
    tab = id;
    for (const [key, el] of Object.entries(panels)) el.style.display = key === id ? '' : 'none';
    for (const [key, b] of Object.entries(tabs)) b.classList.toggle('on', key === id);
    if (id === 'outputs') paintOutputs();
    if (id === 'regions') paintRegions();
  }

  function paintSources() {
    const names = [PUPPET, ...(globalThis.generetiPerception?.streams.list().map(s => s.name) ?? [])];
    const current = widgetOf(node, 'stream')?.value ?? score.streams.primary;
    const unique = [...new Set([...names.filter(n => n !== PUPPET), current].filter(Boolean))];
    const key = JSON.stringify(unique);
    if (sourceSelect.dataset.key !== key) {
      sourceSelect.dataset.key = key;
      sourceSelect.replaceChildren(h('option', { value: PUPPET }, '☻ puppet'), ...unique.filter(n => n !== PUPPET).map(n => h('option', { value: n }, n)));
    }
    sourceSelect.value = current;
    puppetBar.style.display = current === PUPPET ? '' : 'none';
  }
  function setSource(name) {
    const w = widgetOf(node, 'stream');
    if (w) { w.value = name; w.callback?.(name); }
    score = { ...score, streams: { ...score.streams, primary: name } };
    applyScore();
    paintSources();
  }
  puppetBar.append(
    select('drum', [['drum', '🥁 dance'], ['manual', 'still'], ['rest', 'rest']], mode2 => runtime.setPuppet({ mode: mode2 === 'rest' ? 'manual' : mode2, state: { ...runtime.puppet.state, left: null, right: null } }), { title: 'The puppet’s dance' }),
    num(480, v => runtime.setPuppet({ period: Math.max(120, v) }), { min: 120, step: 20, title: 'ms between hits' }));

  function paintRegions() {
    const el = panels.regions;
    if (tab !== 'regions') return;
    const chips = score.regions.map(r => h('span', { class: `mm-chip${r.id === selected ? ' sel' : ''}`, title: `${r.space} · ${r.actions.length} action${r.actions.length === 1 ? '' : 's'}`, onClick: () => selectRegion(r.id) },
      h('i', { style: { background: colorOf(r) } }), r.name));
    el.replaceChildren(
      h('div', { class: 'mm-chips' }, chips.length ? chips : h('span', { class: 'mm-muted' }, '◌')),
      h('div', { class: 'mm-row' },
        button('🥁', 'Add a drum kit on the body: six pads that play when the hands strike them', () => drumKit().catch(e => say(e.message))),
        button('⬆', 'Import: a Mediamime snapshot, or a mediamime file', () => fileInput.click()),
        button('⬇', 'Export the score and drawing', exportFile)),
      virtualEditor());
  }

  function virtualEditor() {
    const rows = Object.entries(score.virtual).map(([id, v]) => h('div', { class: 'mm-row' },
      h('b', { title: 'use as virtual.' + id }, id),
      text(v.of.join(' '), t => { const of = t.split(/\s+/).filter(Boolean); if (of.length === 2) { score = { ...score, virtual: { ...score.virtual, [id]: { ...v, of } } }; applyScore(); } }, { className: 'grow', title: 'two landmarks' }),
      num(v.t ?? 0.5, t => { score = { ...score, virtual: { ...score.virtual, [id]: { type: 'lerp', of: v.of, t } } }; applyScore(); }, { step: 0.05, title: 'where between them: 0 the first, 1 the second' }),
      button('×', 'remove', () => { const { [id]: _, ...rest } = score.virtual; score = { ...score, virtual: rest }; applyScore(); })));
    return h('div', { class: 'mm-card' },
      h('div', { class: 'mm-row' }, h('b', { title: 'Points between landmarks, usable as virtual.name in a region’s landmarks' }, '◍'),
        button('+', 'add a virtual point (between two landmarks)', () => { const id = `point${Object.keys(score.virtual).length + 1}`; score = { ...score, virtual: { ...score.virtual, [id]: { type: 'lerp', of: ['pose.left_hip', 'pose.right_hip'], t: 0.5 } } }; applyScore(); })),
      ...rows);
  }

  function paintOutputs() {
    const o = score.outputs;
    const el = panels.outputs;
    const set = (path, v) => {
      const next = structuredClone(score.outputs);
      let target = next;
      for (const key of path.slice(0, -1)) target = target[key];
      target[path.at(-1)] = v;
      score = { ...score, outputs: parseScore({ ...score, outputs: next }).outputs };
      applyScore();
      paintOutputs();
    };
    const check = (checked, title, onChange) => h('input', { type: 'checkbox', checked, title, onChange: e => onChange(e.target.checked) });
    const ports = runtime.midi.ports();
    const sent = runtime.hub.sent;
    el.replaceChildren(
      h('div', { class: 'mm-card' },
        h('div', { class: 'mm-row' }, check(o.midi.enabled, 'send MIDI', v => set(['midi', 'enabled'], v)), h('b', {}, 'MIDI'),
          select(o.midi.port, [['all', 'all outputs'], ...ports.map(p => [p.name, p.name]), ...(o.midi.port !== 'all' && !ports.some(p => p.name === o.midi.port) ? [[o.midi.port, o.midi.port]] : [])], v => set(['midi', 'port'], v), { title: 'Web MIDI output port' }),
          button('↻', 'Connect and list MIDI outputs', () => runtime.connectMidi().then(paintOutputs)), h('span', { class: 'mm-muted' }, runtime.midi.connected ? `${ports.length} out · ${sent.midi} sent` : 'not connected'))),
      h('div', { class: 'mm-card' },
        h('div', { class: 'mm-row' }, check(o.osc.enabled, 'send OSC (UDP, from Comfy’s server, to this machine or your local network)', v => set(['osc', 'enabled'], v)), h('b', {}, 'OSC'),
          text(o.osc.host, v => set(['osc', 'host'], v), { className: 'grow', title: 'host: loopback or a private network address' }),
          num(o.osc.port, v => set(['osc', 'port'], v), { min: 1, max: 65535, width: '70px' }), h('span', { class: 'mm-muted' }, `${sent.osc} sent`))),
      h('div', { class: 'mm-card' },
        h('div', { class: 'mm-row' }, check(o.relay.enabled, 'broadcast events to WebSocket clients of this Comfy server', v => set(['relay', 'enabled'], v)), h('b', { title: 'ws://<comfy host>/genereti/mediamime/ws' }, 'WS ⇢ Comfy')),
        h('div', { class: 'mm-row' }, check(o.ws.enabled, 'also connect to a WebSocket server and send region messages', v => set(['ws', 'enabled'], v)), h('b', {}, 'WS'),
          text(o.ws.url, v => set(['ws', 'url'], v), { className: 'grow', placeholder: 'ws://localhost:8080', title: 'a WebSocket URL to send region messages to' }), h('span', { class: 'mm-muted' }, `${sent.ws} sent`))),
      h('div', { class: 'mm-card' },
        h('div', { class: 'mm-row' }, check(o.events.enabled, 'emit Genereti events (livecode: __.events.on(name, …))', v => set(['events', 'enabled'], v)), h('b', {}, '⚡ events'), h('span', { class: 'mm-muted' }, `${sent.events} sent`)),
        h('div', { class: 'mm-row' }, h('label', { title: 'A stream with region.<name>.active / x / y / speed, for rules, livecode and CHOP' }, 'stream'),
          text(score.streams.derived, v => { score = { ...score, streams: { ...score.streams, derived: v } }; applyScore(); }, { className: 'grow', title: 'name of the stream with the regions’ state; empty for none' }))),
      h('div', { class: 'mm-row' }, testNote, panic));
  }

  // ---- layout ----------------------------------------------------------------------------------------------------------------

  const bar = h('div', { class: 'mm-bar' }, modeButton, viewButtons.image, viewButtons.body, button('⤢', 'Fit the view', () => stage.fit()), sourceSelect, puppetBar, h('span', { class: 'sep' }), status);
  const main = h('div', { class: 'mm-main' }, stage.el, side);
  const root = h('div', { class: 'mm-root' }, bar, main, log, fileInput);
  root.addEventListener('pointerdown', e => e.stopPropagation());
  root.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  setTab('region');

  // ---- the loop ----------------------------------------------------------------------------------------------------------------

  let raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (disposed) return;
    const w = widgetOf(node, 'stream');
    if (w && w.value !== score.streams.primary) { score = { ...score, streams: { ...score.streams, primary: String(w.value) } }; applyScore(); }
    if (document.activeElement !== sourceSelect) paintSources();
    const live = runtime.running ? runtime.frame : peek();
    stage.scene.features = live?.features ?? null;
    stage.scene.source = live?.source ?? null;
    stage.scene.snapshot = runtime.last?.regions ?? {};
    stage.draw();
    if (liveUsers > 0 && performance.now() - lastLive >= LIVE_MS && !node._generetiLivePaused && node._generetiExecutionMode !== 'Comfy Queue') {
      lastLive = performance.now();
      createImageBitmap(stage.compose(640)).then(bitmap => { publishLive(node, bitmap, 0); }).catch(() => {});
    }
  };
  /** What the stage shows while the node is stopped: the stream as it is, without running the engine. */
  const peek = () => {
    const name = score.streams.primary;
    if (name === PUPPET) return null;
    const r = globalThis.generetiPerception?.streams.read(name, 1000);
    return r ? { features: r.features, source: r.source } : null;
  };
  raf = requestAnimationFrame(frame);

  node._generetiLiveSource = {
    retain() { liveUsers++; },
    release() { liveUsers = Math.max(0, liveUsers - 1); },
  };
  node._generetiChop = { get latest() { return { channels: Object.fromEntries(Object.entries(runtime.channels).map(([k, v]) => [k, [v]])), sample_rate: 30, start: performance.now() / 1000 }; } };
  node._generetiToggleTransport = () => { if (runtime.running) runtime.stop(); else runtime.start(); node._generetiTransportRefresh?.(); };
  node._generetiTransportState = () => ({ text: runtime.running ? '■' : '▶', title: runtime.running ? 'Stop (every note ends)' : 'Start: regions send' });
  node._generetiSetExecutionMode = m => { if (m === 'Comfy Queue' && runtime.running) { runtime.stop(); node._generetiTransportRefresh?.(); } };
  node._mediamime = {
    runtime, stage, get score() { return score; }, start, addRegion, drumKit, syncFromDocument, select: selectRegion, setView, setPerform,
    capture: () => JSON.stringify(runtime.capture()),
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf); clearTimeout(saveTimer); clearTimeout(syncTimer);
      runtime.dispose(); unsubscribeImage(); unsubscribeMask(); stage.destroy(); editor?.destroy(); editor = null;
    },
  };

  // ---- the widget ------------------------------------------------------------------------------------------------------------

  const widget = node.addDOMWidget(name, 'GENERETI_MEDIAMIME', root, {
    serialize: true, hideOnZoom: false,
    getValue: () => value,
    setValue(next) {
      value = typeof next === 'string' ? next : '';
      let saved = null;
      try { saved = value ? JSON.parse(value) : null; } catch { saved = null; }
      try { score = parseScore(saved?.score ?? defaultScore()); } catch { score = defaultScore(); }
      documentJson = saved?.document ?? null;
      stage.board = { ...score.board };
      stage.scene.regions = score.regions;
      runtime.setScore(score);
      if (editor && documentJson) editor.load(documentJson, { boards: boardsFor(score) }).then(syncFromDocument).catch(() => say('Could not restore the drawing'));
      selected = null;
      showSelected();
    },
  });
  widget.serializeValue = () => JSON.stringify(score);   // the python node's `mediamime` is the score; the drawing stays in the workflow
  widget.computeSize = width => [width, 640];
  setView('image');
  start().catch(() => {});
  return { widget };
}

function makeCapture(node, name) {
  const element = document.createElement('div');
  element.hidden = true;
  const widget = node.addDOMWidget(name, 'GENERETI_MEDIAMIME_CAPTURE', element, { serialize: true, getValue: () => '', setValue() {} });
  widget.computeSize = () => [0, 0];
  widget.serializeValue = () => node._mediamime?.capture() ?? '';
  return { widget };
}

app.registerExtension({
  name: 'Genereti.Mediamime',
  getCustomWidgets() { return { GENERETI_MEDIAMIME: makeMediamime, GENERETI_MEDIAMIME_CAPTURE: makeCapture }; },
  nodeCreated(node) {
    if (node.comfyClass !== 'GeneretiMediamime') return;
    node.size = [1180, 760];
    attachExecutionMode(node);
    const removed = node.onRemoved;
    node.onRemoved = function () { node._mediamime?.dispose(); return removed?.apply(this, arguments); };
  },
});
