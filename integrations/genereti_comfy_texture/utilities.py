"""Queued, model-free counterparts to utility WGSL; BHWC straight RGBA."""
import math
import torch
import torch.nn.functional as F
from . import ops

LUMA=(.2126,.7152,.0722)
PALETTES={
    'grayscale':[(0,0,0),(1,1,1)],
    'heat':[(0,0,0),(1,0,0),(1,1,0),(1,1,1)],
    'cool':[(0,1,1),(1,0,1)],
    'viridis':[(.267,.005,.329),(.230,.322,.546),(.128,.567,.551),(.369,.789,.383),(.993,.906,.144)],
}


def lum(a): return (a[...,:3]*a.new_tensor(LUMA)).sum(-1,keepdim=True)


def span(low,high):
    if high<=low: raise ValueError('High/white level must exceed low/black level')
    return high-low


def level(image,black,white,brightness,contrast,saturation,gamma,output_black,output_white):
    a=ops.rgba(image);x=(a[...,:3]-black)/span(black,white)
    x=(x*brightness-.5)*contrast+.5
    x=torch.lerp(lum(x),x,saturation).clamp(0,1).pow(1/max(gamma,.01))
    return torch.cat(((output_black+x*(output_white-output_black)).clamp(0,1),a[...,3:]),-1)


def tap(a,x,y):
    h,w=a.shape[1:3];return a[:,torch.arange(h,device=a.device).add(y).clamp(0,h-1)[:,None],torch.arange(w,device=a.device).add(x).clamp(0,w-1)[None,:]]


def gradient(a,algorithm='sobel'):
    l=lum(a)*a[...,3:];c=10 if algorithm=='scharr' else 2;d=3 if algorithm=='scharr' else 1
    gx=d*(tap(l,1,-1)-tap(l,-1,-1))+c*(tap(l,1,0)-tap(l,-1,0))+d*(tap(l,1,1)-tap(l,-1,1))
    gy=d*(tap(l,-1,1)-tap(l,-1,-1))+c*(tap(l,0,1)-tap(l,0,-1))+d*(tap(l,1,1)-tap(l,1,-1))
    scale=16 if algorithm=='scharr' else 4
    return gx/scale,gy/scale


def edge(image,algorithm,strength,threshold,invert):
    a=ops.rgba(image)
    if algorithm=='laplacian':
        l=lum(a)*a[...,3:];e=(4*l-tap(l,1,0)-tap(l,-1,0)-tap(l,0,1)-tap(l,0,-1)).abs()
    else:
        gx,gy=gradient(a,algorithm);e=(gx.square()+gy.square()).sqrt()
    e=((e*strength-threshold)/max(1-threshold,1e-6)).clamp(0,1)
    if invert:e=1-e
    return torch.cat((e.expand(*e.shape[:-1],3),a[...,3:]),-1)


def hsv_to_rgb(h,s,v):
    phase=h+torch.tensor((0.,2/3,1/3),device=h.device,dtype=h.dtype)
    pigment=(torch.remainder(phase,1)*6-3).abs().sub(1).clamp(0,1)
    return v*(1-s+s*pigment)


def hsv(image,hue,saturation,value):
    a=ops.rgba(image);x=a[...,:3];hi,idx=x.max(-1,keepdim=True);lo=x.min(-1,keepdim=True).values;d=hi-lo
    r,g,b=x.split(1,-1);h=torch.where(idx==0,(g-b)/d.clamp_min(1e-8),torch.where(idx==1,(b-r)/d.clamp_min(1e-8)+2,(r-g)/d.clamp_min(1e-8)+4))/6
    h=torch.where(d>1e-8,h,torch.zeros_like(h))
    rgb=hsv_to_rgb(torch.remainder(h+hue,1),(d/hi.clamp_min(1e-8)*saturation).clamp(0,1),(hi*value).clamp(0,1))
    return torch.cat((rgb,a[...,3:]),-1)


def rgb(image,**v):
    a=ops.rgba(image);gain=a.new_tensor([v[c+'_gain'] for c in ('red','green','blue')]);offset=a.new_tensor([v[c+'_offset'] for c in ('red','green','blue')])
    return torch.cat(((a[...,:3]*gain+offset).clamp(0,1),a[...,3:]),-1)


