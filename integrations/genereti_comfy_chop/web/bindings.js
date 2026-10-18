// Input hub and bindings: keyboard and Web MIDI → actions that nodes register (play, mute, level…).
// Workflow bindings are saved in the workflow (graph.extra.genereti_bindings); the global map holds
// common transport controls in this browser. Nothing listens to MIDI until the user connects it.
import {app} from '../../scripts/app.js';
import {comboFromEvent, isReserved, midiSource, midiName, sourceKey, sourceLabel, sourceMatches, resolve, sanitize, defaultMode, MODES, DEFAULT_GLOBAL, isModifierCode} from './bindings-core.js';

const GLOBAL_KEY = 'genereti.bindings.global.v1', EXTRA_KEY = 'genereti_bindings';
const registry = new Map();            // node object | 'global' → {node, label, actions: Map(action → def)}; ids resolve at lookup (nodes get ids after creation)
const ownerOf = id => id == null ? registry.get('global') : [...registry.values()].find(o => o.node && String(o.node.id) === String(id));
const held = new Map();                // binding id → bool (CC edge detection / momentary state)
const keysDown = new Map();            // KeyboardEvent.code → combo, so release matches the press
const listeners = new Set();
let workflow = [], globalMap = [], learning = null, midi = {access: null, state: 'off', error: ''}, panel;

const read = () => { try { const o = JSON.parse(localStorage.getItem(GLOBAL_KEY) ?? 'null'); return o?.list ? o : null; } catch { return null; } };
function loadGlobal() {
  const saved = read();
  globalMap = sanitize(saved ? saved.list : DEFAULT_GLOBAL).map(b => ({...b, scope: 'global'}));
  if (!saved) saveGlobal();
}
function saveGlobal() { try { localStorage.setItem(GLOBAL_KEY, JSON.stringify({version: 1, list: globalMap})); } catch { /* storage may be blocked */ } }
function loadWorkflow() { workflow = sanitize(app.graph?.extra?.[EXTRA_KEY]).map(b => ({...b, scope: 'workflow'})); }
function saveWorkflow() {
  if (!app.graph) return;
  app.graph.extra ??= {};
  if (workflow.length) app.graph.extra[EXTRA_KEY] = workflow.map(({scope, ...b}) => b); else delete app.graph.extra[EXTRA_KEY];
  try { app.extensionManager?.workflow?.activeWorkflow?.changeTracker?.checkState?.(); } catch { /* optional */ }
}
const changed = () => { for (const fn of listeners) try { fn(); } catch (e) { console.error(e); } };
const all = () => [...workflow, ...globalMap];

function actionFor(binding) {
  const owner = ownerOf(binding.target.node);
  const def = owner?.actions.get(binding.target.action);
  return def ? {def, owner} : null;
}
export const targetLabel = t => { const owner = ownerOf(t.node), def = owner?.actions.get(t.action); return `${owner?.label ?? (t.node == null ? 'Global' : `Node ${t.node}`)} · ${def?.label ?? t.action}${def ? '' : ' (missing)'}`; };

function emitEvent(source, down, value) {
  const name = source.type === 'key' ? `key:${source.combo}` : `midi:${midiName(source)}`;
  window.dispatchEvent(new CustomEvent('genereti-perception-event', {detail: {name, phase: down ? 'entry' : 'exit', value, source: 'input'}}));
}

function dispatch(source) {
  emitEvent(source, source.down ?? source.value > 0, source.value ?? (source.down ? 1 : 0));
  if (learning) return captureLearn(source);
  let handled = false;
  for (const b of all()) {
    if (!sourceMatches(b, source)) continue;
    const found = actionFor(b); if (!found) continue;
    const {def} = found, current = def.get ? Boolean(def.get()) : false;
    const r = resolve(b, def.type, {down: source.down, value: source.value ?? (source.down ? 1 : 0)}, current, held.get(b.id) ?? false);
    held.set(b.id, r.held); handled = true;
    if (r.call) try { Promise.resolve(def.run(...r.call)).catch(e => console.error(e)); } catch (e) { console.error(e); }
  }
  return handled;
}

const editable = e => e.composedPath?.().some(t => t?.isContentEditable || t?.matches?.('input,textarea,select,[contenteditable],.cm-editor,.monaco-editor'));
function onKeyDown(e) {
  if (e.isComposing || isModifierCode(e.code)) return;
  const combo = comboFromEvent(e); if (!combo) return;
  if (learning) {
    e.preventDefault(); e.stopPropagation();
    if (combo === 'esc') return cancelLearn();
    if (isReserved(combo)) return note(`${combo} is reserved by the browser or system · pick another`);
    if (e.repeat) return;
    return void dispatch({type: 'key', combo, down: true});
  }
  if (e.repeat) { if (keysDown.has(e.code)) { e.preventDefault(); } return; }
  // A bare key in a text field is typing; chords with ctrl/alt/meta still bind.
  if (editable(e) && !(e.ctrlKey || e.altKey || e.metaKey)) return;
  const source = {type: 'key', combo, down: true};
  if (!all().some(b => sourceMatches(b, source) && actionFor(b))) return;
  keysDown.set(e.code, combo);
  e.preventDefault(); e.stopPropagation();
  dispatch(source);
}
function onKeyUp(e) {
  const combo = keysDown.get(e.code); if (!combo) return;
  keysDown.delete(e.code); dispatch({type: 'key', combo, down: false});
}
window.addEventListener('keydown', onKeyDown, true);
window.addEventListener('keyup', onKeyUp, true);
window.addEventListener('blur', () => { for (const combo of keysDown.values()) dispatch({type: 'key', combo, down: false}); keysDown.clear(); });

