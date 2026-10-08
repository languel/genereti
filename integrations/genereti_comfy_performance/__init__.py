"""Workflow performance controllers; Queue evaluates explicit frozen snapshots."""
import json
import math
import numpy as np
from comfy_api.latest import ComfyExtension, io
WEB_DIRECTORY = './web'
CLOCK = io.Custom('GENERETI_AUDIO_CLOCK')
CHOP = io.Custom('GENERETI_CHOP')

def snapshot(value='{}'):
    value=json.loads(value) if isinstance(value,str) else value
    if not isinstance(value,dict):raise ValueError('Clock snapshot must be an object')
    bpm=float(value.get('bpm',120)); seconds=float(value.get('seconds',0)); qn=float(value.get('quarterNotes',seconds*bpm/60))
    if not all(math.isfinite(x) for x in (bpm,seconds,qn)) or bpm<=0:raise ValueError('Invalid clock values')
    meter=value.get('signature',{'numerator':4,'denominator':4}); denominator=float(meter.get('denominator',4)); numerator=float(meter.get('numerator',4))
    if denominator<=0 or numerator<=0:raise ValueError('Invalid meter')
    beat=qn*denominator/4
    return {**value,'version':1,'seconds':seconds,'quarterNotes':qn,'bpm':bpm,'beat':beat,'bar':math.floor(beat/numerator),'beatInBar':beat%numerator,'ticks':math.floor(qn*480+1e-7),'phase':qn%1,'playing':bool(value.get('playing',False)),'iteration':int(value.get('iteration',0)),'ppq':480,'signature':meter,'rate':float(value.get('rate',1))}

def channels(s):
    return {'channels':{k:np.asarray([float(s[k])],dtype=np.float32) for k in ['seconds','quarterNotes','beat','bar','beatInBar','ticks','phase','bpm','playing','iteration']},'sample_rate':25.,'start':s['seconds']}

def schema(kind,name,inputs,outputs):
    return io.Schema(node_id='GeneretiPerformance'+kind,display_name='ꘇ '+name,category='ꘇ / Performance',search_aliases=['genereti',name.split('.')[0], 'time','timeline','transport','scale','music'],inputs=inputs,outputs=outputs,description='Shared browser performance time. Queue uses an explicit frozen snapshot; never starts browser audio.')
class Time(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Time','chop.time',[io.Combo.Input('unit',options=['seconds','quarterNotes','beat','bar','ticks','phase','bpm','playing','iteration','wallTime']),CLOCK.Input('clock',optional=True),io.String.Input('performance',default='{}',optional=True)], [io.Float.Output(display_name='value'),CHOP.Output(display_name='channels'),io.String.Output(display_name='json'),CLOCK.Output(display_name='clock')])
    @classmethod
    def execute(cls,unit='seconds',clock=None,performance='{}'):
        s=snapshot(clock or performance);return io.NodeOutput(float(s.get(unit,0)),channels(s),json.dumps(s),s)
class Timeline(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Timeline','mod.timeline',[],[io.String.Output(display_name='description')])
    @classmethod
    def execute(cls):return io.NodeOutput('Open the ꘇ Timeline bottom panel to edit the workflow performance document. The browser saves it in workflow extra.generetiPerformance.')
SCALES={'chromatic':list(range(12)),'major':[0,2,4,5,7,9,11],'minor':[0,2,3,5,7,8,10],'harmonicMinor':[0,2,3,5,7,8,11],'melodicMinor':[0,2,3,5,7,9,11],'pentatonic':[0,2,4,7,9]}
class Scale(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Scale','mod.scale',[io.Int.Input('root',default=0,min=0,max=11),io.Combo.Input('scale',options=list(SCALES),default='minor'),io.Float.Input('tuning',default=440,min=1,max=1000)], [io.String.Output(display_name='music json')])
    @classmethod
    def execute(cls,root=0,scale='minor',tuning=440):return io.NodeOutput(json.dumps({'root':root,'scale':scale,'degrees':SCALES[scale],'tuning':tuning,'referenceNote':69}))
class Quantize(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Quantize','chop.quantize',[CHOP.Input('input'),io.String.Input('music',optional=True,default=''),io.String.Input('performance',default='{}',optional=True)], [CHOP.Output(display_name='channels'),io.Float.Output(display_name='value')])
    @classmethod
    def execute(cls,input,music='',performance='{}'):
        context=json.loads(music) if music else snapshot(performance).get('music',{});degrees=context.get('degrees',SCALES.get(context.get('scale','minor'),SCALES['minor']));root=float(context.get('root',0))
        def quantize(x):
            octave=math.floor((x-root)/12);return min((root+o*12+d for o in range(octave-1,octave+2) for d in degrees),key=lambda y:abs(x-y))
        out={**input,'channels':{}}
        for name,data in input['channels'].items():out['channels'][name]=np.asarray([quantize(float(x)) for x in data],dtype=np.float32) if name=='note' or name.startswith('note') or len(input['channels'])==1 else np.asarray(data).copy()
        return io.NodeOutput(out,float(next(iter(out['channels'].values()))[-1]))
class Monitor(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Monitor','dat.monitor',[io.String.Input('report',default='{}',optional=True)], [io.Float.Output(display_name='browser fps'),CHOP.Output(display_name='metrics'),io.String.Output(display_name='json')])
    @classmethod
    def execute(cls,report='{}'):
        value=json.loads(report)
        metrics={k:float(value.get(k,0)) for k in ['fps','meanMs','p95Ms','worstMs','slowFrames','longTasks']}
        if not all(math.isfinite(x) for x in metrics.values()):raise ValueError('Monitor metrics must be finite')
        return io.NodeOutput(metrics['fps'],{'channels':{k:np.asarray([v],dtype=np.float32) for k,v in metrics.items()},'sample_rate':1.,'start':0.},json.dumps(value))
class PerformanceExtension(ComfyExtension):
    async def get_node_list(self):return [Time,Timeline,Scale,Quantize,Monitor]
async def comfy_entrypoint():return PerformanceExtension()
