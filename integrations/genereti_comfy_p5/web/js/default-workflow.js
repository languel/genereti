import {app} from '../../../scripts/app.js';

const settingId='Genereti.Workflow.Default';
let graph,original,blank;
function applyDefault(preference=app.ui.settings.getSettingValue(settingId)){
 if(!graph)return;
 const source=preference==='blank'?blank:original;
 // Keep the shared object identity: Comfy's startup and Load Default command
 // both use this object. Explicitly loaded/restored workflows are untouched.
 for(const key of Object.keys(graph))delete graph[key];
 Object.assign(graph,structuredClone(source));
}
app.registerExtension({
 name:'Genereti.DefaultWorkflow',
 init(){
  const defaults=window.comfyAPI?.defaultGraph;
  if(!defaults?.defaultGraph||!defaults.blankGraph)return;
  graph=defaults.defaultGraph;original=structuredClone(graph);blank=structuredClone(defaults.blankGraph);
  app.ui.settings.addSetting({
   id:settingId,name:'Default workflow',sortOrder:300,category:['Genereti','Workflow','Default'],
   type:'combo',defaultValue:'comfy',
   options:[{text:'Blank canvas',value:'blank'},{text:'Comfy default',value:'comfy'}],
   tooltip:'Applies to the next default load or startup without restored tabs. Does not replace the current canvas.',
   onChange:value=>applyDefault(value),
  });
 },
 beforeLoadGraph:()=>applyDefault(),
 setup:()=>applyDefault(),
});
