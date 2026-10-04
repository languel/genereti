import { app } from '../../../../scripts/app.js';

const shortcuts=[
  ['D','Toggle backdrop','One selected preview-capable node'],
  ['Alt+O','Toggle output-only node','Selected node, or output-only node under the pointer; reveal restore control just outside an edge'],
  ['Alt+W','Toggle overlay','Hovered overlay first, otherwise selected node'],
  ['Alt+F','Fill window / restore','Hovered overlay first, otherwise selected node; opens overlay if needed'],
  ['Escape','Restore filled overlay','Returns to its previous position and size'],
  ['Alt+P','Presentation visibility','Hide/show graph nodes, code and links; renderers continue'],
  ['Alt+Shift+Z','Satori','Hide/show Comfy chrome and canvas diagnostics'],
  ['Alt+Shift+R','Properties sidebar','Toggle right panel independently; reveal/hide it in Satori'],
  ['Alt+Shift+I','Canvas diagnostics','Independent toggle; also works in presentation and Satori'],
  ['Alt+Shift+O','Click through overlay','Toggle interaction with content underneath open overlays'],
  ['Alt+Z','Drawing Satori','Inside the drawing editor'],
  ['Cmd/Ctrl+Enter','Run livecode','Inside the code editor or livecode preview'],
  ['Ctrl+.','Stop livecode','Keep the last frame'],
  ['Cmd/Ctrl+Shift+F','Format code','Inside the livecode editor'],
  ['Alt+Shift+Right','Next Manim cue','Inside the active Manim editor/preview'],
];
function reference(){
  const root=document.createElement('div');root.style.cssText='width:100%;font-size:12px;color:inherit';
  const table=document.createElement('table');table.setAttribute('aria-label','Genereti keyboard shortcuts');table.style.cssText='width:100%;border-collapse:collapse;text-align:left';
  const head=table.createTHead().insertRow();for(const text of ['Shortcut','Action','Scope']){const cell=document.createElement('th');cell.textContent=text;cell.style.cssText='padding:6px 8px;font-weight:500';head.append(cell);}
  const body=table.createTBody();for(const row of shortcuts){const tr=body.insertRow();row.forEach((text,index)=>{const td=tr.insertCell();td.style.cssText='padding:6px 8px;vertical-align:top';const content=document.createElement(index===0?'kbd':'span');content.textContent=text;if(index===0)content.style.whiteSpace='nowrap';td.append(content);});}
  const note=document.createElement('p');note.style.cssText='margin:10px 8px;opacity:.75;line-height:1.5';note.textContent='On macOS, Alt is Option. Viewing shortcuts leave text fields and code editing alone. Fill window stays inside Comfy; browser/macOS fullscreen is separate. Canvas diagnostics: T = graph time, I = iterations, N = total [in-view] nodes, V = revision, FPS = graph redraw rate, not generation or output FPS.';
  root.append(table,note);return root;
}
app.registerExtension({name:'Genereti.ShortcutReference',settings:[{
  id:'Genereti.Shortcuts.Reference',name:'Keyboard shortcuts',category:['Genereti','Shortcuts','Reference'],
  type:reference,defaultValue:null,tooltip:'Reference for Genereti viewing, presentation and creative-editor shortcuts. These are actions, not workflow parameters.',
}]});
