"""Expressive modulation: queue evaluates explicit time, never records or starts playback."""
import json
import math
import re
import numpy as np
from comfy_api.latest import io
from .signals import signal
CHOP=io.Custom('GENERETI_CHOP')
INTERVALS=['free','4m','2m','1m','1n','2nd','2n','2nt','4nd','4n','4nt','8nd','8n','8nt','16nd','16n','16nt','32n','64n']
EMPTY=json.dumps(dict(version=1,duration=1,points=[]))
def number(name,value,low=-100000,high=100000):return io.Float.Input(name,default=value,min=low,max=high,step=.01)
def timing():return [io.Combo.Input('interval',options=INTERVALS,default='free'),number('speed',1,.01,16),number('smooth',0,0,10),number('time',0),io.Int.Input('samples',default=1,min=1,max=4096),number('sample_rate',60,1,1000),io.String.Input('performance',default='{}',optional=True)]
def quarter_notes(interval,signature=None):
    signature=signature or dict(numerator=4,denominator=4)
    bar=re.fullmatch(r'(\d+)m',interval)
    if bar:return int(bar[1])*signature['numerator']*4/signature['denominator']
    note=re.fullmatch(r'(\d+)n([dt]?)',interval)
    if not note:raise ValueError('Choose a musical interval')
    return 4/int(note[1])*(1.5 if note[2]=='d' else 2/3 if note[2]=='t' else 1)
def wave(shape,phase,seed=0):
    p=phase-np.floor(phase)
    def random(n):
        r=np.sin(n*12.9898+seed*78.233)*43758.5453;return r-np.floor(r)
    if shape=='triangle':return 1-abs(p*2-1)
    if shape=='saw':return p
    if shape=='reverse saw':return 1-p
    if shape=='square':return np.where(p<.5,1.,0.)
    if shape=='sample & hold':return random(np.floor(phase))
    if shape=='smooth noise':
        a=random(np.floor(phase));b=random(np.floor(phase)+1);k=p*p*(3-2*p);return a+(b-a)*k
    return .5-.5*np.cos(p*np.pi*2)
def validate_gesture(value):
    clip=json.loads(value) if isinstance(value,str) else value
    if not isinstance(clip,dict) or clip.get('version')!=1 or not isinstance(clip.get('duration'),(float,int)) or not math.isfinite(clip['duration']) or not 0<clip['duration']<=600 or not isinstance(clip.get('points'),list) or len(clip['points'])>8192:raise ValueError('Invalid gesture recording')
    last=-1
    for p in clip['points']:
        if not isinstance(p,dict) or not all(isinstance(p.get(k),(int,float)) and math.isfinite(p[k]) for k in ('t','x','y')) or not 0<=p['t']<=clip['duration'] or p['t']<last or not 0<=p['x']<=1 or not 0<=p['y']<=1:raise ValueError('Invalid gesture point')
        last=p['t']
    return clip
def phase_values(v,duration):
    n=int(v.get('samples',1));rate=float(v.get('sample_rate',60));t=float(v.get('time',0))+np.arange(n)/rate
    s=json.loads(v.get('performance','{}')) if isinstance(v.get('performance','{}'),str) else v.get('performance',{})
    if v.get('interval','free')=='free':phase=t/max(.001,duration)
    else:phase=(float(s.get('quarterNotes',0))+t*float(s.get('bpm',120))/60)/quarter_notes(v['interval'],s.get('signature'))
    return phase*float(v.get('speed',1)),rate,t

def filtered(values,rate,seconds):
    if seconds<=0:return values
    out=np.array(values,copy=True);k=1-math.exp(-1/rate/seconds)
    for i in range(1,len(out)):out[i]=out[i-1]+(out[i]-out[i-1])*k
    return out
class Lfo(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiChopLfo',display_name='ꘇ chop.lfo',category='ꘇ / CHOP',search_aliases=['lfo','modulation','genereti'],description='Interactive LFO. Free time or musical intervals follow project transport. Smooth and scale the output; connect value to numeric controls.',inputs=[io.Combo.Input('wave',options=['sine','triangle','saw','reverse saw','square','sample & hold','smooth noise']),number('period',2,.01,600),number('low',0),number('high',1),number('phase',0,-16,16),io.Int.Input('seed',default=0,min=0,max=100000,control_after_generate=False),*timing()],outputs=[CHOP.Output(display_name='channels'),io.Float.Output(display_name='value')])
    @classmethod
    def execute(cls,**v):
        phase,rate,t=phase_values(v,v['period']);values=wave(v['wave'],phase+v['phase'],v['seed']);values=v['low']+(v['high']-v['low'])*values;values=filtered(values,rate,v['smooth']);return io.NodeOutput(signal({'lfo':values},rate,float(t[0])),float(values[-1]))
class Gesture(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiChopGesture',display_name='ꘇ chop.gesture',category='ꘇ / CHOP',search_aliases=['gesture','record','xy','genereti'],description='Record X, Y or XY gestures. Preserve real timing or retime to a musical interval. Recording is explicit and saved in the workflow; Queue samples the saved recording.',inputs=[io.Combo.Input('mode',options=['XY','X','Y']),number('x_low',0),number('x_high',1),number('y_low',0),number('y_high',1),io.Boolean.Input('loop',default=True),io.Boolean.Input('quantize',default=True),io.String.Input('recording',default=EMPTY,socketless=True),*timing()],outputs=[CHOP.Output(display_name='channels'),io.Float.Output(display_name='x'),io.Float.Output(display_name='y'),io.Float.Output(display_name='value')])
    @classmethod
    def execute(cls,**v):
        clip=validate_gesture(v['recording']);phase,rate,t=phase_values(v,clip['duration']);p=phase-np.floor(phase) if v['loop'] else np.clip(phase,0,1);points=clip['points'];values=[]
        for axis in ('x','y'):
            raw=np.interp(p*clip['duration'],[p['t'] for p in points],[p[axis] for p in points]) if points else np.full(len(phase),.5)
            values.append(filtered(v[axis+'_low']+(v[axis+'_high']-v[axis+'_low'])*raw,rate,v['smooth']))
        x,y=values;value=y if v['mode']=='Y' else x;return io.NodeOutput(signal(dict(x=x,y=y),rate,float(t[0])),float(x[-1]),float(y[-1]),float(value[-1]))
MODULATION=[Lfo,Gesture]
