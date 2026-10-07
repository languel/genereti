import {TIME_PPQ,resolveTimeValue,parseTimeValue} from './timeValue.js';
const finite=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
const clamp=(x,a,b,d)=>Math.max(a,Math.min(b,finite(x,d)));
export class Transport {
 constructor(config={},now=()=>performance.now()/1000){this.now=now;this.listeners=new Set();this.epoch=0;this.iteration=0;this.serial=0;this.anchor=now();this.position=0;this.playing=false;this.configure(config);}
 configure(config={}){this.position=this.read().seconds;this.anchor=this.now();this.bpm=clamp(config.bpm??this.bpm,20,400,120);this.rate=clamp(config.rate??this.rate,.01,8,1);this.signature={numerator:clamp(config.signature?.numerator??this.signature?.numerator,1,64,4),denominator:[1,2,4,8,16,32].includes(Number(config.signature?.denominator))?Number(config.signature.denominator):this.signature?.denominator??4};this.loop={enabled:config.loop?.enabled??this.loop?.enabled??false,start:Math.max(0,finite(config.loop?.start,this.loop?.start??0)),end:Math.max(.01,finite(config.loop?.end,this.loop?.end??8))};if(this.loop.end<=this.loop.start)this.loop.end=this.loop.start+.01;this.tempoMap=config.tempoMap?.length?config.tempoMap.map(x=>({...x})):this.tempoMap??[{seconds:0,quarterNotes:0,bpm:this.bpm}];}
 context(){return {tempo:this.bpm,signature:this.signature,fps:30,sampleRate:48000};}
 qnAt(seconds){const segment=[...this.tempoMap].reverse().find(x=>x.seconds<=seconds)??this.tempoMap[0];return segment.quarterNotes+(seconds-segment.seconds)*segment.bpm/60;}
 secondsAt(qn){const segment=[...this.tempoMap].reverse().find(x=>x.quarterNotes<=qn)??this.tempoMap[0];return segment.seconds+(qn-segment.quarterNotes)*60/segment.bpm;}
 read(at=this.now()){
  let seconds=(this.position??0)+(this.playing?Math.max(0,at-this.anchor)*(this.rate??1):0),wraps=0;
  if(this.loop?.enabled&&seconds>=this.loop.end){const length=this.loop.end-this.loop.start;wraps=1+Math.floor((seconds-this.loop.end)/length);seconds=this.loop.start+(seconds-this.loop.end)%length;}
  const qn=this.tempoMap?this.qnAt(seconds):0,beat=qn/(4/(this.signature?.denominator??4)),numerator=this.signature?.numerator??4;
  return {version:1,seconds,quarterNotes:qn,ticks:Math.floor(qn*TIME_PPQ+1e-7),ppq:TIME_PPQ,beat,bar:Math.floor(beat/numerator),beatInBar:beat%numerator,phase:qn%1,bpm:this.bpm??120,signature:this.signature??{numerator:4,denominator:4},loop:{...this.loop},rate:this.rate??1,playing:this.playing,epoch:this.epoch,iteration:this.iteration+wraps,serial:this.serial,monotonic:at,wallTime:Date.now()/1000};
 }
 settle(){const s=this.read();this.position=s.seconds;this.iteration=s.iteration;this.anchor=this.now();return s;}
 emit(type){const event={type,...this.read(),serial:++this.serial};for(const fn of this.listeners)fn(event);return event;}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 play(){if(!this.playing){this.anchor=this.now();this.playing=true;this.emit('play');}}
 pause(){if(this.playing){this.settle();this.playing=false;this.epoch++;this.emit('pause');}}
 seek(value,{pause=true}={}){this.settle();if(pause)this.playing=false;this.position=Math.max(0,finite(value));this.anchor=this.now();this.iteration=0;this.epoch++;this.emit('seek');}
 stop(){this.seek(0);this.emit('stop');}
 tempo(value){const s=this.settle(),bpm=clamp(value,20,400,120);if(bpm===this.bpm)return;this.tempoMap=this.tempoMap.filter(x=>x.seconds<s.seconds);this.tempoMap.push({seconds:s.seconds,quarterNotes:s.quarterNotes,bpm});this.bpm=bpm;this.epoch++;this.emit('tempo');}
 setLoop(loop){this.settle();this.configure({loop});this.epoch++;this.emit('loop');}
 serialize(){return {bpm:this.bpm,rate:this.rate,signature:this.signature,loop:{...this.loop},tempoMap:this.tempoMap.map(x=>({...x}))};}
 quantum(expression){const p=parseTimeValue(expression,this.context());if(!p.ok||p.descriptor.seconds<=0)throw Error(p.error??'Use a positive time division');return resolveTimeValue(expression,this.context())*this.bpm/60;}
 // Strict-next musical launch; pending work is cancelled by any discontinuity.
 nextBoundary(expression){const q=this.quantum(expression),s=this.read();return {quarterNotes:(Math.floor((s.quarterNotes+1e-8)/q)+1)*q,epoch:s.epoch,iteration:s.iteration};}
}
// One cursor per consumer. Returns only future deadlines; never a stalled backlog.
export class MusicalCursor {
 constructor(){this.key='';this.next=null;this.missed=0;}
 deadlines(clock,{division=4,swing=0,ahead=.12,lead=.015}={}){
  const s=clock.read(),key=`${s.epoch}:${s.iteration}:${division}:${swing}`;
  if(!s.playing){this.key='';return [];}
  const period=60/s.bpm/division;
  const scoreDeadline=index=>clock.secondsAt((index+(index%2?swing:0))/division);
  if(this.key!==key){this.key=key;this.next=Math.max(0,Math.ceil((s.quarterNotes-1e-8)*division));}
  if(scoreDeadline(this.next)<s.seconds-lead){const target=Math.ceil(s.quarterNotes*division);this.missed+=Math.max(0,target-this.next);this.next=target;}
  const out=[];
  for(let count=0;count<64;count++){
   const index=this.next,seconds=scoreDeadline(index),delay=(seconds-s.seconds)/s.rate;
   if(delay>=ahead||clock.loop.enabled&&seconds>=clock.loop.end)break;
   this.next++;
   if(delay<-.002)continue;
   out.push({index,delay:Math.max(lead,delay),duration:period/s.rate,epoch:s.epoch,iteration:s.iteration,id:`${s.epoch}:${s.iteration}:${index}`});
  }
  return out;
 }
}
