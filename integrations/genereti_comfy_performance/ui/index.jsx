import React,{useState,useEffect,useMemo,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import TransportTimeline from './TransportTimeline.jsx';
import {clipTime,addKey} from '../web/core/automation.js';
import {SCALES} from '../web/core/music.js';
import './timeline.css';
import './performance.css';
const Button=({tip,children,...props})=><button type="button" title={tip} aria-label={tip} {...props}>{children}</button>;
function Timeline({service,toolbarHost,visible}){
 const renderStart=performance.now();useLayoutEffect(()=>{window.generetiPerformanceMonitor?.duration("timeline",performance.now()-renderStart);});
 const [,redraw]=useState(0),[mode,setMode]=useState('seconds'),[selected,setSelected]=useState(''),[param,setParam]=useState(''),[launch,setLaunch]=useState('bar'),[message,setMessage]=useState(''),[seekDraft,setSeekDraft]=useState(null);
 useEffect(()=>service.subscribeUI(()=>{if(!visible||visible())redraw(x=>x+1);}),[service,visible]);
 const doc=service.document,s=service.clock.read(),nodes=service.ready?Object.values(service.app.canvas?.selected_nodes??{}):[],node=nodes[0],widgets=(node?.widgets??[]).filter(w=>typeof w.value==='number'&&w.name!=='width'&&w.name!=='height'),parameter=widgets.some(w=>w.name===param)?param:widgets[0]?.name,clip=doc.clips.find(c=>c.id===selected);
 const automationKeys=useMemo(()=>doc.clips.flatMap(c=>c.keys.map(k=>({...k,time:c.timing.start+(k.time-(c.timing.sourceOffset??0))/(c.timing.rate??1),elementId:c.trackId,path:c.label})).filter(k=>k.time>=c.timing.start&&k.time<c.timing.start+(c.timing.durationMode==='hold'?doc.duration-c.timing.start:c.timing.duration))),[doc,service.revision,service.recording?s.seconds:0]);
 const act=fn=>{try{fn();setMessage('');}catch(e){setMessage(e.message);}};
 const editClip=(id,timing)=>service.edit(d=>{const c=d.clips.find(c=>c.id===id);if(c)c.timing=timing;});
 const exportDoc=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({...doc,transport:service.clock.serialize()},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ꘇ-performance.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const transport=<div className="genereti-performance-toolbar">
   <Button tip={s.playing?'Pause · hold position':'Play project transport · audio still requires mod.output Start'} aria-pressed={s.playing} onClick={()=>s.playing?service.clock.pause():service.clock.play()}>{s.playing?'Ⅱ':'▷'}</Button>
   <Button tip="Stop and return to zero" onClick={()=>{service.stopRecord();service.clock.stop();}}>■</Button>
   <Button tip="Loop score range" aria-pressed={service.clock.loop.enabled} onClick={()=>{service.clock.setLoop({...service.clock.loop,enabled:!service.clock.loop.enabled});service.save();}}>↺</Button>
   <input aria-label="Score seconds" title="Seek pauses playback and resets linked feedback; no audio scrubbing" type="number" min="0" step=".1" value={seekDraft??s.seconds.toFixed(3)} onFocus={()=>setSeekDraft(s.seconds.toFixed(3))} onChange={e=>setSeekDraft(e.target.value)} onBlur={e=>{service.clock.seek(e.target.value);setSeekDraft(null);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>
   <output title="Elapsed bars / meter beats / ticks (zero based)">{s.bar}.{Math.floor(s.beatInBar)}.{s.ticks%Math.round(480*4/s.signature.denominator)}</output>
   <label title="Tempo edits keep musical phase">♩ <input aria-label="Tempo BPM" type="number" min="20" max="400" value={s.bpm} onChange={e=>{service.clock.tempo(e.target.value);service.save();}}/></label>
   <input aria-label="Meter numerator" title="Beats per bar" type="number" min="1" max="64" value={s.signature.numerator} onChange={e=>{service.clock.configure({signature:{...s.signature,numerator:Number(e.target.value)}});service.save();}}/>
   <select aria-label="Meter denominator" title="Meter beat unit" value={s.signature.denominator} onChange={e=>{service.clock.configure({signature:{...s.signature,denominator:Number(e.target.value)}});service.save();}}>{[1,2,4,8,16,32].map(x=><option key={x}>{x}</option>)}</select>
   <select title="Ruler units" aria-label="Ruler units" value={mode} onChange={e=>setMode(e.target.value)}><option value="seconds">Seconds</option><option value="beats">Bars / beats / ticks</option><option value="frame">Frames</option></select>
   <input title="Authored duration in seconds" aria-label="Score duration" type="number" min="1" max="86400" value={doc.duration} onChange={e=>service.edit(d=>d.duration=Math.max(1,Number(e.target.value)))}/>
   <Button tip="Open the same timeline in a floating window" onClick={()=>service.openFloating?.()}>▣</Button>
   <Button tip="Export time, scale, tracks and clips as JSON" onClick={exportDoc}>↓</Button>
   <label className="genereti-import" title="Import a performance JSON document">↑<input aria-label="Import performance JSON" type="file" accept=".json,application/json" onChange={async e=>{try{const file=e.target.files[0];if(file.size>2e6)throw Error('File too large');service.load(JSON.parse(await file.text()));service.save();}catch(e){setMessage(e.message);}}}/></label>
  </div>;
 return <div className="genereti-performance" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
  {toolbarHost?createPortal(<div className="genereti-performance genereti-performance-header" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>{transport}</div>,toolbarHost):transport}
  <div className="genereti-performance-toolbar">
   <select aria-label="Automation parameter" title="Select a graph node, then its numeric parameter" value={parameter??''} onChange={e=>setParam(e.target.value)}>{widgets.length?widgets.map(w=><option key={w.name}>{w.name}</option>):<option value="">Select a node to automate</option>}</select>
   <Button tip="Add an automation clip for the selected parameter" disabled={!parameter} onClick={()=>act(()=>setSelected(service.addAutomation(node,parameter).clip.id))}>＋</Button>
   <Button tip="Record changes to this parameter · loop-crossing recordings use unwrapped elapsed time" disabled={!parameter&&!service.recording} aria-pressed={!!service.recording} onClick={()=>act(()=>service.recording?service.stopRecord():service.record(node,parameter))}>●</Button>
   <Button tip="Add current authored parameter value as a key in the selected clip" disabled={!clip} onClick={()=>act(()=>{const track=doc.tracks.find(t=>t.id===clip.trackId),targetNode=service.node(track.target.ref),widget=targetNode?.widgets?.find(w=>w.name===track.target.param),local=clipTime(clip,s.seconds,doc.duration);if(local===null)throw Error('Seek inside the selected clip first');service.edit(()=>addKey(clip,local,widget.value));})}>◇</Button>
   <Button tip="Undo the last timeline edit" onClick={()=>service.undo()}>↶</Button><Button tip="Redo timeline edit" onClick={()=>service.redo()}>↷</Button>
   <select aria-label="Musical launch division" title="Strict next boundary; seeks and loops cancel pending launches" value={launch} onChange={e=>setLaunch(e.target.value)}>{['16n','8n','8nt','4n','beat','bar','2 bars'].map(x=><option key={x}>{x}</option>)}</select>
   <Button tip="Launch a timestamped project cue on the next selected boundary" onClick={()=>act(()=>service.launch(launch,s=>{window.dispatchEvent(new CustomEvent('genereti-performance-cue',{detail:s}));setMessage(`Cue at beat ${s.beat.toFixed(2)}`);}))}>▷|</Button>
   <select aria-label="Global musical root" value={doc.music.root} onChange={e=>service.edit(d=>d.music.root=Number(e.target.value))}>{['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'].map((x,i)=><option value={i} key={x}>{x}</option>)}</select>
   <select aria-label="Global scale" value={doc.music.scale} onChange={e=>service.edit(d=>{d.music.scale=e.target.value;d.music.degrees=SCALES[e.target.value];})}>{Object.keys(SCALES).map(x=><option key={x}>{x}</option>)}</select>
   <input aria-label="Tuning Hz" title="A4 reference tuning" type="number" min="1" max="1000" value={doc.music.tuning} onChange={e=>service.edit(d=>d.music.tuning=Number(e.target.value))}/>
   <span role="status">{message||service.conflicts?.[0]||`${service.pending.length} pending · ${service.recording?'recording':'project time'}`}</span>
  </div>
  <TransportTimeline duration={doc.duration} currentTime={s.seconds} displayMode={mode} fps={30} tempo={s.bpm} signature={s.signature} loopEnabled={service.clock.loop.enabled} loopStart={service.clock.loop.start} loopEnd={service.clock.loop.end} onSeek={t=>service.clock.seek(t)} onSeekCommit={t=>service.clock.seek(t)} onLoopEnabledChange={enabled=>{service.clock.setLoop({...service.clock.loop,enabled});service.save();}} onLoopChange={(start,end)=>{service.clock.setLoop({enabled:true,start,end});service.save();}} timelineMode="clips" timelineTracks={doc.tracks} timelineClips={doc.clips} selectedClipId={selected} onClipSelect={(_element,id)=>setSelected(id)} onTimelineClipEdit={editClip} onTimelineClipDelete={id=>service.edit(d=>d.clips=d.clips.filter(c=>c.id!==id))} onTimelineTrackPatch={(id,patch)=>service.edit(d=>Object.assign(d.tracks.find(t=>t.id===id),patch))} onTimelineTrackMove={(id,index)=>service.edit(d=>{const i=d.tracks.findIndex(t=>t.id===id);d.tracks.splice(Math.max(0,Math.min(d.tracks.length-1,i+index)),0,...d.tracks.splice(i,1));})} onTimelineUndo={()=>service.undo()} onTimelineRedo={()=>service.redo()} automationKeys={automationKeys} revision={service.revision} clock={service.clock} visible={visible}/>
  {clip&&<details><summary>{clip.label} · {clip.keys.length} keys</summary><div className="genereti-keys"><select aria-label="Key interpolation" value={clip.interpolation} onChange={e=>service.edit(()=>clip.interpolation=e.target.value)}><option>linear</option><option>step</option></select>{clip.keys.map(k=><label key={k.id}><input aria-label="Key local seconds" type="number" min="0" step=".01" value={k.time} onChange={e=>service.edit(()=>k.time=Number(e.target.value))}/><input aria-label="Key value" type="number" step=".01" value={k.value} onChange={e=>service.edit(()=>k.value=Number(e.target.value))}/><Button tip="Delete key" onClick={()=>service.edit(()=>clip.keys=clip.keys.filter(x=>x!==k))}>×</Button></label>)}</div></details>}
 </div>;
}
export function mountTimeline(container,service,{toolbarHost,visible}={}){const root=createRoot(container);root.render(<Timeline service={service} toolbarHost={toolbarHost} visible={visible}/>);return()=>root.unmount();}
