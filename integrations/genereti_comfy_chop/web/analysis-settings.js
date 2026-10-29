// Older running servers and saved nodes may lack newly added analysis widgets.
// Keep edits in workflow properties until those widgets become available.
export function analysisSettings(node){return node.properties?.genereti_analysis_settings??{};}
export function saveAnalysisSetting(node,name,value){
 const widget=node.widgets?.find(w=>w.name===name);
 if(widget){widget.value=value;widget.callback?.(value);}
 else{node.properties??={};node.properties.genereti_analysis_settings??={};node.properties.genereti_analysis_settings[name]=value;}
 node.graph?.change?.();node.setDirtyCanvas?.(true,true);
}
export function hydrateAnalysisSettings(node){
 const saved=analysisSettings(node);
 for(const [name,value] of Object.entries(saved))if(node.widgets?.some(w=>w.name===name)){saveAnalysisSetting(node,name,value);delete saved[name];}
}
