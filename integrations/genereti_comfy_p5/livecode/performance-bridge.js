import {parseTimeValue,resolveTimeValue,formatSecondsAsBBU} from '../../genereti_comfy_performance/web/core/timeValue.js';
import {quantizeNote,noteFrequency} from '../../genereti_comfy_performance/web/core/music.js';
export function performanceBridge(bridge,send){
 let state={seconds:0,quarterNotes:0,bpm:120,signature:{numerator:4,denominator:4},playing:false,rate:1,music:{},data:{}},arrival=performance.now(),linked=false,frozen=false;
 const elapsed=()=>state.playing&&!frozen?Math.max(0,performance.now()-arrival)/1000*(state.rate??1):0;
 const snapshot=()=>{let seconds=state.seconds+elapsed(),quarterNotes=state.quarterNotes+elapsed()*state.bpm/60,iteration=state.iteration??0;if(state.loop?.enabled&&seconds>=state.loop.end){const length=state.loop.end-state.loop.start,wraps=1+Math.floor((seconds-state.loop.end)/length);seconds=state.loop.start+(seconds-state.loop.end)%length;quarterNotes+=(seconds-state.seconds-elapsed())*state.bpm/60;iteration+=wraps;}const beat=quarterNotes*(state.signature?.denominator??4)/4;return {...state,seconds,quarterNotes,iteration,beat,bar:Math.floor(beat/(state.signature?.numerator??4)),ticks:Math.floor(quarterNotes*480),phase:quarterNotes%1};};
 const context=()=>({tempo:state.bpm,signature:state.signature});
 for(const [name,get] of Object.entries({time:()=>snapshot().seconds,transport:snapshot,beat:()=>snapshot().beat,bar:()=>snapshot().bar,bpm:()=>state.bpm,ticks:()=>snapshot().ticks,phase:()=>snapshot().phase,playing:()=>state.playing,rate:()=>state.rate,root:()=>state.music?.root??0,tuning:()=>state.music?.tuning??440,music:()=>({...state.music})}))Object.defineProperty(bridge,name,{get,configurable:true});
 bridge.timeValue={parse:value=>parseTimeValue(value,context()),resolve:value=>resolveTimeValue(value,context()),format:value=>formatSecondsAsBBU(value,context())};
 bridge.data={get:name=>state.data?.[name],set:(name,value)=>send('performance-command',{command:'data.set',name,value})};
 bridge.musicTools={quantizeNote:note=>quantizeNote(note,state.music),frequency:note=>noteFrequency(note,state.music)};
 bridge.commands={play:()=>send('performance-command',{command:'play'}),pause:()=>send('performance-command',{command:'pause'}),seek:seconds=>send('performance-command',{command:'seek',seconds})};
 return {update(value){state={...state,...value.snapshot};arrival=performance.now();linked=!!value.linked;frozen=!!value.frozen;},time:local=>linked?snapshot().seconds:local};
}
