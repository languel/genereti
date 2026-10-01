"""Local guide preprocessing. Caller may supply ready-made guides instead."""
from pathlib import Path
import numpy as np
import cv2
import torch
from PIL import Image, ImageOps

class GuideProcessor:
    def __init__(self):
        self.depth_model=None;self.depth_processor=None
        self.depth_cache_key=None;self.depth_cache_value=None
    def process(self,image,mode,size):
        image=ImageOps.fit(image.convert('RGB'),(size,size))
        if mode=='canny':
            edges=cv2.Canny(np.asarray(image),100,200)
            return Image.fromarray(edges).convert('RGB')
        if mode=='depth':
            key=(size,image.tobytes())
            if key==self.depth_cache_key:return self.depth_cache_value.copy()
            if self.depth_model is None:
                from transformers import AutoImageProcessor,AutoModelForDepthEstimation
                model='depth-anything/Depth-Anything-V2-Small-hf'
                revision='5426e4f0f36572d16453bbda7a8389317b1bef99'
                self.depth_processor=AutoImageProcessor.from_pretrained(model,revision=revision,local_files_only=True)
                self.depth_model=AutoModelForDepthEstimation.from_pretrained(model,revision=revision,local_files_only=True).eval()
            # CPU avoids competing for GPU command buffers with Core ML. 266 is divisible by 14.
            inputs=self.depth_processor(images=image,return_tensors='pt',size={'height':266,'width':266})
            with torch.inference_mode():
                depth=self.depth_model(**inputs).predicted_depth
                depth=torch.nn.functional.interpolate(depth[:,None],size=(size,size),mode='bicubic',align_corners=False)[0,0].numpy()
            near,far=float(depth.max()),float(depth.min())
            pixels=((depth-far)/max(near-far,1e-6)*255).clip(0,255).astype(np.uint8)
            result=Image.fromarray(pixels).convert('RGB')
            self.depth_cache_key=key;self.depth_cache_value=result.copy()
            return result
        return image

def invert_guide(image):
    """Swap light and dark values in a prepared visual guide."""
    return ImageOps.invert(image.convert('RGB'))


def prepare_sdxs_guides(processor, image, size, *, weights, inversions,
                         canny_source=None, pose_source=None, low=50, high=150,
                         sketch_kind='image', line_width=1):
    """Prepare independent guides for the *same released sketch controller*.

    Depth/pose transfer is experimental, not a separately trained ControlNet.
    Canny runs at source resolution (up to 1024) before resizing, to retain lines.
    """
    guides=[]
    for name,weight in weights.items():
        if weight<=0:continue
        if name=='sketch':
            guide=ImageOps.fit(image.convert('RGB'),(size,size))
            if sketch_kind=='gray':guide=ImageOps.grayscale(guide).convert('RGB')
            elif sketch_kind=='edges':guide=detail_edges(image,size,low,high,line_width)
        elif name=='canny':guide=detail_edges(canny_source or image,size,low,high,line_width)
        elif name=='depth':guide=processor.process(image,'depth',size)
        elif name=='pose':
            if pose_source is None:raise ValueError('Upload a prepared pose guide or set its weight to zero.')
            guide=ImageOps.fit(pose_source.convert('RGB'),(size,size))
        else:raise ValueError('Unknown SDXS guide')
        if inversions.get(name):guide=invert_guide(guide)
        guides.append((name,guide,float(weight)))
    if not guides:raise ValueError('Enable at least one SDXS guide weight.')
    return guides

def detail_edges(image,size,low=50,high=150,line_width=1):
    if low>high:raise ValueError('Canny low threshold must not exceed high threshold.')
    source=ImageOps.fit(image.convert('RGB'),(min(max(image.size),1024),)*2)
    gray=cv2.cvtColor(np.asarray(source),cv2.COLOR_RGB2GRAY)
    edges=cv2.Canny(gray,low,high)
    # Sketch weights expect black strokes on white, unlike SD-Turbo Canny.
    edges=Image.fromarray(255-edges).resize((size,size),Image.Resampling.LANCZOS)
    if line_width>1:
        from PIL import ImageFilter
        edges=edges.filter(ImageFilter.MinFilter(line_width*2-1))
    return edges.convert('RGB')
