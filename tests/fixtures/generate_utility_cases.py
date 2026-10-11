import sys,types,importlib.util,json
from pathlib import Path
import torch
repo=Path(__file__).resolve().parents[2];root=repo/'integrations/genereti_comfy_texture';pkg=types.ModuleType('utility_pack');pkg.__path__=[str(root)];sys.modules[pkg.__name__]=pkg
spec=importlib.util.spec_from_file_location(pkg.__name__+'.utilities',root/'utilities.py');u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)
torch.manual_seed(2);a=torch.randint(0,256,(1,32,32,4)).float()/255;a[...,3]=1
specs=[('Level',dict(black=.1,white=.9,brightness=1.1,contrast=1.2,saturation=.7,gamma=1.3,output_black=.1,output_white=.95),'level'),('Edge',dict(algorithm='scharr',strength=2,threshold=.1,invert=False),'edge'),('HSV',dict(hue=.2,saturation=.8,value=.9),'hsv'),('RGB',dict(red_gain=1.1,green_gain=.8,blue_gain=1.2,red_offset=.1,green_offset=-.1,blue_offset=0),'rgb'),('ColorMap',dict(palette='viridis',low=.1,high=.9,invert=False,mix=.9),'colormap'),('Convolve',dict(**{'k'+str(i):[-1,-1,-1,-1,8,-1,-1,-1,-1][i] for i in range(9)},normalize=True,bias=.5,mix=.8),'convolve'),('Emboss',dict(angle=135,strength=2,bias=.5,mix=1),'emboss'),('Key',dict(mode='chroma',red=0,green=1,blue=0,low=.1,high=.5,invert=False,despill=.8,output='image'),'key')]
cases=[]
def pixels(t):return dict(width=t.shape[2],height=t.shape[1],data=t.mul(255).round().clamp(0,255).to(torch.uint8).flatten().tolist())
def add(kind,values,source,out,b=None):cases.append(dict(kind=kind,values=values,a=pixels(source),b=pixels(b) if b is not None else None,expected=pixels(out)['data']))
for kind,v,fn in specs:add(kind,v,a,getattr(u,fn)(a,**v))
lut=torch.randint(0,256,(1,4,8,4)).float()/255;v=dict(mode='channels',row=.4,mix=.8);add('Lookup',v,a,u.lookup(a,lut,**v),lut)
m=torch.ones(1,8,8,4);m[...,3]=128/255;v=dict(channel='luma',operation='multiply',invert=False,strength=.8);add('Mask',v,a,u.mask(a,m,**v),m)
y,x=torch.meshgrid(torch.arange(32),torch.arange(32),indexing='ij');g=torch.exp(-((x-16)**2+(y-16)**2)/30.).mul(255).round()/255
old=torch.cat((g[None,:,:,None].expand(1,32,32,3),torch.ones(1,32,32,1)),-1);now=old.roll(1,2);v=dict(analysis_width=256,max_motion=8,regularization=.00001);add('OpticalFlow',v,now,u.optical_flow(now,old,**v),old)
a=torch.zeros(1,32,32,4);a[...,3]=1;a[:,4:12,4:12,:3]=1;a[:,18:26,18:26,:3]=1
v=dict(channel='luma',threshold=.5,invert=False,analysis_width=256,min_area=.001,max_blobs=32,track_distance=.1,hold_frames=3);add('Blobs',v,a,u.blobs(a,**v)[0])
target=repo/'output/playwright/utility-cases.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(cases))
