const svg=path=>`<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
export function choiceGlyph(value,label,kind=''){
 const text=String(label).toLowerCase();
 if(/camera|device/i.test(kind))return svg('<path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/>');
 if(/fps|frame rate/i.test(kind))return svg('<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>');
 if(/^(input |capture )?(resolution|size)/i.test(kind)||/\d+ px/.test(text))return svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>');
 if(text==='split'||value==='both')return svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/>');
 if(text==='overlay'||value==='overlay')return svg('<rect x="3" y="3" width="13" height="13" rx="2"/><rect x="8" y="8" width="13" height="13" rx="2"/>');
 if(text==='code'||value==='code')return svg('<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-14-4 16"/>');
 if(text==='output')return svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4m-4 0h8"/>');
 if(text.includes('fixed texture'))return svg('<rect x="4" y="4" width="16" height="16"/><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>');
 if(text.includes('follow output'))return svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m8 9-3 3 3 3m8-6 3 3-3 3"/>');
 if(value==='contain')return svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m5 5 5 5m-4 0h4V6m9 13-5-5m4 0h-4v4"/>');
 if(value==='cover')return svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m10 10-5-5m0 4V5h4m5 9 5 5m0-4v4h-4"/>');
 if(value==='fill')return svg('<path d="M3 3v18m18-18v18M3 12h18m-14-4-4 4 4 4m10-8 4 4-4 4"/>');
 if(value==='native')return svg('<rect x="4" y="4" width="16" height="16" rx="1"/><rect x="9" y="9" width="6" height="6"/>');
 if(value==='free')return svg('<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>');
 if(value==='linked')return svg('<path d="M10 18V5l10-2v13M10 7l10-2"/><ellipse cx="7" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>');
 if(value==='Live')return svg('<path d="M3 12h3l3-7 6 14 3-7h3"/>');
 if(value==='Comfy Queue')return svg('<path d="M3 5h12M3 10h8M3 15h5"/><circle cx="17" cy="16" r="5"/><path d="M17 13v3h2"/>');
 if(value==='markdown')return svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M5 16V8l4 4 4-4v8m3-8v8m-2-2 2 2 2-2"/>');
 if(value==='html')return svg('<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-14-4 16"/>');
 if(value==='pdf')return svg('<path d="M6 3h8l4 4v14H6Zm8 0v5h4M9 12h6m-6 4h6"/>');
 if(value==='manual')return svg('<path d="M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8l-4 6H9l-6-8a2 2 0 0 1 3-2l2 2"/>');
 if(value==='open')return svg('<path d="m8 4 13 8-13 8Z"/>');
 if(value==='first')return svg('<circle cx="12" cy="12" r="9"/><path d="m10 7 7 5-7 5Z"/>');
 return svg('<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--comfy-input-bg,#222)"/><circle cx="15" cy="12" r="2" fill="var(--comfy-input-bg,#222)"/><circle cx="8" cy="18" r="2" fill="var(--comfy-input-bg,#222)"/>');
}
// Customizable native selects preserve .value, change events, keyboard handling
// and Comfy serialization. Older browsers retain the readable native control.
const toolbarChoiceSelector='.genereti-node-controls select,.genereti-livecode-toolbar select';
// Ignore live readout/text mutations. Only new controls or changed options need decoration.
export function toolbarChoiceMutationRoots(records){
 const roots=new Set();
 for(const record of records){
  const select=record.target.closest?.('select');
  if(select?.matches(toolbarChoiceSelector)&&record.target!==select.querySelector('selectedcontent')&&!record.target.closest?.('selectedcontent'))roots.add(select);
  for(const node of record.addedNodes){
   if(node.nodeType!==1)continue;
   if(node.matches?.(toolbarChoiceSelector)||node.querySelector?.(toolbarChoiceSelector))roots.add(node);
  }
 }
 return roots;
}
export function decorateToolbarChoices(root=document){
 if(!CSS.supports('appearance','base-select'))return;
 for(const select of [...(root.matches?.(toolbarChoiceSelector)?[root]:[]),...root.querySelectorAll(toolbarChoiceSelector)]){
  if(select.closest('label,[role=tabpanel],.genereti-drawing-settings-panel'))continue;
  const kind=select.getAttribute('aria-label')||select.title;
  if(!select.style.getPropertyValue('--genereti-choice-font-size'))
   select.style.setProperty('--genereti-choice-font-size',getComputedStyle(select.parentElement).fontSize);
  if(!select.classList.contains('genereti-glyph-choice')){
   select.classList.add('genereti-glyph-choice');select.dataset.generetiChoiceTip=select.title||kind;
   if(!select.getAttribute('aria-label'))select.setAttribute('aria-label',kind||'Toolbar choice');
  }
  if(!select.querySelector(':scope > button')){
   const button=document.createElement('button');button.type='button';const chosen=document.createElement('selectedcontent');button.append(chosen);select.prepend(button);
  }
  for(const option of select.options){
   if('generetiChoiceLabel' in option.dataset)continue;
   const label=option.textContent;
   option.dataset.generetiChoiceLabel=label;
   const icon=document.createElement('span');icon.className='genereti-choice-icon';icon.innerHTML=choiceGlyph(option.value,label,kind);
   const text=document.createElement('span');text.className='genereti-choice-label';text.textContent=label;
   option.replaceChildren(icon,text);
  }
  const selected=select.selectedOptions[0],chosen=select.querySelector('selectedcontent');
  if(selected&&chosen&&chosen.innerHTML!==selected.innerHTML)chosen.replaceChildren(...Array.from(selected.childNodes,node=>node.cloneNode(true)));
  if(selected)select.title=`${select.dataset.generetiChoiceTip} · ${selected.dataset.generetiChoiceLabel}`;
 }
}
