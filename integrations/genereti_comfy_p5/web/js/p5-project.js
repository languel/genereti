import {parseParameters,parameterValues,prepareParameterSource} from './code-parameters.js';
export const P5_VERSIONS=['2.3.4','1.11.11'];
export function p5Assets(options={}) {
 const version=P5_VERSIONS.includes(options.version)?options.version:P5_VERSIONS[0];
 if(options.brush&&version.startsWith('1.'))throw Error('p5.brush requires p5 2.x and a WEBGL canvas');
 return {version,files:[{name:'p5.min.js',path:version.startsWith('2.')?'lib/p5-2.min.js':'p5.min.js',license:version.startsWith('2.')?'lib/p5-2-LICENSE':'lib/p5-1-LICENSE'},
 ...(options.sound?[{name:'p5.sound.min.js',path:'lib/p5.sound.min.js',license:'lib/p5.sound-LICENSE'}]:[]),
 ...(options.brush?[{name:'p5.brush.js',path:'lib/p5.brush.js',license:'lib/p5.brush-LICENSE'}]:[]),
 ...String(options.libraries||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map((url,index)=>{if(!/^(https?:\/\/|\/(?!\/))/.test(url))throw Error('Library URLs must be HTTP(S) or a local absolute path');return {name:`custom-${index+1}.js`,path:url,custom:true};})]};
}
export function projectFiles({source='',parameters={},assets=[],version=P5_VERSIONS[0],width=512,height=512}) {
 const values=parameterValues(parseParameters(source),parameters);
 const compiled=prepareParameterSource(source,'p5');
 const files={
  'index.html':`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>p5 sketch</title><link rel="stylesheet" href="style.css">\n${assets.map(a=>`<script src="libraries/${a.name}"></script>`).join('\n')}\n</head><body><main></main><script src="genereti-bridge.js"></script><script src="sketch.js"></script></body></html>\n`,
  'style.css':'html,body{margin:0;padding:0;background:#111}canvas{display:block;max-width:100%;height:auto}\n',
  'sketch.js':Object.entries(values).map(([name,value])=>`let ${name} = ${JSON.stringify(value)};`).join('\n')+'\n'+compiled+'\n',
  'sketch-source.js':source,
  'genereti-bridge.js':`// Standalone defaults; connect your own data source here.\nwindow.inputImage=null;\nwindow.__={params:${JSON.stringify(values)},image:null,inputSize:{width:0,height:0},streams:{list:()=>[],read:()=>null},regions:{list:()=>[],read:()=>null},events:{on:()=>()=>{},emit:()=>{}},controls:{},time:0,delta:0};\n`,
  'project.json':JSON.stringify({format:'genereti-p5-project',version:1,p5:version,width,height,libraries:assets.map(({name,path})=>({name,source:path})),parameters:values},null,2)+'\n',
  'README.md':'# p5 project\n\nServe this folder locally (for example: python3 -m http.server 8000), then open http://localhost:8000.\nindex.html, style.css, sketch.js and vendored libraries are editable. sketch-source.js preserves the original Livecode annotations.\n\nComfy image inputs, MediaPipe providers, events, connected controls and external media are not included. genereti-bridge.js provides empty standalone defaults; replace them with your own source. Sketches requiring those streams need that source to animate.\nAudio starts only through your sketch\'s user gesture. Library versions and parameter values are recorded in project.json; licenses accompany their libraries. Add the licenses for any custom libraries yourself.\n',
 };
 for(const asset of assets){files['libraries/'+asset.name]=asset.source;if(asset.licenseText)files['libraries/'+asset.name+'.LICENSE']=asset.licenseText;}
 return files;
}