def colormap(image,palette,low,high,invert,mix):
    a=ops.rgba(image);t=((lum(a)-low)/span(low,high)).clamp(0,1)
    if invert:t=1-t
    if palette=='rainbow':color=hsv_to_rgb(t*5/6,torch.ones_like(t),torch.ones_like(t))
    else:
        anchors=a.new_tensor(PALETTES[palette]);pos=t.squeeze(-1)*(len(anchors)-1);i=pos.floor().long().clamp(0,len(anchors)-2)
        color=torch.lerp(anchors[i],anchors[i+1],(pos-i).unsqueeze(-1))
    return torch.cat((torch.lerp(a[...,:3],color,mix),a[...,3:]),-1)


def convolve(image,normalize,bias,mix,**v):
    a=ops.rgba(image);weights=[v['k'+str(i)] for i in range(9)];total=sum(weights)
    divisor=total if normalize and abs(total)>1e-6 else 1
    acc=torch.zeros_like(a[...,:3])
    for i,k in enumerate(weights):
        neighbor=tap(a,i%3-1,i//3-1);acc+=torch.where(neighbor[...,3:]>1e-8,neighbor[...,:3],a[...,:3])*k
    return torch.cat((torch.lerp(a[...,:3],(acc/divisor+bias).clamp(0,1),mix),a[...,3:]),-1)


def emboss(image,angle,strength,bias,mix):
    a=ops.rgba(image);gx,gy=gradient(a);theta=math.radians(angle)
    e=(bias+strength*(gx*math.cos(theta)+gy*math.sin(theta))).clamp(0,1)
    return torch.cat((torch.lerp(a[...,:3],e.expand(*e.shape[:-1],3),mix),a[...,3:]),-1)


def ramp(x,low,high):
    t=((x-low)/max(high-low,1e-6)).clamp(0,1);return t*t*(3-2*t)


def key(image,mode,red,green,blue,low,high,invert,despill,output):
    if high<low:raise ValueError('Key high must be at least low')
    a=ops.rgba(image);color=a.new_tensor((red,green,blue));distance=(a[...,:3]-color).square().sum(-1,keepdim=True).sqrt()/math.sqrt(3)
    matte=ramp(lum(a) if mode=='luma' else distance,low,high)
    if invert:matte=1-matte
    if output=='matte':return torch.cat((matte.expand(*matte.shape[:-1],3),torch.ones_like(matte)),-1)
    x=a[...,:3].clone()
    if mode=='chroma' and despill:
        k=int(color.argmax());other=[i for i in range(3) if i!=k];neutral=x[...,other].mean(-1)
        x[...,k]-=(x[...,k]-neutral).clamp_min(0)*despill*(1-matte.squeeze(-1))
    return torch.cat((x,a[...,3:]*matte),-1)


def lookup(image,lookup,mode,row,mix):
    a=ops.rgba(image);lut=ops.rgba(lookup).to(a);w,h=lut.shape[2],lut.shape[1]
    if lut.shape[0] not in (1,a.shape[0]):raise ValueError('Lookup batches must match, or contain one image')
    # LUT color is independent of alpha, including transparent palette texels.
    lut=torch.cat((lut[...,:3],torch.ones_like(lut[...,3:])), -1)
    colors=[]
    for c in range(3):
        t=lum(a)[...,0] if mode=='luma' else a[...,c]
        u=(t*(w-1)+.5)/w;v=torch.full_like(u,(row*(h-1)+.5)/h)
        # ops.sample uses a shared grid, so process each image batch independently.
        colors.append(torch.cat([ops.sample(lut[min(i,lut.shape[0]-1):min(i,lut.shape[0]-1)+1],torch.stack((u[i],v[i]),-1))[...,c:c+1] for i in range(a.shape[0])]))
    return torch.cat((torch.lerp(a[...,:3],torch.cat(colors,-1),mix),a[...,3:]),-1)


def match_clamped(image,other):
    a,b=ops.rgba(image),ops.rgba(other).to(image)
    if b.shape[1:3]!=a.shape[1:3]:
        premul=torch.cat((b[...,:3]*b[...,3:],b[...,3:]),-1)
        resized=F.interpolate(premul.permute(0,3,1,2),size=a.shape[1:3],mode='bilinear',align_corners=False).permute(0,2,3,1)
        b=torch.cat((resized[...,:3]/resized[...,3:].clamp_min(1e-8),resized[...,3:]),-1)
    if b.shape[0]==1:b=b.expand(a.shape[0],-1,-1,-1)
    if b.shape[0]!=a.shape[0]:raise ValueError('Image batches must match, or B must contain one image')
    return a,b


def mask(image,mask,channel,operation,invert,strength):
    a,b=match_clamped(image,mask)
    m=b[...,3:] if channel=='alpha' else (lum(b) if channel=='luma' else b[...,['red','green','blue'].index(channel):['red','green','blue'].index(channel)+1])*b[...,3:]
    if invert:m=1-m
    alpha=a[...,3:]*m if operation=='multiply' else m
    return torch.cat((a[...,:3],torch.lerp(a[...,3:],alpha,strength)),-1)


def analysis_size(width,height,analysis_width):
    scale=min(1,analysis_width/max(width,height));return max(1,round(width*scale)),max(1,round(height*scale))


def resize_analysis(a,analysis_width):
    w,h=analysis_size(a.shape[2],a.shape[1],analysis_width)
    y,x=torch.meshgrid(torch.arange(h,device=a.device,dtype=a.dtype),torch.arange(w,device=a.device,dtype=a.dtype),indexing='ij')
    return ops.sample(a,torch.stack(((x+.5)/w,(y+.5)/h),-1))


def optical_flow(image,previous,analysis_width,max_motion,regularization):
    a=resize_analysis(ops.rgba(image),analysis_width);out=torch.zeros_like(a);out[...,:2]=.5;out[...,3]=1
    if previous is None:return out
    b=resize_analysis(match_clamped(image,previous)[1],analysis_width);la=lum(a)*a[...,3:];lb=lum(b)*b[...,3:]
    avg=(la+lb)*.5;ix=(tap(avg,1,0)-tap(avg,-1,0))*.5;iy=(tap(avg,0,1)-tap(avg,0,-1))*.5;it=la-lb
    def box(x):return F.avg_pool2d(F.pad(x.permute(0,3,1,2),(2,2,2,2),mode='replicate'),5,stride=1).permute(0,2,3,1)
    xx=box(ix*ix);yy=box(iy*iy);xy=box(ix*iy);xt=box(ix*it);yt=box(iy*it)
    det=(xx+regularization)*(yy+regularization)-xy*xy
    dx=(xy*yt-(yy+regularization)*xt)/det.clamp_min(1e-12);dy=(xy*xt-(xx+regularization)*yt)/det.clamp_min(1e-12)
    out[...,0:1]=.5+dx.clamp(-max_motion,max_motion)/(2*max_motion);out[...,1:2]=.5+dy.clamp(-max_motion,max_motion)/(2*max_motion)
    out[...,2:3]=((xx*yy-xy*xy)/(xx*yy+regularization)).clamp(0,1)
    return out


BLOB_HEADER=['batch','id','x','y','width','height','area','vx','vy','age']


def blobs(image,channel,threshold,invert,analysis_width,min_area,max_blobs,**tracking):
    import numpy as np
    from scipy import ndimage
    a=ops.rgba(image);m=(a[...,3:] if channel=='alpha' else lum(a)*a[...,3:])>=threshold
    if invert:m=~m
    image_mask=torch.cat((m.expand(*m.shape[:-1],3),torch.ones_like(m)),-1).to(a)
    small=resize_analysis(image_mask,analysis_width);rows=[BLOB_HEADER];all_blobs=[]
    for batch in range(a.shape[0]):
        binary=small[batch,...,0].detach().cpu().numpy()>=.5;h,w=binary.shape
        labels,count=ndimage.label(binary,structure=np.ones((3,3)));objects=ndimage.find_objects(labels);items=[]
        for label,box in enumerate(objects,1):
            if box is None:continue
            yy,xx=np.nonzero(labels[box]==label);area=len(xx)/(w*h)
            if area<min_area:continue
            y,x=box;items.append(dict(x=float((xx.mean()+x.start+.5)/w),y=float((yy.mean()+y.start+.5)/h),width=(x.stop-x.start)/w,height=(y.stop-y.start)/h,area=area))
        items.sort(key=lambda b:b['area'],reverse=True)
        for i,item in enumerate(items[:max_blobs]):
            item.update(batch=batch,id=i+1,vx=0,vy=0,age=1);all_blobs.append(item);rows.append([str(item[k]) for k in BLOB_HEADER])
    return image_mask,dict(rows=rows,jsonValue={'blobs':all_blobs})
