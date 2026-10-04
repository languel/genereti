// Static document exports share Livecode's Markdown/math renderer and local fonts.
import DOMPurify from 'dompurify';
import {markdownWithMath,formula} from './math.js';
import mathCss from 'genereti:math-css';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function documentHTML({title='OpenTouch document',source='',mode='markdown'}){
 const content=mode==='html'?source:mode==='latex'?formula(source):markdownWithMath(source);
 const body=DOMPurify.sanitize(content,{FORBID_TAGS:['script','iframe','object','embed','form']});
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:"><title>${escape(title)}</title><style>${mathCss}\nbody{margin:40px auto;padding:0 24px;max-width:900px;color:#222;background:#fff;font:16px/1.6 system-ui,sans-serif}h1,h2,h3{line-height:1.2;break-after:avoid}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f5f5;padding:14px}code{font: .9em/1.5 ui-monospace,monospace}img{max-width:100%}.katex-display{overflow-x:auto}@page{margin:18mm}@media print{body{margin:0;padding:0;max-width:none}pre,tr,figure,.katex-display{break-inside:avoid}a{color:inherit}}</style></head><body>${body}</body></html>`;
}
export function downloadDocument(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
