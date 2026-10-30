// Small canvas/DOM controls for the modular-audio panels. Every control reads and writes a node widget, so what
// you see always matches the parameters other nodes can link to. Minimal style: no borders at rest, text colour.
import {parseUnitValue, clamp, toNorm, fromNorm, snap, formatValue, gainToFader, faderToGain, envelopePoints, envelopeDrag, nearestHandle, filterCurve, dbToY, DB_RANGE} from './audio-ui-core.js';

const STYLE_ID = 'genereti-audio-panel-style';
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style'); style.id = STYLE_ID;
  style.textContent = `
.gap{display:flex;flex-direction:column;gap:6px;width:100%;box-sizing:border-box;color:var(--input-text,#ddd);font:11px system-ui,sans-serif;user-select:none}
.gap-row{display:flex;align-items:flex-end;flex-wrap:wrap;gap:6px 10px}
.gap-grow{flex:1 1 160px;min-width:120px}
.gap-title{opacity:.55;font-size:10px;letter-spacing:.04em;text-transform:uppercase;margin-bottom:2px}
.gap-cell{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:36px}
.gap-cell canvas{touch-action:none;cursor:ns-resize;border:0!important;outline:none!important;box-shadow:none!important}
.gap-cell canvas:focus-visible{filter:drop-shadow(0 0 2px currentColor)}
.gap-label{opacity:.6;font-size:10px;white-space:nowrap}.gap-value{font-size:10px;font-variant-numeric:tabular-nums;min-height:12px}
.gap-value-slot{position:relative;width:52px;height:14px;flex:none;text-align:center}
.gap-value-slot .gap-value{line-height:14px}
.gap-value-edit{position:absolute;inset:0;width:100%;height:100%;appearance:textfield;box-sizing:border-box;border:0;border-radius:4px;background:transparent;color:inherit;font:10px system-ui,sans-serif;font-variant-numeric:tabular-nums;line-height:14px;text-align:center;padding:0;user-select:text}
.gap-value-edit::-webkit-inner-spin-button,.gap-value-edit::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.gap-value-edit:focus{outline:none;box-shadow:none}
.gap-value-edit[hidden]{display:none}
.gap-action-pads{display:grid;grid-template-columns:repeat(var(--pad-columns),30px);grid-template-rows:repeat(var(--pad-rows),1fr);gap:2px;height:62px;flex:none}
.gap-action-pads .gap-btn{padding:0;min-width:0;display:grid;place-items:center;background:color-mix(in srgb,currentColor 6%,transparent);border-radius:4px}
.gap-action-pads .gap-btn:hover{background:color-mix(in srgb,currentColor 15%,transparent)}
.gap-action-pads .gap-btn:active{background:color-mix(in srgb,currentColor 30%,transparent)}
.gap-seg{display:inline-flex;gap:0}
.gap-seg button,.gap-btn{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:3px 6px;border-radius:5px;line-height:1.2}
.gap-seg button:hover,.gap-btn:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
.gap-seg button[aria-pressed=true],.gap-btn[aria-pressed=true]{background:color-mix(in srgb,currentColor 20%,transparent)}
.gap-btn:focus-visible,.gap-seg button:focus-visible,.gap canvas:focus-visible{outline:1px solid currentColor}
.gap canvas.gap-plot{width:100%;display:block;touch-action:none;border-radius:6px;background:color-mix(in srgb,currentColor 5%,transparent)}
.gap-transport-controls,.gap-transport-scale{align-items:center;gap:6px 10px}
.gap-transport-controls select,.gap-transport-scale select{border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;padding:3px;max-width:130px}
.gap-transport-controls select:hover,.gap-transport-scale select:hover{background:color-mix(in srgb,currentColor 12%,transparent)}
.gap-synth{gap:10px}
.gap-synth-oscillator{align-items:center;gap:4px 14px}
.gap-synth-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
.gap-synth-charts .gap-grow{min-width:0}
.gap-synth-filter-controls{min-height:50px;align-items:center;justify-content:space-between;gap:4px}
.gap-synth-knobs{align-items:flex-start;justify-content:space-between;gap:6px}
.gap-synth .gap-keys{margin-top:2px}
.gap-keys{display:flex;gap:2px}.gap-keys button{flex:1;min-width:0;padding:5px 0;border:0;border-radius:4px;color:inherit;font:9px monospace;cursor:pointer;background:color-mix(in srgb,currentColor 9%,transparent)}
.gap-keys button.black{background:color-mix(in srgb,currentColor 22%,transparent)}
.gap-keys button svg{display:block;width:18px;height:18px;margin:auto}
.gap-keys button:active,.gap-keys button[aria-pressed=true],.gap-keys button.gap-playing{background:color-mix(in srgb,currentColor 38%,transparent)}
`;
  document.head.append(style);
}

