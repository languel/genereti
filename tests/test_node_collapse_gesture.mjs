import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('Cmd-Shift-click toggles only the clicked node and consumes its click', () => {
  const handlers = {}, calls = [];
  const target = {addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener(type) { delete handlers[type]; }};
  const node = {flags: {collapsed: false}, collapse() { this.flags.collapsed = !this.flags.collapsed; }};
  const canvas = {canvas: {}, graph: {getNodeById: id => id === '4' ? node : null}, emitBeforeChange() { calls.push('before'); }, emitAfterChange() { calls.push('after'); }, setDirty() {}};
  let extension;
  const context = vm.createContext({app: {canvas, registerExtension: value => { extension = value; }}, window: target, performance: {now: () => 1}});
  vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_agent/web/js/node-collapse-gesture.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace('export function ', 'function '), context);
  extension.setup();
  const event = (extra = {}) => ({button: 0, metaKey: true, shiftKey: true, pointerId: 1, target: {closest: () => ({dataset: {nodeId: '4'}})}, preventDefault() { calls.push('prevent'); }, stopImmediatePropagation() { calls.push('stop'); }, ...extra});
  handlers.pointerdown(event());
  assert.equal(node.flags.collapsed, true);
  assert.deepEqual(calls.slice(0, 4), ['prevent', 'stop', 'before', 'after']);
  handlers.click(event({type: 'click'}));
  handlers.pointerdown(event());
  assert.equal(node.flags.collapsed, false);
  handlers.click(event({type: 'click'}));
  handlers.pointerdown(event({metaKey: false}));
  assert.equal(node.flags.collapsed, false);
});
