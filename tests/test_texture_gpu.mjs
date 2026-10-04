import test from 'node:test';
import assert from 'node:assert/strict';
import {homography,parameters} from '../integrations/genereti_comfy_texture/web/texture-gpu.js';
test('corner pin maps all destination corners onto source square',()=>{
 const points=[[.1,.2],[.9,.1],[.8,.9],[.2,.8]],h=homography(points);
 points.forEach(([x,y],i)=>{const z=h[6]*x+h[7]*y+h[8],uv=[(h[0]*x+h[1]*y+h[2])/z,(h[3]*x+h[4]*y+h[5])/z];const expected=[[0,0],[1,0],[1,1],[0,1]][i];uv.forEach((v,j)=>assert.ok(Math.abs(v-expected[j])<1e-8));});
 assert.throws(()=>homography([[0,0],[0,0],[0,0],[0,0]]),/non-degenerate/);
});
test('shader parameters preserve operation and bounded blend semantics',()=>{
 const p=parameters('Transform',{translate_x:.2,translate_y:.3,scale:2,rotate:90,flip_x:true});
 assert.equal(p[0],4);assert.equal(p[8],-1);assert.ok(Math.abs(p[7]-Math.PI/2)<1e-6);
 assert.equal(parameters('Filter',{operation:'opacity',amount:4})[2],1);
 assert.throws(()=>parameters('Crop',{left:.5,right:.4,top:0,bottom:1}),/exceed/);
});

test('live texture handoff stays GPU-only until a legacy consumer subscribes',async()=>{
 const {default:vm}=await import('node:vm');const {readFileSync}=await import('node:fs');
 const bus=new EventTarget();let retains=0,presents=0;const drawable={width:64,height:32};
 const source={id:1,comfyClass:'GeneretiTextureFilter',_generetiLiveSource:{retain(){retains++;},release(){retains--;}},_generetiTexturePresent(){presents++;return drawable;}};
 const graph={links:{10:{origin_id:1,origin_slot:0}},getNodeById:()=>source};source.graph=graph;
 const viewer={id:2,comfyClass:'GeneretiLiveImagePreview',inputs:[{name:'image',link:10}],graph};
 const context=vm.createContext({window:bus,Event,CustomEvent:class extends Event{constructor(t,o){super(t);this.detail=o.detail;}},app:{graph,registerExtension(){}},setInterval:()=>1,clearInterval(){}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_p5/web/js/live-runtime.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ',''),context);
 let gpuFrame,legacyFrame;const stopGPU=context.subscribeLive(viewer,e=>gpuFrame=e,()=>{},{gpu:true});
 const texture={width:64,height:32};const fire=()=>bus.dispatchEvent(new context.CustomEvent('genereti-live-frame',{detail:{nodeId:1,outputSlot:0,texture}}));
 fire();assert.equal(gpuFrame.texture,texture);assert.equal(presents,0);
 const stopLegacy=context.subscribeLive(viewer,e=>legacyFrame=e);fire();assert.equal(legacyFrame.bitmap,drawable);assert.equal(presents,1);assert.equal(retains,2);
 stopGPU();stopLegacy();assert.equal(retains,0);
});

test('texture controls follow live Primitive sockets without evaluating Python nodes',async()=>{
 const {readTextureValues}=await import('../integrations/genereti_comfy_texture/web/texture-parameters.js');
 const nodes={1:{comfyClass:'PrimitiveFloat',widgets:[{name:'value',value:.25}]},2:{comfyClass:'PythonMath',widgets:[{name:'value',value:100}]}};
 const node={widgets:[{name:'opacity',value:1},{name:'amount',value:.5}],inputs:[{name:'opacity',type:'FLOAT',widget:{name:'opacity'}},{name:'amount',type:'FLOAT'}],getInputLink:i=>({origin_id:i+1}),graph:{getNodeById:id=>nodes[id]}};
 assert.deepEqual(readTextureValues(node),{opacity:.25,amount:.5});
});
