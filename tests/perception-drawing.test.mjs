import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../docs/examples/perception-drawing.js',import.meta.url),'utf8');
function fixture(){
 const strokes=[],images=[];
 const record={age_ms:0,held:false,source:{id:'film',width:100,height:200,frame_timestamp_ms:1},features:{}};
 const context=vm.createContext({width:640,height:360,windowWidth:640,windowHeight:360,deltaTime:1000/60,inputImage:{width:100,height:200},__:{streams:{read:()=>record}},
 createCanvas(){},background(){},tint(){},noTint(){},image(...args){images.push(args)},noStroke(){},fill(){},rect(){},triangle(){},stroke(){},strokeWeight(){},line(...args){strokes.push(args)},circle(){},color:()=>({setAlpha(){}})});
 vm.runInContext(source,context);
 return {record,context,strokes,images,run:code=>vm.runInContext(code,context)};
}
test('four independent pens align with a portrait image and freeze on pause',()=>{
 const f=fixture();for(const name of ['left_wrist','right_wrist','left_ankle','right_ankle']){f.record.features['pose.'+name+'.x']=.5;f.record.features['pose.'+name+'.y']=.5;}
 f.run('draw()');assert.deepEqual(f.images[0].slice(1),[230,0,180,360]);
 assert.equal(f.run('pens.filter(p=>p.point).length'),4);
 const count=f.run('pens[0].trail.length');f.record.held=true;f.record.age_ms=90000;
 for(let i=0;i<60;i++)f.run('draw()');assert.equal(f.run('pens[0].trail.length'),count);assert.equal(f.run('pens[0].point.x'),.5);
});
test('missing points break trails, durations are bounded and zero disables trails',()=>{
 const f=fixture();Object.assign(f.record.features,{'pose.left_wrist.x':.2,'pose.left_wrist.y':.3});
 f.run('draw()');delete f.record.features['pose.left_wrist.x'];f.run('draw()');
 f.record.features['pose.left_wrist.x']=.21;f.run('draw()');assert.equal(f.run('pens[0].trail.at(-1).start'),true);
 for(let i=0;i<1500;i++){f.record.source.frame_timestamp_ms++;f.run('draw()');}
 assert.ok(f.run('pens[0].trail.length')<=181);
 f.run('trail_seconds=0; draw()');assert.equal(f.run('pens[0].trail.length'),0);
});
test('smoothing interpolates while direct mode reaches the target immediately',()=>{
 const f=fixture();Object.assign(f.record.features,{'pose.left_wrist.x':.2,'pose.left_wrist.y':.3});f.run('draw()');
 f.record.features['pose.left_wrist.x']=.3;f.run('smoothing=1;draw()');assert.ok(f.run('pens[0].point.x')>.2&&f.run('pens[0].point.x')<.3);
 f.run('smoothing=0;draw()');assert.equal(f.run('pens[0].point.x'),.3);
});
