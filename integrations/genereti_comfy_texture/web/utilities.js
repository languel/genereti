// Model-free utility shaders. Internal storage is straight RGBA.
export const UTILITY_WGSL=`
fn utilLum(c:vec4f)->f32 {return dot(c.rgb*c.a,vec3f(.2126,.7152,.0722));}
fn utilAt(t:texture_2d<f32>,q:vec2i)->vec4f {return textureLoad(t,clamp(q,vec2i(0),vec2i(textureDimensions(t))-1),0);}
fn utilGray(t:texture_2d<f32>,q:vec2i)->f32 {return utilLum(utilAt(t,q));}
fn utilGradient(t:texture_2d<f32>,q:vec2i,scharr:bool)->vec2f {
 let d=select(1.,3.,scharr);let c=select(2.,10.,scharr);let scale=select(4.,16.,scharr);
 let tl=utilGray(t,q+vec2i(-1,-1));let tr=utilGray(t,q+vec2i(1,-1));let bl=utilGray(t,q+vec2i(-1,1));let br=utilGray(t,q+vec2i(1,1));
 return vec2f(d*(tr-tl+br-bl)+c*(utilGray(t,q+vec2i(1,0))-utilGray(t,q+vec2i(-1,0))),d*(bl-tl+br-tr)+c*(utilGray(t,q+vec2i(0,1))-utilGray(t,q+vec2i(0,-1))))/scale;
}
fn utilHSV(h:f32,s:f32,v:f32)->vec3f {
 let pigment=clamp(abs(fract(vec3f(h)+vec3f(0.,2./3.,1./3.))*6.-3.)-1.,vec3f(0),vec3f(1));return v*mix(vec3f(1),pigment,s);
}
fn utilPalette(t:f32,mode:i32)->vec3f {
 if(mode==0){return vec3f(t);}if(mode==1){let u=t*3.;return clamp(vec3f(u,u-1.,u-2.),vec3f(0),vec3f(1));}
 if(mode==2){return vec3f(t,1.-t,1.);}if(mode==4){return utilHSV(t*5./6.,1.,1.);}
 let anchors=array<vec3f,5>(vec3f(.267,.005,.329),vec3f(.230,.322,.546),vec3f(.128,.567,.551),vec3f(.369,.789,.383),vec3f(.993,.906,.144));
 let pos=t*4.;let i=min(i32(floor(pos)),3);return mix(anchors[i],anchors[i+1],pos-f32(i));
}
fn utilityPixel(op:i32,uv:vec2f)->vec4f {
 let q=vec2i(floor(uv*vec2f(textureDimensions(a))));let x=utilAt(a,q);let mode=i32(p.v[0].y);
 if(op==20){
  var rgb=(x.rgb-p.v[1].x)/max(p.v[1].y-p.v[1].x,1e-6);rgb=(rgb*p.v[1].z-.5)*p.v[1].w+.5;
  rgb=mix(vec3f(dot(rgb,vec3f(.2126,.7152,.0722))),rgb,p.v[2].x);
  rgb=pow(clamp(rgb,vec3f(0),vec3f(1)),vec3f(1./max(p.v[2].y,.01)));
  return vec4f(clamp(mix(vec3f(p.v[2].z),vec3f(p.v[2].w),rgb),vec3f(0),vec3f(1)),x.a);
 }
 if(op==21){
  var e=length(utilGradient(a,q,mode==1));if(mode==2){e=abs(4.*utilLum(x)-utilGray(a,q+vec2i(1,0))-utilGray(a,q+vec2i(-1,0))-utilGray(a,q+vec2i(0,1))-utilGray(a,q+vec2i(0,-1)));}
  e=clamp((e*p.v[1].x-p.v[1].y)/max(1.-p.v[1].y,1e-6),0.,1.);if(p.v[1].z>0.){e=1.-e;}return vec4f(vec3f(e),x.a);
 }
 if(op==22){
  if(p.v[0].w==0.){return vec4f(.5,.5,0.,1.);}
  var xx=0.;var yy=0.;var xy=0.;var xt=0.;var yt=0.;
  for(var j=-2;j<=2;j++){for(var i=-2;i<=2;i++){
   let z=q+vec2i(i,j);
   let ix=(utilGray(a,z+vec2i(1,0))+utilGray(b,z+vec2i(1,0))-utilGray(a,z+vec2i(-1,0))-utilGray(b,z+vec2i(-1,0)))*.25;
   let iy=(utilGray(a,z+vec2i(0,1))+utilGray(b,z+vec2i(0,1))-utilGray(a,z+vec2i(0,-1))-utilGray(b,z+vec2i(0,-1)))*.25;
   let it=utilGray(a,z)-utilGray(b,z);xx+=ix*ix/25.;yy+=iy*iy/25.;xy+=ix*iy/25.;xt+=ix*it/25.;yt+=iy*it/25.;
  }}
  let reg=p.v[1].y;let det=max((xx+reg)*(yy+reg)-xy*xy,1e-12);
  let flow=vec2f(xy*yt-(yy+reg)*xt,xy*xt-(xx+reg)*yt)/det;let motion=p.v[1].x;
  return vec4f(.5+clamp(flow,vec2f(-motion),vec2f(motion))/(2.*motion),clamp((xx*yy-xy*xy)/(xx*yy+reg),0.,1.),1.);
 }
 if(op==23){var v=select(utilLum(x),x.a,mode==1);v=select(0.,1.,v>=p.v[1].x);if(p.v[1].y>0.){v=1.-v;}return vec4f(vec3f(v),1.);}
 if(op==24){
  let size=vec2f(textureDimensions(b));let t=select(vec3f(dot(x.rgb,vec3f(.2126,.7152,.0722))),x.rgb,mode==1);
  let row=(p.v[1].x*(size.y-1.)+.5)/size.y;var rgb=vec3f(0);
  for(var c=0;c<3;c++){let pos=clamp(t[c],0.,1.)*(size.x-1.);let lo=i32(floor(pos));let y=p.v[1].x*(size.y-1.);let iy=i32(floor(y));
   rgb[c]=mix(mix(utilAt(b,vec2i(lo,iy))[c],utilAt(b,vec2i(lo+1,iy))[c],fract(pos)),mix(utilAt(b,vec2i(lo,iy+1))[c],utilAt(b,vec2i(lo+1,iy+1))[c],fract(pos)),fract(y));
  }return vec4f(mix(x.rgb,rgb,p.v[1].y),x.a);
 }
 if(op==25){
  var value=distance(x.rgb,p.v[1].rgb)/sqrt(3.);if(mode==1){value=dot(x.rgb,vec3f(.2126,.7152,.0722));}
  var matte=clamp((value-p.v[2].x)/max(p.v[2].y-p.v[2].x,1e-6),0.,1.);matte=matte*matte*(3.-2.*matte);if(p.v[2].z>0.){matte=1.-matte;}
  if(p.v[0].w>0.){return vec4f(vec3f(matte),1.);}var rgb=x.rgb;
  if(mode==0){var k=0;if(p.v[1].g>p.v[1].r){k=1;}if(p.v[1].b>p.v[1][k]){k=2;}let neutral=(rgb[(k+1)%3]+rgb[(k+2)%3])*.5;rgb[k]-=max(rgb[k]-neutral,0.)*p.v[2].w*(1.-matte);}
  return vec4f(rgb,x.a*matte);
 }
 if(op==26){
  let hi=max(x.r,max(x.g,x.b));let lo=min(x.r,min(x.g,x.b));let d=hi-lo;var h=0.;
  if(d>1e-8){if(hi==x.r){h=(x.g-x.b)/d;}else if(hi==x.g){h=(x.b-x.r)/d+2.;}else{h=(x.r-x.g)/d+4.;}h/=6.;}
  return vec4f(utilHSV(fract(h+p.v[1].x),clamp(d/max(hi,1e-8)*p.v[1].y,0.,1.),clamp(hi*p.v[1].z,0.,1.)),x.a);
 }
 if(op==27){return vec4f(clamp(x.rgb*p.v[1].rgb+p.v[2].rgb,vec3f(0),vec3f(1)),x.a);}
 if(op==28){var t=clamp((dot(x.rgb,vec3f(.2126,.7152,.0722))-p.v[1].x)/max(p.v[1].y-p.v[1].x,1e-6),0.,1.);if(p.v[1].z>0.){t=1.-t;}return vec4f(mix(x.rgb,utilPalette(t,mode),p.v[1].w),x.a);}
 if(op==29){
  var acc=vec3f(0);var total=0.;for(var i=0;i<9;i++){let weight=p.v[1+i/4][i%4];let tap=utilAt(a,q+vec2i(i%3-1,i/3-1));acc+=select(x.rgb,tap.rgb,tap.a>1e-8)*weight;total+=weight;}
  if(p.v[0].w>0.&&abs(total)>1e-6){acc/=total;}return vec4f(mix(x.rgb,clamp(acc+p.v[4].x,vec3f(0),vec3f(1)),p.v[4].y),x.a);
 }
 if(op==30){let g=utilGradient(a,q,false);let e=clamp(p.v[1].z+p.v[1].y*dot(g,vec2f(cos(p.v[1].x),sin(p.v[1].x))),0.,1.);return vec4f(mix(x.rgb,vec3f(e),p.v[1].w),x.a);}
 if(op==31){let m=cleanSample(b,uv);var value=m.a;if(mode==0){value=dot(m.rgb,vec3f(.2126,.7152,.0722))*m.a;}else if(mode>=2){value=m[mode-2]*m.a;}
  if(p.v[1].x>0.){value=1.-value;}let alpha=select(x.a*value,value,p.v[0].w>0.);return vec4f(x.rgb,mix(x.a,alpha,p.v[1].y));}
 return x;
}`;

