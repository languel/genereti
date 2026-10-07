"""Live Web Audio routes. Queue stores descriptions, never starts browser audio."""
from comfy_api.latest import io
from .signals import signal
BUS = io.Custom('GENERETI_AUDIO_BUS')
CLOCK = io.Custom('GENERETI_AUDIO_CLOCK')
CHOP = io.Custom('GENERETI_CHOP')

def f(name, default, low=0, high=1):
    return io.Float.Input(name, default=default, min=low, max=high, step=.01)

def schema(kind, inputs, outputs=None, endpoint=False):
    return io.Schema(node_id='GeneretiAudio'+kind, display_name='ꘇmod.'+kind.lower(),
        category='ꘇ / Modular audio', search_aliases=['mod', 'genereti mod', 'genereti audio', 'synth', 'music', kind.lower()],
        inputs=inputs, outputs=outputs if outputs is not None else [BUS.Output(display_name='audio')],
        is_output_node=endpoint,
        description='Live browser Web Audio route. Connect to mod.output and press Start there. Queue returns a route description, not a Comfy AUDIO tensor, and never plays sound.')

class Route(io.ComfyNode):
    @classmethod
    def execute(cls, **values):
        return io.NodeOutput({'format':'genereti-audio-route', 'version':1, 'kind':cls.__name__, 'settings':values})

class Transport(Route):
    @classmethod
    def define_schema(cls):
        return schema('Transport', [f('bpm',110,20,300), f('swing',0,0,.45),io.String.Input('clock_name',default='local',optional=True,tooltip='local preserves an independent clock; project links this controller to the workflow timeline.'),io.String.Input('performance',default='{}',optional=True)], [CLOCK.Output(display_name='clock'),CHOP.Output(display_name='channels'),io.Float.Output(display_name='seconds'),io.Float.Output(display_name='beat'),io.String.Output(display_name='JSON')])

    @classmethod
    def execute(cls,bpm=110,swing=0,clock_name="local",performance="{}"):
        import json
        import math
        s=json.loads(performance) if isinstance(performance,str) else performance
        if not isinstance(s,dict):raise ValueError("Clock snapshot must be an object")
        seconds=float(s.get("seconds",0));bpm=float(s.get("bpm",bpm));qn=float(s.get("quarterNotes",seconds*bpm/60));meter=s.get("signature",{"numerator":4,"denominator":4});numerator=float(meter.get("numerator",4));denominator=float(meter.get("denominator",4))
        if not all(math.isfinite(x) for x in (seconds,qn,bpm,numerator,denominator)) or min(bpm,numerator,denominator)<=0:raise ValueError("Invalid clock snapshot")
        beat=qn*denominator/4
        s={**s,"version":1,"seconds":seconds,"quarterNotes":qn,"beat":beat,"bar":math.floor(beat/numerator),"beatInBar":beat%numerator,"ticks":math.floor(qn*480+1e-7),"ppq":480,"phase":qn%1,"iteration":s.get("iteration",0),"signature":meter,"bpm":bpm,"swing":swing,"playing":s.get("playing",False),"clock_name":clock_name}
        return io.NodeOutput(s,signal({k:[s[k]] for k in ("seconds","quarterNotes","beat","bar","beatInBar","ticks","phase","bpm","playing","iteration")},25,seconds),seconds,beat,json.dumps(s))

class Sequence(Route):
    @classmethod
    def define_schema(cls):
        return schema('Sequence', [CLOCK.Input('clock'), io.String.Input('pattern', default='60 64 67 72 67 64 - 55 60 - 67 - 72 67 64 -'),
            io.Int.Input('division', default=4,min=1,max=16), f('gate',.55,.05,.95), f('velocity',.65)], [CHOP.Output(display_name='notes')])
    @classmethod
    def execute(cls, **values):
        # No implicit offline playback; the browser clock owns the event timeline.
        return io.NodeOutput(signal({'note':[60], 'gate':[0], 'velocity':[0]}))

