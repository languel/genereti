import {registerHelpView} from './help-panel.js';
import {loadReferences,referenceDefinitions,showReferenceDocument,showWelcome} from './node-reference.js';
import {buildReferenceIndex,searchReferences} from './reference-index.js';
import {guideMarkdown} from './guide-model.js';

function mount(host){
 const root=document.createElement('section');root.className='genereti-reference-contents';root.setAttribute('aria-label','Reference contents');
 const css=document.createElement('style');css.textContent=`
.genereti-reference-contents{display:flex;flex-direction:column;gap:8px;padding:12px;box-sizing:border-box;width:100%;height:100%;min-height:0}.genereti-reference-contents input,.genereti-reference-contents select{font:inherit;color:inherit;background:var(--comfy-input-bg,#303030);border:0;border-radius:6px;padding:8px;min-width:0}.genereti-reference-contents input:focus-visible,.genereti-reference-contents select:focus-visible{outline:1px solid currentColor}.genereti-reference-index{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:4px}.genereti-reference-index button{text-align:left;padding:10px!important;white-space:normal;overflow-wrap:anywhere}.genereti-reference-index button span{display:block;font-size:12px;opacity:.75;margin-top:3px}.genereti-reference-index button small{display:block;font-size:11px;opacity:.65;margin-top:4px}.genereti-reference-count{font-size:12px;opacity:.7}
`;document.head.append(css);
 const search=document.createElement('input');search.type='search';search.placeholder='Search references, lessons, tutorials…';search.setAttribute('aria-label','Search Genereti reference');
 const filter=document.createElement('select');filter.setAttribute('aria-label','Reference kind');for(const [value,label]of [['all','All contents'],['node','Nodes'],['lesson','Lessons'],['tutorial','Tutorials']]){const option=document.createElement('option');option.value=value;option.textContent=label;filter.append(option);}
 const count=document.createElement('div');count.className='genereti-reference-count';count.setAttribute('role','status');const results=document.createElement('div');results.className='genereti-reference-index';root.append(search,filter,count,results);host.append(root);
 let items=[],timer;
 function render(){results.replaceChildren();const matches=searchReferences(items,search.value,filter.value);count.textContent=`${matches.length} entries`;for(const item of matches){const button=document.createElement('button');button.type='button';const title=document.createElement('strong');title.textContent=item.title;const summary=document.createElement('span');summary.textContent=item.summary;const kind=document.createElement('small');kind.textContent=item.kind==='node'?item.category:[item.kind,item.guide?`${item.guide.steps.length} steps`:''].filter(Boolean).join(' · ');button.append(title,summary,kind);
  if(item.guide&&item.nodeTypes.length){const context=document.createElement('small');const names=referenceDefinitions();context.textContent='Uses '+item.nodeTypes.map(id=>names.find(n=>n.name===id)?.display_name||id).join(', ');button.append(context);}
  button.onclick=()=>item.id==='Welcome'?void showWelcome():showReferenceDocument({title:item.title,markdown:item.markdown||guideMarkdown(item.guide),...(item.kind==='node'?{nodeType:item.id}:{}),...(item.guide?{guideId:item.id}:{})});results.append(button);
 }if(!matches.length){const empty=document.createElement('p');empty.textContent='No matching references. Try a node name, control, or topic.';results.append(empty);}}
 async function refresh(){count.textContent='Loading contents…';try{const [documents,guides]=await Promise.all([loadReferences(),window.generetiGuides?.list?.()??Promise.resolve([])]);items=buildReferenceIndex(referenceDefinitions(),documents,guides);render();}catch(error){count.textContent=error.message;}}
 window.addEventListener('genereti-reference-catalog-changed',refresh);
 search.oninput=()=>{clearTimeout(timer);timer=setTimeout(render,120);};filter.onchange=render;void refresh();
}
registerHelpView('contents','Contents',mount);
