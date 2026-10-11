import {textureGPU,parameters} from '../../integrations/genereti_comfy_texture/web/texture-gpu.js';
import {cleanupGPU} from '../../integrations/genereti_comfy_texture/web/cleanup.js';
const check=(condition,message)=>{if(!condition)throw Error(message);};
function source(size,pixel){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)im.data.set(pixel(x,y),(y*size+x)*4);ctx.putImageData(im,0,0);return c;}
export async function runChecks(){
 const gpu=await textureGPU(),errors=[];gpu.device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 const flat=gpu.upload(source(16,()=>[51,102,153,255]),'check:flat');
 const options={width:32,height:32,method:'bicubic',smoothing:.4,color_threshold:.12,antialias:.5,sharpen:.2};
 const output=cleanupGPU(gpu,flat,options,'check:flat-out:');
 const read=await gpu.readPixels(output,32,32,'check:read');
 check(read.data.every((v,i)=>Math.abs(v-[51,102,153,255][i%4])<=1),'Flat field changed');
 const p=parameters('Temporal',{strength:.8,change_threshold:.12});
 const edge=x=>gpu.upload(source(16,(i)=>[i===x?255:0,i===x?255:0,i===x?255:0,255]),'check:edge:'+x);
 const old=edge(5),current=edge(6),temporal=gpu.run(current,old,p,'check:temporal');
 const motion=await gpu.readPixels(temporal,16,16,'check:motion');
 check(motion.data[(8*16+5)*4]===0&&motion.data[(8*16+6)*4]===255,'Moving line left a ghost');
 const white=gpu.upload(source(16,()=>[255,255,255,255]),'check:white');
 const cut=gpu.run(white,old,p,'check:cut');const cutRead=await gpu.readPixels(cut,16,16,'check:cut-read');
 check(cutRead.data.every(v=>v===255),'Scene cut retained history');
 const grain=gpu.upload(source(256,(x,y)=>{const line=x===64||x===y||x===128+Math.round(Math.sin(y/20)*20);const noise=((x*73+y*151)%19)-9;return line?[235,145,50,255]:[40+noise,60+noise,90+noise,255];}),'check:grain');
 const baseline=cleanupGPU(gpu,grain,{...options,width:512,height:512,method:'bilinear',smoothing:0,antialias:0,sharpen:0},'check:baseline:');
 const clean=cleanupGPU(gpu,grain,{...options,width:512,height:512,smoothing:.25,antialias:.3,sharpen:.1},'check:clean:');
 gpu.present(baseline,document.querySelector('#baseline'));gpu.present(clean,document.querySelector('#clean'));
 const timings=[];
 for(const inputSize of [256,512]){
  const input=gpu.upload(source(inputSize,(x,y)=>[(x*17+y*13)%256,(x+y)%256,x===y?255:90,255]),'check:bench:'+inputSize);
  for(const all of [false,true]){
   const settings={...options,width:inputSize*2,height:inputSize*2,smoothing:all?.25:0,antialias:all?.3:0,sharpen:all?.1:0};const samples=[];
   for(let i=0;i<25;i++){const start=performance.now();cleanupGPU(gpu,input,settings,'check:bench-out:'+inputSize+':'+all+':');await gpu.device.queue.onSubmittedWorkDone();if(i>=5)samples.push(performance.now()-start);}
   samples.sort((a,b)=>a-b);timings.push({input:inputSize,output:inputSize*2,stages:all?'bilateral+bicubic+AA+sharpen':'bicubic',p50_ms:samples[10],p95_ms:samples[18]});
  }
 }
 await gpu.device.queue.onSubmittedWorkDone();check(!errors.length,errors.join('; '));
 return {checks:['flat field','GPU output dimensions','moving-line ghost rejection','scene-cut rejection','all shader stages'],timings,meaning:'CPU submission through GPU queue completion, isolated browser; not end-to-end Comfy FPS',errors};
}
