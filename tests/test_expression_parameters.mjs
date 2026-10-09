import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExpressionParameters,prepareExpression} from '../integrations/genereti_comfy_texture/web/expression-parameters.js';
import {parseExpression,evaluateExpression,expressionWGSL} from '../integrations/genereti_comfy_texture/web/expression.js';
import {codeParameters} from '../integrations/genereti_comfy_p5/web/js/livecode-parameters.js';
const source='// @param speed = 1 (0..4, step:0.01)\nfloat amplitude = .5; /* 0..1 */\namplitude*sin(t*tau*speed)';
test('numeric declarations evaluate with bounded overrides and comments',()=>{
 assert.equal(parseExpressionParameters(source).length,2);
 const tree=parseExpression(prepareExpression(source,{speed:2,amplitude:.75}));
 assert.ok(Math.abs(evaluateExpression(tree,{t:.125})-.75)<1e-10);
 assert.equal(prepareExpression('// @param count = 4 (int 1..8)\ncount',{count:99}),'(8)');
 assert.throws(()=>parseExpression('// @param b = 0 (0..4)\nb'),/Reserved/);
 assert.throws(()=>parseExpression('// @param speed = 1 (0..4)\n// @param speed = 2 (0..4)\nspeed'),/Duplicate/);
 assert.throws(()=>parseExpression('float a1 = 1;\na1'),/Unknown|Unexpected/);
});
test('GPU expressions bind numeric parameters as uniforms instead of shader literals',()=>{
 const shader=expressionWGSL(parseExpression(source,undefined,true),{speed:'p.v[5].x',amplitude:'p.v[5].y'});
 assert.match(shader,/p.v\[5\].x/);assert.match(shader,/p.v\[5\].y/);
});
test('expression control ids survive reorder and serialize independently of editor widget order',()=>{
 const raf=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>{};
 try{
 const node={properties:{},inputs:[],widgets:[{name:'expression'}],addInput(name,type,options){this.inputs.push({name,type,...options});},removeInput(i){this.inputs.splice(i,1);},addWidget(type,name,value,callback,options){const widget={type,name,value,callback,options};this.widgets.push(widget);return widget;}};
 const params=codeParameters(node,()=>{},{parse:parseExpressionParameters,editorName:'expression',property:'generetiExpressionParameters'});params.update(source);
 const speed=node.inputs.find(i=>i.label==='speed');params.update('float amplitude = .5; /* 0..1 */\n// @param speed = 1 (0..4)\namplitude*speed');
 assert.equal(node.inputs.find(i=>i.label==='speed'),speed);assert.equal(node.properties.generetiExpressionParameters.slots.speed,0);
 assert.ok(node.widgets.findIndex(w=>w.label==='speed')<node.widgets.findIndex(w=>w.name==='expression'));
 }finally{globalThis.requestAnimationFrame=raf;}
});
