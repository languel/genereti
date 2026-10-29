import {euclidean} from './audio-sequence.js';
const integer=(value,lo,hi,fallback)=>Math.max(lo,Math.min(hi,Math.round(Number.isFinite(Number(value))?Number(value):fallback)));
const velocity=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):1));
export const DEFAULT_TRACKS=[{steps:16,pulses:5,rotation:0,note:36,velocity:1},{steps:16,pulses:3,rotation:0,note:38,velocity:1},{steps:16,pulses:8,rotation:0,note:42,velocity:1},{steps:12,pulses:3,rotation:0,note:46,velocity:1}];
export function readTracks(text,mode='euclidean',legacy={}){
 if(!text||text==='{}'){if(mode==='euclidean')return [{steps:integer(legacy.steps,1,64,16),pulses:integer(legacy.pulses,0,64,5),rotation:integer(legacy.rotation,-64,64,0),note:integer(legacy.note,0,127,36),velocity:1}];return structuredClone(DEFAULT_TRACKS).map(t=>({...t,pattern:'1000100010001000'}));}
 let doc;try{doc=JSON.parse(text);}catch{throw Error('Invalid sequencer tracks JSON');}
 if(doc.version!==1||!Array.isArray(doc.tracks)||!doc.tracks.length||doc.tracks.length>8)throw Error('Expected 1..8 sequencer tracks');
 return doc.tracks.map(t=>{const steps=integer(t.steps,1,64,16);return {steps,pulses:integer(t.pulses,0,steps,5),rotation:integer(t.rotation,-64,64,0),note:integer(t.note,0,127,36),velocity:velocity(t.velocity),muted:!!t.muted,velocities:Array.from({length:steps},(_,i)=>velocity(t.velocities?.[i])),pattern:Array.from({length:steps},(_,i)=>String(t.pattern??'')[i]==='1'?'1':'0').join('')};});
}
export const writeTracks=tracks=>JSON.stringify({version:1,tracks});
export function trackRows(tracks,mode='euclidean'){
 return tracks.map(t=>{const steps=mode==='circle'?Array.from({length:t.steps},(_,i)=>t.pattern[i]==='1'?t.note:-1):euclidean(t.steps,t.pulses,t.rotation,t.note)[0].steps;return {name:'note',steps,muted:t.muted,velocities:steps.map((_,i)=>t.velocity*(t.velocities?.[i]??1))};});
}
export function readPianoRoll(text){
 let doc;try{doc=JSON.parse(text);}catch{throw Error('Invalid piano roll JSON');}
 if(doc.version!==1||!Array.isArray(doc.notes)||doc.notes.length>512)throw Error('Expected piano roll version 1 with up to 512 notes');
 const steps=integer(doc.steps,1,128,16);return {version:1,steps,notes:doc.notes.map(n=>({pitch:integer(n.pitch,0,127,60),start:integer(n.start,0,steps-1,0),length:integer(n.length,1,steps,1),velocity:velocity(n.velocity)})).map(n=>({...n,length:Math.min(n.length,steps-n.start)}))};
}
export function pianoRows(doc){
 // One row per note retains chords and overlapping notes with the same pitch.
 return (doc.notes.length?doc.notes:[{pitch:60,start:0,length:1,velocity:0,empty:true}]).map(n=>{const steps=Array(doc.steps).fill(-1),velocities=Array(doc.steps).fill(1),durations=Array(doc.steps).fill(0);if(!n.empty)steps[n.start]=n.pitch;velocities[n.start]=n.velocity;durations[n.start]=n.length;return {name:'note',steps,velocities,durations};});
}