export const widgetOf = (node, name) => node.widgets?.find(w => w.name === name);
export const getValue = (node, name, fallback = 0) => { const v = widgetOf(node, name)?.value; return v === undefined ? fallback : v; };
export function setValue(node, name, value) {
  const w = widgetOf(node, name); if (!w || w.value === value) return;
  w.value = value; w.callback?.(value, null, node); node.setDirtyCanvas?.(true, true);
}
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const color = canvas => getComputedStyle(canvas).color || '#ddd';
const alpha = (c, a) => `color-mix(in srgb, ${c} ${Math.round(a * 100)}%, transparent)`;
function hiDPI(canvas, w, h) {
  const r = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(w * r) || canvas.height !== Math.round(h * r)) { canvas.width = Math.round(w * r); canvas.height = Math.round(h * r); }
  canvas.style.height = `${h}px`;
  const g = canvas.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h); return g;
}
// DOM widgets are transformed with the graph zoom. Canvas drawing uses local CSS
// pixels; pointer events and bounding boxes use screen pixels.
export function canvasPoint(canvas, event) {
  const r = canvas.getBoundingClientRect();
  return [(event.clientX - r.left) * (canvas.clientWidth / (r.width || 1)),
    (event.clientY - r.top) * (canvas.clientHeight / (r.height || 1))];
}
export function canvasWidth(canvas, fallback) { return canvas.clientWidth || fallback; }
/** Redraw a canvas when its box changes size. */
function observe(canvas, draw) { if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => draw()).observe(canvas); }

export const row = (...kids) => el('div', {className: 'gap-row'}, ...kids);
export const grow = child => { child.classList.add('gap-grow'); return child; };
export function group(title, ...kids) { return el('div', {className: 'gap-grow'}, el('div', {className: 'gap-title', textContent: title}), ...kids); }
export const panelRoot = () => { ensureStyle(); return el('div', {className: 'gap'}); };

/** A component is {el, refresh()}; refresh redraws only when the bound widget values changed. */
function component(element, refresh) { return {el: element, refresh}; }
const stopDrag = e => { e.stopPropagation(); };

