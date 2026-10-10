import {performPreviewAction} from '/extensions/genereti_comfy_stream/js/preview-shortcuts.js';
import {previewControls} from '/extensions/genereti_comfy_stream/js/preview-controls.js';
import {documentViewer} from './webview-windows.js';
import {app} from '../../../scripts/app.js';
import {createEditor} from '../lib/editor.mjs?v=b6ff352abf50e6b1';
import {webviewDocument} from '../lib/webview/document.js';
import {editorAppearance,subscribeEditorAppearance,captureFontShortcut} from './editor-settings.js';
import {captureEditorInput} from './editor-input.js';
import {ensureControlStyle} from './control-style.js';

app.registerExtension({name:'Genereti.Webview',getCustomWidgets(){return {
 GENERETI_DOCUMENT(node,name,inputData){
  ensureControlStyle();node.properties??={};let draft=String(inputData?.[1]?.default??''),queued,queuedFormat,disposed=false,epoch=0,editing=false,frame,releaseFrameKeys;
  const replicas=new Set();let outputs;
  let rendered=node.properties.generetiWebviewRendered!==false;
  const root=document.createElement('div');root.className='genereti-webview';root.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';
  const tools=document.createElement('div');tools.className='genereti-node-controls';const windowTools=document.createElement('div');windowTools.className='genereti-node-controls';
  const button=(label,paths,click)=>{const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg>`;b.onclick=click;tools.append(b);return b;};
  const raw=button('Raw source','<path d="m8 5-5 7 5 7m8-14 5 7-5 7m-3-16-2 18"/>',()=>setRendered(false));
  const output=button('Rendered document','<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',()=>setRendered(true));
  button('Reload rendered document · restarts HTML scripts','<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',()=>render());
  const previewHeight=()=>Math.max(160,Math.min(1600,Number(node.properties.generetiWebviewHeight)||320));
  const code=document.createElement('div');code.style.cssText=`height:${previewHeight()}px;min-height:0;overflow:hidden`;
  const surface=document.createElement('div');surface.style.cssText=`height:${previewHeight()}px;min-height:0;width:100%;overflow:hidden`;
  const status=document.createElement('span');status.style.cssText='font-size:11px;color:var(--fg-color);overflow-wrap:anywhere';status.hidden=true;status.setAttribute('role','status');root.append(windowTools,surface,code,status);
  const format=()=>queuedFormat??node.widgets?.find(w=>w.name==='format')?.value??'markdown';
  const source=()=>queued??draft;
  const appearance=()=>({...editorAppearance(node),fillHeight:true});
  const view=createEditor(code,draft,'markdown',value=>{if(!editing){if(queued!==undefined){queueMicrotask(()=>{if(!disposed)editorText(source());});return;}draft=value;destroyFrame();node.setDirtyCanvas?.(true,true);}},()=>setRendered(true),appearance());
  function editorText(value){if(view.state.doc.toString()!==value){editing=true;try{view.replaceDocument(value);}finally{editing=false;}}}
  function updateFont(){
   const a=appearance();view.setAppearance(a);
   frame?.contentWindow?.postMessage({type:'genereti-webview-appearance',fontSize:a.fontSize},'*');
   if(format()==='url')try{frame.contentDocument.body.style.fontSize=a.fontSize+'px';}catch{};for(const replica of replicas){const f=replica.frame;f?.contentWindow?.postMessage({type:'genereti-webview-appearance',fontSize:a.fontSize},'*');try{if(f?.contentDocument)f.contentDocument.body.style.fontSize=a.fontSize+'px';}catch{}}
  }
  function fontDelta(delta){node.properties.generetiEditorFontSize=Math.max(9,Math.min(36,Number(appearance().fontSize)+delta));updateFont();node.setDirtyCanvas?.(true,true);}
  function shortcut(action){if(action==='visualAll')performPreviewAction(action);else if(['outputOnly','overlay','fill','through'].includes(action))outputs.shortcut(action);}
  const message=event=>{if(disposed||event.source!==frame?.contentWindow)return;if(event.data?.type==='genereti-webview-font'&&[1,-1].includes(event.data.delta))fontDelta(event.data.delta);else if(event.data?.type==='genereti-webview-shortcut')shortcut(event.data.action);};
  window.addEventListener('message',message);
  function destroyFrame(){releaseFrameKeys?.();releaseFrameKeys=undefined;frame?.remove();frame=undefined;}
  async function render(){
   const current=++epoch;if(!rendered||disposed)return;for(const replica of replicas)void replica.refresh();
   status.hidden=true;
   try{
    const mode=format(),text=source(),a=appearance();
    const url=mode==='url'?new URL(text.trim(),location.href):undefined;
    if(url&&!['http:','https:'].includes(url.protocol))throw Error('URL mode accepts only HTTP or HTTPS pages.');
    const html=url?null:await webviewDocument(text,mode,{fontSize:a.fontSize,foreground:a.foreground||'#eee',background:a.background||'#222'});
    if(disposed||current!==epoch||!rendered)return;destroyFrame();
    frame=document.createElement('iframe');frame.title='Genereti webview';frame.style.cssText='display:block;border:0;width:100%;height:100%;background:transparent';frame.allow='autoplay';
    // Authored scripts cannot access Comfy. URL pages retain their origin/API.
    frame.sandbox=url?'allow-scripts allow-same-origin allow-forms allow-popups':'allow-scripts allow-forms';
    if(url){frame.src=url.href;frame.onload=()=>{
     updateFont();try{const win=frame.contentWindow;if(!frame.contentDocument)return;const key=event=>{if((event.ctrlKey||event.metaKey)&&event.shiftKey&&!event.altKey&&['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();fontDelta(['Equal','NumpadAdd'].includes(event.code)?1:-1);}};win.addEventListener('keydown',key,true);releaseFrameKeys=()=>win.removeEventListener('keydown',key,true);}catch{}
    };}else frame.srcdoc=html;
    surface.append(frame);
   }catch(error){if(current===epoch&&!disposed){status.hidden=false;status.textContent=error.message;}}
  }
  function setRendered(value){rendered=value;node.properties.generetiWebviewRendered=value;raw.setAttribute('aria-pressed',String(!value));output.setAttribute('aria-pressed',String(value));code.hidden=value;surface.hidden=!value;if(value){if(!frame)void render();}else editorText(source());node.setDirtyCanvas?.(true,true);}
  outputs=previewControls(surface,status,node,()=>{},{interactiveSurface:surface,publishOnOpen:false,fitControl:false,onNodeViewChange:open=>{if(open)setRendered(true);},createViewer:(s,paint,options)=>{if(options.overlay)return;const viewer=documentViewer(s,value=>{paint(value);if(value)replicas.add(viewer);else replicas.delete(viewer);},{backdrop:options.backdrop,fontDelta,shortcut,onFrame:updateFont,getDocument:async()=>{const mode=format(),text=source(),a=appearance();if(mode==='url'){const url=new URL(text.trim(),location.href);if(!['http:','https:'].includes(url.protocol))throw Error('Use an HTTP or HTTPS URL');return {url:url.href,sandbox:'allow-scripts allow-same-origin allow-forms allow-popups'};}return {html:await webviewDocument(text,mode,{fontSize:a.fontSize,foreground:a.foreground||'#eee',background:a.background||'#222'}),sandbox:'allow-scripts allow-forms'};}});replicas.add(viewer);return viewer;}});windowTools.append(...outputs.actions.childNodes,...tools.childNodes);
  const widget=node.addDOMWidget(name,'GENERETI_DOCUMENT',root,{serialize:true,getValue:()=>draft,setValue:value=>{draft=String(value??'');editorText(draft);destroyFrame();if(rendered)void render();}});widget.serializeValue=()=>draft;widget.computeSize=width=>[width,previewHeight()+24+(status.hidden?0:24)];
  const releaseInput=captureEditorInput(view,appearance),releaseFont=captureFontShortcut(node,root,updateFont),releaseAppearance=subscribeEditorAppearance(updateFont);
  const configured=node.onConfigure;node.onConfigure=function(info){configured?.apply(this,arguments);code.style.height=surface.style.height=previewHeight()+'px';const text=info?.properties?.generetiWebviewDraft??info?.widgets_values?.[node.widgets.indexOf(widget)];if(typeof text==='string')widget.options.setValue(text);updateFont();setRendered(node.properties.generetiWebviewRendered!==false);};
  const serialized=node.onSerialize;node.onSerialize=function(info){serialized?.apply(this,arguments);info.properties??={};info.properties.generetiWebviewDraft=draft;};
  const executed=node.onExecuted;node.onExecuted=function(result){executed?.apply(this,arguments);if(typeof result?.genereti_document?.[0]==='string'){queued=result.genereti_document[0];queuedFormat=result.genereti_document_format?.[0];if(!rendered)editorText(queued);destroyFrame();if(rendered)void render();}};
  const connected=node.onConnectionsChange;node.onConnectionsChange=function(){const result=connected?.apply(this,arguments);queueMicrotask(()=>{const slot=node.inputs?.find(i=>i.name===name);if(!slot?.link){queued=queuedFormat=undefined;editorText(draft);destroyFrame();if(rendered)void render();}});return result;};
  requestAnimationFrame(()=>{const w=node.widgets.find(w=>w.name==='format');if(w){const callback=w.callback;w.callback=function(){queuedFormat=undefined;destroyFrame();if(rendered)void render();return callback?.apply(this,arguments);};}});
  const removed=node.onRemoved;node.onRemoved=function(){disposed=true;epoch++;outputs.close();for(const replica of replicas)replica.close();replicas.clear();destroyFrame();releaseInput();releaseFont();releaseAppearance();window.removeEventListener('message',message);view.destroy();return removed?.apply(this,arguments);};
  setRendered(rendered);return {widget};
 }
};}});
