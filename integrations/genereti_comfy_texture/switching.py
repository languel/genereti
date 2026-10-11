"""Model-free source selection and conservative structured interpolation."""
import math

def pair(index,mode,count):
    if not count:raise ValueError('Connect at least one switch source')
    x=float(index)
    if not math.isfinite(x):raise ValueError('Switch index must be finite')
    x=max(0,min(count-1,x));a=math.floor(x)
    return a,min(a+1,count-1),x-a if mode=='float' else 0.

def sources(values):return [v for k,v in sorted(values.items(),key=lambda kv:int(kv[0].removeprefix('source'))) if v is not None]

def interpolate(a,b,t):
    if t==0:return a
    if t==1:return b
    if type(a) in (int,float) and type(b) in (int,float) and math.isfinite(a) and math.isfinite(b):return a+(b-a)*t
    if isinstance(a,dict) and isinstance(b,dict):
        near=a if t<.5 else b
        return {k:interpolate(a[k],b[k],t) if k in a and k in b else near[k] for k in near}
    if isinstance(a,list) and isinstance(b,list) and len(a)==len(b):return [interpolate(x,y,t) for x,y in zip(a,b)]
    return a if t<.5 else b
