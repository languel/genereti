// Native hue selection plus explicit alpha and CSS/hex entry. Kept local so
// saved appearance settings remain plain CSS color strings.
export function colorPicker(value,onChange) {
 const element=document.createElement('details');element.style.cssText='position:relative';
 const swatch=document.createElement('summary');swatch.title='Choose color and opacity';swatch.style.cssText='display:block;list-style:none;width:36px;height:24px;cursor:pointer;border:1px solid #777;border-radius:4px;background:repeating-conic-gradient(#aaa 0% 25%,#eee 0% 50%) 0/8px 8px';
 const chip=document.createElement('span');chip.style.cssText='display:block;width:100%;height:100%;border-radius:3px';swatch.append(chip);element.append(swatch);
 const panel=document.createElement('div');panel.style.cssText='position:absolute;left:0;top:29px;z-index:20;width:200px;padding:8px;display:grid;gap:6px;border:1px solid var(--border-color,#555);border-radius:5px;background:var(--comfy-input-bg,#222);color:var(--fg-color,#eee)';
 const native=document.createElement('input');native.type='color';native.title='Color';native.style.cssText='width:100%;height:30px;padding:0';
 const text=document.createElement('input');text.type='text';text.title='CSS color · hex, #RRGGBBAA, rgb(), rgba()';text.style.cssText='width:100%;box-sizing:border-box';
 const label=document.createElement('label');label.textContent='Opacity ';const alpha=document.createElement('input');alpha.type='range';alpha.min=0;alpha.max=100;alpha.step=1;alpha.title='Color opacity';alpha.style.width='125px';const percent=document.createElement('output');label.append(alpha,percent);panel.append(native,text,label);element.append(panel);
 let current;
 function set(next){
  if(!CSS.supports('color',next))return;
  current=next;chip.style.backgroundColor=next;text.value=next;
  const probe=document.createElement('span');probe.style.color=next;probe.style.display='none';document.body.append(probe);const rgba=getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number)||[0,0,0];probe.remove();
  native.value='#'+rgba.slice(0,3).map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');alpha.value=Math.round((rgba[3]??1)*100);percent.value=alpha.value+'%';
 }
 function commit(){const h=native.value;const rgb=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));set(`rgba(${rgb.join(',')}, ${Number(alpha.value)/100})`);onChange(current);}
 native.oninput=alpha.oninput=commit;text.onchange=()=>{if(CSS.supports('color',text.value)){set(text.value);onChange(current);}else text.value=current;};
 set(value);
 return {element,type:'color',get value(){return current},set value(next){set(next)}};
}
