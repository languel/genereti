#!/usr/bin/env python3
"""Rebuild the modular audio teaching patch from a running Comfy schema."""
import argparse,json,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--server',default='http://127.0.0.1:8001');args=a.parse_args()
info=json.load(urllib.request.urlopen(args.server+'/object_info'))
nodes=[];links=[]
def node(kind,pos,size,overrides=None):
 t='GeneretiAudio'+kind;s=info[t];widgets=[];inputs=[]
 for group in ('required','optional'):
  for name,spec in s['input'].get(group,{}).items():
   typ,opts=spec;opts=opts or {}
   if isinstance(typ,list) or typ=='COMBO':
    choices=typ if isinstance(typ,list) else opts['options'];widgets.append((overrides or {}).get(name,opts.get('default',choices[0])))
   elif typ in ('FLOAT','INT','STRING','BOOLEAN'):widgets.append((overrides or {}).get(name,opts.get('default')))
   else:inputs.append({'name':name,'type':typ,'link':None})
 n={'id':len(nodes)+1,'type':t,'title':s['display_name'],'pos':pos,'size':size,'flags':{},'order':len(nodes),'mode':0,'inputs':inputs,'outputs':[{'name':name,'type':typ,'links':[]} for name,typ in zip(s['output_name'],s['output'])],'properties':{'Node name for S&R':t},'widgets_values':widgets};nodes.append(n);return n
def wire(source,target,name):
 slot=next(i for i,x in enumerate(target['inputs']) if x['name']==name);i=len(links)+1;target['inputs'][slot]['link']=i;source['outputs'][0]['links'].append(i);links.append([i,source['id'],0,target['id'],slot,source['outputs'][0]['type']])
clock=node('Transport',[0,0],[300,180],{'bpm':110,'swing':.12})
seq=node('Sequence',[360,0],[460,240]);drums=node('DrumSequence',[360,320],[460,250])
synth=node('Synth',[880,0],[340,630]);kit=node('DrumKit',[880,700],[340,220])
gain=node('Gain',[1280,0],[300,200]);filt=node('Filter',[1280,250],[300,200]);delay=node('Delay',[1280,500],[300,200])
mix=node('Mixer',[1640,0],[380,800]);out=node('Output',[2080,0],[320,240])
for s,t,n in [(clock,seq,'clock'),(clock,drums,'clock'),(seq,synth,'notes'),(drums,kit,'notes'),(synth,gain,'input'),(gain,filt,'input'),(filt,delay,'input'),(delay,mix,'input_1'),(kit,mix,'input_2'),(mix,out,'input')]:wire(s,t,n)
lab=json.loads((root/'integrations/comfyui_genereti/workflows/ꘇ-Tutorial-Authoring.json').read_text());lesson=next(n for n in lab['nodes'] if n['type']=='GeneretiDatLesson');lesson.update(id=11,title='ꘇ modular audio · start here',pos=[0,740],size=[740,560],order=10)
guide={'format':'genereti-guide','version':1,'id':'modular-audio','title':'A modular Web Audio patch','summary':'Patch instruments, effects and a mixer independently of Comfy execution.','steps':[
 {'title':'Enable the output','text':'Sound starts only when you press ▷ on mod.output. Queue never plays audio. Begin with a low output level.','target':{'nodeType':'GeneretiAudioOutput','part':'node'}},
 {'title':'Change the melody','text':'Edit MIDI pitches in the note grid; - is a rest. Both sequences share transport BPM and swing. Edits reset pending notes.','target':{'nodeType':'GeneretiAudioSequence','part':'node'}},
 {'title':'Edit the drums','text':'The three rows are kick, snare and hi-hat. Click steps to enable or disable them.','target':{'nodeType':'GeneretiAudioDrumSequence','part':'node'}},
 {'title':'Shape the synth','text':'Choose a voice and change ADSR or cutoff. The notes socket also accepts OpenTouch CHOP and MIDI channels. Audition keys work while a connected output runs.','target':{'nodeType':'GeneretiAudioSynth','part':'node'}},
 {'title':'Mix and process','text':'Follow the live audio bus through gain/pan, filter and delay into mixer channel 1. Drums enter channel 2. Use M to mute, S to solo, or drag channel faders. Parameters remain normal Comfy controls.','target':{'nodeType':'GeneretiAudioMixer','part':'node'}},
 {'title':'Stop and save','text':'▷ toggles the output off. The square Panic button stops all modular outputs. Saved workflows retain the patch and patterns, never permission to play sound. Browser timing can degrade when backgrounded.','target':{'nodeType':'GeneretiAudioOutput','part':'node'}}]}
lesson['widgets_values']=[json.dumps(guide,ensure_ascii=False,indent=2),'Live'];nodes.append(lesson)
flow={'last_node_id':11,'last_link_id':len(links),'nodes':nodes,'links':links,'groups':[],'config':{},'extra':{'ds':{'scale':.43,'offset':[100,170]}},'version':.4}
path=root/'integrations/comfyui_genereti/workflows/ꘇ-Modular-Audio.json';path.write_text(json.dumps(flow,ensure_ascii=False,indent=2)+'\n');print(path)
