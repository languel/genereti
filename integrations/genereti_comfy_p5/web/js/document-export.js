// Keep exports out of the animation path: lazy-load the shared static renderer.
const filename=title=>(title||'OpenTouch document').replace(/[^\p{L}\p{N}._ -]/gu,'').trim().slice(0,80)||'document';
export async function exportDocument(doc,format){
 // Open on the initiating click, before loading fonts/libraries, for popup rules.
 const printWindow=format==='pdf'?window.open('about:blank','_blank','popup,width=1000,height=800'):null;
 if(format==='pdf'&&!printWindow)throw Error('Allow this document window to Print / Save as PDF');
 try{const {documentHTML,downloadDocument}=await import('../lib/document.mjs');
  if(format==='markdown'){downloadDocument(doc.source,filename(doc.title)+(doc.mode==='html'?'.html':doc.mode==='latex'?'.tex':'.md'),'text/plain;charset=utf-8');return;}
  const html=documentHTML(doc);
  if(format==='html'){downloadDocument(html,filename(doc.title)+'.html','text/html;charset=utf-8');return;}
  printWindow.document.open();printWindow.document.write(html);printWindow.document.close();printWindow.opener=null;
  await printWindow.document.fonts.ready;printWindow.focus();printWindow.print();
 }catch(error){printWindow?.close();throw error;}
}
export function documentExportControls(getDocument,onError=()=>{}){
 const tools=document.createElement('div');tools.className='genereti-node-controls';
 const format=document.createElement('select');format.setAttribute('aria-label','Document export format');for(const [id,label]of [['markdown','Markdown / source'],['html','Standalone HTML'],['pdf','Print / Save as PDF']])format.append(new Option(label,id));
 const button=document.createElement('button');button.textContent='↓';button.title='Export document';button.setAttribute('aria-label',button.title);button.onclick=()=>{try{return exportDocument(getDocument(),format.value).catch(onError);}catch(error){onError(error);}};tools.append(format,button);return tools;
}
export function tableMarkdown(data,title){const rows=data?.rows??[],width=rows.reduce((w,r)=>Math.max(w,r.length),0);if(!width)return '# '+title+'\n';const cell=v=>String(v??'').replaceAll('|','\\|').replaceAll('\n','<br>');const row=r=>'| '+Array.from({length:width},(_,i)=>cell(r[i])).join(' | ')+' |';return '# '+title+'\n\n'+[row(rows[0]),row(Array(width).fill('---')),...rows.slice(1).map(row)].join('\n')+'\n';}
