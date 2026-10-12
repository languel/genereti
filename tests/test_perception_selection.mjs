import test from 'node:test';
import assert from 'node:assert/strict';
import {expandSelection,filterSelected,taskSelection,landmarkFeatures,combineFeatures,validateSelectionSets,segmentAlpha,groups} from '../integrations/genereti_comfy_perception/web/selection.js';
test('simultaneous landmark tasks retain a coherent union and forbid mixed segmentation',()=>{
 assert.deepEqual(taskSelection('pose','hands face'),['hands','face']);
 assert.throws(()=>taskSelection('pose','face segment'));
 const hands=landmarkFeatures('hands',{landmarks:[[{x:.2,y:.3}]],handedness:[[{categoryName:'Left',score:.9}]]});
 const face=landmarkFeatures('face',{faceLandmarks:[[{x:.4,y:.5}]],faceBlendshapes:[]});
 const f=combineFeatures([{features:hands},{features:face}]);
 assert.equal(f['hands.left.wrist.x'],.2);assert.equal(f['face.0.x'],.4);assert.equal(f['hands.0.wrist.x'],.2);
});
test('subject-side hands survive detection-order changes without numeric alias changes',()=>{
 const r=(reverse)=>landmarkFeatures('hands',{landmarks:reverse?[[{x:.8,y:.1}],[{x:.2,y:.1}]]:[[{x:.2,y:.1}],[{x:.8,y:.1}]],handedness:(reverse?['Right','Left']:['Left','Right']).map(categoryName=>[{categoryName,score:.9}])});
 assert.equal(r(false)['hands.left.wrist.x'],r(true)['hands.left.wrist.x']);
 assert.notEqual(r(false)['hands.0.wrist.x'],r(true)['hands.0.wrist.x']);
});
test('semantic regions expand to fine vertices and empty provider filter passes input',()=>{
 const eye=expandSelection(['@face.left_eye']);assert.ok(eye.includes('face.263'));assert.ok(!eye.includes('face.33'));
 const f={'face.263.x':.8,'face.263.y':.2,'face.33.x':.2,'pose.nose.x':.5};
 assert.deepEqual(filterSelected(f,[]),f);
 assert.deepEqual(Object.keys(filterSelected(f,['@face.left_eye'])),['face.263.x','face.263.y']);
 assert.ok(groups.some(g=>g.id==='@hands.left.index'));assert.ok(expandSelection(['@hands.left.index']).includes('hands.left.index_tip'));
});
test('selection sets round-trip and reject oversized or malformed documents',()=>{
 const sets=[{name:'Eyes and finger',selectors:['@face.left_eye','hands.left.index_tip']}];assert.deepEqual(validateSelectionSets(JSON.parse(JSON.stringify(sets))),sets);
 assert.throws(()=>validateSelectionSets([{name:'x',selectors:[null]}]));
 assert.throws(()=>validateSelectionSets(Array.from({length:65},()=>sets[0])));
});
test('segmentation threshold, softness, and inversion have defined boundary behavior',()=>{
 assert.equal(segmentAlpha(.49,{threshold:.5,softness:0}),0);
 assert.equal(segmentAlpha(.5,{threshold:.5,softness:0}),1);
 assert.equal(segmentAlpha(.5,{threshold:.5,softness:.2}),.5);
 assert.equal(segmentAlpha(.1,{threshold:.5,softness:.2,invert:true}),1);
});

test('cross-modality distance events reset their hold when selection changes',async()=>{
 const {RuleEngine}=await import('../integrations/genereti_comfy_perception/web/rules.js');
 const engine=new RuleEngine({version:1,rules:[{name:'touch nose',steps:[{distance:['pose.nose','hands.left.index_tip'],op:'<',value:.1,hold_ms:100}]}]});
 const frame=(t,selectors)=>({source:{id:'camera',revision:1,width:320,height:240,frame_timestamp_ms:t},selection:{selectors},features:{'pose.nose.x':.5,'pose.nose.y':.5,'hands.left.index_tip.x':.51,'hands.left.index_tip.y':.5}});
 assert.deepEqual(engine.tick(frame(0,['@pose.head','@hands.left.index']),0),[]);
 assert.deepEqual(engine.tick(frame(120,['pose.nose','hands.left.index_tip']),120),[]);
 assert.equal(engine.tick(frame(240,['pose.nose','hands.left.index_tip']),240)[0].name,'touch nose');
});

test('face and hand placeholder visibility does not hide detected points',async()=>{const {pointsFor}=await import('../integrations/genereti_comfy_perception/web/features.js');const face=landmarkFeatures('face',{faceLandmarks:[[{x:.2,y:.3,visibility:0}]]});assert.equal(pointsFor({features:face},.4).length,1);const pose=landmarkFeatures('pose',{landmarks:[[{x:.2,y:.3,visibility:0}]]});assert.equal(pointsFor({features:pose},.4).length,0);});

test('Holistic maps coordinated result to existing pose, face and side-hand selectors',async()=>{const {holisticFeatures}=await import('../integrations/genereti_comfy_perception/web/selection.js');assert.deepEqual(taskSelection('pose','holistic'),['holistic']);assert.throws(()=>taskSelection('pose','holistic hands'));const f=holisticFeatures({poseLandmarks:[[{x:.5,y:.4,visibility:.9}]],faceLandmarks:[[{x:.6,y:.3,visibility:0}]],leftHandLandmarks:[[{x:.2,y:.1}]],rightHandLandmarks:[[{x:.8,y:.1}]],faceBlendshapes:[{categories:[{categoryName:'eyeBlinkLeft',score:.7}]}]});assert.equal(f['pose.nose.x'],.5);assert.equal(f['face.0.x'],.6);assert.equal(f['hands.left.wrist.x'],.2);assert.equal(f['hands.right.wrist.x'],.8);assert.equal(f['face.blend.eyeBlinkLeft'],.7);assert.equal(f['hands.count'],2);assert.equal('face.0.visibility' in f,false);});
