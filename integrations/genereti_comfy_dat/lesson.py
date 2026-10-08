"""Authored walkthrough document; Queue exports data without starting playback."""
import json
from comfy_api.latest import io
from . import tables
DEFAULT=json.dumps({'format':'genereti-guide','version':1,'id':'my-lesson','title':'My creative lesson','summary':'Edit this guide, then press Run.','steps':[{'title':'Edit a texture','text':'Change its expression, then continue.','target':{'nodeType':'GeneretiTextureExpression','part':'code','widget':'expression'},'check':{'kind':'changed-widget'}}]},indent=2)
def markdown(guide):
    if guide.get('format')!='genereti-guide' or guide.get('version')!=1 or not 1<=len(guide.get('steps',[]))<=100:raise ValueError('Expected genereti-guide v1 with 1..100 steps')
    parts=['# '+str(guide['title']),str(guide.get('summary',''))]
    for i,step in enumerate(guide['steps']):
        parts += ['## '+str(i+1)+'. '+str(step['title']),str(step['text'])]
        if step.get('target'):parts+=['Focus: `'+str(step['target']['nodeType'])+'` · '+str(step['target'].get('part','node'))]
        if step.get('check'):parts+=['Learner check: '+str(step['check']['kind'])]
    return '\n\n'.join(parts)+'\n'
class Lesson(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiDatLesson',display_name='ꘇ dat.lesson',search_aliases=['genereti', 'dat.lesson', 'genereti dat.lesson', 'dat', 'genereti dat'],category='ꘇ / DAT',inputs=[io.String.Input('guide',default=DEFAULT,multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'})],outputs=[io.Custom('GENERETI_DAT').Output(display_name='document'),io.String.Output(display_name='markdown')],description='Author a semantic guided lesson in CodeMirror. Toolbar Run/Stop plays it; export Markdown, static HTML or Print / Save as PDF here. Queue returns its Markdown document without running the tutorial.')
    @classmethod
    def execute(cls,guide):
        text=markdown(json.loads(guide));return io.NodeOutput(tables.table([[line] for line in text.splitlines()]),text)
