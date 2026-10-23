import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';
import { attachExecutionMode, publishLive } from '/extensions/genereti_comfy_p5/js/live-runtime.js';
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
  const controls = document.createElement('div');
  controls.className = 'genereti-node-controls';
  Object.assign(controls.style, { padding: '4px', flexShrink: '0', display: 'flex', gap: '6px', alignItems: 'center' });
  const status = Object.assign(document.createElement('span'),{className:'genereti-status'});
  status.style.opacity = '0.7';
  const button = (label, title, onclick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.title = title; b.onclick = onclick;
    return b;
  };
  const host = document.createElement('div');
  Object.assign(host.style, { flex: '1 1 auto', minHeight: '560px', position: 'relative' });
  controls.append(
    button('Image', 'Frame the image board', () => editor?.fit({ board: 'main' })),
    button('Mask', 'Frame the mask board: draw white on the black paper', () => editor?.fit({ board: 'mask' })),
    status);
  container.append(controls, host);
  controls.addEventListener('pointerdown', e => e.stopPropagation());

  const size = () => [Number(widgetOf(node, 'width')?.value) || 512, Number(widgetOf(node, 'height')?.value) || 512];
  const say = text => { status.textContent = text || ''; };

  // The live surface shares the texture and livecode controls: delivery and transport above the editor, output windows
  // beside the transport, and freeze/minimize with fit above it. Freeze holds delivery; the editor stays usable.
  let liveUsers = 0, liveTimer = 0, viewers = 0, local = null, output = null;
  let publishing = false, dirty = false, lastPublish = 0;
  const preview = document.createElement('canvas');
  [preview.width, preview.height] = size();
  // While the live editor is in the Alt+W overlay (an active window you draw in), the node mirrors it: the last frame published.
  const mirror = document.createElement('div');
  Object.assign(mirror.style, { flex: '1 1 auto', minHeight: '560px', display: 'none', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' });
  Object.assign(preview.style, { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'transparent' });
  mirror.append(preview);
  host.after(mirror);
  const overInput = () => Boolean(widgetOf(node, 'over_input')?.value) && node.inputs?.find(i => i.name === 'image')?.link != null;
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
  const exportBoard = board => editor.export({ board, format: 'png', scale: 1, transparent: board === 'main' && overInput(), draft: true })
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
            preview.width = bitmap.width; preview.height = bitmap.height;
            preview.getContext('2d').drawImage(bitmap, 0, 0);
            output.publish({ bitmap: preview });
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

  const start = async () => {
    if (editor) return editor;
    if (starting) return starting;
    say('Loading Poliplan…');
    starting = (async () => {
      try {
        const { createEditor } = await import(/* @vite-ignore */ api.apiURL('/genereti/poliplan/ams-editor.js'));
        const [w, h] = size();
        let saved = null;
        try { saved = value ? JSON.parse(value) : null; } catch { saved = null; }
        editor = await createEditor(host, {
          src: api.apiURL('/genereti/poliplan/embed.html'),
          ns: 'genereti-poliplan',
          boards: boardsFor(w, h),
          document: saved?.document,
          ui: { tools: true, view: true, zoom: true, panels: false },
          fit: 'main',
        });
        // The editor's document has no color-scheme of its own; inheriting Comfy's dark one makes Chromium put an opaque
        // backing behind the iframe, so a transparent workspace and paper would never show the graph (Alt+O, overlays).
        editor.frame.style.colorScheme = 'normal';
        await editor.setMode('standalone');
        await editor.setUI({ tools: true, view: true, zoom: true, panels: false });
        await hideMaskLabel(editor);
        editor.on('change', () => { remember(); scheduleLive(); });
        editor.on('draft', () => scheduleLive());   // once a frame while a stroke grows; `change` only follows the release
        // Keys the editor does not use (Alt+O, Alt+W, D …) reach Comfy's shortcuts, as when the focus is outside the iframe.
        editor.on('key', m => routePreviewShortcut({ key: m.key, code: m.code, altKey: m.alt, ctrlKey: m.ctrl, metaKey: m.meta, shiftKey: m.shift,
          preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, stopImmediatePropagation() {} }));
        say('');
        if (node._poliplanReference) editor.reference(node._poliplanReference).catch(() => {});
        node._poliplanShow = ref => editor?.reference(ref);
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
      if (editor && value) {
        try { const saved = JSON.parse(value); const [w, h] = size(); editor.load(saved.document, { boards: boardsFor(w, h), fit: 'main' }).then(() => hideMaskLabel(editor)).catch(() => say('Could not restore the drawing')); } catch { say('Could not restore the drawing'); }
      }
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
      const overInput = Boolean(widgetOf(node, 'over_input')?.value) && node.inputs?.find(i => i.name === 'image')?.link != null;
      if (image) result.image = await upload((await ed.export({ board: 'main', format: 'png', scale: 1, transparent: overInput })).blob, 'image');
      if (mask) result.mask = await upload((await ed.export({ board: 'mask', format: 'png', scale: 1 })).blob, 'mask');
      if (svg) result.svg = (await ed.export({ board: 'main', format: 'svg' })).text;
      if (json) {
        const { document } = await ed.getDocument();
        result.json = JSON.stringify({ poliplan: { version: 1, boards: { image: { board: 'main', width: w, height: h }, mask: { board: 'mask', width: w, height: h } } }, document });
      }
      return JSON.stringify(result);
    },
    dispose() { disposed = true; clearTimeout(saving); clearTimeout(liveTimer); output?.close(); editor?.destroy(); editor = null; },
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
