import { graphBackdrop } from './graph-backdrop.js';
import { outputWindow } from './output-window.js';
import { ensureControlStyle } from '/extensions/genereti_comfy_p5/js/control-style.js';

// Local viewing only: projector transport belongs to the projector node.
export function previewControls(canvas, status, node, onError=()=>{}) {
  ensureControlStyle();
  const toolbar=document.createElement('div');toolbar.className='genereti-node-controls';
  let output,overlay,backdrop;
  node.properties??={};node.properties.genereti_output_layout??={};
  const actions=document.createElement('div');actions.className='genereti-node-controls';
  const button=(label,paths,action)=>{
    const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);
    b.innerHTML=`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg>`;
    b.onclick=action;return b;
  };
  const toggle=(label,paths,options)=>{
    let viewer,opened=false;
    const paint=value=>{opened=value;b.setAttribute('aria-pressed',String(value));b.title=(value?'Close ':'Open ')+label;b.setAttribute('aria-label',b.title);};
    const make=()=>options.backdrop?graphBackdrop(status,paint):outputWindow(status,paint,options.overlay?node.properties.genereti_output_layout:{});
    const b=button('Open '+label,paths,async()=>{
      if(opened){viewer.close();viewer=make();assign(viewer);viewer.setFit(node.properties?.genereti_preview_fit||'contain');paint(false);return;}
      b.disabled=true;
      try{const success=await viewer.open(options);paint(success);if(success)viewer.publish({bitmap:canvas});else onError();}
      finally{b.disabled=false;}
    });
    const assign=value=>{if(options.backdrop)backdrop=value;else if(options.overlay)overlay=value;else output=value;};
    viewer=make();assign(viewer);paint(false);return b;
  };
  const windowButton=toggle('output window','<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',{});
  const overlayButton=toggle('output overlay · drag and resize inside Comfy','<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="11" y="11" width="8" height="7" rx="1"/>',{overlay:true});
  const backdropButton=toggle('output backdrop','<rect x="3" y="3" width="18" height="18" rx="1"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="8" r="1.5"/>',{backdrop:true});
  const fit=document.createElement('select');fit.title='Image fit · applies to preview and local output windows';fit.setAttribute('aria-label','Image fit');
  for(const [label,value] of [['Contain','contain'],['Cover','cover'],['Stretch','fill'],['Native pixels','native']])fit.append(new Option(label,value));
  const apply=()=>{const value=fit.value;canvas.style.objectFit=value==='native'?'none':value;output.setFit(value);overlay.setFit(value);backdrop.setFit(value);node.properties??={};node.properties.genereti_preview_fit=value;};
  fit.value=node.properties?.genereti_preview_fit||'contain';fit.onchange=apply;apply();
  const configure=node.onConfigure;node.onConfigure=function(){const result=configure?.apply(this,arguments);fit.value=node.properties?.genereti_preview_fit||'contain';apply();return result;};
  actions.append(windowButton,overlayButton,backdropButton);toolbar.append(fit);
  for(const row of [toolbar,actions])row.addEventListener('pointerdown',event=>event.stopPropagation());
  return {toolbar,actions,publish(frame){output.publish(frame);overlay.publish(frame);backdrop.publish(frame);},close(){output.close();overlay.close();backdrop.close();}};
}
