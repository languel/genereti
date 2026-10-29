import {test} from 'node:test';import assert from 'node:assert/strict';
import {pattern,stepTime,events,heldNotes,noteFrame,euclidean,transformPattern} from '../integrations/genereti_comfy_chop/web/audio-sequence.js';
import {AudioPatch} from '../integrations/genereti_comfy_chop/web/modular-audio.js';
class Param{value=0;setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}cancelAndHoldAtTime(){}}
class Node{gain=new Param();pan=new Param();frequency=new Param();Q=new Param();delayTime=new Param();connections=new Set();connect(n){this.connections.add(n);}disconnect(n){if(n)this.connections.delete(n);else this.connections.clear();}start(){}stop(){}getFloatTimeDomainData(a){a.fill(.2);}getFloatFrequencyData(a){a.fill(-20);}}
function context(){const c={currentTime:0,sampleRate:48000,destination:new Node(),made:0,createBuffer(){return {getChannelData(){return new Float32Array(48000);}}}};for(const method of ['Gain','StereoPanner','BiquadFilter','Delay','DynamicsCompressor','Analyser','ChannelSplitter','Oscillator','BufferSource','Convolver','WaveShaper'])c['create'+method]=()=>{c.made++;return new Node();};return c;}
test('audio-clock sequencing handles rests, simultaneous drums, swing and validation',()=>{const p=pattern('60 - 67');assert.deepEqual(events(p,1,1,.1,.6),[]);assert.equal(events(p,2,1,.1,.6)[0].note,67);assert.equal(stepTime(1,0,120,4,.2),.15);const drums=pattern('kick:10;snare:10;hat:01',true);assert.equal(events(drums,0,0,.1,1).length,2);assert.throws(()=>pattern('kick:4',true));assert.equal(events(pattern('kick:123;snare~:111',true),1,0,.1,.5)[0].velocity,.5*1.35);assert.equal(events(pattern('kick:123;snare~:111',true),0,0,.1,.5).length,1);assert.throws(()=>pattern('128'));});
test('MIDI input preserves simultaneous notes and fractional plain pitch',()=>{assert.equal(heldNotes({channels:{'ch1.note60':[1],'ch1.note64':[.5]}}).length,2);assert.equal(heldNotes({channels:{note:[60.5],gate:[1]}})[0].note,60.5);});
test('routes are reused; mixer mute/solo affect native gain; disconnect removes output',()=>{const c=context(),p=new AudioPatch(c),defs=new Map([[1,{kind:'Synth',settings:{level:.4},inputs:{}}],[2,{kind:'Mixer',settings:{master:.7,level_1:.8,level_2:.6,solo_2:true},inputs:{input_1:1}}],[3,{kind:'Output',settings:{level:.6},inputs:{input:2}}]]);p.sync(defs,new Set([3]));const allocated=c.made;p.sync(defs,new Set([3]));assert.equal(c.made,allocated);assert.equal(p.modules.get(2).inputs.input_1.gain.value,0);assert.equal(p.modules.get(2).inputs.input_2.gain.value,.6);assert(p.modules.get(3).output.connections.has(c.destination));p.sync(defs,new Set());assert.equal(p.modules.size,0);assert.equal(p.edges.size,0);});
test('reject external feedback cycles, while delay feedback is bounded',()=>{const p=new AudioPatch(context());assert.throws(()=>p.sync(new Map([[1,{kind:'Gain',settings:{},inputs:{input:2}}],[2,{kind:'Gain',settings:{},inputs:{input:1}}]]),new Set([1])),/cycles/);p.sync(new Map([[1,{kind:'Delay',settings:{feedback:2,seconds:.2,mix:.4},inputs:{}}]]),new Set([1]));assert.equal(p.modules.get(1).feedback.gain.value,.85);});
test('polyphony caps voices and panic disposes their native resources',()=>{const p=new AudioPatch(context());p.sync(new Map([[1,{kind:'Synth',settings:{level:.4,voice:'sine',polyphony:2,attack:.01,decay:.1,sustain:.6,release:.2},inputs:{}}]]),new Set([1]));for(const n of [60,64,67])p.trigger(1,n,0,.2,.6);assert.equal(p.modules.get(1).voices.size,2);p.stop();assert.equal(p.modules.size,0);});

test('sequence CHOP frames keep rests silent and represent simultaneous drum notes',()=>{assert.equal(noteFrame(pattern('60 -'),1,true,.7,0,4).channels.gate[0],0);const f=noteFrame(pattern('kick:1;snare:1;hat:0',true),0,true,.7,0,4);assert.equal(heldNotes(f).length,2);assert.equal(heldNotes(noteFrame(pattern('kick:1',true),0,false,.7,0,4)).length,0);});

