"""Loopback-only HTTP/WebSocket bridge for Core ML generation and live output."""
from __future__ import annotations
import asyncio, base64, io, json, os, re, time, traceback
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

ROOT = Path(__file__).resolve().parent
MAX_BODY = 3_000_000
Image.MAX_IMAGE_PIXELS = 16_000_000
ORIGIN = re.compile(r'^https?://(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$')

class GenerateRequest(BaseModel):
    prompt: str = Field(default='A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition', max_length=2000)
    prompt_b: str = Field(default='', max_length=2000)
    prompt_mix: float = Field(default=0, ge=0, le=1)
    mode: Literal['text','image','sketch','canny','depth','pose'] = 'text'
    style: Literal['base','anime'] = 'base'
    seed: int = Field(default=42, ge=0, le=4294967295)
    strength: float = Field(default=.65, ge=.05, le=1)
    control_scale: float = Field(default=.8, ge=0, le=1.5)
    feedback: float = Field(default=0, ge=0, le=.7)
    noise_phase: float = Field(default=0, ge=-1e6, le=1e6)
    image: str | None = Field(default=None, max_length=2_800_000)
    preprocess: bool = True
    return_guide: bool = False
    id: int = 0

class Runtime:
    def __init__(self):
        self.engine=None; self.error=None; self.loading='Loading local models…'
        self.executor=ThreadPoolExecutor(max_workers=1,thread_name_prefix='coreml')
        from guides import GuideProcessor
        self.guides=GuideProcessor()
        self.lock=asyncio.Lock(); self.jpeg=None; self.frame=0; self.metadata={}
        self.durations=deque(maxlen=60); self.updated=0
    def load(self):
        try:
            from engine import Engine
            self.engine=Engine(int(os.getenv('GENERETI_SIZE','256')))
            self.loading='Warming up…'
            self.engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition')
            if (self.engine.directory/'turbo_unet.mlpackage').exists():
                self.engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',Image.new('RGB',(512,512),'white'),mode='image')
            if 'controlled_unet' in self.engine.models:
                self.engine.generate('A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',Image.new('RGB',(512,512),'white'),mode='sketch')
            self.loading=None
            print('GENERETI READY',flush=True)
        except Exception as exc:
            self.error=str(exc); self.loading=None; traceback.print_exc()
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
        preprocess_start=time.perf_counter()
        guide=None
        if image is not None and data.mode in ('canny','depth','pose','sketch'):
            if data.preprocess and data.mode in ('canny','depth'):
                image=self.guides.process(image,data.mode,self.engine.size)
            if data.return_guide:
                g=io.BytesIO();image.save(g,format='JPEG',quality=90)
                guide='data:image/jpeg;base64,'+base64.b64encode(g.getvalue()).decode()
        preprocess_ms=(time.perf_counter()-preprocess_start)*1000
        args=data.model_dump(exclude={'image','id','preprocess','return_guide'})
        output, metrics=self.engine.generate(image=image,**args)
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
        'model':'SDXS DreamShaper','size':int(os.getenv('GENERETI_SIZE','256')),
        'controlnet':bool(runtime.engine and 'controlled_unet' in runtime.engine.models),
        'available_models':[p.stem for p in (ROOT/'models'/str(os.getenv('GENERETI_SIZE','256'))).glob('*.mlpackage')],
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
app.mount('/',StaticFiles(directory=ROOT/'web',html=True),name='web')
