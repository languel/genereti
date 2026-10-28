// Visual panels for the modular-audio nodes. Each panel edits the node's own widgets, so linked inputs and
// workflow files keep working. buildPanel(kind, ctx) returns {el, refresh, height, meter?} or null.
import {knob, fader, toggle, segmented, envelope, filterGraph, row, group, grow, panelRoot, assemble, el, setValue, getValue} from './audio-ui.js';
import {noteName, isBlackKey, DRUM_ROWS, clamp} from './audio-ui-core.js';
import {SCALES} from '/extensions/genereti_comfy_performance/core/music.js';
import {drumSequencerPanel, noteSequencerPanel, euclideanPanel} from './audio-sequencers.js';

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

function synthPanel({node, audition}) {
  const root = panelRoot(), parts = [];
  root.classList.add('gap-synth');
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
  controls.classList.add('gap-synth-knobs'); const keys=keyboard({audition}); root.append(controls, keys);
  return {...assemble(root, parts), height: 330, width: 470, activeNotes(notes){for(const b of keys.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}

const DRUM_LABEL = {kick: 'kick', rim: 'rim', snare: 'snare', clap: 'clap', tomlo: 'tom ↓', hat: 'hat', tomhi: 'tom ↑', openhat: 'open', ride: 'ride', cowbell: 'bell'};
function drumKitPanel({node, trigger}) {
  const root = panelRoot(), parts = [];
  const add = c => { parts.push(c); return c.el; };
  root.append(row(add(knob(node, {name: 'level', label: 'level', min: 0, max: 1, step: .01})), add(knob(node, {name: 'decay', label: 'decay', min: .03, max: 2, curve: 'log', step: .01, unit: 's'})), add(knob(node, {name: 'tone', label: 'tone', min: .25, max: 2, curve: 'log', step: .01}))));
  const pads = el('div', {className: 'gap-keys', title: 'Audition pads · needs mod.output started'}); pads.style.flexWrap = 'wrap';
  for (const [name, note] of Object.entries(DRUM_ROWS)) {
    const b = el('button', {textContent: DRUM_LABEL[name] ?? name, title: `${name} · MIDI ${note}`}); b.type = 'button'; b.dataset.note = note; b.style.flex = '1 0 17%'; b.style.padding = '9px 0';
    b.onpointerdown = e => { e.stopPropagation(); b.setAttribute('aria-pressed', 'true'); trigger(note); setTimeout(() => b.setAttribute('aria-pressed', 'false'), 90); };
    pads.append(b);
  }
  root.append(pads);
  return {...assemble(root, parts), height: 150, width: 430, activeNotes(notes){for(const b of pads.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}

const STRIP_W = 58;
function mixerPanel({node, resize}) {
  const root = panelRoot(), parts = [], faders = [], cells = [];
  const add = c => { parts.push(c); return c.el; };
  const count = () => clamp(Number(node.properties?.genereti_mixer_channels ?? 4), 1, 8);
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
  const more = el('div', {className: 'gap-seg'});
  const mk = (label, title, d) => { const b = el('button', {textContent: label, title}); b.type = 'button'; b.onpointerdown = e => e.stopPropagation(); b.onclick = () => { node.properties ??= {}; node.properties.genereti_mixer_channels = clamp(count() + d, 1, 8); show(); node.graph?.change?.(); resize?.(panel.width); }; return b; };
  more.append(mk('−', 'Fewer channels', -1), mk('+', 'More channels (up to 8)', 1)); more.style.height = '40px';
  masterCell.append(more, add(master));
  strips.append(masterCell);
  root.append(strips);
  const show = () => { const n = count(); cells.forEach((c, i) => { c.style.display = i < n ? '' : 'none'; }); panel.width = 130 + n * STRIP_W; };
  const panel = {...assemble(root, parts), height: 220, width: 340, meter(levels) { for (let i = 0; i < 8; i++) faders[i].setMeter(levels?.strips?.[i] ?? 0); master.setMeter(levels?.master ?? 0); }};
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
 const specs=kind==='Karplus'?[['level',0,1,.01],['decay',.05,5,.01],['damping',0,1,.01],['polyphony',1,32,1]]:[['level',0,1,.01],['grain_size',.02,.3,.005],['density',1,40,1],['spread',0,1,.01],['release',.01,3,.01],['polyphony',1,32,1]];
 const controls=row(...specs.map(([name,min,max,step])=>add(knob(node,{name,label:name.replace('_',' '),min,max,step,size:34,unit:name==='grain_size'||name==='decay'||name==='release'?'s':''}))));const keys=keyboard({audition});root.append(controls,keys);
 return {...assemble(root,parts),height:130,width:400,activeNotes(notes){for(const b of keys.children)b.classList.toggle('gap-playing',notes.has(Number(b.dataset.note)));}};
}
function effectPanel({node},kind){const root=panelRoot(),parts=[],add=c=>{parts.push(c);return c.el;};const names=kind==='Reverb'?[['decay',.1,5,.01],['mix',0,1,.01]]:[['drive',0,20,.1],['mix',0,1,.01]];root.append(row(...names.map(([name,min,max,step])=>add(knob(node,{name,min,max,step,size:34,unit:name==='decay'?'s':''})))));return {...assemble(root,parts),height:95,width:260};}
const BUILDERS = {Karplus: ctx=>instrumentPanel(ctx,'Karplus'), Granular: ctx=>instrumentPanel(ctx,'Granular'), Reverb: ctx=>effectPanel(ctx,'Reverb'), Distortion: ctx=>effectPanel(ctx,'Distortion'), Euclidean: euclideanPanel, DrumSequence: drumSequencerPanel, Sequence: noteSequencerPanel, Synth: synthPanel, DrumKit: drumKitPanel, Mixer: mixerPanel, Filter: filterPanel, Gain: gainPanel, Delay: delayPanel};
export const hasPanel = kind => kind in BUILDERS;
export function buildPanel(kind, ctx) { return BUILDERS[kind]?.(ctx) ?? null; }
export {setValue, getValue};
