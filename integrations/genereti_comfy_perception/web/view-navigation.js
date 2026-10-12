import {zoomEditorView,editorPoint} from '/extensions/genereti_comfy_inputs/js/frame-transform.js';
// Shared navigation follows the 2D frame editor. View changes never change feature coordinates.
export function attachViewNavigation(surface,bar,changed=()=>{}){
 let view={scale:1,x:0,y:0},pointers=new Map(),gesture=null,moved=false,disposed=false;
 const screen=e=>{const r=surface.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
 const paint=()=>changed(view);
 const action=(glyph,title,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=glyph;b.title=b.ariaLabel=title;b.onclick=fn;bar.append(b);return b;};
 action('−','Zoom out view',()=>{view=zoomEditorView(view,1/1.3);paint();});action('+','Zoom in view',()=>{view=zoomEditorView(view,1.3);paint();});action('⤢','Fit entire view',()=>{view={scale:1,x:0,y:0};paint();});
 surface.style.touchAction='none';surface.tabIndex=0;surface.title='Wheel/pinch zoom · drag background or middle-drag to pan · double-click fits';
 const down=e=>{e.stopPropagation();pointers.set(e.pointerId,screen(e));moved=false;if(pointers.size>1||e.button===1||e.button===2||e.altKey||!e.target.closest?.('[data-selection]')){surface.setPointerCapture(e.pointerId);gesture={points:[...pointers.values()],view:{...view}};e.preventDefault();}};
 const move=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,screen(e));if(!gesture)return;e.stopPropagation();const current=screen(e),start=gesture.points[0],r=surface.getBoundingClientRect();if(pointers.size===1&&!moved&&Math.hypot((current[0]-start[0])*r.width,(current[1]-start[1])*r.height)<4)return;moved=true;const p=[...pointers.values()],old=gesture.points;if(p.length>1&&old.length>1){const mid=v=>[(v[0][0]+v[1][0])/2,(v[0][1]+v[1][1])/2],distance=v=>Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]),a=mid(old),b=mid(p);view=zoomEditorView(gesture.view,distance(p)/Math.max(.001,distance(old)),a);view.x+=b[0]-a[0];view.y+=b[1]-a[1];}else{view={...gesture.view,x:gesture.view.x+p[0][0]-old[0][0],y:gesture.view.y+p[0][1]-old[0][1]};}paint();};
 const up=e=>{pointers.delete(e.pointerId);gesture=null;};
 const click=e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}};
 const wheel=e=>{if(disposed||!surface.contains(e.target))return;e.preventDefault();if(surface.dataset.generetiSelecting){e.stopPropagation();return;}e.stopPropagation();const r=surface.getBoundingClientRect(),unit=e.deltaMode===1?16:e.deltaMode===2?r.height:1;view=zoomEditorView(view,Math.exp(-e.deltaY*unit*(e.ctrlKey?.01:.002)),screen(e));paint();};
 const fit=e=>{e.preventDefault();view={scale:1,x:0,y:0};paint();};
 surface.addEventListener('pointerdown',down,true);surface.addEventListener('pointermove',move,true);surface.addEventListener('pointerup',up,true);surface.addEventListener('pointercancel',up,true);surface.addEventListener('click',click,true);window.addEventListener('wheel',wheel,{capture:true,passive:false});surface.addEventListener('dblclick',fit);
 return {get view(){return {...view};},get navigating(){return !!gesture;},point:e=>editorPoint(view,screen(e)),reset(){view={scale:1,x:0,y:0};paint();},focus([x,y,width,height]){const scale=Math.min(16,.84/Math.max(width,height));view={scale,x:.5-(x+width/2)*scale,y:.5-(y+height/2)*scale};paint();},dispose(){disposed=true;pointers.clear();window.removeEventListener('wheel',wheel,true);for(const [name,fn,capture]of [['pointerdown',down,true],['pointermove',move,true],['pointerup',up,true],['pointercancel',up,true],['click',click,true],['dblclick',fit,false]])surface.removeEventListener(name,fn,capture);}};
}

// Capture before the graph canvas sees a trackpad scroll, including at list boundaries.
export function captureListScroll(list){
 const wheel=e=>{if(!list.contains(e.target))return;e.preventDefault();e.stopPropagation();const unit=e.deltaMode===1?16:e.deltaMode===2?list.clientHeight:1;list.scrollTop+=e.deltaY*unit;list.scrollLeft+=e.deltaX*unit;};
 window.addEventListener('wheel',wheel,{capture:true,passive:false});
 return ()=>window.removeEventListener('wheel',wheel,true);
}
