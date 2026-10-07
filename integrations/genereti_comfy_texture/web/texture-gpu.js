import {NOISE_WGSL} from './noise.js';
import {parseExpression,expressionWGSL} from './expression.js';
// One device per module/Comfy page. Intermediate frames are borrowed GPUTexture
// handles, never CPU pixels. Commands are ordered on the shared queue.
export function homography(points) {
  const rows=[];
  points.forEach(([x,y],i)=>{const [u,v]=[[0,0],[1,0],[1,1],[0,1]][i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
  for(let col=0;col<8;col++){
    let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
    if(Math.abs(rows[pivot][col])<1e-10)throw Error('Corner pin requires a non-degenerate quadrilateral');
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const scale=rows[col][col];for(let j=col;j<=8;j++)rows[col][j]/=scale;
    for(let row=0;row<8;row++)if(row!==col){const factor=rows[row][col];for(let j=col;j<=8;j++)rows[row][j]-=factor*rows[col][j];}
  }
  return [...rows.map(row=>row[8]),1];
}

export const SHADER=`
struct Params { v: array<vec4f, 12> };
@group(0) @binding(0) var a: texture_2d<f32>;
@group(0) @binding(1) var b: texture_2d<f32>;
@group(0) @binding(2) var<uniform> p: Params;
struct Vertex { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex fn vertex(@builtin(vertex_index) i:u32)->Vertex {
 let xy=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 var o:Vertex;o.position=vec4f(xy[i],0,1);o.uv=vec2f((xy[i].x+1)*.5,(1-xy[i].y)*.5);return o;
}
fn load(t:texture_2d<f32>, q:vec2i)->vec4f {
 let size=vec2i(textureDimensions(t));if(any(q<vec2i(0))||any(q>=size)){return vec4f(0);}
 let c=textureLoad(t,q,0);return vec4f(c.rgb*c.a,c.a);
}
fn sample(t:texture_2d<f32>,uv:vec2f)->vec4f {
 let q=uv*vec2f(textureDimensions(t))-.5;let lo=vec2i(floor(q));let f=fract(q);
 let c=mix(mix(load(t,lo),load(t,lo+vec2i(1,0)),f.x),mix(load(t,lo+vec2i(0,1)),load(t,lo+vec2i(1,1)),f.x),f.y);
 return vec4f(c.rgb/max(c.a,1e-8),c.a);
}
fn over(x:vec4f,y:vec4f,mode:i32,k:f32)->vec4f {
 if(mode==1){return overNormal(y,x,k);}
 if(mode==6){let al=mix(y.a,x.a,k);return vec4f(mix(y.rgb*y.a,x.rgb*x.a,k)/max(al,1e-8),al);}
 let aa=x.a*k;let ab=y.a;let al=aa+ab*(1-aa);var blend=x.rgb;
 if(mode==2){blend=x.rgb+y.rgb;}if(mode==3){blend=x.rgb*y.rgb;}
 if(mode==4){blend=1-(1-x.rgb)*(1-y.rgb);}if(mode==5){blend=abs(x.rgb-y.rgb);}
 return vec4f(clamp(((1-aa)*ab*y.rgb+(1-ab)*aa*x.rgb+aa*ab*blend)/max(al,1e-8),vec3f(0),vec3f(1)),al);
}
fn overNormal(x:vec4f,y:vec4f,k:f32)->vec4f {
 let aa=x.a*k;let al=aa+y.a*(1-aa);return vec4f((x.rgb*aa+y.rgb*y.a*(1-aa))/max(al,1e-8),al);
}
fn transformUV(uv:vec2f)->vec2f {
 let v=(uv-.5-p.v[1].xy)/max(p.v[1].z,.001);let r=p.v[1].w;
 return vec2f(cos(r)*v.x+sin(r)*v.y,-sin(r)*v.x+cos(r)*v.y)*p.v[2].xy+.5;
}
fn channel(code:i32,x:vec4f,y:vec4f)->f32 {
 if(code<4){return x[code];}if(code==4){return dot(x.rgb,vec3f(.2126,.7152,.0722));}
 if(code==5){return 0.;}if(code==6){return 1.;}if(code<11){return y[code-7];}
 return dot(y.rgb,vec3f(.2126,.7152,.0722));
}
@fragment fn fragment(in:Vertex)->@location(0) vec4f {
 let op=i32(p.v[0].x);let mode=i32(p.v[0].y);let k=p.v[0].z;let uv=in.uv;
 var x=sample(a,uv);var y=sample(b,uv);
 if(op==1){return over(x,y,mode,k);}
 if(op==2){if(p.v[0].w==0){y=vec4f(k);}
 var rgb=x.rgb*y.rgb;if(mode==1){rgb=x.rgb+y.rgb;}if(mode==2){rgb=x.rgb-y.rgb;}
 if(mode==3){rgb=x.rgb/select(y.rgb,vec3f(1e-6),abs(y.rgb)<vec3f(1e-6));}if(mode==4){rgb=abs(x.rgb-y.rgb);}
 if(mode==5){rgb=min(x.rgb,y.rgb);}if(mode==6){rgb=max(x.rgb,y.rgb);}return vec4f(clamp(rgb,vec3f(0),vec3f(1)),x.a);}
 if(op==3){var rgb=x.rgb;let lum=dot(rgb,vec3f(.2126,.7152,.0722));
 if(mode==0){rgb*=k;}if(mode==1){rgb=mix(rgb,1-rgb,k);}if(mode==2){rgb=mix(rgb,vec3f(lum),k);}
 if(mode==3){rgb=vec3f(select(0.,1.,lum>=k));}if(mode==4){return vec4f(rgb,x.a*k);}
 if(mode==5||mode==6){let step=vec2f(k)/vec2f(textureDimensions(a));var acc=vec4f(0);var edge=vec3f(0);
 for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){let tap=sample(a,uv+vec2f(f32(i),f32(j))*step);acc+=vec4f(tap.rgb*tap.a,tap.a);if(i!=0||j!=0){edge+=tap.rgb;}}}
 if(mode==5){return vec4f(acc.rgb/max(acc.a,1e-8),acc.a/9);}
 rgb=abs(8*x.rgb-edge);}
 return vec4f(clamp(rgb,vec3f(0),vec3f(1)),x.a);}
 if(op==4){return sample(a,transformUV(uv));}
 if(op==5){return sample(a,mix(p.v[1].xy,p.v[1].zw,uv));}
 if(op==6){let q=vec3f(uv,1);let z=dot(p.v[4].xyz,q);if(abs(z)<1e-8){return vec4f(0);}
 return sample(a,vec2f(dot(p.v[2].xyz,q),dot(p.v[3].xyz,q))/z);}
 if(op==7){y=sample(b,transformUV(uv));y.a*=k;return over(x,y,select(select(0,2,mode==1),4,mode==2),1);}
 if(op==9){return vec4f(max(x.rgb-vec3f(k),vec3f(0))/max(1-k,1e-6),x.a);}
 if(op==10){return sample(a,uv+(y.rg-vec2f(p.v[1].z))*p.v[1].xy);}
 if(op==11||op==12){
  let weights=array<f32,5>(.227027,.194595,.121622,.054054,.016216);
  let direction=select(vec2f(0,1),vec2f(1,0),op==11);
  let step=direction*k/4/vec2f(textureDimensions(a));var acc=vec4f(x.rgb*x.a,x.a)*weights[0];
  for(var i=1;i<=4;i++){let left=sample(a,uv-step*f32(i));let right=sample(a,uv+step*f32(i));acc+=(vec4f(left.rgb*left.a,left.a)+vec4f(right.rgb*right.a,right.a))*weights[i];}
  return vec4f(acc.rgb/max(acc.a,1e-8),acc.a);
 }
 if(op==13){let alpha=max(x.a,y.a);return vec4f(clamp((x.rgb*x.a+k*y.rgb*y.a)/max(alpha,1e-8),vec3f(0),vec3f(1)),alpha);}
 if(op==14){return vec4f(channel(i32(p.v[1].x),x,y),channel(i32(p.v[1].y),x,y),channel(i32(p.v[1].z),x,y),select(channel(i32(p.v[1].w),x,y),1.,p.v[0].w==3));}
 // Canvas context uses premultiplied alpha; internal textures are straight RGBA.
 if(op==8){return vec4f(x.rgb*x.a,x.a);}return x;
}`;

let singleton;
export function textureGPU(){return singleton??=(async()=>{
  if(!navigator.gpu)throw Error('WebGPU unavailable · use Comfy Queue in this host');
  const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw Error('No WebGPU adapter · use Comfy Queue');
  const device=await adapter.requestDevice();const engine=new TextureGPU(device);
  const info=await engine.module.getCompilationInfo();const errors=info.messages.filter(m=>m.type==='error');
  if(errors.length){device.destroy();throw Error('Texture shader compilation failed: '+errors.map(m=>m.message).join('; '));}
  return engine;
})().catch(error=>{singleton=null;throw error;});}

export class TextureGPU {
  constructor(device){
    this.device=device;this.format='rgba8unorm';this.cache=new Map();this.contexts=new WeakMap();this.lost=false;this.uniforms=new WeakMap();this.imports=new Map();
    this.stats={passes:0,uploads:0,presents:0};
    const module=device.createShaderModule({label:'Genereti texture operators',code:SHADER});
    this.module=module;this.pipelines=new Map();
    this.bindLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'float'}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'float'}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}}]});
    this.layout=device.createPipelineLayout({bindGroupLayouts:[this.bindLayout]});
    this.pipeline(this.format);
    device.lost.then(info=>{this.lost=true;console.error('Genereti WebGPU device lost:',info.message);});
  }
  pipeline(format){
    if(!this.pipelines.has(format))this.pipelines.set(format,this.device.createRenderPipeline({layout:this.layout,vertex:{module:this.module,entryPoint:'vertex'},fragment:{module:this.module,entryPoint:'fragment',targets:[{format}]},primitive:{topology:'triangle-list'}}));
    return this.pipelines.get(format);
  }
  target(key,width,height){
    if(this.lost)throw Error('WebGPU device lost · reload Comfy to restore live textures');
    const max=Math.min(4096,this.device.limits.maxTextureDimension2D);
    if(width<1||height<1||width>max||height>max)throw Error(`Texture resolution must be 1..${max}`);
    let frame=this.cache.get(key);
    if(!frame||frame.width!==width||frame.height!==height){if(frame){this.uniforms.get(frame.texture)?.destroy();frame.texture.destroy();}frame={texture:this.device.createTexture({label:key,size:[width,height],format:this.format,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_DST|GPUTextureUsage.COPY_SRC}),width,height};this.cache.set(key,frame);}
    return frame;
  }
  upload(bitmap,key){
    const frame=this.target(key,bitmap.width,bitmap.height);
    this.device.queue.copyExternalImageToTexture({source:bitmap},{texture:frame.texture,premultipliedAlpha:false},[frame.width,frame.height]);
    this.stats.uploads++;return frame;
  }
  pass(a,b,params,target,format=this.format,uniformKey=target,customPipeline=null){
    const device=this.device,pipeline=customPipeline??this.pipeline(format);
    let buffer=this.uniforms.get(uniformKey);if(!buffer){buffer=device.createBuffer({size:192,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.uniforms.set(uniformKey,buffer);}
    device.queue.writeBuffer(buffer,0,params);
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:a.texture.createView()},{binding:1,resource:(b??a).texture.createView()},{binding:2,resource:{buffer}}]});
    const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:target.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});
    pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);this.stats.passes++;
  }
  run(a,b,params,key){const frame=this.target(key,a.width,a.height);this.pass(a,b,params,frame.texture);return frame;}
  async expressionPipeline(source){
    this.expressions??=new Map();
    if(this.expressions.has(source))return this.expressions.get(source);
    const expression=expressionWGSL(parseExpression(source));
    const code=SHADER.slice(0,SHADER.indexOf('@fragment'))+`
${NOISE_WGSL}
fn value(t:f32,x:f32,y:f32,i:f32,c:f32,v:f32,a:f32,b:f32,w:f32,h:f32)->f32 {let g_time=p.v[1].x;let g_beat=p.v[1].y;let g_bar=p.v[1].z;let g_bpm=p.v[1].w;let g_ticks=p.v[2].x;let g_phase=p.v[2].y;let g_playing=p.v[2].z;let g_rate=p.v[2].w;let g_root=p.v[3].x;let g_tuning=p.v[3].y;let z=p.v[4].x;return ${expression};}
@fragment fn fragment(in:Vertex)->@location(0) vec4f {
 let w=p.v[0].y;let h=p.v[0].z;let t=p.v[0].x;let i=floor(in.uv.y*h)*w+floor(in.uv.x*w);
 let src=sample(a,in.uv);let x=in.uv.x+p.v[3].z;let y=in.uv.y+p.v[3].w;
 return vec4f(clamp(vec3f(value(t,x,y,i,0.,src.r,src.r,0.,w,h),value(t,x,y,i,1.,src.g,src.g,0.,w,h),value(t,x,y,i,2.,src.b,src.b,0.,w,h)),vec3f(0),vec3f(1)),select(1.,src.a,p.v[0].w>0.));
}`;
    const pending=(async()=>{const module=this.device.createShaderModule({label:'top.expression',code});
      const errors=(await module.getCompilationInfo()).messages.filter(m=>m.type==='error');
      if(errors.length)throw Error(errors.map(m=>m.message).join('; '));
      return this.device.createRenderPipeline({layout:this.layout,vertex:{module,entryPoint:'vertex'},fragment:{module,entryPoint:'fragment',targets:[{format:this.format}]},primitive:{topology:'triangle-list'}});
    })();
    this.expressions.set(source,pending);if(this.expressions.size>64)this.expressions.delete(this.expressions.keys().next().value);return pending;
  }
  expression(a,params,key,width,height,pipeline){const frame=this.target(key,width,height);this.pass(a,null,params,frame.texture,this.format,frame.texture,pipeline);return frame;}
  present(frame,canvas){
    let context=this.contexts.get(canvas);
    const format=navigator.gpu.getPreferredCanvasFormat();
    if(!context){context=canvas.getContext('webgpu');if(!context)throw Error('WebGPU canvas unavailable');context.configure({device:this.device,format,alphaMode:'premultiplied'});this.contexts.set(canvas,context);}
    if(canvas.width!==frame.width||canvas.height!==frame.height){canvas.width=frame.width;canvas.height=frame.height;}
    const p=new Float32Array(48);p[0]=8;this.pass(frame,null,p,context.getCurrentTexture(),format,canvas);this.stats.presents++;
    return canvas;
  }
  async readPixels(frame,width,height,key){
    width=Math.min(width,frame.width);height=Math.min(height,frame.height);
    const sampled=this.target(key,width,height),params=new Float32Array(48);this.pass(frame,null,params,sampled.texture);
    const bytesPerRow=Math.ceil(width*4/256)*256,size=bytesPerRow*height;
    this.readBuffers??=new Map();let buffer=this.readBuffers.get(key);
    if(!buffer||buffer.size!==size){buffer?.destroy();buffer=this.device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});this.readBuffers.set(key,buffer);}
    const encoder=this.device.createCommandEncoder();encoder.copyTextureToBuffer({texture:sampled.texture},{buffer,bytesPerRow},[width,height]);this.device.queue.submit([encoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);try{const padded=new Uint8Array(buffer.getMappedRange()),data=new Uint8Array(width*height*4);for(let y=0;y<height;y++)data.set(padded.subarray(y*bytesPerRow,y*bytesPerRow+width*4),y*width*4);this.stats.readbacks=(this.stats.readbacks??0)+1;return {data,width,height};}finally{buffer.unmap();}
  }
  releaseCanvas(canvas){this.uniforms.get(canvas)?.destroy();this.contexts.get(canvas)?.unconfigure();this.contexts.delete(canvas);}
  release(prefix){for(const [key,buffer]of this.readBuffers??[])if(key.startsWith(prefix)){buffer.destroy();this.readBuffers.delete(key);}for(const [key,frame]of this.cache)if(key.startsWith(prefix)){this.uniforms.get(frame.texture)?.destroy();frame.texture.destroy();this.cache.delete(key);}}
}

