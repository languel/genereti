// Append newly exposed controls after existing widgets to preserve old values.
const layouts={
 GeneretiTextureExpression:5,GeneretiTextureNoise:14,
 GeneretiChopExpression:6,GeneretiChopNoise:8,GeneretiChopOscillator:9,
};
// top.noise moved time, speed and the loop controls in front of color. Saved workflows without the layout marker hold the
// older orders (18 values, or 26 once amplitude…normalize existed), so their values are re-mapped by name.
const NOISE_OLD=['algorithm','dimensions','width','height','scale','seed','z','time','speed','octaves','lacunarity','gain','color','performance','offset_x','offset_y','offset_z','offset_t','amplitude','bias','loop','loop_radius','shape','warp','power','normalize'];
const NOISE_NEW=['algorithm','dimensions','width','height','scale','seed','z','octaves','lacunarity','gain','time','speed','loop','loop_radius','color','performance','offset_x','offset_y','offset_z','offset_t','amplitude','bias','shape','warp','power','normalize'];
const NOISE_DEFAULTS={amplitude:1,bias:0,loop:0,loop_radius:1,shape:'off',warp:0,power:1,normalize:'off'};
const NOISE_LAYOUT=2;
function migrateNoiseLayout(node){
 node.properties??={};
 if(node.properties.genereti_noise_layout===NOISE_LAYOUT||!Array.isArray(node.widgets_values))return;
 const values=node.widgets_values,deliveryIndex=values.findLastIndex(value=>value==='Live'||value==='Comfy Queue'),delivery=deliveryIndex<0?[]:values.splice(deliveryIndex,1);
 if(values.length===18||values.length===26){
  const byName=Object.fromEntries(values.map((value,i)=>[NOISE_OLD[i],value]));
  if(byName.shape==='fbm')byName.shape='off';
  values.splice(0,values.length,...NOISE_NEW.map(name=>byName[name]??NOISE_DEFAULTS[name]));
 }
 values.push(...delivery);
 node.properties.genereti_noise_layout=NOISE_LAYOUT;
 // The values now include the performance snapshot at its new place; the performance extension's index-based insert must skip them.
 node.properties.generetiPerformanceVersion=1;
}
export function migrateOffsetControls(node){
 const count=layouts[node.type];
 if(count===undefined)return false;
 const names=node.type==='GeneretiChopOscillator'?['offset_t']:['offset_x','offset_y','offset_z','offset_t'];
 const values=node.widgets_values;
 if(Array.isArray(values)){
  const deliveryIndex=values.findLastIndex(value=>value==='Live'||value==='Comfy Queue');
  const delivery=deliveryIndex<0?[]:values.splice(deliveryIndex,1);
  // Older TOP examples predate the hidden performance snapshot control.
  if(node.type.startsWith('GeneretiTexture')&&values.length===count-1)values.push('{}');
  // Older CHOP samples included the nonserializing preview placeholder.
  if(node.type==='GeneretiChopNoise'&&values.length===count+1&&values.at(-1)==='')values.pop();
  if(values.length===count)values.push(...names.map(name=>{
   const saved=node.properties?.genereti_widget_values?.[name];
   return typeof saved==='number'&&Number.isFinite(saved)?saved:0;
  }));
  values.push(...delivery);
 }
 if(node.type==='GeneretiTextureNoise')migrateNoiseLayout(node);
 for(const input of node.inputs??[]){
  if(names.includes(input.name))input.widget??={name:input.name};
 }
 return true;
}
