import sys, json, time, argparse
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import numpy as np
from PIL import Image, ImageDraw
from engine import Engine, ROOT
p=argparse.ArgumentParser();p.add_argument('--control',action='store_true');p.add_argument('--frames',type=int,default=30);p.add_argument('--size',type=int,default=512)
a=p.parse_args()
engine=Engine(a.size,control=a.control)
canvas=Image.new('RGB',(512,512),'white');d=ImageDraw.Draw(canvas)
d.ellipse((155,55,355,225),outline='black',width=8)
d.arc((120,195,390,520),180,360,fill='black',width=8)
d.line([(120,355),(75,260),(45,175)],fill='black',width=12)
d.line([(390,355),(430,250),(470,150)],fill='black',width=12)
canvas.save(ROOT/'artifacts'/'sketch-input.png')
report={'hardware':'Apple M5 Max / 40 GPU cores / 128 GB RAM','backend':'Core ML CPU_AND_GPU','size':a.size,'modes':{}}
for mode in (['text','image','sketch'] if a.control else ['text','image']):
    stats=[]
    for i in range(a.frames+3):
        image,metrics=engine.generate('a friendly robot, rounded metal body, waving arms, colorful studio portrait',canvas,mode=mode)
        if i>=3: stats.append(metrics)
        print(mode,i,metrics,flush=True)
    image.save(ROOT/'artifacts'/f'coreml-{mode}-{a.size}.png')
    times=[x['inference_ms'] for x in stats]
    report['modes'][mode]={'frames':a.frames,'mean_ms':float(np.mean(times)),'median_ms':float(np.median(times)), 'p95_ms':float(np.percentile(times,95)), 'fps':1000/float(np.mean(times)),'stages':stats}
output=ROOT/'artifacts'/f'benchmark-{a.size}{"-control" if a.control else ""}.json'
output.write_text(json.dumps(report,indent=2))
print('REPORT',output,flush=True)
