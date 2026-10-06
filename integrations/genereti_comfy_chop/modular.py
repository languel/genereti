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
        return schema('Transport', [f('bpm',110,20,300), f('swing',0,0,.45)], [CLOCK.Output(display_name='clock')])

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

MODULAR=[Transport,Sequence,DrumSequence,Synth,DrumKit,Gain,Filter,Delay,Mixer,Output]
