import test from 'node:test';import assert from 'node:assert/strict';
import {parseScore,regionsFromDocument,MimeEngine,planActions,homunculus,anchorBody,placeBody,boardsFor,maskCoverage,chainOf,BODY_BOARD,BOARD_GAP,defaultRegion}
 from '../integrations/genereti_comfy_perception/web/mime-engine.js';

const stage={width:640,height:360};
const doc=elements=>({artboard:{width:640,height:360},boards:[{id:'body',x:640+BOARD_GAP,y:0,width:BODY_BOARD.width,height:BODY_BOARD.height}],stages:[{id:'s1',visible:true}],elements});
const rect=(id,x0,y0,x1,y1,role='plane',board=[0,0])=>({id,role,stage:'s1',points:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>[x+board[0],y+board[1],0,.5])});
const bodyAt=[640+BOARD_GAP,0];
const frame=(t,points,size=[640,360])=>({source:{id:1,output_slot:0,revision:0,width:size[0],height:size[1],frame_timestamp_ms:t},
 features:Object.fromEntries(Object.entries(points).flatMap(([n,[x,y]])=>[[n+'.x',x],[n+'.y',y]]))});
// The homunculus itself as a live pose (normalized to the body board), optionally scaled and moved.
const homPose=(scale=1,dx=0,dy=0,W=640,H=360)=>Object.fromEntries(Object.entries(homunculus).filter(([n])=>!['neck','pelvis'].includes(n))
 .map(([n,[x,y]])=>['pose.'+n,[(x*scale+dx)/W,(y*scale+dy)/H]]));

test('score defaults and validation keep a usable, bounded configuration',()=>{
 const s=parseScore('');assert.deepEqual(s.stage,{width:640,height:360});assert.equal(s.outputs.osc.port,9000);
 const t=parseScore({version:1,regions:{a:{name:'kick',actions:[{type:'midiNote',trigger:'bogus'},{type:'nope'}]}}});
 assert.equal(t.regions.a.name,'kick');assert.equal(t.regions.a.actions.length,1);assert.equal(t.regions.a.actions[0].trigger,'enterExit');
 assert.throws(()=>parseScore({version:2}),/version 1/);
 assert.equal(boardsFor(stage)[1].x,640+BOARD_GAP);
});

test('stage planes, strokes and points become zones, tripwires and round targets',()=>{
 const regions=regionsFromDocument(doc([rect('a',64,36,320,180),{id:'w',role:'line',stage:'s1',points:[[320,0,0,.5],[320,360,0,.5]]},{id:'p',role:'point',stage:'s1',points:[[100,100,0,.5]]},{id:'n',role:'note',points:[[5,5]]}]),stage);
 assert.deepEqual(regions.map(r=>[r.id,r.board,r.kind]),[['a','stage','zone'],['w','stage','wire'],['p','stage','zone']]);
 assert.deepEqual(regions[0].points[0],[.1,.1]);assert.equal(regions[2].points.length,20);
});

test('a stage zone fires entry with speed, throttled inside, then exit, with cooldown',()=>{
 const regions=regionsFromDocument(doc([rect('a',320,0,640,360)]),stage),score=parseScore({regions:{a:{name:'right',hitters:'pose.left_index',cooldown_ms:300}}});
 const e=new MimeEngine(),tick=(t,x)=>e.tick({regions,config:score.regions,result:frame(t,{'pose.left_index':[x,.5]})});
 assert.equal(tick(0,.2).events.length,0);
 const entry=tick(100,.6);assert.equal(entry.events[0].phase,'entry');assert.ok(entry.events[0].speed>0);assert.equal(entry.channels['right.active'],1);
 assert.equal(tick(150,.61).events.length,0);assert.equal(tick(260,.62).events[0].phase,'inside');
 assert.equal(tick(300,.1).events[0].phase,'exit');
 assert.equal(tick(350,.7).events.length,0,'cooldown blocks a fast re-entry');assert.equal(tick(700,.71).events.length,0,'still inside: no second entry');
 assert.equal(tick(800,.1).events.length,0,'a consumed entry was never active: no exit');assert.equal(tick(1200,.7).events[0].phase,'entry');
 assert.equal(tick(1200,.7).events.length,0,'a repeated frame never fires twice');
});

test('body marks anchor to the nearest bone and follow a moved, scaled skeleton',()=>{
 const chest=[[150,215],[190,215],[190,255],[150,255]];
 assert.equal(anchorBody(chest).bone,'torso');
 const pose=Object.fromEntries(Object.entries(homunculus).map(([n,[x,y]])=>[n,[x*2+50,y*2+10]]));
 const placed=placeBody(anchorBody(chest),pose);chest.forEach(([x,y],i)=>{assert.ok(Math.abs(placed[i][0]-(x*2+50))<1e-6);assert.ok(Math.abs(placed[i][1]-(y*2+10))<1e-6);});
 assert.equal(chainOf('pose.left_index'),'left_arm');assert.equal(chainOf('hands.right.index_tip'),'right_arm');assert.equal(chainOf('pose.nose'),null);
});

