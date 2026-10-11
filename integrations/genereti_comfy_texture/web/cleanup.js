// Original model-free filters. No vendored FXAA/FSR/SMAA code or model assets.
export const CLEANUP_WGSL=`
fn cleanLoad(t:texture_2d<f32>,q:vec2i)->vec4f {
 let c=textureLoad(t,clamp(q,vec2i(0),vec2i(textureDimensions(t))-1),0);
 return vec4f(c.rgb*c.a,c.a);
}
fn straight(c:vec4f)->vec4f {
 let alpha=clamp(c.a,0.,1.);return vec4f(clamp(c.rgb/max(alpha,1e-8),vec3f(0),vec3f(1)),alpha);
}
fn cleanSample(t:texture_2d<f32>,uv:vec2f)->vec4f {
 let q=uv*vec2f(textureDimensions(t))-.5;let lo=vec2i(floor(q));let f=fract(q);
 return straight(mix(mix(cleanLoad(t,lo),cleanLoad(t,lo+vec2i(1,0)),f.x),mix(cleanLoad(t,lo+vec2i(0,1)),cleanLoad(t,lo+vec2i(1,1)),f.x),f.y));
}
fn premul(c:vec4f)->vec4f {return vec4f(c.rgb*c.a,c.a);}
fn cubic(v:f32)->f32 {
 let x=abs(v);if(x<=1.){return 1.25*x*x*x-2.25*x*x+1.;}
 if(x<2.){return -.75*x*x*x+3.75*x*x-6.*x+3.;}return 0.;
}
fn luma(c:vec4f)->f32 {return dot(c.rgb*c.a,vec3f(.2126,.7152,.0722));}
fn cleanupPixel(op:i32,uv:vec2f)->vec4f {
 let size=vec2f(textureDimensions(a));let step=1./size;
 let q=vec2i(floor(uv*size));let center=cleanLoad(a,q);let x=straight(center);
 if(op==15){
  if(p.v[0].y==0.){return cleanSample(a,uv);}
  let pos=uv*size-.5;let base=vec2i(floor(pos));var acc=vec4f(0);
  for(var j=-1;j<=2;j++){for(var i=-1;i<=2;i++){
   acc+=cleanLoad(a,base+vec2i(i,j))*cubic(pos.x-f32(base.x+i))*cubic(pos.y-f32(base.y+j));
  }}return straight(acc);
 }
 if(op==16){
  var acc=vec4f(0);var total=0.;let sigma=max(p.v[0].w,.001);
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){
   let tap=cleanLoad(a,q+vec2i(i,j));let d=tap-center;
   let weight=exp(-dot(d,d)/(2.*sigma*sigma)-f32(i*i+j*j)*.5);acc+=weight*tap;total+=weight;
  }}return straight(mix(center,acc/max(total,1e-8),p.v[0].z));
 }
 let n=straight(cleanLoad(a,q+vec2i(0,-1)));let s=straight(cleanLoad(a,q+vec2i(0,1)));
 let e=straight(cleanLoad(a,q+vec2i(1,0)));let w=straight(cleanLoad(a,q+vec2i(-1,0)));
 if(op==17){
  let ln=luma(n);let ls=luma(s);let le=luma(e);let lw=luma(w);
  let hi=max(max(ln,ls),max(le,lw));let lo=min(min(ln,ls),min(le,lw));
  let limit=max(.0312,hi*.125);if(hi-lo<=limit){return x;}
  let g=vec2f(le-lw,ls-ln);let direction=vec2f(-g.y,g.x)/max(max(abs(g.x),abs(g.y)),1e-6)*step*.5;
  let filtered=straight((premul(cleanSample(a,uv+direction))+premul(cleanSample(a,uv-direction)))*.5);
  return vec4f(mix(x.rgb,filtered.rgb,p.v[0].z*clamp((hi-lo-limit)/limit,0.,1.)),x.a);
 }
 if(op==18){
  let nc=select(x.rgb,n.rgb,n.a>1e-8);let sc=select(x.rgb,s.rgb,s.a>1e-8);
  let ec=select(x.rgb,e.rgb,e.a>1e-8);let wc=select(x.rgb,w.rgb,w.a>1e-8);
  let lo=min(x.rgb,min(min(nc,sc),min(ec,wc)));let hi=max(x.rgb,max(max(nc,sc),max(ec,wc)));
  return vec4f(clamp(x.rgb+p.v[0].z*(x.rgb-(nc+sc+ec+wc)*.25),lo,hi),x.a);
 }
 if(op==19){
  if(p.v[0].z<=0.){return x;}
  let old=cleanSample(b,uv);let delta=abs(premul(old)-center);let threshold=max(p.v[0].w,.001);
  var scene=0.;
  // A small fixed scene probe rejects broad cuts without CPU/GPU readback.
  for(var j=0;j<4;j++){for(var i=0;i<4;i++){
   let pos=(vec2f(f32(i),f32(j))+.5)/4.;let d=abs(premul(cleanSample(a,pos))-premul(cleanSample(b,pos)));
   scene+=max(max(d.r,d.g),max(d.b,d.a))/16.;
  }}
  if(scene>threshold*2.){return x;}
  let change=max(max(delta.r,delta.g),max(delta.b,delta.a));
  let weight=p.v[0].z*clamp(1.-change/threshold,0.,1.);
  var lo=center;var hi=center;
  for(var j=-1;j<=1;j++){for(var i=-1;i<=1;i++){let tap=cleanLoad(a,q+vec2i(i,j));lo=min(lo,tap);hi=max(hi,tap);}}
  return straight(mix(center,clamp(premul(old),lo,hi),weight));
 }
 return x;
}`;

// Compare dispatch serials, never texture identity: producers reuse GPU handles.
export class TemporalHistory {
 constructor(){this.reset();}
 reset(){this.frame=null;this.serial=-1;this.signature=null;this.source=null;this.index=0;}
 update({serial,signature,source,width,height},render){
  if(this.frame&&this.serial===serial&&this.signature===signature&&this.source===source&&this.frame.width===width&&this.frame.height===height)return this.frame;
  if(this.signature!==signature||this.source!==source||this.frame?.width!==width||this.frame?.height!==height)this.frame=null;
  this.index=1-this.index;
  this.frame=render(this.frame,this.index);this.serial=serial;this.signature=signature;this.source=source;
  return this.frame;
 }
}

export function cleanupGPU(gpu,a,values,prefix){
 const p=new Float32Array(112);let frame=a;
 if(Number(values.smoothing)>0){p.set([16,0,values.smoothing,values.color_threshold]);frame=gpu.run(frame,null,p,prefix+'smooth');}
 p.set([15,+(values.method==='bicubic'),0,0]);
 const resized=gpu.target(prefix+'resize',Number(values.width),Number(values.height));gpu.pass(frame,null,p,resized.texture);frame=resized;
 if(Number(values.antialias)>0){p.set([17,0,values.antialias,0]);frame=gpu.run(frame,null,p,prefix+'aa');}
 if(Number(values.sharpen)>0){p.set([18,0,values.sharpen,0]);frame=gpu.run(frame,null,p,prefix+'sharp');}
 return frame;
}
