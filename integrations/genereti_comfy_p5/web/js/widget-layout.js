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

// Vue allocates spare node height to grid rows; classic Comfy uses computedHeight.
// Keep intrinsic minimums independent of the assigned height to avoid feedback.
export function attachEditorFill(node,widget,surface,{minimum=()=>220,onLayout=()=>{},collapsed=()=>false}={}){
 surface.dataset.generetiEditorFill='true';surface.style.minHeight='0';surface.style.overflow='hidden';
 let dead=false,pending=0,observed;
 const sync=()=>{
  pending=0;if(dead)return;
  surface.dataset.generetiEditorMinimum=String(minimum());surface.dataset.generetiEditorCollapsed=String(collapsed());
  const host=surface.closest('.lg-node'),grid=host?.querySelector('.lg-node-widgets');
  if(grid){
   const rows=[...grid.children];
   grid.style.setProperty('grid-template-rows',rows.map(row=>{
    const editor=row.querySelector('[data-genereti-editor-fill]');
    return editor&&editor.dataset.generetiEditorCollapsed!=='true'?`minmax(${editor.dataset.generetiEditorMinimum||220}px,1fr)`:'min-content';
   }).join(' '),'important');
   surface.style.height='100%';
   const row=surface.closest('.lg-node-widget');
   if(row){row.style.height='100%';row.style.minHeight='0';row.style.alignSelf='stretch';}
   if(surface.parentElement){surface.parentElement.style.height='100%';surface.parentElement.style.minHeight='0';}
  }else surface.style.height=(collapsed()?34:Math.max(minimum(),allocatedWidgetHeight(widget,minimum())))+'px';
  const parent=surface.closest('.lg-node-widget')??surface.parentElement;
  if(parent&&parent!==observed){observer.disconnect();observer.observe(parent);observed=parent;}
  onLayout();
 };
 const schedule=()=>{if(!dead&&!pending)pending=requestAnimationFrame(sync);};
 const observer=new ResizeObserver(schedule);
 const previous=node.onResize;node.onResize=function(){const result=previous?.apply(this,arguments);schedule();return result;};
 schedule();
 return {sync:schedule,dispose(){dead=true;cancelAnimationFrame(pending);observer.disconnect();delete surface.dataset.generetiEditorFill;}};
}
