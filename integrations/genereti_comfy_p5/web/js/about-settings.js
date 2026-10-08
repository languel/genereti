import {app} from '../../../scripts/app.js';
import {api} from '../../../scripts/api.js';

export function versionLabel(info){
 const parts=[`ꘇ Genereti ${info.version}`];
 if(info.kind==='checkout')parts.push(info.branch==='dev'?'dev branch':`${info.branch||'unknown branch'} checkout`);
 else parts.push(info.kind==='release'?'release':info.kind==='preview'?'preview package':'package');
 if(info.revision)parts.push(info.revision.slice(0,7));
 if(info.dirty)parts.push('local changes');
 return parts.join(' · ');
}
function about(){
 const root=document.createElement('div');root.className='genereti-about';
 root.style.cssText='display:flex;flex-direction:column;gap:8px;min-width:0';
 const link=document.createElement('a');link.href='https://github.com/languel/genereti';link.target='_blank';link.rel='noopener noreferrer';link.textContent='ꘇ Genereti · GitHub';
 link.style.cssText='color:var(--p-primary-color,var(--input-text));text-decoration:none;font-weight:600';
 const status=document.createElement('div');status.textContent='Reading installed version…';status.setAttribute('role','status');
 const path=document.createElement('div');path.style.cssText='font-size:12px;opacity:.7;overflow-wrap:anywhere';
 root.append(link,status,path);
 api.fetchApi('/genereti/about',{cache:'no-store'}).then(async response=>{
  if(!response.ok)throw Error('Version endpoint unavailable');
  const info=await response.json();status.textContent=versionLabel(info);
  if(info.revision){link.href=`${info.repository}/tree/${info.revision}`;link.title='Open this source revision on GitHub';}
  path.textContent=`Loaded from ${info.path}`;
  if(info.restartRequired){const notice=document.createElement('div');notice.textContent='Source changed since startup · restart Comfy to load it';root.append(notice);}
  if(info.kind==='checkout'&&info.upstreamRevision&&info.upstreamRevision!==info.revision){
   const upstream=document.createElement('div');upstream.textContent=`Upstream ${info.upstreamRevision.slice(0,7)} · checkout differs`;upstream.title='Locally recorded upstream revision; no network lookup';root.append(upstream);
  }
 }).catch(()=>{status.textContent='Version unavailable · restart Comfy to load the About endpoint';});
 return root;
}
function editorDisclosure(){
 let open=false;
 const enhance=()=>{
  for(const row of document.querySelectorAll('[data-setting-id^="Genereti.Editor."]')){
   const group=row.closest('.setting-group');if(!group)continue;
   const heading=group.querySelector('h3');if(!heading||heading.textContent.trim()!=='Editor')continue;
   if(heading.querySelector('button'))continue;
   const button=document.createElement('button');button.type='button';button.style.cssText='border:0;background:none;color:inherit;font:inherit;padding:0;cursor:pointer';
   const update=()=>{button.textContent=`${open?'⌄':'›'} Editor`;button.setAttribute('aria-expanded',String(open));for(const item of group.querySelectorAll('.setting-item'))item.hidden=!open;};
   button.addEventListener('click',()=>{open=!open;update();});heading.replaceChildren(button);update();
  }
 };
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
}
app.registerExtension({name:'Genereti.About',setup:editorDisclosure,settings:[{
 id:'Genereti.About.Version',name:'Installation',category:['Genereti','About','Version'],sortOrder:500,type:about,defaultValue:null,
 tooltip:'Version and source identity from the Genereti backend loaded by this Comfy instance.',
}]});
