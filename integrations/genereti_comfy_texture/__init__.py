"""GPU browser texture operators with independent queued IMAGE implementations."""
from comfy_api.latest import ComfyExtension, io
from . import ops
from .expression import parameter_inputs,prepare_expression

WEB_DIRECTORY='./web'
CATEGORY='ꘇ / TOP'

def schema(name,inputs,description):
    return io.Schema(node_id='GeneretiTexture'+name,display_name='ꘇ '+('top.'+('cornerpin' if name=='CornerPin' else name.lower())),search_aliases=['genereti', 'top', 'genereti top'],category=CATEGORY,
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
        return schema('Feedback',[io.Image.Input('image'),number('decay',.96,0,1),number('translate_x'),number('translate_y'),number('scale',1,.001,8),number('rotate',0,-360,360),io.Combo.Input('blend',options=['screen','add','over'],default='screen',optional=True)],
            'Live-only temporal feedback: previous output transformed and decayed beneath current input. Screen/add reveal history through opaque black; over composites using source alpha. Reset with the loop arrow. Queue returns current IMAGE without temporal history; no cyclic graph connection needed.')
    @classmethod
    def execute(cls,image,**values): return io.NodeOutput(ops.rgba(image))

def domain_offsets():
    return [io.Float.Input('offset_'+axis,default=0,min=-100000,max=100000,optional=True,step=.01,tooltip='Domain offset '+axis+'; zero leaves the domain unchanged') for axis in ('x','y','z','t')]

def performance_input():return io.String.Input('performance',default='{}',optional=True)

class Expression(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Expression',[io.Image.Input('image',optional=True),io.String.Input('expression',default='0.5 + 0.5*sin(t + x*12)*cos(y*12)',multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'}),io.Int.Input('width',default=512,min=1,max=4096),io.Int.Input('height',default=512,min=1,max=4096),number('time',0,-100000,100000),performance_input(),*domain_offsets(),*parameter_inputs(io)],'Arithmetic per pixel/channel: t seconds, x/y normalized, i pixel index, c RGB channel index, v/a input value, b=0, w/h dimensions. Source IMAGE sets resolution; absent IMAGE generates a texture. Live t is time offset + graph clock; Queue uses time.')
    @classmethod
    def execute(cls,expression,width,height,time,image=None,offset_x=0,offset_y=0,offset_z=0,offset_t=0,performance="{}",parameters="{}",controls=None):
        import numpy as np
        import torch
        expression=prepare_expression(expression,parameters,controls)
        from .expression import evaluate,performance_values
        if image is not None:
            a=ops.rgba(image);height,width=a.shape[1:3];values=a.detach().cpu().numpy()
        else:
            values=np.zeros((1,height,width,4),dtype=np.float32);values[...,3]=1
        y,x=np.mgrid[:height,:width];out=np.empty_like(values)
        for c in range(3):
            out[...,c]=evaluate(expression,dict(**performance_values(performance),t=time+offset_t,x=(x+.5)/width+offset_x,y=(y+.5)/height+offset_y,z=offset_z,i=y*width+x,c=c,v=values[...,c],a=values[...,c],b=0,w=width,h=height))
        out[...,3]=values[...,3]
        return io.NodeOutput(torch.from_numpy(out.clip(0,1)).to(image) if image is not None else torch.from_numpy(out.clip(0,1)))

