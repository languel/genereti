"""Run and save real comparisons against the running server, one request at a time."""
import argparse,json,base64,time
from pathlib import Path
import httpx,cv2,numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8766);p.add_argument('--frames',type=int,default=5);a=p.parse_args()
base=f'http://127.0.0.1:{a.port}'
folder=ROOT/'artifacts'/'control-comparison';folder.mkdir(exist_ok=True)
image=Image.open(ROOT/'artifacts'/'coreml-text-512.png')
sketch=Image.open(ROOT/'artifacts'/'sketch-input.png')
pose=Image.new('RGB',(512,512),'black');d=ImageDraw.Draw(pose)
points=[(.5,.16),(.5,.28),(.38,.3),(.27,.42),(.17,.25),(.62,.3),(.73,.42),(.83,.25),(.43,.55),(.38,.73),(.33,.9),(.57,.55),(.62,.73),(.67,.9),(.47,.145),(.53,.145),(.44,.16),(.56,.16)]
points=[(int(x*512),int(y*512)) for x,y in points]
bones=[(1,2),(1,5),(2,3),(3,4),(5,6),(6,7),(1,8),(8,9),(9,10),(1,11),(11,12),(12,13),(1,0),(0,14),(14,16),(0,15),(15,17)]
colors=['#ff0000','#ff5500','#ffaa00','#ffff00','#aaff00','#55ff00','#00ff00','#00ff55','#00ffaa','#00ffff','#00aaff','#0055ff','#0000ff','#5500ff','#aa00ff','#ff00ff','#ff00aa','#ff0055']
for i,(j,k) in enumerate(bones):d.line([points[j],points[k]],fill=colors[i],width=8)
for i,(x,y) in enumerate(points):d.ellipse((x-5,y-5,x+5,y+5),fill=colors[i])
pose.save(folder/'pose-guide.png');image.save(folder/'source.png')
canny=Image.fromarray(cv2.Canny(np.asarray(image),100,200)).convert('RGB');canny.save(folder/'canny-guide.png')
depth=Image.new('RGB',(512,512),'#222222');d=ImageDraw.Draw(depth);d.rounded_rectangle((180,170,330,350),radius=45,fill='#dddddd');d.ellipse((200,50,310,160),fill='#eeeeee');d.line([(190,200),(100,150),(60,80)],fill='#bbbbbb',width=45);d.line([(320,200),(410,150),(450,80)],fill='#bbbbbb',width=45);d.line([(215,330),(160,460)],fill='#aaaaaa',width=48);d.line([(295,330),(350,460)],fill='#aaaaaa',width=48);depth.save(folder/'depth-guide.png')
report={}
cases=[('text','base',None),('sketch','base',sketch),('text','anime',None),('sketch','anime',sketch),('image','base',image),('canny','base',canny),('depth','base',depth),('pose','base',pose)]
with httpx.Client(timeout=180) as client:
 for mode,style,source in cases:
  key=f'{mode}-{style}'
  params=dict(prompt='a friendly colorful toy robot, full body, arms raised, studio lighting, 3d render',mode=mode,style=style,strength=.65,control_scale=1.,seed=42,preprocess=False)
  if source:
   import io
   buf=io.BytesIO();source.save(buf,'PNG');params['image']=base64.b64encode(buf.getvalue()).decode()
  times=[]
  for i in range(a.frames+1):
   t=time.perf_counter();r=client.post(base+'/api/generate',json=params)
   if r.status_code!=200:
    print(key,r.status_code,r.text,flush=True);report[key]={'error':r.text};break
   elapsed=(time.perf_counter()-t)*1000
   if i:times.append({'roundtrip_ms':elapsed,'inference_ms':float(r.headers['x-inference-ms'])})
   if i==a.frames:(folder/(key+'.jpg')).write_bytes(r.content)
   print(key,i,round(elapsed,1),flush=True)
  if times:report[key]={'fps':1000/np.mean([x['roundtrip_ms'] for x in times]),'median_ms':float(np.median([x['roundtrip_ms'] for x in times])),'frames':times}
(folder/'results.json').write_text(json.dumps(report,indent=2))
