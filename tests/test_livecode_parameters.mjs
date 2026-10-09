import test from 'node:test';
import assert from 'node:assert/strict';
import {parseParameters,parameterValues,prepareParameterSource} from '../integrations/genereti_comfy_p5/web/js/code-parameters.js';
import {codeParameters,cleanNumericValue,parameterPrecision} from '../integrations/genereti_comfy_p5/web/js/livecode-parameters.js';

test('range comments, typed annotations and bounded values',()=>{
 const defs=parseParameters('float influence = 0; /* 0. .. 1. */\nint count = 8; /* 2..40 */\n// @param enabled = true\n// @param title = "Hello" (string)');
 assert.deepEqual(defs.map(p=>p.type),['float','int','boolean','string']);
 assert.deepEqual({...parameterValues(defs,{influence:2,count:3.7,enabled:false})},{influence:1,count:4,enabled:false,title:'Hello'});
 assert.equal(parseParameters('// @param __ = 2 (0..4)\n// @param duplicate = 1 (0..2)\n// @param duplicate = 2 (0..3)').length,1);
});
test('inline JavaScript becomes a live getter and GLSL becomes a uniform',()=>{
 const source='float influence = 0; /* 0..1 */\nvoid main(){}';
 assert.match(prepareParameterSource(source,'glsl'),/uniform float influence;/);
 assert.doesNotMatch(prepareParameterSource('let influence = 0; /* 0..1 */','p5'),/let influence/);
});
test('parameter sockets keep ids when reordered and accept connected primitives',()=>{
 const raf=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=()=>{};
 try{
  const node={properties:{},inputs:[],widgets:[{name:'code'}],addInput(name,type,options){this.inputs.push({name,type,...options});},removeInput(i){this.inputs.splice(i,1);},disconnectInput(){},addWidget(type,name,value,callback,options){const w={type,name,value,callback,options};this.widgets.push(w);return w;},getInputLink(i){return this.inputs[i].link?{origin_id:9}:null;},graph:{getNodeById(){return {comfyClass:'PrimitiveFloat',widgets:[{name:'value',value:.7}]};}}};
  const params=codeParameters(node,()=>{});params.update('let influence = .5; /* 0..1 */\nlet speed = 2; /* 0..10 */');
  const influence=node.inputs.find(i=>i.label==='influence');influence.link=1;
  influence.type='FLOAT,INT';node.disconnectInput=()=>{throw Error('Compatible Autogrow socket must retain its wire');};
  assert.deepEqual(influence.widget,{name:influence.name});
  assert.equal(node.widgets.find(w=>w.name===influence.name).label,'influence');
  params.update('let speed = 2; /* 0..10 */\nlet influence = .5; /* 0..1 */');
  assert.equal(node.inputs.find(i=>i.label==='influence'),influence);
  assert.equal(params.current().influence,.7);
  assert.equal(params.connected({value0:.8}).influence,.8);
  assert.equal(JSON.parse(params.serialize()).influence,.5);
 }finally{globalThis.requestAnimationFrame=raf;}
});

test('numeric edits remove binary noise and precision follows fractional steps',()=>{
 assert.equal(cleanNumericValue(.41000000000000014),.41);
 assert.equal(cleanNumericValue(.123456789012345),.123456789012345);
 assert.equal(parameterPrecision({type:'float',step:.025}),3);
 assert.equal(parameterPrecision({type:'float',step:1e-7}),7);
 assert.equal(parameterPrecision({type:'int',step:1}),0);
});
