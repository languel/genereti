import {SETTINGS_GLYPH} from '/extensions/genereti_comfy_p5/js/control-style.js';
export function drawingSize(value={}) {
  const dimension=n=>Math.max(64,Math.min(2048,Math.round(Number(n)||512)));
  return {width:dimension(value.width),height:dimension(value.height),aspect:['free','1:1','4:3','3:2','16:9','9:16'].includes(value.aspect)?value.aspect:'free'};
}
export function renderSettings(onChange){
  let size=drawingSize();
  const element=document.createElement('details');element.className='genereti-drawing-settings';
  const trigger=document.createElement('summary');trigger.title='Output size and aspect ratio';trigger.setAttribute('aria-label','Output settings');
  trigger.innerHTML=SETTINGS_GLYPH;
  const panel=document.createElement('div');panel.className='genereti-drawing-settings-panel';panel.setAttribute('role','group');panel.setAttribute('aria-label','Output settings');
  const field=(label,input)=>{const wrapper=document.createElement('label');wrapper.textContent=label;input.setAttribute('aria-label',label);wrapper.append(input);panel.append(wrapper);};
  const aspect=document.createElement('select');for(const value of ['free','1:1','4:3','3:2','16:9','9:16'])aspect.add(new Option(value==='free'?'Free':value,value));field('Aspect',aspect);
  const preset=document.createElement('select');for(const [label,value] of [['Presets…',''],['Square · 512','512x512'],['Landscape · 768 × 512','768x512'],['Wide · 1024 × 576','1024x576'],['Portrait · 576 × 1024','576x1024']])preset.add(new Option(label,value));field('Preset',preset);
  const width=document.createElement('input'),height=document.createElement('input');for(const input of [width,height]){input.type='number';input.min='64';input.max='2048';input.step='1';}field('Width',width);field('Height',height);
  function sync(){if(document.activeElement!==width)width.value=size.width;if(document.activeElement!==height)height.value=size.height;aspect.value=size.aspect;trigger.title=`Output settings · ${size.width} × ${size.height}`;}
  function apply(changed){size=drawingSize({...size,[changed]:Number((changed==='width'?width:height).value)});if(size.aspect!=='free'){const [w,h]=size.aspect.split(':').map(Number);const desired=changed==='height'?size.height*w/h:size.width;size.width=Math.round(Math.max(Math.max(64,64*w/h),Math.min(Math.min(2048,2048*w/h),desired)));size.height=Math.round(size.width*h/w);}size=drawingSize(size);sync();onChange(size);}
  width.onchange=()=>apply('width');height.onchange=()=>apply('height');for(const input of [width,height]){input.addEventListener('blur',sync);input.addEventListener('keydown',event=>{if(event.key==='Enter'){apply(input===width?'width':'height');input.blur();event.stopPropagation();}});}aspect.onchange=()=>{size.aspect=aspect.value;apply('width');};
  preset.onchange=()=>{if(!preset.value)return;const [w,h]=preset.value.split('x').map(Number);size={width:w,height:h,aspect:w===h?'1:1':w===768?'3:2':w>h?'16:9':'9:16'};sync();preset.value='';onChange(size);};
  element.onkeydown=event=>{if(event.key==='Escape'){element.open=false;event.stopPropagation();trigger.focus();}};
  element.append(trigger,panel);sync();return {element,setValue(value){size=drawingSize(value);sync();}};
}
