"""Optional browser MediaPipe providers and model-free stream consumers."""
from comfy_api.latest import ComfyExtension, io
WEB_DIRECTORY = './web'
DAT = io.Custom('GENERETI_DAT')
CHOP = io.Custom('GENERETI_CHOP')

def schema(kind, label, inputs, outputs):
    return io.Schema(node_id='GeneretiPerception'+kind, display_name='ꘇ '+label, category='Genereti / Perception', inputs=inputs, outputs=outputs, search_aliases=['mediapipe','perception','streams','events'], description='Local browser perception. Explicit download/load/start; camera capture is started separately. Queue requires a captured snapshot instead.')
class Provider(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Provider','mediapipe.stream',[io.Image.Input('image'),io.String.Input('stream',default='body'),io.Combo.Input('task',options=['pose','hands','face','segment'],default='pose'),io.Float.Input('max_fps',default=15,min=1,max=60),io.String.Input('tasks',default='holistic'),io.String.Input('features',default='')],[io.Image.Output(display_name='image'),DAT.Output(display_name='observations'),io.Image.Output(display_name='overlay')])
    @classmethod
    def execute(cls, **kwargs): raise ValueError('MediaPipe runs in the active browser. Use Live and download/load/start explicitly; capture its IMAGE for queued processing.')
class Segments(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return schema('Segments','mediapipe.segments',[io.Image.Input('image'),io.String.Input('stream',default='segments'),io.Combo.Input('model',options=['segment','multiclass'],default='segment'),io.String.Input('regions',default='person'),io.Float.Input('threshold',default=.5,min=0,max=1),io.Float.Input('softness',default=.1,min=0,max=1),io.Boolean.Input('invert',default=False),io.Float.Input('max_fps',default=15,min=1,max=60)],[io.Image.Output(display_name='mask'),io.Image.Output(display_name='cutout'),DAT.Output(display_name='observations')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Segmentation runs in browser Live. Download/load/start explicitly; camera capture is started separately.')
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
        return schema('Features','perception.features',[io.String.Input('stream',default='body'),io.String.Input('features',default='pose.right_wrist pose.left_wrist'),io.String.Input('selection_stream',default='selected'),io.Float.Input('min_confidence',default=.4,min=0,max=1),io.Float.Input('max_age_ms',default=500,min=50,max=10000),io.Image.Input('image',optional=True)],[CHOP.Output(display_name='features'),DAT.Output(display_name='observations'),io.Image.Output(display_name='landmarks')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Feature selection reads browser Live streams. Start a provider and use Live.')
DEFAULT_MEASURES='{"version":1,"locators":[{"name":"handL","points":["hands.left.thumb_tip"]},{"name":"fingerL","points":["hands.left.index_tip"]}],"measures":[{"name":"nose","type":"point","a":"pose.nose"},{"name":"pinch","type":"distance","a":"$handL","b":"$fingerL"}],"events":[],"contacts":[{"name":"pinch","feature":"pinch.distance","close":0.04,"open":0.07,"hold_ms":40,"tap_ms":350,"click_ms":700,"cooldown_ms":200}]}'
class Measures(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiPerceptionMeasures',display_name='ꘇ perception.measures',category='Genereti / Perception',description='Select landmarks, create named locators, measures and gesture events. Reads one shared provider without additional inference; publishes a named global stream.',inputs=[io.String.Input('stream',default='body'),io.String.Input('features',default='hands.left.thumb_tip hands.left.index_tip'),io.String.Input('selection_stream',default='measures'),io.Float.Input('min_confidence',default=.4,min=0,max=1),io.Float.Input('max_age_ms',default=500,min=50,max=10000),io.String.Input('definitions',default=DEFAULT_MEASURES,multiline=True),io.Image.Input('image',optional=True)],outputs=[CHOP.Output(display_name='measures'),DAT.Output(display_name='observations'),io.Image.Output(display_name='landmarks')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Measures read shared browser Live perception. No camera or model runs in this node.')
class Regions(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiPerceptionRegions',display_name='ꘇ perception.regions',category='Genereti / Perception',description='Edit named global normalized bounding boxes. Drag to move and use corner handles to resize. No inference.',inputs=[io.String.Input('region_stream',default='stage'),io.String.Input('boxes',default='{"version":1,"boxes":[{"name":"center","box":[0.25,0.25,0.5,0.5]}]}',multiline=True),io.Image.Input('image',optional=True)],outputs=[DAT.Output(display_name='regions'),io.Image.Output(display_name='preview')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Global region definitions are browser Live state; save the workflow or export JSON.')
class Mime(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiPerceptionMime',display_name='ꘇ mediamime',category='Genereti / Perception',search_aliases=['mediamime','mime','triggers','zones','homunculus','body drum','midi','osc'],
            description='Draw trigger zones over a live perception stream in Poliplan: stage zones and tripwires over the image, body zones on the homunculus that follow the performer. Fires __ events, MIDI, OSC and WebSocket messages and note channels for mod.synth / mod.drumkit. No inference.',
            inputs=[io.String.Input('stream',default='body'),io.String.Input('publish',default='mime'),io.Float.Input('min_confidence',default=.4,min=0,max=1),io.Float.Input('max_age_ms',default=500,min=50,max=10000),
                    io.String.Input('score',default='{"version":1}',multiline=True),io.Image.Input('image',optional=True),io.Image.Input('mask',optional=True)],
            outputs=[CHOP.Output(display_name='channels'),DAT.Output(display_name='events'),io.Image.Output(display_name='overlay')])
    @classmethod
    def execute(cls,**kwargs):raise ValueError('Mediamime evaluates browser Live perception streams; press ▶ in the node. Save the workflow to keep its score.')
class Extension(ComfyExtension):
    async def on_load(self):
        from server import PromptServer
        from .assets import register_routes
        register_routes(PromptServer.instance.routes)
    async def get_node_list(self): return [Provider,Segments,Read,Events,Features,Measures,Regions,Mime]
async def comfy_entrypoint(): return Extension()
