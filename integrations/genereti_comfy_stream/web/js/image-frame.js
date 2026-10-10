// One framing contract for browser image surfaces and sampled camera frames.
export function imageRect(sw,sh,w,h,fit='contain'){
 if(fit==='fill')return [0,0,w,h];
 const scale=fit==='native'?1:(fit==='cover'?Math.max(w/sw,h/sh):Math.min(w/sw,h/sh));
 return [(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale];
}
export function paintImage(canvas,image,fit='contain'){
 const ctx=canvas.getContext('2d'),sw=image.videoWidth||image.naturalWidth||image.displayWidth||image.width,sh=image.videoHeight||image.naturalHeight||image.displayHeight||image.height;
 ctx.clearRect(0,0,canvas.width,canvas.height);if(sw&&sh)ctx.drawImage(image,...imageRect(sw,sh,canvas.width,canvas.height,fit));
}
export function frameControls(node,canvas,onChange=()=>{},key='genereti_image_frame'){
 node.properties??={};let prefs={mode:'source',width:512,height:512,...node.properties[key]};
 const row=document.createElement('div');row.className='genereti-node-controls';
 const mode=document.createElement('select');mode.title='Preview dimensions';mode.setAttribute('aria-label',mode.title);
 for(const [v,t] of [['source','Match source'],['output','Match output window'],['fixed','Explicit width / height']])mode.add(new Option(t,v));
 const field=label=>{const e=document.createElement('input');e.type='number';e.min=1;e.max=4096;e.step=1;e.title=label;e.setAttribute('aria-label',label);e.style.width='64px';return e;};
 const width=field('Preview width'),height=field('Preview height');
 const sync=()=>{mode.value=prefs.mode;width.value=prefs.width;height.value=prefs.height;width.hidden=height.hidden=prefs.mode!=='fixed';};
 const change=()=>{prefs={mode:mode.value,width:Math.max(1,Math.min(4096,Math.round(Number(width.value)||512))),height:Math.max(1,Math.min(4096,Math.round(Number(height.value)||512)))};node.properties[key]={...prefs};sync();onChange();node.graph?.change?.(node);};
 mode.onchange=width.onchange=height.onchange=change;row.append(mode,width,height);sync();
 const configured=node.onConfigure;node.onConfigure=function(info){const r=configured?.apply(this,arguments);prefs={...prefs,...info?.properties?.[key]};sync();onChange();return r;};
 return {row,size(sw,sh,viewport){if(prefs.mode==='fixed')return [prefs.width,prefs.height];if(prefs.mode==='output'&&viewport)return [Math.min(4096,Math.max(1,Math.round(viewport.width))),Math.min(4096,Math.max(1,Math.round(viewport.height)))];return [sw||512,sh||512];},resize(sw,sh,viewport){const [w,h]=this.size(sw,sh,viewport);if(canvas.width===w&&canvas.height===h)return false;canvas.width=w;canvas.height=h;canvas.style.aspectRatio=`${w} / ${h}`;node.setDirtyCanvas?.(true,true);return true;}};
}
export function observeSurface(surface,onVisible=()=>{}){
 let visible=true;const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{const next=entries[0]?.isIntersecting??false;const entered=next&&!visible;visible=next;if(entered)onVisible();});observer?.observe(surface);
 return {get visible(){return visible;},dispose(){observer?.disconnect();}};
}
