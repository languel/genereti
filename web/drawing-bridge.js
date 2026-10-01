// Same-origin bridge: editable scene and its raster always travel together.
export class DrawingBridge {
 constructor({iframe,onFrame,onError,onOutputMode}){
  this.iframe=iframe;this.onFrame=onFrame;this.onError=onError;
  this.scene=null;this.image=null;this.ready=false;this.revision=0;this.loading=false;this.initialized=false;
  window.addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==iframe.contentWindow||event.data?.channel!=='genereti-drawing-v1')return;
   const data=event.data;
   if(data.type==='output-mode'){onOutputMode?.(data.enabled);return;}
   if(data.type==='ready'&&this.output)this.send('output',this.output);
   if(data.type==='error'){onError(data.message);return;}
   if(data.type==='ready'){this.initialized=true;if(this.pendingScene){this.send('load',{scene:this.pendingScene});this.pendingScene=null;}else this.send('refresh');return;}
   if(data.type==='frame'){
    this.scene=data.scene;this.image=data.image;this.revision=data.revision;this.ready=true;
    onFrame(data);
   }
  });
 }
 send(type,values={}){this.iframe.contentWindow?.postMessage({channel:'genereti-drawing-v1',type,...values},location.origin);}
 activate(){
  if(!this.loading){this.loading=true;this.iframe.src='/drawing.html';}
  else{if(this.ready)this.onFrame({image:this.image,scene:structuredClone(this.scene),revision:this.revision});this.send('fit');this.send('refresh');}
 }
 load(scene){if(this.initialized)this.send('load',{scene});else this.pendingScene=scene;}
 setOutput(output){this.output=output;if(this.initialized)this.send('output',output);}
 getSnapshot(){return this.ready?{scene:this.scene,revision:this.revision,artboard:{x:0,y:0,width:512,height:512}}:null;}
}
