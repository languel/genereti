import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrateOffsetControls} from '../integrations/genereti_comfy_p5/web/js/offset-control-migration.js';

test('old expression keeps code, dimensions, time, performance and connected offsets',()=>{
 const node={type:'GeneretiTextureExpression',widgets_values:['sin(t)',512,384,2,'{"beat":3}'],inputs:[{name:'offset_x',type:'FLOAT',link:12},{name:'offset_y',type:'FLOAT',link:null}]};
 migrateOffsetControls(node);
 assert.deepEqual(node.widgets_values,['sin(t)',512,384,2,'{"beat":3}',0,0,0,0]);
 assert.equal(node.inputs[0].link,12);
 assert.deepEqual(node.inputs[0].widget,{name:'offset_x'});
 migrateOffsetControls(node);
 assert.equal(node.widgets_values.length,9);
});
test('new offset values survive reload and unrelated nodes are untouched',()=>{
 const node={type:'GeneretiTextureNoise',widgets_values:[...Array(14).fill(1),2,3,4,5]};
 const saved=structuredClone(node);migrateOffsetControls(node);assert.deepEqual(node,saved);
 const other={type:'GeneretiTextureTransform',widgets_values:[1,2,3]};
 assert.equal(migrateOffsetControls(other),false);
 assert.deepEqual(other.widgets_values,[1,2,3]);
});

test('old delivery modes and missing performance snapshots keep their positions',()=>{
 const node={type:'GeneretiTextureExpression',widgets_values:['x',320,240,7,'Comfy Queue']};
 migrateOffsetControls(node);
 assert.deepEqual(node.widgets_values,['x',320,240,7,'{}',0,0,0,0,'Comfy Queue']);
 migrateOffsetControls(node);
 assert.equal(node.widgets_values.length,10);
 const chop={type:'GeneretiChopNoise',widgets_values:[0,'randomize',1,0,1,1,60,0,'']};
 migrateOffsetControls(chop);
 assert.deepEqual(chop.widgets_values,[0,'randomize',1,0,1,1,60,0,0,0,0,0]);
});
