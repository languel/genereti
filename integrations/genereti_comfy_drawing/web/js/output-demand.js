export const OUTPUTS=['IMAGE','MASK','SVG','JSON'];
export function connectedOutputs(node){
  return OUTPUTS.filter((_,slot)=>node.isOutputConnected?.(slot)??Boolean(node.outputs?.[slot]?.links?.length));
}
export function sceneJSON(scene,frameId,maskFrameId){
  return JSON.stringify({...scene,genereti:{...scene?.genereti,imageFrameId:frameId,maskFrameId}});
}
