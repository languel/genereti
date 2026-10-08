import {app} from '../../../scripts/app.js';
app.registerExtension({name:'Genereti.SendWidgetMigration',nodeCreated(node){
 if(node.comfyClass!=='GeneretiSendFrame')return;
 const previous=node.onConfigure;
 node.onConfigure=function(data){previous?.apply(this,arguments);
  // Early workflows omitted Comfy's automatic seed-control widget.
  const values=data?.widgets_values;
  if(Array.isArray(values)&&values.length>=7&&typeof values[5]==='number'){
   for(const [name,value] of [['control_after_generate','fixed'],['control_scale',values[5]],['options_json',values[6]]]){const widget=this.widgets.find(w=>w.name===name);if(widget)widget.value=value;}
  }
 };
}});
