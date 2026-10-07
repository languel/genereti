import {Transport,MusicalCursor} from './core/clock.js';
import * as time from './core/timeValue.js';
import {normalizeMusic,quantizeNote,noteFrequency} from './core/music.js';
import {evaluateAutomation,addKey,clipTime} from './core/automation.js';
export const freshDocument=()=>({version:1,duration:32,transport:{bpm:110,signature:{numerator:4,denominator:4},loop:{enabled:false,start:0,end:8}},music:normalizeMusic(),tracks:[],clips:[],data:{}});
export function validateDocument(value){
 if(value?.version!==1||!Array.isArray(value.tracks)||!Array.isArray(value.clips))throw Error('Expected a version 1 Genereti performance document');
 if(value.tracks.some(t=>!t||typeof t.id!=='string'||typeof t.target?.ref!=='string'||typeof t.target?.param!=='string'))throw Error('Tracks require a node reference and parameter');
 if(value.tracks.length>256||value.clips.length>2048||JSON.stringify(value).length>2e6)throw Error('Performance document too large');
 for(const clip of value.clips)if(!clip||typeof clip.id!=='string'||typeof clip.trackId!=='string'||!clip.timing||['start','duration','sourceOffset','rate'].some(k=>clip.timing[k]!==undefined&&!Number.isFinite(clip.timing[k]))||!Array.isArray(clip.keys)||clip.keys.length>10000||clip.keys.some(k=>!Number.isFinite(k.time)||typeof k.value!=='number'||!Number.isFinite(k.value)))throw Error('Automation requires finite numeric keys');
 return {...freshDocument(),...structuredClone(value),duration:Math.max(1,Math.min(86400,Number(value.duration)||32)),music:normalizeMusic(value.music)};
}
export class PerformanceService {
 cursor(){return new MusicalCursor();}
 constructor(app){this.app=app;this.listeners=new Set();this.local=new Map();this.bindings=new Map();this.pending=[];this.history=[];this.future=[];this.queueSnapshot=null;this.recording=null;this.load();this.timer=setInterval(()=>this.tick(),40);}
 load(value){const document=value?validateDocument(value):freshDocument();this.clearOverrides();this.recording=null;this.pending=[];for(const stop of this.local.values())stop.unsubscribe?.();this.local.clear();this.document=document;this.clock=new Transport(this.document.transport);this.clock.subscribe(e=>{this.pending=[];this.resetBindings(e);this.publish();});this.lastLoop=0;this.history=[];this.future=[];this.publish();}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 publish(){for(const fn of this.listeners)fn();}
 save(){this.revision=(this.revision??0)+1;this.document.transport=this.clock.serialize();if(this.app.graph){this.app.graph.extra??={};this.app.graph.extra.generetiPerformance=structuredClone(this.document);this.app.graph.change?.();}this.publish();}
 edit(fn){this.history.push(structuredClone(this.document));if(this.history.length>40)this.history.shift();this.future=[];fn(this.document);this.save();}
 undo(){if(!this.history.length)return false;this.future.push(structuredClone(this.document));this.document=this.history.pop();this.clock.configure(this.document.transport);this.save();return true;}
 redo(){if(!this.future.length)return false;this.history.push(structuredClone(this.document));this.document=this.future.pop();this.clock.configure(this.document.transport);this.save();return true;}
 transportFor(node){const name=node?.widgets?.find(w=>w.name==='clock_name')?.value??node?.properties?.generetiClock??'project';if(name==='project')return this.clock;const id=`${name}:${node?.properties?.generetiLessonRef??node?.id}`;if(!this.local.has(id)){const bpm=node?.widgets?.find(w=>w.name==='bpm')?.value??110,clock=new Transport({bpm});clock.play();this.local.set(id,clock);}return this.local.get(id);}
 linked(node){return node?.properties?.generetiTimeMode==='linked';}
 timeFor(node,now){return this.linked(node)?this.clock.read().seconds:now/1000;}
 snapshot(){return {...this.clock.read(),music:structuredClone(this.document.music),data:structuredClone(this.document.data)};}
 expressionValues(){const s=this.snapshot();return {g_time:s.seconds,g_beat:s.beat,g_bar:s.bar,g_bpm:s.bpm,g_ticks:s.ticks,g_phase:s.phase,g_playing:+s.playing,g_rate:s.rate,g_root:s.music.root,g_tuning:s.music.tuning};}
 node(ref){return this.app.graph?._nodes?.find(n=>n.properties?.generetiLessonRef===ref);}
 target(node,param){node.properties??={};node.properties.generetiLessonRef??=crypto.randomUUID();return {ref:node.properties.generetiLessonRef,param};}
 bind(node,reset){this.bindings.set(node,reset);return()=>{this.bindings.delete(node);delete node._generetiPerformanceValues;};}
 resetBindings(event){for(const [node,reset] of this.bindings)if(this.linked(node))reset?.(event);}
 clearOverrides(){if(!this.ready)return;for(const node of this.app?.graph?._nodes??[])delete node._generetiPerformanceValues;}
 launch(expression,action){const target=this.clock.nextBoundary(expression);this.pending.push({...target,action,id:crypto.randomUUID()});this.publish();return target;}
 tick(){if(!this.ready)return;const s=this.clock.read();if(s.iteration!==this.lastLoop){this.lastLoop=s.iteration;this.pending=[];this.resetBindings({type:'wrap',...s});}
  this.clearOverrides();this.conflicts=[];
  for(const {target,value} of evaluateAutomation(this.document,s.seconds)){const node=this.node(target?.ref);if(!node)continue;const input=node.inputs?.find(i=>(i.widget?.name??i.name)===target.param);if(input?.link!=null){this.conflicts.push(`${node.title}: ${target.param} has a wire`);continue;}node._generetiPerformanceValues??={};node._generetiPerformanceValues[target.param]=value;}
  const due=this.pending.filter(x=>x.epoch===s.epoch&&x.iteration===s.iteration&&x.quarterNotes<=s.quarterNotes);this.pending=this.pending.filter(x=>!due.includes(x));for(const x of due)x.action(s);
  if(this.recording){const r=this.recording,node=this.node(r.target.ref),w=node?.widgets?.find(w=>w.name===r.target.param);if(w&&typeof w.value==='number'&&w.value!==r.last){const elapsed=performance.now()/1000-r.monotonic;addKey(r.clip,elapsed,w.value);r.last=w.value;this.document.duration=Math.max(this.document.duration,r.start+elapsed+1);r.clip.timing.duration=Math.max(.05,elapsed+.04);}}
  window.dispatchEvent(new CustomEvent('genereti-performance-frame',{detail:s}));this.publish();
 }
 addAutomation(node,param){const widget=node?.widgets?.find(w=>w.name===param);if(typeof widget?.value!=='number')throw Error('Choose a numeric parameter');const target=this.target(node,param);let track=this.document.tracks.find(t=>t.target.ref===target.ref&&t.target.param===param),clip;
  this.edit(doc=>{if(!track){track={id:crypto.randomUUID(),name:`${node.title} · ${param}`,target,muted:false,solo:false};doc.tracks.push(track);}clip={id:crypto.randomUUID(),trackId:track.id,label:param,timing:{start:this.clock.read().seconds,duration:4,rate:1,sourceOffset:0,loopMode:'once',durationMode:'fixed'},sourceDuration:4,interpolation:'linear',keys:[]};addKey(clip,0,widget.value);doc.clips.push(clip);});return {track,clip,target};}
 record(node,param){if(this.recording){this.stopRecord();return;}const added=this.addAutomation(node,param);this.recording={...added,start:added.clip.timing.start,monotonic:performance.now()/1000,last:undefined};this.clock.play();this.publish();}
 stopRecord(){if(!this.recording)return;this.tick();const r=this.recording,elapsed=Math.max(.05,performance.now()/1000-r.monotonic);if(typeof r.last==='number')addKey(r.clip,elapsed,r.last);r.clip.timing.duration=elapsed+.01;this.document.duration=Math.max(this.document.duration,r.start+elapsed+1);this.recording=null;this.save();}
 quantizeNote(n){return quantizeNote(n,this.document.music);}
 frequency(n){return noteFrequency(n,this.document.music);}
 dispose(){clearInterval(this.timer);this.clearOverrides();this.listeners.clear();}
}
