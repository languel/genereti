"""General browser livecode source. Queue samples its last working canvas."""
from comfy_api.latest import io
from . import _load_canvas

class GeneretiLivecode(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(node_id='GeneretiLivecode',display_name='ꘇ livecode',search_aliases=['Genereti Livecode','livecode','live code','p5','GLSL','Three.js','Strudel'],category='Genereti / Interactive Sources',not_idempotent=True,
            inputs=[io.Combo.Input('language',options=['p5','glsl','three','strudel','html','markdown'],default='p5'),
                io.Boolean.Input('auto_update',default=True),
                io.String.Input('code',default='',multiline=True,socketless=True,extra_dict={'widgetType':'GENERETI_LIVECODE'}),
                io.String.Input('canvas',default='',socketless=True,extra_dict={'widgetType':'GENERETI_LIVECODE_CAPTURE'})],
            outputs=[io.Image.Output(display_name='IMAGE')])
    @classmethod
    def execute(cls,language,auto_update,code,canvas):
        return io.NodeOutput(_load_canvas(canvas))
