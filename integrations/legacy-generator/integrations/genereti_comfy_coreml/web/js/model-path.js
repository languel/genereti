import { app } from '../../../scripts/app.js';
const families={GeneretiSDXSGenerate:'sdxs',GeneretiSDTurboGenerate:'sd_turbo'};
app.registerExtension({name:'Genereti.NativeFamilyModels',nodeCreated(node){
  const family=families[node.comfyClass];if(!family)return;
  let catalog=null,last='',disposed=false;
  function update(){
    const path=node.widgets?.find(w=>w.name==='model_path'),mode=node.widgets?.find(w=>w.name==='mode');
    const profile=catalog?.model_paths?.[path?.value];const key=JSON.stringify([path?.value,mode?.value,profile]);if(last===key)return;last=key;
    if(path&&catalog){path.options??={};path.options.values=Object.entries(catalog.model_paths).filter(([,p])=>p.family===family).map(([name])=>name);}
    if(mode&&profile){mode.options??={};mode.options.values=profile.modes;if(!profile.modes.includes(mode.value))mode.value=profile.modes.includes('sketch')?'sketch':profile.modes[0];}
    node.graph?.setDirtyCanvas?.(true,true);
  }
  fetch('/genereti/coreml/status').then(r=>r.json()).then(data=>{if(!disposed){catalog=data;update();}}).catch(()=>{});
  const timer=setInterval(update,500),removed=node.onRemoved;node.onRemoved=function(){disposed=true;clearInterval(timer);return removed?.apply(this,arguments);};update();
}});
