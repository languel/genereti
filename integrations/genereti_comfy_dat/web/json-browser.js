import {matchingEntries,jsonEntries,selectedIndices} from './json-select.js';
export function jsonBrowser(node,preview,tools,status){
 let effective={};
 const connected=name=>node.inputs?.some(i=>i.name===name&&i.link!=null);
 const value=name=>effective[name]??node.widgets.find(w=>w.name===name)?.value??'';
 const write=(name,text)=>{if(connected(name))return;effective[name]=text;const w=node.widgets.find(w=>w.name===name);if(w){w.value=text;w.callback?.(text);node.graph?.change?.(node);}};
 const search=document.createElement('input');search.type='search';search.placeholder='Filter';search.ariaLabel='Filter JSON entries';search.title='Filter output by key or value · empty passes all entries';search.style.cssText='min-width:60px;flex:1;width:100%;font:inherit;color:inherit;background:transparent;border:0';
 const clear=document.createElement('button');clear.textContent='×';clear.title=clear.ariaLabel='Clear row selection · pass all matching entries';clear.onclick=()=>{write('selection','');render();};
 const copy=document.createElement('button');copy.textContent='⧉';copy.title=copy.ariaLabel='Copy selected rows · click a row, Cmd/Ctrl-click to add, Shift-click for a range';
 tools.append(search,clear,copy);preview.style.userSelect='text';preview.tabIndex=0;preview.ariaLabel='JSON table · select rows to filter output, or drag to select text';
 let data={rows:[]},anchor=-1;
 function render(){
  search.value=value('filter');search.disabled=connected('filter');const matches=matchingEntries(data,search.value),selected=selectedIndices(value('selection')),table=document.createElement('table');table.style.cssText='border-collapse:collapse;width:100%';
  for(const {row,index} of matches.slice(0,256)){
   const tr=document.createElement('tr');tr.tabIndex=0;tr.setAttribute('aria-label',`Entry ${index}: ${row.join(', ')}`);tr.setAttribute('aria-selected',String(selected?.has(index)??false));tr.style.background=selected?.has(index)?'color-mix(in srgb, currentColor 18%, transparent)':'';
   const select=e=>{if(connected('selection'))return;let next=new Set(selected??[]);if(e.shiftKey&&anchor>=0){for(const m of matches)if(m.index>=Math.min(anchor,index)&&m.index<=Math.max(anchor,index))next.add(m.index);}else if(e.ctrlKey||e.metaKey){if(next.has(index))next.delete(index);else next.add(index);anchor=index;}else{next=new Set([index]);anchor=index;}write('selection',[...next].sort((a,b)=>a-b).join(','));render();preview.querySelector(`[data-entry="${index}"]`)?.focus();};
   tr.dataset.entry=index;tr.onclick=e=>{if(!window.getSelection()?.isCollapsed)return;select(e);};tr.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(e);}};
   for(const cell of row){const td=document.createElement('td');td.textContent=cell;td.style.cssText='padding:3px 6px;border-bottom:1px solid var(--border-color,#444);white-space:pre-wrap';tr.append(td);}table.append(tr);
  }
  preview.replaceChildren(table);status.textContent=`${matches.length} / ${jsonEntries(data).length} entries · ${selected?.size??0} selected${matches.length>256?' · first 256 shown; refine filter':''}`;copy.disabled=!selected?.size;clear.disabled=!selected||connected('selection');
 }
 search.oninput=()=>{write('filter',search.value);render();search.focus();};copy.onclick=async()=>{try{const selected=selectedIndices(value('selection'));await navigator.clipboard.writeText(JSON.stringify(jsonEntries(data).filter(e=>selected?.has(e.index)).map(e=>e.row),null,2));}catch(e){status.textContent=e.message;}};
 preview.addEventListener('pointerdown',e=>e.stopPropagation());preview.addEventListener('wheel',e=>e.stopPropagation());
 return {update(next,filter,selection){effective={filter,selection};if(next!==data)anchor=-1;data=next;render();}};
}
