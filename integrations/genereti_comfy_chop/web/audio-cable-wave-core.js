// The path renderer uses cubic splines with controls at a quarter of the span.
function offset(point,direction,amount){if(direction==='left')point[0]-=amount;else if(direction==='right')point[0]+=amount;else if(direction==='up')point[1]-=amount;else if(direction==='down')point[1]+=amount;}
export function wavePoints(start,end,startDirection,endDirection,options,samples,amplitude=14){
 const distance=Math.hypot(end[0]-start[0],end[1]-start[1]),amount=distance*.25;
 const c1=options?.startControl?[start[0]+options.startControl[0],start[1]+options.startControl[1]]:[...start],c2=options?.endControl?[end[0]+options.endControl[0],end[1]+options.endControl[1]]:[...end];
 if(!options?.startControl)offset(c1,startDirection,amount);if(!options?.endControl)offset(c2,endDirection,amount);
 let peak=0;for(const sample of samples)peak=Math.max(peak,Math.abs(sample));const gain=Math.min(30,1/Math.max(.001,peak));
 const count=Math.max(24,Math.min(128,Math.ceil(distance/4))),result=[];
 for(let i=0;i<=count;i++){const t=i/count,u=1-t,x=u*u*u*start[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*end[0],y=u*u*u*start[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*end[1],dx=3*u*u*(c1[0]-start[0])+6*u*t*(c2[0]-c1[0])+3*t*t*(end[0]-c2[0]),dy=3*u*u*(c1[1]-start[1])+6*u*t*(c2[1]-c1[1])+3*t*t*(end[1]-c2[1]),length=Math.hypot(dx,dy)||1,sample=samples[Math.min(samples.length-1,Math.floor(t*(samples.length-1)))]||0,displacement=sample*gain*amplitude*Math.sin(Math.PI*t);result.push([x-dy/length*displacement,y+dx/length*displacement]);}
 return result;
}
