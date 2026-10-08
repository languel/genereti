"""Musical CHOP controls. Audio/device I/O stays user-started in the browser."""
import numpy as np
from comfy_api.latest import io
from .signals import signal,first
CHOP=io.Custom('GENERETI_CHOP')
def number(name,value,low=0,high=1):return io.Float.Input(name,default=value,min=low,max=high)
def timing():return [number('bpm',120,1,400),io.Int.Input('division',default=2,min=1,max=16),number('gate',.5,.01,.99),number('velocity',.7),io.Int.Input('samples',default=1,min=1,max=4096),number('sample_rate',60,1,1000),number('time',0,0,100000)]
def schema(kind,inputs,endpoint=False):return io.Schema(node_id='GeneretiMusic'+kind,display_name='ꘇ '+('chop.'+kind.lower()),search_aliases=['genereti', 'chop', 'genereti chop'],category='ꘇ / CHOP',inputs=inputs,outputs=[CHOP.Output(display_name='notes'),io.Float.Output(display_name='value')],is_output_node=endpoint,description='Musical control channels: note (MIDI pitch), gate, velocity. Browser audio starts only by its button. Queue evaluates controls/passes them through, never plays sound or sends MIDI.')
def notes(text):
    tokens=str(text).replace(',',' ').split()
    if not tokens or len(tokens)>256:raise ValueError('Use 1..256 MIDI notes or rest markers (- / .)')
    out=[]
    for token in tokens:
        if token in ('-','.'):out.append(-1);continue
        x=float(token)
        if not np.isfinite(x) or not 0<=x<=127:raise ValueError('MIDI notes must be 0..127')
        out.append(x)
    return out

def generate(kind,v,input=None):
    count=int(v.get('samples',1));rate=float(v.get('sample_rate',60));start=float(v.get('time',0));t=start+np.arange(count)/rate
    if kind=='Note':return signal({'note':np.full(count,v.get('note',60)),'gate':np.full(count,float(v.get('gate',True))),'velocity':np.full(count,v.get('velocity',.7))},rate,start)
    pitches=notes(v.get('notes','60 64 67 72'))
    if kind=='Arpeggiator':
        active=[int(k.rsplit('note',1)[1]) for k,a in (input or {'channels':{}})['channels'].items() if 'note' in k and k.rsplit('note',1)[1].isdigit() and a[-1]>0]
        if active:pitches=sorted(active)
        pitches=sorted(set(n+12*octave for octave in range(int(v.get('octaves',1))) for n in pitches if n>=0 and n+12*octave<=127))
        if not pitches:pitches=[-1]
        if v.get('mode')=='down':pitches.reverse()
        if v.get('mode')=='updown' and len(pitches)>2:pitches+=pitches[-2:0:-1]
    phase=t*float(v.get('bpm',120))/60*int(v.get('division',2));step=np.floor(phase).astype(np.int64);pitch=np.asarray(pitches)[step%len(pitches)];gate=((phase-np.floor(phase))<v.get('gate',.5))&(pitch>=0)
    return signal({'note':np.maximum(0,pitch),'gate':gate.astype(float),'velocity':gate.astype(float)*v.get('velocity',.7),'step':step%len(pitches)},rate,start)
class Note(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Note',[io.Int.Input('note',default=60,min=0,max=127),io.Boolean.Input('gate',default=True),number('velocity',.7),io.Int.Input('samples',default=1,min=1,max=4096),number('sample_rate',60,1,1000),number('time',0,0,100000)])
    @classmethod
    def execute(cls,**values):
        data=generate('Note',values);return io.NodeOutput(data,first(data))
class Sequencer(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Sequencer',[io.String.Input('notes',default='60 64 67 72 67 64 - 60',multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'}),*timing()])
    @classmethod
    def execute(cls,**values):
        data=generate('Sequencer',values);return io.NodeOutput(data,first(data))
class Arpeggiator(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Arpeggiator',[CHOP.Input('input',optional=True),io.String.Input('notes',default='60 64 67'),io.Int.Input('octaves',default=1,min=1,max=4),io.Combo.Input('mode',options=['up','down','updown']),*timing()])
    @classmethod
    def execute(cls,input=None,**values):
        data=generate('Arpeggiator',values,input);return io.NodeOutput(data,first(data))
class Synth(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Synth',[CHOP.Input('input'),io.Combo.Input('voice',options=['sine','subtractive','fm','reed']),number('level',.15),number('attack',.02,.001,10),number('decay',.15,.001,10),number('sustain',.7),number('release',.25,.005,10),number('cutoff',1800,20,18000),number('resonance',.7,.1,10),number('glide',.02,0,2),number('vibrato',0,0,2),number('vibrato_rate',5,.1,20)],True)
    @classmethod
    def execute(cls,input,**values):return io.NodeOutput(input,first(input))
class DrumKit(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('DrumKit',[CHOP.Input('input'),number('level',.15),number('decay',.2,.03,2),number('tone',1,.25,2)],True)
    @classmethod
    def execute(cls,input,**values):return io.NodeOutput(input,first(input))
MUSIC=[Note,Sequencer,Arpeggiator,Synth,DrumKit]