export const UTILITY_KINDS=['Level','Edge','OpticalFlow','Blobs','Lookup','Key','HSV','RGB','ColorMap','Convolve','Emboss','Mask'];
export function utilityParameters(kind,v){
 const p=new Float32Array(112);p[0]=20+UTILITY_KINDS.indexOf(kind);
 const set=(offset,names)=>p.set(names.map(n=>Number(v[n])),offset);
 if(kind==='Level'){if(v.white<=v.black)throw Error('White level must exceed black');set(4,['black','white','brightness','contrast','saturation','gamma','output_black','output_white']);}
 if(kind==='Edge'){p[1]=['sobel','scharr','laplacian'].indexOf(v.algorithm);set(4,['strength','threshold','invert']);}
 if(kind==='OpticalFlow')set(4,['max_motion','regularization']);
 if(kind==='Blobs'){p[1]=+(v.channel==='alpha');set(4,['threshold','invert']);}
 if(kind==='Lookup'){p[1]=+(v.mode==='channels');set(4,['row','mix']);}
 if(kind==='Key'){if(v.high<v.low)throw Error('Key high must be at least low');p[1]=+(v.mode==='luma');p[3]=+(v.output==='matte');set(4,['red','green','blue']);set(8,['low','high','invert','despill']);}
 if(kind==='HSV')set(4,['hue','saturation','value']);
 if(kind==='RGB'){set(4,['red_gain','green_gain','blue_gain']);set(8,['red_offset','green_offset','blue_offset']);}
 if(kind==='ColorMap'){if(v.high<=v.low)throw Error('High level must exceed low');p[1]=['grayscale','heat','cool','viridis','rainbow'].indexOf(v.palette);set(4,['low','high','invert','mix']);}
 if(kind==='Convolve'){p[3]=+v.normalize;set(4,Array.from({length:9},(_,i)=>'k'+i));set(16,['bias','mix']);}
 if(kind==='Emboss'){set(4,['angle','strength','bias','mix']);p[4]*=Math.PI/180;}
 if(kind==='Mask'){p[1]=['luma','alpha','red','green','blue'].indexOf(v.channel);p[3]=+(v.operation==='replace');set(4,['invert','strength']);}
 return p;
}
export function analysisSize(width,height,limit){const scale=Math.min(1,Number(limit)/Math.max(width,height));return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];}