test('analysis taps preserve audio, reuse analysers and expose stereo/control signals',()=>{
 const c=context(),p=new AudioPatch(c),defs=new Map([[1,{kind:'Synth',settings:{level:.4},inputs:{}}],[2,{kind:'Analyze',settings:{fft_size:1024,smoothing:.5},inputs:{input:1}}],[3,{kind:'Output',settings:{level:.6},inputs:{input:2}}]]);
 p.sync(defs,new Set([3]));const m=p.modules.get(2),allocated=c.made;
 assert(m.inputs.input.connections.has(m.output));assert.equal(m.inputs.input.channelCountMode,'explicit');assert.equal(m.analysers.length,2);
 p.sync(defs,new Set([3]));assert.equal(c.made,allocated);
 const frame=p.analyze(2);assert(Math.abs(frame.rms-.2)<1e-6);assert.equal(frame.channels.rms.length,1);assert.equal(frame.sampleRate,40);assert.equal(frame.correlation,1);
 defs.get(2).settings.fft_size=2048;p.sync(defs,new Set([3]));assert.equal(m.left.length,2048);assert.equal(c.made,allocated);
 p.stop();assert.equal(m.output.connections.size,0);
});
test('every drum voice triggers and cleans up; muted rows and accents shape pattern events',()=>{
 const p=new AudioPatch(context());p.sync(new Map([[1,{kind:'DrumKit',settings:{level:.4,decay:.2,tone:1,polyphony:32},inputs:{}}]]),new Set([1]));
 for(const note of [35,36,37,38,39,41,42,45,46,51,56,60])assert.ok(p.trigger(1,note,0,.2,.8),`note ${note}`);
 assert.equal(p.modules.get(1).voices.size,12);p.stop();assert.equal(p.modules.size,0);
 const rows=pattern('kick:123;snare~:111;rim:010',true);
 assert.deepEqual(events(rows,0,0,.1,.5).map(e=>[e.note,e.velocity]),[[36,.5]]);
 assert.deepEqual(events(rows,1,0,.1,.5).map(e=>[e.note,+e.velocity.toFixed(3)]),[[36,.675],[37,.5]]);
 assert.equal(events(rows,2,0,.1,.5)[0].velocity,.5*.4);
});
test('synth takes waveform, filter mode, detune and a filter envelope without clobbering it each tick',()=>{
 const p=new AudioPatch(context());const settings={level:.4,voice:'sine',wave:'square',filter_mode:'bandpass',detune:25,filter_env:.8,cutoff:1000,resonance:1,polyphony:4,attack:.01,decay:.2,sustain:.5,release:.2};
 p.sync(new Map([[1,{kind:'Synth',settings,inputs:{}}]]),new Set([1]));
 const v=p.trigger(1,60,0,.5,.7);assert.equal(v.filter.type,'bandpass');assert.ok(v.filterEnvUntil>0);
 p.sync(new Map([[1,{kind:'Synth',settings:{...settings,filter_mode:'highpass'},inputs:{}}]]),new Set([1]));assert.equal(v.filter.type,'highpass');
 const without=p.trigger(1,64,0,.5,.7);assert.ok(without.filter.type==='highpass'&&without.filterEnvUntil>0);
 p.sync(new Map([[1,{kind:'Synth',settings:{...settings,filter_env:0},inputs:{}}]]),new Set([1]));assert.equal(p.trigger(1,67,0,.5,.7).filterEnvUntil,undefined);p.stop();
});
test('mixer reports per-strip and master levels for the meters',()=>{
 const p=new AudioPatch(context());p.sync(new Map([[1,{kind:'Mixer',settings:{level_1:.7,level_2:.7,level_3:.7,level_4:.7,pan_1:0,pan_2:0,pan_3:0,pan_4:0,master:.7},inputs:{}}]]),new Set([1]));
 const levels=p.levels(1);assert.equal(levels.strips.length,8);assert.ok(levels.strips.every(x=>Math.abs(x-.2)<1e-6));assert.ok(Math.abs(levels.master-.2)<1e-6);assert.equal(p.levels(99),null);p.stop();
});