// ---- Knob ----
export function knob(node, {name, label = name, min = 0, max = 1, curve = 'lin', unit = '', step = 0, size = 34, def, editMax = max, notches = []}) {
  const canvas = el('canvas', {tabIndex: 0, title: `${label} · drag, wheel or arrows · Shift: fine · double-click: reset · Enter: edit value`});
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('aria-label', label);
  const value = el('div', {className: 'gap-value'}), lab = el('div', {className: 'gap-label', textContent: label});
  const valueSlot = el('div', {className: 'gap-value-slot'}, value);
  const cell = el('div', {className: 'gap-cell'}, lab, canvas, valueSlot);
  const editor = el('input', {className:'gap-value-edit',type:'text',hidden:true});
  editor.setAttribute('aria-label', `Edit ${label}`);valueSlot.append(editor);
  const schema=node.constructor?.nodeData?.input;
  const defaultValue=def??widgetOf(node,name)?.options?.default??schema?.required?.[name]?.[1]?.default??schema?.optional?.[name]?.[1]?.default??getValue(node,name,min);
  let last;
  const draw = () => {
    const v = Number(getValue(node, name, min)), key = `${v}|${size}`; if (key === last) return; last = key;
    const g = hiDPI(canvas, size, size), c = color(canvas), n = toNorm(v, min, max, curve), r = size / 2 - 3, cx = size / 2, cy = size / 2;
    const a0 = Math.PI * .75, a1 = Math.PI * 2.25;
    g.lineWidth = 2.5; g.lineCap = 'round'; g.strokeStyle = alpha(c, .22); g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    g.strokeStyle = c; g.beginPath(); g.arc(cx, cy, r, a0, a0 + (a1 - a0) * n); g.stroke();
    for(const tick of notches){const angle=a0+(a1-a0)*toNorm(tick,min,max,curve);g.lineWidth=1;g.strokeStyle=alpha(c,.5);g.beginPath();g.moveTo(cx+Math.cos(angle)*(r-2),cy+Math.sin(angle)*(r-2));g.lineTo(cx+Math.cos(angle)*(r-5),cy+Math.sin(angle)*(r-5));g.stroke();}
    const a = a0 + (a1 - a0) * n; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); g.lineTo(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1)); g.stroke();
    value.textContent = formatValue(v, unit); canvas.setAttribute('aria-valuenow', String(v));
  };
  const apply = (n) => { const v = snap(fromNorm(n, min, max, curve), step); setValue(node, name, clamp(Number(v.toFixed(4)), min, max)); last = null; draw(); };
  let drag;
  canvas.style.width = canvas.style.height = `${size}px`;
  canvas.onpointerdown = e => { e.stopPropagation(); canvas.focus(); canvas.setPointerCapture(e.pointerId); drag = {y: canvasPoint(canvas, e)[1], n: toNorm(getValue(node, name, min), min, max, curve)}; };
  canvas.onpointermove = e => { if (!drag) return; apply(drag.n + (drag.y - canvasPoint(canvas, e)[1]) / (e.shiftKey ? 600 : 140)); };
  canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
  const closeEditor = commit => {
    if(editor.hidden)return;
    if(commit){const text=editor.value.trim(),v=parseUnitValue(text,unit||(name==='bpm'?'bpm':''),Number(getValue(node,'bpm',120)));if(!text||!Number.isFinite(v)||v<min||v>editMax){editor.setAttribute('aria-invalid','true');return false;}setValue(node,name,clamp(snap(v,step),min,editMax));}
    editor.hidden=true;value.style.visibility='';editor.removeAttribute('aria-invalid');last=null;draw();return true;
  };
  const editValue = e => {e.preventDefault();e.stopPropagation();drag=null;editor.value=String(getValue(node,name,min));editor.hidden=false;value.style.visibility='hidden';editor.removeAttribute('aria-invalid');editor.focus();editor.select();};
  canvas.ondblclick=e=>{e.preventDefault();e.stopPropagation();drag=null;closeEditor(false);setValue(node,name,Number(defaultValue));last=null;draw();};value.ondblclick=editValue;
  editor.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();if(closeEditor(true))canvas.focus();}else if(e.key==='Escape'){e.preventDefault();closeEditor(false);canvas.focus();}};
  editor.onblur=()=>{if(closeEditor(true)===false)closeEditor(false);};
  editor.oninput=()=>editor.removeAttribute('aria-invalid');
  canvas.onwheel = e => { e.preventDefault(); e.stopPropagation(); apply(toNorm(getValue(node, name, min), min, max, curve) - Math.sign(e.deltaY) * (e.shiftKey ? .004 : .03)); };
  canvas.onkeydown = e => { if(e.key==='Enter'){editValue(e);return;} const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); e.stopPropagation(); apply(toNorm(getValue(node, name, min), min, max, curve) + d * (e.shiftKey ? .005 : .03)); } };
  cell.addEventListener('pointerdown', stopDrag);
  draw(); return component(cell, draw);
}