class DrumSequence(Sequence):
    @classmethod
    def define_schema(cls):
        return schema('DrumSequence', [CLOCK.Input('clock'), io.String.Input('pattern', default='kick:1000100010001000;snare:0000100000001000;hat:1010101010101010'),
            io.Int.Input('division',default=4,min=1,max=16), f('velocity',.65)], [CHOP.Output(display_name='notes')])

class Synth(Route):
    @classmethod
    def define_schema(cls):
        return schema('Synth', [CHOP.Input('notes'), io.Combo.Input('voice',options=['sine','subtractive','fm','reed']),
            f('level',.35), f('attack',.02,.001,5), f('decay',.15,.001,5), f('sustain',.6), f('release',.3,.005,5),
            f('cutoff',2200,20,18000), f('resonance',.7,.1,12), f('glide',.015,0,1), f('vibrato',0,0,2), f('vibrato_rate',5,.1,20),
            io.Int.Input('polyphony',default=8,min=1,max=32)])

class DrumKit(Route):
    @classmethod
    def define_schema(cls):
        return schema('DrumKit', [CHOP.Input('notes'), f('level',.4), f('decay',.18,.03,2), f('tone',1,.25,2)])

class Gain(Route):
    @classmethod
    def define_schema(cls):
        return schema('Gain', [BUS.Input('input'), f('level',.8,0,2), f('pan',0,-1,1), io.Boolean.Input('mute',default=False)])

class Filter(Route):
    @classmethod
    def define_schema(cls):
        return schema('Filter', [BUS.Input('input'), io.Combo.Input('mode',options=['lowpass','highpass','bandpass','notch']), f('cutoff',1800,20,18000), f('resonance',.7,.1,12)])

class Delay(Route):
    @classmethod
    def define_schema(cls):
        return schema('Delay', [BUS.Input('input'), f('seconds',.25,.01,2), f('feedback',.25,0,.85), f('mix',.25)])

class Mixer(Route):
    @classmethod
    def define_schema(cls):
        inputs=[]
        for i in range(1,5):
            inputs.extend([BUS.Input('input_'+str(i),optional=True),f('level_'+str(i),.7,0,2),f('pan_'+str(i),0,-1,1),io.Boolean.Input('mute_'+str(i),default=False),io.Boolean.Input('solo_'+str(i),default=False)])
        inputs.append(f('master',.7,0,1))
        return schema('Mixer', inputs)

class Output(Route):
    @classmethod
    def define_schema(cls):
        return schema('Output', [BUS.Input('input'), f('level',.65),io.Boolean.Input('mute',default=False)], endpoint=True)

class Scope(Route):
    KIND = 'Scope'
    @classmethod
    def define_schema(cls):
        return schema(cls.KIND, [BUS.Input('input'),io.Combo.Input('fft_size',options=[256,512,1024,2048,4096],default=1024),f('smoothing',.5,0,.99),f('display_gain',2,.1,20)],
            [BUS.Output(display_name='audio'),CHOP.Output(display_name='channels'),io.Float.Output(display_name='rms'),io.Float.Output(display_name='peak'),io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, **values):
        import torch
        channels={'magnitude':[0],'frequency':[0]} if cls.KIND=='Spectrum' else {key:[0] for key in (['rms','peak','correlation','low','mid','high'] if cls.KIND=='Analyze' else ['left','right'])}
        return io.NodeOutput({'format':'genereti-audio-route','version':1,'kind':cls.KIND,'settings':values},signal(channels),0.,0.,torch.zeros((1,512 if cls.KIND=='Lissajous' else 256,512,3)))
class Spectrum(Scope): KIND = 'Spectrum'
class Lissajous(Scope): KIND = 'Lissajous'
class Analyze(Scope): KIND = 'Analyze'

MODULAR=[Transport,Sequence,DrumSequence,Synth,DrumKit,Gain,Filter,Delay,Mixer,Output,Scope,Spectrum,Lissajous,Analyze]
