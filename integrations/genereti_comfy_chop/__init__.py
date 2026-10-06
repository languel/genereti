"""Live control operators. MIDI uses user-started Web MIDI; OSC uses loopback UDP."""
from comfy_api.latest import ComfyExtension, io
from . import signals
from .music import MUSIC
from .modular import MODULAR
from .osc import register
WEB_DIRECTORY='./web'
CHOP=io.Custom('GENERETI_CHOP')

def number(name,value=0,low=-100000,high=100000):return io.Float.Input(name,default=value,min=low,max=high,step=.01)
def common():return [io.Int.Input('channels',default=1,min=1,max=64),io.Int.Input('samples',default=1,min=1,max=4096),number('sample_rate',60,1,1000),number('time',0)]
def schema(kind,inputs,output=False):return io.Schema(node_id='GeneretiChop'+kind,display_name='ꘇ'+('chop.'+kind.lower()),search_aliases=['genereti', 'chop', 'genereti chop'],category='ꘇ / CHOP',inputs=inputs,outputs=[CHOP.Output(display_name='channels'),io.Float.Output(display_name='value')],is_output_node=output,description='Named sampled control channels and last value of first channel. Live in browser; Queue evaluates explicit samples/time. Device I/O only runs after its Connect button, never on opening or Queue.')

class Constant(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Constant',[number('value',1),*common()])
    @classmethod
    def execute(cls,**values):
        data=signals.generate('Constant',values);return io.NodeOutput(data,signals.first(data))
class Oscillator(Constant):
    @classmethod
    def define_schema(cls):return schema('Oscillator',[io.Combo.Input('wave',options=['sine','triangle','saw','square','ramp']),number('frequency',1,0,10000),number('amplitude',1),number('offset'),number('phase'),*common()])
    @classmethod
    def execute(cls,**values):
        data=signals.generate('Oscillator',values);return io.NodeOutput(data,signals.first(data))
class Noise(Constant):
    @classmethod
    def define_schema(cls):return schema('Noise',[io.Int.Input('seed',default=0,min=0,max=100000),number('amplitude',1),number('offset'),*common()])
    @classmethod
    def execute(cls,**values):
        data=signals.generate('Noise',values);return io.NodeOutput(data,signals.first(data))
class Expression(Constant):
    @classmethod
    def define_schema(cls):return schema('Expression',[CHOP.Input('input',optional=True),io.String.Input('expression',default='sin(t*tau + c)',multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'}),*common()])
    @classmethod
    def execute(cls,input=None,**values):
        data=signals.process('Expression',input,values) if input is not None else signals.generate('Expression',values);return io.NodeOutput(data,signals.first(data))
class Math(Constant):
    @classmethod
    def define_schema(cls):return schema('Math',[CHOP.Input('input'),io.Combo.Input('operation',options=['multiply','add','subtract','divide','abs','clamp','fit']),number('value',1),number('low',0),number('high',1)])
    @classmethod
    def execute(cls,input,**values):
        data=signals.process(cls.__name__,input,values);return io.NodeOutput(data,signals.first(data))
class Lag(Math):
    @classmethod
    def define_schema(cls):return schema('Lag',[CHOP.Input('input'),number('seconds',.1,.00001,100)])
class Logic(Math):
    @classmethod
    def define_schema(cls):return schema('Logic',[CHOP.Input('input'),number('threshold',.5)])
class Speed(Math):
    @classmethod
    def define_schema(cls):return schema('Speed',[CHOP.Input('input')])
class Slope(Math):
    @classmethod
    def define_schema(cls):return schema('Slope',[CHOP.Input('input')])
class Select(Math):
    @classmethod
    def define_schema(cls):return schema('Select',[CHOP.Input('input'),io.String.Input('pattern',default='*')])
class Merge(Math):
    @classmethod
    def define_schema(cls):return schema('Merge',[CHOP.Input('input'),CHOP.Input('other')])
    @classmethod
    def execute(cls,input,other):
        data=signals.process('Merge',input,{},other);return io.NodeOutput(data,signals.first(data))
class MidiIn(Constant):
    @classmethod
    def define_schema(cls):return schema('MidiIn',[io.String.Input('device',default=''),io.Int.Input('channel',default=0,min=0,max=16)])
    @classmethod
    def execute(cls,**values):return io.NodeOutput(signals.signal({'value':[0]}),0.)
class MidiOut(Math):
    _OUTPUT_NODE = None
    @classmethod
    def define_schema(cls):return schema('MidiOut',[CHOP.Input('input'),io.String.Input('device',default=''),io.Combo.Input('message',options=['cc','note','pitch']),io.Int.Input('channel',default=1,min=1,max=16),io.Int.Input('number',default=1,min=0,max=127)],True)
    @classmethod
    def execute(cls,input,**values):return io.NodeOutput(input,signals.first(input))
class OscIn(MidiIn):
    @classmethod
    def define_schema(cls):return schema('OscIn',[io.Int.Input('port',default=9000,min=1024,max=65535),io.String.Input('address',default='*')])
class OscOut(MidiOut):
    _OUTPUT_NODE = None
    @classmethod
    def define_schema(cls):return schema('OscOut',[CHOP.Input('input'),io.Int.Input('port',default=9001,min=1024,max=65535),io.String.Input('address',default='/genereti')],True)
class ChopExtension(ComfyExtension):
    async def get_node_list(self):return [Constant,Oscillator,Noise,Expression,Math,Lag,Logic,Speed,Slope,Select,Merge,MidiIn,MidiOut,OscIn,OscOut,*MUSIC,*MODULAR]
async def comfy_entrypoint():
    register();return ChopExtension()
