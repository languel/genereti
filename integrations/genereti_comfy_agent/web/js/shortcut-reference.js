import { app } from '../../../../scripts/app.js';

const shortcuts=[
  ['D','Toggle backdrop','One selected preview-capable node'],
  ['Alt+O','Toggle output-only node','Selected node, or output-only node under the pointer; reveal restore control just outside an edge'],
  ['Cmd+[ / ]','Stack backward / forward','Hovered or last interacted view; Cmd+Shift+[ / ] sends back / front; Ctrl on other hosts'],
  ['Shift-click overlay glyph','Output-only node','Regular click opens a floating overlay'],
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
  ['Cmd/Ctrl+Shift+F','Format code','Selected text only; entire document when selection is empty'],
  ['Cmd/Ctrl+Shift+Plus / Minus','Editor font size','Focused editor or one selected editor node; saved per node'],
  ['Alt+Shift+Right','Next Manim cue','Inside the active Manim editor/preview'],
];
function reference(){
  const root=document.createElement('div');
  const button=document.createElement('button');button.textContent='Open keybindings';
  button.title='Use Comfy’s native editor to search ꘇ / Genereti, edit bindings, resolve conflicts, and save presets. Hover commands for scope. P on blank canvas toggles parameters; with selected nodes it pins them.';
  button.addEventListener('click',async()=>{
    const open=()=>{const tab=[...document.querySelectorAll('button,[role=button]')].find(item=>item.textContent.trim()==='Keybinding');if(!tab)return false;tab.click();return true;};
    if(open())return;
    await app.extensionManager.command.execute('Comfy.ShowSettingsDialog');
    if(open())return;
    const observer=new MutationObserver(()=>{if(open())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),3000);
  });
  root.append(button);
  // Editor-local and pointer gestures retain their editor context; do not
  // present them as globally editable commands.
  const local=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Editor and pointer gestures';local.append(summary);
  for(const [keys,label,scope] of shortcuts.filter(row=>['Shift-click overlay glyph','Escape','Alt+Z','Cmd/Ctrl+Enter','Ctrl+.','Cmd/Ctrl+Shift+F','Cmd/Ctrl+Shift+Plus / Minus','Alt+Shift+Right'].includes(row[0]))){
    const line=document.createElement('div');line.style.cssText='display:flex;gap:12px;padding:6px 0';line.title=scope;const kbd=document.createElement('kbd');kbd.textContent=keys;const text=document.createElement('span');text.textContent=label;line.append(kbd,text);local.append(line);
  }
  root.append(local);return root;
}
app.registerExtension({name:'Genereti.ShortcutReference',setup(){
  // Native KeybindingPanel currently titles command cells with only the ID.
  // Add authored scope to that hover tip without replacing its native UI.
  const tips=()=>{
    const commands=app.extensionManager.command.commands;
    for(const cell of document.querySelectorAll('.keybinding-panel [title^="Genereti."],.keybinding-panel [data-genereti-command]')){
      const id=cell.dataset.generetiCommand||cell.title;
      const command=commands.find(item=>item.id===id);
      if(command?.tooltip){cell.dataset.generetiCommand=id;cell.title=`${command.tooltip} (${id})`;}
    }
  };
  new MutationObserver(tips).observe(document.body,{childList:true,subtree:true});tips();
},settings:[{
  id:'Genereti.Shortcuts.Reference',name:'Keyboard shortcuts',category:['Genereti','Shortcuts','Reference'],
  type:reference,defaultValue:null,tooltip:'Reference for Genereti viewing, presentation and creative-editor shortcuts. These are actions, not workflow parameters.',
}]});
