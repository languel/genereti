#!/usr/bin/env python3
"""Build an audio-analysis lesson from the installed Comfy schemas."""
import argparse,json,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--server',default='http://127.0.0.1:8001');args=p.parse_args()
info=json.load(urllib.request.urlopen(args.server+'/object_info'));nodes=[];links=[]
def node(t,pos,size,overrides=None):
 s=info[t];widgets=[];inputs=[]
 for group in ('required','optional'):
  for name,(typ,opts) in s['input'].get(group,{}).items():
   opts=opts or {}
   if isinstance(typ,list) or typ=='COMBO':
    choices=typ if isinstance(typ,list) else opts['options'];widgets.append((overrides or {}).get(name,opts.get('default',choices[0])))
   elif typ in ('FLOAT','INT','STRING','BOOLEAN'):widgets.append((overrides or {}).get(name,opts.get('default')))
   else:inputs.append({'name':name,'type':typ,'link':None})
 n={'id':len(nodes)+1,'type':t,'title':s['display_name'],'pos':pos,'size':size,'flags':{},'order':len(nodes),'mode':0,'inputs':inputs,'outputs':[{'name':name,'type':typ,'links':[]} for name,typ in zip(s['output_name'],s['output'])],'properties':{'Node name for S&R':t},'widgets_values':widgets};nodes.append(n);return n

def wire(a,b,name,output=0):
 slot=next(i for i,x in enumerate(b['inputs']) if x['name']==name);i=len(links)+1;b['inputs'][slot]['link']=i;a['outputs'][output]['links'].append(i);links.append([i,a['id'],output,b['id'],slot,a['outputs'][output]['type']])
clock=node('GeneretiAudioTransport',[0,0],[300,180],{'bpm':95})
seq=node('GeneretiAudioSequence',[0,230],[460,240],{'pattern':'60 64 67 72 67 64 - 55'})
synth=node('GeneretiAudioSynth',[520,0],[340,650],{'voice':'fm','level':.2})
pan=node('GeneretiAudioGain',[930,0],[300,210],{'pan':.25,'level':.8})
out=node('GeneretiAudioOutput',[1280,0],[320,240],{'level':.15})
scope=node('GeneretiAudioScope',[930,310],[340,420],{'display_gain':12})
spectrum=node('GeneretiAudioSpectrum',[1320,310],[340,420],{'fft_size':2048,'display_gain':1})
xy=node('GeneretiAudioLissajous',[1710,480],[360,570],{'display_gain':20})
analyze=node('GeneretiAudioAnalyze',[1710,0],[360,380],{'display_gain':12})
select=node('GeneretiChopSelect',[0,560],[340,240],{'pattern':'rms'})
math=node('GeneretiChopMath',[0,850],[340,320],{'operation':'multiply','value':12})
filter=node('GeneretiTextureFilter',[440,850],[390,400],{'operation':'opacity'})
# A regular Comfy widget converted into a FLOAT socket; the live TOP reads it.
filter['inputs'].append({'name':'amount','type':'FLOAT','link':None,'widget':{'name':'amount'}})
for a,b,n,k in [(clock,seq,'clock',0),(seq,synth,'notes',0),(synth,pan,'input',0),(pan,out,'input',0),(pan,scope,'input',0),(pan,spectrum,'input',0),(pan,xy,'input',0),(pan,analyze,'input',0),(analyze,select,'input',1),(select,math,'input',0),(math,filter,'amount',1),(scope,filter,'image',4)]:wire(a,b,n,k)
lab=json.loads((root/'integrations/comfyui_genereti/workflows/ꘇ-Tutorial-Authoring.json').read_text());lesson=next(n for n in lab['nodes'] if n['type']=='GeneretiDatLesson');lesson.update(id=13,title='ꘇ sound analysis · start here',pos=[930,940],size=[740,620],order=12)
def step(title,text,t,hint):return {'title':title,'text':text,'target':{'nodeType':t,'part':'node'},'hint':hint}
guide={'format':'genereti-guide','version':1,'id':'audio-analysis','title':'See sound, use sound','summary':'Scopes, spectral analysis, stereo geometry and audio-driven visual controls.','steps':[
 step('Start the patch','Press ▷ on mod.output. Sound starts explicitly at a low level. The analysis taps remain silent until their source is part of a running output patch.','GeneretiAudioOutput','Use Start on the output, not Queue or the lesson Play button.'),
 step('Read the waveform','mod.scope draws left and right waveforms. Its channels output carries sampled stereo data; image carries the drawing. RMS and peak sockets are scalar controls.','GeneretiAudioScope','Increase display_gain to enlarge the drawing without changing sound.'),
 step('Read the spectrum','mod.spectrum draws decibels on a linear-frequency axis. Channels are magnitude and frequency in Hz. fft_size trades frequency detail for a longer analysis window; smoothing affects spectral bins only.','GeneretiAudioSpectrum','The frequency of bin i is i × sampleRate / fft_size.'),
 step('See stereo relationships','mod.lissajous plots left versus right. A centered mono signal forms a diagonal. Change pan to stretch it; richer stereo effects can create loops. Correlation is +1 for identical signals, -1 for opposite phase.','GeneretiAudioLissajous','Pan changes balance, not phase; it will tilt a line rather than generate a loop.'),
 step('Use analysis as controls','mod.analyze exposes rms, peak, correlation and low/mid/high spectral band amplitudes. chop.select chooses rms, chop.math multiplies it by 12, and its FLOAT output drives the opacity of the scope image in top.filter.','GeneretiChopMath','Follow channels → select rms → math → FLOAT amount. These are control-rate measurements, not an audio-rate CHOP DSP engine.'),
 step('Stop and save','Press ■ Panic on mod.output. Analysis and scalar controls return to zero. Save retains wiring and settings, never a playing AudioContext.','GeneretiAudioOutput','Queue returns silent analysis data and placeholder IMAGEs; the browser owns live analysis.') ]}
for index,typ,widget,value in [(1,'GeneretiAudioScope','display_gain',12),(2,'GeneretiAudioSpectrum','fft_size',2048),(3,'GeneretiAudioGain','pan',.5),(4,'GeneretiChopMath','value',20)]:
 guide['steps'][index]['actions']=[{'kind':'set-widget','target':{'nodeType':typ,'widget':widget,'part':'parameter'},'value':value}]
lesson['properties'].pop('generetiOperatorText',None);lesson['widgets_values']=[json.dumps(guide,ensure_ascii=False,indent=2),'Live'];nodes.append(lesson)
flow={'last_node_id':13,'last_link_id':len(links),'nodes':nodes,'links':links,'groups':[],'config':{},'extra':{'ds':{'scale':.4,'offset':[90,100]}},'version':.4}
path=root/'integrations/comfyui_genereti/workflows/ꘇ-Sound-Analysis.json';path.write_text(json.dumps(flow,ensure_ascii=False,indent=2)+'\n');print(path)

lesson_path=root/'integrations/genereti_comfy_agent/web/lessons/audio-analysis.json';lesson_path.write_text(json.dumps(guide,ensure_ascii=False,indent=2)+'\n')
catalog_path=lesson_path.parent/'catalog.json';catalog=json.loads(catalog_path.read_text());catalog=[item for item in catalog if item.get('id')!=guide['id']];catalog.append(guide);catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
