// Presentation order must not change the positional contract of saved workflows.
export function previewFirst(node,widget){
 if(node._generetiPreviewFirstWidget===widget)return;node._generetiPreviewFirstWidget=widget;
 const canonical=[...node.widgets];
 node._generetiCanonicalWidgets??=canonical;
 const delivery=canonical.find(w=>w.name==='genereti_delivery');
 const rest=canonical.filter(w=>w!==widget&&w!==delivery),editor=w=>w.element?.querySelector('.cm-editor')||w.element?.classList.contains('genereti-livecode');
 node.widgets=[...(delivery?[delivery]:[]),widget,...rest.filter(w=>!editor(w)),...rest.filter(editor)];
 const configure=node.onConfigure;
 node.onConfigure=function(info){
  if(info?.widgets_values)canonical.forEach((w,i)=>{if(w!==widget&&i<info.widgets_values.length)w.value=info.widgets_values[i];});
  return configure?.apply(this,arguments);
 };
 const serialize=node.onSerialize;
 node.onSerialize=function(info){
  const displayed=info.widgets_values;
  if(displayed)info.widgets_values=[...canonical,...node.widgets.filter(w=>!canonical.includes(w))].map(w=>displayed[node.widgets.indexOf(w)]);
  return serialize?.apply(this,arguments);
 };
}