class Noise(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Noise',[
            io.Combo.Input('algorithm',options=['perlin','simplex','value']),
            io.Int.Input('dimensions',default=3,min=1,max=4),
            io.Int.Input('width',default=512,min=1,max=4096),io.Int.Input('height',default=512,min=1,max=4096),
            number('scale',8,.01,256),io.Int.Input('seed',default=0,min=0,max=65535,control_after_generate=False),
            number('z',0,-10000,10000),number('time',0,-100000,100000),number('speed',.2,-10,10),
            io.Int.Input('octaves',default=1,min=1,max=6),number('lacunarity',2,1,4),number('gain',.5,0,1),
            io.Combo.Input('color',options=['Grayscale','RGB']),performance_input(),*domain_offsets()],
            'Coherent 1–4D Perlin, simplex or value noise. Signed noise is mapped to 0..1; layered octaves are normalized. Seed offsets the domain. 1/2D animation translates x; 3D animates z; 4D uses z and a separate time coordinate. Live WebGPU; Queue samples the explicit time.')
    @classmethod
    def execute(cls,algorithm,dimensions,width,height,scale,seed,z,time,speed,octaves,lacunarity,gain,color,offset_x=0,offset_y=0,offset_z=0,offset_t=0,performance="{}"):
        import numpy as np
        import torch
        from .noise import noise
        y,x=np.mgrid[:height,:width];x=(x+.5)/width+offset_x;y=(y+.5)/height+offset_y;z+=offset_z;time+=offset_t
        result=np.empty((1,height,width,4),dtype=np.float32);result[...,3]=1
        for c in range(3 if color=='RGB' else 1):
            frequency=scale;weight=1.;total=0.;out=0.
            for o in range(octaves):
                coordinates=[x*frequency+seed*.123+o*19.19+(c*31.7 if color=='RGB' else 0)+(time*speed if dimensions<3 else 0),y*frequency,z+(time*speed if dimensions==3 else 0),time*speed][:dimensions]
                out+=weight*noise(algorithm,*coordinates);total+=weight;weight*=gain;frequency*=lacunarity
            result[...,c]=np.clip(.5+.5*out/total,0,1)
        if color!='RGB':result[...,1]=result[...,2]=result[...,0]
        return io.NodeOutput(torch.from_numpy(result))

class FeedbackRef(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('FeedbackRef',[io.Image.Input('image',optional=True),
            io.String.Input('reference',default='',tooltip='Pick a live IMAGE node/output, or type #nodeID, @persistentRef, or a unique node title. Convert this field to a STRING input for a wired reference. Samples the previous frame; this is not a queued IMAGE connection.'),
            io.Int.Input('width',default=512,min=1,max=4096),io.Int.Input('height',default=512,min=1,max=4096)],
            'One-frame delayed reference to a live node/output, including downstream composites. Feed this through processing into a composite with the fresh source, then reference that composite. Optional IMAGE seeds the first frame; width/height size an empty seed. Queue returns the seed or transparent IMAGE, never follows browser references.')
    @classmethod
    def execute(cls,reference,width,height,image=None):
        import torch
        return io.NodeOutput(ops.rgba(image) if image is not None else torch.zeros((1,height,width,4)))

class Bloom(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Bloom',[io.Image.Input('image'),number('threshold',.6,0,1),number('radius',12,0,128),number('strength',.8,0,4)],
            'Thresholded glow with a separable nine-tap Gaussian blur. Radius is in source pixels; live processing stays on WebGPU. Four passes, with reusable intermediate textures.')
    @classmethod
    def execute(cls,image,threshold,radius,strength): return io.NodeOutput(ops.bloom(image,threshold,radius,strength))

class Displace(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Displace',[io.Image.Input('image'),io.Image.Input('displacement'),number('amount_x',.02,-1,1),number('amount_y',.02,-1,1),number('center',.5,0,1)],
            'Displace source UV using map red/green channels minus center. Amounts are fractions of source dimensions; outside is transparent. Bloomed feedback can drive its own displacement.')
    @classmethod
    def execute(cls,image,displacement,amount_x,amount_y,center): return io.NodeOutput(ops.displace(image,displacement,amount_x,amount_y,center))

class Channels(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        choices=['r','g','b','a','luma','zero','one','br','bg','bb','ba','bluma']
        return schema('Channels',[io.Image.Input('image'),io.Image.Input('image_b',optional=True),
            *[io.Combo.Input(name,options=choices,default=default) for name,default in [('red','r'),('green','g'),('blue','b'),('alpha','a')]],
            io.Combo.Input('channels',options=['RGB','RGBA'],default='RGBA')],
            'Route individual channels from A or optional B into RGB/RGBA. Use zero/one constants, luminance, or B alpha for masks. RGB forces opaque alpha in live GPU storage and returns three channels in Queue; RGBA preserves routed alpha. B defaults to A if absent.')
    @classmethod
    def execute(cls,image,red,green,blue,alpha,channels,image_b=None):
        return io.NodeOutput(ops.channels(image,image_b,red,green,blue,alpha,channels))

class TextureExtension(ComfyExtension):
    async def get_node_list(self): return [Composite,Math,Filter,Transform,Crop,CornerPin,Feedback,FeedbackRef,Bloom,Displace,Channels,Expression,Noise]

async def comfy_entrypoint(): return TextureExtension()
