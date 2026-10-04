"""Explicit bridges across texture, signal and table boundaries."""
import numpy as np
import torch
import torch.nn.functional as F
from comfy_api.latest import io
from . import tables
DAT=io.Custom('GENERETI_DAT');CHOP=io.Custom('GENERETI_CHOP')
def sample_inputs():return [io.Image.Input('image'),io.Int.Input('sample_width',default=16,min=1,max=64),io.Int.Input('sample_height',default=16,min=1,max=64),io.Float.Input('sample_rate',default=10,min=.1,max=60),io.Int.Input('batch_index',default=0,min=0,max=10000)]
def pixels(image,width,height,index):
    if index>=len(image):raise ValueError('Batch index exceeds IMAGE batch')
    frame=image[index:index+1];height=min(height,frame.shape[1]);width=min(width,frame.shape[2]);frame=F.interpolate(frame.permute(0,3,1,2),size=(height,width),mode='bilinear',align_corners=False).permute(0,2,3,1)[0]
    if frame.shape[-1]==3:frame=torch.cat([frame,torch.ones_like(frame[...,:1])],-1)
    return frame.detach().cpu().numpy()
def matrix_image(matrix):
    matrix=np.nan_to_num(np.asarray(matrix,dtype=np.float32),nan=0,posinf=0,neginf=0)
    if not matrix.size:matrix=np.zeros((1,1),dtype=np.float32)
    rgb=np.repeat(matrix[:512,:512,None],3,axis=-1);return torch.from_numpy(np.concatenate([rgb.clip(0,1),np.ones_like(rgb[...,:1])],axis=-1)).unsqueeze(0)
class TopToChop(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiConvertTopToChop',display_name='ꘇtop.tochop',search_aliases=['genereti', 'top.tochop', 'genereti top.tochop', 'top', 'genereti top'],category='ꘇ / TOP',inputs=sample_inputs(),outputs=[CHOP.Output(display_name='channels'),io.Float.Output(display_name='value')],description='Explicit image readback boundary: bounded bilinear sampling to r/g/b/a channels in row-major order. Live rate limits GPU readback; Queue samples one selected batch frame.')
    @classmethod
    def execute(cls,image,sample_width,sample_height,sample_rate,batch_index):
        p=pixels(image,sample_width,sample_height,batch_index);channels={n:p[...,c].reshape(-1) for c,n in enumerate('rgba')};return io.NodeOutput(dict(channels=channels,sample_rate=sample_rate,start=0.),float(channels['r'][-1]))
class TopToDat(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiConvertTopToDat',display_name='ꘇtop.todat',search_aliases=['genereti', 'top.todat', 'genereti top.todat', 'top', 'genereti top'],category='ꘇ / TOP',inputs=sample_inputs(),outputs=[DAT.Output(display_name='table'),io.String.Output(display_name='text')],description='Explicit image readback: x/y/r/g/b/a rows from bounded samples. Live rate limits sampling; Queue selects one batch frame.')
    @classmethod
    def execute(cls,image,sample_width,sample_height,sample_rate,batch_index):
        p=pixels(image,sample_width,sample_height,batch_index);data=tables.table([['x','y','r','g','b','a'],*[[x,y,*p[y,x].tolist()] for y in range(p.shape[0]) for x in range(p.shape[1])]]);return io.NodeOutput(data,tables.text(data))
class ChopToTop(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiConvertChopToTop',display_name='ꘇchop.totop',search_aliases=['genereti', 'chop.totop', 'genereti chop.totop', 'chop', 'genereti chop'],category='ꘇ / CHOP',inputs=[CHOP.Input('input'),io.Combo.Input('layout',options=['channel_rows','rgba']),io.Int.Input('width',default=16,min=1,max=512)],outputs=[io.Image.Output(display_name='image')],description='Channels-as-grayscale-rows, or first four channels as RGBA pixels packed to the requested width. Clamps to 0..1; at most 512×512. This is a CPU-data-to-texture upload boundary.')
    @classmethod
    def execute(cls,input,layout,width=16):
        values=list(input['channels'].values())
        if not values:return io.NodeOutput(matrix_image([]))
        if layout=='channel_rows':return io.NodeOutput(matrix_image(values))
        n=min(512*width,len(values[0]));height=max(1,(n+width-1)//width);out=np.zeros((1,height,width,4),dtype=np.float32);out[...,3]=1
        for c,values in enumerate(values[:4]):out.reshape(-1,4)[:n,c]=np.nan_to_num(values[:n],nan=0,posinf=0,neginf=0)
        return io.NodeOutput(torch.from_numpy(out.clip(0,1)))
class DatToTop(io.ComfyNode):
    @classmethod
    def define_schema(cls):return io.Schema(node_id='GeneretiConvertDatToTop',display_name='ꘇdat.totop',search_aliases=['genereti', 'dat.totop', 'genereti dat.totop', 'dat', 'genereti dat'],category='ꘇ / DAT',inputs=[DAT.Input('input'),io.Boolean.Input('header',default=False)],outputs=[io.Image.Output(display_name='image')],description='Numeric table cells become a grayscale texture: columns are x, rows are y. Optional header skip; invalid numbers become zero, values clamp to 0..1. At most 512×512.')
    @classmethod
    def execute(cls,input,header):
        rows=input['rows'][1:] if header else input['rows'];width=min(512,max(map(len,rows),default=1));out=np.zeros((min(512,len(rows)),width),dtype=np.float32)
        for y,row in enumerate(rows[:512]):
            for x,cell in enumerate(row[:512]):
                try:out[y,x]=float(cell)
                except ValueError:pass
        return io.NodeOutput(matrix_image(out))
CONVERTERS=[TopToChop,TopToDat,ChopToTop,DatToTop]
