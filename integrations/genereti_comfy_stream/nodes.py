from comfy_api.latest import ComfyExtension, io
import base64
import io as bytes_io
import time
import numpy as np
from PIL import Image

class GeneretiLiveImagePreview(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiLiveImagePreview', display_name='ꘇ image preview',search_aliases=['genereti', 'image preview', 'genereti image preview'],
            category='Genereti / Streams', is_output_node=True, not_idempotent=True,
            description='Preview any IMAGE without writing preview files. Updates when upstream executes; passthrough preserves the entire original batch.',
            inputs=[io.Image.Input('image'),
                io.Int.Input('preview_size', default=512, min=64, max=2048, step=64)],
            outputs=[io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, image, preview_size=512):
        start=time.perf_counter()
        pixels=(image[0].detach().cpu().numpy().clip(0,1)*255).astype(np.uint8)
        transparent=pixels.shape[-1] == 4 and pixels[..., 3].min() < 255
        preview=Image.fromarray(pixels if transparent else pixels[..., :3])
        preview.thumbnail((preview_size,preview_size),Image.Resampling.BILINEAR)
        buffer=bytes_io.BytesIO()
        if transparent:
            preview.save(buffer,format='PNG')
        else:
            preview.save(buffer,format='JPEG',quality=85)
        data=f'data:image/{"png" if transparent else "jpeg"};base64,'+base64.b64encode(buffer.getvalue()).decode()
        return io.NodeOutput(image,ui={'genereti_preview':[data],
            'genereti_preview_ms':[round((time.perf_counter()-start)*1000,2)]})

class GeneretiImageCompare(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiImageCompare', display_name='ꘇ image compare', category='Genereti / Streams',
            is_output_node=True, description='Live A/B image comparison with wipe, side-by-side and difference views. Outputs preserve the original A and B batches.',
            inputs=[io.Image.Input('a'), io.Image.Input('b')], outputs=[io.Image.Output(display_name='a'), io.Image.Output(display_name='b')])
    @classmethod
    def execute(cls, a, b):
        left=GeneretiLiveImagePreview.execute(a).ui['genereti_preview']
        right=GeneretiLiveImagePreview.execute(b).ui['genereti_preview']
        return io.NodeOutput(a,b,ui={'genereti_compare_a':left,'genereti_compare_b':right})

class GeneretiPerformanceProbe(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiPerformanceProbe', display_name='ꘇ performance probe', category='Genereti / Streams',
            search_aliases=['fps', 'performance', 'probe', 'monitor'], is_output_node=True, not_idempotent=True,
            description='Observe live frame/control delivery rates and queued output metadata without copying pixels. Connect any output.',
            inputs=[io.AnyType.Input('input')], outputs=[])
    @classmethod
    def execute(cls, input):
        info={'type':type(input).__name__}
        if hasattr(input,'shape'):
            info['shape']=list(input.shape)
            info['dtype']=str(input.dtype)
            if hasattr(input,'element_size') and hasattr(input,'numel'):
                info['bytes']=input.numel()*input.element_size()
        elif isinstance(input,dict):
            info['keys']=list(map(str,list(input)[:16]))
            channels=input.get('channels')
            if isinstance(channels,dict):
                info['channels']=len(channels)
                info['samples']={str(k):len(v) for k,v in list(channels.items())[:8] if hasattr(v,'__len__')}
            for key in ['sampleRate','sample_rate','time']:
                if isinstance(input.get(key),(int,float,str)):info[key]=input[key]
        elif isinstance(input,(str,list,tuple)):
            info['length']=len(input)
        return io.NodeOutput(ui={'genereti_probe':[info]})

class GeneretiStreams(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiLiveImagePreview, GeneretiImageCompare, GeneretiPerformanceProbe]
