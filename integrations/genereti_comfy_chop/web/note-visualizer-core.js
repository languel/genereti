import {heldNotes} from './audio-sequence.js';
export class NoteHistory {
 constructor(){this.notes=[];this.active=new Map();this.controls=[];}
 update(data,time,seconds=8){
  const held=heldNotes(data),keys=new Set(held.map(n=>n.key));
  for(const [key,event] of this.active)if(!keys.has(key)){event.released=time;this.active.delete(key);}
  for(const note of held){let event=this.active.get(note.key);if(!event){event={...note,start:time,end:time};this.notes.push(event);this.active.set(note.key,event);}event.end=time;event.velocity=Math.max(0,Math.min(1,Number(note.velocity)||0));}
  this.notes=this.notes.filter(n=>time-n.end<=seconds).slice(-1024);
  this.controls=Object.entries(data?.channels??{}).filter(([key])=>!/(?:note\d*$|gate$|velocity$)/.test(key)).slice(0,16).map(([name,a])=>({name,value:Number(a.at(-1))||0}));
 }
 reset(){this.notes=[];this.active.clear();this.controls=[];}
}
export function paintNotes(canvas,history,time,settings={},color='#ddd'){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,seconds=Math.max(.5,Number(settings.history_seconds)||8),low=Number(settings.pitch_low??24),high=Math.max(low+1,Number(settings.pitch_high??96)),controlHeight=settings.show_controls!==false?Math.min(64,h*.2):0,plotHeight=h-controlHeight,row=plotHeight/(high-low+1),size=Number(settings.size)||1;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#101010';ctx.fillRect(0,0,w,h);ctx.strokeStyle=color;ctx.lineWidth=1;
 ctx.globalAlpha=.12;for(let pitch=Math.ceil(low/12)*12;pitch<=high;pitch+=12){const y=plotHeight-(pitch-low)*row;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle=color;
 for(const note of history.notes){if(note.note<low||note.note>high)continue;const age=Math.max(0,time-note.end),fade=Math.max(.05,Number(settings.fade)||1);ctx.globalAlpha=note.released===undefined?.9:Math.max(0,1-age/fade)*.9;if(!ctx.globalAlpha)continue;const end=w-(time-note.end)*w/seconds,start=w-(time-note.start)*w/seconds,y=plotHeight-(note.note-low+.5)*row,r=Math.max(2,row*.45*size*(.25+note.velocity));
  if(settings.shape==='circle'){ctx.beginPath();ctx.arc(end-r,y,r,0,Math.PI*2);ctx.fill();}else if(settings.shape==='diamond'){ctx.beginPath();ctx.moveTo(end,y-r);ctx.lineTo(end+r,y);ctx.lineTo(end,y+r);ctx.lineTo(end-r,y);ctx.closePath();ctx.fill();}else ctx.fillRect(start,y-r,Math.max(3,end-start),2*r);
 }
 ctx.globalAlpha=1;ctx.font='11px monospace';ctx.fillText(`${low}–${high} · ${seconds}s`,6,14);
 if(controlHeight){const count=Math.max(1,history.controls.length);history.controls.forEach(({name,value},i)=>{const x=i*w/count,level=Math.min(1,Math.abs(value));ctx.globalAlpha=.35;ctx.fillRect(x+2,h-level*(controlHeight-15),w/count-4,level*(controlHeight-15));ctx.globalAlpha=1;ctx.fillText(name.slice(0,12),x+3,h-3);});}
}
