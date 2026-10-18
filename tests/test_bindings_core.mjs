import test from 'node:test';
import assert from 'node:assert/strict';
import {comboFromEvent, normalizeCombo, isReserved, keyName, midiSource, midiName, sourceMatches, resolve, sanitize, DEFAULT_GLOBAL} from '../integrations/genereti_comfy_chop/web/bindings-core.js';

const ev = (code, mods = {}) => ({code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods});

test('key combos use physical keys in a fixed modifier order', () => {
  assert.equal(comboFromEvent(ev('Space', {ctrlKey: true, altKey: true})), 'ctrl+alt+space');
  assert.equal(comboFromEvent(ev('KeyA', {altKey: true})), 'alt+a');          // Option does not turn A into å
  assert.equal(comboFromEvent(ev('Digit1', {metaKey: true, shiftKey: true})), 'shift+meta+1');
  assert.equal(comboFromEvent(ev('ControlLeft', {ctrlKey: true})), '');       // a bare modifier is not a binding
  assert.equal(comboFromEvent(ev('IntlRo')), '');
  assert.equal(keyName('F12'), 'f12');
  assert.equal(normalizeCombo('Option+Ctrl+Space'), 'ctrl+alt+space');
  assert.equal(normalizeCombo('ctrl+'), '');
});

test('browser-reserved chords are refused', () => {
  assert.ok(isReserved('ctrl+w')); assert.ok(isReserved('Cmd+Q')); assert.equal(isReserved('ctrl+alt+space'), false);
});

test('MIDI messages become sources; note-on with velocity 0 is a release', () => {
  assert.deepEqual(midiSource([0x90, 60, 127]), {type: 'midi', kind: 'note', channel: 1, number: 60, value: 1, down: true});
  assert.equal(midiSource([0x90, 60, 0]).down, false);
  assert.equal(midiSource([0x81, 60, 40]).down, false);
  const cc = midiSource([0xb2, 7, 64]); assert.equal(midiName(cc), 'ch3.cc7'); assert.ok(Math.abs(cc.value - 64 / 127) < 1e-9);
  assert.equal(midiSource([0xf8]), null);
  assert.equal(midiName(midiSource([0xe0, 0, 64])), 'ch1.pitch');
});

test('bindings match key combos and MIDI channel/number only', () => {
  const key = {source: {type: 'key', combo: 'ctrl+alt+space'}};
  assert.ok(sourceMatches(key, {type: 'key', combo: 'ctrl+alt+space'})); assert.equal(sourceMatches(key, {type: 'key', combo: 'alt+space'}), false);
  const cc = {source: {type: 'midi', kind: 'cc', channel: 1, number: 7}};
  assert.ok(sourceMatches(cc, {type: 'midi', kind: 'cc', channel: 1, number: 7})); assert.equal(sourceMatches(cc, {type: 'midi', kind: 'cc', channel: 2, number: 7}), false);
  assert.equal(sourceMatches(cc, {type: 'midi', kind: 'note', channel: 1, number: 7}), false);
  assert.ok(sourceMatches({source: {type: 'midi', kind: 'pitch', channel: 1, number: 0}}, {type: 'midi', kind: 'pitch', channel: 1, number: 0}));
});

test('trigger actions run on press only', () => {
  const b = {source: {type: 'key', combo: 'x'}};
  assert.deepEqual(resolve(b, 'trigger', {down: true}).call, []);
  assert.equal(resolve(b, 'trigger', {down: false}).call, null);
});

test('CC triggers fire once per upward crossing, not while the controller sits high', () => {
  const b = {source: {type: 'midi', kind: 'cc', channel: 1, number: 20}};
  let r = resolve(b, 'trigger', {value: 1}, false, false); assert.deepEqual(r.call, []); assert.equal(r.held, true);
  r = resolve(b, 'trigger', {value: 1}, false, r.held); assert.equal(r.call, null);
  r = resolve(b, 'trigger', {value: 0}, false, r.held); assert.equal(r.call, null); assert.equal(r.held, false);
});

test('bool actions: toggle, momentary, on, off', () => {
  const key = mode => ({source: {type: 'key', combo: 'm'}, mode});
  assert.deepEqual(resolve(key('toggle'), 'bool', {down: true}, false).call, [true]);
  assert.deepEqual(resolve(key('toggle'), 'bool', {down: true}, true).call, [false]);
  assert.equal(resolve(key('toggle'), 'bool', {down: false}, true).call, null);
  assert.deepEqual(resolve(key('momentary'), 'bool', {down: true}).call, [true]);
  assert.deepEqual(resolve(key('momentary'), 'bool', {down: false}).call, [false]);
  assert.deepEqual(resolve(key('on'), 'bool', {down: true}, true).call, [true]);
  assert.deepEqual(resolve(key('off'), 'bool', {down: true}, false).call, [false]);
  assert.deepEqual(resolve({source: {type: 'key', combo: 'm'}, mode: 'bogus'}, 'bool', {down: true}, false).call, [true]); // unknown mode → default
});

test('range actions scale a CC between min and max and hold a key at max', () => {
  const cc = {source: {type: 'midi', kind: 'cc', channel: 1, number: 7}, min: 0, max: 2};
  assert.equal(resolve(cc, 'range', {value: .5}).call[0], 1);
  assert.equal(resolve({...cc, min: 1, max: 0}, 'range', {value: 1}).call[0], 0);   // inverted range
  const key = {source: {type: 'key', combo: 'l'}, min: .2, max: .9};
  assert.deepEqual(resolve(key, 'range', {down: true}).call, [.9]); assert.deepEqual(resolve(key, 'range', {down: false}).call, [.2]);
});

test('toggle on a CC flips on rising edges and re-arms after release', () => {
  const b = {source: {type: 'midi', kind: 'cc', channel: 1, number: 64}, mode: 'toggle'};
  let r = resolve(b, 'bool', {value: 1}, false, false); assert.deepEqual(r.call, [true]);
  r = resolve(b, 'bool', {value: 1}, true, r.held); assert.equal(r.call, null);
  r = resolve(b, 'bool', {value: 0}, true, r.held); assert.equal(r.call, null);
  r = resolve(b, 'bool', {value: 1}, true, r.held); assert.deepEqual(r.call, [false]);
});

test('sanitize drops malformed bindings, normalizes combos and defaults the scope', () => {
  const out = sanitize([
    {id: 'a', source: {type: 'key', combo: 'Option+Ctrl+Space'}, target: {node: 3, action: 'toggle'}},
    {source: {type: 'key', combo: ''}, target: {action: 'x'}},
    {source: {type: 'midi', kind: 'sysex', channel: 1}, target: {action: 'x'}},
    {source: {type: 'midi', kind: 'cc', channel: 17, number: 1}, target: {action: 'x'}},
    {source: {type: 'midi', kind: 'cc', channel: 1, number: 1}, target: {}},
    null, 'junk'
  ]);
  assert.equal(out.length, 1); assert.equal(out[0].source.combo, 'ctrl+alt+space'); assert.equal(out[0].scope, 'workflow'); assert.equal(out[0].target.node, 3);
  assert.deepEqual(sanitize('nope'), []);
});

test('default global map carries the transport controls', () => {
  const list = sanitize(DEFAULT_GLOBAL);
  assert.deepEqual(list.map(b => [b.source.combo, b.target.action]), [['ctrl+alt+space', 'audio.toggle'], ['ctrl+alt+.', 'audio.panic']]);
  assert.ok(list.every(b => b.scope === 'workflow' || b.scope === 'global'));
});