// ---- Vertical fader with optional meter ----
export function fader(node, {name, label = name, max = 2, height = 96, width = 30, unit = 'db'}) {
  const canvas = el('canvas', {tabIndex: 0, title: `${label} · drag or wheel · Shift: fine · double-click: unity`});
  canvas.setAttribute('role', 'slider'); canvas.setAttribute('aria-label', label); canvas.style.width = `${width}px`;
  const value = el('div', {className: 'gap-value'}), lab = el('div', {className: 'gap-label', textContent: label});
  const cell = el('div', {className: 'gap-cell'}, lab, canvas, value);
  let last, meter = 0, hold = 0;
  const draw = () => {
    const v = Number(getValue(node, name, 0)), key = `${v}|${meter.toFixed(2)}|${hold.toFixed(2)}`; if (key === last) return; last = key;
    const g = hiDPI(canvas, width, height), c = color(canvas), p = gainToFader(v, max), pad = 5, track = height - pad * 2;
    g.fillStyle = alpha(c, .08); g.fillRect(width / 2 - 1.5, pad, 3, track);
    if (meter > 0) { const h = Math.min(1, gainToFader(meter, max)) * track; g.fillStyle = alpha(c, meter > 1 ? .95 : .45); g.fillRect(width - 6, pad + track - h, 3, h); }
    if (hold > 0) { g.fillStyle = alpha(c, .7); g.fillRect(width - 6, pad + track - Math.min(1, gainToFader(hold, max)) * track - 1, 3, 1.5); }
    const unity = pad + track - gainToFader(1, max) * track; g.fillStyle = alpha(c, .3); g.fillRect(2, unity, 5, 1);
    const y = pad + track - p * track; g.fillStyle = c; g.fillRect(width / 2 - 9, y - 3, 18, 6);
    value.textContent = unit === 'db' ? formatValue(v, 'db') : formatValue(v);
  };
  const apply = p => { setValue(node, name, Number(faderToGain(p, max).toFixed(3))); last = null; draw(); };
  const fromEvent = e => { const r = canvas.getBoundingClientRect(); return 1 - (e.clientY - r.top - 5) / (height - 10); };
  let drag;
  canvas.onpointerdown = e => { e.stopPropagation(); canvas.focus(); canvas.setPointerCapture(e.pointerId); drag = {y: canvasPoint(canvas, e)[1], p: gainToFader(getValue(node, name, 0), max)}; };
  canvas.onpointermove = e => { if (!drag) return; apply(clamp(drag.p + (drag.y - canvasPoint(canvas, e)[1]) / ((e.shiftKey ? 6 : 1) * (height - 10)), 0, 1)); };
  canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
  canvas.ondblclick = e => { e.stopPropagation(); setValue(node, name, 1); last = null; draw(); };
  canvas.onwheel = e => { e.preventDefault(); e.stopPropagation(); apply(clamp(gainToFader(getValue(node, name, 0), max) - Math.sign(e.deltaY) * (e.shiftKey ? .005 : .03), 0, 1)); };
  canvas.onkeydown = e => { const d = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0; if (d) { e.preventDefault(); e.stopPropagation(); apply(clamp(gainToFader(getValue(node, name, 0), max) + d * (e.shiftKey ? .005 : .03), 0, 1)); } };
  cell.addEventListener('pointerdown', stopDrag);
  const api = component(cell, draw);
  api.setMeter = peak => { meter = peak; hold = Math.max(peak, hold - .02); draw(); };
  draw(); return api;
}

// ---- Toggle / momentary text button bound to a boolean widget ----
export function toggle(node, {name, label, title = label, on = label}) {
  const b = el('button', {className: 'gap-btn', textContent: label, title}); b.type = 'button'; b.setAttribute('aria-label', title);
  const draw = () => b.setAttribute('aria-pressed', String(Boolean(getValue(node, name, false))));
  b.onclick = () => { setValue(node, name, !getValue(node, name, false)); draw(); };
  b.onpointerdown = stopDrag; draw(); return component(b, draw);
}

// ---- Segmented choice bound to a combo widget ----
export function segmented(node, {name, options, title = name}) {
  const wrap = el('div', {className: 'gap-seg', title}); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', title);
  const buttons = options.map(o => { const b = el('button', {textContent: o.label, title: o.title ?? String(o.value)}); b.type = 'button'; b.setAttribute('aria-label', o.title ?? String(o.value)); b.onclick = () => { setValue(node, name, o.value); draw(); }; wrap.append(b); return [o, b]; });
  const draw = () => { const v = getValue(node, name, null); for (const [o, b] of buttons) b.setAttribute('aria-pressed', String(o.value === v)); };
  wrap.addEventListener('pointerdown', stopDrag); draw(); return component(wrap, draw);
}

