// Match Livecode's capture boundary for every shared CodeMirror surface.
// Capture at window level, before Comfy's graph ancestors receive the gesture.
export function captureEditorInput(editor,appearance){
 const current=()=>typeof editor==='function'?editor():editor;
 let draggingScrollbar=false;
 const wheel=event=>{
  const view=current();
  if(!view.dom.contains(event.target))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.ctrlKey||event.metaKey)return;
  const settings=appearance(),multiplier=event.deltaMode===1?Number(settings.fontSize)*Number(settings.lineHeight??1.55):event.deltaMode===2?view.scrollDOM.clientHeight:1;
  if(event.shiftKey)view.scrollDOM.scrollTop+=(Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX)*multiplier;
  else{view.scrollDOM.scrollTop+=event.deltaY*multiplier;view.scrollDOM.scrollLeft+=event.deltaX*multiplier;}
 };
 const down=event=>{
  const view=current();
  if(event.button!==0||event.target!==view.scrollDOM)return;
  const r=view.scrollDOM.getBoundingClientRect(),edge=16*r.width/view.scrollDOM.offsetWidth;
  const vertical=view.scrollDOM.scrollHeight>view.scrollDOM.clientHeight&&event.clientX>=r.right-edge;
  const horizontal=view.scrollDOM.scrollWidth>view.scrollDOM.clientWidth&&event.clientY>=r.bottom-edge;
  if(vertical||horizontal){draggingScrollbar=true;event.stopImmediatePropagation();} // Keep native drag's default action.
 };
 const move=event=>{if(draggingScrollbar)event.stopImmediatePropagation();};
 const up=event=>{if(draggingScrollbar){draggingScrollbar=false;event.stopImmediatePropagation();}};
 window.addEventListener('wheel',wheel,{capture:true,passive:false});
 window.addEventListener('pointerdown',down,true);window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);
 return ()=>{window.removeEventListener('wheel',wheel,true);window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);};
}
