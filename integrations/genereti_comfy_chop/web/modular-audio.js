import {ANALYSIS_KINDS,analysisFrame} from './audio-analysis.js';
// Native Web Audio graph: bus connections retain AudioNodes, never PCM copies.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const hz=n=>440*2**((n-69)/12);
const targets=new WeakMap();
function smooth(p,value,now){if(!targets.has(p))p.setValueAtTime(value,now);else if(targets.get(p)!==value)p.setTargetAtTime(value,now,.015);targets.set(p,value);}
export class AudioPatch {
 constructor(ctx){this.ctx=ctx;this.modules=new Map();this.edges=new Map();this.noise=null;}
 sync(defs,outputs){
  const wanted=new Set(),visiting=new Set();const visit=id=>{if(visiting.has(id))throw Error('Audio cable cycles are unsupported; use audio.delay for feedback');if(wanted.has(id))return;const d=defs.get(id);if(!d)return;visiting.add(id);for(const source of Object.values(d.inputs??{}))visit(source);visiting.delete(id);wanted.add(id);};for(const id of outputs)visit(id);
  for(const [id,m] of this.modules)if(!wanted.has(id)){this.dispose(m);this.modules.delete(id);}
  for(const id of wanted){const d=defs.get(id);let m=this.modules.get(id);if(m&&m.kind!==d.kind){this.dispose(m);this.modules.delete(id);m=null;}if(!m){m=this.create(d.kind);this.modules.set(id,m);}m.settings=d.settings;this.update(m,d.settings);}
  const next=new Map();for(const id of wanted){const d=defs.get(id),m=this.modules.get(id);for(const [slot,source] of Object.entries(d.inputs??{})){const from=this.modules.get(source)?.output,to=m.inputs[slot];if(from&&to)next.set(`${source}:${id}:${slot}`,{from,to});}if(outputs.has(id)&&m.kind==='Output')next.set(`${id}:destination`,{from:m.output,to:this.ctx.destination});}
  for(const [key,e] of this.edges)if(!next.has(key)||next.get(key).from!==e.from||next.get(key).to!==e.to){try{e.from.disconnect(e.to);}catch{}}
  for(const [key,e] of next)if(!this.edges.has(key)||this.edges.get(key).from!==e.from||this.edges.get(key).to!==e.to)e.from.connect(e.to);this.edges=next;
 }
 create(kind){const c=this.ctx,m={kind,nodes:[],inputs:{},voices:new Set(),held:new Map()};const make=method=>{const n=c[method]();m.nodes.push(n);return n;};m.output=make('createGain');
  if(kind==='Synth'||kind==='DrumKit')return m;
  if(kind==='Mixer'){for(let i=1;i<=4;i++){const gain=make('createGain'),pan=make('createStereoPanner');gain.connect(pan);pan.connect(m.output);m.inputs[`input_${i}`]=gain;m[`pan_${i}`]=pan;}return m;}
  const input=make('createGain');m.inputs.input=input;
  if(kind==='Gain'){m.pan=make('createStereoPanner');input.connect(m.pan);m.pan.connect(m.output);}
  else if(kind==='Filter'){m.filter=make('createBiquadFilter');input.connect(m.filter);m.filter.connect(m.output);}
  else if(kind==='Delay'){m.delay=c.createDelay(2);m.nodes.push(m.delay);m.feedback=make('createGain');m.wet=make('createGain');m.dry=make('createGain');input.connect(m.dry);m.dry.connect(m.output);input.connect(m.delay);m.delay.connect(m.feedback);m.feedback.connect(m.delay);m.delay.connect(m.wet);m.wet.connect(m.output);}
  else if(ANALYSIS_KINDS.has(kind)){input.channelCount=2;input.channelCountMode='explicit';input.connect(m.output);m.split=c.createChannelSplitter(2);m.nodes.push(m.split);input.connect(m.split);m.analysers=[make('createAnalyser'),make('createAnalyser')];m.analysers.forEach((a,i)=>m.split.connect(a,i));}
  else if(kind==='Output'){m.compressor=make('createDynamicsCompressor');m.analyser=make('createAnalyser');m.analyser.fftSize=512;m.samples=new Float32Array(512);input.connect(m.compressor);m.compressor.connect(m.output);m.output.connect(m.analyser);}
  else input.connect(m.output);return m;
 }
 update(m,s){if(ANALYSIS_KINDS.has(m.kind)){const size=Number(s.fft_size)||1024;for(const a of m.analysers){a.fftSize=size;a.smoothingTimeConstant=clamp(s.smoothing,0,.99);}if(m.left?.length!==size){m.left=new Float32Array(size);m.right=new Float32Array(size);m.db=new Float32Array(size/2);m.dbRight=new Float32Array(size/2);}return;}const now=this.ctx.currentTime;if(m.kind==='Mixer'){const solo=[1,2,3,4].some(i=>s[`solo_${i}`]);for(let i=1;i<=4;i++){smooth(m.inputs[`input_${i}`].gain,s[`mute_${i}`]||(solo&&!s[`solo_${i}`])?0:clamp(s[`level_${i}`],0,2),now);smooth(m[`pan_${i}`].pan,clamp(s[`pan_${i}`],-1,1),now);}smooth(m.output.gain,clamp(s.master,0,1),now);}
  else if(m.kind==='Gain'||m.kind==='Output'){smooth(m.output.gain,s.mute?0:clamp(s.level,0,2),now);if(m.pan)smooth(m.pan.pan,clamp(s.pan,-1,1),now);}
  else if(m.kind==='Filter'){m.filter.type=s.mode;smooth(m.filter.frequency,clamp(s.cutoff,20,18000),now);smooth(m.filter.Q,clamp(s.resonance,.1,12),now);}
  else if(m.kind==='Delay'){smooth(m.delay.delayTime,clamp(s.seconds,.01,2),now);smooth(m.feedback.gain,clamp(s.feedback,0,.85),now);smooth(m.wet.gain,clamp(s.mix,0,1),now);smooth(m.dry.gain,1-clamp(s.mix,0,1),now);}
  else if(m.kind==='Synth'||m.kind==='DrumKit'){smooth(m.output.gain,clamp(s.level,0,1)*.3,now);for(const v of m.voices)if(v.filter&&m.kind==='Synth'){smooth(v.filter.frequency,clamp(s.cutoff,20,18000),now);smooth(v.filter.Q,clamp(s.resonance,.1,12),now);}}
 }
 trigger(id,note,time,duration,velocity=1){const m=this.modules.get(id);if(!m||!['Synth','DrumKit'].includes(m.kind))return;const c=this.ctx,s=m.settings,t=Math.max(c.currentTime,time),v={sources:[],nodes:[],ended:false,time:t};m.voices.add(v);while(m.voices.size>clamp(s.polyphony??24,1,32))this.destroyVoice(m,m.voices.values().next().value);
  const gain=c.createGain(),filter=c.createBiquadFilter();v.gain=gain;v.filter=filter;v.nodes.push(gain,filter);filter.connect(gain);gain.connect(m.output);filter.frequency.value=clamp(s.cutoff??18000,20,18000);filter.Q.value=clamp(s.resonance??.7,.1,12);
  const osc=(type,freq,dest=filter)=>{const o=c.createOscillator();o.type=type;o.frequency.value=freq;o.connect(dest);o.start(t);v.sources.push(o);return o;};
  if(m.kind==='DrumKit'){
   const decay=clamp(s.decay,.03,2),tone=clamp(s.tone,.25,2);duration=decay;
   if(note===35||note===36){const o=osc('sine',150*tone);o.frequency.exponentialRampToValueAtTime(45*tone,t+decay);}
   else{this.noise??=c.createBuffer(1,c.sampleRate,c.sampleRate);if(!this.noiseFilled){const a=this.noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;this.noiseFilled=true;}const n=c.createBufferSource();n.buffer=this.noise;n.connect(filter);n.start(t);v.sources.push(n);filter.type='highpass';filter.frequency.value=(note===38||note===40?1000:6500)*tone;if(note===38||note===40)osc('triangle',180*tone);}
   gain.gain.setValueAtTime(Math.max(.0001,velocity),t);gain.gain.exponentialRampToValueAtTime(.0001,t+decay);this.finish(m,v,t+decay+.02);return v;
  }
  const carrier=osc(s.voice==='subtractive'?'sawtooth':s.voice==='reed'?'square':'sine',hz(note));v.carrier=carrier;
  if(s.voice==='fm'){const g=c.createGain();g.gain.value=hz(note)*.7;g.connect(carrier.frequency);v.nodes.push(g);osc('sine',hz(note)*2,g);}
  if(Number(s.vibrato)>0){const g=c.createGain();g.gain.value=hz(note)*(2**(Number(s.vibrato)/12)-1);g.connect(carrier.frequency);v.nodes.push(g);osc('sine',Number(s.vibrato_rate),g);}
  const attack=clamp(s.attack,.001,5),decay=clamp(s.decay,.001,5);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(velocity,t+attack);gain.gain.linearRampToValueAtTime(velocity*clamp(s.sustain,0,1),t+attack+decay);
  if(Number.isFinite(duration)){const releaseAt=t+Math.max(duration,attack+decay);gain.gain.setValueAtTime(velocity*clamp(s.sustain,0,1),releaseAt);gain.gain.linearRampToValueAtTime(0,releaseAt+clamp(s.release,.005,5));this.finish(m,v,releaseAt+clamp(s.release,.005,5)+.02);}return v;
 }
 finish(m,v,time){let remaining=v.sources.length;for(const source of v.sources){source.onended=()=>{if(--remaining===0)this.destroyVoice(m,v);};source.stop(time);}}
 release(m,v){if(!v||v.ended)return;const t=this.ctx.currentTime,p=v.gain.gain;p.cancelAndHoldAtTime(t);const seconds=clamp(m.settings.release??.1,.005,5);p.linearRampToValueAtTime(0,t+seconds);this.finish(m,v,t+seconds+.02);}
 setHeld(id,notes){const m=this.modules.get(id);if(!m)return;const next=new Map(notes.map(n=>[n.key,n]));for(const [key,v] of m.held)if(!next.has(key)){this.release(m,v.voice);m.held.delete(key);}else if(next.get(key).note!==v.note){if(Number(m.settings.glide)>0&&v.voice?.carrier&&!v.voice.ended){v.voice.carrier.frequency.setTargetAtTime(hz(next.get(key).note),this.ctx.currentTime,Number(m.settings.glide));v.note=next.get(key).note;}else{this.release(m,v.voice);m.held.delete(key);}}for(const [key,n] of next)if(!m.held.has(key)){const voice=this.trigger(id,n.note,this.ctx.currentTime,Infinity,n.velocity);m.held.set(key,{...n,voice});}}
 clearVoices(id){const m=this.modules.get(id);if(m){for(const v of [...m.voices])this.destroyVoice(m,v);m.held.clear();}}
 destroyVoice(m,v){if(!v||v.ended)return;v.ended=true;for(const source of v.sources){try{source.stop();}catch{}source.disconnect();}for(const n of v.nodes)n.disconnect();m.voices.delete(v);}
 analyze(id){const m=this.modules.get(id);if(!m?.analysers)return null;m.analysers[0].getFloatTimeDomainData(m.left);m.analysers[1].getFloatTimeDomainData(m.right);m.analysers[0].getFloatFrequencyData(m.db);m.analysers[1].getFloatFrequencyData(m.dbRight);for(let i=0;i<m.db.length;i++){const power=(10**(m.db[i]/10)+10**(m.dbRight[i]/10))*.5;m.db[i]=power>0?10*Math.log10(power):-Infinity;}return analysisFrame(m.kind,m.left,m.right,m.db,this.ctx.sampleRate,this.ctx.currentTime);}
 meter(id){const m=this.modules.get(id);if(!m?.analyser)return {rms:0,peak:0};m.analyser.getFloatTimeDomainData(m.samples);let sum=0,peak=0;for(const x of m.samples){sum+=x*x;peak=Math.max(peak,Math.abs(x));}return {rms:Math.sqrt(sum/m.samples.length),peak};}
 dispose(m){for(const v of [...m.voices])this.destroyVoice(m,v);for(const n of m.nodes)n.disconnect();}
 stop(){for(const m of this.modules.values())this.dispose(m);this.modules.clear();this.edges.clear();}
}
