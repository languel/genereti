from comfy_api.latest import ComfyExtension, io
from .transport import send, receive
import base64
import io as bytes_io
import time
import numpy as np
from PIL import Image

class GeneretiSendFrame(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiSendFrame', display_name='Genereti Send Frame',
            category='Genereti / Streams', is_output_node=True, not_idempotent=True,
            description='Send one input frame to the local generator; returns an acknowledgement, not an image. Uses the first image in a batch. Resolution changes the shared server.',
            inputs=[io.Image.Input('image'), io.String.Input('server_url', default='http://127.0.0.1:8765'),
                io.String.Input('prompt', default='ink wash 水墨画', multiline=True),
                io.Combo.Input('mode', options=['sketch','image','text','canny','depth','pose','composite','sdxs_mixer'], default='sketch'),
                io.Combo.Input('resolution', options=['auto','512','384','256'], default='auto'),
                io.Int.Input('seed', default=42, min=0, max=4294967295),
                io.Float.Input('control_scale', default=1., min=0., max=65504., step=.05),
                io.String.Input('options_json', default='{}', multiline=True)],
            outputs=[io.Int.Output(display_name='frame_id'),io.String.Output(display_name='metadata')])
    @classmethod
    def execute(cls, image, server_url, prompt, mode, resolution, seed, control_scale, options_json):
        return io.NodeOutput(*send(server_url,image,prompt,mode,resolution,seed,control_scale,options_json))

class GeneretiReceiveFrame(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiReceiveFrame', display_name='Genereti Receive Frame',
            category='Genereti / Streams', not_idempotent=True,
            description='Receive the latest shared output without generating. Connect after_frame to a sender to order execution, or leave it at zero for an independent receiver.',
            inputs=[io.String.Input('server_url', default='http://127.0.0.1:8765'),
                io.Int.Input('after_frame', default=0, min=0, optional=True)],
            outputs=[io.Image.Output(display_name='image'),io.Int.Output(display_name='frame_id')])
    @classmethod
    def execute(cls, server_url, after_frame=0):
        return io.NodeOutput(*receive(server_url,after_frame))

class GeneretiLivePreview(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiLivePreview', display_name='Genereti Live Preview',
            category='Genereti / Streams', is_output_node=True, not_idempotent=True,
            description='Browser-driven live generation and standalone projector. Connect a webcam/screen/p5 source and click Start live preview; no Queue needed. Queue reads the latest shared frame.',
            inputs=[io.Image.Input('image', optional=True, lazy=True),
                io.String.Input('prompt', default='ink wash 水墨画', multiline=True),
                io.Combo.Input('mode', options=['sketch','image','text','canny','depth','pose'], default='sketch'),
                io.Combo.Input('style', options=['base','anime'], default='base'),
                io.Boolean.Input('preprocess', default=True),
                io.Int.Input('seed', default=42, min=0, max=4294967295),
                io.Float.Input('strength', default=.65, min=.05, max=1., step=.01),
                io.Float.Input('control_scale', default=1., min=0., max=65504., step=.05)],
            outputs=[io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, prompt, mode, style, preprocess, seed, strength, control_scale, image=None):
        # The browser owns generation; Queue snapshots shared output only.
        return io.NodeOutput(receive('http://127.0.0.1:8765')[0])

class GeneretiLiveImagePreview(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiLiveImagePreview', display_name='ꘇ live image preview',
            category='Genereti / Streams', is_output_node=True, not_idempotent=True,
            description='Preview any IMAGE without writing preview files. Updates when upstream executes; passthrough preserves the entire original batch.',
            inputs=[io.Image.Input('image'),
                io.Int.Input('preview_size', default=512, min=64, max=2048, step=64),
                io.Int.Input('jpeg_quality', default=85, min=20, max=100)],
            outputs=[io.Image.Output(display_name='image')])
    @classmethod
    def execute(cls, image, preview_size=512, jpeg_quality=85):
        start=time.perf_counter()
        pixels=(image[0].detach().cpu().numpy().clip(0,1)*255).astype(np.uint8)
        transparent=pixels.shape[-1] == 4 and pixels[..., 3].min() < 255
        preview=Image.fromarray(pixels if transparent else pixels[..., :3])
        preview.thumbnail((preview_size,preview_size),Image.Resampling.BILINEAR)
        buffer=bytes_io.BytesIO()
        if transparent:
            preview.save(buffer,format='PNG')
        else:
            preview.save(buffer,format='JPEG',quality=jpeg_quality)
        data=f'data:image/{"png" if transparent else "jpeg"};base64,'+base64.b64encode(buffer.getvalue()).decode()
        return io.NodeOutput(image,ui={'genereti_preview':[data],
            'genereti_preview_ms':[round((time.perf_counter()-start)*1000,2)]})

class GeneretiStreams(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiSendFrame, GeneretiReceiveFrame, GeneretiLivePreview, GeneretiLiveImagePreview]
