import {textureGPU,parameters} from '../../integrations/genereti_comfy_texture/web/texture-gpu.js';
import {detectBlobs,BlobTracker} from '../../integrations/genereti_comfy_texture/web/utilities.js';
export async function runChecks(){
 const cases=await (await fetch('../../output/playwright/utility-cases.json')).json(),gpu=await textureGPU(),errors=[],results=[];
 gpu.device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 function upload(input,key){const frame=gpu.target(key,input.width,input.height);gpu.device.queue.writeTexture({texture:frame.texture},Uint8Array.from(input.data),{bytesPerRow:input.width*4},[input.width,input.height]);return frame;}
 document.querySelector('main').replaceChildren();
 for(const [i,c] of cases.entries()){
  const a=upload(c.a,'utility:a:'+i),b=c.b?upload(c.b,'utility:b:'+i):null,p=parameters(c.kind,c.values);if(c.kind==='OpticalFlow')p[3]=b?1:0;
  const out=gpu.run(a,b,p,'utility:out:'+i),pixels=await gpu.readPixels(out,a.width,a.height,'utility:read:'+i);
  let max=0;for(let j=0;j<pixels.data.length;j++)max=Math.max(max,Math.abs(pixels.data[j]-c.expected[j]));if(max>3)throw Error(c.kind+' GPU/torch difference '+max);
  const figure=document.createElement('div'),label=document.createElement('p'),canvas=document.createElement('canvas');label.textContent=c.kind;gpu.present(out,canvas);figure.append(label,canvas);document.querySelector('main').append(figure);
  if(c.kind==='Blobs'){const blobs=detectBlobs(pixels,c.values.min_area,c.values.max_blobs),table=new BlobTracker().update(blobs,1000,.1,3);if(table.jsonValue.blobs.length!==2)throw Error('Blob count mismatch');}
  results.push({node:c.kind,max_byte_error:max});
 }
 const timings=[];
 for(const kind of ['Level','Edge','OpticalFlow','Blobs','Convolve']){
  const c=cases.find(c=>c.kind===kind),size=kind==='OpticalFlow'?256:512,a=gpu.target('bench:a:'+kind,size,size),b=gpu.target('bench:b:'+kind,size,size),p=parameters(kind,c.values);p[3]=kind==='OpticalFlow'?1:p[3];const samples=[];
  for(let i=0;i<8;i++){const start=performance.now();const out=gpu.run(a,b,p,'bench:out:'+kind);if(kind==='Blobs'){const pixels=await gpu.readPixels(out,256,256,'bench:read');detectBlobs(pixels,.001,32);}else await gpu.device.queue.onSubmittedWorkDone();if(i>1)samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);timings.push({kind,resolution:size,p50_ms:+samples[3].toFixed(2),max_ms:+samples.at(-1).toFixed(2)});
 }
 await gpu.device.queue.onSubmittedWorkDone();if(errors.length)throw Error(errors.join('; '));
 return {passed:results.length,results,timings,meaning:'Isolated GPU queue completion; blobs includes mask readback + CPU detection. Not end-to-end Comfy FPS.',errors};
}
