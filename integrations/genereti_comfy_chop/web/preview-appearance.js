import {app} from '../../scripts/app.js';

const setting='Genereti.Preview.chopBackground';
function applyBackground(value){
 const color=typeof value==='string'&&CSS.supports('color',value)?value:'transparent';
 document.documentElement.style.setProperty('--genereti-chop-preview-background',color);
}
app.registerExtension({
 name:'Genereti.ChopPreviewAppearance',
 settings:[{id:setting,name:'CHOP preview background',category:['Genereti','Previews','CHOP preview background'],type:'text',defaultValue:'transparent',tooltip:'CSS color for CHOP, LFO, gesture, and signal analysis previews. Use transparent for frameless curves on the graph.',onChange:applyBackground}],
 setup(){
  const style=document.createElement('style');style.textContent='.genereti-chop-preview{background:var(--genereti-chop-preview-background,transparent);border:0;border-radius:0;box-shadow:none}';document.head.append(style);
  applyBackground(app.ui.settings.getSettingValue(setting,'transparent'));
 }
});
