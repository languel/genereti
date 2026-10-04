import {Marked} from 'marked';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

const options={throwOnError:false,strict:'ignore',trust:false,maxExpand:1000};
export const mathDelimiters=[
 {left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},
 {left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}
];
export function formula(source,displayMode=true){return katex.renderToString(String(source),{...options,displayMode});}
// Marked extensions parse math where Markdown parses text: fenced/inline code
// and escaped dollar signs stay literal, instead of being rewritten by a regex.
const markdown=new Marked({extensions:[{
 name:'displayMath',level:'block',start:src=>src.search(/\$\$|\\\[/),
 tokenizer(src){const m=/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])(?:\n|$)/.exec(src);if(m)return {type:'displayMath',raw:m[0],text:m[1]??m[2]};},
 renderer:token=>formula(token.text,true)+'\n'
},{
 name:'inlineMath',level:'inline',start:src=>src.search(/\$|\\[([]/),
 tokenizer(src){const m=/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)((?:\\.|[^$\n])+?)(?<!\s)\$(?!\d))/.exec(src);if(m)return {type:'inlineMath',raw:m[0],text:m[1]??m[2]??m[3]??m[4],display:m[1]!==undefined||m[2]!==undefined};},
 renderer:token=>formula(token.text,token.display)
}]});
export function markdownWithMath(source){return markdown.parse(String(source),{async:false});}
export function ensureMathStyle(mathCss){if(!document.getElementById('genereti-math-style')){const style=document.createElement('style');style.id='genereti-math-style';style.textContent=mathCss;document.head.append(style);}}
export function renderHtmlMath(root){renderMathInElement(root,{...options,delimiters:mathDelimiters,ignoredTags:['script','noscript','style','textarea','pre','code','option'],ignoredClasses:['katex','genereti-no-math']});}
// Expose KaTeX to authored HTML as well as automatic delimiter rendering.
export {katex};
