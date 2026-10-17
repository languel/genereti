import { app } from '../../../scripts/app.js';
import { api } from '../../../scripts/api.js';

// ꘇ poliplan: the Poliplan editor (an iframe, the ams-editor-v1 protocol) as a Comfy node. Two boards, image and mask, of
// the node's width and height; at queue time they are exported, uploaded to Comfy's temp folder and read by the python node.
const UPLOAD_FOLDER = 'genereti-poliplan';
const OUTPUTS = ['IMAGE', 'MASK', 'SVG', 'JSON'];
const GAP = 120;   // between the image and the mask board

const connected = node => OUTPUTS.map((_, slot) => node.isOutputConnected?.(slot) ?? Boolean(node.outputs?.[slot]?.links?.length));
const widgetOf = (node, name) => node.widgets?.find(w => w.name === name);

/** The editor's two boards, for a size. */
const boardsFor = (w, h) => [
  { id: 'main', title: 'image', width: w, height: h, ground: '#ffffff', hideBorder: false, hideLabel: false },
  { id: 'mask', title: 'mask', width: w, height: h, ground: '#000000', x: w + GAP, y: 0, hideBorder: false, hideLabel: false },
];

function makePoliplan(node, name) {
  let value = '', editor = null, starting = null, saving = 0, disposed = false;
  const container = document.createElement('div');
  Object.assign(container.style, { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--comfy-menu-bg, #222)' });
  const controls = document.createElement('div');
  controls.className = 'genereti-node-controls';
  Object.assign(controls.style, { padding: '4px', flexShrink: '0', display: 'flex', gap: '6px', alignItems: 'center' });
  const status = document.createElement('span');
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
        await editor.setMode('standalone');
        await editor.setUI({ tools: true, view: true, zoom: true, panels: false });
        editor.on('change', () => remember());
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
        try { const saved = JSON.parse(value); const [w, h] = size(); editor.load(saved.document, { boards: boardsFor(w, h), fit: 'main' }); } catch { say('Could not restore the drawing'); }
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
      await editor.callTool('ams_board', { action: 'update', id: 'mask', patch: { width: w, height: h, x: w + GAP, y: 0 } });
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
    dispose() { disposed = true; clearTimeout(saving); editor?.destroy(); editor = null; },
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
