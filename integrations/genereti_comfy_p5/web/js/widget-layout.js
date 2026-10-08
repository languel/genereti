// Classic Comfy calls computeSize without a width and gives DOM widgets margins.
export function allocatedWidgetHeight(widget, fallback=300){
 const height=Number(widget.computedHeight);
 const margin=Number(widget.margin)||0;
 return Number.isFinite(height)&&height>0?Math.max(0,height-2*margin):fallback;
}
export function intrinsicRowHeight(element, fallback=32){
 // The row's scrollHeight includes its allocated height, causing size feedback.
 return Math.max(fallback,...Array.from(element.children||[])
  .filter(child=>!child.hidden).map(child=>Number(child.offsetHeight)||0))+8;
}
export function previewWidgetHeight(width, ratio, chrome=102, margin=10){
 return Math.max(0,width-2*margin)*ratio+chrome+2*margin;
}
