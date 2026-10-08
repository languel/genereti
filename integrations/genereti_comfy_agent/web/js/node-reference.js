import {app} from '../../../../scripts/app.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';

const definitions=new Map();
const lessons={GeneretiTextureExpression:'noise-dimensions',GeneretiTextureNoise:'noise-dimensions',GeneretiChopExpression:'opentouch-basics',GeneretiChopNoise:'opentouch-basics',GeneretiDatLesson:'lesson-authoring'};
const sidebarID='genereti-reference';
let panel,body,title,lessonButton,dockButton,opener,sidebarHost,previousSidebar,request=0;
let docked=false;
let references;
function loadReferences(){
 references??=fetch('/extensions/genereti_comfy_agent/lessons/node-references.json').then(async response=>{
  if(!response.ok)throw Error('Bundled references could not be loaded');
  return response.json();
 }).catch(error=>{references=undefined;throw error;});
 return references;
}
function plainText(text){body.style.whiteSpace='pre-wrap';body.textContent=text;}
function close(){
 request++;panel.hidden=true;
 if(docked&&app.extensionManager.sidebarTab.activeSidebarTabId===sidebarID)
  app.extensionManager.sidebarTab.toggleSidebarTab(sidebarID);
 opener?.focus();
}
function clampPanel(){
 if(!panel||docked||!panel.style.left)return;
 const r=panel.getBoundingClientRect();
 panel.style.left=Math.max(0,Math.min(parseFloat(panel.style.left),innerWidth-r.width))+'px';
 panel.style.top=Math.max(0,Math.min(parseFloat(panel.style.top),innerHeight-r.height))+'px';
}
function placement(){
 panel.classList.toggle('genereti-reference-docked',docked);
 panel.setAttribute('role',docked?'region':'dialog');
 dockButton.title=docked?'Float reference':'Dock reference in sidebar';
 dockButton.setAttribute('aria-label',dockButton.title);
 dockButton.setAttribute('aria-pressed',String(docked));
 if(docked){if(sidebarHost)sidebarHost.append(panel);}
 else{document.body.append(panel);clampPanel();}
}
function openSidebar(){
 const sidebar=app.extensionManager.sidebarTab;
 if(sidebar.activeSidebarTabId!==sidebarID){
  previousSidebar=sidebar.activeSidebarTabId;
  sidebar.toggleSidebarTab(sidebarID);
 }
}
function toggleDock(){
 docked=!docked;placement();
 if(docked)openSidebar();
 else if(app.extensionManager.sidebarTab.activeSidebarTabId===sidebarID)
  app.extensionManager.sidebarTab.toggleSidebarTab(previousSidebar||sidebarID);
}
function draggable(header){
 header.title='Drag to reposition reference';
 header.addEventListener('pointerdown',event=>{
  if(docked||event.button!==0||event.target.closest('button,a,input,select'))return;
  const rect=panel.getBoundingClientRect(),x=event.clientX,y=event.clientY;
  header.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
  panel.style.right='auto';panel.style.left=rect.left+'px';panel.style.top=rect.top+'px';
  const move=event=>{panel.style.left=rect.left+event.clientX-x+'px';panel.style.top=rect.top+event.clientY-y+'px';clampPanel();event.stopPropagation();};
  const end=event=>{header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);if(header.hasPointerCapture(event.pointerId))header.releasePointerCapture(event.pointerId);event.stopPropagation();};
  header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);
 });
}
export function registerReferenceSidebar(){
 app.extensionManager.registerSidebarTab({id:sidebarID,icon:'pi pi-question-circle',title:'ꘇ Quick reference',tooltip:'Genereti quick reference',type:'custom',render(host){
  mount();sidebarHost=host;host.style.cssText='height:100%;min-height:0;overflow:hidden';
  docked=true;panel.hidden=false;placement();
 }});
}
function mount(){
 if(panel)return;
 ensureControlStyle();
 panel=document.createElement('section');panel.className='genereti-reference';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Genereti quick reference');
 panel.style.cssText='position:fixed;right:24px;top:90px;width:min(520px,calc(100vw - 48px));max-height:calc(100vh - 120px);display:flex;flex-direction:column;background:var(--comfy-menu-bg,#262626);color:var(--fg-color,#eee);border:1px solid var(--border-color,#555);border-radius:12px;box-shadow:0 8px 28px #0006;z-index:1100;font:14px/1.5 sans-serif';
 const header=document.createElement('div');header.className='genereti-node-controls';header.style.cssText='display:flex;align-items:center;padding:12px 16px;gap:12px';
 title=document.createElement('strong');title.textContent='ꘇ Quick reference';title.style.cssText='flex:1;min-width:0';
 dockButton=document.createElement('button');dockButton.type='button';dockButton.textContent='▥';dockButton.title='Dock reference in sidebar';dockButton.setAttribute('aria-label',dockButton.title);dockButton.onclick=toggleDock;
 draggable(header);
 const dismiss=document.createElement('button');dismiss.textContent='×';dismiss.title='Close reference';dismiss.setAttribute('aria-label',dismiss.title);dismiss.onclick=close;
 header.append(title,dockButton,dismiss);
 body=document.createElement('div');body.style.cssText='padding:0 20px 16px;overflow:auto;min-height:0;user-select:text';body.textContent='Open a node’s ? button to see its reference.';
 const footer=document.createElement('div');footer.className='genereti-node-controls';footer.style.padding='8px 16px';
 lessonButton=document.createElement('button');lessonButton.hidden=true;lessonButton.textContent='▷';lessonButton.title='Start related lesson';lessonButton.setAttribute('aria-label',lessonButton.title);footer.append(lessonButton);
 panel.append(header,body,footer);document.body.append(panel);
 const style=document.createElement('style');style.textContent='.genereti-reference[hidden]{display:none!important}.genereti-reference>.genereti-node-controls:first-child{cursor:move;touch-action:none}.genereti-reference-docked{position:relative!important;inset:auto!important;width:100%!important;height:100%;max-height:100%!important;border:0!important;border-radius:0!important;box-shadow:none!important}.genereti-reference-docked>div:nth-child(2){flex:1}.genereti-reference-docked>.genereti-node-controls:first-child{cursor:default}.genereti-reference pre{overflow:auto;padding:10px;background:var(--comfy-input-bg,#181818);border-radius:6px}.genereti-reference code{font-family:monospace}.genereti-reference table{border-collapse:collapse;width:100%}.genereti-reference td,.genereti-reference th{padding:5px;border-bottom:1px solid var(--border-color,#555);text-align:left}.genereti-reference a{color:var(--link-color,#8ab4f8)}';document.head.append(style);
 window.addEventListener('resize',clampPanel);
 panel.addEventListener('wheel',event=>event.stopPropagation());
 panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});
}
export async function showReference(node,button){
 mount();const current=++request;opener=button;panel.hidden=false;if(docked)openSidebar();title.textContent=node.title;plainText('Loading reference…');
 const name=node.comfyClass,definition=definitions.get(name);
 lessonButton.hidden=!lessons[name];lessonButton.onclick=async()=>{try{if(!window.generetiGuides?.start)throw Error('Lesson system unavailable');await window.generetiGuides.start(lessons[name]);close();}catch(error){body.textContent=error.message;}};
 try{
  const documents=await loadReferences();
  if(current!==request)return;
  const markdown=documents[name];
  if(!markdown){plainText(definition?.description||'No extended reference yet. Comfy’s node Info view lists this tool’s inputs and outputs.');return;}
  const render=app.extensionManager?.renderMarkdownToHtml;
  if(render){body.style.whiteSpace='normal';body.innerHTML=render(markdown);}else plainText(markdown);
 }catch(error){if(current===request)plainText(`Reference unavailable: ${error.message}`);}
 panel.querySelector('button')?.focus();
}
app.registerExtension({name:'Genereti.NodeReference',
 setup:registerReferenceSidebar,
 beforeRegisterNodeDef(_type,data){if(data.name?.startsWith('Genereti'))definitions.set(data.name,data);},
 nodeCreated(node){
  if(!node.comfyClass?.startsWith('Genereti')||node.comfyClass.startsWith('GeneretiCore'))return;
  requestAnimationFrame(()=>{
   if(!node.graph)return;
   const button=document.createElement('button');button.type='button';button.textContent='?';button.title='Quick reference';button.setAttribute('aria-label',`Quick reference for ${node.title}`);
   button.onpointerdown=event=>event.stopPropagation();button.onclick=event=>{event.stopPropagation();void showReference(node,button);};
   const controls=node._generetiExecutionModeElement||node.widgets?.map(w=>w.element?.querySelector?.('.genereti-node-controls')).find(Boolean);
   if(controls){controls.append(button);return;}
   const row=document.createElement('div');row.className='genereti-node-controls';row.append(button);
   const widget=node.addDOMWidget('genereti_reference','GENERETI_REFERENCE',row,{serialize:false});widget.computeSize=width=>[width,32];
  });
 }
});
