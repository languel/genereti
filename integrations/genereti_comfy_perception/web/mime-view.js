// ꘇ mediamime: Mediamime inside Genereti. A Poliplan editor over a live underlay (image, segmentation, skeleton and the
// homunculus); marks become trigger regions, evaluated against a shared perception stream (see mime-engine.js).
import {app} from '../../scripts/app.js';
import {api} from '../../scripts/api.js';
import {subscribeLive,publishLive} from '/extensions/genereti_comfy_p5/js/live-runtime.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';
import {streams} from './perception.js';
import {topology} from './selection.js';
import {parseScore,boardsFor,regionsFromDocument,MimeEngine,planActions,defaultRegion,defaultAction,homunculus,SILHOUETTE,BODY_BOARD,BOARD_GAP,
 HITTER_PRESETS,TRIGGERS,VALUE_MODES,boneById,hitterNames} from './mime-engine.js';
import {MimeOutputs} from './mime-outputs.js';

const value=(n,k)=>n.widgets?.find(w=>w.name===k)?.value;
const POSE_EDGES=topology.poseEdges.map(([a,b])=>[topology.poseNames[a],topology.poseNames[b]]);
const PRESET_LABELS={index:'Index fingers',wrists:'Wrists',hands:'Hands (Holistic)',feet:'Feet',limbs:'Fingers + feet',head:'Head',body:'Whole pose',segment:'Body (segmentation)',custom:'Custom'};
const TRIGGER_LABELS={enter:'enter',exit:'exit',enterExit:'enter + exit',inside:'while inside',cross:'cross'};
const ACTION_LABELS={event:'__ event',midiNote:'MIDI note',midiCc:'MIDI CC',osc:'OSC',ws:'WebSocket'};
const COLORS=['#f28ca8','#71d9c2','#f5c26b','#79b4ff','#c59cff','#9be07a','#ff9b6b','#6be0e0'];

function el(tag,props={},...children){const e=document.createElement(tag);for(const [k,v]of Object.entries(props)){if(k==='style')e.style.cssText=v;else if(k.startsWith('on'))e[k]=v;else if(k in e)e[k]=v;else e.setAttribute(k,v);}e.append(...children.filter(c=>c!=null));return e;}
const add=(parent,...xs)=>parent.append(...xs.filter(x=>x!=null&&x!==false));
function glyphButton(text,title,onclick){const b=el('button',{type:'button',title,onclick},text);b.setAttribute('aria-label',title);return b;}

