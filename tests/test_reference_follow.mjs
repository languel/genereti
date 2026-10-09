import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedReferenceNode} from '../integrations/genereti_comfy_agent/web/js/reference-follow.js';
test('selection follows Nodes 2.0 items and classic canvas selections',()=>{
 const a={id:1},b={id:2},graph={getNodeById:id=>id===1?a:b};
 assert.equal(selectedReferenceNode({graph,canvas:{selectedItems:new Set([b]),selected_nodes:{1:a}}}),b);
 assert.equal(selectedReferenceNode({graph,canvas:{selected_nodes:{1:a}}}),a);
});
test('selection ignores groups, deleted nodes and stale nodes from another workflow',()=>{
 const node={id:1};const app={graph:{getNodeById:id=>id===1?node:undefined},canvas:{selectedItems:new Set([{id:1},{id:9},{}])}};
 assert.equal(selectedReferenceNode(app),undefined);
 app.canvas.selectedItems.add(node);assert.equal(selectedReferenceNode(app),node);
});
