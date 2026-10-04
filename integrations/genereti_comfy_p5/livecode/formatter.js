import {format} from 'prettier/standalone';
import * as babel from 'prettier/plugins/babel';
import * as estree from 'prettier/plugins/estree';
import * as html from 'prettier/plugins/html';
import * as markdown from 'prettier/plugins/markdown';
import {minify} from 'terser';
import {parseParameters,prepareParameterSource} from '../web/js/code-parameters.js';
export function formatSource(source,mode){if(['glsl','latex','orca','tixy'].includes(mode))throw Error('Formatting is unavailable for this language; source left unchanged.');return format(source,{parser:['html','svg','hyperframes'].includes(mode)?'html':mode==='markdown'?'markdown':'babel',plugins:[babel,estree,html,markdown],embeddedLanguageFormatting:'off',tabWidth:2,printWidth:80});}
export async function minifySource(source,mode){
 if(!['p5','three','strudel','playcore','manim'].includes(mode))throw Error('Minify supports JavaScript modes only');
 const definitions=parseParameters(source);
 // Parameter declarations are functional metadata. Normalize them to a prelude
 // so collapsing source lines never removes their native Comfy sockets.
 const header=definitions.map(p=>`// @param ${p.name} = ${JSON.stringify(p.default)}${p.type==='boolean'?'':p.type==='string'?' (string)':` (${p.type==='int'?'int ':''}${p.min}..${p.max}, step:${p.step})`}`).join('\n');
 const program=prepareParameterSource(source,mode,definitions);
 const result=await minify(program,{module:['playcore','manim'].includes(mode),compress:false,mangle:false,format:{comments:false}});
 return (header?header+'\n':'')+result.code;
}
