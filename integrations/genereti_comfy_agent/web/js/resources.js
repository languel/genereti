// Local Comfy library discovery; references never accept arbitrary URLs/paths.
export const referenceToken=(kind,id)=>`@${kind}:${JSON.stringify(id)}`;
export function parseReferences(text){
 const result=[];
 for(const match of text.matchAll(/@(asset|workflow|template):("(?:[^"\\]|\\.)*"|[^\s,;!?]+)/g)){
  const id=match[2].startsWith('"')?JSON.parse(match[2]):match[2];
  if(!result.some(r=>r.kind===match[1]&&r.id===id))result.push({kind:match[1],id});
 }
 return result;
}
export function createResources({fetcher=globalThis.fetch}={}){
 const records=new Map(),cache=new Map();
 const key=(kind,id)=>`${kind}:${id}`;
 const media=name=>/\.(png|jpe?g|webp|gif|avif|bmp|tiff?)$/i.test(name)?'image':/\.(mp4|webm|mov|mkv)$/i.test(name)?'video':/\.(wav|mp3|flac|ogg|m4a)$/i.test(name)?'audio':null;
 function path(value){if(typeof value!=='string'||!value||value.includes('\\')||value.startsWith('/')||value.split('/').some(s=>s==='..'||s==='.')||/[\x00-\x1f]/.test(value))throw Error('Invalid library path');return value;}
 async function json(url,optional=false){const r=await fetcher(url);if(!r.ok){if(optional&&[404,503].includes(r.status))return null;throw Error(`Library HTTP ${r.status}: ${url}`);}return r.json();}
 function put(item){records.set(key(item.kind,item.id),item);return item;}
 function fileAsset(file){
  const name=path(file.filename),subfolder=file.subfolder?path(file.subfolder):'',type=['input','output','temp'].includes(file.type)?file.type:'input';
  if(!media(name))return null;
  const relative=subfolder?`${subfolder}/${name}`:name;
  return put({kind:'asset',id:`${type}/${relative}`,name:relative,mediaType:media(name),type,filename:name,subfolder,url:`/view?${new URLSearchParams({filename:name,subfolder,type})}`,source:'files'});
 }
 async function assets(){
  const items=[],warnings=[];
  const modern=await json('/api/assets?limit=100&tags_any=input,output,temp',true);
  if(modern){
   for(const a of modern.assets||[]){
    if(!media(a.name)||!(a.tags||[]).some(t=>['input','output','temp'].includes(t)))continue;
    const item=put({kind:'asset',id:a.id,name:a.name,mediaType:media(a.name),size:a.size,type:(a.tags||[]).find(t=>['input','output','temp'].includes(t)),url:a.preview_url,source:'assets',assetHash:a.hash});items.push(item);
   }
   if(modern.has_more)warnings.push('Asset API returned the first 100 media assets; refine in the native asset browser for older items.');
  }else warnings.push('Native asset API unavailable; showing loader-listed inputs and recent outputs.');
  const catalog=await json('/object_info');
  for(const schema of Object.values(catalog))for(const section of ['required','optional'])for(const [name,definition] of Object.entries(schema.input?.[section]||{})){
   if(!Array.isArray(definition?.[0])||!(/image|audio|video|file/i.test(name)||definition?.[1]?.image_upload))continue;
   for(const filename of definition[0])if(typeof filename==='string'&&media(filename)){
    try{const parts=filename.split('/'),item=fileAsset({filename:parts.pop(),subfolder:parts.join('/'),type:'input'});if(item)items.push(item);}catch{}
   }
  }
  const history=await json('/history?max_items=50',true);
  for(const job of Object.values(history||{}))for(const output of Object.values(job.outputs||{}))for(const name of ['images','audio','videos','gifs'])for(const file of output[name]||[]){try{const item=fileAsset(file);if(item)items.push(item);}catch{}}
  return {items:[...new Map(items.map(a=>[a.id,a])).values()],warnings};
 }
 async function workflows(){const files=await json('/userdata?dir=workflows&recurse=true',true);return {items:(files||[]).filter(f=>typeof f==='string'&&f.endsWith('.json')).map(f=>put({kind:'workflow',id:path(f),name:f,url:`/userdata/${encodeURIComponent('workflows/'+f)}`})),warnings:[]};}
 async function templates(){
  const index=await json('/templates/index.json',true),custom=await json('/workflow_templates',true),items=[];
  for(const category of index||[])for(const t of category.templates||[])items.push(put({kind:'template',id:`default/${path(t.name)}`,name:t.title||t.name,description:t.description,models:t.models,tags:t.tags,io:t.io,openSource:t.openSource,url:`/templates/${encodeURIComponent(t.name)}.json`}));
  for(const [module,names] of Object.entries(custom||{}))for(const name of names)items.push(put({kind:'template',id:`${path(module)}/${path(name)}`,name,source:module,url:`/workflow_templates/${encodeURIComponent(module)}/${encodeURIComponent(name)}.json`}));
  return {items,warnings:index?[]:['Core template index unavailable.']};
 }
 async function list({kind='all',query='',offset=0,limit=30,refresh=false}={}){
  if(!['all','asset','workflow','template'].includes(kind))throw Error('Unknown library kind');
  const kinds=kind==='all'?['asset','workflow','template']:[kind],warnings=[],items=[];
  for(const k of kinds){
   if(refresh)cache.delete(k);
   if(!cache.has(k))cache.set(k,({asset:assets,workflow:workflows,template:templates}[k])().catch(error=>{cache.delete(k);return {items:[],warnings:[`${k}: ${error.message}`]};}));
   const data=await cache.get(k);items.push(...data.items);warnings.push(...data.warnings);
  }
  const q=String(query).toLowerCase(),filtered=items.filter(i=>[i.id,i.name,i.description,...(i.tags||[])].join(' ').toLowerCase().includes(q));
  offset=Math.max(0,Number(offset)||0);limit=Math.min(100,Math.max(1,Number(limit)||30));
  return {items:filtered.slice(offset,offset+limit).map(({url,...i})=>({...i,reference:referenceToken(i.kind,i.id)})),total:filtered.length,hasMore:offset+limit<filtered.length,warnings};
 }
 async function resolve(kind,id){if(!records.has(key(kind,id)))await list({kind});const item=records.get(key(kind,id));if(!item)throw Error(`Unknown ${kind} reference ${id}; use library_search`);return item;}
 function scrub(value){
  if(Array.isArray(value))return value.map(scrub);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!/(api.?key|password|token|secret)/i.test(k)).map(([k,v])=>[k,scrub(v)]));
  return typeof value==='string'?(value.startsWith('data:')?'[embedded data omitted]':value.slice(0,24000)):value;
 }
 async function document(kind,id){if(kind==='asset')throw Error('Asset has metadata, not workflow JSON');const item=await resolve(kind,id),data=await json(item.url);if(!Array.isArray(data?.nodes))throw Error('This item is not a Comfy graph workflow');return {item,data};}
 async function read({kind,id}){const item=await resolve(kind,id);if(kind==='asset')return {...item,reference:referenceToken(kind,id),visionIncluded:false};const {data}=await document(kind,id);return {...item,reference:referenceToken(kind,id),workflow:scrub(data)};}
 async function inputFile(id){
  const item=await resolve('asset',id);
  if(item.source==='files'&&item.type==='input')return item.subfolder?`${item.subfolder}/${item.filename}`:item.filename;
  const url=new URL(item.url||'',globalThis.location?.origin||'http://localhost');
  if(url.origin!==(globalThis.location?.origin||'http://localhost')||!['/view','/api/view'].includes(url.pathname))throw Error('Asset has no local file preview URL');
  if(url.searchParams.get('type')==='input')return [url.searchParams.get('subfolder'),url.searchParams.get('filename')].filter(Boolean).join('/');
  const r=await fetcher(url.pathname+url.search);if(!r.ok)throw Error('Asset file unavailable');
  const form=new FormData();form.append('image',await r.blob(),item.name.split('/').pop());form.append('type','input');form.append('overwrite','false');
  const uploaded=await fetcher('/upload/image',{method:'POST',body:form});if(!uploaded.ok)throw Error('Unable to copy asset into inputs');const f=await uploaded.json();cache.delete('asset');return f.subfolder?`${f.subfolder}/${f.name}`:f.name;
 }
 return {list,resolve,read,document,inputFile};
}
