import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {parseParameters} from '../integrations/genereti_comfy_p5/web/js/code-parameters.js';
const source=fs.readFileSync(new URL('../docs/examples/movement-painting.js',import.meta.url),'utf8');
function sketch(){let marks=0,clears=0;const f={};for(const name of ['wristL','wristR','ankleL','ankleR','torso','faceCenter'])Object.assign(f,{[name+'.valid']:1,[name+'.x']:.5,[name+'.y']:.5});
 const record={held:false,source:{id:1,revision:0,width:640,height:480,frame_timestamp_ms:0},features:f};
 const graphics=new Proxy({clear(){clears++},drawingContext:{save(){},restore(){},fillRect(){}},vertex(){marks++},line(){marks++},circle(){marks++},ellipse(){marks++},bezier(){marks++}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const events={};const context=vm.createContext({windowWidth:640,windowHeight:480,width:640,height:480,deltaTime:16,frameCount:1,HSB:1,CLOSE:1,TWO_PI:Math.PI*2,inputImage:null,__:{streams:{read:()=>record},events:{on:(n,fn)=>events[n]=fn},regions:{read:()=>[.25,.25,.5,.5]}},createGraphics:()=>graphics,createCanvas(){},colorMode(){},randomSeed(){},random:(a,b)=>b===undefined?a/2:(a+b)/2,image(){},tint(){},noTint(){},stroke(){},strokeWeight(){},fill(){},circle(){},noStroke(){},noFill(){},textSize(){},text(){},rect(){}});
 vm.runInContext(source,context);vm.runInContext('setup()',context);marks=0;
 return {record,events,context,run:code=>vm.runInContext(code,context),marks:()=>marks,clears:()=>clears};
}
test('lesson exposes stable paint parameters and pauses ink without losing the composition',()=>{
 assert.deepEqual(parseParameters(source).map(x=>x.name),['trail_seconds','smoothing','brush_size','energy_gain','pigment','motif_density','palette_shift','source_opacity','accumulate','show_landmarks']);
 const s=sketch();s.run('draw()');s.record.features['wristL.x']=.55;s.record.source.frame_timestamp_ms=20;s.run('draw()');assert.ok(s.marks()>0);const marks=s.marks();s.record.held=true;s.run('draw()');assert.equal(s.marks(),marks);
});
test('missing joints break ribbons and contact events add bounded accents',()=>{
 const s=sketch();s.run('draw()');delete s.record.features['wristL.x'];s.run('draw()');assert.equal(s.run('pens[0].point'),null);
 s.events['pinchR.click']({phase:'pulse'});s.run('draw()');assert.equal(s.run('pulseQueue.length'),0);assert.ok(s.marks()>0);for(let i=0;i<100;i++)s.events['pinchR.click']({phase:'pulse'});assert.equal(s.run('pulseQueue.length'),32);
});