// ---- Web MIDI (user-started) ----
function attachMidi() {
  if (!midi.access) return;
  for (const input of midi.access.inputs.values()) input.onmidimessage = e => {
    const s = midiSource(e.data); if (!s) return;
    if (s.kind === 'pitch' && !learning && !all().some(b => sourceMatches(b, s))) return;
    dispatch(s);
  };
}
async function connectMidi() {
  if (midi.access) return midi.access;
  if (!navigator.requestMIDIAccess) { midi = {access: null, state: 'error', error: 'Web MIDI is unavailable in this host'}; changed(); return null; }
  try {
    midi = {access: await navigator.requestMIDIAccess({sysex: false}), state: 'on', error: ''};
    midi.access.onstatechange = () => { attachMidi(); changed(); };
    attachMidi();
  } catch (e) { midi = {access: null, state: 'error', error: e.message}; }
  changed(); return midi.access;
}
function disconnectMidi() {
  if (midi.access) { for (const input of midi.access.inputs.values()) input.onmidimessage = null; midi.access.onstatechange = null; }
  midi = {access: null, state: 'off', error: ''}; changed();
}
const midiDevices = () => midi.access ? [...midi.access.inputs.values()].map(i => i.name) : [];

// ---- learn ----
function note(text) { if (learning) learning.status = text; changed(); }
function cancelLearn() { learning = null; changed(); }
function captureLearn(source) {
  const {target, scope, mode, resolveFn} = learning;
  if (source.type === 'midi' && source.kind === 'note' && !source.down) return;   // wait for the press
  const owner = ownerOf(target.node), def = owner?.actions.get(target.action);
  const type = def?.type ?? 'trigger';
  const id = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const src = source.type === 'key' ? {type: 'key', combo: source.combo} : {type: 'midi', kind: source.kind, channel: source.channel, number: source.number};
  // CC / pitch drive ranges and toggles; notes and keys trigger.
  const binding = {id, scope, source: src, target: {node: target.node == null ? null : String(target.node), action: target.action}, mode: mode ?? defaultMode(type), min: def?.min, max: def?.max};
  const list = scope === 'global' ? globalMap : workflow;
  const dupe = list.find(b => sourceKey(b.source) === sourceKey(src) && String(b.target.node) === String(binding.target.node) && b.target.action === binding.target.action);
  if (dupe) Object.assign(dupe, {mode: binding.mode}); else list.push(binding);
  learning = null; persist(scope); resolveFn?.(binding); changed();
}
const persist = scope => scope === 'global' ? saveGlobal() : saveWorkflow();

function learn(target, {scope = 'workflow', mode} = {}) {
  if (learning) cancelLearn();
  connectMidi();                       // opt-in by acting: starting a learn is the user gesture
  return new Promise(resolveFn => { learning = {target, scope, mode, resolveFn, status: 'Press a key or move a MIDI control · Esc cancels'}; changed(); });
}
function remove(id) {
  for (const [list, scope] of [[workflow, 'workflow'], [globalMap, 'global']]) { const i = list.findIndex(b => b.id === id); if (i >= 0) { list.splice(i, 1); held.delete(id); persist(scope); } }
  changed();
}
function update(id, patch) {
  const b = all().find(x => x.id === id); if (!b) return;
  if (patch.scope && patch.scope !== b.scope) { remove(id); (patch.scope === 'global' ? globalMap : workflow).push({...b, scope: patch.scope}); persist(patch.scope); }
  else { Object.assign(b, patch); persist(b.scope); }
  changed();
}

/** register('global', label, actions) or register(node, label, actions); returns an unregister function. */
function register(owner, label, actions) {
  const key = owner === 'global' ? 'global' : owner;
  registry.set(key, {node: owner === 'global' ? null : owner, label, actions: new Map(Object.entries(actions))}); changed();
  return () => { registry.delete(key); changed(); };
}

// ---- panel ----
const css = 'position:fixed;right:16px;bottom:16px;z-index:10050;width:min(420px,92vw);max-height:60vh;overflow:auto;background:var(--comfy-menu-bg,#222);color:var(--input-text,#ddd);border:1px solid var(--border-color,#444);border-radius:8px;box-shadow:0 8px 35px #0006;font:12px/1.4 sans-serif;padding:6px 8px';
const bare = 'border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:3px 5px;border-radius:6px';
function el(tag, props = {}, ...kids) { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; }
function btn(text, title, onclick, pressed) { const b = el('button', {textContent: text, title, onclick}); b.setAttribute('aria-label', title); b.style.cssText = bare; if (pressed !== undefined) { b.setAttribute('aria-pressed', String(pressed)); if (pressed) b.style.background = 'color-mix(in srgb, currentColor 18%, transparent)'; } return b; }