test('euclidean rings distribute pulses, rotate, and handle empty/full cases',()=>{for(const [n,k] of [[16,5],[7,3],[8,0],[8,8]]){const steps=euclidean(n,k,0,36)[0].steps;assert.equal(steps.filter(x=>x>=0).length,k);}const a=euclidean(8,3,0,60)[0].steps,b=euclidean(8,3,2,60)[0].steps;assert.deepEqual(b,[...a.slice(-2),...a.slice(0,-2)]);});
test('ratchets preserve step length and pattern transforms retain rests',()=>{const e=events(pattern('60'),0,1,.4,.8,4,.5);assert.deepEqual(e.map(x=>x.time),[1,1.125,1.25,1.375]);assert(e.every(x=>x.duration===.1));assert.equal(transformPattern('60 - 64 67','shift',1),'67 60 - 64');assert.equal(transformPattern('60 - 64','reverse'),'64 - 60');assert.equal(transformPattern('61 - 66','quantize',0,0,'major'),'60 - 65');});
test('plucked and granular voices and modular effects create and release their routes',()=>{const c=context(),p=new AudioPatch(c),defs=new Map([[1,{kind:'Karplus',settings:{level:.3,decay:1,damping:.5,polyphony:4},inputs:{}}],[2,{kind:'Granular',settings:{level:.3,grain_size:.05,density:8,spread:.2,polyphony:4},inputs:{}}],[3,{kind:'Reverb',settings:{mix:.3,decay:.1},inputs:{input:1}}],[4,{kind:'Distortion',settings:{mix:.5,drive:4},inputs:{input:3}}]]);p.sync(defs,new Set([2,4]));assert.ok(p.trigger(1,60,0,.2,.5));assert.ok(p.trigger(2,64,0,.2,.5));assert.ok(p.modules.get(3).effect.buffer);assert.equal(p.modules.get(4).effect.curve.length,2048);p.stop();assert.equal(p.modules.size,0);});

test('waveform taps are lazy, reused and removed without disconnecting audio routes',()=>{const c=context(),p=new AudioPatch(c),defs=new Map([[1,{kind:'Gain',settings:{level:.5,pan:0},inputs:{}}],[2,{kind:'Output',settings:{level:.5},inputs:{input:1}}]]);p.sync(defs,new Set([2]));const out=p.modules.get(1).output,target=p.modules.get(2).inputs.input;assert.equal(p.waveformTaps.size,0);assert(out.connections.has(target));assert.equal(p.waveform(1).length,256);const count=c.made;p.waveform(1);assert.equal(c.made,count);p.clearWaveforms();assert.equal(p.waveformTaps.size,0);assert(out.connections.has(target));p.stop();});

test('drum synth routes independent MIDI voices, handles aliases and rejects unknown notes',()=>{
 const p=new AudioPatch(context()),settings={level:.4,kit:'',polyphony:16};p.sync(new Map([[1,{kind:'DrumSynth',settings,inputs:{}}]]),new Set([1]));
 const kick=p.trigger(1,36,0,.1,.8),snare=p.trigger(1,38,0,.1,.6),hat=p.trigger(1,42,0,.1,.7);assert.equal(kick.sources.length,1);assert.equal(snare.sources.length,2);assert.equal(hat.sources.length,2);assert.ok(p.trigger(1,35,0,.1,.8));assert.equal(p.trigger(1,72,0,.1,.8),null);assert.equal(p.modules.get(1).voices.size,4);p.stop();
});
test('FM voice honors ratio and modulation depth, and old workflows get defaults',()=>{
 const p=new AudioPatch(context()),settings={level:.3,voice:'fm',fm_ratio:3,fm_index:2,attack:.01,decay:.1,sustain:.5,release:.2};p.sync(new Map([[1,{kind:'Synth',settings,inputs:{}}]]),new Set([1]));const voice=p.trigger(1,69,0,.2,.8);assert.equal(voice.sources[1].frequency.value,1320);assert.equal(voice.nodes[2].gain.value,880);p.stop();
});
test('audio merge sums four buses and named send/receive routes keep native edges',()=>{const c=context(),p=new AudioPatch(c);const defs=new Map([[1,{kind:'Synth',settings:{level:.4},inputs:{}}],[2,{kind:'Send',settings:{name:'a'},inputs:{input:1}}],[3,{kind:'Receive',settings:{name:'a'},inputs:{input:2}}],[4,{kind:'Merge',settings:{},inputs:{input_1:3,input_2:1}}],[5,{kind:'Output',settings:{level:.7},inputs:{input:4}}]]);p.sync(defs,new Set([5]));assert(p.modules.get(1).output.connections.has(p.modules.get(2).inputs.input));assert(p.modules.get(2).output.connections.has(p.modules.get(3).inputs.input));assert(p.modules.get(3).output.connections.has(p.modules.get(4).inputs.input_1));assert(p.modules.get(1).output.connections.has(p.modules.get(4).inputs.input_2));p.stop();});
