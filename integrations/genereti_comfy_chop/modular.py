"""Live Web Audio routes. Queue stores descriptions, never starts browser audio."""
from comfy_api.latest import io
from .signals import signal
BUS = io.Custom('GENERETI_AUDIO_BUS')
CLOCK = io.Custom('GENERETI_AUDIO_CLOCK')
CHOP = io.Custom('GENERETI_CHOP')

def f(name, default, low=0, high=1):
    return io.Float.Input(name, default=default, min=low, max=high, step=.01)

def schema(kind, inputs, outputs=None, endpoint=False):
    return io.Schema(node_id='GeneretiAudio'+kind, display_name='ꘇ mod.'+kind.lower(),
        category='Genereti / Modular audio', search_aliases=['mod', 'genereti mod', 'genereti audio', 'synth', 'music', kind.lower()],
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
        return schema('Transport', [f('bpm',110,20,300), f('swing',0,0,.45),io.String.Input('clock_name',default='local',optional=True,tooltip='local preserves an independent clock; project links this controller to the workflow timeline.'),io.String.Input('performance',default='{}',optional=True)], [CLOCK.Output(display_name='clock'),CHOP.Output(display_name='channels'),io.Float.Output(display_name='seconds'),io.Float.Output(display_name='beat'),io.String.Output(display_name='json')])

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
            io.Int.Input('division', default=4,min=1,max=16), f('gate',.55,.05,.95), f('velocity',.65),io.Int.Input('ratchet',default=1,min=1,max=8,optional=True)], [CHOP.Output(display_name='notes'),io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, **values):
        # No implicit offline playback; the browser clock owns the event timeline.
        import torch
        return io.NodeOutput(signal({'note':[60], 'gate':[0], 'velocity':[0]}),torch.zeros((1,256,512,3)))

class DrumSequence(Sequence):
    @classmethod
    def define_schema(cls):
        return schema('DrumSequence', [CLOCK.Input('clock'), io.String.Input('pattern', default='kick:1000100010001000;snare:0000100000001000;hat:1010101010101010'),
            io.Int.Input('division',default=4,min=1,max=16), f('velocity',.65),io.Int.Input('ratchet',default=1,min=1,max=8,optional=True)], [CHOP.Output(display_name='notes'),io.Image.Output(display_name='image')])

class Euclidean(Sequence):
    @classmethod
    def define_schema(cls):
        return schema('Euclidean', [CLOCK.Input('clock'), io.Int.Input('steps',default=16,min=1,max=64),io.Int.Input('pulses',default=5,min=0,max=64),io.Int.Input('rotation',default=0,min=-64,max=64),io.Int.Input('note',default=36,min=0,max=127),io.Int.Input('division',default=4,min=1,max=16),f('gate',.5,.05,.95),f('velocity',.7),io.String.Input('tracks',default='',optional=True,tooltip='Versioned multitrack pattern; empty preserves the original single track.')], [CHOP.Output(display_name='notes'),io.Image.Output(display_name='image')])

class CircleSequence(Sequence):
    @classmethod
    def define_schema(cls):
        return schema('CircleSequence', [CLOCK.Input('clock'), io.String.Input('tracks',default=''),io.Int.Input('division',default=4,min=1,max=16),f('gate',.5,.05,.95),f('velocity',.7)], [CHOP.Output(display_name='notes'),io.Image.Output(display_name='image')])

class PianoRoll(Sequence):
    @classmethod
    def define_schema(cls):
        return schema('PianoRoll', [CLOCK.Input('clock'),io.String.Input('pattern',default='{"version":1,"steps":16,"notes":[{"pitch":60,"start":0,"length":4,"velocity":0.8},{"pitch":64,"start":0,"length":4,"velocity":0.7},{"pitch":67,"start":4,"length":4,"velocity":0.8}]}'),io.Int.Input('division',default=4,min=1,max=16),f('velocity',.8)], [CHOP.Output(display_name='notes'),io.Image.Output(display_name='image')])

class Karplus(Route):
    @classmethod
    def define_schema(cls):
        return schema('Karplus', [CHOP.Input('notes'),f('level',.35),f('decay',1.2,.05,5),f('damping',.5,0,1),io.Int.Input('polyphony',default=8,min=1,max=32)])

class Granular(Route):
    @classmethod
    def define_schema(cls):
        return schema('Granular', [CHOP.Input('notes'),f('level',.25),f('grain_size',.08,.02,.3),f('density',16,1,40),f('spread',.25,0,1),f('release',.2,.01,3),io.Int.Input('polyphony',default=8,min=1,max=32)])

