import {validateGuideStyle} from './guide-style.js';
const parts=new Set(['node','code','preview','toolbar','parameter']);
const checks=new Set(['changed-widget','connected-input','overlay-open','backdrop-open','preview-frozen']);
export function validateGuide(input){
 if(input?.format!=='genereti-guide'||input.version!==1||!Array.isArray(input.steps)||!input.steps.length||input.steps.length>100)throw Error('Expected genereti-guide v1 with 1..100 steps');
 const text=(value,max=4000)=>{if(typeof value!=='string'||value.length>max)throw Error('Invalid guide text');return value;};
 const target=value=>{if(!value||typeof value!=='object'||!parts.has(value.part??'node'))throw Error('Invalid semantic target');if(typeof value.nodeType!=='string'||value.nodeType.length>100)throw Error('Target requires a node type');return {nodeType:value.nodeType,part:value.part??'node',...(value.widget?{widget:text(value.widget,100)}:{})};};
 return {format:'genereti-guide',version:1,id:text(input.id,100),title:text(input.title,200),summary:text(input.summary??'',1000),...(input.style?{style:validateGuideStyle(input.style)}:{}),steps:input.steps.map(step=>{const out={title:text(step.title,200),text:text(step.text)};if(step.style)out.style=validateGuideStyle(step.style);if(step.target)out.target=target(step.target);if(step.check){if(!checks.has(step.check.kind))throw Error('Unknown learner check');out.check={kind:step.check.kind,...(step.check.input?{input:text(step.check.input,100)}:{})};}return out;})};
}
export function guideMarkdown(guide){return `# ${guide.title}\n\n${guide.summary}\n\n`+guide.steps.map((step,i)=>`## ${i+1}. ${step.title}\n\n${step.text}\n${step.target?'\nFocus: `'+step.target.nodeType+'` · '+step.target.part+'\n':''}${step.check?'\nLearner check: '+step.check.kind+'\n':''}`).join('\n');}
