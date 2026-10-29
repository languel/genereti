#!/usr/bin/env python3
"""Build the model-free Neuron Dance patch from the checked-in lessons."""
import copy, json, uuid
from pathlib import Path
R=Path(__file__).resolve().parents[1]
W=R/'integrations/comfyui_genereti/workflows'
L=R/'integrations/genereti_comfy_agent/web/lessons'
flow=json.loads((W/'ꘇ-Braindance-Breaks.json').read_text())
av=json.loads((W/'ꘇ-Livecode-Audio-Visual.json').read_text())
flow['nodes']=[n for n in flow['nodes'] if n['type']!='GeneretiDatLesson']
flow['last_node_id']=12
nodes={n['id']:n for n in flow['nodes']}
for old,new,pos in [(6,13,[2700,0]),(9,14,[2700,420]),(10,15,[3100,0]),(11,16,[3450,0]),(12,17,[3850,0]),(13,18,[4320,0]),(14,19,[-850,0])]:
 n=copy.deepcopy(next(x for x in av['nodes'] if x['id']==old));n['id']=new;n['order']=new-1;n['pos']=pos
 n['properties']['generetiLessonRef']=str(uuid.uuid5(uuid.NAMESPACE_URL,'neuron-dance:'+str(new)))
 for p in n['inputs']: p['link']=None
 for p in n['outputs']: p['links']=[]
 nodes[new]=n;flow['nodes'].append(n)
for n in nodes.values():
 if n['id']<=12:
  n['properties']['generetiLessonRef']=str(uuid.uuid5(uuid.NAMESPACE_URL,'neuron-dance:'+str(n['id'])))
def wire(a,slot,b,name):
 source,target=nodes[a],nodes[b]; dest=next(i for i,p in enumerate(target['inputs']) if p['name']==name); lid=len(flow['links'])+1
 assert target['inputs'][dest]['link'] is None
 target['inputs'][dest]['link']=lid;source['outputs'][slot]['links'].append(lid);flow['links'].append([lid,a,slot,b,dest,source['outputs'][slot]['type']])
n={'id':20,'type':'GeneretiLiveRecorder','title':'ꘇ capture · music video','pos':[4320,530],'size':[400,360],'flags':{},'order':19,'mode':0,'inputs':[{'name':'image','type':'IMAGE','link':None},{'name':'audio','type':'GENERETI_AUDIO_BUS','link':None}],'outputs':[],'properties':{'Node name for S&R':'GeneretiLiveRecorder','generetiLessonRef':str(uuid.uuid5(uuid.NAMESPACE_URL,'neuron-dance:20')),'genereti_record_mode':'av','genereti_record_timing':'loop'},'widgets_values':[]}
nodes[20]=n;flow['nodes'].append(n)
for a,s,b,p in [(10,0,13,'input'),(10,0,14,'input'),(13,1,15,'input'),(15,0,16,'input'),(16,1,17,'controls.value0'),(17,0,18,'image'),(17,0,20,'image'),(12,0,20,'audio')]:wire(a,s,b,p)
code='''let energy = 0.0; /* 0..1 */
let sensitivity = 1.0; /* 0.1..3 */
function setup(){ createCanvas(windowWidth,windowHeight); colorMode(HSB,360,100,100,100); }
function draw(){
  background(235,70,5,18);
  let e=constrain(energy*sensitivity,0,1), t=__.time;
  translate(width/2,height/2); noFill();
  for(let j=0;j<7;j++){
    stroke((180+j*22+t*8)%360,80,100,30+e*55); strokeWeight(1+e*3);
    beginShape();
    for(let i=0;i<=120;i++){
      let a=i*TWO_PI/120, r=(0.12+j*0.045)*min(width,height)*(1+e*0.7);
      let ripple=1+0.18*sin(a*6+t*(1+j*.13));
      vertex(cos(a)*r*ripple+sin(a*3+t*.8)*e*35,sin(a)*r*ripple+cos(a*2-t)*e*25);
    }
    endShape(CLOSE);
  }
  for(let i=0;i<20;i++){
    let a=i*TWO_PI/20+t*.25, r=min(width,height)*(.12+.32*abs(sin(i*2.7+t*.18)));
    stroke(185+i*5,65,100,35+e*55); line(cos(a)*r,sin(a)*r,cos(a+0.4)*r*.65,sin(a+0.4)*r*.65);
    noStroke(); fill(185+i*5,50,100,45+e*50); circle(cos(a)*r,sin(a)*r,2+e*8);
  }
}'''
n=nodes[17];n['title']='ꘇ neuron dance · reactive p5';n['properties']['generetiLivecodeLastGood']['source']=code
n['properties']['genereti_widget_values']['code']=code;n['widgets_values_named']['code']=code;n['widgets_values'][4]=code
nodes[14]['title']='ꘇ lissajous · stereo trace'
flow['extra']['generetiPerformance']['duration']=60*4*16/172
flow['extra']['generetiPerformance']['transport']['loop']={'enabled':True,'start':0,'end':60*4*16/172}
steps=[('Start the music',12,'Press Start on mod.output and play the project transport. Keep the volume low.','Loading the patch never starts audio.'),('Watch the signal',13,'The mixer feeds audio analysis and the stereo lissajous. RMS controls the neuron drawing.','The analysis is sampled control data, not a recording.'),('Shape the neurons',17,'Open the p5 preview with Alt+W. Adjust the unconnected sensitivity parameter, or edit the code and colors.','The drawing follows project time and audio energy.'),('Perform 16 bars',1,'The project loop spans 16 bars at 172 BPM, about 22.3 seconds. Use the mixer and instrument controls to perform.','Tempo changes require adjusting the loop end to 16 × 4 × 60 / BPM seconds.'),('Record sound and automation',12,'Use the record control on mod.output to save a sound take. In the performance dock select one numeric parameter and use Record to capture its changes.','Audio and parameter recording are separate and are not automatically aligned. Numeric takes record one parameter at a time.'),('Capture and transform',20,'Choose Audio + video and One project loop, then press ● while the transport and output run. The recorder starts at the next loop and saves after one pass.','Manual mode starts immediately; Video only and Audio only are also available. Timing follows browser scheduling, not sample-exact offline rendering. See docs/neuron-dance.md for model routes.')]
guide={'format':'genereti-guide','version':1,'id':'neuron-dance','title':'Neuron Dance · Braindance music video','summary':'A 16-bar sound-reactive visual performance and model-rendering experiment.','steps':[]}
for title,i,txt,hint in steps:guide['steps'].append({'title':title,'text':txt,'target':{'nodeType':nodes[i]['type'],'ref':nodes[i]['properties']['generetiLessonRef'],'part':'node'},'hint':hint})
s=json.dumps(guide,ensure_ascii=False,indent=2); n=nodes[19];n['title']='ꘇ Neuron Dance · start here'; n['properties']['genereti_widget_values']['guide']=s;n['widgets_values_named']['guide']=s;n['widgets_values'][0]=s
flow['last_node_id']=20;flow['last_link_id']=len(flow['links'])
flow['extra']['ds']['offset']=[950,90]
for path in [W/'ꘇ-Neuron-Dance.json',L/'neuron-dance.json']:path.write_text(json.dumps(flow,ensure_ascii=False,indent=2)+'\n')
(L/'neuron-dance-guide.json').write_text(s+'\n')
p=L/'catalog.json'; cat=json.loads(p.read_text());p.write_text(json.dumps([x for x in cat if x.get('id')!='neuron-dance']+[guide],ensure_ascii=False,indent=2)+'\n')
