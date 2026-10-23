import test from 'node:test';import assert from 'node:assert/strict';
import {parseMeasures,evaluateMeasures,MeasuresEngine,segmentsCross} from '../integrations/genereti_comfy_perception/web/measures.js';
import {RegionRegistry,parseRegions} from '../integrations/genereti_comfy_perception/web/region-contract.js';
const plan=measures=>parseMeasures({version:1,locators:[],measures});
const frame=(time,points={},extra={})=>({source:{id:1,output_slot:0,revision:0,width:640,height:320,frame_timestamp_ms:time},features:Object.fromEntries(Object.entries(points).flatMap(([name,p])=>[[name+'.x',p[0]],[name+'.y',p[1]]])),...extra});
test('point, centroid, named locator and non-square distance share normalized geometry',()=>{
 const doc=parseMeasures({version:1,locators:[{name:'center',points:['a','b']}],measures:[{name:'a',type:'point',a:'a'},{name:'mid',type:'centroid',a:'$center'},{name:'span',type:'distance',a:'a',b:'b'}]});
 const f=evaluateMeasures(doc,frame(0,{a:[0,.2],b:[1,.4]}));assert.equal(f['mid.x'],.5);assert.ok(Math.abs(f['mid.y']-.3)<1e-9);assert.equal(f['span.distance'],Math.hypot(2,.2));
});
test('missing/low-confidence points are unavailable, not zero-valued measurements',()=>{
 const doc=plan([{name:'reach',type:'distance',a:'a',b:'b'}]);const r=frame(0,{a:[0,0],b:[.1,.1]});r.features['b.visibility']=.1;
 const f=evaluateMeasures(doc,r);assert.equal(f['reach.valid'],0);assert.ok(!Object.hasOwn(f,'reach.distance'));
});
test('inside/outside and finite segment crossing include boundaries',()=>{
 const doc=plan([{name:'zone',type:'inside',a:'a',region:'stage::center'},{name:'cross',type:'crossing',a:'a',b:'b',c:'c',d:'d'}]);
 const f=evaluateMeasures(doc,frame(0,{a:[.25,.25],b:[.75,.75],c:[.25,.75],d:[.75,.25]}),{regions:()=>[.25,.25,.5,.5]});assert.equal(f['zone.inside'],1);assert.equal(f['zone.outside'],0);assert.equal(f['cross.crossing'],1);assert.equal(segmentsCross({x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}),false);
});
test('iris estimates require iris landmarks and explicit calibration for look-at targets',()=>{
 const doc=plan([{name:'gaze',type:'gaze'},{name:'target',type:'gaze_target',gaze:'gaze',box:[0,0,1,1]}]);const f=evaluateMeasures(doc,frame(0,{'face.263':[.7,.4],'face.362':[.5,.4],'face.386':[.6,.35],'face.374':[.6,.45]}));assert.equal(f['gaze.valid'],0);assert.equal(f['target.needs_calibration'],1);assert.equal(f['target.valid'],0);
 const r=frame(0,{'face.263':[.7,.4],'face.362':[.5,.4],'face.386':[.6,.35],'face.374':[.6,.45],'face.473':[.6,.4]});doc.measures[1].calibration={x_min:-1,x_max:1,y_min:-1,y_max:1};const g=evaluateMeasures(doc,r);assert.ok(Math.abs(g['gaze.x'])<1e-9);assert.equal(g['target.inside'],1);
});
test('mouth and eyes use scale-independent aperture ratios',()=>{
 const doc=plan([{name:'mouth',type:'mouth',threshold:.1},{name:'eyes',type:'eyes',threshold:.1}]);
 const f=evaluateMeasures(doc,frame(0,{'face.13':[.5,.5],'face.14':[.5,.55],'face.61':[.4,.5],'face.291':[.6,.5],'face.263':[.7,.4],'face.362':[.5,.4],'face.386':[.6,.35],'face.374':[.6,.45]}));assert.equal(f['mouth.open'],1);assert.equal(f['eyes.left.open'],1);assert.ok(!Object.hasOwn(f,'eyes.right.open'));
});
test('pinch envelope fires once, preserves active on duplicate frames and resets on loss',()=>{
 const doc={version:1,measures:[{name:'pinch',type:'distance',a:'a',b:'b'}],contacts:[{name:'touch',feature:'pinch.distance',close:.04,open:.07,hold_ms:40,tap_ms:350,click_ms:700,cooldown_ms:200}]};const e=new MeasuresEngine(doc),f=(t,d)=>frame(t,{a:[0,0],b:[0,d]});
 assert.equal(e.tick(f(0,.02),0).events.length,0);assert.equal(e.tick(f(50,.02),50).events[0].name,'touch.down');assert.equal(e.tick(f(50,.02),500).features['touch.active'],1);
 const release=e.tick(f(100,.08),100);assert.deepEqual(release.events.map(x=>x.name),['touch.up','touch.click','touch.tap']);assert.equal(release.features['touch.count'],1);
 assert.equal(e.tick(f(110,.02),110).events.length,0);e.tick(frame(400,{}),400);assert.equal(e.tick(f(450,.08),450).events.length,0);
});
test('pause/stale/source reset cannot complete gesture holds or cause phantom releases',()=>{
 const e=new MeasuresEngine({version:1,measures:[{name:'x',type:'point',a:'a'}],events:[{name:'entry',steps:[{feature:'x.x',op:'>',value:.5,hold_ms:100}],within_ms:1000,cooldown_ms:0}]});
 e.tick(frame(0,{a:[1,0]}),0);assert.equal(e.tick(frame(0,{a:[1,0]},{held:true}),1000).events.length,0);assert.equal(e.tick(frame(1000,{a:[1,0]}),1000).events.length,0);assert.equal(e.tick(frame(1100,{a:[1,0]}),1100).events[0].name,'entry');
 e.tick(null,1200);assert.equal(e.tick(frame(1300,{a:[1,0]}),1300).events.length,0);assert.equal(e.tick(frame(10,{a:[1,0]}),1301).events.length,0);
});
test('global boxes enforce ownership, bounds, unique names and removal',()=>{
 const r=new RegionRegistry();r.claim('stage',1);r.update('stage',1,{version:1,boxes:[{name:'center',box:[.2,.2,.5,.5]}]});assert.deepEqual(r.read('stage::center'),[.2,.2,.5,.5]);assert.throws(()=>r.claim('stage',2));r.remove('stage',2);assert.ok(r.read('stage::center'));r.remove('stage',1);assert.equal(r.read('stage::center'),null);assert.throws(()=>parseRegions({version:1,boxes:[{name:'bad',box:[.5,.5,1,1]}]}));
});
test('malformed definitions reject unknown locators, reversed hysteresis and executable operators',()=>{
 assert.throws(()=>plan([{name:'p',type:'point',a:'$missing'}]));assert.throws(()=>parseMeasures({version:1,contacts:[{name:'tap',feature:'x',close:.1,open:.05}]}));assert.throws(()=>parseMeasures({version:1,events:[{name:'x',steps:[{feature:'x',op:'eval',value:1}]}]}));
});

