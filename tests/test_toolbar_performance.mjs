import test from 'node:test';
import assert from 'node:assert/strict';
import {toolbarChoiceMutationRoots} from '../integrations/genereti_comfy_p5/web/js/choice-glyphs.js';
test('live text and canvas mutations do not rescan toolbar dropdowns',()=>{
 const text={nodeType:3};const canvas={nodeType:1,matches:()=>false,querySelector:()=>null};
 const readout={closest:()=>null};
 assert.equal(toolbarChoiceMutationRoots([{target:readout,addedNodes:[text,canvas]}]).size,0);
});
test('new toolbar subtrees and changed options refresh their own controls only',()=>{
 const chosen={};const select={matches:()=>true,querySelector:()=>chosen};
 const option={closest:s=>s==='select'?select:null};
 const subtree={nodeType:1,matches:()=>false,querySelector:()=>select};
 const roots=toolbarChoiceMutationRoots([{target:option,addedNodes:[]},{target:{},addedNodes:[subtree]}]);
 assert.deepEqual([...roots],[select,subtree]);
});
test('selectedcontent cloning does not create an observer decoration loop',()=>{
 const select={matches:()=>true,querySelector:()=>chosen};
 const chosen={closest:s=>s==='select'?select:chosen};
 assert.equal(toolbarChoiceMutationRoots([{target:chosen,addedNodes:[{nodeType:3}]}]).size,0);
});
