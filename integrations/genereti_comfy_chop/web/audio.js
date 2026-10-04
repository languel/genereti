// Web Audio voice structure inspired by Underscores' expressiveSynth:
// filtered oscillator/FM/reed voices, ADSR, expression and vibrato. No samples.
let context,users=0;
export async function acquireAudio(){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Web Audio unavailable');context??=new C({latencyHint:'interactive'});await context.resume();users++;return context;}
export function releaseAudio(){users=Math.max(0,users-1);if(!users)context?.suspend();}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const hz=note=>440*Math.pow(2,(note-69)/12);
export class Instrument{
 constructor(ctx,drums=false){this.ctx=ctx;this.drums=drums;this.voices=new Set();this.output=ctx.createGain();this.output.gain.value=0;this.output.connect(ctx.destination);this.held=null;this.last={gate:false,note:0};this.noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const samples=this.noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
 voice(){const gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();filter.connect(gain);gain.connect(this.output);const v={gain,filter,sources:[],nodes:[gain,filter],ended:false};this.voices.add(v);if(this.voices.size>32)this.destroy(this.voices.values().next().value);return v;}
 oscillator(v,type,freq,destination=v.filter){const osc=this.ctx.createOscillator();osc.type=type;osc.frequency.value=freq;osc.connect(destination);osc.start();v.sources.push(osc);return osc;}
 noiseSource(v,destination=v.filter){const source=this.ctx.createBufferSource();source.buffer=this.noise;source.loop=true;source.connect(destination);source.start();v.sources.push(source);return source;}
 destroy(v){if(v.ended)return;v.ended=true;for(const source of v.sources){try{source.stop();}catch{}source.disconnect();}for(const node of v.nodes)node.disconnect();this.voices.delete(v);}
 finish(v,seconds){if(v.finishing)return;v.finishing=true;const end=this.ctx.currentTime+seconds+.03;let remaining=v.sources.length;for(const source of v.sources){source.onended=()=>{if(--remaining===0)this.destroy(v);};try{source.stop(end);}catch{}}}
 release(v,seconds){if(!v||v.ended||v.finishing)return;const now=this.ctx.currentTime,p=v.gain.gain;p.cancelAndHoldAtTime(now);p.setTargetAtTime(0,now,Math.max(.005,seconds)/3);this.finish(v,seconds);}
 update(note,v){const now=this.ctx.currentTime;this.output.gain.setTargetAtTime(clamp(v.level,0,1)*.3,now,.01);
  if(!note.gate){this.release(this.held,clamp(v.release,.005,10));this.held=null;this.last=note;return;}
  const changed=!this.last.gate||note.note!==this.last.note;
  if(this.drums){if(changed)this.drum(note,v);this.last=note;return;}
  if(changed){this.release(this.held,clamp(v.release,.005,10));const voice=this.voice();this.held=voice;voice.model=v.voice;const frequency=hz(note.note),carrier=this.oscillator(voice,v.voice==='subtractive'?'sawtooth':v.voice==='reed'?'square':'sine',frequency);voice.carrier=carrier;
   if(v.voice==='fm'){const modGain=this.ctx.createGain();modGain.gain.value=frequency*.7;modGain.connect(carrier.frequency);voice.mod=this.oscillator(voice,'sine',frequency*2,modGain);voice.nodes.push(modGain);}
   if(v.voice==='reed'){const noiseGain=this.ctx.createGain();noiseGain.gain.value=.025;noiseGain.connect(voice.filter);this.noiseSource(voice,noiseGain);voice.nodes.push(noiseGain);}
   const vibratoGain=this.ctx.createGain();vibratoGain.connect(carrier.frequency);voice.vibrato=this.oscillator(voice,'sine',Number(v.vibrato_rate),vibratoGain);voice.vibratoGain=vibratoGain;voice.nodes.push(vibratoGain);
   const attack=clamp(v.attack,.001,10),decay=clamp(v.decay,.001,10);voice.gain.gain.setValueAtTime(0,now);voice.gain.gain.linearRampToValueAtTime(note.velocity,now+attack);voice.gain.gain.linearRampToValueAtTime(note.velocity*clamp(v.sustain,0,1),now+attack+decay);
  }
  const voice=this.held;if(voice){voice.filter.type='lowpass';voice.filter.frequency.setTargetAtTime(clamp(v.cutoff,20,Math.min(18000,this.ctx.sampleRate*.45)),now,.02);voice.filter.Q.setTargetAtTime(clamp(v.resonance,.1,10),now,.02);voice.carrier.frequency.setTargetAtTime(hz(note.note),now,Math.max(.001,Number(v.glide)));voice.vibrato.frequency.setTargetAtTime(Number(v.vibrato_rate),now,.02);voice.vibratoGain.gain.setTargetAtTime(hz(note.note)*(Math.pow(2,Number(v.vibrato)/12)-1),now,.02);}
  this.last=note;
 }
 drum(note,v){const voice=this.voice(),now=this.ctx.currentTime,decay=clamp(v.decay,.03,2),tone=clamp(v.tone,.25,2),pitch=Math.round(note.note);voice.gain.gain.setValueAtTime(note.velocity*.8,now);voice.gain.gain.exponentialRampToValueAtTime(.0001,now+decay);if(pitch===35||pitch===36){voice.filter.type='lowpass';voice.filter.frequency.value=1200;const osc=this.oscillator(voice,'sine',150*tone);osc.frequency.exponentialRampToValueAtTime(40*tone,now+decay*.8);}else if(pitch===38||pitch===40){voice.filter.type='bandpass';voice.filter.frequency.value=1600*tone;voice.filter.Q.value=.7;this.noiseSource(voice);this.oscillator(voice,'triangle',180*tone);}else{voice.filter.type='highpass';voice.filter.frequency.value=Math.min(10000,6500*tone);this.noiseSource(voice);voice.gain.gain.exponentialRampToValueAtTime(.0001,now+Math.min(decay,pitch===46?.4:.08));}this.finish(voice,decay);}
 stop(){for(const v of [...this.voices])this.destroy(v);this.output.disconnect();this.held=null;}
}
