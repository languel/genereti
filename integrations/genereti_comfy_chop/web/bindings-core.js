// Pure input-binding logic: no DOM, no Web MIDI. See bindings.js for the runtime.
const MODIFIER_CODES = new Set(['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock', 'Fn']);
const NAMED = {Space: 'space', Enter: 'enter', NumpadEnter: 'enter', Escape: 'esc', Tab: 'tab', Backspace: 'backspace', Delete: 'delete',
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Home: 'home', End: 'end', PageUp: 'pageup', PageDown: 'pagedown',
  Period: '.', Comma: ',', Slash: '/', Backslash: '\\', Semicolon: ';', Quote: "'", Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']'};
// Combos the browser or OS keeps for itself; a page never sees them reliably.
const RESERVED = new Set(['ctrl+w', 'ctrl+t', 'ctrl+n', 'ctrl+shift+n', 'ctrl+shift+t', 'ctrl+tab', 'ctrl+shift+tab', 'meta+w', 'meta+t', 'meta+n', 'meta+q', 'meta+shift+n', 'meta+shift+t', 'meta+h', 'meta+m', 'alt+f4', 'ctrl+alt+delete', 'meta+space', 'ctrl+space']);

export const isModifierCode = code => MODIFIER_CODES.has(code);

/** Physical key name from KeyboardEvent.code, so Option/Alt does not change the name on macOS. */
export function keyName(code = '') {
  if (NAMED[code]) return NAMED[code];
  let m = /^Key([A-Z])$/.exec(code); if (m) return m[1].toLowerCase();
  m = /^Digit(\d)$/.exec(code); if (m) return m[1];
  m = /^Numpad(\d)$/.exec(code); if (m) return 'num' + m[1];
  m = /^F(\d{1,2})$/.exec(code); if (m) return 'f' + m[1];
  return '';
}

/** `ctrl+alt+space`: modifiers in a fixed order, then the key. '' for a bare modifier or unknown key. */
export function comboFromEvent(e) {
  if (!e || isModifierCode(e.code)) return '';
  const key = keyName(e.code); if (!key) return '';
  const parts = [];
  if (e.ctrlKey) parts.push('ctrl'); if (e.altKey) parts.push('alt'); if (e.shiftKey) parts.push('shift'); if (e.metaKey) parts.push('meta');
  return [...parts, key].join('+');
}

