// Project and independent local clocks share the same keyboard transport actions.
export function controlTransports(service,nodes,action){
 const clocks=new Set([service.clock]);
 for(const node of nodes??[])if(node.comfyClass==='GeneretiAudioTransport')clocks.add(service.transportFor(node));
 if(action==='stop')service.stopRecord();
 for(const clock of clocks)action==='stop'?clock.stop():clock.play();
}
