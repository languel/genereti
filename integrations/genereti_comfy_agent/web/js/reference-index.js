const inline=value=>'`'+String(value??'').replaceAll('`','').replaceAll('\n',' ')+'`';
const cell=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
function type(value){return Array.isArray(value)?'choice':String(value??'');}
export function buildNodeReference(definition){
 const label=definition.display_name||definition.name;
 let markdown=`# ${label}\n\n${definition.description||'Detailed guide in progress.'}\n\n## Quickref\n\nThis page lists the installed node’s interface. A detailed usage guide and examples will be added here.\n`;
 const inputs=Object.entries(definition.input??{}).flatMap(([group,fields])=>['required','optional'].includes(group)?Object.entries(fields).map(([name,spec])=>({name,spec,group})):[]);
 if(inputs.length){markdown+='\n## Inputs and controls\n\n| Name | Type | Default | Notes |\n| --- | --- | --- | --- |\n';for(const {name,spec,group}of inputs){const options=spec[1]??{},notes=[group==='optional'?'Optional':'',options.tooltip,options.min!==undefined&&options.max!==undefined?`Range ${options.min}…${options.max}`:''].filter(Boolean).join(' · ');markdown+=`| ${cell(inline(name))} | ${cell(type(spec[0]))} | ${cell(options.default===undefined?'':inline(options.default))} | ${cell(notes)} |\n`;}}
 if(definition.output?.length){markdown+='\n## Outputs\n\n| Name | Type |\n| --- | --- |\n';definition.output.forEach((output,i)=>{markdown+=`| ${cell(inline(definition.output_name?.[i]||String(output).toLowerCase()))} | ${cell(output)} |\n`;});}
 markdown+=`\n## Identity\n\nNode type: ${inline(definition.name)}\n\nCategory: ${inline(definition.category||'Genereti')}\n`;
 return markdown;
}
export function buildReferenceIndex(definitions,documents,guides){
 const items=[{id:'Welcome',kind:'overview',title:'Welcome to ꘇ Genereti',summary:'Project overview and getting started',markdown:documents.Welcome||''}];
 for(const definition of definitions){if(!definition.name?.startsWith('Genereti'))continue;items.push({id:definition.name,kind:'node',title:definition.display_name||definition.name,summary:definition.description||'Quickref · detailed guide in progress',category:definition.category||'',markdown:documents[definition.name]||buildNodeReference(definition)});}
 for(const guide of guides)items.push({id:guide.id,kind:guide.steps.some(step=>step.actions?.length)?'tutorial':'lesson',title:guide.title,summary:guide.summary,guide,nodeTypes:[...new Set(guide.steps.map(step=>step.target?.nodeType).filter(Boolean))]});
 return items;
}
export function searchReferences(items,query='',kind='all'){
 const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return items.filter(item=>(kind==='all'||item.kind===kind)&&terms.every(term=>[item.title,item.id,item.summary,item.category,item.markdown,...(item.nodeTypes??[]),...(item.guide?.steps.map(step=>`${step.title} ${step.text} ${step.hint??''}`)??[])].join(' ').toLocaleLowerCase().includes(term)));
}
