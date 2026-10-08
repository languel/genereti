import {app} from '../../../scripts/app.js';
app.registerExtension({name:'Genereti.GenerateWidgetMigration',nodeCreated(node){
 if(node.comfyClass!=='GeneretiGenerate')return;
 const previous=node.onConfigure;
 node.onConfigure=function(data){previous?.apply(this,arguments);
  const values=data?.widgets_values;
  // Original examples omitted Comfy's seed-control widget, shifting strengths.
  if(Array.isArray(values)&&values.length>=7&&typeof values[5]==='number'){
   for(const [name,value] of [['control_after_generate','fixed'],['strength',values[5]],['control_scale',values[6]],['resolution','auto']]){
    const widget=this.widgets.find(w=>w.name===name);if(widget)widget.value=value;
   }
  }
 };
}});
