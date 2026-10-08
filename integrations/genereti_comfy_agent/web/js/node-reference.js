import {app} from '../../../../scripts/app.js';
import {ensureControlStyle} from '/extensions/genereti_comfy_p5/js/control-style.js';

const definitions=new Map();
const lessons={GeneretiTextureExpression:'noise-dimensions',GeneretiTextureNoise:'noise-dimensions',GeneretiChopExpression:'opentouch-basics',GeneretiChopNoise:'opentouch-basics',GeneretiDatLesson:'lesson-authoring'};
let panel,body,title,lessonButton,opener,request=0;
let references;
function loadReferences(){
 references??=fetch('/extensions/genereti_comfy_agent/lessons/node-references.json').then(async response=>{
  if(!response.ok)throw Error('Bundled references could not be loaded');
  return response.json();
 }).catch(error=>{references=undefined;throw error;});
 return references;
}
function plainText(text){body.style.whiteSpace='pre-wrap';body.textContent=text;}
function close(){request++;panel.hidden=true;opener?.focus();}
function mount(){
 if(panel)return;
 ensureControlStyle();
 panel=document.createElement('section');panel.className='genereti-reference';panel.hidden=true;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Genereti quick reference');
 panel.style.cssText='position:fixed;right:24px;top:90px;width:min(520px,calc(100vw - 48px));max-height:calc(100vh - 120px);display:flex;flex-direction:column;background:var(--comfy-menu-bg,#262626);color:var(--fg-color,#eee);border:1px solid var(--border-color,#555);border-radius:12px;box-shadow:0 8px 28px #0006;z-index:1100;font:14px/1.5 sans-serif';
 const header=document.createElement('div');header.className='genereti-node-controls';header.style.cssText='display:flex;align-items:center;padding:12px 16px;gap:12px';
 title=document.createElement('strong');title.style.flex='1';
 const dismiss=document.createElement('button');dismiss.textContent='×';dismiss.title='Close reference';dismiss.setAttribute('aria-label',dismiss.title);dismiss.onclick=close;
 header.append(title,dismiss);
 body=document.createElement('div');body.style.cssText='padding:0 20px 16px;overflow:auto;min-height:0;user-select:text';
 const footer=document.createElement('div');footer.className='genereti-node-controls';footer.style.padding='8px 16px';
 lessonButton=document.createElement('button');lessonButton.textContent='▷';lessonButton.title='Start related lesson';lessonButton.setAttribute('aria-label',lessonButton.title);footer.append(lessonButton);
 panel.append(header,body,footer);document.body.append(panel);
 const style=document.createElement('style');style.textContent='.genereti-reference[hidden]{display:none!important}.genereti-reference pre{overflow:auto;padding:10px;background:var(--comfy-input-bg,#181818);border-radius:6px}.genereti-reference code{font-family:monospace}.genereti-reference table{border-collapse:collapse;width:100%}.genereti-reference td,.genereti-reference th{padding:5px;border-bottom:1px solid var(--border-color,#555);text-align:left}.genereti-reference a{color:var(--link-color,#8ab4f8)}';document.head.append(style);
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
}
async function showReference(node,button){
 mount();const current=++request;opener=button;panel.hidden=false;title.textContent=node.title;plainText('Loading reference…');
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
