import test from 'node:test';
import assert from 'node:assert/strict';
import {previewFirst} from '../integrations/genereti_comfy_p5/web/js/preview-order.js';
test('preview presentation preserves serialized values and survives an in-place widget setter',()=>{
 const param={name:'amount',value:3},code={name:'code',value:'sin(t)',element:{querySelector:()=>true}},preview={name:'preview'};
 const widgets=[param,code,preview],node={get widgets(){return widgets},set widgets(next){widgets.splice(0,widgets.length,...next)}};
 previewFirst(node,preview);
 assert.deepEqual(node.widgets,[preview,param,code]);
 const info={widgets_values:[undefined,3,'sin(t)']};node.onSerialize(info);
 assert.deepEqual(info.widgets_values,[3,'sin(t)',undefined]);
 assert.deepEqual(node.widgets,[preview,param,code]);
 node.onConfigure({widgets_values:[7,'cos(t)',undefined]});
 assert.equal(param.value,7);assert.equal(code.value,'cos(t)');
});