// ---- ADSR editor ----
export function envelope(node, names = {attack: 'attack', decay: 'decay', sustain: 'sustain', release: 'release'}, {height = 92} = {}) {
  const canvas = el('canvas', {className: 'gap-plot', tabIndex: 0, title: 'Envelope · drag the points: attack, decay + sustain, release · double-click resets'});
  const read = () => ({attack: Number(getValue(node, names.attack, .02)), decay: Number(getValue(node, names.decay, .15)), sustain: Number(getValue(node, names.sustain, .6)), release: Number(getValue(node, names.release, .3))});
  const size = () => { return [Math.max(120, canvasWidth(canvas, 200)), height]; };
  let last, hover = null, active = null;
  const draw = () => {
    const env = read(), [w, h] = size(), key = JSON.stringify([env, w, hover, active]); if (key === last) return; last = key;
    const g = hiDPI(canvas, w, h), c = color(canvas), p = envelopePoints(env, w, h);
    g.strokeStyle = alpha(c, .12); g.lineWidth = 1; for (const f of [.25, .5, .75]) { g.beginPath(); g.moveTo(4, 4 + (h - 8) * f); g.lineTo(w - 4, 4 + (h - 8) * f); g.stroke(); }
    g.beginPath(); g.moveTo(p.start.x, p.start.y); g.lineTo(p.peak.x, p.peak.y); g.lineTo(p.sustain.x, p.sustain.y); g.lineTo(p.hold.x, p.hold.y); g.lineTo(p.end.x, p.end.y);
    g.fillStyle = alpha(c, .13); g.fill(); g.strokeStyle = c; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
    g.strokeStyle = alpha(c, .3); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(p.hold.x, 4); g.lineTo(p.hold.x, h - 4); g.stroke(); g.setLineDash([]);
    for (const name of ['peak', 'sustain', 'end']) { const q = p[name]; g.beginPath(); g.arc(q.x, q.y, name === active || name === hover ? 5 : 3.5, 0, Math.PI * 2); g.fillStyle = name === active ? c : alpha(c, .85); g.fill(); }
    g.fillStyle = alpha(c, .65); g.font = '10px system-ui'; g.textBaseline = 'top';
    g.fillText(`A ${formatValue(env.attack, 's')}   D ${formatValue(env.decay, 's')}   S ${env.sustain.toFixed(2)}   R ${formatValue(env.release, 's')}`, 8, 5);
  };
  const point = e => { return canvasPoint(canvas, e); };
  const set = env => { for (const k of ['attack', 'decay', 'sustain', 'release']) setValue(node, names[k], Number(env[k].toFixed(k === 'sustain' ? 3 : 4))); last = null; draw(); };
  canvas.onpointerdown = e => { e.stopPropagation(); const [x, y] = point(e), [w, h] = size(), hit = nearestHandle(envelopePoints(read(), w, h), x, y, 14); if (!hit) return; active = hit; canvas.setPointerCapture(e.pointerId); canvas.focus(); draw(); };
  canvas.onpointermove = e => {
    const [x, y] = point(e), [w, h] = size();
    if (active) { set(envelopeDrag(active, x, y, read(), w, h)); return; }
    const hit = nearestHandle(envelopePoints(read(), w, h), x, y, 14); if (hit !== hover) { hover = hit; canvas.style.cursor = hit ? 'grab' : 'default'; draw(); }
  };
  canvas.onpointerup = canvas.onpointercancel = () => { active = null; draw(); };
  canvas.onpointerleave = () => { if (!active && hover) { hover = null; draw(); } };
  canvas.ondblclick = e => { e.stopPropagation(); set({attack: .02, decay: .15, sustain: .6, release: .3}); };
  const wrap = el('div', {}, canvas); wrap.addEventListener('pointerdown', stopDrag);
  observe(canvas, () => { last = null; draw(); }); queueMicrotask(draw);
  return component(wrap, draw);
}

