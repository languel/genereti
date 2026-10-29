import {drumGlyph} from './drum-glyphs.js';
// Visual panels for the modular-audio nodes. Each panel edits the node's own widgets, so linked inputs and
// workflow files keep working. buildPanel(kind, ctx) returns {el, refresh, height, meter?} or null.
import {knob, fader, toggle, segmented, envelope, filterGraph, row, group, grow, panelRoot, assemble, el, setValue, getValue} from './audio-ui.js';
import {noteName, isBlackKey, DRUM_ROWS, clamp} from './audio-ui-core.js';
import {SCALES} from '/extensions/genereti_comfy_performance/core/music.js';
import {drumSequencerPanel, noteSequencerPanel, euclideanPanel} from './audio-sequencers.js';
import {multitrackPanel,pianoRollPanel} from './poly-sequencers.js';
import {mixerChannelCount} from './mixer-layout.js';
import {FACTORY_PRESETS,readDrumVoices,presetValues} from './synth-presets.js';

const KEY_NOTES = Array.from({length: 13}, (_, i) => 60 + i);

function keyboard(ctx) {
  const wrap = el('div', {className: 'gap-keys', title: 'Audition keys · hold to sound · needs mod.output started'});
  for (const note of KEY_NOTES) {
    const b = el('button', {textContent: isBlackKey(note) ? '' : noteName(note).replace(/\d/, ''), className: isBlackKey(note) ? 'black' : '', title: noteName(note)}); b.type = 'button';
    b.setAttribute('aria-label', `Play ${noteName(note)}`); b.dataset.note = note;
    const down = e => { e.stopPropagation(); b.setPointerCapture(e.pointerId); b.setAttribute('aria-pressed', 'true'); ctx.audition(note, true); };
    const up = () => { b.setAttribute('aria-pressed', 'false'); ctx.audition(note, false); };
    b.onpointerdown = down; b.onpointerup = b.onpointercancel = b.onlostpointercapture = up;
    wrap.append(b);
  }
  return wrap;
}

// Custom patches are embedded in the node properties when the workflow is saved.
function presetBar(node,kind){
 const wrap=row(),select=el('select',{title:'Recall a factory or saved preset'}),save=el('button',{textContent:'✚',title:'Save current sound as a preset in this workflow'});select.setAttribute('aria-label','Synth preset');save.setAttribute('aria-label',save.title);save.type='button';
 const saved=()=>node.properties?.genereti_synth_presets?.[kind]??{};
 let optionsKey='';const refresh=()=>{const key=JSON.stringify([Object.keys(FACTORY_PRESETS[kind]??{}),Object.keys(saved())]);if(key===optionsKey)return;optionsKey=key;const selected=select.value;select.replaceChildren(el('option',{value:'',textContent:'preset…'}));for(const name of Object.keys(FACTORY_PRESETS[kind]??{}))select.append(el('option',{value:`factory:${name}`,textContent:name}));for(const name of Object.keys(saved()))select.append(el('option',{value:`saved:${name}`,textContent:`★ ${name}`}));select.value=[...select.options].some(o=>o.value===selected)?selected:'';};
 select.onchange=()=>{const [which,...rest]=select.value.split(':'),name=rest.join(':'),preset=which==='factory'?FACTORY_PRESETS[kind]?.[name]:saved()[name];if(!preset)return;const base=kind==='Synth'?{voice:'sine',wave:'auto',level:.35,attack:.02,decay:.15,sustain:.6,release:.3,cutoff:2200,resonance:.7,glide:.015,vibrato:0,vibrato_rate:5,polyphony:8,filter_mode:'lowpass',detune:0,filter_env:0,fm_ratio:2,fm_index:.7}:{};for(const [key,value] of Object.entries({...base,...preset}))setValue(node,key,value);node.graph?.change?.();};
 save.onclick=()=>{const name=window.prompt('Name this preset');if(!name?.trim())return;node.properties??={};node.properties.genereti_synth_presets??={};node.properties.genereti_synth_presets[kind]??={};node.properties.genereti_synth_presets[kind][name.trim()]=presetValues(node);node.graph?.change?.();refresh();select.value=`saved:${name.trim()}`;};select.onpointerdown=save.onpointerdown=e=>e.stopPropagation();wrap.append(select,save);refresh();return {el:wrap,refresh};
}

