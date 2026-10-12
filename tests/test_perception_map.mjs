import test from 'node:test';
import assert from 'node:assert/strict';
import {anatomicalMap} from '../integrations/genereti_comfy_perception/web/map-geometry.js';
import {regionForPoint,expandSelection} from '../integrations/genereti_comfy_perception/web/selection.js';
test('combined map uses Threegrease wrist attachment and stable IDs',()=>{const m=anatomicalMap(),lookup=new Map(m.points.map(p=>[p.id,p]));assert.equal(lookup.size,m.points.length);for(const side of ['left','right']){const wrist=lookup.get('hands.'+side+'.wrist'),pose=lookup.get('pose.'+side+'_wrist');assert.deepEqual([wrist.x,wrist.y],[pose.x,pose.y]);}assert.ok(lookup.has('face.263'));assert.ok(lookup.has('face.300'));assert.ok(m.regions.some(r=>r.id==='@face.left_eyebrow'));for(const {a,b}of m.edges){assert.ok(lookup.has(a),a);assert.ok(lookup.has(b),b);}});
test('semantic selections retain ordered contours and finer lips',()=>{assert.equal(regionForPoint('face.263'),'@face.left_eye');assert.equal(regionForPoint('face.300'),'@face.left_eyebrow');assert.ok(expandSelection(['@face.lips_outer']).includes('face.61'));assert.ok(!expandSelection(['@face.lips_outer']).includes('face.78'));assert.ok(expandSelection(['@face.lips_inner']).includes('face.78'));assert.equal(regionForPoint('hands.left.index_tip'),'@hands.left.index');});
test('nose points stay clear of other facial landmarks and contours',()=>{
 const m=anatomicalMap('face'),nose=new Set(expandSelection(['@face.nose'])),lookup=new Map(m.points.map(p=>[p.id,p]));
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 for(const p of m.points.filter(p=>nose.has(p.id))){for(const q of m.points)if(p!==q)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>6,`${p.id} touches ${q.id}`);for(const e of m.edges)if(!nose.has(e.a)&&!nose.has(e.b))assert.ok(distance(p,lookup.get(e.a),lookup.get(e.b))>6,`${p.id} crosses ${e.a}-${e.b}`);}
 const lips=m.points.filter(p=>expandSelection(['@face.lips']).includes(p.id));assert.ok(Math.min(...lips.map(p=>p.y))>210);assert.ok(Math.max(...lips.map(p=>p.y))-Math.min(...lips.map(p=>p.y))<80);
});
test('brows match eyes and coarse pose hand landmarks are opt-in',()=>{
 const face=anatomicalMap('face');for(const side of ['left','right']){const brow=expandSelection(['@face.'+side+'_eyebrow']),eye=expandSelection(['@face.'+side+'_eye']);assert.equal(face.points.find(p=>brow.includes(p.id)).color,face.points.find(p=>eye.includes(p.id)).color);}
 for(const mode of ['combined','body']){const normal=anatomicalMap(mode),enabled=anatomicalMap(mode,{poseHands:true});assert.ok(!normal.points.some(p=>p.id==='pose.left_index'));assert.ok(enabled.points.some(p=>p.id==='pose.left_index'));const ids=new Set(enabled.points.map(p=>p.id));for(const e of enabled.edges)assert.ok(ids.has(e.a)&&ids.has(e.b));}
});
test('static face mesh is complete, frontal and has no connections',()=>{
 const m=anatomicalMap('facemesh'),lookup=new Map(m.points.map(p=>[p.id,p]));assert.equal(lookup.size,478);assert.deepEqual(m.edges,[]);assert.deepEqual(m.regions,[]);for(let i=0;i<478;i++){const p=lookup.get('face.'+i);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
 assert.ok(lookup.get('face.263').x>lookup.get('face.33').x);assert.equal(regionForPoint('face.263'),'@face.left_eye');assert.deepEqual(anatomicalMap('facemesh'),m);
});
test('hands, eyes and attached pose wrists use the model perspective',()=>{
 const lookup=new Map(anatomicalMap().points.map(p=>[p.id,p]));
 assert.ok(lookup.get('hands.left.wrist').x>lookup.get('hands.right.wrist').x);
 assert.ok(lookup.get('face.263').x>lookup.get('face.33').x);
 for(const side of ['left','right'])assert.equal(lookup.get('hands.'+side+'.wrist').x,lookup.get('pose.'+side+'_wrist').x);
});
test('coarse pose hands keep T-pose while detailed hands move upright beside ears',()=>{
 const normal=anatomicalMap(),raised=anatomicalMap('combined',{poseHands:true}),lookup=new Map(raised.points.map(p=>[p.id,p]));
 for(const p of normal.points.filter(p=>p.id.startsWith('pose.')))assert.deepEqual(lookup.get(p.id),p);
 for(const side of ['left','right']){const wrist=lookup.get('hands.'+side+'.wrist'),pose=lookup.get('pose.'+side+'_wrist');assert.ok(wrist.y<pose.y-100);for(const finger of ['index','middle','ring','pinky'])assert.ok(lookup.get('hands.'+side+'.'+finger+'_tip').y<wrist.y-300);}
 const faceCenter=685;for(const side of ['left','right']){const thumb=lookup.get('hands.'+side+'.thumb_tip'),pinky=lookup.get('hands.'+side+'.pinky_tip');assert.ok(Math.abs(thumb.x-faceCenter)<Math.abs(pinky.x-faceCenter),side+' thumb must face inward');}
 const hands=raised.points.filter(p=>p.id.startsWith('hands.')),others=raised.points.filter(p=>!p.id.startsWith('hands.'));for(const p of hands)for(const q of others)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>20,`${p.id} overlaps ${q.id}`);
 assert.deepEqual(anatomicalMap(),normal);
});
