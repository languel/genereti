// Analysis stays downstream of the Web Audio bus, never reads the speakers.
export const ANALYSIS_KINDS=new Set(['Scope','Spectrum','Lissajous','Analyze']);
export function levels(left,right=left){let sum=0,peak=0,cross=0,aa=0,bb=0;const n=Math.min(left.length,right.length);for(let i=0;i<n;i++){const a=left[i],b=right[i];sum+=a*a+b*b;peak=Math.max(peak,Math.abs(a),Math.abs(b));cross+=a*b;aa+=a*a;bb+=b*b;}return {rms:n?Math.sqrt(sum/(2*n)):0,peak,correlation:aa*bb?cross/Math.sqrt(aa*bb):0};}
export function magnitudes(db){return Float32Array.from(db,x=>Number.isFinite(x)?10**(x/20):0);}
export function bandLevel(bins,sampleRate,fftSize,low,high){let sum=0,n=0;for(let i=Math.max(0,Math.ceil(low*fftSize/sampleRate));i<Math.min(bins.length,Math.ceil(high*fftSize/sampleRate));i++){sum+=bins[i]*bins[i];n++;}return n?Math.sqrt(sum/n):0;}
export function analysisFrame(kind,left,right,db,sampleRate,time){const metrics=levels(left,right),bins=magnitudes(db),frequency=Float32Array.from(bins,(_,i)=>i*sampleRate/left.length);const channels=kind==='Spectrum'?{magnitude:bins,frequency}:kind==='Analyze'?Object.fromEntries(Object.entries({...metrics,low:bandLevel(bins,sampleRate,left.length,20,250),mid:bandLevel(bins,sampleRate,left.length,250,2000),high:bandLevel(bins,sampleRate,left.length,2000,20000)}).map(([k,v])=>[k,Float32Array.of(v)])):{left:left.slice(),right:right.slice()};return {channels,sampleRate:kind==='Analyze'?40:sampleRate,start:time,domain:kind==='Spectrum'?'frequency':'time',binHz:sampleRate/left.length,...metrics};}
export function paintAnalysis(canvas,kind,data,gain=1,color='#ddd'){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle=color;ctx.globalAlpha=.18;ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1.5;
 const line=(x,y,n)=>{ctx.beginPath();for(let i=0;i<n;i++)i?ctx.lineTo(x(i),y(i)):ctx.moveTo(x(i),y(i));ctx.stroke();};
 if(kind==='Lissajous'){const {left,right}=data.channels;line(i=>w/2+left[i]*gain*w*.45,i=>h/2-right[i]*gain*h*.45,Math.min(left.length,right.length));}
 else if(kind==='Spectrum'){const a=data.channels.magnitude;line(i=>i*w/(a.length-1),i=>h-Math.max(0,Math.min(1,(20*Math.log10(Math.max(1e-9,a[i]*gain))+90)/90))*(h-18),a.length);}
 else if(kind==='Analyze'){const a=['rms','peak','low','mid','high'];a.forEach((key,i)=>{const v=data.channels[key][0];ctx.fillStyle=color;ctx.fillRect(i*w/5+4,h-Math.min(1,v*gain)*h,w/5-8,Math.min(1,v*gain)*h);ctx.font='11px monospace';ctx.fillText(key,i*w/5+6,h-5);});}
 else{const a=data.channels.left,b=data.channels.right;line(i=>i*w/(a.length-1),i=>h*.25-a[i]*gain*h*.23,a.length);ctx.globalAlpha=.6;line(i=>i*w/(b.length-1),i=>h*.75-b[i]*gain*h*.23,b.length);ctx.globalAlpha=1;}
 ctx.fillStyle=color;ctx.font='11px monospace';if(kind==='Spectrum'){ctx.fillText('-90…0 dB · linear frequency',6,14);ctx.fillText('0 Hz',6,h-4);ctx.fillText(`${Math.round(data.sampleRate/2)} Hz`,w-78,h-4);}else if(kind==='Scope'){ctx.fillText('L',6,14);ctx.fillText('R',6,h/2+14);}else if(kind==='Lissajous'){ctx.fillText('L → / R ↑',6,h-6);}
}
// Side taps may inspect a running patch without starting unrelated instruments.
export function analysisRoots(defs,active){
 const roots=new Set(active),reachable=new Set();
 const visit=id=>{if(reachable.has(id))return;const d=defs.get(id);if(!d)return;reachable.add(id);Object.values(d.inputs??{}).forEach(visit);};
 active.forEach(visit);let changed=true;
 while(changed){changed=false;for(const [id,d] of defs)if(ANALYSIS_KINDS.has(d.kind)&&reachable.has(d.inputs?.input)&&!reachable.has(id)){roots.add(id);visit(id);changed=true;}}
 return roots;
}