// ---- Filter response ----
export function filterGraph(node, names = {cutoff: 'cutoff', resonance: 'resonance', mode: 'filter_mode'}, {height = 92, fixedMode = null} = {}) {
  const canvas = el('canvas', {className: 'gap-plot', tabIndex: 0, title: 'Filter · drag the point: left/right = cutoff, up/down = resonance · double-click resets'});
  const read = () => ({cutoff: Number(getValue(node, names.cutoff, 2200)), q: Number(getValue(node, names.resonance, .7)), mode: fixedMode ?? getValue(node, names.mode, 'lowpass')});
  const Q = {min: .1, max: 12}, qNorm = q => toNorm(q, Q.min, Q.max, 'log'), qFrom = n => fromNorm(n, Q.min, Q.max, 'log');
  let last, dragging = false;
  const xOf = (f, w) => 4 + toNorm(f, 20, 20000, 'log') * (w - 8);
  const draw = () => {
    const s = read(), w = Math.max(120, canvasWidth(canvas, 200)), key = JSON.stringify([s, w, dragging]); if (key === last) return; last = key;
    const g = hiDPI(canvas, w, height), c = color(canvas), curve = filterCurve(s.mode, s.cutoff, s.q, Math.round(w / 3));
    g.strokeStyle = alpha(c, .12); g.lineWidth = 1; g.fillStyle = alpha(c, .4); g.font = '9px system-ui'; g.textBaseline = 'bottom';
    for (const f of [100, 1000, 10000]) { const x = xOf(f, w); g.beginPath(); g.moveTo(x, 2); g.lineTo(x, height - 12); g.stroke(); g.fillText(f >= 1000 ? `${f / 1000}k` : String(f), x + 2, height - 1); }
    const y0 = dbToY(0, height - 12); g.beginPath(); g.moveTo(4, y0); g.lineTo(w - 4, y0); g.stroke();
    g.beginPath(); curve.forEach((p, i) => { const x = 4 + p.x * (w - 8), y = dbToY(p.db, height - 12); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = c; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke(); g.lineTo(w - 4, height - 12); g.lineTo(4, height - 12); g.fillStyle = alpha(c, .12); g.fill();
    const hx = xOf(s.cutoff, w), hy = dbToY(20 * Math.log10(Math.max(1e-6, Math.max(curveAt(curve, toNorm(s.cutoff, 20, 20000, 'log'))))), height - 12);
    g.beginPath(); g.arc(hx, hy, dragging ? 5 : 4, 0, Math.PI * 2); g.fillStyle = c; g.fill();
    g.fillStyle = alpha(c, .65); g.font = '10px system-ui'; g.textBaseline = 'top'; g.fillText(`${formatValue(s.cutoff, 'hz')} Hz   Q ${s.q.toFixed(2)}`, 8, 4);
  };
  const curveAt = (curve, x) => Math.pow(10, (curve.reduce((best, p) => Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best, curve[0]).db) / 20);
  const apply = e => {
    const [x, y] = canvasPoint(canvas, e), w = Math.max(120, canvasWidth(canvas, 200)), nx = (x - 4) / (w - 8), ny = 1 - (y - 2) / (height - 14);
    setValue(node, names.cutoff, Math.round(fromNorm(nx, 20, 20000, 'log')));
    setValue(node, names.resonance, Number(qFrom(ny).toFixed(2))); last = null; draw();
  };
  canvas.onpointerdown = e => { e.stopPropagation(); canvas.setPointerCapture(e.pointerId); canvas.focus(); dragging = true; apply(e); };
  canvas.onpointermove = e => { if (dragging) apply(e); };
  canvas.onpointerup = canvas.onpointercancel = () => { dragging = false; last = null; draw(); };
  canvas.ondblclick = e => { e.stopPropagation(); setValue(node, names.cutoff, 2200); setValue(node, names.resonance, .7); last = null; draw(); };
  const wrap = el('div', {}, canvas); wrap.addEventListener('pointerdown', stopDrag);
  observe(canvas, () => { last = null; draw(); }); queueMicrotask(draw);
  return component(wrap, draw);
}

/** Collect components into one refreshable panel. */
export function assemble(root, components) {
  return {el: root, components, refresh() { for (const c of components) c.refresh?.(); }};
}
export {el, hiDPI, observe, color, alpha, ensureStyle};
