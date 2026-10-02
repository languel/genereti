// Browser-local TypeScript language service: source never leaves this worker.
import ts from 'typescript';
let service, files, roots, versions={}, snapshots=new Map();
const sources={};
const init=(async()=>{
 const response=await fetch(new URL('./language-types.json',import.meta.url));if(!response.ok)throw Error('Language definitions unavailable');files=await response.json();
 files['/p5-environment.d.ts']='/// <reference path="/node_modules/@types/p5/global.d.ts" />\ndeclare const p: import("p5");';
 files['/three-environment.d.ts']='declare const THREE: typeof import("three");\ndeclare const scene: import("three").Scene;\ndeclare const camera: import("three").PerspectiveCamera;\ndeclare const renderer: import("three").WebGLRenderer;\ndeclare function tick(callback:(seconds:number)=>void):void;';
 const directories=new Set();for(const path of Object.keys(files)){let at=path.lastIndexOf('/');while(at>0){directories.add(path.slice(0,at));at=path.lastIndexOf('/',at-1);}}
 roots=['/node_modules/typescript/lib/lib.es2022.full.d.ts'];
 const host={getCompilationSettings:()=>({allowJs:true,checkJs:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.Node10,types:[],skipLibCheck:true,allowSyntheticDefaultImports:true}),getScriptFileNames:()=>roots,getScriptVersion:path=>String(versions[path]||0),getScriptSnapshot:path=>{const source=sources[path]??files[path];if(source===undefined)return;const cached=snapshots.get(path);if(cached?.source===source)return cached.snapshot;const snapshot=ts.ScriptSnapshot.fromString(source);snapshots.set(path,{source,snapshot});return snapshot;},getCurrentDirectory:()=> '/',getDefaultLibFileName:()=>'/node_modules/typescript/lib/lib.es2022.full.d.ts',fileExists:path=>path in files||path in sources,readFile:path=>sources[path]??files[path],directoryExists:path=>directories.has(path)||path==='/',getDirectories:()=>[],readDirectory:()=>[],useCaseSensitiveFileNames:()=>true};
 service=ts.createLanguageService(host,ts.createDocumentRegistry());
})();
const text=parts=>ts.displayPartsToString(parts||[]);
self.onmessage=async event=>{
 const {id,mode,source,pos,operation='completion',name}=event.data;
 try{await init;const path='/sketch.js';if(sources[path]!==source){sources[path]=source;versions[path]=(versions[path]||0)+1;}roots=['/node_modules/typescript/lib/lib.es2022.full.d.ts',`/${mode}-environment.d.ts`,path];
 let result;
 if(operation==='hover'){const info=service.getQuickInfoAtPosition(path,pos);result=info?{from:info.textSpan.start,to:info.textSpan.start+info.textSpan.length,signature:text(info.displayParts),description:text(info.documentation)}:null;}
 else if(operation==='detail'){const entry=service.getCompletionEntryDetails(path,pos,name,{},undefined,{},undefined);result=entry?{signature:text(entry.displayParts),description:text(entry.documentation)}:null;}
 else {const info=service.getCompletionsAtPosition(path,pos,{includeCompletionsForModuleExports:false,includeCompletionsWithInsertText:true});result=info?.entries.map(e=>({label:e.name,type:/method|function/.test(e.kind)?'function':/class/.test(e.kind)?'class':/const|enum/.test(e.kind)?'constant':'variable',apply:e.insertText||e.name,boost:5}))||[];}
 self.postMessage({id,result});
 }catch(error){self.postMessage({id,error:error.message});}
};
