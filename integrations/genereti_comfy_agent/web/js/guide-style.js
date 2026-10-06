const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validateGuideStyle(value){
 if(!object(value))throw Error('Guide style must be an object');
 const out={},color=value=>{if(typeof value!=='string'||value.length>120)throw Error('Invalid guide style color');return value;};
 const number=(value,max,min=0)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Guide style number out of range');return value;};
 for(const name of ['panel','target']){
  if(value[name]===undefined)continue;if(!object(value[name]))throw Error('Invalid guide surface style');const source=value[name],surface={};
  if(source.backdrop!==undefined)surface.backdrop=color(source.backdrop);
  if(source.frame!==undefined){if(!object(source.frame))throw Error('Invalid guide frame');surface.frame={};for(const key of ['color','width','radius'])if(source.frame[key]!==undefined)surface.frame[key]=key==='color'?color(source.frame[key]):number(source.frame[key],key==='width'?8:64);}
  if(source.glow!==undefined){if(!object(source.glow))throw Error('Invalid guide glow');surface.glow={};for(const key of ['enabled','pulse','color','radius','spread','duration']){const v=source.glow[key];if(v===undefined)continue;if(key==='enabled'||key==='pulse'){if(typeof v!=='boolean')throw Error('Guide glow toggle must be boolean');surface.glow[key]=v;}else surface.glow[key]=key==='color'?color(v):number(v,key==='duration'?20:key==='radius'?64:16,key==='duration'?.5:0);}}
  out[name]=surface;
 }
 return out;
}
export function guideStyle(guide,index){
 const out={};for(const name of ['panel','target']){const a=guide.style?.[name]??{},b=guide.steps[index]?.style?.[name]??{};out[name]={...a,...b,frame:{...a.frame,...b.frame},glow:{...a.glow,...b.glow}};}return out;
}
