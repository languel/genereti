// Live values can follow Comfy's built-in primitives. Arbitrary Python scalar
// computations still require Queue, just like the livecode parameter contract.
export function readTextureValues(node){
 const values=Object.fromEntries((node.widgets??[]).filter(w=>['number','string','boolean'].includes(typeof w.value)).map(w=>[w.name,w.value]));
 for(let i=0;i<(node.inputs?.length??0);i++){
  const input=node.inputs[i];if(input.type==='IMAGE')continue;
  const link=node.getInputLink?.(i);if(!link)continue;
  const source=node.graph?.getNodeById(link.origin_id);
  const live=source?._generetiLiveValue?.(link.origin_slot);if(live!==undefined){values[input.widget?.name??input.name]=live;continue;}
  if(!['PrimitiveFloat','PrimitiveInt','PrimitiveBoolean','PrimitiveString','PrimitiveNode'].includes(source?.comfyClass??source?.type))continue;
  const widget=source.widgets?.find(w=>w.name==='value');if(widget)values[input.widget?.name??input.name]=widget.value;
 }
 return values;
}
