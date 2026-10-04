"""Named sampled control channels; queue evaluation has explicit time and no I/O."""
import importlib.util
from pathlib import Path
import numpy as np
_spec=importlib.util.spec_from_file_location('genereti_expression',Path(__file__).resolve().parents[1]/'genereti_comfy_texture/expression.py')
_expr=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_expr)

def signal(channels,rate=60,start=0):
    arrays={str(k):np.asarray(v,dtype=np.float32).reshape(-1) for k,v in channels.items()}
    lengths={len(v) for v in arrays.values()}
    if len(lengths)>1 or (lengths and not next(iter(lengths))):raise ValueError('All channels require the same nonzero sample count')
    return dict(channels=arrays,sample_rate=float(rate),start=float(start))

def first(data):return float(next(iter(data['channels'].values()),np.zeros(1))[-1])
def generate(kind,values):
    n=int(values.get('samples',1));rate=float(values.get('sample_rate',60));start=float(values.get('time',0));channels=int(values.get('channels',1));i=np.arange(n);t=start+i/rate
    result={}
    for c in range(channels):
        phase=t*values.get('frequency',1)+values.get('phase',0)
        wave=values.get('wave','sine')
        if kind=='Constant':out=np.full(n,values.get('value',1))
        elif kind=='Noise':out=np.sin((i+np.floor(start*rate)+c*131+values.get('seed',0))*12.9898)*43758.5453;out=(out-np.floor(out))*2-1
        elif kind=='Expression':out=np.broadcast_to(_expr.evaluate(values['expression'],dict(t=t,i=i,x=i/max(1,n-1),y=0,c=c,v=0,a=0,b=0,w=n,h=channels)),(n,))
        else:out={'sine':lambda:np.sin(phase*np.pi*2),'triangle':lambda:1-4*np.abs((phase-np.floor(phase))-.5),'saw':lambda:(phase-np.floor(phase))*2-1,'square':lambda:np.where(phase-np.floor(phase)<.5,1.,-1.),'ramp':lambda:phase-np.floor(phase)}[wave]()
        if kind in ('Oscillator','Noise'):out=out*values.get('amplitude',1)+values.get('offset',0)
        result[f'chan{c}']=out
    return signal(result,rate,start)

def process(kind,data,values,other=None):
    channels=data['channels'];out={};n=len(next(iter(channels.values()),[0]));rate=data['sample_rate']
    if kind=='Select':
        import fnmatch
        patterns=values.get('pattern','*').split();out={k:v for k,v in channels.items() if any(fnmatch.fnmatchcase(k,p) for p in patterns)}
    elif kind=='Merge':
        out=dict(channels)
        for k,v in (other or dict(channels={}))['channels'].items():
            name=k
            while name in out:name+='_'
            out[name]=np.interp(np.arange(n),np.linspace(0,n-1,len(v)),v)
    else:
        for c,(name,v) in enumerate(channels.items()):
            if kind=='Expression':result=np.broadcast_to(_expr.evaluate(values['expression'],dict(t=data['start']+np.arange(n)/rate,i=np.arange(n),x=np.arange(n)/max(1,n-1),y=0,c=c,v=v,a=v,b=0,w=n,h=len(channels))),(n,))
            elif kind=='Math':
                k=values.get('value',1);op=values.get('operation','multiply')
                result={'multiply':lambda:v*k,'add':lambda:v+k,'subtract':lambda:v-k,'divide':lambda:v/(k if abs(k)>1e-9 else 1e-9),'abs':lambda:abs(v),'clamp':lambda:np.clip(v,values.get('low',0),values.get('high',1)),'fit':lambda:values.get('low',0)+(v+1)*.5*(values.get('high',1)-values.get('low',0))}[op]()
            elif kind=='Logic':result=(v>=values.get('threshold',.5)).astype(np.float32)
            elif kind=='Lag':
                k=1-np.exp(-1/(rate*max(.00001,values.get('seconds',.1))));result=np.empty(n);prev=float(v[0])
                for j,x in enumerate(v):prev+=(float(x)-prev)*k;result[j]=prev
            elif kind=='Speed':result=np.cumsum(v)/rate
            elif kind=='Slope':result=np.diff(v,prepend=v[0])*rate
            else:result=v
            out[name]=np.nan_to_num(result,nan=0,posinf=0,neginf=0)
    return signal(out,rate,data['start'])
