import {app} from '/scripts/app.js';
import {installHelpSidebarButton} from './help-sidebar.js';

// One owner for sidebar layout, floating placement and tab visibility. Views
// retain their DOM across tab switches so conversations and guides survive.
export const helpSidebarID='genereti-assistant';
const views=new Map();
let panel,content,tabs,dockButton,sidebarHost,active='reference',docked=true;
export function registerHelpView(id,label,render){views.set(id,{label,render});if(panel)buildTabs();}
export function helpViewHost(id){
 mount();const view=views.get(id);if(!view)throw Error(`Help view unavailable: ${id}`);
 if(!view.host){view.host=document.createElement('div');view.host.className='genereti-help-view';view.host.id=`genereti-help-${id}`;view.host.setAttribute('role','tabpanel');view.host.setAttribute('aria-labelledby',`genereti-help-tab-${id}`);content.append(view.host);view.render(view.host);}
 view.host.hidden=active!==id;return view.host;
}
function select(id){active=id;helpViewHost(id);for(const [key,view] of views){if(view.host)view.host.hidden=key!==id;view.tab?.setAttribute('aria-selected',String(key===id));if(view.tab)view.tab.tabIndex=key===id?0:-1;}}
export function showHelpView(id){mount();panel.hidden=false;select(id);place();if(docked&&app.extensionManager.sidebarTab.activeSidebarTabId!==helpSidebarID)app.extensionManager.sidebarTab.toggleSidebarTab(helpSidebarID);}
export function isHelpPanelOpen(){return !!panel&&!panel.hidden&&(!docked||app.extensionManager.sidebarTab.activeSidebarTabId===helpSidebarID);}
export function closeHelpPanel(){if(!panel)return;panel.hidden=true;if(docked&&app.extensionManager.sidebarTab.activeSidebarTabId===helpSidebarID)app.extensionManager.sidebarTab.toggleSidebarTab(helpSidebarID);}
function place(){panel.classList.toggle('genereti-help-docked',docked);panel.setAttribute('role',docked?'region':'dialog');dockButton.title=docked?'Float help panel':'Dock help panel';dockButton.setAttribute('aria-label',dockButton.title);dockButton.setAttribute('aria-pressed',String(docked));(docked?(sidebarHost||document.body):document.body).append(panel);}
function clamp(){if(docked||!panel?.style.left)return;const r=panel.getBoundingClientRect();panel.style.left=Math.max(0,Math.min(parseFloat(panel.style.left),innerWidth-r.width))+'px';panel.style.top=Math.max(0,Math.min(parseFloat(panel.style.top),innerHeight-r.height))+'px';}
function orderedViews(){return [...views].sort(([a],[b])=>['reference','contents','assistant'].indexOf(a)-['reference','contents','assistant'].indexOf(b));}
function buildTabs(){tabs.replaceChildren();for(const [id,view] of orderedViews()){const button=document.createElement('button');button.type='button';button.id=`genereti-help-tab-${id}`;button.textContent=view.label;button.setAttribute('role','tab');button.setAttribute('aria-controls',`genereti-help-${id}`);button.setAttribute('aria-selected',String(active===id));button.tabIndex=active===id?0:-1;button.onclick=()=>select(id);button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const ids=orderedViews().map(([id])=>id),index=ids.indexOf(id),next=event.key==='Home'?0:event.key==='End'?ids.length-1:(index+(event.key==='ArrowRight'?1:-1)+ids.length)%ids.length;select(ids[next]);views.get(ids[next]).tab.focus();};view.tab=button;tabs.append(button);}}
function mount(){
 if(panel)return;
 const css=document.createElement('style');css.textContent=`
.genereti-help{position:fixed;right:24px;top:90px;width:min(520px,calc(100vw - 48px));height:min(680px,calc(100vh - 120px));display:flex;flex-direction:column;background:var(--comfy-menu-bg,#262626);color:var(--fg-color,#eee);border:1px solid var(--border-color,#555);border-radius:12px;box-shadow:0 8px 28px #0006;z-index:1100;font:14px/1.5 system-ui;box-sizing:border-box;overflow:hidden;min-width:0}
.genereti-help[hidden],.genereti-help [hidden]{display:none!important}
.genereti-help-header{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:move;touch-action:none;flex:none}
.genereti-help-header strong{flex:1}.genereti-help button{font:inherit;color:inherit;border:0;border-radius:6px;background:transparent;cursor:pointer;padding:6px 10px}.genereti-help button:hover,.genereti-help [role=tab][aria-selected=true]{background:color-mix(in srgb,currentColor 10%,transparent)}.genereti-help button:focus-visible{outline:1px solid currentColor}
.genereti-help-tabs{display:flex;gap:4px;padding:0 12px 8px;flex:none;border-bottom:1px solid var(--border-color,#555)}
.genereti-help-content,.genereti-help-view{flex:1;min-height:0;width:100%;display:flex;overflow:hidden}.genereti-help-content{position:relative}
.genereti-help-docked{position:relative!important;inset:auto!important;width:100%!important;height:100%!important;max-height:100%!important;border:0;border-radius:0;box-shadow:none;z-index:auto}.genereti-help-docked .genereti-help-header{cursor:default}
`;document.head.append(css);
 panel=document.createElement('section');panel.className='genereti-help';panel.hidden=true;panel.setAttribute('aria-label','Genereti help');
 const header=document.createElement('div');header.className='genereti-help-header';const title=document.createElement('strong');title.textContent='ꘇ Help';
 dockButton=document.createElement('button');dockButton.type='button';dockButton.textContent='▥';dockButton.onclick=()=>{docked=!docked;place();if(docked)showHelpView(active);else if(app.extensionManager.sidebarTab.activeSidebarTabId===helpSidebarID)app.extensionManager.sidebarTab.toggleSidebarTab(helpSidebarID);clamp();};
 const close=document.createElement('button');close.type='button';close.textContent='×';close.title='Close help panel';close.setAttribute('aria-label',close.title);close.onclick=closeHelpPanel;header.append(title,dockButton,close);
 header.onpointerdown=event=>{if(docked||event.button!==0||event.target.closest('button'))return;const rect=panel.getBoundingClientRect(),x=event.clientX,y=event.clientY;header.setPointerCapture(event.pointerId);event.preventDefault();panel.style.right='auto';panel.style.left=rect.left+'px';panel.style.top=rect.top+'px';const move=e=>{panel.style.left=rect.left+e.clientX-x+'px';panel.style.top=rect.top+e.clientY-y+'px';clamp();};const end=e=>{header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);if(header.hasPointerCapture(e.pointerId))header.releasePointerCapture(e.pointerId);};header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);};
 tabs=document.createElement('div');tabs.className='genereti-help-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Help views');content=document.createElement('div');content.className='genereti-help-content';panel.append(header,tabs,content);buildTabs();place();
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeHelpPanel();}},true);
 panel.addEventListener('wheel',e=>e.stopPropagation());panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')closeHelpPanel();});window.addEventListener('resize',clamp);
}
app.registerExtension({name:'Genereti.HelpPanel',setup(){app.extensionManager.registerSidebarTab({id:helpSidebarID,icon:'pi pi-book',title:'ꘇ Help',tooltip:'Genereti reference and assistant',type:'custom',render(host){mount();sidebarHost=host;host.style.cssText='height:100%;width:100%;min-height:0;overflow:hidden';docked=true;panel.hidden=false;place();select(active);}});installHelpSidebarButton();}});
