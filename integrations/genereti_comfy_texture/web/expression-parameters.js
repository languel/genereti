// Numeric declarations shared by TOP and CHOP; never execute source code.
const number='[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
const reserved=new Set('t i x y z c v a b w h pi tau __ constructor prototype __proto__ g_time g_beat g_bar g_bpm g_ticks g_phase g_playing g_rate g_root g_tuning sin cos tan abs sqrt floor ceil exp log fract min max minimum maximum pow clamp mix step noise perlin simplex value'.split(' '));
const annotation=new RegExp(`^\\s*//\\s*@param\\s+([A-Za-z_]\\w*)\\s*=\\s*(${number})\\s*\\(\\s*(int\\s+)?(${number})\\s*\\.\\.\\s*(${number})(?:\\s*,?\\s*step\\s*:?\\s*(${number}))?\\s*\\)\\s*$`);
const inline=new RegExp(`^\\s*(float|int|let|const|var)\\s+([A-Za-z_]\\w*)\\s*=\\s*(${number})\\s*;?\\s*/\\*\\s*(${number})\\s*\\.\\.\\s*(${number})(?:\\s*,?\\s*step\\s*:?\\s*(${number}))?\\s*\\*/\\s*;?\\s*$`);
export function parseExpressionParameters(source){
 if(String(source).length>2048)throw Error('Expression is limited to 2048 characters');
 const definitions=[],seen=new Set();let from=0;
 for(const line of String(source).split('\n')){
  const a=annotation.exec(line),b=inline.exec(line);let name,initial,min,max,step,type;
  if(a){name=a[1];initial=+a[2];type=a[3]?'int':'float';min=+a[4];max=+a[5];step=a[6];}
  else if(b){name=b[2];initial=+b[3];type=b[1]==='int'?'int':'float';min=+b[4];max=+b[5];step=b[6];}
  else {if(/@param/.test(line))throw Error('Use // @param name = 1 (0..4)');from+=line.length+1;continue;}
  if(reserved.has(name))throw Error(`Reserved expression name: ${name}`);
  if(seen.has(name))throw Error(`Duplicate parameter: ${name}`);
  if(![initial,min,max].every(Number.isFinite)||!(max>min))throw Error(`Invalid range: ${name}`);
  if(step!==undefined&&(!Number.isFinite(+step)||+step<=0))throw Error(`Invalid step: ${name}`);
  step=type==='int'?1:step===undefined?10**(Math.floor(Math.log10(max-min))-2):+step;
  if(!Number.isFinite(step)||step<=0)throw Error(`Invalid step: ${name}`);
  if(definitions.length===64)throw Error('At most 64 expression parameters');
  definitions.push({name,type,default:initial,min,max,step,from,to:from+line.length});seen.add(name);from+=line.length+1;
 }
 return definitions;
}
export function prepareExpression(source,overrides={},symbolic=false){
 const definitions=parseExpressionParameters(source);
 for(const p of [...definitions].reverse())source=source.slice(0,p.from)+source.slice(p.to);
 source=source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,' ');
 if(symbolic)return source.trim();
 const values=Object.create(null);
 for(const p of definitions){let value=Object.hasOwn(overrides,p.name)?Number(overrides[p.name]):p.default;if(!Number.isFinite(value))value=p.default;value=Math.max(p.min,Math.min(p.max,value));values[p.name]=p.type==='int'?Math.round(value):value;}
 return source.replace(/\b[A-Za-z_]\w*\b/g,name=>Object.hasOwn(values,name)?`(${values[name]})`:name).trim();
}
