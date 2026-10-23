import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Alt+O is a state: parking the view while the live surface sits in a window must keep it.
function fixture(initial) {
  const opened = [], changes = [], node = {properties: {genereti_output_only: initial}, graph: {change() {}}, widgets: []};
  const host = {style: {}, offsetWidth: 100, classList: {add() {}, remove() {}}, getBoundingClientRect: () => ({width: 100, height: 100, left: 0, top: 0})};
  const surface = name => ({name, classList: {add() {}, remove() {}}, parentElement: null, matches: () => false, closest: () => host, getBoundingClientRect: () => ({width: 50, height: 50, left: 0, top: 0})});
  const context = vm.createContext({
    document: {getElementById: () => ({}), createElement: () => ({}), head: {append() {}}}, requestAnimationFrame: fn => fn(),
    previewFirst() {}, registerPreviewShortcuts: () => () => {},
    overlayShell: (target, layout, onClose) => { opened.push(target.name); return {element: {matches: () => false}, close: () => onClose(), toggleClickThrough() {}}; },
  });
  vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/node-output-view.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/export function/g, 'function'), context);
  const home = surface('node'), mirror = surface('mirror');
  const view = context.nodeOutputView(node, home, {onChange: open => changes.push(open)});
  return {view, node, opened, changes, home, mirror};
}

test('parking keeps the remembered state and follows the node mirror, then returns', () => {
  const f = fixture(true);
  assert.deepEqual(f.opened, ['node']);                                   // restored from the workflow
  f.view.park(f.mirror);
  assert.equal(f.node.properties.genereti_output_only, true);              // not cleared by the surface leaving
  assert.deepEqual(f.opened, ['node', 'mirror']);                         // the view now shows the mirror
  assert.equal(f.view.opened, true);
  f.view.unpark();
  assert.equal(f.node.properties.genereti_output_only, true);
  assert.deepEqual(f.opened, ['node', 'mirror', 'node']);
  assert.equal(f.changes.includes(false), false);                          // the button never saw a close
});

test('without a mirror the view waits; toggling while parked only flips the state, applied on return', () => {
  const f = fixture(true);
  f.view.park(null);
  assert.equal(f.view.opened, false);
  assert.equal(f.node.properties.genereti_output_only, true);
  f.view.toggle();                                                         // Alt+O while the editor is in a window
  assert.equal(f.node.properties.genereti_output_only, false);
  assert.deepEqual(f.opened, ['node']);                                   // nothing was shown
  f.view.unpark();
  assert.equal(f.view.opened, false);                                      // returns in the state the user left it
  f.view.toggle();
  assert.equal(f.view.opened, true);
  assert.equal(f.node.properties.genereti_output_only, true);
});

test('an explicit close still clears the state, and parking a closed view does nothing visible', () => {
  const f = fixture(false);
  assert.deepEqual(f.opened, []);
  f.view.park(f.mirror);f.view.unpark();
  assert.deepEqual(f.opened, []);
  f.view.toggle();assert.equal(f.view.opened, true);
  f.view.close();assert.equal(f.node.properties.genereti_output_only, false);
});
