// Deterministic lattice noise shared by scalar expressions and WebGPU.
const mask=0xffffffff;
function hash(cell){let h=2166136261;for(const p of cell)h=Math.imul(h^(p|0),16777619)>>>0;h=Math.imul(h^(h>>>16),2246822519)>>>0;h=Math.imul(h^(h>>>13),3266489917)>>>0;return (h^(h>>>16))>>>0;}
export const NOISE_KINDS={perlin:0,value:1,simplex:2,hash:3,worley:4,voronoi:5};
// Where each algorithm's signed value really lives (0.5th–99.5th percentile, by dimension 1–4). Perlin only reaches about ±0.5,
// so 'stretch' maps this range to −1..1 and uses the whole 0..1 output.
export const NOISE_RANGE={"perlin":[[-0.5,0.5],[-0.5,0.48],[-0.44,0.45],[-0.4,0.4]],"value":[[-0.99,0.92],[-0.93,0.92],[-0.88,0.88],[-0.83,0.83]],"simplex":[[-0.5,0.5],[-0.94,0.94],[-1.0,1.0],[-0.92,0.92]],"hash":[[-0.99,0.88],[-0.99,0.99],[-0.99,0.99],[-0.99,0.99]],"worley":[[-0.69,1.0],[-0.8,0.92],[-0.86,0.79],[-0.89,0.64]],"voronoi":[[-0.86,0.97],[-0.99,0.99],[-0.99,0.99],[-0.99,0.99]]};
export const stretchNoise=(kind,n,value)=>{const [lo,hi]=NOISE_RANGE[kind][n-1];return Math.max(-1,Math.min(1,2*(value-lo)/(hi-lo)-1));};
// A second, salted hash for feature points: independent values from one cell hash.
function mix(h,salt){h=(h+Math.imul(salt+1,0x9e3779b9))>>>0;h=Math.imul(h^(h>>>16),2246822519)>>>0;h=Math.imul(h^(h>>>13),3266489917)>>>0;return (h^(h>>>16))>>>0;}
// Worley (distance to the nearest feature point, bright at the points) and voronoi (a random value per nearest cell), any dimension.
function cellular(kind,p){
 const n=p.length,cell=p.map(Math.floor),total=3**n;let best=Infinity,bestCell=cell;
 for(let k=0;k<total;k++){
  let r=k;const c=cell.map(x=>{const o=r%3-1;r=(r-r%3)/3;return x+o;}),h=hash(c);let dist=0;
  for(let i=0;i<n;i++){const f=c[i]+mix(h,i)/mask-p[i];dist+=f*f;}
  if(dist<best){best=dist;bestCell=c;}
 }
 return kind==='worley'?Math.max(-1,Math.min(1,1-2*Math.sqrt(best))):mix(hash(bestCell),7)/mask*2-1;
}
const fade=x=>x*x*x*(x*(x*6-15)+10);
function gradient(cell,delta){const h=hash(cell);return delta.reduce((sum,x,i)=>sum+x*((h>>>i)&1?1:-1),0);}
export function noise(kind,...p){
 const n=p.length;if(n<1||n>4)throw Error('Noise requires 1–4 coordinates');if(p.some(x=>!Number.isFinite(x)))return 0;
 if(kind==='hash')return hash(p.map(Math.floor))/mask*2-1;
 if(kind==='worley'||kind==='voronoi')return cellular(kind,p);
 if(kind==='simplex'&&n>1){
  const f=(Math.sqrt(n+1)-1)/n,g=(1-1/Math.sqrt(n+1))/n,s=p.reduce((a,b)=>a+b,0)*f,cell=p.map(x=>Math.floor(x+s)),u=cell.reduce((a,b)=>a+b,0)*g,d=p.map((x,i)=>x-cell[i]+u);
  const rank=d.map((x,i)=>d.reduce((r,y,j)=>r+(x>y||x===y&&i>j?1:0),0));let sum=0;
  for(let k=0;k<=n;k++){const offset=rank.map(r=>+(r>=n-k)),q=d.map((x,i)=>x-offset[i]+k*g),a=Math.max(0,(n===2?.5:.6)-q.reduce((s,x)=>s+x*x,0));sum+=a**4*gradient(cell.map((x,i)=>x+offset[i]),q);}
  return Math.max(-1,Math.min(1,sum*({2:70,3:32,4:27}[n])));
 }
 const cell=p.map(Math.floor),d=p.map((x,i)=>x-cell[i]),u=d.map(fade);let sum=0;
 for(let k=0;k<2**n;k++){const o=p.map((_,i)=>(k>>>i)&1),c=cell.map((x,i)=>x+o[i]),weight=u.reduce((a,x,i)=>a*(o[i]?x:1-x),1);sum+=weight*(kind==='value'?(hash(c)/mask*2-1):gradient(c,d.map((x,i)=>x-o[i])));}
 return kind==='value'?sum:sum/Math.sqrt(n);
}
export const NOISE_WGSL=`
fn gn_hash(cell:vec4i,n:u32)->u32 {
 var h=2166136261u;for(var j=0u;j<n;j++){h=(h^bitcast<u32>(cell[j]))*16777619u;}
 h=(h^(h>>16u))*2246822519u;h=(h^(h>>13u))*3266489917u;return h^(h>>16u);
}
fn gn_gradient(cell:vec4i,d:vec4f,n:u32)->f32 {
 let h=gn_hash(cell,n);var result=0.;for(var j=0u;j<n;j++){result+=d[j]*select(-1.,1.,((h>>j)&1u)!=0u);}return result;
}
fn gn_mix(h0:u32,salt:u32)->u32 {
 var h=h0+(salt+1u)*2654435769u;h=(h^(h>>16u))*2246822519u;h=(h^(h>>13u))*3266489917u;return h^(h>>16u);
}
fn gn_cellular(p:vec4f,n:u32,kind:u32)->f32 {
 var cell=vec4i(0);for(var j=0u;j<n;j++){cell[j]=i32(floor(p[j]));}
 var total=1u;for(var j=0u;j<n;j++){total*=3u;}
 var best=1e9;var bestCell=cell;
 for(var k=0u;k<total;k++){
  var r=k;var c=cell;for(var j=0u;j<n;j++){c[j]=cell[j]+i32(r%3u)-1;r/=3u;}
  let h=gn_hash(c,n);var dist=0.;
  for(var j=0u;j<n;j++){let f=f32(c[j])+f32(gn_mix(h,j))/4294967295.-p[j];dist+=f*f;}
  if(dist<best){best=dist;bestCell=c;}
 }
 if(kind==4u){return clamp(1.-2.*sqrt(best),-1.,1.);}
 return f32(gn_mix(gn_hash(bestCell,n),7u))/4294967295.*2.-1.;
}
fn gn_noise(p:vec4f,n:u32,kind:u32)->f32 {
 if(kind==3u){var c=vec4i(0);for(var j=0u;j<n;j++){c[j]=i32(floor(p[j]));}return f32(gn_hash(c,n))/4294967295.*2.-1.;}
 if(kind>=4u){return gn_cellular(p,n,kind);}
 if(kind==2u&&n>1u){
  let nf=f32(n);let f=(sqrt(nf+1.)-1.)/nf;let g=(1.-inverseSqrt(nf+1.))/nf;
  var s=0.;for(var j=0u;j<n;j++){s+=p[j];}s*=f;
  var cell=vec4i(0);var u=0.;for(var j=0u;j<n;j++){cell[j]=i32(floor(p[j]+s));u+=f32(cell[j]);}u*=g;
  var d=vec4f(0);for(var j=0u;j<n;j++){d[j]=p[j]-f32(cell[j])+u;}
  var rank=vec4u(0);for(var j=0u;j<n;j++){for(var k=0u;k<n;k++){if(d[j]>d[k]||(d[j]==d[k]&&j>k)){rank[j]++;}}}
  var result=0.;for(var k=0u;k<=n;k++){
   var offset=vec4i(0);var q=vec4f(0);var radius=select(.6,.5,n==2u);
   for(var j=0u;j<n;j++){offset[j]=select(0,1,rank[j]>=n-k);q[j]=d[j]-f32(offset[j])+f32(k)*g;radius-=q[j]*q[j];}
   let a=max(0.,radius);result+=a*a*a*a*gn_gradient(cell+offset,q,n);
  }
  return clamp(result*select(select(27.,32.,n==3u),70.,n==2u),-1.,1.);
 }
 var cell=vec4i(0);var d=vec4f(0);var u=vec4f(0);
 for(var j=0u;j<n;j++){cell[j]=i32(floor(p[j]));d[j]=p[j]-f32(cell[j]);let x=d[j];u[j]=x*x*x*(x*(x*6.-15.)+10.);}
 var result=0.;for(var k=0u;k<(1u<<n);k++){
  var o=vec4i(0);var q=vec4f(0);var weight=1.;for(var j=0u;j<n;j++){o[j]=i32((k>>j)&1u);q[j]=d[j]-f32(o[j]);weight*=select(1.-u[j],u[j],o[j]==1);}
  if(kind==1u){result+=weight*(f32(gn_hash(cell+o,n))/4294967295.*2.-1.);}else{result+=weight*gn_gradient(cell+o,q,n);}
 }
 return select(result/sqrt(f32(n)),result,kind==1u);
}`;
export function noiseExpression(v){
 const n=Number(v.dimensions),kind=v.algorithm,octaves=Number(v.octaves);let weight=1,total=0,frequency=Number(v.scale),terms=[];
 for(let o=0;o<octaves;o++){
  const offset=Number(v.seed)*.123+o*19.19,shift=v.color==='RGB'?'+c*31.7':'';
  const coords=[`x*${frequency}+${offset}${shift}${n<3?`+t*${Number(v.speed)}`:''}`,`y*${frequency}`,`${Number(v.z)}+z${n===3?`+t*${Number(v.speed)}`:''}`,`t*${Number(v.speed)}`].slice(0,n);
  terms.push(`${weight}*${kind}(${coords.join(',')})`);total+=weight;weight*=Number(v.gain);frequency*=Number(v.lacunarity);
 }
 return `0.5+0.5*(${terms.join('+')})/${total}`;
}
