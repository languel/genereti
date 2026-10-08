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

class GeneretiStreams(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiLiveImagePreview]
