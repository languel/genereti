import {app} from '../../../../scripts/app.js';

export function validNumberDraft(text,min,max){
 if(!text.trim()||!Number.isFinite(Number(text)))return false;
 const value=Number(text);
 return (min==null||min===''||value>=Number(min))&&(max==null||max===''||value<=Number(max));
}

app.registerExtension({name:'Genereti.NumberInputDraft',setup(){
 const drafts=new WeakMap();
 const numeric=el=>el?.tagName==='INPUT'&&(el.type==='number'||el.getAttribute('role')==='spinbutton');
 document.addEventListener('focusin',e=>{if(numeric(e.target))drafts.set(e.target,e.target.value);},true);
 document.addEventListener('input',e=>{
  const el=e.target;if(!numeric(el))return;
  const min=el.getAttribute('min')??el.getAttribute('aria-valuemin'),max=el.getAttribute('max')??el.getAttribute('aria-valuemax');
  if(!validNumberDraft(el.value,min,max)){e.stopImmediatePropagation();return;}
  drafts.set(el,el.value);
 },true);
 document.addEventListener('focusout',e=>{
  const el=e.target;if(!numeric(el))return;
  const min=el.getAttribute('min')??el.getAttribute('aria-valuemin'),max=el.getAttribute('max')??el.getAttribute('aria-valuemax');
  if(!validNumberDraft(el.value,min,max)&&drafts.has(el))el.value=drafts.get(el);
  drafts.delete(el);
 },true);
}});
