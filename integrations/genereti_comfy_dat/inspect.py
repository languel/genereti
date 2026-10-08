"""Bounded text inspection; large tensors are described without copying pixels."""
import json,math
from comfy_api.latest import io

def describe(value,limit=32,depth=0):
    if depth>8:return '[depth limit]'
    if value is None or isinstance(value,(bool,int)):return value
    if isinstance(value,float):return value if math.isfinite(value) else str(value)
    if isinstance(value,str):return value[:2000]+('…' if len(value)>2000 else '')
    if hasattr(value,'shape') and hasattr(value,'dtype'):
        if type(value).__module__.startswith('numpy') and value.ndim==1:
            return {'samples':describe(value[:limit].tolist(),limit,depth+1),'length':int(value.size),'dtype':str(value.dtype)}
        return {'type':type(value).__name__,'shape':list(value.shape),'dtype':str(value.dtype)}
    if isinstance(value,dict):
        out={str(k):describe(v,limit,depth+1) for k,v in list(value.items())[:limit]}
        if len(value)>limit:out['…']=f'{len(value)-limit} more keys'
        return out
    if isinstance(value,(list,tuple)):
        out=[describe(v,limit,depth+1) for v in value[:limit]]
        if len(value)>limit:out.append(f'… {len(value)-limit} more items')
        return out
    return {'type':type(value).__name__}

def display(value,format='json',limit=32):
    summary=describe(value,limit)
    return summary if format=='text' and isinstance(summary,str) else json.dumps(summary,ensure_ascii=False,indent=2)

class Inspect(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiDatInspect',display_name='ꘇ dat.inspect',category='ꘇ / DAT',search_aliases=['genereti dat','dat','inspect','debug','display','values','json'],inputs=[io.AnyType.Input('input'),io.Combo.Input('format',options=['json','text']),io.Int.Input('limit',default=32,min=1,max=256)],outputs=[io.String.Output(display_name='text')],is_output_node=True,description='Read-only current values and JSON. Live OpenTouch signals update in the browser; Queue displays other Comfy outputs. Large arrays are bounded and tensors show metadata. Freeze pauses the display only.')
    @classmethod
    def execute(cls,input,format='json',limit=32):
        text=display(input,format,limit)
        return io.NodeOutput(text,ui={'genereti_inspect':[text]})
