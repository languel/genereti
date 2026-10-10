import DOMPurify from 'dompurify';
import {markdownWithMath,renderHtmlMath} from './math.js';
import mathCss from 'genereti:math-css';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let sequence=0,diagramQueue=Promise.resolve();
async function diagrams(body,dark){
 const blocks=[...body.querySelectorAll('pre.mermaid,pre:has(>code.language-mermaid)')];
 if(!blocks.length)return;
 const {default:mermaid}=await import('mermaid');
 const work=async()=>{
  mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:dark?'dark':'default',fontFamily:'system-ui',suppressErrorRendering:true,htmlLabels:false,flowchart:{htmlLabels:false}});
  for(const block of blocks){
   const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:800px';document.body.append(host);
   try{const {svg}=await mermaid.render('genereti-diagram-'+(++sequence),block.textContent,host);const container=body.ownerDocument.createElement('div');container.className='mermaid';container.innerHTML=DOMPurify.sanitize(svg,{USE_PROFILES:{html:true,svg:true,svgFilters:true},ADD_TAGS:['foreignObject'],ADD_ATTR:['dominant-baseline']});block.replaceWith(container);}
   catch(error){block.textContent='Diagram: '+error.message;block.className='diagram-error';}
   finally{host.remove();}
  }
 };
 const next=diagramQueue.then(work,work);diagramQueue=next.catch(()=>{});await next;
}
export async function webviewDocument(source,mode,{fontSize=14,foreground='#eee',background='#222'}={}){
 const html=mode==='html'?String(source):mode==='text'?'<pre>'+escape(source)+'</pre>':DOMPurify.sanitize(markdownWithMath(source));
 const doc=new DOMParser().parseFromString(html,'text/html');
 renderHtmlMath(doc.body);await diagrams(doc.body,background!=='#fff');
 const style=doc.createElement('style');style.textContent=mathCss+`\n:root{color-scheme:normal}body{margin:0;padding:16px;box-sizing:border-box;font:${Number(fontSize)||14}px/1.6 system-ui;color:${foreground};background:${background}}img,svg,video,canvas{max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{font-family:ui-monospace,monospace}table{border-collapse:collapse}td,th{padding:5px 9px;border-bottom:1px solid #8885;text-align:left}.katex-display{overflow:auto}.mermaid{overflow:auto}.diagram-error{color:#e98}`;doc.head.prepend(style);
 const bridge=doc.createElement('script');bridge.textContent=`window.addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='genereti-webview-appearance'){const size=Number(event.data.fontSize);if(size>=9&&size<=36)document.body.style.fontSize=size+'px';}});document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.shiftKey&&!event.altKey&&['Equal','Minus','NumpadAdd','NumpadSubtract'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();parent.postMessage({type:'genereti-webview-font',delta:['Equal','NumpadAdd'].includes(event.code)?1:-1},'*');}if(event.altKey&&!event.metaKey&&!event.ctrlKey&&['KeyO','KeyW','KeyF','KeyC'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();parent.postMessage({type:'genereti-webview-shortcut',action:event.code==='KeyO'?(event.shiftKey?'visualAll':'outputOnly'):event.code==='KeyW'?'overlay':event.code==='KeyF'?'fill':'through'},'*');}},true);`;
 doc.body.append(bridge);return '<!doctype html>'+doc.documentElement.outerHTML;
}