class Pattern(Route):
    @classmethod
    def define_schema(cls):
        return schema('Pattern', [io.String.Input('pattern',default='60 64 67 72 - 67 64 -'),io.Combo.Input('operation',options=['shift','reverse','transpose','quantize']),io.Int.Input('amount',default=1,min=-64,max=64),io.Int.Input('root',default=0,min=0,max=11),io.Combo.Input('scale',options=['major','minor','pentatonic','chromatic'])], [io.String.Output(display_name='pattern')])
    @classmethod
    def execute(cls,pattern,operation,amount=1,root=0,scale='minor'):
        import re
        raw=pattern.replace(',', ' ').split()
        notes=[]
        for token in raw:
            if token in ('-','.'):notes.append((-1,None));continue
            match=re.fullmatch(r'(\d+(?:\.\d+)?)(?:@(0(?:\.\d+)?|1(?:\.0+)?))?',token)
            if not match or float(match[1])>127:raise ValueError('Use MIDI notes optionally followed by @velocity or rests')
            notes.append((float(match[1]),match[2]))
        if not 1<=len(notes)<=64:raise ValueError('Use 1..64 notes or rests')
        if operation=='reverse':notes.reverse()
        elif operation=='shift':
            k=amount%len(notes);notes=notes[-k:]+notes[:-k] if k else notes
        elif operation=='transpose':notes=[(min(127,max(0,n+amount)) if n>=0 else -1,v) for n,v in notes]
        elif operation=='quantize':
            degrees={'major':[0,2,4,5,7,9,11],'minor':[0,2,3,5,7,8,10],'pentatonic':[0,2,4,7,9],'chromatic':list(range(12))}.get(scale,[])
            if not degrees:raise ValueError('Unknown scale')
            notes=[(min((p for p in range(128) if (p-root)%12 in degrees),key=lambda p:(abs(p-n),p)) if n>=0 else -1,v) for n,v in notes]
        return io.NodeOutput(' '.join('-' if n<0 else f'{n:g}'+(''+('@'+v if v is not None else '')) for n,v in notes))


class Synth(Route):
    @classmethod
    def define_schema(cls):
        return schema('Synth', [CHOP.Input('notes'), io.Combo.Input('voice',options=['sine','subtractive','fm','reed']),
            f('level',.35), f('attack',.02,.001,5), f('decay',.15,.001,5), f('sustain',.6), f('release',.3,.005,5),
            f('cutoff',2200,20,18000), f('resonance',.7,.1,12), f('glide',.015,0,1), f('vibrato',0,0,2), f('vibrato_rate',5,.1,20),
            io.Int.Input('polyphony',default=8,min=1,max=32),
            io.Combo.Input('wave',options=['auto','sine','triangle','sawtooth','square'],default='auto',tooltip='Oscillator waveform; auto follows the voice.'),
            io.Combo.Input('filter_mode',options=['lowpass','highpass','bandpass'],default='lowpass'),
            f('detune',0,-100,100), f('filter_env',0,0,1), f('fm_ratio',2,.1,10), f('fm_index',.7,0,10)])

def drum_voice_inputs():
    inputs = []
    fields = [('level',0,1),('noise',0,1),('decay',.01,3),('noise_decay',.01,3),('freq_start',20,18000),('freq_end',20,18000),('pitch_decay',.005,3),('cutoff',20,18000),('gate',0,1)]
    for voice in range(1,9):
        prefix = f'voice_{voice}_'
        for name,low,high in fields:
            inputs.append(io.Float.Input(prefix+name,min=low,max=high,optional=True,force_input=True,tooltip=f'Voice {voice} {name}; disconnected uses the graphical kit setting. Gate triggers on a rising edge.'))
        inputs.append(io.String.Input(prefix+'wave',optional=True,force_input=True,tooltip='sine, triangle, sawtooth or square'))
        inputs.append(io.Int.Input(prefix+'note',min=0,max=127,optional=True,force_input=True))
    return inputs

def kit_voice_inputs():
    return [io.Float.Input(f'{voice}_{name}',min=low,max=high,optional=True,force_input=True,tooltip=f'{voice} {name}; disconnected uses the kit controls. Gate triggers on a rising edge.')
            for voice in ['kick','rim','snare','clap','tomlo','hat','tomhi','openhat','ride','cowbell']
            for name,low,high in [('level',0,1),('decay',.03,2),('tone',.25,2),('gate',0,1)]]

class DrumSynth(Route):
    @classmethod
    def define_schema(cls):
        return schema('DrumSynth', [CHOP.Input('notes'), f('level',.4), io.String.Input('kit',default='',tooltip='Versioned per-voice drum synthesizer settings stored in the workflow.'), io.Int.Input('polyphony',default=24,min=1,max=32)] + drum_voice_inputs())