test('a hand striking a body zone fires; the zone limb cannot strike itself',()=>{
 const H=homunculus,chest=rect('chest',H.neck[0]-20,H.neck[1]+30,H.neck[0]+20,H.neck[1]+70,'plane',bodyAt);
 const lf=H.left_elbow,lw=H.left_wrist,forearm=rect('arm',Math.min(lf[0],lw[0])-6,Math.min(lf[1],lw[1])+5,Math.max(lf[0],lw[0])+6,Math.max(lf[1],lw[1])-5,'plane',bodyAt);
 const regions=regionsFromDocument(doc([chest,forearm]),stage);assert.deepEqual(regions.map(r=>r.board),['body','body']);
 const score=parseScore({regions:{chest:{name:'chest',hitters:'pose.left_index pose.right_index',cooldown_ms:0},arm:{name:'arm',hitters:'pose.left_index pose.right_index',cooldown_ms:0}}});
 const e=new MimeEngine(),base=homPose(1.2,80,-40,640,720);
 const r1=e.tick({regions,config:score.regions,result:frame(0,base,[640,720])});assert.equal(r1.events.length,0,'rest pose: hands at the sides');
 assert.equal(r1.live.find(l=>l.name==='arm').active,false,'the left index lies on its own forearm but is excluded');
 const strike={...base,'pose.right_index':[((H.neck[0])*1.2+80)/640,((H.neck[1]+50)*1.2-40)/720]};
 const r2=e.tick({regions,config:score.regions,result:frame(40,strike,[640,720])});
 assert.deepEqual(r2.events.map(x=>[x.name,x.phase,x.hitter]),[['chest','entry','pose.right_index']]);
});

test('a lost stream releases active regions (no stuck notes); a held frame changes nothing',()=>{
 const regions=regionsFromDocument(doc([rect('a',0,0,640,360)]),stage),score=parseScore({regions:{a:{name:'all',hitters:'pose.left_index',actions:[{type:'midiNote',trigger:'enterExit',note:36}]}}});const e=new MimeEngine();
 assert.equal(e.tick({regions,config:score.regions,result:frame(0,{'pose.left_index':[.5,.5]})}).events[0].phase,'entry');
 const held=e.tick({regions,config:score.regions,result:{...frame(66,{}),held:true}});assert.equal(held.events.length,0);assert.equal(held.channels['all.active'],1);
 const lost=e.tick({regions,config:score.regions,result:null,now:900});assert.equal(lost.events[0].phase,'exit');assert.equal(lost.channels['all.active'],0);assert.equal(lost.channels['all.hits'],1);
 assert.equal(planActions(score.regions.a,lost.events[0]).find(m=>m.kind==='midi').bytes[0],0x80);
});

test('tripwires fire on crossing with a direction, not on approach',()=>{
 const regions=regionsFromDocument(doc([{id:'w',role:'line',stage:'s1',points:[[320,0,0,.5],[320,360,0,.5]]}]),stage);
 const score=parseScore({regions:{w:{name:'gate',hitters:'pose.right_wrist',cooldown_ms:0}}});const e=new MimeEngine();
 const tick=(t,x)=>e.tick({regions,config:score.regions,result:frame(t,{'pose.right_wrist':[x,.5]})}).events;
 assert.equal(tick(0,.3).length,0);assert.equal(tick(30,.45).length,0);
 const a=tick(60,.55);assert.equal(a[0].phase,'cross');const b=tick(90,.4);assert.equal(b[0].phase,'cross');assert.notEqual(a[0].direction,b[0].direction);
});

test('segmentation zones use mask coverage with hysteresis',()=>{
 const regions=regionsFromDocument(doc([rect('z',0,0,320,360)]),stage),score=parseScore({regions:{z:{name:'floor',mode:'body',threshold:.2,cooldown_ms:0}}});
 const mask=fill=>({width:64,height:36,data:Uint8Array.from({length:64*36},(_,i)=>(i%64)<64*fill?255:0)});
 assert.ok(Math.abs(maskCoverage(mask(.25),regions[0].points.map(([x,y])=>[x*640,y*360]),640,360).coverage-.5)<.05);
 const e=new MimeEngine(),tick=(t,f)=>e.tick({regions,config:score.regions,result:frame(t,{}),mask:mask(f)}).events;
 assert.equal(tick(0,.05).length,0);assert.equal(tick(40,.2)[0].phase,'entry');assert.equal(tick(80,.08).length,0,'hysteresis holds');assert.equal(tick(120,.02)[0].phase,'exit');
});

test('actions plan events, MIDI notes, CC, OSC and WebSocket messages',()=>{
 const cfg=parseScore({regions:{a:{name:'kick',actions:[{type:'event',trigger:'enter',name:'drum.{region}'},{type:'midiNote',trigger:'enterExit',channel:10,note:36,velocity:'speed'},
  {type:'midiNote',trigger:'enter',note:42,velocity:'constant',value:90,duration_ms:120},{type:'midiCc',trigger:'enterExit',cc:7,value_mode:'normY'},{type:'osc',trigger:'enter',address:'/hit/{region}',value_mode:'speed'},{type:'ws',trigger:'enter',address:'mime/{region}'}]}}}).regions.a;
 const on=planActions(cfg,{phase:'entry',speed:.5,normY:.25,x:.1,y:.2,count:1},{stream:'mime'});
 assert.equal(on[0].name,'drum.kick');assert.deepEqual(on[1].bytes,[0x99,36,80]);assert.deepEqual(on[2].bytes,[0x90,42,90]);assert.equal(on[3].delay_ms,120);
 assert.deepEqual(on[4].bytes,[0xB0,7,32]);assert.deepEqual(on[5].values,[.5,1]);assert.equal(on[5].address,'/hit/kick');assert.equal(on[6].message.address,'mime/kick');
 const off=planActions(cfg,{phase:'exit',speed:0});assert.deepEqual(off.map(m=>m.bytes??m.kind),[[0x89,36,0],[0xB0,7,0]]);
 assert.equal(planActions({...cfg,muted:true},{phase:'entry'}).length,0);
 assert.equal(defaultRegion('zone',0,'body').actions[1].note,36);
});
