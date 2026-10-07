"""CodeMirror text/table operators, independent of model inference."""
from comfy_api.latest import ComfyExtension, io
from . import tables
from .conversions import CONVERTERS
from .lesson import Lesson
from .inspect import Inspect
WEB_DIRECTORY='./web'
DAT=io.Custom('GENERETI_DAT');CHOP=io.Custom('GENERETI_CHOP')
def code(name,default):return io.String.Input(name,default=default,multiline=True,extra_dict={'widgetType':'GENERETI_OPERATOR_TEXT'})
def schema(kind,inputs):return io.Schema(node_id='GeneretiDat'+kind,display_name='ꘇ'+('dat.'+kind.lower()),search_aliases=['genereti', 'dat', 'genereti dat'],category='ꘇ / DAT',inputs=inputs,outputs=[DAT.Output(display_name='table'),io.String.Output(display_name='text')])
def output(data):return io.NodeOutput(data,tables.text(data))
class Text(io.ComfyNode):
    @classmethod
    def define_schema(cls):return schema('Text',[code('text','A creative signal graph')])
    @classmethod
    def execute(cls,text):return io.NodeOutput(tables.table([[s] for s in text.split('\n')]),text)
class Table(Text):
    @classmethod
    def define_schema(cls):return schema('Table',[code('text','name,value\nspeed,0.5\ninfluence,0.8'),io.Combo.Input('delimiter',options=[',','tab',';','|'])])
    @classmethod
    def execute(cls,text,delimiter):return output(tables.parse(text,'\t' if delimiter=='tab' else delimiter))
class JSON(Text):
    @classmethod
    def define_schema(cls):return schema('JSON',[code('text','[{"speed":0.5,"influence":0.8}]')])
    @classmethod
    def execute(cls,text):return output(tables.from_json(text))
class Select(Text):
    @classmethod
    def define_schema(cls):return schema('Select',[DAT.Input('input'),io.Int.Input('start',default=0,min=0,max=100000),io.Int.Input('count',default=100000,min=0,max=100000),io.String.Input('columns',default='')])
    @classmethod
    def execute(cls,input,**values):return output(tables.process(cls.__name__,input,values))
class Merge(Select):
    @classmethod
    def define_schema(cls):return schema('Merge',[DAT.Input('input'),DAT.Input('other')])
    @classmethod
    def execute(cls,input,other):return output(tables.process('Merge',input,{},other))
class Transpose(Select):
    @classmethod
    def define_schema(cls):return schema('Transpose',[DAT.Input('input')])
class Replace(Select):
    @classmethod
    def define_schema(cls):return schema('Replace',[DAT.Input('input'),io.String.Input('find',default='speed'),io.String.Input('replace',default='frequency')])
class Expression(Select):
    @classmethod
    def define_schema(cls):return schema('Expression',[DAT.Input('input'),code('expression','v * 2'),io.String.Input('performance',default='{}',optional=True)])
class ToChop(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiDatToChop',display_name='ꘇdat.tochop',search_aliases=['genereti', 'dat.tochop', 'genereti dat.tochop', 'dat', 'genereti dat'],category='ꘇ / DAT',inputs=[DAT.Input('input'),io.Float.Input('sample_rate',default=60,min=1,max=1000),io.Boolean.Input('header',default=True)],outputs=[CHOP.Output(display_name='channels'),io.Float.Output(display_name='value')])
    @classmethod
    def execute(cls,input,sample_rate,header):
        data=tables.to_chop(input,sample_rate,header);value=float(next(iter(data['channels'].values()),[0])[-1]);return io.NodeOutput(data,value)
class Cell(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiDatCell',display_name='ꘇdat.cell',search_aliases=['genereti', 'dat.cell', 'genereti dat.cell', 'dat', 'genereti dat'],category='ꘇ / DAT',inputs=[DAT.Input('input'),io.Int.Input('row',default=1,min=0,max=100000),io.Int.Input('column',default=0,min=0,max=100000)],outputs=[io.String.Output(display_name='text'),io.Float.Output(display_name='value')])
    @classmethod
    def execute(cls,input,row,column):
        text,value=tables.cell_value(input,row,column);return io.NodeOutput(text,value)
class FromChop(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        result=schema('FromChop',[CHOP.Input('input')]);result.display_name='ꘇchop.todat';result.search_aliases=['genereti','chop','genereti chop','chop.todat'];result.category='ꘇ / CHOP';return result
    @classmethod
    def execute(cls,input):return output(tables.from_chop(input))
class DatExtension(ComfyExtension):
    async def get_node_list(self):return [Text,Table,JSON,Select,Merge,Transpose,Replace,Expression,ToChop,Cell,FromChop,Lesson,Inspect,*CONVERTERS]
async def comfy_entrypoint():return DatExtension()
