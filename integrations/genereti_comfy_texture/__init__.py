"""GPU browser texture operators with independent queued IMAGE implementations."""
from comfy_api.latest import ComfyExtension, io
from . import ops

WEB_DIRECTORY='./web'
CATEGORY='ꘇ / TOP'

def schema(name,inputs,description):
    return io.Schema(node_id='GeneretiTexture'+name,display_name='top.'+('cornerpin' if name=='CornerPin' else name.lower()),category=CATEGORY,
                     description=description,inputs=inputs,outputs=[io.Image.Output(display_name='image')])

def number(name,default=0.,low=-4.,high=4.,tooltip=None):
    return io.Float.Input(name,default=default,min=low,max=high,step=.01,tooltip=tooltip)

class Composite(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Composite',[io.Image.Input('image'),io.Image.Input('background'),
            io.Combo.Input('operation',options=['over','under','add','multiply','screen','difference','cross']),number('opacity',1,0,1)],
            'Alpha-aware A over B. B is resized to A. Live chains stay on the browser GPU.')
    @classmethod
    def execute(cls,image,background,operation,opacity):
        return io.NodeOutput(ops.composite(image,background,operation,opacity))

class Math(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Math',[io.Image.Input('image'),io.Image.Input('operand',optional=True),
            io.Combo.Input('operation',options=['multiply','add','subtract','divide','difference','minimum','maximum']),number('value',1,-4,4, 'Scalar operand when no second image is connected; alpha is preserved.')],
            'RGB texture arithmetic, clamped to 0..1; preserves A alpha. Optional B replaces scalar value.')
    @classmethod
    def execute(cls,image,operation,value,operand=None):
        return io.NodeOutput(ops.arithmetic(image,operand,operation,value))

class Filter(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Filter',[io.Image.Input('image'),io.Combo.Input('operation',options=['level','invert','monochrome','threshold','opacity','blur','edge']),number('amount',1,0,16,'Level gain; blend for invert/monochrome; threshold or opacity 0..1; blur/edge radius in pixels.')],
            'Simple single-pass image effects. Blur uses nine taps; edge uses an eight-neighbor Laplacian.')
    @classmethod
    def execute(cls,image,operation,amount):
        if operation in ('invert','monochrome','threshold','opacity'): amount=min(amount,1.)
        return io.NodeOutput(ops.filter_image(image,operation,amount))

class Transform(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Transform',[io.Image.Input('image'),number('translate_x'),number('translate_y'),number('scale',1,.001,8),number('rotate',0,-360,360),io.Boolean.Input('flip_x',default=False),io.Boolean.Input('flip_y',default=False)],
            'Translate in fractions of the image, rotate in degrees, scale about center. Outside is transparent.')
    @classmethod
    def execute(cls,image,**values): return io.NodeOutput(ops.transform(image,**values))

class Crop(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Crop',[io.Image.Input('image'),number('left',0,0,1),number('top',0,0,1),number('right',1,0,1),number('bottom',1,0,1)],
            'Normalized source crop stretched to the original texture resolution.')
    @classmethod
    def execute(cls,image,**values): return io.NodeOutput(ops.crop(image,**values))

class CornerPin(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        inputs=[io.Image.Input('image')]
        for name,x,y in [('tl',0,0),('tr',1,0),('br',1,1),('bl',0,1)]:
            inputs.extend([number(name+'_x',x),number(name+'_y',y)])
        return schema('CornerPin',inputs,'Projective four-point mapping; normalized destination TL/TR/BR/BL. Outside is transparent.')
    @classmethod
    def execute(cls,image,**values):
        return io.NodeOutput(ops.corner_pin(image,[(values[n+'_x'],values[n+'_y']) for n in ('tl','tr','br','bl')]))

class Feedback(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Feedback',[io.Image.Input('image'),number('decay',.96,0,1),number('translate_x'),number('translate_y'),number('scale',1,.001,8),number('rotate',0,-360,360)],
            'Live-only temporal feedback: previous output transformed/alpha-decayed beneath current input. Reset with the loop arrow. Queue returns current IMAGE without temporal history; no cyclic graph connection needed.')
    @classmethod
    def execute(cls,image,**values): return io.NodeOutput(ops.rgba(image))

class Expression(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Expression',[io.Image.Input('image',optional=True),io.String.Input('expression',default='0.5 + 0.5*sin(t + x*12)*cos(y*12)',multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'}),io.Int.Input('width',default=512,min=1,max=4096),io.Int.Input('height',default=512,min=1,max=4096),number('time',0,-100000,100000)],'Arithmetic per pixel/channel: t seconds, x/y normalized, i pixel index, c RGB channel index, v/a input value, b=0, w/h dimensions. Source IMAGE sets resolution; absent IMAGE generates a texture. Live t is time offset + graph clock; Queue uses time.')
    @classmethod
    def execute(cls,expression,width,height,time,image=None):
        import numpy as np
        import torch
        from .expression import evaluate
        if image is not None:
            a=ops.rgba(image);height,width=a.shape[1:3];values=a.detach().cpu().numpy()
        else:
            values=np.zeros((1,height,width,4),dtype=np.float32);values[...,3]=1
        y,x=np.mgrid[:height,:width];out=np.empty_like(values)
        for c in range(3):
            out[...,c]=evaluate(expression,dict(t=time,x=(x+.5)/width,y=(y+.5)/height,i=y*width+x,c=c,v=values[...,c],a=values[...,c],b=0,w=width,h=height))
        out[...,3]=values[...,3]
        return io.NodeOutput(torch.from_numpy(out.clip(0,1)).to(image) if image is not None else torch.from_numpy(out.clip(0,1)))

class TextureExtension(ComfyExtension):
    async def get_node_list(self): return [Composite,Math,Filter,Transform,Crop,CornerPin,Feedback,Expression]

async def comfy_entrypoint(): return TextureExtension()
