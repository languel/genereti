import {app} from '/scripts/app.js';
import {selectedReferenceNode} from './reference-follow.js';
import {buildNodeReference} from './reference-index.js';
import {lessonWorkflows} from './lesson-library.js';
import {registerHelpView,showHelpView,helpViewHost,closeHelpPanel,isHelpPanelOpen} from './help-panel.js';

const headerButtons=new Map();
function mountHeaderButtons(){
 for(const [node,button] of headerButtons){
  const header=document.querySelector(`[data-node-id="${CSS.escape(String(node.id))}"] .lg-node-header`);
  const row=header?.firstElementChild;
  if(row&&button.parentElement!==row)row.append(button);
 }
}
function watchNodeHeaders(){
 const style=document.createElement('style');style.textContent='.genereti-header-reference{flex:none;margin-right:8px;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;font-size:12px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.genereti-header-reference:hover{background:color-mix(in srgb,currentColor 12%,transparent)}';document.head.append(style);
 let pending=false;
 new MutationObserver(records=>{
  if(pending||!records.some(record=>[...record.addedNodes].some(element=>element.nodeType===1&&(element.matches('.lg-node,.lg-node-header')||element.querySelector('.lg-node,.lg-node-header')))))return;
  pending=true;requestAnimationFrame(()=>{pending=false;mountHeaderButtons();});
 }).observe(document.body,{childList:true,subtree:true});
}
const definitions=new Map();
const lessons={GeneretiTextureExpression:'noise-dimensions',GeneretiTextureNoise:'noise-dimensions',GeneretiChopExpression:'opentouch-basics',GeneretiChopNoise:'opentouch-basics',GeneretiDatLesson:'lesson-authoring'};
let panel,body,title,lessonButton,workflowButton,askButton,opener,request=0,currentReference;
let references,autoButton,lastSelected;
let auto=localStorage.getItem('genereti.reference.auto')==='true';
function followSelection(){if(!auto||!panel)return;const node=selectedReferenceNode(app);if(!node||node===lastSelected)return;lastSelected=node;void updateReference(node);}
function selectionFollowing(){const previous=app.canvas.onSelectionChange;app.canvas.onSelectionChange=function(){const result=previous?.apply(this,arguments);queueMicrotask(followSelection);return result;};}
export function loadReferences(){references??=fetch('/extensions/genereti_comfy_agent/lessons/node-references.json',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Bundled references could not be loaded');return response.json();}).catch(error=>{references=undefined;throw error;});return references;}
export function referenceDefinitions(){return [...definitions.values()];}
function markdownText(markdown){const render=app.extensionManager?.renderMarkdownToHtml;if(render){body.style.whiteSpace='normal';body.innerHTML=render(markdown);}else plainText(markdown);}
function plainText(text){body.style.whiteSpace='pre-wrap';body.textContent=text;}
function close(){request++;closeHelpPanel();opener?.focus();}
function mount(host){
 if(panel){host.append(panel);return;}
 panel=document.createElement('section');panel.className='genereti-reference';panel.setAttribute('aria-label','Genereti quick reference');panel.style.cssText='width:100%;height:100%;display:flex;flex-direction:column;min-height:0;min-width:0';
 title=document.createElement('strong');title.textContent='Quick reference';title.style.cssText='flex:1;min-width:0';
 const header=document.createElement('div');header.style.cssText='display:flex;align-items:center;gap:8px;padding:12px 20px;flex:none';
 autoButton=document.createElement('button');autoButton.type='button';autoButton.textContent='Auto';autoButton.title='Follow the selected node’s reference';autoButton.setAttribute('aria-label','Automatically follow selected node');autoButton.setAttribute('aria-pressed',String(auto));autoButton.onclick=()=>{auto=!auto;lastSelected=undefined;localStorage.setItem('genereti.reference.auto',String(auto));autoButton.setAttribute('aria-pressed',String(auto));followSelection();};const home=document.createElement('button');home.type='button';home.textContent='⌂';home.title='Welcome';home.setAttribute('aria-label','Welcome reference');home.onclick=()=>void showWelcome();header.append(home,title,autoButton);
 body=document.createElement('div');body.style.cssText='padding:0 20px 16px;overflow:auto;flex:1;min-height:0;user-select:text';body.textContent='Loading Welcome…';
 const footer=document.createElement('div');footer.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 16px;flex:none;flex-wrap:wrap';
 askButton=document.createElement('button');askButton.type='button';askButton.textContent='Ask about this node';askButton.hidden=true;askButton.onclick=()=>window.dispatchEvent(new CustomEvent('genereti-reference-assistant',{detail:currentReference}));
 lessonButton=document.createElement('button');lessonButton.type='button';lessonButton.hidden=true;lessonButton.textContent='▷';lessonButton.title='Start related lesson';lessonButton.setAttribute('aria-label',lessonButton.title);workflowButton=document.createElement('button');workflowButton.type='button';workflowButton.textContent='Open example workflow';workflowButton.hidden=true;workflowButton.onclick=async()=>{try{const file=lessonWorkflows[currentReference.guideId],response=await fetch('/extensions/genereti_comfy_agent/lessons/'+file);if(!response.ok)throw Error('Example workflow unavailable');const graph=await response.json();delete graph.id;await app.loadGraphData(graph,true,true,'ꘇ '+currentReference.title+' '+Date.now(),{openSource:'template'});await window.generetiGuides.start(currentReference.guideId);}catch(error){plainText(error.message);}};footer.append(askButton,lessonButton,workflowButton);panel.append(header,body,footer);host.append(panel);
 const css=document.createElement('style');css.textContent='.genereti-reference button[aria-pressed=true]{background:color-mix(in srgb,currentColor 12%,transparent)}.genereti-reference pre{overflow:auto;padding:10px;background:var(--comfy-input-bg,#181818);border-radius:6px}.genereti-reference code{font-family:monospace}.genereti-reference table{border-collapse:collapse;width:100%}.genereti-reference td,.genereti-reference th{padding:5px;border-bottom:1px solid var(--border-color,#555);text-align:left}.genereti-reference a{color:var(--link-color,#8ab4f8)}';document.head.append(css);void loadReferences().then(documents=>{if(!currentReference&&request===0){title.textContent='Welcome';currentReference={title:'Welcome to ꘇ Genereti',markdown:documents.Welcome};markdownText(documents.Welcome||'Welcome to Genereti');askButton.hidden=false;askButton.textContent='Ask about this guide';}}).catch(error=>plainText(`Reference unavailable: ${error.message}`));queueMicrotask(followSelection);
}
registerHelpView('reference','Reference',mount);
export async function showWelcome(){
 helpViewHost('reference');showHelpView('reference');const current=++request;const documents=await loadReferences();if(current!==request)return;renderReference({title:'Welcome to ꘇ Genereti',markdown:documents.Welcome||'Welcome to Genereti'});
}
export function showReferenceDocument(document){helpViewHost('reference');showHelpView('reference');request++;renderReference(document);}
function renderReference(document){
 currentReference=document;title.textContent=document.title;body.scrollTop=0;markdownText(document.markdown);askButton.hidden=false;askButton.textContent=document.nodeId!=null?'Ask about this node':'Ask about this guide';
 lessonButton.hidden=!document.guideId;lessonButton.title='Start guide in current workflow';lessonButton.setAttribute('aria-label',lessonButton.title);lessonButton.onclick=async()=>{try{await window.generetiGuides.start(document.guideId);close();}catch(error){plainText(error.message);}};
 workflowButton.hidden=!lessonWorkflows[document.guideId];
}
export async function showReference(node,button){helpViewHost('reference');showHelpView('reference');opener=button;return updateReference(node);}
async function updateReference(node){
 const current=++request;title.textContent=node.title;plainText('Loading reference…');askButton.hidden=true;lessonButton.hidden=true;workflowButton.hidden=true;
 const name=node.comfyClass,definition=definitions.get(name)||{name,display_name:node.title};
 try{const documents=await loadReferences();if(current!==request)return;renderReference({nodeId:node.id,nodeType:name,title:node.title,markdown:documents[name]||buildNodeReference(definition),guideId:lessons[name]});}
 catch(error){if(current===request)plainText(`Reference unavailable: ${error.message}`);}
}
app.registerExtension({name:'Genereti.NodeReference',setup(){watchNodeHeaders();selectionFollowing();void import('./reference-contents.js');},

 beforeRegisterNodeDef(_type,data){if(data.name)definitions.set(data.name,data);},
 nodeCreated(node){
  if(!node.comfyClass?.startsWith('Genereti')||node.comfyClass.startsWith('GeneretiCore'))return;
  requestAnimationFrame(()=>{
   if(!node.graph)return;
   const button=document.createElement('button');button.type='button';button.textContent='?';button.title='Quick reference';button.setAttribute('aria-label',`Quick reference for ${node.title}`);
   button.className='genereti-header-reference';headerButtons.set(node,button);const removed=node.onRemoved;node.onRemoved=function(){headerButtons.delete(node);return removed?.apply(this,arguments);};
   button.onpointerdown=event=>event.stopPropagation();button.onclick=event=>{event.stopPropagation();if(opener===button&&isHelpPanelOpen())close();else void showReference(node,button);};
   const controls=node._generetiExecutionModeElement||node.widgets?.map(w=>w.element?.querySelector?.('.genereti-node-controls')).find(Boolean);
   if(controls){controls.append(button);mountHeaderButtons();return;}
   const row=document.createElement('div');row.className='genereti-node-controls';row.append(button);
   const widget=node.addDOMWidget('genereti_reference','GENERETI_REFERENCE',row,{serialize:false});widget.computeSize=width=>[width,row.childElementCount?20:0];mountHeaderButtons();
  });
 }
});
