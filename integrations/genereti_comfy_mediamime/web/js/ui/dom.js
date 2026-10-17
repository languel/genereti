// Small DOM helpers and the node's stylesheet. Text in the interface is kept to labels; explanations live in titles (hover).
export function h(tag, props = {}, ...children) {
  const el = tag.startsWith('svg:') ? document.createElementNS('http://www.w3.org/2000/svg', tag.slice(4)) : document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in el && !tag.startsWith('svg:')) el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) el.append(child.nodeType ? child : document.createTextNode(String(child)));
  return el;
}

const STYLE = `
.mm-root{display:flex;flex-direction:column;width:100%;height:100%;background:var(--comfy-menu-bg,#222);color:var(--input-text,#ddd);font:12px system-ui,sans-serif;gap:4px}
.mm-bar{display:flex;gap:4px;align-items:center;flex-wrap:wrap;padding:4px;flex-shrink:0}
.mm-bar .sep{flex:1}
.mm-root button,.mm-root select,.mm-root input{font:inherit;color:inherit;background:var(--comfy-input-bg,#333);border:1px solid var(--border-color,#555);border-radius:4px;padding:2px 6px;min-height:22px;box-sizing:border-box}
.mm-root button{cursor:pointer;min-width:26px}
.mm-root button[aria-pressed=true],.mm-root button.on{background:var(--p-primary-color,#4a7bd8);border-color:transparent;color:#fff}
.mm-root button:disabled{opacity:.4;cursor:default}
.mm-root input[type=number]{width:56px}
.mm-root input[type=text]{min-width:0}
.mm-main{display:flex;flex:1 1 auto;min-height:0;gap:6px;padding:0 4px}
.mm-stage{position:relative;flex:1 1 auto;min-width:300px;min-height:420px;background:#15171b;border-radius:4px;overflow:hidden}
.mm-stage canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.mm-layer{position:absolute;inset:0}
.mm-layer.perform{pointer-events:none}
.mm-side{width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:6px;overflow:auto;padding-right:2px}
.mm-tabs{display:flex;gap:2px;flex-shrink:0}
.mm-tabs button{flex:1}
.mm-card{border:1px solid var(--border-color,#555);border-radius:6px;padding:6px;display:flex;flex-direction:column;gap:4px}
.mm-card.off{opacity:.55}
.mm-row{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.mm-row label{opacity:.7}
.mm-row .grow{flex:1 1 60px}
.mm-chips{display:flex;gap:3px;flex-wrap:wrap}
.mm-chip{padding:1px 6px;border-radius:10px;border:1px solid var(--border-color,#555);cursor:pointer;display:inline-flex;gap:4px;align-items:center}
.mm-chip i{width:8px;height:8px;border-radius:50%;display:inline-block}
.mm-chip.sel{background:var(--p-primary-color,#4a7bd8);color:#fff;border-color:transparent}
.mm-log{font:11px ui-monospace,monospace;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px 4px;flex-shrink:0;min-height:15px}
.mm-picker{display:flex;gap:6px;align-items:flex-start}
.mm-picker svg{background:rgba(0,0,0,.25);border-radius:4px;flex:1 1 0;min-width:0;max-height:220px}
.mm-picker circle{cursor:pointer;fill:rgba(255,255,255,.35);stroke:none}
.mm-picker circle:hover{fill:#fff}
.mm-picker circle.sel{fill:#ffd166}
.mm-picker line{stroke:rgba(255,255,255,.28);stroke-width:.02}
.mm-value{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
.mm-value input[type=number]{width:46px}
.mm-muted{opacity:.6}
.mm-meter{height:4px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden}
.mm-meter i{display:block;height:100%;background:#06d6a0}
`;

export function ensureStyle() {
  if (document.getElementById('mm-style')) return;
  document.head.append(h('style', { id: 'mm-style' }, STYLE));
}

/** A number field that reports when the user changes it. */
export function num(value, onChange, { min, max, step = 1, title, width } = {}) {
  const input = h('input', { type: 'number', value: String(value ?? 0), min, max, step, title, onChange: () => { const v = Number(input.value); if (Number.isFinite(v)) onChange(v); } });
  if (width) input.style.width = width;
  return input;
}

export function select(value, options, onChange, { title } = {}) {
  const el = h('select', { title, onChange: () => onChange(el.value) }, options.map(o => (Array.isArray(o) ? h('option', { value: o[0] }, o[1]) : h('option', { value: o }, o))));
  el.value = value;
  return el;
}

export function text(value, onChange, { title, placeholder, className } = {}) {
  return h('input', { type: 'text', value: value ?? '', title, placeholder, class: className, onChange: e => onChange(e.target.value) });
}

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = n => `${NOTES[n % 12]}${Math.floor(n / 12) - 1}`;
