import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';
import { attachExecutionMode, publishLive, subscribeLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import { fitContain, toScreen } from './input-board.js';
import { previewState } from '/extensions/genereti_comfy_p5/js/preview-state.js';
import { previewControls } from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import { routePreviewShortcut } from '/extensions/genereti_comfy_stream/js/preview-shortcuts.js';

// ꘇ poliplan: the Poliplan editor (an iframe, the ams-editor-v1 protocol) as a Comfy node. Two boards, image and mask, of
// the node's width and height; at queue time they are exported, uploaded to Comfy's temp folder and read by the python node.
const UPLOAD_FOLDER = 'genereti-poliplan';
const OUTPUTS = ['IMAGE', 'MASK', 'SVG', 'JSON'];
const GAP = 120;   // between the image and the mask board

const connected = node => OUTPUTS.map((_, slot) => node.isOutputConnected?.(slot) ?? Boolean(node.outputs?.[slot]?.links?.length));
const widgetOf = (node, name) => node.widgets?.find(w => w.name === name);

/** The editor's two boards, for a size: like the drawing node, on transparent paper with the titles hidden, the mask below the image. */
const boardsFor = (w, h) => [
  { id: 'main', title: 'image', width: w, height: h, ground: 'transparent', hideBorder: false, hideLabel: true },
  { id: 'mask', title: 'mask', width: w, height: h, ground: 'transparent', x: 0, y: h + GAP, hideBorder: false, hideLabel: true },
];

/** The editor keeps hideLabel for the main board only; the mask board is patched after each init and load. */
const MASK_FLAGS = { hideLabel: true };
const hideMaskLabel = editor => editor?.callTool('ams_board', { action: 'update', id: 'mask', patch: MASK_FLAGS });

/** Live frames are at most this far apart (ms); a stroke is announced by the editor about every 120 ms, a burst of strokes less often. */
const LIVE_MIN_MS = 33;

function makePoliplan(node, name) {
  let value = '', editor = null, starting = null, saving = 0, disposed = false;
  const container = document.createElement('div');
  Object.assign(container.style, { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--comfy-menu-bg, #222)' });
  const status = Object.assign(document.createElement('span'), { className: 'genereti-status' });
  status.style.opacity = '0.7';
  const host = document.createElement('div');
  Object.assign(host.style, { flex: '1 1 auto', minHeight: '560px', position: 'relative' });
  container.append(host, status);

  const size = () => [Number(widgetOf(node, 'width')?.value) || 512, Number(widgetOf(node, 'height')?.value) || 512];
  const say = text => { status.textContent = text || ''; };

  // The live surface shares the texture and livecode controls: delivery and transport above the editor, output windows
  // beside the transport, and freeze/minimize with fit above it. Freeze holds delivery; the editor stays usable.
  let liveUsers = 0, liveTimer = 0, viewers = 0, local = null, output = null;
  let publishing = false, dirty = false, lastPublish = 0;
  const preview = document.createElement('canvas');
  const drawing = document.createElement('canvas');   // the last exported image board, kept so the mirror can repaint without asking the editor
  [preview.width, preview.height] = size();
  // While the live editor is in the Alt+W overlay (an active window you draw in), the node mirrors it: the last frame published.
  const mirror = document.createElement('div');
  Object.assign(mirror.style, { flex: '1 1 auto', minHeight: '560px', display: 'none', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' });
  Object.assign(preview.style, { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'transparent' });
  mirror.append(preview);
  host.after(mirror);

  // ---- The input: an underlay for the node --------------------------------------------------------------------------------
  // The IMAGE input is drawn behind the (transparent) editor, in the image board's place, following the editor's pan and zoom
  // (and the offset the Boards panel gives its canvas). It belongs to the node, not to the drawing: nothing is written into
  // the document, so it never touches undo, the saved drawing or the outputs. It follows the connected source live (freeze
  // the source upstream to hold it) and the glyph beside freeze / fit switches it on and off.
  const props = () => (node.properties ??= {});
  const picture = document.createElement('canvas');
  let hasPicture = false, lastLive = -Infinity, camera = { x: 0, y: 0, z: 1 }, underlayQueued = false, lastBox = '';
  const linked = () => node.inputs?.find(i => i.name === 'image')?.link != null;
  const shown = () => props().poliplanInputShown !== false;
  const underlay = document.createElement('canvas');
  Object.assign(underlay.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' });
  host.append(underlay);
  /** Where the editor's drawing canvas sits inside its frame: the camera is relative to it, and its panels move it. */
  const canvasBox = () => {
    try {
      const el = editor?.frame.contentDocument?.querySelector('canvas.wb-canvas');
      if (el) { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; }
    } catch { /* the editor went away */ }
    return { left: 0, top: 0, width: host.clientWidth, height: host.clientHeight };
  };
  const paintUnderlay = () => {
    underlayQueued = false;
    const dpr = window.devicePixelRatio || 1, w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    if (underlay.width !== Math.round(w * dpr) || underlay.height !== Math.round(h * dpr)) { underlay.width = Math.round(w * dpr); underlay.height = Math.round(h * dpr); }
    const g = underlay.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (!hasPicture || !shown()) return;
    const box = canvasBox(), [bw, bh] = size();
    g.beginPath(); g.rect(box.left, box.top, box.width, box.height); g.clip();
    g.translate(box.left, box.top);
    const r = toScreen(fitContain(picture.width, picture.height, { x: 0, y: 0, width: bw, height: bh }), camera);
    g.drawImage(picture, r.x, r.y, r.width, r.height);
  };
  const queueUnderlay = () => { if (!underlayQueued) { underlayQueued = true; requestAnimationFrame(paintUnderlay); } };
  /** Take a copy of the input (live frames are borrowed and closed right after the callback). */
  const setPicture = (source, width, height) => {
    if (!(width > 0 && height > 0)) return;
    picture.width = width; picture.height = height;
    picture.getContext('2d').drawImage(source, 0, 0);
    const first = !hasPicture;
    hasPicture = true;
    if (first) refreshInputButtons();
    queueUnderlay(); scheduleMirror();
  };
  const clearPicture = () => { if (!hasPicture) return; hasPicture = false; refreshInputButtons(); queueUnderlay(); scheduleMirror(); };
  const loadPicture = url => {
    if (performance.now() - lastLive < 1500) return;   // a live source wins over the last queued result
    const image = new Image();
    image.onload = () => { if (!disposed) setPicture(image, image.naturalWidth, image.naturalHeight); };
    image.src = url;
  };
  /** The input under the drawing, for the node's own mirror and the windows that mirror it. */
  const drawInputInto = ctx => {
    if (!hasPicture || !shown()) return;
    const [bw, bh] = size(), r = fitContain(picture.width, picture.height, { x: 0, y: 0, width: bw, height: bh });
    ctx.drawImage(picture, r.x, r.y, r.width, r.height);
  };
  const stopInput = subscribeLive(node, ({ bitmap }) => { if (bitmap) { lastLive = performance.now(); setPicture(bitmap, bitmap.width, bitmap.height); } }, () => {}, { inputName: 'image' });
  const inputPoll = setInterval(() => {
    if (!linked() && hasPicture) clearPicture();
    const box = JSON.stringify(canvasBox());   // panels opening or closing move the canvas without any event
    if (box !== lastBox) { lastBox = box; queueUnderlay(); }
  }, 300);
  const refreshCamera = async () => {
    if (!editor) return;
    try { const c = await editor.camera(); camera = { x: c.x, y: c.y, z: c.z }; } catch { /* the editor went away */ }
    queueUnderlay();
  };
  const hostWatch = new ResizeObserver(refreshCamera);
  hostWatch.observe(host);
  let refreshInputButtons = () => {};
  /** The mirror (node preview and windows): the input under the last drawing. Cheap, and never asks the editor for anything. */
  const paintMirror = () => {
    if (!drawing.width) return;
    preview.width = drawing.width; preview.height = drawing.height;
    const pc = preview.getContext('2d');
    drawInputInto(pc);
    pc.drawImage(drawing, 0, 0);
    output?.publish({ bitmap: preview });
  };
  let mirrorTimer = 0;
  const scheduleMirror = () => { if (viewers <= 0 || mirrorTimer) return; mirrorTimer = setTimeout(() => { mirrorTimer = 0; paintMirror(); }, 66); };
  /**
   * Publish soon, and never wait for the editing to stop: one export in flight, edits that arrive meanwhile are folded
   * into the next, and frames are at least LIVE_MIN_MS apart (a trailing debounce would hold every frame back until the
   * stroke ended, because the editor announces changes more often than any debounce delay).
   */
  const scheduleLive = () => {
    dirty = true;
    if (publishing || liveTimer) return;
    liveTimer = setTimeout(pump, Math.max(0, LIVE_MIN_MS - (performance.now() - lastPublish)));
  };
  async function pump() {
    liveTimer = 0;
    if (publishing) return;
    publishing = true;
    try {
      while (dirty && !disposed) {
        const wait = LIVE_MIN_MS - (performance.now() - lastPublish);
        if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
        dirty = false;
        await publishLatest();
        lastPublish = performance.now();
      }
    } finally { publishing = false; }
  }
  // `draft`: a live frame also shows the stroke being drawn, which is in the document only after the pointer is released.
  const exportBoard = board => editor.export({ board, format: 'png', scale: 1, transparent: false, draft: true })
    .then(({ blob }) => createImageBitmap(blob));
  /** The mask board on black, as a frame: its paper is transparent. */
  const exportMask = async () => {
    const bitmap = await exportBoard('mask');
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d');
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      return await createImageBitmap(canvas);
    } finally { bitmap.close(); }
  };
  /** After each edit: live delivery to connected outputs and the local output windows. */
  async function publishLatest() {
    if (!editor || disposed || local?.frozen || node._generetiExecutionMode === 'Comfy Queue') return;
    const [image, mask] = connected(node);
    const live = liveUsers > 0 && !node._generetiLivePaused;
    try {
      if (live && image || viewers > 0) {
        const bitmap = await exportBoard('main');
        try {
          if (live && image) publishLive(node, bitmap, 0);
          if (viewers > 0) {
            drawing.width = bitmap.width; drawing.height = bitmap.height;
            drawing.getContext('2d').drawImage(bitmap, 0, 0);
            paintMirror();
          }
        } finally { bitmap.close(); }
      }
      if (live && mask) {
        const bitmap = await exportMask();
        try { publishLive(node, bitmap, 1); } finally { bitmap.close(); }
      }
    } catch (error) { say(error.message); }
  }
  node._generetiLiveSource = {
    retain() { if (++liveUsers === 1) scheduleLive(); },
    release() { liveUsers = Math.max(0, liveUsers - 1); },
  };
  // The editor surface is what the output-only view (Alt+O) shows; frames are published from `preview` below.
  output = previewControls(host, status, node, () => {}, {
    fitTarget: null, initialFrame: () => ({ bitmap: preview }), getRenderSize: () => preview,
    // Alt+W moves the live editor itself into the overlay window (the node mirrors it), as livecode does with its stage.
    interactiveSurface: host, publishOnOpen: false,
    mirrorSurface: () => mirror,
    mountMirror: container => node._poliplanMount(container),
    onSurfaceChange: open => {
      mirror.style.display = open ? 'flex' : 'none';
      if (!open) say('');
      scheduleLive();
      requestAnimationFrame(() => editor?.fit({ board: 'main' }).catch(() => {}));   // the editor has a new size
    },
    getFit: () => node.properties?.genereti_preview_fit ?? 'contain',
    onFitChange: value => local?.setFit(value),
    onViewerChange: opened => { viewers = Math.max(0, viewers + (opened ? 1 : -1)); if (opened) scheduleLive(); },
  });
  node._generetiMountTransport = () => node._generetiExecutionModeElement?.append(output.actions);
  local = previewState(node, host, { getFit: () => node.properties?.genereti_preview_fit ?? 'contain' });
  local.actions.append(output.toolbar);
  // Framing buttons live with freeze / fit: glyphs, not words. Input buttons only appear while there is an input.
  const glyph = (paths, title, onclick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.title = title; b.setAttribute('aria-label', title);
    b.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg>`;
    b.onclick = onclick;
    return b;
  };
  const imageButton = glyph('<rect x="4" y="4" width="16" height="16" rx="1.5"/><circle cx="9" cy="9" r="1.4"/><path d="m4 17 5-5 4 4 3-3 4 4"/>', 'Frame the image board', () => editor?.fit({ board: 'main' }));
  const maskButton = glyph('<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/>', 'Frame the mask board: draw white on the black paper', () => editor?.fit({ board: 'mask' }));
  const inputButton = glyph('<rect x="9" y="4" width="11" height="16" rx="1.5" stroke-dasharray="2 2"/><path d="M3 12h9m-3-3 3 3-3 3"/>', '', () => {
    props().poliplanInputShown = !shown(); node.graph?.change?.(node);
    refreshInputButtons(); queueUnderlay(); scheduleMirror();
  });
  refreshInputButtons = () => {
    inputButton.hidden = !(hasPicture || linked());
    inputButton.setAttribute('aria-pressed', String(shown()));
    inputButton.title = inputButton.ariaLabel = shown()
      ? 'Input shown under the drawing (a reference only, not part of any output) · click to hide it'
      : 'Input hidden · click to show it under the drawing';
  };
  refreshInputButtons();
  local.actions.append(imageButton, maskButton, inputButton);
  const connections = node.onConnectionsChange;
  node.onConnectionsChange = function () { const result = connections?.apply(this, arguments); refreshInputButtons(); return result; };
  const configured = node.onConfigure;
  node.onConfigure = function () { const result = configured?.apply(this, arguments); refreshInputButtons(); return result; };

  /** One configured Poliplan editor: the node's own, and every extra interactive view (the output window), are made here. */
  const openEditor = async (container, initialDocument, { primary = false } = {}) => {
    const { createEditor } = await import(/* @vite-ignore */ api.apiURL('/genereti/poliplan/ams-editor.js'));
    // Read after the import: the workflow sets the saved drawing right after the node is created, not before.
    const document = typeof initialDocument === 'function' ? initialDocument() : initialDocument;
    const [w, h] = size();
    const ed = await createEditor(container, {
      src: api.apiURL('/genereti/poliplan/embed.html'),
      ns: 'genereti-poliplan',
      boards: boardsFor(w, h),
      document,
      ui: { tools: true, view: true, zoom: true, panels: false },
      fit: 'main',
      // The input is drawn behind the editor, so the node's own workspace has to let it through.
      ...(primary ? { background: 'transparent' } : {}),
    });
    if (primary) Object.assign(ed.frame.style, { position: 'relative', zIndex: '1' });
    // The editor's document has no color-scheme of its own; inheriting Comfy's dark one makes Chromium put an opaque
    // backing behind the iframe, so a transparent workspace and paper would never show the graph (Alt+O, overlays).
    ed.frame.style.colorScheme = 'normal';
    await ed.setMode('standalone');
    await ed.setUI({ tools: true, view: true, zoom: true, panels: false });
    await hideMaskLabel(ed);
    // Keys the editor does not use (Alt+O, Alt+W, D …) reach Comfy's shortcuts, as when the focus is outside the iframe.
    ed.on('key', m => routePreviewShortcut({ key: m.key, code: m.code, altKey: m.alt, ctrlKey: m.ctrl, metaKey: m.meta, shiftKey: m.shift,
      preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} }));
    return ed;
  };

  /**
   * Views: the node's editor plus any number of extra ones (the output window). A drawing is edited in one at a time, but
   * every view shows it and accepts input. After a change the whole document is loaded into the others (each keeps its
   * own pan and zoom); changes caused by that load are ignored, and syncs run one at a time, newest source last.
   */
  const views = new Set();
  const quiet = new Set();
  let lastDocument = '', syncing = false, pendingSource = null;
  const everyone = () => [editor, ...views].filter(Boolean);
  const onChange = source => {
    if (quiet.has(source)) { source._changedWhileQuiet = true; return; }
    pendingSource = source;
    if (!syncing) syncViews();
  };
  async function syncViews() {
    syncing = true;
    try {
      while (pendingSource && !disposed) {
        const source = pendingSource;
        pendingSource = null;
        const others = everyone().filter(e => e !== source);
        if (!others.length) continue;
        const { document } = await source.getDocument();
        const json = JSON.stringify(document);
        if (json === lastDocument) continue;
        lastDocument = json;
        const [w, h] = size();
        await Promise.all(others.map(async target => {
          quiet.add(target);
          target._changedWhileQuiet = false;
          try {
            const camera = await target.camera().catch(() => null);
            await target.load(document, { boards: boardsFor(w, h) });
            if (camera) await target.camera({ x: camera.x, y: camera.y, z: camera.z }).catch(() => {});
            await hideMaskLabel(target).catch(() => {});
            if (target === editor) { remember(); scheduleLive(); }
          } catch (error) { say(error.message); }
          // Its change events from the load arrive a moment later; an edit made in that gap is picked up below.
          setTimeout(() => { quiet.delete(target); if (target._changedWhileQuiet) onChange(target); }, 300);
        }));
      }
    } finally { syncing = false; }
  }
  node._poliplanViews = () => everyone();
  /** The output window: another editor on the same drawing. Returns its disposer. */
  node._poliplanMount = async container => {
    await start();
    const { document } = await editor.getDocument();
    const view = await openEditor(container, document);
    view.on('change', () => onChange(view));
    views.add(view);
    return () => { views.delete(view); quiet.delete(view); view.destroy(); };
  };

  const start = async () => {
    if (editor) return editor;
    if (starting) return starting;
    say('Loading Poliplan…');
    starting = (async () => {
      try {
        const saved = () => { try { return value ? JSON.parse(value)?.document : undefined; } catch { return undefined; } };
        editor = await openEditor(host, saved, { primary: true });
        await refreshCamera();
        editor.on('camera', m => { camera = { x: m.x, y: m.y, z: m.z }; queueUnderlay(); });
        editor.on('change', () => { remember(); scheduleLive(); onChange(editor); });
        editor.on('draft', () => scheduleLive());   // once a frame while a stroke grows; `change` only follows the release
        say('');
        node._poliplanShow = ref => loadPicture(ref.url);
        if (node._poliplanReference) loadPicture(node._poliplanReference.url);
        return editor;
      } catch (error) {
        say(`Poliplan did not start: ${error.message}`);
        throw error;
      } finally {
        starting = null;
      }
    })();
    return starting;
  };

  /** The document, kept in the node (and so in the workflow) a moment after the last change. */
  const remember = () => {
    clearTimeout(saving);
    saving = setTimeout(async () => {
      if (disposed || !editor) return;
      try {
        const { document } = await editor.getDocument();
        const next = JSON.stringify({ document, size: size() });
        if (next !== value) { value = next; node.graph?.change?.(node); }
      } catch { /* the editor went away */ }
    }, 500);
  };

  const widget = node.addDOMWidget(name, 'GENERETI_POLIPLAN', container, {
    serialize: true, hideOnZoom: false,
    getValue: () => value,
    setValue(next) {
      value = typeof next === 'string' ? next : '';
      const restore = () => {
        if (!editor || !value) return;
        try { const saved = JSON.parse(value); const [w, h] = size(); editor.load(saved.document, { boards: boardsFor(w, h), fit: 'main' }).then(() => hideMaskLabel(editor)).then(() => onChange(editor)).catch(() => say('Could not restore the drawing')); } catch { say('Could not restore the drawing'); }
      };
      // The editor may still be starting when the workflow sets the value: restore as soon as it is ready.
      if (editor) restore(); else starting?.then(restore).catch(() => {});
    },
  });
  widget.computeSize = width => [width, 600];
  start().catch(() => {});

  /** The boards follow the width and height widgets. */
  node._poliplanResize = async () => {
    if (!editor) return;
    const [w, h] = size();
    try {
      await editor.callTool('ams_board', { action: 'update', id: 'main', patch: { width: w, height: h } });
      await editor.callTool('ams_board', { action: 'update', id: 'mask', patch: { width: w, height: h, x: 0, y: h + GAP, ...MASK_FLAGS } });
      remember();
      onChange(editor);
      queueUnderlay(); scheduleLive();
    } catch (error) { say(error.message); }
  };

  const upload = async (blob, kind) => {
    const body = new FormData();
    body.append('image', blob, `poliplan-${kind}-${crypto.randomUUID()}.png`);
    body.append('type', 'temp');
    body.append('subfolder', UPLOAD_FOLDER);
    const response = await api.fetchApi('/upload/image', { method: 'POST', body });
    if (!response.ok) throw new Error(`Poliplan upload failed (${response.status}).`);
    const result = await response.json();
    return `${result.subfolder ? result.subfolder + '/' : ''}${result.name} [${result.type || 'temp'}]`;
  };

  /** At queue time: export what the connected outputs need and hand the python node the uploaded files. */
  node._poliplan = {
    async serialize() {
      const ed = await start();
      const [image, mask, svg, json] = connected(node);
      const [w, h] = size();
      const result = {};
      if (image) result.image = await upload((await ed.export({ board: 'main', format: 'png', scale: 1, transparent: false })).blob, 'image');
      if (mask) result.mask = await upload((await ed.export({ board: 'mask', format: 'png', scale: 1 })).blob, 'mask');
      if (svg) result.svg = (await ed.export({ board: 'main', format: 'svg' })).text;
      if (json) {
        const { document } = await ed.getDocument();
        result.json = JSON.stringify({ poliplan: { version: 1, boards: { image: { board: 'main', width: w, height: h }, mask: { board: 'mask', width: w, height: h } } }, document });
      }
      return JSON.stringify(result);
    },
    dispose() { disposed = true; stopInput(); clearInterval(inputPoll); clearTimeout(mirrorTimer); hostWatch.disconnect(); clearTimeout(saving); clearTimeout(liveTimer); output?.close(); for (const v of views) v.destroy(); views.clear(); editor?.destroy(); editor = null; },
  };
  return { widget };
}

function makeCapture(node, name) {
  const element = document.createElement('div');
  element.hidden = true;
  const widget = node.addDOMWidget(name, 'GENERETI_POLIPLAN_CAPTURE', element, { serialize: true, getValue: () => '', setValue() {} });
  widget.computeSize = () => [0, 0];
  widget.serializeValue = () => node._poliplan.serialize();
  return { widget };
}

app.registerExtension({
  name: 'Genereti.Poliplan',
  getCustomWidgets() { return { GENERETI_POLIPLAN: makePoliplan, GENERETI_POLIPLAN_CAPTURE: makeCapture }; },
  nodeCreated(node) {
    if (node.comfyClass !== 'GeneretiPoliplan') return;
    node.size = [960, 700];
    attachExecutionMode(node);
    for (const name of ['width', 'height']) {
      const w = widgetOf(node, name);
      if (!w) continue;
      const callback = w.callback;
      w.callback = function () { callback?.apply(this, arguments); node._poliplanResize?.(); };
    }
    // The input image, as the last run saw it, under the image board.
    const executed = node.onExecuted;
    node.onExecuted = function (message) {
      executed?.apply(this, arguments);
      const ref = message?.poliplan_reference?.[0];
      if (!ref) return;
      node._poliplanReference = { url: api.apiURL(`/view?filename=${encodeURIComponent(ref.filename)}&type=${ref.type}&subfolder=${encodeURIComponent(ref.subfolder)}`), opacity: 0.45, title: 'input' };
      node._poliplanShow?.(node._poliplanReference)?.catch(() => {});
    };
    const removed = node.onRemoved;
    node.onRemoved = function () { node._poliplan?.dispose(); return removed?.apply(this, arguments); };
  },
});
