"""Loopback-only HTTP/WebSocket bridge for Core ML generation and live output."""
from __future__ import annotations
import asyncio, base64, gc, io, json, os, re, time, traceback
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, ValidationError
from PIL import Image, UnidentifiedImageError
from postprocess import apply_postprocessing
from coreml_upscaler import MODELS as UPSCALER_MODELS

ROOT = Path(__file__).resolve().parent
MAX_BODY = 9_000_000
Image.MAX_IMAGE_PIXELS = 16_000_000
ORIGIN = re.compile(r'^https?://(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$')

class GenerateRequest(BaseModel):
    prompt: str = Field(default='A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition', max_length=2000)
    prompt_b: str = Field(default='', max_length=2000)
    prompt_mix: float = Field(default=0, ge=0, le=1)
    mode: Literal['text','image','sketch','canny','depth','pose','composite'] = 'text'
    style: Literal['base','anime'] = 'base'
    seed: int = Field(default=42, ge=0, le=4294967295)
    strength: float = Field(default=.65, ge=.05, le=1)
    control_scale: float = Field(default=.8, ge=0, le=65504, allow_inf_nan=False)
    canny_control_scale: float = Field(default=.44, ge=0, le=65504, allow_inf_nan=False)
    composite_mix: float = Field(default=.5, ge=0, le=1, allow_inf_nan=False)
    composite_mode: Literal['normal','screen','multiply','difference'] = 'normal'
    feedback: float = Field(default=0, ge=0, le=1, allow_inf_nan=False)
    noise_phase: float = Field(default=0, ge=-1e6, le=1e6)
    image: str | None = Field(default=None, max_length=2_800_000)
    control_image: str | None = Field(default=None, max_length=2_800_000)
    reference_image: str | None = Field(default=None, max_length=2_800_000)
    palette_strength: float = Field(default=0, ge=0, le=1, allow_inf_nan=False)
    black_point: int = Field(default=0, ge=0, le=254)
    white_point: int = Field(default=255, ge=1, le=255)
    gamma: float = Field(default=1, ge=.1, le=5, allow_inf_nan=False)
    sharpen: float = Field(default=.35, ge=0, le=4, allow_inf_nan=False)
    emboss: float = Field(default=0, ge=0, le=1, allow_inf_nan=False)
    ai_upscaler: Literal['off','animevideo','general'] = 'off'
    upscale: Literal[1,2,4] = 1
    upscale_filter: Literal['nearest','bilinear','bicubic','lanczos'] = 'lanczos'
    preprocess: bool = True
    return_guide: bool = False
    id: int = 0

