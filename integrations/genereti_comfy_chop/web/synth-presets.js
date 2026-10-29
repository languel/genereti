// Presets are plain widget values, so both factory patches and saved patches live in workflows.
export const DRUM_VOICES = [
 {name:'kick',note:36,wave:'sine',level:1,noise:0,decay:.36,noise_decay:.08,freq_start:150,freq_end:45,pitch_decay:.1,cutoff:12000},
 {name:'snare',note:38,wave:'triangle',level:.65,noise:.75,decay:.16,noise_decay:.17,freq_start:240,freq_end:150,pitch_decay:.05,cutoff:3500},
 {name:'hat',note:42,wave:'square',level:.12,noise:.8,decay:.045,noise_decay:.06,freq_start:7200,freq_end:6000,pitch_decay:.03,cutoff:10000},
 {name:'open',note:46,wave:'square',level:.12,noise:.7,decay:.28,noise_decay:.38,freq_start:6800,freq_end:5400,pitch_decay:.08,cutoff:11000},
 {name:'low tom',note:41,wave:'sine',level:.8,noise:.1,decay:.27,noise_decay:.07,freq_start:180,freq_end:80,pitch_decay:.12,cutoff:8500},
 {name:'high tom',note:45,wave:'sine',level:.75,noise:.1,decay:.22,noise_decay:.06,freq_start:260,freq_end:130,pitch_decay:.09,cutoff:9000},
 {name:'clap',note:39,wave:'triangle',level:.12,noise:.9,decay:.1,noise_decay:.22,freq_start:600,freq_end:400,pitch_decay:.05,cutoff:5000},
 {name:'bell',note:56,wave:'square',level:.5,noise:.05,decay:.22,noise_decay:.08,freq_start:800,freq_end:540,pitch_decay:.07,cutoff:7000},
];
export function readDrumVoices(text,overrides={}){
 let data;try{data=typeof text==='string'&&text.trim()?JSON.parse(text):text;}catch{data=null;}
 const list=Array.isArray(data)?data:data?.voices;
 return DRUM_VOICES.map((base,i)=>{const raw=Array.isArray(list)?list[i]??{}:{};const out={...base};for(const key of Object.keys(base))if(raw[key]!==undefined&&typeof raw[key]===typeof base[key]&&(typeof raw[key]!=='number'||Number.isFinite(raw[key])))out[key]=raw[key];for(const key of Object.keys(base)){const value=overrides[`voice_${i+1}_${key}`];if(value!==undefined&&typeof value===typeof base[key]&&(typeof value!=='number'||Number.isFinite(value)))out[key]=value;}return out;});
}
const kit=(fn)=>JSON.stringify({version:1,voices:DRUM_VOICES.map((v,i)=>({...v,...fn(v,i)}))});
export const FACTORY_PRESETS={
 Synth:{'Warm keys':{voice:'subtractive',wave:'triangle',level:.35,attack:.012,decay:.32,sustain:.35,release:.45,cutoff:1800,resonance:.7,glide:0,vibrato:0,filter_env:.3},'FM bell':{voice:'fm',wave:'sine',level:.3,attack:.003,decay:1.1,sustain:.05,release:.7,cutoff:12000,resonance:.7,glide:0,vibrato:0,filter_env:0,fm_ratio:3.5,fm_index:2.2},'Soft pad':{voice:'subtractive',wave:'sawtooth',level:.2,attack:.8,decay:.8,sustain:.7,release:1.2,cutoff:1100,resonance:.6,glide:0,vibrato:.08,vibrato_rate:4,filter_env:.2},'Bass':{voice:'subtractive',wave:'sawtooth',level:.35,attack:.005,decay:.22,sustain:.3,release:.16,cutoff:700,resonance:2,glide:.03,vibrato:0,filter_env:.7},'Reed':{voice:'reed',wave:'auto',level:.25,attack:.06,decay:.2,sustain:.65,release:.25,cutoff:2400,resonance:1,glide:0,vibrato:.08,vibrato_rate:5,filter_env:.1}},
 Karplus:{'Plucked string':{level:.35,decay:1.2,damping:.5,polyphony:8},'Muted pluck':{level:.4,decay:.35,damping:.15,polyphony:8},'Bright harp':{level:.3,decay:3.2,damping:.85,polyphony:12}},
 Granular:{'Soft cloud':{level:.25,grain_size:.08,density:16,spread:.25,release:.4,polyphony:8},'Shimmer':{level:.2,grain_size:.045,density:30,spread:.8,release:.8,polyphony:8}},
 DrumKit:{'Tight':{level:.4,decay:.12,tone:1.15},'Deep':{level:.4,decay:.35,tone:.7},'Bright':{level:.32,decay:.2,tone:1.6}},
 DrumSynth:{'Electronic kit':{level:.4,kit:kit(()=>({}))},'Soft kit':{level:.4,kit:kit(v=>({wave:v.note===42?'triangle':v.wave,noise:v.noise*.55,decay:v.decay*1.2,cutoff:v.cutoff*.65}))},'Punchy kit':{level:.4,kit:kit(v=>({decay:v.decay*.65,noise_decay:v.noise_decay*.7,freq_start:v.freq_start*1.3}))}}
};
export function presetValues(node){return Object.fromEntries((node.widgets??[]).filter(w=>typeof w.value==='number'||typeof w.value==='string'||typeof w.value==='boolean').map(w=>[w.name,w.value]));}