// 8-connected components, bounded by analysis resolution, no full texture readback.
export function detectBlobs({data,width:w,height:h},minArea,maxBlobs){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),blobs=[];
 for(let seed=0;seed<w*h;seed++){
  if(seen[seed]||data[seed*4]<128)continue;let head=0,tail=1;queue[0]=seed;seen[seed]=1;let sx=0,sy=0,left=w,right=0,top=h,bottom=0;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);sx+=x+.5;sy+=y+.5;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const j=yy*w+xx;if(!seen[j]&&data[j*4]>=128){seen[j]=1;queue[tail++]=j;}}
  }
  const area=tail/(w*h);if(area>=minArea)blobs.push({x:sx/tail/w,y:sy/tail/h,width:(right-left+1)/w,height:(bottom-top+1)/h,area});
 }
 return blobs.sort((a,b)=>b.area-a.area).slice(0,maxBlobs);
}
export const BLOB_HEADER=['batch','id','x','y','width','height','area','vx','vy','age'];
export class BlobTracker {
 constructor(){this.reset();}
 reset(){this.tracks=[];this.nextID=1;this.time=null;}
 update(blobs,time,distance,hold){
  const dt=this.time===null?0:Math.max((time-this.time)/1000,1e-6);this.time=time;
  const pairs=[];for(let i=0;i<blobs.length;i++)for(let j=0;j<this.tracks.length;j++){const old=this.tracks[j],d=Math.hypot(blobs[i].x-old.x,blobs[i].y-old.y);if(d<=distance)pairs.push({i,j,d});}
  pairs.sort((a,b)=>a.d-b.d);const assigned=new Map(),used=new Set();for(const {i,j} of pairs)if(!assigned.has(i)&&!used.has(j)){assigned.set(i,j);used.add(j);}
  const live=blobs.map((b,i)=>{const previous=assigned.has(i)?this.tracks[assigned.get(i)]:null;return {...b,batch:0,id:previous?.id??this.nextID++,vx:previous&&dt?(b.x-previous.x)/Math.max((time-previous.time)/1000,1e-6):0,vy:previous&&dt?(b.y-previous.y)/Math.max((time-previous.time)/1000,1e-6):0,age:(previous?.age??0)+1,missed:0,time};});
  this.tracks=[...live,...this.tracks.filter((t,j)=>!used.has(j)&&t.missed<hold).map(t=>({...t,missed:t.missed+1}))];
  return {rows:[BLOB_HEADER,...live.map(b=>BLOB_HEADER.map(k=>String(b[k])))],jsonValue:{blobs:live.map(({time,missed,...b})=>b)}};
 }
}