class Runtime:
    def __init__(self):
        self.size=int(os.getenv('GENERETI_SIZE','256'))
        self.engine=None; self.error=None; self.loading='Loading local models…'
        self.executor=ThreadPoolExecutor(max_workers=1,thread_name_prefix='coreml')
        self.upscalers={}
        from guides import GuideProcessor
        self.guides=GuideProcessor()
        self.lock=asyncio.Lock(); self.jpeg=None; self.frame=0; self.metadata={}
        self.durations=deque(maxlen=60); self.updated=0
    @staticmethod
    def available_sizes():
        root=ROOT/'models'
        return sorted(int(path.name) for path in root.iterdir() if path.is_dir() and path.name.isdigit()
            and all((path/f'{name}.mlpackage').exists() for name in ('unet','encoder','decoder')))
    @staticmethod
    def build_engine(size):
        from engine import Engine
        engine=Engine(size)
        engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition')
        if (engine.directory/'turbo_unet.mlpackage').exists():
            engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',Image.new('RGB',(512,512),'white'),mode='image')
        if 'controlled_unet' in engine.models:
            engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',Image.new('RGB',(512,512),'white'),mode='sketch')
        return engine
    def load(self):
        try:
            self.engine=self.build_engine(self.size)
            self.loading=None
            print('GENERETI READY',flush=True)
        except Exception as exc:
            self.error=str(exc); self.loading=None; traceback.print_exc()
    async def switch_size(self,size):
        if size not in self.available_sizes():
            raise ValueError(f'{size}px model packages are not installed.')
        if self.size==size and self.engine is not None:
            return
        async with self.lock:
            self.loading=f'Loading {size}px Core ML models…'
            self.error=None
            old_engine=self.engine
            self.engine=None
            del old_engine
            gc.collect()
            try:
                engine=await asyncio.get_running_loop().run_in_executor(self.executor,self.build_engine,size)
            except Exception as exc:
                self.error=str(exc);self.loading=None;traceback.print_exc()
                raise ValueError(f'Could not load {size}px models: {exc}') from exc
            self.engine=engine;self.size=size;self.loading=None
            print(f'GENERETI READY {size}px',flush=True)
    def render(self, data):
        start=time.perf_counter()
        image=None
        if data.mode!='text':
            if not data.image: raise ValueError('This mode needs an input image.')
            payload=data.image.split(',',1)[-1]
            try:
                raw=base64.b64decode(payload,validate=True)
                image=Image.open(io.BytesIO(raw)); image.load()
            except (ValueError,UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:
                raise ValueError('Invalid or oversized input image.') from exc
        control_image=None
        if data.control_image:
            payload=data.control_image.split(',',1)[-1]
            try:
                raw=base64.b64decode(payload,validate=True)
                control_image=Image.open(io.BytesIO(raw));control_image.load();control_image=control_image.convert('RGB')
            except (ValueError,UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:
                raise ValueError('Invalid or oversized Canny guide image.') from exc
        reference=None
        if data.reference_image:
            payload=data.reference_image.split(',',1)[-1]
            try:
                raw=base64.b64decode(payload,validate=True)
                reference=Image.open(io.BytesIO(raw));reference.load();reference=reference.convert('RGB')
            except (ValueError,UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:
                raise ValueError('Invalid or oversized palette reference image.') from exc
        preprocess_start=time.perf_counter()
        guide_image=None;guide=None
        if image is not None and data.mode in ('canny','depth','pose','sketch','composite'):
            if data.mode=='composite':
                guide_source=control_image if control_image is not None else image
                guide_image=self.guides.process(guide_source,'canny',self.engine.size)
            elif data.preprocess and data.mode in ('canny','depth'):
                image=self.guides.process(image,data.mode,self.engine.size)
                guide_image=image
            elif data.mode in ('canny','depth','pose','sketch'):
                guide_image=image
            if data.return_guide and guide_image is not None:
                g=io.BytesIO();guide_image.save(g,format='JPEG',quality=90)
                guide='data:image/jpeg;base64,'+base64.b64encode(g.getvalue()).decode()
        preprocess_ms=(time.perf_counter()-preprocess_start)*1000
        postprocess_values={
            'palette_strength':data.palette_strength,'black_point':data.black_point,
            'white_point':data.white_point,'gamma':data.gamma,'sharpen':data.sharpen,
            'emboss':data.emboss,'ai_upscaler':data.ai_upscaler,
            'upscale':data.upscale,'upscale_filter':data.upscale_filter,
        }
        learned_upscale=None;upscaler_load_ms=0
        if data.ai_upscaler!='off':
            if data.ai_upscaler not in self.upscalers:
                from coreml_upscaler import CoreMLRealESRGAN
                load_start=time.perf_counter()
                self.upscalers[data.ai_upscaler]=CoreMLRealESRGAN(data.ai_upscaler,ROOT)
                upscaler_load_ms=round((time.perf_counter()-load_start)*1000,2)
            learned_upscale=self.upscalers[data.ai_upscaler].upscale
        args=data.model_dump(exclude={'image','control_image','reference_image','id','preprocess','return_guide',
            'palette_strength','black_point','white_point','gamma','sharpen','emboss','ai_upscaler','upscale','upscale_filter'})
        if data.mode=='composite':args['control_image']=guide_image
        output, metrics=self.engine.generate(image=image,**args)
        postprocess_start=time.perf_counter()
        output=apply_postprocessing(output,reference=reference,learned_upscale=learned_upscale,**{
            key:value for key,value in postprocess_values.items() if key!='ai_upscaler'})
        metrics['postprocess_ms']=round((time.perf_counter()-postprocess_start)*1000,2)
        metrics['upscaler_load_ms']=upscaler_load_ms
        metrics['postprocess']=postprocess_values
        metrics['reference_included']=reference is not None
        metrics['output_size']=[output.width,output.height]
        buf=io.BytesIO(); output.save(buf,format='JPEG',quality=90)
        jpeg=buf.getvalue()
        metrics['preprocess_ms']=round(preprocess_ms,2)
        if guide: metrics['guide']=guide
        metrics['server_ms']=round((time.perf_counter()-start)*1000,2)
        return jpeg, metrics
    async def generate(self,data):
        if self.error: raise HTTPException(503,self.error)
        if self.loading or not self.engine: raise HTTPException(503,self.loading or 'Engine unavailable')
        if self.lock.locked(): raise HTTPException(429,'Generator is in use. Pause the other producer or retry.')
        async with self.lock:
            try: jpeg, metrics=await asyncio.get_running_loop().run_in_executor(self.executor,self.render,data)
            except ValueError as exc: raise HTTPException(400,str(exc)) from exc
            self.jpeg=jpeg; self.frame+=1; self.updated=time.time()
            self.durations.append(metrics['server_ms'])
            metrics.update(frame=self.frame,id=data.id,backend='Core ML')
            self.metadata={k:v for k,v in metrics.items() if k!='guide'}
            return jpeg,metrics

runtime=Runtime()
@asynccontextmanager
async def lifespan(app):
    future=asyncio.get_running_loop().run_in_executor(runtime.executor,runtime.load)
    yield
    await future
    runtime.executor.shutdown(wait=True)

app=FastAPI(title='Genereti local bridge',version='0.1.0',lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware,allowed_hosts=['localhost','127.0.0.1','[::1]','testserver'])
app.add_middleware(CORSMiddleware,allow_origin_regex=ORIGIN.pattern,allow_methods=['GET','POST'],
    allow_headers=['Content-Type'],expose_headers=['X-Inference-Ms','X-Server-Ms','X-Frame'])

@app.middleware('http')
async def local_requests(request,call_next):
    origin=request.headers.get('origin')
    if request.method=='POST' and origin and not ORIGIN.fullmatch(origin):
        return Response('Only local application origins may generate.',status_code=403)
    response=await call_next(request)
    response.headers['Cache-Control']='no-store' if request.url.path.startswith('/api/') else 'no-cache'
    return response

@app.get('/api/status')
async def status():
    return {'ready':runtime.engine is not None and not runtime.loading and not runtime.error,
        'loading':runtime.loading,'error':runtime.error,
        'backend':runtime.metadata.get('backend','Core ML CPU + GPU'),
        'model':'SDXS DreamShaper','size':runtime.size,
        'available_sizes':runtime.available_sizes(),
        'available_upscalers':[name for name,(filename,_) in UPSCALER_MODELS.items()
            if (ROOT/'models'/'upscalers'/filename).exists()],
        'controlnet':bool(runtime.engine and 'controlled_unet' in runtime.engine.models),
        'available_models':[p.stem for p in (ROOT/'models'/str(runtime.size)).glob('*.mlpackage')],
        'frame':runtime.frame,'last_frame_age_s':round(time.time()-runtime.updated,2) if runtime.updated else None,
        'metrics':runtime.metadata,'mean_generation_fps':round(1000/(sum(runtime.durations)/len(runtime.durations)),2) if runtime.durations else 0}

@app.post('/api/generate')
async def generate(request:Request):
    body=bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body)>MAX_BODY: raise HTTPException(413,'Frame request is too large')
    try: data=GenerateRequest.model_validate_json(body)
    except ValidationError as exc: raise HTTPException(422,str(exc)) from exc
    jpeg,metrics=await runtime.generate(data)
    return Response(jpeg,media_type='image/jpeg',headers={'X-Inference-Ms':str(metrics['inference_ms']),
        'X-Server-Ms':str(metrics['server_ms']),'X-Frame':str(metrics['frame'])})

class SizeRequest(BaseModel):
    size: Literal[256,384,512]

@app.post('/api/config/size')
async def configure_size(request:SizeRequest):
    try:
        await runtime.switch_size(request.size)
    except ValueError as exc:
        raise HTTPException(400,str(exc)) from exc
    return {'ready':True,'size':runtime.size,'available_models':[p.stem for p in (ROOT/'models'/str(runtime.size)).glob('*.mlpackage')]}

@app.websocket('/ws')
async def websocket(ws:WebSocket):
    origin=ws.headers.get('origin')
    if origin and not ORIGIN.fullmatch(origin):
        await ws.close(code=1008);return
    await ws.accept()
    try:
        while True:
            raw=await ws.receive_text()
            if len(raw)>MAX_BODY:
                await ws.close(code=1009);return
            try:
                data=GenerateRequest.model_validate_json(raw)
                jpeg,metrics=await runtime.generate(data)
                await ws.send_json({'type':'frame','image':'data:image/jpeg;base64,'+base64.b64encode(jpeg).decode(),**metrics})
            except (ValidationError,HTTPException,ValueError) as exc:
                await ws.send_json({'type':'error','error':getattr(exc,'detail',str(exc)), 'status':getattr(exc,'status_code',400)})
            except Exception:
                traceback.print_exc()
                await ws.send_json({'type':'error','error':'Generation failed; see server log.','status':500})
    except WebSocketDisconnect: pass

@app.get('/api/frame.jpg')
async def latest_frame():
    if runtime.jpeg is None: raise HTTPException(503,'No frame yet. Start generating in the main page.')
    return Response(runtime.jpeg,media_type='image/jpeg',headers={'X-Frame':str(runtime.frame)})

@app.post('/api/output-frame')
async def publish_output_frame(request:Request):
    """Publish a pre-rendered frame to the same output consumed by TD and p5."""
    body=bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body)>MAX_BODY: raise HTTPException(413,'Frame is too large')
    try:
        image=Image.open(io.BytesIO(body))
        if image.width*image.height>16_000_000: raise ValueError('Frame dimensions are too large')
        image.load()
        image=image.convert('RGB')
    except (ValueError,UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:
        raise HTTPException(400,'Expected a valid, reasonably sized image frame') from exc
    buf=io.BytesIO(); image.save(buf,format='JPEG',quality=90)
    runtime.jpeg=buf.getvalue(); runtime.frame+=1; runtime.updated=time.time()
    runtime.metadata={'backend':'Clip playback','width':image.width,'height':image.height}
    return Response(status_code=204,headers={'X-Frame':str(runtime.frame)})

@app.get('/stream.mjpg')
async def stream(request:Request):
    async def frames():
        last=-1
        while not await request.is_disconnected():
            if runtime.jpeg and runtime.frame!=last:
                last=runtime.frame; jpeg=runtime.jpeg
                yield b'--frame\r\nContent-Type: image/jpeg\r\nContent-Length: '+str(len(jpeg)).encode()+b'\r\n\r\n'+jpeg+b'\r\n'
            await asyncio.sleep(.016)
    return StreamingResponse(frames(),media_type='multipart/x-mixed-replace; boundary=frame')

@app.get('/output')
async def output(): return FileResponse(ROOT/'web'/'output.html')
@app.get('/p5')
async def p5(): return FileResponse(ROOT/'web'/'p5.html')
@app.get('/experiments.md')
async def experiments(): return FileResponse(ROOT/'docs'/'experiments.md',media_type='text/markdown')
app.mount('/',StaticFiles(directory=ROOT/'web',html=True),name='web')
