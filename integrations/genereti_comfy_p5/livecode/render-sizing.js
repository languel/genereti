// Resize the existing p5 instance without resetting its clock or input state.
export function resizeP5(instance,size){
 if(!instance?.canvas)return;
 instance.windowWidth=size.width;instance.windowHeight=size.height;
 if(instance._generetiWindowResized){instance._generetiWindowResized();return;}
 const copy=document.createElement('canvas');copy.width=instance.canvas.width;copy.height=instance.canvas.height;
 copy.getContext('2d').drawImage(instance.canvas,0,0);
 instance.resizeCanvas(size.width,size.height,true);
 const scale=Math.min(size.width/copy.width,size.height/copy.height);
 const width=copy.width*scale,height=copy.height*scale;
 instance.drawingContext.drawImage(copy,(size.width-width)/2,(size.height-height)/2,width,height);
}
