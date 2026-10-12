"""Lightweight utility TOP schemas; no optional model or inference dependencies."""
from comfy_api.latest import io
from . import utilities


def n(name, default=0., low=-4., high=4., tip=None):
    return io.Float.Input(name, default=default, min=low, max=high, step=.01, tooltip=tip)


def choice(name, options, default=None):
    return io.Combo.Input(name, options=options, **({'default': default} if default else {}))


def define(kind, inputs, description, dat=False):
    return io.Schema(node_id='GeneretiTexture'+kind,
        display_name='ꘇ top.'+{'OpticalFlow':'opticalflow','ColorMap':'colormap'}.get(kind,kind.lower()),
        category='Genereti / TOP', search_aliases=['genereti','top'], description=description,
        inputs=[io.Image.Input('image'), *inputs],
        outputs=[io.Image.Output(display_name='image'), *([io.Custom('GENERETI_DAT').Output(display_name='blobs')] if dat else [])])


class Level(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Level',[n('black',0,0,1),n('white',1,0,1),n('brightness',1,0,4),n('contrast',1,0,4),n('saturation',1,0,4),n('gamma',1,.01,4),n('output_black',0,0,1),n('output_white',1,0,1)], 'Input black/white normalization → brightness gain → contrast around 0.5 → saturation → gamma → output levels. Alpha preserved. White must exceed black.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.level(image,**v))


class Edge(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Edge',[choice('algorithm',['sobel','scharr','laplacian']),n('strength',1,0,8),n('threshold',0,0,1),io.Boolean.Input('invert',default=False)], 'Luminance edges with clamped boundary sampling; Sobel, Scharr or Laplacian. Preserves source alpha.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.edge(image,**v))


class OpticalFlow(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('OpticalFlow',[io.Image.Input('previous',optional=True),io.Int.Input('analysis_width',default=256,min=16,max=512),n('max_motion',8,.1,64),n('regularization',.001,.00001,.1)], 'Small-motion dense 5×5 Lucas–Kanade flow, at bounded analysis resolution. R/G encode dx/dy in analysis pixels: (channel−0.5)×2×max_motion; B is confidence, alpha=1. Live defaults to previous source frame; optional previous IMAGE overrides history. Queue needs previous or returns neutral flow. No pyramid: large motion/occlusion is unreliable.')
    @classmethod
    def execute(cls,image,previous=None,**v): return io.NodeOutput(utilities.optical_flow(image,previous,**v))


class Blobs(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Blobs',[choice('channel',['luma','alpha']),n('threshold',.5,0,1),io.Boolean.Input('invert',default=False),io.Int.Input('analysis_width',default=256,min=16,max=512),n('min_area',.001,0,1),io.Int.Input('max_blobs',default=32,min=1,max=64),n('track_distance',.1,0,1),io.Int.Input('hold_frames',default=3,min=0,max=30)], 'GPU threshold mask plus bounded CPU 8-connected components. Live DAT has persistent nearest-centroid IDs, normalized centroid/bounds/area and velocity per second. Tracking advances only on source frames and resets on rewire/settings/seek. Queue detects each batch independently (no persistent tracking). IMAGE is the threshold mask.',dat=True)
    @classmethod
    def execute(cls,image,**v):
        mask,data=utilities.blobs(image,**v)
        return io.NodeOutput(mask,data)


class Lookup(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Lookup',[io.Image.Input('lookup'),choice('mode',['luma','channels']),n('row',.5,0,1),n('mix',1,0,1)], 'Map luminance or separate RGB channels through a horizontal lookup image at normalized row. Linear interpolation between LUT texel centers. Source alpha preserved; LUT alpha ignored.')
    @classmethod
    def execute(cls,image,lookup,**v): return io.NodeOutput(utilities.lookup(image,lookup,**v))


class Key(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Key',[choice('mode',['chroma','luma']),n('red',0,0,1),n('green',1,0,1),n('blue',0,0,1),n('low',.1,0,1),n('high',.3,0,1),io.Boolean.Input('invert',default=False),n('despill',0,0,1),choice('output',['image','matte'])], 'Chroma RGB-distance key or luminance key with soft low/high ramp. Chroma removes colors near key; luma keeps values above low/high. Optional dominant-key-channel despill. Output image multiplies original alpha; matte returns an opaque grayscale mask.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.key(image,**v))


class HSV(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('HSV',[n('hue',0,-1,1),n('saturation',1,0,4),n('value',1,0,4)], 'HSV hue offset in turns (wraps), saturation/value gains; preserves alpha.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.hsv(image,**v))


class RGB(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('RGB',[*[n(c+'_gain',1,0,4) for c in ('red','green','blue')],*[n(c+'_offset',0,-1,1) for c in ('red','green','blue')]], 'Independent RGB gain and offset, clamped to 0..1. Alpha unchanged.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.rgb(image,**v))


class ColorMap(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('ColorMap',[choice('palette',['grayscale','heat','cool','viridis','rainbow']),n('low',0,0,1),n('high',1,0,1),io.Boolean.Input('invert',default=False),n('mix',1,0,1)], 'Map normalized luminance through lightweight built-in palettes. Viridis is a five-anchor approximation. Use top.lookup for custom ramps. Alpha preserved.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.colormap(image,**v))


class Convolve(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Convolve',[*[n('k'+str(i),1 if i==4 else 0,-16,16) for i in range(9)],io.Boolean.Input('normalize',default=False),n('bias',0,-1,1),n('mix',1,0,1)], 'Row-major 3×3 RGB convolution with clamped boundaries. Optional division by kernel sum (zero sum stays unnormalized), bias and source mix. Preserves alpha; transparent neighbors use center color to avoid dark fringes.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.convolve(image,**v))


class Emboss(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Emboss',[n('angle',135,-360,360),n('strength',1,0,8),n('bias',.5,0,1),n('mix',1,0,1)], 'Directional luminance gradient mapped around bias for a relief/emboss effect; degrees, strength, source mix. This is image shading, not estimated scene depth. Preserves alpha.')
    @classmethod
    def execute(cls,image,**v): return io.NodeOutput(utilities.emboss(image,**v))


class Mask(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return define('Mask',[io.MultiType.Input('mask',types=[io.Image,io.Mask]),choice('channel',['luma','alpha','red','green','blue']),choice('operation',['multiply','replace']),io.Boolean.Input('invert',default=False),n('strength',1,0,1)], 'Apply IMAGE or native queued MASK to source alpha; mask resizes to source. Native MASK directly supplies opacity; channel choice applies to IMAGE masks. Luma/RGB mask channels include mask alpha. Alpha channel uses alpha directly. Multiply preserves existing transparency; replace sets alpha. Strength blends with original alpha; RGB unchanged.')
    @classmethod
    def execute(cls,image,mask,**v):
        if mask.ndim==3:
            import torch
            m=mask.unsqueeze(-1);mask=torch.cat((m.expand(*m.shape[:-1],3),torch.ones_like(m)),-1);v['channel']='red'
        return io.NodeOutput(utilities.mask(image,mask,**v))


NODES=[Level,Edge,OpticalFlow,Blobs,Lookup,Key,HSV,RGB,ColorMap,Convolve,Emboss,Mask]