app.registerExtension({name:'Genereti.PerceptionMime',nodeCreated(node){
 if(node.comfyClass!=='GeneretiPerceptionMime')return;
 ensureControlStyle();
 node.size=[1280,800];
 let score=parseScore(value(node,'score')),geometry=[],editor=null,cam={x:0,y:0,z:1},running=false,dead=false,claimed='',selected=null,latest=null,lastResult=null;
 const recent=[],flashes=[];let video=null,mask=null,maskTint=null,dirtyPanel=true,saveTimer=0,docTimer=0,paintQueued=false;
 const engine=new MimeEngine();
 const status=el('span',{style:'opacity:.75;font:11px ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0'});
 const say=t=>{status.textContent=t;};
 const outputs=new MimeOutputs({onStatus:say,node});
 outputs.oscPort=score.outputs.osc.port;

 // ---- layout --------------------------------------------------------------------------------------------------
 const host=el('div',{style:'width:100%;height:100%;display:flex;flex-direction:column;gap:4px;min-height:0'});
 const bar=el('div',{className:'genereti-node-controls',style:'display:flex;align-items:center;flex-wrap:wrap;gap:2px;padding:2px 0'});
 const main=el('div',{style:'flex:1 1 auto;display:flex;gap:6px;min-height:540px'});
 const stageHost=el('div',{style:'position:relative;flex:1 1 auto;min-width:0;overflow:hidden;border-radius:6px;background:#0b0c0e'});
 const underlay=el('canvas',{style:'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0'});
 const editorHost=el('div',{style:'position:absolute;inset:0;z-index:1'});
 stageHost.append(underlay,editorHost);
 const panel=el('div',{className:'genereti-node-controls',style:'width:300px;flex:0 0 300px;overflow:auto;display:flex;flex-direction:column;gap:6px;font-size:11px;padding-right:2px'});
 main.append(stageHost,panel);host.append(bar,main);
 for(const e of [bar,panel])e.addEventListener('pointerdown',ev=>ev.stopPropagation());

 const run=glyphButton('▶','Start evaluating · fires events and outputs',()=>{running=!running;run.textContent=running?'Ⅱ':'▶';run.title=running?'Pause evaluation':'Start evaluating · fires events and outputs';run.setAttribute('aria-pressed',String(running));engine.reset();if(!running)outputs.allNotesOff();});run.setAttribute('aria-pressed','false');
 const frameStage=glyphButton('▭','Frame the stage board',()=>editor?.fit({board:'main'}));
 const frameBody=glyphButton('☺','Frame the body board (homunculus)',()=>editor?.fit({board:'body'}));
 const opacity=el('input',{type:'range',min:0,max:1,step:.05,value:node.properties.generetiMimeImageOpacity??.75,title:'Image opacity',style:'width:56px'});opacity.oninput=()=>{node.properties.generetiMimeImageOpacity=Number(opacity.value);queuePaint();};
 const showSkeleton=glyphButton('⌁','Show skeleton and hitters',()=>{node.properties.generetiMimeSkeleton=!(node.properties.generetiMimeSkeleton??true);showSkeleton.setAttribute('aria-pressed',String(node.properties.generetiMimeSkeleton));queuePaint();});showSkeleton.setAttribute('aria-pressed',String(node.properties.generetiMimeSkeleton??true));
 // Outputs: explicit connects.
 const midiButton=glyphButton('MIDI','Connect Web MIDI output (all outputs unless a port is named)',async()=>{try{if(outputs.midi){outputs.disconnectMidi();midiButton.setAttribute('aria-pressed','false');say('MIDI disconnected');return;}const names=await outputs.connectMidi(score.outputs.midi.port);midiButton.setAttribute('aria-pressed','true');say('MIDI → '+names.join(', '));refreshPorts();}catch(e){say(e.message);}});
 const midiPort=el('select',{title:'MIDI output port',style:'max-width:110px'});midiPort.append(el('option',{value:''},'all outputs'));if(score.outputs.midi.port)midiPort.append(el('option',{value:score.outputs.midi.port},score.outputs.midi.port));midiPort.value=score.outputs.midi.port;
 midiPort.onchange=async()=>{score.outputs.midi.port=midiPort.value;persist();if(outputs.midi){try{await outputs.connectMidi(midiPort.value);}catch(e){say(e.message);}}};
 async function refreshPorts(){const names=await outputs.midiNames();const v=midiPort.value;midiPort.replaceChildren(el('option',{value:''},'all outputs'),...names.map(n=>el('option',{value:n},n)));midiPort.value=names.includes(v)?v:'';}
 const oscButton=glyphButton('OSC','Arm OSC output · loopback UDP to the port',()=>{outputs.armed.osc=!outputs.armed.osc;oscButton.setAttribute('aria-pressed',String(outputs.armed.osc));say(outputs.armed.osc?'OSC → 127.0.0.1:'+outputs.oscPort:'OSC off');});oscButton.setAttribute('aria-pressed','false');
 const oscPort=el('input',{type:'number',min:1024,max:65535,value:score.outputs.osc.port,title:'OSC UDP port on 127.0.0.1',style:'width:58px'});oscPort.onchange=()=>{score.outputs.osc.port=Math.max(1024,Math.min(65535,Math.round(Number(oscPort.value)||9000)));oscPort.value=score.outputs.osc.port;outputs.oscPort=score.outputs.osc.port;persist();};
 const wsButton=glyphButton('WS','Connect WebSocket output',async()=>{try{if(outputs.ws){outputs.disconnectWs();wsButton.setAttribute('aria-pressed','false');return;}await outputs.connectWs(score.outputs.ws.url);wsButton.setAttribute('aria-pressed','true');say('WebSocket → '+score.outputs.ws.url);}catch(e){say(e.message);wsButton.setAttribute('aria-pressed','false');}});wsButton.setAttribute('aria-pressed','false');
 const wsUrl=el('input',{type:'text',value:score.outputs.ws.url,title:'WebSocket URL',style:'width:150px'});wsUrl.onchange=()=>{score.outputs.ws.url=wsUrl.value.trim();persist();};
 const exportButton=glyphButton('↓','Export the score (JSON)',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(score,null,2)],{type:'application/json'})),a=el('a',{href:url,download:'mediamime-score.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const importButton=glyphButton('↑','Import a score (JSON)',()=>{const input=el('input',{type:'file',accept:'.json'});input.onchange=async()=>{try{if(input.files[0].size>4e6)throw Error('Score exceeds 4 MB');const text=await input.files[0].text();parseScore(text);adopt(text);persist();say('Score imported');}catch(e){say(e.message);}};input.click();});
 bar.append(run,frameStage,frameBody,opacity,showSkeleton,midiButton,midiPort,oscButton,oscPort,wsButton,wsUrl,exportButton,importButton,status);

 // Hide the raw score widget; the editor and panel own it.
 const raw=node.widgets.find(w=>w.name==='score');raw.options={...raw.options,hidden:true};raw.computeSize=()=>[0,-4];if(raw.element)raw.element.style.display='none';
 const widget=node.addDOMWidget('mime_editor','GENERETI_MIME',host,{serialize:false,hideOnZoom:false});widget.computeSize=w=>[w,640];

 // Workflow load / undo: follow the widget when it changes from outside (own writes are recorded in knownText).
 let knownText=value(node,'score');
 function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const w=node.widgets.find(w=>w.name==='score');const text=JSON.stringify(score);if(w.value!==text){w.value=text;knownText=text;node.graph?.change?.(node);}},400);}
 // scoreRev counts scores adopted from outside; editorRev is the score the editor holds. Regions are only pruned from a
 // document that belongs to the current score, so a restore can never be overwritten by a stale, empty editor.
 let scoreRev=0,editorRev=-1;
 function adopt(text){
  knownText=text;try{score=parseScore(text);}catch(e){say(e.message);return;}
  scoreRev++;outputs.oscPort=score.outputs.osc.port;oscPort.value=score.outputs.osc.port;wsUrl.value=score.outputs.ws.url;
  if(score.outputs.midi.port&&![...midiPort.options].some(o=>o.value===score.outputs.midi.port))midiPort.append(el('option',{value:score.outputs.midi.port},score.outputs.midi.port));midiPort.value=score.outputs.midi.port;
  selected=null;dirtyPanel=true;if(editor)loadEditor().catch(e=>say(e.message));
 }
 const followWidget=setInterval(()=>{const text=value(node,'score');if(text!==knownText&&text!==JSON.stringify(score))adopt(text);knownText=text;},500);
 const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);const text=value(node,'score');if(text!==JSON.stringify(score))adopt(text);return result;};

 // ---- editor ---------------------------------------------------------------------------------------------------
 async function loadEditor(){if(!editor)return;const rev=scoreRev;await editor.load(score.document??undefined,{boards:boardsFor(score.stage),fit:'main'});if(rev!==scoreRev)return;editorRev=rev;await refreshDocument();}
 async function refreshDocument(){
  if(!editor||editorRev!==scoreRev)return;const rev=scoreRev,{document}=await editor.getDocument();if(rev!==scoreRev)return;score.document=document;geometry=regionsFromDocument(document,score.stage);
  const ids=new Set(geometry.map(r=>r.id));let changed=false;
  geometry.forEach(r=>{if(!score.regions[r.id]){const n=Object.keys(score.regions).length;score.regions[r.id]={...defaultRegion(r.kind,n,r.board)};let name=score.regions[r.id].name,i=n+1;while(Object.entries(score.regions).some(([id,c])=>id!==r.id&&c.name===name))name=name.replace(/\d+$/,'')+(++i);score.regions[r.id].name=name;changed=true;selected=r.id;}});
  for(const id of Object.keys(score.regions))if(!ids.has(id)){delete score.regions[id];changed=true;}
  if(selected&&!ids.has(selected))selected=geometry[0]?.id??null;
  persist();dirtyPanel=true;renderPanel();queuePaint();return changed;
 }
 async function startEditor(){
  try{
   say('Loading Poliplan…');
   const {createEditor}=await import(/* @vite-ignore */ api.apiURL('/genereti/poliplan/ams-editor.js'));
   const rev=scoreRev;
   editor=await createEditor(editorHost,{src:api.apiURL('/genereti/poliplan/embed.html'),ns:'genereti-mime',boards:boardsFor(score.stage),document:score.document??undefined,background:'transparent',ui:{tools:true,view:true,zoom:true,panels:false},fit:'main'});
   if(dead){editor.destroy();return;}
   editor.frame.style.colorScheme='normal';
   await editor.setMode('standalone');await editor.setUI({tools:true,view:true,zoom:true,panels:false});
   await editor.fit({board:'main'});
   const c=await editor.camera();cam={x:c.x,y:c.y,z:c.z};
   editor.on('camera',m=>{cam={x:m.x,y:m.y,z:m.z};queuePaint();});
   editor.on('change',()=>{clearTimeout(docTimer);docTimer=setTimeout(()=>refreshDocument().catch(e=>say(e.message)),120);});
   editor.on('selection',m=>{const id=(m.ids??[]).find(i=>score.regions[i]);if(id&&id!==selected){selected=id;dirtyPanel=true;renderPanel();queuePaint();}});
   if(rev===scoreRev){editorRev=rev;await refreshDocument();}else await loadEditor();
   say('Draw zones (planes), tripwires (lines) or targets (points) on the stage or the body');
  }catch(e){say('Poliplan did not start: '+e.message);}
 }
 startEditor();
 new ResizeObserver(async()=>{if(editor){try{const c=await editor.camera();cam={x:c.x,y:c.y,z:c.z};}catch{}}queuePaint();}).observe(stageHost);

 // ---- live inputs ----------------------------------------------------------------------------------------------
 const videoCanvas=el('canvas'),maskCanvas=el('canvas');
 const releaseImage=subscribeLive(node,frame=>{const b=frame.bitmap;if(!b)return;if(videoCanvas.width!==b.width||videoCanvas.height!==b.height){videoCanvas.width=b.width;videoCanvas.height=b.height;}videoCanvas.getContext('2d').drawImage(b,0,0);video=videoCanvas;adoptStage(b.width,b.height);queuePaint();},()=>{video=null;queuePaint();},{inputName:'image'});
 const releaseMask=subscribeLive(node,frame=>{const b=frame.bitmap;if(!b)return;const w=96,h=Math.max(1,Math.round(96*b.height/b.width));if(maskCanvas.width!==w||maskCanvas.height!==h){maskCanvas.width=w;maskCanvas.height=h;}const c=maskCanvas.getContext('2d',{willReadFrequently:true});c.clearRect(0,0,w,h);c.drawImage(b,0,0,w,h);const px=c.getImageData(0,0,w,h).data,data=new Uint8Array(w*h);for(let i=0;i<w*h;i++)data[i]=Math.max(px[i*4],px[i*4+1],px[i*4+2])*px[i*4+3]/255;mask={width:w,height:h,data};maskTint=null;},()=>{mask=null;maskTint=null;},{inputName:'mask'});
 // The stage board follows the source size until zones are drawn on it (marks keep their world coordinates).
 async function adoptStage(w,h){
  if(!editor||(score.stage.width===w&&score.stage.height===h)||geometry.some(r=>r.board==='stage'))return;
  score.stage={width:w,height:h};
  try{await editor.callTool('ams_board',{action:'update',id:'main',patch:{width:w,height:h}});await editor.callTool('ams_board',{action:'update',id:BODY_BOARD.id,patch:{x:w+BOARD_GAP,y:0}});await editor.fit({board:'main'});}catch(e){say(e.message);}
  persist();
 }

 // ---- evaluation -----------------------------------------------------------------------------------------------
 function claim(){const name=String(value(node,'publish')??'').trim();if(name===claimed)return;if(claimed)streams.remove(claimed,node);claimed='';if(name){try{claimed=streams.claim(name,node);}catch(e){say(e.message);}}}
 function tick(){
  if(dead)return;claim();
  const result=streams.read(String(value(node,'stream')??'body'),Number(value(node,'max_age_ms'))||500);lastResult=result;
  const out=engine.tick({regions:geometry,config:score.regions,result,mask,minConfidence:Number(value(node,'min_confidence'))||0,now:performance.now()});latest=out;
  if(running)for(const e of out.events){
   const cfg=score.regions[e.region];if(!cfg)continue;
   // The catch-all event (named after the published stream) carries entries, exits and crossings, never the inside repeats.
   const all=e.phase==='inside'?[]:[{kind:'event',name:claimed||'mime',payload:{region:cfg.name,phase:e.phase,x:e.x,y:e.y,speed:e.speed,coverage:e.coverage,count:e.count,hitter:e.hitter,direction:e.direction,timestamp_ms:e.timestamp_ms}}];
   outputs.send([...planActions(cfg,e,{stream:claimed||'mime'}),...all],{stream:claimed||'mime',producer:node.id});
   if(e.phase!=='inside'){recent.unshift({...e,region:cfg.name,at:performance.now()});if(recent.length>32)recent.length=32;}
   if(e.phase==='entry'||e.phase==='cross')flashes.push({id:e.region,x:e.x,y:e.y,at:performance.now(),speed:e.speed??0});
  }
  const channels={...out.channels,...outputs.noteChannels(),'mime.valid':+out.valid,'mime.running':+running};node._mimeChannels=channels;
  if(claimed)streams.update(claimed,node,out.valid?{version:1,task:'mime',source:result.source,coordinates:result.coordinates,features:channels,regions:out.live,events:recent.slice(0,8)}:null,out.valid?(result.held?'paused':'running'):'stopped');
  window.dispatchEvent(new CustomEvent('genereti-control-frame',{detail:{nodeId:node.id}}));
  updateIndicators();queuePaint();
 }
 const unsubscribe=streams.subscribe(name=>{if(name===String(value(node,'stream')??''))tick();});
 const idle=setInterval(tick,100);
 node._generetiChop={get latest(){return {channels:Object.fromEntries(Object.entries(node._mimeChannels??{}).map(([k,v])=>[k,[v]])),sample_rate:15,sampleRate:15,start:performance.now()/1000};}};
 node._generetiDatTable=()=>({rows:[['region','phase','hitter','speed','x','y'],...recent.map(e=>[e.region,e.phase,e.hitter??'',(e.speed??0).toFixed(3),(e.x??0).toFixed(3),(e.y??0).toFixed(3)])],jsonValue:{version:1,stream:claimed,events:recent,regions:latest?.live??[]}});
 node._generetiLiveSource={retain(){},release(){}};

 // ---- underlay -------------------------------------------------------------------------------------------------
 const overlay=el('canvas');
 function queuePaint(){if(paintQueued||dead)return;paintQueued=true;requestAnimationFrame(()=>{paintQueued=false;paint();});}
 const colorOf=id=>{const i=geometry.findIndex(r=>r.id===id);return geometry[i]?.color&&geometry[i].color!=='#1d1b19'?geometry[i].color:COLORS[(i<0?0:i)%COLORS.length];};
 function polygonPath(c,poly,W,H){c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));}
 function paintStage(c,W,H,{forOutput=false}={}){
  const now=performance.now();
  if(!forOutput){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,H);if(video){c.globalAlpha=Number(opacity.value);c.drawImage(video,0,0,W,H);c.globalAlpha=1;}}
  if(mask&&!forOutput){if(!maskTint){maskTint=el('canvas',{width:mask.width,height:mask.height});const mc=maskTint.getContext('2d'),img=mc.createImageData(mask.width,mask.height);for(let i=0;i<mask.data.length;i++){const v=mask.data[i];img.data.set([120,200,255,v>127?70:0],i*4);}mc.putImageData(img,0,0);}c.imageSmoothingEnabled=true;c.drawImage(maskTint,0,0,W,H);}
  const live=latest?.live??[];
  for(const r of live){if(!r.polygon||r.board!=='stage'&&r.board!=='body')continue;const col=colorOf(r.id),sel=r.id===selected;
   polygonPath(c,r.polygon,W,H);if(r.kind==='zone')c.closePath();
   if(r.kind==='zone'&&(r.active||forOutput&&r.active)){c.fillStyle=col+'55';c.fill();}
   if(r.board==='body'||forOutput||sel){c.setLineDash(r.board==='body'&&!forOutput?[6,4]:[]);c.lineWidth=(sel?2.5:1.5)/(forOutput?1:cam.z);c.strokeStyle=col+(r.active||sel?'ff':'aa');c.stroke();c.setLineDash([]);}
  }
  for(const f of flashes){const age=(now-f.at)/600;if(age>1||f.x==null)continue;c.beginPath();c.arc(f.x*W,f.y*H,(12+50*age)*(1+f.speed),0,Math.PI*2);c.lineWidth=3*(1-age);c.strokeStyle=colorOf(f.id)+Math.round((1-age)*255).toString(16).padStart(2,'0');c.stroke();}
  if(!forOutput&&(node.properties.generetiMimeSkeleton??true)&&latest?.pose){
   const p=latest.pose;c.lineWidth=1.5/cam.z;c.strokeStyle='rgba(220,230,240,.55)';
   for(const [a,b]of POSE_EDGES)if(p[a]&&p[b]){c.beginPath();c.moveTo(p[a][0]*W,p[a][1]*H);c.lineTo(p[b][0]*W,p[b][1]*H);c.stroke();}
   const hit=new Set(Object.values(score.regions).flatMap(cfg=>cfg.mode==='body'?[]:hitterNames(cfg.hitters)));
   const f=lastResult?.features??{};
   for(const name of hit){const x=f[name+'.x'],y=f[name+'.y'];if(!Number.isFinite(x)||!Number.isFinite(y))continue;c.beginPath();c.arc(x*W,y*H,5/cam.z,0,Math.PI*2);c.fillStyle='#ffe066';c.fill();}
  }
 }
 function paintBody(c){
  const live=new Map((latest?.live??[]).map(r=>[r.id,r]));
  c.save();c.lineCap='round';
  for(const [a,b,r]of SILHOUETTE){const p=homunculus[a],q=homunculus[b];c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.lineWidth=r*2;c.strokeStyle='rgba(200,215,230,.10)';c.stroke();}
  const head=homunculus.nose;c.beginPath();c.arc(head[0],head[1]-8,40,0,Math.PI*2);c.fillStyle='rgba(200,215,230,.10)';c.fill();
  c.lineWidth=1.2;c.strokeStyle='rgba(200,215,230,.45)';for(const [a,b]of POSE_EDGES){const p=homunculus[a],q=homunculus[b];if(p&&q){c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();}}
  c.fillStyle='rgba(200,215,230,.7)';for(const [n,[x,y]]of Object.entries(homunculus))if(!['neck','pelvis'].includes(n)&&!/eye|ear|mouth/.test(n)){c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fill();}
  c.font='12px ui-sans-serif,system-ui';c.fillStyle='rgba(200,215,230,.6)';c.fillText('L',homunculus.left_wrist[0]+8,homunculus.left_wrist[1]);c.fillText('R',homunculus.right_wrist[0]-16,homunculus.right_wrist[1]);
  c.fillText('performer facing you',8,BODY_BOARD.height-10);
  for(const r of geometry){if(r.board!=='body')continue;const l=live.get(r.id),col=colorOf(r.id);c.beginPath();r.template.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(r.kind==='zone'){c.closePath();if(l?.active){c.fillStyle=col+'66';c.fill();}}
   if(r.id===selected){c.lineWidth=2.5;c.strokeStyle=col;c.stroke();const bone=boneById(r.anchor.bone),a=homunculus[bone.a],b=homunculus[bone.b];c.setLineDash([3,3]);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.strokeStyle=col+'cc';c.stroke();c.setLineDash([]);}}
  c.restore();
 }
 function paint(){
  if(dead)return;
  const dpr=devicePixelRatio||1,w=stageHost.clientWidth,h=stageHost.clientHeight;if(!w||!h)return;
  if(underlay.width!==Math.round(w*dpr)||underlay.height!==Math.round(h*dpr)){underlay.width=Math.round(w*dpr);underlay.height=Math.round(h*dpr);}
  const c=underlay.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,underlay.width,underlay.height);
  c.setTransform(dpr,0,0,dpr,0,0);c.translate(cam.x,cam.y);c.scale(cam.z,cam.z);
  paintStage(c,score.stage.width,score.stage.height);
  const body=(score.document?.boards??[]).find(b=>b.id===BODY_BOARD.id)??{x:score.stage.width+BOARD_GAP,y:0};
  c.save();c.translate(body.x,body.y);paintBody(c);c.restore();
  // The overlay output: zones, live body zones and hits on transparency, at the stage size (for projection).
  if(node.isOutputConnected?.(2)){if(overlay.width!==score.stage.width||overlay.height!==score.stage.height){overlay.width=score.stage.width;overlay.height=score.stage.height;}
   const o=overlay.getContext('2d');o.clearRect(0,0,overlay.width,overlay.height);paintStage(o,overlay.width,overlay.height,{forOutput:true});publishLive(node,overlay,2);}
  while(flashes.length&&performance.now()-flashes[0].at>600)flashes.shift();
  if(flashes.length)queuePaint();
 }

 // ---- panel ----------------------------------------------------------------------------------------------------
 const list=el('div',{style:'display:flex;flex-direction:column;gap:2px'}),detail=el('div',{style:'display:flex;flex-direction:column;gap:4px'}),log=el('div',{style:'font:10px ui-monospace,monospace;opacity:.7;white-space:pre;overflow:hidden;max-height:120px'});
 panel.append(el('div',{style:'font-weight:600;opacity:.8'},'Regions'),list,detail,el('div',{style:'font-weight:600;opacity:.8;margin-top:4px'},'Activity'),log);
 const field=(label,input)=>el('label',{style:'display:grid;grid-template-columns:72px 1fr;align-items:center;gap:4px'},el('span',{style:'opacity:.7'},label),input);
 const select=(options,current,onchange,title='')=>{const s=el('select',{title});for(const [v,l]of options)s.append(el('option',{value:v},l));s.value=current;s.onchange=()=>onchange(s.value);return s;};
 const number=(current,onchange,attrs={})=>{const i=el('input',{type:'number',value:current,style:'width:100%',...attrs});i.onchange=()=>onchange(Number(i.value));return i;};
 const text=(current,onchange,attrs={})=>{const i=el('input',{type:'text',value:current,style:'width:100%',...attrs});i.onchange=()=>onchange(i.value);return i;};
 function presetOf(cfg){if(cfg.mode==='body')return 'segment';return Object.entries(HITTER_PRESETS).find(([,v])=>v===cfg.hitters)?.[0]??'custom';}
 function changed(){persist();dirtyPanel=true;renderPanel();queuePaint();}
 function renderPanel(){
  if(!dirtyPanel)return;dirtyPanel=false;
  list.replaceChildren(...geometry.map(r=>{const cfg=score.regions[r.id];if(!cfg)return null;const row=el('button',{type:'button',style:'display:grid;grid-template-columns:12px minmax(0,1fr) auto 28px;gap:6px;align-items:center;text-align:left;padding:2px 4px;border:0;border-radius:6px;background:'+(r.id===selected?'#8883':'transparent')+';color:inherit;cursor:pointer',onclick:()=>{selected=r.id;dirtyPanel=true;renderPanel();queuePaint();}},
   el('span',{'data-dot':r.id,style:'width:10px;height:10px;border-radius:'+(r.kind==='wire'?'2px':'50%')+';background:'+colorOf(r.id)}),
   el('span',{},cfg.name+(cfg.muted?' (muted)':'')),el('span',{style:'opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px'},(r.board==='body'?'body · '+r.anchor.bone.replaceAll('_',' '):'stage')+(r.kind==='wire'?' · wire':'')),el('span',{'data-hits':r.id,style:'opacity:.6;font-variant-numeric:tabular-nums'},''));return row;}));
  if(!geometry.length)list.append(el('div',{style:'opacity:.6;line-height:1.4'},'Draw on the stage (over the image) or on the body (the homunculus). Closed shapes are zones, lines are tripwires, points are targets.'));
  detail.replaceChildren();const r=geometry.find(g=>g.id===selected),cfg=r&&score.regions[r.id];if(!cfg)return;
  const presets=Object.keys(PRESET_LABELS).filter(k=>k!=='segment'||r.board==='stage'&&r.kind==='zone');
  const hitters=text(cfg.hitters,v=>{cfg.hitters=v;cfg.mode='points';changed();},{title:'Selectors: pose.left_index, @hands.left.all …'});
  detail.append(
   field('name',text(cfg.name,v=>{if(/^[A-Za-z][\w.-]{0,79}$/.test(v)&&!Object.values(score.regions).some(c=>c!==cfg&&c.name===v)){cfg.name=v;changed();}else say('Use a unique name: a letter, then letters, digits, . _ -');})),
   field('hitters',select(presets.map(k=>[k,PRESET_LABELS[k]]),presetOf(cfg),v=>{if(v==='segment')cfg.mode='body';else{cfg.mode='points';if(v!=='custom')cfg.hitters=HITTER_PRESETS[v];}changed();})),
   cfg.mode==='body'?field('threshold',number(cfg.threshold,v=>{cfg.threshold=Math.max(.001,Math.min(1,v||.08));changed();},{step:.01,min:.001,max:1,title:'Fraction of the zone covered by the body'})):field('selectors',hitters),
   field('cooldown ms',number(cfg.cooldown_ms,v=>{cfg.cooldown_ms=Math.max(0,v||0);changed();},{step:10,min:0})),
   field('hold ms',number(cfg.hold_ms,v=>{cfg.hold_ms=Math.max(0,v||0);changed();},{step:10,min:0,title:'Time inside before entry'})),
   el('div',{style:'display:flex;gap:2px;flex-wrap:wrap'},
    ...Object.entries(ACTION_LABELS).map(([type,label])=>glyphButton('+ '+label,'Add a '+label+' action',()=>{const a=defaultAction(type,cfg.actions.length);if(r.kind==='wire')a.trigger='cross';cfg.actions.push(a);changed();})),
    glyphButton(cfg.muted?'unmute':'mute','Mute this region\'s actions',()=>{cfg.muted=!cfg.muted;changed();}),
    glyphButton('test ▶','Fire this region once (entry, then exit)',()=>testRegion(r.id)))
  );
  cfg.actions.forEach((a,i)=>{
   const card=el('div',{style:'border:1px solid #8884;border-radius:6px;padding:4px;display:flex;flex-direction:column;gap:3px'});
   const triggers=r.kind==='wire'?['cross']:TRIGGERS.filter(t=>t!=='cross');
   add(card,el('div',{style:'display:flex;gap:4px;align-items:center'},el('b',{style:'flex:1'},ACTION_LABELS[a.type]),
    select(triggers.map(t=>[t,TRIGGER_LABELS[t]]),a.trigger,v=>{a.trigger=v;changed();},'Trigger'),
    glyphButton('×','Remove action',()=>{cfg.actions.splice(i,1);changed();})));
   const modes=(cur,key)=>select(VALUE_MODES.map(m=>[m,m]),cur,v=>{a[key]=v;changed();},'Value source');
   if(a.type==='event')add(card,field('name',text(a.name,v=>{a.name=v.trim();changed();},{placeholder:cfg.name+' (default)',title:'__.events.on(name) · {region} and {phase} are replaced'})));
   if(a.type==='midiNote')add(card,field('channel',number(a.channel,v=>{a.channel=Math.max(1,Math.min(16,Math.round(v)||1));changed();},{min:1,max:16})),field('note',number(a.note,v=>{a.note=Math.max(0,Math.min(127,Math.round(v)||0));changed();},{min:0,max:127,title:'36 kick · 38 snare · 42 hat · others are hats on mod.drumkit'})),
    field('velocity',modes(a.velocity,'velocity')),a.velocity==='constant'?field('value',number(a.value,v=>{a.value=Math.max(1,Math.min(127,Math.round(v)||100));changed();},{min:1,max:127})):null,field('length ms',number(a.duration_ms,v=>{a.duration_ms=Math.max(10,v||180);changed();},{min:10,title:'Note length when the trigger has no exit'})));
   if(a.type==='midiCc')add(card,field('channel',number(a.channel,v=>{a.channel=Math.max(1,Math.min(16,Math.round(v)||1));changed();},{min:1,max:16})),field('cc',number(a.cc,v=>{a.cc=Math.max(0,Math.min(119,Math.round(v)||0));changed();},{min:0,max:119})),field('value',modes(a.value_mode,'value_mode')),a.value_mode==='constant'?field('constant',number(a.value,v=>{a.value=Math.max(0,Math.min(127,Math.round(v)||0));changed();},{min:0,max:127})):null);
   if(a.type==='osc'||a.type==='ws')add(card,field('address',text(a.address,v=>{a.address=v.trim();changed();},{title:'{region} and {phase} are replaced'})),field('value',modes(a.value_mode,'value_mode')),a.value_mode==='constant'?field('constant',number(a.value,v=>{a.value=v;changed();},{step:.01})):null);
   detail.append(card);
  });
 }
 function updateIndicators(){
  const live=new Map((latest?.live??[]).map(r=>[r.id,r]));
  for(const dot of list.querySelectorAll('[data-dot]')){const l=live.get(dot.dataset.dot);dot.style.boxShadow=l?.active?'0 0 0 3px '+colorOf(dot.dataset.dot)+'88':'none';}
  for(const hits of list.querySelectorAll('[data-hits]'))hits.textContent=String(latest?.channels?.[score.regions[hits.dataset.hits]?.name+'.hits']??'');
  log.textContent=outputs.log.slice(0,10).map(l=>l.kind.padEnd(5)+' '+l.text).join('\n');
  const n=geometry.length,stream=String(value(node,'stream')??'');
  say(`${n} region${n===1?'':'s'} · ${stream} ${lastResult?(lastResult.held?'held':'live'):'waiting'} · ${running?'running':'stopped · press ▶'} · ev ${outputs.sent.event} midi ${outputs.sent.midi} osc ${outputs.sent.osc} ws ${outputs.sent.ws}`);
 }
 function testRegion(id){
  const cfg=score.regions[id],r=geometry.find(g=>g.id===id);if(!cfg||!r)return;const poly=latest?.live?.find(l=>l.id===id)?.polygon??(r.points??null),c=poly?poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0]):[.5,.5];
  const base={region:id,name:cfg.name,x:c[0],y:c[1],normX:.5,normY:.5,distance:0,speed:.7,coverage:1,count:1,hitter:'test',timestamp_ms:performance.now()};
  const fire=phase=>{outputs.send(planActions(cfg,{...base,phase},{stream:claimed||'mime'}),{stream:claimed||'mime',producer:node.id});if(phase!=='exit')flashes.push({id,x:c[0],y:c[1],at:performance.now(),speed:.7});queuePaint();};
  fire(r.kind==='wire'?'cross':'entry');if(r.kind!=='wire')setTimeout(()=>fire('exit'),250);
 }

 const removed=node.onRemoved;node.onRemoved=function(){dead=true;clearInterval(idle);clearInterval(followWidget);clearTimeout(saveTimer);unsubscribe();releaseImage();releaseMask();outputs.dispose();if(claimed)streams.remove(claimed,node);editor?.destroy();return removed?.apply(this,arguments);};
}});