test('geometric hand heuristics distinguish five extended fingers, fist and thumb direction',()=>{
 const hand=(pose)=>{const p={'hands.left.wrist':[.5,.9]};for(const [i,f]of ['index','middle','ring','pinky'].entries()){const x=.3+i*.12;p['hands.left.'+f+'_mcp']=[x,.6];p['hands.left.'+f+'_pip']=[x,.45];p['hands.left.'+f+'_tip']=[x,pose==='open'?.2:.7];}
 const thumb=pose==='fist'?[[.15,.6],[.1,.5],[.2,.7]]:pose==='down'?[[.15,.4],[.15,.6],[.15,.8]]:[[.15,.65],[.15,.4],[.15,.15]];['mcp','ip','tip'].forEach((n,i)=>p['hands.left.thumb_'+n]=thumb[i]);return frame(0,p);};
 const doc=plan([{name:'hand',type:'hand',side:'left'}]);assert.equal(evaluateMeasures(doc,hand('open'))['hand.count'],5);assert.equal(evaluateMeasures(doc,hand('fist'))['hand.fist'],1);assert.equal(evaluateMeasures(doc,hand('up'))['hand.thumbs_up'],1);assert.equal(evaluateMeasures(doc,hand('down'))['hand.thumbs_down'],1);
});

test('held contact channels remain visible but resuming open cannot emit a click',()=>{
 const e=new MeasuresEngine({version:1,measures:[{name:'gap',type:'distance',a:'a',b:'b'}],contacts:[{name:'pinch',feature:'gap.distance',close:.04,open:.07,hold_ms:0}]});
 const r=frame(0,{a:[0,0],b:[0,.01]});assert.equal(e.tick(r,0).features['pinch.active'],1);assert.equal(e.tick({...r,held:true},10000).features['pinch.active'],1);
 assert.equal(e.tick(frame(200,{a:[0,0],b:[0,.1]}),200).events.length,0);
});
