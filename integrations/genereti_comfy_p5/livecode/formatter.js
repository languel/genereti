import {format} from 'prettier/standalone';
import * as babel from 'prettier/plugins/babel';
import * as estree from 'prettier/plugins/estree';
import * as html from 'prettier/plugins/html';
import * as markdown from 'prettier/plugins/markdown';
import {minify} from 'terser';
export function formatSource(source,mode){return format(source,{parser:mode==='html'?'html':mode==='markdown'?'markdown':'babel',plugins:[babel,estree,html,markdown],embeddedLanguageFormatting:'off',tabWidth:2,printWidth:80});}
export async function minifySource(source,mode){if(!['p5','three','strudel'].includes(mode))throw Error('Minify supports JavaScript modes only');return (await minify(source,{compress:false,mangle:false,format:{comments:false}})).code;}
