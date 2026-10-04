import {subscribeLive} from './live-runtime.js';
// Resolve the incoming IMAGE rather than the livecode node's own output.
export function imageInput(node,onFrame){
 const proxy={id:`livecode-input:${node.id}`,comfyClass:'GeneretiProjector',get inputs(){return node.inputs},get graph(){return node.graph},getInputLink:i=>node.getInputLink(i)};
 return subscribeLive(proxy,onFrame);
}