let addTarget = '';
function render() {
  if (!panel) return;
  panel.replaceChildren();
  const head = el('div'); head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:6px';
  const midiButton = btn('♪', midi.state === 'on' ? `MIDI connected${midiDevices().length ? ': ' + midiDevices().join(', ') : ' · no devices'} · click to disconnect` : (midi.error || 'Connect Web MIDI'), () => midi.state === 'on' ? disconnectMidi() : connectMidi(), midi.state === 'on');
  head.append(el('strong', {textContent: '⌨ Bindings'}), el('span', {style: 'flex:1'}), midiButton, btn('×', 'Close', () => closePanel()));
  panel.append(head);
  if (learning) panel.append(el('div', {textContent: learning.status, style: 'padding:6px 0;color:var(--p-primary-color,#7aa2f7)'}), btn('Cancel learn', 'Cancel', cancelLearn));
  const options = [...registry.values()].flatMap(o => [...o.actions].map(([action, d]) => ({value: JSON.stringify({node: o.node ? String(o.node.id) : null, action}), text: `${o.label}${o.node ? ' #' + o.node.id : ''} · ${d.label}`})));
  const select = el('select'); select.style.cssText = bare + ';max-width:60%';
  select.append(el('option', {value: '', textContent: 'Add binding…'}), ...options.map(o => el('option', o)));
  select.value = options.some(o => o.value === addTarget) ? addTarget : '';
  select.onchange = () => { addTarget = select.value; render(); };
  const scope = el('select'); scope.style.cssText = bare; scope.title = 'Workflow bindings are saved with the workflow; global bindings stay in this browser';
  scope.append(el('option', {value: 'workflow', textContent: 'workflow'}), el('option', {value: 'global', textContent: 'global'}));
  scope.value = panel.dataset.scope || 'workflow'; scope.onchange = () => { panel.dataset.scope = scope.value; };
  const learnButton = btn('◉', 'Learn: press a key or move a MIDI control', () => addTarget && learn(JSON.parse(addTarget), {scope: scope.value}));
  learnButton.disabled = !addTarget;
  panel.append(el('div', {style: 'display:flex;gap:4px;align-items:center;padding:6px 0'}, select, scope, learnButton));
  const rows = all();
  if (!rows.length) panel.append(el('div', {textContent: 'No bindings yet. Add one above, or press ⌨ on a node.', style: 'opacity:.7;padding:4px 0'}));
  for (const b of rows) {
    const found = actionFor(b), type = found?.def.type, row = el('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 0;border-top:1px solid color-mix(in srgb, currentColor 12%, transparent)';
    const modes = MODES[type] ?? [];
    const mode = modes.length > 1 ? el('select', {title: 'Mode', onchange: e => update(b.id, {mode: e.target.value})}, ...modes.map(m => el('option', {value: m, textContent: m, selected: m === (b.mode ?? modes[0])}))) : null;
    if (mode) mode.style.cssText = bare;
    row.append(el('span', {textContent: b.scope === 'global' ? '◆' : '◇', title: b.scope === 'global' ? 'Global · this browser' : 'Workflow · saved with the workflow'}),
      el('code', {textContent: sourceLabel(b.source), style: 'min-width:92px'}), el('span', {textContent: targetLabel(b.target), style: `flex:1;${found ? '' : 'opacity:.5'}`}));
    if (mode) row.append(mode);
    row.append(btn(b.scope === 'global' ? '◇' : '◆', b.scope === 'global' ? 'Move to this workflow' : 'Make global', () => update(b.id, {scope: b.scope === 'global' ? 'workflow' : 'global'})), btn('✕', 'Remove binding', () => remove(b.id)));
    panel.append(row);
  }
}
function openPanel({node, action} = {}) {
  if (!panel) { panel = el('div'); panel.style.cssText = css; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Input bindings'); document.body.append(panel); listeners.add(render); }
  if (node != null) addTarget = JSON.stringify({node: String(node), action: action ?? [...(ownerOf(node)?.actions.keys() ?? [])][0]});
  panel.hidden = false; render();
}
function closePanel() { if (learning) cancelLearn(); if (panel) panel.hidden = true; }

const api = {register, learn, remove, update, openPanel, closePanel, connectMidi, disconnectMidi, list: () => all().map(b => ({...b})), dispatch, targetLabel, version: 1};
window.generetiBindings = api;
loadGlobal();
app.registerExtension({name: 'Genereti.Bindings', setup() { loadWorkflow(); changed(); }, afterConfigureGraph() { loadWorkflow(); held.clear(); if (workflow.concat(globalMap).some(b => b.source.type === 'midi') && !midi.access) connectMidi(); changed(); }});
export default api;
