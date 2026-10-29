// Event timing is in AudioContext seconds, independent of graph redraws.
import {parseDrumPattern,DRUM_LEVEL,snapToScale,parseNoteSteps,formatNoteSteps} from './audio-ui-core.js';
export function pattern(text, drums=false){
 if(drums)return parseDrumPattern(text);
 const parsed=parseNoteSteps(text);return [{name:'note',steps:parsed.map(s=>s.pitch),velocities:parsed.map(s=>s.velocity)}];
}
export function stepTime(step,anchor,bpm,division,swing=0){return anchor+(step+(step%2?swing:0))*60/bpm/division;}
export function events(rows,step,time,duration,velocity,ratchet=1,stepDuration=duration){const count=Math.max(1,Math.min(8,Math.round(Number(ratchet)||1)));return rows.flatMap(row=>{const value=row.steps[step%row.steps.length];if(row.muted)return [];const hit=row.name==='note'?value>=0:Boolean(value);if(!hit)return [];const note=row.name==='note'?value:row.note,v=row.name==='note'?velocity*(row.velocities?.[step%row.steps.length]??1):Math.min(1.5,velocity*(DRUM_LEVEL[value]??value)),length=row.durations?.[step%row.steps.length];return Array.from({length:count},(_,i)=>({note,time:time+i*stepDuration/count,duration:(length?length*stepDuration:duration)/count,velocity:v}));});}
export function heldNotes(data){const ch=data?.channels??{};const midi=Object.entries(ch).filter(([name])=>/note\d+$/.test(name));if(midi.length)return midi.filter(([,a])=>a.at(-1)>0).map(([name,a])=>({key:name,note:Number(name.match(/note(\d+)$/)[1]),velocity:Math.min(1,a.at(-1))}));return ch.gate?.at(-1)>.5?[{key:'note',note:ch.note?.at(-1)??60,velocity:ch.velocity?.at(-1)??.7}]:[];}
export function noteFrame(rows,step,gate,velocity,time,rate){
 const active=gate?events(rows,step,time,0,velocity):[];
 if(gate)for(const row of rows)if(row.durations)for(let i=0;i<row.steps.length;i++){const length=row.durations[i]||0,local=step%row.steps.length;if(row.steps[i]>=0&&local>i&&local<i+length)active.push({note:row.steps[i],velocity:velocity*(row.velocities?.[i]??1)});}
 const first=active[0],channels={note:new Float32Array([first?.note??0]),gate:new Float32Array([first?1:0]),velocity:new Float32Array([first?.velocity??0]),step:new Float32Array([step])};
 if(rows.length>1||rows[0]?.name!=='note')for(const row of rows){const pitches=row.name==='note'?[...new Set(row.steps.filter(n=>n>=0))]:[row.note];for(const pitch of pitches){const level=Math.max(0,...active.filter(e=>e.note===pitch).map(e=>e.velocity));channels[`ch10.note${pitch}`]=new Float32Array([level]);}}
 return {channels,sampleRate:rate,start:time};
}

// Evenly distributed hits with a stable downbeat; rotation shifts the pattern right.
export function euclidean(steps,pulses,rotation=0,note=36){
 const n=Math.max(1,Math.min(64,Math.round(Number(steps)||1))),k=Math.max(0,Math.min(n,Math.round(Number(pulses)||0))),r=((Math.round(Number(rotation)||0)%n)+n)%n;
 return [{name:'note',steps:Array.from({length:n},(_,i)=>{const j=(i-r+n)%n;return k>0&&(j*k)%n<k?Math.max(0,Math.min(127,Number(note)||0)):-1;})}];
}

export function transformPattern(text,operation,amount=1,root=0,scale='minor'){
 let steps=parseNoteSteps(text),n=steps.length,shift=((Math.round(Number(amount)||0)%n)+n)%n;
 if(operation==='reverse')steps.reverse();else if(operation==='shift'&&shift)steps=[...steps.slice(-shift),...steps.slice(0,-shift)];else if(operation==='transpose')steps=steps.map(s=>({...s,pitch:s.pitch<0?-1:Math.max(0,Math.min(127,s.pitch+Number(amount)))}));else if(operation==='quantize'){const scales={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,2,4,7,9],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11]};if(!scales[scale])throw Error('Unknown scale');steps=steps.map(s=>({...s,pitch:s.pitch<0?-1:snapToScale(s.pitch,Number(root),scales[scale])}));}
 return formatNoteSteps(steps);
}
