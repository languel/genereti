"""Optional browser MediaPipe providers and model-free stream consumers."""
from comfy_api.latest import ComfyExtension, io
WEB_DIRECTORY = './web'
DAT = io.Custom('GENERETI_DAT')
CHOP = io.Custom('GENERETI_CHOP')

def schema(kind, label, inputs, outputs):
    return io.Schema(node_id='GeneretiPerception'+kind, display_name='ꘇ '+label, category='ꘇ / Perception', inputs=inputs, outputs=outputs, search_aliases=['mediapipe','perception','streams','events'], description='Local browser perception. Explicit download/load/start; camera capture is started separately. Queue requires a captured snapshot instead.')
class Provider(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Provider','mediapipe.stream',[io.Image.Input('image'),io.String.Input('stream',default='body'),io.Combo.Input('task',options=['pose','hands','face','segment'],default='pose'),io.Float.Input('max_fps',default=15,min=1,max=60)],[io.Image.Output(display_name='mask / overlay'),DAT.Output(display_name='observations')])
    @classmethod
    def execute(cls, **kwargs): raise ValueError('MediaPipe runs in the active browser. Use Live and download/load/start explicitly; capture its IMAGE for queued processing.')
class Read(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Read','perception.read',[io.String.Input('stream',default='body'),io.String.Input('feature',default='pose.nose.x'),io.Float.Input('max_age_ms',default=500,min=50,max=10000)],[CHOP.Output(display_name='channels'),io.Float.Output(display_name='value'),DAT.Output(display_name='observations')])
    @classmethod
    def execute(cls, **kwargs): raise ValueError('Global perception streams are browser Live state; capture a snapshot for Queue.')
DEFAULT_RULES='{"version":1,"rules":[{"name":"person.present","steps":[{"feature":"pose.count","op":">","value":0,"hold_ms":300}],"within_ms":1500,"cooldown_ms":800}]}'
class Events(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Events','perception.events',[io.String.Input('stream',default='body'),io.Float.Input('max_age_ms',default=500,min=50,max=10000),io.String.Input('rules',default=DEFAULT_RULES,multiline=True)],[CHOP.Output(display_name='events'),DAT.Output(display_name='event data')])
    @classmethod
    def execute(cls, **kwargs): raise ValueError('Perception event rules evaluate browser Live streams; they never run camera or inference in Queue.')
class Features(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Features','perception.features',[io.String.Input('stream',default='body'),io.String.Input('features',default='pose.right_wrist pose.left_wrist'),io.String.Input('selection_stream',default='selected'),io.Float.Input('min_confidence',default=.4,min=0,max=1),io.Float.Input('max_age_ms',default=500,min=50,max=10000)],[CHOP.Output(display_name='features'),DAT.Output(display_name='observations'),io.Image.Output(display_name='landmarks')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Feature selection reads browser Live streams. Start a provider and use Live.')
class Extension(ComfyExtension):
    async def on_load(self):
        from server import PromptServer
        from .assets import register_routes
        register_routes(PromptServer.instance.routes)
    async def get_node_list(self): return [Provider,Read,Events,Features]
async def comfy_entrypoint(): return Extension()