function drumSynthPanel({node,trigger}){
 const root=panelRoot(),preset=presetBar(node,'DrumSynth'),parts=[],add=c=>{parts.push(c);return c.el;};let selected=0,last='';
 const toolbar=row(add(preset),add(knob(node,{name:'level',label:'level',min:0,max:1,step:.01,size:30})));root.append(toolbar);
 const pads=el('div',{className:'gap-keys',title:'Select and audition a voice · start mod.output first'});pads.style.flexWrap='wrap';root.append(pads);
 const controls=el('div');controls.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px';root.append(controls);
 const fields=[['level','tone level',0,1,.01],['noise','noise level',0,1,.01],['decay','tone decay',.01,3,.01],['noise_decay','noise decay',.01,3,.01],['freq_start','pitch start',20,18000,1],['freq_end','pitch end',20,18000,1],['pitch_decay','pitch decay',.005,3,.005],['cutoff','filter cutoff',20,18000,1]];
 const controlsByName=new Map();const wave=el('select',{title:'Oscillator waveform'});wave.setAttribute('aria-label','Oscillator waveform');for(const v of ['sine','triangle','sawtooth','square'])wave.append(el('option',{value:v,textContent:v}));controls.append(wave);
 const write=(key,value)=>{const voices=readDrumVoices(getValue(node,'kit',''));voices[selected][key]=value;setValue(node,'kit',JSON.stringify({version:1,voices}));node.graph?.change?.();last='';};wave.onchange=()=>write('wave',wave.value);wave.onpointerdown=e=>e.stopPropagation();
 for(const [name,label,min,max,step] of fields){const wrap=el('label'),caption=el('span',{className:'gap-label',textContent:label}),output=el('span',{className:'gap-label'}),input=el('input',{type:'range',min:String(min),max:String(max),step:String(step),title:label});input.setAttribute('aria-label',label);input.style.width='100%';input.onpointerdown=e=>e.stopPropagation();input.oninput=()=>{output.textContent=` ${input.value}`;write(name,Number(input.value));};wrap.append(caption,output,input);controls.append(wrap);controlsByName.set(name,{input,output});}
 for(let i=0;i<8;i++){const b=el('button');b.type='button';b.onpointerdown=e=>{e.stopPropagation();selected=i;last='';refresh();trigger(readDrumVoices(getValue(node,'kit',''))[i].note);};pads.append(b);}
 const refresh=()=>{for(const part of parts)part.refresh?.();const kit=String(getValue(node,'kit','')),key=JSON.stringify([kit,selected,node._generetiAudioValues?.()??{}]);if(key===last)return;last=key;const voices=readDrumVoices(kit,node._generetiAudioValues?.()??{}),v=voices[selected];for(let i=0;i<8;i++){const b=pads.children[i];b.innerHTML=drumGlyph(voices[i].note);b.title=`${voices[i].name} · MIDI ${voices[i].note}`;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(i===selected));b.dataset.note=voices[i].note;}wave.value=v.wave;for(const [name,{input,output}] of controlsByName){input.value=v[name];output.textContent=` ${v[name]}`;}};
 refresh();return {el:root,refresh,height:330,width:440,activeNotes(notes){for(const b of pads.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}

function synthPanel({node, audition}) {
  const root = panelRoot(), parts = [];
  root.classList.add('gap-synth');
  const presets=presetBar(node,'Synth');parts.push(presets);root.append(presets.el);
  const add = c => { parts.push(c); return c.el; };
  const voice = segmented(node, {name: 'voice', title: 'Voice', options: [{value: 'sine', label: 'sine'}, {value: 'subtractive', label: 'sub', title: 'subtractive'}, {value: 'fm', label: 'fm'}, {value: 'reed', label: 'reed'}]});
  const wave = segmented(node, {name: 'wave', title: 'Oscillator waveform', options: [{value: 'auto', label: 'auto', title: 'follow the voice'}, {value: 'sine', label: '∿', title: 'sine'}, {value: 'triangle', label: '△', title: 'triangle'}, {value: 'sawtooth', label: '◿', title: 'sawtooth'}, {value: 'square', label: '▭', title: 'square'}]});
  const mode = segmented(node, {name: 'filter_mode', title: 'Filter mode', options: [{value: 'lowpass', label: 'lp', title: 'low-pass'}, {value: 'highpass', label: 'hp', title: 'high-pass'}, {value: 'bandpass', label: 'bp', title: 'band-pass'}]});
  const oscillator = row(add(voice), add(wave)); oscillator.classList.add('gap-synth-oscillator');
  root.append(el('div', {className: 'gap-synth-section'}, el('div', {className: 'gap-title', textContent: 'oscillator'}), oscillator));
  const env = envelope(node), filt = filterGraph(node);
  const filterControls = row(add(mode), add(knob(node, {name: 'filter_env', label: 'env', min: 0, max: 1, size: 28, step: .01})));
  filterControls.classList.add('gap-synth-filter-controls');
  const charts = el('div', {className: 'gap-synth-charts'},
    group('envelope', add(env)),
    group('filter', add(filt), filterControls));
  root.append(charts);
  const controls = row(
    add(knob(node, {name: 'level', label: 'level', min: 0, max: 1, step: .01})),
    add(knob(node, {name: 'glide', label: 'glide', min: 0, max: 1, curve: 'pow', step: .005, unit: 's'})),
    add(knob(node, {name: 'detune', label: 'detune', min: -100, max: 100, step: 1})),
    add(knob(node, {name: 'vibrato', label: 'vibrato', min: 0, max: 2, step: .01})),
    add(knob(node, {name: 'vibrato_rate', label: 'rate', min: .1, max: 20, curve: 'log', step: .1})),
    add(knob(node, {name: 'resonance', label: 'res', min: .1, max: 12, curve: 'log', step: .01})),
    add(knob(node, {name: 'polyphony', label: 'voices', min: 1, max: 32, step: 1})));
  const fmControls=row(add(knob(node,{name:'fm_ratio',label:'FM ratio',min:.1,max:10,step:.1,size:28})),add(knob(node,{name:'fm_index',label:'FM depth',min:0,max:10,step:.1,size:28})));root.append(fmControls);
  controls.classList.add('gap-synth-knobs'); const keys=keyboard({audition}); root.append(controls, keys);
  return {...assemble(root, parts), height: 400, width: 470, activeNotes(notes){for(const b of keys.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}

const DRUM_LABEL = {kick: 'kick', rim: 'rim', snare: 'snare', clap: 'clap', tomlo: 'tom ↓', hat: 'hat', tomhi: 'tom ↑', openhat: 'open', ride: 'ride', cowbell: 'bell'};
function drumKitPanel({node, trigger}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  const presets=presetBar(node,'DrumKit');root.append(add(presets));
  root.append(row(add(knob(node, {name: 'level', label: 'level', min: 0, max: 1, step: .01})), add(knob(node, {name: 'decay', label: 'decay', min: .03, max: 2, curve: 'log', step: .01, unit: 's'})), add(knob(node, {name: 'tone', label: 'tone', min: .25, max: 2, curve: 'log', step: .01}))));
  const pads = el('div', {className: 'gap-keys', title: 'Audition pads · needs mod.output started'}); pads.style.flexWrap = 'wrap';
  for (const [name, note] of Object.entries(DRUM_ROWS)) {
    const b = el('button', {title: `${DRUM_LABEL[name] ?? name} · MIDI ${note}`}); b.innerHTML=drumGlyph(note);b.setAttribute('aria-label',b.title);b.type = 'button'; b.dataset.note = note; b.style.flex = '1 0 17%'; b.style.padding = '9px 0';
    b.onpointerdown = e => { e.stopPropagation(); b.setAttribute('aria-pressed', 'true'); trigger(note); setTimeout(() => b.setAttribute('aria-pressed', 'false'), 90); };
    pads.append(b);
  }
  root.append(pads);
  return {...assemble(root, parts), height: 175, width: 430, activeNotes(notes){for(const b of pads.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}

const STRIP_W = 58;
function mixerPanel({node, resize}) {
  const root = panelRoot(), parts = [], faders = [], cells = [];
  const add = c => { parts.push(c); return c.el; };
  const count = () => mixerChannelCount(node.inputs);
  const strips = row();
  strips.style.alignItems = 'flex-start'; strips.style.flexWrap = 'nowrap'; strips.style.gap = '8px';
  for (let i = 1; i <= 8; i++) {
    const f = fader(node, {name: `level_${i}`, label: `${i}`, height: 104});
    faders.push(f);
    const strip = el('div', {className: 'gap-cell'});
    strip.append(add(knob(node, {name: `pan_${i}`, label: 'pan', min: -1, max: 1, size: 26, step: .01, unit: 'pan', def: 0})), add(f),
      row(add(toggle(node, {name: `mute_${i}`, label: 'M', title: `Mute ${i}`})), add(toggle(node, {name: `solo_${i}`, label: 'S', title: `Solo ${i}`}))));
    cells.push(strip); strips.append(strip);
  }
  const master = fader(node, {name: 'master', label: 'master', max: 1, height: 104, width: 34}); faders.push(master);
  const masterCell = el('div', {className: 'gap-cell'}); masterCell.style.marginLeft = 'auto';
  masterCell.append(add(master));
  strips.append(masterCell);
  root.append(strips);
  let shown=0;const show = () => { const n = count(); if(n===shown)return; shown=n; cells.forEach((c, i) => { c.style.display = i < n ? '' : 'none'; }); panel.width = 130 + n * STRIP_W; resize?.(panel.width); };
  const panel = {...assemble(root, parts), height: 220, width: 340, meter(levels) { for (let i = 0; i < 8; i++) faders[i].setMeter(levels?.strips?.[i] ?? 0); master.setMeter(levels?.master ?? 0); }};
  const refresh=panel.refresh;panel.refresh=()=>{show();refresh();};
  show();
  return panel;
}

function filterPanel({node}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  const mode = segmented(node, {name: 'mode', title: 'Filter mode', options: [{value: 'lowpass', label: 'lp', title: 'low-pass'}, {value: 'highpass', label: 'hp', title: 'high-pass'}, {value: 'bandpass', label: 'bp', title: 'band-pass'}, {value: 'notch', label: 'notch'}]});
  root.append(add(mode), add(filterGraph(node, {cutoff: 'cutoff', resonance: 'resonance', mode: 'mode'}, {height: 110})));
  return {...assemble(root, parts), height: 160, width: 380};
}

function gainPanel({node}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  root.append(row(add(fader(node, {name: 'level', label: 'level', height: 90})), add(knob(node, {name: 'pan', label: 'pan', min: -1, max: 1, unit: 'pan', step: .01, def: 0})), add(toggle(node, {name: 'mute', label: 'mute', title: 'Mute'}))));
  return {...assemble(root, parts), height: 150, width: 300};
}

function delayPanel({node}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  root.append(row(add(knob(node, {name: 'seconds', label: 'time', min: .01, max: 2, curve: 'log', unit: 's', step: .005})), add(knob(node, {name: 'feedback', label: 'feedback', min: 0, max: .85, step: .01})), add(knob(node, {name: 'mix', label: 'mix', min: 0, max: 1, step: .01}))));
  return {...assemble(root, parts), height: 90, width: 300};
}

// Tempo and swing for mod.transport; the play / reset buttons stay in the node's own toolbar.
export function transportExtras({node}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  let taps = [], tapTempo;
  import('/extensions/genereti_comfy_performance/core/timeformat.js').then(m => { tapTempo = m.tapTempo; }).catch(() => {});
  const tap = el('button', {className: 'gap-btn', textContent: 'tap', title: 'Tap tempo · a pause over 2 s starts again'}); tap.type = 'button';
  tap.onpointerdown = e => e.stopPropagation();
  tap.onclick = () => { if (!tapTempo) return; const r = tapTempo(taps, performance.now()); taps = r.taps; if (r.bpm) setValue(node, 'bpm', Math.min(300, r.bpm)); };
  const clock=el('select', {title:'Clock source · local is independent; project follows the shared timeline'}); clock.setAttribute('aria-label','Clock source');
  for(const [value,label] of [['local','local clock'],['project','project clock']])clock.append(el('option',{value,textContent:label}));
  clock.onchange=()=>setValue(node,'clock_name',clock.value);clock.onpointerdown=e=>e.stopPropagation();
  const rootNote=el('select',{title:'Global musical root for the project'});rootNote.setAttribute('aria-label','Global musical root');
  ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'].forEach((label,i)=>rootNote.append(el('option',{value:String(i),textContent:label})));
  const scale=el('select',{title:'Global scale for connected musical tools'});scale.setAttribute('aria-label','Global scale');
  for(const name of Object.keys(SCALES))scale.append(el('option',{value:name,textContent:name.replace(/([A-Z])/g,' $1').toLowerCase()}));
  rootNote.onpointerdown=scale.onpointerdown=e=>e.stopPropagation();
  rootNote.onchange=()=>window.generetiPerformance?.edit(d=>{d.music.root=Number(rootNote.value);});
  scale.onchange=()=>window.generetiPerformance?.edit(d=>{d.music.scale=scale.value;d.music.degrees=[...SCALES[scale.value]];});
  const controls=row(add(knob(node, {name: 'bpm', label: 'bpm', min: 20, max: 300, step: .1, size: 34})), add(knob(node, {name: 'swing', label: 'swing', min: 0, max: .45, step: .01, size: 34})), tap,clock);
  controls.classList.add('gap-transport-controls');const musical=row(el('span',{className:'gap-label',textContent:'global scale'}),rootNote,scale);musical.classList.add('gap-transport-scale');root.append(controls,musical);
  const base=assemble(root,parts);return {...base,height:112,refresh(){base.refresh();clock.value=String(getValue(node,'clock_name','local'));const music=window.generetiPerformance?.document?.music;rootNote.disabled=scale.disabled=!music;if(music){rootNote.value=String(music.root);scale.value=music.scale;}}};
}

function instrumentPanel({node,audition},kind){
 const root=panelRoot(),parts=[],add=c=>{parts.push(c);return c.el;};
 const presets=presetBar(node,kind);root.append(add(presets));
 const specs=kind==='Karplus'?[['level',0,1,.01],['decay',.05,5,.01],['damping',0,1,.01],['polyphony',1,32,1]]:[['level',0,1,.01],['grain_size',.02,.3,.005],['density',1,40,1],['spread',0,1,.01],['release',.01,3,.01],['polyphony',1,32,1]];
 const controls=row(...specs.map(([name,min,max,step])=>add(knob(node,{name,label:name.replace('_',' '),min,max,step,size:34,unit:name==='grain_size'||name==='decay'||name==='release'?'s':''}))));const keys=keyboard({audition});root.append(controls,keys);
 return {...assemble(root,parts),height:155,width:400,activeNotes(notes){for(const b of keys.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}
function effectPanel({node},kind){const root=panelRoot(),parts=[],add=c=>{parts.push(c);return c.el;};const names=kind==='Reverb'?[['decay',.1,5,.01],['mix',0,1,.01]]:[['drive',0,20,.1],['mix',0,1,.01]];root.append(row(...names.map(([name,min,max,step])=>add(knob(node,{name,min,max,step,size:34,unit:name==='decay'?'s':''})))));return {...assemble(root,parts),height:95,width:260};}
const BUILDERS = {DrumSynth:drumSynthPanel, Karplus: ctx=>instrumentPanel(ctx,'Karplus'), Granular: ctx=>instrumentPanel(ctx,'Granular'), Reverb: ctx=>effectPanel(ctx,'Reverb'), Distortion: ctx=>effectPanel(ctx,'Distortion'), Euclidean: ctx=>multitrackPanel(ctx,'euclidean'), CircleSequence: ctx=>multitrackPanel(ctx,'circle'), PianoRoll:pianoRollPanel, DrumSequence: drumSequencerPanel, Sequence: noteSequencerPanel, Synth: synthPanel, DrumKit: drumKitPanel, Mixer: mixerPanel, Filter: filterPanel, Gain: gainPanel, Delay: delayPanel};
export const hasPanel = kind => kind in BUILDERS;
export function buildPanel(kind, ctx) { return BUILDERS[kind]?.(ctx) ?? null; }
export {setValue, getValue};