export function parameters(kind,values){
 const p=new Float32Array(48);p[8]=p[9]=1;
 const modes={Composite:['over','under','add','multiply','screen','difference','cross'],Math:['multiply','add','subtract','divide','difference','minimum','maximum'],Filter:['level','invert','monochrome','threshold','opacity','blur','edge']};
 const codes={FeedbackRef:0,Composite:1,Math:2,Filter:3,Transform:4,Crop:5,CornerPin:6,Feedback:7,Bloom:13,Displace:10,Channels:14};
 p[0]=codes[kind];p[1]=Math.max(0,modes[kind]?.indexOf(values.operation)??0);p[2]=values.opacity??values.value??values.amount??values.decay??1;
 if(kind==='Filter'&&[1,2,3,4].includes(p[1]))p[2]=Math.min(p[2],1);
 if(kind==='Feedback')p[1]=['over','add','screen'].indexOf(values.blend??'screen');
 if(kind==='Bloom')p[2]=values.strength;
 if(kind==='Displace')p.set([values.amount_x,values.amount_y,values.center],4);
 if(kind==='Channels'){const choices=['r','g','b','a','luma','zero','one','br','bg','bb','ba','bluma'];p[3]=values.channels==='RGB'?3:4;p.set(['red','green','blue','alpha'].map(name=>choices.indexOf(values[name])),4);}
 if(kind==='Transform'||kind==='Feedback'){p[4]=values.translate_x;p[5]=values.translate_y;p[6]=values.scale;p[7]=values.rotate*Math.PI/180;p[8]=values.flip_x?-1:1;p[9]=values.flip_y?-1:1;}
 if(kind==='Crop'){if(values.right<=values.left||values.bottom<=values.top)throw Error('Crop right/bottom must exceed left/top');p.set([values.left,values.top,values.right,values.bottom],4);}
 if(kind==='CornerPin'){const h=homography(['tl','tr','br','bl'].map(n=>[values[n+'_x'],values[n+'_y']]));p.set(h.slice(0,3),8);p.set(h.slice(3,6),12);p.set(h.slice(6,9),16);}
 return p;
}
