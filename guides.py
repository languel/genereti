"""Local guide preprocessing. Caller may supply ready-made guides instead."""
from pathlib import Path
import numpy as np
import cv2
import torch
from PIL import Image, ImageOps

class GuideProcessor:
    def __init__(self):
        self.depth_model=None;self.depth_processor=None
    def process(self,image,mode,size):
        image=ImageOps.fit(image.convert('RGB'),(size,size))
        if mode=='canny':
            edges=cv2.Canny(np.asarray(image),100,200)
            return Image.fromarray(edges).convert('RGB')
        if mode=='depth':
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
            return Image.fromarray(pixels).convert('RGB')
        return image