export function normalizeCombo(text = '') {
  const parts = String(text).toLowerCase().split('+').map(s => s.trim()).filter(Boolean);
  const key = parts.filter(p => !['ctrl', 'control', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'].includes(p)).pop() ?? '';
  if (!key) return '';
  const has = (...names) => parts.some(p => names.includes(p));
  return [has('ctrl', 'control') && 'ctrl', has('alt', 'option') && 'alt', has('shift') && 'shift', has('meta', 'cmd', 'command') && 'meta', key].filter(Boolean).join('+');
}
export const isReserved = combo => RESERVED.has(normalizeCombo(combo));
export const comboLabel = combo => String(combo).split('+').map(p => ({ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘', space: 'Space', esc: 'Esc'}[p] ?? (p.length === 1 ? p.toUpperCase() : p))).join(' ');

/** A MIDI message as a source descriptor; null for messages we do not bind. */
export function midiSource(data) {
  const [status, a = 0, b = 0] = data ?? []; const type = status & 0xf0, ch = (status & 15) + 1;
  if (type === 0x90 && b > 0) return {type: 'midi', kind: 'note', channel: ch, number: a, value: b / 127, down: true};
  if (type === 0x80 || type === 0x90) return {type: 'midi', kind: 'note', channel: ch, number: a, value: 0, down: false};
  if (type === 0xb0) return {type: 'midi', kind: 'cc', channel: ch, number: a, value: b / 127};
  if (type === 0xe0) return {type: 'midi', kind: 'pitch', channel: ch, number: 0, value: (a + b * 128) / 16383};
  return null;
}
export const midiName = s => s.kind === 'pitch' ? `ch${s.channel}.pitch` : `ch${s.channel}.${s.kind}${s.number}`;
export const sourceLabel = s => s.type === 'key' ? comboLabel(s.combo) : s.type === 'midi' ? `MIDI ${midiName(s)}` : String(s.type);
export const sourceKey = s => s.type === 'key' ? `key:${s.combo}` : `midi:${midiName(s)}`;

/**
 * A binding is {id, scope, source:{type,combo|kind,channel,number}, target:{node,action}, mode, min, max}.
 * Action types: trigger (press runs it), bool (toggle / momentary / on / off), range (a value from min to max).
 */
export const MODES = {trigger: ['trigger'], bool: ['toggle', 'momentary', 'on', 'off'], range: ['range']};
export const defaultMode = type => MODES[type]?.[0] ?? 'trigger';

export function sourceMatches(binding, s) {
  const b = binding.source;
  if (b.type !== s.type) return false;
  if (s.type === 'key') return b.combo === s.combo;
  return b.kind === s.kind && b.channel === s.channel && (s.kind === 'pitch' || b.number === s.number);
}

/**
 * What to do for one input event against one binding.
 * input: {down:boolean, value:0..1}; `current` is the action's boolean state, `held` whether a CC/pitch
 * source was already above half (so a controller sitting at 127 does not retrigger).
 * Returns {call:[...args]|null, held}; call null means do nothing.
 */
export function resolve(binding, actionType, input, current = false, held = false) {
  const mode = MODES[actionType]?.includes(binding.mode) ? binding.mode : defaultMode(actionType);
  const lo = Number(binding.min ?? 0), hi = Number(binding.max ?? 1);
  if (binding.source.kind === 'cc' || binding.source.kind === 'pitch') {
    const on = input.value >= .5, edge = on && !held;
    if (actionType === 'range') return {held: on, call: [lo + (hi - lo) * input.value]};
    if (actionType === 'trigger') return {held: on, call: edge ? [] : null};
    if (mode === 'toggle') return {held: on, call: edge ? [!current] : null};
    if (mode === 'on') return {held: on, call: edge ? [true] : null};
    if (mode === 'off') return {held: on, call: edge ? [false] : null};
    return {held: on, call: [on]};
  }
  const down = Boolean(input.down);
  if (actionType === 'range') return {held: down, call: [down ? hi : lo]}; // hold a key or note for max
  if (actionType === 'trigger') return {held: down, call: down ? [] : null};
  if (mode === 'momentary') return {held: down, call: [down]};
  if (mode === 'on') return {held: down, call: down ? [true] : null};
  if (mode === 'off') return {held: down, call: down ? [false] : null};
  return {held: down, call: down ? [!current] : null};
}

export function sanitize(list) {
  const ok = [];
  for (const b of Array.isArray(list) ? list : []) {
    const s = b?.source, t = b?.target; if (!s || !t || typeof t.action !== 'string') continue;
    if (s.type === 'key') { const combo = normalizeCombo(s.combo); if (!combo) continue; s.combo = combo; }
    else if (s.type === 'midi') { if (!['note', 'cc', 'pitch'].includes(s.kind) || !(s.channel >= 1 && s.channel <= 16)) continue; }
    else continue;
    ok.push({id: String(b.id ?? `${Date.now().toString(36)}${ok.length}`), scope: b.scope === 'global' ? 'global' : 'workflow', source: {...s}, target: {node: t.node ?? null, action: t.action}, mode: b.mode, min: b.min, max: b.max});
  }
  return ok;
}

/** Transport controls seeded into the global map once; the user's edits win afterwards. */
export const DEFAULT_GLOBAL = [
  {id: 'g-audio-toggle', scope: 'global', source: {type: 'key', combo: 'ctrl+alt+space'}, target: {node: null, action: 'audio.toggle'}},
  {id: 'g-audio-panic', scope: 'global', source: {type: 'key', combo: 'ctrl+alt+.'}, target: {node: null, action: 'audio.panic'}}
];
