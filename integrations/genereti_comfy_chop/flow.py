"""Type-agnostic routing nodes. Named routes are browser-local; Queue has no hidden dependencies."""
from comfy_api.latest import io
from . import signals


def schema(kind, inputs, outputs):
    return io.Schema(node_id='GeneretiFlow'+kind, display_name='ꘇ.'+kind.lower(), category='Genereti / Routing', search_aliases=['genereti', 'routing', kind.lower()], inputs=inputs, outputs=outputs)

def inp(name,optional=False):return io.AnyType.Input(name,optional=optional)
def out(name):return io.AnyType.Output(display_name=name)
def index():return io.Int.Input('index',default=0,min=0,max=63,tooltip='Zero-based socket index: 0 is the first socket.')
def inputs():return io.Autogrow.Input('sources',template=io.Autogrow.TemplatePrefix(io.AnyType.Input('input',optional=True),prefix='input_',min=1,max=64),optional=True)
def ordered(sources):
    return sorted((sources or {}).items(),key=lambda item:int(item[0].split('input_')[-1]))

class Send(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Send',[inp('input'),io.String.Input('name',default='signal')],[out('signal')])
    @classmethod
    def execute(cls,input,name='signal'):return io.NodeOutput(input)
class Receive(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Receive',[io.String.Input('name',default='signal',tooltip='Named routes are live browser connections. Queue cannot resolve hidden dependencies.')],[out('signal')])
    @classmethod
    def execute(cls,name='signal'):return io.NodeOutput(None)
class Select(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Select',[inputs(),index()],[out('signal')])
    @classmethod
    def execute(cls,index=0,sources=None):
        wanted='input_'+str(max(0,min(63,int(index))));return io.NodeOutput((sources or {}).get(wanted))
class Route(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Route',[inp('input'),index(),io.Int.Input('outlets',default=4,min=1,max=64,tooltip='Number of visible outlets. Connected outlets are preserved when reducing the count.')],[out(str(i)) for i in range(64)])
    @classmethod
    def execute(cls,input,index=0,outlets=4):return io.NodeOutput(*(input if i==int(index) and i<int(outlets) else None for i in range(64)))
class Merge(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Merge',[inputs()],[out('signal')])
    @classmethod
    def execute(cls,sources=None):
        items=[x for _,x in ordered(sources) if x is not None]
        if not items:return io.NodeOutput(None)
        first=items[0]
        if isinstance(first,dict) and 'channels' in first:
            result=first
            for item in items[1:]:result=signals.process('Merge',result,{},item)
            return io.NodeOutput(result)
        if all(isinstance(x,(int,float)) and not isinstance(x,bool) for x in items):return io.NodeOutput(sum(items))
        if len(items)==1:return io.NodeOutput(first)
        try:
            import torch
            if all(isinstance(x,torch.Tensor) for x in items):return io.NodeOutput(torch.cat(items,dim=0))
        except (ImportError,RuntimeError):pass
        raise ValueError('Merge supports CHOP channels, numeric sums, or compatible tensor batches')
FLOW=[Send,Receive,Merge,Route,Select]
