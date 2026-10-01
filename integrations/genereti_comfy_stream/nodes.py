from comfy_api.latest import ComfyExtension, io
from .transport import send, receive

class GeneretiSendFrame(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiSendFrame', display_name='Genereti Send Frame',
            category='Genereti / Streams', is_output_node=True, not_idempotent=True,
            description='Send one input frame to the local generator; returns an acknowledgement, not an image. Uses the first image in a batch. Resolution changes the shared server.',
            inputs=[io.Image.Input('image'), io.String.Input('server_url', default='http://127.0.0.1:8765'),
                io.String.Input('prompt', default='ink wash 水墨画', multiline=True),
                io.Combo.Input('mode', options=['sketch','image','text','canny','depth','pose','composite','sdxs_mixer'], default='sketch'),
                io.Combo.Input('resolution', options=['512','384','256'], default='512'),
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

class GeneretiStreams(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiSendFrame, GeneretiReceiveFrame]
