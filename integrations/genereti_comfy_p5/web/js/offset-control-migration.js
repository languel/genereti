// Append newly exposed controls after existing widgets to preserve old values.
const layouts={
 GeneretiTextureExpression:5,GeneretiTextureNoise:14,
 GeneretiChopExpression:6,GeneretiChopNoise:8,GeneretiChopOscillator:9,
};
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
 for(const input of node.inputs??[]){
  if(names.includes(input.name))input.widget??={name:input.name};
 }
 return true;
}