class DrumKit(Route):
    @classmethod
    def define_schema(cls):
        return schema('DrumKit', [CHOP.Input('notes'), f('level',.4), f('decay',.18,.03,2), f('tone',1,.25,2)] + kit_voice_inputs())

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

class Reverb(Route):
    @classmethod
    def define_schema(cls):
        return schema('Reverb', [BUS.Input('input'),f('decay',1.5,.1,5),f('mix',.3)])

class Distortion(Route):
    @classmethod
    def define_schema(cls):
        return schema('Distortion', [BUS.Input('input'),f('drive',2,0,20),f('mix',.5)])

class Mixer(Route):
    @classmethod
    def define_schema(cls):
        inputs=[]
        for i in range(1,9):
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
        return schema(cls.KIND, [BUS.Input('input'),io.Combo.Input('fft_size',options=[256,512,1024,2048,4096],default=1024),f('smoothing',.5,0,.99),f('display_gain',2,.1,20)] + ([io.Combo.Input('channel_view',options=['stereo','split'],default='stereo',optional=True),io.Combo.Input('signal_view',options=['level','delta'],default='level',optional=True)] if cls.KIND=='Lissajous' else []) + [io.Int.Input('width',default=512,min=64,max=2048,optional=True),io.Int.Input('height',default=512 if cls.KIND=='Lissajous' else 256,min=64,max=2048,optional=True)] + ([io.Combo.Input('x_axis',options=['left','right','mid','side','left_delta','right_delta','mid_delta','side_delta','left_delay','right_delay','time','zero'],default='left',optional=True),io.Combo.Input('y_axis',options=['left','right','mid','side','left_delta','right_delta','mid_delta','side_delta','left_delay','right_delay','time','zero'],default='right',optional=True),io.Float.Input('x_gain',default=1,min=.01,max=100,optional=True),io.Float.Input('y_gain',default=1,min=.01,max=100,optional=True),io.Float.Input('rotation',default=0,min=-180,max=180,optional=True),io.Float.Input('trail',default=0,min=0,max=.98,optional=True),io.Float.Input('line_width',default=1.5,min=.25,max=8,optional=True)] if cls.KIND=='Lissajous' else []),
            [BUS.Output(display_name='audio'),CHOP.Output(display_name='channels'),io.Float.Output(display_name='rms'),io.Float.Output(display_name='peak'),io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, **values):
        import torch
        channels={'magnitude':[0],'frequency':[0]} if cls.KIND=='Spectrum' else {key:[0] for key in (['rms','peak','correlation','low','mid','high'] if cls.KIND=='Analyze' else ['left','right'])}
        return io.NodeOutput({'format':'genereti-audio-route','version':1,'kind':cls.KIND,'settings':values},signal(channels),0.,0.,torch.zeros((1,max(64,min(2048,int(values.get('height',512 if cls.KIND=='Lissajous' else 256)))),max(64,min(2048,int(values.get('width',512)))),3)))
class Spectrum(Scope): KIND = 'Spectrum'
class Lissajous(Scope): KIND = 'Lissajous'
class Analyze(Scope): KIND = 'Analyze'

class NoteVisualizer(Route):
    @classmethod
    def define_schema(cls):
        return schema('NoteVisualizer',[CHOP.Input('input'),io.Int.Input('width',default=640,min=64,max=2048),io.Int.Input('height',default=360,min=64,max=2048),f('history_seconds',8,.5,60),io.Int.Input('pitch_low',default=24,min=0,max=127),io.Int.Input('pitch_high',default=96,min=0,max=127),io.Combo.Input('shape',options=['bar','circle','diamond'],default='bar'),f('size',1,.1,4),f('fade',1,.05,8),io.Boolean.Input('show_controls',default=True)], [io.Image.Output(display_name='image'),CHOP.Output(display_name='channels')])
    @classmethod
    def execute(cls,input=None,width=640,height=360,**values):
        import torch
        return io.NodeOutput(torch.zeros((1,max(64,min(2048,int(height))),max(64,min(2048,int(width))),3)), input or signal({'note':[0],'gate':[0],'velocity':[0]}))

MODULAR=[Transport,Sequence,DrumSequence,Euclidean,CircleSequence,PianoRoll,Pattern,Synth,Karplus,Granular,DrumKit,DrumSynth,Gain,Filter,Delay,Reverb,Distortion,Mixer,Output,Scope,Spectrum,Lissajous,Analyze,NoteVisualizer]
