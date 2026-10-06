// Portable, bounded cursor paths. Coordinates belong to a named node/widget,
// not to absolute screen pixels or arbitrary DOM selectors.
export function samplePath(path,progress){
 const end=path.at(-1)[2],time=Math.max(0,Math.min(1,progress))*end;
 for(let i=1;i<path.length;i++)if(path[i][2]>=time){const a=path[i-1],b=path[i],k=b[2]===a[2]?1:(time-a[2])/(b[2]-a[2]);return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];}
 return path.at(-1).slice(0,2);
}
export function appendPoint(path,point,time){
 const at=Math.min(5000,Math.max(path.at(-1)?.[2]??0,time));
 if(path.length>=96)path.splice(1,1);
 path.push([...point,at]);
}
