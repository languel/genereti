(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const jr=new URLSearchParams(location.search),Zt=(jr.get("ns")||"ams-embed").replace(/[^a-zA-Z0-9_.-]/g,""),Ge=(()=>{try{const n=window.localStorage;return n.getItem("x"),n}catch{return null}})(),xn=new Map,St=n=>`${Zt}:${n}`,si={getItem:n=>{try{return Ge?Ge.getItem(St(n)):xn.get(St(n))??null}catch{return null}},setItem:(n,e)=>{try{Ge?Ge.setItem(St(n),String(e)):xn.set(St(n),String(e))}catch{}},removeItem:n=>{try{Ge?Ge.removeItem(St(n)):xn.delete(St(n))}catch{}},key:n=>_n()[n]??null,clear:()=>{for(const n of _n())si.removeItem(n)},get length(){return _n().length}};function _n(){return(Ge?Array.from({length:Ge.length},(e,t)=>Ge.key(t)):[...xn.keys()]).filter(e=>e?.startsWith(`${Zt}:`)).map(e=>e.slice(Zt.length+1))}Object.defineProperty(window,"localStorage",{configurable:!0,get:()=>si});if(typeof IDBFactory<"u"){const n=IDBFactory.prototype.open,e=IDBFactory.prototype.deleteDatabase;IDBFactory.prototype.open=function(t,...o){return n.call(this,`${Zt}:${t}`,...o)},IDBFactory.prototype.deleteDatabase=function(t,...o){return e.call(this,`${Zt}:${t}`,...o)}}const Fr="modulepreload",_r=function(n,e){return new URL(n,e).href},Vs={},Ve=function(e,t,o){let i=Promise.resolve();if(t&&t.length>0){let r=function(c){return Promise.all(c.map(h=>Promise.resolve(h).then(u=>({status:"fulfilled",value:u}),u=>({status:"rejected",reason:u}))))};const a=document.getElementsByTagName("link"),l=document.querySelector("meta[property=csp-nonce]"),d=l?.nonce||l?.getAttribute("nonce");i=r(t.map(c=>{if(c=_r(c,o),c in Vs)return;Vs[c]=!0;const h=c.endsWith(".css"),u=h?'[rel="stylesheet"]':"";if(!!o)for(let m=a.length-1;m>=0;m--){const b=a[m];if(b.href===c&&(!h||b.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${u}`))return;const p=document.createElement("link");if(p.rel=h?"stylesheet":Fr,h||(p.as="script"),p.crossOrigin="",p.href=c,d&&p.setAttribute("nonce",d),document.head.appendChild(p),h)return new Promise((m,b)=>{p.addEventListener("load",m),p.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return i.then(r=>{for(const a of r||[])a.status==="rejected"&&s(a.reason);return e().catch(s)})},M=(n,e={},...t)=>{const o=document.createElement(n);for(const[i,s]of Object.entries(e||{}))s==null||s===!1||(i==="class"?o.className=s:i==="html"?o.innerHTML=s:i.startsWith("on")?o.addEventListener(i.slice(2),s):i==="style"&&typeof s=="object"?Object.assign(o.style,s):o.setAttribute(i,s===!0?"":s));for(const i of t.flat())i!=null&&i!==!1&&o.append(i instanceof Node?i:document.createTextNode(String(i)));return o},Ys=n=>String(n??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function le({value:n,min:e=-1/0,max:t=1/0,step:o=1,def:i=n,title:s="",onChange:r}){const a=M("input",{type:"number",class:"wb-num",value:String(n),min:e,max:t,step:o,title:s}),l=h=>Math.min(t,Math.max(e,h)),d=h=>Math.round(h/o)*o,c=(h,u)=>{const f=+l(d(h)).toFixed(6);a.value=String(f),r?.(f,{final:u})};return a.addEventListener("change",()=>{const h=Number(a.value);Number.isFinite(h)&&c(h,!0)}),a.addEventListener("keydown",h=>{h.key==="Backspace"&&h.shiftKey&&(h.preventDefault(),c(i,!0)),(h.key==="Enter"||h.key==="Escape")&&a.blur(),h.stopPropagation()}),a.addEventListener("pointerdown",h=>{if(document.activeElement===a)return;h.preventDefault();const u=h.clientX,f=Number(a.value)||0;let p=!1;const m=g=>{const w=g.clientX-u;!p&&Math.abs(w)<3||(p=!0,c(f+w*o*(g.shiftKey?.1:1),!1))},b=()=>{window.removeEventListener("pointermove",m),window.removeEventListener("pointerup",b),p?r?.(Number(a.value),{final:!0}):(a.focus(),a.select())};window.addEventListener("pointermove",m),window.addEventListener("pointerup",b)}),a}function ge(n,e,t,o=""){const i=M("select",{class:"wb-select",title:o});for(const[s,r]of n)i.append(M("option",{value:s,selected:s===e},r));return i.addEventListener("change",()=>{t(i.value),i.blur()}),i}const X=(n,e,t="")=>M("label",{class:"wb-row",title:t},M("span",{class:"wb-row-label"},n),e);function ce(n,e=!0,...t){const o=M("details",{class:"wb-section",open:e});return o.append(M("summary",{},n),...t.filter(i=>i!=null&&i!==!1)),o}function Se(n,e,t){const o=n instanceof Blob?n:new Blob([n],{type:t}),i=URL.createObjectURL(o),s=M("a",{href:i,download:e});document.body.append(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(i),2e3)}function Wn(n,e="image/png",t){const o=n.toDataURL(e,t),i=atob(o.slice(o.indexOf(",")+1)),s=new Uint8Array(i.length);for(let r=0;r<i.length;r++)s[r]=i.charCodeAt(r);return new Blob([s],{type:e})}typeof document<"u"&&!globalThis.__amsNumDrag&&(globalThis.__amsNumDrag=!0,document.addEventListener("pointerdown",n=>{const e=n.target;if(!(n.metaKey||n.ctrlKey)||!(e instanceof HTMLInputElement)||e.type!=="number"||e.disabled)return;n.preventDefault(),n.stopImmediatePropagation();const t=(u,f)=>u===""||!Number.isFinite(Number(u))?f:Number(u),o=t(e.min,-1/0),i=t(e.max,1/0),s=e.step==="any"?.01:t(e.step,1),r=(String(s).split(".")[1]||"").length,a=n.clientX,l=t(e.value,0);let d=!1;document.body.style.cursor="ew-resize";const c=u=>{const f=u.clientX-a;if(!d&&Math.abs(f)<2)return;d=!0;const p=Math.min(i,Math.max(o,Math.round((l+f*s*(u.shiftKey?.1:1))/s)*s));e.value=String(+p.toFixed(r+1)),e.dispatchEvent(new Event("input",{bubbles:!0}))},h=()=>{window.removeEventListener("pointermove",c,!0),window.removeEventListener("pointerup",h,!0),document.body.style.cursor="",d&&e.dispatchEvent(new Event("change",{bubbles:!0}))};window.addEventListener("pointermove",c,!0),window.addEventListener("pointerup",h,!0)},!0));if(typeof Element<"u"&&!Element.prototype.__amsSkipEmpty){Element.prototype.__amsSkipEmpty=!0;for(const n of["append","replaceChildren","prepend"]){const e=Element.prototype[n];Element.prototype[n]=function(...t){return e.apply(this,t.filter(o=>o!=null&&o!==!1))}}}function as(n,e,t=n.textContent,o=null){if(!n||n.isContentEditable)return;const i=t;n.textContent=t,n.contentEditable="plaintext-only",n.spellcheck=!1,n.classList.add("wb-editing"),n.focus();const s=document.createRange();s.selectNodeContents(n);const r=window.getSelection();r.removeAllRanges(),r.addRange(s);let a=!1;const l=h=>{if(a)return;a=!0,n.contentEditable="false",n.classList.remove("wb-editing"),n.removeEventListener("keydown",d),n.removeEventListener("blur",c);const u=n.textContent.replace(/\s+/g," ").trim();h&&u&&u!==i?e(u):n.textContent=i,o?.()},d=h=>{h.stopPropagation(),h.key==="Enter"?(h.preventDefault(),l(!0)):h.key==="Escape"&&(h.preventDefault(),l(!1))},c=()=>l(!0);n.addEventListener("keydown",d),n.addEventListener("blur",c);for(const h of["pointerdown","mousedown","click","dblclick","dragstart"])n.addEventListener(h,u=>{n.isContentEditable&&u.stopPropagation()})}const oi=new Map;function Wr(n,e,t,o){return n.dataset.editKey=e,oi.set(e,{get:t,set:o}),n.title||(n.title="Shift+double-click to rename"),n}if(typeof document<"u"&&!globalThis.__amsEditable){globalThis.__amsEditable=!0;let n={key:null,t:0},e=null;document.addEventListener("pointerdown",o=>{const i=o.target.closest?.("[data-edit-key]");if(!i||!o.shiftKey||i.isContentEditable){n={key:null,t:0};return}const s=i.dataset.editKey,r=performance.now();n.key===s&&r-n.t<450?(e=s,n={key:null,t:0},o.preventDefault()):n={key:s,t:r}},!0);const t=o=>{if(!e)return;const i=e;e=null,o.stopPropagation(),o.preventDefault();const s=oi.get(i),r=document.querySelector(`[data-edit-key="${CSS.escape(i)}"]`);s&&r&&as(r,a=>s.set(a),s.get())};document.addEventListener("click",t,!0),document.addEventListener("dblclick",o=>{o.target.closest?.("[data-edit-key]")&&o.shiftKey&&(o.stopPropagation(),o.preventDefault())},!0)}const Sn={"titanium white":"#f4f2ec","zinc white":"#eef0ec","ivory black":"#231f1c","lamp black":"#1b1b1b","payne's gray":"#3d4650",sepia:"#704214","burnt umber":"#6e3b23","raw umber":"#826644","burnt sienna":"#a0522d","raw sienna":"#c1843f","yellow ochre":"#cc9933","naples yellow":"#f2d68a","cadmium yellow":"#f5c518","lemon yellow":"#f2e34c","indian yellow":"#e3a018","cadmium orange":"#ed7a1c","cadmium red":"#d12e1f",vermilion:"#e2421f","alizarin crimson":"#a0182c","rose madder":"#d25a6e","venetian red":"#a8412f","terre verte":"#6f8a6a",viridian:"#3a7d6a","sap green":"#4f6e2c","olive green":"#6b6b33","cerulean blue":"#2a7ab0","cobalt blue":"#1f4fa3",ultramarine:"#243f9e","prussian blue":"#1c2f4e",indigo:"#2e2a55","dioxazine violet":"#4b2a68","cobalt violet":"#8a5a9e","mars black":"#20201f","iron gall ink":"#3b3a5a",graphite:"#555555",charcoal:"#36393b",chalk:"#f1efe8",paper:"#f3efe6",kraft:"#c6a57a","sticky yellow":"#fbe9a6"},Q=(n,e)=>({name:n,hex:e}),Hr={"Klee · Senecio":[Q("warm orange","#e59b3a"),Q("ember","#d9713c"),Q("red earth","#c8472f"),Q("naples","#f2d28a"),Q("ochre light","#e8c26b"),Q("burnt sienna","#9a4b2f"),Q("ground","#f4e3c1"),Q("umber","#5b3a2a")],"Klee · Castle and Sun":[Q("castle red","#c8473a"),Q("sun orange","#e6a23c"),Q("pale gold","#e8d27a"),Q("leaf","#7a9c4a"),Q("slate blue","#3d5a8a"),Q("plum","#6d3f6e"),Q("night","#2f2a4a"),Q("parchment","#f0e6cf")],"Klee · Twittering Machine":[Q("fog blue","#7d8aa6"),Q("mist","#a9b4c6"),Q("dusty rose","#c9a9b0"),Q("sand","#b9a58d"),Q("bone","#e0d8c5"),Q("ink violet","#3b3b52"),Q("ash plum","#5a4e5e"),Q("rust","#8c3b3b")],Kandinsky:[Q("yellow","#f2c230"),Q("orange","#e07a2e"),Q("red","#c8322d"),Q("violet","#8e2f6b"),Q("blue","#2a4f9a"),Q("light blue","#3aa0c8"),Q("green","#6b8f3e"),Q("black","#1a1a1a")],Bauhaus:[Q("red","#d12a2a"),Q("yellow","#f2c230"),Q("blue","#1f4fa3"),Q("black","#111111"),Q("white","#f3efe6"),Q("gray","#8a8a8a")],"Notebook inks":[Q("black ink","#1d1b19"),Q("iron gall","#3b3a5a"),Q("blue-black","#2e3a52"),Q("sepia","#704214"),Q("red ink","#a33b2b"),Q("green ink","#2f5a3a"),Q("graphite","#555555"),Q("sticky yellow","#fbe9a6")],Grays:[Q("black","#000000"),Q("ink","#1d1b19"),Q("dark","#3f3a34"),Q("mid dark","#6d665c"),Q("mid","#9b9184"),Q("mid light","#c9c1b4"),Q("light","#e6e0d6"),Q("white","#ffffff")],Pigments:Object.entries(Sn).slice(0,36).map(([n,e])=>Q(n,e))},ii="ams_palettes_user",Bs=()=>{try{return JSON.parse(localStorage.getItem(ii))||{}}catch{return{}}},ri=n=>{try{localStorage.setItem(ii,JSON.stringify(n))}catch{}};function Cs(){return{...Hr,...Bs()}}function ls(n,e){const t=e.map(i=>{if(typeof i=="string"){const r=Qt(i);return{hex:r,name:/^#/.test(i)?wt(r):i}}const s=Qt(i.hex||i.color||i.name);return{hex:s,name:i.name||wt(s),...i.share?{share:i.share}:{}}}).filter(i=>i.hex);if(!n||!t.length)throw new Error("A palette needs a name and at least one color");const o=Bs();return o[n]=t,ri(o),window.dispatchEvent(new CustomEvent("ams-palettes")),{name:n,colors:t}}function Ur(n){const e=Bs(),t=n in e;return delete e[n],ri(e),window.dispatchEvent(new CustomEvent("ams-palettes")),t}let cn=null;function Qt(n){if(!n)return null;const e=String(n).trim();if(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e))return e.length===4?`#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}`.toLowerCase():e.toLowerCase();const t=e.toLowerCase().replace(/\s+/g," ");if(Sn[t])return Sn[t];for(const o of Object.values(Cs())){const i=o.find(s=>s.name?.toLowerCase()===t);if(i)return i.hex}try{cn||=(typeof OffscreenCanvas<"u"?new OffscreenCanvas(1,1):document.createElement("canvas")).getContext("2d"),cn.fillStyle="#010203",cn.fillStyle=t.replace(/ /g,"");const o=cn.fillStyle;if(o!=="#010203"||t==="#010203")return o.startsWith("#")?o:null}catch{}return null}const qr={black:"#000000",white:"#ffffff",gray:"#808080",silver:"#c0c0c0",maroon:"#800000",red:"#ff0000",crimson:"#dc143c",firebrick:"#b22222",tomato:"#ff6347",coral:"#ff7f50",salmon:"#fa8072",orange:"#ffa500",gold:"#ffd700",khaki:"#f0e68c",olive:"#808000",yellowgreen:"#9acd32",green:"#008000",forestgreen:"#228b22",seagreen:"#2e8b57",teal:"#008080",turquoise:"#40e0d0",skyblue:"#87ceeb",steelblue:"#4682b4",navy:"#000080",royalblue:"#4169e1",slateblue:"#6a5acd",purple:"#800080",plum:"#dda0dd",orchid:"#da70d6",pink:"#ffc0cb",brown:"#a52a2a",chocolate:"#d2691e",tan:"#d2b48c",wheat:"#f5deb3",beige:"#f5f5dc",ivory:"#fffff0",linen:"#faf0e6",slategray:"#708090",darkslategray:"#2f4f4f",lavender:"#e6e6fa",midnightblue:"#191970",cadetblue:"#5f9ea0"},ft=n=>{const e=[1,3,5].map(r=>parseInt(n.slice(r,r+2),16)/255).map(r=>r>.04045?((r+.055)/1.055)**2.4:r/12.92),t=(e[0]*.4124+e[1]*.3576+e[2]*.1805)/.95047,o=e[0]*.2126+e[1]*.7152+e[2]*.0722,i=(e[0]*.0193+e[1]*.1192+e[2]*.9505)/1.08883,s=r=>r>.008856?Math.cbrt(r):7.787*r+16/116;return[116*s(o)-16,500*(s(t)-s(o)),200*(s(o)-s(i))]},$n=(n,e)=>Math.hypot(n[0]-e[0],n[1]-e[1],n[2]-e[2]);function wt(n){if(!n)return"";const e=ft(n.slice(0,7));let t="",o=1/0;for(const[s,r]of Object.entries(Sn)){const a=$n(e,ft(r));a<o&&(o=a,t=s)}for(const[s,r]of Object.entries(qr)){const a=$n(e,ft(r))+4;a<o&&(o=a,t=s)}const[i]=e;return o>18?`${i>70?"pale ":i<30?"deep ":""}${t}`:t}function ai(n,e=6){const o=n.naturalWidth||n.width,i=n.naturalHeight||n.height,s=Math.max(1,Math.round(96*i/o)),r=document.createElement("canvas");r.width=96,r.height=s;const a=r.getContext("2d",{willReadFrequently:!0});a.drawImage(n,0,0,96,s);const l=a.getImageData(0,0,96,s).data,d=[];for(let g=0;g<l.length;g+=4)l[g+3]>128&&d.push([l[g],l[g+1],l[g+2]]);const c=([g,w,y])=>`#${[g,w,y].map(S=>Math.round(S).toString(16).padStart(2,"0")).join("")}`,h=d.map(g=>ft(c(g)));let u=7;const f=()=>(u=u*16807%2147483647,u/2147483647),p=[h[Math.floor(f()*h.length)]];for(;p.length<e;){const g=h.map(k=>Math.min(...p.map(v=>$n(k,v)))**2),w=g.reduce((k,v)=>k+v,0);let y=f()*w,S=0;for(;y>g[S]&&S<g.length-1;)y-=g[S++];p.push(h[S])}const m=new Array(h.length).fill(0);for(let g=0;g<10;g++){for(let w=0;w<h.length;w++){let y=0,S=1/0;p.forEach((k,v)=>{const T=$n(h[w],k);T<S&&(S=T,y=v)}),m[w]=y}for(let w=0;w<e;w++){const y=d.filter((S,k)=>m[k]===w);y.length&&(p[w]=ft(c([0,1,2].map(S=>y.reduce((k,v)=>k+v[S],0)/y.length))))}}const b=[];for(let g=0;g<e;g++){const w=d.filter((S,k)=>m[k]===g);if(!w.length)continue;const y=c([0,1,2].map(S=>w.reduce((k,v)=>k+v[S],0)/w.length));b.push({hex:y,name:wt(y),share:w.length/d.length})}return b.sort((g,w)=>ft(g.hex)[0]-ft(w.hex)[0]).map(({hex:g,name:w,share:y})=>({hex:g,name:w,share:Math.round(y*100)/100}))}const Hn=n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4,Kr=n=>n<=.0031308?n*12.92:1.055*Math.abs(n)**(1/2.4)-.055;function Gr(n){const e=Hn(parseInt(n.slice(1,3),16)/255),t=Hn(parseInt(n.slice(3,5),16)/255),o=Hn(parseInt(n.slice(5,7),16)/255),i=Math.cbrt(.4122214708*e+.5363325363*t+.0514459929*o),s=Math.cbrt(.2119034982*e+.6806995451*t+.1073969566*o),r=Math.cbrt(.0883024619*e+.2817188376*t+.6299787005*o),a=.2104542553*i+.793617785*s-.0040720468*r,l=1.9779984951*i-2.428592205*s+.4505937099*r,d=.0259040371*i+.7827717662*s-.808675766*r,c=Math.hypot(l,d);return{L:a,C:c<1e-4?0:c,h:c<1e-4?0:(Math.atan2(d,l)*180/Math.PI+360)%360}}function Pn(n,e,t){const o=e*Math.cos(t*Math.PI/180),i=e*Math.sin(t*Math.PI/180),s=(n+.3963377774*o+.2158037573*i)**3,r=(n-.1055613458*o-.0638541728*i)**3,a=(n-.0894841775*o-1.291485548*i)**3;return[4.0767416621*s-3.3077115913*r+.2309699292*a,-1.2684380046*s+2.6097574011*r-.3413193965*a,-.0041960863*s-.7034186147*r+1.707614701*a]}const Xs=1e-4,cs=n=>n.every(e=>e>=-Xs&&e<=1+Xs);function li(n,e,t){if(n<=0||n>=1)return 0;if(cs(Pn(n,e,t)))return e;let o=0,i=e;for(let s=0;s<18;s++){const r=(o+i)/2;cs(Pn(n,r,t))?o=r:i=r}return o}function Jr(n,e,t){return Pn(Math.max(0,Math.min(1,n)),li(n,e,t),t).map(i=>Math.round(Math.max(0,Math.min(1,Kr(Math.max(0,i))))*255))}const Zs=(n,e,t)=>`#${Jr(n,e,t).map(o=>o.toString(16).padStart(2,"0")).join("")}`,dn=.33,kt="ams_colors_recent",Kt="ams_colors_mine",hn="ams_colors_palette",Ye=(n,e)=>{try{return JSON.parse(localStorage.getItem(n))??e}catch{return e}},Je=(n,e)=>{try{localStorage.setItem(n,JSON.stringify(e))}catch{}};function An(n,e,t,o,i,s,r=!1){const a=(d,c)=>{const h=t-d/2,u=o-d/2;n.beginPath(),n.roundRect?n.roundRect(h,u,d,d,c):n.rect(h,u,d,d)},l=(d,c)=>{a(d,c),n.lineWidth=.7,n.strokeStyle="rgba(255,255,255,0.9)",n.stroke()};if(e==="fill")a(i,i*.25),n.fillStyle=s,n.fill(),l(i,i*.25);else{const d=Math.max(2.4,i*.24);a(i-d,i*.2),n.lineWidth=d,n.strokeStyle=s,n.stroke(),l(i,i*.25),l(i-2*d,i*.1)}r&&(a(i+7,i*.3),n.lineWidth=1,n.strokeStyle="rgba(0,0,0,0.55)",n.stroke())}function at(n,e="#1d1b19"){let t=String(n||e).trim();if(/^#[0-9a-f]{3}$/i.test(t)&&(t=`#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`),/^#[0-9a-f]{8}$/i.test(t))return{hex:t.slice(0,7).toLowerCase(),alpha:parseInt(t.slice(7),16)/255};if(/^#[0-9a-f]{6}$/i.test(t))return{hex:t.toLowerCase(),alpha:1};const o=t.match(/rgba?\(([^)]+)\)/i);if(o){const[i,s,r,a=1]=o[1].split(",").map(Number);return{hex:Is(i,s,r),alpha:a}}return n===e?{hex:"#1d1b19",alpha:1}:at(e,"#1d1b19")}const Te=(n,e)=>e>=.999?n:`${n}${Math.round(Math.max(0,e)*255).toString(16).padStart(2,"0")}`,Is=(n,e,t)=>`#${[n,e,t].map(o=>Math.round(Math.max(0,Math.min(255,o))).toString(16).padStart(2,"0")).join("")}`;function Ot(n){const e=parseInt(n.slice(1,3),16)/255,t=parseInt(n.slice(3,5),16)/255,o=parseInt(n.slice(5,7),16)/255,i=Math.max(e,t,o),s=i-Math.min(e,t,o);let r=0;return s&&(r=i===e?(t-o)/s%6:i===t?(o-e)/s+2:(e-t)/s+4),{h:(r*60+360)%360,s:i?s/i:0,v:i}}function ds({h:n,s:e,v:t}){const o=i=>{const s=(i+n/60)%6;return t-t*e*Math.max(0,Math.min(s,4-s,1))};return Is(o(5)*255,o(3)*255,o(1)*255)}function He(n,e,{title:t="Color",fallback:o="#1d1b19",app:i=null}={}){let{hex:s,alpha:r}=at(n,o);const a=M("span",{class:"wb-cp-chip"}),l=M("span",{class:"wb-cp-label"}),d=M("button",{class:"wb-cp-swatch",title:t,type:"button"},M("span",{class:"wb-cp-checker"},a),l),c=()=>{a.style.background=Te(s,r),l.textContent=`${s.slice(1)}${r<.999?` · ${Math.round(r*100)}%`:""}`};return c(),d.addEventListener("click",()=>di(d,{hex:s,alpha:r},(h,u)=>{s=h.hex,r=h.alpha,c(),u&&e(Te(s,r))},i)),d}let it=null;async function zt(n){if(window.EyeDropper)try{const o=await new window.EyeDropper().open();return o.sRGBHex.length===7?o.sRGBHex:at(o.sRGBHex).hex}catch{return null}const e=n.canvas.canvas;n.canvas.flash?.("Click to pick a color");const t=e.style.cursor;return e.style.cursor="crosshair",new Promise(o=>{const i=s=>{s.stopPropagation(),s.preventDefault(),window.removeEventListener("pointerdown",i,!0),e.style.cursor=t;const r=e.getBoundingClientRect(),a=e.width/r.width,l=e.getContext("2d").getImageData(Math.round((s.clientX-r.left)*a),Math.round((s.clientY-r.top)*a),1,1).data;o(s.target===e?Is(l[0],l[1],l[2]):null)};window.addEventListener("pointerdown",i,!0)})}async function Vr(n){if(it?.accept){const o=await zt(n);return o&&it.accept(o),o}const e=await zt(n);if(!e)return null;const t=n.selectedElements?.()||[];return t.length?n.store.patchElements(t.map(o=>o.id),{color:e},"color"):n.tool&&n.setDefaults&&n.setDefaults(n.tool,{color:e}),Je(kt,[e,...Ye(kt,[]).filter(o=>o!==e)].slice(0,10)),n.log?.(`Picked ${e}${t.length?` for ${t.length} element(s)`:""}.`),e}const Qs=()=>({...Cs(),Recent:Ye(kt,[]),Mine:Ye(Kt,[])});function Os(n,e,t){const o=M("select",{class:"wb-select wb-cp-palette"}),i=M("div",{class:"wb-cp-row"}),s=()=>{const d=Object.keys(Qs()),c=Ye(hn,"");o.replaceChildren(...d.map(h=>M("option",{value:h},h))),o.value=d.includes(c)?c:"Klee · Senecio"},r=()=>{const d=o.value,h=(Qs()[d]||[]).map(u=>{const f=typeof u=="string"?u:u.hex,p=typeof u=="string"?wt(u):u.name||wt(u.hex),m=M("button",{class:"wb-cp-preset",type:"button",title:`${p} · ${f}${d==="Mine"?" (right-click removes)":""}`,onclick:()=>e(f)},M("span",{class:"wb-cp-chip",style:{background:f}}));return d==="Mine"&&m.addEventListener("contextmenu",b=>{b.preventDefault(),Je(Kt,Ye(Kt,[]).filter(g=>g!==u)),r()}),m});i.replaceChildren(...h.length?h:[M("span",{class:"wb-muted wb-small"},d==="Mine"?"Nothing yet: + adds the current color":"—")])};o.addEventListener("change",()=>{Je(hn,o.value),r()});const a=M("button",{class:"wb-cp-drop",type:"button",title:"Add the current color to Mine",onclick:()=>{Je(Kt,[...new Set([...Ye(Kt,[]),t()])].slice(-24)),Je(hn,"Mine"),s(),r()}},"+"),l=n?.reference?M("button",{class:"wb-cp-drop wb-cp-fromref",type:"button",title:"Make a palette from the reference image",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',onclick:()=>{const d=ai(n.reference.img,8),c=`From ${n.reference.title}`.slice(0,48);ls(c,d),Je(hn,c),s(),r()}}):null;return s(),r(),{sel:o,chips:i,tools:M("div",{class:"wb-cp-row"},a,l)}}function ci(n,e,t,{allowNone:o=!1,dismiss:i=()=>{},keepOpen:s=!1,compact:r=!1,cursor:a=null,svH:l=96}={}){let d=Ot(n.hex),c=n.alpha,h=!1;const u=()=>ds(d),f=M("canvas",{class:"wb-cp-sv",width:r?100:200,height:r?l:130});r&&(f.style.height=`${l}px`);const p=M("input",{type:"range",class:"wb-cp-hue",min:0,max:360,step:1,value:d.h,title:"Hue"}),m=M("input",{type:"range",class:"wb-cp-alpha",min:0,max:100,step:1,value:Math.round(c*100),title:"Opacity"}),b=M("input",{class:"wb-inline wb-cp-hex",spellcheck:"false",title:"Hex (#rrggbb or #rrggbbaa), or a name: burnt sienna, crimson…"}),g=M("input",{type:"number",class:"wb-inline wb-cp-pct",min:0,max:100,title:"Opacity %"}),w=M("span",{class:"wb-cp-chip"}),y=r?null:Os(t,$=>T($),()=>Te(u(),c)),S=()=>{const $=f.getContext("2d"),E=f.width,I=f.height;$.fillStyle=ds({h:d.h,s:1,v:1}),$.fillRect(0,0,E,I);const R=$.createLinearGradient(0,0,E,0);R.addColorStop(0,"#fff"),R.addColorStop(1,"rgba(255,255,255,0)"),$.fillStyle=R,$.fillRect(0,0,E,I);const j=$.createLinearGradient(0,0,0,I);j.addColorStop(0,"rgba(0,0,0,0)"),j.addColorStop(1,"#000"),$.fillStyle=j,$.fillRect(0,0,E,I);const G=d.s*E,D=(1-d.v)*I;if(a){An($,a==="dot"?"fill":"stroke",G,D,a==="dot"?12:14,u());return}$.lineWidth=2,$.strokeStyle=d.v>.6&&d.s<.5?"#000":"#fff",$.beginPath(),$.arc(G,D,6,0,Math.PI*2),$.stroke()},k=($=!1)=>{P.classList.remove("wb-cp-off"),S(),p.value=d.h,m.value=Math.round(c*100),m.style.setProperty("--cp-color",u()),document.activeElement!==b&&(b.value=Te(u(),c).slice(1)),document.activeElement!==g&&(g.value=Math.round(c*100)),a==="ring"?(w.style.background="transparent",w.style.boxShadow=`inset 0 0 0 5px ${Te(u(),c)}`):w.style.background=Te(u(),c),w.title=wt(u()),h=!0,e({hex:u(),alpha:c},$)},v=()=>{s?P.classList.add("wb-cp-off"):i()},T=$=>{const E=at($);d=Ot(E.hex),c=E.alpha,k(!0)},x=$=>{const E=f.getBoundingClientRect(),I=j=>{d.s=Math.max(0,Math.min(1,(j.clientX-E.left)/E.width)),d.v=Math.max(0,Math.min(1,1-(j.clientY-E.top)/E.height)),k()};I($);const R=j=>{window.removeEventListener("pointermove",I),window.removeEventListener("pointerup",R),I(j),e({hex:u(),alpha:c},!0)};window.addEventListener("pointermove",I),window.addEventListener("pointerup",R)};f.addEventListener("pointerdown",x),p.addEventListener("input",()=>{d.h=Number(p.value),k()}),p.addEventListener("change",()=>k(!0)),m.addEventListener("input",()=>{c=Number(m.value)/100,k()}),m.addEventListener("change",()=>k(!0)),b.addEventListener("change",()=>{const $=b.value.trim();if(!o&&/^(transparent|none|clear)$/i.test($)){c=0,k(!0);return}if(o&&/^(none|no|transparent|-|)$/i.test($)){e(null,!0),v();return}const E=Qt(/^[0-9a-f]{3,8}$/i.test($)?`#${$}`:$);E?T(E):b.value=Te(u(),c).slice(1)}),g.addEventListener("input",()=>{document.activeElement!==g&&(c=Math.max(0,Math.min(100,Number(g.value)||0))/100,k())}),g.addEventListener("change",()=>{c=Math.max(0,Math.min(100,Number(g.value)||0))/100,k(!0)});for(const $ of[b,g])$.addEventListener("keydown",E=>{E.stopPropagation(),E.key==="Enter"&&$.blur()});const L=o?M("button",{class:"wb-cp-none",type:"button",title:"None (or type none)",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17L17 7"/></svg>',onclick:()=>{e(null,!0),v()}}):null,A=t?M("button",{class:"wb-cp-drop",type:"button",title:"Pick a color from the screen (I)",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5l4 4M4 20l1-4 9.5-9.5 3 3L8 19z"/><path d="M16 4l4 4"/></svg>',onclick:()=>zt(t).then($=>$&&T($))}):null,P=r?M("div",{class:"wb-cp-body"},f,p,m,M("div",{class:"wb-cp-row wb-cp-inputs"},M("span",{class:"wb-cp-checker wb-cp-big"},w),b,L)):M("div",{class:"wb-cp-body"},f,p,m,M("div",{class:"wb-cp-row wb-cp-inputs"},M("span",{class:"wb-cp-checker wb-cp-big"},w),A,b,g,M("span",{class:"wb-muted"},"%"),L),y.sel,y.chips,y.tools);return k(!1),h=!1,n.none&&P.classList.add("wb-cp-off"),{el:P,choose:T,drop:()=>t&&zt(t).then($=>$&&T($)),get:()=>Te(u(),c),finish:()=>{h&&Je(kt,[Te(u(),c),...Ye(kt,[]).filter($=>$!==Te(u(),c))].slice(0,10))}}}function di(n,e,t,o,{allowNone:i=!1}={}){it?.close();const s=ci(e,t,o,{allowNone:i,dismiss:()=>c()}),r=M("div",{class:"wb-cp-pop"},s.el);document.body.append(r);const a=n.getBoundingClientRect(),l=224,d=r.offsetHeight||400;r.style.left=`${Math.max(8,Math.min(window.innerWidth-l-8,a.left))}px`,r.style.top=`${a.bottom+d+8<window.innerHeight?a.bottom+6:Math.max(8,a.top-d-6)}px`;const c=()=>{r.remove(),window.removeEventListener("pointerdown",h,!0),window.removeEventListener("keydown",u,!0),s.finish(),it=null},h=f=>{!r.contains(f.target)&&!n.contains(f.target)&&c()},u=f=>{f.key==="Escape"&&(f.stopPropagation(),c())};setTimeout(()=>{window.addEventListener("pointerdown",h,!0),window.addEventListener("keydown",u,!0)}),it={close:c,accept:f=>s.choose(f)}}const Yr=183;function Xr(n,{stroke:e,fill:t,set:o,active:i}){const s=m=>!m||m==="none",r=(m,b,g,w)=>{const y=ci({...at(s(g)?w:g,w),none:s(g)},(k,v)=>{v&&o(m,k?Te(k.hex,k.alpha):null)},n,{allowNone:!0,keepOpen:!0,compact:!0,cursor:m==="fill"?"dot":"ring",svH:Yr}),S=M("div",{class:"wb-cp-col","data-paint":m,title:b},y.el);return{b:y,col:S}},a=r("fill","Fill",t,"#ffffff"),l=r("stroke","Stroke",e,"#1d1b19"),d=M("button",{class:"wb-cp-swap",type:"button",title:"Swap stroke and fill",onclick:()=>{const m=a.b.get(),b=l.b.get(),g=a.b.el.classList.contains("wb-cp-off");l.b.el.classList.contains("wb-cp-off")?(o("fill",null),a.b.el.classList.add("wb-cp-off")):a.b.choose(b),g?(o("stroke",null),l.b.el.classList.add("wb-cp-off")):l.b.choose(m)}},"⇄");let c=i==="stroke"?l:a;const h=Os(n,m=>c.b.choose(m),()=>c.b.get()),u=n?M("button",{class:"wb-cp-drop",type:"button",title:"Pick a color from the screen for the side you last touched",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5l4 4M4 20l1-4 9.5-9.5 3 3L8 19z"/><path d="M16 4l4 4"/></svg>',onclick:()=>c.b.drop()}):null,f=M("div",{class:"wb-cp-sides"},a.col,d,l.col);for(const m of[a,l])m.col.addEventListener("pointerdown",()=>{c=m});return{el:M("div",{class:"wb-cp-body"},f,M("div",{class:"wb-cp-row wb-cp-inputs"},u,h.sel),h.chips),finish:()=>{a.b.finish(),l.b.finish()},accept:m=>c.b.choose(m),active:()=>c===a?"fill":"stroke"}}function eo(n,{stroke:e,fill:t,set:o,active:i},s){const r=x=>!x||x==="none",a=(x,L)=>{const A=at(r(x)?L:x,L);return{hsv:Ot(A.hex),alpha:A.alpha,off:r(x),dirty:!1}},l={stroke:a(e,"#1d1b19"),fill:a(t,"#ffffff")};let d=i==="fill"?"fill":"stroke";const c=x=>ds(l[x].hsv),h=x=>Te(c(x),l[x].alpha),u={},f=M("input",{type:"range",class:"wb-cp-alpha",min:0,max:100,step:1,title:"Opacity of the side you last touched"});let p=null;const m=()=>{for(const x of["stroke","fill"]){const L=u[x];x==="stroke"?(L.chip.style.background="transparent",L.chip.style.boxShadow=l[x].off?"none":`inset 0 0 0 5px ${h(x)}`):L.chip.style.background=l[x].off?"transparent":h(x),document.activeElement!==L.hex&&(L.hex.value=l[x].off?"":h(x).slice(1)),L.row.classList.toggle("wb-cp-on",x===d)}f.value=Math.round(l[d].alpha*100),f.style.setProperty("--cp-color",c(d)),p?.render()},b=x=>{l[x].dirty=!0,o(x,l[x].off?null:h(x)),m()},g=(x,L)=>{const A=at(L);l[x].hsv=Ot(A.hex),l[x].alpha=A.alpha,l[x].off=!1,d=x,b(x)},w=x=>{l[x].off=!0,d=x,o(x,null),m()},y=(x,L)=>{const A=M("span",{class:"wb-cp-chip"}),P=M("input",{class:"wb-inline wb-cp-hex",spellcheck:"false",title:"Hex, or a name: crimson, burnt sienna…"});P.addEventListener("focus",()=>{d=x,m()}),P.addEventListener("change",()=>{const I=P.value.trim();if(/^(none|no|transparent|-|)$/i.test(I)){w(x);return}const R=Qt(/^[0-9a-f]{3,8}$/i.test(I)?`#${I}`:I);R?g(x,R):m()}),P.addEventListener("keydown",I=>{I.stopPropagation(),I.key==="Enter"&&P.blur()});const $=M("button",{class:"wb-cp-none",type:"button",title:"None",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17L17 7"/></svg>',onclick:()=>w(x)}),E=M("div",{class:"wb-cp-row wb-cp-inputs wb-cp-wrow","data-paint":x,title:L,onpointerdown:()=>{d=x,m()}},M("span",{class:"wb-cp-checker wb-cp-big"},A),P,$);return u[x]={chip:A,hex:P,row:E},E};f.addEventListener("input",()=>{l[d].alpha=Number(f.value)/100,l[d].dirty=!0,m()}),f.addEventListener("change",()=>b(d));const S=Os(n,x=>g(d,x),()=>h(d)),k=n?M("button",{class:"wb-cp-drop",type:"button",title:"Pick a color from the screen for the side you last touched",html:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5l4 4M4 20l1-4 9.5-9.5 3 3L8 19z"/><path d="M16 4l4 4"/></svg>',onclick:()=>zt(n).then(x=>x&&g(d,x))}):null,v=M("button",{class:"wb-cp-drop",type:"button",title:"Swap stroke and fill",onclick:()=>{const x=l.stroke;l.stroke=l.fill,l.fill=x,l.stroke.dirty=l.fill.dirty=!0,o("stroke",l.stroke.off?null:h("stroke")),o("fill",l.fill.off?null:h("fill")),m()}},"⇄");p=s({st:l,active:()=>d,setActive:x=>{d=x},hexOf:c,commit:b,refresh:m});const T=M("div",{class:"wb-cp-body"},M("div",{class:"wb-cp-wheelbox"},p.el),f,M("div",{class:"wb-cp-row wb-cp-inputs wb-cp-pairrow"},y("fill","Fill"),y("stroke","Stroke")),M("div",{class:"wb-cp-row wb-cp-inputs"},k,v,S.sel),S.chips);return m(),{el:T,accept:x=>g(d,x),stop:()=>p.stop?.(),active:()=>d,finish:()=>{const x=["stroke","fill"].filter(L=>l[L].dirty&&!l[L].off).map(h);x.length&&Je(kt,[...x,...Ye(kt,[]).filter(L=>!x.includes(L))].slice(0,10))}}}const Zr=({st:n,active:e,setActive:t,hexOf:o,commit:i,refresh:s})=>{{const u=Math.min(2,window.devicePixelRatio||1),f=M("canvas",{class:"wb-cp-wheelcv",width:212*u,height:196*u,title:"Click the disc to move the nearer dot; the bars at the sides set lightness (left: fill, right: stroke)"});f.style.width="212px",f.style.height="196px";const p={},m={},b=k=>{const v=o(k);return m[k]!==v&&(p[k]=Gr(v),m[k]=v),p[k]},g=(k,v,T,x)=>{const L={L:Math.max(0,Math.min(1,v)),C:li(Math.max(0,Math.min(1,v)),Math.max(0,Math.min(dn,T)),x),h:x},A=Zs(L.L,L.C,L.h);p[k]=L,m[k]=A,n[k].hsv=Ot(A),n[k].off=!1,n[k].dirty=!0},w=k=>{const v=b(k),T=v.C/dn*80,x=v.h*Math.PI/180;return[106+Math.cos(x)*T,98+Math.sin(x)*T]},y=document.createElement("canvas");y.width=y.height=160;const S=()=>{const k=f.getContext("2d");k.setTransform(u,0,0,u,0,0),k.clearRect(0,0,212,196);const v=b(e()).L,T=y.getContext("2d"),x=T.createImageData(160,160);for(let P=0;P<160;P++)for(let $=0;$<160;$++){const E=$-80+.5,I=P-80+.5,R=Math.hypot(E,I);if(R>80)continue;const j=Pn(v,R/80*dn,(Math.atan2(I,E)*180/Math.PI+360)%360);if(!cs(j))continue;const G=(P*2*80+$)*4;for(let D=0;D<3;D++){const O=Math.max(0,Math.min(1,j[D]));x.data[G+D]=Math.round((O<=.0031308?O*12.92:1.055*O**(1/2.4)-.055)*255)}x.data[G+3]=255}T.putImageData(x,0,0),k.drawImage(y,26,18),k.lineWidth=1,k.strokeStyle="rgba(128,128,128,0.45)",k.beginPath(),k.arc(106,98,80,0,Math.PI*2),k.stroke(),k.beginPath(),k.arc(106,98,2,0,Math.PI*2),k.fillStyle="rgba(128,128,128,0.6)",k.fill();for(const[P,$]of[["fill",0],["stroke",196]]){const E=b(P);for(let R=0;R<196;R++)k.fillStyle=Zs(1-R/195,E.C,E.h),k.fillRect($,R,16,1);const I=(1-E.L)*195;k.globalAlpha=n[P].off?.4:1,An(k,P,$+16/2,I,11,o(P)),k.globalAlpha=1}const[L,A]=["stroke","fill"].map(w);f.dataset.dots=JSON.stringify({stroke:L,fill:A}),k.setLineDash([3,3]),k.lineWidth=1.5,k.strokeStyle="rgba(255,255,255,0.9)",k.beginPath(),k.moveTo(L[0],L[1]),k.lineTo(A[0],A[1]),k.stroke(),k.setLineDash([]);for(const P of["stroke","fill"]){const[$,E]=w(P),I=o(P);k.globalAlpha=n[P].off?.4:1,An(k,P,$,E,13,I,P===e()),k.globalAlpha=1}};return f.addEventListener("pointerdown",k=>{const v=f.getBoundingClientRect(),T=k.clientX-v.left,x=k.clientY-v.top;let L=null;if(T<=18?L="fill-bar":T>=194?L="stroke-bar":Math.hypot(T-106,x-98)<=88&&(L="disc"),!L)return;k.preventDefault();let A;L==="disc"?A=["stroke","fill"].reduce((E,I)=>Math.hypot(w(E)[0]-T,w(E)[1]-x)<=Math.hypot(w(I)[0]-T,w(I)[1]-x)?E:I):A=L==="stroke-bar"?"stroke":"fill",t(A);const P=E=>{const I=E.clientX-v.left,R=E.clientY-v.top,j=b(A);L==="disc"?g(A,j.L,Math.hypot(I-106,R-98)/80*dn,(Math.atan2(R-98,I-106)*180/Math.PI+360)%360):g(A,1-R/195,j.C,j.h),s()};P(k);const $=E=>{window.removeEventListener("pointermove",P),window.removeEventListener("pointerup",$),P(E),i(A)};window.addEventListener("pointermove",P),window.addEventListener("pointerup",$)}),{el:f,render:S}}},Qr=({st:n,active:e,setActive:t,hexOf:o,commit:i,refresh:s})=>{{const d=Math.min(2,window.devicePixelRatio||1),c={yaw:-Math.PI/4,pitch:-.9553},h={...c},u=M("canvas",{class:"wb-cp-wheelcv",width:212*d,height:196*d,title:"Drag to turn the cube; drag a dot to move it (it can go inside); the corner dots snap; double-click to reset the view"});u.style.width="212px",u.style.height="196px";const f=$=>{const E=o($);return[1,3,5].map(I=>parseInt(E.slice(I,I+2),16)/255)},p=$=>`#${$.map(E=>Math.round(Math.max(0,Math.min(1,E))*255).toString(16).padStart(2,"0")).join("")}`,m=$=>{const E=($[0]-.5)*2*52,I=($[1]-.5)*2*52,R=($[2]-.5)*2*52,j=Math.cos(h.yaw),G=Math.sin(h.yaw),D=Math.cos(h.pitch),O=Math.sin(h.pitch),K=E*j+R*G,ee=-E*G+R*j;return[K,I*D-ee*O,I*O+ee*D]},b=$=>{const E=Math.cos(h.yaw),I=Math.sin(h.yaw),R=Math.cos(h.pitch),j=Math.sin(h.pitch),G=$[1]*R+$[2]*j,D=-$[1]*j+$[2]*R,O=$[0]*E-D*I,K=$[0]*I+D*E;return[O/104+.5,G/104+.5,K/104+.5]},g=$=>[212/2+$[0],196/2-$[1]],w=$=>`rgb(${$.map(E=>Math.round(E*255)).join(",")})`,y=[0,1].flatMap($=>[0,1].flatMap(E=>[0,1].map(I=>[$,E,I]))),S=5,k=[];for(let $=0;$<3;$++)for(const E of[0,1])k.push({k:$,val:E});const v=($,E,I,R)=>{const j=[0,0,0];return j[$]=E,j[($+1)%3]=I,j[($+2)%3]=R,j},T=()=>{const $=u.getContext("2d");$.setTransform(d,0,0,d,0,0),$.clearRect(0,0,212,196);const E=k.map(D=>({...D,z:m(v(D.k,D.val,.5,.5))[2]})).sort((D,O)=>D.z-O.z);for(const D of E){$.globalAlpha=D.z>0?.3:.95;for(let O=0;O<S;O++)for(let K=0;K<S;K++){const ee=O/S,B=(O+1)/S,C=K/S,z=(K+1)/S,U=[[ee,C],[B,C],[B,z],[ee,z]].map(([Y,oe])=>g(m(v(D.k,D.val,Y,oe)))),J=w(v(D.k,D.val,(ee+B)/2,(C+z)/2));$.beginPath(),U.forEach(([Y,oe],re)=>re?$.lineTo(Y,oe):$.moveTo(Y,oe)),$.closePath(),$.fillStyle=J,$.strokeStyle=J,$.lineWidth=.6,$.fill(),$.stroke()}}$.globalAlpha=.4,$.strokeStyle="#000",$.lineWidth=1;const I=(D,O)=>{const K=g(m(D)),ee=g(m(O));$.beginPath(),$.moveTo(K[0],K[1]),$.lineTo(ee[0],ee[1]),$.stroke()};for(const D of[0,1])for(const O of[0,1])I([0,D,O],[1,D,O]),I([D,0,O],[D,1,O]),I([D,O,0],[D,O,1]);$.globalAlpha=1;for(const D of y){const[O,K]=g(m(D));$.beginPath(),$.arc(O,K,1.7,0,Math.PI*2),$.fillStyle=w(D),$.fill()}const R=["stroke","fill"].map(D=>({w:D,v:m(f(D))})),[j,G]=R.map(D=>g(D.v));u.dataset.dots=JSON.stringify({stroke:j,fill:G}),u.dataset.corners=JSON.stringify(y.map(D=>g(m(D)))),$.setLineDash([3,3]),$.lineWidth=1.5,$.strokeStyle="rgba(255,255,255,0.9)",$.beginPath(),$.moveTo(j[0],j[1]),$.lineTo(G[0],G[1]),$.stroke(),$.setLineDash([]);for(const{w:D,v:O}of R){const[K,ee]=g(O),B=7+O[2]/52*1.5,C=o(D);$.globalAlpha=n[D].off?.4:1,An($,D,K,ee,2*B-1,C,D===e()),$.globalAlpha=1}},x=($,E,I)=>{const R=$-106,j=196/2-E;let G=null,D=9;for(const z of y){const[U,J]=g(m(z)),Y=Math.hypot(U-$,J-E);Y<D&&(D=Y,G=z)}if(G)return{c:[...G],depth:m(G)[2]};const O=b([R,j,0]),K=b([R,j,1]),ee=K.map((z,U)=>z-O[U]);let B=-1/0,C=1/0;for(let z=0;z<3;z++){if(Math.abs(ee[z])<1e-9){if(O[z]<0||O[z]>1){B=1/0;break}continue}const U=(0-O[z])/ee[z],J=(1-O[z])/ee[z];B=Math.max(B,Math.min(U,J)),C=Math.min(C,Math.max(U,J))}if(B<=C){const z=Math.max(B,Math.min(C,I));return{c:O.map((U,J)=>Math.max(0,Math.min(1,U+z*ee[J]))),depth:z}}return{c:b([R,j,I]).map(z=>Math.max(0,Math.min(1,z))),depth:I}};let L=0,A=[0,0];const P=()=>{h.yaw+=A[0],h.pitch=Math.max(-1.5,Math.min(1.5,h.pitch+A[1])),A=A.map($=>$*.93),s(),L=Math.abs(A[0])+Math.abs(A[1])>4e-4?requestAnimationFrame(P):0};return u.addEventListener("pointerdown",$=>{$.preventDefault(),cancelAnimationFrame(L),L=0;const E=u.getBoundingClientRect(),I=$.clientX-E.left,R=$.clientY-E.top;let j=null,G=18;for(const B of["stroke","fill"]){const[C,z]=g(m(f(B))),U=Math.hypot(C-I,z-R);U<G&&(G=U,j=B)}let D=$.clientX,O=$.clientY;if(j){t(j),n[j].off=!1;let B=m(f(j))[2];const[C,z]=g(m(f(j))),U=I-C,J=R-z,Y=re=>{const he=x(re.clientX-E.left-U,re.clientY-E.top-J,B);B=he.depth,n[j].hsv=Ot(p(he.c)),n[j].dirty=!0,s()};Y($);const oe=re=>{window.removeEventListener("pointermove",Y),window.removeEventListener("pointerup",oe),Y(re),i(j)};window.addEventListener("pointermove",Y),window.addEventListener("pointerup",oe);return}const K=B=>{const C=B.clientX-D,z=B.clientY-O;D=B.clientX,O=B.clientY,h.yaw+=C*.012,h.pitch=Math.max(-1.5,Math.min(1.5,h.pitch+z*.012)),A=[C*.012,z*.012],s()},ee=()=>{window.removeEventListener("pointermove",K),window.removeEventListener("pointerup",ee),Math.abs(A[0])+Math.abs(A[1])>.004&&(L=requestAnimationFrame(P))};window.addEventListener("pointermove",K),window.addEventListener("pointerup",ee)}),u.addEventListener("dblclick",()=>{Object.assign(h,c),A=[0,0],s()}),{el:u,render:T,stop:()=>cancelAnimationFrame(L)}}},to="ams_paint_mode",no=[{id:"fields",title:"Fields: a field, hue and opacity for each",icon:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/></svg>'},{id:"disc",title:"Disc: hue and chroma on one disc, a lightness bar each",icon:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="14.5" cy="9.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="9" cy="14" r="1.6" fill="currentColor" stroke="none"/></svg>'},{id:"cube",title:"Cube: both colors as points in a spinning RGB cube",icon:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/></svg>'}];function hi(n,e,t,o,i=Ye(to,"fields")){it?.close();const s={stroke:o.stroke,fill:o.fill},r=(y,S)=>{s[y]=S,o.set(y,S)};let a=null,l=o.active||null;const d=M("div",{class:"wb-cp-mode"}),c=M("div",{class:"wb-cp-modes",role:"radiogroup","aria-label":"Picker mode"}),h=y=>{a&&(l=a.active()),a?.finish(),a?.stop?.();const S={stroke:s.stroke,fill:s.fill,set:r,active:l};a=y==="disc"?eo(n,S,Zr):y==="cube"?eo(n,S,Qr):Xr(n,S),d.replaceChildren(a.el);for(const k of c.children){const v=k.dataset.mode===y;k.classList.toggle("on",v),k.setAttribute("aria-checked",String(v))}Je(to,y)};for(const y of no)c.append(M("button",{class:"wb-cp-modebtn",type:"button",role:"radio","data-mode":y.id,title:y.title,html:y.icon,onclick:()=>h(y.id)}));const u=M("div",{class:"wb-cp-pop wb-cp-unified"},c,d);document.body.append(u),h(no.some(y=>y.id===i)?i:"fields");const f=u.offsetWidth||248,p=u.offsetHeight||380,m=o.anchor?.getBoundingClientRect();m?(u.style.left=`${Math.max(8,Math.min(window.innerWidth-f-8,m.left))}px`,u.style.top=`${m.bottom+p+8<window.innerHeight?m.bottom+6:Math.max(8,m.top-p-6)}px`):(u.style.left=`${Math.max(8,Math.min(window.innerWidth-f-8,e-f/2))}px`,u.style.top=`${Math.max(8,Math.min(window.innerHeight-p-8,t-24))}px`);const b=()=>{u.remove(),window.removeEventListener("pointerdown",g,!0),window.removeEventListener("keydown",w,!0),a.finish(),a.stop?.(),it=null},g=y=>{!u.contains(y.target)&&!o.anchor?.contains(y.target)&&b()},w=y=>{y.key==="Escape"&&(y.stopPropagation(),b())};return setTimeout(()=>{window.addEventListener("pointerdown",g,!0),window.addEventListener("keydown",w,!0)}),it={close:b,accept:y=>a.accept(y)},{close:b}}const ui=Object.freeze(Object.defineProperty({__proto__:null,colorField:He,eyedrop:zt,eyedropToTarget:Vr,formatColor:Te,openPaintPicker:hi,openPicker:di,parseColor:at},Symbol.toStringTag,{value:"Module"})),H="main",ve="_",ea=["drawing","markdown","html","p5","frame","player","playlist"],we=n=>ea.includes(n?.kind)?n.kind:"drawing",rt=n=>n?.kind==="frame";function Tn(n,e){return V(n).filter(t=>t.id!==e.id&&!rt(t)&&t.x+t.width/2>=e.x&&t.x+t.width/2<=e.x+e.width&&t.y+t.height/2>=e.y&&t.y+t.height/2<=e.y+e.height).sort((t,o)=>Math.abs(t.y-o.y)<40?t.x-o.x:t.y-o.y)}function Un(n){const e=V(n).filter(rt);return e.length?e.sort((t,o)=>Math.abs(t.y-o.y)<40?t.x-o.x:t.y-o.y):V(n)}const hs=["locked","hidden","hideLabel","hideBorder","perf","controls","mask","codeMin"],Re=n=>{const e=Number(n?.rate);return Number.isFinite(e)&&e>0?Math.min(60,e):0},qn=n=>JSON.parse(JSON.stringify(n)),pi=n=>({...n?.maskWith&&typeof n.maskWith=="object"&&(n.maskWith.source||n.maskWith.board)?{maskWith:qn(n.maskWith)}:{},...Array.isArray(n?.fx)&&n.fx.length?{fx:qn(n.fx)}:{},...Array.isArray(n?.sourceFx)&&n.sourceFx.length?{sourceFx:qn(n.sourceFx)}:{}}),fi=n=>({...Object.fromEntries(hs.filter(e=>n?.[e]).map(e=>[e,!0])),...Re(n)?{rate:Re(n)}:{}});function V(n){const e=n.artboard||{width:1e3,height:1e3,ground:"#f3efe6"};return[{id:H,title:e.title||"Main",x:0,y:0,width:e.width,height:e.height,ground:e.ground,...e.text?{text:e.text}:{},...e.code?{code:e.code}:{},...e.pseudo?{pseudo:e.pseudo}:{},...e.follow?{follow:e.follow}:{},...e.live?{live:!0}:{},...e.paused?{paused:!0}:{},...e.kind?{kind:e.kind}:{},...e.source?{source:e.source,sourceOpacity:e.sourceOpacity,...e.sourceFit?{sourceFit:e.sourceFit}:{},...e.sourceBlend?{sourceBlend:e.sourceBlend}:{}}:{},...pi(e),...fi(e),main:!0},...(n.boards||[]).map(t=>({...t,main:!1}))]}const ie=(n,e)=>V(n).find(t=>t.id===(e||H))||null;function ke(n,e){if(e==null)return ie(n,H);const t=String(e).toLowerCase();return V(n).find(o=>o.id===e||String(o.title).toLowerCase()===t)||null}const ta=n=>n.board||H,na=n=>!n||n===H?void 0:n;function mt(n,e,t){const o=[...V(n).filter(rt),...V(n).filter(i=>!rt(i))];for(let i=o.length-1;i>=0;i--){const s=o[i];if(e>=s.x&&e<=s.x+s.width&&t>=s.y&&t<=s.y+s.height)return s}return null}function us(n,e){if(!e?.length)return ve;let t=1/0,o=1/0,i=-1/0,s=-1/0;for(const[a,l]of e)t=Math.min(t,a),o=Math.min(o,l),i=Math.max(i,a),s=Math.max(s,l);const r=mt(n,(t+i)/2,(o+s)/2);return r?r.id:ve}const st=(n,e)=>n.elements.filter(t=>ta(t)===(e||H));function Be(n,e=H){const t=ie(n,e)||ie(n,H),o=st(n,t.id),i=t.x||t.y?o.map(l=>({...l,points:l.points.map(([d,c,h,u])=>[d-t.x,c-t.y,h,u]),board:void 0})):o.map(l=>l.board?{...l,board:void 0}:l),{boards:s,train:r,...a}=n;return{...a,title:t.main?n.title:`${n.title} · ${t.title}`,artboard:{width:t.width,height:t.height,ground:t.ground},elements:i}}const ps=n=>ie(n,n.train)?.id||H;function Nn(n){const e=new Set(V(n).map(o=>o.id));let t=e.size+1;for(;e.has(`board${t}`);)t++;return`board${t}`}function en(n,e,t,o=80){let i=Math.max(...V(n).map(s=>s.x+s.width));for(const s of n.elements||[])for(const r of s.points)r[0]>i&&(i=r[0]);return{x:Math.round(i+o),y:0,width:e,height:t}}function sa(n){if(Array.isArray(n.boards)){n.boards=n.boards.filter(i=>i&&i.id&&i.id!==H&&i.id!==ve).map(i=>({id:String(i.id),title:String(i.title||i.id),x:Number(i.x)||0,y:Number(i.y)||0,width:Math.max(10,Number(i.width)||1e3),height:Math.max(10,Number(i.height)||1e3),ground:i.ground||n.artboard.ground,...i.text?{text:String(i.text)}:{},...i.code?{code:String(i.code)}:{},...i.pseudo?{pseudo:String(i.pseudo)}:{},...i.follow?{follow:!0}:{},...i.live?{live:!0}:{},...i.paused?{paused:!0}:{},...i.kind?{kind:String(i.kind)}:{},...i.source?{source:String(i.source),sourceOpacity:Number(i.sourceOpacity??.5),...i.sourceFit?{sourceFit:String(i.sourceFit)}:{},...i.sourceBlend?{sourceBlend:String(i.sourceBlend)}:{}}:{},...pi(i),...fi(i)}));const o=new Set([H,ve,...n.boards.map(i=>i.id)]);for(const i of n.elements)i.board&&!o.has(i.board)&&(i.board=ve);return n}n.boards=[];const{width:e,height:t}=n.artboard;for(const o of n.elements){if(o.board||!o.points?.length)continue;o.points.every(([s,r])=>s<0||r<0||s>e||r>t)&&(o.board=ve)}return n}const _=(n,e="")=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${e}>${n}</svg>`,zs={select:_('<path d="M5 3l14 8-6 1.5L10 19z" fill="currentColor"/>'),direct:_('<path d="M5 3l14 8-6 1.5L10 19z"/><rect x="15.5" y="15.5" width="4" height="4" fill="currentColor" stroke="none"/>'),hand:_('<path d="M8 13V5.5a1.5 1.5 0 013 0V12m0-1V4.5a1.5 1.5 0 013 0V12m0-1.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L3.6 15a1.6 1.6 0 012.6-1.9L8 15"/>'),laser:_('<path d="M4 19.5l3.6-2.6" opacity=".25"/><path d="M7.6 16.9l3.8-3" opacity=".5"/><path d="M11.4 13.9l3.2-3.9" opacity=".8"/><circle cx="17.5" cy="7" r="3" fill="currentColor" stroke="none"/>'),point:_('<circle cx="12" cy="12" r="4" fill="currentColor"/>'),points:_('<path d="M4 17c4-8 8-10 16-9" opacity=".45"/><circle cx="4" cy="17" r="1.6" fill="currentColor"/><circle cx="9" cy="11" r="1.6" fill="currentColor"/><circle cx="14.5" cy="8.4" r="1.6" fill="currentColor"/><circle cx="20" cy="8" r="1.6" fill="currentColor"/>'),sculpt:_('<path d="M3 17c4-1 6-5 9-5s4 3 9 2"/><circle cx="12" cy="12" r="5.5" stroke-dasharray="2 2.2" opacity=".7"/>'),line:_('<path d="M4 18c3-6 5-9 8-9s3 5 8-4"/>'),plane:_('<path d="M5 7l9-3 5 7-4 8-10-2z" fill="currentColor" fill-opacity=".25"/>'),circle:_('<circle cx="12" cy="12" r="7.5" fill="currentColor" fill-opacity=".25"/>'),lineStraight:_('<path d="M4 18l5-7 4 3 7-9"/>'),planeSmooth:_('<path d="M5 9c2-4 8-6 12-3s3 6 1 9-8 4-12 1-3-4-1-7z" fill="currentColor" fill-opacity=".25"/>'),circleStraight:_('<path d="M12 4.5l6.5 3.75v7.5L12 19.5l-6.5-3.75v-7.5z" fill="currentColor" fill-opacity=".25"/>'),rect:_('<rect x="4.5" y="6" width="15" height="12" rx="0.5" fill="currentColor" fill-opacity=".25"/>'),guide:_('<path d="M3 17L21 7" stroke-dasharray="3 3"/>'),gesture:_('<path d="M4 16c4-9 7 4 10-3s4-6 6-4" stroke-dasharray="1.5 3"/>'),note:_('<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4"/>'),stages:_('<path d="M4 6h6M8 12h8M12 18h8"/><circle cx="4" cy="6" r="0.6" fill="currentColor"/>'),properties:_('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),lineNumbers:_('<path d="M5 6h2v4M5 10h3M5 14h3l-3 4h3M11 7h8M11 12h8M11 17h8" />'),slidersCode:_('<path d="M3 6h10M3 11h7M3 16h10" opacity=".5"/><path d="M15 12h6"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/>'),slidersPreview:_('<rect x="3" y="4" width="18" height="7" rx="1.5" opacity=".6"/><path d="M4 15h16M4 19h16"/><circle cx="9" cy="15" r="1.6" fill="currentColor"/><circle cx="15" cy="19" r="1.6" fill="currentColor"/>'),slidersOff:_('<path d="M4 12h16" opacity=".5"/><circle cx="12" cy="12" r="1.8"/><path d="M5 5l14 14"/>'),script:_('<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>'),process:_('<rect x="3" y="6" width="5" height="12" rx="1"/><rect x="10" y="6" width="5" height="12" rx="1"/><rect x="17" y="6" width="4" height="12" rx="1"/>'),assets:_('<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'),log:_('<path d="M4 6h16M4 12h10M4 18h13"/>'),exercise:_('<path d="M4 5h11l5 5v9H4z"/><path d="M8 13l2 2 5-5"/>'),history:_('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/><path d="M12 8v4l3 2"/>'),scenes:_('<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 9l1-4.2 15.8-2.3.9 4.2z"/><path d="M8.3 4.1l2 3.8M13.1 3.4l2 3.8"/>'),board:_('<rect x="3.5" y="6" width="11" height="12" rx="1"/><rect x="9.5" y="3" width="11" height="12" rx="1" opacity=".55"/>'),page:_('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14h7M9 17h4"/>'),menu:_('<path d="M4 7h16M4 12h16M4 17h16"/>'),undo:_('<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 010 10h-2"/>'),redo:_('<path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 000 10h2"/>'),eye:_('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),label:_('<path d="M5 5h14M12 5v14"/>'),border:_('<rect x="4" y="4" width="16" height="16" rx="1"/>'),borderOff:_('<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="1.5 3"/>'),labelOff:_('<path d="M5 5h14M12 5v14"/><path d="M3 3l18 18"/>'),repeat:_('<path d="M17 3l3 3-3 3M4 11V9a3 3 0 013-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 01-3 3H4"/>'),repeatOff:_('<path d="M17 3l3 3-3 3M4 11V9a3 3 0 013-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 01-3 3H4"/><path d="M3 3l18 18"/>'),volume:_('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11"/>'),mute:_('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),controls:_('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 10.5l3 1.5-3 1.5z" fill="currentColor"/><path d="M14 12h4"/>'),controlsOff:_('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 10.5l3 1.5-3 1.5z" fill="currentColor"/><path d="M3 3l18 18"/>'),codeMin:_('<path d="M9 5L5 9l4 4M15 5l4 4-4 4"/><path d="M4 18h16"/>'),mask:_('<rect x="6" y="6" width="12" height="12"/><path d="M3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3"/>'),maskOff:_('<rect x="6" y="6" width="12" height="12" stroke-dasharray="2 2"/><path d="M3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3" opacity=".5"/>'),gauge:_('<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><path d="M7 15.5h.01M12 6.5v.01M17 15.5h.01"/>'),gaugeOff:_('<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><path d="M3 3l18 18"/>'),eyeOff:_('<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.1 6.2A17 17 0 002 12s4 7 10 7a9.8 9.8 0 005-1.3"/>'),lock:_('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'),unlock:_('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>'),plus:_('<path d="M12 5v14M5 12h14"/>'),up:_('<path d="M6 14l6-6 6 6"/>'),down:_('<path d="M6 10l6 6 6-6"/>'),trash:_('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),play:_('<path d="M7 5l12 7-12 7z"/>'),pause:_('<path d="M8 5v14M16 5v14"/>'),sun:_('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),moon:_('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'),close:_('<path d="M6 6l12 12M18 6L6 18"/>'),fit:_('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),picture:_('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>'),layers:_('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),viewPicture:_('<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 16l5-5 4 4 3-3 4 4"/>'),viewProcess:_('<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 12h16M12 4v16" stroke-dasharray="2 2"/><path d="M7 17c3-6 6-6 10-10"/>'),gear:_('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),snap:_('<path d="M4 9h16M4 15h16M9 4v16M15 4v16" opacity=".55"/><circle cx="15" cy="9" r="2.6" fill="currentColor" stroke="none"/>'),film:_('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4"/>'),brush:_('<path d="M14 4l6 6-7.5 7.5-6-6z"/><path d="M6.5 11.5C4 12 3 14 3 16.5 3 18 2.5 19.5 1.5 20.5c3 0 6.5-.5 8-2 1.3-1.3 1.5-3 1-4.5"/>'),keyboard:_('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M10 10h1M14 10h1M18 10h0M6 14h1M9 14h6M18 14h0"/>'),book:_('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>'),chat:_('<path d="M4 5h16v11H9l-5 4z"/>'),source:_('<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.6 5.6a9 9 0 000 12.8M18.4 5.6a9 9 0 010 12.8"/>'),camera:_('<path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.5"/>'),follow:_('<path d="M4 12a8 8 0 0113.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.7L4 15.5M4 20v-4.5h4.5"/>'),redraw:_('<rect x="3" y="4" width="8" height="7" fill="currentColor" fill-opacity=".3"/><path d="M14 4l7 7h-7z" fill="currentColor" fill-opacity=".3"/><circle cx="8" cy="17" r="4" fill="currentColor" fill-opacity=".3"/><path d="M14 15h7M14 19h5"/>'),sparkles:_('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>')},te=n=>zs[n]||"",et='fill="currentColor" stroke="none"',so={ink:`<path ${et} d="M3.5 19.5c3-6 7-10.5 13-12.5 2-.6 3.6 0 3.8.9.2 1-1 1.4-2.6 1.9-4.8 1.6-9.3 5.4-12.8 10.3z"/>`,pen:'<path d="M3.5 18.5c3.5-6.5 8-10.5 16.5-11" stroke-width="2.4"/>',speed:'<path d="M3 17c4-7 9-9 18-8" opacity=".5"/><path d="M6 11l1 5M10 9l.5 5M14 8l.2 4.5M18 7.8v4"/>',restate:'<path d="M3 17c4-6 9-9 18-9"/><path d="M3 14c4-6 9-8 18-8" opacity=".6"/><path d="M4 19.5c4-6 9-9 17-9.5" opacity=".4"/>',zigzag:'<path d="M3 15l3-5 3 7 3-7 3 7 3-7 3 5"/>',inner:'<path d="M3 17c4-7 9-9 18-8"/><path d="M6.5 13.6l1.6 1.4M10.5 11.2l1.3 1.6M14.6 9.8l1 1.8M18.6 9.1l.6 1.9" opacity=".7"/>',dotted:`<g ${et}><circle cx="4" cy="17" r="1.3"/><circle cx="8" cy="12.8" r="1.3"/><circle cx="12.3" cy="10" r="1.3"/><circle cx="16.6" cy="8.6" r="1.3"/><circle cx="20.6" cy="8.4" r="1.3"/></g>`,arcs:'<path d="M3 17a3 3 0 0 1 5-3M8 13a3 3 0 0 1 5-3M13 10a3 3 0 0 1 5-2M18 8a2.5 2.5 0 0 1 3 0"/>',flat:`<path ${et} d="M5 7c3-3 10-3 13 0s2 9-2 11-11 2-12-2 -2-6 1-9z"/>`,hatch:'<path d="M5 6c3-2 11-2 14 1s1 10-3 11-10 2-11-2S2 8 5 6z" opacity=".45"/><path d="M6 15l7-8M8 18l9-10M12 18.5l6-6.5"/>',stipple:`<g ${et}><circle cx="8" cy="8" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="9" r="1"/><circle cx="7" cy="12" r="1"/><circle cx="11" cy="11.5" r="1"/><circle cx="15" cy="13" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="9" cy="16" r="1"/><circle cx="13" cy="16" r="1"/><circle cx="16.5" cy="17" r="1"/></g>`,sleet:'<path d="M5 7l2 3M10 5l2 3M15 6l2 3M7 13l2 3M12 12l2 3M17 13l2 3M9 18l1.5 2.2M14 18l1.5 2.2"/>',scumble:'<path d="M4 15c2-4 4 2 6-2s3 3 5-1 3 2 5-2M4 11c2-3 4 1 6-2s3 2 5-1 3 1 5-1" stroke-width="2.2" opacity=".75"/>',incised:'<path d="M4 16c4-6 9-8 16-8"/><path d="M4.5 17.6c4-6 9-8 16-8" stroke-width=".8" opacity=".6"/>',charcoal:`<path d="M3.5 17c4-7 9-9 17-9" stroke-width="3.6" opacity=".45"/><g ${et}><circle cx="7" cy="13.6" r=".9"/><circle cx="11.5" cy="10.6" r=".9"/><circle cx="15" cy="9.3" r=".9"/><circle cx="18.6" cy="8.4" r=".9"/><circle cx="9" cy="15.4" r=".7"/><circle cx="13.5" cy="12.2" r=".7"/></g>`,chalk:'<path d="M3.5 17c4-7 9-9 17-9" stroke-width="3.6" stroke-dasharray="2.2 1.4" stroke-linecap="butt"/>',pencil:'<path d="M3.5 19c3-5 7-8.5 12-10" stroke-width="1.1"/><path d="M15 7.5l3 3-2 .5-1.5-1.5z" stroke-width="1.2"/><path d="M18 10.5l2.4-2.4a1.4 1.4 0 0 0-2-2L16 8.5" stroke-width="1.2"/>',bristles:'<path d="M4 14c4-4 9-6 17-6M4 16.5c5-4 10-5.4 14-5.5M4.5 19c4-3.4 8-4.6 11-5" stroke-width="1.3"/><path d="M6 12c3-3 7-4.4 12-4.6" stroke-width="1.3" opacity=".5"/>',oil:'<path d="M4 16c4-6 9-8 17-8M4.5 18.5c4-5.5 9-7.5 15.5-7.8M6 20c3.5-4 7.5-5.6 11-5.8" stroke-width="2.2" opacity=".8"/>',marker:'<path d="M4 17c4-6 9-8 16-8" stroke-width="4.6" stroke-linecap="butt" opacity=".65"/>',wash:`<path ${et} d="M5 9c4-4 11-4 14 0s1 8-4 9.5-10 0-10.5-4.5z" opacity=".3"/><path d="M5 9c4-4 11-4 14 0s1 8-4 9.5-10 0-10.5-4.5z" stroke-width="1.5" opacity=".75"/>`,dot:`<circle cx="12" cy="12" r="5" ${et}/>`},oo={push:'<path d="M3 16c4-2 6-6 9-6s5 4 9 6" opacity=".55"/><path d="M12 20v-6M9.5 16.5 12 14l2.5 2.5"/>',grab:'<path d="M3 17c4-4 6-9 9-9s5 5 9 9" opacity=".55"/><path d="M12 3v6M9.5 5.5 12 3l2.5 2.5"/><circle cx="12" cy="9" r="1.4" fill="currentColor" stroke="none"/>',smooth:'<path d="M3 12l2-3 2 5 2-4 2 4" opacity=".45"/><path d="M12 12c2-3 4-3 5 0s3 3 4 0"/>',relax:'<path d="M3 15c5-6 13-6 18 0" opacity=".5"/><g fill="currentColor" stroke="none"><circle cx="4" cy="13.8" r="1.3"/><circle cx="8" cy="10.5" r="1.3"/><circle cx="12" cy="9.5" r="1.3"/><circle cx="16" cy="10.5" r="1.3"/><circle cx="20" cy="13.8" r="1.3"/></g>',pinch:'<path d="M4 12h5M20 12h-5M6.5 9.5 9 12l-2.5 2.5M17.5 9.5 15 12l2.5 2.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',twist:'<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/>',jitter:'<path d="M3 12l2-2 1.5 3.5L9 9l1.5 5L13 9.5l1.5 4L17 10l1.5 3 2.5-2"/>',resample:'<path d="M3 16l18-9" opacity=".4"/><g fill="currentColor" stroke="none"><circle cx="3.0" cy="16.0" r="1.3"/><circle cx="6.0" cy="14.5" r="1.3"/><circle cx="9.0" cy="13.0" r="1.3"/><circle cx="12.0" cy="11.5" r="1.3"/><circle cx="15.0" cy="10.0" r="1.3"/><circle cx="18.0" cy="8.5" r="1.3"/><circle cx="21.0" cy="7.0" r="1.3"/></g>',simplify:'<path d="M3 16l3-2 2 1 3-4 2 1 3-3 2 1 3-3" opacity=".4"/><path d="M3 16l8-5 10-4"/><g fill="currentColor" stroke="none"><circle cx="3" cy="16" r="1.3"/><circle cx="11" cy="11" r="1.3"/><circle cx="21" cy="7" r="1.3"/></g>',thicken:`<path ${et} d="M3 13.5c4-.5 6-3 9-3s5 2.5 9 3v.8c-4 .8-5 3.7-9 3.7s-5-3-9-3.7z"/>`},oa="ams_tool_icons_v1",ia=()=>{try{return JSON.parse(localStorage.getItem(oa)||"{}")}catch{return{}}},mi=(n,e)=>{const t=ia()[n]?.[e];return t?`<span class="wb-custom-icon" style="-webkit-mask-image:url(${t});mask-image:url(${t})"></span>`:null},Gt=n=>so[n]?_(so[n]):mi("brush",n)||zs.brush,un=n=>oo[n]?_(oo[n]):mi("sculpt",n)||zs.sculpt;function fs({min:n,max:e,step:t,value:o,title:i=""}){const s=document.createElement("input");return s.type="range",s.className="wb-range",Object.assign(s,{min:n,max:e,step:t}),s.value=String(o),s.title=i,En(s),s.addEventListener("input",()=>En(s)),s}function En(n){const e=Number(n.min),t=Number(n.max);n.style.setProperty("--p",`${(Number(n.value)-e)/(t-e||1)*100}%`)}const gi=new Map,io=(n,e=2e3)=>Date.now()-(gi.get(n)||0)<e,Kn={r:128,g:128,b:128};function ra(n,e){const t={ready:!1,name:n,frame:0,width:1,height:1,rgb:()=>[Kn.r,Kn.g,Kn.b],color:()=>"#808080",value:()=>.5,colorAt:()=>"#808080",valueAt:()=>.5,pose:[],hands:[],face:[],mask:()=>0,point:()=>null,fired:()=>!1,track:()=>[],pixels:(o,i)=>new Float32Array(o*i*3).fill(128)};return t.rect=e,t}function tn(n,e={x:0,y:0,width:1e3,height:1e3},{peek:t=!1,fit:o="cover"}={}){return t||gi.set(String(n),Date.now()),ra(String(n),e)}const Gn=new Map,Ln=n=>(Gn.has(n)||Gn.set(n,{}),Gn.get(n)),ze=(n,e,t,o,i,s,r)=>({key:n,label:e,min:t,max:o,step:i,default:s,doc:r}),pn=n=>ze("detail","Detail",0,2,.05,n,"Points the brush may add where it stretches the line, as a share of the usual: 0 adds none (only the points that exist move), 1 is the usual, 2 is twice as many.");function Ns(n,e){if(n>=e)return 0;const t=1-n/e;return t*t*(3-2*t)}function aa(n,e,t){const o=n.length;if(!t&&(e===0||e===o-1))return null;const i=n[(e-1+o)%o],s=n[(e+1)%o];return[(i[0]+s[0])/2,(i[1]+s[1])/2]}function Nt(n,e){if(n.length<3)return n;const[t,o]=n[0],[i,s]=n[n.length-1],r=Math.hypot(i-t,s-o);let a=0,l=0;for(let d=1;d<n.length-1;d++){const c=r<1e-9?Math.hypot(n[d][0]-t,n[d][1]-o):Math.abs((s-o)*n[d][0]-(i-t)*n[d][1]+i*o-s*t)/r;c>a&&(a=c,l=d)}return a<=e?[n[0],n[n.length-1]]:[...Nt(n.slice(0,l+1),e).slice(0,-1),...Nt(n.slice(l),e)]}function bi(n,e,t,o=!1){const i=n.length,s=p=>o?n[(p%i+i)%i]:n[Math.max(0,Math.min(i-1,p))],r=s(e-1),a=s(e),l=s(e+1),d=s(e+2),c=t*t,h=c*t,u=(p,m,b,g)=>.5*(2*m+(-p+b)*t+(2*p-5*m+4*b-g)*c+(-p+3*m-3*b+g)*h),f=p=>{const m=a[p]??(p===3?.5:0),b=l[p]??(p===3?.5:0);return m+(b-m)*t};return[u(r[0],a[0],l[0],d[0]),u(r[1],a[1],l[1],d[1]),f(2),f(3)]}function ms(n,e,t=()=>!0,o=!1,i=!1){const s=[],r=n.length;for(let a=0;a<r;a++){const l=n[a];if(s.push(l),a===r-1&&!o)break;const d=n[(a+1)%r],c=Math.hypot(d[0]-l[0],d[1]-l[1]);if(c<=e||!t(l,d))continue;const h=Math.min(24,Math.ceil(c/e));for(let u=1;u<h;u++){const f=u/h;s.push(i?bi(n,a,f,o):l.map((p,m)=>p+((d[m]??p)-p)*f))}}return s}const la={falloff:Ns,mean:aa,rdp:Nt,refine:ms,curve:bi,nearMark:(...n)=>Yt(...n)},$e={push:{label:"Push",refine:!0,doc:"Points under the brush follow the cursor.",params:[ze("amount","Amount",0,2,.05,1,"How far points follow the cursor."),pn(1)],step(n,e,t,o){return n.map(i=>{const s=o.w(i)*t.amount;return s?[i[0]+e.dx*s,i[1]+e.dy*s,i[2],i[3]]:i})}},grab:{label:"Grab",refine:!0,doc:"Pick up the points under the brush where the stroke began and move them with the cursor. Detail 0 (the start) moves only the points that exist; raise it to let the lifted part gain points.",params:[pn(0)],step(n,e,t,o){e.state.held||(e.state.held=e.orig.map(a=>o.falloff(Math.hypot(a[0]-e.start[0],a[1]-e.start[1]),e.radius)*e.strength));const i=e.state.held;if(!i.some(Boolean))return null;const s=e.x-e.start[0],r=e.y-e.start[1];return e.orig.map((a,l)=>i[l]?[a[0]+s*i[l],a[1]+r*i[l],a[2],a[3]]:a)}},smooth:{label:"Smooth",doc:"Points move toward their neighbours: wiggles relax, corners round, and pressure (thickness) evens out. Cmd: Jitter, its opposite.",params:[ze("amount","Amount",0,1,.05,.5,"How far each pass moves a point toward its neighbours.")],step(n,e,t,o){return n.map((i,s)=>{const r=o.w(i)*t.amount,a=r&&o.mean(n,s,e.closed);if(!a)return i;const l=n.length,d=n[(s-1+l)%l][3]??.5,c=n[(s+1)%l][3]??.5,h=i[3]??.5;return[i[0]+(a[0]-i[0])*r,i[1]+(a[1]-i[1])*r,i[2],h+((d+c)/2-h)*r]})}},relax:{label:"Relax",doc:"Evens out the spacing along the mark without changing its shape (Smooth that only slides points along). Cmd: Pinch, its opposite.",params:[ze("amount","Amount",0,1,.05,.6,"How far each pass slides a point.")],step(n,e,t,o){const i=n.length;return n.map((s,r)=>{const a=o.w(s)*t.amount,l=a&&o.mean(n,r,e.closed);if(!l)return s;const d=n[(r-1+i)%i],c=n[(r+1)%i];let h=c[0]-d[0],u=c[1]-d[1];const f=Math.hypot(h,u)||1;h/=f,u/=f;const p=(l[0]-s[0])*h+(l[1]-s[1])*u;return[s[0]+h*p*a,s[1]+u*p*a,s[2],s[3]]})}},pinch:{label:"Pinch",refine:!0,doc:"Points gather toward the cursor (Alt: inflate, away from it). Cmd: Relax, its opposite.",params:[ze("amount","Amount",0,1,.02,.15,"How much of the way to the cursor each pass goes."),pn(1)],step(n,e,t,o){const i=e.invert?-1:1;return n.map(s=>{const r=o.w(s)*t.amount*i;return r?[s[0]+(e.x-s[0])*r,s[1]+(e.y-s[1])*r,s[2],s[3]]:s})}},twist:{label:"Twist",refine:!0,doc:"Points turn around the cursor as you move (Alt: the other way).",params:[ze("speed","Speed",0,.2,.005,.04,"Radians per pass at full strength."),pn(1)],step(n,e,t,o){const i=(e.invert?-1:1)*t.speed*(1+Math.hypot(e.dx,e.dy)/Math.max(1,e.radius)*4);return n.map(s=>{const r=o.w(s)*i;if(!r)return s;const a=Math.cos(r),l=Math.sin(r),d=s[0]-e.x,c=s[1]-e.y;return[e.x+d*a-c*l,e.y+d*l+c*a,s[2],s[3]]})}},jitter:{label:"Jitter",doc:"Seeded tremor: points shake a little under the brush. Cmd: Smooth, its opposite.",params:[ze("amount","Amount",0,.2,.005,.03,"Shake, as a fraction of the brush radius.")],step(n,e,t,o){const i=e.radius*t.amount;return n.map(s=>{const r=o.w(s);return r?[s[0]+(o.rng()-.5)*i*r,s[1]+(o.rng()-.5)*i*r,s[2],s[3]]:s})}},simplify:{label:"Simplify",doc:"Fewer points under the brush, same shape (Ramer–Douglas–Peucker on the part you brush). Cmd: Resample, its opposite.",params:[ze("tolerance","Tolerance",0,.2,.005,.06,"How far the shape may move, as a fraction of the brush radius (at strength 0.5; the brush strength scales it).")],step(n,e,t,o){const i=e.radius*t.tolerance*2*e.strength,s=[];let r=[];const a=()=>{r.length&&s.push(...r.length>2?o.rdp(r,i):r),r=[]};return n.forEach((l,d)=>{d===0||d===n.length-1||o.w(l)<.25?(a(),s.push(l)):r.push(l)}),a(),s.length>=2?s:n}},resample:{label:"Resample",doc:"More, evenly spaced points under the brush, same shape: what the brush covers is split into even steps along the curve (along the segments, for a straight mark); the finer, the stronger. Useful before pushing or twisting a sparse mark. Cmd: Simplify, its opposite.",params:[ze("density","Density",1,50,1,8,"Points per brush radius at the center (more = denser); it eases back to the mark’s own spacing toward the edge.")],step(n,e,t,o){const i=[],s=n.length,r=e.closed?s:s-1;for(let a=0;a<s&&(i.push(n[a]),!(a>=r));a++){const l=n[a],d=n[(a+1)%s],c=Math.hypot(d[0]-l[0],d[1]-l[1]),h=o.w([(l[0]+d[0])/2,(l[1]+d[1])/2]);if(h<=0)continue;const u=Math.min(1,h*2),f=c+(e.radius/Math.max(1,t.density)-c)*u,p=Math.min(24,Math.ceil(c/Math.max(.5,f)-.2));for(let m=1;m<p;m++){const b=m/p;i.push(e.smooth?o.curve(n,a,b,e.closed):l.map((g,w)=>g+((d[w]??g)-g)*b))}}return i}},thicken:{label:"Thicken",doc:"Raises the pressure under the brush, so pressure-aware brushes (Ink) draw wider (Alt or Cmd: thinner). Pressure can go up to 2 (a mouse line is already near 1).",params:[ze("amount","Amount",0,.5,.01,.12,"Pressure added per pass.")],step(n,e,t,o){const i=e.invert||e.boost?-1:1;return n.map(s=>{const r=o.w(s);return r?[s[0],s[1],s[2],Math.max(.02,Math.min(2,(s[3]??.5)+i*r*t.amount))]:s})}}};for(const[n,e]of Object.entries($e))e.id=n,e.rawStep=e.step;function ca(n){let e=null;if(new Function("sculpt",`"use strict";
${n}`)(o=>{e=o}),!e)throw new Error("The code must call sculpt({ id, step(pts, s, p, k) { … } })");if(!/^[a-z][\w-]*$/i.test(e.id||""))throw new Error('sculpt id must be a word like "comb"');if(typeof e.step!="function")throw new Error("sculpt needs step(pts, s, p, k) { … }");const t=Object.entries(e.params||{}).map(([o,i])=>{const[s,r,a,l]=Array.isArray(i)?i:[i.min??0,i.max??1,i.default??0,i.doc];return ze(o,o,Number(s),Number(r),Math.abs(Number(r)-Number(s))/100||.01,Number(a),l||"")});return{id:e.id,label:e.label||e.id,doc:e.doc||"",refine:!!e.refine,params:t,step:e.step,rawStep:e.step,source:n,custom:!0}}const da="ams_sculpts_v1",ha=new Set(Object.keys($e));function ua(){try{return JSON.parse(globalThis.localStorage?.getItem(da)||"{}")}catch{return{}}}function pa(){for(const n of Object.values(ua()))try{const e=ca(n);ha.has(e.id)||($e[e.id]=e)}catch(e){console.warn("sculpt library:",e.message)}}function Rs(n,e={}){const t=$e[n],o={};for(const i of t?.params||[])o[i.key]=Number.isFinite(e[i.key])?e[i.key]:i.default;return o}function Yt(n,e,t,o,i=!1){const s=n.length;for(let r=0;r<s;r++){const a=n[r];if(Math.hypot(a[0]-e,a[1]-t)<o)return!0;if(r===s-1&&!i)break;const l=n[(r+1)%s],d=l[0]-a[0],c=l[1]-a[1],h=d*d+c*c,u=h?Math.max(0,Math.min(1,((e-a[0])*d+(t-a[1])*c)/h)):0;if(Math.hypot(a[0]+d*u-e,a[1]+c*u-t)<o)return!0}return!1}const fa={simplify:"resample",resample:"simplify",smooth:"jitter",jitter:"smooth",pinch:"relax",relax:"pinch"},ma=(n,e)=>e&&fa[n]||n,Jn=n=>!["point","note","image"].includes(n.role)&&n.points.length>=2;function ga(n,e,t,o,i=Math.random,s={orig:e.points,state:{}}){const r=$e[n];if(!r)return null;const a=(p,m)=>Yt([p,m],t.x,t.y,t.radius);let l=e.points;if(n!=="grab"&&!Yt(l,t.x,t.y,t.radius,e.closed))return null;const d=e.path!=="straight",c=Rs(n,o),h=c.detail===void 0?1:c.detail,u=t.radius/(6*Math.max(h,1e-6));r.refine&&h>0&&(n!=="grab"?l=ms(l,u,a,e.closed,d):t.first&&(s.orig=ms(s.orig,u,(p,m)=>Yt([p,m],t.start[0],t.start[1],t.radius*2),e.closed,d)));const f={...la,rng:i,source:(p,m)=>tn(p,m||t.board),w:p=>Ns(Math.hypot(p[0]-t.x,p[1]-t.y),t.radius)*t.strength*(t.pressure??1)};try{const p=r.step(l.map(m=>m.slice()),{...t,closed:!!e.closed,smooth:d,orig:s.orig,state:s.state},c,f);return Array.isArray(p)&&p.length>=2&&p.every(m=>Number.isFinite(m[0])&&Number.isFinite(m[1]))?p:null}catch(p){return r.warned||(r.warned=!0,console.warn(`sculpt "${n}" failed: ${p.message}`)),null}}function Rn(n,e,t){if(n.length<3)return n.map(a=>a.slice());const o=[],i=n.length,s=a=>e?n[(a+i)%i]:n[Math.max(0,Math.min(i-1,a))],r=e?i:i-1;for(let a=0;a<r;a++){const l=s(a-1),d=s(a),c=s(a+1),h=s(a+2),u=t||Math.max(6,Math.min(96,Math.ceil(Math.hypot(c[0]-d[0],c[1]-d[1])/3)));for(let f=0;f<u;f++){const p=f/u,m=p*p,b=m*p,g=(w,y,S,k)=>.5*(2*y+(-w+S)*p+(2*w-5*y+4*S-k)*m+(-w+3*y-3*S+k)*b);o.push([g(l[0],d[0],c[0],h[0]),g(l[1],d[1],c[1],h[1]),d[2]+(c[2]-d[2])*p,d[3]+(c[3]-d[3])*p])}}return e||o.push(n[i-1].slice()),o}function yi(n,e=4,t=.5){const o=Rn(n.points,n.closed,e);let i=0;return o.map((s,r)=>{const a=o[Math.max(0,r-1)],l=o[Math.min(o.length-1,r+1)];let d=l[0]-a[0],c=l[1]-a[1];const h=Math.hypot(d,c)||1;d/=h,c/=h;const u=o[Math.max(0,r-1)],f=Math.hypot(s[0]-u[0],s[1]-u[1]),p=(s[2]??0)-(u[2]??0),m=r===0?0:p>.5?f/p*16:f;return i=r===0?m:i*t+m*(1-t),{x:s[0],y:s[1],nx:-c,ny:d,speed:i,pressure:s[3]??.5}})}const ba=2048,ya=25e4;let gs=128*1024*1024;const Ue=new Map;let xt=0,ot=0,_e=1,Vn=0,ro=0,fn=150,bs=!1;const Le={hits:0,misses:0,paintMs:0,evicted:0,thrash:0,swept:0};function wa(n=!1){const e={...Le,paintMs:+Le.paintMs.toFixed(2),layers:Ue.size,bytes:xt,budget:gs,quality:+_e.toFixed(2),fast:yt.size};if(n){let t=0,o=0,i=0;for(const s of Ue.values())ot-s.used<100&&(t+=s.bytes,o++,i+=s.canvas.width*s.canvas.height);e.inUseMB=+(t/1048576).toFixed(1),e.inUse=o,e.avgPx=Math.round(i/Math.max(1,o))}return e}function ka(){if(ot=typeof performance<"u"?performance.now():Date.now(),Le.thrash>0?(_e=Math.max(.3,_e*.75),Le.thrash=0,Vn=0,fn=Math.min(4800,fn*2)):_e<1&&++Vn>fn&&(_e=Math.min(1,_e*1.25),Vn=0,_e>=1&&(fn=150)),ot-ro>2e3){ro=ot;for(const[n,e]of Ue)ot-e.used>2e4&&(Ue.delete(n),xt-=e.bytes,e.dead=!0,nn(e.canvas),Le.swept=(Le.swept||0)+1)}}function xa(n){const e=[...Ue.entries()].sort((t,o)=>t[1].used-o[1].used);for(const[t,o]of e){if(xt<=n)break;ot-o.used<250&&(Le.thrash=(Le.thrash||0)+1),Ue.delete(t),xt-=o.bytes,o.dead=!0,nn(o.canvas),Le.evicted++}}const yt=new Map;let Ct=null;function va(n){Ct={fk:n,n:0,entry:null}}function Ma(){const n=Ct;Ct=null,n&&(yt.size>3e4&&yt.clear(),yt.set(n.fk,n.n===1?n.entry:!1))}function Sa(n){const e=yt.get(n);return e===void 0?null:e===!1?!1:e.layer.dead?(yt.delete(n),null):(e.layer.used=ot,e)}function ao(n,e,t=1){const o=e.layer,i=n.globalAlpha;n.globalAlpha=i*e.alpha*t,n.drawImage(o.canvas,o.x,o.y,o.w,o.h),n.globalAlpha=i}function Rt(n,e){const t=typeof document<"u"?document.createElement("canvas"):typeof OffscreenCanvas<"u"?new OffscreenCanvas(1,1):null;return t?(t.width=Math.max(1,n),t.height=Math.max(1,e),t.addEventListener?.("contextlost",()=>{bs=!0}),t):null}function nn(n){n&&(n.width=0,n.height=0)}function $a(){if(!bs)return!0;const n=Rt(2,2),e=n?.getContext("2d");if(!e||e.isContextLost?.())return!1;for(const t of Ue.values())t.dead=!0,nn(t.canvas);return Ue.clear(),yt.clear(),xt=0,ws.clear(),ys.clear(),bs=!1,!0}let Wt={scale:0,q:0,dpr:0,ppu:1};function wi(n){const e=globalThis.devicePixelRatio||1;if(Wt.scale===n&&Wt.q===_e&&Wt.dpr===e)return Wt.ppu;const t=Math.max(.25,Math.min(4,(n||1)*e*_e)),o=Math.pow(2,Math.round(Math.log2(t)*2)/2);return Wt={scale:n,q:_e,dpr:e,ppu:o},o}function Ds(...n){let e="";for(const t of n)if(Array.isArray(t))for(const o of t)e+=Array.isArray(o)?`${Math.round(o[0]*4)},${Math.round(o[1]*4)}${o.length>3?`,${Math.round(o[3]*20)}`:""};`:`${o};`;else if(t&&typeof t=="object"){let o="{",i=!0;for(const s in t){const r=t[s];if(r!==null&&typeof r=="object"){i=!1;break}o+=`${s}:${r},`}e+=i?`${o}}`:JSON.stringify(t)}else e+=`${t}|`;return e}function ki(n,e){let[t,o,i,s]=n,r=Math.ceil((i-t)*e),a=Math.ceil((s-o)*e);const l=Math.min(1,ba/Math.max(r,a),Math.sqrt(ya/Math.max(1,r*a)));l<1&&(e*=l,r=Math.ceil((i-t)*e),a=Math.ceil((s-o)*e));const d=Rt(r,a),c=d?.getContext("2d");return c?(c.setTransform(e,0,0,e,-t*e,-o*e),{canvas:d,lctx:c,x:t,y:o,w:i-t,h:s-o,ppu:e,px:[d.width,d.height]}):null}function xi(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function mn(n,e,t){const o=xi(t),i=new Float32Array(e*e);for(let a=0;a<i.length;a++)i[a]=o();const s=new Float32Array(n*n),r=e/n;for(let a=0;a<n;a++){const l=a*r,d=Math.floor(l),c=l-d,h=c*c*(3-2*c);for(let u=0;u<n;u++){const f=u*r,p=Math.floor(f),m=f-p,b=m*m*(3-2*m),g=i[d%e*e+p%e],w=i[d%e*e+(p+1)%e],y=i[(d+1)%e*e+p%e],S=i[(d+1)%e*e+(p+1)%e];s[a*n+u]=g+(w-g)*b+(y-g)*h+(g-w-y+S)*b*h}}return s}const ys=new Map,Pa=128;function Aa(n,e,t){const o=`${n}|${e}|${Math.round(t*20)}`;let i=ys.get(o);if(i)return i;const s=Math.round(t*20)/20,r=Pa,a=mn(r,32,e*7+1),l=mn(r,16,e*7+2),d=mn(r,8,e*7+3),c=n==="fibre"?mn(r,4,e*7+4):null;i=Rt(r,r);const h=i.getContext("2d"),u=h.createImageData(r,r);for(let f=0;f<r;f++)for(let p=0;p<r;p++){const m=f*r+p;let b;if(n==="canvas"){const y=Math.abs(Math.sin(p/r*Math.PI*8)),S=Math.abs(Math.sin(f/r*Math.PI*8));b=.2*(y+S)+.8*(.55*a[m]+.45*l[m])}else n==="fibre"?b=.6*c[Math.floor(f/2)%r*r+p]+.4*a[m]:n==="noise"?b=.5*l[m]+.5*d[m]:b=.5*a[m]+.3*l[m]+.2*d[m];const g=Math.min(1,Math.max(0,(b-.3)/.45)),w=g*g*(3-2*g);u.data[m*4+3]=Math.round(255*(1-s*(1-w)))}return h.putImageData(u,0,0),ys.set(o,i),i}function vi(n,{kind:e="paper",scale:t=.6,strength:o=.5,seed:i=1}={}){if(!(o>0))return;const{lctx:s,ppu:r,x:a,y:l,canvas:d}=n,c=s.createPattern(Aa(e,i,o),"repeat");if(!c)return;const h=new DOMMatrix().translate(-a*r,-l*r).scale(t*r);c.setTransform?.(h),s.save(),s.setTransform(1,0,0,1,0,0),s.globalCompositeOperation="destination-in",s.fillStyle=c,s.fillRect(0,0,d.width,d.height),s.restore()}const ws=new Map;function Ta(n){const e=Math.round(n*10)/10;let t=ws.get(e);if(t)return t;t=Rt(64,64);const o=t.getContext("2d"),i=o.createRadialGradient(32,32,0,32,32,32);return i.addColorStop(0,"rgba(255,255,255,1)"),i.addColorStop(Math.max(.01,Math.min(.99,e)),"rgba(255,255,255,1)"),i.addColorStop(1,"rgba(255,255,255,0)"),o.fillStyle=i,o.fillRect(0,0,64,64),ws.set(e,t),t}function Ea(n,e,{tip:t="soft",size:o=10,flow:i=.5,spacing:s=.12,scatter:r=0,hardness:a=.5,aspect:l=.3,angle:d="follow",rng:c=Math.random}={}){if(!e.length)return;const h=b=>typeof o=="function"?o(b):o,u=b=>typeof i=="function"?i(b):i,f=(b,g,w)=>{const y=Math.max(.1,h(w)),S=Math.max(0,Math.min(1,u(w)));if(S<=.002)return;let k=b,v=g;if(r){const x=(c()-.5)*r*y;k+=w.nx*x,v+=w.ny*x}if(n.globalAlpha=S,t==="soft"){n.drawImage(Ta(a),k-y/2,v-y/2,y,y);return}n.save(),n.translate(k,v);const T=Math.atan2(-w.nx,w.ny);n.rotate(d==="follow"?T+Math.PI/2:d==="along"?T:d),n.fillStyle="#fff",t==="flat"?n.fillRect(-y/2,-y*l/2,y,y*l):n.fillRect(-y/2,-y/2,y,y),n.restore()};n.save();let p=0,m=e[0];f(m.x,m.y,m);for(let b=1;b<e.length;b++){const g=e[b];let w=g.x-m.x,y=g.y-m.y,S=Math.hypot(w,y);for(;S>1e-6;){const k=Math.max(.15,h(g)*s);if(p+S<k){p+=S,m={...g,x:g.x,y:g.y},S=0;break}const v=(k-p)/S;m={...g,x:m.x+w*v,y:m.y+y*v},f(m.x,m.y,m),w=g.x-m.x,y=g.y-m.y,S=Math.hypot(w,y),p=0}}n.restore()}function La(n,e,{count:t=24,width:o=20,thickness:i=1.2,dry:s=.35,flow:r=.85,trim:a=0,streaks:l=.55,rng:d=Math.random}={}){if(e.length<2)return;const c=(p,m)=>typeof o=="function"?o(p,m/Math.max(1,e.length-1)):o;n.save(),n.lineCap="round",n.lineJoin="round",n.strokeStyle="#fff";const h=[];for(let p=0;p<t;p++)h.push({off:t===1?0:p/(t-1)-.5+(d()-.5)*.5/t,th:i*(.5+d()),a:r*(1-l*d()),ph:d()*1e3,fq:.015+d()*.04,need:d(),from:d()*a,to:1-d()*a});const u=[0];for(let p=1;p<e.length;p++)u.push(u[p-1]+Math.hypot(e[p].x-e[p-1].x,e[p].y-e[p-1].y));const f=Math.max(1e-6,u[u.length-1]);for(const p of h){let m=!1;n.globalAlpha=p.a,n.lineWidth=p.th,n.beginPath(),e.forEach((b,g)=>{const y=1-s*(.3+.7*u[g]/f)-s*Math.min(.35,b.speed*.008)+.3*(Math.sin(p.ph+u[g]*p.fq)*.5)>p.need*.9&&u[g]>=p.from*f&&u[g]<=p.to*f,S=p.off*c(b,g),k=b.x+b.nx*S,v=b.y+b.ny*S;y?(m?n.lineTo(k,v):n.moveTo(k,v),m=!0):m=!1}),n.stroke()}n.restore()}function Ba(n,e){let t=1/0,o=1/0,i=-1/0,s=-1/0;for(const r of n)t=Math.min(t,r.x),o=Math.min(o,r.y),i=Math.max(i,r.x),s=Math.max(s,r.y);return[Math.floor(t-e),Math.floor(o-e),Math.ceil(i+e),Math.ceil(s+e)]}function Ca(n,e,{edge:t=.5,rimWidth:o=4,rough:i=1.5,base:s=.6,seed:r=1}={}){const{lctx:a,ppu:l}=n,d=xi(r),c=e.map(([f,p],m)=>{const b=d()*6.28;return[f+Math.cos(b+m)*i*d(),p+Math.sin(b+m*1.3)*i*d()]}),h=f=>{f.beginPath(),c.forEach(([p,m],b)=>b?f.lineTo(p,m):f.moveTo(p,m)),f.closePath()};a.save(),a.fillStyle="#fff",a.globalAlpha=s,h(a),a.fill();const u="filter"in a;if(t>0&&u){const f=Rt(n.canvas.width,n.canvas.height),p=f.getContext("2d");p.setTransform(l,0,0,l,-n.x*l,-n.y*l),p.fillStyle="#fff",h(p),p.fill();const m=Rt(f.width,f.height),b=m.getContext("2d");b.filter=`blur(${Math.max(.5,o*l)}px)`,b.drawImage(f,0,0),p.setTransform(1,0,0,1,0,0),p.globalCompositeOperation="destination-out",p.drawImage(m,0,0),a.setTransform(1,0,0,1,0,0),a.globalAlpha=Math.min(1,t*1.6),a.drawImage(f,0,0),a.drawImage(f,0,0),nn(f),nn(m)}else t>0&&(a.globalAlpha=t*.7,a.strokeStyle="#fff",a.lineWidth=o*.6,h(a),a.stroke());a.restore()}function Ia(n,{key:e,bounds:t,draw:o,grain:i=null,color:s="#1d1b19",alpha:r=1,scale:a=1}){if(!$a())return;const l=wi(a),d=`${e}|${s}|${l}|${Ds(i)}`;let c=Ue.get(d);if(c)Le.hits++;else{const u=typeof performance<"u"?performance.now():0;if(Le.misses++,c=ki(t,l),!c)return;c.lctx.save(),o(c.lctx,c),c.lctx.restore(),i&&vi(c,i),c.lctx.save(),c.lctx.setTransform(1,0,0,1,0,0),c.lctx.globalCompositeOperation="source-in",c.lctx.fillStyle=s,c.lctx.fillRect(0,0,c.canvas.width,c.canvas.height),c.lctx.restore(),c.bytes=c.canvas.width*c.canvas.height*4,Ue.set(d,c),xt+=c.bytes,xt>gs&&xa(gs*.8),u&&(Le.paintMs+=performance.now()-u)}c.used=ot,Ct&&(Ct.n++,Ct.entry={layer:c,alpha:r});const h=n.globalAlpha;n.globalAlpha=h*r,n.drawImage(c.canvas,c.x,c.y,c.w,c.h),n.globalAlpha=h}function vt(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}const Bn="#1d1b19",F=(n,e,t,o,i,s,r)=>({key:n,label:e,min:t,max:o,step:i,default:s,doc:r});function Oa(n,e,t){n.beginPath(),e.forEach(([o,i],s)=>s?n.lineTo(o,i):n.moveTo(o,i)),t&&n.closePath()}function za(n,e){const t=[];for(let o=0,i=n.length-1;o<n.length;i=o++){const[s,r]=n[o],[a,l]=n[i];r>e!=l>e&&t.push(s+(e-r)/(l-r)*(a-s))}return t.sort((o,i)=>o-i)}function Na(n,e,t,o){const i=Math.cos(e),s=Math.sin(e);return n.map(([r,a])=>[t+(r-t)*i-(a-o)*s,o+(r-t)*s+(a-o)*i])}function Ra(n,e,t,o,i){n.beginPath(),n.moveTo(e,t),n.lineTo(o,i),n.stroke()}const Ht=(n,e=1)=>[F("width","Width",.25,20,.25,n,"Stroke width."),F("opacity","Opacity",0,1,.05,e,"Paint opacity.")],gn=(n,e)=>[F("gain","Speed gain",0,6,.05,n,"How much the hand's speed changes the mark."),F("max","Max",1,200,1,e,"The largest mark, in artboard units.")],Da=(n,e,t)=>{n.save(),n.globalAlpha*=t.opacity,n.strokeStyle=e.color||Bn,n.fillStyle=e.color||Bn,n.lineWidth=t.width,n.lineCap="round",n.lineJoin="round"},Z={image:{label:"Image",roles:["image"],doc:"A placed picture, drawn through its four corners (so it moves, scales and rotates like any mark).",params:[F("opacity","Opacity",0,1,.05,1,"Opacity of the picture.")],draw(n,e,t,o){const[i,s,,r]=e.points;if(!i||!s||!r)return;const a=o.image(e.src);n.save(),n.globalAlpha*=t.opacity,n.transform(s[0]-i[0],s[1]-i[1],r[0]-i[0],r[1]-i[1],i[0],i[1]),a?n.drawImage(a,0,0,1,1):(n.fillStyle="rgba(128,128,128,0.15)",n.fillRect(0,0,1,1)),n.restore()}},none:{label:"None",roles:["note"],doc:"Not drawn in the picture.",params:[],draw(){}},guide:{label:"Guide",roles:["guide","gesture","line","plane"],doc:"Construction line: shown as an overlay, left out of the finished picture.",construction:!0,params:[F("dash","Dash",0,40,1,8,"Dash length in artboard units (0 = solid).")],draw(n,e,t,o){const i=o.smoothPath(e.points,e.closed);n.save(),n.strokeStyle=e.color||(e.role==="gesture"?"#d9480f":"#2f6fdd"),n.globalAlpha*=.7,n.lineWidth=1.25/o.scale,t.dash>0&&n.setLineDash([t.dash,t.dash*.7]),o.tracePath(n,i,e.closed),n.stroke(),n.restore()}},dot:{label:"Dot",roles:["point"],doc:"A round mark; its weight is its size.",params:[F("size","Size",1,200,1,12,"Diameter in artboard units."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){n.save(),n.globalAlpha*=t.opacity,n.fillStyle=e.color||o.INK;for(const[i,s]of e.points)n.beginPath(),n.arc(i,s,t.size/2,0,Math.PI*2),n.fill();n.restore()}},ink:{label:"Ink",roles:["line","gesture","plane","guide"],doc:"A pen line whose width follows pressure and tapers at the ends.",params:[F("width","Width",.5,60,.5,4,"Base width in artboard units."),F("pressure","Pressure",0,1,.05,.7,"How much pressure changes the width (0 = constant)."),F("taper","Taper",0,1,.05,.3,"Fraction of the length over which the ends thin out."),F("wobble","Wobble",0,1,.05,0,"Seeded hand tremor, in widths."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.smoothPath(e.points,e.closed);if(i.length<2)return o.draw("dot",n,e,{size:t.width,opacity:t.opacity});const s=[0];for(let f=1;f<i.length;f++)s.push(s[f-1]+Math.hypot(i[f][0]-i[f-1][0],i[f][1]-i[f-1][1]));const r=s[s.length-1]||1,a=i.map(f=>1-t.pressure+t.pressure*(f[3]??.5)*2),l=Math.max(1,t.width*1.5),d=new Array(i.length);for(let f=0,p=0,m=0,b=0;f<i.length;f++){for(;m<i.length&&s[m]<=s[f]+l;)b+=a[m++];for(;s[p]<s[f]-l;)b-=a[p++];d[f]=b/(m-p)}const c=i.map((f,p)=>{const m=s[p]/r,b=t.taper>0&&!e.closed?Math.min(1,Math.min(m,1-m)/(t.taper/2)):1;return Math.max(.15,t.width*.5*d[p]*(.35+.65*b))}),h=i.map((f,p)=>Math.max(.1,c[p]+(t.wobble?(o.rng()-.5)*t.wobble*t.width:0)));n.save(),n.globalAlpha*=t.opacity,n.fillStyle=e.color||o.INK,n.beginPath();const u=e.closed?i.length:i.length-1;for(let f=0;f<u;f++){const p=i[f],m=i[(f+1)%i.length],b=h[f],g=h[(f+1)%i.length];let w=m[0]-p[0],y=m[1]-p[1];const S=Math.hypot(w,y);if(S<1e-6)continue;w/=S,y/=S;const k=[[p[0]-y*b,p[1]+w*b],[m[0]-y*g,m[1]+w*g],[m[0]+y*g,m[1]-w*g],[p[0]+y*b,p[1]-w*b]];let v=0;for(let T=0;T<4;T++){const[x,L]=k[T],[A,P]=k[(T+1)%4];v+=x*P-A*L}v<0&&k.reverse(),k.forEach(([T,x],L)=>L?n.lineTo(T,x):n.moveTo(T,x)),n.closePath()}for(let f=0;f<i.length;f++)n.moveTo(i[f][0]+h[f],i[f][1]),n.arc(i[f][0],i[f][1],h[f],0,Math.PI*2);n.fill("nonzero"),n.restore()}},pen:{label:"Pen",roles:["line","gesture","plane","guide"],doc:"A line of one width everywhere, with round ends and joins: pressure and speed do not change it.",params:[F("width","Width",.25,60,.25,3,"Stroke width in artboard units."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.smoothPath(e.points,e.closed);if(i.length<2)return o.draw("dot",n,e,{size:t.width,opacity:t.opacity});n.save(),n.globalAlpha*=t.opacity,n.strokeStyle=e.color||o.INK,n.lineWidth=t.width,n.lineCap="round",n.lineJoin="round",o.tracePath(n,i,e.closed),n.stroke(),n.restore()}},speed:{label:"Speed lines",roles:["line","gesture"],doc:"After Ngan: short lines across the walk, as long as the hand was fast. Slow passages stay thin and dense.",params:[...gn(1.2,60),F("every","Every",1,12,1,1,"Draw one mark every n samples."),...Ht(.75)],draw(n,e,t,o){o.beginInk(n,e,t),o.frames(e).forEach((i,s)=>{if(s%t.every)return;const r=Math.min(t.max,.5+i.speed*t.gain)/2;o.segment(n,i.x-i.nx*r,i.y-i.ny*r,i.x+i.nx*r,i.y+i.ny*r)}),n.restore()}},restate:{label:"Restated line",roles:["line","gesture"],doc:"After Ngan and the life-drawing habit of restating: the walk drawn several times, the passes drifting apart where the hand was fast.",params:[F("times","Times",1,12,1,4,"How many passes."),F("spread","Spread",0,40,.5,6,"How far the passes drift, per unit of speed."),...Ht(.8,.6)],draw(n,e,t,o){o.beginInk(n,e,t);const i=o.frames(e);for(let s=0;s<t.times;s++){const r=o.rng()*Math.PI*2,a=.02+o.rng()*.05;n.beginPath(),i.forEach((l,d)=>{const c=Math.sin(r+d*a*6)*t.spread*(.3+Math.min(3,l.speed/8))*(s?1:.2),h=l.x+l.nx*c,u=l.y+l.ny*c;d?n.lineTo(h,u):n.moveTo(h,u)}),n.stroke()}n.restore()}},zigzag:{label:"Zigzag",roles:["line","gesture"],doc:"After Ngan: the walk as a zigzag whose amplitude follows the speed. The rhythm of the hand made visible.",params:[...gn(1,50),F("every","Every",1,12,1,2,"Samples per zig."),...Ht(1)],draw(n,e,t,o){o.beginInk(n,e,t),n.beginPath();let i=0;o.frames(e).forEach((s,r)=>{if(r%t.every)return;const a=Math.min(t.max,1+s.speed*t.gain)/2*(i++%2?1:-1);i===1?n.moveTo(s.x+s.nx*a,s.y+s.ny*a):n.lineTo(s.x+s.nx*a,s.y+s.ny*a)}),n.stroke(),n.restore()}},inner:{label:"Inner lines",roles:["line","gesture"],doc:"After Ngan: parallel lines inside the walk that open where the hand speeds up and close where it slows. A line becoming a plane.",params:[F("lines","Lines",2,16,1,5,"How many parallel lines."),...gn(1.5,80),...Ht(.6)],draw(n,e,t,o){o.beginInk(n,e,t);const i=o.frames(e,4,.8);for(let s=0;s<t.lines;s++){const r=t.lines===1?0:s/(t.lines-1)-.5;n.beginPath(),i.forEach((a,l)=>{const d=r*Math.min(t.max,1+a.speed*t.gain),c=a.x+a.nx*d,h=a.y+a.ny*d;l?n.lineTo(c,h):n.moveTo(c,h)}),n.stroke()}n.restore()}},dotted:{label:"Dotted walk",roles:["line","gesture"],doc:"After Ngan: a line of points. Where the hand lingered the dots swell, like ink pooling; fast passages leave specks.",params:[F("spacing","Spacing",2,60,1,10,"Distance between dots."),F("size","Size",.5,30,.5,6,"Largest dot."),F("gain","Speed gain",0,3,.05,.6,"How strongly speed shrinks the dots."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){n.save(),n.globalAlpha*=t.opacity,n.fillStyle=e.color||o.INK;let i=t.spacing,s=null,r=null;for(const a of o.frames(e)){if(s!==null&&(i+=Math.hypot(a.x-s,a.y-r)),s=a.x,r=a.y,i<t.spacing)continue;i=0;const l=Math.max(.3,t.size/(1+a.speed*t.gain*.2))/2;n.beginPath(),n.arc(a.x,a.y,l,0,Math.PI*2),n.fill()}n.restore()}},arcs:{label:"Arcs",roles:["line","gesture"],doc:"After Ngan: small arcs swung from the walk, their radius from the speed. The line as a sequence of gestures.",params:[...gn(.8,60),F("every","Every",1,24,1,4,"One arc every n samples."),F("sweep","Sweep",10,360,5,140,"Arc angle in degrees."),...Ht(.6)],draw(n,e,t,o){o.beginInk(n,e,t),o.frames(e).forEach((i,s)=>{if(s%t.every)return;const r=Math.min(t.max,1+i.speed*t.gain),a=Math.atan2(i.ny,i.nx),l=t.sweep*Math.PI/180;n.beginPath();for(let d=0;d<=16;d++){const c=a-l/2+l*d/16,h=i.x+Math.cos(c)*r,u=i.y+Math.sin(c)*r;d?n.lineTo(h,u):n.moveTo(h,u)}n.stroke()}),n.restore()}},flat:{label:"Flat",roles:["plane"],doc:"A flat, even fill of the plane: the simplest way to state a mass.",params:[F("opacity","Opacity",0,1,.05,1,"Paint opacity."),F("edge","Edge",0,20,.5,0,"Outline width (0 = no outline).")],draw(n,e,t,o){if(e.points.length<3)return;const i=o.smoothPath(e.points,!0);n.save(),n.globalAlpha*=t.opacity,n.fillStyle=e.color||"#8a8175",o.tracePath(n,i,!0),n.fill(),t.edge>0&&(n.strokeStyle=o.INK,n.lineWidth=t.edge,n.stroke()),n.restore()}},hatch:{label:"Hatch",roles:["plane"],doc:"Parallel lines inside the plane: value from spacing, direction from angle.",params:[F("angle","Angle",-90,90,1,45,"Line direction in degrees."),F("spacing","Spacing",2,80,.5,10,"Distance between lines (smaller = darker)."),F("width","Width",.25,12,.25,1.5,"Line width."),F("cross","Cross",0,1,1,0,"1 = add a second set at right angles."),F("jitter","Jitter",0,1,.05,.15,"Seeded irregularity of spacing and ends."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){if(e.points.length<3)return;const i=o.smoothPath(e.points,!0),s=i.reduce((l,d)=>l+d[0],0)/i.length,r=i.reduce((l,d)=>l+d[1],0)/i.length;n.save(),n.globalAlpha*=t.opacity,n.strokeStyle=e.color||o.INK,n.lineWidth=t.width,n.lineCap="round";const a=t.cross>=1?[t.angle,t.angle+90]:[t.angle];for(const l of a){const d=l*Math.PI/180,c=o.rotatePts(i,-d,s,r),h=c.map(p=>p[1]),u=Math.min(...h),f=Math.max(...h);n.beginPath();for(let p=u+t.spacing/2;p<f;p+=t.spacing*(1+(o.rng()-.5)*t.jitter)){const m=o.spans(c,p);for(let b=0;b+1<m.length;b+=2){const g=t.jitter*t.spacing,w=o.rotatePts([[m[b]+(o.rng()-.5)*g,p]],d,s,r)[0],y=o.rotatePts([[m[b+1]+(o.rng()-.5)*g,p]],d,s,r)[0];n.moveTo(w[0],w[1]),n.lineTo(y[0],y[1])}}n.stroke()}n.restore()}},stipple:{label:"Stipple",roles:["plane"],doc:"Seeded dots inside the plane: value from density.",params:[F("density","Density",5e-4,.05,5e-4,.006,"Dots per square unit."),F("size","Size",.5,12,.25,2,"Dot diameter."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){if(e.points.length<3)return;const i=o.smoothPath(e.points,!0),s=i.map(u=>u[0]),r=i.map(u=>u[1]),a=Math.min(...s),l=Math.max(...s),d=Math.min(...r),c=Math.max(...r),h=Math.min(4e4,Math.round((l-a)*(c-d)*t.density));n.save(),n.globalAlpha*=t.opacity,n.fillStyle=e.color||o.INK;for(let u=0;u<h;u++){const f=a+o.rng()*(l-a),p=d+o.rng()*(c-d),m=o.spans(i,p);let b=!1;for(let g=0;g+1<m.length;g+=2)f>=m[g]&&f<=m[g+1]&&(b=!0);b&&(n.beginPath(),n.arc(f,p,t.size/2,0,Math.PI*2),n.fill())}n.restore()}},charcoal:{texture:!0,label:"Charcoal",roles:["line","gesture"],doc:"Soft, smudgy dabs that catch on the paper's tooth: the more pressure, the wider and blacker; strong grain breaks the edge.",params:[F("width","Width",2,80,.5,14,"Stick width in artboard units."),F("pressure","Pressure",0,1,.05,.6,"How much pressure widens the mark and strengthens it (0 = even)."),F("dry","Dry",0,1,.05,.7,"How much the paper's tooth holds the charcoal back (0 = smooth, 1 = only the peaks)."),F("grain","Grain size",.2,4,.1,.7,"Size of the paper's tooth."),F("flow","Flow",.05,1,.05,.35,"How much each dab lays down: dabs overlap and build up."),F("scatter","Scatter",0,1.5,.05,.35,"How far dabs drift across the line, in widths."),F("hardness","Hardness",0,1,.05,.3,"Softness of the dab's edge."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.frames(e,3,.5);i.length&&o.paint(n,{key:o.hash("charcoal",e.points,t,e.seed),bounds:o.bounds(i,t.width*(1+t.scatter)),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"paper",scale:t.grain,strength:t.dry,seed:3},draw:s=>o.dabs(s,i,{tip:"soft",hardness:t.hardness,size:r=>t.width*(.45+.55*(1+t.pressure*(r.pressure-.5)*2)),flow:r=>t.flow*(.6+.8*t.pressure*r.pressure),spacing:.08,scatter:t.scatter,rng:o.rng})})}},chalk:{texture:!0,label:"Chalk",roles:["line","gesture"],doc:"A flat stick of pastel dragged across canvas: broad, dry, broken by the weave.",params:[F("width","Width",2,80,.5,18,"Stick width in artboard units."),F("aspect","Thickness",.1,1,.05,.35,"Thickness of the stick relative to its width."),F("dry","Dry",0,1,.05,.8,"How much the weave holds the chalk back."),F("grain","Grain size",.2,4,.1,.9,"Size of the weave."),F("flow","Flow",.05,1,.05,.55,"How much each dab lays down."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.frames(e,3,.6);i.length&&o.paint(n,{key:o.hash("chalk",e.points,t,e.seed),bounds:o.bounds(i,t.width),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"canvas",scale:t.grain,strength:t.dry,seed:5},draw:s=>o.dabs(s,i,{tip:"flat",aspect:t.aspect,angle:"follow",size:r=>t.width*(.7+.6*r.pressure),flow:t.flow,spacing:.06,scatter:.1,rng:o.rng})})}},pencil:{texture:!0,label:"Pencil",roles:["line","gesture"],doc:"A hard graphite point: thin, and it builds up where you go over it; light pressure leaves only the paper's peaks.",params:[F("width","Width",.5,12,.25,2.5,"Point width in artboard units."),F("pressure","Pressure",0,1,.05,.7,"How much pressure darkens the line."),F("dry","Dry",0,1,.05,.55,"How much the paper's tooth shows through."),F("grain","Grain size",.1,3,.1,.45,"Size of the paper's tooth."),F("flow","Flow",.05,1,.05,.3,"How much each dab lays down: passes build up."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.frames(e,4,.5);i.length&&o.paint(n,{key:o.hash("pencil",e.points,t,e.seed),bounds:o.bounds(i,t.width*2),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"paper",scale:t.grain,strength:t.dry,seed:11},draw:s=>o.dabs(s,i,{tip:"soft",hardness:.85,size:t.width,flow:r=>t.flow*(1-t.pressure+t.pressure*1.6*r.pressure),spacing:.18,scatter:.25,rng:o.rng})})}},bristles:{texture:!0,label:"Bristles",roles:["line","gesture"],doc:"A dry brush: many hairs side by side, each lifting off where the paint runs out (sooner when the hand is fast).",params:[F("width","Width",4,120,.5,34,"Brush width in artboard units."),F("hairs","Hairs",3,80,1,28,"How many bristles."),F("thickness","Hair",.3,6,.1,1.5,"Thickness of a bristle."),F("dry","Dry",0,1,.05,.4,"How soon the paint runs out (0 = loaded, 1 = nearly dry)."),F("body","Body",0,1,.05,.12,"A faint even stroke under the hairs."),F("grain","Grain size",.2,4,.1,1,"Size of the paper's tooth."),F("tooth","Tooth",0,1,.05,.25,"How much the paper's tooth breaks the hairs up further."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.frames(e,3,.7);if(i.length<2)return o.draw("dot",n,e,{size:t.width*.5,opacity:t.opacity});o.paint(n,{key:o.hash("bristles",e.points,t,e.seed),bounds:o.bounds(i,t.width*.8),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"paper",scale:t.grain,strength:t.tooth,seed:7},draw:s=>{t.body>0&&o.dabs(s,i,{tip:"soft",hardness:.6,size:t.width*.9,flow:t.body,spacing:.15,rng:o.rng}),o.hairs(s,i,{count:t.hairs,width:r=>t.width*(.6+.6*r.pressure),thickness:t.thickness,dry:t.dry,rng:o.rng})}})}},oil:{texture:!0,label:"Oil",roles:["line","gesture"],doc:"A loaded flat brush: many hairs packed side by side into one body of paint with streaks in it, a tapered stroke and ragged ends; the painterly stroke.",params:[F("width","Width",4,160,.5,40,"Brush width in artboard units."),F("hair","Hair",.5,6,.1,1.6,"Thickness of a bristle: coarse hairs leave visible streaks."),F("flow","Load",.2,1,.05,.9,"How much paint each hair carries (less: more streaks)."),F("dry","Dry",0,1,.05,.1,"How soon the paint runs out along the stroke."),F("trim","Ragged ends",0,.8,.05,.3,"How far hairs may start late and end early."),F("streaks","Streaks",0,1,.05,.35,"How much the hairs differ in the paint they carry (0: an even body of paint)."),F("taper","Taper",0,1,.05,.4,"How much the stroke narrows at its ends."),F("grain","Grain size",.2,4,.1,.5,"Size of the canvas weave."),F("tooth","Tooth",0,1,.05,.2,"How much the canvas weave shows in the paint."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){const i=o.frames(e,3,.7);if(i.length<2)return o.draw("dot",n,e,{size:t.width*.5,opacity:t.opacity});o.paint(n,{key:o.hash("oil",e.points,t,e.seed),bounds:o.bounds(i,t.width*.8),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"canvas",scale:t.grain,strength:t.tooth,seed:17},draw:s=>o.hairs(s,i,{count:Math.max(6,Math.min(160,Math.round(t.width/(t.hair*.5)))),width:(r,a)=>t.width*(.5+.7*r.pressure)*(1-t.taper*(1-Math.pow(Math.sin(Math.PI*Math.min(1,Math.max(0,a))),.5))),thickness:t.hair,flow:t.flow,dry:t.dry,trim:t.trim,streaks:t.streaks,rng:o.rng})})}},marker:{texture:!0,label:"Marker",roles:["line","gesture"],doc:"A broad felt tip: even and slightly see-through, so crossing strokes show through each other, and a stroke does not darken where it overlaps itself.",params:[F("width","Width",2,80,.5,16,"Tip width in artboard units."),F("aspect","Chisel",.1,1,.05,.4,"How flat the tip is (1 = round-ish)."),F("grain","Grain size",.2,4,.1,.6,"Size of the paper's tooth."),F("tooth","Tooth",0,1,.05,.15,"How much the paper shows through."),F("opacity","Opacity",0,1,.05,.6,"Paint opacity (the whole stroke at once).")],draw(n,e,t,o){const i=o.frames(e,3,.7);i.length&&o.paint(n,{key:o.hash("marker",e.points,t,e.seed),bounds:o.bounds(i,t.width),color:e.color||o.INK,alpha:t.opacity,grain:{kind:"paper",scale:t.grain,strength:t.tooth,seed:2},draw:s=>o.dabs(s,i,{tip:"flat",aspect:t.aspect,angle:Math.PI/4,size:t.width,flow:1,spacing:.05})})}},wash:{texture:!0,label:"Wash",roles:["plane"],doc:"Watercolor: a thin, transparent fill whose pigment gathers at the edge and settles into the paper's grain.",params:[F("body","Body",.05,1,.05,.55,"How strong the wash is inside."),F("edge","Edge",0,1,.05,.6,"How much darker the rim is."),F("rim","Rim width",.5,30,.5,5,"Width of the darker rim, in artboard units."),F("rough","Wander",0,12,.25,1.5,"How much the edge wanders."),F("granulation","Granulation",0,1,.05,.4,"How much pigment settles into the paper's grain."),F("grain","Grain size",.2,4,.1,.8,"Size of the paper's grain."),F("opacity","Opacity",0,1,.05,1,"Paint opacity.")],draw(n,e,t,o){if(e.points.length<3)return;const i=o.smoothPath(e.points,!0),s=i.map(l=>l[0]),r=i.map(l=>l[1]),a=t.rough*2+t.rim*2+4;o.paint(n,{key:o.hash("wash",e.points,t,e.seed),bounds:[Math.floor(Math.min(...s)-a),Math.floor(Math.min(...r)-a),Math.ceil(Math.max(...s)+a),Math.ceil(Math.max(...r)+a)],color:e.color||"#8a8175",alpha:t.opacity,grain:{kind:"paper",scale:t.grain,strength:t.granulation,seed:13},draw:(l,d)=>o.wash(d,i,{edge:t.edge,rimWidth:t.rim,rough:t.rough,base:t.body,seed:e.seed||1})})}}};function ja(n,e){const t=(f,p)=>{const m=Math.sin(f*127.1+p*311.7)*43758.5453;return m-Math.floor(m)},o=Math.floor(n),i=Math.floor(e),s=n-o,r=e-i,a=s*s*(3-2*s),l=r*r*(3-2*r),d=t(o,i),c=t(o+1,i),h=t(o,i+1),u=t(o+1,i+1);return(d+(c-d)*a+(h-d)*l+(d-c-h+u)*a*l)*2-1}const lo=new Map;function Fa(n){if(!n||typeof Image>"u")return null;let e=lo.get(n);return e||(e=new Image,e.onload=()=>De.onImageLoad?.(),e.src=n,lo.set(n,e)),e.complete&&e.naturalWidth?e:null}const De={image:Fa,smoothPath:Rn,tracePath:Oa,spans:za,rotatePts:Na,frames:yi,segment:Ra,beginInk:Da,INK:Bn,noise:ja,paint(n,e){return Ia(n,{scale:this.scale,...e})},dabs:Ea,hairs:La,wash:Ca,bounds:Ba,hash:Ds,layer:ki,grain:vi,draw(n,e,t,o={}){const i=Z[n];i&&i.draw(e,t,Pe(n,o),this)},source(n,e){return tn(n,e||this.board,{peek:!!this.frozen})}};function co(n={}){if(n&&n.smoothPath)return n;const e=Object.create(De);return e.rng=n?.rng||Math.random,e.scale=n?.scale||1,e.board=n?.board,e.frozen=n?.frozen,e.age=n?.age||0,e.now=n?.now??null,n?.straight&&(e.smoothPath=t=>t.map(o=>o.slice())),e}for(const n of Object.values(Z))Mi(n);function Mi(n){return n.rawDraw||(n.rawDraw=n.draw,n.draw=function(e,t,o,i){if(!n.custom)return n.rawDraw(e,t,o,co(i));e.save();try{n.rawDraw(e,t,o,co(i)),e.restore()}catch(s){e.restore(),n.warned||(n.warned=!0,n.lastError=s.message,console.warn(`brush "${n.id||n.label}" failed (drawn plainly instead): ${s.message}`));const r=t.role==="plane"?"flat":t.role==="point"?"dot":"ink";Z[r].draw(e,t,Pe(r,{}),i)}}),n}const We=n=>JSON.stringify(n);function Si(n){const e=Z[n];if(!e)return null;if(e.source)return e.source;const t=e.params.map(r=>`    ${r.key}: [${r.min}, ${r.max}, ${r.default}${r.doc?`, ${We(r.doc)}`:""}]`).join(`,
`);let o=e.rawDraw.toString();/^draw\s*\(/.test(o)||(o=`draw${o.replace(/^function\s*\w*\s*/,"")}`);const i=o.split(`
`),s=i.length>1?i[i.length-1].match(/^ */)[0].length:0;return o=[i[0],...i.slice(1).map(r=>`  ${r.slice(Math.min(s,r.match(/^ */)[0].length))}`)].join(`
`),`brush({
  id: ${We(n)},
  label: ${We(e.label)},
  roles: ${We(e.roles)},
  doc: ${We(e.doc||"")},${e.construction?`
  construction: true,`:""}
  params: {
${t}
  },
  ${o}
})
`}function _a(n){const e=Object.entries(n.params||{}).map(([i,s])=>`    ${i}: ${We(Array.isArray(s)?s:[s.min,s.max,s.default,s.doc].filter(r=>r!==void 0))}`).join(`,
`);let t=n.draw.toString();const o=/^draw\s*\(/.test(t)?t:/^(async\s+)?function\b/.test(t)?`draw${t.replace(/^function\s*\w*\s*/,"")}`:`draw: ${t}`;return`brush({
  id: ${We(n.id)},
  label: ${We(n.label||n.id)},
  roles: ${We(n.roles||["line","gesture","plane"])},
  doc: ${We(n.doc||"")},${n.construction?`
  construction: true,`:""}
  params: {
${e}
  },
  ${o}
})
`}function $i(n){let e=null;if(new Function("brush",`"use strict";
${n}`)(o=>{e=o}),!e)throw new Error("The code must call brush({ id, draw(ctx, e, p, k) { … } })");if(!/^[a-z][\w-]*$/i.test(e.id||""))throw new Error('brush id must be a word like "teeth"');if(typeof e.draw!="function")throw new Error("brush needs draw(ctx, e, p, k) { … }");const t=Object.entries(e.params||{}).map(([o,i])=>{const[s,r,a,l]=Array.isArray(i)?i:[i.min??0,i.max??1,i.default??0,i.doc];return F(o,o,Number(s),Number(r),Math.abs(Number(r)-Number(s))/100||.01,Number(a),l||"")});return Mi({label:e.label||e.id,roles:e.roles||["line","gesture","plane"],doc:e.doc||"",construction:!!e.construction,params:t,draw:e.draw,source:n,custom:!0,id:e.id})}const Pi="ams_brushes_v1",Wa=new Set(Object.keys(Z)),Dn=n=>Wa.has(n);function js(){try{return JSON.parse(globalThis.localStorage?.getItem(Pi)||"{}")}catch{return{}}}function Ai(n){try{globalThis.localStorage?.setItem(Pi,JSON.stringify(n))}catch{}}function ln(n,e="library"){const t=$i(n);if(Dn(t.id))throw new Error(`"${t.id}" is a built-in brush: give your version its own id`);return t.scope=e,Z[t.id]=t,t}function Ha(n){const e=ln(n,"library"),t=js();return t[e.id]=n,Ai(t),e}function Ua(n){const e=js(),t=n in e;return delete e[n],Ai(e),Z[n]?.scope==="library"&&delete Z[n],t}function qa(){for(const n of Object.values(js()))try{ln(n,"library")}catch(e){console.warn("brush library:",e.message)}}function Ka(n){if(!n?.elements)return n;n.brushes=n.brushes||{};for(const e of n.elements){const t=e.realize?.brush,o=Z[t];o?.custom&&o.source&&!n.brushes[t]&&!n.lines?.[t]&&(n.brushes[t]=o.source)}return n}function Pe(n,e={}){const t=Z[n]||Z.ink,o={};for(const i of t.params){const s=e[i.key];o[i.key]=Number.isFinite(Number(s))?Math.min(i.max,Math.max(i.min,Number(s))):i.default}return o}function jn(n,e=null){return Object.entries(Z).filter(([t,o])=>o.roles.includes(n)&&(!o.custom||o.scope==="library"||e?.lines?.[t]||e?.brushes?.[t])).sort((t,o)=>+!!t[1].construction-+!!o[1].construction).map(([t,o])=>({id:t,label:o.label}))}const bn=new Map;function sn(n){for(const[e,t]of Object.entries(n?.brushes||{}))if(!(Dn(e)||bn.get(e)===t))try{ln(t,"doc"),bn.set(e,t)}catch(o){console.warn(`brush "${e}":`,o.message)}for(const[e,t]of Object.entries(n?.lines||{})){if(!t?.source||Z[e]&&!Z[e].custom)continue;const o=`${e}
${t.source}
${JSON.stringify(t.params||{})}`;if(bn.get(e)===o)continue;let i;try{i=new Function(`return (${t.source});`)()}catch(r){i=()=>{throw r}}const s=Object.entries(t.params||{}).map(([r,[a,l,d]])=>F(r,r,a,l,(l-a)/100,d,`${e}: ${r}`));Z[e]={label:e,roles:["line","gesture","plane"],doc:t.doc||"A line defined in this drawing's score.",custom:!0,params:s,draw(r,a,l,d){const c=a.color||Bn;r.save(),r.strokeStyle=c,r.fillStyle=c,r.lineWidth=1,r.lineCap="round",r.lineJoin="round";try{i(r,yi(a),l,{color:c,rng:d.rng,closed:a.closed,points:a.points,scale:d.scale})}catch(h){r.restore(),r.save(),Z.ink.draw(r,a,Pe("ink",{}),d),console.warn(`line "${e}" failed: ${h.message}`)}r.restore()}},bn.set(e,o)}}const Cn={linear:n=>n,smooth:n=>n*n*(3-2*n),"ease-in":n=>n*n,"ease-out":n=>1-(1-n)*(1-n)},ks=n=>n<0?0:n>1?1:n,dt=(n,e=0)=>Number.isFinite(Number(n))&&n!==null&&n!==""?Number(n):e;function Mt(n){if(n==null||n===!1)return null;if(typeof n=="object"&&typeof n.in=="number"&&Cn[n.curve]&&n.in>=0)return n;if(typeof n=="number")return n>0?{in:0,out:n,curve:"smooth"}:null;if(typeof n!="object")return null;const e={in:Math.max(0,dt(n.in)),curve:Cn[n.curve]?n.curve:"smooth"};return n.out!==void 0&&(e.out=Math.max(0,dt(n.out))),n.hold!==void 0&&(e.hold=Math.max(0,dt(n.hold))),n.life!==void 0&&dt(n.life)>0&&(e.life=dt(n.life)),n.draw!==void 0&&dt(n.draw)>0&&(e.draw=dt(n.draw)),n.loop&&(e.loop=!0),e}function Fs(n){const e=Mt(n);return e?e.life!==void 0?e.life:e.out===void 0?1/0:e.in+(e.hold??0)+e.out:1/0}function Ga(n,e){const t=Mt(n);if(!t)return 1;const o=Fs(t);if(t.loop&&Number.isFinite(o)&&o>0&&(e=(e%o+o)%o),e<0)return 0;const i=Cn[t.curve];let s=t.in>0?i(ks(e/t.in)):1;if(t.out!==void 0&&Number.isFinite(o)){const r=o-t.out;if(e>=o)return 0;e>r&&t.out>0&&(s*=1-i(ks((e-r)/t.out)))}return s}function Ja(n,e){const t=Mt(n);return!t||!t.draw?1:Cn[t.curve](ks(e/t.draw))}const Va=(n,e)=>{const t=Mt(n);return!!t&&!t.loop&&e>=Fs(t)};function Ti(n,e){const t=Mt(n);if(!t)return 1/0;if(t.loop||e<t.in||t.draw&&e<t.draw)return 0;const o=Fs(t);if(!Number.isFinite(o)||e>=o)return 1/0;const i=t.out>0?o-t.out:o;return e<i?i-e:0}function Ei(n,e){if(e>=1||n.length<2)return n;if(e<=0)return n.slice(0,1);const t=[0];for(let s=1;s<n.length;s++)t.push(t[s-1]+Math.hypot(n[s][0]-n[s-1][0],n[s][1]-n[s-1][1]));const o=t[t.length-1]*e,i=[n[0]];for(let s=1;s<n.length;s++){if(t[s]<=o){i.push(n[s]);continue}const r=(o-t[s-1])/(t[s]-t[s-1]||1),a=n[s-1],l=n[s];if(r<=1e-9)break;i.push(a.map((d,c)=>d+(l[c]-d)*r));break}return i}const Li=1,In=["normal","multiply","screen","overlay","darken","lighten","color-burn","color-dodge","soft-light","hard-light","difference","exclusion","hue","saturation","color","luminosity"],Xt=Object.freeze({point:"A mark at a place: tension depends on where it sits (Kandinsky).",line:"A point that moved (Klee: a line going for a walk).",plane:"An enclosed area: realized by fill, hatching, or a field.",guide:"Construction that is not part of the picture: axes, horizons, envelopes.",gesture:"The movement behind a form: often drawn first, often hidden later.",note:"A written annotation: reasons, critique, questions.",image:"A picture placed on the page: a collage layer, a study, a quotation."}),on=Object.freeze(["analysis","concept","construction","blocking","structure","value","marks","accents","notes"]),Bi=()=>[{id:"construction",name:"Construction",kind:"construction",visible:!0,locked:!1},{id:"marks",name:"Marks",kind:"marks",visible:!0,locked:!1},{id:"notes",name:"Notes",kind:"notes",visible:!0,locked:!1}];let Ya=0;const xe=(n="el")=>`${n}_${Date.now().toString(36)}${(Ya++).toString(36)}${Math.random().toString(36).slice(2,5)}`,rn=Object.freeze({point:{brush:"dot",params:{}},line:{brush:"ink",params:{}},plane:{brush:"flat",params:{}},guide:{brush:"guide",params:{}},gesture:{brush:"guide",params:{}},note:{brush:"none",params:{}},image:{brush:"image",params:{}}});function Xe({width:n=1e3,height:e=1e3,ground:t="#f3efe6",title:o="Untitled"}={}){return{type:"ams-process",version:Li,title:o,artboard:{width:n,height:e,ground:t},stages:Bi(),elements:[],decisions:[],meta:{created:new Date().toISOString()}}}function Me(n,{own:e=!1}={}){const t=n&&typeof n=="object"?e?n:structuredClone(n):Xe();t.type="ams-process",t.version=Li,t.artboard={width:1e3,height:1e3,ground:"#f3efe6",...t.artboard||{}},t.stages=Array.isArray(t.stages)&&t.stages.length?t.stages:Bi();for(const i of t.stages)i.id||=xe("stage"),i.name||=i.id,i.kind||="marks",i.visible=i.visible!==!1,i.locked=!!i.locked;const o=new Set(t.stages.map(i=>i.id));return t.elements=(t.elements||[]).map(i=>Ne(i,o.has(i.stage)?i.stage:t.stages[0].id)),t.decisions=t.decisions||[],t.lines=t.lines&&typeof t.lines=="object"?t.lines:{},t.groups=t.groups&&typeof t.groups=="object"?t.groups:{},t.brushes=t.brushes&&typeof t.brushes=="object"?t.brushes:{},sa(t),t.train&&!V(t).some(i=>i.id===t.train)&&delete t.train,sn(t),t}function Ut(n,e){if("maskWith"in e){const t=e.maskWith;t&&typeof t=="object"&&(t.source||t.board)?n.maskWith=JSON.parse(JSON.stringify(t)):delete n.maskWith}for(const t of["fx","sourceFx"])if(t in e){const o=e[t];Array.isArray(o)&&o.length?n[t]=JSON.parse(JSON.stringify(o)):delete n[t]}}function Ne(n,e){const t=Xt[n.role]?n.role:"line";return{id:n.id||xe(),stage:n.stage||e,role:t,points:(n.points||[]).map(o=>[Number(o[0])||0,Number(o[1])||0,Number(o[2])||0,o[3]===void 0?.5:Number(o[3])]),closed:t==="plane"?!0:!!n.closed,realize:{...rn[t]||rn.line,...n.realize||{},params:{...n.realize?.params||{}}},color:n.color||null,...n.fill?{fill:n.fill}:{},text:t==="note"?String(n.text||""):n.text,why:n.why||"",by:n.by||{kind:"user",name:"you"},seed:n.seed??Math.floor(Math.random()*1e9),created:n.created||Date.now(),...n.label?{label:String(n.label)}:{},...n.group?{group:String(n.group)}:{},...n.board&&n.board!==H?{board:String(n.board)}:{},...n.hidden?{hidden:!0}:{},...n.locked?{locked:!0}:{},...n.note&&typeof n.note=="object"?{note:{...n.note}}:{},...n.src?{src:String(n.src)}:{},...n.asset?{asset:String(n.asset)}:{},...n.bake&&typeof n.bake=="object"?{bake:{...n.bake}}:{},...Number.isFinite(Number(n.opacity))&&Number(n.opacity)<1?{opacity:Math.max(0,Number(n.opacity))}:{},...n.blend&&n.blend!=="normal"?{blend:String(n.blend)}:{},...n.path==="straight"?{path:"straight"}:{},...Mt(n.time)?{time:Mt(n.time),born:Number.isFinite(Number(n.born))?Number(n.born):Date.now()}:{}}}function ho(n,e,t){if(!n||!t)return!1;const o=(e[0]-n[0])*(t[1]-n[1])-(e[1]-n[1])*(t[0]-n[0]),i=(e[0]-n[0])*(t[0]-e[0])+(e[1]-n[1])*(t[1]-e[1]);return Math.abs(o)<1e-6&&i>=0}class Xa{constructor(e){this.doc=Me(e||Xe()),this.past=[],this.future=[],this.listeners=new Set,this.log=[]}trimPast(e=200,t=15e7){let o=0;for(const i of this.past)o+=i.length;for(;this.past.length>1&&(this.past.length>e||o>t);)o-=this.past.shift().length}subscribe(e,{live:t=!1}={}){return e.live=t,this.listeners.add(e),()=>this.listeners.delete(e)}emit(e,t=!1){this.rev=(this.rev||0)+1;for(const o of this.listeners)(!t||o.live)&&o(this.doc,e)}change(e,t,{by:o="user",record:i=!0,transient:s=!1}={}){s||(this.past.push(JSON.stringify(this.doc)),this.trimPast(),this.future=[]);const r=t(this.doc);return Ka(this.doc),i&&!s&&this.log.push({t:Date.now(),label:e,by:o}),this.emit(e,s),r}commitFrom(e,t,{by:o="user"}={}){e!==JSON.stringify(this.doc)&&(this.past.push(e),this.trimPast(),this.future=[],this.log.push({t:Date.now(),label:t,by:o}),this.emit(t))}replace(e,t="load"){this.change(t,()=>{this.doc=Me(e)})}undo(){return this.past.length?(this.future.push(JSON.stringify(this.doc)),this.doc=JSON.parse(this.past.pop()),this.emit("undo"),!0):!1}redo(){return this.future.length?(this.past.push(JSON.stringify(this.doc)),this.trimPast(),this.doc=JSON.parse(this.future.pop()),this.emit("redo"),!0):!1}addElement(e,t){return this.change(`add ${e.role||"element"}`,o=>{const i=Ne(e,e.stage||o.stages[0].id);if(!("board"in e)){const s=us(o,i.points);s!==H&&(i.board=s)}return o.elements.push(i),i},t)}updateElement(e,t,o="edit",i){return this.change(o,s=>{const r=s.elements.find(a=>a.id===e);return r?(Object.assign(r,t),t.realize&&(r.realize={...r.realize,...t.realize,params:{...r.realize.params,...t.realize.params||{}}}),r):null},i)}patchElements(e,t,o="edit",i){const s=new Set(e);return this.change(o,r=>{for(const a of r.elements)if(s.has(a.id))for(const[l,d]of Object.entries(t))d===null||d===!1?delete a[l]:a[l]=d},i)}group(e,t=null,o){return this.change("group",i=>{const s=xe("group");i.groups=i.groups||{},i.groups[s]={name:t||`Group ${Object.keys(i.groups).length+1}`};const r=new Set(e);for(const a of i.elements)r.has(a.id)&&(a.group=s);return s},o)}ungroup(e,t){const o=new Set(e);return this.change("ungroup",i=>{for(const r of i.elements)o.has(r.id)&&delete r.group;const s=new Set(i.elements.map(r=>r.group).filter(Boolean));for(const r of Object.keys(i.groups||{}))s.has(r)||delete i.groups[r]},t)}renameGroup(e,t,o){return this.change("rename group",i=>{i.groups?.[e]&&(i.groups[e].name=t)},o)}reorder(e,{before:t=null,stage:o=null,group:i}={},s){return this.change("reorder",r=>{const a=new Set(e),l=r.elements.filter(h=>a.has(h.id));r.elements=r.elements.filter(h=>!a.has(h.id));const d=t?r.elements.find(h=>h.id===t):null;for(const h of l)d?h.stage=d.stage:o&&(h.stage=o),i!==void 0&&(i?h.group=i:delete h.group);let c=d?r.elements.indexOf(d):-1;if(c<0){const h=l[0]?.stage;c=r.elements.map(f=>f.stage).lastIndexOf(h)+1}r.elements.splice(c,0,...l)},s)}arrange(e,t,o){const i=new Set(e);return this.change(`arrange ${t}`,s=>{for(const r of s.stages){const a=s.elements.filter(c=>c.stage===r.id);if(!a.some(c=>i.has(c.id)))continue;let l=a.slice();if(t==="front")l=[...l.filter(c=>!i.has(c.id)),...l.filter(c=>i.has(c.id))];else if(t==="back")l=[...l.filter(c=>i.has(c.id)),...l.filter(c=>!i.has(c.id))];else if(t==="forward")for(let c=l.length-2;c>=0;c--)i.has(l[c].id)&&!i.has(l[c+1].id)&&([l[c],l[c+1]]=[l[c+1],l[c]]);else if(t==="backward")for(let c=1;c<l.length;c++)i.has(l[c].id)&&!i.has(l[c-1].id)&&([l[c],l[c-1]]=[l[c-1],l[c]]);s.elements.map((c,h)=>c.stage===r.id?h:-1).filter(c=>c>=0).forEach((c,h)=>{s.elements[c]=l[h]})}},o)}duplicate(e,t=20,o=20,i){return this.change("duplicate",s=>{const r=new Set(e),a={},l=[];for(const d of s.elements.filter(c=>r.has(c.id))){const c=structuredClone(d);c.id=xe(d.role),c.points=c.points.map(([h,u,...f])=>[h+t,u+o,...f]),d.group&&(a[d.group]||=xe("group"),c.group=a[d.group],s.groups=s.groups||{},s.groups[c.group]={name:`${s.groups[d.group]?.name||"Group"} copy`}),s.elements.push(c),l.push(c.id)}return l},i)}simplify(e,t,o){const i=new Set(e);return this.change("simplify",s=>{let r=0,a=0;for(const l of s.elements)!i.has(l.id)||l.points.length<4||["point","note","image"].includes(l.role)||(r+=l.points.length,l.points=xs(l.points,t),a+=l.points.length);return{before:r,after:a}},o)}removeElements(e,t){const o=new Set(e);return this.change("delete",i=>{i.elements=i.elements.filter(s=>!o.has(s.id))},t)}addStage(e,t=null,o){return this.change("add stage",i=>{const s={id:xe("stage"),name:"Stage",kind:"marks",visible:!0,locked:!1,...e};return t===null?i.stages.push(s):i.stages.splice(t,0,s),s},o)}updateStage(e,t,o){return this.change("edit stage",i=>{const s=i.stages.find(r=>r.id===e);return s&&Object.assign(s,t),s},o)}moveStage(e,t){return this.change("reorder stages",o=>{const i=o.stages.findIndex(a=>a.id===e),s=i+t;if(i<0||s<0||s>=o.stages.length)return;const[r]=o.stages.splice(i,1);o.stages.splice(s,0,r)})}removeStage(e){return this.change("delete stage",t=>{if(t.stages.length<=1)return;const o=t.stages.find(i=>i.id!==e).id;t.stages=t.stages.filter(i=>i.id!==e);for(const i of t.elements)i.stage===e&&(i.stage=o)})}snapMarks(e,t,o,i){const s=r=>Math.round(r/o)*o;return this.change(`snap ${t}`,r=>{let a=0;for(const l of r.elements)if(!(!e.includes(l.id)||!l.points.length)){if(t==="topleft"||t==="center"){let d=1/0,c=1/0,h=-1/0,u=-1/0;for(const[g,w]of l.points)d=Math.min(d,g),c=Math.min(c,w),h=Math.max(h,g),u=Math.max(u,w);const[f,p]=t==="center"?[(d+h)/2,(c+u)/2]:[d,c],m=s(f)-f,b=s(p)-p;l.points=l.points.map(([g,w,y,S])=>[g+m,w+b,y,S])}else{let d=l.points.map(([c,h,u,f])=>[s(c),s(h),u,f]);t==="tidy"&&(d=d.filter((c,h)=>h===0||c[0]!==d[h-1][0]||c[1]!==d[h-1][1]),l.closed&&d.length>1&&d[0][0]===d.at(-1)[0]&&d[0][1]===d.at(-1)[1]&&(d=d.slice(0,-1)),d=d.filter((c,h)=>h===0||h===d.length-1?!(l.closed&&d.length>3&&ho(d.at(h-1),c,d[(h+1)%d.length])):!ho(d[h-1],c,d[h+1])),d.length<2&&(d=l.points.slice(0,2).map(([c,h,u,f])=>[s(c),s(h),u,f]))),l.points=d}a++}return a},i)}addBoard(e={},t){return this.change("add board",o=>{const i=Number(e.width)||o.artboard.width,s=Number(e.height)||o.artboard.height,r=Number.isFinite(e.x)&&Number.isFinite(e.y)?{x:e.x,y:e.y,width:i,height:s}:en(o,i,s),a={id:e.id&&!V(o).some(l=>l.id===e.id)?String(e.id):Nn(o),title:e.title||`Board ${V(o).length+1}`,...r,ground:e.ground||o.artboard.ground};if(o.boards.push(a),e.adopt??(Number.isFinite(e.x)&&Number.isFinite(e.y)))for(const l of o.elements)l.board===ve&&us(o,l.points)===a.id&&(l.board=a.id);return a},t)}updateBoard(e,t,o){return this.change("board",i=>{if(e===H){"title"in t&&(i.artboard.title=t.title);for(const r of["width","height","ground","text","code","pseudo","kind"])r in t&&(t[r]===""||t[r]==null||r==="kind"&&t[r]==="drawing"?delete i.artboard[r]:i.artboard[r]=t[r]);for(const r of hs)r in t&&(t[r]?i.artboard[r]=!0:delete i.artboard[r]);"rate"in t&&(Re(t)?i.artboard.rate=Re(t):delete i.artboard.rate),Ut(i.artboard,t);return}const s=i.boards.find(r=>r.id===e);if(s){if(("x"in t||"y"in t)&&t.moveMarks!==!1){const r=(t.x??s.x)-s.x,a=(t.y??s.y)-s.y;for(const l of i.elements)l.board===e&&(l.points=l.points.map(([d,c,h,u])=>[d+r,c+a,h,u]))}for(const r of["title","ground","width","height","x","y"])r in t&&(s[r]=t[r]);for(const r of hs)r in t&&(t[r]?s[r]=!0:delete s[r]);"rate"in t&&(Re(t)?s.rate=Re(t):delete s.rate),Ut(s,t);for(const r of["text","code","pseudo","kind"])r in t&&(t[r]===""||t[r]==null||r==="kind"&&t[r]==="drawing"?delete s[r]:s[r]=String(t[r]));s.kind==="p5"&&s.code&&("width"in t||"height"in t)&&(s.code=s.code.replace(/createCanvas\(\s*\d+\s*,\s*\d+/,`createCanvas(${Math.round(s.width)}, ${Math.round(s.height)}`))}},o)}removeBoard(e,{deleteMarks:t=!1}={},o){if(e!==H)return this.change("remove board",i=>{if(i.boards=i.boards.filter(s=>s.id!==e),t)i.elements=i.elements.filter(s=>s.board!==e);else for(const s of i.elements)s.board===e&&(s.board=ve);i.train===e&&delete i.train},o)}moveBoard(e,t,o){return this.change("reorder boards",i=>{const s=i.boards.findIndex(l=>l.id===e),r=s+t;if(s<0||r<0||r>=i.boards.length)return;const[a]=i.boards.splice(s,1);i.boards.splice(r,0,a)},o)}placeBoard(e,t,o){return this.change("reorder boards",i=>{const s=i.boards.findIndex(a=>a.id===e);if(s<0)return;const[r]=i.boards.splice(s,1);i.boards.splice(Math.max(0,Math.min(i.boards.length,t)),0,r)},o)}assignBoard(e,t,o){return this.change("move to board",i=>{for(const s of i.elements)e.includes(s.id)&&(!t||t===H?delete s.board:s.board=t)},o)}runBoardCode(e,t,o,i){const s=V(this.doc).find(a=>a.id===e);if(!s)return{error:"No such board"};const r=o(t,{base:{...Xe({width:s.width,height:s.height,ground:s.ground}),stages:[]},by:{kind:"code",name:s.id},origin:{x:s.x,y:s.y},...i?.seed!==void 0?{seed:i.seed}:{},...i?.fresh?{fresh:!0}:{}});return r.error?{error:r.error,line:r.errorLine,logs:r.logs}:(i?.transient&&(this.lastLiveBoard=e),this.change(i?.transient?"live board code":"board code",a=>{const l=f=>f.by?.kind==="code"&&f.by?.name===e;a.elements=a.elements.filter(f=>!l(f)),a.decisions=a.decisions.filter(f=>!(f.by?.kind==="code"&&f.by?.name===e)),Object.assign(a.brushes,r.doc.brushes||{}),Object.assign(a.lines,r.doc.lines||{});const d=new Map;for(const f of r.doc.stages){let p=a.stages.find(m=>m.name===f.name);p||(p={...f,id:xe("stage")},a.stages.push(p)),d.set(f.id,p.id)}const c=e===H?void 0:e;for(const f of r.doc.elements)a.elements.push({...f,id:xe(f.role),stage:d.get(f.stage)||a.stages[0].id,by:{kind:"code",name:e},...c?{board:c}:{},points:f.points.map(([p,m,b,g])=>[p+s.x,m+s.y,b,g])});for(const f of r.doc.decisions)a.decisions.push({...f,id:xe("dec"),stage:d.get(f.stage)||a.stages[0].id,by:{kind:"code",name:e}});e===H?a.artboard.code=t:a.boards.find(f=>f.id===e).code=t;const h=r.underlay,u=e===H?a.artboard:a.boards.find(f=>f.id===e);u&&r.mask!==void 0&&(r.mask&&typeof r.mask=="object"?Ut(u,{maskWith:r.mask}):r.mask?u.mask=!0:(delete u.mask,delete u.maskWith)),u&&r.fx!==void 0&&Ut(u,{fx:r.fx}),u&&h&&Array.isArray(h.fx)&&Ut(u,{sourceFx:h.fx}),h&&u&&(h.source===null?(delete u.source,delete u.sourceOpacity,delete u.sourceFit,delete u.sourceBlend):(h.source&&(u.source=String(h.source)),u.source&&(h.opacity!==void 0?u.sourceOpacity=Math.max(0,Math.min(1,Number(h.opacity)||0)):u.sourceOpacity??=.5,h.blend!==void 0&&(h.blend&&h.blend!=="normal"?u.sourceBlend=String(h.blend):delete u.sourceBlend),h.fit!==void 0&&(h.fit==="contain"?u.sourceFit="contain":delete u.sourceFit))))},i),{error:null,logs:r.logs,marks:r.doc.elements.length})}setTrainBoard(e,t){return this.change("training board",o=>{!e||e===H?delete o.train:o.train=e},t)}addDecision(e,t){return this.change("decision",o=>{const i={id:xe("dec"),t:Date.now(),...e};return o.decisions.push(i),i},t)}ordered(){const e=new Map(this.doc.stages.map((t,o)=>[t.id,o]));return this.doc.elements.map((t,o)=>[t,o]).sort((t,o)=>(e.get(t[0].stage)??0)-(e.get(o[0].stage)??0)||t[1]-o[1]).map(([t])=>t)}}function xs(n,e){if(n.length<3)return n;const[t,o]=n[0],[i,s]=n[n.length-1],r=Math.hypot(i-t,s-o);let a=0,l=0;for(let d=1;d<n.length-1;d++){const c=r<1e-9?Math.hypot(n[d][0]-t,n[d][1]-o):Math.abs((s-o)*n[d][0]-(i-t)*n[d][1]+i*o-s*t)/r;c>a&&(a=c,l=d)}return a<=e?[n[0],n[n.length-1]]:[...xs(n.slice(0,l+1),e).slice(0,-1),...xs(n.slice(l),e)]}const _s={notebook:"Notebook: handwriting on the page",sticky:"Sticky note",card:"Index card",plain:"Plain text"},ct={hand:["Handwriting",'"Caveat", "Patrick Hand", cursive'],print:["Printed hand",'"Patrick Hand", "Caveat", cursive'],serif:["Serif",'"Newsreader", Georgia, serif'],sans:["Sans","Inter, system-ui, sans-serif"],mono:["Mono","ui-monospace, Menlo, monospace"]},Za={notebook:{font:"print",size:20,bg:null,ink:"#2b2620"},sticky:{font:"print",size:17,bg:"#fbe9a6",ink:"#2b2620"},card:{font:"print",size:17,bg:"#fbfaf5",ink:"#2b2620"},plain:{font:"sans",size:15,bg:null,ink:"#2b2620"}};let Ci=null;const Qa=n=>{Ci=ct[n]?n:null};function Dt(n){const e=n.note||{},t=_s[e.style]?e.style:"notebook",o=Za[t];return{style:t,font:ct[e.font]?e.font:Ci||o.font,size:Number(e.size)>0?Number(e.size):o.size,width:Number(e.width)>0?Number(e.width):280,bg:e.bg===void 0?o.bg:e.bg,angle:Number(e.angle)||0,ink:n.color||o.ink}}let $t=null;function el(){if($t)return $t;try{$t=(typeof OffscreenCanvas<"u"?new OffscreenCanvas(8,8):document.createElement("canvas")).getContext("2d")}catch{$t={font:"",measureText:n=>({width:String(n).length*.5*(parseFloat($t.font)||16)})}}return $t}function tl(n,e,t){const o=[];for(const i of String(e).split(`
`)){let s="";for(const r of i.split(" ")){const a=s?`${s} ${r}`:r;n.measureText(a).width>t&&s?(o.push(s),s=r):s=a}o.push(s)}return o}function Ws(n){const e=Dt(n),[t,o]=n.points[0]||[0,0],i=el();i.font=`${e.size}px ${ct[e.font][1]}`;const s=n.text||n.why||"",r=e.bg?e.size*.55:e.size*.15,a=s?tl(i,s,e.width-r*2):[""],l=e.size*(e.font==="hand"?1.15:1.32);return{x:t,y:o,w:e.width,h:a.length*l+r*2,pad:r,lh:l,lines:a,props:e}}function vs(n){const e=Ws(n),t=Math.cos(e.props.angle),o=Math.sin(e.props.angle);return[[0,0],[e.w,0],[e.w,e.h],[0,e.h]].map(([i,s])=>[e.x+i*t-s*o,e.y+i*o+s*t])}function nl(n,e){const t=Ws(e),o=t.props;if(!(!e.text&&!e.why)){if(n.save(),n.translate(t.x,t.y),o.angle&&n.rotate(o.angle),o.bg&&(o.style==="sticky"&&(n.shadowColor="rgba(0,0,0,0.18)",n.shadowBlur=o.size*.5,n.shadowOffsetY=o.size*.15),n.fillStyle=o.bg,n.fillRect(0,0,t.w,t.h),n.shadowColor="transparent",o.style==="card")){n.globalAlpha*=.5,n.strokeStyle="#8fb3d9",n.lineWidth=Math.max(.5,o.size*.04);for(let i=1;i<=t.lines.length;i++){const s=t.pad+i*t.lh+o.size*.12;n.beginPath(),n.moveTo(0,s),n.lineTo(t.w,s),n.stroke()}n.strokeStyle="#d98b8b",n.beginPath(),n.moveTo(0,t.pad+o.size*.12),n.lineTo(t.w,t.pad+o.size*.12),n.stroke(),n.globalAlpha/=.5}n.fillStyle=o.ink,n.font=`${o.size}px ${ct[o.font][1]}`,n.textBaseline="alphabetic",t.lines.forEach((i,s)=>n.fillText(i,t.pad,t.pad+(s+1)*t.lh-t.lh*.25)),n.restore()}}function sl(n,e,t){const o=Ws(n),i=o.props,s=i.angle?` transform="rotate(${t(i.angle*180/Math.PI)} ${t(o.x)} ${t(o.y)})"`:"",r=i.bg?`<rect x="${t(o.x)}" y="${t(o.y)}" width="${t(o.w)}" height="${t(o.h)}" fill="${e(i.bg)}"/>`:"",a=o.lines.map((l,d)=>`<tspan x="${t(o.x+o.pad)}" y="${t(o.y+o.pad+(d+1)*o.lh-o.lh*.25)}">${e(l)}</tspan>`).join("");return`<g${s}>${r}<text font-family="${e(ct[i.font][1])}" font-size="${t(i.size)}" fill="${e(i.ink)}">${a}</text></g>`}let Ce=null;function be({label:n,min:e,max:t,step:o,value:i,doc:s,onInput:r}){const a=M("span",{class:"wb-tp-value"}),l=(String(o).split(".")[1]||"").length,d=h=>{a.textContent=String(+Number(h).toFixed(Math.min(4,l)))},c=fs({min:e,max:t,step:o,value:i,title:s||n});return c.addEventListener("input",()=>{d(c.value),r(Number(c.value))}),d(i),M("label",{class:"wb-tp-row",title:s||""},M("span",{class:"wb-tp-label"},n),c,a)}const vn=n=>n.step||Math.abs(n.max-n.min)/100||.01;function pt(n,e,t){Ce?.close();const o=M("div",{class:"wb-cp-pop wb-tp"}),i=[];let s="",r=null;const a=n.selectedElements().filter(f=>Z[f.realize?.brush]),l=n.selectedElements().filter(f=>f.role==="note");if(n.tool==="sculpt"){const f=n.sculpt,p=$e[f.tool],m=Rs(f.tool,f.params[f.tool]);s=`Sculpt · ${p.label}`,r=()=>n.openCode?.("sculpt",f.tool);const b=M("select",{class:"wb-select",title:"The sculpt tool"},...Object.entries($e).map(([g,w])=>M("option",{value:g,selected:g===f.tool},w.label)));b.addEventListener("change",()=>{n.setSculpt({tool:b.value}),pt(n,e,t)}),b.addEventListener("keydown",g=>g.stopPropagation()),i.push(M("label",{class:"wb-tp-row wb-tp-row2"},M("span",{class:"wb-tp-label"},"Tool"),b),be({label:"Radius",min:4,max:400,step:1,value:Math.round(f.radius),doc:"Brush radius in screen pixels ([ and ])",onInput:g=>n.setSculpt({radius:g})}),be({label:"Strength",min:.02,max:1,step:.01,value:f.strength,doc:"Shift+[ and Shift+]",onInput:g=>n.setSculpt({strength:g})}),...p.params.map(g=>be({label:g.label,min:g.min,max:g.max,step:vn(g),value:m[g.key],doc:g.doc,onInput:w=>n.setSculpt({params:{[g.key]:w}})})))}else if(l.length||n.tool==="note"){const f=l.map(g=>g.id),p=Dt(l[0]||{note:n.defaults("note").note,color:n.defaults("note").color});s=l.length?`Note${l.length>1?`s · ${l.length}`:""}`:"New note";const m=g=>{if(!f.length){n.setDefaults("note",{note:{...n.defaults("note").note||{},...g}});return}const w=JSON.stringify(n.store.doc);for(const y of n.store.doc.elements)f.includes(y.id)&&(y.note={...y.note||{},...g});n.canvas.invalidate(),n.store.commitFrom(w,"note style"),n.setDefaults("note",{note:{...n.store.doc.elements.find(y=>y.id===f[0])?.note||{}}})},b=(g,w,y)=>{const S=M("select",{class:"wb-select"},...g.map(([k,v])=>M("option",{value:k,selected:k===w},v)));return S.addEventListener("change",()=>y(S.value)),S.addEventListener("keydown",k=>k.stopPropagation()),S};i.push(M("label",{class:"wb-tp-row wb-tp-row2"},M("span",{class:"wb-tp-label"},"Font"),b(Object.entries(ct).map(([g,[w]])=>[g,w]),p.font,g=>m({font:g}))),be({label:"Size",min:6,max:120,step:1,value:Math.round(p.size),doc:"Letter size in artboard units",onInput:g=>m({size:g})}),M("label",{class:"wb-tp-row wb-tp-row2"},M("span",{class:"wb-tp-label"},"Style"),b(Object.entries(_s).map(([g,w])=>[g,w.split(":")[0]]),p.style,g=>m({style:g,bg:void 0,font:void 0,size:void 0}))))}else if(a.length){const f=a[0].realize.brush,p=Z[f],m=a.filter(y=>y.realize.brush===f).map(y=>y.id),b=Pe(f,a[0].realize.params);s=`${p.label} · ${m.length} mark${m.length===1?"":"s"}`,r=()=>n.openCode?.("brush",f);let g=null,w=0;i.push(...p.params.map(y=>be({label:y.label,min:y.min,max:y.max,step:vn(y),value:b[y.key],doc:y.doc,onInput:S=>{g??=JSON.stringify(n.store.doc);for(const k of n.store.doc.elements)m.includes(k.id)&&(k.realize.params={...k.realize.params||{},[y.key]:S});n.canvas.invalidate(),clearTimeout(w),w=setTimeout(()=>{const k=g;g=null,n.store.commitFrom(k,"brush param")},350)}})))}else if(n.defaults&&["point","line","plane","circle","rect","gesture","guide","brush"].includes(n.tool)){const f=n.toolRole(),p=n.defaults(f),m=p.realize.brush,b=Z[m],g=Pe(m,p.realize.params);s=n.tool==="brush"?`Brush · ${b?.label||m}`:`New ${n.tool} · ${b?.label||m}`,r=()=>n.openCode?.("brush",m),i.push(...(b?.params||[]).map(w=>be({label:w.label,min:w.min,max:w.max,step:vn(w),value:g[w.key],doc:w.doc,onInput:y=>n.setDefaults(f,{realize:{params:{[w.key]:y}}})})))}["line","plane","gesture","brush"].includes(n.tool)&&n.lazy&&i.push(M("div",{class:"wb-tp-sub"},"Drawing"),be({label:"Lazy",min:0,max:120,step:1,value:n.lazy.radius,doc:"The pen trails the cursor on a string this long (screen px); 0 = off",onInput:f=>n.setLazy({radius:f})}),be({label:"Smoothing",min:0,max:.95,step:.01,value:n.lazy.smoothing,doc:"Eases the pen further (0 = off)",onInput:f=>n.setLazy({smoothing:f})}),be({label:"Simplify",min:0,max:40,step:.5,value:n.lazy.simplify||0,doc:"On release, points the line does not need are dropped: how far (screen px) the shape may move. 0 = off",onInput:f=>n.setLazy({simplify:f})})),i.length||i.push(M("div",{class:"wb-muted wb-small"},"No parameters for this tool: select marks, or pick a drawing or sculpt tool.")),o.append(M("div",{class:"wb-tp-head"},M("span",{},s||"Parameters"),r?M("button",{class:"wb-icon-btn",title:"The same params in code",html:te("script"),onclick:()=>{u(),r()}}):null),...i),document.body.append(o);const d=o.getBoundingClientRect();o.style.left=`${Math.max(8,Math.min(e,window.innerWidth-d.width-8))}px`,o.style.top=`${Math.max(8,Math.min(t,window.innerHeight-d.height-8))}px`;const c=f=>{o.contains(f.target)||u()},h=f=>{f.key==="Escape"&&(f.stopPropagation(),u())},u=()=>{o.remove(),window.removeEventListener("pointerdown",c,!0),window.removeEventListener("keydown",h,!0),Ce=null};setTimeout(()=>{window.addEventListener("pointerdown",c,!0),window.addEventListener("keydown",h,!0)}),Ce={close:u}}function uo(n,e,t){Ce?.close();const o=M("div",{class:"wb-cp-pop wb-tp"}),i=n.canvas.grid,[s,r]=n.canvas.toWorld(...n.canvas.local({clientX:e,clientY:t})),a=V(n.store.doc),l=a.find(g=>s>=g.x&&s<=g.x+g.width&&r>=g.y&&r<=g.y+g.height)||a.find(g=>g.id===n.activeBoard)||a[0],d=()=>n.background&&n.background!=="default"&&n.background!=="transparent"?n.background:getComputedStyle(document.documentElement).getPropertyValue("--wb-canvas").trim()||"#1b1b1b",c=(g,w,y)=>{const S=M("div",{class:"wb-seg wb-tp-seg"}),k=v=>S.replaceChildren(...g.map(([T,x])=>M("button",{class:T===v?"on":"",onclick:()=>{y(T),k(T)}},x)));return k(w),S},h=(g,w,y)=>M("label",{class:"wb-tp-row wb-tp-row2",title:y||""},M("span",{class:"wb-tp-label"},g),w),u=M("input",{type:"checkbox",checked:!!i.snap,onchange:g=>n.canvas.setGrid({snap:g.target.checked})});o.append(M("div",{class:"wb-tp-head"},M("span",{},"Grid")),h("Show",c([["off","Off"],["paper","Paper"],["everywhere","All"]],i.show||"paper",g=>n.canvas.setGrid({show:g}))),h("Style",c([["lines","Lines"],["dots","Dots"]],i.style||"lines",g=>n.canvas.setGrid({style:g}))),be({label:"Spacing",min:5,max:400,step:1,value:i.spacing,doc:"Distance between major lines, in artboard units",onInput:g=>n.canvas.setGrid({spacing:g})}),h("Color",He(i.color,g=>n.canvas.setGrid({color:g}),{title:"Grid color",fallback:"#8a837840",app:n})),h(l.main?"Paper":`Paper · ${l.title||"board"}`,He(l.ground,g=>n.store.updateBoard(l.id,{ground:g}),{title:"The paper of the board under the pointer (else the active one)",fallback:"#f3efe6",app:n})),h("Workspace",He(d(),g=>n.setBackground(g),{title:"Workspace background (behind the boards)",fallback:"#1b1b1b",app:n})),be({label:"Divisions",min:1,max:10,step:1,value:i.subdivisions,doc:"Minor lines between the major ones",onInput:g=>n.canvas.setGrid({subdivisions:g})}),h("Snap",u,"Marks snap to the grid (Shift+Tab); Ctrl snaps while drawing, moving and scaling"),h("Snap to",c([["points","Grid"],["increments","Steps"],["objects","Objects"]],["increments","objects"].includes(i.snapMode)?i.snapMode:"points",g=>n.canvas.setGrid({snapMode:g})),"Grid: the grabbed point (or the dragged edge) lands on a grid point. Steps: moves in whole grid steps from where it started. Objects: the grabbed (or drawn) point lands on the nearest point of another mark"),M("div",{class:"wb-tp-sub"},"Drawing"),be({label:"Lazy",min:0,max:120,step:1,value:n.lazy.radius,doc:"The pen trails the cursor on a string this long (screen px). Small wobbles inside it never reach the line; corners get rounded. 0 = off",onInput:g=>n.setLazy({radius:g})}),be({label:"Smoothing",min:0,max:.95,step:.01,value:n.lazy.smoothing,doc:"Each step the pen covers only part of the way to where it is pulled (0.5 = half). Higher is smoother and lags more. 0 = off",onInput:g=>n.setLazy({smoothing:g})}),be({label:"Simplify",min:0,max:40,step:.5,value:n.lazy.simplify||0,doc:"On release, points the line does not need are dropped: how far (screen px) the shape may move. Higher = fewer points, looser shape. 0 = off",onInput:g=>n.setLazy({simplify:g})})),document.body.append(o);const f=o.getBoundingClientRect();o.style.left=`${Math.max(8,Math.min(e,window.innerWidth-f.width-8))}px`,o.style.top=`${Math.max(8,Math.min(t,window.innerHeight-f.height-8))}px`;const p=g=>{!o.contains(g.target)&&!g.target.closest?.(".wb-cp-pop")&&b()},m=g=>{g.key==="Escape"&&(g.stopPropagation(),b())},b=()=>{o.remove(),window.removeEventListener("pointerdown",p,!0),window.removeEventListener("keydown",m,!0),Ce=null};setTimeout(()=>{window.addEventListener("pointerdown",p,!0),window.addEventListener("keydown",m,!0)}),Ce={close:b}}function Yn(n,e,t,o,i=null){Ce?.close();const s=M("div",{class:"wb-cp-pop wb-tp"}),r=(m,b,g)=>M("label",{class:"wb-tp-row wb-tp-row2",title:g||""},M("span",{class:"wb-tp-label"},m),b),a=(m,b,g)=>{const w=M("div",{class:"wb-seg wb-tp-seg"}),y=S=>w.replaceChildren(...m.map(([k,v])=>M("button",{class:k===S?"on":"",onclick:()=>{g(k),y(k)}},v)));return y(b),w},l=()=>{const m=i&&n.shapes?.[i];return m?i==="circle"?[be({label:"Sides",min:3,max:48,step:1,value:m.sides,doc:"Points on the circle. Straight, it is a polygon with this many sides; smooth, it is round (more points, rounder)",onInput:b=>n.setShape("circle",{sides:Math.round(b)})})]:i==="rect"?[be({label:"Rounded",min:0,max:1,step:.01,value:m.round,doc:"Corner roundness: 0 is square corners, 1 is a pill (the corners take half the shorter side)",onInput:b=>n.setShape("rect",{round:b})})]:[]:[]},d=m=>{if(!["line","plane","gesture","brush"].includes(e))return[];const b=m.lazy||{},g=!!b.on,w=b.radius??40,y=b.catch!==!1,S=a([["off","Off"],["lazy","Lazy"]],g?"lazy":"off",k=>{n.setDefaults(e,{lazy:{on:k==="lazy",radius:w,catch:y}}),c()});return[r("Pen",S,"Off: the pen follows the cursor. Lazy: it trails the cursor on a string, so strokes come out smoother"),...g?[be({label:"Laziness",min:0,max:120,step:1,value:w,doc:"Length of the string (screen px): the pen waits until the cursor is this far away. Smoothing and Simplify (Opt+right-click) still apply.",onInput:k=>n.setDefaults(e,{lazy:{on:!0,radius:Math.round(k),catch:y}})}),r("Catch up",a([["off","Off"],["on","On"]],y?"on":"off",k=>{n.setDefaults(e,{lazy:{on:!0,radius:w,catch:k==="on"}}),c()}),"On: when the pointer stops, the pen catches up to it, so the line reaches the cursor. Off: the line stops where the string leaves it")]:[]]},c=()=>{const m=n.defaults(e),b=m.realize.brush,g=Z[b],w=Pe(b,m.realize.params),y=M("select",{class:"wb-select",title:"Brush for new marks"},...jn(e,n.store.doc).map(S=>M("option",{value:S.id,selected:S.id===b},S.label)));y.addEventListener("change",()=>{n.setDefaults(e,{realize:{brush:y.value}}),c()}),y.addEventListener("keydown",S=>S.stopPropagation()),s.replaceChildren(M("div",{class:"wb-tp-head"},M("span",{class:"wb-tp-title"},M("span",{html:Gt(b)}),`New ${i||e}`),M("button",{class:"wb-icon-btn",title:"The brush in code",html:te("script"),onclick:()=>{p(),n.openCode?.("brush",b)}})),...l(),...d(m),r("Brush",y),...(g?.params||[]).map(S=>be({label:S.label,min:S.min,max:S.max,step:vn(S),value:w[S.key],doc:S.doc,onInput:k=>n.setDefaults(e,{realize:{params:{[S.key]:k}}})})),M("div",{class:"wb-tp-sub"},"Look"),be({label:"Opacity",min:0,max:1,step:.01,value:m.opacity??1,doc:"The whole mark’s opacity (on top of the brush’s own)",onInput:S=>n.setDefaults(e,{opacity:S})}),r("Blend",(()=>{const S=M("select",{class:"wb-select"},...In.map(k=>M("option",{value:k,selected:k===(m.blend||"normal")},k)));return S.addEventListener("change",()=>n.setDefaults(e,{blend:S.value})),S.addEventListener("keydown",k=>k.stopPropagation()),S})(),"How the mark mixes with what is under it"),...e==="point"||i==="rect"?[]:[r("Path",a([["smooth","Smooth"],["straight","Straight"]],m.path==="straight"?"straight":"smooth",S=>n.setDefaults(e,{path:S})),"Smooth: a curve through the points. Straight: segments between them")])};c(),document.body.append(s);const h=s.getBoundingClientRect();s.style.left=`${Math.max(8,Math.min(t,window.innerWidth-h.width-8))}px`,s.style.top=`${Math.max(8,Math.min(o,window.innerHeight-h.height-8))}px`;const u=m=>{s.contains(m.target)||p()},f=m=>{m.key==="Escape"&&(m.stopPropagation(),p())},p=()=>{s.remove(),window.removeEventListener("pointerdown",u,!0),window.removeEventListener("keydown",f,!0),Ce=null};setTimeout(()=>{window.addEventListener("pointerdown",u,!0),window.addEventListener("keydown",f,!0)}),Ce={close:p}}function po(n,e,t,o){Ce?.close();const i=V(n.store.doc).find(u=>u.id===e);if(!i)return;const s=M("div",{class:"wb-cp-pop wb-tp"}),r=(u,f,p)=>M("label",{class:"wb-tp-row wb-tp-row2",title:p||""},M("span",{class:"wb-tp-label"},u),f),a=(u,f,p,{shown:m=!1}={})=>{const b=M("input",{type:"checkbox",checked:m?!i[u]:!!i[u],onchange:g=>n.setBoardFlag(e,u,m?!g.target.checked:g.target.checked)});return r(f,b,p)};s.append(M("div",{class:"wb-tp-head"},M("span",{},i.title||"Board")),a("hideLabel","Title","The title above the board (selected, it always shows, so the board can be moved)",{shown:!0}),a("hideBorder","Border","The shadow and frame line. With title and border off a board is only structure",{shown:!0}),r("Paper",He(i.ground,u=>n.store.updateBoard(e,{ground:u}),{title:"Paper",fallback:"#f3efe6",app:n})),a("hidden","Hidden","Not drawn and not run (a dashed outline marks where it is)",{shown:!0}),a("locked","Locked","Its marks cannot be selected or changed, and it cannot be moved or resized"),a("mask","Mask","Its marks are cropped to the board"),a("perf","Performance","A performance line under the board")),document.body.append(s);const l=s.getBoundingClientRect();s.style.left=`${Math.max(8,Math.min(t,window.innerWidth-l.width-8))}px`,s.style.top=`${Math.max(8,Math.min(o,window.innerHeight-l.height-8))}px`;const d=u=>{!s.contains(u.target)&&!u.target.closest?.(".wb-cp-pop")&&h()},c=u=>{u.key==="Escape"&&(u.stopPropagation(),h())},h=()=>{s.remove(),window.removeEventListener("pointerdown",d,!0),window.removeEventListener("keydown",c,!0),Ce=null};setTimeout(()=>{window.addEventListener("pointerdown",d,!0),window.addEventListener("keydown",c,!0)}),Ce={close:h}}const Fe=40,ol=n=>Math.max(72,Math.ceil(n*(Fe+6)/(2*Math.PI))),il=(n,e,t)=>{const o=-Math.PI/2+n*2*Math.PI/e;return[Math.cos(o)*t,Math.sin(o)*t]};function rl(n,e,t,o=24){if(!t||Math.hypot(n,e)<o)return-1;const i=2*Math.PI/t,s=(Math.atan2(e,n)+Math.PI/2+2*Math.PI)%(2*Math.PI);return Math.round(s/i)%t}function al({items:n,x:e,y:t,onClose:o}){const i=n.length;if(!i)return null;const s=ol(i),r=s+Fe,a=Math.min(Math.max(e,r),Math.max(r,window.innerWidth-r)),l=Math.min(Math.max(t,r),Math.max(r,window.innerHeight-r)),d=M("div",{class:"wb-radial"});Object.assign(d.style,{position:"fixed",inset:"0",zIndex:"3000",userSelect:"none"});const c=M("div",{});Object.assign(c.style,{position:"absolute",left:`${a-s-Fe/2-8}px`,top:`${l-s-Fe/2-8}px`,width:`${2*s+Fe+16}px`,height:`${2*s+Fe+16}px`,borderRadius:"50%",background:"rgba(20,20,20,0.28)",pointerEvents:"none"});const h=M("div",{});Object.assign(h.style,{position:"absolute",left:`${a}px`,top:`${l}px`,transform:"translate(-50%, -50%)",font:"12px system-ui, sans-serif",color:"var(--wb-text, #ddd)",background:"var(--wb-panel, #222)",border:"1px solid var(--wb-border, #444)",borderRadius:"10px",padding:"2px 8px",pointerEvents:"none",whiteSpace:"nowrap",opacity:"0"});const u=n.map((v,T)=>{const[x,L]=il(T,i,s),A=M("div",{title:v.label,html:v.icon||""});return Object.assign(A.style,{position:"absolute",left:`${a+x-Fe/2}px`,top:`${l+L-Fe/2}px`,width:`${Fe}px`,height:`${Fe}px`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--wb-text, #ddd)",background:"var(--wb-panel, #222)",border:`1.5px solid ${v.active?"var(--wb-accent-2, #c8664f)":"var(--wb-border, #444)"}`,boxShadow:"0 2px 8px rgba(0,0,0,0.35)",pointerEvents:"none",transition:"transform 60ms"}),A});d.append(c,...u,h),document.body.append(d);let f=-1;const p=v=>{f=v,u.forEach((T,x)=>{T.style.transform=x===v?"scale(1.22)":"scale(1)",T.style.background=x===v?"var(--wb-accent-2, #c8664f)":"var(--wb-panel, #222)"}),h.textContent=v>=0?n[v].label:"",h.style.opacity=v>=0?"1":"0"},m=v=>{const T=rl(v.clientX-a,v.clientY-l,i);T!==f&&p(T)};let b=!1;const g=()=>{b||(b=!0,window.removeEventListener("pointermove",m,!0),window.removeEventListener("pointerdown",y,!0),window.removeEventListener("pointerup",y,!0),window.removeEventListener("keyup",S,!0),window.removeEventListener("keydown",k,!0),window.removeEventListener("blur",g),d.remove(),o?.())},w=()=>{const v=f>=0?n[f]:null;g(),v?.run?.()},y=v=>{v.preventDefault(),v.stopPropagation(),w()},S=v=>{(v.code==="Space"||v.key==="Shift"||v.key===" ")&&(v.preventDefault(),w())},k=v=>{v.key==="Escape"&&(v.preventDefault(),v.stopPropagation(),g())};return window.addEventListener("pointermove",m,!0),window.addEventListener("pointerdown",y,!0),window.addEventListener("pointerup",y,!0),window.addEventListener("keyup",S,!0),window.addEventListener("keydown",k,!0),window.addEventListener("blur",g),{close:g}}const Ee=(n,e,t,o,i,s,r)=>({key:n,label:e,min:t,max:o,step:i,default:s,doc:r}),jt={threshold:{label:"Threshold",kind:"point",doc:"Light above the level becomes white, below it black (soft: a ramp instead of an edge).",params:[Ee("level","Level",0,1,.01,.5,"Where black turns to white."),Ee("soft","Soft",0,.5,.01,0,"Width of the ramp between them.")]},levels:{label:"Levels",kind:"point",doc:"Black point, white point and gamma; the output range too.",params:[Ee("black","Black",0,1,.01,0,"Light at or below this is black."),Ee("white","White",0,1,.01,1,"Light at or above this is white."),Ee("gamma","Gamma",.1,4,.05,1,"Above 1 lightens the middle, below darkens it."),Ee("outBlack","Out black",0,1,.01,0,"What black becomes."),Ee("outWhite","Out white",0,1,.01,1,"What white becomes.")]},contrast:{label:"Contrast",kind:"point",doc:"More or less difference between light and dark.",params:[Ee("amount","Amount",-1,1,.01,.3,"Negative flattens, positive steepens.")]},brightness:{label:"Brightness",kind:"point",doc:"Lighter or darker.",params:[Ee("amount","Amount",-1,1,.01,.1,"Added to the light.")]},invert:{label:"Invert",kind:"point",doc:"Light becomes dark and dark light.",params:[]},posterize:{label:"Posterize",kind:"point",doc:"Fewer steps of light.",params:[Ee("steps","Steps",2,16,1,4,"How many levels remain.")]},gradient:{label:"Gradient map",kind:"point",doc:"Color by light: dark takes the first color of the gradient, light the last (stops: colors, or [position, color]; 8-digit hex has alpha).",params:[],stops:!0},blur:{label:"Blur",kind:"canvas",doc:"Soften.",params:[Ee("radius","Radius",0,40,.5,3,"Pixels of the picture it is applied to.")]},pixelate:{label:"Pixelate",kind:"canvas",doc:"Blocks.",params:[Ee("size","Size",2,64,1,8,"Pixels a block is wide.")]}},_t=(n,e,t)=>Math.min(t,Math.max(e,n));function Ii(n){const e=/^#([0-9a-f]{3,8})$/i.exec(String(n||"").trim());if(!e)return null;let t=e[1];if((t.length===3||t.length===4)&&(t=[...t].map(i=>i+i).join("")),t.length!==6&&t.length!==8)return null;const o=i=>parseInt(t.slice(i,i+2),16);return[o(0),o(2),o(4),t.length===8?o(6):255]}function Oi(n){let e=Array.isArray(n)?n:[];return e=e.map((t,o)=>Array.isArray(t)?[Number(t[0]),t[1]]:[e.length>1?o/(e.length-1):0,t]).filter(([t,o])=>Number.isFinite(t)&&Ii(o)).map(([t,o])=>[_t(t,0,1),String(o).toLowerCase()]),e.sort((t,o)=>t[0]-o[0]),e.length===0?[[0,"#000000"],[1,"#ffffff"]]:e.length===1?[[0,e[0][1]],[1,e[0][1]]]:e}function Ft(n){if(!Array.isArray(n))return[];const e=[];for(const t of n){const o=typeof t=="string"?{type:t}:t,i=o&&jt[o.type];if(!i)continue;const s={type:o.type};for(const r of i.params){const a=Number(o[r.key]);s[r.key]=Number.isFinite(a)&&o[r.key]!==""&&o[r.key]!==null?_t(a,r.min,r.max):r.default}i.stops&&(s.stops=Oi(o.stops)),o.off===!0&&(s.off=!0),e.push(s)}return e}function Lt(n){return Ft(n).filter(e=>!e.off).map(e=>`${e.type}(${Object.entries(e).filter(([t])=>t!=="type"&&t!=="off").map(([,t])=>Array.isArray(t)?t.map(o=>o.join("@")).join(","):t).join(",")})`).join(">")}const fo=()=>{const n=new Uint8Array(256);for(let e=0;e<256;e++)n[e]=e;return n},ll=(n,e)=>{const t=new Uint8Array(256);for(let o=0;o<256;o++)t[o]=Math.round(_t(e(n[o]/255),0,1)*255);return t},cl=(n,e,t)=>{if(e<=n)return t>=n?1:0;const o=_t((t-n)/(e-n),0,1);return o*o*(3-2*o)},dl=n=>{for(let e=0;e<256;e++)if(n[e]!==e)return!1;return!0};function hl(n){switch(n.type){case"threshold":return e=>n.soft>0?cl(n.level-n.soft/2,n.level+n.soft/2,e):e>=n.level?1:0;case"levels":{const e=Math.max(1e-6,n.white-n.black);return t=>n.outBlack+(n.outWhite-n.outBlack)*Math.pow(_t((t-n.black)/e,0,1),1/n.gamma)}case"contrast":{const e=n.amount>=0?1/(1-n.amount*.99):1+n.amount;return t=>(t-.5)*e+.5}case"brightness":return e=>e+n.amount;case"invert":return e=>1-e;case"posterize":return e=>Math.round(e*(n.steps-1))/(n.steps-1);default:return null}}function ul(n){const e=new Uint8Array(1024),t=n.map(([o,i])=>[o,Ii(i)]);for(let o=0;o<256;o++){const i=o/255;let s=t[0],r=t[t.length-1];for(let l=0;l<t.length-1;l++)if(i>=t[l][0]&&i<=t[l+1][0]){s=t[l],r=t[l+1];break}const a=r[0]>s[0]?_t((i-s[0])/(r[0]-s[0]),0,1):0;for(let l=0;l<4;l++)e[o*4+l]=Math.round(s[1][l]+(r[1][l]-s[1][l])*a)}return e}function pl(n){const e=Ft(n).filter(r=>!r.off),t=[];let o=fo(),i=!1;const s=(r=null)=>{i||r?t.push({t:"luma",lut:o,...r?{grad:r}:{}}):dl(o)||t.push({t:"rgb",lut:o}),o=fo(),i=!1};for(const r of e){if(jt[r.type].kind==="canvas"){s(),t.push({t:"canvas",op:r.type,...r.type==="blur"?{radius:r.radius}:{size:r.size}});continue}if(r.type==="gradient"){i=!0,s(ul(r.stops));continue}r.type==="threshold"&&(i=!0),o=ll(o,hl(r))}return s(),{key:Lt(n),stages:t}}function fl(n,e){const t=e.length,o=n.lut;if(n.t==="rgb"){for(let s=0;s<t;s+=4)e[s]=o[e[s]],e[s+1]=o[e[s+1]],e[s+2]=o[e[s+2]];return}const i=n.grad;for(let s=0;s<t;s+=4){const r=o[e[s]*54+e[s+1]*183+e[s+2]*19>>8];if(i){const a=r*4;e[s]=i[a],e[s+1]=i[a+1],e[s+2]=i[a+2],e[s+3]=(e[s+3]*i[a+3]+127)/255}else e[s]=r,e[s+1]=r,e[s+2]=r}}function ml(n,e="luma",t=!1){const o=n.length;for(let i=0;i<o;i+=4){let s=e==="alpha"?n[i+3]:((n[i]*54+n[i+1]*183+n[i+2]*19>>8)*n[i+3]+127)/255;t&&(s=255-s),n[i+3]=s}}const gl=n=>!Array.isArray(n)||Ft(n).every(e=>e.off),Ze=(n={})=>new Proxy(n,{get:(e,t)=>t in e?e[t]:t==="then"||typeof t=="symbol"?void 0:()=>{}}),ue=()=>{},zi=ue,Ni=ue,Ri=ue,Di=ue,ji=ue,Fi=ue,_i=ue,Wi=ue,bl=ue,Hi=ue,Ui=ue,qi=ue,Ki=ue,Gi=ue,Ji=ue,Vi=ue,Yi=()=>[];class Xi{constructor(){throw new Error("The Assets panel is not part of the lean editor")}}class Zi{constructor(){return Ze({list:{active:null},all:()=>[],docOf:()=>null})}}class Qi{constructor(){return Ze({recording:!1})}}class er{constructor(){return Ze({take:null})}}class tr{constructor(){return Ze({list:()=>[]})}}const yl=[],wl=()=>null;class nr{constructor(){return Ze({list:[],entries:()=>[],def:()=>{},view:()=>null})}}class sr{constructor(){return Ze({map:new Map,recent:()=>[]})}}const kl=[];class or{constructor(){return Ze()}}class ir{constructor(){return Ze({get:()=>{},perf:()=>""})}}const xl=()=>[],rr=()=>()=>"",Ms=[];class Hs{constructor(){return Ze({get:()=>{},filter:()=>[],values:()=>[],has:()=>!1})}}const vl=()=>new Hs,Us=n=>String(n).replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),Ml=n=>Us(n),Sl=n=>({data:{},body:String(n||"")}),ar=()=>[],lr=n=>Us(n),$l=lr,Pl="",cr=()=>[],dr=()=>[],hr=()=>"",ur=()=>null,Al={},Tl=async()=>{throw new Error("Lessons are not part of the lean editor")},El=[],Ll=()=>[],Bl=[],Cl="",Il=ue,Ol=ue,zl=ue,Nl=ue,Rl=ue,Dl=ue,qs=Object.freeze(Object.defineProperty({__proto__:null,ArtistRegistry:Hs,AssetPanel:Xi,BoardFrames:ir,DEFAULT_GESTURES:kl,DOC_SECTIONS:El,Gestures:sr,LESSONS:Al,Playlists:or,Recorder:Qi,SOURCE_DEMOS:Ms,STREAM_SAMPLES:Bl,Scenes:Zi,Sources:nr,TakePlayer:er,WALKTHROUGHS:yl,Walkthroughs:tr,buildLesson:Tl,defaultArtistRegistry:vl,docFromPage:ur,docTopics:Ll,docsTopicList:Yi,downloadHTML:Ol,downloadJSON:zl,downloadProject:Nl,downloadVideo:Rl,esc:Us,filesOf:xl,frontMatter:Sl,linksOf:ar,md:$l,mountAssistant:Ni,mountCode:Gi,mountDecide:Di,mountDocs:ji,mountGenerate:Ri,mountGestures:Wi,mountHistory:Ji,mountLog:Vi,mountProcess:Hi,mountScenes:zi,mountScript:bl,mountSettings:qi,mountShortcuts:Ki,mountSources:_i,mountStages:Ui,mountTimeline:Fi,pageBoards:cr,pageRuntime:Pl,playerScript:Cl,renderMarkdown:lr,sanitizeHtml:Ml,sceneHtml:hr,sourcesOf:dr,startDiagnostics:rr,takeToHTML:Il,videoBlob:Dl,walkthroughFromTake:wl},Symbol.toStringTag,{value:"Module"})),mo=["rect","triangle","circle"];function jl(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}const pe=(n,e,t)=>Math.max(e,Math.min(t,n));function It([n,e,t]){return"#"+[n,e,t].map(o=>pe(Math.round(o),0,255).toString(16).padStart(2,"0")).join("")}function Fl(n,e){let t=0;for(let o=0;o<n.length;o++){const i=n[o]-e[o];t+=i*i}return Math.sqrt(t/n.length)}class _l{constructor(e,t,o,{seed:i=1,trials:s=64,climbs:r=96,shapes:a=mo,start:l=null,background:d=null,precision:c=3}={}){if(this.target=e,this.w=t,this.h=o,this.rand=jl(i),this.trials=s,this.climbs=r,this.scale=10**c,this.shapeTypes=a.filter(p=>mo.includes(p)),this.shapeTypes.length===0)throw new Error(`No valid shape types in ${JSON.stringify(a)}`);const h=[0,0,0];for(let p=0;p<e.length;p+=3)h[0]+=e[p],h[1]+=e[p+1],h[2]+=e[p+2];const u=e.length/3;this.background=It(h.map(p=>p/u));const f=h.map(p=>Math.round(p/u));this.current=new Float32Array(e.length);for(let p=0;p<this.current.length;p+=3)this.current[p]=f[0],this.current[p+1]=f[1],this.current[p+2]=f[2];l&&(this.current=Float32Array.from(l),d&&(this.background=d)),this.shapes=[]}toX(e){return(e+1)*.5*this.w}toY(e){return(e+1)*.5*this.h}toSize(e){return e*.5*Math.min(this.w,this.h)}fromSize(e){return e/(.5*Math.min(this.w,this.h))}randomShape(e=this.shapeTypes[Math.floor(this.rand()*this.shapeTypes.length)]){const t=()=>this.rand()*2-1,o=()=>.02+this.rand()*.3;if(e==="rect")return{type:e,x:t(),y:t(),width:o(),height:o()};if(e==="circle")return{type:e,x:t(),y:t(),diameter:o()};const i=t(),s=t(),r=.25;return{type:e,points:[0,1,2].map(()=>[pe(i+(this.rand()-.5)*r*2,-1,1),pe(s+(this.rand()-.5)*r*2,-1,1)])}}mutate(e,t){const o=()=>(this.rand()-.5)*2*t,i=JSON.parse(JSON.stringify(e));if(i.type==="rect"){const s=Math.floor(this.rand()*4);s===0&&(i.x=pe(i.x+o(),-1.2,1.2)),s===1&&(i.y=pe(i.y+o(),-1.2,1.2)),s===2&&(i.width=pe(i.width+o(),.005,2.5)),s===3&&(i.height=pe(i.height+o(),.005,2.5))}else if(i.type==="circle"){const s=Math.floor(this.rand()*3);s===0&&(i.x=pe(i.x+o(),-1.2,1.2)),s===1&&(i.y=pe(i.y+o(),-1.2,1.2)),s===2&&(i.diameter=pe(i.diameter+o(),.005,2.5))}else{const s=i.points[Math.floor(this.rand()*3)];s[0]=pe(s[0]+o(),-1.2,1.2),s[1]=pe(s[1]+o(),-1.2,1.2)}return i}coverage(e){let t,o,i,s,r;if(e.type==="rect"){const u=this.toSize(e.width),f=this.toSize(e.height),p=this.toX(e.x)-u/2,m=this.toY(e.y)-f/2;[t,o,i,s]=[p,m,p+u,m+f];const b=(g,w,y)=>Math.max(0,Math.min(w,y+1)-Math.max(g,y));r=(g,w)=>b(t,i,g)*b(o,s,w)}else if(e.type==="circle"){const u=this.toX(e.x),f=this.toY(e.y),p=Math.max(.5,this.toSize(e.diameter)*.5);[t,o,i,s]=[u-p,f-p,u+p,f+p],r=(m,b)=>{const g=m+.5-u,w=b+.5-f,y=p+.5-Math.sqrt(g*g+w*w);return y<=0?0:y>=1?1:y}}else{const u=e.points.map(([b,g])=>[this.toX(b),this.toY(g)]);t=Math.min(...u.map(b=>b[0])),i=Math.max(...u.map(b=>b[0])),o=Math.min(...u.map(b=>b[1])),s=Math.max(...u.map(b=>b[1]));const f=u.reduce((b,g,w)=>{const y=u[(w+1)%u.length];return b+g[0]*y[1]-y[0]*g[1]},0);if(Math.abs(f)<1e-6)return null;const p=f>0?1:-1,m=u.map((b,g)=>{const w=u[(g+1)%u.length],y=w[0]-b[0],S=w[1]-b[1],k=Math.hypot(y,S)||1,v=-S/k*p,T=y/k*p;return[v,T,-(v*b[0]+T*b[1])]});r=(b,g)=>{let w=1/0;for(const[y,S,k]of m)w=Math.min(w,y*(b+.5)+S*(g+.5)+k);return pe(w+.5,0,1)}}const a=pe(Math.floor(t)-1,0,this.w),l=pe(Math.floor(o)-1,0,this.h),d=pe(Math.ceil(i)+2,0,this.w)-a,c=pe(Math.ceil(s)+2,0,this.h)-l;if(d<=0||c<=0)return null;const h=new Float32Array(d*c);for(let u=0;u<c;u++)for(let f=0;f<d;f++)h[u*d+f]=r(a+f,l+u);return{bx:a,by:l,bw:d,bh:c,a:h}}score(e){const t=this.coverage(e);if(!t)return{delta:1/0};const{bx:o,by:i,bw:s,bh:r,a}=t,{target:l,current:d,w:c}=this,h=this.mask;let u=0,f=0,p=0,m=0;for(let S=0;S<r;S++){const k=(i+S)*c+o;for(let v=0;v<s;v++){const T=a[S*s+v];if(T===0||h&&!h[k+v])continue;const x=(k+v)*3,L=1-T;u+=T*T,f+=T*(l[x]-L*d[x]),p+=T*(l[x+1]-L*d[x+1]),m+=T*(l[x+2]-L*d[x+2])}}if(u<1)return{delta:1/0};const b=pe(Math.round(f/u),0,255),g=pe(Math.round(p/u),0,255),w=pe(Math.round(m/u),0,255);let y=0;for(let S=0;S<r;S++){const k=(i+S)*c+o;for(let v=0;v<s;v++){const T=a[S*s+v];if(T===0||h&&!h[k+v])continue;const x=(k+v)*3;let L=l[x]-d[x],A=L-(b-d[x])*T;y+=A*A-L*L,L=l[x+1]-d[x+1],A=L-(g-d[x+1])*T,y+=A*A-L*L,L=l[x+2]-d[x+2],A=L-(w-d[x+2])*T,y+=A*A-L*L}}return{delta:y,color:[b,g,w],cov:t}}apply(e,t,o){const{bx:i,by:s,bw:r,bh:a,a:l}=o;for(let d=0;d<a;d++)for(let c=0;c<r;c++){const h=l[d*r+c];if(h===0)continue;const u=((s+d)*this.w+i+c)*3;for(let f=0;f<3;f++)this.current[u+f]+=(t[f]-this.current[u+f])*h}this.shapes.push({...e,color:It(t)})}quantize(e){const t=i=>Math.round(i*this.scale)/this.scale,o={...e};for(const i of["x","y","width","height","diameter"])i in o&&(o[i]=t(o[i]));return o.points&&(o.points=o.points.map(([i,s])=>[t(i),t(s)])),o}step(){let e=null;for(let i=0;i<this.trials;i++){const s=this.randomShape(),r=this.score(s);(!e||r.delta<e.delta)&&(e={shape:s,...r})}for(let i=0;i<this.climbs;i++){const s=.15*(1-i/this.climbs)+.01,r=this.mutate(e.shape,s),a=this.score(r);a.delta<e.delta&&(e={shape:r,...a})}const t=this.quantize(e.shape),o=this.score(t);return o.delta<0?(this.apply(t,o.color,o.cov),!0):!1}currentRMSE(){return Fl(this.current,this.target)}shapeActions(e=this.shapes.length){const t=[];for(const o of this.shapes.slice(0,e))t.push({op:"fill",color:o.color,opacity:1}),o.type==="rect"?t.push({op:"rect",x:o.x,y:o.y,width:o.width,height:o.height}):o.type==="circle"?t.push({op:"circle",x:o.x,y:o.y,diameter:o.diameter}):t.push({op:"polygon",points:o.points});return t}toProgram(e=this.shapes.length){return{version:1,actions:[{op:"background",color:this.background},{op:"noStroke"},...this.shapeActions(e)]}}}const go={fine:128,fast:64};function Wl(n,e="fine"){const t=go[e]||go.fine;return n>=1?{w:t,h:Math.max(8,Math.round(t/n))}:{w:Math.max(8,Math.round(t*n)),h:t}}function Hl(n,e,t){const o=r=>(r+1)/2,i=r=>(r+1)/2,s=r=>r*.5*Math.min(e,t);if(n.type==="rect"){const r=s(n.width)/2/e,a=s(n.height)/2/t,l=o(n.x),d=i(n.y);return{points:[[l-r,d-a],[l+r,d-a],[l+r,d+a],[l-r,d+a]],straight:!0}}if(n.type==="circle"){const r=Math.max(.5,s(n.diameter)/2),a=o(n.x),l=i(n.y);return{points:Array.from({length:8},(d,c)=>{const h=c/8*Math.PI*2;return[a+Math.cos(h)*r/e,l+Math.sin(h)*r/t]}),straight:!1}}return{points:n.points.map(([r,a])=>[o(r),i(a)]),straight:!0}}function Ul(n,e,t,o,{shapes:i,live:s,turnover:r,tries:a=40,seed:l=1}){let d=n.rand||(n.rand=ql(l));const c=k=>{const v=[];if(k.kind==="rect")for(let T=k.y0;T<k.y1;T++)for(let x=k.x0;x<k.x1;x++)v.push(T*t+x);else for(let T=Math.max(0,Math.ceil(k.cy-k.r));T<=Math.min(o-1,k.cy+k.r);T++)for(let x=Math.max(0,Math.ceil(k.cx-k.r));x<=Math.min(t-1,k.cx+k.r);x++)(x-k.cx)**2+(T-k.cy)**2<=k.r**2&&v.push(T*t+x);return v},h=k=>{const v=[0,0,0];for(const x of k)v[0]+=e[x*3],v[1]+=e[x*3+1],v[2]+=e[x*3+2];const T=Math.max(1,k.length);return[v[0]/T,v[1]/T,v[2]/T]},u=(k,v,T)=>{let x=0;for(const L of v)for(let A=0;A<3;A++){const P=e[L*3+A];x+=(k[L*3+A]-P)**2-(T[A]-P)**2}return x},f=(k,v,T)=>{for(const x of v)k[x*3]=T[0],k[x*3+1]=T[1],k[x*3+2]=T[2]},p=Math.max(t,o),m=()=>{const k=2+d()*p/3;if(d()<.5){const v=Math.floor(d()*t),T=Math.floor(d()*o);return{kind:"rect",x0:v,y0:T,x1:Math.min(t,v+1+Math.floor(d()*k)),y1:Math.min(o,T+1+Math.floor(d()*k))}}return{kind:"circle",cx:d()*t,cy:d()*o,r:1+d()*k/2}},b=[];for(let k=0;k<t*o;k++)b.push(k);const g=h(b),w=new Float32Array(t*o*3);for(let k=0;k<t*o;k++)f(w,[k],g);let y=s&&n.fast&&n.w===t&&n.h===o?n.fast:[];y=y.slice(y.length>=i?Math.min(y.length,r):0);for(const k of y){const v=c(k);k.c=h(v),f(w,v,k.c)}for(;y.length<i;){let k=null;for(let v=0;v<a;v++){const T=m(),x=c(T);if(!x.length)continue;const L=h(x),A=u(w,x,L);(!k||A>k.g)&&(k={sh:T,cs:x,c:L,g:A})}if(!k||k.g<=0)break;k.sh.c=k.c,f(w,k.cs,k.c),y.push(k.sh)}Object.assign(n,{fast:y,w:t,h:o});const S=y.map(k=>k.kind==="rect"?{points:[[k.x0/t,k.y0/o],[k.x1/t,k.y0/o],[k.x1/t,k.y1/o],[k.x0/t,k.y1/o]],straight:!0,color:It(k.c)}:{points:Array.from({length:12},(v,T)=>{const x=T/12*Math.PI*2;return[(k.cx+k.r*Math.cos(x))/t,(k.cy+k.r*Math.sin(x))/o]}),straight:!1,color:It(k.c)});return{background:It(g),shapes:S}}function ql(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}function Kl(n,{target:e,w:t,h:o,shapes:i=80,kinds:s=["rect","triangle","circle"],seed:r=1,live:a=!1,turnover:l=.08,quality:d="fine",sig:c=""}){const h=n.sig!==c;if(h){for(const m of Object.keys(n))delete n[m];n.sig=c}const u=Math.max(1,Math.round(i*l));let f;if(d==="fast")f=Ul(n,e,t,o,{shapes:i,live:a&&!h,turnover:u,seed:r});else{if(n.fitter&&a){n.fitter.target=e,n.fitter.shapes.splice(0,Math.max(0,n.fitter.shapes.length+u-i));for(let g=0;g<u&&n.fitter.step();g++);}else{n.fitter=new _l(e,t,o,{seed:r,shapes:s,trials:48,climbs:64});for(let g=0;g<i&&n.fitter.step();g++);}const m=[0,0,0];for(let g=0;g<e.length;g+=3)m[0]+=e[g],m[1]+=e[g+1],m[2]+=e[g+2];const b=e.length/3;f={background:It(m.map(g=>g/b)),shapes:n.fitter.shapes.map(g=>({...Hl(g,t,o),color:g.color}))}}const p=m=>Math.max(0,Math.min(1,m));for(const m of f.shapes)m.points=m.points.map(([b,g])=>[p(b),p(g)]);return f}let Ae=null,Ss=()=>{};const Jt=new Map,Gl=n=>{Ss=n},$s=new Map;function Jl(){if(Ae!==null)return Ae;try{Ae=typeof Worker<"u"&&typeof window<"u"?new Worker(new URL(""+new URL("fit.worker-C2FW_DZ5.js",import.meta.url).href,import.meta.url),{type:"module"}):!1}catch{Ae=!1}const n=()=>{if(Ae){Ae.terminate?.(),Ae=!1;for(const[e,t]of Jt){const o=Ln(e);Object.assign(o,{busy:!1,frameAsked:null,pending:null}),Ss(t)}Jt.clear()}};return Ae&&(Ae.onerror=n),Ae&&(Ae.onmessage=e=>{const{key:t,frame:o,result:i,error:s,took:r}=e.data,a=Ln(t);if(a.busy=!1,Jt.delete(t),s){console.warn(`fit (worker): ${s}; fitting here instead`),Jt.set(t,a.board),n();return}if($s.set(a.board,r),a.frameAsked===o||!a.result?Object.assign(a,{result:i,frame:o,took:r}):a.result=i,a.pending){const l=a.pending;a.pending=null,pr(t,a,l)}Ss(a.board)}),Ae}function pr(n,e,t){e.busy=!0,Jt.set(n,e.board),Ae.postMessage({key:n,...t},[t.job.target.buffer])}function Vl(n,e,{shapes:t=80,kinds:o=["rect","triangle","circle"],seed:i=1,live:s=!1,turnover:r=.08,quality:a="fine",key:l="fit",board:d=null,advance:c=!1}={}){const{w:h,h:u}=Wl(e,a),f=Ln(l),p=[h,u,t,o.join(),n.name,a,i].join("|");if(f.sig!==p&&Object.assign(f,{sig:p,result:null,frame:null,frameAsked:null,pending:null}),f.board=d,f.result&&f.frame===n.frame&&!c)return f.result;const m={target:n.pixels(h,u),w:h,h:u,shapes:t,kinds:o,seed:i,live:s,turnover:r,quality:a,sig:p};if(!Jl())return f.core||={},f.result=Kl(f.core,m),f.frame=n.frame,f.result;const g=f.result?null:Yl(m.target);if(f.frameAsked!==n.frame||c){f.frameAsked=n.frame;const w={frame:n.frame,job:m};f.busy?f.pending=w:pr(l,f,w)}return f.result||{background:g,shapes:[]}}function Yl(n){const e=[0,0,0];for(let o=0;o<n.length;o+=3)e[0]+=n[o],e[1]+=n[o+1],e[2]+=n[o+2];const t=Math.max(1,n.length/3);return`#${e.map(o=>Math.round(o/t).toString(16).padStart(2,"0")).join("")}`}const Xl=["time","born","label","opacity","blend","note","src","asset","hidden","locked","group","path","fill"],Zl=new Set(["time","born","path","fill","why","color","brush","stage","closed","pressures","text","seed","by","label","opacity","blend","note","src","asset","hidden","locked","group","id"]);function bo(n){const e=Array.from({length:512},()=>n()),t=(i,s=0)=>e[((i*73856093^s*19349663)>>>0)%512],o=i=>i*i*(3-2*i);return(i,s=0)=>{const r=Math.floor(i),a=Math.floor(s),l=o(i-r),d=o(s-a),c=t(r,a),h=t(r+1,a),u=t(r,a+1),f=t(r+1,a+1);return c+(h-c)*l+(u-c)*d+(c-h-u+f)*l*d}}function tt(n,e={}){const t=(String(n).match(/\bunits\(\s*['"](fraction|artboard)['"]\s*\)/)||[])[1];if(t)return Xn(n,{...e,units:t});const o=Xn(n,{...e,units:"fraction"});return o.maxRaw>2.5?Xn(n,{...e,units:"artboard"}):o}function Xn(n,{seed:e=1,by:t={kind:"script",name:"script"},base:o=null,units:i="fraction",target:s=null,origin:r=null,fresh:a=!1}={}){const l=o?Me(o):Xe();o||(l.stages=[]);let d=vt(e),c=bo(d),h=null,u=0;const f=String(n).match(/\bartboard\(\s*([\d.]+)\s*,\s*([\d.]+)/),p=s?ke(l,s):null,m=p&&!p.main?p:null,b=f?Number(f[1]):m?m.width:l.artboard.width,g=f?Number(f[2]):m?m.height:l.artboard.height,w=i==="fraction";let y=m?{id:m.id,x:m.x,y:m.y,w:b,h:g}:{id:null,x:0,y:0,w:b,h:g};if(m&&f){const B=l.boards.find(C=>C.id===m.id);B.width=b,B.height=g}const S=()=>y.w/y.h;let k=0,v=0,T=null,x,L;const A=B=>B.map(C=>{const z=+C[0],U=+C[1];Math.abs(z)>k&&(k=Math.abs(z)),Math.abs(U)>k&&(k=Math.abs(U));const J=w?y.x+z*y.w:y.x+z,Y=w?y.y+U*y.h:y.y+U;return C.length>2?[J,Y,...C.slice(2)]:[J,Y]}),P=`${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}`;let $=0;const E=B=>`${B}_${P}${($++).toString(36)}`,I=new Map;let R=!1;const j=[],G=()=>(h||(h=ee.stage("Marks","marks")),h),D=(B={})=>{const C={},z={};for(const U in B)(Zl.has(U)?C:z)[U]=B[U];return{el:C,params:z}},O=(B,C)=>{const z=u,U=B.map((J,Y)=>{const oe=typeof C=="function"?C(Y/Math.max(1,B.length-1),Y):J[3]??C??.5;return[J[0],J[1],J[2]??z+Y*16,Math.max(0,Math.min(1,oe))]});return u=z+B.length*16+120,U},K=(B,C,z,U)=>{let J=Array.isArray(C)&&C.length>0;for(let se=0;J&&se<C.length;se++){const de=C[se];J=Array.isArray(de)&&Number.isFinite(+de[0])&&Number.isFinite(+de[1])}if(!J)throw new Error(`${B}() needs a list of points like [[x, y], [x, y], ...] (got ${Array.isArray(C)?`an array whose items are ${typeof C[0]}`:typeof C}). walk(), circle() and rect() return such lists.`);const{el:Y,params:oe}=D(z);for(const se in oe){const de=oe[se];if(typeof de!="number"&&typeof de!="string")throw new Error(`Brush parameter "${se}" must be a number (got ${typeof de}). For per-point variation use pressures: t => 0..1, or make several marks.`)}let re;if(Y.stage){if(re=I.get(Y.stage),!re||!l.stages.some(se=>se.id===re)){const se=l.stages.find(de=>de.id===Y.stage||de.name===Y.stage);re=se?se.id:ee.stage(String(Y.stage),"marks").id,I.set(Y.stage,re)}}else re=G().id;const he=Y.brush||U;if((!R||!Z[he])&&(sn(l),R=!0),!Z[he])throw new Error(`Unknown brush "${he}" (have: ${Object.keys(Z).join(", ")})`);const N={id:E(B),stage:re,role:B,points:O(A(C),Y.pressures),closed:B==="plane"?!0:!!Y.closed,realize:{brush:he,params:oe},color:Y.color||null,text:Y.text,why:Y.why||"",by:Y.by||t,seed:Y.seed??Math.floor(d()*1e9),created:u,...y.id?{board:y.id}:{}};for(const se of Xl)Y[se]!==void 0&&(N[se]=Y[se]);return l.elements.push(N),N.id},ee={artboard(B=1e3,C=1e3,z="#f3efe6"){if(m){const U=l.boards.find(J=>J.id===m.id);return Object.assign(U,{width:B,height:C,ground:z}),U}return l.artboard={...l.artboard,width:B,height:C,ground:z},l.artboard},board(B,C={}){if(B==null||B===""||B==="main")return y={id:null,x:0,y:0,w:b,h:g},{id:"main",title:l.artboard.title||"Main",width:b,height:g};l.boards=Array.isArray(l.boards)?l.boards:[];let z=ke(l,B);if(!z){const U=Number(C.width)||b,J=Number(C.height)||g,Y=Number.isFinite(C.x)&&Number.isFinite(C.y)?{x:C.x,y:C.y,width:U,height:J}:en(l,U,J);z={id:Nn(l),title:String(B),...Y,ground:C.ground||l.artboard.ground},l.boards.push(z)}return y=z.main?{id:null,x:0,y:0,w:b,h:g}:{id:z.id,x:z.x,y:z.y,w:z.width,h:z.height},{id:z.id,title:z.title,width:z.width,height:z.height}},source(B,C={}){return tn(B,{x:y.x+(r?.x||0),y:y.y+(r?.y||0),width:y.w,height:y.h},{fit:C.fit==="contain"?"contain":"cover"})},fit(B,C={}){const z=typeof B=="string"?ee.source(B):B,U=`fit:${t?.name||""}:${y.id||"main"}:${v++}:${C.key||""}`,J=Vl(z,y.w/y.h,{...C,advance:a&&!!C.live,key:U,board:t?.kind==="code"&&t.name||y.id||"main"}),Y=(N,se)=>w?[N,se]:[N*y.w,se*y.h],oe=C.stage||"Fit",re=C.why||`fitted to ${z.name}`,he=C.brush||"flat";C.ground!==!1&&ee.plane([Y(0,0),Y(1,0),Y(1,1),Y(0,1)],{color:J.background,brush:he,path:"straight",stage:oe,why:`${re}: the ground`});for(const N of J.shapes)ee.plane(N.points.map(([se,de])=>Y(se,de)),{color:N.color,brush:he,...N.straight?{path:"straight"}:{},stage:oe,why:re});return J.shapes.length},state(B=""){return Ln(`state:${t?.name||""}:${y.id||"main"}:${B}`)},stage(B,C="marks",z={}){const U=on.includes(C)?C:"marks";let J=l.stages.find(Y=>Y.name===B);return J||(J={id:xe("stage"),name:B,kind:U,visible:!0,locked:!1,why:z.why||""},l.stages.push(J)),h=J,J},point(B,C,z={}){return K("point",[[B,C]],z,"dot")},points(B,C={}){return B.map(([z,U])=>ee.point(z,U,C))},line(B,C={}){return K("line",B,C,"ink")},plane(B,C={}){return K("plane",B,C,"flat")},guide(B,C={}){return K("guide",B,C,"guide")},gesture(B,C={}){return K("gesture",B,C,"guide")},note(B,C,z,U={}){return K("note",[[B,C]],{...U,text:z},"none")},image(B,C={}){return K("image",B,C,"image")},defineLine(B,C,z){if(typeof C=="function"&&(z=C,C={}),typeof B!="string"||!/^[a-z][\w-]*$/i.test(B))throw new Error('defineLine(name, fn): name must be a word like "teeth"');if(typeof z!="function")throw new Error("defineLine(name, fn): fn draws the line: (ctx, frames, p, env) => { ... }");if(Z[B]&&!Z[B].custom)throw new Error(`"${B}" is a built-in brush; choose another name`);return l.lines=l.lines||{},l.lines[B]={source:z.toString(),doc:C.doc||"",params:C.params||{}},sn(l),B},brush(B){if(!B||typeof B!="object"||typeof B.draw!="function")throw new Error("brush({ id, params, draw(ctx, e, p, k) { … } })");if(Dn(B.id))throw new Error(`"${B.id}" is a built-in brush; give yours its own id`);const C=_a(B);return ln(C,"doc"),l.brushes=l.brushes||{},l.brushes[B.id]=C,B.id},decide(B,C,z,U=""){return l.decisions.push({id:xe("dec"),stage:G().id,question:B,options:C,chosen:z,why:U,by:t,t:u}),z},walk({from:B=[0,0],heading:C=0,steps:z=50,step:U=w?.01:10,turn:J=()=>0}={}){const Y=[[B[0],B[1]]];let[oe,re]=B,he=C;for(let N=0;N<z;N++){he+=J(N,N/Math.max(1,z-1))||0;const se=he*Math.PI/180;oe+=Math.cos(se)*U,re+=Math.sin(se)*U*(w?S():1),Y.push([oe,re])}return Y},circle(B,C,z,U=48){const J=w?z*S():z;return Array.from({length:U},(Y,oe)=>[B+Math.cos(oe/U*Math.PI*2)*z,C+Math.sin(oe/U*Math.PI*2)*J])},units(){},width:b,height:g,rect(B,C,z,U,J=0){const Y=Math.min(Math.max(+J||0,0),1);if(!Y)return[[B,C],[B+z,C],[B+z,C+U],[B,C+U]];const oe=Math.min(B,B+z),re=Math.max(B,B+z),he=Math.min(C,C+U),N=Math.max(C,C+U),se=w?S():1,de=Y*Math.min(re-oe,(N-he)/se)/2,qe=de*se,Gs=[];for(const[Nr,Rr,Dr]of[[re-de,he+qe,-Math.PI/2],[re-de,N-qe,0],[oe+de,N-qe,Math.PI/2],[oe+de,he+qe,Math.PI]])for(let Fn=0;Fn<=6;Fn++){const Js=Dr+Fn/6*(Math.PI/2);Gs.push([Nr+Math.cos(Js)*de,Rr+Math.sin(Js)*qe])}return Gs},random(B,C){const z=d();return B===void 0?z:C===void 0?z*B:B+z*(C-B)},noise(B,C){return c(B,C)},seed(B){d=vt(B),c=bo(d)},lerp:(B,C,z)=>B+(C-B)*z,map:(B,C,z,U,J)=>U+(B-C)/(z-C)*(J-U),range:B=>Array.from({length:B},(C,z)=>z),sin:Math.sin,cos:Math.cos,abs:Math.abs,min:Math.min,max:Math.max,sqrt:Math.sqrt,floor:Math.floor,round:Math.round,PI:Math.PI,TAU:Math.PI*2,underlay(B={}){T=B===null?{source:null}:{...T||{},...B}},mask(B=!0){x=B&&typeof B=="object"?{...B}:!!B},fx(B=[]){L=Array.isArray(B)?B.map(C=>typeof C=="string"?{type:C}:{...C}):[]},print:(...B)=>j.push(B.map(C=>typeof C=="string"?C:JSON.stringify(C)).join(" "))};try{return new Function(...Object.keys(ee),`"use strict";
{
${n}
}`)(...Object.values(ee)),l.stages.length||ee.stage("Marks","marks"),l.meta={...l.meta||{},script:n,seed:e,by:t,ran:new Date().toISOString()},l.meta.units=i,{doc:Me(l,{own:!0}),error:null,logs:j,maxRaw:k,units:i,underlay:T,mask:x,fx:L}}catch(B){const C=String(B.stack||"").match(/<anonymous>:(\d+):(\d+)/),z=C?Math.max(1,Number(C[1])-4):null;return{doc:null,error:B.message||String(B),errorLine:z,logs:j,maxRaw:0,units:i}}}function fr(n,e,{board:t="main",seed:o=1,by:i}={}){const s=ke(n,t)||ke(n,"main"),r={...structuredClone(n),elements:n.elements.filter(a=>(a.board||"main")!==s.id).map(a=>structuredClone(a))};return tt(e,{seed:o,by:i,base:r,target:s.id})}const Ql=`// Coordinates are fractions of the artboard (0..1); width and height give its size. units('artboard') for absolute.
artboard(w, h, ground)
stage(name, kind)            kind: ${on.join(" | ")}
board(title, {width, height})   later marks land on this board (made if new); fractions are of this board. board() = main
source(name, { fit })   a camera / image / video: .color(x, y) .value(x, y) .rgb(x, y) .pose .hands .mask(x, y) .frame (fit: 'cover' crops, 'contain' letterboxes)
fit(source, {shapes, kinds, brush, stage, live})   redraw a source as plane marks (live: continuous)
point(x, y, {size, color, why})
line(points, {brush, width, pressure, taper, wobble, color, why, pressures: t => 0..1, time: {in, hold, out, life, draw, curve, loop}})
plane(points, {brush: flat | hatch | stipple | wash, angle, spacing, density, color, why})   line brushes: ink charcoal chalk pencil bristles marker ...
guide(points, {why})   gesture(points, {why})   note(x, y, text)
decide(question, options, chosen, why)
brush({id, label, roles, doc, params: {k: [min, max, def, doc]}, draw(ctx, e, p, k) {...}})   then line(pts, {brush: id})
  k: frames(e) smoothPath spans rotatePts segment beginInk tracePath draw(id, ctx, e, p) rng() noise(x, y) age
  textured: k.paint(ctx, {key, bounds, draw(l), grain, color, alpha}) dabs hairs wash bounds hash grain
defineLine(name, {doc, params: {k: [min, max, def]}}, (ctx, frames, p, env) => {...})   (shorthand)
  frames: [{x, y, nx, ny, speed, pressure}]   env: {color, rng, closed}
walk({from, heading, steps, step, turn: (i, t) => degrees})
circle(cx, cy, r, n = 48)   rect(x, y, w, h, round = 0)   round 0..1 rounds the corners (1 is a pill); draw it with path: 'straight'
random(a, b)  noise(x, y)  seed(n)  lerp  map  range(n)  sin cos PI TAU  print(...)`;[["artboard","artboard(width, height, ground)","Size of the sheet and its paper color."],["width","width","The artboard width in artboard units (coordinates are fractions: 0..1 across)."],["height","height","The artboard height in artboard units (coordinates are fractions: 0..1 down)."],["units","units('fraction' | 'artboard')","Coordinates as fractions of the artboard (the default) or in artboard units."],["brush","brush({ id, label, roles, doc, params: { key: [min, max, default, doc] }, draw(ctx, e, p, k) { … } })","Define a brush in code (the drawing keeps it). k is the brush kit: k.frames, k.smoothPath, k.spans, k.segment, k.beginInk, k.rng, k.noise, k.draw."],["board","board(title, { width, height, x, y, ground })","Later marks land on this board (made if new, right of the others); coordinates are fractions of it. board() goes back to the main board. Returns { id, title, width, height }."],["source","source(name)","A named source (Sources panel: camera, image, video): .color(x, y), .value(x, y) 0..1, .rgb(x, y), .pose [[{x, y, v}]], .hands [[{x, y}]], .face [{points: [{x, y, z}] × 478, blend: {smile, jawOpen, blink…}, box}], .track('pose' | 'hands' | 'face'), .mask(x, y), .point(name), .frame. Fractions of the board."],["fit","fit(source, { shapes: 80, kinds: ['rect', 'triangle', 'circle'], quality: 'fine' | 'fast', brush, stage, seed, ground, live })","Redraw a source as plane marks by greedy shape fitting (in the background: the board shows the last fit until the next is ready). quality: 'fast' is about ten times cheaper (rectangles and circles, the p5 export's fitter). live: true keeps the shapes and replaces a few per new frame (continuous, with a board that follows its sources)."],["state","state(name)","An object kept between runs of the board's code (it runs again on each frame of a source it follows): keep what a process carries on with, e.g. the shapes of a live fit."],["stage","stage(name, kind)",`Start a stage; later marks land in it. kind: ${on.join(", ")}.`],["point","point(x, y, { size, color, why })","A mark at a place."],["points","points([[x, y], …], opts)","Several points with the same options."],["line","line(points, { brush, width, pressure, taper, wobble, color, why, pressures: t => 0..1 })","A point that moved. Brushes: ink, speed, restate, zigzag, inner, dotted, arcs, or your own (defineLine)."],["plane","plane(points, { brush: 'flat' | 'hatch' | 'stipple', angle, spacing, density, color, why })","An enclosed area."],["guide","guide(points, { why })","Construction: axes, proportions (process view only)."],["gesture","gesture(points, { why })","The movement behind a form (process view only)."],["note","note(x, y, text)","Writing on the process."],["decide","decide(question, options, chosen, why)","Record a decision; returns the chosen option."],["defineLine","defineLine(name, { doc, params: { key: [min, max, default] } }, (ctx, frames, p, env) => { … })","Create your own line. frames: [{ x, y, nx, ny, speed, pressure }]; env: { color, rng, closed }. Then line(pts, { brush: name })."],["walk","walk({ from: [x, y], heading, steps, step, turn: (i, t) => degrees })","A line going for a walk: returns its points."],["circle","circle(cx, cy, r, n = 48)","Points around a circle."],["rect","rect(x, y, w, h, round = 0)","The four corners of a rectangle; round (0 to 1, 1 a pill) rounds them, baked into the points: draw it with path: 'straight'."],["random","random(a, b)","Seeded random: random() 0..1, random(b) 0..b, random(a, b)."],["noise","noise(x, y)","Seeded smooth noise, about -1..1."],["seed","seed(n)","Reseed random() and noise()."],["lerp","lerp(a, b, t)","Linear interpolation."],["map","map(v, a, b, c, d)","Map v from a..b to c..d."],["range","range(n)","[0, 1, …, n-1]"],["mask","mask(true | false | { source | board, mode, invert, feather, fx })","mask(true) crops this board's marks to the board (its own rectangle; by default marks may go past the paper); mask({ source: 'cam', mode: 'luma' | 'alpha', invert, feather, fx }) shows the board through a source, or through a board of marks ({ board: 'Shape' }); mask(false) takes masks away."],["fx","fx([{ type: 'threshold', level: 0.5 }, 'invert', …])","Post effects on this board's picture, opt-in: threshold, levels, contrast, brightness, invert, posterize, gradient (stops), blur, pixelate. fx([]) takes them away."],["underlay","underlay({ source, opacity, blend, fit })","The source shown under this board (a reference, not part of the picture): which, opacity 0..1 (0 hides it), blend (multiply, screen…), fit (cover | contain). underlay(null) takes it away. Put the numbers in code with /* 0..1 */ and they get sliders."],["print","print(...values)","Write to the output under the editor."],["sin","sin(a)",""],["cos","cos(a)",""],["abs","abs(v)",""],["min","min(...v)",""],["max","max(...v)",""],["sqrt","sqrt(v)",""],["floor","floor(v)",""],["round","round(v)",""],["PI","PI","π"],["TAU","TAU","2π"]].map(([n,e,t])=>({name:n,signature:e,doc:t}));const Qe=n=>Math.round(n*10)/10,ec="#1d1b19";function Mn(n,{title:e=n.title||"drawing",version:t="2"}={}){const o=String(t)==="1",{width:i,height:s,ground:r}=n.artboard,a=new Map(n.stages.map((k,v)=>[k.id,v])),l=n.elements.filter(k=>!k.hidden&&k.points?.length&&!["guide","gesture","image"].includes(k.role)&&k.realize?.brush!=="guide").map((k,v)=>[k,v]).sort((k,v)=>(a.get(k[0].stage)??0)-(a.get(v[0].stage)??0)||k[1]-v[1]).map(([k])=>k),d=l.map(k=>{const v=k.realize?.brush||"ink",T=k.realize?.params||{},x=k.color&&k.color!=="none"?k.color:ec,L=Qe(Number(T.width??T.size??3)),A=`${k.label||k.role}${v!=="ink"&&v!=="pen"&&v!=="dot"&&v!=="flat"?` (drawn with the ${v} brush)`:""}${k.why?`: ${k.why}`:""}`;if(k.role==="point")return{kind:"dot",comment:A,fill:x,size:L,pts:k.points.map(([j,G])=>[Qe(j),Qe(G)])};if(k.role==="note")return{kind:"note",comment:A,fill:x,size:Qe(Number(k.note?.size??18)),text:String(k.text||""),pts:[[Qe(k.points[0][0]),Qe(k.points[0][1])]]};const P=k.role==="plane",$=!!(P||k.closed),E=P?k.fill||(k.color==="none"?null:x):k.fill||null,I=P?k.fill&&k.color&&k.color!=="none"?k.color:null:k.color==="none"?null:x,R=k.points.length>12?Nt(k.points,1):k.points;return{kind:P?"plane":"line",comment:A,fill:E,stroke:I,weight:I?P?2:L:0,smooth:!(k.path==="straight"||R.length<3),closed:$,pts:R.map(([j,G])=>[Qe(j),Qe(G)])}}),c=[],h=[],u=new Set;let f={};const p=(k,v)=>f[k]!==v?(f[k]=v,v):null,m=(...k)=>{for(const v of k)v&&c.push(`  ${v};`)},b=k=>{k.kind==="line"||k.kind==="plane"?(m(k.fill?p("fill",`fill('${k.fill}')`):p("fill","noFill()")),m(k.stroke?p("stroke",`stroke('${k.stroke}')`):p("stroke","noStroke()")),k.stroke&&m(p("weight",`strokeWeight(${k.weight})`))):m(p("stroke","noStroke()"),p("fill",`fill('${k.fill}')`),k.kind==="note"?p("size",`textSize(${k.size})`):null)},g=k=>{const v=k.pts.map(([T,x])=>`${T}, ${x}`);if(m("beginShape()"),k.smooth)if(o){const T=k.closed?[v.at(-1),...v,v[0],v[1]]:[v[0],...v,v.at(-1)];for(const x of T)m(`curveVertex(${x})`)}else for(const T of v)m(`splineVertex(${T})`);else for(const T of v)m(`vertex(${T})`);m(k.closed&&(!k.smooth||!o)?"endShape(CLOSE)":"endShape()")},w=[];for(const k of d){const v=w.at(-1);v&&v.kind===k.kind?v.items.push(k):w.push({kind:k.kind,items:[k]})}const y={};for(const k of w){const v=k.items.length,T=k.items.reduce((O,K)=>O+K.pts.length,0);if(!(k.kind!=="note"&&(v>=5||T>40))){for(const O of k.items)if(c.push("",`  // ${O.comment}`),b(O),O.kind==="dot")for(const[K,ee]of O.pts)m(`circle(${K}, ${ee}, ${O.size})`);else O.kind==="note"?m(`text(${JSON.stringify(O.text)}, ${O.pts[0][0]}, ${O.pts[0][1]})`):g(O);continue}const L=O=>k.items.every(K=>JSON.stringify(K[O])===JSON.stringify(k.items[0][O])),A={dot:"dots",line:"lines",plane:"planes"}[k.kind];y[A]=(y[A]||0)+1;const P=y[A]>1?`${A}${y[A]}`:A,$=[...new Set(k.items.map(O=>O.comment))],E={dot:"points",line:"lines",plane:"planes"}[k.kind];if(c.push("",`  // ${v} ${E}${$.length===1&&!["point","line","plane"].includes($[0])?`: ${$[0]}`:""} (the list ${P}, above)`),k.kind==="dot"){const O=k.items.flatMap(B=>B.pts.map(([C,z])=>({x:C,y:z,size:B.size,fill:B.fill}))),K=["size","fill"].filter(B=>!O.every(C=>C[B]===O[0][B]));h.push(`// ${O.length} points: x, y${K.length?`, ${K.map(B=>B==="size"?"size":"color").join(", ")}`:""}`,`const ${P} = [
${tc(O.map(B=>`[${[B.x,B.y,...K.map(C=>C==="fill"?`'${B.fill}'`:B[C])].join(", ")}]`))}
];`,""),m(p("stroke","noStroke()")),K.includes("fill")||m(p("fill",`fill('${O[0].fill}')`));const ee=["x","y",...K.map(B=>B==="size"?"d":"c")].join(", ");c.push(`  for (const [${ee}] of ${P}) {`),K.includes("fill")&&c.push("    fill(c);"),c.push(`    circle(x, y, ${K.includes("size")?"d":O[0].size});`,"  }"),K.includes("fill")&&delete f.fill;continue}const I=["fill","stroke","weight","smooth","closed"].filter(O=>!L(O)),R=k.items[0],j=O=>JSON.stringify(O.pts).replace(/,/g,", ");I.length?h.push(`// ${v} ${{line:"lines",plane:"planes"}[k.kind]}: ${[...I,"pts"].join(", ")}`,`const ${P} = [
${k.items.map(O=>`  { ${[...I.map(K=>`${K}: ${typeof O[K]=="string"?`'${O[K]}'`:JSON.stringify(O[K])}`),`pts: ${j(O)}`].join(", ")} }`).join(`,
`)}
];`,""):h.push(`// ${v} ${{line:"lines",plane:"planes"}[k.kind]}, each a list of points`,`const ${P} = [
${k.items.map(O=>`  ${j(O)}`).join(`,
`)}
];`,""),I.includes("fill")||m(R.fill?p("fill",`fill('${R.fill}')`):p("fill","noFill()")),I.includes("stroke")||m(R.stroke?p("stroke",`stroke('${R.stroke}')`):p("stroke","noStroke()")),!I.includes("weight")&&R.stroke&&m(p("weight",`strokeWeight(${R.weight})`)),c.push(I.length?`  for (const m of ${P}) {`:`  for (const pts of ${P}) {`),I.includes("fill")&&c.push("    if (m.fill) fill(m.fill); else noFill();"),I.includes("stroke")&&c.push("    if (m.stroke) stroke(m.stroke); else noStroke();"),I.includes("weight")&&c.push("    strokeWeight(m.weight);");for(const O of I)["fill","stroke","weight"].includes(O)&&delete f[O];const G=I.includes("smooth")?"m.smooth":String(R.smooth),D=I.includes("closed")?"m.closed":String(R.closed);c.push(`    shape(${I.length?"m.pts":"pts"}, ${G}, ${D});`,"  }"),u.add("shape")}const S=o?`// A list of points as one shape: smooth (curveVertex, with an extra point at each end) or straight.
function shape(pts, smooth, closed) {
  beginShape();
  if (!smooth) for (const [x, y] of pts) vertex(x, y);
  else {
    const seq = closed ? [pts.at(-1), ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts.at(-1)];
    for (const [x, y] of seq) curveVertex(x, y);
  }
  if (closed && !smooth) endShape(CLOSE); else endShape();
}`:`// A list of points as one shape: smooth (a spline through every point) or straight.
function shape(pts, smooth, closed) {
  beginShape();
  for (const [x, y] of pts) {
    if (smooth) splineVertex(x, y);
    else vertex(x, y);
  }
  if (closed) endShape(CLOSE); else endShape();
}`;return`// ${e}: drawn in Artist Model Studio
// ${l.length} mark${l.length===1?"":"s"}, as plain p5.js ${o?"1.x":"2.x"} calls.
${h.length?`
${h.join(`
`)}`:""}
function setup() {
  createCanvas(${Math.round(i)}, ${Math.round(s)});
  noLoop();
}

function draw() {
  background('${r&&r!=="transparent"?r:"#ffffff"}');
  strokeCap(ROUND);
  strokeJoin(ROUND);
${c.join(`
`)}
}
${u.has("shape")?`
${S}
`:""}`}function tc(n,e=6){const t=[];for(let o=0;o<n.length;o+=e)t.push(`  ${n.slice(o,o+e).join(", ")}`);return t.join(`,
`)}let gt=1;function nc(n,e){let t=1/0;for(const o of n.elements){if(!o.time)continue;const i=Ti(o.time,(e-(o.born??e))/1e3);if(i===0)return 0;i<t&&(t=i)}return t*1e3}function bt(n,e,{mode:t="process",upTo:o=1/0,transform:i={x:0,y:0,scale:1},selected:s=new Set,hovered:r=null,ground:a=!0,showNotes:l=!0,screenNotes:d=!1,selectColor:c="#8a8a8a",frozen:h=!1,now:u=null,view:f=null}={}){const{width:p,height:m}=e.artboard;if(ka(),n.save(),n.translate(i.x,i.y),n.scale(i.scale,i.scale),a)for(const v of V(e))n.fillStyle=v.ground||"#ffffff",n.fillRect(v.x,v.y,v.width,v.height);const b=new Map(e.stages.map((v,T)=>[v.id,T])),g=new Map(e.stages.map(v=>[v.id,v])),w=e.elements.map((v,T)=>[v,T]).sort((v,T)=>(b.get(v[0].stage)??0)-(b.get(T[0].stage)??0)||v[1]-T[1]).map(([v])=>v);sn(e);const y={scale:i.scale,rng:null,frozen:h,now:u,age:0},S=new Map(V(e).map(v=>[v.id,{x:v.x,y:v.y,width:v.width,height:v.height,mask:!!v.mask}]));y.boards=S;const k=[];for(const v of w){let T=v;const x=g.get(T.stage);if(!x||!x.visible||T.hidden||(b.get(T.stage)??0)>o)continue;gt=1,y.age=0;let L=1;if(u!=null&&T.time){const R=(u-(T.born??u))/1e3;if(Va(T.time,R)||(gt=Ga(T.time,R),gt<=.003))continue;y.age=R,L=Ja(T.time,R)}const A=Z[T.realize?.brush]||Z.ink,P=S.get(T.board||H),$=P?.mask?P:null;if(A.texture&&!T.fill&&T.color!=="none"&&T.role!=="guide"&&T.role!=="gesture"&&T.role!=="note"){rc(n,T,A,y,L,f,$);continue}if(L<1&&(T={...T,points:Ei(T.points,L)}),A.construction||T.role==="guide"||T.role==="gesture"||T.role==="note"){k.push(T);continue}y.rng=vt(T.seed||1),y.straight=T.path==="straight",y.board=S.get(T.board||H)||S.get(H);const I=$&&gr(T.points,(Number(T.realize?.params?.width)||20)*1.5,$);I&&oc(n,$),sc(n,T,A,y),I&&n.restore()}if(gt=1,t==="process")for(const v of k){if(y.rng=vt(v.seed||1),y.straight=v.path==="straight",v.role==="note"){l&&nt(n,v,()=>nl(n,v));continue}const T=Z[v.realize?.brush]?.construction?v.realize.brush:"guide";nt(n,v,()=>Z[T].draw(n,v,Pe(T,v.realize.params),y))}mr(n,e.elements,s,r,c,i.scale),n.restore()}function mr(n,e,t,o,i,s){for(const r of e){if(!t.has(r.id)&&o!==r.id)continue;n.save(),n.strokeStyle=i,n.globalAlpha=t.has(r.id)?1:.5,n.lineWidth=1.5/s,n.setLineDash([4/s,3/s]);const a=r.role==="note"?vs(r):r.points,l=a.map(h=>h[0]),d=a.map(h=>h[1]),c=6/s;l.length&&n.strokeRect(Math.min(...l)-c,Math.min(...d)-c,Math.max(...l)-Math.min(...l)+c*2,Math.max(...d)-Math.min(...d)+c*2),n.restore()}}function sc(n,e,t,o){if(e.color==="none"){e.fill&&e.role==="plane"?nt(n,e,()=>t.draw(n,{...e,color:e.fill},Pe(e.realize.brush,e.realize.params),o)):e.fill&&e.points.length>2&&e.closed&&nt(n,e,()=>wo(n,e));return}if(e.role==="plane"&&!e.fill){nt(n,e,()=>ko(n,{...e,color:e.color||"#1d1b19"}));return}if(e.fill&&e.role==="plane"){nt(n,e,()=>{t.draw(n,{...e,color:e.fill},Pe(e.realize.brush,e.realize.params),o),e.color&&ko(n,e,o.scale)});return}e.fill&&e.points.length>2&&e.closed&&nt(n,e,()=>wo(n,e)),nt(n,e,()=>t.draw(n,e,Pe(e.realize.brush,e.realize.params),o))}function gr(n,e,t){for(const o of n)if(o[0]-e<t.x||o[0]+e>t.x+t.width||o[1]-e<t.y||o[1]+e>t.y+t.height)return!0;return!1}function oc(n,e){n.save(),n.beginPath(),n.rect(e.x,e.y,e.width,e.height),n.clip()}function ic(n,e,t){let o=1/0,i=1/0,s=-1/0,r=-1/0;for(const a of n)a[0]<o&&(o=a[0]),a[0]>s&&(s=a[0]),a[1]<i&&(i=a[1]),a[1]>r&&(r=a[1]);return s+e>=t[0]&&o-e<=t[2]&&r+e>=t[1]&&i-e<=t[3]}function yo(n,e,t,o){const i=Ei(e,t),s=i.length;if(n.beginPath(),s<2){n.rect(0,0,0,0),n.clip();return}const r=[],a=[];for(let l=0;l<s;l++){const d=i[Math.max(0,l-1)],c=i[Math.min(s-1,l+1)];let h=c[0]-d[0],u=c[1]-d[1];const f=Math.hypot(h,u)||1;h/=f,u/=f;let p=i[l][0],m=i[l][1];l===s-1&&(p+=h*o*.4,m+=u*o*.4),r.push([p-u*o,m+h*o]),a.push([p+u*o,m-h*o])}n.moveTo(r[0][0],r[0][1]);for(let l=1;l<s;l++)n.lineTo(r[l][0],r[l][1]);for(let l=s-1;l>=0;l--)n.lineTo(a[l][0],a[l][1]);n.closePath(),n.clip()}function rc(n,e,t,o,i,s,r){const a=e.realize.brush,l=Pe(a,e.realize.params),d=(e.opacity??1)*gt,c=e.blend&&e.blend!=="normal"?e.blend:null,h=i<1&&l.width>0&&e.role==="line",u=`${Ds(a,e.points,l,e.seed)}|${e.color}|${wi(o.scale)}`,f=Sa(u);if(f){const p=f.layer;if(s&&(p.x>s[2]||p.y>s[3]||p.x+p.w<s[0]||p.y+p.h<s[1]))return;const m=r&&(p.x<r.x||p.y<r.y||p.x+p.w>r.x+r.width||p.y+p.h>r.y+r.height);if(!h&&!c&&!m){ao(n,f,d);return}n.save(),m&&(n.beginPath(),n.rect(r.x,r.y,r.width,r.height),n.clip()),c&&(n.globalCompositeOperation=c),h&&yo(n,e.points,i,l.width*.8),ao(n,f,d),n.restore();return}if(!(s&&!ic(e.points,(l.width||30)*1.2,s))){o.rng=vt(e.seed||1),o.straight=e.path==="straight",o.board=o.boards?.get(e.board||H)||o.boards?.get(H),n.save(),n.globalAlpha*=d,r&&gr(e.points,(l.width||30)*1.2,r)&&(n.beginPath(),n.rect(r.x,r.y,r.width,r.height),n.clip()),c&&(n.globalCompositeOperation=c),h&&yo(n,e.points,i,l.width*.8),f===null&&va(u);try{t.draw(n,e,l,o)}finally{f===null&&Ma()}n.restore()}}function nt(n,e,t){if((e.opacity??1)>=1&&gt>=1&&(!e.blend||e.blend==="normal"))return t();n.save(),n.globalAlpha*=(e.opacity??1)*gt,e.blend&&e.blend!=="normal"&&(n.globalCompositeOperation=e.blend),t(),n.restore()}function Vt(n,{scale:e=1,mode:t="picture",upTo:o=1/0,board:i=H}={}){n=Be(n,i);const s=document.createElement("canvas");return s.width=Math.max(1,Math.round(n.artboard.width*e)),s.height=Math.max(1,Math.round(n.artboard.height*e)),bt(s.getContext("2d"),n,{mode:t,upTo:o,transform:{x:0,y:0,scale:e}}),s}function wo(n,e){const t=e.path==="straight"?e.points:De.smoothPath(e.points,!0);n.save(),n.fillStyle=e.fill,De.tracePath(n,t,!0),n.fill(),n.restore()}function ko(n,e){n.save(),n.strokeStyle=e.color,n.lineWidth=2,n.lineJoin="round",De.tracePath(n,e.path==="straight"?e.points:De.smoothPath(e.points,!0),!0),n.stroke(),n.restore()}const ac=`/**
 * Boards: a drawing can hold several artboards. The first, the main board, is the document's
 * \`artboard\` at the origin (so every older drawing, score and training record stays valid). More
 * boards live in \`doc.boards\`: { id, title, x, y, width, height, ground }, in sequence order.
 *
 * A mark belongs to a board through \`e.board\`:
 *   (absent)   the main board
 *   'id'       that board
 *   '_'        the blackboard: the space outside the boards, kept but in no board's picture
 *
 * \`boardDoc(doc, id)\` is one board as a document of its own (its marks, moved to the board's
 * origin, and its size as the artboard), so export, training and the process sheet work per board.
 * \`doc.train\` names the board models learn from (the main board by default).
 */
export const MAIN = 'main';
export const BLACKBOARD = '_';

/**
 * What a board holds: 'drawing' (marks, and optional studio code: the default), 'markdown' (a
 * document), 'html' (a page), 'p5' (a sketch), or 'frame': a slide, an area that holds the boards
 * whose centres lie inside it (they move with it, present together and export side by side).
 */
export const BOARD_KINDS = ['drawing', 'markdown', 'html', 'p5', 'frame', 'player', 'playlist'];
export const boardKind = b => (BOARD_KINDS.includes(b?.kind) ? b.kind : 'drawing');
export const isFrame = b => b?.kind === 'frame';
/** A player: controls (play, scrub, step, speed) for the source it names (board.source). */
export const isPlayer = b => b?.kind === 'player';

/** The boards a frame holds (their centres inside it), in reading order. */
export function boardsInFrame(doc, frame) {
  return boardsOf(doc).filter(b => b.id !== frame.id && !isFrame(b) && b.x + b.width / 2 >= frame.x && b.x + b.width / 2 <= frame.x + frame.width && b.y + b.height / 2 >= frame.y && b.y + b.height / 2 <= frame.y + frame.height)
    .sort((a, b) => (Math.abs(a.y - b.y) < 40 ? a.x - b.x : a.y - b.y));
}

/** The frame holding a board, or null. */
export const frameOf = (doc, b) => boardsOf(doc).find(f => isFrame(f) && boardsInFrame(doc, f).some(x => x.id === b.id)) || null;

/** What is presented, in order: the frames (reading order) when there are any, else the boards. */
export function slidesOf(doc) {
  const frames = boardsOf(doc).filter(isFrame);
  return frames.length ? frames.sort((a, b) => (Math.abs(a.y - b.y) < 40 ? a.x - b.x : a.y - b.y)) : boardsOf(doc);
}

/**
 * A board's switches: locked (its marks and the board itself stay as they are), hidden (not drawn,
 * not run), hideLabel (no title above it), hideBorder (no shadow or frame line: the board is only structure), perf (a performance line under it), mask (its marks are cropped to
 * the board: the default mask is the board's own rectangle), codeMin (on an exported page its code opens as a bar of
 * tabs only: Pseudocode, Studio, p5.js; a click opens one).
 */
export const BOARD_FLAGS = ['locked', 'hidden', 'hideLabel', 'hideBorder', 'perf', 'controls', 'mask', 'codeMin'];
/** Redraw rate: runs a second for a board that follows a source (none: once per new source frame). */
export const rateOf = b => { const r = Number(b?.rate); return Number.isFinite(r) && r > 0 ? Math.min(60, r) : 0; };
/**
 * Masks and effects (all opt-in, absent unless used): maskWith { source | board, mode: 'luma' | 'alpha', invert, feather, fx, fit },
 * fx (a stack of post effects on the board's picture), sourceFx (on the source under it). Cleaned up where they are used (fx.js).
 */
const copy = v => JSON.parse(JSON.stringify(v));
const fxFields = b => ({
  ...(b?.maskWith && typeof b.maskWith === 'object' && (b.maskWith.source || b.maskWith.board) ? { maskWith: copy(b.maskWith) } : {}),
  ...(Array.isArray(b?.fx) && b.fx.length ? { fx: copy(b.fx) } : {}),
  ...(Array.isArray(b?.sourceFx) && b.sourceFx.length ? { sourceFx: copy(b.sourceFx) } : {})
});
const flagsOf = b => ({ ...Object.fromEntries(BOARD_FLAGS.filter(k => b?.[k]).map(k => [k, true])), ...(rateOf(b) ? { rate: rateOf(b) } : {}) });

/** All boards, the main one first, each with its place: { id, title, x, y, width, height, ground, main }. */
export function boardsOf(doc) {
  const a = doc.artboard || { width: 1000, height: 1000, ground: '#f3efe6' };
  return [
    { id: MAIN, title: a.title || 'Main', x: 0, y: 0, width: a.width, height: a.height, ground: a.ground, ...(a.text ? { text: a.text } : {}), ...(a.code ? { code: a.code } : {}), ...(a.pseudo ? { pseudo: a.pseudo } : {}), ...(a.follow ? { follow: a.follow } : {}), ...(a.live ? { live: true } : {}), ...(a.paused ? { paused: true } : {}), ...(a.kind ? { kind: a.kind } : {}), ...(a.source ? { source: a.source, sourceOpacity: a.sourceOpacity, ...(a.sourceFit ? { sourceFit: a.sourceFit } : {}), ...(a.sourceBlend ? { sourceBlend: a.sourceBlend } : {}) } : {}), ...fxFields(a), ...flagsOf(a), main: true },
    ...(doc.boards || []).map(b => ({ ...b, main: false }))
  ];
}

export const boardById = (doc, id) => boardsOf(doc).find(b => b.id === (id || MAIN)) || null;

/** Find a board by id or title (case-insensitive). */
export function findBoard(doc, key) {
  if (key == null) return boardById(doc, MAIN);
  const k = String(key).toLowerCase();
  return boardsOf(doc).find(b => b.id === key || String(b.title).toLowerCase() === k) || null;
}

/** The board id a mark belongs to (MAIN, a board id, or BLACKBOARD). */
export const boardOfMark = e => e.board || MAIN;

/** The value to store on a mark for a board id (the main board is the absent field). */
export const markBoard = id => (!id || id === MAIN ? undefined : id);

/** The topmost board containing a world point (later boards sit above earlier ones), or null. */
export function boardAt(doc, x, y) {
  // Boards before frames: a mark drawn on a board inside a frame belongs to the board.
  const bs = [...boardsOf(doc).filter(isFrame), ...boardsOf(doc).filter(b => !isFrame(b))];
  for (let i = bs.length - 1; i >= 0; i--) {
    const b = bs[i];
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return b;
  }
  return null;
}

/** The board a set of points falls in: the board holding their center, else the blackboard. */
export function boardForPoints(doc, points) {
  if (!points?.length) return BLACKBOARD;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const b = boardAt(doc, (x0 + x1) / 2, (y0 + y1) / 2);
  return b ? b.id : BLACKBOARD;
}

/** Marks of one board. */
export const marksOf = (doc, id) => doc.elements.filter(e => boardOfMark(e) === (id || MAIN));

/**
 * One board as a document of its own: its marks at the board's origin, its size as the artboard.
 * The main board of a drawing without other boards is the drawing itself (minus the blackboard).
 */
export function boardDoc(doc, id = MAIN) {
  const b = boardById(doc, id) || boardById(doc, MAIN);
  const els = marksOf(doc, b.id);
  const moved = b.x || b.y ? els.map(e => ({ ...e, points: e.points.map(([x, y, t, p]) => [x - b.x, y - b.y, t, p]), board: undefined })) : els.map(e => (e.board ? { ...e, board: undefined } : e));
  const { boards, train, ...rest } = doc;
  return { ...rest, title: b.main ? doc.title : \`\${doc.title} · \${b.title}\`, artboard: { width: b.width, height: b.height, ground: b.ground }, elements: moved };
}

/** The board models learn from. */
export const trainBoard = doc => boardById(doc, doc.train)?.id || MAIN;

/** A fresh id for a new board. */
export function newBoardId(doc) {
  const used = new Set(boardsOf(doc).map(b => b.id));
  let n = used.size + 1;
  while (used.has(\`board\${n}\`)) n++;
  return \`board\${n}\`;
}

/** Where a new board goes: right of every board and every mark (so it never lands on the blackboard's scratch), top-aligned with the main one. */
export function nextBoardPlace(doc, width, height, gap = 80) {
  let right = Math.max(...boardsOf(doc).map(b => b.x + b.width));
  for (const e of doc.elements || []) for (const q of e.points) if (q[0] > right) right = q[0];
  return { x: Math.round(right + gap), y: 0, width, height };
}

/**
 * Older drawings have no boards: their marks lying wholly outside the artboard were scratch, so
 * they go to the blackboard. Runs once (the document then has a \`boards\` list).
 */
export function migrateBoards(d) {
  if (Array.isArray(d.boards)) {
    d.boards = d.boards.filter(b => b && b.id && b.id !== MAIN && b.id !== BLACKBOARD).map(b => ({
      id: String(b.id), title: String(b.title || b.id), x: Number(b.x) || 0, y: Number(b.y) || 0,
      width: Math.max(10, Number(b.width) || 1000), height: Math.max(10, Number(b.height) || 1000), ground: b.ground || d.artboard.ground,
      ...(b.text ? { text: String(b.text) } : {}), ...(b.code ? { code: String(b.code) } : {}), ...(b.pseudo ? { pseudo: String(b.pseudo) } : {}),
      ...(b.follow ? { follow: true } : {}), ...(b.live ? { live: true } : {}), ...(b.paused ? { paused: true } : {}), ...(b.kind ? { kind: String(b.kind) } : {}), ...(b.source ? { source: String(b.source), sourceOpacity: Number(b.sourceOpacity ?? 0.5), ...(b.sourceFit ? { sourceFit: String(b.sourceFit) } : {}), ...(b.sourceBlend ? { sourceBlend: String(b.sourceBlend) } : {}) } : {}), ...fxFields(b), ...flagsOf(b)
    }));
    const ids = new Set([MAIN, BLACKBOARD, ...d.boards.map(b => b.id)]);
    for (const e of d.elements) if (e.board && !ids.has(e.board)) e.board = BLACKBOARD;
    return d;
  }
  d.boards = [];
  const { width, height } = d.artboard;
  for (const e of d.elements) {
    if (e.board || !e.points?.length) continue;
    const outside = e.points.every(([x, y]) => x < 0 || y < 0 || x > width || y > height);
    if (outside) e.board = BLACKBOARD;
  }
  return d;
}
`,br=`/**
 * Time envelopes: how a mark (or anything) changes over its life. A mark has a birth time and an
 * optional time spec; at any moment its age gives an opacity, and a share of its stroke drawn.
 *
 *   { in, hold, out, life, draw, curve, loop }        all in seconds
 *
 *   in      fade in over this long (0: at once)
 *   hold    stay fully there this long after that (default: until the fade out starts)
 *   out     fade out over this long, then the mark is gone
 *   life    the whole life: the fade out ends there (hold follows); with none, and an out, it is
 *           in + hold + out; with no out, the mark stays for ever
 *   draw    the stroke draws itself over this long (a line grows from its start)
 *   curve   'smooth' (default), 'linear', 'ease-in', 'ease-out'
 *   loop    start again when it ends
 *
 * A number stands for { out: n }: fade out over n seconds. Used by the renderer (opacity and
 * reveal per mark), by brushes (k.age, k.envelope) and by board code (line(…, { time: {…} })).
 */
const CURVES = {
  linear: t => t,
  smooth: t => t * t * (3 - 2 * t),
  'ease-in': t => t * t,
  'ease-out': t => 1 - (1 - t) * (1 - t)
};
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);

/** A time spec in its full form (numbers, seconds), or null when there is none. */
export function normalizeTime(spec) {
  if (spec == null || spec === false) return null;
  // Already in full form (a mark in a document has been through here): as it is, without a copy (this is called for every mark of every frame).
  if (typeof spec === 'object' && typeof spec.in === 'number' && CURVES[spec.curve] && spec.in >= 0) return spec;
  if (typeof spec === 'number') return spec > 0 ? { in: 0, out: spec, curve: 'smooth' } : null;
  if (typeof spec !== 'object') return null;
  const t = { in: Math.max(0, num(spec.in)), curve: CURVES[spec.curve] ? spec.curve : 'smooth' };
  if (spec.out !== undefined) t.out = Math.max(0, num(spec.out));
  if (spec.hold !== undefined) t.hold = Math.max(0, num(spec.hold));
  if (spec.life !== undefined && num(spec.life) > 0) t.life = num(spec.life);
  if (spec.draw !== undefined && num(spec.draw) > 0) t.draw = num(spec.draw);
  if (spec.loop) t.loop = true;
  return t;
}

/** Seconds the mark lasts, or Infinity when it never fades out. */
export function lifeOf(spec) {
  const t = normalizeTime(spec);
  if (!t) return Infinity;
  if (t.life !== undefined) return t.life;
  if (t.out === undefined) return Infinity;
  return t.in + (t.hold ?? 0) + t.out;
}

/** Opacity (0..1) at an age in seconds. */
export function envelope(spec, age) {
  const t = normalizeTime(spec);
  if (!t) return 1;
  const life = lifeOf(t);
  if (t.loop && Number.isFinite(life) && life > 0) age = ((age % life) + life) % life;
  if (age < 0) return 0;
  const ease = CURVES[t.curve];
  let a = t.in > 0 ? ease(clamp01(age / t.in)) : 1;
  if (t.out !== undefined && Number.isFinite(life)) {
    const outStart = life - t.out;
    if (age >= life) return 0;
    if (age > outStart && t.out > 0) a *= 1 - ease(clamp01((age - outStart) / t.out));
  }
  return a;
}

/** How much of the stroke is drawn (0..1) at an age: 1 without a draw time. */
export function reveal(spec, age) {
  const t = normalizeTime(spec);
  if (!t || !t.draw) return 1;
  return CURVES[t.curve](clamp01(age / t.draw));
}

/** Is the mark gone at this age (past its life, and not looping)? */
export const expired = (spec, age) => { const t = normalizeTime(spec); return Boolean(t) && !t.loop && age >= lifeOf(t); };

/**
 * Seconds until something about this mark changes again: 0 while it fades in or out, draws itself or loops; the wait while it
 * simply stays (until it starts to fade out, or is gone); Infinity when nothing more will change.
 */
export function nextChange(spec, age) {
  const t = normalizeTime(spec);
  if (!t) return Infinity;
  if (t.loop) return 0;
  if (age < t.in) return 0;
  if (t.draw && age < t.draw) return 0;
  const life = lifeOf(t);
  if (!Number.isFinite(life) || age >= life) return Infinity;
  const outStart = t.out > 0 ? life - t.out : life;
  return age < outStart ? outStart - age : 0;
}

/** Is the mark moving at this age (fading, drawing or looping)? */
export const changing = (spec, age) => nextChange(spec, age) === 0;

/** The first \`share\` of a polyline by length (a stroke being drawn). */
export function cutPath(points, share) {
  if (share >= 1 || points.length < 2) return points;
  if (share <= 0) return points.slice(0, 1);
  const len = [0];
  for (let i = 1; i < points.length; i++) len.push(len[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const target = len[len.length - 1] * share;
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (len[i] <= target) { out.push(points[i]); continue; }
    const u = (target - len[i - 1]) / ((len[i] - len[i - 1]) || 1), a = points[i - 1], b = points[i];
    if (u <= 1e-9) break;   // (it ended exactly on the last point)
    out.push(a.map((v, j) => v + (b[j] - v) * u));
    break;
  }
  return out;
}
`,lc=`/**
 * Process document: the canonical record of how a picture is made.
 *
 * Paths with a role (point, line, plane, guide, gesture, note), grouped into ordered
 * stages, each realized by a brush, each carrying its reason and provenance.
 * Decisions (question, options, chosen, why) are kept alongside.
 *
 * Coordinates are artboard units (0..width, 0..height). Points are [x, y, t, p]:
 * t = milliseconds from the start of the gesture, p = pressure 0..1.
 *
 * Pure data + a tiny observable store with undo. No DOM.
 */
import { normalizeTime } from './envelope.js';
import { installLines, embedBrushes } from './brushes.js';
import { migrateBoards, boardsOf, newBoardId, nextBoardPlace, boardForPoints, MAIN, BLACKBOARD, BOARD_FLAGS, rateOf } from './boards.js';

export const PROCESS_VERSION = 1;

/** Blend modes (canvas globalCompositeOperation / CSS mix-blend-mode names). */
export const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-burn', 'color-dodge', 'soft-light', 'hard-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

export const ROLES = Object.freeze({
  point: 'A mark at a place: tension depends on where it sits (Kandinsky).',
  line: 'A point that moved (Klee: a line going for a walk).',
  plane: 'An enclosed area: realized by fill, hatching, or a field.',
  guide: 'Construction that is not part of the picture: axes, horizons, envelopes.',
  gesture: 'The movement behind a form: often drawn first, often hidden later.',
  note: 'A written annotation: reasons, critique, questions.',
  image: 'A picture placed on the page: a collage layer, a study, a quotation.'
});

export const STAGE_KINDS = Object.freeze([
  'analysis', 'concept', 'construction', 'blocking', 'structure', 'value', 'marks', 'accents', 'notes'
]);

export const DEFAULT_STAGES = () => [
  { id: 'construction', name: 'Construction', kind: 'construction', visible: true, locked: false },
  { id: 'marks', name: 'Marks', kind: 'marks', visible: true, locked: false },
  { id: 'notes', name: 'Notes', kind: 'notes', visible: true, locked: false }
];

let idCounter = 0;
export const newId = (prefix = 'el') => \`\${prefix}_\${Date.now().toString(36)}\${(idCounter++).toString(36)}\${Math.random().toString(36).slice(2, 5)}\`;

/** Default brush for each role. */
export const DEFAULT_REALIZE = Object.freeze({
  point: { brush: 'dot', params: {} },
  line: { brush: 'ink', params: {} },
  plane: { brush: 'flat', params: {} },
  guide: { brush: 'guide', params: {} },
  gesture: { brush: 'guide', params: {} },
  note: { brush: 'none', params: {} },
  image: { brush: 'image', params: {} }
});

export function createDocument({ width = 1000, height = 1000, ground = '#f3efe6', title = 'Untitled' } = {}) {
  return {
    type: 'ams-process',
    version: PROCESS_VERSION,
    title,
    artboard: { width, height, ground },
    stages: DEFAULT_STAGES(),
    elements: [],
    decisions: [],
    meta: { created: new Date().toISOString() }
  };
}

/** Fill in missing fields so older or hand-written documents load. */
export function normalizeDocument(doc, { own = false } = {}) {
  // own: the caller made this document and will not use it again (a script run): no copy of it first.
  const d = doc && typeof doc === 'object' ? (own ? doc : structuredClone(doc)) : createDocument();
  d.type = 'ams-process';
  d.version = PROCESS_VERSION;
  d.artboard = { width: 1000, height: 1000, ground: '#f3efe6', ...(d.artboard || {}) };
  d.stages = Array.isArray(d.stages) && d.stages.length ? d.stages : DEFAULT_STAGES();
  for (const s of d.stages) {
    s.id ||= newId('stage');
    s.name ||= s.id;
    s.kind ||= 'marks';
    s.visible = s.visible !== false;
    s.locked = Boolean(s.locked);
  }
  const stageIds = new Set(d.stages.map(s => s.id));
  d.elements = (d.elements || []).map(e => normalizeElement(e, stageIds.has(e.stage) ? e.stage : d.stages[0].id));
  d.decisions = d.decisions || [];
  d.lines = d.lines && typeof d.lines === 'object' ? d.lines : {};
  d.groups = d.groups && typeof d.groups === 'object' ? d.groups : {};
  d.brushes = d.brushes && typeof d.brushes === 'object' ? d.brushes : {};
  migrateBoards(d);
  if (d.train && !boardsOf(d).some(b => b.id === d.train)) delete d.train;
  installLines(d);
  return d;
}

/** A board's mask and effects from a patch: set from an object or a list, taken away with null or an empty list. */
function patchFx(b, patch) {
  if ('maskWith' in patch) { const m = patch.maskWith; if (m && typeof m === 'object' && (m.source || m.board)) b.maskWith = JSON.parse(JSON.stringify(m)); else delete b.maskWith; }
  for (const k of ['fx', 'sourceFx']) if (k in patch) { const l = patch[k]; if (Array.isArray(l) && l.length) b[k] = JSON.parse(JSON.stringify(l)); else delete b[k]; }
}

export function normalizeElement(e, stage) {
  const role = ROLES[e.role] ? e.role : 'line';
  return {
    id: e.id || newId(),
    stage: e.stage || stage,
    role,
    points: (e.points || []).map(p => [Number(p[0]) || 0, Number(p[1]) || 0, Number(p[2]) || 0, p[3] === undefined ? 0.5 : Number(p[3])]),
    closed: role === 'plane' ? true : Boolean(e.closed),
    realize: { ...(DEFAULT_REALIZE[role] || DEFAULT_REALIZE.line), ...(e.realize || {}), params: { ...(e.realize?.params || {}) } },
    color: e.color || null,
    ...(e.fill ? { fill: e.fill } : {}),
    text: role === 'note' ? String(e.text || '') : e.text,
    why: e.why || '',
    by: e.by || { kind: 'user', name: 'you' },
    seed: e.seed ?? Math.floor(Math.random() * 1e9),
    created: e.created || Date.now(),
    ...(e.label ? { label: String(e.label) } : {}),
    ...(e.group ? { group: String(e.group) } : {}),
    ...(e.board && e.board !== MAIN ? { board: String(e.board) } : {}),
    ...(e.hidden ? { hidden: true } : {}),
    ...(e.locked ? { locked: true } : {}),
    ...(e.note && typeof e.note === 'object' ? { note: { ...e.note } } : {}),
    ...(e.src ? { src: String(e.src) } : {}),
    ...(e.asset ? { asset: String(e.asset) } : {}),
    ...(e.bake && typeof e.bake === 'object' ? { bake: { ...e.bake } } : {}),
    ...(Number.isFinite(Number(e.opacity)) && Number(e.opacity) < 1 ? { opacity: Math.max(0, Number(e.opacity)) } : {}),
    ...(e.blend && e.blend !== 'normal' ? { blend: String(e.blend) } : {}),
    ...(e.path === 'straight' ? { path: 'straight' } : {}),
    // Time: a spec (see envelope.js) and the moment (epoch ms) it started; without \`now\` it is not applied.
    ...(normalizeTime(e.time) ? { time: normalizeTime(e.time), born: Number.isFinite(Number(e.born)) ? Number(e.born) : Date.now() } : {})
  };
}

/** Are three points on one straight line, with b between a and c? */
function collinear(a, b, c) {
  if (!a || !c) return false;
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const dot = (b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]);
  return Math.abs(cross) < 1e-6 && dot >= 0;
}

/** Bounding box of an element's points. */
export function bounds(e) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of e.points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

/**
 * Observable store with snapshot undo. Mutations go through \`change(label, fn)\` so every
 * edit is one undo step and one recorded action.
 */
export class ProcessStore {
  constructor(doc) {
    this.doc = normalizeDocument(doc || createDocument());
    this.past = [];
    this.future = [];
    this.listeners = new Set();
    this.log = []; // [{ t, label, by }] — the recorded editing session
  }

  /**
   * Listen to changes. Live redraws (transient changes: a board following its sources, many a second)
   * reach only listeners that ask for them with { live: true } (the canvas, autosave), so panels are
   * not rebuilt under the pointer.
   */
  /**
   * Undo keeps whole snapshots: at most 200 steps, and at most about 150 MB of them (a large drawing,
   * like a lesson of many thousand marks, keeps fewer steps rather than filling memory).
   */
  trimPast(maxSteps = 200, maxChars = 150e6) {
    let total = 0;
    for (const x of this.past) total += x.length;
    while (this.past.length > 1 && (this.past.length > maxSteps || total > maxChars)) total -= this.past.shift().length;
  }

  subscribe(fn, { live = false } = {}) { fn.live = live; this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(reason, transient = false) { this.rev = (this.rev || 0) + 1; for (const fn of this.listeners) if (!transient || fn.live) fn(this.doc, reason); }   // (rev: a count of changes, for caches)

  /** Apply a mutation as one undoable step. */
  change(label, fn, { by = 'user', record = true, transient = false } = {}) {
    // transient: a live redraw (a board following its sources): no undo step, not in the log.
    if (!transient) {
      this.past.push(JSON.stringify(this.doc));
      this.trimPast();
      this.future = [];
    }
    const result = fn(this.doc);
    embedBrushes(this.doc);
    if (record && !transient) this.log.push({ t: Date.now(), label, by });
    this.emit(label, transient);
    return result;
  }

  /** Record an edit made directly on \`doc\` (e.g. a drag): \`before\` is the JSON snapshot taken first. */
  commitFrom(before, label, { by = 'user' } = {}) {
    if (before === JSON.stringify(this.doc)) return;
    this.past.push(before);
    this.trimPast();
    this.future = [];
    this.log.push({ t: Date.now(), label, by });
    this.emit(label);
  }

  replace(doc, label = 'load') {
    this.change(label, () => { this.doc = normalizeDocument(doc); });
  }

  undo() {
    if (!this.past.length) return false;
    this.future.push(JSON.stringify(this.doc));
    this.doc = JSON.parse(this.past.pop());
    this.emit('undo');
    return true;
  }

  redo() {
    if (!this.future.length) return false;
    this.past.push(JSON.stringify(this.doc));
    this.trimPast();
    this.doc = JSON.parse(this.future.pop());
    this.emit('redo');
    return true;
  }

  // ---- convenience mutations ----
  addElement(el, opts) {
    return this.change(\`add \${el.role || 'element'}\`, d => {
      const e = normalizeElement(el, el.stage || d.stages[0].id);
      // A mark goes to the board it lands on (the blackboard outside them), unless told.
      if (!('board' in el)) { const b = boardForPoints(d, e.points); if (b !== MAIN) e.board = b; }
      d.elements.push(e);
      return e;
    }, opts);
  }

  updateElement(id, patch, label = 'edit', opts) {
    return this.change(label, d => {
      const e = d.elements.find(x => x.id === id);
      if (!e) return null;
      Object.assign(e, patch);
      if (patch.realize) e.realize = { ...e.realize, ...patch.realize, params: { ...e.realize.params, ...(patch.realize.params || {}) } };
      return e;
    }, opts);
  }

  /** Set fields (label, hidden, locked, group, stage…) on several elements at once; null removes a field. */
  patchElements(ids, patch, label = 'edit', opts) {
    const set = new Set(ids);
    return this.change(label, d => {
      for (const e of d.elements) if (set.has(e.id)) for (const [k, v] of Object.entries(patch)) { if (v === null || v === false) delete e[k]; else e[k] = v; }
    }, opts);
  }

  /** Group elements under a new group (named); returns the group id. */
  group(ids, name = null, opts) {
    return this.change('group', d => {
      const id = newId('group');
      d.groups = d.groups || {};
      d.groups[id] = { name: name || \`Group \${Object.keys(d.groups).length + 1}\` };
      const set = new Set(ids);
      for (const e of d.elements) if (set.has(e.id)) e.group = id;
      return id;
    }, opts);
  }

  ungroup(ids, opts) {
    const set = new Set(ids);
    return this.change('ungroup', d => {
      for (const e of d.elements) if (set.has(e.id)) delete e.group;
      const used = new Set(d.elements.map(e => e.group).filter(Boolean));
      for (const g of Object.keys(d.groups || {})) if (!used.has(g)) delete d.groups[g];
    }, opts);
  }

  renameGroup(id, name, opts) { return this.change('rename group', d => { if (d.groups?.[id]) d.groups[id].name = name; }, opts); }

  /**
   * Move elements before another element (or to the end of a stage), optionally into its group.
   * Order in the elements array is the drawing order within a stage.
   */
  reorder(ids, { before = null, stage = null, group } = {}, opts) {
    return this.change('reorder', d => {
      const set = new Set(ids);
      const moving = d.elements.filter(e => set.has(e.id));
      d.elements = d.elements.filter(e => !set.has(e.id));
      const target = before ? d.elements.find(e => e.id === before) : null;
      for (const e of moving) {
        if (target) e.stage = target.stage; else if (stage) e.stage = stage;
        if (group !== undefined) { if (group) e.group = group; else delete e.group; }
      }
      let at = target ? d.elements.indexOf(target) : -1;
      if (at < 0) { const st = moving[0]?.stage; const last = d.elements.map(e => e.stage).lastIndexOf(st); at = last + 1; }
      d.elements.splice(at, 0, ...moving);
    }, opts);
  }

  /** Drawing order within each stage: 'front' | 'back' | 'forward' | 'backward'. */
  arrange(ids, how, opts) {
    const set = new Set(ids);
    return this.change(\`arrange \${how}\`, d => {
      for (const st of d.stages) {
        const inStage = d.elements.filter(e => e.stage === st.id);
        if (!inStage.some(e => set.has(e.id))) continue;
        let order = inStage.slice();
        if (how === 'front') order = [...order.filter(e => !set.has(e.id)), ...order.filter(e => set.has(e.id))];
        else if (how === 'back') order = [...order.filter(e => set.has(e.id)), ...order.filter(e => !set.has(e.id))];
        else if (how === 'forward') { for (let i = order.length - 2; i >= 0; i--) if (set.has(order[i].id) && !set.has(order[i + 1].id)) [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
        else if (how === 'backward') { for (let i = 1; i < order.length; i++) if (set.has(order[i].id) && !set.has(order[i - 1].id)) [order[i], order[i - 1]] = [order[i - 1], order[i]]; }
        // Put the stage's elements back into their original slots in the array.
        const slots = d.elements.map((e, i) => (e.stage === st.id ? i : -1)).filter(i => i >= 0);
        slots.forEach((slot, j) => { d.elements[slot] = order[j]; });
      }
    }, opts);
  }

  /** Copies of elements, offset; returns the new ids. Groups are copied as new groups. */
  duplicate(ids, dx = 20, dy = 20, opts) {
    return this.change('duplicate', d => {
      const set = new Set(ids), groupMap = {}, out = [];
      for (const e of d.elements.filter(x => set.has(x.id))) {
        const c = structuredClone(e);
        c.id = newId(e.role); c.points = c.points.map(([x, y, ...r]) => [x + dx, y + dy, ...r]);
        if (e.group) { groupMap[e.group] ||= newId('group'); c.group = groupMap[e.group]; d.groups = d.groups || {}; d.groups[c.group] = { name: \`\${d.groups[e.group]?.name || 'Group'} copy\` }; }
        d.elements.push(c); out.push(c.id);
      }
      return out;
    }, opts);
  }

  /** Fewer points, same shape (Ramer–Douglas–Peucker; tolerance in artboard units). Time and pressure are kept. */
  simplify(ids, tolerance, opts) {
    const set = new Set(ids);
    return this.change('simplify', d => {
      let before = 0, after = 0;
      for (const e of d.elements) {
        if (!set.has(e.id) || e.points.length < 4 || ['point', 'note', 'image'].includes(e.role)) continue;
        before += e.points.length;
        e.points = rdp(e.points, tolerance);
        after += e.points.length;
      }
      return { before, after };
    }, opts);
  }

  removeElements(ids, opts) {
    const set = new Set(ids);
    return this.change('delete', d => { d.elements = d.elements.filter(e => !set.has(e.id)); }, opts);
  }

  addStage(stage, index = null, opts) {
    return this.change('add stage', d => {
      const s = { id: newId('stage'), name: 'Stage', kind: 'marks', visible: true, locked: false, ...stage };
      if (index === null) d.stages.push(s); else d.stages.splice(index, 0, s);
      return s;
    }, opts);
  }

  updateStage(id, patch, opts) {
    return this.change('edit stage', d => { const s = d.stages.find(x => x.id === id); if (s) Object.assign(s, patch); return s; }, opts);
  }

  moveStage(id, delta) {
    return this.change('reorder stages', d => {
      const i = d.stages.findIndex(s => s.id === id), j = i + delta;
      if (i < 0 || j < 0 || j >= d.stages.length) return;
      const [s] = d.stages.splice(i, 1);
      d.stages.splice(j, 0, s);
    });
  }

  removeStage(id) {
    return this.change('delete stage', d => {
      if (d.stages.length <= 1) return;
      const fallback = d.stages.find(s => s.id !== id).id;
      d.stages = d.stages.filter(s => s.id !== id);
      for (const e of d.elements) if (e.stage === id) e.stage = fallback;
    });
  }

  /**
   * Snap marks to a grid of step q (artboard units):
   *   points    every point to the nearest grid point
   *   tidy      points, then repeated points merged and points in the middle of straight runs dropped
   *   topleft   the whole mark moves so its top-left corner is on the grid (shape unchanged)
   *   center    the whole mark moves so its center is on the grid
   * One undo step. Returns how many marks changed.
   */
  snapMarks(ids, mode, q, opts) {
    const g = v => Math.round(v / q) * q;
    return this.change(\`snap \${mode}\`, d => {
      let n = 0;
      for (const e of d.elements) {
        if (!ids.includes(e.id) || !e.points.length) continue;
        if (mode === 'topleft' || mode === 'center') {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const [x, y] of e.points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
          const [ax, ay] = mode === 'center' ? [(x0 + x1) / 2, (y0 + y1) / 2] : [x0, y0];
          const dx = g(ax) - ax, dy = g(ay) - ay;
          e.points = e.points.map(([x, y, t, p]) => [x + dx, y + dy, t, p]);
        } else {
          let pts = e.points.map(([x, y, t, p]) => [g(x), g(y), t, p]);
          if (mode === 'tidy') {
            pts = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
            if (e.closed && pts.length > 1 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts = pts.slice(0, -1);
            // Drop points on a straight run (collinear with both neighbours, going the same way).
            pts = pts.filter((p, i) => {
              if (i === 0 || i === pts.length - 1) return !(e.closed && pts.length > 3 && collinear(pts.at(i - 1), p, pts[(i + 1) % pts.length]));
              return !collinear(pts[i - 1], p, pts[i + 1]);
            });
            if (pts.length < 2) pts = e.points.slice(0, 2).map(([x, y, t, p]) => [g(x), g(y), t, p]);
          }
          e.points = pts;
        }
        n++;
      }
      return n;
    }, opts);
  }

  // ---- boards ---------------------------------------------------------------------------
  /** Add a board ({ title, width, height, x, y, ground }); placed right of the others unless x, y given. Returns it. */
  addBoard(b = {}, opts) {
    return this.change('add board', d => {
      const width = Number(b.width) || d.artboard.width, height = Number(b.height) || d.artboard.height;
      const place = Number.isFinite(b.x) && Number.isFinite(b.y) ? { x: b.x, y: b.y, width, height } : nextBoardPlace(d, width, height);
      const board = { id: b.id && !boardsOf(d).some(x => x.id === b.id) ? String(b.id) : newBoardId(d), title: b.title || \`Board \${boardsOf(d).length + 1}\`, ...place, ground: b.ground || d.artboard.ground };
      d.boards.push(board);
      // Marks already lying inside it (from the blackboard) join it, when it was placed on purpose.
      if (b.adopt ?? (Number.isFinite(b.x) && Number.isFinite(b.y))) for (const e of d.elements) if (e.board === BLACKBOARD && boardForPoints(d, e.points) === board.id) e.board = board.id;
      return board;
    }, opts);
  }

  /** Change a board: title, ground, size, place. The main board changes the artboard (it cannot move). */
  updateBoard(id, patch, opts) {
    return this.change('board', d => {
      if (id === MAIN) {
        if ('title' in patch) d.artboard.title = patch.title;
        for (const k of ['width', 'height', 'ground', 'text', 'code', 'pseudo', 'kind']) if (k in patch) { if (patch[k] === '' || patch[k] == null || (k === 'kind' && patch[k] === 'drawing')) delete d.artboard[k]; else d.artboard[k] = patch[k]; }
        for (const k of BOARD_FLAGS) if (k in patch) { if (patch[k]) d.artboard[k] = true; else delete d.artboard[k]; }
        if ('rate' in patch) { if (rateOf(patch)) d.artboard.rate = rateOf(patch); else delete d.artboard.rate; }
        patchFx(d.artboard, patch);
        return;
      }
      const b = d.boards.find(x => x.id === id);
      if (!b) return;
      if (('x' in patch || 'y' in patch) && patch.moveMarks !== false) {
        const dx = (patch.x ?? b.x) - b.x, dy = (patch.y ?? b.y) - b.y;
        for (const e of d.elements) if (e.board === id) e.points = e.points.map(([x, y, t, p]) => [x + dx, y + dy, t, p]);
      }
      for (const k of ['title', 'ground', 'width', 'height', 'x', 'y']) if (k in patch) b[k] = patch[k];
      for (const k of BOARD_FLAGS) if (k in patch) { if (patch[k]) b[k] = true; else delete b[k]; }
      if ('rate' in patch) { if (rateOf(patch)) b.rate = rateOf(patch); else delete b.rate; }
      patchFx(b, patch);
      for (const k of ['text', 'code', 'pseudo', 'kind']) if (k in patch) { if (patch[k] === '' || patch[k] == null || (k === 'kind' && patch[k] === 'drawing')) delete b[k]; else b[k] = String(patch[k]); }
      // A p5 board is its sketch's canvas: resized, the sketch's createCanvas(w, h) follows.
      if (b.kind === 'p5' && b.code && ('width' in patch || 'height' in patch)) b.code = b.code.replace(/createCanvas\\(\\s*\\d+\\s*,\\s*\\d+/, \`createCanvas(\${Math.round(b.width)}, \${Math.round(b.height)}\`);
    }, opts);
  }

  /** Remove a board: its marks go to the blackboard, or are deleted with it. */
  removeBoard(id, { deleteMarks = false } = {}, opts) {
    if (id === MAIN) return;
    return this.change('remove board', d => {
      d.boards = d.boards.filter(b => b.id !== id);
      if (deleteMarks) d.elements = d.elements.filter(e => e.board !== id);
      else for (const e of d.elements) if (e.board === id) e.board = BLACKBOARD;
      if (d.train === id) delete d.train;
    }, opts);
  }

  /** Move a board in the sequence (the main board stays first). */
  moveBoard(id, delta, opts) {
    return this.change('reorder boards', d => {
      const i = d.boards.findIndex(b => b.id === id), j = i + delta;
      if (i < 0 || j < 0 || j >= d.boards.length) return;
      const [b] = d.boards.splice(i, 1); d.boards.splice(j, 0, b);
    }, opts);
  }

  /** Put a board at a place in the sequence (0 = right after the main board). */
  placeBoard(id, index, opts) {
    return this.change('reorder boards', d => {
      const i = d.boards.findIndex(b => b.id === id);
      if (i < 0) return;
      const [b] = d.boards.splice(i, 1);
      d.boards.splice(Math.max(0, Math.min(d.boards.length, index)), 0, b);
    }, opts);
  }

  /** Put marks on a board (MAIN, an id, or BLACKBOARD). */
  assignBoard(ids, id, opts) {
    return this.change('move to board', d => { for (const e of d.elements) if (ids.includes(e.id)) { if (!id || id === MAIN) delete e.board; else e.board = id; } }, opts);
  }

  /**
   * Run a board's own code: its score runs with the board as its artboard (fractions of the board),
   * and the marks it makes replace the ones its last run made. The code is kept on the board.
   * One undo step. Returns { error, line, logs, marks }.
   */
  runBoardCode(id, source, run, opts) {
    const b = boardsOf(this.doc).find(x => x.id === id);
    if (!b) return { error: 'No such board' };
    const res = run(source, { base: { ...createDocument({ width: b.width, height: b.height, ground: b.ground }), stages: [] }, by: { kind: 'code', name: b.id }, origin: { x: b.x, y: b.y }, ...(opts?.seed !== undefined ? { seed: opts.seed } : {}), ...(opts?.fresh ? { fresh: true } : {}) });
    if (res.error) return { error: res.error, line: res.errorLine, logs: res.logs };
    if (opts?.transient) this.lastLiveBoard = id;
    this.change(opts?.transient ? 'live board code' : 'board code', d => {
      const mine = e => e.by?.kind === 'code' && e.by?.name === id;
      d.elements = d.elements.filter(e => !mine(e));
      d.decisions = d.decisions.filter(x => !(x.by?.kind === 'code' && x.by?.name === id));
      Object.assign(d.brushes, res.doc.brushes || {});
      Object.assign(d.lines, res.doc.lines || {});
      const stageId = new Map();
      for (const s of res.doc.stages) {
        let t = d.stages.find(x => x.name === s.name);
        if (!t) { t = { ...s, id: newId('stage') }; d.stages.push(t); }
        stageId.set(s.id, t.id);
      }
      const onBoard = id === MAIN ? undefined : id;
      for (const e of res.doc.elements) d.elements.push({ ...e, id: newId(e.role), stage: stageId.get(e.stage) || d.stages[0].id, by: { kind: 'code', name: id }, ...(onBoard ? { board: onBoard } : {}), points: e.points.map(([x, y, t, p]) => [x + b.x, y + b.y, t, p]) });
      for (const x of res.doc.decisions) d.decisions.push({ ...x, id: newId('dec'), stage: stageId.get(x.stage) || d.stages[0].id, by: { kind: 'code', name: id } });
      if (id === MAIN) d.artboard.code = source; else d.boards.find(x => x.id === id).code = source;
      // underlay(…) in the code sets the board's source underneath (a reference, not part of the picture); mask(…) its mask.
      const u = res.underlay, t = id === MAIN ? d.artboard : d.boards.find(x => x.id === id);
      if (t && res.mask !== undefined) {
        if (res.mask && typeof res.mask === 'object') patchFx(t, { maskWith: res.mask });
        else if (res.mask) t.mask = true;
        else { delete t.mask; delete t.maskWith; }
      }
      if (t && res.fx !== undefined) patchFx(t, { fx: res.fx });
      if (t && u && Array.isArray(u.fx)) patchFx(t, { sourceFx: u.fx });
      if (u && t) {
        if (u.source === null) { delete t.source; delete t.sourceOpacity; delete t.sourceFit; delete t.sourceBlend; }
        else {
          if (u.source) t.source = String(u.source);
          if (t.source) {
            if (u.opacity !== undefined) t.sourceOpacity = Math.max(0, Math.min(1, Number(u.opacity) || 0));
            else t.sourceOpacity ??= 0.5;
            if (u.blend !== undefined) { if (u.blend && u.blend !== 'normal') t.sourceBlend = String(u.blend); else delete t.sourceBlend; }
            if (u.fit !== undefined) { if (u.fit === 'contain') t.sourceFit = 'contain'; else delete t.sourceFit; }
          }
        }
      }
    }, opts);
    return { error: null, logs: res.logs, marks: res.doc.elements.length };
  }

  setTrainBoard(id, opts) { return this.change('training board', d => { if (!id || id === MAIN) delete d.train; else d.train = id; }, opts); }

  addDecision(dec, opts) {
    return this.change('decision', d => { const x = { id: newId('dec'), t: Date.now(), ...dec }; d.decisions.push(x); return x; }, opts);
  }

  /** Elements in drawing order: stage order, then creation order within a stage. */
  ordered() {
    const rank = new Map(this.doc.stages.map((s, i) => [s.id, i]));
    return this.doc.elements
      .map((e, i) => [e, i])
      .sort((a, b) => (rank.get(a[0].stage) ?? 0) - (rank.get(b[0].stage) ?? 0) || a[1] - b[1])
      .map(([e]) => e);
  }
}

function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const L = Math.hypot(bx - ax, by - ay);
  let far = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    // Distance to the chord; when the ends coincide (a closed path) there is no chord: distance to the end.
    const d = L < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / L;
    if (d > far) { far = d; at = i; }
  }
  if (far <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, at + 1), eps).slice(0, -1), ...rdp(pts.slice(at), eps)];
}
`,yr=`/**
 * The walk of a path: Catmull-Rom resampling, and along it each step's place, unit normal, speed and
 * pressure. Brushes read it (k.smoothPath, k.frames); p5 exports embed this file with them.
 */

/** Catmull-Rom resampling so hand-drawn and scripted paths render smoothly. */
function smoothPath(points, closed, samplesPerSeg) {
  if (points.length < 3) return points.map(p => p.slice());
  const out = [];
  const n = points.length;
  const get = i => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    // Samples follow the span's length (about one per 3 units, 6 to 96), so few, far-apart points
    // (a simplified line) still curve smoothly; a caller can ask for a fixed number.
    const k = samplesPerSeg || Math.max(6, Math.min(96, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3)));
    for (let s = 0; s < k; s++) {
      const t = s / k, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), p1[2] + (p2[2] - p1[2]) * t, p1[3] + (p2[3] - p1[3]) * t]);
    }
  }
  if (!closed) out.push(points[n - 1].slice());
  return out;
}

/**
 * The walk of a line (after William Ngan's "Taking a line for a walk"): resampled points with
 * the unit normal and the hand's speed at each, from the recorded time (units per 16 ms frame),
 * smoothed so a line's character follows its motion rather than its jitter.
 */
function walkFrames(e, samples = 4, smoothing = 0.5) {
  const pts = smoothPath(e.points, e.closed, samples);
  let v = 0;
  return pts.map((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const prev = pts[Math.max(0, i - 1)];
    const step = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    const dt = (q[2] ?? 0) - (prev[2] ?? 0);
    const raw = i === 0 ? 0 : dt > 0.5 ? (step / dt) * 16 : step;
    v = i === 0 ? raw : v * smoothing + raw * (1 - smoothing);
    return { x: q[0], y: q[1], nx: -dy, ny: dx, speed: v, pressure: q[3] ?? 0.5 };
  });
}

export { smoothPath, walkFrames };
`,wr=`/**
 * Texture: what a brush can use to paint with grain, hairs and layers. Canvas 2D only, deterministic,
 * and written to be read and changed: a brush composes these (see the brush kit in brushes.js).
 *
 * The idea: a mark is painted white into a small layer (its own canvas, in world units), the paper's
 * grain is multiplied into the layer's alpha, the layer is tinted with the mark's color and put on the
 * picture. The grain is fixed to the paper (world coordinates), so strokes that cross share one
 * tooth, as on real paper. A layer is kept while its inputs stay the same, so a mark that only fades
 * (see envelope.js) is a cheap bitmap, not painted again on every frame.
 *
 *   txLayer(bounds, ppu)                    a layer for [x0, y0, x1, y1] (units), at ppu pixels per unit
 *   txDabs(lctx, frames, opts)              stamp a tip along a walk (spacing, size, flow, scatter, angle)
 *   txHairs(lctx, frames, opts)             bristles: parallel hairs that lift off where the paint runs dry
 *   txGrain(layer, { kind, scale, strength, seed })    multiply the paper's grain into the layer
 *   txPaint(ctx, spec)                      the whole thing: cache, draw, grain, tint, put on the picture
 */
const TX_CAP = 2048;                 // largest layer side in pixels
const TX_AREA = 250000;              // largest layer area in pixels (about 1 MB)
let TX_BUDGET = 128 * 1024 * 1024;   // bytes of layers kept
const txLayers = new Map();          // key → layer ({ …, used: when it was last drawn (ms), dead: given back })
let txBytes = 0;
let txClock = 0;                     // the moment of the frame being drawn (txBeginFrame)
let txQuality = 1;                   // 0.3..1: layers are painted at this share of the screen's pixels while the cache is short of room
let txCalm = 0;                      // frames since the cache last ran short of room
let txSweptAt = 0;
let txWait = 150;                    // calm frames before quality grows back (doubles each time the cache runs short again)

let txLost = false;                  // a canvas lost its context: what we kept is blank (see txReady)
const txStat = { hits: 0, misses: 0, paintMs: 0, evicted: 0, thrash: 0, swept: 0 };   // what the cache did (txStats)

/** What the layer cache holds and has done since txResetStats: layers, bytes, hits, misses (marks painted), ms spent painting. */
export function txStats(detail = false) {
  const out = { ...txStat, paintMs: +txStat.paintMs.toFixed(2), layers: txLayers.size, bytes: txBytes, budget: TX_BUDGET, quality: +txQuality.toFixed(2), fast: txFast.size };
  if (detail) { let inUse = 0, n = 0, px = 0; for (const l of txLayers.values()) if (txClock - l.used < 100) { inUse += l.bytes; n++; px += l.canvas.width * l.canvas.height; } out.inUseMB = +(inUse / 1048576).toFixed(1); out.inUse = n; out.avgPx = Math.round(px / Math.max(1, n)); }
  return out;
}
/** Give every kept layer back (and forget what was known about marks). */
export function txClear() {
  for (const l of txLayers.values()) { l.dead = true; txRelease(l.canvas); }
  txLayers.clear(); txFast.clear(); txBytes = 0;
}
/** Room for layers, in megabytes (default 128). */
export function txBudget(mb) { if (mb > 0) TX_BUDGET = mb * 1024 * 1024; return TX_BUDGET / 1048576; }

/**
 * A frame begins (the renderer calls this): layers drawn from now on count as in use. If the last frames ran short
 * of room (a layer that was in use had to go), layers are painted smaller, so that what is on screen fits; when
 * there has been room for a while, they grow back.
 */
export function txBeginFrame() {
  txClock = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (txStat.thrash > 0) { txQuality = Math.max(0.3, txQuality * 0.75); txStat.thrash = 0; txCalm = 0; txWait = Math.min(4800, txWait * 2); }
  else if (txQuality < 1 && ++txCalm > txWait) { txQuality = Math.min(1, txQuality * 1.25); txCalm = 0; if (txQuality >= 1) txWait = 150; }
  // Layers of marks that are long gone (their life is over) are given back every couple of seconds.
  if (txClock - txSweptAt > 2000) {
    txSweptAt = txClock;
    for (const [k, l] of txLayers) if (txClock - l.used > 20000) { txLayers.delete(k); txBytes -= l.bytes; l.dead = true; txRelease(l.canvas); txStat.swept = (txStat.swept || 0) + 1; }
  }
}

/** Make room: the layers used least recently go first (those used in the last quarter second count as thrash). */
function txEvict(target) {
  const list = [...txLayers.entries()].sort((a, b) => a[1].used - b[1].used);
  for (const [k, l] of list) {
    if (txBytes <= target) break;
    if (txClock - l.used < 250) txStat.thrash = (txStat.thrash || 0) + 1;
    txLayers.delete(k); txBytes -= l.bytes; l.dead = true; txRelease(l.canvas); txStat.evicted++;
  }
}

// ---- marks whose layer is known: a mark that has been painted once is put on the picture without asking its brush ----
const txFast = new Map();   // a mark's key → { layer, alpha }, or false (its brush paints more than one layer: ask it)
let txArmed = null;

/** The renderer is about to draw a mark with its brush: remember the layer it paints, under \`fk\`. */
export function txArm(fk) { txArmed = { fk, n: 0, entry: null }; }
export function txDisarm() {
  const a = txArmed; txArmed = null;
  if (!a) return;
  if (txFast.size > 30000) txFast.clear();
  txFast.set(a.fk, a.n === 1 ? a.entry : false);
}
/** The known layer of a mark: { layer, alpha } (ready to blit), false (ask the brush), or null (not seen yet). */
export function txKnown(fk) {
  const e = txFast.get(fk);
  if (e === undefined) return null;
  if (e === false) return false;
  if (e.layer.dead) { txFast.delete(fk); return null; }
  e.layer.used = txClock;
  return e;
}
/** Put a known layer on the picture (alpha: on top of the brush's own). */
export function txBlit(ctx, e, alpha = 1) {
  const l = e.layer, g = ctx.globalAlpha;
  ctx.globalAlpha = g * e.alpha * alpha;
  ctx.drawImage(l.canvas, l.x, l.y, l.w, l.h);
  ctx.globalAlpha = g;
}

export function txResetStats() { for (const k in txStat) txStat[k] = 0; }

function txCanvas(w, h) {
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : null;
  if (!c) return null;   // no canvas here (a test, a worker without one): a textured mark is simply not drawn
  c.width = Math.max(1, w); c.height = Math.max(1, h);
  c.addEventListener?.('contextlost', () => { txLost = true; });
  return c;
}

/** Give a canvas's memory back now (the browser would wait for a collection). */
function txRelease(c) { if (c) { c.width = 0; c.height = 0; } }

/**
 * Browsers take every canvas's contents away at times (memory pressure, a hidden window, a graphics reset):
 * what we kept, layers and grain tiles and tips, is then blank, and a blank grain tile wipes a whole mark.
 * After a loss nothing is painted until canvases work again; then everything kept is dropped and painted anew.
 */
function txReady() {
  if (!txLost) return true;
  const probe = txCanvas(2, 2), x = probe?.getContext('2d');
  if (!x || x.isContextLost?.()) return false;
  for (const l of txLayers.values()) { l.dead = true; txRelease(l.canvas); }
  txLayers.clear(); txFast.clear(); txBytes = 0; txSprites.clear(); txGrainTiles.clear();
  txLost = false;
  return true;
}

/** Pixels per unit for a view scale: about what the screen needs, in half-octave steps so zooming reuses layers. */
let txPpuFor = { scale: 0, q: 0, dpr: 0, ppu: 1 };
export function txPpu(scale) {
  const dpr = globalThis.devicePixelRatio || 1;
  if (txPpuFor.scale === scale && txPpuFor.q === txQuality && txPpuFor.dpr === dpr) return txPpuFor.ppu;
  const raw = Math.max(0.25, Math.min(4, (scale || 1) * dpr * txQuality));
  const ppu = Math.pow(2, Math.round(Math.log2(raw) * 2) / 2);
  txPpuFor = { scale, q: txQuality, dpr, ppu };
  return ppu;
}

/** A small stable key for numbers (points, parameters) that does not care about float dust. */
export function txHash(...parts) {
  let s = '';
  for (const p of parts) {
    if (Array.isArray(p)) { for (const q of p) s += Array.isArray(q) ? \`\${Math.round(q[0] * 4)},\${Math.round(q[1] * 4)}\${q.length > 3 ? \`,\${Math.round(q[3] * 20)}\` : ''};\` : \`\${q};\`; }
    else if (p && typeof p === 'object') {
      // (plain parameters, the usual case, without JSON)
      let t = '{', plain = true;
      for (const k in p) { const v = p[k]; if (v !== null && typeof v === 'object') { plain = false; break; } t += \`\${k}:\${v},\`; }
      s += plain ? \`\${t}}\` : JSON.stringify(p);
    }
    else s += \`\${p}|\`;
  }
  return s;
}

/** A blank layer over [x0, y0, x1, y1] (units): drawn in units with lctx, kept as a canvas of ppu pixels a unit. */
export function txLayer(bounds, ppu) {
  let [x0, y0, x1, y1] = bounds;
  let w = Math.ceil((x1 - x0) * ppu), h = Math.ceil((y1 - y0) * ppu);
  // Not larger than a side of TX_CAP pixels or an area of TX_AREA: a broad soft stroke does not need every pixel of the screen.
  const k = Math.min(1, TX_CAP / Math.max(w, h), Math.sqrt(TX_AREA / Math.max(1, w * h)));
  if (k < 1) { ppu *= k; w = Math.ceil((x1 - x0) * ppu); h = Math.ceil((y1 - y0) * ppu); }
  const canvas = txCanvas(w, h), lctx = canvas?.getContext('2d');
  if (!lctx) return null;
  lctx.setTransform(ppu, 0, 0, ppu, -x0 * ppu, -y0 * ppu);
  return { canvas, lctx, x: x0, y: y0, w: (x1 - x0), h: (y1 - y0), ppu, px: [canvas.width, canvas.height] };
}

// ---- noise and grain --------------------------------------------------------------------------------

function txRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Periodic value noise on a lattice (so a tile repeats without seams): 0..1. */
function txNoiseField(size, cells, seed) {
  const r = txRng(seed), lat = new Float32Array(cells * cells);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const out = new Float32Array(size * size), step = cells / size;
  for (let y = 0; y < size; y++) {
    const fy = y * step, j = Math.floor(fy), v = fy - j, sv = v * v * (3 - 2 * v);
    for (let x = 0; x < size; x++) {
      const fx = x * step, i = Math.floor(fx), u = fx - i, su = u * u * (3 - 2 * u);
      const a = lat[j % cells * cells + i % cells], b = lat[j % cells * cells + (i + 1) % cells], c = lat[(j + 1) % cells * cells + i % cells], d = lat[(j + 1) % cells * cells + (i + 1) % cells];
      out[y * size + x] = a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
    }
  }
  return out;
}

const txGrainTiles = new Map();
const TX_TILE = 128;

/**
 * A grain tile: alpha 255 lets paint through, less holds it back. kinds:
 *   paper   the tooth of drawing paper: small pits everywhere, coarser hollows
 *   canvas  a weave
 *   fibre   streaks in one direction (a rough brush, wood)
 *   noise   soft mottling
 * strength 0 (no grain) .. 1 (paint only stays on the tops).
 */
function txGrainTile(kind, seed, strength) {
  const key = \`\${kind}|\${seed}|\${Math.round(strength * 20)}\`;
  let tile = txGrainTiles.get(key);
  if (tile) return tile;
  const s = Math.round(strength * 20) / 20, size = TX_TILE;
  const fine = txNoiseField(size, 32, seed * 7 + 1), mid = txNoiseField(size, 16, seed * 7 + 2), coarse = txNoiseField(size, 8, seed * 7 + 3);
  const streak = kind === 'fibre' ? txNoiseField(size, 4, seed * 7 + 4) : null;
  tile = txCanvas(size, size);
  const ctx = tile.getContext('2d'), img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    let v;   // 0 (pit) .. 1 (top)
    if (kind === 'canvas') {
      const wx = Math.abs(Math.sin(x / size * Math.PI * 8)), wy = Math.abs(Math.sin(y / size * Math.PI * 8));
      v = 0.2 * (wx + wy) + 0.8 * (0.55 * fine[i] + 0.45 * mid[i]);   // a weave under a lot of tooth: not a grid
    } else if (kind === 'fibre') {
      // Noise stretched along x: sample the coarse field on a few rows only.
      v = 0.6 * streak[(Math.floor(y / 2) % size) * size + x] + 0.4 * fine[i];
    } else if (kind === 'noise') v = 0.5 * mid[i] + 0.5 * coarse[i];
    else v = 0.5 * fine[i] + 0.3 * mid[i] + 0.2 * coarse[i];   // paper
    const t = Math.min(1, Math.max(0, (v - 0.3) / 0.45));
    const top = t * t * (3 - 2 * t);
    img.data[i * 4 + 3] = Math.round(255 * (1 - s * (1 - top)));
  }
  ctx.putImageData(img, 0, 0);
  txGrainTiles.set(key, tile);
  return tile;
}

/** Multiply the paper's grain into a layer's alpha: { kind, scale (units a texel), strength, seed }. */
export function txGrain(layer, { kind = 'paper', scale = 0.6, strength = 0.5, seed = 1 } = {}) {
  if (!(strength > 0)) return;
  const { lctx, ppu, x, y, canvas } = layer;
  const pat = lctx.createPattern(txGrainTile(kind, seed, strength), 'repeat');
  if (!pat) return;
  // Fixed to the paper: the texel grid starts at world (0, 0), whichever layer this is.
  const m = new DOMMatrix().translate(-x * ppu, -y * ppu).scale(scale * ppu);
  pat.setTransform?.(m);
  lctx.save();
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'destination-in';
  lctx.fillStyle = pat;
  lctx.fillRect(0, 0, canvas.width, canvas.height);
  lctx.restore();
}

// ---- tips and walks -----------------------------------------------------------------------------------

const txSprites = new Map();
/** A soft round dab, white, at hardness 0 (a haze) .. 1 (a hard disc), as a sprite to scale. */
function txSoftSprite(hardness) {
  const h = Math.round(hardness * 10) / 10;
  let sp = txSprites.get(h);
  if (sp) return sp;
  sp = txCanvas(64, 64);
  const c = sp.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(Math.max(0.01, Math.min(0.99, h)), 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  txSprites.set(h, sp);
  return sp;
}

/**
 * Stamp a tip along a walk (frames from the kit: x, y, nx, ny, speed, pressure).
 *   tip       'soft' (round, hardness), 'flat' (a chisel: aspect, angle) or 'square'
 *   size      diameter (units), or (frame) => diameter
 *   flow      the alpha of each dab, or (frame) => alpha (dabs overlap and build up)
 *   spacing   distance between dabs, in diameters (0.05 dense .. 1 a string of beads)
 *   scatter   random drift across the walk, in diameters
 *   hardness  of a soft tip;  aspect, angle  of a flat tip (angle: 'follow' across the walk, 'along' with it, or radians)
 *   rng       the mark's seeded random
 */
export function txDabs(lctx, frames, { tip = 'soft', size = 10, flow = 0.5, spacing = 0.12, scatter = 0, hardness = 0.5, aspect = 0.3, angle = 'follow', rng = Math.random } = {}) {
  if (!frames.length) return;
  const sizeAt = f => (typeof size === 'function' ? size(f) : size), flowAt = f => (typeof flow === 'function' ? flow(f) : flow);
  const dab = (x, y, f) => {
    const d = Math.max(0.1, sizeAt(f)), a = Math.max(0, Math.min(1, flowAt(f)));
    if (a <= 0.002) return;
    let px = x, py = y;
    if (scatter) { const j = (rng() - 0.5) * scatter * d; px += f.nx * j; py += f.ny * j; }
    lctx.globalAlpha = a;
    if (tip === 'soft') { lctx.drawImage(txSoftSprite(hardness), px - d / 2, py - d / 2, d, d); return; }
    lctx.save();
    lctx.translate(px, py);
    // 'follow': the flat side across the walk; 'along': with it; or an angle (radians).
    const dir = Math.atan2(-f.nx, f.ny);
    lctx.rotate(angle === 'follow' ? dir + Math.PI / 2 : angle === 'along' ? dir : angle);
    lctx.fillStyle = '#fff';
    if (tip === 'flat') lctx.fillRect(-d / 2, -d * aspect / 2, d, d * aspect);
    else lctx.fillRect(-d / 2, -d / 2, d, d);
    lctx.restore();
  };
  lctx.save();
  let carry = 0, last = frames[0];
  dab(last.x, last.y, last);
  for (let i = 1; i < frames.length; i++) {
    const f = frames[i];
    let dx = f.x - last.x, dy = f.y - last.y, dist = Math.hypot(dx, dy);
    while (dist > 1e-6) {
      const step = Math.max(0.15, sizeAt(f) * spacing);
      if (carry + dist < step) { carry += dist; last = { ...f, x: f.x, y: f.y }; dist = 0; break; }
      const u = (step - carry) / dist;
      last = { ...f, x: last.x + dx * u, y: last.y + dy * u };
      dab(last.x, last.y, last);
      dx = f.x - last.x; dy = f.y - last.y; dist = Math.hypot(dx, dy); carry = 0;
    }
  }
  lctx.restore();
}

/**
 * Bristles: \`count\` parallel hairs across \`width\` (units), each its own thin line along the walk,
 * with its own thickness and strength. The paint runs down along the stroke (faster with \`dry\`, and
 * with speed): hairs lift off one after another and leave gaps: the dry-brush look.
 *   width  across the whole brush, or (frame, u) => width (u: 0..1 along the walk; pressure spreads the bristles)
 *   trim   0..1: each hair may start late and end early, by up to this share of the walk (ragged ends)
 *   streaks  0..1: how much the hairs differ in the paint they carry (0 an even body of paint)
 *   dry    0 (loaded, unbroken) .. 1 (nearly dry)
 */
export function txHairs(lctx, frames, { count = 24, width = 20, thickness = 1.2, dry = 0.35, flow = 0.85, trim = 0, streaks = 0.55, rng = Math.random } = {}) {
  if (frames.length < 2) return;
  const widthAt = (f, i) => (typeof width === 'function' ? width(f, i / Math.max(1, frames.length - 1)) : width);
  lctx.save();
  lctx.lineCap = 'round'; lctx.lineJoin = 'round'; lctx.strokeStyle = '#fff';
  const phases = [];
  for (let h = 0; h < count; h++) phases.push({ off: count === 1 ? 0 : h / (count - 1) - 0.5 + (rng() - 0.5) * 0.5 / count, th: thickness * (0.5 + rng()), a: flow * (1 - streaks * rng()), ph: rng() * 1000, fq: 0.015 + rng() * 0.04, need: rng(), from: rng() * trim, to: 1 - rng() * trim });
  // Arc length along the walk: the paint on the brush runs down along it.
  const len = [0];
  for (let i = 1; i < frames.length; i++) len.push(len[i - 1] + Math.hypot(frames[i].x - frames[i - 1].x, frames[i].y - frames[i - 1].y));
  const total = Math.max(1e-6, len[len.length - 1]);
  for (const hr of phases) {
    let drawing = false;
    lctx.globalAlpha = hr.a; lctx.lineWidth = hr.th;
    lctx.beginPath();
    frames.forEach((f, i) => {
      // The load falls along the stroke and with speed; each hair needs its own amount to hold paint, so the
      // hairs drop out one after another (a little wavering keeps the breaks uneven).
      const paint = 1 - dry * (0.3 + 0.7 * len[i] / total) - dry * Math.min(0.35, f.speed * 0.008);
      const holds = paint + 0.3 * (Math.sin(hr.ph + len[i] * hr.fq) * 0.5) > hr.need * 0.9 && len[i] >= hr.from * total && len[i] <= hr.to * total;
      const o = hr.off * widthAt(f, i), x = f.x + f.nx * o, y = f.y + f.ny * o;
      if (holds) { drawing ? lctx.lineTo(x, y) : lctx.moveTo(x, y); drawing = true; }
      else drawing = false;
    });
    lctx.stroke();
  }
  lctx.restore();
}

/** Bounds of a walk grown by \`pad\`: [x0, y0, x1, y1]. */
export function txBounds(frames, pad) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of frames) { x0 = Math.min(x0, f.x); y0 = Math.min(y0, f.y); x1 = Math.max(x1, f.x); y1 = Math.max(y1, f.y); }
  return [Math.floor(x0 - pad), Math.floor(y0 - pad), Math.ceil(x1 + pad), Math.ceil(y1 + pad)];
}

// ---- washes ---------------------------------------------------------------------------------------------

/**
 * A wash: a closed shape whose pigment gathers at its edge and is grainy inside (a layer's alpha).
 *   edge    how much darker the rim is than the middle (0 flat .. 1 strong), rimWidth in units
 *   rough   how much the edge wanders (units)
 */
export function txWash(layer, poly, { edge = 0.5, rimWidth = 4, rough = 1.5, base = 0.6, seed = 1 } = {}) {
  const { lctx, ppu } = layer, r = txRng(seed);
  // The outline, wandering a little (a wet edge is never a straight one).
  const ring = poly.map(([x, y], i) => { const ph = r() * 6.28; return [x + Math.cos(ph + i) * rough * r(), y + Math.sin(ph + i * 1.3) * rough * r()]; });
  const path = c => { c.beginPath(); ring.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  lctx.save();
  lctx.fillStyle = '#fff';
  lctx.globalAlpha = base; path(lctx); lctx.fill();
  const canBlur = 'filter' in lctx;
  if (edge > 0 && canBlur) {
    // The rim: the shape minus a blurred copy of itself (the blur is weakest at the edge).
    const a = txCanvas(layer.canvas.width, layer.canvas.height), ac = a.getContext('2d');
    ac.setTransform(ppu, 0, 0, ppu, -layer.x * ppu, -layer.y * ppu); ac.fillStyle = '#fff'; path(ac); ac.fill();
    const b = txCanvas(a.width, a.height), bc = b.getContext('2d');
    bc.filter = \`blur(\${Math.max(0.5, rimWidth * ppu)}px)\`; bc.drawImage(a, 0, 0);
    ac.setTransform(1, 0, 0, 1, 0, 0); ac.globalCompositeOperation = 'destination-out'; ac.drawImage(b, 0, 0);
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalAlpha = Math.min(1, edge * 1.6); lctx.drawImage(a, 0, 0); lctx.drawImage(a, 0, 0);   // twice: the rim reads through the grain
    txRelease(a); txRelease(b);
  } else if (edge > 0) {
    lctx.globalAlpha = edge * 0.7; lctx.strokeStyle = '#fff'; lctx.lineWidth = rimWidth * 0.6; path(lctx); lctx.stroke();
  }
  lctx.restore();
}

// ---- putting it together ----------------------------------------------------------------------------------

/**
 * Paint one mark through a layer.
 *   ctx        the picture's context (units)
 *   spec       { key, bounds, draw(lctx, layer), grain, color, alpha, ppu, scale }
 *              key: what the layer depends on (points, parameters, seed): the same key reuses the layer
 *              draw(lctx, layer): paint white into the layer, in units
 *              grain: { kind, scale, strength, seed } or null;  color, alpha: how it lands on the picture
 */
export function txPaint(ctx, { key, bounds, draw, grain = null, color = '#1d1b19', alpha = 1, scale = 1 }) {
  if (!txReady()) return;
  const ppu = txPpu(scale), full = \`\${key}|\${color}|\${ppu}|\${txHash(grain)}\`;
  let layer = txLayers.get(full);
  if (layer) txStat.hits++;
  else {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    txStat.misses++;
    layer = txLayer(bounds, ppu);
    if (!layer) return;
    layer.lctx.save(); draw(layer.lctx, layer); layer.lctx.restore();
    if (grain) txGrain(layer, grain);
    // Tint: the white layer takes the mark's color, keeping its alpha.
    layer.lctx.save();
    layer.lctx.setTransform(1, 0, 0, 1, 0, 0);
    layer.lctx.globalCompositeOperation = 'source-in';
    layer.lctx.fillStyle = color;
    layer.lctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.lctx.restore();
    layer.bytes = layer.canvas.width * layer.canvas.height * 4;
    txLayers.set(full, layer); txBytes += layer.bytes;
    if (txBytes > TX_BUDGET) txEvict(TX_BUDGET * 0.8);
    if (t0) txStat.paintMs += performance.now() - t0;
  }
  layer.used = txClock;
  if (txArmed) { txArmed.n++; txArmed.entry = { layer, alpha }; }
  const g = ctx.globalAlpha;
  ctx.globalAlpha = g * alpha;
  ctx.drawImage(layer.canvas, layer.x, layer.y, layer.w, layer.h);
  ctx.globalAlpha = g;
}
`,cc=`/**
 * Brushes: how a path becomes marks.
 *
 * Every brush is an honest, small algorithm with explicit, bounded parameters.
 * They realize decisions; they do not make them (no composition, no color choices
 * beyond what the element asks for). Each parameter carries a range and a one-line
 * meaning, so the same schema drives UI controls, MCP tools and model outputs.
 *
 * draw(ctx, element, params, env): ctx is in artboard units.
 * env: { rng, scale (screen px per artboard unit), overlay (drawing construction), board (the mark's board rect) }
 */
import { getSource } from './streams.js';
import { smoothPath, walkFrames } from './walk.js';
import { txPaint, txDabs, txHairs, txWash, txBounds, txHash, txLayer, txGrain } from './texture.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INK = '#1d1b19';
const param = (key, label, min, max, step, def, doc) => ({ key, label, min, max, step, default: def, doc });

function tracePath(ctx, pts, closed) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed) ctx.closePath();
}

/** Scanline intersections of a polygon with horizontal line y (for hatching and stippling). */
function spans(poly, y) {
  const xs = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y)) xs.push(xi + ((y - yi) / (yj - yi)) * (xj - xi));
  }
  return xs.sort((a, b) => a - b);
}

function rotatePts(pts, a, cx, cy) {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}


function strokeSegment(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

const lineParams = (width, opacity = 1) => [param('width', 'Width', 0.25, 20, 0.25, width, 'Stroke width.'), param('opacity', 'Opacity', 0, 1, 0.05, opacity, 'Paint opacity.')];
const speedParams = (gain, max) => [param('gain', 'Speed gain', 0, 6, 0.05, gain, 'How much the hand\\'s speed changes the mark.'), param('max', 'Max', 1, 200, 1, max, 'The largest mark, in artboard units.')];
const beginInk = (ctx, e, p) => { ctx.save(); ctx.globalAlpha *= p.opacity; ctx.strokeStyle = e.color || INK; ctx.fillStyle = e.color || INK; ctx.lineWidth = p.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };

export const BRUSHES = {
  image: {
    label: 'Image', roles: ['image'], doc: 'A placed picture, drawn through its four corners (so it moves, scales and rotates like any mark).',
    params: [param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Opacity of the picture.')],
    draw(ctx, e, p, k) {
      const [a, b, , d] = e.points;
      if (!a || !b || !d) return;
      const im = k.image(e.src);
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      // The unit square mapped onto the corners: top-left a, top-right b, bottom-left d.
      ctx.transform(b[0] - a[0], b[1] - a[1], d[0] - a[0], d[1] - a[1], a[0], a[1]);
      if (im) ctx.drawImage(im, 0, 0, 1, 1);
      else { ctx.fillStyle = 'rgba(128,128,128,0.15)'; ctx.fillRect(0, 0, 1, 1); }
      ctx.restore();
    }
  },

  none: {
    label: 'None', roles: ['note'], doc: 'Not drawn in the picture.',
    params: [],
    draw() {}
  },

  guide: {
    label: 'Guide', roles: ['guide', 'gesture', 'line', 'plane'], doc: 'Construction line: shown as an overlay, left out of the finished picture.',
    construction: true,
    params: [param('dash', 'Dash', 0, 40, 1, 8, 'Dash length in artboard units (0 = solid).')],
    draw(ctx, e, p, k) {
      const pts = k.smoothPath(e.points, e.closed);
      ctx.save();
      ctx.strokeStyle = e.color || (e.role === 'gesture' ? '#d9480f' : '#2f6fdd');
      ctx.globalAlpha *= 0.7;
      ctx.lineWidth = 1.25 / k.scale;
      if (p.dash > 0) ctx.setLineDash([p.dash, p.dash * 0.7]);
      k.tracePath(ctx, pts, e.closed);
      ctx.stroke();
      ctx.restore();
    }
  },

  dot: {
    label: 'Dot', roles: ['point'], doc: 'A round mark; its weight is its size.',
    params: [
      param('size', 'Size', 1, 200, 1, 12, 'Diameter in artboard units.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.fillStyle = e.color || k.INK;
      for (const [x, y] of e.points) { ctx.beginPath(); ctx.arc(x, y, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  },

  ink: {
    label: 'Ink', roles: ['line', 'gesture', 'plane', 'guide'], doc: 'A pen line whose width follows pressure and tapers at the ends.',
    params: [
      param('width', 'Width', 0.5, 60, 0.5, 4, 'Base width in artboard units.'),
      param('pressure', 'Pressure', 0, 1, 0.05, 0.7, 'How much pressure changes the width (0 = constant).'),
      param('taper', 'Taper', 0, 1, 0.05, 0.3, 'Fraction of the length over which the ends thin out.'),
      param('wobble', 'Wobble', 0, 1, 0.05, 0, 'Seeded hand tremor, in widths.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const pts = k.smoothPath(e.points, e.closed);
      if (pts.length < 2) return k.draw('dot', ctx, e, { size: p.width, opacity: p.opacity });
      // Arc length for taper.
      const len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const total = len[len.length - 1] || 1;
      // Pressure sets the width, averaged along the line over about 1.5 widths: a mouse's jittery
      // pressure (it comes from speed) swells gently instead of beading like a sausage. The taper at
      // the ends is applied after, so ends stay sharp.
      const press = pts.map(q => 1 - p.pressure + p.pressure * (q[3] ?? 0.5) * 2);
      const reach = Math.max(1, p.width * 1.5), sm = new Array(pts.length);
      for (let i = 0, a = 0, b = 0, sum = 0; i < pts.length; i++) {
        while (b < pts.length && len[b] <= len[i] + reach) sum += press[b++];
        while (len[a] < len[i] - reach) sum -= press[a++];
        sm[i] = sum / (b - a);
      }
      const half = pts.map((q, i) => {
        const u = len[i] / total;
        const taper = p.taper > 0 && !e.closed ? Math.min(1, Math.min(u, 1 - u) / (p.taper / 2)) : 1;
        return Math.max(0.15, p.width * 0.5 * sm[i] * (0.35 + 0.65 * taper));
      });
      // Round joins: every segment is its own quad (its own direction), every point a disc; one
      // fill of all of them (same winding), so thick turns stay round and nothing overlaps darker.
      const r = pts.map((q, i) => Math.max(0.1, half[i] + (p.wobble ? (k.rng() - 0.5) * p.wobble * p.width : 0)));
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.fillStyle = e.color || k.INK;
      ctx.beginPath();
      const segs = e.closed ? pts.length : pts.length - 1;
      for (let i = 0; i < segs; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], ra = r[i], rb = r[(i + 1) % pts.length];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const d = Math.hypot(dx, dy);
        if (d < 1e-6) continue;
        dx /= d; dy /= d;
        const quad = [[a[0] - dy * ra, a[1] + dx * ra], [b[0] - dy * rb, b[1] + dx * rb], [b[0] + dy * rb, b[1] - dx * rb], [a[0] + dy * ra, a[1] - dx * ra]];
        let area = 0;
        for (let j = 0; j < 4; j++) { const [x1, y1] = quad[j], [x2, y2] = quad[(j + 1) % 4]; area += x1 * y2 - x2 * y1; }
        if (area < 0) quad.reverse();
        quad.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
      }
      for (let i = 0; i < pts.length; i++) { ctx.moveTo(pts[i][0] + r[i], pts[i][1]); ctx.arc(pts[i][0], pts[i][1], r[i], 0, Math.PI * 2); }
      ctx.fill('nonzero');
      ctx.restore();
    }
  },


  pen: {
    label: 'Pen', roles: ['line', 'gesture', 'plane', 'guide'], doc: 'A line of one width everywhere, with round ends and joins: pressure and speed do not change it.',
    params: [
      param('width', 'Width', 0.25, 60, 0.25, 3, 'Stroke width in artboard units.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const pts = k.smoothPath(e.points, e.closed);
      if (pts.length < 2) return k.draw('dot', ctx, e, { size: p.width, opacity: p.opacity });
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.strokeStyle = e.color || k.INK;
      ctx.lineWidth = p.width;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      k.tracePath(ctx, pts, e.closed);
      ctx.stroke();
      ctx.restore();
    }
  },

  speed: {
    label: 'Speed lines', roles: ['line', 'gesture'], doc: 'After Ngan: short lines across the walk, as long as the hand was fast. Slow passages stay thin and dense.',
    params: [...speedParams(1.2, 60), param('every', 'Every', 1, 12, 1, 1, 'Draw one mark every n samples.'), ...lineParams(0.75)],
    draw(ctx, e, p, k) {
      k.beginInk(ctx, e, p);
      k.frames(e).forEach((f, i) => {
        if (i % p.every) return;
        const L = Math.min(p.max, 0.5 + f.speed * p.gain) / 2;
        k.segment(ctx, f.x - f.nx * L, f.y - f.ny * L, f.x + f.nx * L, f.y + f.ny * L);
      });
      ctx.restore();
    }
  },
  restate: {
    label: 'Restated line', roles: ['line', 'gesture'], doc: 'After Ngan and the life-drawing habit of restating: the walk drawn several times, the passes drifting apart where the hand was fast.',
    params: [param('times', 'Times', 1, 12, 1, 4, 'How many passes.'), param('spread', 'Spread', 0, 40, 0.5, 6, 'How far the passes drift, per unit of speed.'), ...lineParams(0.8, 0.6)],
    draw(ctx, e, p, k) {
      k.beginInk(ctx, e, p);
      const fr = k.frames(e);
      for (let kk = 0; kk < p.times; kk++) {
        const phase = k.rng() * Math.PI * 2, freq = 0.02 + k.rng() * 0.05;
        ctx.beginPath();
        fr.forEach((f, i) => {
          const o = Math.sin(phase + i * freq * 6) * p.spread * (0.3 + Math.min(3, f.speed / 8)) * (kk ? 1 : 0.2);
          const x = f.x + f.nx * o, y = f.y + f.ny * o;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  zigzag: {
    label: 'Zigzag', roles: ['line', 'gesture'], doc: 'After Ngan: the walk as a zigzag whose amplitude follows the speed. The rhythm of the hand made visible.',
    params: [...speedParams(1, 50), param('every', 'Every', 1, 12, 1, 2, 'Samples per zig.'), ...lineParams(1)],
    draw(ctx, e, p, k) {
      k.beginInk(ctx, e, p);
      ctx.beginPath();
      let n = 0;
      k.frames(e).forEach((f, i) => {
        if (i % p.every) return;
        const L = Math.min(p.max, 1 + f.speed * p.gain) / 2 * (n++ % 2 ? 1 : -1);
        n === 1 ? ctx.moveTo(f.x + f.nx * L, f.y + f.ny * L) : ctx.lineTo(f.x + f.nx * L, f.y + f.ny * L);
      });
      ctx.stroke();
      ctx.restore();
    }
  },
  inner: {
    label: 'Inner lines', roles: ['line', 'gesture'], doc: 'After Ngan: parallel lines inside the walk that open where the hand speeds up and close where it slows. A line becoming a plane.',
    params: [param('lines', 'Lines', 2, 16, 1, 5, 'How many parallel lines.'), ...speedParams(1.5, 80), ...lineParams(0.6)],
    draw(ctx, e, p, k) {
      k.beginInk(ctx, e, p);
      const fr = k.frames(e, 4, 0.8);
      for (let kk = 0; kk < p.lines; kk++) {
        const u = p.lines === 1 ? 0 : kk / (p.lines - 1) - 0.5;
        ctx.beginPath();
        fr.forEach((f, i) => {
          const o = u * Math.min(p.max, 1 + f.speed * p.gain);
          const x = f.x + f.nx * o, y = f.y + f.ny * o;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  dotted: {
    label: 'Dotted walk', roles: ['line', 'gesture'], doc: 'After Ngan: a line of points. Where the hand lingered the dots swell, like ink pooling; fast passages leave specks.',
    params: [param('spacing', 'Spacing', 2, 60, 1, 10, 'Distance between dots.'), param('size', 'Size', 0.5, 30, 0.5, 6, 'Largest dot.'), param('gain', 'Speed gain', 0, 3, 0.05, 0.6, 'How strongly speed shrinks the dots.'), param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')],
    draw(ctx, e, p, k) {
      ctx.save(); ctx.globalAlpha *= p.opacity; ctx.fillStyle = e.color || k.INK;
      let acc = p.spacing, px = null, py = null;
      for (const f of k.frames(e)) {
        if (px !== null) acc += Math.hypot(f.x - px, f.y - py);
        px = f.x; py = f.y;
        if (acc < p.spacing) continue;
        acc = 0;
        const r = Math.max(0.3, p.size / (1 + f.speed * p.gain * 0.2)) / 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  },
  arcs: {
    label: 'Arcs', roles: ['line', 'gesture'], doc: 'After Ngan: small arcs swung from the walk, their radius from the speed. The line as a sequence of gestures.',
    params: [...speedParams(0.8, 60), param('every', 'Every', 1, 24, 1, 4, 'One arc every n samples.'), param('sweep', 'Sweep', 10, 360, 5, 140, 'Arc angle in degrees.'), ...lineParams(0.6)],
    draw(ctx, e, p, k) {
      k.beginInk(ctx, e, p);
      k.frames(e).forEach((f, i) => {
        if (i % p.every) return;
        const r = Math.min(p.max, 1 + f.speed * p.gain), a0 = Math.atan2(f.ny, f.nx), sweep = (p.sweep * Math.PI) / 180;
        ctx.beginPath();
        for (let kk = 0; kk <= 16; kk++) {
          const a = a0 - sweep / 2 + (sweep * kk) / 16;
          const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r;
          kk ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();
    }
  },
  flat: {
    label: 'Flat', roles: ['plane'], doc: 'A flat, even fill of the plane: the simplest way to state a mass.',
    params: [
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.'),
      param('edge', 'Edge', 0, 20, 0.5, 0, 'Outline width (0 = no outline).')
    ],
    draw(ctx, e, p, k) {
      if (e.points.length < 3) return;
      const pts = k.smoothPath(e.points, true);   // the outline's own path (smooth, or straight), so the fill meets its stroke
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.fillStyle = e.color || '#8a8175';
      k.tracePath(ctx, pts, true);
      ctx.fill();
      if (p.edge > 0) { ctx.strokeStyle = k.INK; ctx.lineWidth = p.edge; ctx.stroke(); }
      ctx.restore();
    }
  },

  hatch: {
    label: 'Hatch', roles: ['plane'], doc: 'Parallel lines inside the plane: value from spacing, direction from angle.',
    params: [
      param('angle', 'Angle', -90, 90, 1, 45, 'Line direction in degrees.'),
      param('spacing', 'Spacing', 2, 80, 0.5, 10, 'Distance between lines (smaller = darker).'),
      param('width', 'Width', 0.25, 12, 0.25, 1.5, 'Line width.'),
      param('cross', 'Cross', 0, 1, 1, 0, '1 = add a second set at right angles.'),
      param('jitter', 'Jitter', 0, 1, 0.05, 0.15, 'Seeded irregularity of spacing and ends.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      if (e.points.length < 3) return;
      const poly = k.smoothPath(e.points, true);   // the outline's own path (smooth, or straight), so the fill meets its stroke
      const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cy = poly.reduce((a, q) => a + q[1], 0) / poly.length;
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.strokeStyle = e.color || k.INK;
      ctx.lineWidth = p.width;
      ctx.lineCap = 'round';
      const sets = p.cross >= 1 ? [p.angle, p.angle + 90] : [p.angle];
      for (const deg of sets) {
        const a = (deg * Math.PI) / 180;
        const rp = k.rotatePts(poly, -a, cx, cy); // rotate so hatching is horizontal
        const ys = rp.map(q => q[1]);
        const y0 = Math.min(...ys), y1 = Math.max(...ys);
        ctx.beginPath();
        for (let y = y0 + p.spacing / 2; y < y1; y += p.spacing * (1 + (k.rng() - 0.5) * p.jitter)) {
          const xs = k.spans(rp, y);
          for (let kk = 0; kk + 1 < xs.length; kk += 2) {
            const j = p.jitter * p.spacing;
            const a1 = k.rotatePts([[xs[kk] + (k.rng() - 0.5) * j, y]], a, cx, cy)[0];
            const b1 = k.rotatePts([[xs[kk + 1] + (k.rng() - 0.5) * j, y]], a, cx, cy)[0];
            ctx.moveTo(a1[0], a1[1]);
            ctx.lineTo(b1[0], b1[1]);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  stipple: {
    label: 'Stipple', roles: ['plane'], doc: 'Seeded dots inside the plane: value from density.',
    params: [
      param('density', 'Density', 0.0005, 0.05, 0.0005, 0.006, 'Dots per square unit.'),
      param('size', 'Size', 0.5, 12, 0.25, 2, 'Dot diameter.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      if (e.points.length < 3) return;
      const poly = k.smoothPath(e.points, true);   // the outline's own path (smooth, or straight), so the fill meets its stroke
      const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const n = Math.min(40000, Math.round((x1 - x0) * (y1 - y0) * p.density));
      ctx.save();
      ctx.globalAlpha *= p.opacity;
      ctx.fillStyle = e.color || k.INK;
      for (let i = 0; i < n; i++) {
        const x = x0 + k.rng() * (x1 - x0), y = y0 + k.rng() * (y1 - y0);
        const sp = k.spans(poly, y);
        let inside = false;
        for (let kk = 0; kk + 1 < sp.length; kk += 2) if (x >= sp[kk] && x <= sp[kk + 1]) inside = true;
        if (!inside) continue;
        ctx.beginPath(); ctx.arc(x, y, p.size / 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  },

  // ---- textured brushes: grain, hairs, washes (see texture.js) --------------------------------------------
  charcoal: {
    texture: true, label: 'Charcoal', roles: ['line', 'gesture'], doc: 'Soft, smudgy dabs that catch on the paper\\'s tooth: the more pressure, the wider and blacker; strong grain breaks the edge.',
    params: [
      param('width', 'Width', 2, 80, 0.5, 14, 'Stick width in artboard units.'),
      param('pressure', 'Pressure', 0, 1, 0.05, 0.6, 'How much pressure widens the mark and strengthens it (0 = even).'),
      param('dry', 'Dry', 0, 1, 0.05, 0.7, 'How much the paper\\'s tooth holds the charcoal back (0 = smooth, 1 = only the peaks).'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 0.7, 'Size of the paper\\'s tooth.'),
      param('flow', 'Flow', 0.05, 1, 0.05, 0.35, 'How much each dab lays down: dabs overlap and build up.'),
      param('scatter', 'Scatter', 0, 1.5, 0.05, 0.35, 'How far dabs drift across the line, in widths.'),
      param('hardness', 'Hardness', 0, 1, 0.05, 0.3, 'Softness of the dab\\'s edge.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 3, 0.5);
      if (!fr.length) return;
      k.paint(ctx, {
        key: k.hash('charcoal', e.points, p, e.seed), bounds: k.bounds(fr, p.width * (1 + p.scatter)),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'paper', scale: p.grain, strength: p.dry, seed: 3 },
        draw: l => k.dabs(l, fr, { tip: 'soft', hardness: p.hardness, size: f => p.width * (0.45 + 0.55 * (1 + p.pressure * (f.pressure - 0.5) * 2)), flow: f => p.flow * (0.6 + 0.8 * p.pressure * f.pressure), spacing: 0.08, scatter: p.scatter, rng: k.rng })
      });
    }
  },
  chalk: {
    texture: true, label: 'Chalk', roles: ['line', 'gesture'], doc: 'A flat stick of pastel dragged across canvas: broad, dry, broken by the weave.',
    params: [
      param('width', 'Width', 2, 80, 0.5, 18, 'Stick width in artboard units.'),
      param('aspect', 'Thickness', 0.1, 1, 0.05, 0.35, 'Thickness of the stick relative to its width.'),
      param('dry', 'Dry', 0, 1, 0.05, 0.8, 'How much the weave holds the chalk back.'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 0.9, 'Size of the weave.'),
      param('flow', 'Flow', 0.05, 1, 0.05, 0.55, 'How much each dab lays down.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 3, 0.6);
      if (!fr.length) return;
      k.paint(ctx, {
        key: k.hash('chalk', e.points, p, e.seed), bounds: k.bounds(fr, p.width),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'canvas', scale: p.grain, strength: p.dry, seed: 5 },
        draw: l => k.dabs(l, fr, { tip: 'flat', aspect: p.aspect, angle: 'follow', size: f => p.width * (0.7 + 0.6 * f.pressure), flow: p.flow, spacing: 0.06, scatter: 0.1, rng: k.rng })
      });
    }
  },
  pencil: {
    texture: true, label: 'Pencil', roles: ['line', 'gesture'], doc: 'A hard graphite point: thin, and it builds up where you go over it; light pressure leaves only the paper\\'s peaks.',
    params: [
      param('width', 'Width', 0.5, 12, 0.25, 2.5, 'Point width in artboard units.'),
      param('pressure', 'Pressure', 0, 1, 0.05, 0.7, 'How much pressure darkens the line.'),
      param('dry', 'Dry', 0, 1, 0.05, 0.55, 'How much the paper\\'s tooth shows through.'),
      param('grain', 'Grain size', 0.1, 3, 0.1, 0.45, 'Size of the paper\\'s tooth.'),
      param('flow', 'Flow', 0.05, 1, 0.05, 0.3, 'How much each dab lays down: passes build up.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 4, 0.5);
      if (!fr.length) return;
      k.paint(ctx, {
        key: k.hash('pencil', e.points, p, e.seed), bounds: k.bounds(fr, p.width * 2),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'paper', scale: p.grain, strength: p.dry, seed: 11 },
        draw: l => k.dabs(l, fr, { tip: 'soft', hardness: 0.85, size: p.width, flow: f => p.flow * (1 - p.pressure + p.pressure * 1.6 * f.pressure), spacing: 0.18, scatter: 0.25, rng: k.rng })
      });
    }
  },
  bristles: {
    texture: true, label: 'Bristles', roles: ['line', 'gesture'], doc: 'A dry brush: many hairs side by side, each lifting off where the paint runs out (sooner when the hand is fast).',
    params: [
      param('width', 'Width', 4, 120, 0.5, 34, 'Brush width in artboard units.'),
      param('hairs', 'Hairs', 3, 80, 1, 28, 'How many bristles.'),
      param('thickness', 'Hair', 0.3, 6, 0.1, 1.5, 'Thickness of a bristle.'),
      param('dry', 'Dry', 0, 1, 0.05, 0.4, 'How soon the paint runs out (0 = loaded, 1 = nearly dry).'),
      param('body', 'Body', 0, 1, 0.05, 0.12, 'A faint even stroke under the hairs.'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 1, 'Size of the paper\\'s tooth.'),
      param('tooth', 'Tooth', 0, 1, 0.05, 0.25, 'How much the paper\\'s tooth breaks the hairs up further.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 3, 0.7);
      if (fr.length < 2) return k.draw('dot', ctx, e, { size: p.width * 0.5, opacity: p.opacity });
      k.paint(ctx, {
        key: k.hash('bristles', e.points, p, e.seed), bounds: k.bounds(fr, p.width * 0.8),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'paper', scale: p.grain, strength: p.tooth, seed: 7 },
        draw: l => {
          if (p.body > 0) k.dabs(l, fr, { tip: 'soft', hardness: 0.6, size: p.width * 0.9, flow: p.body, spacing: 0.15, rng: k.rng });
          k.hairs(l, fr, { count: p.hairs, width: f => p.width * (0.6 + 0.6 * f.pressure), thickness: p.thickness, dry: p.dry, rng: k.rng });
        }
      });
    }
  },
  oil: {
    texture: true, label: 'Oil', roles: ['line', 'gesture'], doc: 'A loaded flat brush: many hairs packed side by side into one body of paint with streaks in it, a tapered stroke and ragged ends; the painterly stroke.',
    params: [
      param('width', 'Width', 4, 160, 0.5, 40, 'Brush width in artboard units.'),
      param('hair', 'Hair', 0.5, 6, 0.1, 1.6, 'Thickness of a bristle: coarse hairs leave visible streaks.'),
      param('flow', 'Load', 0.2, 1, 0.05, 0.9, 'How much paint each hair carries (less: more streaks).'),
      param('dry', 'Dry', 0, 1, 0.05, 0.1, 'How soon the paint runs out along the stroke.'),
      param('trim', 'Ragged ends', 0, 0.8, 0.05, 0.3, 'How far hairs may start late and end early.'),
      param('streaks', 'Streaks', 0, 1, 0.05, 0.35, 'How much the hairs differ in the paint they carry (0: an even body of paint).'),
      param('taper', 'Taper', 0, 1, 0.05, 0.4, 'How much the stroke narrows at its ends.'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 0.5, 'Size of the canvas weave.'),
      param('tooth', 'Tooth', 0, 1, 0.05, 0.2, 'How much the canvas weave shows in the paint.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 3, 0.7);
      if (fr.length < 2) return k.draw('dot', ctx, e, { size: p.width * 0.5, opacity: p.opacity });
      k.paint(ctx, {
        key: k.hash('oil', e.points, p, e.seed), bounds: k.bounds(fr, p.width * 0.8),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'canvas', scale: p.grain, strength: p.tooth, seed: 17 },
        draw: l => k.hairs(l, fr, {
          count: Math.max(6, Math.min(160, Math.round(p.width / (p.hair * 0.5)))),
          width: (f, u) => p.width * (0.5 + 0.7 * f.pressure) * (1 - p.taper * (1 - Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.5))),
          thickness: p.hair, flow: p.flow, dry: p.dry, trim: p.trim, streaks: p.streaks, rng: k.rng
        })
      });
    }
  },
  marker: {
    texture: true, label: 'Marker', roles: ['line', 'gesture'], doc: 'A broad felt tip: even and slightly see-through, so crossing strokes show through each other, and a stroke does not darken where it overlaps itself.',
    params: [
      param('width', 'Width', 2, 80, 0.5, 16, 'Tip width in artboard units.'),
      param('aspect', 'Chisel', 0.1, 1, 0.05, 0.4, 'How flat the tip is (1 = round-ish).'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 0.6, 'Size of the paper\\'s tooth.'),
      param('tooth', 'Tooth', 0, 1, 0.05, 0.15, 'How much the paper shows through.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 0.6, 'Paint opacity (the whole stroke at once).')
    ],
    draw(ctx, e, p, k) {
      const fr = k.frames(e, 3, 0.7);
      if (!fr.length) return;
      k.paint(ctx, {
        key: k.hash('marker', e.points, p, e.seed), bounds: k.bounds(fr, p.width),
        color: e.color || k.INK, alpha: p.opacity, grain: { kind: 'paper', scale: p.grain, strength: p.tooth, seed: 2 },
        draw: l => k.dabs(l, fr, { tip: 'flat', aspect: p.aspect, angle: Math.PI / 4, size: p.width, flow: 1, spacing: 0.05 })
      });
    }
  },
  wash: {
    texture: true, label: 'Wash', roles: ['plane'], doc: 'Watercolor: a thin, transparent fill whose pigment gathers at the edge and settles into the paper\\'s grain.',
    params: [
      param('body', 'Body', 0.05, 1, 0.05, 0.55, 'How strong the wash is inside.'),
      param('edge', 'Edge', 0, 1, 0.05, 0.6, 'How much darker the rim is.'),
      param('rim', 'Rim width', 0.5, 30, 0.5, 5, 'Width of the darker rim, in artboard units.'),
      param('rough', 'Wander', 0, 12, 0.25, 1.5, 'How much the edge wanders.'),
      param('granulation', 'Granulation', 0, 1, 0.05, 0.4, 'How much pigment settles into the paper\\'s grain.'),
      param('grain', 'Grain size', 0.2, 4, 0.1, 0.8, 'Size of the paper\\'s grain.'),
      param('opacity', 'Opacity', 0, 1, 0.05, 1, 'Paint opacity.')
    ],
    draw(ctx, e, p, k) {
      if (e.points.length < 3) return;
      const poly = k.smoothPath(e.points, true);   // the outline's own path (smooth, or straight), so the fill meets its stroke
      const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]), pad = p.rough * 2 + p.rim * 2 + 4;
      k.paint(ctx, {
        key: k.hash('wash', e.points, p, e.seed), bounds: [Math.floor(Math.min(...xs) - pad), Math.floor(Math.min(...ys) - pad), Math.ceil(Math.max(...xs) + pad), Math.ceil(Math.max(...ys) + pad)],
        color: e.color || '#8a8175', alpha: p.opacity, grain: { kind: 'paper', scale: p.grain, strength: p.granulation, seed: 13 },
        draw: (l, layer) => k.wash(layer, poly, { edge: p.edge, rimWidth: p.rim, rough: p.rough, base: p.body, seed: e.seed || 1 })
      });
    }
  }
};

/**
 * The brush kit: what a brush's draw(ctx, e, p, k) can use. Brushes are code: the built-ins are
 * written against this kit only, so their source can be shown, forked and edited.
 *   k.smoothPath(points, closed, samples)   Catmull-Rom resampling
 *   k.frames(e, samples, smoothing)         the walk: [{ x, y, nx, ny, speed, pressure }]
 *   k.tracePath(ctx, pts, closed)           begin a path through pts
 *   k.spans(poly, y)                        scanline crossings of a polygon (hatching, stipple)
 *   k.rotatePts(pts, angle, cx, cy)         rotate points
 *   k.segment(ctx, x1, y1, x2, y2)          one stroked segment
 *   k.beginInk(ctx, e, p)                   save + color, width (p.width), opacity (p.opacity), round caps
 *   k.draw(id, ctx, e, params)              draw with another brush
 *   k.rng()                                 seeded random 0..1 (per element)
 *   k.noise(x, y)                           smooth value noise, about -1..1
 *   k.scale                                 screen scale (for hairlines)
 *   k.INK                                   the default ink color
 *   k.paint(ctx, { key, bounds, draw(lctx, layer), grain, color, alpha })   paint a mark through a layer (cached by key)
 *   k.dabs(lctx, frames, { tip, size, flow, spacing, scatter, hardness, aspect, angle, rng })   stamp a tip along a walk
 *   k.hairs(lctx, frames, { count, width, thickness, dry, flow, rng })    bristles that lift off where the paint runs dry
 *   k.wash(layer, poly, { edge, rimWidth, rough, base, seed })            a wash: pigment gathers at the edge
 *   k.bounds(frames, pad)  k.hash(...parts)  k.grain(layer, { kind, scale, strength, seed })
 *   k.age                                   seconds since the mark was born (its time envelope: see envelope.js)
 *   k.source(name)                          a source (camera, image…) fitted to the mark's board: .colorAt(x, y),
 *                                           .valueAt(x, y) in world units; .color(fx, fy), .pose, .mask(fx, fy) in fractions
 */
function valueNoise(x, y) {
  const h = (i, j) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const images = new Map();
/** A loaded image for a src (data URL or URL), or null while it loads (the canvas redraws when it arrives). */
function getImage(src) {
  if (!src || typeof Image === 'undefined') return null;
  let im = images.get(src);
  if (!im) { im = new Image(); im.onload = () => KIT.onImageLoad?.(); im.src = src; images.set(src, im); }
  return im.complete && im.naturalWidth ? im : null;
}
export const KIT = {
  image: getImage,
  smoothPath, tracePath, spans, rotatePts, frames: walkFrames, segment: strokeSegment, beginInk, INK, noise: valueNoise,
  // Textured painting (texture.js): a mark is painted white into a layer, the paper's grain is multiplied in, and it is tinted
  paint(ctx, spec) { return txPaint(ctx, { scale: this.scale, ...spec }); },
  dabs: txDabs, hairs: txHairs, wash: txWash, bounds: txBounds, hash: txHash, layer: txLayer, grain: txGrain,
  draw(id, ctx, e, params = {}) { const b = BRUSHES[id]; if (b) b.draw(ctx, e, resolveParams(id, params), this); },
  source(name, rect) { return getSource(name, rect || this.board, { peek: Boolean(this.frozen) }); }
};
export function kitFor(env = {}) {
  if (env && env.smoothPath) return env;
  const k = Object.create(KIT); k.rng = env?.rng || Math.random; k.scale = env?.scale || 1; k.board = env?.board; k.frozen = env?.frozen; k.age = env?.age || 0; k.now = env?.now ?? null;
  // A mark with path: 'straight' is drawn through its points as straight segments.
  if (env?.straight) k.smoothPath = points => points.map(p => p.slice());
  return k;
}

// Every brush's draw gets a kit, whatever the caller passes; the raw function is its source.
for (const b of Object.values(BRUSHES)) wrapDraw(b);
function wrapDraw(b) {
  if (b.rawDraw) return b;
  b.rawDraw = b.draw;
  b.draw = function (ctx, e, p, env) {
    if (!b.custom) return b.rawDraw(ctx, e, p, kitFor(env));
    // Code from people and models can fail: fall back to a plain brush for this element, warn once.
    ctx.save();
    try { b.rawDraw(ctx, e, p, kitFor(env)); ctx.restore(); }
    catch (err) {
      ctx.restore();
      if (!b.warned) { b.warned = true; b.lastError = err.message; console.warn(\`brush "\${b.id || b.label}" failed (drawn plainly instead): \${err.message}\`); }
      const fb = e.role === 'plane' ? 'flat' : e.role === 'point' ? 'dot' : 'ink';
      BRUSHES[fb].draw(ctx, e, resolveParams(fb, {}), env);
    }
  };
  return b;
}

const q = v => JSON.stringify(v);
/** A brush as code: the snippet that defines it (built-ins included). */
export function brushSource(id) {
  const b = BRUSHES[id];
  if (!b) return null;
  if (b.source) return b.source;
  const params = b.params.map(p => \`    \${p.key}: [\${p.min}, \${p.max}, \${p.default}\${p.doc ? \`, \${q(p.doc)}\` : ''}]\`).join(',\\n');
  let fn = b.rawDraw.toString();
  if (!/^draw\\s*\\(/.test(fn)) fn = \`draw\${fn.replace(/^function\\s*\\w*\\s*/, '')}\`;
  // Re-indent the method body to sit inside brush({ … }).
  const lines = fn.split('\\n');
  const base = lines.length > 1 ? lines[lines.length - 1].match(/^ */)[0].length : 0;   // the closing brace
  fn = [lines[0], ...lines.slice(1).map(l => \`  \${l.slice(Math.min(base, l.match(/^ */)[0].length))}\`)].join('\\n');
  return \`brush({
  id: \${q(id)},
  label: \${q(b.label)},
  roles: \${q(b.roles)},
  doc: \${q(b.doc || '')},\${b.construction ? '\\n  construction: true,' : ''}
  params: {
\${params}
  },
  \${fn}
})
\`;
}

/** Code for a brush definition given as an object (brush({...}) in a score). */
export function defSource(def) {
  const params = Object.entries(def.params || {}).map(([key, v]) => \`    \${key}: \${q(Array.isArray(v) ? v : [v.min, v.max, v.default, v.doc].filter(x => x !== undefined))}\`).join(',\\n');
  let fn = def.draw.toString();
  const method = /^draw\\s*\\(/.test(fn) ? fn : /^(async\\s+)?function\\b/.test(fn) ? \`draw\${fn.replace(/^function\\s*\\w*\\s*/, '')}\` : \`draw: \${fn}\`;
  return \`brush({
  id: \${q(def.id)},
  label: \${q(def.label || def.id)},
  roles: \${q(def.roles || ['line', 'gesture', 'plane'])},
  doc: \${q(def.doc || '')},\${def.construction ? '\\n  construction: true,' : ''}
  params: {
\${params}
  },
  \${method}
})
\`;
}

/**
 * Compile brush code: brush({ id, label, roles, doc, params: { key: [min, max, default, doc] }, draw(ctx, e, p, k) { … } }).
 * Returns the definition (not yet registered). Throws with a readable message.
 */
export function compileBrush(source) {
  let def = null;
  // eslint-disable-next-line no-new-func
  new Function('brush', \`"use strict";\\n\${source}\`)(d => { def = d; });
  if (!def) throw new Error('The code must call brush({ id, draw(ctx, e, p, k) { … } })');
  if (!/^[a-z][\\w-]*$/i.test(def.id || '')) throw new Error('brush id must be a word like "teeth"');
  if (typeof def.draw !== 'function') throw new Error('brush needs draw(ctx, e, p, k) { … }');
  const params = Object.entries(def.params || {}).map(([key, v]) => {
    const [min, max, dflt, doc] = Array.isArray(v) ? v : [v.min ?? 0, v.max ?? 1, v.default ?? 0, v.doc];
    return param(key, key, Number(min), Number(max), Math.abs(Number(max) - Number(min)) / 100 || 0.01, Number(dflt), doc || '');
  });
  return wrapDraw({
    label: def.label || def.id, roles: def.roles || ['line', 'gesture', 'plane'], doc: def.doc || '', construction: Boolean(def.construction),
    params, draw: def.draw, source, custom: true, id: def.id
  });
}

// ---- where brushes live: built-in, your library (browser), or a drawing ----------------------
const LIB_KEY = 'ams_brushes_v1';
const BUILTIN_IDS = new Set(Object.keys(BRUSHES));
export const isBuiltin = id => BUILTIN_IDS.has(id);
export function libraryBrushes() { try { return JSON.parse(globalThis.localStorage?.getItem(LIB_KEY) || '{}'); } catch { return {}; } }
function saveLibrary(lib) { try { globalThis.localStorage?.setItem(LIB_KEY, JSON.stringify(lib)); } catch { /* ignore */ } }

/** Register compiled brush code under its id (built-ins cannot be replaced: fork them under a new id). */
export function registerBrush(source, scope = 'library') {
  const def = compileBrush(source);
  if (isBuiltin(def.id)) throw new Error(\`"\${def.id}" is a built-in brush: give your version its own id\`);
  def.scope = scope;
  BRUSHES[def.id] = def;
  return def;
}

/** Save brush code to your library (and register it). Returns the definition. */
export function saveLibraryBrush(source) {
  const def = registerBrush(source, 'library');
  const lib = libraryBrushes(); lib[def.id] = source; saveLibrary(lib);
  return def;
}

export function deleteLibraryBrush(id) {
  const lib = libraryBrushes(); const had = id in lib; delete lib[id]; saveLibrary(lib);
  if (BRUSHES[id]?.scope === 'library') delete BRUSHES[id];
  return had;
}

/** Load your library once (browser). */
export function loadLibrary() {
  for (const src of Object.values(libraryBrushes())) { try { registerBrush(src, 'library'); } catch (err) { console.warn('brush library:', err.message); } }
}

/** A drawing carries every non-built-in brush it uses, so it renders anywhere. */
export function embedBrushes(doc) {
  if (!doc?.elements) return doc;
  doc.brushes = doc.brushes || {};
  for (const e of doc.elements) {
    const id = e.realize?.brush;
    const b = BRUSHES[id];
    if (b?.custom && b.source && !doc.brushes[id] && !doc.lines?.[id]) doc.brushes[id] = b.source;
  }
  return doc;
}

/** Full parameter set for an element: brush defaults overlaid with the element's params. */
export function resolveParams(brushId, params = {}) {
  const b = BRUSHES[brushId] || BRUSHES.ink;
  const out = {};
  for (const s of b.params) {
    const v = params[s.key];
    out[s.key] = Number.isFinite(Number(v)) ? Math.min(s.max, Math.max(s.min, Number(v))) : s.default;
  }
  return out;
}

/** Brushes for a role; lines a document defined itself are listed only for that document. */
export function brushesForRole(role, doc = null) {
  // Picture brushes first (Ink, Pen, …), construction ones (Guide) last.
  return Object.entries(BRUSHES).filter(([id, b]) => b.roles.includes(role) && (!b.custom || b.scope === 'library' || doc?.lines?.[id] || doc?.brushes?.[id])).sort((a, b) => Number(Boolean(a[1].construction)) - Number(Boolean(b[1].construction))).map(([id, b]) => ({ id, label: b.label }));
}

/**
 * Lines a document defines itself (defineLine in a score): { name: { source, doc, params: { key: [min, max, default] } } }.
 * "Create your own lines before you draw them" (Ngan). The source is compiled once and registered
 * beside the built-in brushes, so it renders, exports to SVG, and appears in Properties.
 * draw(ctx, frames, p, env): frames = [{ x, y, nx, ny, speed, pressure }], env = { color, rng, closed, points }.
 */
const compiled = new Map();
export function installLines(doc) {
  for (const [id, src] of Object.entries(doc?.brushes || {})) {
    if (isBuiltin(id) || compiled.get(id) === src) continue;
    try { registerBrush(src, 'doc'); compiled.set(id, src); } catch (err) { console.warn(\`brush "\${id}":\`, err.message); }
  }
  for (const [name, spec] of Object.entries(doc?.lines || {})) {
    if (!spec?.source || (BRUSHES[name] && !BRUSHES[name].custom)) continue;
    const key = \`\${name}\\n\${spec.source}\\n\${JSON.stringify(spec.params || {})}\`;
    if (compiled.get(name) === key) continue;
    let fn;
    try {
      // eslint-disable-next-line no-new-func
      fn = new Function(\`return (\${spec.source});\`)();
    } catch (err) { fn = () => { throw err; }; }
    const params = Object.entries(spec.params || {}).map(([k, [min, max, def]]) => param(k, k, min, max, (max - min) / 100, def, \`\${name}: \${k}\`));
    BRUSHES[name] = {
      label: name, roles: ['line', 'gesture', 'plane'], doc: spec.doc || 'A line defined in this drawing\\'s score.', custom: true, params,
      draw(ctx, e, p, env) {
        const color = e.color || INK;
        ctx.save();
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        try { fn(ctx, walkFrames(e), p, { color, rng: env.rng, closed: e.closed, points: e.points, scale: env.scale }); }
        catch (err) { ctx.restore(); ctx.save(); BRUSHES.ink.draw(ctx, e, resolveParams('ink', {}), env); console.warn(\`line "\${name}" failed: \${err.message}\`); }
        ctx.restore();
      }
    };
    compiled.set(name, key);
  }
}

export { smoothPath };
`,dc=`/**
 * Render a process document to a 2D canvas context.
 *
 * mode:
 *   'picture'  the finished picture: construction (guides, gestures, notes) left out
 *   'process'  the picture plus construction overlays and notes
 * upTo:       render only stages up to and including this index (filmstrip, replay)
 * transform:  { x, y, scale }, artboard → screen
 */
import { envelope, reveal, expired, nextChange, cutPath } from './envelope.js';
import { BRUSHES, mulberry32, resolveParams, installLines, KIT } from './brushes.js';
import { boardDoc, boardsOf, MAIN } from './boards.js';
import { drawNote, noteCorners } from './notes.js';
import { txBeginFrame, txArm, txDisarm, txKnown, txBlit, txHash, txPpu } from './texture.js';

// A mark's opacity from its time envelope, for the mark being drawn (read by withLook).
let TIME_ALPHA = 1;

/**
 * Milliseconds until a mark with a time envelope next changes: 0 while any mark is fading or drawing itself (the view must keep
 * redrawing), the wait until the next mark starts to fade out or is gone, Infinity when nothing will change.
 */
export function nextTimed(doc, now) {
  let wait = Infinity;
  for (const e of doc.elements) {
    if (!e.time) continue;
    const w = nextChange(e.time, (now - (e.born ?? now)) / 1000);
    if (w === 0) return 0;
    if (w < wait) wait = w;
  }
  return wait * 1000;
}
/** Does any mark still move (fade, draw on, loop) at \`now\` (epoch ms)? */
export const timedActive = (doc, now) => nextTimed(doc, now) === 0;

export function renderDocument(ctx, doc, {
  mode = 'process', upTo = Infinity, transform = { x: 0, y: 0, scale: 1 },
  selected = new Set(), hovered = null, ground = true, showNotes = true, screenNotes = false, selectColor = '#8a8a8a', frozen = false, now = null, view = null
} = {}) {
  const { width, height } = doc.artboard;
  txBeginFrame();
  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);
  if (ground) {
    // Every board's paper (a single board, as exported, is just the artboard).
    for (const b of boardsOf(doc)) { ctx.fillStyle = b.ground || '#ffffff'; ctx.fillRect(b.x, b.y, b.width, b.height); }
  }
  const rank = new Map(doc.stages.map((s, i) => [s.id, i]));
  const stageOf = new Map(doc.stages.map(s => [s.id, s]));
  const ordered = doc.elements
    .map((e, i) => [e, i])
    .sort((a, b) => (rank.get(a[0].stage) ?? 0) - (rank.get(b[0].stage) ?? 0) || a[1] - b[1])
    .map(([e]) => e);

  installLines(doc);
  const env = { scale: transform.scale, rng: null, frozen, now, age: 0 };
  const boardRects = new Map(boardsOf(doc).map(b => [b.id, { x: b.x, y: b.y, width: b.width, height: b.height, mask: Boolean(b.mask) }]));
  env.boards = boardRects;
  const overlay = [];
  for (const e0 of ordered) {
    let e = e0;
    const s = stageOf.get(e.stage);
    if (!s || !s.visible || e.hidden) continue;
    if ((rank.get(e.stage) ?? 0) > upTo) continue;
    // Time: a mark with an envelope fades (and draws itself on) by its age; gone when its life is over.
    TIME_ALPHA = 1; env.age = 0;
    let share = 1;
    if (now != null && e.time) {
      const age = (now - (e.born ?? now)) / 1000;
      if (expired(e.time, age)) continue;
      TIME_ALPHA = envelope(e.time, age);
      if (TIME_ALPHA <= 0.003) continue;
      env.age = age;
      share = reveal(e.time, age);
    }
    const brush = BRUSHES[e.realize?.brush] || BRUSHES.ink;
    // A textured mark is painted once (its layer is kept): fading is a change of opacity, drawing on a clip, and a
    // mark whose layer is known is put on the picture without asking its brush.
    // A masked board crops its marks to its rectangle (only the marks that reach over the edge pay for a clip).
    const br = boardRects.get(e.board || MAIN), rect = br?.mask ? br : null;
    if (brush.texture && !e.fill && e.color !== 'none' && e.role !== 'guide' && e.role !== 'gesture' && e.role !== 'note') {
      drawTextured(ctx, e, brush, env, share, view, rect);
      continue;
    }
    if (share < 1) e = { ...e, points: cutPath(e.points, share) };
    const construction = brush.construction || e.role === 'guide' || e.role === 'gesture' || e.role === 'note';
    if (construction) { overlay.push(e); continue; }
    env.rng = mulberry32(e.seed || 1);
    env.straight = e.path === 'straight';
    env.board = boardRects.get(e.board || MAIN) || boardRects.get(MAIN);
    const cropped = rect && spills(e.points, (Number(e.realize?.params?.width) || 20) * 1.5, rect);
    if (cropped) cropTo(ctx, rect);
    drawGeneric(ctx, e, brush, env);
    if (cropped) ctx.restore();
  }
  TIME_ALPHA = 1;
  if (mode === 'process') {
    for (const e of overlay) {
      env.rng = mulberry32(e.seed || 1);
      env.straight = e.path === 'straight';
      if (e.role === 'note') { if (showNotes) withLook(ctx, e, () => drawNote(ctx, e)); continue; }
      const brushId = BRUSHES[e.realize?.brush]?.construction ? e.realize.brush : 'guide';
      withLook(ctx, e, () => BRUSHES[brushId].draw(ctx, e, resolveParams(brushId, e.realize.params), env));
    }
  }
  drawOutlines(ctx, doc.elements, selected, hovered, selectColor, transform.scale);
  ctx.restore();
}

/** Selection and hover outlines, in the units of the current transform (scale: screen pixels per unit). */
export function drawOutlines(ctx, elements, selected, hovered, selectColor, scale) {
  for (const e of elements) {
    if (!selected.has(e.id) && hovered !== e.id) continue;
    ctx.save();
    ctx.strokeStyle = selectColor; ctx.globalAlpha = selected.has(e.id) ? 1 : 0.5;
    ctx.lineWidth = 1.5 / scale;
    ctx.setLineDash([4 / scale, 3 / scale]);
    const pts = e.role === 'note' ? noteCorners(e) : e.points;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const pad = 6 / scale;
    if (xs.length) ctx.strokeRect(Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2);
    ctx.restore();
  }
}

/** A mark that is not textured: its fill, its stroke, its brush (see the loop above). */
function drawGeneric(ctx, e, brush, env) {
  if (e.color === 'none') {
    // No stroke: only the fill (a plane's brush paints it).
    if (e.fill && e.role === 'plane') withLook(ctx, e, () => brush.draw(ctx, { ...e, color: e.fill }, resolveParams(e.realize.brush, e.realize.params), env));
    else if (e.fill && e.points.length > 2 && e.closed) withLook(ctx, e, () => fillShape(ctx, e));
    return;
  }
  if (e.role === 'plane' && !e.fill) {
    // No fill: a plane is its outline alone (closed, straight or smooth), in the stroke color.
    withLook(ctx, e, () => strokeShape(ctx, { ...e, color: e.color || '#1d1b19' }));
    return;
  }
  if (e.fill && e.role === 'plane') {
    // A plane's brush is its fill; the stroke outlines it.
    withLook(ctx, e, () => { brush.draw(ctx, { ...e, color: e.fill }, resolveParams(e.realize.brush, e.realize.params), env); if (e.color) strokeShape(ctx, e, env.scale); });
    return;
  }
  if (e.fill && e.points.length > 2 && e.closed) withLook(ctx, e, () => fillShape(ctx, e));
  withLook(ctx, e, () => brush.draw(ctx, e, resolveParams(e.realize.brush, e.realize.params), env));
}

/** Does a mark (its points grown by \`pad\`) reach over the edge of a board rect { x, y, width, height }? */
function spills(points, pad, r) {
  for (const q of points) if (q[0] - pad < r.x || q[0] + pad > r.x + r.width || q[1] - pad < r.y || q[1] + pad > r.y + r.height) return true;
  return false;
}
/** Draw what follows only inside the rect (the caller restores). */
function cropTo(ctx, r) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.width, r.height); ctx.clip(); }

/** Can the mark reach into the view (world units, [x0, y0, x1, y1])? Its points, grown by its brush's width. */
function reaches(points, pad, view) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of points) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
  return x1 + pad >= view[0] && x0 - pad <= view[2] && y1 + pad >= view[1] && y0 - pad <= view[3];
}

/** A clip that shows the first \`share\` of a stroke: a strip along its path, as wide as the brush can be. */
function revealClip(ctx, points, share, half) {
  const cut = cutPath(points, share), n = cut.length;
  ctx.beginPath();
  if (n < 2) { ctx.rect(0, 0, 0, 0); ctx.clip(); return; }
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = cut[Math.max(0, i - 1)], b = cut[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let x = cut[i][0], y = cut[i][1];
    if (i === n - 1) { x += dx * half * 0.4; y += dy * half * 0.4; }   // the tip runs a little ahead
    left.push([x - dy * half, y + dx * half]); right.push([x + dy * half, y - dx * half]);
  }
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.clip();
}

/** A mark of a textured brush (see texture.js): known layers are blitted, the first time the brush paints it. */
function drawTextured(ctx, e, brush, env, share, view, rect) {
  const id = e.realize.brush, p = resolveParams(id, e.realize.params);
  const alpha = (e.opacity ?? 1) * TIME_ALPHA, blend = e.blend && e.blend !== 'normal' ? e.blend : null;
  const clipped = share < 1 && p.width > 0 && e.role === 'line';
  const fk = \`\${txHash(id, e.points, p, e.seed)}|\${e.color}|\${txPpu(env.scale)}\`;
  const known = txKnown(fk);
  if (known) {
    const l = known.layer;
    if (view && (l.x > view[2] || l.y > view[3] || l.x + l.w < view[0] || l.y + l.h < view[1])) return;
    const cropped = rect && (l.x < rect.x || l.y < rect.y || l.x + l.w > rect.x + rect.width || l.y + l.h > rect.y + rect.height);
    if (!clipped && !blend && !cropped) { txBlit(ctx, known, alpha); return; }
    ctx.save();
    if (cropped) { ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.clip(); }
    if (blend) ctx.globalCompositeOperation = blend;
    if (clipped) revealClip(ctx, e.points, share, p.width * 0.8);
    txBlit(ctx, known, alpha);
    ctx.restore();
    return;
  }
  if (view && !reaches(e.points, (p.width || 30) * 1.2, view)) return;
  env.rng = mulberry32(e.seed || 1);
  env.straight = e.path === 'straight';
  env.board = env.boards?.get(e.board || MAIN) || env.boards?.get(MAIN);
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (rect && spills(e.points, (p.width || 30) * 1.2, rect)) { ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.clip(); }
  if (blend) ctx.globalCompositeOperation = blend;
  if (clipped) revealClip(ctx, e.points, share, p.width * 0.8);
  if (known === null) txArm(fk);
  try { brush.draw(ctx, e, p, env); } finally { if (known === null) txDisarm(); }
  ctx.restore();
}

/** scale: screen px per unit when notes should keep a readable screen size (canvas view), else 1. */
/** An element's own opacity and blend mode, on top of whatever its brush does. */
function withLook(ctx, e, draw) {
  if ((e.opacity ?? 1) >= 1 && TIME_ALPHA >= 1 && (!e.blend || e.blend === 'normal')) return draw();
  ctx.save();
  ctx.globalAlpha *= (e.opacity ?? 1) * TIME_ALPHA;
  if (e.blend && e.blend !== 'normal') ctx.globalCompositeOperation = e.blend;
  draw();
  ctx.restore();
}

/** Render to an offscreen canvas at the artboard's size (or scaled), for exports and thumbnails. */
export function renderToCanvas(doc, { scale = 1, mode = 'picture', upTo = Infinity, board = MAIN } = {}) {
  doc = boardDoc(doc, board);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(doc.artboard.width * scale));
  c.height = Math.max(1, Math.round(doc.artboard.height * scale));
  renderDocument(c.getContext('2d'), doc, { mode, upTo, transform: { x: 0, y: 0, scale } });
  return c;
}

/** Fill: the inside of a closed mark, painted under its stroke. */
function fillShape(ctx, e) {
  const pts = e.path === 'straight' ? e.points : KIT.smoothPath(e.points, true);
  ctx.save();
  ctx.fillStyle = e.fill;
  KIT.tracePath(ctx, pts, true);
  ctx.fill();
  ctx.restore();
}

function strokeShape(ctx, e) {
  ctx.save();
  ctx.strokeStyle = e.color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  KIT.tracePath(ctx, e.path === 'straight' ? e.points : KIT.smoothPath(e.points, true), true);
  ctx.stroke();
  ctx.restore();
}
`,hc=`/**
 * Notes: writing on the process. Laid out in artboard units, so a note is part of the page,
 * like handwriting in a notebook, rather than a screen overlay.
 *
 * e.note = { style: notebook | sticky | card | plain, font: hand | print | serif | sans | mono,
 *            size (artboard units), width (wrap width), bg (color or null), angle (radians) }
 * The text color is the element's color.
 */
export const NOTE_STYLES = {
  notebook: 'Notebook: handwriting on the page',
  sticky: 'Sticky note',
  card: 'Index card',
  plain: 'Plain text'
};

export const NOTE_FONTS = {
  hand: ['Handwriting', '"Caveat", "Patrick Hand", cursive'],
  print: ['Printed hand', '"Patrick Hand", "Caveat", cursive'],
  serif: ['Serif', '"Newsreader", Georgia, serif'],
  sans: ['Sans', 'Inter, system-ui, sans-serif'],
  mono: ['Mono', 'ui-monospace, Menlo, monospace']
};

const STYLE_DEFAULTS = {
  notebook: { font: 'print', size: 20, bg: null, ink: '#2b2620' },
  sticky: { font: 'print', size: 17, bg: '#fbe9a6', ink: '#2b2620' },
  card: { font: 'print', size: 17, bg: '#fbfaf5', ink: '#2b2620' },
  plain: { font: 'sans', size: 15, bg: null, ink: '#2b2620' }
};

let defaultFont = null;
/** A host (the embedded editor) can pick the lettering notes have when they name none: the hand fonts need webfonts it may not load. */
export const setDefaultNoteFont = f => { defaultFont = NOTE_FONTS[f] ? f : null; };

export function noteProps(e) {
  const n = e.note || {};
  const style = NOTE_STYLES[n.style] ? n.style : 'notebook';
  const d = STYLE_DEFAULTS[style];
  return {
    style,
    font: NOTE_FONTS[n.font] ? n.font : (defaultFont || d.font),
    size: Number(n.size) > 0 ? Number(n.size) : d.size,
    width: Number(n.width) > 0 ? Number(n.width) : 280,
    bg: n.bg === undefined ? d.bg : n.bg,
    angle: Number(n.angle) || 0,
    ink: e.color || d.ink
  };
}

let measurer = null;
function measureCtx() {
  if (measurer) return measurer;
  try {
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas');
    measurer = c.getContext('2d');
  } catch { measurer = { font: '', measureText: t => ({ width: String(t).length * 0.5 * (parseFloat(measurer.font) || 16) }) }; }
  return measurer;
}

function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? \`\${line} \${w}\` : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/** Box and wrapped lines of a note, in artboard units (unrotated, from its top-left point). */
export function noteLayout(e) {
  const p = noteProps(e);
  const [x, y] = e.points[0] || [0, 0];
  const ctx = measureCtx();
  ctx.font = \`\${p.size}px \${NOTE_FONTS[p.font][1]}\`;
  const text = e.text || e.why || '';
  const pad = p.bg ? p.size * 0.55 : p.size * 0.15;
  const lines = text ? wrap(ctx, text, p.width - pad * 2) : [''];
  const lh = p.size * (p.font === 'hand' ? 1.15 : 1.32);
  return { x, y, w: p.width, h: lines.length * lh + pad * 2, pad, lh, lines, props: p };
}

/** The four corners of a note's box in artboard units, after its rotation (about its top-left). */
export function noteCorners(e) {
  const L = noteLayout(e);
  const c = Math.cos(L.props.angle), s = Math.sin(L.props.angle);
  return [[0, 0], [L.w, 0], [L.w, L.h], [0, L.h]].map(([u, v]) => [L.x + u * c - v * s, L.y + u * s + v * c]);
}

export function drawNote(ctx, e) {
  const L = noteLayout(e);
  const p = L.props;
  if (!e.text && !e.why) return;
  ctx.save();
  ctx.translate(L.x, L.y);
  if (p.angle) ctx.rotate(p.angle);
  if (p.bg) {
    if (p.style === 'sticky') { ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = p.size * 0.5; ctx.shadowOffsetY = p.size * 0.15; }
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, L.w, L.h);
    ctx.shadowColor = 'transparent';
    if (p.style === 'card') {
      // Index card: a red top rule and faint blue lines.
      ctx.globalAlpha *= 0.5;
      ctx.strokeStyle = '#8fb3d9'; ctx.lineWidth = Math.max(0.5, p.size * 0.04);
      for (let i = 1; i <= L.lines.length; i++) { const yy = L.pad + i * L.lh + p.size * 0.12; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(L.w, yy); ctx.stroke(); }
      ctx.strokeStyle = '#d98b8b'; ctx.beginPath(); ctx.moveTo(0, L.pad + p.size * 0.12); ctx.lineTo(L.w, L.pad + p.size * 0.12); ctx.stroke();
      ctx.globalAlpha /= 0.5;
    }
  }
  ctx.fillStyle = p.ink;
  ctx.font = \`\${p.size}px \${NOTE_FONTS[p.font][1]}\`;
  ctx.textBaseline = 'alphabetic';
  L.lines.forEach((l, i) => ctx.fillText(l, L.pad, L.pad + (i + 1) * L.lh - L.lh * 0.25));
  ctx.restore();
}

/** SVG for a note (text wrapped as tspans; rotation as a transform). */
export function noteSVG(e, esc, r2) {
  const L = noteLayout(e);
  const p = L.props;
  const tf = p.angle ? \` transform="rotate(\${r2((p.angle * 180) / Math.PI)} \${r2(L.x)} \${r2(L.y)})"\` : '';
  const bg = p.bg ? \`<rect x="\${r2(L.x)}" y="\${r2(L.y)}" width="\${r2(L.w)}" height="\${r2(L.h)}" fill="\${esc(p.bg)}"/>\` : '';
  const spans = L.lines.map((l, i) => \`<tspan x="\${r2(L.x + L.pad)}" y="\${r2(L.y + L.pad + (i + 1) * L.lh - L.lh * 0.25)}">\${esc(l)}</tspan>\`).join('');
  return \`<g\${tf}>\${bg}<text font-family="\${esc(NOTE_FONTS[p.font][1])}" font-size="\${r2(p.size)}" fill="\${esc(p.ink)}">\${spans}</text></g>\`;
}
`,uc=`/**
 * Authoring library: a small point / line / plane vocabulary for JS.
 *
 * A script is the score; running it records a process document (the performance).
 * Every call becomes an element or a decision with its stage, parameters, seed,
 * reason (\`why\`) and author. The same scripts export as p5 sketches.
 *
 *   artboard(1000, 1000, '#f3efe6')
 *   stage('Construction', 'construction')           // later calls land in this stage
 *   decide('Where does the weight sit?', ['low left', 'center'], 'low left', 'lower left feels heavy')
 *   guide([[0, 620], [1000, 620]], { why: 'horizon' })
 *   const path = walk({ from: [120, 700], heading: -20, steps: 60, step: 12, turn: i => sin(i / 6) * 9 })
 *   line(path, { width: 3, why: 'the active line walks toward the light' })
 *   plane([[...], ...], { brush: 'hatch', angle: 30, spacing: 8 })
 *   point(700, 300, { size: 40, why: 'the weight' })
 *   note(40, 40, 'Kandinsky: a point high right feels light')
 *   board('A line')                                  // later marks land on this board (made if new);
 *                                                    // coordinates are fractions of *this* board
 *
 * Helpers: random(a?, b?), noise(x, y?), seed(n), sin, cos, PI, TAU, lerp, map, range(n).
 */
import { createDocument, normalizeDocument, newId, STAGE_KINDS } from './document.js';
import { BRUSHES, mulberry32, installLines, defSource, registerBrush, isBuiltin } from './brushes.js';
import { findBoard, newBoardId, nextBoardPlace } from './boards.js';
import { getSource, streamState } from './streams.js';
import { fitSource } from './fit.js';

const EXTRA_KEYS = ['time', 'born', 'label', 'opacity', 'blend', 'note', 'src', 'asset', 'hidden', 'locked', 'group', 'path', 'fill'];
const ELEMENT_KEYS = new Set(['time', 'born', 'path', 'fill', 'why', 'color', 'brush', 'stage', 'closed', 'pressures', 'text', 'seed', 'by', 'label', 'opacity', 'blend', 'note', 'src', 'asset', 'hidden', 'locked', 'group', 'id']);

/** 1D/2D value noise (seeded, smooth), enough for gentle variation. */
function makeNoise(rng) {
  const perm = Array.from({ length: 512 }, () => rng());
  const h = (i, j = 0) => perm[(((i * 73856093) ^ (j * 19349663)) >>> 0) % 512];
  const s = t => t * t * (3 - 2 * t);
  return (x, y = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

/**
 * Run a script and return { doc, error, logs }.
 * @param source  JS source using the vocabulary above
 * @param opts    { seed, by: { kind, name }, base: document to start from (else a blank one), origin: { x, y } where it lands (for sources) }
 */
export function runScript(source, opts = {}) {
  // Fractions of the artboard by default; units('artboard' | 'fraction') decides explicitly. A score
  // without units() whose coordinates are clearly absolute (beyond 0..1) is rerun in artboard units.
  const explicit = (String(source).match(/\\bunits\\(\\s*['"](fraction|artboard)['"]\\s*\\)/) || [])[1];
  if (explicit) return runOnce(source, { ...opts, units: explicit });
  const first = runOnce(source, { ...opts, units: 'fraction' });
  if (first.maxRaw > 2.5) return runOnce(source, { ...opts, units: 'artboard' });
  return first;
}

function runOnce(source, { seed = 1, by = { kind: 'script', name: 'script' }, base = null, units = 'fraction', target = null, origin = null, fresh = false } = {}) {
  const doc = base ? normalizeDocument(base) : createDocument();
  if (!base) doc.stages = [];
  let rng = mulberry32(seed);
  let noise = makeNoise(rng);
  let current = null;
  let clock = 0; // synthetic time so scripted paths carry an order and a duration
  const abm = String(source).match(/\\bartboard\\(\\s*([\\d.]+)\\s*,\\s*([\\d.]+)/);
  // The board the score draws on unless it says board(…): the main board, or the one given as target.
  const tb = target ? findBoard(doc, target) : null;
  const home = tb && !tb.main ? tb : null;
  const W = abm ? Number(abm[1]) : home ? home.width : doc.artboard.width, H = abm ? Number(abm[2]) : home ? home.height : doc.artboard.height;
  const frac = units === 'fraction';
  // The board marks land on: the main board (the artboard) until board(…) picks another.
  let tgt = home ? { id: home.id, x: home.x, y: home.y, w: W, h: H } : { id: null, x: 0, y: 0, w: W, h: H };
  if (home && abm) { const b = doc.boards.find(x => x.id === home.id); b.width = W; b.height = H; }
  const aspect = () => tgt.w / tgt.h;
  let maxRaw = 0, fitCount = 0, underlayReq = null, maskReq, fxReq;
  // Score coordinates → world units: fractions of the current board (or its own units), at its place.
  const toAb = pts => pts.map(q => {
    const x = +q[0], y = +q[1];
    if (Math.abs(x) > maxRaw) maxRaw = Math.abs(x);
    if (Math.abs(y) > maxRaw) maxRaw = Math.abs(y);
    const ax = frac ? tgt.x + x * tgt.w : tgt.x + x, ay = frac ? tgt.y + y * tgt.h : tgt.y + y;
    return q.length > 2 ? [ax, ay, ...q.slice(2)] : [ax, ay];
  });
  // Marks made in one run share an id stem (unique per run) and count up: cheaper than a fresh
  // random id each, which matters for code that makes thousands of marks per frame.
  const idStem = \`\${Date.now().toString(36)}\${Math.random().toString(36).slice(2, 5)}\`;
  let idCount = 0;
  const markId = role => \`\${role}_\${idStem}\${(idCount++).toString(36)}\`;
  const stageIds = new Map();   // a stage's name or id → its id (looked up once per run)
  let linesInstalled = false;
  const logs = [];

  const ensureStage = () => {
    if (!current) current = api.stage('Marks', 'marks');
    return current;
  };
  const splitOpts = (opts = {}) => {
    const el = {}, params = {};
    for (const k in opts) (ELEMENT_KEYS.has(k) ? el : params)[k] = opts[k];
    return { el, params };
  };
  const timed = (pts, pressure) => {
    const start = clock;
    const out = pts.map((q, i) => {
      const p = typeof pressure === 'function' ? pressure(i / Math.max(1, pts.length - 1), i) : (q[3] ?? pressure ?? 0.5);
      return [q[0], q[1], (q[2] ?? (start + i * 16)) , Math.max(0, Math.min(1, p))];
    });
    clock = start + pts.length * 16 + 120;
    return out;
  };
  const add = (role, pts, opts, defaultBrush) => {
    let ok = Array.isArray(pts) && pts.length > 0;
    for (let i = 0; ok && i < pts.length; i++) { const q = pts[i]; ok = Array.isArray(q) && Number.isFinite(+q[0]) && Number.isFinite(+q[1]); }
    if (!ok) {
      throw new Error(\`\${role}() needs a list of points like [[x, y], [x, y], ...] (got \${Array.isArray(pts) ? \`an array whose items are \${typeof pts[0]}\` : typeof pts}). walk(), circle() and rect() return such lists.\`);
    }
    const { el, params } = splitOpts(opts);
    for (const k in params) {
      const v = params[k];
      if (typeof v !== 'number' && typeof v !== 'string') throw new Error(\`Brush parameter "\${k}" must be a number (got \${typeof v}). For per-point variation use pressures: t => 0..1, or make several marks.\`);
    }
    // stage: an existing stage's id or name (created if new), else the current stage.
    let stage;
    if (el.stage) {
      stage = stageIds.get(el.stage);
      if (!stage || !doc.stages.some(st => st.id === stage)) {
        const named = doc.stages.find(st => st.id === el.stage || st.name === el.stage);
        stage = named ? named.id : api.stage(String(el.stage), 'marks').id;
        stageIds.set(el.stage, stage);
      }
    } else stage = ensureStage().id;
    const brush = el.brush || defaultBrush;
    // The drawing's own brushes: installed on the run's first mark, and again for one not known yet.
    if (!linesInstalled || !BRUSHES[brush]) { installLines(doc); linesInstalled = true; }
    if (!BRUSHES[brush]) throw new Error(\`Unknown brush "\${brush}" (have: \${Object.keys(BRUSHES).join(', ')})\`);
    const e = {
      id: markId(role), stage, role,
      points: timed(toAb(pts), el.pressures),
      closed: role === 'plane' ? true : Boolean(el.closed),
      realize: { brush, params },
      color: el.color || null,
      text: el.text,
      why: el.why || '',
      by: el.by || by,
      seed: el.seed ?? Math.floor(rng() * 1e9),
      created: clock,
      ...(tgt.id ? { board: tgt.id } : {})
    };
    for (const k of EXTRA_KEYS) if (el[k] !== undefined) e[k] = el[k];
    doc.elements.push(e);
    return e.id;
  };

  const api = {
    /** The size and paper of the board the score draws on (the artboard, unless it runs into another board). */
    artboard(width = 1000, height = 1000, ground = '#f3efe6') {
      if (home) { const b = doc.boards.find(x => x.id === home.id); Object.assign(b, { width, height, ground }); return b; }
      doc.artboard = { ...doc.artboard, width, height, ground };
      return doc.artboard;
    },
    /**
     * board(title, { width, height, x, y, ground }): later marks land on this board, made if new
     * (right of the others); coordinates are then fractions of it. board() goes back to the main one.
     * Returns { id, title, width, height }.
     */
    board(key, opts = {}) {
      if (key == null || key === '' || key === 'main') { tgt = { id: null, x: 0, y: 0, w: W, h: H }; return { id: 'main', title: doc.artboard.title || 'Main', width: W, height: H }; }
      doc.boards = Array.isArray(doc.boards) ? doc.boards : [];
      let b = findBoard(doc, key);
      if (!b) {
        const width = Number(opts.width) || W, height = Number(opts.height) || H;
        const place = Number.isFinite(opts.x) && Number.isFinite(opts.y) ? { x: opts.x, y: opts.y, width, height } : nextBoardPlace(doc, width, height);
        b = { id: newBoardId(doc), title: String(key), ...place, ground: opts.ground || doc.artboard.ground };
        doc.boards.push(b);
      }
      tgt = b.main ? { id: null, x: 0, y: 0, w: W, h: H } : { id: b.id, x: b.x, y: b.y, w: b.width, h: b.height };
      return { id: b.id, title: b.title, width: b.width, height: b.height };
    },
    /**
     * source(name): a named source (camera, image, video…) as a sampler, fitted to the current board:
     * color(x, y), value(x, y), rgb(x, y) in fractions; pose, hands, mask(x, y); frame changes with
     * each new sample. Without the source (or outside the studio) it is grey and empty.
     */
    source(name, opts = {}) { return getSource(name, { x: tgt.x + (origin?.x || 0), y: tgt.y + (origin?.y || 0), width: tgt.w, height: tgt.h }, { fit: opts.fit === 'contain' ? 'contain' : 'cover' }); },
    /**
     * fit(source, { shapes, kinds, brush, stage, seed, ground, live }): redraw a source as plane marks by
     * greedy shape fitting. live: true keeps the shapes between runs and replaces a few per new frame
     * (continuous redraw, when the board follows its sources). Returns the number of shapes.
     */
    fit(src, opts = {}) {
      const s = typeof src === 'string' ? api.source(src) : src;
      const key = \`fit:\${by?.name || ''}:\${tgt.id || 'main'}:\${fitCount++}:\${opts.key || ''}\`;
      const res = fitSource(s, tgt.w / tgt.h, { ...opts, advance: fresh && Boolean(opts.live), key, board: (by?.kind === 'code' && by.name) || tgt.id || 'main' });
      const u = (fx, fy) => (frac ? [fx, fy] : [fx * tgt.w, fy * tgt.h]);
      const stageName = opts.stage || 'Fit', why = opts.why || \`fitted to \${s.name}\`, brush = opts.brush || 'flat';
      if (opts.ground !== false) api.plane([u(0, 0), u(1, 0), u(1, 1), u(0, 1)], { color: res.background, brush, path: 'straight', stage: stageName, why: \`\${why}: the ground\` });
      for (const sh of res.shapes) api.plane(sh.points.map(([x, y]) => u(x, y)), { color: sh.color, brush, ...(sh.straight ? { path: 'straight' } : {}), stage: stageName, why });
      return res.shapes.length;
    },
    /**
     * state(name): an object kept between runs of this board's code (a board that follows a source
     * runs again on each frame): for processes that carry on, like a live fit written in code.
     */
    state(name = '') { return streamState(\`state:\${by?.name || ''}:\${tgt.id || 'main'}:\${name}\`); },
    stage(name, kind = 'marks', opts = {}) {
      const k = STAGE_KINDS.includes(kind) ? kind : 'marks';
      let s = doc.stages.find(x => x.name === name);
      if (!s) { s = { id: newId('stage'), name, kind: k, visible: true, locked: false, why: opts.why || '' }; doc.stages.push(s); }
      current = s;
      return s;
    },
    point(x, y, opts = {}) { return add('point', [[x, y]], opts, 'dot'); },
    points(list, opts = {}) { return list.map(([x, y]) => api.point(x, y, opts)); },
    line(pts, opts = {}) { return add('line', pts, opts, 'ink'); },
    plane(pts, opts = {}) { return add('plane', pts, opts, 'flat'); },
    guide(pts, opts = {}) { return add('guide', pts, opts, 'guide'); },
    gesture(pts, opts = {}) { return add('gesture', pts, opts, 'guide'); },
    note(x, y, text, opts = {}) { return add('note', [[x, y]], { ...opts, text }, 'none'); },
    /** A picture placed through its four corners (top-left, top-right, bottom-right, bottom-left): image(corners, { src }). */
    image(corners, opts = {}) { return add('image', corners, opts, 'image'); },
    /**
     * Create a line before drawing it: defineLine(name, [{ doc, params: { key: [min, max, default] } },] (ctx, frames, p, env) => { ... })
     * frames: [{ x, y, nx, ny, speed, pressure }] along the walk; env: { color, rng, closed, points }. Then line(pts, { brush: name }).
     */
    defineLine(name, spec, fn) {
      if (typeof spec === 'function') { fn = spec; spec = {}; }
      if (typeof name !== 'string' || !/^[a-z][\\w-]*$/i.test(name)) throw new Error('defineLine(name, fn): name must be a word like "teeth"');
      if (typeof fn !== 'function') throw new Error('defineLine(name, fn): fn draws the line: (ctx, frames, p, env) => { ... }');
      if (BRUSHES[name] && !BRUSHES[name].custom) throw new Error(\`"\${name}" is a built-in brush; choose another name\`);
      doc.lines = doc.lines || {};
      doc.lines[name] = { source: fn.toString(), doc: spec.doc || '', params: spec.params || {} };
      installLines(doc);
      return name;
    },
    /**
     * Define a brush in code (kept in the drawing): brush({ id, label, roles, doc,
     * params: { key: [min, max, default, doc] }, draw(ctx, e, p, k) { … } }). Then line(pts, { brush: id }).
     */
    brush(def) {
      if (!def || typeof def !== 'object' || typeof def.draw !== 'function') throw new Error('brush({ id, params, draw(ctx, e, p, k) { … } })');
      if (isBuiltin(def.id)) throw new Error(\`"\${def.id}" is a built-in brush; give yours its own id\`);
      const src = defSource(def);
      registerBrush(src, 'doc');
      doc.brushes = doc.brushes || {};
      doc.brushes[def.id] = src;
      return def.id;
    },
    decide(question, options, chosen, why = '') {
      doc.decisions.push({ id: newId('dec'), stage: ensureStage().id, question, options, chosen, why, by, t: clock });
      return chosen;
    },
    /** A line going for a walk: heading in degrees, turn(i, t) returns degrees to turn each step. */
    walk({ from = [0, 0], heading = 0, steps = 50, step = frac ? 0.01 : 10, turn = () => 0 } = {}) {
      const pts = [[from[0], from[1]]];
      let [x, y] = from, h = heading;
      for (let i = 0; i < steps; i++) {
        h += turn(i, i / Math.max(1, steps - 1)) || 0;
        const a = (h * Math.PI) / 180;
        x += Math.cos(a) * step; y += Math.sin(a) * step * (frac ? aspect() : 1);   // in fractions, keep the walk's shape
        pts.push([x, y]);
      }
      return pts;
    },
    circle(cx, cy, r, n = 48) { const ry = frac ? r * aspect() : r; return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * ry]); },
    units() { /* read before the run: units('fraction') or units('artboard') */ },
    width: W, height: H,
    /** The four corners; with round (0 to 1, 1 a pill) each corner is an arc, baked into the points (draw it with path: 'straight'). */
    rect(x, y, w, h, round = 0) {
      const t = Math.min(Math.max(+round || 0, 0), 1);
      if (!t) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      const x0 = Math.min(x, x + w), x1 = Math.max(x, x + w), y0 = Math.min(y, y + h), y1 = Math.max(y, y + h), asp = frac ? aspect() : 1;
      const rx = t * Math.min(x1 - x0, (y1 - y0) / asp) / 2, ry = rx * asp, pts = [];   // (in fractions the arc keeps its shape)
      for (const [cx, cy, a0] of [[x1 - rx, y0 + ry, -Math.PI / 2], [x1 - rx, y1 - ry, 0], [x0 + rx, y1 - ry, Math.PI / 2], [x0 + rx, y0 + ry, Math.PI]]) {
        for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
      }
      return pts;
    },
    random(a, b) { const r = rng(); if (a === undefined) return r; if (b === undefined) return r * a; return a + r * (b - a); },
    noise(x, y) { return noise(x, y); },
    seed(n) { rng = mulberry32(n); noise = makeNoise(rng); },
    lerp: (a, b, t) => a + (b - a) * t,
    map: (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c),
    range: n => Array.from({ length: n }, (_, i) => i),
    sin: Math.sin, cos: Math.cos, abs: Math.abs, min: Math.min, max: Math.max, sqrt: Math.sqrt, floor: Math.floor, round: Math.round,
    PI: Math.PI, TAU: Math.PI * 2,
    /**
     * underlay({ source, opacity, blend, fit }): the source shown under the board this code draws on
     * (a reference, not part of the picture): which, how much (0..1; 0 hides it), how it mixes with the
     * paper. Sliders on the numbers in the code control it live. underlay(null) takes it away.
     */
    underlay(o = {}) { underlayReq = o === null ? { source: null } : { ...(underlayReq || {}), ...o }; },
    /**
     * mask(true): crop this board's marks to the board (the default mask: its own rectangle); mask(false) takes every mask away.
     * mask({ source: 'cam', mode: 'luma', invert, feather, fx: [...] }): show the board through a source (or { board: 'Shape' }, a board of marks).
     */
    mask(on = true) { maskReq = on && typeof on === 'object' ? { ...on } : Boolean(on); },
    /** fx([{ type: 'threshold', level: 0.5 }, 'invert', …]): post effects on this board's picture (fx([]) takes them away). */
    fx(list = []) { fxReq = Array.isArray(list) ? list.map(x => (typeof x === 'string' ? { type: x } : { ...x })) : []; },
    print: (...a) => logs.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))
  };

  try {
    // eslint-disable-next-line no-new-func
    // The score runs in its own block, so it may declare names that shadow the vocabulary.
    new Function(...Object.keys(api), \`"use strict";\\n{\\n\${source}\\n}\`)(...Object.values(api));
    if (!doc.stages.length) api.stage('Marks', 'marks');
    doc.meta = { ...(doc.meta || {}), script: source, seed, by, ran: new Date().toISOString() };
    doc.meta.units = units;
    return { doc: normalizeDocument(doc, { own: true }), error: null, logs, maxRaw, units, underlay: underlayReq, mask: maskReq, fx: fxReq };
  } catch (err) {
    // The score's own line: V8 counts the Function header (2 lines) and our wrapper (2 lines).
    const m = String(err.stack || '').match(/<anonymous>:(\\d+):(\\d+)/);
    const errorLine = m ? Math.max(1, Number(m[1]) - 4) : null;
    return { doc: null, error: err.message || String(err), errorLine, logs, maxRaw: 0, units };
  }
}

/**
 * Run a score into a drawing: it replaces the marks of one board (the main one unless given) and
 * leaves the other boards and the blackboard as they are. board(…) in the score still reaches (or
 * makes) other boards. Returns runScript's result, with the whole drawing as doc.
 */
export function runScoreInto(doc, source, { board = 'main', seed = 1, by } = {}) {
  const b = findBoard(doc, board) || findBoard(doc, 'main');
  const base = { ...structuredClone(doc), elements: doc.elements.filter(e => (e.board || 'main') !== b.id).map(e => structuredClone(e)) };
  return runScript(source, { seed, by, base, target: b.id });
}

/** Short reference shown in the Script panel and given to models. */
export const SCRIPT_REFERENCE = \`// Coordinates are fractions of the artboard (0..1); width and height give its size. units('artboard') for absolute.
artboard(w, h, ground)
stage(name, kind)            kind: \${STAGE_KINDS.join(' | ')}
board(title, {width, height})   later marks land on this board (made if new); fractions are of this board. board() = main
source(name, { fit })   a camera / image / video: .color(x, y) .value(x, y) .rgb(x, y) .pose .hands .mask(x, y) .frame (fit: 'cover' crops, 'contain' letterboxes)
fit(source, {shapes, kinds, brush, stage, live})   redraw a source as plane marks (live: continuous)
point(x, y, {size, color, why})
line(points, {brush, width, pressure, taper, wobble, color, why, pressures: t => 0..1, time: {in, hold, out, life, draw, curve, loop}})
plane(points, {brush: flat | hatch | stipple | wash, angle, spacing, density, color, why})   line brushes: ink charcoal chalk pencil bristles marker ...
guide(points, {why})   gesture(points, {why})   note(x, y, text)
decide(question, options, chosen, why)
brush({id, label, roles, doc, params: {k: [min, max, def, doc]}, draw(ctx, e, p, k) {...}})   then line(pts, {brush: id})
  k: frames(e) smoothPath spans rotatePts segment beginInk tracePath draw(id, ctx, e, p) rng() noise(x, y) age
  textured: k.paint(ctx, {key, bounds, draw(l), grain, color, alpha}) dabs hairs wash bounds hash grain
defineLine(name, {doc, params: {k: [min, max, def]}}, (ctx, frames, p, env) => {...})   (shorthand)
  frames: [{x, y, nx, ny, speed, pressure}]   env: {color, rng, closed}
walk({from, heading, steps, step, turn: (i, t) => degrees})
circle(cx, cy, r, n = 48)   rect(x, y, w, h, round = 0)   round 0..1 rounds the corners (1 is a pill); draw it with path: 'straight'
random(a, b)  noise(x, y)  seed(n)  lerp  map  range(n)  sin cos PI TAU  print(...)\`;

/** The vocabulary as data: completions and hover docs in the editor, and references for models. */
export const SCRIPT_VOCAB = [
  ['artboard', 'artboard(width, height, ground)', 'Size of the sheet and its paper color.'],
  ['width', 'width', 'The artboard width in artboard units (coordinates are fractions: 0..1 across).'],
  ['height', 'height', 'The artboard height in artboard units (coordinates are fractions: 0..1 down).'],
  ['units', "units('fraction' | 'artboard')", "Coordinates as fractions of the artboard (the default) or in artboard units."],
  ['brush', "brush({ id, label, roles, doc, params: { key: [min, max, default, doc] }, draw(ctx, e, p, k) { … } })", 'Define a brush in code (the drawing keeps it). k is the brush kit: k.frames, k.smoothPath, k.spans, k.segment, k.beginInk, k.rng, k.noise, k.draw.'],
  ['board', "board(title, { width, height, x, y, ground })", 'Later marks land on this board (made if new, right of the others); coordinates are fractions of it. board() goes back to the main board. Returns { id, title, width, height }.'],
  ['source', "source(name)", 'A named source (Sources panel: camera, image, video): .color(x, y), .value(x, y) 0..1, .rgb(x, y), .pose [[{x, y, v}]], .hands [[{x, y}]], .face [{points: [{x, y, z}] × 478, blend: {smile, jawOpen, blink…}, box}], .track(\\'pose\\' | \\'hands\\' | \\'face\\'), .mask(x, y), .point(name), .frame. Fractions of the board.'],
  ['fit', "fit(source, { shapes: 80, kinds: ['rect', 'triangle', 'circle'], quality: 'fine' | 'fast', brush, stage, seed, ground, live })", 'Redraw a source as plane marks by greedy shape fitting (in the background: the board shows the last fit until the next is ready). quality: \\'fast\\' is about ten times cheaper (rectangles and circles, the p5 export\\'s fitter). live: true keeps the shapes and replaces a few per new frame (continuous, with a board that follows its sources).'],
  ['state', "state(name)", 'An object kept between runs of the board\\'s code (it runs again on each frame of a source it follows): keep what a process carries on with, e.g. the shapes of a live fit.'],
  ['stage', "stage(name, kind)", \`Start a stage; later marks land in it. kind: \${STAGE_KINDS.join(', ')}.\`],
  ['point', 'point(x, y, { size, color, why })', 'A mark at a place.'],
  ['points', 'points([[x, y], …], opts)', 'Several points with the same options.'],
  ['line', "line(points, { brush, width, pressure, taper, wobble, color, why, pressures: t => 0..1 })", 'A point that moved. Brushes: ink, speed, restate, zigzag, inner, dotted, arcs, or your own (defineLine).'],
  ['plane', "plane(points, { brush: 'flat' | 'hatch' | 'stipple', angle, spacing, density, color, why })", 'An enclosed area.'],
  ['guide', 'guide(points, { why })', 'Construction: axes, proportions (process view only).'],
  ['gesture', 'gesture(points, { why })', 'The movement behind a form (process view only).'],
  ['note', 'note(x, y, text)', 'Writing on the process.'],
  ['decide', 'decide(question, options, chosen, why)', 'Record a decision; returns the chosen option.'],
  ['defineLine', 'defineLine(name, { doc, params: { key: [min, max, default] } }, (ctx, frames, p, env) => { … })', 'Create your own line. frames: [{ x, y, nx, ny, speed, pressure }]; env: { color, rng, closed }. Then line(pts, { brush: name }).'],
  ['walk', 'walk({ from: [x, y], heading, steps, step, turn: (i, t) => degrees })', 'A line going for a walk: returns its points.'],
  ['circle', 'circle(cx, cy, r, n = 48)', 'Points around a circle.'],
  ['rect', 'rect(x, y, w, h, round = 0)', 'The four corners of a rectangle; round (0 to 1, 1 a pill) rounds them, baked into the points: draw it with path: \\'straight\\'.'],
  ['random', 'random(a, b)', 'Seeded random: random() 0..1, random(b) 0..b, random(a, b).'],
  ['noise', 'noise(x, y)', 'Seeded smooth noise, about -1..1.'],
  ['seed', 'seed(n)', 'Reseed random() and noise().'],
  ['lerp', 'lerp(a, b, t)', 'Linear interpolation.'],
  ['map', 'map(v, a, b, c, d)', 'Map v from a..b to c..d.'],
  ['range', 'range(n)', '[0, 1, …, n-1]'],
  ['mask', "mask(true | false | { source | board, mode, invert, feather, fx })", 'mask(true) crops this board\\'s marks to the board (its own rectangle; by default marks may go past the paper); mask({ source: \\'cam\\', mode: \\'luma\\' | \\'alpha\\', invert, feather, fx }) shows the board through a source, or through a board of marks ({ board: \\'Shape\\' }); mask(false) takes masks away.'],
  ['fx', "fx([{ type: 'threshold', level: 0.5 }, 'invert', …])", 'Post effects on this board\\'s picture, opt-in: threshold, levels, contrast, brightness, invert, posterize, gradient (stops), blur, pixelate. fx([]) takes them away.'],
  ['underlay', "underlay({ source, opacity, blend, fit })", 'The source shown under this board (a reference, not part of the picture): which, opacity 0..1 (0 hides it), blend (multiply, screen…), fit (cover | contain). underlay(null) takes it away. Put the numbers in code with /* 0..1 */ and they get sliders.'],
  ['print', 'print(...values)', 'Write to the output under the editor.'],
  ['sin', 'sin(a)', ''], ['cos', 'cos(a)', ''], ['abs', 'abs(v)', ''], ['min', 'min(...v)', ''], ['max', 'max(...v)', ''],
  ['sqrt', 'sqrt(v)', ''], ['floor', 'floor(v)', ''], ['round', 'round(v)', ''], ['PI', 'PI', 'π'], ['TAU', 'TAU', '2π']
].map(([name, signature, doc]) => ({ name, signature, doc }));
`,me=n=>String(n??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),fe=n=>Math.round(n*100)/100;class pc{constructor(){this.out=[],this.state={fillStyle:"#000",strokeStyle:"#000",lineWidth:1,globalAlpha:1,dash:[],lineCap:"butt",lineJoin:"miter"},this.stack=[],this.d=""}get fillStyle(){return this.state.fillStyle}set fillStyle(e){this.state.fillStyle=e}get strokeStyle(){return this.state.strokeStyle}set strokeStyle(e){this.state.strokeStyle=e}get lineWidth(){return this.state.lineWidth}set lineWidth(e){this.state.lineWidth=e}get globalAlpha(){return this.state.globalAlpha}set globalAlpha(e){this.state.globalAlpha=e}get lineCap(){return this.state.lineCap}set lineCap(e){this.state.lineCap=e}get lineJoin(){return this.state.lineJoin}set lineJoin(e){this.state.lineJoin=e}set font(e){this.state.font=e}setLineDash(e){this.state.dash=e}save(){this.stack.push({...this.state})}restore(){this.state=this.stack.pop()||this.state}beginPath(){this.d=""}moveTo(e,t){this.d+=`M${fe(e)} ${fe(t)}`}lineTo(e,t){this.d+=`L${fe(e)} ${fe(t)}`}closePath(){this.d+="Z"}arc(e,t,o){this.d+=`M${fe(e-o)} ${fe(t)}a${fe(o)} ${fe(o)} 0 1 1 ${fe(2*o)} 0a${fe(o)} ${fe(o)} 0 1 1 ${fe(-2*o)} 0`}fill(){this.out.push(`<path d="${this.d}" fill="${me(this.state.fillStyle)}"${this.state.globalAlpha<1?` fill-opacity="${this.state.globalAlpha}"`:""}/>`)}stroke(){const e=this.state;this.out.push(`<path d="${this.d}" fill="none" stroke="${me(e.strokeStyle)}" stroke-width="${fe(e.lineWidth)}"${e.globalAlpha<1?` stroke-opacity="${e.globalAlpha}"`:""}${e.dash.length?` stroke-dasharray="${e.dash.map(fe).join(" ")}"`:""}${e.lineCap!=="butt"?` stroke-linecap="${e.lineCap}"`:""}${e.lineJoin&&e.lineJoin!=="miter"?` stroke-linejoin="${e.lineJoin}"`:""}/>`)}fillRect(e,t,o,i){this.out.push(`<rect x="${fe(e)}" y="${fe(t)}" width="${fe(o)}" height="${fe(i)}" fill="${me(this.state.fillStyle)}"/>`)}strokeRect(){}fillText(){}measureText(e){return{width:String(e).length*7}}}function Bt(n,{mode:e="process"}={}){n=Me(n);const{width:t,height:o,ground:i}=n.artboard,s=[`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${o}" viewBox="0 0 ${t} ${o}" data-ams-type="ams-process" data-ams-version="${n.version}" data-ams-title="${me(n.title)}">`];s.push(`  <rect data-ams-ground="1" width="${t}" height="${o}" fill="${me(i)}"/>`),n.decisions.length&&s.push(`  <desc data-ams-decisions='${me(JSON.stringify(n.decisions))}'>${me(n.decisions.map(r=>`${r.question} → ${r.chosen}${r.why?` (${r.why})`:""}`).join(`
`))}</desc>`),n.meta?.script&&s.push(`  <metadata data-ams-script='${me(JSON.stringify(n.meta.script))}'/>`),sn(n);for(const r of n.stages){s.push(`  <g data-ams-stage="${me(r.id)}" data-ams-name="${me(r.name)}" data-ams-kind="${me(r.kind)}"${r.visible?"":' display="none"'}>`);for(const a of n.elements.filter(l=>l.stage===r.id&&!l.hidden)){const l=Z[a.realize.brush]||Z.ink,d=l.construction||a.role==="guide"||a.role==="gesture"||a.role==="note",c=new pc;if(!d||e==="process")if(a.role==="image"){const[u,f,,p]=a.points;u&&f&&p&&a.src&&c.out.push(`<image href="${me(a.src)}" x="0" y="0" width="1" height="1" preserveAspectRatio="none" transform="matrix(${[f[0]-u[0],f[1]-u[1],p[0]-u[0],p[1]-u[1],u[0],u[1]].map(fe).join(" ")})"${(a.realize.params?.opacity??1)<1?` opacity="${a.realize.params.opacity}"`:""}/>`)}else if(a.role==="note")c.out.push(sl(a,me,fe));else{const u=d&&!l.construction?"guide":a.realize.brush,f=Pe(u,a.realize.params),p={rng:vt(a.seed||1),scale:1},m=!d&&a.fill&&a.points.length>2&&a.closed&&a.role!=="plane",b=()=>{c.fillStyle=a.fill,De.tracePath(c,De.smoothPath(a.points,!0),!0),c.fill()};!d&&a.color==="none"?a.fill&&a.role==="plane"?Z[u].draw(c,{...a,color:a.fill},f,p):m&&b():!d&&a.fill&&a.role==="plane"?(Z[u].draw(c,{...a,color:a.fill},f,p),a.color&&(c.strokeStyle=a.color,c.lineWidth=2,De.tracePath(c,De.smoothPath(a.points,!0),!0),c.stroke())):(m&&b(),Z[u].draw(c,a,f,p))}const h={...a};s.push(`    <g data-ams-id="${me(a.id)}" data-ams-role="${a.role}" data-ams-brush="${me(a.realize.brush)}" data-ams-record='${me(JSON.stringify(h))}'${a.why?` data-ams-why="${me(a.why)}"`:""}${(a.opacity??1)<1?` opacity="${a.opacity}"`:""}${a.blend&&a.blend!=="normal"?` style="mix-blend-mode:${me(a.blend)}"`:""}>`),a.why&&s.push(`      <title>${me(a.why)}</title>`);for(const u of c.out)s.push(`      ${u}`);s.push("    </g>")}s.push("  </g>")}return s.push("</svg>"),s.join(`
`)}const fc=n=>n.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");function xo(n){const e=(d,c)=>{const h=d.match(new RegExp(`${c}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));return h?fc(h[1]??h[2]):null},t=n.match(/<svg[^>]*>/)?.[0]||"",o=(e(t,"viewBox")||"").split(/[\s,]+/).map(Number),i=Xe({width:o[2]||Number(e(t,"width"))||1e3,height:o[3]||Number(e(t,"height"))||1e3});i.title=e(t,"data-ams-title")||i.title;const s=n.match(/<rect[^>]*data-ams-ground[^>]*>/)?.[0];s&&(i.artboard.ground=e(s,"fill")||i.artboard.ground);const r=n.match(/<desc[^>]*data-ams-decisions[^>]*>/)?.[0];if(r)try{i.decisions=JSON.parse(e(r,"data-ams-decisions"))}catch{}const a=n.match(/<metadata[^>]*data-ams-script[^>]*>/)?.[0];if(a)try{i.meta.script=JSON.parse(e(a,"data-ams-script"))}catch{}const l=[...n.matchAll(/<g[^>]*data-ams-stage=[^>]*>/g)].map(d=>({id:e(d[0],"data-ams-stage"),name:e(d[0],"data-ams-name"),kind:e(d[0],"data-ams-kind")||"marks",visible:!/display="none"/.test(d[0]),locked:!1}));return l.length&&(i.stages=l),i.elements=[...n.matchAll(/<g[^>]*data-ams-record=[^>]*>/g)].map(d=>{try{return JSON.parse(e(d[0],"data-ams-record"))}catch{return null}}).filter(Boolean),Me(i)}function Ks(n){n=Me(n);const e=new Map(n.stages.map(s=>[s.id,s.name])),t=Date.now(),o=(s,r,a,l,d,c)=>({id:s.id,type:r,x:a,y:l,width:d,height:c,angle:0,strokeColor:s.color||"#1e1e1e",backgroundColor:"transparent",fillStyle:"solid",strokeWidth:2,strokeStyle:"solid",roughness:0,opacity:100,groupIds:[`stage:${s.stage}`],frameId:null,roundness:null,seed:s.seed%2147483647,version:1,versionNonce:s.seed%1000003,isDeleted:!1,boundElements:null,updated:t,link:null,locked:!1,customData:{ams:s,amsStage:e.get(s.stage)}});return{type:"excalidraw",version:2,source:"artist-model-studio",elements:n.elements.map(s=>{const r=s.points.map(f=>f[0]),a=s.points.map(f=>f[1]),l=Math.min(...r),d=Math.min(...a),c=Math.max(...r)-l,h=Math.max(...a)-d,u=s.points.map(([f,p])=>[f-l,p-d]);if(s.role==="note")return{...o(s,"text",l,d,220,20),text:s.text||s.why,originalText:s.text||s.why,fontSize:16,fontFamily:1,textAlign:"left",verticalAlign:"top",containerId:null,lineHeight:1.25};if(s.role==="point"){const f=Number(s.realize.params.size)||12;return{...o(s,"ellipse",l-f/2,d-f/2,f,f),backgroundColor:s.color||"#1e1e1e"}}return s.role==="plane"?{...o(s,"line",l,d,c,h),points:[...u,u[0]],backgroundColor:s.color||"#8a8175",lastCommittedPoint:null,startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:null}:s.role==="guide"||s.role==="gesture"?{...o(s,"line",l,d,c,h),strokeStyle:"dashed",strokeWidth:1,points:u,lastCommittedPoint:null,startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:null}:{...o(s,"freedraw",l,d,c,h),points:u,pressures:s.points.map(f=>f[3]),simulatePressure:!1,lastCommittedPoint:null}}),appState:{viewBackgroundColor:n.artboard.ground},files:{}}}function kr(n){const e=typeof n=="string"?JSON.parse(n):n,t=Xe(),o=(e.elements||[]).filter(c=>!c.isDeleted);if(!o.length)return t;const i=new Map,s=c=>{const h=c.customData?.amsStage||"Imported";return i.has(h)||i.set(h,{id:c.customData?.ams?.stage||`stage_${i.size}`,name:h,kind:"marks",visible:!0,locked:!1}),i.get(h).id};t.elements=o.map(c=>{if(c.customData?.ams)return s(c),c.customData.ams;const h=s(c),u=(c.points||[[0,0]]).map(([f,p],m)=>[c.x+f,c.y+p,m*16,c.pressures?.[m]??.5]);if(c.type==="text")return Ne({role:"note",stage:h,points:[[c.x,c.y]],text:c.text},h);if(c.type==="ellipse"||c.type==="rectangle"||c.type==="diamond"){const f=[[c.x,c.y],[c.x+c.width,c.y],[c.x+c.width,c.y+c.height],[c.x,c.y+c.height]];return Ne({role:"plane",stage:h,points:f,color:c.backgroundColor!=="transparent"?c.backgroundColor:null},h)}return c.type==="line"&&c.backgroundColor&&c.backgroundColor!=="transparent"?Ne({role:"plane",stage:h,points:u,color:c.backgroundColor},h):c.type==="line"||c.type==="arrow"?Ne({role:c.strokeStyle==="dashed"?"guide":"line",stage:h,points:u,color:c.strokeColor},h):Ne({role:"line",stage:h,points:u,color:c.strokeColor,realize:{brush:"ink",params:{width:c.strokeWidth*1.5}}},h)}),t.stages=[...i.values()];const r=t.elements.flatMap(c=>c.points.map(h=>h[0])),a=t.elements.flatMap(c=>c.points.map(h=>h[1])),l=Math.min(...r)-40,d=Math.min(...a)-40;for(const c of t.elements)c.points=c.points.map(([h,u,f,p])=>[h-l,u-d,f,p]);return t.artboard.width=Math.max(200,Math.round(Math.max(...r)-l+40)),t.artboard.height=Math.max(200,Math.round(Math.max(...a)-d+40)),t.artboard.ground=e.appState?.viewBackgroundColor||t.artboard.ground,Me(t)}const Ke=n=>n.replace(/^import[^;]*;\s*$/gm,"").replace(/^export\s+\{[^}]*\};?\s*$/gm,"").replace(/^export\s+(default\s+)?/gm,"");function xr(n,{title:e=n.title||"Artist Model Studio sketch"}={}){n=Me(n);const t=n.meta?.script,o=n.stages.map((a,l)=>`//   ${l+1}. ${a.name} (${a.kind})${a.why?` — ${a.why}`:""}`).join(`
`),i=n.decisions.map(a=>`//   ${a.question} → ${a.chosen}${a.why?`  (${a.why})`:""}`).join(`
`),s=`// ${e}
// Exported from Artist Model Studio on ${new Date().toISOString().slice(0,10)}.
// The process is kept: stages, decisions, and each element's reason.
//
// Stages:
${o||"//   (none)"}
${i?`//
// Decisions:
${i}
`:""}//
// Keys: P toggles the process view (construction and notes), 1–9 show the picture
// up to that stage, 0 shows everything, R re-runs the score with a new seed, S saves a PNG.
`,r=t?`// ---- The score: edit it and reload. Running it records the process. ----
const SCORE = ${JSON.stringify(t)};
`:`const SCORE = null; // hand-drawn: the process below is the record
`;return`${s}
${r}const PROCESS = ${JSON.stringify(n)};

let doc = PROCESS, mode = 'picture', upTo = Infinity, seedN = PROCESS.meta?.seed || 1;

function setup() {
  // The recorded drawing, with its own brushes and lines registered (normalizing installs them).
  doc = normalizeDocument(PROCESS);
  createCanvas(doc.artboard.width, doc.artboard.height);
  noLoop();
}

// R: the score runs again with a new seed, on this artboard (the recorded drawing is shown until then).
function rerun(s) {
  const out = runScript(SCORE, { seed: s, base: { ...PROCESS, elements: [], decisions: [], stages: [] } });
  if (out.doc) doc = out.doc; else console.warn(out.error);
}

function draw() {
  clear();
  renderDocument(drawingContext, doc, { mode, upTo, transform: { x: 0, y: 0, scale: 1 } });
}

function keyPressed() {
  if (key === 'p' || key === 'P') mode = mode === 'picture' ? 'process' : 'picture';
  else if (key >= '1' && key <= '9') upTo = Number(key) - 1;
  else if (key === '0') upTo = Infinity;
  else if ((key === 'r' || key === 'R') && SCORE) { seedN = Math.floor(Math.random() * 1e6); rerun(seedN); }
  else if (key === 's' || key === 'S') saveCanvas('ams-sketch', 'png');
  redraw();
}

// ---- Artist Model Studio process runtime (unchanged library code) ----
${Ke(ac)}
${Ke(br)}
${Ke(lc)}
${Ke(yr)}
${Ke(wr)}
${Ke(cc)}
${Ke(hc)}
${Ke(dc)}
${Ke(uc)}
`}function mc(n="Artist Model Studio sketch",e="2"){return`<!doctype html>
<html><head><meta charset="utf-8"><title>${me(n)}</title>
<script src="https://cdn.jsdelivr.net/npm/p5@${e==="1"?"1":"2"}/lib/p5.min.js"><\/script>
<style>html,body{margin:0;background:#222;display:grid;place-items:center;min-height:100vh}</style>
</head><body><script src="sketch.js"><\/script></body></html>`}function vr(n,{cell:e=260}={}){n=Me(n);const t=n.stages.filter(p=>p.visible),o=Math.min(4,t.length+1),i=Math.ceil((t.length+1)/o),s=e/Math.max(n.artboard.width,n.artboard.height),r=Math.round(n.artboard.width*s),a=Math.round(n.artboard.height*s),l=16,d=22,c=n.decisions.length?22+n.decisions.length*18:0,h=document.createElement("canvas");h.width=l+o*(r+l),h.height=l+i*(a+d+l)+c+34;const u=h.getContext("2d");if(u.fillStyle="#faf8f4",u.fillRect(0,0,h.width,h.height),u.fillStyle="#1d1b19",u.font="600 15px Inter, sans-serif",u.fillText(n.title||"Process sheet",l,24),[...t.map((p,m)=>({s:p,i:n.stages.indexOf(p),mode:"process"})),{s:{name:"Picture"},i:1/0,mode:"picture"}].forEach((p,m)=>{const b=l+m%o*(r+l),g=34+Math.floor(m/o)*(a+d+l);u.drawImage(Vt(n,{scale:s,mode:p.mode,upTo:p.i}),b,g+d),u.fillStyle="#1d1b19",u.font="12px Inter, sans-serif",u.fillText(`${Number.isFinite(p.i)?`${m+1}. `:""}${p.s.name}`,b,g+15)}),c){let p=h.height-c-8;u.font="600 12px Inter, sans-serif",u.fillText("Decisions",l,p),p+=18,u.font="12px Inter, sans-serif";for(const m of n.decisions)u.fillText(`${m.question} → ${m.chosen}${m.why?`  (${m.why})`:""}`,l,p),p+=18}return h}function gc(n){if(!n)return{version:1,actions:[]};let e=[];Array.isArray(n)?e=n:typeof n=="object"&&(Array.isArray(n.actions)?e=n.actions:Array.isArray(n.program)?e=n.program:Array.isArray(n.drawing)&&(e=n.drawing));const t=e.map(o=>bc(o)).filter(Boolean);return{version:n.version||1,actions:t}}function bc(n){if(!n||typeof n!="object")return null;let t=(n.op||n.type||n.command||"").trim().toLowerCase();(t==="bleed"||t==="brush_bleed")&&(t="brush.bleed"),(t==="texture"||t==="brush_texture")&&(t="brush.texture"),(t==="hatch"||t==="brush_hatch")&&(t="brush.hatch"),(t==="weight"||t==="strokeweight"||t==="brush_weight")&&(t=n.brush?"brush.weight":"strokeWidth"),t==="strokewidth"&&(t="strokeWidth"),t==="nofill"&&(t="noFill"),t==="nostroke"&&(t="noStroke"),(t==="mirror_x"||t==="mirrorx")&&(t="mirrorX"),(t==="mirror_y"||t==="mirrory")&&(t="mirrorY");const o={op:t};switch(n.color!==void 0&&(o.color=n.color),n.opacity!==void 0&&(o.opacity=Number(n.opacity)),t){case"background":case"clear":o.color===void 0&&n.fill!==void 0&&(o.color=n.fill);break;case"fill":n.opacity!==void 0&&(o.opacity=Number(n.opacity)),n.bleed!==void 0&&(o.bleed=Number(n.bleed)),n.texture!==void 0&&(o.texture=Number(n.texture));break;case"stroke":n.width!==void 0&&(o.width=Number(n.width));break;case"strokeWidth":case"brush.weight":o.width=Number(n.width??n.weight??n.value??1);break;case"brush.bleed":o.amount=Number(n.amount??n.value??n.bleed??.2);break;case"brush.texture":o.amount=Number(n.amount??n.value??n.texture??.5);break;case"brush.hatch":o.distance=Number(n.distance??n.spacing??10),o.angle=Number(n.angle??45),n.style&&(o.style=n.style);break;case"circle":o.x=Number(n.x??0),o.y=Number(n.y??0),n.diameter!==void 0?o.diameter=Number(n.diameter):n.radius!==void 0||n.r!==void 0?o.diameter=Number(n.radius??n.r)*2:n.d!==void 0?o.diameter=Number(n.d):o.diameter=.2;break;case"rect":o.x=Number(n.x??0),o.y=Number(n.y??0),o.width=Number(n.width??n.w??.2),o.height=Number(n.height??n.h??.2),n.color!==void 0&&(o.color=n.color),n.fill!==void 0&&(o.fill=!!n.fill);break;case"line":o.x1=Number(n.x1??0),o.y1=Number(n.y1??0),o.x2=Number(n.x2??0),o.y2=Number(n.y2??0),n.color!==void 0&&(o.color=n.color);break;case"polygon":case"polyline":Array.isArray(n.points)?o.points=n.points.map(i=>Array.isArray(i)?[Number(i[0]),Number(i[1])]:typeof i=="object"&&i!==null?[Number(i.x),Number(i.y)]:[0,0]):o.points=[],n.color!==void 0&&(o.color=n.color);break;case"pixel":o.x=Math.round(Number(n.x??0)),o.y=Math.round(Number(n.y??0)),o.color=n.color??0;break;case"hline":o.y=Math.round(Number(n.y??0)),o.x1=Math.round(Number(n.x1??0)),o.x2=Math.round(Number(n.x2??0)),o.color=n.color??0;break;case"vline":o.x=Math.round(Number(n.x??0)),o.y1=Math.round(Number(n.y1??0)),o.y2=Math.round(Number(n.y2??0)),o.color=n.color??0;break;case"comment":o.text=String(n.text??n.comment??n.note??"");break;case"palette":o.colors=Array.isArray(n.colors)?n.colors:[];break;case"mirrorX":o.enabled=n.enabled!==void 0?!!n.enabled:!0;break;case"mirrorY":o.enabled=n.enabled!==void 0?!!n.enabled:!0;break;default:Object.assign(o,n),o.op=t;break}return n.note!==void 0&&t!=="comment"&&(o.note=String(n.note)),o}function vo(n,{width:e=1e3,height:t=1e3,title:o="Converted drawing"}={}){const i=gc(n),s=Xe({width:e,height:t,title:o});s.stages=[];const r=b=>(b+1)*.5*e,a=b=>(b+1)*.5*t,l=b=>b*.5*Math.min(e,t);let d=null;const c=b=>{let g=s.stages.find(w=>w.name===b);g||(g={id:xe("stage"),name:b,kind:"marks",visible:!0,locked:!1},s.stages.push(g)),d=g};let h={on:!0,color:"#333333",opacity:1},u={on:!1,color:"#111111",width:1,opacity:1};const f=(b,g,w)=>Array.from({length:40},(y,S)=>[b+Math.cos(S/40*Math.PI*2)*w,g+Math.sin(S/40*Math.PI*2)*w]),p=(b,g,w)=>{d||c("Marks"),s.elements.push({id:xe(b),stage:d.id,role:b,points:g.map(([y,S],k)=>[y,S,k*16,.5]),by:{kind:"model",name:"converted"},...w})},m=(b,g)=>{(h.on||g.color)&&p("plane",b,{color:g.color||h.color,realize:{brush:"flat",params:{opacity:h.opacity}},why:g.note||""}),u.on&&p("line",[...b,b[0]],{color:u.color,realize:{brush:"ink",params:{width:u.width*e/400,pressure:0,taper:0,opacity:u.opacity}},why:g.note||""})};for(const b of i.actions)switch(b.op){case"comment":c(b.text||"Part");break;case"background":case"clear":s.artboard.ground=typeof b.color=="string"?b.color:s.artboard.ground;break;case"fill":h={on:!0,color:b.color||"#000",opacity:b.opacity??h.opacity};break;case"noFill":h={...h,on:!1};break;case"stroke":u={on:!0,color:b.color||"#000",width:b.width??u.width,opacity:b.opacity??u.opacity};break;case"noStroke":u={...u,on:!1};break;case"strokeWidth":u={...u,width:b.width??1};break;case"circle":m(f(r(b.x),a(b.y),l(b.diameter)/2),b);break;case"rect":{const g=l(b.width),w=l(b.height),y=r(b.x)-g/2,S=a(b.y)-w/2;m([[y,S],[y+g,S],[y+g,S+w],[y,S+w]],b);break}case"polygon":b.points?.length>=3&&m(b.points.map(([g,w])=>[r(g),a(w)]),b);break;case"line":p("line",[[r(b.x1),a(b.y1)],[r(b.x2),a(b.y2)]],{color:b.color||u.color,realize:{brush:"ink",params:{width:u.width*e/400,pressure:0,taper:0}},why:b.note||""});break;case"polyline":b.points?.length>=2&&p("line",b.points.map(([g,w])=>[r(g),a(w)]),{color:b.color||u.color,realize:{brush:"ink",params:{width:u.width*e/400,pressure:0,taper:0}},why:b.note||""});break}return s.stages.length||c("Marks"),Me(s)}const an=[{id:"point-weight",title:"Point: where the weight sits",brief:"Place one point on the basic plane. Kandinsky: above feels light and free, below dense and heavy; left is distant and loose, right is near and constrained. Decide where the weight sits, then check it against the plane's diagonals.",source:`artboard(800, 800, '#f2ede3')

stage('Analysis', 'analysis')
// Kandinsky's basic plane: two diagonals divide it into four tensions.
guide([[0, 0], [800, 800]], { why: 'lyrical diagonal: from upper left, calm descent' })
guide([[0, 800], [800, 0]], { why: 'dramatic diagonal: rising from lower left' })
guide([[400, 0], [400, 800]], { why: 'vertical axis: warm/cold, left/right' })
guide([[0, 400], [800, 400]], { why: 'horizontal axis: light above, heavy below' })

stage('Concept', 'concept')
const where = decide('Where does the weight sit?', ['high right', 'center', 'low left'], 'low left',
  'below and left the point sinks and gathers weight')
const [x, y] = { 'high right': [560, 230], center: [400, 400], 'low left': [250, 590] }[where]

stage('Marks', 'marks')
point(x, y, { size: 90, why: 'the only element: its size and place are the whole composition' })

stage('Notes', 'notes')
note(20, 20, 'Try the other options in decide(...) and compare: which feels heavier?')`},{id:"line-walk",title:"Line: a walk for its own sake",brief:"Klee's active line: a point that moves freely, for the sake of moving. Plan the gesture first, then let the line walk it with its own small deviations.",source:`artboard(1000, 700, '#f3efe6')

stage('Gesture', 'construction')
const plan = walk({ from: [80, 420], heading: -10, steps: 24, step: 38, turn: i => sin(i / 3) * 22 })
gesture(plan, { why: 'the intention: a rising, swaying movement across the plane' })

stage('Line', 'marks')
seed(7)
const path = walk({ from: [80, 420], heading: -10, steps: 220, step: 4,
  turn: (i, t) => sin(i / 13) * 5.5 + (noise(i / 9) - 0.5) * 9 })
line(path, { width: 5, pressure: 0.8, taper: 0.4, wobble: 0.1,
  pressures: t => 0.35 + 0.6 * sin(t * PI), why: 'the active line: walks the plan but finds its own way' })

stage('Notes', 'notes')
note(20, 20, 'Klee: "An active line on a walk, moving freely, without goal."')`},{id:"whose-line",title:"Line: whose line is it?",brief:`After Klee and William Ngan ("Taking a line for a walk", 2016). A brush is someone's idea of a line: the app maker's invisible hand guides yours. Create your line before you draw it: a function of the walk (its points, direction and speed). Keep it to one idea. In code complexity is free and simplicity is elusive.`,source:`artboard(1000, 700, '#f3efe6')

stage('Concept', 'concept')
decide('What should this line say?', ['it bites', 'it hesitates', 'it breathes'], 'it bites',
  'one idea only: a line with teeth where the hand hurried')

// A line is a function of its walk: frames carry x, y, the normal (nx, ny) and the hand's speed.
defineLine('teeth', { doc: 'Teeth that grow where the hand was fast', params: { bite: [0, 60, 18] } },
  (ctx, frames, p, env) => {
    ctx.lineWidth = 1.2
    ctx.beginPath()
    frames.forEach((f, i) => {
      const o = i % 2 ? min(p.bite, f.speed * 2) : 0   // every other frame steps out, by speed
      const x = f.x + f.nx * o, y = f.y + f.ny * o
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    })
    ctx.stroke()
  })

stage('Gesture', 'construction')
const path = walk({ from: [90, 380], heading: -8, steps: 60, step: 14, turn: (i, t) => sin(i / 5) * 14 + noise(i / 9, 0) * 10 })
gesture(path, { why: 'the walk before the line: where it goes, not yet how it looks' })

stage('Line', 'marks')
// The same walk twice: once calm (slow, the time between points is long), once hurried.
line(path.map(([x, y], i) => [x, y - 90, i * 60]), { brush: 'teeth', bite: 30, why: 'slow: the teeth stay small' })
line(path.map(([x, y], i) => [x, y + 90, i * 8]), { brush: 'teeth', bite: 30, why: 'hurried: the same line bites' })

stage('Notes', 'notes')
note(40, 40, 'Change what the line says: rewrite defineLine, keep it short. Then draw your own walk and give it your line in Properties.')`},{id:"medial-line",title:"Line: the medial line encloses a plane",brief:"Klee's medial line: a line that closes on itself and so describes a plane. Draw the walk, close it, then let the enclosed area become a plane.",source:`artboard(900, 900, '#f1ece2')

stage('Construction', 'construction')
const c = [450, 450]
guide(circle(c[0], c[1], 260), { why: 'the envelope the walk will wander around' })

stage('Line', 'structure')
seed(3)
const loop = range(90).map(i => {
  const a = i / 90 * TAU, r = 230 + (noise(i / 7) - 0.5) * 160
  return [c[0] + cos(a) * r, c[1] + sin(a) * r]
})
line(loop, { closed: true, width: 3, why: 'the medial line: walking and enclosing at once' })

stage('Plane', 'value')
plane(loop, { brush: 'hatch', angle: 35, spacing: 9, width: 1.2, why: 'what the line enclosed becomes a plane, stated by hatching' })

stage('Notes', 'notes')
note(20, 20, 'Line becomes plane when it closes. Change seed(3) and compare shapes.')`},{id:"value-by-hatching",title:"Line to plane: three values by hatching",brief:"State three values (light, middle, dark) using only lines. Value comes from spacing and crossing, not from color.",source:`artboard(1000, 420, '#f4f0e8')

stage('Construction', 'construction')
for (const x of [60, 370, 680]) guide(rect(x, 80, 260, 260), { why: 'three equal planes, so only value differs' })

stage('Value', 'value')
decide('How many values?', ['2', '3', '5'], '3', 'three values is the classic notan study')
plane(rect(60, 80, 260, 260), { brush: 'hatch', angle: 45, spacing: 16, width: 1.2, why: 'light: wide spacing' })
plane(rect(370, 80, 260, 260), { brush: 'hatch', angle: 45, spacing: 7, width: 1.2, why: 'middle: close spacing' })
plane(rect(680, 80, 260, 260), { brush: 'hatch', angle: 45, spacing: 6, width: 1.4, cross: 1, why: 'dark: crossed and close' })

stage('Notes', 'notes')
note(60, 360, 'Squint: do the three planes read as light, middle, dark?')`},{id:"structural-rhythm",title:"Structure: rhythm by repetition and gradation",brief:"Klee's structural rhythms: a unit repeated, then graded in weight. Decide the unit and the law of change.",source:`artboard(1000, 600, '#f2eee5')

stage('Construction', 'construction')
guide([[60, 300], [940, 300]], { why: 'the axis the rhythm travels along' })

stage('Rhythm', 'structure')
const unit = decide('What is the unit?', ['bar', 'dot'], 'bar', 'a vertical bar reads as a beat')
const law = decide('Law of change', ['constant', 'growing', 'pulsing'], 'pulsing', 'pulsing gives a strong-weak metre')
for (const i of range(16)) {
  const x = 90 + i * 55
  const w = law === 'constant' ? 1 : law === 'growing' ? 0.3 + i / 15 : (i % 2 ? 0.45 : 1)
  if (unit === 'bar') line([[x, 300 - 160 * w], [x, 300 + 160 * w]], { width: 4 + 10 * w, taper: 0, why: \`beat \${i + 1}\` })
  else point(x, 300, { size: 12 + 30 * w, why: \`beat \${i + 1}\` })
}

stage('Notes', 'notes')
note(60, 40, 'Change the law of change: what happens to the reading speed?')`},{id:"algorist-family",title:"Algorist: a family of forms",brief:"After Mohr and Verostko: one rule produces a family of forms; the realization (the brush) is separate from the rule. Vary the seed, keep the rule.",source:`artboard(1000, 1000, '#f3efe6')

stage('Rule', 'concept')
decide('The rule', ['wandering loops', 'nested squares'], 'wandering loops', 'loops show the walk and the enclosure together')

stage('Family', 'structure')
for (const gx of range(3)) for (const gy of range(3)) {
  seed(100 + gx * 3 + gy)
  const cx = 190 + gx * 310, cy = 190 + gy * 310
  const pts = walk({ from: [cx - 60, cy], heading: random(0, 360), steps: 140, step: 4,
    turn: i => 7 + (noise(i / 10) - 0.5) * 18 })
  line(pts, { width: 1.6, taper: 0.2, why: \`member \${gx * 3 + gy + 1}: same rule, seed \${100 + gx * 3 + gy}\` })
}

stage('Notes', 'notes')
note(20, 20, 'Verostko: the algorithm is the score, the pen is the performer.')`}],yc=(()=>{const n=new Uint32Array(256);for(let e=0;e<256;e++){let t=e;for(let o=0;o<8;o++)t=t&1?3988292384^t>>>1:t>>>1;n[e]=t>>>0}return n})();function wc(n){let e=4294967295;for(let t=0;t<n.length;t++)e=yc[(e^n[t])&255]^e>>>8;return(e^4294967295)>>>0}function kc(n=new Date){const e=n.getHours()<<11|n.getMinutes()<<5|Math.floor(n.getSeconds()/2),t=n.getFullYear()-1980<<9|n.getMonth()+1<<5|n.getDate();return{time:e,date:t}}function Mo(n){const e=new TextEncoder,{time:t,date:o}=kc(),i=[],s=[];let r=0;for(const u of n){const f=e.encode(u.name),p=typeof u.data=="string"?e.encode(u.data):u.data,m=wc(p),b=new DataView(new ArrayBuffer(30));b.setUint32(0,67324752,!0),b.setUint16(4,20,!0),b.setUint16(6,2048,!0),b.setUint16(8,0,!0),b.setUint16(10,t,!0),b.setUint16(12,o,!0),b.setUint32(14,m,!0),b.setUint32(18,p.length,!0),b.setUint32(22,p.length,!0),b.setUint16(26,f.length,!0),i.push(new Uint8Array(b.buffer),f,p);const g=new DataView(new ArrayBuffer(46));g.setUint32(0,33639248,!0),g.setUint16(4,20,!0),g.setUint16(6,20,!0),g.setUint16(8,2048,!0),g.setUint16(10,0,!0),g.setUint16(12,t,!0),g.setUint16(14,o,!0),g.setUint32(16,m,!0),g.setUint32(20,p.length,!0),g.setUint32(24,p.length,!0),g.setUint16(28,f.length,!0),g.setUint32(42,r,!0),s.push(new Uint8Array(g.buffer),f),r+=30+f.length+p.length}const a=s.reduce((u,f)=>u+f.length,0),l=new DataView(new ArrayBuffer(22));l.setUint32(0,101010256,!0),l.setUint16(8,n.length,!0),l.setUint16(10,n.length,!0),l.setUint32(12,a,!0),l.setUint32(16,r,!0);const d=[...i,...s,new Uint8Array(l.buffer)],c=new Uint8Array(d.reduce((u,f)=>u+f.length,0));let h=0;for(const u of d)c.set(u,h),h+=u.length;return c}const xc="ams-assets",Ps="assets",yn="ams_asset_folders",Mr=320;function vc(){return new Promise((n,e)=>{const t=indexedDB.open(xc,1);t.onupgradeneeded=()=>t.result.createObjectStore(Ps,{keyPath:"id"}),t.onsuccess=()=>n(t.result),t.onerror=()=>e(t.error)})}function Pt(n,e,t){return new Promise((o,i)=>{const s=n.transaction(Ps,e),r=s.objectStore(Ps),a=t(r);s.oncomplete=()=>o(a&&"result"in a?a.result:a),s.onerror=()=>i(s.error)})}async function So(n){const e=URL.createObjectURL(n);try{const t=new Image;return t.src=e,await t.decode(),t}finally{setTimeout(()=>URL.revokeObjectURL(e),1e3)}}function Mc(n){const e=n.type||"",t=(n.name||"").toLowerCase();return e.startsWith("image/")||t.endsWith(".svg")?"image":e.startsWith("video/")||/\.(mp4|mov|m4v)$/.test(t)?"video":e.startsWith("audio/")||/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(t)?"audio":e==="application/json"||t.endsWith(".json")?"json":e.startsWith("text/")||/\.(txt|md|markdown|csv|js|py)$/.test(t)?"text":null}async function Sc(n,e){const t=document.createElement("canvas");t.width=240,t.height=150;const o=t.getContext("2d");if(o.fillStyle="#f3efe6",o.fillRect(0,0,240,150),o.fillStyle="#2b2620",e==="audio"){let i=null;try{const r=await new(window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,44100,44100).decodeAudioData(await n.arrayBuffer()),a=r.getChannelData(0),l=120,d=Math.floor(a.length/l);i=Array.from({length:l},(c,h)=>{let u=0;for(let f=h*d;f<(h+1)*d;f+=16)u=Math.max(u,Math.abs(a[f]||0));return u}),n.durationMs=Math.round(r.duration*1e3)}catch{}o.globalAlpha=.8,(i||Array.from({length:120},(s,r)=>.3+.25*Math.sin(r/5))).forEach((s,r)=>{const a=Math.max(1,s*110);o.fillRect(r*2,75-a/2,1.4,a)}),n.peaks=i}else{const i=(await n.text()).slice(0,600).split(`
`).slice(0,9);o.font="11px ui-monospace, Menlo, monospace",i.forEach((s,r)=>o.fillText(s.slice(0,38),10,18+r*15))}return{thumb:t.toDataURL("image/webp",.85),width:0,height:0}}async function $c(n){const e=document.createElement("video");e.muted=!0,e.playsInline=!0,e.preload="auto",e.src=URL.createObjectURL(n);try{await new Promise((i,s)=>{e.onloadeddata=i,e.onerror=()=>s(new Error("This video cannot be decoded"))}),e.currentTime=Math.min(.5,(e.duration||1)/4),await new Promise(i=>{e.onseeked=i,setTimeout(i,1500)});const t=Math.min(1,Mr/Math.max(e.videoWidth,e.videoHeight)),o=document.createElement("canvas");return o.width=Math.max(1,Math.round(e.videoWidth*t)),o.height=Math.max(1,Math.round(e.videoHeight*t)),o.getContext("2d").drawImage(e,0,0,o.width,o.height),{thumb:o.toDataURL("image/webp",.85),width:e.videoWidth,height:e.videoHeight}}finally{URL.revokeObjectURL(e.src)}}function Pc(n){const e=document.createElement("canvas");e.width=240,e.height=150;const t=e.getContext("2d");t.fillStyle="#1b1b1b",t.fillRect(0,0,240,150),t.strokeStyle="#8c8c8c",t.lineWidth=1.4,t.strokeRect(20,22,200,76),t.fillStyle="#c9c7c2",t.beginPath(),t.moveTo(108,44),t.lineTo(140,60),t.lineTo(108,76),t.closePath(),t.fill(),t.fillStyle="#dadada",t.font="12px ui-sans-serif, system-ui, sans-serif";const o=String(n.label||"stream").split(" ");let i="",s=118;for(const r of o)if(t.measureText(i+r).width>210&&i&&(t.fillText(i.trim(),14,s),s+=15,i=""),i+=r+" ",s>140)break;return s<=140&&t.fillText(i.trim(),14,s),{thumb:e.toDataURL("image/webp",.85),width:0,height:0}}async function Ac(n){const e=n.kindHint;if(e==="stream")return Pc(n);if(e==="video"||(n.type||"").startsWith("video/"))return $c(n);if(e==="audio"||e==="text"||e==="json")return Sc(n,e);const t=typeof createImageBitmap=="function"?await createImageBitmap(n).catch(()=>So(n)):await So(n);t.naturalWidth===void 0&&(t.naturalWidth=t.width,t.naturalHeight=t.height);const o=Math.min(1,Mr/Math.max(t.naturalWidth,t.naturalHeight)),i=document.createElement("canvas");return i.width=Math.max(1,Math.round(t.naturalWidth*o)),i.height=Math.max(1,Math.round(t.naturalHeight*o)),i.getContext("2d").drawImage(t,0,0,i.width,i.height),{thumb:i.toDataURL("image/webp",.85),width:t.naturalWidth,height:t.naturalHeight}}function Tc(n,e){const t=e.split("/").slice(0,-1).join("/"),o=n===e?"":n.slice(e.length+1);return[t,o].filter(Boolean).join("/")}function At(n){return String(n||"").split("/").map(e=>e.trim()).filter(Boolean).join("/")}function Ec(n,e){const t=String(e||"").toLowerCase().split(/\s+/).filter(Boolean);if(!t.length)return!0;const o=[n.title,n.kind,n.folder,...n.tags||[],n.meta?.artist,n.meta?.year].filter(Boolean).join(" ").toLowerCase();return t.every(i=>i.startsWith("#")?(n.tags||[]).some(s=>s.toLowerCase()===i.slice(1)):o.includes(i))}class Lc{constructor(){this.db=null,this.listeners=new Set}async ready(){return this.db||=await vc(),this}onChange(e){this.listeners.add(e)}emit(){for(const e of this.listeners)e()}async all(){return await this.ready(),(await Pt(this.db,"readonly",t=>t.getAll())).sort((t,o)=>o.created-t.created)}async get(e){return await this.ready(),Pt(this.db,"readonly",t=>t.get(e))}async add(e,t={}){await this.ready();const{thumb:o,width:i,height:s}=await Ac(e);(e.peaks||e.durationMs)&&(t={...t,meta:{...t.meta||{},peaks:e.peaks,duration:e.durationMs}});const r={id:t.id||crypto.randomUUID?.()||String(Date.now()+Math.random()),title:t.title||"Untitled",tags:t.tags||[],rating:t.rating||0,kind:t.kind||"import",folder:At(t.folder),program:t.program||null,meta:t.meta||null,created:t.created||Date.now(),blob:e,thumb:o,width:i,height:s};return await Pt(this.db,"readwrite",a=>a.put(r)),this.emit(),r}update(e,t){const o=async()=>{const i=await this.get(e);return i?("folder"in t&&(t.folder=At(t.folder)),Object.assign(i,t),await Pt(this.db,"readwrite",s=>s.put(i)),this.emit(),i):null};return this.queue=(this.queue||Promise.resolve()).then(o,o),this.queue}async remove(e){await this.ready(),await Pt(this.db,"readwrite",t=>t.delete(e)),this.emit()}async folders(){const e=new Set(this.savedFolders());for(const t of await this.all()){const o=(t.folder||"").split("/").filter(Boolean);for(let i=1;i<=o.length;i++)e.add(o.slice(0,i).join("/"))}return[...e].sort()}savedFolders(){try{return JSON.parse(localStorage.getItem(yn)||"[]")}catch{return[]}}async removeFolder(e,{deleteAssets:t=!1}={}){const o=At(e);if(!o)return 0;o.split("/").slice(0,-1).join("/");const i=a=>a.folder===o||a.folder.startsWith(o+"/"),s=(await this.all()).filter(i);for(const a of s)t?await this.remove(a.id):await this.update(a.id,{folder:Tc(a.folder,o)});const r=this.savedFolders().filter(a=>!(a===o||a.startsWith(o+"/")));try{localStorage.setItem(yn,JSON.stringify(r))}catch{}return this.emit(),s.length}addFolder(e){const t=At(e);if(!t)return;const o=new Set(this.savedFolders());o.add(t);try{localStorage.setItem(yn,JSON.stringify([...o]))}catch{}this.emit()}async renameFolder(e,t){if(e=At(e),t=At(t),!e||!t||e===t)return;const o=r=>r===e||r.startsWith(e+"/"),i=r=>t+r.slice(e.length);for(const r of await this.all())o(r.folder||"")&&(r.folder=i(r.folder),await Pt(this.db,"readwrite",a=>a.put(r)));const s=this.savedFolders().map(r=>o(r)?i(r):r);try{localStorage.setItem(yn,JSON.stringify(s))}catch{}this.emit()}async seed(e){const t="ams_assets_seeded_v1";try{if(localStorage.getItem(t))return}catch{}for(const o of e)try{const i=await(await fetch(o.url)).blob();await this.add(i,{id:"klee:"+o.id,title:o.title,kind:"klee",folder:"Klee",tags:["klee",String(o.year||"")].filter(Boolean),meta:{artist:o.artist,year:o.year,source:o.source?.commonsPage,rights:o.rights?.commonsLicense}})}catch(i){console.warn("Could not seed",o.id,i)}try{localStorage.setItem(t,"1")}catch{}}async seedClips(e){const t="ams_assets_seeded_clips_v2";let o=[];try{o=JSON.parse(localStorage.getItem(t)||"[]")}catch{}for(const i of e)if(!o.includes(i.id))try{const s=await(await fetch(i.url)).blob();await this.add(s,{id:`clip:${i.id}`,title:i.title,kind:"import",folder:i.folder||"Test clips",tags:["clip",...i.tags||["test"]],meta:{doc:i.doc,source:i.source,license:i.license,artist:i.artist,date:i.date}}),o.push(i.id);try{localStorage.setItem(t,JSON.stringify(o))}catch{}}catch(s){console.warn("Could not seed",i.id,s)}}async seedStreams(e){const t="ams_assets_seeded_streams_v1";let o=[];try{o=JSON.parse(localStorage.getItem(t)||"[]")}catch{}for(const i of e){const s=`stream:${i.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;if(!o.includes(s)){await this.addStream({id:s,...i}),o.push(s);try{localStorage.setItem(t,JSON.stringify(o))}catch{}}}}async addStream({id:e,title:t,page:o,quality:i,start:s,end:r,note:a,group:l="",folder:d,license:c,artist:h}){const u=new Blob([o],{type:"text/uri-list"});return u.kindHint="stream",u.label=t,this.add(u,{id:e,title:t,kind:"stream",folder:d||`Streams${l?`/${l}`:""}`,tags:["stream","public-domain"],meta:{stream:{page:o,quality:i,start:s,end:r,note:a},note:a,license:c,artist:h}})}async importStudioJSON(e,t,o=""){const i=new Blob([JSON.stringify(e)],{type:"application/json"});i.kindHint="json";const s=e.type==="ams-take"?"take":"process";return this.add(i,{title:e.title||t.replace(/\.[a-z.]+$/i,""),kind:s,folder:o,program:e,tags:[s,"imported"],meta:s==="take"?{clips:e.clips?.length,duration:e.duration}:{elements:e.elements?.length}})}async importFiles(e,t=""){e=[...e];const o={};for(const s of e.filter(r=>r.name==="sources.json"))try{const r=JSON.parse(await s.text()),a=(s.relPath||s.webkitRelativePath||"").split("/").slice(0,-1).join("/");for(const l of r.references||[])o[a+"/"+l.file]=l}catch{}let i=0;for(const s of e){const r=Mc(s);if(!r||s.name==="sources.json")continue;const l=(s.relPath||s.webkitRelativePath||s.name).split("/").slice(0,-1).join("/"),d=[t,l].filter(Boolean).join("/");if(r==="json")try{const h=JSON.parse(await s.text());if(h?.type==="ams-process"||h?.type==="ams-take"){await this.importStudioJSON(h,s.name,d),i++;continue}}catch{}if(r==="video"){await this.add(s,{title:s.name.replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," "),kind:"video",folder:d,tags:["video"],meta:{file:s.name,type:s.type}}),i++;continue}if(r!=="image"){s.kindHint=r,await this.add(s,{title:s.name.replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," "),kind:r==="audio"?"audio":"text",folder:d,tags:[r],meta:{file:s.name,type:s.type}}),i++;continue}const c=o[l+"/"+s.name];await this.add(s,{title:c?.title||s.name.replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," "),kind:"import",folder:d,tags:c?[String(c.year||""),...c.artist?[c.artist.split(" (")[0].split(" ").pop().toLowerCase()]:[]].filter(Boolean):[],meta:c?{artist:c.artist,year:c.year,source:c.source?.commonsPage}:null,created:Date.now()-i}),i++}return i}}const $o="ams_workbench_layout_v1",Po={left:220,right:220,bottom:110},wn={left:300,right:320,bottom:220};class Bc{constructor(e,{onLayout:t}={}){this.root=e,this.onLayout=t,this.panels=new Map,this.state=this.load(),this.els={left:e.querySelector('[data-dock="left"]'),right:e.querySelector('[data-dock="right"]'),bottom:e.querySelector('[data-dock="bottom"]'),floating:e.querySelector("[data-floating]")}}load(){try{const e=JSON.parse(localStorage.getItem($o)||"null");if(e?.panels)return e}catch{}return{panels:{},active:{},collapsed:{},size:{...wn}}}save(){try{localStorage.setItem($o,JSON.stringify(this.state))}catch{}this.onLayout?.()}reset(){this.state={panels:{},active:{},collapsed:{},size:{...wn}};for(const e of this.panels.values())this.state.panels[e.id]={placement:e.natural,open:e.openByDefault!==!1,x:80,y:80,w:340,h:480};this.save(),this.render()}register(e){const t=document.createElement("div");t.className="wb-panel-body",this.panels.set(e.id,{...e,body:t,mounted:!1}),this.state.panels[e.id]||(this.state.panels[e.id]={placement:e.natural,open:e.openByDefault!==!1,x:80,y:80,w:340,h:480})}placement(e){return this.state.panels[e]?.placement}open(e,{toggle:t=!1}={}){const o=this.aliases?.[e];if(o){this.open(o[0],{toggle:t}),this.onAlias?.(o[1]);return}const i=this.state.panels[e];if(i){if(i.placement==="floating")i.open=t?!i.open:!0,i.min=!1;else{const s=i.placement,r=i.open&&this.state.active[s]===e&&!this.state.collapsed[s];t&&r?this.state.collapsed[s]=!0:(i.open=!0,this.state.active[s]=e,this.state.collapsed[s]=!1)}this.save(),this.render()}}close(e){const t=this.state.panels[e];t&&(t.open=!1,this.save(),this.render())}move(e,t,o=null){const i=this.state.panels[e],s=this.panels.get(e);!i||!s||(t==="bottom"&&!s.allowBottom&&(t="right"),i.placement=t,i.open=!0,o&&Object.assign(i,o),t!=="floating"&&(this.state.active[t]=e,this.state.collapsed[t]=!1),this.save(),this.render())}toggleDock(e){this.state.collapsed[e]=!this.state.collapsed[e],this.save(),this.render()}tabsFor(e){const t=this.state.order||[],o=[...this.panels.keys()],i=s=>{const r=t.indexOf(s);return r<0?t.length+o.indexOf(s):r};return[...this.panels.values()].filter(s=>this.state.panels[s.id].placement===e&&this.state.panels[s.id].open).sort((s,r)=>i(s.id)-i(r.id))}reorder(e,t){const o=[...this.panels.keys()],i=(this.state.order||[]).filter(r=>o.includes(r));for(const r of o)i.includes(r)||i.push(r);i.splice(i.indexOf(e),1);const s=t?i.indexOf(t):i.length;i.splice(s<0?i.length:s,0,e),this.state.order=i,this.save(),this.render()}mountBody(e){return e.mounted||(e.mount(e.body),e.mounted=!0),e.body}render(){for(const e of["left","right","bottom"])this.renderDock(e);this.renderFloating(),this.onLayout?.()}renderDock(e){const t=this.els[e],o=this.tabsFor(e),i=this.state.collapsed[e]||!o.length;t.classList.toggle("collapsed",i),t.style.setProperty("--dock-size",`${this.state.size[e]||wn[e]}px`),t.innerHTML="";const s=document.createElement("div");if(s.className=`wb-dock-edge wb-dock-edge-${e}`,s.title=i?"Drag or double-click to open the panels":"Drag to resize; drag past the edge to collapse; double-click to collapse",this.bindEdge(s,e),t.appendChild(s),i)return;let r=this.state.active[e];o.some(d=>d.id===r)||(r=this.state.active[e]=o[0].id);const a=document.createElement("div");a.className="wb-tabs";for(const d of o){const c=document.createElement("button");c.className=`wb-tab${d.id===r?" active":""}`,c.dataset.guide=`tab:${d.id}`,c.innerHTML=`${te(d.icon)}${d.id===r?`<span>${d.title}</span>`:""}`,c.title=d.title,this.bindHandle(c,d.id,()=>{this.state.active[e]=d.id,this.save(),this.render()}),a.appendChild(c)}const l=document.createElement("div");l.className="wb-dock-content",l.appendChild(this.mountBody(this.panels.get(r))),t.appendChild(a),t.appendChild(l)}renderFloating(){const e=this.els.floating;e.innerHTML="";for(const t of this.panels.values()){const o=this.state.panels[t.id];if(o.placement!=="floating"||!o.open)continue;const i=document.createElement("div");i.className=`wb-float${o.min?" min":""}`,i.dataset.panel=t.id,Object.assign(i.style,{left:`${o.x}px`,top:`${o.y}px`,width:o.min?"":`${o.w}px`,height:o.min?"":`${o.h}px`});const s=document.createElement("div");s.className="wb-float-head";const r=document.createElement("button");if(r.className="wb-tab active",r.dataset.guide=`tab:${t.id}`,r.innerHTML=`${te(t.icon)}${o.min?"":`<span>${t.title}</span>`}`,r.title=`${t.title}: drag to a side to dock · Shift+double-click to minimise`,this.bindHandle(r,t.id,null,i),r.addEventListener("dblclick",a=>{a.shiftKey&&(o.min=!o.min,this.save(),this.render())}),s.appendChild(r),!o.min){const a=document.createElement("button");a.className="wb-icon-btn",a.innerHTML=te("close"),a.title="Close",a.onclick=()=>this.close(t.id),s.appendChild(a)}if(i.appendChild(s),!o.min){const a=document.createElement("div");a.className="wb-dock-content",a.appendChild(this.mountBody(t)),i.appendChild(a);const l=document.createElement("div");l.className="wb-float-grip",this.bindResize(l,o,i),i.appendChild(l)}e.appendChild(i)}}bindHandle(e,t,o,i=null){e.addEventListener("contextmenu",s=>{s.preventDefault(),this.placementMenu(t,s.clientX,s.clientY)}),e.addEventListener("pointerdown",s=>{if(s.button!==0)return;const r=s.clientX,a=s.clientY,l=this.state.panels[t];let d=!1,c=0,h=0;const u=this.root.querySelector(".wb-dock-hint"),f=i?null:e.closest(".wb-tabs");let p=!1,m;const b=()=>f?.querySelectorAll(".wb-tab").forEach(y=>y.classList.toggle("drop-before",y.dataset.guide===`tab:${m}`)),g=y=>{const S=y.clientX-r,k=y.clientY-a;if(!d&&!p&&Math.hypot(S,k)<6)return;if(f&&!d){const x=f.getBoundingClientRect();if(y.clientY>x.top-18&&y.clientY<x.bottom+18){p=!0;const A=[...f.querySelectorAll(".wb-tab")].filter(P=>P!==e).find(P=>{const $=P.getBoundingClientRect();return y.clientX<$.left+$.width/2});m=A?A.dataset.guide.slice(4):null,e.classList.add("dragging"),b();return}p=!1,m=void 0,e.classList.remove("dragging"),b()}d||(d=!0,l.placement!=="floating"&&(l.placement="floating",l.open=!0,l.x=y.clientX-60,l.y=y.clientY-14,this.render()),c=y.clientX-l.x,h=y.clientY-l.y),l.x=y.clientX-c,l.y=y.clientY-h;const v=this.els.floating.querySelector(`[data-panel="${t}"]`);v&&(v.style.left=`${l.x}px`,v.style.top=`${l.y}px`);const T=this.dockTarget(y.clientX,y.clientY,this.panels.get(t).allowBottom);u.dataset.target=T},w=y=>{if(window.removeEventListener("pointermove",g),window.removeEventListener("pointerup",w),u.dataset.target="",p){e.classList.remove("dragging"),m!==void 0&&this.reorder(t,m);return}if(!d){o?.();return}const S=this.dockTarget(y.clientX,y.clientY,this.panels.get(t).allowBottom);S!=="floating"?this.move(t,S):(this.save(),this.render())};window.addEventListener("pointermove",g),window.addEventListener("pointerup",w)})}dockTarget(e,t,o){const i=window.innerWidth,s=window.innerHeight,r=64;return o&&t>s-r?"bottom":e<r?"left":e>i-r?"right":"floating"}placementMenu(e,t,o){const i=this.panels.get(e),s=[["left","Dock left"],["right","Dock right"],...i.allowBottom?[["bottom","Dock bottom"]]:[],["floating","Float"],["close","Close"]],r=document.createElement("div");r.className="wb-menu",Object.assign(r.style,{left:`${t}px`,top:`${o}px`});for(const[l,d]of s){const c=document.createElement("button");c.textContent=d,c.onclick=()=>{r.remove(),l==="close"?this.close(e):this.move(e,l,l==="floating"?{x:t-40,y:o}:null)},r.appendChild(c)}document.body.appendChild(r);const a=l=>{r.contains(l.target)||(r.remove(),window.removeEventListener("pointerdown",a,!0))};setTimeout(()=>window.addEventListener("pointerdown",a,!0))}bindEdge(e,t){e.addEventListener("dblclick",()=>this.toggleDock(t)),e.addEventListener("pointerdown",o=>{o.preventDefault();const i=t==="bottom"?o.clientY:o.clientX,s=this.state.collapsed[t]?0:this.state.size[t]||wn[t],r=t==="left"?1:-1,a=this.els[t];let l=!1;const d=h=>{const u=t==="bottom"?h.clientY:h.clientX,f=s+(u-i)*r;if(Math.abs(u-i)>3&&(l=!0),f<Po[t]*.6){this.state.collapsed[t]||(this.state.collapsed[t]=!0,this.renderDock(t),this.onLayout?.());return}this.state.size[t]=Math.max(Po[t],Math.min(900,f)),this.state.collapsed[t]&&(this.state.collapsed[t]=!1,this.renderDock(t)),a.style.setProperty("--dock-size",`${this.state.size[t]}px`),this.onLayout?.()},c=()=>{window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",c),l&&this.save()};window.addEventListener("pointermove",d),window.addEventListener("pointerup",c)})}bindResize(e,t,o){e.addEventListener("pointerdown",i=>{i.preventDefault();const s=i.clientX,r=i.clientY,a=t.w,l=t.h,d=h=>{t.w=Math.max(220,a+h.clientX-s),t.h=Math.max(160,l+h.clientY-r),o.style.width=`${t.w}px`,o.style.height=`${t.h}px`},c=()=>{window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",c),this.save()};window.addEventListener("pointermove",d),window.addEventListener("pointerup",c)})}}function Ao(n,e=6){const t=n.length;if(t<6)return n;const o=Math.max(3,Math.floor(t*.25));let i=1/0,s=0,r=t-1;for(let h=0;h<o;h++)for(let u=t-o;u<t;u++){const f=Math.hypot(n[h][0]-n[u][0],n[h][1]-n[u][1]);f<i&&(i=f,s=h,r=u)}let a=i<e*4&&r-s>4?n.slice(s,r+1):n.slice();a.length>4&&Math.hypot(a[0][0]-a.at(-1)[0],a[0][1]-a.at(-1)[1])<e&&(a=a.slice(0,-1));const l=a.length,d=Math.min(4,Math.floor(l/4)),c=[...Array(d).keys(),...Array.from({length:d},(h,u)=>l-1-u)];for(let h=0;h<3;h++){const u=a.map(f=>f.slice());for(const f of c){const p=u[(f-1+l)%l],m=u[(f+1)%l];a[f]=[(p[0]+u[f][0]*2+m[0])/4,(p[1]+u[f][1]*2+m[1])/4,u[f][2],u[f][3]]}}return a}function Cc(n,e,t,o=0){let[i,s]=n;const r=e[0]-i,a=e[1]-s,l=Math.hypot(r,a);if(t>0){if(l<=t)return n;i+=r*(1-t/l),s+=a*(1-t/l)}else i=e[0],s=e[1];const d=Math.max(0,Math.min(.95,o));return[n[0]+(i-n[0])*(1-d),n[1]+(s-n[1])*(1-d)]}function Zn(n,e,t=Math.PI/12){const o=Math.round(Math.atan2(e[1]-n[1],e[0]-n[0])/t)*t,i=Math.hypot(e[0]-n[0],e[1]-n[1]);return[n[0]+Math.cos(o)*i,n[1]+Math.sin(o)*i]}function Ic(n,e,t,o,i=0,s=2){const r=Math.max(1,Math.ceil(Math.hypot(t[0]-e[0],t[1]-e[1])/Math.max(s,1e-9)));let a=n;for(let d=1;d<=r;d++)a=Cc(a,[e[0]+(t[0]-e[0])*d/r,e[1]+(t[1]-e[1])*d/r],o,0);const l=Math.max(0,Math.min(.95,i));return[n[0]+(a[0]-n[0])*(1-l),n[1]+(a[1]-n[1])*(1-l)]}function Oc(n,e,t,o=120){const i=1-Math.exp(-Math.max(0,t)/Math.max(o,1e-9));return[n[0]+(e[0]-n[0])*i,n[1]+(e[1]-n[1])*i]}const To=6;function Sr(n,e,t,o,i,{sides:s=12,round:r=0}={}){const a=f=>f.map(([p,m],b)=>[p,m,b*60,.5]);if(n==="rect"){const f=Math.min(Math.max(r,0),1)*Math.min(o-e,i-t)/2;if(f<.5)return a([[e,t],[o,t],[o,i],[e,i]]);const p=[];for(const[m,b,g]of[[o-f,t+f,-Math.PI/2],[o-f,i-f,0],[e+f,i-f,Math.PI/2],[e+f,t+f,Math.PI]])for(let w=0;w<=To;w++){const y=g+w/To*(Math.PI/2);p.push([m+Math.cos(y)*f,b+Math.sin(y)*f])}return a(p)}const l=Math.max(3,Math.min(64,Math.round(s))),d=(e+o)/2,c=(t+i)/2,h=(o-e)/2,u=(i-t)/2;return a(Array.from({length:l},(f,p)=>{const m=-Math.PI/2+p*2*Math.PI/l;return[d+Math.cos(m)*h,c+Math.sin(m)*u]}))}const zc=12,Qn=n=>1+(zc-1)*Math.pow(1-Math.min(1,Math.max(0,n)),1.5);function Nc(n,e,t,{head:o=null}={}){const i=n.map(c=>[c.x,c.y,c.t,.5]);if(o&&i.push([o.x,o.y,e,.5]),i.length<2)return o?{left:[],right:[],head:[o.x,o.y,Qn(0)/2]}:null;const s=i.length>=3?Rn(i,!1):i,r=s.length,a=[],l=[];for(let c=0;c<r;c++){const h=s[Math.max(0,c-1)],u=s[Math.min(r-1,c+1)];let f=u[0]-h[0],p=u[1]-h[1];const m=Math.hypot(f,p)||1;f/=m,p/=m;const b=Qn((e-s[c][2])/t)/2;a.push([s[c][0]-p*b,s[c][1]+f*b]),l.push([s[c][0]+p*b,s[c][1]-f*b])}const d=s[r-1];return{left:a,right:l,head:[d[0],d[1],Qn(0)/2]}}function Rc(n,e,t){if(!e)return;const{left:o,right:i,head:s}=e;n.fillStyle=t,n.beginPath(),o.forEach(([r,a],l)=>l?n.lineTo(r,a):n.moveTo(r,a));for(let r=i.length-1;r>=0;r--)n.lineTo(i[r][0],i[r][1]);n.closePath(),n.fill("nonzero"),s&&(n.beginPath(),n.arc(s[0],s[1],s[2],0,Math.PI*2),n.fill())}const es="ams_workbench_camera_v1",Eo=new Set(["select","line","plane","gesture","brush"]),Lo=new Set(["point","note","line","plane","circle","rect","gesture","guide","brush","laser","sculpt"]),Bo=1e3,Dc="#e5484d";class jc{constructor(e,t,{getTool:o,getStage:i,getDefaults:s,getSculpt:r,getLazy:a,getShape:l,onSelect:d,onTool:c,onNoteStyled:h,viewMode:u}){this.host=e,this.store=t,this.getTool=o,this.getStage=i,this.getDefaults=s,this.getSculpt=r,this.getLazy=a,this.getShape=l,this.onSelect=d,this.onNoteStyled=h,this.onTool=c,this.viewMode=u,this.canvas=document.createElement("canvas"),this.canvas.className="wb-canvas",e.appendChild(this.canvas),this.ctx=this.canvas.getContext("2d"),this.selected=new Set,this.hovered=null,this.draft=null,this.marquee=null,this.boardSet=new Set,Promise.all(["22px Caveat",'17px "Patrick Hand"',"17px Newsreader"].map(f=>document.fonts?.load(f).catch(()=>null))).then(()=>this.invalidate()),this.upTo=1/0,this.grid={show:"paper",style:"lines",spacing:100,subdivisions:4,color:"#8a837840",snap:!1,snapMode:"points"};try{Object.assign(this.grid,JSON.parse(localStorage.getItem("ams_grid_v2"))||{})}catch{}this.space=!1;try{this.cam=JSON.parse(localStorage.getItem(es))||null}catch{this.cam=null}if(this.resize(),!this.cam){this.cam={x:0,y:0,z:1},this.fit();try{localStorage.removeItem(es)}catch{}}new ResizeObserver(()=>this.resize()).observe(e),this.baked=new Map,this.canvas.addEventListener("contextrestored",()=>{this.baked.clear(),this.invalidate()}),t.subscribe((f,p)=>{p==="live board code"?this.baked.delete(t.lastLiveBoard):this.baked.clear(),this.pruneSelection(),this.invalidate()},{live:!0}),this.bind()}toWorld(e,t){return[(e-this.cam.x)/this.cam.z,(t-this.cam.y)/this.cam.z]}toScreen(e,t){return[e*this.cam.z+this.cam.x,t*this.cam.z+this.cam.y]}local(e){const t=this.canvas.getBoundingClientRect();return[e.clientX-t.left,e.clientY-t.top]}resize(){const e=this.host.getBoundingClientRect();this.w=Math.max(1,e.width),this.h=Math.max(1,e.height);const t=window.devicePixelRatio||1,o=Math.round(this.w*t),i=Math.round(this.h*t);o===this.canvas.width&&i===this.canvas.height&&t===this.dpr||(this.canvas.width=o,this.canvas.height=i,this.canvas.style.width=`${this.w}px`,this.canvas.style.height=`${this.h}px`,this.dpr=t,this.raf&&(cancelAnimationFrame(this.raf),this.raf=0),this.cam?this.draw():this.invalidate())}camFor(e=H,t=60){const o=V(this.store.doc).find(a=>a.id===e)||V(this.store.doc)[0],{width:i,height:s}=o,r=Math.min((this.w-t*2)/i,(this.h-t*2)/s);return{z:r,x:(this.w-i*r)/2-o.x*r,y:(this.h-s*r)/2-o.y*r}}animateTo(e,t=550){cancelAnimationFrame(this.camAnim);const o={...this.cam},i=performance.now(),s=r=>{const a=Math.min(1,(r-i)/t),l=a<.5?4*a*a*a:1-(-2*a+2)**3/2,d=Math.exp(Math.log(o.z)+(Math.log(e.z)-Math.log(o.z))*l),c=[(this.w/2-o.x)/o.z,(this.h/2-o.y)/o.z],h=[(this.w/2-e.x)/e.z,(this.h/2-e.y)/e.z],u=c[0]+(h[0]-c[0])*l,f=c[1]+(h[1]-c[1])*l;this.cam={z:d,x:this.w/2-u*d,y:this.h/2-f*d},this.draw(),a<1?this.camAnim=requestAnimationFrame(s):(this.cam=e,this.saveCam(),this.invalidate())};this.camAnim=requestAnimationFrame(s)}frameSelection(e=60){const t=this.selectionBounds();if(!t)return!1;const o=Math.max(1,t.x1-t.x0),i=Math.max(1,t.y1-t.y0),s=Math.min(40,Math.min((this.w-e*2)/o,(this.h-e*2)/i));return this.animateTo({z:s,x:(this.w-o*s)/2-t.x0*s,y:(this.h-i*s)/2-t.y0*s},400),!0}fit(e=60,t=H){this.cam=this.camFor(t,e),this.saveCam(),this.invalidate()}zoomAt(e,t,o){const i=Math.min(40,Math.max(.05,this.cam.z*o)),[s,r]=this.toWorld(e,t);this.cam={z:i,x:e-s*i,y:t-r*i},this.saveCam(),this.invalidate()}saveCam(){try{localStorage.setItem(es,JSON.stringify(this.cam))}catch{}this.onCamera?.()}invalidate(){this.raf||(this.raf=requestAnimationFrame(()=>{this.raf=0,this.draw()}))}invalidateSoon(e){clearTimeout(this.timer);const t=Math.max(1e3/(this.animFps||15),(this.stats?.avg||0)*5);this.timer=setTimeout(()=>{this.timer=0,this.invalidate()},Math.max(0,t-(performance.now()-e)))}viewRect(e=40){const t=this.cam.z;return[-this.cam.x/t-e,-this.cam.y/t-e,(this.w-this.cam.x)/t+e,(this.h-this.cam.y)/t+e]}draw(){clearTimeout(this.timer),this.timer=0;const e=performance.now();this.frameNow=Date.now(),this.drawFrame_();const t=performance.now()-e;if(this.stats={draw:t,avg:this.stats?this.stats.avg*.9+t*.1:t,frames:(this.stats?.frames||0)+1},this.onDrawn?.(),!this.previewDoc){const o=nc(this.store.doc,this.frameNow);o===0?this.invalidateSoon(e):o<1/0&&(clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=0,this.invalidate()},Math.max(250,Math.min(o+15,5e3))))}}drawComposed(e,t,o,i){const s=this.cam.z,r=s*this.dpr,a=this.viewMode();for(const l of o){if(!this.boardOnScreen(l))continue;const d=this.composer.compose(l,{doc:t,scale:r,now:this.frameNow,mode:a,chain:[]}),[c,h]=this.toScreen(l.x,l.y);e.drawImage(d,c,h,l.width*s,l.height*s)}if(!this.previewDoc&&(this.selected.size||this.hovered)){const l=t.elements.filter(d=>this.composedIds.has(d.board||H));e.save(),e.translate(this.cam.x,this.cam.y),e.scale(s,s),mr(e,l,this.selected,this.hovered,i.getPropertyValue("--wb-select").trim()||"#8a8a8a",s),e.restore()}}drawFrame_(){const{ctx:e}=this,t=getComputedStyle(document.documentElement);e.setTransform(this.dpr,0,0,this.dpr,0,0),e.clearRect(0,0,this.w,this.h),e.fillStyle=t.getPropertyValue("--wb-canvas").trim()||"#1b1c1f",e.fillRect(0,0,this.w,this.h),this.drawGrid(!1);const o=this.previewDoc||this.store.doc,i=V(o),s=this.composer?i.filter(a=>a.kind!=="frame"&&!a.hidden&&this.composer.needs(a)):[];this.composedIds=s.length?new Set(s.map(a=>a.id)):null,s.length?this.composer.begin(o,this.frameNow):this.composer&&(this.composer.pictures.size||this.composer.masks.size||this.composer.views.size)&&!(this.sweptAt>this.frameNow-3e3)&&(this.composer.sweep(o),this.sweptAt=this.frameNow),e.save(),e.shadowColor="rgba(0,0,0,0.35)",e.shadowBlur=18;for(const a of i){if(a.kind==="frame"||a.hidden||this.composedIds?.has(a.id))continue;const[l,d]=this.toScreen(a.x,a.y);e.shadowColor=a.hideBorder?"transparent":"rgba(0,0,0,0.35)",e.fillStyle=a.ground,e.fillRect(l,d,a.width*this.cam.z,a.height*this.cam.z)}e.restore(),e.save(),e.setLineDash([4,4]),e.strokeStyle=t.getPropertyValue("--wb-line").trim()||"#353535";for(const a of i){if(!a.hidden||a.kind==="player")continue;const[l,d]=this.toScreen(a.x,a.y);e.strokeRect(Math.round(l)+.5,Math.round(d)+.5,Math.round(a.width*this.cam.z),Math.round(a.height*this.cam.z))}e.restore(),e.save();for(const a of i){if(a.kind!=="frame"||a.hideBorder)continue;const[l,d]=this.toScreen(a.x,a.y);e.fillStyle="rgba(255, 255, 255, 0.025)",e.fillRect(l,d,a.width*this.cam.z,a.height*this.cam.z),e.strokeStyle=t.getPropertyValue("--wb-line").trim()||"#353535",e.lineWidth=1,e.strokeRect(Math.round(l)+.5,Math.round(d)+.5,Math.round(a.width*this.cam.z),Math.round(a.height*this.cam.z))}if(e.restore(),this.drawGrid(!0),this.grid.show==="everywhere"){const a=this.grid.show;this.grid.show="paper",this.drawGrid(!0),this.grid.show=a}this.drawReference&&(e.save(),e.translate(this.cam.x,this.cam.y),e.scale(this.cam.z,this.cam.z),this.drawReference(e),e.restore());const r=this.drawBaked(e,o);for(const a of i)(a.hidden||this.composedIds?.has(a.id))&&r.add(a.id);if(bt(e,r.size?{...o,elements:o.elements.filter(a=>!r.has(a.board||H))}:o,{mode:this.viewMode(),upTo:this.upTo,transform:{x:this.cam.x,y:this.cam.y,scale:this.cam.z},selected:this.previewDoc?new Set:this.selected,hovered:this.previewDoc?null:this.hovered,ground:!1,screenNotes:!0,now:this.frameNow,view:this.viewRect(),selectColor:t.getPropertyValue("--wb-select").trim()||"#8a8a8a"}),s.length&&this.drawComposed(e,o,s,t),this.drawOverlay&&(e.save(),e.translate(this.cam.x,this.cam.y),e.scale(this.cam.z,this.cam.z),this.drawOverlay(e),e.restore()),this.draft){let a=this.draft;if(this.clickPath){const d=(h,u)=>Math.hypot(h[0]-u[0],h[1]-u[1])<1e-6;let c=a.points.filter((h,u,f)=>!u||!d(h,f[u-1]));a.role==="plane"&&c.length>2&&d(c[0],c.at(-1))&&(c=c.slice(0,-1)),a={...a,points:c}}const l=this.getLazy?.()?.simplify||0;if(!this.clickPath&&!this.draftShape&&l>0&&a.points.length>3&&!this.draftStraight&&(a={...a,points:Nt(a.points,l/this.cam.z)}),!this.clickPath&&!this.draftShape&&a.role==="plane"&&a.points.length>5&&(a={...a,points:Ao(a.points,6/this.cam.z)}),this.draftShown=a,a.role==="plane"&&a.points.length<3){const d=a.color||"#1d1b19";e.save(),e.strokeStyle=d,e.fillStyle=d,e.lineWidth=1.5,e.lineJoin="round",e.lineCap="round",e.beginPath(),a.points.forEach(([c,h],u)=>{const[f,p]=this.toScreen(c,h);u?e.lineTo(f,p):e.moveTo(f,p)}),e.stroke();for(const[c,h]of a.points){const[u,f]=this.toScreen(c,h);e.beginPath(),e.arc(u,f,2.5,0,Math.PI*2),e.fill()}e.restore()}else bt(e,{...o,stages:[{id:"draft",visible:!0}],elements:[a]},{mode:"process",transform:{x:this.cam.x,y:this.cam.y,scale:this.cam.z},ground:!1})}if(this.previewDoc){this.drawPreviewOverlay?.(e,{x:this.cam.x,y:this.cam.y,scale:this.cam.z},this.w,this.h);return}if(this.drawBoards(e,t),this.getTool()==="direct"){const a=new Set((this.selPoints||[]).map(u=>`${u.id}:${u.i}`)),l=new Set([...this.selected,this.hovered].filter(Boolean)),d=t.getPropertyValue("--wb-text").trim()||"#ddd",c=t.getPropertyValue("--wb-panel").trim()||"#222",h=t.getPropertyValue("--wb-accent-2").trim()||"#c8664f";e.save(),e.lineWidth=1;for(const u of this.store.doc.elements)l.has(u.id)&&u.points.forEach((f,p)=>{const[m,b]=this.toScreen(f[0],f[1]),g=a.has(`${u.id}:${p}`);e.fillStyle=g?h:c,e.strokeStyle=g?h:d,e.fillRect(Math.round(m)-3.5,Math.round(b)-3.5,7,7),e.strokeRect(Math.round(m)-3.5,Math.round(b)-3.5,7,7)});e.restore()}if(this.drawFrame(e,t.getPropertyValue("--wb-select").trim()||"#8a8a8a"),this.showPoints){const a=this.previewDoc||this.store.doc,l=new Set(a.stages.filter(c=>c.visible).map(c=>c.id)),d=t.getPropertyValue("--wb-accent-2").trim()||"#c8664f";e.save(),e.fillStyle=d,e.strokeStyle=t.getPropertyValue("--wb-bg").trim()||t.getPropertyValue("--wb-panel").trim()||"#111",e.lineWidth=1;for(const c of a.elements){if(c.hidden||!l.has(c.stage)||["note","image"].includes(c.role))continue;const h=this.selected.has(c.id);e.globalAlpha=h?.95:.6;const u=h?2:1.5;for(const f of c.points){const[p,m]=this.toScreen(f[0],f[1]);e.beginPath(),e.arc(p,m,u,0,Math.PI*2),e.fill()}}if(this.draft&&this.draftShown){e.globalAlpha=.95;for(const c of this.draftShown.points){const[h,u]=this.toScreen(c[0],c[1]);e.beginPath(),e.arc(h,u,2,0,Math.PI*2),e.fill()}}e.restore()}if(this.rope){const[a,l]=this.toScreen(...this.rope.pen),[d,c]=this.toScreen(...this.rope.cursor);e.save(),e.strokeStyle=t.getPropertyValue("--wb-muted").trim()||"#888",e.globalAlpha=.8,e.lineWidth=1,e.setLineDash([3,3]),e.beginPath(),e.moveTo(a,l),e.lineTo(d,c),e.stroke(),e.setLineDash([]),this.rope.radius>0&&(e.globalAlpha=.35,e.beginPath(),e.arc(d,c,this.rope.radius,0,Math.PI*2),e.stroke()),e.globalAlpha=.9,e.fillStyle=e.strokeStyle,e.beginPath(),e.arc(a,l,2.5,0,Math.PI*2),e.fill(),e.restore()}if(this.brushAt){const a=this.getSculpt?.();e.save(),e.strokeStyle=t.getPropertyValue("--wb-text").trim()||"#888",e.globalAlpha=.7,e.lineWidth=1,e.beginPath(),e.arc(this.brushAt[0],this.brushAt[1],a?.radius||40,0,Math.PI*2),e.stroke(),e.globalAlpha=.35,e.beginPath(),e.arc(this.brushAt[0],this.brushAt[1],(a?.radius||40)*(a?.strength??.5),0,Math.PI*2),e.stroke(),e.restore()}if(this.paintAffected(),this.marquee){const[a,l]=this.toScreen(this.marquee.x0,this.marquee.y0),[d,c]=this.toScreen(this.marquee.x1,this.marquee.y1);e.save(),e.strokeStyle=t.getPropertyValue("--wb-select").trim(),e.fillStyle=t.getPropertyValue("--wb-on").trim(),e.fillRect(a,l,d-a,c-l),e.strokeRect(a,l,d-a,c-l),e.restore()}}setGrid(e){Object.assign(this.grid,e);try{localStorage.setItem("ams_grid_v2",JSON.stringify(this.grid))}catch{}this.invalidate(),this.onGrid?.(this.grid)}snapTarget(e,t,o=null){if(this.grid.snapMode!=="objects")return this.snapPt(e,t,!0);let s=12/this.cam.z,r=null;for(const a of this.store.doc.elements)if(!(a.hidden||o&&o.has(a.id)||a.role==="note"))for(const l of a.points){const d=Math.hypot(l[0]-e,l[1]-t);d<s&&(s=d,r=l)}return r?[r[0],r[1]]:[e,t]}snapPt(e,t,o=!1){if(!this.grid.snap&&!o)return[e,t];const i=this.grid.spacing/Math.max(1,this.grid.subdivisions);return[Math.round(e/i)*i,Math.round(t/i)*i]}drawGrid(e){const t=this.grid;if(!t.show||t.show==="off"||this.presenting||e!==(t.show==="paper"))return;const{ctx:o}=this,i=this.cam.z,s=t.spacing*i,r=s/Math.max(1,t.subdivisions);if(s<4)return;let a=0,l=0,d=this.w,c=this.h;if(o.save(),e){o.beginPath();for(const f of V(this.previewDoc||this.store.doc)){const[p,m]=this.toScreen(f.x,f.y);o.rect(p,m,f.width*i,f.height*i)}o.clip()}o.strokeStyle=o.fillStyle=t.color;const h=t.snap?1:.5,u=(f,p,m)=>{if(f<5)return;o.globalAlpha=p*h;const b=this.cam.x-Math.floor((this.cam.x-a)/f)*f,g=this.cam.y-Math.floor((this.cam.y-l)/f)*f;if(t.style==="dots"){const w=Math.max(1,Math.min(2.2,f/25))*m;for(let y=b;y<=d;y+=f)for(let S=g;S<=c;S+=f)o.fillRect(Math.round(y)-w/2,Math.round(S)-w/2,w,w);return}o.lineWidth=m,o.beginPath();for(let w=b;w<=d;w+=f){const y=Math.round(w)+.5;o.moveTo(y,l),o.lineTo(y,c)}for(let w=g;w<=c;w+=f){const y=Math.round(w)+.5;o.moveTo(a,y),o.lineTo(d,y)}o.stroke()};t.subdivisions>1&&u(r,Math.min(1,(r-5)/10)*.55,1),u(s,1,t.style==="dots"?1.4:1),o.restore()}select(e,t=!1){t||this.selected.clear();for(const o of e)this.selected.add(o);e.length&&this.selectedBoard&&(this.selectedBoard=null,this.boardSet.clear()),this.onSelect?.([...this.selected]),this.invalidate()}pruneSelection(){const e=new Set(this.store.doc.elements.map(o=>o.id));let t=!1;for(const o of this.selected)e.has(o)||(this.selected.delete(o),t=!0);t&&this.onSelect?.([...this.selected])}editable(e){if(e.hidden||e.locked||this.boardShut().has(e.board||H))return!1;const t=this.store.doc.stages.find(o=>o.id===e.stage);return t&&t.visible&&!t.locked}boardShut(){const e=this.store.doc;return this.shutFor!==e&&(this.shutFor=e,this.shut=new Set(V(e).filter(t=>t.locked||t.hidden).map(t=>t.id))),this.shut}selectionBounds(){let e=1/0,t=1/0,o=-1/0,i=-1/0;for(const s of this.store.doc.elements)if(this.selected.has(s.id))for(const[r,a]of s.role==="note"?vs(s):s.points)e=Math.min(e,r),t=Math.min(t,a),o=Math.max(o,r),i=Math.max(i,a);return Number.isFinite(e)?{x0:e,y0:t,x1:o,y1:i}:null}frame(){const e=this.selectionBounds();if(!e)return null;let[t,o]=this.toScreen(e.x0,e.y0),[i,s]=this.toScreen(e.x1,e.y1);if(i-t<24){const r=(t+i)/2;t=r-12,i=r+12}if(s-o<24){const r=(o+s)/2;o=r-12,s=r+12}return{l:t,t:o,r:i,b:s,world:e}}handleAt(e,t){if(this.getTool()!=="select"||!this.selected.size)return null;const o=this.frame();if(!o)return null;const i=7,s=22;for(const r of[-1,1])for(const a of[-1,1]){const l=r<0?o.l:o.r,d=a<0?o.t:o.b,c=(e-l)*-r,h=(t-d)*-a;if(Math.abs(c)<=i&&Math.abs(h)<=i)return{kind:"scale",hx:r,hy:a};if(c>i*.5&&h>i*.5&&c<s&&h<s)return{kind:"rotate",hx:r,hy:a};if(c<-i*.5&&h<-i*.5&&c>-s&&h>-s)return{kind:"rotate",hx:r,hy:a}}if(t>o.t+i&&t<o.b-i){for(const r of[-1,1])if(Math.abs(e-(r<0?o.l:o.r))<=5)return{kind:"scale",hx:r,hy:0}}if(e>o.l+i&&e<o.r-i){for(const r of[-1,1])if(Math.abs(t-(r<0?o.t:o.b))<=5)return{kind:"scale",hx:0,hy:r}}return null}cursorFor(e){return e?e.kind==="rotate"?Fc:e.hx&&e.hy?e.hx===e.hy?"nwse-resize":"nesw-resize":e.hx?"ew-resize":"ns-resize":null}startTransform(e,t){const i=this.frame().world,s=JSON.stringify(this.store.doc),r=new Map(this.store.doc.elements.filter(w=>this.selected.has(w.id)).map(w=>[w.id,w.points.map(y=>y.slice())])),a=new Map(this.store.doc.elements.filter(w=>this.selected.has(w.id)&&w.role==="note").map(w=>[w.id,Dt(w)])),l=(i.x0+i.x1)/2,d=(i.y0+i.y1)/2,c=this.selectionBounds(),[h,u]=this.toWorld(...this.local(e)),f=Math.atan2(u-d,h-l);let p=!1;this.pointer=!0,this.transforming=t;const m=w=>{for(const y of this.store.doc.elements){const S=r.get(y.id);S&&(y.points=S.map(([k,v,T,x])=>{const[L,A]=w(k,v);return[L,A,T,x]}))}p=!0,this.invalidate()},b=w=>{const[y,S]=this.toWorld(...this.local(w));if(t.kind==="rotate"){let E=Math.atan2(S-d,y-l)-f;w.shiftKey&&(E=Math.round(E/(Math.PI/12))*(Math.PI/12));const I=Math.cos(E),R=Math.sin(E);this.transformLabel=`${Math.round(E*180/Math.PI)}°`,m((j,G)=>[l+(j-l)*I-(G-d)*R,d+(j-l)*R+(G-d)*I]);for(const j of this.store.doc.elements)a.has(j.id)&&(j.note={...j.note||{},angle:a.get(j.id).angle+E});return}const k=w.altKey?l:t.hx<0?i.x1:i.x0,v=w.altKey?d:t.hy<0?i.y1:i.y0,T=t.hx<0?i.x0:i.x1,x=t.hy<0?i.y0:i.y1,L=T+(y-h),A=x+(S-u);let P=t.hx&&T!==k?(L-k)/(T-k):1,$=t.hy&&x!==v?(A-v)/(x-v):1;if(w.ctrlKey&&c){const E=w.altKey?(c.x0+c.x1)/2:t.hx<0?c.x1:c.x0,I=w.altKey?(c.y0+c.y1)/2:t.hy<0?c.y1:c.y0,R=t.hx<0?c.x0:c.x1,j=t.hy<0?c.y0:c.y1,[G,D]=this.snapPt(R+(y-h),j+(S-u),!0);if(t.hx&&R!==E&&(P=(G-E)/(R-E)),t.hy&&j!==I&&($=(D-I)/(j-I)),!w.altKey){m((O,K)=>[E+(O-E)*P,I+(K-I)*$]),this.transformLabel=`${Math.round(P*100)}% × ${Math.round($*100)}%`;return}}if(t.hx&&t.hy&&w.shiftKey){const E=Math.max(Math.abs(P),Math.abs($));P=Math.sign(P||1)*E,$=Math.sign($||1)*E}Number.isFinite(P)||(P=1),Number.isFinite($)||($=1),this.transformLabel=`${Math.round(P*100)}% × ${Math.round($*100)}%`,m((E,I)=>[k+(E-k)*P,v+(I-v)*$]);for(const E of this.store.doc.elements){const I=a.get(E.id);if(!I)continue;const R=t.hx&&t.hy?Math.abs(P):t.hy?Math.abs($):1;if(E.note={...E.note||{},width:Math.max(40,I.width*(t.hx?Math.abs(P):1)),size:Math.max(4,I.size*R)},t.hy&&!t.hx&&(E.note.width=I.width*R),P<0||$<0){const[j,G]=E.points[0];E.points[0]=[j-(P<0?E.note.width:0),G,E.points[0][2],E.points[0][3]]}this.transformLabel=t.hx&&!t.hy?`width ${Math.round(E.note.width)}`:`${Math.round(E.note.size)} pt`}},g=()=>{if(window.removeEventListener("pointermove",b),window.removeEventListener("pointerup",g),this.pointer=!1,this.transforming=null,this.transformLabel=null,p&&(this.rehome(r.keys()),this.store.commitFrom(s,t.kind==="rotate"?"rotate":"scale")),p&&t.kind!=="rotate"&&a.size===1){const w=this.store.doc.elements.find(y=>a.has(y.id));if(w){const{angle:y,...S}=w.note||{};this.onNoteStyled?.(S)}}this.invalidate()};window.addEventListener("pointermove",b),window.addEventListener("pointerup",g)}drawFrame(e,t){if(this.getTool()!=="select"||!this.selected.size||this.marquee)return;const o=this.frame();if(!o)return;const i=this.transforming||this.hoverHandle;if(e.save(),e.strokeStyle=t,e.lineWidth=1,e.globalAlpha=i?.9:.35,(this.selected.size>1||i)&&e.strokeRect(Math.round(o.l)+.5,Math.round(o.t)+.5,Math.round(o.r-o.l),Math.round(o.b-o.t)),i){e.globalAlpha=1,e.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--wb-panel").trim()||"#222";for(const[s,r,a,l]of[[o.l,o.t,-1,-1],[o.r,o.t,1,-1],[o.l,o.b,-1,1],[o.r,o.b,1,1]]){const d=i.hx===a&&i.hy===l;e.beginPath(),e.rect(s-3.5,r-3.5,7,7),d&&i.kind==="scale"?(e.fillStyle=t,e.fill()):(e.fill(),e.stroke())}if(i.kind==="scale"&&(!i.hx||!i.hy)){if(e.lineWidth=2.5,e.beginPath(),i.hx){const s=i.hx<0?o.l:o.r;e.moveTo(s,o.t+8),e.lineTo(s,o.b-8)}else{const s=i.hy<0?o.t:o.b;e.moveTo(o.l+8,s),e.lineTo(o.r-8,s)}e.stroke()}this.transformLabel&&(e.font="11px Inter, sans-serif",e.fillStyle=t,e.fillText(this.transformLabel,o.r+8,o.b+14))}e.restore()}hitTest(e,t){const o=6/this.cam.z,i=this.store.ordered().filter(s=>this.editable(s));for(let s=i.length-1;s>=0;s--){const r=i[s],a=Pe(r.realize.brush,r.realize.params);if(r.role==="point"){if(r.points.some(([l,d])=>Math.hypot(l-e,d-t)<(a.size||10)/2+o))return r}else if(r.role==="note"){if(ts(vs(r),e,t))return r}else if(r.role==="image"){if(ts(r.points,e,t))return r}else{if(r.role==="plane"&&ts(r.points,e,t))return r;const l=(a.width||2)/2+o;if(_c(r.points,e,t,r.closed||r.role==="plane")<l)return r}}return null}bind(){const e=this.canvas;e.addEventListener("wheel",r=>{r.preventDefault();const[a,l]=this.local(r);r.ctrlKey||r.metaKey?this.zoomAt(a,l,Math.exp(-r.deltaY*.01)):(this.cam.x-=r.deltaX,this.cam.y-=r.deltaY,this.saveCam(),this.invalidate())},{passive:!1}),window.addEventListener("keydown",r=>{r.target.closest?.("input, textarea, select, [contenteditable]")||r.code==="Space"&&!r.shiftKey&&(this.space=!0,e.style.cursor="grab",r.preventDefault())}),window.addEventListener("keyup",r=>{r.code==="Space"&&(this.space=!1,this.updateCursor())});const t=r=>{const a=!!r.altKey;a!==this.altHeld&&(this.altHeld=a,this.paintAffected())};window.addEventListener("keydown",t),window.addEventListener("keyup",t);const o=r=>{if(r.key!=="CapsLock"&&r.code!=="CapsLock"||r.target.closest?.("input, textarea, select, [contenteditable], .cm-editor"))return;const a=performance.now();!/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent)&&r.type==="keyup"||(a-(this.lastCaps||0)<450?(this.lastCaps=0,this.flipPath()):this.lastCaps=a)};window.addEventListener("keydown",o,!0),window.addEventListener("keyup",o,!0),window.addEventListener("keydown",r=>{if(this.getTool()==="direct"&&this.selPoints?.length&&!r.target.closest?.("input, textarea, select, [contenteditable], .cm-editor")){if(r.key==="Delete"||r.key==="Backspace"){r.preventDefault(),r.stopPropagation(),this.deletePoints();return}if(r.key==="Escape"){r.stopPropagation(),this.selPoints=[],this.invalidate();return}}},!0),window.addEventListener("keydown",r=>{if(this.draft&&this.clickPath){if(r.key==="Enter"||r.key==="Escape")r.preventDefault(),r.stopPropagation(),this.finishClickPath();else if(r.key==="Backspace"||r.key==="Delete"){r.preventDefault(),r.stopPropagation();const a=this.draft.points;a.length>2?(a.splice(a.length-2,1),this.clickPath.last={t:0,p:a.at(-2)},this.invalidate()):(this.clickPath=null,this.draft=null,window.removeEventListener("pointermove",this.clickMove),this.invalidate())}}},!0),e.addEventListener("pointermove",r=>{if(this.pointer)return;const[a,l]=this.local(r),[d,c]=this.toWorld(a,l),h=this.getTool(),u=this.space?null:this.handleAt(a,l);JSON.stringify(u)!==JSON.stringify(this.hoverHandle)&&(this.hoverHandle=u,this.canvas.style.cursor=this.cursorFor(u)||"",u||this.updateCursor(),this.invalidate());const f=(h==="select"||h==="direct")&&!u&&this.hitTest(d,c)?.id||null;f!==this.hovered&&(this.hovered=f,this.invalidate());const p=h==="sculpt"||r.shiftKey&&Eo.has(h)&&this.sculptTargets(d,c).length;(p||this.brushAt)&&(this.brushAt=p?[a,l]:null,this.invalidate()),this.lastLocal=[a,l],(this.affectedShown()||this.affectedCanvas?.width)&&this.paintAffected()}),e.addEventListener("pointerleave",()=>{this.lastLocal=null,this.paintAffected(),this.brushAt&&(this.brushAt=null,this.invalidate())});const i=this.host;i.addEventListener("dragover",r=>{if(![...r.dataTransfer.types].some(l=>l==="text/asset-id"||l==="text/ams-source"||l==="Files"))return;r.preventDefault();const a=r.dataTransfer.effectAllowed;r.dataTransfer.dropEffect=a==="move"?"move":"copy",i.classList.add("wb-drop-target")}),i.addEventListener("dragleave",r=>{i.contains(r.relatedTarget)||i.classList.remove("wb-drop-target")}),i.addEventListener("drop",r=>{i.classList.remove("wb-drop-target"),r.preventDefault();const a=this.toWorld(...this.local(r)),l=r.dataTransfer.getData("text/asset-id"),d=r.dataTransfer.getData("text/ams-source");d?this.onDropSource?.(d,a):l?this.onDropAsset?.(l,a):r.dataTransfer.files?.length&&this.onDropFiles?.([...r.dataTransfer.files],a)}),e.addEventListener("dblclick",r=>{if(this.getTool()==="direct"){this.insertPointAt(...this.local(r));return}const a=this.boardHandleAt(...this.local(r));a?.kind==="title"&&(r.shiftKey?this.onBoardRename?.(a.id):this.animateTo(this.camFor(a.id),400))}),e.addEventListener("contextmenu",r=>{if(r.preventDefault(),this.pointer||this.draft)return;if(r.ctrlKey&&r.button===2&&this.onPaintPicker){(r.shiftKey&&this.onGridMenu?this.onGridMenu:this.onPaintPicker)(r);return}if(r.ctrlKey&&Lo.has(this.getTool()))return;if(r.shiftKey&&this.onToolDetails){this.onToolDetails(r);return}const a=this.boardHandleAt(...this.local(r));if(a){this.selectBoard(a.id),(r.altKey&&this.onBoardParams?this.onBoardParams:this.onBoardContext)?.(a.id,r);return}const[l,d]=this.toWorld(...this.local(r)),c=this.hitTest(l,d);if(c&&!this.selected.has(c.id)){const h=c.group&&!(r.metaKey||r.ctrlKey)?this.store.doc.elements.filter(u=>u.group===c.group&&this.editable(u)).map(u=>u.id):[c.id];this.select(h)}this.onContext?.(r,c,[l,d])});const s=(r,a)=>{if(!r.metaKey&&!r.ctrlKey||r.button!==0||this.previewDoc||this.space||this.clickPath||this.draft||Lo.has(this.getTool())||a===e&&this.getTool()==="select"&&this.handleAt(...this.local(r)))return!1;const[l,d]=this.toWorld(...this.local(r));if(a===e?this.hitTest(l,d):null)return queueMicrotask(()=>this.onOpenProperties?.()),!1;const h=mt(this.store.doc,l,d);return h?(r.preventDefault(),r.stopPropagation(),this.selectBoard(h.id),this.onOpenProperties?.(),!0):!1};this.host.addEventListener("pointerdown",r=>{r.target!==e&&r.target.closest?.(".wb-frames")&&s(r,r.target)},!0),e.addEventListener("pointerdown",r=>{if(s(r,e))return;const a=document.activeElement;if(a&&a!==document.body&&a.closest?.("input, textarea, select, [contenteditable]")&&!a.classList.contains("wb-note-input")&&a.blur(),r.button===1||this.space||this.getTool()==="hand"||this.previewDoc)return this.startPan(r);if(r.button!==0)return;if(this.clickPath){this.clickPathClick(r);return}e.setPointerCapture(r.pointerId);const[l,d]=this.local(r),[c,h]=this.toWorld(l,d);this.workBoard=mt(this.store.doc,c,h)?.id||ve;const u=this.getTool(),f=this.runButtonAt(l,d);if(f){this.pointer=!1,this.onToggleRun?.(f,r);return}if(u==="laser")return this.startLaser(r,c,h);if(u==="direct")return this.startDirect(r,l,d,c,h);if(u==="select"||u==="board"){const b=this.boardHandleAt(l,d);if(b)return this.startBoardDrag(r,b);if(u==="board")return this.startBoardRect(r,c,h);this.selectedBoard&&!this.hitTest(c,h)&&!r.shiftKey&&this.selectBoard(null)}if(u==="sculpt"||r.shiftKey&&Eo.has(u)&&this.sculptTargets(c,h).length&&!(u==="select"&&this.handleAt(l,d)))return this.startSculpt(r,c,h,u==="sculpt"?null:()=>{u==="select"&&this.startSelectClick(r,c,h)});if(u==="select"){const b=this.handleAt(l,d);return b?this.startTransform(r,b):this.startSelect(r,c,h)}const p=this.getStage();if(!p||p.locked){this.flash("This stage is locked");return}const m=mt(this.store.doc,c,h);if(m&&(m.locked||m.hidden)){this.flash(m.locked?"This board is locked":"This board is hidden");return}if(u==="point"){const[b,g]=this.snapPt(c,h);return this.commitNew("point",[[b,g,0,.5]])}if(u==="note"){const[b,g]=this.snapPt(c,h),[w,y]=this.toScreen(b,g);return this.startNote(w,y,b,g)}if(u==="circle"||u==="rect")return this.startShape(r,u,c,h);this.startStroke(r,u,c,h)})}boardOnScreen(e,t=.25){const o=t*Math.max(e.width,e.height),[i,s]=this.toScreen(e.x-o,e.y-o),[r,a]=this.toScreen(e.x+e.width+o,e.y+e.height+o);return r>0&&a>0&&i<this.w&&s<this.h}drawBaked(e,t){const o=new Set;if(this.previewDoc||!this.isBoardLive||this.bakeOff)return o;const i=V(t);if(i.length<2)return o;const s=new Map(t.elements.map(u=>[u.id,u])),r=new Set([this.selectedBoard,this.pointer?this.workBoard:null,...[...this.selected,this.hovered].map(u=>s.get(u)).filter(Boolean).map(u=>u.board||H)]),a=this.viewMode(),l=this.dpr,d=this.cam.z,c=Math.pow(2,Math.round(Math.log2(d)*2)/2);let h=null;for(const u of i){if(u.hidden||this.composedIds?.has(u.id)){this.baked.delete(u.id),o.add(u.id);continue}if(this.isBoardLive(u.id)){this.baked.delete(u.id);continue}if(r.has(u.id))continue;if(!this.boardOnScreen(u)){o.add(u.id),this.baked.delete(u.id);continue}const f=.25*Math.max(u.width,u.height),p=u.width+2*f,m=u.height+2*f,b=c*l;if(Math.max(p,m)*b>2*Math.max(this.w,this.h)*l){this.baked.delete(u.id);continue}o.add(u.id);const g=`${b.toFixed(4)}|${a}|${this.upTo}`;let w=this.baked.get(u.id);if(!w||w.key!==g||!w.canvas.width||!w.canvas.height){if(!h){h=new Map;for(const v of t.elements){const T=v.board||H;(h.get(T)||h.set(T,[]).get(T)).push(v)}}const k=document.createElement("canvas");k.width=Math.max(1,Math.round(p*b)),k.height=Math.max(1,Math.round(m*b)),bt(k.getContext("2d"),{...t,elements:h.get(u.id)||[]},{mode:a,upTo:this.upTo,transform:{x:(f-u.x)*b,y:(f-u.y)*b,scale:b},ground:!1,screenNotes:!0,frozen:!0,now:this.frameNow}),w={key:g,canvas:k},this.baked.set(u.id,w)}const[y,S]=this.toScreen(u.x-f,u.y-f);e.drawImage(w.canvas,y,S,p*d,m*d)}return o}drawBoards(e,t){const o=this.store.doc,i=V(o);if(this.boardLabels=[],this.runButtons=[],this.presenting||i.length<2&&!this.selectedBoard)return;const s=t.getPropertyValue("--wb-text").trim()||"#ddd",r=t.getPropertyValue("--wb-muted").trim()||"#888",a=t.getPropertyValue("--wb-accent-2").trim()||"#c8664f",l=t.getPropertyValue("--wb-select").trim()||"#8a8a8a";e.save(),e.font="12px ui-sans-serif, system-ui, sans-serif",e.textBaseline="bottom",i.forEach((d,c)=>{const[h,u]=this.toScreen(d.x,d.y),f=d.width*this.cam.z,p=d.height*this.cam.z,m=this.selectedBoard===d.id||this.boardSet.has(d.id),b=this.boardPerf?.(d);b&&(e.save(),e.fillStyle=r,e.font="11px ui-monospace, Menlo, monospace",e.textBaseline="top",e.fillText(b,h,u+p+6,Math.max(120,f*1.6)),e.restore());const g=d.hideLabel&&!m;if(d.kind==="player"&&d.hidden)return;const w=`${c+1}  ${d.title}${this.showTrain!==!1&&(o.train===d.id||!o.train&&d.main&&i.length>1)?"  ·  trains":""}`,y=d.kind==="p5"||!d.kind&&!!(d.follow||d.source||d.code);if(g&&!y)return;const S=y?14:0,k=(d.locked?1:0)+(d.hidden?1:0),v=Math.max(40,f-S-k*16),T=Math.min(e.measureText(w).width,v);if(y){const L=e.measureText("0"),A=Math.round(u-5-(L.fontBoundingBoxDescent??3)-L.actualBoundingBoxAscent/2)+.5,P=!!this.isBoardLive?.(d.id),$=h;e.save(),e.fillStyle=r,P?(e.fillRect($,A-3.5,2.5,7),e.fillRect($+5,A-3.5,2.5,7)):(e.beginPath(),e.moveTo($,A-3.5),e.lineTo($+7,A),e.lineTo($,A+3.5),e.closePath(),e.fill()),e.restore(),this.runButtons.push({id:d.id,x:$-4,y:A-10,w:18,h:20})}if(g)return;e.fillStyle=m?s:r,e.fillText(w,h+S,u-5,v),this.boardLabels.push({id:d.id,x:h+S-2,y:u-20,w:T+4,h:18});let x=h+S+T+8;e.save(),e.strokeStyle=r,e.lineWidth=1.3,e.lineJoin="round",e.lineCap="round",d.locked&&(e.strokeRect(x+1.5,u-12,8,6),e.beginPath(),e.moveTo(x+3.5,u-12),e.lineTo(x+3.5,u-14.5),e.arc(x+5.5,u-14.5,2,Math.PI,0),e.lineTo(x+7.5,u-12),e.stroke(),x+=16),d.hidden&&(e.beginPath(),e.moveTo(x,u-9),e.quadraticCurveTo(x+5.5,u-16,x+11,u-9),e.quadraticCurveTo(x+5.5,u-2,x,u-9),e.moveTo(x+1,u-3),e.lineTo(x+10,u-15),e.stroke()),e.restore(),m&&(e.strokeStyle=l,e.lineWidth=1.5,e.strokeRect(h-.5,u-.5,f+1,p+1),this.boardSet.size<=1&&(e.fillStyle=a,e.fillRect(h+f-5,u+p-5,10,10)))}),e.restore()}runButtonAt(e,t){const o=(this.runButtons||[]).find(i=>e>=i.x&&e<=i.x+i.w&&t>=i.y&&t<=i.y+i.h);return o?o.id:null}boardHandleAt(e,t){const o=this.store.doc;if(this.selectedBoard&&this.boardSet.size<=1){const s=V(o).find(r=>r.id===this.selectedBoard);if(s){const[r,a]=this.toScreen(s.x+s.width,s.y+s.height);if(Math.abs(e-r)<8&&Math.abs(t-a)<8)return{id:s.id,kind:"resize"}}}const i=(this.boardLabels||[]).find(s=>e>=s.x&&e<=s.x+s.w&&t>=s.y&&t<=s.y+s.h);return i?{id:i.id,kind:"title"}:null}selectBoard(e,t=!1){e&&this.selected.size&&this.select([]),e?t?this.boardSet.has(e)?(this.boardSet.delete(e),this.selectedBoard=[...this.boardSet].at(-1)||null):(this.selectedBoard&&this.boardSet.add(this.selectedBoard),this.boardSet.add(e),this.selectedBoard=e):(this.boardSet=new Set([e]),this.selectedBoard=e):(this.boardSet.clear(),this.selectedBoard=null),this.selectedBoard&&this.onBoardSelect?.(this.selectedBoard),this.invalidate()}selectBoards(e,t=!1){e.length&&(this.selected.size&&this.select([]),this.boardSet=new Set([...t?[...this.boardSet,...this.selectedBoard?[this.selectedBoard]:[]]:[],...e]),this.selectedBoard=e.at(-1),this.onBoardSelect?.(this.selectedBoard),this.invalidate())}startBoardDrag(e,t){const o=this.store.doc,i=V(o).find(y=>y.id===t.id);if(!i)return;if(e.shiftKey&&t.kind==="title"){this.selectBoard(t.id,!0);return}t.kind==="title"&&this.boardSet.has(t.id)&&this.boardSet.size>1||this.selectBoard(t.id);const s=t.kind==="title"&&this.boardSet.size>1?V(o).filter(y=>this.boardSet.has(y.id)&&!y.main&&!y.locked):[];if(t.kind==="title"&&i.main&&!s.length)return;if(i.locked){this.flash("This board is locked");return}const r=JSON.stringify(o),[a,l]=this.toWorld(...this.local(e)),d=s.length?s:[i],c=t.kind==="title"?d.filter(y=>y.kind==="frame").flatMap(y=>Tn(o,y)).filter(y=>!y.main&&!d.some(S=>S.id===y.id)):[],h=new Set(c.map(y=>y.id)),u=new Set(d.filter(y=>!y.main).map(y=>y.id)),f=o.elements.filter(y=>u.has(y.board)||h.has(y.board)).map(y=>[y,y.points.map(S=>S.slice())]),p=c.map(y=>[o.boards.find(S=>S.id===y.id),y.x,y.y]),m=d.filter(y=>y.id!==t.id&&!y.main).map(y=>[o.boards.find(S=>S.id===y.id),y.x,y.y]);let b=!1;this.pointer=!0;const g=y=>{const[S,k]=this.toWorld(...this.local(y));let v=S-a,T=k-l;if(!(!b&&Math.hypot(v,T)*this.cam.z<3)){if(b=!0,t.kind==="resize"){let[x,L]=[Math.max(40,i.width+v),Math.max(40,i.height+T)];this.grid.snap&&([x,L]=this.snapPt(x,L)),i.main?Object.assign(o.artboard,{width:Math.round(x),height:Math.round(L)}):Object.assign(o.boards.find(A=>A.id===t.id),{width:Math.round(x),height:Math.round(L)})}else{if(this.grid.snap){const[x,L]=this.snapPt(i.x+v,i.y+T);v=x-i.x,T=L-i.y}Object.assign(o.boards.find(x=>x.id===t.id)||{},{x:Math.round(i.x+v),y:Math.round(i.y+T)});for(const[x,L,A]of m)Object.assign(x,{x:L+Math.round(i.x+v)-i.x,y:A+Math.round(i.y+T)-i.y});for(const[x,L,A]of p)Object.assign(x,{x:L+Math.round(i.x+v)-i.x,y:A+Math.round(i.y+T)-i.y});for(const[x,L]of f)x.points=L.map(([A,P,$,E])=>[A+Math.round(i.x+v)-i.x,P+Math.round(i.y+T)-i.y,$,E])}this.invalidate()}},w=()=>{window.removeEventListener("pointermove",g),window.removeEventListener("pointerup",w),this.pointer=!1,b&&this.store.commitFrom(r,t.kind==="resize"?"resize board":"move board")};window.addEventListener("pointermove",g),window.addEventListener("pointerup",w)}pathMarks(){return[...this.selected].map(e=>this.store.doc.elements.find(t=>t.id===e)).filter(e=>e&&e.points.length>2&&!["point","note","image"].includes(e.role))}pathIsStraight(){return(this.draft||this.pathMarks()[0])?.path==="straight"}setPath(e,{marks:t=!0}={}){const o=e==="straight";if(this.draft)return this.draft.path=o?"straight":void 0,this.flash(o?"Straight":"Smooth"),this.invalidate(),!0;const i=t?this.pathMarks().map(s=>s.id):[];return i.length?(this.store.change("path",s=>{for(const r of s.elements)i.includes(r.id)&&(o?r.path="straight":delete r.path)}),this.flash(o?"Straight":"Smooth"),!0):!1}flipPath(){return this.onFlipPath?this.onFlipPath():this.setPath(this.pathIsStraight()?"smooth":"straight")}pointAt(e,t){const i=new Set([...this.selected,this.hovered].filter(Boolean));let s=7,r=null;for(const a of this.store.doc.elements)!i.has(a.id)||!this.editable(a)||a.points.forEach((l,d)=>{const[c,h]=this.toScreen(l[0],l[1]),u=Math.hypot(c-e,h-t);u<s&&(s=u,r={id:a.id,i:d})});return r}startDirect(e,t,o,i,s){this.selPoints||=[];const r=this.pointAt(t,o),a=m=>`${m.id}:${m.i}`;if(!r){const m=this.hitTest(i,s);if(m){this.select([m.id],e.shiftKey),e.shiftKey||(this.selPoints=[]),this.invalidate();return}e.shiftKey||(this.selPoints=[],this.select([])),this.marquee={x0:i,y0:s,x1:i,y1:s},this.pointer=!0;const b=w=>{const[y,S]=this.toWorld(...this.local(w));this.marquee.x1=y,this.marquee.y1=S,this.invalidate()},g=()=>{window.removeEventListener("pointermove",b),window.removeEventListener("pointerup",g),this.pointer=!1;const w=this.marquee;this.marquee=null;const[y,S]=[Math.min(w.x0,w.x1),Math.max(w.x0,w.x1)],[k,v]=[Math.min(w.y0,w.y1),Math.max(w.y0,w.y1)],T=[];for(const L of this.store.doc.elements)!this.editable(L)||L.hidden||["note","image"].includes(L.role)||L.points.forEach((A,P)=>{A[0]>=y&&A[0]<=S&&A[1]>=k&&A[1]<=v&&T.push({id:L.id,i:P})});const x=new Set(this.selPoints.map(a));this.selPoints=[...this.selPoints,...T.filter(L=>!x.has(a(L)))],this.select([...new Set(this.selPoints.map(L=>L.id))],!0),this.invalidate()};window.addEventListener("pointermove",b),window.addEventListener("pointerup",g);return}const l=this.selPoints.some(m=>a(m)===a(r));e.shiftKey?this.selPoints=l?this.selPoints.filter(m=>a(m)!==a(r)):[...this.selPoints,r]:l||(this.selPoints=[r]),this.selected.has(r.id)||this.select([...this.selected,r.id]);const d=JSON.stringify(this.store.doc),c=this.selPoints.map(m=>{const b=this.store.doc.elements.find(g=>g.id===m.id);return{...m,q:b.points[m.i].slice()}}),h=this.store.doc.elements.find(m=>m.id===r.id).points[r.i].slice();let u=!1;this.pointer=!0;const f=m=>{let[b,g]=this.toWorld(...this.local(m));if(!u&&Math.hypot(m.clientX-e.clientX,m.clientY-e.clientY)<3)return;u=!0;let w=b-i,y=g-s;if(m.ctrlKey||this.grid.snap){const S=this.grid.spacing/Math.max(1,this.grid.subdivisions);if(this.grid.snapMode==="increments")w=Math.round(w/S)*S,y=Math.round(y/S)*S;else{const k=new Set,[v,T]=this.snapTarget(h[0]+w,h[1]+y,k);w=v-h[0],y=T-h[1]}}for(const S of c){const k=this.store.doc.elements.find(v=>v.id===S.id);k?.points[S.i]&&(k.points[S.i]=[S.q[0]+w,S.q[1]+y,S.q[2],S.q[3]])}this.invalidate()},p=()=>{window.removeEventListener("pointermove",f),window.removeEventListener("pointerup",p),this.pointer=!1,u&&this.store.commitFrom(d,"move points"),this.invalidate()};window.addEventListener("pointermove",f),window.addEventListener("pointerup",p)}insertPointAt(e,t){const[o,i]=this.toWorld(e,t),s=6/this.cam.z;for(const r of this.store.doc.elements){if(!this.selected.has(r.id)||r.points.length<2)continue;const a=r.points.length,l=r.closed?a:a-1;for(let d=0;d<l;d++){const c=r.points[d],h=r.points[(d+1)%a],u=h[0]-c[0],f=h[1]-c[1],p=u*u+f*f,m=p?Math.max(0,Math.min(1,((o-c[0])*u+(i-c[1])*f)/p)):0;if(Math.hypot(c[0]+u*m-o,c[1]+f*m-i)>s)continue;const b=c.map((g,w)=>g+((h[w]??g)-g)*m);return this.store.change("add point",g=>{g.elements.find(y=>y.id===r.id).points.splice(d+1,0,b)}),this.selPoints=[{id:r.id,i:d+1}],this.invalidate(),!0}}return!1}deletePoints(){if(!this.selPoints?.length)return!1;const e=new Map;for(const t of this.selPoints)e.has(t.id)||e.set(t.id,new Set),e.get(t.id).add(t.i);return this.store.change("delete points",t=>{t.elements=t.elements.filter(o=>{const i=e.get(o.id);return i?(o.points=o.points.filter((s,r)=>!i.has(r)),o.points.length>=(o.role==="plane"?3:o.role==="point"?1:2)):!0})}),this.selPoints=[],this.invalidate(),!0}startClickPath(e,t){const o=this.draft.points[0];this.clickPath={role:e,dkey:t,t0:performance.now(),last:{t:performance.now(),p:o}},this.draft.points=[o,o.slice()],this.clickMove=i=>{if(!this.clickPath||!this.draft)return;let[s,r]=this.toWorld(...this.local(i));i.ctrlKey&&([s,r]=this.snapTarget(s,r)),i.shiftKey&&this.clickPath.role==="guide"&&([s,r]=Zn(this.draft.points[this.draft.points.length-2],[s,r])),this.draft.points[this.draft.points.length-1]=[s,r,performance.now()-this.clickPath.t0,.5],this.invalidate()},window.addEventListener("pointermove",this.clickMove),this.invalidate()}clickPathClick(e){const t=this.clickPath,o=this.draft.points.slice(0,-1);let[i,s]=this.toWorld(...this.local(e));e.ctrlKey&&([i,s]=this.snapTarget(i,s)),e.shiftKey&&t.role==="guide"&&o.length&&([i,s]=Zn(o.at(-1),[i,s]));const r=performance.now(),a=(d,c,h)=>Math.hypot(d[0]-c[0],d[1]-c[1])<h/this.cam.z;if(o.length>=2&&a([i,s],o[0],8))return this.finishClickPath({close:!0});if(r-t.last.t<350&&a([i,s],t.last.p,6))return this.finishClickPath();const l=[i,s,r-t.t0,.5];t.last={t:r,p:l},this.draft.points=[...o,l,l.slice()],this.invalidate()}finishClickPath({close:e=!1}={}){const t=this.clickPath;if(!t)return;window.removeEventListener("pointermove",this.clickMove);let o=this.draft?this.draft.points.slice(0,-1):[];const i=this.draft?.path;for(;o.length>1&&Math.hypot(o.at(-1)[0]-o.at(-2)[0],o.at(-1)[1]-o.at(-2)[1])<1e-6;)o=o.slice(0,-1);this.clickPath=null,this.draft=null;const s={...i==="straight"?{path:"straight"}:{},...e&&t.role!=="plane"?{closed:!0}:{}};o.length>=(t.role==="plane"?3:2)&&this.commitNew(t.role,o,s,t.dkey),this.invalidate()}startBoardRect(e,t,o){[t,o]=this.snapPt(t,o),this.marquee={x0:t,y0:o,x1:t,y1:o},this.pointer=!0;const i=r=>{let[a,l]=this.toWorld(...this.local(r));if([a,l]=this.snapPt(a,l),r.shiftKey){const d=Math.max(Math.abs(a-t),Math.abs(l-o));a=t+Math.sign(a-t||1)*d,l=o+Math.sign(l-o||1)*d}this.marquee.x1=a,this.marquee.y1=l,this.invalidate()},s=()=>{window.removeEventListener("pointermove",i),window.removeEventListener("pointerup",s),this.pointer=!1;const r=this.marquee;this.marquee=null;const a=Math.min(r.x0,r.x1),l=Math.min(r.y0,r.y1),d=Math.abs(r.x1-r.x0),c=Math.abs(r.y1-r.y0);if(d*this.cam.z>12&&c*this.cam.z>12){const h=this.store.addBoard({x:Math.round(a),y:Math.round(l),width:Math.round(d),height:Math.round(c)});this.selectBoard(h.id),this.onTool?.("select")}this.invalidate()};window.addEventListener("pointermove",i),window.addEventListener("pointerup",s)}rehome(e){const t=new Set(e);for(const o of this.store.doc.elements){if(!t.has(o.id))continue;const i=us(this.store.doc,o.points);i===H?delete o.board:o.board=i}}affectedShown(){const e=this.getTool();return!!this.lastLocal&&(!this.pointer||!!this.sculptDrag)&&!this.space&&(e==="direct"||!!this.altHeld)&&!["hand","laser","note","point","board"].includes(e)}paintAffected(){if(!this.affectedCanvas){const s=document.createElement("canvas");s.className="wb-affected",Object.assign(s.style,{position:"absolute",left:"0",top:"0",pointerEvents:"none",zIndex:"55"}),this.host.appendChild(s),this.affectedCanvas=s}const e=this.affectedCanvas,t=this.canvas.width,o=this.canvas.height;(e.width!==t||e.height!==o)&&(e.width=t,e.height=o),e.style.width=this.canvas.style.width,e.style.height=this.canvas.style.height;const i=e.getContext("2d");i.setTransform(1,0,0,1,0,0),i.clearRect(0,0,t,o),this.affectedShown()&&(i.setTransform(this.dpr,0,0,this.dpr,0,0),this.drawAffected(i,getComputedStyle(document.documentElement)))}drawAffected(e,t){const[o,i]=this.lastLocal,s=this.getSculpt?.()?.radius||40,[r,a]=this.toWorld(o,i);e.save(),e.strokeStyle=t.getPropertyValue("--wb-text").trim()||"#888",e.globalAlpha=.6,e.lineWidth=1,e.beginPath(),e.arc(o,i,s,0,Math.PI*2),e.stroke();const l=t.getPropertyValue("--wb-accent-2").trim()||"#c8664f",d=t.getPropertyValue("--wb-panel").trim()||"#f3efe6",c=this.sculptTargets(r,a);e.lineWidth=2,e.lineJoin="round",e.lineCap="round",e.strokeStyle=l;for(const h of c){const u=h.points.map(p=>{const[m,b]=this.toScreen(p[0],p[1]);return[m,b,0,.5]}),f=h.path==="straight"||u.length<3?u:Rn(u,!!h.closed);e.globalAlpha=.85,e.beginPath(),f.forEach(([p,m],b)=>b?e.lineTo(p,m):e.moveTo(p,m)),h.closed&&e.closePath(),e.stroke()}for(const h of c)for(const u of h.points){const[f,p]=this.toScreen(u[0],u[1]),m=Math.hypot(f-o,p-i),b=m<s,g=b?Ns(m,s):0;e.globalAlpha=b?.5+.5*g:.7,e.beginPath(),e.arc(f,p,b?3+3*g:2,0,Math.PI*2),e.fillStyle=l,e.fill(),e.lineWidth=1,e.strokeStyle=d,e.stroke()}e.restore()}sculptTargets(e,t){const o=(this.getSculpt?.().radius||40)/this.cam.z,i=this.store.doc,s=l=>{const d=i.stages.find(c=>c.id===l.stage);return d&&d.visible&&!d.locked},r=i.elements.filter(l=>Jn(l)&&this.editable(l)&&!l.hidden&&s(l)),a=r.filter(l=>this.selected.has(l.id));return(a.length?a:r).filter(l=>Yt(l.points,e,t,o,l.closed))}startSculpt(e,t,o,i=null){const s=this.getSculpt(),r=JSON.stringify(this.store.doc),a=new Map;let l=[t,o],d=!1,c=!0;const h=[...this.selected].filter(w=>this.store.doc.elements.some(y=>y.id===w&&Jn(y))),u=vt((Date.now()&65535)+1),f=mt(this.store.doc,t,o)||V(this.store.doc)[0],p={x:f.x,y:f.y,width:f.width,height:f.height};this.pointer=!0,this.sculptDrag=!0;const m=w=>{const[y,S]=this.local(w),[k,v]=this.toWorld(y,S);this.brushAt=[y,S],this.lastLocal=[y,S];const T={x:k,y:v,dx:k-l[0],dy:v-l[1],radius:s.radius/this.cam.z,strength:s.strength,pressure:w.pointerType==="pen"?(w.pressure||.5)*2:1,invert:w.altKey,boost:w.metaKey||w.ctrlKey,first:c,start:[t,o],board:p},x=h.length?this.store.doc.elements.filter(L=>h.includes(L.id)):this.store.doc.elements.filter(L=>Jn(L)&&this.editable(L)&&!L.hidden);for(const L of x){a.has(L.id)||a.set(L.id,{orig:L.points.map($=>$.slice()),state:{}});const A=ma(s.tool,T.boost),P=ga(A,L,T,s.params?.[A],u,a.get(L.id));P&&(L.points=P)}c=!1,l=[k,v],this.invalidate(),this.paintAffected()},b=w=>{!d&&Math.hypot(w.clientX-e.clientX,w.clientY-e.clientY)<3||(d=!0,m(w))},g=()=>{window.removeEventListener("pointermove",b),window.removeEventListener("pointerup",g),this.pointer=!1,this.sculptDrag=!1,d?this.store.commitFrom(r,`sculpt: ${s.tool}`):i?i():(m(e),this.store.commitFrom(r,`sculpt: ${s.tool}`)),this.invalidate()};window.addEventListener("pointermove",b),window.addEventListener("pointerup",g)}startSelectClick(e,t,o){const i=this.hitTest(t,o);if(!i)return;const s=i.group&&!(e.metaKey||e.ctrlKey)?this.store.doc.elements.filter(r=>r.group===i.group&&this.editable(r)).map(r=>r.id):[i.id];this.selected.has(i.id)?this.select([...this.selected].filter(r=>!s.includes(r))):this.select(s,!0)}startPan(e){const t=e.clientX,o=e.clientY,i=this.cam.x,s=this.cam.y;this.canvas.style.cursor="grabbing";const r=l=>{this.cam.x=i+l.clientX-t,this.cam.y=s+l.clientY-o,this.invalidate()},a=()=>{window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",a),this.saveCam(),this.updateCursor()};window.addEventListener("pointermove",r),window.addEventListener("pointerup",a)}startSelect(e,t,o){const i=this.hitTest(t,o);if(i){const a=i.group&&!(e.metaKey||e.ctrlKey)?this.store.doc.elements.filter(m=>m.group===i.group&&this.editable(m)).map(m=>m.id):[i.id];(!this.selected.has(i.id)||e.metaKey||e.ctrlKey)&&this.select(a,e.shiftKey);const l=JSON.stringify(this.store.doc);let d=!1;this.pointer=!0;const c=new Map(this.store.doc.elements.filter(m=>this.selected.has(m.id)).map(m=>[m.id,m.points.map(b=>b.slice())]));this.selectionBounds();let h=null,u=1/0;for(const[,m]of c)for(const b of m){const g=Math.hypot(b[0]-t,b[1]-o);g<u&&(u=g,h=b)}const f=m=>{const[b,g]=this.toWorld(...this.local(m));let w=b-t,y=g-o;if(this.grid.snap||m.ctrlKey){const S=this.grid.spacing/Math.max(1,this.grid.subdivisions);if(this.grid.snapMode==="increments")w=Math.round(w/S)*S,y=Math.round(y/S)*S;else if(h){const[k,v]=this.snapTarget(h[0]+w,h[1]+y,this.selected);w=k-h[0],y=v-h[1]}}if(!(!w&&!y&&!d)){d=!0;for(const S of this.store.doc.elements){const k=c.get(S.id);k&&(S.points=k.map(([v,T,x,L])=>[v+w,T+y,x,L]))}this.invalidate()}},p=()=>{window.removeEventListener("pointermove",f),window.removeEventListener("pointerup",p),this.pointer=!1,d&&(this.rehome(c.keys()),this.store.commitFrom(l,"move"))};window.addEventListener("pointermove",f),window.addEventListener("pointerup",p);return}e.shiftKey||this.select([]),this.marquee={x0:t,y0:o,x1:t,y1:o},this.pointer=!0;const s=a=>{const[l,d]=this.toWorld(...this.local(a));this.marquee.x1=l,this.marquee.y1=d,this.invalidate()},r=()=>{window.removeEventListener("pointermove",s),window.removeEventListener("pointerup",r),this.pointer=!1;const a=this.marquee;this.marquee=null;const[l,d]=[Math.min(a.x0,a.x1),Math.max(a.x0,a.x1)],[c,h]=[Math.min(a.y0,a.y1),Math.max(a.y0,a.y1)];if(d-l>2/this.cam.z||h-c>2/this.cam.z){const u=V(this.store.doc).filter(b=>!b.main&&b.x>=l&&b.y>=c&&b.x+b.width<=d&&b.y+b.height<=h),f=new Set(u.map(b=>b.id)),p=this.store.doc.elements.filter(b=>this.editable(b)&&!f.has(b.board)&&b.points.every(([g,w])=>g>=l&&g<=d&&w>=c&&w<=h)).map(b=>b.id);if(u.length&&!p.length){this.selectBoards(u.map(b=>b.id),e.shiftKey),this.invalidate();return}const m=new Set(this.store.doc.elements.filter(b=>p.includes(b.id)&&b.group).map(b=>b.group));this.select([...p,...this.store.doc.elements.filter(b=>m.has(b.group)&&this.editable(b)).map(b=>b.id)],!0)}this.invalidate()};window.addEventListener("pointermove",s),window.addEventListener("pointerup",r)}startStroke(e,t,o,i){const s=performance.now();this.selected.size&&this.select([]),t==="guide"&&([o,i]=this.snapPt(o,i)),e.ctrlKey&&t!=="guide"&&([o,i]=this.snapTarget(o,i));const r=t==="brush"?this.getDefaults("brush").role||"line":t,a=t==="brush"?"brush":r,l=this.getDefaults(a);this.draft=Ne({role:r,stage:"draft",points:[[o,i,0,Co(e,0)]],realize:l.realize,color:l.color,...l.fill?{fill:l.fill}:{},...l.path==="straight"?{path:"straight"}:{},seed:1},"draft");let d=[o,i,s];this.pointer=!0;const c=t==="guide";this.draftStraight=c;const h=l.lazy||{},u={...this.getLazy?.()||{radius:0,smoothing:0},radius:h.on?h.radius??40:0};h.on||(u.smoothing=0);const f=!c&&(u.radius>0||u.smoothing>0),p=f&&h.catch!==!1;let m=[o,i],b=[o,i],g=!!e.ctrlKey;const w=(P,$,E)=>{if(E.ctrlKey){g=!0,[P,$]=this.snapTarget(P,$);const j=this.draft.points[this.draft.points.length-1];if(j&&j[0]===P&&j[1]===$)return}const I=Math.hypot(P-d[0],$-d[1]);if(I<1.5/this.cam.z&&!E.ctrlKey)return;const R=I*this.cam.z/Math.max(1,performance.now()-d[2]);this.draft.points.push([P,$,performance.now()-s,Co(E,R)]),d=[P,$,performance.now()]},y=360,S=80;let k=performance.now(),v=performance.now(),T=0;const x=P=>{k=performance.now();let[$,E]=this.toWorld(...this.local(P));if(f&&(m=Ic(m,b,[$,E],u.radius/this.cam.z,u.smoothing,2/this.cam.z),b=[$,E],this.rope={pen:m.slice(),cursor:[$,E],radius:u.radius},[$,E]=m),c){let[I,R]=[$,E];P.shiftKey?[I,R]=Zn([o,i],[$,E]):[I,R]=this.snapPt(I,R),this.draft.points=[this.draft.points[0],[I,R,performance.now()-s,.5]]}else w($,E,P);this.invalidate()},L=()=>{if(T=0,!this.draft)return;const P=performance.now(),$=P-v;v=P,P-k>=S&&Math.hypot(b[0]-m[0],b[1]-m[1])*this.cam.z>.5&&(m=Oc(m,b,$,y),this.rope={pen:m.slice(),cursor:b.slice(),radius:u.radius},w(m[0],m[1],{ctrlKey:!1,pointerType:"mouse"}),this.invalidate()),T=requestAnimationFrame(L)};p&&(T=requestAnimationFrame(L));const A=()=>{if(window.removeEventListener("pointermove",x),window.removeEventListener("pointerup",A),this.pointer=!1,cancelAnimationFrame(T),T=0,p&&this.draft&&this.draft.points.length>1&&(m=b,w(b[0],b[1],{ctrlKey:!1,pointerType:"mouse"})),this.draft.points.length===1&&t!=="point"){this.rope=null,this.startClickPath(r,a);return}let P=this.draft.points;const $=this.draft.path;this.draft=null,this.rope=null,r==="plane"&&!g?P=Ao(Io(P,.75/this.cam.z),6/this.cam.z):r==="plane"&&P.length>3&&P[0][0]===P.at(-1)[0]&&P[0][1]===P.at(-1)[1]&&(P=P.slice(0,-1));const E=r==="plane"?3:2;if(!c&&r!=="plane"&&!g&&(P=Io(P,.75/this.cam.z)),!c&&u.simplify>0&&P.length>3){const R=Nt(P,u.simplify/this.cam.z);R.length>=E&&(P=R)}let I=$==="straight"?{path:"straight"}:{};r!=="plane"&&!c&&P.length>3&&Math.hypot(P[0][0]-P.at(-1)[0],P[0][1]-P.at(-1)[1])<6/this.cam.z&&(P=P.slice(0,-1),I={...I,closed:!0}),P.length>=E?this.commitNew(r,P,I,a):this.invalidate()};window.addEventListener("pointermove",x),window.addEventListener("pointerup",A)}startShape(e,t,o,i){this.selected.size&&this.select([]);const s=(f,p,m)=>f.ctrlKey?this.snapTarget(p,m):this.snapPt(p,m),[r,a]=s(e,o,i),l=this.getDefaults("plane"),d=t==="rect"||l.path==="straight"?"straight":void 0;let c=!1;this.pointer=!0,this.draftShape=!0;const h=f=>{let[p,m]=this.toWorld(...this.local(f));[p,m]=s(f,p,m);let b=p-r,g=m-a;if(!c&&Math.hypot(b,g)*this.cam.z<3)return;if(c=!0,f.shiftKey){const T=Math.max(Math.abs(b),Math.abs(g));b=Math.sign(b||1)*T,g=Math.sign(g||1)*T}const[w,y]=f.altKey?[r-b,a-g]:[r,a],[S,k]=[r+b,a+g],v=Sr(t,Math.min(w,S),Math.min(y,k),Math.max(w,S),Math.max(y,k),this.getShape?.(t));this.draft=Ne({role:"plane",stage:"draft",points:v,realize:l.realize,color:l.color,...l.fill?{fill:l.fill}:{},...d?{path:d}:{},seed:1},"draft"),this.invalidate()},u=()=>{window.removeEventListener("pointermove",h),window.removeEventListener("pointerup",u),this.pointer=!1,this.draftShape=!1;const f=this.draft?.points;this.draft=null,c&&f?this.commitNew("plane",f,t==="rect"?{path:"straight"}:{},"plane"):this.invalidate()};window.addEventListener("pointermove",h),window.addEventListener("pointerup",u)}laserColor(){const e=this.getDefaults?.("line")?.color;return e&&e!=="none"?e:Dc}startLaser(e,t,o){const i={color:this.laserColor(),pts:[{x:t,y:o,t:performance.now()}],head:{x:t,y:o},down:!0};(this.laser||=[]).push(i),this.pointer=!0;const s=a=>{const l=a.getCoalescedEvents?.();for(const d of l&&l.length?l:[a]){const[c,h]=this.toWorld(...this.local(d));i.pts.push({x:c,y:h,t:performance.now()}),i.head={x:c,y:h}}this.tickLaser()},r=()=>{window.removeEventListener("pointermove",s),window.removeEventListener("pointerup",r),i.down=!1,this.pointer=!1,this.tickLaser()};window.addEventListener("pointermove",s),window.addEventListener("pointerup",r),this.tickLaser()}tickLaser(){if(this.laserRaf)return;const e=()=>{this.laserRaf=0;const t=performance.now();for(const o of this.laser)o.pts=o.pts.filter(i=>t-i.t<Bo);this.laser=this.laser.filter(o=>o.down||o.pts.length>1),this.drawLaser(t),this.laser.length&&(this.laserRaf=requestAnimationFrame(e))};this.laserRaf=requestAnimationFrame(e)}drawLaser(e=performance.now()){if(!this.laserCanvas){const r=document.createElement("canvas");r.className="wb-laser",Object.assign(r.style,{position:"absolute",left:"0",top:"0",pointerEvents:"none",zIndex:"60"}),this.host.appendChild(r),this.laserCanvas=r}const t=this.laserCanvas,o=this.canvas.width,i=this.canvas.height;(t.width!==o||t.height!==i)&&(t.width=o,t.height=i),t.style.width=this.canvas.style.width,t.style.height=this.canvas.style.height;const s=t.getContext("2d");s.setTransform(1,0,0,1,0,0),s.clearRect(0,0,o,i),s.setTransform(this.dpr,0,0,this.dpr,0,0),s.lineCap="round",s.lineJoin="round",s.globalAlpha=1;for(const r of this.laser||[]){const a=r.pts.map(d=>{const[c,h]=this.toScreen(d.x,d.y);return{x:c,y:h,t:d.t}}),l=r.down&&r.head?(()=>{const[d,c]=this.toScreen(r.head.x,r.head.y);return{x:d,y:c}})():null;Rc(s,Nc(a,e,Bo,{head:l}),r.color)}}startNote(e,t,o,i){const s=document.createElement("textarea");s.className="wb-note-input";const r=Dt({note:this.getDefaults("note").note,color:this.getDefaults("note").color}),a=this.cam.z;Object.assign(s.style,{left:`${e}px`,top:`${t}px`,width:`${r.width*a}px`,minHeight:`${r.size*1.6*a}px`,font:`${r.size*a}px ${ct[r.font][1]}`,lineHeight:r.font==="hand"?"1.15":"1.32",color:r.ink,background:r.bg||"transparent",padding:`${(r.bg?r.size*.55:r.size*.15)*a}px`}),s.placeholder="Note…",this.host.appendChild(s),setTimeout(()=>s.focus());let l=!1;const d=c=>{if(l)return;l=!0;const h=s.value.trim();s.remove(),c&&h&&this.commitNew("note",[[o,i,0,.5]],{text:h})};s.addEventListener("keydown",c=>{c.key==="Escape"&&d(!1),c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),d(!0)),c.stopPropagation()}),s.addEventListener("blur",()=>d(!0))}commitNew(e,t,o={},i=e){const s=this.getDefaults(i),r=this.getStage(),a=this.store.addElement({role:e,stage:r.id,points:t,realize:structuredClone(s.realize||rn[e]),color:s.color||null,...s.fill?{fill:s.fill}:{},why:s.why||"",by:{kind:"user",name:"you"},...s.opacity<1?{opacity:s.opacity}:{},...s.blend&&s.blend!=="normal"?{blend:s.blend}:{},...s.path==="straight"?{path:"straight"}:{},...e==="note"?{note:structuredClone(s.note||{})}:{},...o});return(s.sticky===!1||e==="note")&&this.onTool?.("select"),this.select([a.id]),a}flash(e){const t=document.createElement("div");t.className="wb-flash",t.textContent=e,this.host.appendChild(t),setTimeout(()=>t.remove(),1400)}updateCursor(){const e=this.getTool();this.canvas.style.cursor=this.space||e==="hand"?"grab":e==="select"||e==="direct"?"default":e==="note"?"text":e==="sculpt"?"none":"crosshair"}snapshot(e=this.viewMode(),t=1,o=H){const i=document.createElement("canvas"),s=Be(this.store.doc,o),{width:r,height:a}=s.artboard;return i.width=Math.round(r*t),i.height=Math.round(a*t),bt(i.getContext("2d"),s,{mode:e,upTo:this.upTo,transform:{x:0,y:0,scale:t},now:Date.now()}),i}}const Fc=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 1 3 5.7" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/><path d="M5 12a7 7 0 1 1 3 5.7" fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round"/><path d="M2 9l3 4 3-4" fill="black" stroke="white" stroke-width="1"/></svg>')}") 12 12, crosshair`;function Co(n,e){return n.pointerType==="pen"&&n.pressure>0?n.pressure:Math.max(.15,Math.min(1,.85-e*.25))}function Io(n,e){const t=[n[0]];for(let o=1;o<n.length-1;o++){const i=t[t.length-1];Math.hypot(n[o][0]-i[0],n[o][1]-i[1])>=e&&t.push(n[o])}return n.length>1&&t.push(n[n.length-1]),t}function _c(n,e,t,o){let i=1/0;const s=n.length;if(s===1)return Math.hypot(n[0][0]-e,n[0][1]-t);for(let r=0;r<(o?s:s-1);r++){const[a,l]=n[r],[d,c]=n[(r+1)%s],h=d-a,u=c-l,f=h*h+u*u||1,p=Math.max(0,Math.min(1,((e-a)*h+(t-l)*u)/f));i=Math.min(i,Math.hypot(a+p*h-e,l+p*u-t))}return i}function ts(n,e,t){let o=!1;for(let i=0,s=n.length-1;i<n.length;s=i++){const[r,a]=n[i],[l,d]=n[s];a>t!=d>t&&e<(l-r)*(t-a)/(d-a)+r&&(o=!o)}return o}function Wc(n,e){const t=()=>{const o=e.store.doc,i=V(o),s=o.train||H;n.replaceChildren();const r=M("div",{class:"wb-list"}),a=new Map;for(const u of i.filter(rt))for(const f of Tn(o,u))a.set(f.id,u.id);const l=[];for(const u of i)if(!a.has(u.id)&&(l.push(u),rt(u)))for(const f of Tn(o,u))l.push(f);let d=0;l.forEach((u,f)=>{const p=e.activeBoard===u.id,m=a.has(u.id),b=Wr(M("span",{"data-board-title":u.id},u.title),`board:${u.id}`,()=>V(e.store.doc).find(y=>y.id===u.id)?.title||"",y=>e.store.updateBoard(u.id,{title:y})),g=M("span",{class:"wb-stage-name",title:"Click to go · Shift+double-click to rename"},m?"":`${++d}. `,b);g.addEventListener("dblclick",y=>{y.shiftKey||e.goToBoard(u.id)});const w=M("div",{class:`wb-stage${p?" active":""}${m?" nested":""}${rt(u)?" frame":""}`,"data-guide":`board:${u.title}`,draggable:u.main||m?"false":"true",onclick:y=>{if(!y.target.closest("button")){if(y.shiftKey||y.metaKey||y.ctrlKey){e.canvas.selectBoard(u.id,!0);return}e.goToBoard(u.id)}},oncontextmenu:y=>{y.preventDefault(),e.boardMenu(u.id,y.clientX,y.clientY)}},...e.embed?[]:[M("button",{class:`wb-icon-btn wb-train${s===u.id?" on":""}`,title:s===u.id?"Models learn from this board":"Train on this board",html:'<svg viewBox="0 0 24 24" width="12" height="12"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>',onclick:()=>e.store.setTrainBoard(u.id)})],g,M("button",{class:`wb-icon-btn${e.isBoardLive(u.id)?" on":" wb-dim"}`,title:e.isBoardLive(u.id)?`Running${u.live&&!p?" (even when you are elsewhere)":""}: click to pause (a paused board is baked into a picture) · Opt+click: solo`:"Paused: click to play · Opt+click: play only this one",html:te(e.isBoardLive(u.id)?"pause":"play"),onclick:y=>y.altKey?e.soloBoard(u.id):e.toggleBoardRun(u.id)}),M("span",{class:"wb-muted",title:`${u.width}×${u.height}`},String(st(o,u.id).length)),u.main?M("span",{class:"wb-kind"},"main"):M("span",{}),u.main?null:M("button",{class:"wb-icon-btn",title:"Earlier",html:te("up"),onclick:()=>e.store.moveBoard(u.id,-1)}),u.main?null:M("button",{class:"wb-icon-btn",title:"Later",html:te("down"),onclick:()=>e.store.moveBoard(u.id,1)}),M("button",{class:"wb-icon-btn",title:"More",html:te("menu"),onclick:y=>e.boardMenu(u.id,y.clientX,y.clientY)}));w.addEventListener("dragstart",y=>{y.dataTransfer.setData("text/ams-board",u.id),y.dataTransfer.effectAllowed="move"}),w.addEventListener("dragover",y=>{if(![...y.dataTransfer.types].includes("text/ams-board"))return;y.preventDefault();const S=w.getBoundingClientRect(),k=u.main||y.clientY>S.top+S.height/2;w.classList.toggle("drop-above",!k),w.classList.toggle("drop-below",k)}),w.addEventListener("dragleave",()=>w.classList.remove("drop-above","drop-below")),w.addEventListener("drop",y=>{const S=y.dataTransfer.getData("text/ams-board"),k=w.classList.contains("drop-below");if(w.classList.remove("drop-above","drop-below"),!S||S===u.id)return;y.preventDefault();const v=o.boards.filter(x=>x.id!==S).map(x=>x.id),T=u.main?0:v.indexOf(u.id)+(k?1:0);e.store.placeBoard(S,T)}),r.append(w)});const c=st(o,ve).length;r.append(M("div",{class:"wb-stage wb-blackboard",title:"Marks outside the boards: kept, but in no board’s picture"},M("span",{class:"wb-icon-btn"}),M("span",{class:"wb-stage-name wb-muted"},"Blackboard"),M("span",{class:"wb-muted"},String(c)),M("span",{})));const h=M("textarea",{class:"wb-why",rows:3,placeholder:"Page intro (Markdown), before the boards",title:"Shown at the top of the exported page"});h.value=o.meta?.intro||"",h.addEventListener("keydown",u=>u.stopPropagation()),h.addEventListener("change",()=>e.store.change("page intro",u=>{u.meta={...u.meta||{},intro:h.value},h.value||delete u.meta.intro})),n.append(r,M("div",{class:"wb-row wb-row-actions"},M("button",{class:"wb-btn",html:`${te("plus")}<span>Board</span>`,title:"A new board, right of the others (or drag one out with the Board tool, ;)",onclick:()=>{const u=e.store.addBoard({});e.goToBoard(u.id)}}),M("button",{class:"wb-icon-btn",title:"Import a board (or a scene's boards, or marks) from a .ams.json file",html:te("down"),onclick:()=>e.importFile()}),M("span",{style:{flex:1}}),M("button",{class:"wb-icon-btn",title:"Export the page (HTML): every board with its picture, process, replay and text",html:te("page"),onclick:()=>e.exportAs("page")})),h)};e.store.subscribe(t),e.on("board",t),t()}function ns({list:n,onChange:e,app:t=null}){const o=Ft(n),i=M("div",{class:"wb-fx"}),s=(d,c=!0)=>e(d,{final:c}),r=(d,c,h=!0)=>{const u=o.map((f,p)=>p===d?{...f,...c}:f);s(u,h)},a=(d,c,h,u=!1)=>M("button",{class:`wb-icon-btn${u?" on":""}`,title:d,html:te(c),onclick:h});o.forEach((d,c)=>{const h=jt[d.type],u=M("div",{class:"wb-row wb-fx-head"},M("span",{class:"wb-fx-name",title:h.doc},h.label),M("span",{style:{flex:1}}),a(d.off?"Off: click to apply it":"On: click to switch it off",d.off?"eyeOff":"eye",()=>r(c,{off:d.off?void 0:!0})),c>0?a("Earlier","up",()=>{const p=o.slice();[p[c-1],p[c]]=[p[c],p[c-1]],s(p)}):null,c<o.length-1?a("Later","down",()=>{const p=o.slice();[p[c+1],p[c]]=[p[c],p[c+1]],s(p)}):null,a("Remove","close",()=>s(o.filter((p,m)=>m!==c)))),f=h.params.map(p=>X(p.label,le({value:d[p.key],min:p.min,max:p.max,step:p.step,def:p.default,title:p.doc,onChange:(m,{final:b})=>r(c,{[p.key]:m},b)})));if(h.stops){const p=Oi(d.stops);f.push(M("div",{class:"wb-row wb-fx-stops",title:"Dark to light: the first color is what black becomes, the last what white becomes"},...p.map(([m,b],g)=>He(b,w=>r(c,{stops:p.map((y,S)=>S===g?[y[0],w]:y)}),{title:`Color ${g+1}`,fallback:"#808080",app:t})),p.length<6?a("Add a color","plus",()=>{const m=p[p.length-1];r(c,{stops:[...p.map(([b,g],w)=>[w/p.length,g]),[1,m[1]]]})}):null,p.length>2?a("Remove the last color","close",()=>r(c,{stops:p.slice(0,-1)})):null))}i.append(M("div",{class:`wb-fx-item${d.off?" off":""}`},u,...d.off?[]:f))});const l=M("select",{class:"wb-select wb-fx-add",title:"Add an effect"},M("option",{value:""},"+ effect"),...Object.entries(jt).map(([d,c])=>M("option",{value:d,title:c.doc},c.label)));return l.addEventListener("change",()=>{if(l.value){const d=l.value;l.value="",s([...o,Ft([d])[0]])}}),i.append(l),i}function Oo(n,e){const t=()=>{if(n.innerHTML="",e.selectedClip&&e.player?.take?.clips.includes(e.selectedClip))return l(e.selectedClip);const c=e.selectedElements();if(!c.length&&e.selectedAsset){s(e.selectedAsset);return}if(!c.length&&e.canvas?.selectedBoard)return r(e.canvas.selectedBoard);if(!c.length)return a();const h=c[0],u=c.length>1,f=(p,m)=>{const b=JSON.stringify(e.store.doc);for(const g of c){const w=e.store.doc.elements.find(y=>y.id===g.id);if(w){p.realize&&(w.realize={...w.realize,...p.realize,params:{...w.realize.params,...p.realize.params||{}}});for(const[y,S]of Object.entries(p))y!=="realize"&&(w[y]=S)}}e.store.commitFrom(b,m)};n.append(M("div",{class:"wb-panel-title"},u?`${c.length} elements`:`${h.role}`,M("span",{class:"wb-muted"},u?"":` · ${h.points.length} pts${h.points.length>1?` · ${Math.round(h.points[h.points.length-1][2])} ms`:""}`))),n.append(ce("Element",!0,X("Role",ge(Object.keys(Xt).map(p=>[p,p]),h.role,p=>{const m=Z[h.realize.brush]?.roles.includes(p)?h.realize.brush:jn(p,e.store.doc)[0]?.id||"ink";f({role:p,realize:{brush:m,params:{}},closed:p==="plane"?!0:h.closed},"role")}),Xt[h.role]),X("Stage",ge(e.store.doc.stages.map(p=>[p.id,p.name]),h.stage,p=>f({stage:p},"stage"))),X("Color",He(h.color,p=>{f({color:p},"color"),h.role==="note"&&e.setDefaults("note",{color:p})},{app:e})),h.role==="note"?X("Text",Hc(h,p=>f({text:p},"note"))):null)),h.role==="note"?n.append(No(Dt(h),p=>{const m=JSON.stringify(e.store.doc);for(const g of c){const w=e.store.doc.elements.find(y=>y.id===g.id);w?.role==="note"&&(w.note={...w.note||{},...p})}e.store.commitFrom(m,"note style");const b=e.store.doc.elements.find(g=>g.id===h.id);b&&e.setDefaults("note",{note:{...b.note||{}},color:b.color})},e)):n.append(Ro(h.role,h.realize,p=>f({realize:p},"brush"),e.store.doc)),n.append(zo(h,p=>f(p,"look"))),n.append(ce("Reason",!0,Do(h.why,p=>f({why:p},"why")),M("div",{class:"wb-muted wb-small"},u?"":`By ${Ys(h.by?.name||"unknown")} (${Ys(h.by?.kind||"")}) · seed ${h.seed}`)))},o=()=>{const c=e.sculpt,h=$e[c.tool],u=Rs(c.tool,c.params[c.tool]);n.append(M("div",{class:"wb-panel-title"},"Sculpt",M("span",{class:"wb-muted"},` · ${h.label}`))),n.append(ce("Brush",!0,X("Tool",ge(Object.entries($e).map(([f,p])=>[f,p.label]),c.tool,f=>e.setSculpt({tool:f})),h.doc),X("Radius",le({value:Math.round(c.radius),min:4,max:400,step:1,def:40,title:"Brush radius in screen pixels ([ and ])",onChange:f=>e.setSculpt({radius:f})})),X("Strength",le({value:c.strength,min:.02,max:1,step:.01,def:.5,title:"Shift+[ and Shift+]",onChange:f=>e.setSculpt({strength:f})})),...h.params.map(f=>X(f.label,le({value:u[f.key],min:f.min,max:f.max,step:f.step,def:f.default,title:f.doc,onChange:p=>e.setSculpt({params:{[f.key]:p}})}),f.doc)),M("div",{class:"wb-row wb-row-actions"},M("button",{class:"wb-btn",title:"Sculpt tools are code: fork one or write your own",onclick:()=>e.openCode?.("sculpt",c.tool)},"Show code"))))};let i=0;const s=async c=>{const h=++i,u=await e.assetStore.get(c);if(h!==i||!u)return;n.dataset.asset!==c&&(n.innerHTML=""),n.dataset.asset=c,n.innerHTML="";const f=w=>e.assetStore.update(c,w),p=w=>{const y=structuredClone(u.meta||{});return w(y),Object.assign(u,{meta:y}),f({meta:y})},m=(w,y,S={})=>{const k=M("input",{class:"wb-inline",value:w??"",...S});return k.addEventListener("change",()=>y(k.value.trim())),k.addEventListener("keydown",v=>{v.stopPropagation(),v.key==="Enter"&&k.blur()}),k},b=u.meta?.stream,g=u.meta?.defaults||{};if(n.append(M("div",{class:"wb-panel-title"},"Asset",M("span",{class:"wb-muted"},` · ${u.kind}`))),n.append(ce("Asset",!0,X("Title",m(u.title,w=>w&&f({title:w}))),X("Folder",m(u.folder,w=>f({folder:w}),{title:"Folders are paths: Streams/Faces"})),X("Tags",m((u.tags||[]).join(", "),w=>f({tags:w.split(",").map(y=>y.trim().replace(/^#/,"")).filter(Boolean)}),{title:"Comma-separated"})),X("Rating",le({value:u.rating||0,min:0,max:5,step:1,def:0,onChange:(w,{final:y})=>{y&&f({rating:Math.round(w)})}})))),b&&n.append(ce("Stream",!0,X("Address",m(b.page,w=>w&&p(y=>{y.stream.page=w}),{title:"A video or picture URL, or a Wikipedia / Commons File: page"})),X("Size",ge([["240","240p"],["480","480p"],["1080","1080p"],["original","original"]],String(b.quality||"480"),w=>p(y=>{y.stream.quality=w}),"A wiki video: the version to stream (smaller is lighter and quicker to seek)")),X("In",le({value:b.start??0,min:0,max:1e5,step:.5,def:0,title:"Seconds: where playing starts",onChange:(w,{final:y})=>{y&&p(S=>{w>0?S.stream.start=w:delete S.stream.start})}})),X("Out",le({value:b.end??0,min:0,max:1e5,step:.5,def:0,title:"Seconds: where playing ends (0: the end of the clip)",onChange:(w,{final:y})=>{y&&p(S=>{w>0?S.stream.end=w:delete S.stream.end})}})),X("Note",m(b.note||u.meta?.note,w=>p(y=>{y.stream.note=w,y.note=w}))),X("Licence",m(u.meta?.license,w=>p(y=>{y.license=w}))),X("Author",m(u.meta?.artist,w=>p(y=>{y.artist=w}))))),b||/^(video|image)\//.test(u.blob?.type||"")){const w=y=>(S,k={})=>p(v=>{v.defaults=v.defaults||{},S===""||S==null?delete v.defaults[y]:v.defaults[y]=S});n.append(ce("Starts with",!0,X("Speed",ge([["","as is"],["0","paused"],["0.25","¼×"],["0.5","½×"],["1","1×"],["2","2×"],["4","4×"]],g.speed==null?"":String(g.speed),y=>w("speed")(y===""?"":Number(y)),"A movie waits paused by default, a GIF plays")),X("Loop",ge([["","as is"],["1","loop"],["0","stop at the end"]],g.loop==null?"":g.loop?"1":"0",y=>w("loop")(y===""?"":y==="1"))),X("Volume",le({value:g.volume??0,min:0,max:1,step:.05,def:0,title:"Muted (0) unless raised",onChange:(y,{final:S})=>{S&&w("volume")(y>0?y:"")}})),X("Opacity",le({value:g.opacity??1,min:0,max:1,step:.05,def:1,title:"How much of it shows under its board",onChange:(y,{final:S})=>{S&&w("opacity")(y<1?y:"")}})),X("Blend",ge(In.map(y=>[y,y]),g.blend||"normal",y=>w("blend")(y==="normal"?"":y),"How it mixes with the paper")),X("Fit",ge([["cover","Cover"],["contain","Contain"]],g.fit==="contain"?"contain":"cover",y=>w("fit")(y==="cover"?"":y)))))}};e.on("asset",()=>{e.selectedAsset&&t()});const r=c=>{const h=ie(e.store.doc,c);if(!h)return a();const u=M("input",{class:"wb-inline",value:h.title});u.addEventListener("change",()=>{u.value.trim()&&e.store.updateBoard(h.id,{title:u.value.trim()})}),u.addEventListener("keydown",T=>{T.stopPropagation(),T.key==="Enter"&&u.blur()});const f=(T,x,L,A,P)=>M("button",{class:`wb-icon-btn${x?" on":""}`,title:P,html:te(x?L:A),onclick:()=>e.setBoardFlag(h.id,T,!h[T])}),p=h.kind==="p5"||!h.kind&&!!(h.follow||h.source||h.code),m=e.isBoardLive(h.id),b=p?M("button",{class:`wb-icon-btn${m?" on":""}`,title:m?"Running: click to pause (a paused board is baked into a picture)":"Paused: click to play",html:te(m?"pause":"play"),onclick:()=>e.toggleBoardRun(h.id)}):null,g=e.playerShown(h),w=e.playableSource(h)?M("button",{class:`wb-icon-btn${g?" on":""}`,title:g?"Media controls shown (click to hide them)":"Show media controls: play, step, scrub, speed",html:te(g?"controls":"controlsOff"),onclick:()=>e.togglePlayer(h)}):null,y=M("span",{class:"wb-board-flags"},b,w,f("locked",h.locked,"lock","unlock",h.locked?"Locked: its marks and the board stay as they are (click to unlock)":"Lock the board (its marks, its place and size)"),M("button",{class:`wb-icon-btn${h.hidden?" on":""}`,title:h.hidden?"Hidden: not drawn, not run (click to show)":"Hide the board (not drawn, not run)",html:te(h.hidden?"eyeOff":"eye"),onclick:()=>e.setBoardFlag(h.id,"hidden",!h.hidden)}),M("button",{class:`wb-icon-btn${h.hideLabel?" on":""}`,title:h.hideLabel?"Title hidden (click to show it)":"Hide the title above it",html:te(h.hideLabel?"labelOff":"label"),onclick:()=>e.setBoardFlag(h.id,"hideLabel",!h.hideLabel)}),M("button",{class:`wb-icon-btn${h.hideBorder?" on":""}`,title:h.hideBorder?"Border hidden (click to show it)":"Hide its border (the shadow and frame line: the board is only structure)",html:te(h.hideBorder?"borderOff":"border"),onclick:()=>e.setBoardFlag(h.id,"hideBorder",!h.hideBorder)}),h.code||h.pseudo?f("codeMin",h.codeMin,"codeMin","script",h.codeMin?"Its code is a bar of tabs on an exported page (click to open it there)":"Minimize its code on an exported page: a bar of tabs (Pseudocode, Studio, p5.js), opened by a click"):null,f("mask",h.mask,"mask","maskOff",h.mask?"Masked: its marks are cropped to the board (click to let them spill)":"Crop its marks to the board (a mask the size of the board)"),f("perf",h.perf,"gauge","gaugeOff",h.perf?"Performance shown under it (click to hide; hidden, it is not measured)":"Show its performance under it (runs, code time, source fps)"));n.append(M("div",{class:"wb-panel-title"},"Board",M("span",{class:"wb-muted"},h.main?" · main":""),M("span",{style:{flex:1}}),y)),n.append(ce("Board",!0,X("Title",u),X("Width",le({value:h.width,min:40,max:1e4,step:10,def:1e3,onChange:(T,{final:x})=>{x&&e.store.updateBoard(h.id,{width:Math.round(T)})}})),X("Height",le({value:h.height,min:40,max:1e4,step:10,def:1e3,onChange:(T,{final:x})=>{x&&e.store.updateBoard(h.id,{height:Math.round(T)})}})),X("Redraw",le({value:Re(h),min:0,max:60,step:1,def:0,title:"Runs a second for a board that follows a source (each with fresh randomness); 0: once per new frame of the source",onChange:(T,{final:x})=>{x&&e.store.updateBoard(h.id,{rate:Math.round(T)})}})),X("Paper",He(h.ground,T=>e.store.updateBoard(h.id,{ground:T}),{title:"Paper",fallback:"#f3efe6",app:e})),M("div",{class:"wb-muted wb-small"},`${st(e.store.doc,h.id).length} marks${!e.embed&&ps(e.store.doc)===h.id?" · models learn from this board":""}`)));const S=e.playableSource(h);d=null;const k=h.source&&h.kind!=="player"?[X("Opacity",le({value:h.sourceOpacity??.5,min:0,max:1,step:.05,def:.5,title:"How much of the source shows under the board’s marks",onChange:T=>e.setBoardSourceLook(h.id,{opacity:T})})),X("Blend",ge(In.map(T=>[T,T]),h.sourceBlend||"normal",T=>e.setBoardSourceLook(h.id,{blend:T}),"How the source mixes with the paper")),X("Fit",ge([["cover","Cover"],["contain","Contain"]],h.sourceFit==="contain"?"contain":"cover",T=>e.setBoardSourceLook(h.id,{fit:T}),"Cover fills the board (cropped); contain shows all of it"))]:[];if(h.source&&!S&&k.length&&n.append(ce(`Source · ${h.source}`,!0,...k)),S){const T=(C,z,U,J)=>M("button",{class:"wb-icon-btn","data-act":C,title:z,html:U,onclick:J}),x=C=>'<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="'+(C<0?"M17 5v14l-9-7zM6 5h2v14H6z":"M7 5v14l9-7zM16 5h2v14h-2z")+'"/></svg>',L=T("play","Play / pause",te("pause"),()=>e.mediaAct(S,"play")),A=fs({min:0,max:1e3,step:1,value:0,title:"Timeline"});let P=!1;A.addEventListener("pointerdown",()=>{P=!0});for(const C of["pointerup","pointercancel","blur"])A.addEventListener(C,()=>{P=!1});A.addEventListener("input",()=>e.mediaAct(S,"seek",Number(A.value)/1e3));const $=M("span",{class:"wb-muted wb-small wb-media-time"}),E=M("button",{class:"wb-icon-btn",onclick:()=>e.mediaAct(S,"loop")}),I=T("in","Set the in point here (playing starts here)","<b>[</b>",()=>e.mediaAct(S,"in")),R=T("out","Set the out point here (playing ends here)","<b>]</b>",()=>e.mediaAct(S,"out")),j=T("range","The whole clip again (clear in and out)",te("close"),()=>e.mediaAct(S,"range")),G=M("span",{class:"wb-muted wb-small"}),D=M("button",{class:"wb-icon-btn",title:"Mute / unmute (muted by default)",html:te("mute"),onclick:()=>e.mediaAct(S,"mute")}),O=fs({min:0,max:100,step:1,value:0,title:"Volume"});O.addEventListener("input",()=>e.mediaAct(S,"volume",Number(O.value)/100));const K=M("div",{class:"wb-row",hidden:!0},D,O),ee=ge([["0.25","¼×"],["0.5","½×"],["1","1×"],["2","2×"],["4","4×"]],String(e.mediaState(S).speed||1),C=>e.mediaAct(S,"speed",C),"Playback speed"),B=C=>`${Math.floor(C/60)}:${(C%60).toFixed(1).padStart(4,"0")}`;d={name:S,update(){const{pos:C,speed:z,playing:U}=e.mediaState(S);!P&&C&&(A.value=String(Math.round(C.fraction*1e3)),En(A)),$.textContent=C?C.duration?`${B(C.time)} / ${B(C.duration)} · ${C.frame}/${C.frames}`:`${C.frame+1}/${C.frames}`:"—",L.dataset.state!==(U?"pause":"play")&&(L.dataset.state=U?"pause":"play",L.innerHTML=te(U?"pause":"play"),L.title=U?"Pause":"Play"),U&&ee.value!==String(z)&&(ee.value=String(z));const J=e.mediaState(S),Y=e.sources.entries.get(S)?.live?.kind==="video"&&J.sound!==!1;E.innerHTML=te(J.loop?"repeat":"repeatOff"),E.title=J.loop?"Looping: click to stop at the end":"Stops at the end: click to loop",E.classList.toggle("on",J.loop);const oe=J.inP>0||J.outP<1,re=J.pos?.duration;if(G.textContent=oe?re?`${B(J.inP*re)} – ${B(J.outP*re)}`:`${Math.round(J.inP*100)}–${Math.round(J.outP*100)}%`:"",j.style.visibility=oe?"visible":"hidden",K.hidden=!Y,Y){const he=J.volume<=0;D.dataset.state!==(he?"mute":"volume")&&(D.dataset.state=he?"mute":"volume",D.innerHTML=te(he?"mute":"volume")),document.activeElement!==O&&(O.value=String(Math.round(J.volume*100)),En(O))}}},n.append(ce(`Media · ${S}`,!0,M("div",{class:"wb-row"},L,T("back","Back a frame",x(-1),()=>e.mediaAct(S,"step",-1)),T("fwd","Forward a frame",x(1),()=>e.mediaAct(S,"step",1)),M("span",{style:{flex:1}}),ee),M("div",{class:"wb-row"},A),$,M("div",{class:"wb-row"},E,I,R,j,G),K,...k)),d.update()}n.append(...Uc(e,h));const v=M("textarea",{class:"wb-why",rows:6,placeholder:"What this board says (Markdown): on the exported page, under the picture"});v.value=h.text||"",v.addEventListener("keydown",T=>T.stopPropagation()),v.addEventListener("change",()=>e.store.updateBoard(h.id,{text:v.value})),n.append(ce("Text",!0,v))},a=()=>{const c=e.toolRole();if(c==="sculpt")return o();if(!Xt[c]&&c!=="brush"){n.append(M("div",{class:"wb-empty"},"Select something, or pick a drawing tool to set its defaults."));return}const h=e.defaults(c);n.append(M("div",{class:"wb-panel-title"},c==="brush"?"Brush":`New ${c}`,M("span",{class:"wb-muted"},c==="brush"?" · active":" · defaults"))),n.append(ce("Element",!0,X("Color",He(h.color,u=>e.setDefaults(c,{color:u}),{app:e})))),c==="note"?n.append(No(Dt({note:h.note,color:h.color}),u=>e.setDefaults(c,{note:u}),e)):n.append(Ro(h.role||c,h.realize,u=>e.setDefaults(c,{realize:u}),e.store.doc)),n.append(zo(h,u=>e.setDefaults(c,"path"in u?{...u,path:u.path||"smooth"}:u))),n.append(ce("Reason",!0,Do(h.why||"",u=>e.setDefaults(c,{why:u}),"Why the next marks are made (kept on each one)")))},l=c=>{const h=()=>e.timelineEdited?.(),u=m=>{Object.assign(c,m),h()},f=m=>{c.fx={...c.fx||{},...m},h()},p=c.diff||{};if(n.append(M("div",{class:"wb-panel-title"},`${c.track} clip`,M("span",{class:"wb-muted"},` · ${(c.start/1e3).toFixed(1)} s`))),n.append(ce("Timing",!0,X("Start (s)",le({value:+(c.start/1e3).toFixed(2),min:0,max:36e3,step:.1,def:0,onChange:m=>u({start:Math.round(m*1e3)})})),X("Length (s)",le({value:+(c.dur/1e3).toFixed(2),min:0,max:3600,step:.1,def:1,onChange:m=>u({dur:Math.round(m*1e3)})})),c.track==="say"||c.track==="title"?X("Fade (ms)",le({value:c.fx?.fade??250,min:0,max:3e3,step:50,def:250,onChange:m=>f({fade:m})})):null,c.track==="draw"?X("Reveal",ge([["on","Stroke by stroke"],["off","All at once"]],c.fx?.drawOn===!1?"off":"on",m=>f({drawOn:m==="on"}))):null)),c.track==="say"||c.track==="title"){const m=M("textarea",{class:"wb-why",rows:3});m.value=c.text||"",m.addEventListener("change",()=>u({text:m.value})),m.addEventListener("keydown",b=>b.stopPropagation()),n.append(ce(c.track==="say"?"Narration":"Title",!0,m,c.track==="title"?X("Subtitle",(()=>{const b=M("input",{class:"wb-inline",value:c.sub||""});return b.addEventListener("change",()=>u({sub:b.value})),b.addEventListener("keydown",g=>g.stopPropagation()),b})()):null))}c.track==="draw"&&n.append(ce("Change",!0,M("div",{class:"wb-small"},`${c.label||"change"} · by ${c.by||"user"}`),M("div",{class:"wb-muted wb-small"},[p.add?.length&&`${p.add.length} added`,p.update?.length&&`${p.update.length} changed`,p.remove?.length&&`${p.remove.length} removed`].filter(Boolean).join(" · ")||"document settings"))),c.track==="camera"&&n.append(ce("View",!0,X("Zoom",le({value:+(c.z||1).toFixed(2),min:.2,max:20,step:.05,def:1,onChange:m=>u({z:m})})),X("Center x",le({value:+(c.cx??.5).toFixed(3),min:-1,max:2,step:.01,def:.5,onChange:m=>u({cx:m})})),X("Center y",le({value:+(c.cy??.5).toFixed(3),min:-1,max:2,step:.01,def:.5,onChange:m=>u({cy:m})})))),c.track==="action"&&n.append(ce("Action",!0,M("div",{class:"wb-small"},c.label||c.name),M("pre",{class:"wb-ref"},JSON.stringify(c.args||{},null,1).slice(0,800)))),c.track==="audio"&&n.append(ce("Audio",!0,M("div",{class:"wb-small"},c.label||"audio")))};let d=null;e.sources.on(c=>{d&&(!c||c===d.name)&&d.update()}),e.store.subscribe(t),e.on("clip-select",t),e.on("selection",()=>{e.canvas?.selected.size&&(e.selectedClip=null),t()}),e.on("tool",t),e.on("board",t),e.on("brush",()=>{e.tool==="brush"&&!e.selectedElements().length&&t()}),e.on("sculpt",()=>{e.tool==="sculpt"&&!e.selectedElements().length&&t()}),t()}function zo(n,e){return ce("Look",!0,X("Opacity",le({value:n.opacity??1,min:0,max:1,step:.05,def:1,title:"The whole element’s opacity (on top of the brush’s own)",onChange:t=>e({opacity:t})})),X("Blend",ge(In.map(t=>[t,t]),n.blend||"normal",t=>e({blend:t}),"How the element mixes with what is under it")),X("Path",ge([["smooth","Smooth"],["straight","Straight"]],n.path==="straight"?"straight":"smooth",t=>e({path:t==="straight"?"straight":void 0}),"Smooth: a curve through the points. Straight: straight segments between them")))}function No(n,e,t=null){const o=He(n.bg||"#fbe9a6",s=>{i=s,e({bg:s})},{title:"Paper",fallback:"#fbe9a6",app:t});let i=n.bg||"#fbe9a6";return ce("Note",!0,X("Style",ge(Object.entries(_s).map(([s,r])=>[s,r.split(":")[0]]),n.style,s=>e({style:s,bg:void 0,font:void 0,size:void 0}),"Notebook writes on the page; sticky, card and plain are other looks")),X("Font",ge(Object.entries(ct).map(([s,[r]])=>[s,r]),n.font,s=>e({font:s}))),X("Size",le({value:Math.round(n.size),min:6,max:200,step:1,def:n.size,title:"Letter size in artboard units",onChange:s=>e({size:s})})),X("Width",le({value:Math.round(n.width),min:40,max:2e3,step:5,def:280,title:"Wrap width; or drag a side of the note",onChange:s=>e({width:s})})),X("Paper",M("div",{class:"wb-row"},o,M("label",{class:"wb-row",title:"No background: writing straight on the page"},M("input",{type:"checkbox",checked:!n.bg,onchange:s=>e({bg:s.target.checked?null:i})}),M("span",{},"none")))))}function Ro(n,e,t,o){const i=jn(n,o),s=e?.brush||i[0]?.id,r=Z[s],a=Pe(s,e?.params),l=ce("Brush",!0,X("Brush",ge(i.map(d=>[d.id,d.label]),s,d=>t({brush:d,params:{}})),r?.doc));for(const d of r?.params||[])l.append(X(d.label,le({value:a[d.key],min:d.min,max:d.max,step:d.step,def:d.default,title:d.doc,onChange:(c,{final:h})=>{h&&t({brush:s,params:{[d.key]:c}})}}),d.doc));return l}function Do(n,e,t="Why is this here?"){const o=M("textarea",{class:"wb-why",rows:3,placeholder:t});return o.value=n||"",o.addEventListener("change",()=>e(o.value.trim())),o.addEventListener("keydown",i=>i.stopPropagation()),o}function Hc(n,e){const t=M("textarea",{class:"wb-why",rows:3});return t.value=n.text||"",t.addEventListener("change",()=>e(t.value)),t.addEventListener("keydown",o=>o.stopPropagation()),t}function Uc(n,e){if(e.kind&&e.kind!=="drawing")return[];const t=n.store.doc,o=e.maskWith,i=M("select",{class:"wb-select",title:"What the board shows through: a source (a camera, a picture or clip, a board seen as a stream), or a board of marks"},M("option",{value:""},"— none —"),...n.sources.list.map(a=>M("option",{value:`source:${a.name}`,selected:o?.source===a.name},a.name)),...V(t).filter(a=>a.id!==e.id&&(!a.kind||a.kind==="drawing")).map(a=>M("option",{value:`board:${a.id}`,selected:o?.board===a.id},`${a.title} · board`)));i.addEventListener("change",()=>{const a=i.value;if(i.blur(),!a)return n.setBoardMask(e.id,null);const[l,d]=[a.slice(0,a.indexOf(":")),a.slice(a.indexOf(":")+1)];n.setBoardMask(e.id,{...o||{},source:l==="source"?d:void 0,board:l==="board"?d:void 0,mode:o?.mode||(l==="board"?"alpha":"luma")})});const s=(a,l)=>n.setBoardMask(e.id,{...o,...a},l),r=o?[X("Mode",ge([["luma","Light"],["alpha","Alpha"]],o.mode==="alpha"?"alpha":"luma",a=>s({mode:a}),"Light: where the mask is light, the board shows. Alpha: where the mask is opaque.")),X("Invert",M("button",{class:`wb-icon-btn${o.invert?" on":""}`,title:o.invert?"Inverted: click to show where it hid":"Show where the mask hides",html:te("mask"),onclick:()=>s({invert:!o.invert})})),X("Feather",le({value:o.feather||0,min:0,max:80,step:1,def:0,title:"Soften the mask's edge (pixels of the mask)",onChange:(a,{final:l})=>s({feather:a||void 0},l?void 0:{transient:!0})})),o.source?X("Fit",ge([["cover","Cover"],["contain","Contain"]],o.fit==="contain"?"contain":"cover",a=>s({fit:a==="contain"?"contain":void 0}),"How the mask's picture fits the board")):null,M("div",{class:"wb-muted wb-small"},"Mask effects"),ns({list:o.fx,app:n,onChange:(a,{final:l})=>s({fx:a.length?a:void 0},l?void 0:{transient:!0})})]:[];return[ce("Mask",!!o,X("From",i),...r),ce("Effects",!!e.fx?.length,ns({list:e.fx,app:n,onChange:(a,{final:l})=>n.setBoardFx(e.id,"fx",a,l?void 0:{transient:!0})})),e.source?ce("Source effects",!!e.sourceFx?.length,ns({list:e.sourceFx,app:n,onChange:(a,{final:l})=>n.setBoardFx(e.id,"sourceFx",a,l?void 0:{transient:!0})})):null].filter(Boolean)}const qc={point:"•",line:"∿",plane:"▰",guide:"┼",gesture:"〰",note:"¶",image:"▣"};function jo(n,e){if(n.label)return n.label;if(n.role==="note"&&n.text)return n.text.slice(0,40);const t=e.elements.filter(o=>o.role===n.role&&o.stage===n.stage);return`${n.role} ${t.indexOf(n)+1}`}function Kc(n,e){const t=new Set;let o=null,i=null;const s=M("div",{class:"wb-outliner",role:"tree",tabIndex:0}),r=M("div",{class:"wb-row wb-row-actions wb-outliner-bar"});n.append(r,s);const a=()=>e.canvas.selected,l=(x,L)=>{if(L==="toggle"){const A=new Set(a());for(const P of x)A.has(P)?A.delete(P):A.add(P);e.canvas.select([...A])}else e.canvas.select(x,L==="add")},d=()=>{const x=e.store.doc;return x.stages.flatMap(L=>x.elements.filter(A=>A.stage===L.id).map(A=>A.id))},c=(x,L,A)=>{if(x.shiftKey&&i){const P=d(),$=P.indexOf(i),E=P.indexOf(A);if($>=0&&E>=0){l(P.slice(Math.min($,E),Math.max($,E)+1),"add");return}}l(L,x.metaKey||x.ctrlKey?"toggle":x.shiftKey?"add":"set"),i=A},h=(x,L,A)=>{const P=M("input",{class:"wb-inline wb-outliner-input",value:L});x.replaceWith(P),P.focus(),P.select();let $=!1;const E=I=>{if($)return;$=!0;const R=P.value.trim();I&&R&&R!==L?A(R):v()};P.addEventListener("keydown",I=>{I.stopPropagation(),I.key==="Enter"&&E(!0),I.key==="Escape"&&E(!1)}),P.addEventListener("blur",()=>E(!0)),P.addEventListener("pointerdown",I=>I.stopPropagation())};let u={key:null,t:0},f=null;const p=(x,L,A,P)=>{x.dataset.renameKey=L,x.addEventListener("pointerdown",$=>{const E=performance.now();u.key===L&&E-u.t<450?(f={key:L,fn:A,ids:P,rename:$.shiftKey},u={key:null,t:0}):u={key:L,t:E}})};n.addEventListener("click",x=>{if(!f)return;const{key:L,fn:A,ids:P,rename:$}=f;if(f=null,x.stopPropagation(),x.preventDefault(),$){const I=n.querySelector(`[data-rename-key="${CSS.escape(L)}"]`);I&&A(I);return}const E=typeof P=="function"?P():P;E?.length&&(e.canvas.select(E),e.canvas.frameSelection())},!0);const m=(x,L,A,P,$,E="")=>M("button",{class:`wb-icon-btn wb-outliner-toggle${x?"":" off"} ${E}`,title:P,html:te(x?L:A),onclick:I=>{I.stopPropagation(),$(I)}}),b=x=>x.some(L=>a().has(L))?[...new Set([...x,...a()])]:x,g=(x,L)=>{x.addEventListener("dragover",A=>{if(!o)return;A.preventDefault();const P=x.getBoundingClientRect(),$=A.clientY<P.top+P.height*.3?"before":A.clientY>P.bottom-P.height*.3?"after":"inside";x.dataset.drop=$}),x.addEventListener("dragleave",()=>{delete x.dataset.drop}),x.addEventListener("drop",A=>{A.preventDefault();const P=x.dataset.drop;delete x.dataset.drop,o&&L(P,o),o=null})},w=(x,L)=>{x.draggable=!0,x.addEventListener("dragstart",A=>{o=b(L),A.dataTransfer.effectAllowed="move",A.dataTransfer.setData("text/plain",o.join(",")),x.classList.add("dragging")}),x.addEventListener("dragend",()=>{o=null,x.classList.remove("dragging")})},y=(x,L)=>{const A=e.store.doc,P=M("span",{class:"wb-outliner-label",title:`${x.why||x.role}${x.by?.name?` · ${x.by.name}`:""} · double-click to frame, Shift+double-click to rename`},jo(x,A));p(P,`e:${x.id}`,E=>h(E,jo(x,A),I=>e.store.patchElements([x.id],{label:I},"rename")),[x.id]);const $=M("div",{class:`wb-outliner-row${a().has(x.id)?" selected":""}${x.hidden?" hidden":""}`,style:{"--depth":L},role:"treeitem",onclick:E=>c(E,[x.id],x.id)},M("span",{class:"wb-outliner-glyph",title:x.role},qc[x.role]||"·"),P,m(!x.hidden,"eye","eyeOff",x.hidden?"Show":"Hide",()=>{const E=b([x.id]);e.store.patchElements(E,{hidden:!x.hidden},x.hidden?"show":"hide")}),m(!x.locked,"unlock","lock",x.locked?"Unlock":"Lock",()=>{const E=b([x.id]);e.store.patchElements(E,{locked:!x.locked},x.locked?"unlock":"lock")},x.locked?"on":""),m(!0,"trash","trash","Delete",()=>e.store.removeElements(b([x.id])),"danger"));return w($,[x.id]),g($,(E,I)=>{if(I.includes(x.id))return;const R=e.store.doc;if(E==="after"){const j=R.elements.filter(D=>D.stage===x.stage&&!I.includes(D.id)),G=j[j.indexOf(j.find(D=>D.id===x.id))+1];e.store.reorder(I,G?{before:G.id,group:x.group||null}:{stage:x.stage,group:x.group||null})}else e.store.reorder(I,{before:x.id,group:x.group||null})}),$},S=(x,L,A)=>{const P=e.store.doc,$=L.map(O=>O.id),E=!t.has(x),I=L.every(O=>O.hidden),R=L.every(O=>O.locked),j=$.every(O=>a().has(O)),G=M("span",{class:"wb-outliner-label"},P.groups?.[x]?.name||"Group");p(G,`g:${x}`,O=>h(O,P.groups?.[x]?.name||"Group",K=>e.store.renameGroup(x,K)),()=>e.store.doc.elements.filter(O=>O.group===x).map(O=>O.id));const D=M("div",{class:`wb-outliner-row wb-outliner-group${j?" selected":""}${I?" hidden":""}`,style:{"--depth":A},onclick:O=>c(O,$,$[0])},M("button",{class:"wb-outliner-caret",title:E?"Collapse":"Expand",onclick:O=>{O.stopPropagation(),E?t.add(x):t.delete(x),v()}},E?"▾":"▸"),G,M("span",{class:"wb-muted wb-outliner-count"},String(L.length)),m(!I,"eye","eyeOff",I?"Show group":"Hide group",()=>e.store.patchElements($,{hidden:!I},I?"show":"hide")),m(!R,"unlock","lock",R?"Unlock group":"Lock group",()=>e.store.patchElements($,{locked:!R},R?"unlock":"lock"),R?"on":""),m(!0,"trash","trash","Delete group",()=>e.store.removeElements($),"danger"));return w(D,$),g(D,(O,K)=>{K.every(ee=>$.includes(ee))||(O==="inside"?e.store.reorder(K,{before:$[0],group:x}):e.store.reorder(K,{before:$[0],group:null}))}),M("div",{class:"wb-outliner-block"},D,...E?L.map(O=>y(O,A+1)):[])},k=(x,L)=>{const P=e.store.doc.elements.filter(D=>D.stage===x.id),$=`stage:${x.id}`,E=!t.has($),I=e.activeStageId===x.id,R=M("span",{class:"wb-outliner-label wb-outliner-stage-name"},`${L+1}. ${x.name}`);p(R,`s:${x.id}`,D=>h(D,x.name,O=>e.store.updateStage(x.id,{name:O})),()=>e.store.doc.elements.filter(D=>D.stage===x.id&&!D.hidden).map(D=>D.id));const j=M("div",{class:`wb-outliner-row wb-outliner-stage${I?" active":""}${x.visible?"":" hidden"}`,title:`${x.kind}: click to make active (new marks go here)`,onclick:()=>e.setActiveStage(x.id)},M("button",{class:"wb-outliner-caret",title:E?"Collapse":"Expand",onclick:D=>{D.stopPropagation(),E?t.add($):t.delete($),v()}},P.length?E?"▾":"▸":""),R,M("span",{class:"wb-muted wb-outliner-count"},String(P.length)),m(x.visible,"eye","eyeOff",x.visible?"Hide stage":"Show stage",()=>e.store.updateStage(x.id,{visible:!x.visible})),m(!x.locked,"unlock","lock",x.locked?"Unlock stage":"Lock stage",()=>e.store.updateStage(x.id,{locked:!x.locked}),x.locked?"on":""),M("button",{class:"wb-icon-btn wb-outliner-toggle",title:"Select everything in this stage",html:te("select"),onclick:D=>{D.stopPropagation(),e.canvas.select(P.filter(O=>e.canvas.editable(O)).map(O=>O.id))}}));g(j,(D,O)=>e.store.reorder(O,{stage:x.id,group:null}));const G=[];if(E){const D=new Set;for(const O of P)if(O.group){if(D.has(O.group))continue;D.add(O.group),G.push(S(O.group,P.filter(K=>K.group===O.group),1))}else G.push(y(O,1))}return M("div",{class:"wb-outliner-block"},j,...G)},v=()=>{const x=e.store.doc,L=a().size,A=[...a()].some(P=>x.elements.find($=>$.id===P)?.group);r.replaceChildren(M("button",{class:"wb-btn",disabled:L<2,title:"Group the selection (Cmd+G)",onclick:()=>e.groupSelection()},"Group"),M("button",{class:"wb-btn",disabled:!A,title:"Ungroup (Shift+Cmd+G)",onclick:()=>e.ungroupSelection()},"Ungroup"),M("span",{style:{flex:1}}),M("span",{class:"wb-muted wb-small"},L?`${L} selected`:`${x.elements.length}`)),s.replaceChildren(...x.stages.map(k))},T=()=>{v(),s.querySelector(".wb-outliner-row.selected")?.scrollIntoView({block:"nearest"})};e.store.subscribe(v),e.on("selection",T),e.on("stage",v),v()}let Gc=0;const As=()=>`clip-${Date.now().toString(36)}-${(Gc++).toString(36)}`,$r=["title","artboard","stages","decisions","groups","brushes","lines","meta","boards","train"];function Ts(n,e){const t={},o=new Map(n.elements.map(c=>[c.id,c])),i=new Map(e.elements.map(c=>[c.id,c])),s=[],r=[],a=[];for(const c of e.elements){const h=o.get(c.id);h?h!==c&&JSON.stringify(h)!==JSON.stringify(c)&&r.push(c):s.push(c)}for(const c of n.elements)i.has(c.id)||a.push(c.id);s.length&&(t.add=s),r.length&&(t.update=r),a.length&&(t.remove=a);const l=e.elements.map(c=>c.id);n.elements.map(c=>c.id).filter(c=>i.has(c)).join()!==l.filter(c=>o.has(c)).join()&&(t.order=l);for(const c of $r)JSON.stringify(n[c]??null)!==JSON.stringify(e[c]??null)&&(t[c]=e[c]);return Object.keys(t).length?Jc(t):null}const Jc=n=>typeof structuredClone=="function"?structuredClone(n):JSON.parse(JSON.stringify(n));function Es(n,e,{reveal:t=1}={}){if(!e)return n;const o={...n};for(const s of $r)s in e&&(o[s]=e[s]);let i=n.elements;if(e.remove||e.update){const s=new Set(e.remove||[]),r=new Map((e.update||[]).map(a=>[a.id,a]));i=i.filter(a=>!s.has(a.id)).map(a=>r.get(a.id)||a)}if(e.add){const s=e.add.length;if(t>=1)i=[...i,...e.add];else{const r=t*s,a=[];for(let l=0;l<s&&l<r;l++)a.push(Pr(e.add[l],Math.min(1,r-l)));i=[...i,...a]}}if(e.order){const s=new Map(i.map(r=>[r.id,r]));i=[...e.order.map(r=>s.get(r)).filter(Boolean),...i.filter(r=>!e.order.includes(r.id))]}return o.elements=i,o}function Pr(n,e){if(e>=1)return n;if(["point","note","image"].includes(n.role)||n.points.length<2)return{...n,opacity:(n.opacity??1)*Math.max(.05,e)};if(n.role==="plane")return{...n,opacity:(n.opacity??1)*Math.max(.05,e)};const t=n.points[0][2]??0,o=n.points[n.points.length-1][2]??0,i=o>t,s=i?t+(o-t)*e:e*(n.points.length-1),r=i?n.points.filter(a=>a[2]<=s):n.points.slice(0,Math.max(2,Math.ceil(s)+1));return{...n,points:r.length>1?r:n.points.slice(0,2),partial:e}}function Ar({title:n="Take",baseline:e,clips:t=[]}={}){return{type:"ams-take",version:1,title:n,created:new Date().toISOString(),baseline:e,clips:t}}const Vc=n=>Math.max(0,...n.clips.map(e=>e.start+e.dur)),Tr=n=>Math.max(1600,String(n||"").split(/\s+/).length*320);function Yc(n,{maxGap:e=350,drawMax:t=2200,analysisSpeed:o=4,hold:i=2500,keepActions:s=!1}={}){const r=new Set((n.baseline.stages||[]).filter(g=>["analysis","construction"].includes(g.kind)).map(g=>g.id)),a=g=>g.track==="draw"&&(g.diff?.add||[]).length>0&&g.diff.add.every(w=>["guide","gesture"].includes(w.role)||r.has(w.stage)),l=n.clips.filter(g=>s||g.track!=="action").slice().sort((g,w)=>g.start-w.start),d=[];let c=0,h=null,u=0;for(const g of l){if(h!==null){const S=Math.max(0,g.start-h);c+=S<40?0:Math.min(S,e),c=Math.max(c,g.track==="say"?u-200:c)}let w=g.dur;g.track==="say"&&(w=Math.min(g.dur,Tr(g.text))),g.track==="draw"&&(w=a(g)?Math.min(g.dur/o,600):Math.min(g.dur,t)),g.track==="action"&&(w=Math.min(g.dur,400));const y={...g,id:As(),start:Math.round(c),dur:Math.round(w)};d.push(y),h=g.start,u=Math.max(u,y.start+(g.track==="say"?y.dur:Math.min(y.dur,600))),(g.track==="draw"||g.track==="say")&&(c=Math.max(c,y.start+Math.min(y.dur,g.track==="say"?y.dur*.7:y.dur)))}const f=Math.max(0,...n.clips.map(g=>g.start+g.dur));let p=Math.max(0,...d.map(g=>g.start+g.dur));const m=Math.max(1e4,f*.5);if(p>m){const g=m/p;for(const w of d)w.start=Math.round(w.start*g),w.dur=Math.max(200,Math.round(w.dur*g));p=m}d.push({id:As(),track:"title",start:p+200,dur:i,text:n.title,sub:"Summary",fx:{fade:400}});const b=String(n.title).replace(/(\s*\(summary\))+$/,"");return{...Ar({title:`${b} (summary)`,baseline:n.baseline,clips:d}),tracks:n.tracks?JSON.parse(JSON.stringify(n.tracks)):void 0,source:n.title,summaryOf:n.assetId||n.summaryOf||null}}const Xc=Object.freeze(Object.defineProperty({__proto__:null,applyDiff:Es,clipId:As,createTake:Ar,diffDocs:Ts,duration:Vc,partial:Pr,readingTime:Tr,summarize:Yc},Symbol.toStringTag,{value:"Module"})),ht=n=>typeof structuredClone=="function"?structuredClone(n):JSON.parse(JSON.stringify(n)),Zc=800;class Qc{constructor(e){this.app=e,this.entries=[],this.baseline=ht(e.store.doc),this.last=ht(e.store.doc),this.listeners=new Set,this.seq=0;try{this.capturing=localStorage.getItem("ams_history_capture")!=="0"}catch{this.capturing=!0}e.store.subscribe((t,o)=>this.onChange(o))}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}emit(){for(const e of this.listeners)try{e(this)}catch(t){console.error(t)}}setCapturing(e){this.capturing=e;try{localStorage.setItem("ams_history_capture",e?"1":"0")}catch{}if(e){const t=this.entries.length?this.stateAfter(this.entries.length-1):this.baseline,o=Ts(t,this.app.store.doc);o&&(this.entries.push({id:`h${++this.seq}`,t:Date.now(),label:"(while paused)",by:"user",diff:o,summary:Fo(o)}),this._states=null)}this.last=ht(this.app.store.doc),this.emit()}onChange(e){if(!this.capturing)return;const t=this.app.store.doc,o=Ts(this.last,t);if(this.last=ht(t),!o)return;const i=this.app.store.log?.[this.app.store.log.length-1]?.by||"user",s={id:`h${++this.seq}`,t:Date.now(),label:String(e||"change"),by:i,diff:o,summary:Fo(o)};if(this.entries.push(s),this.entries.length>Zc){const r=this.entries.shift();this.baseline=Es(this.baseline,r.diff)}this._states=null,this.emit()}clear(){this.entries=[],this.baseline=ht(this.app.store.doc),this.last=ht(this.app.store.doc),this._states=null,this.emit()}stateAfter(e){if(e<0)return this.baseline;if(!this._states){this._states=[];let t=this.baseline;for(const o of this.entries)t=Es(t,o.diff),this._states.push(t)}return this._states[e]}indexOf(e){return this.entries.findIndex(t=>t.id===e)}clipsFrom(e,t=0,o=250){const i=[];let s=t;for(const r of this.entries.filter(a=>e.includes(a.id))){const a=r.diff.add||[];let l=400;if(a.length===1&&a[0].points?.length>1){const d=a[0].points;l=Math.min(2e4,Math.max(300,(d[d.length-1][2]??0)-(d[0][2]??0)))||900}else a.length>1&&(l=Math.min(6e3,Math.max(600,a.length*140)));i.push({track:"draw",start:Math.round(s),dur:Math.round(l),diff:ht(r.diff),label:r.label,by:r.by,fx:{}}),s+=l+o}return i}}function Fo(n){const e=(o=[])=>{const i={};for(const s of o)i[s.role]=(i[s.role]||0)+1;return Object.entries(i).map(([s,r])=>`${r} ${s}${r>1?"s":""}`).join(", ")},t=[];n.add?.length&&t.push(`+ ${e(n.add)}`),n.update?.length&&t.push(`~ ${e(n.update)}`),n.remove?.length&&t.push(`− ${n.remove.length}`);for(const o of["stages","artboard","title","brushes","groups"])o in n&&t.push(o);return t.join(" · ")}function Er(n){const e=(i,s,r,a="",l="")=>({id:`${i}:${s}`,category:i,name:s,run:r,keys:a,hint:l}),t=[e("File","New drawing (a new scene)",()=>n.scenes.create()),e("File","Open file…",()=>n.openFile()),e("File","Save to Assets",()=>n.saveToAssets(),"⌘S"),e("Edit","Undo",()=>n.store.undo(),"⌘Z"),e("Edit","Redo",()=>n.store.redo(),"⇧⌘Z"),e("Edit","Pick a color (eyedropper)",()=>Ve(()=>Promise.resolve().then(()=>ui),void 0,import.meta.url).then(i=>i.eyedropToTarget(n)),"I"),e("Edit","Select all",()=>n.canvas.select(n.store.doc.elements.filter(i=>n.canvas.editable(i)).map(i=>i.id)),"⌘A"),...[["png","Picture (PNG)"],["svg","SVG with process record"],["p5","p5.js sketch (zip)"],["sheet","Process sheet (PNG)"],["json","Process document (JSON)"],["excalidraw","Excalidraw"]].map(([i,s])=>e("Export",s,()=>n.exportAs(i))),e("View","Picture view",()=>n.setViewMode("picture"),"\\"),e("View","Process view",()=>n.setViewMode("process"),"\\"),e("View","Fit artboard",()=>{n.canvas.fit(),n.renderChrome()},"F"),e("View","Toggle reference",()=>{n.reference&&(n.reference.visible=!n.reference.visible,n.canvas.invalidate(),n.renderChrome())},"R"),e("View","Toggle grid",()=>n.canvas.setGrid({show:n.canvas.grid.show==="off"?"paper":"off"})),e("View","Toggle snap to grid",()=>{n.canvas.setGrid({snap:!n.canvas.grid.snap}),n.log(`Snap ${n.canvas.grid.snap?"on":"off"}.`)}),e("Record","Start recording",()=>n.recorder.start()),e("Record","Stop recording",()=>n.recorder.stop()),e("Record","Timeline",()=>n.docks.open("timeline")),e("View","Reset layout",()=>n.docks.reset()),e("View","Classic studio",()=>{window.location.href="/classic.html"})];for(const[i,s,r]of n.toolList||[])t.push(e("Tool",s,()=>n.setTool(i),r));for(const i of n.docks.panels.values())t.push(e("Panel",i.title,()=>n.docks.open(i.id)));for(const i of an)t.push(e("Exercise",i.title,()=>{n.docks.open("script"),n.scriptPanel?.setSource(i.source),n.scriptPanel?.run()},"",i.brief));for(const i of n.walkthroughs.list())t.push(e("Walkthrough",i.title,()=>n.walkthroughs.start(i.id),"",i.summary));for(const i of n.docsTopics?.()||[])t.push(e("Docs",i.title,()=>n.openDocs(i.id),"",i.summary));t.push(e("Decide","Analyze reference",()=>{n.docks.open("decide"),n.decidePanel?.analyze()}),e("Decide","Propose step",()=>{n.docks.open("decide"),n.decidePanel?.propose()}),e("Agent","How did you do that? (replay last agent session)",()=>window.ams.callTool("ams_sessions",{action:"replay"})));const o={"File:Save to Assets":"file.save","Edit:Undo":"edit.undo","Edit:Redo":"edit.redo","Edit:Select all":"edit.selectAll","Edit:Pick a color (eyedropper)":"edit.eyedropper","View:Picture view":"view.toggle","View:Process view":"view.toggle","View:Fit artboard":"view.fit","View:Toggle reference":"view.reference","View:Toggle grid":"view.grid","View:Toggle snap to grid":"view.snap"};for(const i of t){const s=o[i.id]||(i.category==="Tool"?`tool.${(n.toolList||[]).find(r=>r[1]===i.name)?.[0]}`:null);s&&n.shortcuts&&(i.keys=n.shortcuts.label(s))}if(n.embed&&!n.embed.full){const i=/^(Record|Exercise|Walkthrough|Docs|Decide|Agent)$/,s=/^(New drawing|Open file|Save to Assets|Classic studio|Toggle reference|p5\.js sketch|Process sheet)/;return t.filter(r=>!i.test(r.category)&&!s.test(r.name))}return t.push({id:"Panel:Shortcuts",category:"App",name:"Shortcuts",hint:"Search and reassign keys",keys:n.shortcuts?.label("app.shortcuts")||"",run:()=>n.docks.open("shortcuts")}),t}function Lr(n){const e=ed(n);return n.embed&&!n.embed.full?e.filter(t=>!/^(ui|present|convert|samples|lesson)$/.test(t.name)):e}function ed(n){return[{name:"background",args:"<color | transparent | default>",doc:"The workspace behind the boards: a color (#1b1c1f, a name), transparent (for a see-through window over the desktop), or the theme’s own",run:e=>n.setBackground(e||"default")},{name:"transparent",args:"",doc:"See-through workspace (toggle): only the boards, marks and interface show over what is behind the window",run:()=>n.setBackground(n.background==="transparent"?"default":"transparent")},{name:"ui",args:"<on | off>",doc:"Show or hide all of the interface",run:e=>n.setUI({all:e?!/^(off|hide|no|0)$/i.test(e):n.ui?.tools===!1})},{name:"present",args:"",doc:"Present the boards",run:()=>n.present(!0)},{name:"grid",args:"<off | paper | all>",doc:"Show the grid",run:e=>n.canvas.setGrid({show:e==="all"?"everywhere":e==="off"?"off":"paper"})},{name:"bake",args:"<png | svg>",doc:"Bake the selection (or the board you are on) into one image mark: PNG, or SVG (vector, crisp at any zoom). Undo brings the marks back",run:e=>{const t=/svg/i.test(e||"")?"svg":"png",o=[...n.canvas.selected];if(o.length){const i=n.bakeMarks(o,{format:t,title:`${o.length} marks`});i&&n.canvas.select([i.id])}else n.bakeBoard(n.activeBoard||"main",t)}},{name:"convert",args:"<p5 | studio>",doc:"The board you are on as a new board in the other language: studio code → the p5 sketch (runs here and in the p5 editor), or a sketch the studio wrote → studio code",run:e=>n.convertBoard(n.activeBoard||"main",/studio/i.test(e||"")?"studio":"p5")},{name:"copy",args:"<png | svg | json | p5>",doc:"Copy the selection (or the board you are on) to the clipboard",run:e=>{const t=(e||"png").toLowerCase(),o=[...n.canvas.selected];o.length?n.copySelection(t==="p5"?"p5":t,o):n.copyBoard(n.activeBoard||"main",t)}},{name:"samples",args:"",doc:"A new scene with the stock samples (Assets › Samples), each as a source on its own board with a player",run:()=>n.buildSamplesScene().then(e=>n.log(`Samples: ${e} boards.`)).catch(e=>n.log(`Samples: ${e.message}`,"error"))},{name:"lesson",args:"sampling [p5 | expl] | sampling-expl | diffusion",doc:"Build a lesson as a new scene of frames: its boards from code, with Markdown notes and links (sampling: pointillism and expressionism; p5: p5.js sketches; expl: barebones p5.js sketches. diffusion: diffusion models)",run:e=>Ve(()=>Promise.resolve().then(()=>qs),void 0,import.meta.url).then(t=>{const o=/diffusion/i.test(e||""),i=/expl/i.test(e||""),s=/p5/i.test(e||"")&&!i,r=o?"diffusion":i?"sampling-expl":"sampling",a=i?"expl":s?"p5":"studio";return t.buildLesson(n,r,{language:a,expl:i})}).then(t=>n.log(`The lesson is a scene: ${t} boards.`)).catch(t=>n.log(`Lesson: ${t.message}`,"error"))}]}const td=(n,e)=>{const t=`${n.name} ${n.category} ${n.hint}`.toLowerCase();if(!e.every(i=>t.includes(i)))return-1;const o=n.name.toLowerCase();return(o.startsWith(e[0])?3:0)+(o.includes(e.join(" "))?2:0)+(n.category.toLowerCase().startsWith(e[0])?1:0)};function Br(n){document.querySelector(".wb-palette-overlay")?.remove();const e=Er(n);let t=e,o=0;const i=M("input",{class:"wb-palette-input",placeholder:"Command, panel, exercise, doc… or ask",spellcheck:"false"}),s=M("div",{class:"wb-palette-results",role:"listbox"}),r=M("div",{class:"wb-palette-overlay",onpointerdown:u=>{u.target===r&&a()}},M("div",{class:"wb-palette-card"},i,s)),a=()=>r.remove(),l=u=>({id:"ask",category:"Assistant",name:`Ask: ${u}`,hint:"",keys:"↵",run:()=>{n.docks.open("assistant"),setTimeout(()=>n.assistantAsk?.(u),50)}}),d=()=>{const u=i.value.trim().toLowerCase();if(u.startsWith("/")){const[p,...m]=i.value.trim().slice(1).split(/\s+/),b=m.join(" ");t=Lr(n).filter(g=>g.name.startsWith(p.toLowerCase())).map(g=>({id:`/${g.name}`,category:"Command",name:`/${g.name}${b?` ${b}`:g.args?` ${g.args}`:""}`,hint:g.doc,keys:"↵",run:()=>g.run(b)})),o=Math.min(o,Math.max(0,t.length-1)),s.replaceChildren(...t.map((g,w)=>M("div",{class:`wb-palette-item${w===o?" active":""}`,title:g.hint||"",onpointerenter:()=>{o=w,c()},onclick:()=>h(g)},M("span",{class:"wb-palette-name"},g.name),M("span",{class:"wb-palette-cat"},g.hint),M("kbd",{},g.keys)))),t.length||s.append(M("div",{class:"wb-palette-empty"},"No such command (try /background, /transparent)"));return}const f=u.split(/\s+/).filter(Boolean);t=f.length?e.map(p=>[p,td(p,f)]).filter(([,p])=>p>=0).sort((p,m)=>m[1]-p[1]).map(([p])=>p):e,u&&(t=[...t.slice(0,40),l(i.value.trim())]),o=Math.min(o,t.length-1),s.replaceChildren(...t.slice(0,60).map((p,m)=>M("div",{class:`wb-palette-item${m===o?" active":""}`,title:p.hint||"",onpointerenter:()=>{o=m,c()},onclick:()=>h(p)},M("span",{class:"wb-palette-name"},p.name),M("span",{class:"wb-palette-cat"},p.category),p.keys?M("kbd",{},p.keys):null))),t.length||s.append(M("div",{class:"wb-palette-empty"},"Nothing matches"))},c=()=>s.querySelectorAll(".wb-palette-item").forEach((u,f)=>u.classList.toggle("active",f===o)),h=u=>{a();try{u.run()?.catch?.(p=>n.log(p.message,"error"))}catch(f){n.log(f.message,"error")}};i.addEventListener("input",()=>{o=0,d()}),i.addEventListener("keydown",u=>{u.stopPropagation(),u.key==="ArrowDown"?(u.preventDefault(),o=(o+1)%t.length,c(),s.children[o]?.scrollIntoView({block:"nearest"})):u.key==="ArrowUp"?(u.preventDefault(),o=(o-1+t.length)%t.length,c(),s.children[o]?.scrollIntoView({block:"nearest"})):u.key==="Enter"?(u.preventDefault(),t[o]&&h(t[o])):u.key==="Escape"&&(u.preventDefault(),a())}),document.body.append(r),d(),i.focus()}const nd=Object.freeze(Object.defineProperty({__proto__:null,buildCommands:Er,openPalette:Br,slashCommands:Lr},Symbol.toStringTag,{value:"Module"}));function Ie(n,e,t){document.querySelectorAll(".wb-menu").forEach(l=>l.remove());const o=[],i=(l,d,c,h=0,u=null)=>{o.slice(h).forEach(m=>m.remove()),o.length=h;const f=M("div",{class:"wb-menu",style:{left:`${d}px`,top:`${c}px`}});o.push(f);for(const m of l){if(!m)continue;if(m==="-"){f.append(M("hr"));continue}if(m.label&&!m.run&&!m.items){f.append(M("div",{class:"wb-menu-label"},m.label));continue}const b=M("button",{title:m.hint||"",class:`${m.items?"wb-menu-sub":""}${m.active?" active":""}`,disabled:m.disabled||!1},m.icon?M("span",{class:"wb-menu-icon",html:m.icon}):null,M("span",{class:m.icon?"wb-menu-text":""},m.label),m.keys?M("kbd",{},m.keys):m.items?M("span",{class:"wb-menu-arrow"},"›"):null);if(m.items){const g=()=>{const w=b.getBoundingClientRect();i(m.items,w.right+2,w.top-4,h+1,w)};b.addEventListener("pointerenter",g),b.addEventListener("click",g)}else b.addEventListener("pointerenter",()=>{o.slice(h+1).forEach(g=>g.remove()),o.length=h+1}),b.addEventListener("click",g=>{s(),m.run(g)});f.append(b)}document.body.append(f);const p=f.getBoundingClientRect();p.bottom>window.innerHeight-8&&(f.style.top=`${Math.max(8,window.innerHeight-8-p.height)}px`),p.right>window.innerWidth-8&&(f.style.left=`${Math.max(8,(u?u.left:d)-p.width-2)}px`)},s=()=>{o.forEach(l=>l.remove()),window.removeEventListener("pointerdown",r,!0),window.removeEventListener("keydown",a,!0)},r=l=>{o.some(d=>d.contains(l.target))||s()},a=l=>{l.key==="Escape"&&(l.stopPropagation(),s())};return i(n,e,t),setTimeout(()=>{window.addEventListener("pointerdown",r,!0),window.addEventListener("keydown",a,!0)}),s}function sd(n){return new Promise(e=>{const t=document.createElement("div");t.className="wb-dialog-back";const o=document.createElement("div");o.className="wb-dialog",t.append(o),document.body.append(t);const i=r=>{t.remove(),window.removeEventListener("keydown",s,!0),e(r)},s=r=>{r.key==="Escape"&&(r.stopPropagation(),r.preventDefault(),i(null))};window.addEventListener("keydown",s,!0),t.addEventListener("pointerdown",r=>{r.target===t&&i(null)}),n(o,i)})}const _o=(n,e,t)=>{const o=document.createElement("button");return o.className=`wb-btn ${e||""}`,o.textContent=n,o.onclick=t,o};function od(n,e=""){return sd((t,o)=>{const i=document.createElement("p");i.textContent=n;const s=document.createElement(String(e).length>60||String(e).includes(`
`)?"textarea":"input");s.className="wb-inline wb-dialog-input",s.value=e,s.addEventListener("keydown",a=>{a.stopPropagation(),a.key==="Enter"&&(s.tagName==="INPUT"||a.metaKey||a.ctrlKey)&&(a.preventDefault(),o(s.value)),a.key==="Escape"&&o(null)});const r=document.createElement("div");r.className="wb-dialog-row",r.append(_o("Cancel","",()=>o(null)),_o("OK","primary",()=>o(s.value))),t.append(i,s,r),setTimeout(()=>{s.focus(),s.select?.()})})}const Wo=900,id=512,rd=2048,qt=()=>document.createElement("canvas"),Oe=(n,e)=>Math.imul(n^(e|0),16777619)|0;class ad{constructor(e){this.app=e,this.pictures=new Map,this.masks=new Map,this.views=new Map,this.compiled=new Map,this.scratch=null,this.sigs=new Map,this.anim=new Set,this.stats={composed:0,masked:0,ms:0}}hasFx(e){return Array.isArray(e)&&e.length>0&&!gl(e)}needs(e){return!!(e&&(e.maskWith||this.hasFx(e.fx)))}compile(e){const t=Lt(e);let o=this.compiled.get(t);return o||(this.compiled.size>64&&this.compiled.clear(),o=pl(e),this.compiled.set(t,o)),o}begin(e,t){this.sigs.clear(),this.anim.clear();for(const o of e.elements){const i=o.board||H,s=o.points,r=s.length;let a=this.sigs.get(i)??2166136261;a=Oe(a,r),a=Oe(a,(s[0]?.[0]??0)*64),a=Oe(a,(s[0]?.[1]??0)*64),a=Oe(a,(s[r-1]?.[0]??0)*64),a=Oe(a,(s[r>>1]?.[1]??0)*64);const l=o.id;a=Oe(a,l.length),a=Oe(a,l.charCodeAt(l.length-1)),a=Oe(a,l.charCodeAt(l.length-2)||0),a=Oe(a,l.charCodeAt(l.length-3)||0),o.color&&(a=Oe(a,o.color.charCodeAt(1)*131+o.color.charCodeAt(o.color.length-1)));const d=o.realize?.params;if(d)for(const c in d){const h=d[c];typeof h=="number"&&(a=Oe(a,h*100))}this.sigs.set(i,a),o.time&&Ti(o.time,(t-(o.born??t))/1e3)===0&&this.anim.add(i)}}sig(e){return this.sigs.get(e)??0}scratchCanvas(e,t){const o=this.scratch||=qt();return(o.width!==e||o.height!==t)&&(o.width=e,o.height=t),o}canvasOp(e,t){const o=e.width,i=e.height,s=e.getContext("2d"),r=this.scratchCanvas(o,i),a=r.getContext("2d");if(a.setTransform(1,0,0,1,0,0),a.clearRect(0,0,o,i),t.op==="blur"){if(!("filter"in a)||!(t.radius>0))return;a.filter=`blur(${t.radius}px)`,a.drawImage(e,0,0),a.filter="none"}else{const l=Math.max(1,Math.round(t.size)),d=Math.max(1,Math.ceil(o/l)),c=Math.max(1,Math.ceil(i/l));a.imageSmoothingEnabled=!0,a.drawImage(e,0,0,d,c),s.save(),s.setTransform(1,0,0,1,0,0),s.clearRect(0,0,o,i),s.imageSmoothingEnabled=!1,s.drawImage(r,0,0,d,c,0,0,d*l,c*l),s.restore();return}s.save(),s.setTransform(1,0,0,1,0,0),s.clearRect(0,0,o,i),s.drawImage(r,0,0),s.restore()}runStack(e,t,o=null){const i=e.getContext("2d",{willReadFrequently:!0}),s=e.width,r=e.height;let a=null;const l=()=>{a&&(i.putImageData(a,0,0),a=null)};for(const d of t){if(d.t==="canvas"){l(),this.canvasOp(e,d);continue}a||=i.getImageData(0,0,s,r),fl(d,a.data)}o&&(a||=i.getImageData(0,0,s,r),o(a.data)),l()}underlay(e){if(!e.source||(e.sourceOpacity??.5)<=0)return null;const t=this.app.sources?.view(e.source);if(!t?.width)return null;if(!this.hasFx(e.sourceFx))return t;const o=`${this.app.sources.stamp(e.source)}|${Lt(e.sourceFx)}`;let i=this.views.get(e.id);if(!i||i.key!==o){const s=Math.min(1,Wo/Math.max(t.width,t.height)),r=i?.canvas||qt();r.width=Math.max(1,Math.round(t.width*s)),r.height=Math.max(1,Math.round(t.height*s)),r.getContext("2d").drawImage(t,0,0,r.width,r.height),this.runStack(r,this.compile(e.sourceFx).stages),i={key:o,canvas:r},this.views.set(e.id,i)}return i.canvas}paintUnderlay(e,t,o,i){const s=(t.sourceFit==="contain"?Math.min:Math.max)(t.width/o.width,t.height/o.height),r=o.width*s,a=o.height*s;e.save(),e.globalAlpha=t.sourceOpacity??.5,t.sourceBlend&&t.sourceBlend!=="normal"&&(e.globalCompositeOperation=t.sourceBlend),e.drawImage(o,(t.width-r)/2*i,(t.height-a)/2*i,r*i,a*i),e.restore()}maskKey(e,t){const o=e.maskWith;let i="";if(o.source)i=this.app.sources.stamp(o.source);else if(o.board){const s=ke(t.doc,o.board);i=s?`${this.sig(s.id)}${this.anim.has(s.id)?`.${Math.floor(t.now/40)}`:""}${s.maskWith||this.hasFx(s.fx)?"*":""}`:"-"}return`${o.source||o.board}|${o.mode}|${o.invert?1:0}|${o.feather||0}|${o.fit||""}|${o.res||""}|${Lt(o.fx)}|${i}`}maskCanvas(e,t,o,i){const s=e.maskWith,r=s.mode==="alpha"?"alpha":"luma",a=Math.min(1,Math.min(1024,Math.max(128,Number(s.res)||id))/Math.max(o,i)),l=Math.max(1,Math.round(o*a)),d=Math.max(1,Math.round(i*a)),c=`${this.maskKey(e,t)}|${l}x${d}`;let h=this.masks.get(e.id);if(h?.key===c)return h.canvas;let u=null,f=!1;if(s.source){const b=this.app.sources?.view(s.source);b?.width&&(u=b)}else if(s.board){const b=ke(t.doc,s.board);b&&b.id!==e.id&&!(t.chain||[]).includes(b.id)&&(t.chain||[]).length<3&&(u=this.compose(b,{...t,scale:l/b.width,transparent:!0,chain:[...t.chain||[],e.id]}),f=!0)}if(!u?.width)return null;const p=h?.canvas||qt();p.width=l,p.height=d;const m=p.getContext("2d",{willReadFrequently:!0});if(m.setTransform(1,0,0,1,0,0),m.clearRect(0,0,l,d),f)m.drawImage(u,0,0,l,d);else{const b=(s.fit==="contain"?Math.min:Math.max)(l/u.width,d/u.height),g=u.width*b,w=u.height*b;m.drawImage(u,(l-g)/2,(d-w)/2,g,w)}return this.runStack(p,this.hasFx(s.fx)?this.compile(s.fx).stages:[],b=>ml(b,r,!!s.invert)),s.feather>0&&this.canvasOp(p,{t:"canvas",op:"blur",radius:s.feather*a}),h={key:c,canvas:p},this.masks.set(e.id,h),this.stats.masked++,p}compose(e,t){const o=this.hasFx(e.fx),i=Math.min(1,(o?Wo:rd)/Math.max(1,Math.max(e.width,e.height)*t.scale)),s=t.scale*i,r=Math.max(1,Math.round(e.width*s)),a=Math.max(1,Math.round(e.height*s)),l=e.source?this.app.sources.stamp(e.source):"",d=[this.sig(e.id),this.anim.has(e.id)?Math.floor(t.now/40):"",r,a,t.transparent?"t":"",t.mode,l,Lt(e.fx),e.ground,e.source?`${e.sourceOpacity}${e.sourceBlend}${e.sourceFit}${Lt(e.sourceFx)}`:""].join("|"),c=t.transparent?`${e.id}:t`:e.id;let h=this.pictures.get(`${c}#b`);if(h?.key!==d){const w=performance.now(),y=h?.canvas||qt();(y.width!==r||y.height!==a)&&(y.width=r,y.height=a);const S=y.getContext("2d");if(S.setTransform(1,0,0,1,0,0),S.globalCompositeOperation="source-over",S.globalAlpha=1,S.clearRect(0,0,r,a),!t.transparent){S.fillStyle=e.ground||"#ffffff",S.fillRect(0,0,r,a);const v=this.underlay(e);v&&this.paintUnderlay(S,e,v,s)}const k=t.doc.elements.filter(v=>(v.board||H)===e.id);k.length&&bt(S,{...t.doc,elements:k},{mode:t.mode||"picture",transform:{x:-e.x*s,y:-e.y*s,scale:s},ground:!1,screenNotes:!0,now:t.now}),o&&this.runStack(y,this.compile(e.fx).stages),h={key:d,canvas:y},this.pictures.set(`${c}#b`,h),this.stats.composed++,this.stats.ms+=performance.now()-w}if(!e.maskWith)return h.canvas;const u=`${d}|${this.maskKey(e,t)}`;let f=this.pictures.get(c);if(f?.key===u)return f.canvas;const p=performance.now(),m=this.maskCanvas(e,t,r,a);if(!m)return h.canvas;const b=f?.canvas||qt();(b.width!==r||b.height!==a)&&(b.width=r,b.height=a);const g=b.getContext("2d");return g.setTransform(1,0,0,1,0,0),g.globalCompositeOperation="source-over",g.globalAlpha=1,g.clearRect(0,0,r,a),g.drawImage(h.canvas,0,0),g.globalCompositeOperation="destination-in",g.drawImage(m,0,0,r,a),g.globalCompositeOperation="source-over",f={key:u,canvas:b},this.pictures.set(c,f),this.stats.ms+=performance.now()-p,b}sweep(e){const t=new Map(V(e).map(o=>[o.id,o]));for(const o of[...this.pictures.keys()]){const i=o.replace(/#b$/,""),s=t.get(i.replace(/:t$/,""));(!s||!i.endsWith(":t")&&!this.needs(s))&&this.pictures.delete(o)}for(const o of[...this.masks.keys()])t.get(o)?.maskWith||this.masks.delete(o);for(const o of[...this.views.keys()])this.hasFx(t.get(o)?.sourceFx)||this.views.delete(o)}}const Ho="ams_shortcuts_v1",On=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||""),q=(n,e,t,o,i,s={})=>({id:n,category:e,label:t,keys:o,run:i,...s});function ld(n){const e=()=>[...n.canvas.selected];return[q("tool.select","Tools","Select",["v"],()=>n.setTool("select")),q("tool.direct","Tools","Direct selection (edit points)",[],()=>n.setTool("direct")),q("tool.cycle.select","Tools","Cycle select and direct",["shift+v"],()=>n.cycleStack("select")),q("tool.cycle.line","Tools","Cycle line, gesture and guide",["shift+1"],()=>n.cycleStack("line")),q("tool.cycle.brush","Tools","Cycle brushes",["shift+b"],()=>n.cycleStack("brush")),q("tool.cycle.sculpt","Tools","Cycle sculpt tools",["shift+s"],()=>n.cycleStack("sculpt")),q("tool.hand","Tools","Pan",["h"],()=>n.setTool("hand")),q("paint.pick","Tools","Stroke and fill together at the pointer (also Ctrl+right-click)",[],()=>n.openPaintPicker()),q("view.gridmenu","View","Grid settings at the pointer (also Ctrl+Shift+right-click)",[],()=>n.openGridMenu?.()),q("tool.radial","Tools","Radial menu of the current tools at the pointer (hold, move toward a tool, release)",["shift+space"],()=>n.openRadial()),q("tool.laser","Tools","Laser pointer (a fading trail, no mark)",["k"],()=>n.setTool("laser")),q("tool.point","Tools","Point (dimension 0)",["0"],()=>n.setTool("point")),q("tool.line","Tools","Line (dimension 1)",["1"],()=>n.setTool("line")),q("tool.plane","Tools","Plane (dimension 2)",["2"],()=>n.setTool("plane")),q("tool.circle","Tools","Circle (under plane)",[],()=>n.setTool("circle")),q("tool.rect","Tools","Rectangle (under plane)",[],()=>n.setTool("rect")),q("tool.cycle.plane","Tools","Cycle plane, circle and rectangle",["shift+2"],()=>n.cycleStack("plane")),q("tool.gesture","Tools","Gesture (under line)",[],()=>n.setTool("gesture")),q("tool.guide","Tools","Guide (under line)",[],()=>n.setTool("guide")),q("tool.note","Tools","Note",["t"],()=>n.setTool("note")),q("view.points","View","Show marks' points",["'"],()=>n.togglePoints()),q("tool.brush","Tools","Brush",["b"],()=>n.setTool("brush")),q("tool.sculpt","Tools","Sculpt",["s"],()=>n.setTool("sculpt")),q("path.straight","Tools","Straight path (the stroke being drawn, the selection, or the tool)",["`"],()=>n.setPathChoice("straight")),q("path.smooth","Tools","Smooth path (the stroke being drawn, the selection, or the tool)",["~"],()=>n.setPathChoice("smooth")),q("sculpt.smaller","Tools","Sculpt radius smaller",["["],()=>n.setSculpt({radius:n.sculpt.radius/1.2})),q("sculpt.larger","Tools","Sculpt radius larger",["]"],()=>n.setSculpt({radius:n.sculpt.radius*1.2})),q("sculpt.weaker","Tools","Sculpt strength down",["{"],()=>n.setSculpt({strength:n.sculpt.strength-.1})),q("sculpt.stronger","Tools","Sculpt strength up",["}"],()=>n.setSculpt({strength:n.sculpt.strength+.1})),q("edit.undo","Edit","Undo",["mod+z"],()=>n.store.undo()),q("edit.redo","Edit","Redo",["mod+shift+z"],()=>n.store.redo()),q("edit.selectAll","Edit","Select all",["mod+a"],()=>n.canvas.select(n.store.doc.elements.filter(t=>n.canvas.editable(t)).map(t=>t.id))),q("edit.delete","Edit","Delete selection",["delete","backspace"],()=>{e().length&&n.store.removeElements(e())}),q("edit.deselect","Edit","Deselect and select tool (also leaves a take being reviewed)",["escape"],()=>{n.canvas.select([]),n.setTool("select")}),q("edit.group","Edit","Group",["mod+g"],()=>n.groupSelection()),q("edit.ungroup","Edit","Ungroup",["mod+shift+g"],()=>n.ungroupSelection()),q("edit.eyedropper","Edit","Eyedropper",["i"],()=>Ve(()=>Promise.resolve().then(()=>ui),void 0,import.meta.url).then(t=>t.eyedropToTarget(n))),q("view.fit","View","Fit the active board",["f"],()=>{n.canvas.fit(60,n.activeBoard),n.renderChrome()}),q("view.frameBoard","View","Frame the active board",["home"],()=>n.canvas.animateTo(n.canvas.camFor(n.activeBoard||"main"),400)),q("view.frameSelection","View","Frame the selection",["shift+home"],()=>{n.canvas.frameSelection()||n.canvas.animateTo(n.canvas.camFor(n.activeBoard||"main"),400)}),q("tool.board","Tools","Board",[";"],()=>n.setTool("board")),q("view.present","View","Present the boards",["mod+alt+p"],()=>n.present()),q("ui.all","View","Zen mode: hide all the interface, leaving only the drawing (again to bring it back)",["alt+z","mod+."],()=>n.toggleZen(),{global:!0}),q("view.theme","View","Dark / light theme",[],()=>n.toggleTheme()),q("ui.perf","View","Show / hide the performance readout (fps, redraw time)",[],()=>n.togglePerf()),q("ui.boardPerf","View","Show / hide performance under boards (runs, code and fit time, source and sketch fps)",[],()=>n.toggleBoardPerf()),q("ui.tools","View","Show / hide the tools",[],()=>n.setUI({tools:n.ui?.tools===!1})),q("ui.view","View","Show / hide the view controls and menu",[],()=>n.setUI({view:n.ui?.view===!1})),q("ui.zoom","View","Show / hide the zoom controls",[],()=>n.setUI({zoom:n.ui?.zoom===!1})),q("ui.panels","View","Show / hide the panels",[],()=>n.setUI({panels:n.ui?.panels===!1})),q("scene.next","View","Next scene",["alt+pagedown"],()=>n.scenes.step(1)),q("scene.prev","View","Previous scene",["alt+pageup"],()=>n.scenes.step(-1)),q("scene.new","File","New scene",["mod+alt+n"],()=>n.scenes.create()),q("board.next","View","Next board",["alt+arrowright"],()=>n.stepBoard(1)),q("board.prev","View","Previous board",["alt+arrowleft"],()=>n.stepBoard(-1)),q("view.toggle","View","Picture / process view",["\\"],()=>n.setViewMode(n.view.mode==="picture"?"process":"picture")),q("view.reference","View","Reference on / off",["r"],()=>{n.reference&&(n.reference.visible=!n.reference.visible,n.canvas.invalidate(),n.renderChrome())}),q("view.grid","View","Grid on / off",["mod+'"],()=>n.canvas.setGrid({show:n.canvas.grid.show==="off"?"paper":"off"})),q("view.snap","View","Snap to grid",["shift+tab"],()=>n.canvas.setGrid({snap:!n.canvas.grid.snap})),q("view.zoomIn","View","Zoom in",["mod+="],()=>n.canvas.zoomAt(n.canvas.w/2,n.canvas.h/2,1.2)),q("view.zoomOut","View","Zoom out",["mod+-"],()=>n.canvas.zoomAt(n.canvas.w/2,n.canvas.h/2,1/1.2)),q("dock.left","Panels","Toggle left dock",["mod+b"],()=>n.docks.toggleDock("left")),q("dock.right","Panels","Toggle right dock",["mod+alt+b"],()=>n.docks.toggleDock("right")),q("dock.bottom","Panels","Toggle bottom dock",["mod+shift+b"],()=>n.docks.toggleDock("bottom")),q("app.palette","App","Command palette",["mod+k"],()=>Ve(()=>Promise.resolve().then(()=>nd),void 0,import.meta.url).then(t=>t.openPalette(n)),{global:!0}),q("app.settings","App","Settings",["mod+,"],()=>n.docks.open("settings"),{global:!0}),q("app.shortcuts","App","Shortcuts",["mod+shift+/"],()=>n.docks.open("shortcuts"),{global:!0}),q("app.docs","App","Docs",["?"],()=>n.openDocs()),q("file.save","File","Save to Assets",["mod+s"],()=>n.saveToAssets(),{global:!0}),q("file.open","File","Open file",["mod+o"],()=>n.openFile()),q("score.run","Score","Run the score",[],()=>n.scriptPanel?.run())]}function cd(n){const e=n.key;if(["Meta","Control","Shift","Alt","CapsLock"].includes(e))return null;const t=[];(On?n.metaKey:n.ctrlKey)&&t.push("mod"),On&&n.ctrlKey&&t.push("ctrl"),n.altKey&&t.push("alt");let o=(e.length===1,e.toLowerCase());n.altKey&&n.code?.startsWith("Key")&&(o=n.code.slice(3).toLowerCase()),n.shiftKey&&n.code?.startsWith("Digit")&&(o=n.code.slice(5));const i=t.includes("mod")||t.includes("ctrl");return n.code==="Slash"&&i&&(o="/"),n.shiftKey&&(/^[a-z0-9/]$/.test(o)&&(i||/^[a-z0-9]$/.test(o))||e.length>1||o===" ")&&t.push("shift"),o===" "&&(o="space"),o==="del"&&(o="delete"),[...t,o].join("+")}const dd=On?{mod:"⌘",shift:"⇧",alt:"⌥",ctrl:"⌃"}:{mod:"Ctrl+",shift:"Shift+",alt:"Alt+",ctrl:"Ctrl+"},hd={tab:"⇥",escape:"Esc",delete:"Del",backspace:"⌫",enter:"↵",space:"Space",arrowup:"↑",arrowdown:"↓",arrowleft:"←",arrowright:"→","\\":"\\"};function ud(n){if(!n)return"";const e=n.split("+").filter(Boolean),t=e.pop()??"+";return`${(On?["ctrl","alt","shift","mod"]:["mod","ctrl","alt","shift"]).filter(s=>e.includes(s)).map(s=>dd[s]).join("")}${hd[t]||(t.length===1?t.toUpperCase():t)}`}class pd{constructor(e){this.app=e,this.commands=ld(e);try{this.overrides=JSON.parse(localStorage.getItem(Ho))||{}}catch{this.overrides={}}this.listeners=new Set,this.capturing=null,window.addEventListener("keydown",t=>this.onKey(t))}keysOf(e){return this.overrides[e]??this.commands.find(t=>t.id===e)?.keys??[]}isCustom(e){return e in this.overrides}label(e){return this.keysOf(e).map(ud).join(" · ")}save(){try{localStorage.setItem(Ho,JSON.stringify(this.overrides))}catch{}for(const e of this.listeners)e()}assign(e,t){const o=[];for(const s of this.commands){if(s.id===e)continue;const r=this.keysOf(s.id),a=r.filter(l=>!t.includes(l));a.length!==r.length&&(this.overrides[s.id]=a,o.push(s))}const i=this.commands.find(s=>s.id===e)?.keys||[];return JSON.stringify(t)===JSON.stringify(i)?delete this.overrides[e]:this.overrides[e]=t,this.save(),o}reset(e){e?delete this.overrides[e]:this.overrides={},this.save()}find(e){return this.commands.find(t=>this.keysOf(t.id).includes(e))}onKey(e){if(this.capturing)return;const t=cd(e);if(!t)return;const o=e.target.closest?.("input, textarea, select, [contenteditable], .cm-editor"),i=this.find(t);if(i&&!(o&&!i.global)){e.preventDefault();try{i.run()?.catch?.(r=>this.app.log(r.message,"error"))}catch(s){this.app.log(s.message,"error")}}}}function fd(n){const e=n.coherence<.25?"no clear direction":Math.abs(n.orientation)<20?"horizontal":Math.abs(n.orientation)>70?"vertical":n.orientation>0?"rising diagonal":"falling diagonal";return`${n.id}: ${n.place}, ${Math.round(n.area*100)}%, ${n.valueClass} ${n.hue}, ${n.edges>.35?"busy edges":n.edges>.12?"some edges":"calm"}, ${e}`}const Uo="ams_agent_sessions_v1",Cr=/^ams_(wb_state|vocabulary|get|snapshot|process_sheet|pending|candidates|sessions|show|decision_pending|decision_labels|record|timeline|layout)$/,zn=(n,e)=>{switch(n){case"ams_run_score":return`Running a score${e.title?` for “${e.title}”`:""}.`;case"ams_exercise":return e.load?`Loading the exercise “${e.id}”.`:`Reading the exercise “${e.id}”.`;case"ams_add":return`Adding a ${e.role}${e.why?`: ${e.why}`:"."}`;case"ams_update":return`Changing an element${e.patch?.why?`: ${e.patch.why}`:"."}`;case"ams_delete":return`Removing ${e.ids?.length||0} element(s).`;case"ams_stage":return`Stages: ${e.action} ${e.name||e.id||""}`.trim()+".";case"ams_decide":return`Deciding: ${e.question} → ${e.chosen}${e.why?` (${e.why})`:""}`;case"ams_view":return`Changing the view${e.mode?` to ${e.mode}`:""}.`;case"ams_generate":return`Asking ${e.engine||"the engine"} for ${e.count||1} score(s): “${e.prompt}”.`;case"ams_answer":return"Answering the waiting request with a score.";case"ams_save":return"Saving the drawing to Assets.";case"ams_assets":return e.open?"Opening an asset.":"Searching Assets.";case"ams_panel":return`Opening the ${e.id} panel.`;case"ams_undo":return e.redo?"Redo.":"Undo.";case"ams_brush":return e.action==="save"?"Writing a brush.":e.action==="get"?`Reading the brush “${e.id}”.`:e.action==="use"?`Using the brush “${e.id}”.`:"Brushes.";case"ams_palette":return e.action==="create"?`Making the palette “${e.name}”.`:e.action==="from_image"?"Drawing a palette from the image.":e.action==="apply"?`Using ${e.color||`${e.name} ${e.index??0}`}.`:"Palettes.";case"ams_analyze":return"Analyzing the reference: value masses, regions, edges and directions.";case"ams_decide_step":return`Asking the ${e.backend||"current"} policy for the next step.`;case"ams_decision_answer":return`Choosing: ${Object.entries(e.answers||{}).map(([t,o])=>`${t} ${o}`).join(", ")}.`;default:return n.replace(/^ams_/,"").replace(/_/g," ")}},md={async ams_run_score(n){await n.moveTo("panel:script"),await n.moveTo("button:run-score")},async ams_exercise(n,e){e.load&&(await n.moveTo("panel:script"),await n.moveTo("button:run-score"))},async ams_add(n,e,t){await n.moveTo(`tool:${e.role}`);const o=(e.points||[]).map((s,r)=>[s[0],s[1],s[2]??r*16,s[3]??.5]),i={role:e.role,stage:"draft",realize:e.brush?{brush:e.brush,params:e.params||{}}:void 0,color:e.color,seed:1};await n.trace(o,s=>{t.canvas.draft=Ne({...i,points:o.slice(0,s)},"draft"),t.canvas.invalidate()}),t.canvas.draft=null},async ams_update(n,e,t){t.selectIds([e.id]),await n.moveTo("panel:properties",{click:!1})},async ams_delete(n,e,t){t.selectIds(e.ids||[]),await n.wait(400)},async ams_stage(n,e){await n.moveTo("panel:stages"),e.id&&await n.moveTo(`stage:${e.id}`)},async ams_decide(n){await n.moveTo("panel:process",{click:!1})},async ams_view(n,e){e.mode&&await n.moveTo(`view:${e.mode}`)},async ams_generate(n){await n.moveTo("panel:generate"),await n.moveTo("button:generate")},async ams_save(n){await n.moveTo("menu")},async ams_panel(n,e){await n.moveTo(`tab:${e.id}`)},async ams_brush(n,e){(e.action==="save"||e.action==="get")&&await n.moveTo("panel:brushes",{click:!1})},async ams_undo(n){await n.moveTo("menu",{click:!1})},async ams_analyze(n){await n.moveTo("panel:decide"),await n.moveTo("button:analyze")},async ams_decide_step(n){await n.moveTo("panel:decide"),await n.moveTo("button:propose")},async ams_decision_answer(n,e){await n.moveTo("panel:decide",{click:!1}),e.apply&&await n.moveTo("button:apply-step")}};async function gd(n,e){if(!n.active)return;const t=e.store.doc;for(let o=0;o<t.stages.length;o++){const i=t.stages[o];e.setUpTo(o);const s=t.decisions.filter(a=>a.stage===i.id).map(a=>`${a.question} → ${a.chosen}${a.why?` (${a.why})`:""}`),r=t.elements.filter(a=>a.stage===i.id&&a.why).slice(0,2).map(a=>a.why);n.say([`Stage ${o+1}: ${i.name}`,...s,...r].join(`
`),`Score · ${t.title||""}`),await n.moveTo(`stage:${i.name}`,{click:!1}),await n.wait(1100)}e.setUpTo(1/0)}class bd{constructor(e){this.app=e;try{this.sessions=JSON.parse(localStorage.getItem(Uo)||"[]")}catch{this.sessions=[]}this.current=null}save(){try{localStorage.setItem(Uo,JSON.stringify(this.sessions.slice(-12)))}catch{}}record(e,t){if(Cr.test(e)||this.replaying)return;const o=Date.now();(!this.current||o-this.current.last>12e4)&&(this.current={id:`s_${o.toString(36)}`,started:o,last:o,title:"",baseline:JSON.stringify(this.app.store.doc),steps:[]},this.sessions.push(this.current));const i=JSON.parse(JSON.stringify(t||{}));this.current.steps.push({tool:e,args:i,narrate:t?.narrate||zn(e,t||{}),t:o}),this.current.last=o,this.current.title||=zn(e,t||{}),this.save()}list(){return this.sessions.map(e=>({id:e.id,started:new Date(e.started).toISOString(),steps:e.steps.length,title:e.title,tools:[...new Set(e.steps.map(t=>t.tool))]})).reverse()}async replay(e,t){const o=e?this.sessions.find(r=>r.id===e):this.sessions[this.sessions.length-1];if(!o)throw new Error("No recorded agent session");const i=this.app.guide,s=JSON.stringify(this.app.store.doc);this.replaying=!0;try{this.app.loadDocument(JSON.parse(o.baseline),"replay: baseline"),i.say(`Replaying ${o.steps.length} step(s): ${o.title}`,"Replay"),await i.wait(900);for(const[r,a]of o.steps.entries())i.say(a.narrate,`Replay · step ${r+1} of ${o.steps.length}`),await t(a.tool,{...a.args,narrate:a.narrate},{replay:!0}),await i.wait(500);i.say("Replay finished. Undo (Cmd+Z) returns to what you had before.","Replay")}finally{this.replaying=!1}return this.app.store.commitFrom(s,"replay"),{replayed:o.steps.length}}}const ne=(n={},e=[])=>({type:"object",properties:n,required:e}),W=n=>({type:"string",description:n}),ae=n=>({type:"number",description:n}),yd="You are drawing in Artist Model Studio. The picture is a process: name your stages (analysis → concept → construction → structure → value → marks → notes), record decisions with decide(), and give every mark a short reason (why). The harness does not paint for you: brushes only realize your paths. Keep construction (guides, gestures) separate from marks. Coordinates are artboard units (origin top-left).";function wd(n){const e=()=>n.store.doc,t=()=>Object.fromEntries(["line","plane","gesture","guide"].map(s=>[s,n.defaults(s).path==="straight"?"straight":"smooth"])),o=Object.fromEntries(Object.entries(Z).map(([s,r])=>[s,{roles:r.roles,doc:r.doc,params:r.params.map(a=>({key:a.key,min:a.min,max:a.max,default:a.default,doc:a.doc}))}])),i=s=>s.toDataURL("image/png");return[{name:"ams_wb_state",description:"Workbench state: title, artboard, stages (with element counts), active stage, tool, view, selection, reference underlay, shape settings, each tool's path.",inputSchema:ne(),run:()=>({title:e().title,artboard:e().artboard,boards:V(e()).map((s,r)=>({index:r,id:s.id,title:s.title,x:s.x,y:s.y,width:s.width,height:s.height,marks:st(e(),s.id).length,main:s.main})),blackboard:st(e(),ve).length,activeBoard:n.activeBoard||H,trainBoard:ps(e()),stages:e().stages.map((s,r)=>({index:r,...s,elements:e().elements.filter(a=>a.stage===s.id).length})),elements:e().elements.length,decisions:e().decisions.length,activeStage:n.activeStage?.id,tool:n.tool,view:n.view.mode==="process"?{...n.view,upTo:Number.isFinite(n.view.upTo)?n.view.upTo:null}:{...n.view,upTo:null},selection:[...n.canvas.selected],reference:n.reference?{title:n.reference.title,visible:n.reference.visible}:null,shapes:structuredClone(n.shapes),paths:t()})},{name:"ams_vocabulary",description:"How to write a score: principles, the point/line/plane vocabulary, brushes with parameter ranges, roles, stage kinds, and the exercises.",inputSchema:ne(),run:()=>({principles:yd,vocabulary:Ql,roles:Xt,stageKinds:on,brushes:o,effects:Object.fromEntries(Object.entries(jt).map(([s,r])=>[s,{label:r.label,doc:r.doc,kind:r.kind,params:r.params.map(a=>({key:a.key,min:a.min,max:a.max,default:a.default,doc:a.doc})),...r.stops?{stops:"colors or [position, color]"}:{}}])),exercises:an.map(s=>({id:s.id,title:s.title,brief:s.brief}))})},{name:"ams_exercise",description:"Get an exercise brief and its example score; optionally load and run it.",inputSchema:ne({id:W("Exercise id"),load:{type:"boolean",description:"Also run it on the canvas"}},["id"]),run:s=>{const r=an.find(a=>a.id===s.id);if(!r)throw new Error("Unknown exercise");return s.load&&(n.scriptPanel?.setSource(r.source),Ko(n,r.source,1,{kind:"example",name:"exercise"},r.title)),r}},{name:"ams_run_score",description:`Run a score (JS in the point/line/plane vocabulary) into the active board: it replaces that board's marks; other boards and the blackboard stay (board(title) in the score reaches others). Use by to credit yourself (e.g. {kind:"model", name:"claude-opus-5-5"}).`,inputSchema:ne({source:W("Score source"),seed:ae("Seed (default 1)"),title:W("Title"),by:{type:"object",description:"{ kind, name }"}},["source"]),run:s=>{n.scriptPanel?.setSource(s.source);const r=Ko(n,s.source,s.seed??1,s.by||{kind:"model",name:"agent"},s.title);return r.error?{error:r.error,logs:r.logs}:{stages:r.doc.stages.map(a=>a.name),elements:r.doc.elements.length,decisions:r.doc.decisions.length,logs:r.logs}}},{name:"ams_get",description:"The process document as JSON (the whole drawing, every board), or one board (main unless board is given) as SVG (with records), Excalidraw, a p5 sketch (p5: re-runs the score with the studio runtime; p5min: a short sketch of plain p5 calls for teaching; p5code: the board's own code as a p5 sketch, with the studio words it uses defined in p5 and sources loaded from files), or JSON of that board alone.",inputSchema:ne({format:{type:"string",enum:["json","svg","excalidraw","p5","p5min","p5code"]},p5:W("p5.js version for p5min: 2 (default, from Settings) or 1"),board:W("Board id or title (for one board)")}),run:s=>{const r=s.format||"json",a=s.board?Be(e(),(ke(e(),s.board)||{}).id||H):Be(e(),H);return r==="p5code"?n.p5CodeFor(ke(e(),s.board)?.id||H).then(l=>l?{sketch:l.code,files:l.files.map(d=>d.name)}:{error:"That board has no code of its own"}):r==="p5min"?{sketch:Mn(a,{version:s.p5||n.p5Version()})}:r==="svg"?{svg:Bt(a)}:r==="excalidraw"?Ks(a):r==="p5"?{sketch:xr(a)}:s.board?a:e()}},{name:"ams_set",description:"Replace the process document (JSON).",inputSchema:ne({doc:{type:"object"}},["doc"]),run:s=>(n.loadDocument(s.doc,"agent set"),{ok:!0})},{name:"ams_add",description:"Add one element: role (point|line|plane|guide|gesture|note), points [[x,y],...], stage id or name (default: active), brush, params, color, why, text (notes), path (smooth: a curve through the points; straight: segments). Or a shape instead of points: shape circle | rect with box [x0, y0, x1, y1] (a plane mark; a circle has sides points, 3–64, default 12, round when smooth and a polygon when path is straight; a rectangle has round 0–1, 1 a pill, and is always straight). With board (id or title), points are relative to that board's top-left and the mark joins it; without, points are world units and the mark joins the board it lands on (the blackboard outside boards).",inputSchema:ne({role:W("Role"),board:W("Board id or title"),points:{type:"array"},stage:W("Stage id or name"),brush:W("Brush id"),params:{type:"object"},color:W("Color"),why:W("Reason"),text:W("Note text"),path:W("smooth | straight"),shape:W("circle | rect"),box:{type:"array"},sides:ae("Circle sides (default 12)"),round:ae("Rectangle roundness 0–1 (default 0)"),by:{type:"object"}},["role"]),run:s=>{const r=e().stages.find(h=>h.id===s.stage||h.name===s.stage)||n.activeStage;if(s.shape){if(!["circle","rect"].includes(s.shape))throw new Error("shape is circle or rect");if(!Array.isArray(s.box)||s.box.length!==4||s.box.some(m=>!Number.isFinite(+m)))throw new Error("A shape needs box [x0, y0, x1, y1]");const[h,u,f,p]=s.box.map(Number);s.role="plane",s.points=Sr(s.shape,Math.min(h,f),Math.min(u,p),Math.max(h,f),Math.max(u,p),{sides:s.sides,round:s.round}).map(([m,b])=>[m,b]),s.shape==="rect"&&(s.path="straight")}else if(!Array.isArray(s.points))throw new Error("ams_add needs points [[x, y], ...] (or a shape with a box)");s.points=kd(s.points);const a=s.board?ke(e(),s.board):null;if(s.board&&!a)throw new Error(`No board “${s.board}” (ams_board lists them)`);const l=a?.x||0,d=a?.y||0;return{id:n.store.addElement({role:s.role,stage:r.id,...a?{board:a.main?void 0:a.id}:{},points:s.points.map((h,u)=>[h[0]+l,h[1]+d,h[2]??u*16,h[3]??.5]),realize:s.brush?{brush:s.brush,params:s.params||{}}:void 0,color:s.color,why:s.why,text:s.text,...s.path==="straight"?{path:"straight"}:{},by:s.by||{kind:"model",name:"agent"}},{by:"agent"}).id,stage:r.name}}},{name:"ams_update",description:"Change an element: any of stage, role, color, why, text, path (straight, or null for smooth), realize {brush, params}, points.",inputSchema:ne({id:W("Element id"),patch:{type:"object"}},["id","patch"]),run:s=>({ok:!!n.store.updateElement(s.id,s.patch,"agent edit",{by:"agent"})})},{name:"ams_delete",description:"Delete elements.",inputSchema:ne({ids:{type:"array",items:{type:"string"}}},["ids"]),run:s=>(n.store.removeElements(s.ids,{by:"agent"}),{ok:!0})},{name:"ams_stage",description:"Stages: add {name, kind}, update {id, patch}, move {id, delta}, delete {id}, activate {id}.",inputSchema:ne({action:{type:"string",enum:["add","update","move","delete","activate"]},id:W("Stage id or name"),name:W(""),kind:W(on.join(" | ")),patch:{type:"object"},delta:ae("±1")},["action"]),run:s=>{const r=e().stages.find(a=>a.id===s.id||a.name===s.id);if(s.action==="add"){const a=n.store.addStage({name:s.name||"Stage",kind:s.kind||"marks"});return n.setActiveStage(a.id),a}if(!r)throw new Error("Stage not found");return s.action==="update"&&n.store.updateStage(r.id,s.patch||{}),s.action==="move"&&n.store.moveStage(r.id,s.delta||1),s.action==="delete"&&n.store.removeStage(r.id),s.action==="activate"&&n.setActiveStage(r.id),{ok:!0}}},{name:"ams_decide",description:"Record a decision: question, options, chosen, why (in the active stage unless stage is given).",inputSchema:ne({question:W(""),options:{type:"array",items:{type:"string"}},chosen:W(""),why:W(""),stage:W("")},["question","chosen"]),run:s=>{const r=e().stages.find(a=>a.id===s.stage||a.name===s.stage)||n.activeStage;return n.store.addDecision({question:s.question,options:s.options||[],chosen:s.chosen,why:s.why||"",stage:r.id,by:{kind:"model",name:"agent"}},{by:"agent"})}},{name:"ams_view",description:"View: mode picture|process, upTo stage index (null = all), fit, tool (select | direct | hand | laser | board | point | line | gesture | guide | plane | circle | rect | note | brush | sculpt), cycle (select | line | plane | brush | sculpt: step through that stack, like Shift+V, Shift+1, Shift+2, Shift+B, Shift+S), select ids.",inputSchema:ne({mode:W("picture | process"),upTo:{type:["number","null"]},fit:{type:"boolean"},tool:W(""),cycle:W("select | line | plane | brush | sculpt"),select:{type:"array",items:{type:"string"}}}),run:s=>{if(s.mode&&n.setViewMode(s.mode),"upTo"in s&&n.setUpTo(s.upTo===null?1/0:s.upTo),s.fit&&n.canvas.fit(60,n.activeBoard),s.tool&&n.setTool(s.tool),s.cycle){if(!["select","line","plane","brush","sculpt"].includes(s.cycle))throw new Error("cycle is select, line, plane, brush or sculpt");n.cycleStack(s.cycle)}return s.select&&n.selectIds(s.select),{ok:!0,tool:n.tool}}},{name:"ams_snapshot",description:"PNG of a board (the main one unless board is given), picture or process view, optionally up to a stage.",inputSchema:ne({mode:W("picture | process"),scale:ae("Scale (default 0.6)"),upTo:ae("Stage index"),board:W("Board id or title")}),run:s=>{const r=n.canvas.upTo;s.upTo!==void 0&&(n.canvas.upTo=s.upTo);const a=i(n.canvas.snapshot(s.mode||n.view.mode,s.scale||.6,s.board&&ke(e(),s.board)?.id||H));return n.canvas.upTo=r,{image:a}}},{name:"ams_process_sheet",description:"PNG process sheet of a board (main unless given): each stage built up, plus decisions.",inputSchema:ne({board:W("Board id or title")}),run:s=>({image:i(vr(Be(e(),s.board&&ke(e(),s.board)?.id||H)))})},{name:"ams_active_brush",description:"The Brush tool's active brush (what B draws with), for drawing and performing alongside a person: get; set {id?, params?} (params are kept per brush); slot {n} picks brush slot n (1–9, also Alt+Shift+n); keep {n} keeps the active brush in slot n; tool {on} switches to the Brush tool.",inputSchema:ne({action:{type:"string",enum:["get","set","slot","keep","tool"]},id:W("Brush id"),params:{type:"object"},n:ae("Slot 1–9")},["action"]),run:s=>{if(s.action==="set"){if(s.id){if(!Z[s.id])throw new Error(`Unknown brush “${s.id}”`);n.setBrush({id:s.id})}s.params&&n.setBrush({params:s.params})}return s.action==="slot"&&n.useSlot(s.n),s.action==="keep"&&n.keepSlot(s.n),s.action==="tool"&&n.setTool("brush"),{active:n.brush.id,params:n.brush.params[n.brush.id]||{},slots:n.slots,tool:n.tool}}},{name:"ams_shape",description:"Settings of the shape tools (Circle and Rectangle under Plane; right-click the tool): get; set {tool: circle | rect, sides (circle, 3–48), round (rect, 0 square to 1 a pill)}. They apply to the next shapes drawn by hand; ams_add shape takes its own.",inputSchema:ne({action:{type:"string",enum:["get","set"]},tool:W("circle | rect"),sides:ae("Circle sides"),round:ae("Rectangle roundness 0–1")},["action"]),run:s=>{if(s.action==="set"){if(!["circle","rect"].includes(s.tool))throw new Error("tool is circle or rect");s.tool==="circle"&&s.sides!==void 0&&n.setShape("circle",{sides:Math.max(3,Math.min(48,Math.round(s.sides)))}),s.tool==="rect"&&s.round!==void 0&&n.setShape("rect",{round:Math.max(0,Math.min(1,s.round))})}return{shapes:structuredClone(n.shapes)}}},{name:"ams_path",description:"Smooth or straight, as the ` (straight) and ~ (smooth) keys do: with a drawing tool (line, plane, circle, gesture, guide, brush) it is the tool's state, kept for the next strokes (the stroke being drawn takes it too); with Select or Direct it changes the selected marks. get returns each tool's path.",inputSchema:ne({action:{type:"string",enum:["get","set"]},to:W("smooth | straight")},["action"]),run:s=>{if(s.action==="set"){if(!["smooth","straight"].includes(s.to))throw new Error("to is smooth or straight");n.setPathChoice(s.to)}return{tool:n.tool,paths:t()}}},{name:"ams_grid",description:"The grid: read it (no arguments) or set show (off | paper | everywhere), style (lines | dots), spacing (artboard units, whole numbers), subdivisions, color (any color, transparent, or hex with opacity), snap (marks snap to it), snapMode (points | increments | objects). A person gets these with Ctrl+Shift+right-click, which also sets the paper and workspace colors (ams_board update ground, ams_ui background).",inputSchema:ne({show:W("off | paper | everywhere"),style:W("lines | dots"),spacing:{type:"number"},subdivisions:{type:"number"},color:W("Grid color"),snap:{type:"boolean"},snapMode:W("points | increments | objects")}),run:s=>{const r={};s.show&&(r.show=s.show),s.style&&(r.style=s.style),s.spacing!=null&&(r.spacing=Math.max(5,Math.round(Number(s.spacing))||100)),s.subdivisions!=null&&(r.subdivisions=Math.max(1,Math.round(Number(s.subdivisions))||1)),s.color&&(r.color=s.color),s.snap!=null&&(r.snap=!!s.snap),s.snapMode&&(r.snapMode=s.snapMode),Object.keys(r).length&&n.canvas.setGrid(r);const a=n.canvas.grid;return{show:a.show,style:a.style,spacing:a.spacing,subdivisions:a.subdivisions,color:a.color,snap:a.snap,snapMode:a.snapMode}}},{name:"ams_snap",description:"Snap marks to the grid (one undo step). mode: points (every point to the nearest grid point), tidy (points, then repeated points merged and points on straight runs dropped), topleft or center (the whole mark moves so that corner or its center lands on the grid). step: grid multiples (1 = the finest grid lines; 2, 4… quantize coarser).",inputSchema:ne({ids:{type:"array",items:{type:"string"}},mode:{type:"string",enum:["points","tidy","topleft","center"]},step:ae("Grid multiple (default 1)")},["ids","mode"]),run:s=>{const r=n.canvas.grid.spacing/Math.max(1,n.canvas.grid.subdivisions)*(s.step||1);return{changed:n.store.snapMarks(s.ids,s.mode,r,{by:"agent"}),step:r}}},{name:"ams_ui",description:"Show or hide parts of the interface, for a clean view of just the drawing: tools, view (the right island with the menu), zoom, panels, or all (zen mode, Alt+Z for a person: all false hides everything, leaving only the canvas); perf shows the performance readout. Omit everything to read the state (it includes the last canvas redraw in ms).",inputSchema:ne({background:W("Workspace background: a color, transparent, or default"),perf:{type:"boolean"},all:{type:"boolean"},tools:{type:"boolean"},view:{type:"boolean"},zoom:{type:"boolean"},panels:{type:"boolean"}}),run:s=>{const r=Object.fromEntries(["all","tools","view","zoom","panels"].filter(a=>a in s).map(a=>[a,!!s[a]]));return Object.keys(r).length&&n.setUI(r),"perf"in s&&n.togglePerf(!!s.perf),s.background&&n.setBackground(s.background),{ui:n.ui||{tools:!0,view:!0,zoom:!0,panels:!0},perf:!!n.perfOn,redrawMs:n.canvas.stats?+n.canvas.stats.draw.toFixed(2):null,marks:n.store.doc.elements.length}}},{name:"ams_scene",description:"Scenes: a project holds several drawings, each with its boards, undo, History and Timeline (assets and brushes are shared). list; new {title?, doc?} (an empty drawing, or a copy of a process document) and open it; open {id}; duplicate; delete {id} (not the last; its drawing is gone unless saved to Assets); move {id, delta}; get {id} (another scene's document without opening it).",inputSchema:ne({action:{type:"string",enum:["list","new","open","duplicate","delete","move","get"]},id:W("Scene id or title"),title:W(""),doc:{type:"object"},delta:ae("±1")},["action"]),run:async s=>{const r=n.scenes,a=c=>r.all.find(h=>h.id===c||String(h.title).toLowerCase()===String(c||"").toLowerCase()),l=()=>({scenes:r.all.map((c,h)=>({index:h,id:c.id,title:c.title,open:c.id===r.list.active}))});if(s.action==="list")return l();if(s.action==="new")return await r.create({doc:s.doc||null,title:s.title||null}),l();if(s.action==="duplicate")return await r.duplicate(),l();const d=a(s.id);if(!d)throw new Error(`No scene “${s.id}”`);return s.action==="open"&&await r.switchTo(d.id),s.action==="delete"&&await r.remove(d.id),s.action==="move"&&r.move(d.id,s.delta||1),s.action==="get"?await r.docOf(d.id):l()}},{name:"ams_page",description:"The drawing as a page (self-contained HTML): every board with marks or text as a section (title, picture, process view, replay, its text in Markdown), after an intro. Set a board's text with ams_board update {patch: {text}}; the intro with intro here (kept in the drawing). download: true also saves the file.",inputSchema:ne({intro:W("Markdown before the boards (kept)"),title:W("Page title (default: the drawing's)"),boards:{type:"array",items:{type:"string"},description:"Board ids or titles, in order (default: all with marks or text)"},download:{type:"boolean"}}),run:async s=>{s.intro!==void 0&&n.store.change("page intro",l=>{l.meta={...l.meta||{},intro:s.intro}},{by:"agent"});const r=s.boards?s.boards.map(l=>ke(e(),l)?.id).filter(Boolean):null,a=await n.pageHtml({title:s.title||e().title,boards:r});return s.download&&Se(a,`${String(s.title||e().title||"page").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.html`,"text/html"),{html:a,bytes:a.length}}},{name:"ams_board",description:`Boards (artboards; the main one is the drawing's artboard at the origin). list; add {title, width, height, x?, y?, ground?} (placed right of the others unless x, y); update {id, patch: {title, width, height, x, y, ground (paper; any color, transparent, or 8-digit hex with opacity), hideLabel (no title above the board), hideBorder (no shadow or frame line: with both on the board is only structure and draws just its marks), locked, hidden, kind, code, mask (crop its marks to the board), maskWith {source | board, mode: luma | alpha, invert, feather, fx}, fx [post effects on its picture], sourceFx [on the source under it]}} (effects and masks are opt-in; ams_vocabulary lists the effects) (moving a board moves its marks; kind: drawing | markdown | html | p5, with code its source: Markdown with math, Mermaid, callouts and [[links]], an HTML page, or a p5 sketch with window.ams); move {id, delta} in the sequence; delete {id, deleteMarks?} (marks go to the blackboard unless deleteMarks); go {id} (make active and fit the view); train {id} (the board models learn from); assign {id, ids} (put marks on a board; id "_" is the blackboard); code {id, source} (the board's own score: runs with the board as its artboard, fractions of the board, and replaces the marks its last run made; kept on the board, shown on the page). Scores use board(title) to draw on a board.`,inputSchema:ne({action:{type:"string",enum:["list","add","update","move","delete","go","train","assign","code"]},id:W("Board id or title"),source:W("Code (action code)"),title:W(""),width:ae(""),height:ae(""),x:ae(""),y:ae(""),ground:W(""),patch:{type:"object"},delta:ae("±1"),deleteMarks:{type:"boolean"},ids:{type:"array",items:{type:"string"}}},["action"]),run:s=>{const r=()=>V(e()).map((l,d)=>({index:d,id:l.id,title:l.title,x:l.x,y:l.y,width:l.width,height:l.height,ground:l.ground,marks:st(e(),l.id).length,main:l.main,train:ps(e())===l.id}));if(s.action==="list")return{boards:r(),blackboard:st(e(),ve).length,active:n.activeBoard||H};if(s.action==="add")return n.store.addBoard({title:s.title,width:s.width,height:s.height,x:s.x,y:s.y,ground:s.ground},{by:"agent"});if(s.action==="assign"&&s.id===ve)return n.store.assignBoard(s.ids||[],ve,{by:"agent"}),{ok:!0};const a=ke(e(),s.id);if(!a)throw new Error(`No board “${s.id}”`);if(s.action==="update"&&n.store.updateBoard(a.id,s.patch||{},{by:"agent"}),s.action==="move"&&n.store.moveBoard(a.id,s.delta||1,{by:"agent"}),s.action==="delete"&&n.store.removeBoard(a.id,{deleteMarks:!!s.deleteMarks},{by:"agent"}),s.action==="go"&&n.goToBoard(a.id),s.action==="train"&&n.store.setTrainBoard(a.id,{by:"agent"}),s.action==="assign"&&n.store.assignBoard(s.ids||[],a.id,{by:"agent"}),s.action==="code"){const l=n.store.runBoardCode(a.id,s.source||"",tt,{by:"agent"});return l.error?{error:l.error,line:l.line}:{ok:!0,marks:l.marks,logs:l.logs}}return{ok:!0,boards:r()}}},{name:"ams_source",description:`Sources: the project's streams (camera, images and videos from Assets), read from code by name: source('cam') gives a sampler (.color(x, y), .value(x, y), .pose, .hands, .mask(x, y), .frame; fractions of the board), fit('cam', { shapes, live }) redraws it as plane marks. list; add {kind: camera | asset, assetId?, name?, sampling?, interval?}; remove {name}; update {name, sampling: continuous | interval | hold, interval (s), rename}; sample {name, points: [[x, y]…] (fractions), landmarks?: [pose, hands, mask]} (colors and values there, and landmarks when asked; they may take a moment the first time); frame {name} (PNG of the current frame); show {name, board?, opacity?} under a board (name "" hides it); follow {board, on} (the board's code re-runs on each new frame of the sources it reads).`,inputSchema:ne({action:{type:"string",enum:["list","add","remove","update","sample","frame","show","follow"]},name:W("Source name"),kind:W("camera | asset"),assetId:W("Asset id"),sampling:W("continuous | interval | hold"),interval:ae("Seconds between samples (interval)"),rename:W("New name"),points:{type:"array"},landmarks:{type:"array",items:{type:"string"}},board:W("Board id or title"),opacity:ae("0..1"),on:{type:"boolean"}},["action"]),run:async s=>{const r=n.sources;if(s.action==="list")return{sources:r.list.map(c=>({...c,ready:!!r.entries.get(c.name)?.data,frame:r.entries.get(c.name)?.version||0}))};if(s.action==="add"&&s.url)return{name:await n.addSourceUrl(s.url)};if(s.action==="add")return{name:await r.add({kind:s.kind||"camera",assetId:s.assetId,name:s.name,sampling:s.sampling,interval:s.interval})};const a=()=>(s.board?ke(e(),s.board)?.id:null)||n.activeBoard||H;if(s.action==="follow")return n.setBoardFollow(a(),s.on!==!1),{ok:!0};if(s.action==="show")return n.setBoardSource(a(),s.name||null,s.opacity),{ok:!0};if(!r.def(s.name))throw new Error(`No source “${s.name}” (have: ${r.list.map(c=>c.name).join(", ")||"none"})`);if(s.action==="remove")return r.remove(s.name),{ok:!0};if(s.action==="update")return(s.sampling||s.interval)&&r.update(s.name,{...s.sampling?{sampling:s.sampling}:{},...s.interval?{interval:s.interval}:{}}),s.rename&&r.rename(s.name,s.rename),{ok:!0};const l=ie(e(),a()),d=tn(s.name,{x:l.x,y:l.y,width:l.width,height:l.height});if(s.action==="sample"){const c=s.landmarks||[];if(c.length){c.includes("pose")&&d.pose,c.includes("hands")&&d.hands,c.includes("mask")&&d.mask(.5,.5);for(let u=0;u<40&&c.some(f=>!r.entries.get(s.name)?.landmarks[f]);u++)await new Promise(f=>setTimeout(f,250))}const h=tn(s.name,{x:l.x,y:l.y,width:l.width,height:l.height});return{frame:h.frame,width:h.width,height:h.height,samples:(s.points||[[.5,.5]]).map(([u,f])=>({x:u,y:f,color:h.color(u,f),value:+h.value(u,f).toFixed(3),...c.includes("mask")?{mask:+h.mask(u,f).toFixed(3)}:{}})),...c.includes("pose")?{pose:h.pose.map(u=>u.map(f=>[+f.x.toFixed(3),+f.y.toFixed(3),+(f.v??1).toFixed(2)]))}:{},...c.includes("hands")?{hands:h.hands.map(u=>u.map(f=>[+f.x.toFixed(3),+f.y.toFixed(3)]))}:{}}}if(s.action==="frame"){const c=r.view(s.name);if(!c)throw new Error("No frame yet");const h=document.createElement("canvas"),u=Math.min(1,640/Math.max(c.width,c.height));return h.width=Math.round(c.width*u),h.height=Math.round(c.height*u),h.getContext("2d").drawImage(c,0,0,h.width,h.height),{image:i(h)}}throw new Error(`Unknown action ${s.action}`)}},{name:"ams_diagnostics",description:"The flight recorder: one line per 2 s for the last minutes (visibility, frames the browser gave the page, canvas redraws, heap MB, source samples, detections, live runs, event-loop lag, long tasks) and page events (hidden, shown, frozen, resumed, errors). A page frozen while visible shows vis v with raf 0.",inputSchema:ne({minutes:ae("How far back (default 30)")}),run:s=>({log:n.diagnostics?.(s.minutes||30)||""})},{name:"ams_save",description:"Save the drawing (image + process) to Assets.",inputSchema:ne({title:W("")}),run:async s=>{s.title&&n.store.change("title",a=>{a.title=s.title},{by:"agent"});const r=await n.saveToAssets();return{id:r.id,title:r.title}}},{name:"ams_assets",description:"List assets (query words, #tag), or open one by id (processes load; images become the reference underlay).",inputSchema:ne({query:W(""),open:W("Asset id to open")}),run:async s=>{if(s.open){const r=await n.assetStore.get(s.open);if(!r)throw new Error("Not found");return await n.openAsset(r),{opened:r.title}}return(await n.assetStore.all()).filter(r=>Ec(r,s.query||"")).map(r=>({id:r.id,title:r.title,kind:r.kind,folder:r.folder,tags:r.tags,rating:r.rating}))}},{name:"ams_panel",description:"Open a panel (stages, assets, properties, script, process, log) or move it: left, right, bottom, floating.",inputSchema:ne({id:W(""),to:W("open | left | right | bottom | floating | close")},["id"]),run:s=>(!s.to||s.to==="open"?n.docks.open(s.id):s.to==="close"?n.docks.close(s.id):n.docks.move(s.id,s.to),{ok:!0})},{name:"ams_generate",description:'Generate panel: ask an engine for scores (agent, openrouter, openai, ollama, webgpu). Returns immediately; candidates appear in the panel and the first opens on the canvas. With engine "agent", answer the waiting request with ams_pending / ams_answer.',inputSchema:ne({prompt:W(""),engine:W(""),model:W(""),count:ae("1-8"),exercise:W("Exercise id or empty"),withReference:{type:"boolean"},temperature:ae("")},["prompt"]),run:s=>(n.docks.open("generate"),s.engine&&n.setGenerateEngine(s.engine,s.model),n.genPrompt=s.prompt,n.genCount=s.count||1,n.genExercise=s.exercise||"",n.genWithRef=!!s.withReference,s.temperature!==void 0&&(n.genTemp=s.temperature),n.emit("generate-refresh"),setTimeout(()=>n.startGenerate?.(),0),{started:!0})},{name:"ams_pending",description:"If a Generate request is waiting for the Agent engine: the exact system and user prompts a model would get, and the reference image if sent. Answer with ams_answer.",inputSchema:ne(),run:()=>{const s=n.artists.get("agent")?.asking;return s?{system:s.system,user:s.user,image:s.image||null,waitingSeconds:Math.round((Date.now()-s.t)/1e3)}:null}},{name:"ams_answer",description:"Answer the waiting Generate request with your reply (a score in a ```js block).",inputSchema:ne({text:W("Your reply")},["text"]),run:s=>({delivered:n.artists.get("agent")?.answer(s.text)||!1})},{name:"ams_candidates",description:"Generated candidates this session (newest first): prompt, engine, model, stages, elements, errors; open one by index.",inputSchema:ne({open:ae("Index to open")}),run:s=>{const r=n.candidates||[];return s.open!==void 0&&r[s.open]?.doc&&n.putScoreDoc(structuredClone(r[s.open].doc),"open candidate"),r.map((a,l)=>({index:l,prompt:a.prompt,engine:a.engine,model:a.model,exercise:a.exercise,stages:a.doc?.stages.length,elements:a.doc?.elements.length,error:a.error||null,attempts:a.attempts,seconds:a.seconds}))}},{name:"ams_analyze",description:"Decide panel: analyze the reference image (value masses, regions with place/value/hue/edges/direction, optional MediaPipe pose and figure). Returns a compact description of the regions.",inputSchema:ne({mediapipe:{type:"boolean"},k:ae("Value/color clusters (3-8, default 5)")}),run:async s=>{const a=await kn(n).analyze({mediapipe:!!s.mediapipe,k:s.k||5});return{regions:a.regions.map(fd),masses:a.masses,poses:a.poses?.length||0}}},{name:"ams_decide_step",description:'Decide panel: ask a policy (rules, lev, agent, you) for the next step (next, region, technique, value, direction, density) with probabilities. apply:true realizes it at once; otherwise the card waits and you may override with ams_decision_answer. With backend "agent" the questions wait for ams_decision_answer.',inputSchema:ne({backend:W("rules | lev | agent | you"),apply:{type:"boolean"}}),run:async s=>{const r=kn(n);if(s.backend&&r.setBackend(s.backend),s.backend==="agent")return r.propose().catch(d=>n.log(d.message,"error")),await new Promise(d=>setTimeout(d,50)),qo(n);const a=await r.propose(),l={state:a.state,answers:Object.fromEntries(Object.entries(a.answers).map(([d,c])=>[d,c?{value:c.value,confidence:c.confidence}:null]))};return s.apply?{...l,applied:r.apply("policy")}:l}},{name:"ams_decision_pending",description:'The state and typed questions currently waiting for an answer (backend "agent"), or null.',inputSchema:ne({}),run:()=>qo(n)},{name:"ams_decision_answer",description:"Answer the step questions: {next, region, technique, value (0 light-2 dark), direction, density (0-4)}. Answers a waiting agent request, or overrides the proposal on the card. apply:true realizes the step.",inputSchema:ne({answers:{type:"object"},apply:{type:"boolean"}},["answers"]),run:async s=>{const r=kn(n),a=n.decider;if(a.pending)a.answerPending(s.answers,"agent"),await new Promise(l=>setTimeout(l,30));else if(r.proposal)r.setFinal(s.answers);else return{error:"Nothing to answer: call ams_decide_step first"};return s.apply?{applied:r.apply("agent")}:{ok:!0}}},{name:"ams_decision_labels",description:"Decision labels recorded so far (lev training format); returns counts by source. export:true downloads them as JSONL; save:true writes them to training/decisions/labels/ (dev server).",inputSchema:ne({export:{type:"boolean"},save:{type:"boolean"}}),run:async s=>{kn(n);const r=n.decider.labels;s.export&&Se(n.decider.exportJSONL(),"ams-decisions.jsonl","application/jsonl");const a=s.save?await n.decider.saveToProject():void 0;return{count:r.length,saved:a,bySource:r.reduce((l,d)=>(l[d.meta?.source]=(l[d.meta?.source]||0)+1,l),{})}}},{name:"ams_walkthrough",description:'Walkthroughs (guided lessons and tours with the real controls): action "list", "start" {id}, or "stop".',inputSchema:ne({action:W("list | start | stop"),id:W("Walkthrough id")}),run:s=>s.action==="start"?(n.walkthroughs.start(s.id).catch(r=>n.log(r.message,"error")),{started:s.id}):s.action==="stop"?(n.walkthroughs.stop(),{ok:!0}):n.walkthroughs.list()},{name:"ams_brush",description:'Brushes are code: brush({ id, label, roles, doc, params: { key: [min, max, default, doc] }, draw(ctx, e, p, k) { … } }). k is the brush kit: k.frames(e) → [{ x, y, nx, ny, speed, pressure }], k.smoothPath, k.spans(poly, y), k.rotatePts, k.segment(ctx, x1, y1, x2, y2), k.beginInk(ctx, e, { width, opacity }) … ctx.restore(), k.tracePath, k.draw(id, ctx, e, params), k.rng(), k.noise(x, y). action "list"; "get" {id} returns the source (built-ins too: read them to learn); "save" {source, to: library | drawing} (checked by compiling; built-in ids are refused — fork under a new id); "delete" {id}; "use" {id} on the selection or the current tool.',inputSchema:ne({action:W("list | get | save | delete | use"),id:W("Brush id"),source:W("Brush code"),to:W("library (default) or drawing")},["action"]),run:s=>{if(s.action==="list")return Object.entries(Z).filter(([,r])=>!r.construction||r.custom).map(([r,a])=>({id:r,label:a.label,roles:a.roles,scope:Dn(r)?"built-in":a.scope||"drawing",doc:a.doc,params:a.params.map(l=>l.key)}));if(s.action==="get"){const r=Si(s.id);if(!r)throw new Error(`No brush "${s.id}"`);return{id:s.id,source:r}}if(s.action==="save"){const r=$i(s.source);return s.to==="drawing"?(ln(s.source,"doc"),n.store.change(`brush ${r.id}`,a=>{a.brushes=a.brushes||{},a.brushes[r.id]=s.source},{by:"agent"})):Ha(s.source),n.canvas.invalidate(),n.brushesPanel?.open(r.id),{saved:r.id,to:s.to==="drawing"?"drawing":"library",params:r.params.map(a=>a.key)}}if(s.action==="delete")return{deleted:Ua(s.id)};if(s.action==="use"){if(!Z[s.id])throw new Error(`No brush "${s.id}"`);const r=[...n.canvas.selected];return r.length?n.store.change("brush",a=>{for(const l of a.elements)r.includes(l.id)&&(l.realize={brush:s.id,params:{}})},{by:"agent"}):n.setDefaults(n.tool,{realize:{brush:s.id}}),{brush:s.id,applied:r.length||`defaults for ${n.tool}`}}throw new Error("Unknown action")}},{name:"ams_palette",description:`Palettes of named colors. action "list"; "get" {name}; "create" {name, colors: [{name, hex}] or ["burnt sienna", "#2e3a52", …]} — to make a palette that evokes something ("a winter storm over craggy shores"), choose the colors yourself and create it; "from_image" {asset (id) or the current reference, count, name} extracts one (k-means in Lab, named after pigments); "delete" {name}; "apply" {color (hex or name) or name+index} sets the selection's color. Names accept pigments (payne's gray, yellow ochre…) and CSS names.`,inputSchema:ne({action:W("list | get | create | from_image | delete | apply"),name:W("Palette name"),colors:{type:"array"},asset:W("Asset id for from_image (default: the reference)"),count:ae("Colors to extract (default 6)"),color:W("Color for apply: hex or a name"),index:ae("Color index in the palette for apply")},["action"]),run:async s=>{const r=Cs();if(s.action==="list")return Object.entries(r).map(([a,l])=>({name:a,colors:l.length}));if(s.action==="get"){if(!r[s.name])throw new Error(`No palette "${s.name}"`);return{name:s.name,colors:r[s.name]}}if(s.action==="create")return ls(s.name,s.colors||[]);if(s.action==="delete")return{deleted:Ur(s.name)};if(s.action==="from_image"){let a=n.reference?.img,l=n.reference?.title;if(s.asset){const c=await n.assetStore.get(s.asset);if(!c?.blob)throw new Error("Asset not found");a=new Image,a.src=URL.createObjectURL(c.blob),await a.decode(),l=c.title}if(!a)throw new Error("No reference: open an image (ams_assets {open}) or pass an asset id");const d=ai(a,Math.max(2,Math.min(16,s.count||6)));return ls(s.name||`From ${l}`.slice(0,48),d)}if(s.action==="apply"){const a=s.color?Qt(s.color):r[s.name]?.[s.index??0]?.hex;if(!a)throw new Error("Unknown color");const l=[...n.canvas.selected];return l.length?n.store.patchElements(l,{color:a},"color",{by:"agent"}):n.setDefaults(n.tool,{color:a}),{color:a,name:wt(a),applied:l.length||`defaults for ${n.tool}`}}throw new Error("Unknown action")}},{name:"ams_layout",description:"Control the workbench layout so actions can be seen: open {panels: [...]} (expands their docks), close {panels}, expand / collapse {docks: [left, right, bottom]}, reference {visible, opacity}, view {mode: picture | process}, fit, find {query} in Assets (shows the matching cards), get (current layout).",inputSchema:ne({open:{type:"array",items:{type:"string"}},close:{type:"array",items:{type:"string"}},expand:{type:"array",items:{type:"string"}},collapse:{type:"array",items:{type:"string"}},reference:{type:"object"},view:W("picture | process"),fit:{type:"boolean"},find:W("Search Assets for this")}),run:s=>n.setLayout(s)},{name:"ams_record",description:'Record what happens as a take (a timeline of drawing changes, narration and actions) to review later: action "start" {title}, "stop" (saves to Assets), "status". Agent activity is recorded automatically unless turned off (auto: false).',inputSchema:ne({action:W("start | stop | status"),title:W(""),auto:{type:"boolean"}},["action"]),run:async s=>{const r=n.recorder;if(s.auto!==void 0&&r.setSettings({autoAgents:s.auto}),s.action==="start")return r.start({title:s.title||void 0,source:"agent"}),{recording:!0};if(s.action==="stop"){const a=await r.stop();return a?{saved:a.title,clips:a.clips.length,seconds:Math.round(a.duration/1e3),asset:a.assetId}:{saved:null}}return{recording:r.recording,clips:r.take?.clips.length||0,auto:r.settings}}},{name:"ams_timeline",description:'Takes on the timeline: action "list" (takes in Assets), "open" {id}, "play", "pause", "seek" {ms}, "summary" (a short-form cut of the open take, saved), "walkthrough" (make a live walkthrough from it), "export" {format: html | project | video | json, rate}.',inputSchema:ne({action:W("list | open | play | pause | seek | summary | walkthrough | export"),id:W("Take asset id"),ms:ae("Time in ms"),format:W("html | project | video | json"),rate:ae("Video speed")},["action"]),run:async s=>{const r=n.player;if(s.action==="list")return(await n.assetStore.all()).filter(a=>a.kind==="take").map(a=>({id:a.id,title:a.title,seconds:Math.round((a.meta?.duration||0)/1e3),clips:a.meta?.clips}));if(s.action==="open")return await n.openTake(s.id),{open:r.take.title,seconds:Math.round(r.duration/1e3)};if(!r.take)throw new Error('No take open: ams_timeline {action: "open", id}');if(s.action==="play")return r.play(),{playing:!0};if(s.action==="pause")return r.pause(),{t:Math.round(r.t)};if(s.action==="seek")return r.seek(s.ms||0),{t:Math.round(r.t)};if(s.action==="summary"){const{summarize:a,duration:l}=await Ve(async()=>{const{summarize:c,duration:h}=await Promise.resolve().then(()=>Xc);return{summarize:c,duration:h}},void 0,import.meta.url),d=a(r.take);return d.duration=l(d),await n.recorder.saveTake(d,{title:d.title}),r.load(d),{title:d.title,seconds:Math.round(d.duration/1e3)}}if(s.action==="walkthrough"){const a=await n.walkthroughs.fromTake(r.take);return{walkthrough:a.id,steps:a.steps.length}}if(s.action==="export"){const a=await Ve(()=>Promise.resolve().then(()=>qs),void 0,import.meta.url);return s.format==="video"?(a.downloadVideo(r.take,{rate:s.rate||1,app:n}),{recording:!0}):(({html:a.downloadHTML,project:a.downloadProject,json:a.downloadJSON}[s.format||"html"]||a.downloadHTML)(r.take),{exported:s.format||"html"})}throw new Error("Unknown action")}},{name:"ams_undo",description:"Undo (or redo with redo:true).",inputSchema:ne({redo:{type:"boolean"}}),run:s=>({ok:s.redo?n.store.redo():n.store.undo()})}]}function kn(n){return n.decidePanel||n.docks.open("decide"),n.decidePanel}function qo(n){const e=n.decider?.pending;return e?{state:e.state,questions:Object.fromEntries(Object.entries(e.questions).map(([t,o])=>[t,{type:o.type,instructions:o.instructions,options:o.criteria}]))}:null}function kd(n){if(!Array.isArray(n)||!n.length)throw new Error("points must be a list like [[x, y], [x, y]]");if(n.every(e=>Array.isArray(e)&&Number.isFinite(Number(e[0]))&&Number.isFinite(Number(e[1]))))return n.map(e=>e.map(Number));if(n.every(e=>Number.isFinite(Number(e)))&&n.length%2===0){const e=[];for(let t=0;t<n.length;t+=2)e.push([Number(n[t]),Number(n[t+1])]);return e}throw new Error("points must be a list like [[x, y], [x, y]] (numbers in artboard units)")}function Ko(n,e,t,o,i){const s=fr(n.store.doc,e,{board:n.activeBoard||"main",seed:t,by:o});return s.doc&&(s.doc.title=i||n.store.doc.title,n.loadDocument(s.doc,"agent score")),s}function xd(n){const e=wd(n),t=Object.fromEntries(e.map(s=>[s.name,s])),o=()=>e.map(({name:s,description:r,inputSchema:a})=>({name:s,description:r,inputSchema:{...a,properties:{...a.properties||{},narrate:{type:"string",description:"Optional: one sentence shown to the user while this action plays"}}}}));n.sessions=n.sessions||new bd(n);const i=async(s,r={},{replay:a=!1}={})=>{const l=t[s];if(!l)throw new Error(`Unknown tool ${s}`);const{narrate:d,...c}=r||{},h=n.guide;n.emit("tool-call",s,c,{replay:a,summary:zn(s,c)});const u=!Cr.test(s)||c.open,f={...n.docks.state.active};if(u){const p=JSON.stringify(c,(m,b)=>typeof b=="string"&&b.length>60?b.slice(0,57)+"…":Array.isArray(b)&&b.length>4?`[${b.length}]`:b);n.log(`Agent → ${s.replace(/^ams_/,"")} ${p==="{}"?"":p}`,"agent"),a||n.sessions.record(s,r),n.sayAuto=!d,h?.say(d||zn(s,c),a?"Replay":"Agent"),n.sayAuto=!1;try{await md[s]?.(h,c,n)}catch{}}try{const p=await l.run(c);return u&&(s==="ams_run_score"||s==="ams_exercise"&&c.load)&&!p?.error&&await gd(h,n),p}catch(p){throw n.log(`Agent ${s} failed: ${p.message}`,"error"),p}finally{for(const[p,m]of Object.entries(f))m==="assistant"&&n.docks.state.active[p]!==m&&(n.docks.state.active[p]=m,n.docks.render())}};e.push({name:"ams_show",description:"Show something without changing it: move the guide cursor to a target (tool:<id>, panel:<id>, button:<id>, view:picture|process, stage:<name>, title, menu) and narrate.",inputSchema:ne({target:W(""),text:W("")}),run:async s=>(s.text&&n.guide.say(s.text,"Agent"),s.target&&await n.guide.moveTo(s.target),{ok:!0})},{name:"ams_sessions",description:'Recorded agent sessions (each starts from a baseline). action "replay" shows how a result was made, step by step with the guide; pace 0 instant, 0.5 fast, 1 normal, 2 slow.',inputSchema:ne({action:W("list | replay"),id:W("Session id (default: latest)"),pace:ae("")}),run:async s=>s.action==="replay"?(s.pace!==void 0&&(n.guide.pace=s.pace),n.sessions.replay(s.id,i)):n.sessions.list()});for(const s of e.slice(-2))t[s.name]=s;window.ams={listTools:o,callTool:i,app:n,diagnostics:s=>console.log(n.diagnostics?.(s))};try{navigator.modelContext?.provideContext?.({tools:e.map(s=>({name:s.name,description:s.description,inputSchema:s.inputSchema,execute:async r=>({content:[{type:"text",text:JSON.stringify(await i(s.name,r))}]})}))})}catch{}}const Ir=["rate","locked","hidden","hideLabel","hideBorder","perf","mask","codeMin","maskWith","fx","sourceFx","code","pseudo","text","follow","source","sourceOpacity","sourceFit","sourceBlend","kind"];function vd(n){return{...structuredClone(n),meta:{...n.meta||{},part:"scene"}}}function Go(n,e=H){const t=ie(n,e);if(!t)return null;const o=structuredClone(Be(n,t.id));return o.title=t.title,o.artboard={...o.artboard,title:t.title,...Object.fromEntries(Ir.filter(i=>t[i]!==void 0).map(i=>[i,t[i]]))},o.meta={...o.meta||{},part:"board"},o}function ss(n){return n?{...structuredClone(n),meta:{...n.meta||{},part:"selection"}}:null}const Md=n=>n?.meta?.part||((n?.boards||[]).length?"scene":"board"),Sd=n=>!!(n&&typeof n=="object"&&(n.type==="ams-process"||Array.isArray(n.stages)&&Array.isArray(n.elements)));function $d(n,e,{at:t=null}={}){const o=Me(structuredClone(e)),i=Md(e),s={kind:i,boards:[],elements:[]},r=new Map;for(const c of o.stages){let h=n.stages.find(u=>u.name===c.name);h||(h={...structuredClone(c),id:xe("stage")},n.stages.push(h)),r.set(c.id,h.id)}for(const c of["brushes","lines"]){n[c]=n[c]||{};for(const[h,u]of Object.entries(o[c]||{}))h in n[c]||(n[c][h]=u)}const a=new Map,l=(c,h,u,f)=>{const p=structuredClone(c);p.id=xe(c.role),p.stage=r.get(c.stage)||n.stages[0].id,p.group&&(a.has(p.group)||a.set(p.group,`group-${Math.random().toString(36).slice(2,8)}`),p.group=a.get(p.group)),p.points=p.points.map(([b,g,w,y])=>[b+h,g+u,w,y]),delete p.board;const m=na(f);m&&(p.board=m),n.elements.push(p),s.elements.push(p.id)};if(i==="selection"){const[c,h]=t||[en(n,0,0).x,0],u=o.artboard.width,f=o.artboard.height,p=mt(n,c+u/2,h+f/2)?.id||ve,m=`group-${Math.random().toString(36).slice(2,8)}`;n.groups=n.groups||{},n.groups[m]={name:o.title||"imported"};for(const b of o.elements)l({...b,group:void 0},c,h,p),n.elements.at(-1).group=m;return s}const d=i==="scene"?V(o).map(c=>({...c,doc:Be(o,c.id)})):[{...o.artboard,title:o.artboard.title||o.title,doc:o}];for(const c of d){const h=en(n,c.width,c.height),u=Nn(n);n.boards=n.boards||[],n.boards.push({id:u,title:c.title||"Imported",x:h.x,y:h.y,width:c.width,height:c.height,ground:c.ground||n.artboard.ground,...Object.fromEntries(Ir.filter(f=>c[f]!==void 0).map(f=>[f,c[f]]))});for(const f of c.doc.elements)l(f,h.x,h.y,u);s.boards.push(u)}return s}const Or="// ---- the studio's words it uses, in p5 ----",Pd=[["drawPoint","point"],["drawLine","line"],["drawPlane","plane"],["rectPoints","rect"],["circlePoints","circle"]],Ls=n=>String(n||"").includes(Or);function Jo(n){const e=String(n||"");if(!Ls(e))return null;const t=e.slice(0,e.indexOf(Or)),o=/function draw\(\)\s*\{\n([\s\S]*?)\n\}\s*$/.exec(t.trim());if(!o)return null;const i=/createCanvas\(\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(t),s=/^\s*background\('([^']+)'\);/m.exec(o[1])?.[1];let r=o[1].split(`
`).filter(a=>!/^\s*(background\(|randomSeed\(|sources\[[^\]]+\]\.setFrame\(|gifFrame\(|if \(!newFrame\(\)\)|ask\()/.test(a)).map(a=>a.replace(/^ {2}/,"")).join(`
`);for(const[a,l]of Pd)r=r.replace(new RegExp(`(?<![.\\w$])${a}\\s*\\(`,"g"),`${l}(`);return/Coordinates are in pixels/.test(t)&&(r=`units('artboard')
${r}`),{code:`${r.trim()}
`,width:i?Number(i[1]):null,height:i?Number(i[2]):null,ground:s||null}}function Ad(n){const e=/createCanvas\(\s*(\d+)\s*,\s*(\d+)/.exec(String(n||""));return e?{width:Number(e[1]),height:Number(e[2])}:null}function Td(n){const e=String(n||"").trim();if(/^\{[\s\S]*\}$/.test(e))try{const t=JSON.parse(e);if(t&&(t.type==="ams-process"||Array.isArray(t.stages)&&Array.isArray(t.elements)))return"json"}catch{}return/^(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(e)?"svg":/\bfunction\s+(setup|draw)\s*\(/.test(e)?"p5":/(?<![.\w$])(point|line|plane|walk|source|fit|stage|guide|brush)\s*\(/.test(e)&&/[;)\n]/.test(e)?"studio":"text"}const Ed=n=>n.replace(/^import[^;]*;\s*$/gm,"").replace(/^export\s+\{[^}]*\};?\s*$/gm,"").replace(/^export\s+(default\s+)?/gm,""),os=(n,e)=>`(() => {
${Ed(n).trim().split(`
`).map(t=>`  ${t}`.trimEnd()).join(`
`)}
  return { ${e.join(", ")} };
})()`,Ld=[["point","drawPoint"],["line","drawLine"],["plane","drawPlane"],["rect","rectPoints"],["circle","circlePoints"]];function Bd(n,{board:e,sources:t={},loop:o=!1,seed:i=1,version:s="2",rate:r=0}={}){const a=String(s)==="1";let l=String(n).replace(/\r/g,"");for(const[N,se]of Ld)l=l.replace(new RegExp(`(?<![.\\w$])${N}\\s*\\(`,"g"),`${se}(`);const d=/\bunits\(\s*['"]artboard['"]\s*\)/.test(l);l=l.replace(/^\s*units\([^)]*\)\s*;?\s*$/gm,"").replace(/^\s*artboard\([^)]*\)\s*;?\s*$/gm,"");const c=N=>new RegExp(`(?<![.\\w$])${N}\\s*\\(`).test(l),h=["board","decide","sculpt","guide","gesture"].filter(c);c("fx")&&h.push("fx"),/(?<![.\w$])mask\s*\(\s*\{/.test(l)&&h.push("mask"),/\.face\b|\.track\(\s*['"]face/.test(l)&&h.push("source.face");const u=[/\.pose\b/.test(l)&&"pose",/\.hands\b/.test(l)&&"hands",/\.mask\s*\(/.test(l)&&"mask"].filter(Boolean),f=Object.keys(Z).filter(N=>Z[N].texture&&new RegExp(`['"\`]${N}['"\`]`).test(l)),p=c("brush")||f.length>0,m=f.length>0||/\bk\.(paint|dabs|hairs|wash|bounds|hash|layer|grain)\b/.test(l),b=/\b(time|born)\s*:/.test(l),g=Object.keys(t).filter(N=>new RegExp(`(source|fit)\\(\\s*['"\`]${N}['"\`]`).test(l)),w=g.some(N=>t[N].kind!=="image"),y=l.trim().split(`
`).map(N=>`  ${N}`).join(`
`),S=d?"":" * width",k=d?"":" * height",v=[],T=new Set;c("drawPoint")&&T.add("drawPoint"),c("drawLine")&&T.add("drawLine").add("shape"),c("drawPlane")&&T.add("drawPlane").add("shape"),(c("source")||c("fit"))&&T.add("source"),c("fit")&&T.add("drawPlane").add("shape");const x="'#1d1b19'",L=N=>p?`
  if (o.brush && brushes[o.brush]) return useBrush(${N==="point"?"[[x, y]]":"pts"}, o, '${N}');`:"";T.has("drawPoint")&&v.push(`// A point: a dot of a size (in pixels) and a color.
function drawPoint(x, y, o = {}) {${L("point")}${b?`
  const a = fade(o);
  if (a <= 0.003) return;
  push();
  drawingContext.globalAlpha *= a;`:""}
  noStroke();
  fill(o.color || ${x});
  circle(x${S}, y${k}, o.size ?? 12);${b?`
  pop();`:""}
}`),T.has("drawLine")&&v.push(`// A line through a list of points: smooth unless its path is 'straight'.
function drawLine(pts, o = {}) {${L("line")}${b?`
  const a = fade(o);
  if (a <= 0.003) return;
  pts = drawn(o, pts);
  push();
  drawingContext.globalAlpha *= a;`:""}
  noFill();
  stroke(o.color || ${x});
  strokeWeight(o.width ?? 3);
  shape(pts, o.path !== 'straight', o.closed);${b?`
  pop();`:""}
}`),T.has("drawPlane")&&v.push(`// A plane: a filled, closed shape.
function drawPlane(pts, o = {}) {${L("plane")}${b?`
  const a = fade(o);
  if (a <= 0.003) return;
  push();
  drawingContext.globalAlpha *= a;`:""}
  noStroke();
  fill(o.color || ${x});
  shape(pts, o.path !== 'straight', true);${b?`
  pop();`:""}
}`),T.has("shape")&&v.push(a?`function shape(pts, smooth, closed) {
  beginShape();
  if (!smooth) for (const [x, y] of pts) vertex(x${S}, y${k});
  else {
    // curveVertex needs a control point before the first and after the last (closed: wrap around).
    const seq = closed ? [pts.at(-1), ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts.at(-1)];
    for (const [x, y] of seq) curveVertex(x${S}, y${k});
  }
  if (closed && !smooth) endShape(CLOSE); else endShape();
}`:`function shape(pts, smooth, closed) {
  beginShape();
  for (const [x, y] of pts) {
    if (smooth) splineVertex(x${S}, y${k});
    else vertex(x${S}, y${k});
  }
  if (closed) endShape(CLOSE); else endShape();
}`),c("rectPoints")&&v.push(`function rectPoints(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}`),c("circlePoints")&&v.push(`function circlePoints(cx, cy, r, n = 48) {
  const ry = r${d?"":" * width / height"};
  return range(n).map(i => [cx + cos(i / n * TAU) * r, cy + sin(i / n * TAU) * ry]);
}`),c("walk")&&v.push(`// A walk: steps of a length, turning (in degrees) as it goes.
function walk({ from = [0, 0], heading = 0, steps = 50, step = ${d?10:.01}, turn = () => 0 } = {}) {
  const pts = [from.slice()];
  let [x, y] = from, h = heading;
  for (let i = 0; i < steps; i++) {
    h += turn(i, i / max(1, steps - 1)) || 0;
    x += cos(radians(h)) * step;
    y += sin(radians(h)) * step${d?"":" * width / height"};
    pts.push([x, y]);
  }
  return pts;
}`),c("fit")&&v.push(`// fit(): greedy shape fitting (the studio's, simplified): each shape is the best of many random tries,
// the one that brings the picture closest to the source. live: true keeps the shapes from one frame
// to the next and replaces the oldest few (the continuous redraw).
function fit(src, o = {}) {
  const s = typeof src === 'string' ? source(src) : src;
  const n = o.shapes ?? 80, tries = o.tries ?? 40, turnover = max(1, round(n * (o.turnover ?? 0.08)));
  const W = 64, H = max(8, round(64 * height / width));
  const target = s.pixels(W, H), memo = state('fit' + (o.key || ''));
  const cells = sh => {
    const out = [];
    if (sh.kind === 'rect') { for (let y = sh.y0; y < sh.y1; y++) for (let x = sh.x0; x < sh.x1; x++) out.push(y * W + x); }
    else for (let y = max(0, ceil(sh.cy - sh.r)); y <= min(H - 1, sh.cy + sh.r); y++)
      for (let x = max(0, ceil(sh.cx - sh.r)); x <= min(W - 1, sh.cx + sh.r); x++)
        if ((x - sh.cx) ** 2 + (y - sh.cy) ** 2 <= sh.r ** 2) out.push(y * W + x);
    return out;
  };
  const colorOf = cs => [0, 1, 2].map(k => { let t = 0; for (const j of cs) t += target[j * 3 + k]; return t / max(1, cs.length); });
  const gain = (img, cs, c) => { let g = 0; for (const j of cs) for (const k of [0, 1, 2]) { const t = target[j * 3 + k]; g += (img[j * 3 + k] - t) ** 2 - (c[k] - t) ** 2; } return g; };
  const paint = (img, cs, c) => { for (const j of cs) for (const k of [0, 1, 2]) img[j * 3 + k] = c[k]; };
  const tryShape = () => {
    const size = 2 + Math.random() * W / 3;
    if (Math.random() < 0.5) {
      const x0 = floor(Math.random() * W), y0 = floor(Math.random() * H);
      return { kind: 'rect', x0, y0, x1: min(W, x0 + 1 + floor(Math.random() * size)), y1: min(H, y0 + 1 + floor(Math.random() * size)) };
    }
    return { kind: 'circle', cx: Math.random() * W, cy: Math.random() * H, r: 1 + Math.random() * size / 2 };
  };
  const ground = colorOf(range(W * H));
  const img = new Float32Array(W * H * 3).map((_, i) => ground[i % 3]);
  memo.shapes = o.live ? (memo.shapes || []).slice((memo.shapes || []).length >= n ? turnover : 0) : [];
  for (const sh of memo.shapes) { const cs = cells(sh); sh.color = colorOf(cs); paint(img, cs, sh.color); }
  while (memo.shapes.length < n) {
    let best = null;
    for (let i = 0; i < tries; i++) {
      const sh = tryShape(), cs = cells(sh);
      if (!cs.length) continue;
      const c = colorOf(cs), g = gain(img, cs, c);
      if (!best || g > best.g) best = { sh, cs, c, g };
    }
    if (!best || best.g <= 0) break;
    best.sh.color = best.c; paint(img, best.cs, best.c); memo.shapes.push(best.sh);
  }
  const hexOf = c => '#' + c.map(v => hex(round(v), 2)).join('');
  const at = (x, y) => [x / W${d?" * width":""}, y / H${d?" * height":""}];
  if (o.ground !== false) drawPlane([at(0, 0), at(W, 0), at(W, H), at(0, H)], { color: hexOf(ground), path: 'straight' });
  for (const sh of memo.shapes) {
    if (sh.kind === 'rect') drawPlane([at(sh.x0, sh.y0), at(sh.x1, sh.y0), at(sh.x1, sh.y1), at(sh.x0, sh.y1)], { color: hexOf(sh.color), path: 'straight' });
    else drawPlane(range(12).map(i => at(sh.cx + sh.r * cos(i / 12 * TAU), sh.cy + sh.r * sin(i / 12 * TAU))), { color: hexOf(sh.color) });
  }
  return memo.shapes.length;
}`),(c("state")||c("fit"))&&v.push(`// state(name): an object kept from one draw() to the next (for processes that carry on).
const states = {};
function state(name = '') {
  return states[name] ??= {};
}`),(/(?<![.\w$])range\s*\(/.test(l)||v.some(N=>N.includes("range(")))&&v.push(`function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}`),c("fx")&&v.push(`// Post effects are studio-side.
function fx() {}`),c("mask")&&v.push(`// A board's mask (crop its marks to the board): a p5 canvas crops at its edge already.
function mask() {}`),c("underlay")&&v.push(`// The studio shows a source under a board; in p5 the picture is the source itself (loadImage), so nothing to do.
function underlay() {}`),c("stage")&&v.push(`// Stages order the work in the studio; here the code runs top to bottom.
function stage() {}`),c("note")&&v.push(`// A note: text from its top-left corner, wrapped to its width (in pixels).
function note(x, y, words, o = {}) {
  const n = o.note || {};
  noStroke();
  fill(o.color || ${x});
  textSize(n.size ?? 16);
  textFont(n.font === 'mono' ? 'monospace' : n.font === 'serif' ? 'serif' : 'sans-serif');
  textAlign(LEFT, TOP);
  text(words, x${S}, y${k}, n.width ?? 280);
}`);const A=g.filter(N=>t[N].kind==="image");T.has("source")&&v.push(`${A.length?`const pixelsOf = {};   // the pictures' pixels, once

`:""}// A source, sampled where you ask: the picture covers the canvas (cropped), or with { fit: 'contain' } all of it shows.
// x, y are ${d?"pixels":"fractions of the canvas"}.
function source(name, o = {}) {
  const img = sources[name];
  ${A.length?`// A picture is read once (a browser can take a canvas's contents away: a read that comes back empty is not kept).
  let px;
  if (${JSON.stringify(A)}.includes(name) && pixelsOf[name]) px = pixelsOf[name];
  else {
    img.loadPixels();
    px = img.pixels;
    if (${JSON.stringify(A)}.includes(name)) { for (let i = 0; i < px.length; i += 61) if (px[i]) { pixelsOf[name] = px = Uint8ClampedArray.from(px); break; } }
  }`:`img.loadPixels();
  const px = img.pixels;`}
  const iw = img.width, ih = img.height;
  const k = (o.fit === 'contain' ? min : max)(width / iw, height / ih), ox = (width - iw * k) / 2, oy = (height - ih * k) / 2;
  const rgb = (x, y) => {
    const u = floor((x${S} - ox) / k), v = floor((y${k} - oy) / k);
    if (u < 0 || v < 0 || u >= iw || v >= ih) return [0, 0, 0];   // outside the picture (fit: 'contain')
    const i = 4 * (v * iw + u);
    return [px[i], px[i + 1], px[i + 2]];
  };
  return {
    frame: ${A.length?`${JSON.stringify(A)}.includes(name) ? 1 : (globalThis.frameCount ?? 0)`:"(globalThis.frameCount ?? 0)"},   // changes when the picture does
    rgb,
    color: (x, y) => '#' + rgb(x, y).map(c => hex(c, 2)).join(''),
    value: (x, y) => { const [r, g, b] = rgb(x, y); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; },
    // the picture as a w×h grid of r, g, b (as the canvas sees it)
    pixels: (w, h) => {
      const out = new Float32Array(w * h * 3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(rgb((x + 0.5) / w${d?" * width":""}, (y + 0.5) / h${d?" * height":""}), (y * w + x) * 3);
      return out;
    }${p?`,
    // in pixels (brushes work in pixels)
    colorAt: (x, y) => '#' + rgb(x${d?"":" / width"}, y${d?"":" / height"}).map(c => hex(c, 2)).join(''),
    valueAt: (x, y) => { const [r, g, b] = rgb(x${d?"":" / width"}, y${d?"":" / height"}); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }`:""}${u.includes("pose")?`,
    // ml5.js answers in the picture's pixels; here, as in the studio, fractions of the canvas
    pose: (found[name].pose || []).map(p => p.keypoints.map(q => ({ x: (ox + q.x * k) / width, y: (oy + q.y * k) / height, v: q.confidence }))) `:""}${u.includes("hands")?`,
    hands: (found[name].hands || []).map(h => h.keypoints.map(q => ({ x: (ox + q.x * k) / width, y: (oy + q.y * k) / height })))`:""}${u.includes("mask")?`,
    mask: (x, y) => {
      const m = found[name].mask;
      if (!m) return 0;
      if (m.readAt !== frameCount) { m.loadPixels(); m.readAt = frameCount; }
      const u = constrain(floor((x${S} - ox) / k * m.width / iw), 0, m.width - 1);
      const v = constrain(floor((y${k} - oy) / k * m.height / ih), 0, m.height - 1);
      return m.pixels[4 * (v * m.width + u) + 3] / 255;   // the person is opaque
    }`:""}
  };
}`),u.length&&v.push(`// Ask a model about a source's current picture; the answer arrives a moment later (then it redraws).
const asking = {};
function ask(model, name, kind) {
  if (asking[name + kind]) return;
  asking[name + kind] = true;
  model.detect(sources[name], r => {
    found[name][kind] = kind === 'mask' ? r.mask : r;
    asking[name + kind] = false;${o?"":`
    redraw();`}
  });
}`),b&&v.push(`// A mark's time envelope (the studio's envelope.js): time: { in, hold, out, life, draw, curve }, born in milliseconds.
const { envelope: lifeAlpha, reveal: lifeReveal, expired: lifeExpired, cutPath: lifeCut } = ${os(br,["envelope","reveal","expired","cutPath"])};

function ageOf(o) {
  return (Date.now() - (o.born ?? Date.now())) / 1000;
}

// How visible a mark is now (0 when its life is over).
function fade(o) {
  if (!o.time) return 1;
  const age = ageOf(o);
  return lifeExpired(o.time, age) ? 0 : lifeAlpha(o.time, age);
}

// The part of a line drawn so far (a line that draws itself on), cut by its length as the canvas shows it.
function drawn(o, pts) {
  if (!o.time) return pts;
  const share = lifeReveal(o.time, ageOf(o));
  if (share >= 1) return pts;
  const ry = ${d?"1":"height / width"};
  return lifeCut(pts.map(q => [q[0], q[1] * ry, ...q.slice(2)]), share).map(q => [q[0], q[1] / ry, ...q.slice(2)]);
}

// A clip that shows the first part of a stroke (in pixels): a strip along its path, as wide as the brush can be.
function revealClip(ctx, points, share, half) {
  const cut = lifeCut(points, share), n = cut.length;
  ctx.beginPath();
  if (n < 2) { ctx.rect(0, 0, 0, 0); ctx.clip(); return; }
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = cut[Math.max(0, i - 1)], b = cut[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let x = cut[i][0], y = cut[i][1];
    if (i === n - 1) { x += dx * half * 0.4; y += dy * half * 0.4; }
    left.push([x - dy * half, y + dx * half]); right.push([x + dy * half, y - dx * half]);
  }
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.clip();
}`),p&&v.push(`// Brushes from the studio: each draws one mark with the canvas's 2D context (p5's drawingContext).
const brushes = {};
function brush(def) {
  def.texture ??= /\\.paint\\(/.test(String(def.draw));   // a textured brush keeps a layer per mark: drawing on is a clip, not a new layer
  brushes[def.id] = def;
}

// The studio's walk: a path resampled (Catmull-Rom), and at each step its place, normal, speed and pressure.
const { smoothPath: walkSmooth, walkFrames } = ${os(yr,["smoothPath","walkFrames"])};
${m?`
// The studio's layer kit: a mark painted into a layer, the paper's grain multiplied in, tinted and put on the picture.
const { txPaint, txDabs, txHairs, txWash, txBounds, txHash, txLayer, txGrain } = ${os(wr,["txPaint","txDabs","txHairs","txWash","txBounds","txHash","txLayer","txGrain"])};
`:""}
// A seeded random for a mark (the same mark, the same marks).
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A mark for a brush: points [x, y, time, pressure] in pixels, its color and whether it is closed.
function useBrush(pts, o, role) {
  const def = brushes[o.brush], p = {};
  for (const [key, v] of Object.entries(def.params || {})) p[key] = o[key] ?? (Array.isArray(v) ? v[2] : v.default);
  const pressure = i => (typeof o.pressures === 'function' ? o.pressures(i / max(1, pts.length - 1), i) : 0.5);${b?`
  const a = fade(o);
  if (a <= 0.003) return;`:""}
  let seed = o.seed;
  if (seed == null) { seed = 7; for (const q of pts) seed = (seed * 31 + round(q[0] * 1000) + round(q[1] * 1000) * 7) | 0; seed >>>= 0; }
  const full = pts.map(([x, y], i) => [x, y, i * 16, pressure(i)]);${b?`
  const share = o.time ? lifeReveal(o.time, ageOf(o)) : 1;
  const clipped = share < 1 && def.texture && p.width > 0 && role === 'line';
  const shown = clipped ? full : drawn(o, full);`:`
  const shown = full;`}
  const e = { role, color: o.color || kit.INK, closed: role === 'plane' || Boolean(o.closed), seed,
    points: shown.map(([x, y, t, q]) => [x${S}, y${k}, t, q]) };
  const k = Object.create(kit);
  k.rng = seeded(seed);
  k.scale = 1;
  k.age = ${b?"ageOf(o)":"0"};
  push();${b?`
  drawingContext.globalAlpha *= a;
  if (clipped) revealClip(drawingContext, e.points, share, p.width * 0.8);`:""}
  def.draw(drawingContext, e, p, k);
  pop();
}

// The studio's brush kit.
const kit = {
  INK: ${x},
  rng: () => random(),
  noise: (x, y = 0) => noise(x, y) * 2 - 1,
  smoothPath: walkSmooth,
  // Along the mark: each step's place, its normal (nx, ny), speed and pressure.
  frames: walkFrames,
  tracePath(ctx, pts, closed) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (closed) ctx.closePath();
  },
  segment(ctx, x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  },
  beginInk(ctx, e, p) {
    ctx.save();
    ctx.globalAlpha *= p.opacity ?? 1;
    ctx.strokeStyle = ctx.fillStyle = e.color || kit.INK;
    ctx.lineWidth = p.width ?? 3;
    ctx.lineCap = ctx.lineJoin = 'round';
  },
  // Another brush, or a dot.
  draw(id, ctx, e, p = {}) {
    const d = brushes[id];
    if (d) return d.draw(ctx, e, p, kit);
    ctx.save();
    ctx.globalAlpha *= p.opacity ?? 1;
    ctx.fillStyle = e.color || kit.INK;
    ctx.beginPath();
    ctx.arc(e.points[0][0], e.points[0][1], (p.size ?? 8) / 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }${m?`,
  // Textured painting: paint a mark through a layer (cached), stamp a tip along a walk, hairs, a wash.
  paint(ctx, spec) { return txPaint(ctx, { scale: this.scale ?? 1, ...spec }); },
  dabs: txDabs, hairs: txHairs, wash: txWash, bounds: txBounds, hash: txHash, layer: txLayer, grain: txGrain`:""}${T.has("source")?`,
  source: name => source(name)`:""}
};${f.length?`

// The studio's own brushes this code asks for, as they are.
${f.map(N=>Si(N)).join(`
`)}`:""}`);const P=g.map(N=>t[N]),$=JSON.stringify,E={pose:["bodyPose","ml5.bodyPose('BlazePose')","33 points per person, as in the studio"],hands:["handPose","ml5.handPose()","21 points per hand"],mask:["bodySegmentation","ml5.bodySegmentation('SelfieSegmentation', { maskType: 'person' })","where a person is"]},I=u.map(N=>`${E[N][0]} = ${a?"":"await "}${E[N][1]};   // ${E[N][2]}`),R=(N,se)=>{const de=[...l.matchAll(new RegExp(`(\\w+)\\s*=\\s*source\\(\\s*['"\`]${se}['"\`]\\s*\\)`,"g"))].map(qe=>qe[1]);return[`source\\(\\s*['"\`]${se}['"\`]\\s*\\)`,...de].some(qe=>new RegExp(`${qe}\\.${N==="mask"?"mask\\s*\\(":`${N}\\b`}`).test(l))},j=N=>{const se=g.filter(de=>R(N,de));return se.length?se:g},G=u.flatMap(N=>j(N).filter(se=>t[se].kind==="video"||t[se].kind==="camera").map(se=>`  ${E[N][0]}.detectStart(sources[${$(se)}], r => { found[${$(se)}].${N} = ${N==="mask"?"r.mask":"r"}; });`)),D=u.flatMap(N=>j(N).filter(se=>t[se].kind==="image"||t[se].kind==="animated").map(se=>`  ask(${E[N][0]}, ${$(se)}, '${N}');`)),O=g.filter(N=>t[N].kind==="image"||t[N].kind==="animated").map(N=>`sources[${$(N)}] = ${a?"":"await "}loadImage(${$(t[N].file)});`),K=[...g.filter(N=>t[N].kind==="video").map(N=>`  sources[${$(N)}] = createVideo(${$(t[N].file)});
  sources[${$(N)}].hide();
  sources[${$(N)}].volume(0);
  sources[${$(N)}].loop();`),...g.filter(N=>t[N].kind==="camera").map(N=>`  sources[${$(N)}] = createCapture(VIDEO);
  sources[${$(N)}].hide();`)],ee=[...O,...I],B=[g.length&&"let sources = {};",u.length&&`let ${u.map(N=>E[N][0]).join(", ")};`,u.length&&`let found = { ${g.map(N=>`${$(N)}: {}`).join(", ")} };   // the models' latest answers, per source`].filter(Boolean).join(`
`),C=B?`${B}
${a&&ee.length?`
function preload() {
${ee.map(N=>`  ${N}`).join(`
`)}
}
`:""}`:"",z=[...a?[]:ee.map(N=>`  ${N}`),...K,...G],U=g.filter(N=>t[N].kind==="animated"),J=o&&(w||r>0),Y=J&&!r&&U.length&&g.every(N=>t[N].kind==="animated"||t[N].kind==="image"),oe=Y?[]:U.map(N=>`  gifFrame(sources[${JSON.stringify(N)}]);   // the GIF's frame now`),re=Y?`  if (!newFrame()) return;   // nothing new: keep the picture
`:"";return U.length&&v.push(`// A GIF at its own timing (each frame's delay): shows the frame for now; true if it changed.
function gifFrame(img) {
  const f = img.gifProperties && img.gifProperties.frames;
  if (!f) return false;
  const delay = x => x.delay || 100;
  let t = millis() % f.reduce((sum, x) => sum + delay(x), 0), i = 0;
  while (i < f.length - 1 && t >= delay(f[i])) { t -= delay(f[i]); i++; }
  if (img.getCurrentFrame() === i && frameCount > 1) return false;
  img.setFrame(i);
  return true;
}`),Y&&v.push(`// Whether any GIF shows a new frame (the first frame always draws).
function newFrame() {
  return [${U.map(N=>JSON.stringify(N)).join(", ")}].map(n => gifFrame(sources[n])).some(Boolean) || frameCount === 1;
}`),`${[`// ${e?.title||"A board"}: its code from Artist Model Studio, as a p5.js sketch.`,d?"// Coordinates are in pixels.":"// Coordinates are fractions of the canvas (0..1), as in the studio.",...h.length?[`// Not in this sketch: ${h.map(N=>N.includes(".")?N:`${N}()`).join(", ")} (studio only; see the note at the end).`]:[],...P.some(N=>N.file)?[`// Needs ${P.filter(N=>N.file).map(N=>N.file).join(", ")} next to it.`]:[]].join(`
`)}
${C?`
${C}`:""}
${a||!ee.length?"":"async "}function setup() {
  createCanvas(${Math.round(e?.width||800)}, ${Math.round(e?.height||600)});
${z.join(`
`)}${z.length?`
`:""}  ${J?`frameRate(${r>0?Math.round(r):30});`:"noLoop();"}
}

function draw() {
${re}  background('${e?.ground&&e.ground!=="transparent"?e.ground:"#f3efe6"}');
  randomSeed(${r>0?"frameCount":i});
${[...oe,...D].join(`
`)}${oe.length||D.length?`
`:""}${y}
}

// ---- the studio's words it uses, in p5 ----

${v.join(`

`)}
${h.length?`
// ${h.map(N=>N.includes(".")?N:`${N}()`).join(", ")}: run the board in the studio for these.
`:""}`}const Cd=n=>/\bml5\./.test(n);function Id(n,e="2",{ml5:t=!1}={}){const o=String(e)==="1"?"1":"2";return`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${String(n).replace(/</g,"&lt;")}</title>
  <script src="https://cdn.jsdelivr.net/npm/p5@${o}/lib/p5.min.js"><\/script>${t?`
  <script src="https://cdn.jsdelivr.net/npm/ml5@1/dist/ml5.min.js"><\/script>`:""}
  <style>body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: #1b1c1f; }</style>
</head>
<body>
  <script src="sketch.js"><\/script>
</body>
</html>
`}const is=n=>JSON.stringify(n);function zr({target:n="",loop:e=!0,items:t=[]}){const o=i=>{const{kind:s,ref:r,...a}=i;return`    { ${[`${s}: ${is(r)}`,...Object.entries(a).filter(([,d])=>d!==void 0&&d!==""&&d!==null).map(([d,c])=>`${d}: ${is(c)}`)].join(", ")} }`};return`// A playlist: it plays these in order on its target board (see the docs: Playlists).
playlist({
  target: ${is(n)},
  loop: ${e},
  items: [
${t.map(o).join(`,
`)}${t.length?`
`:""}  ]
})
`}zr({target:"",loop:!0,items:[]});const Vo="ams_guide_pace",Od='<svg viewBox="0 0 28 34" width="22" height="27"><path d="M2 2v25l7-7 5 12 5-2-5-12h10L2 2z" fill="var(--wb-guide-fill)" stroke="var(--wb-guide-stroke)" stroke-width="1.6" stroke-linejoin="round"/></svg>';class zd{constructor(e){this.app=e,this.enabled=!0;try{this.pace=Number(localStorage.getItem(Vo)??1)}catch{this.pace=1}window.matchMedia?.("(prefers-reduced-motion: reduce)").matches&&(this.pace=0),this.cursor=M("div",{class:"wb-guide-cursor",html:Od}),this.halo=M("div",{class:"wb-guide-halo"}),this.text=M("div",{class:"wb-guide-text"}),this.meta=M("div",{class:"wb-guide-meta"}),this.card=M("div",{class:"wb-guide-card",hidden:!0},M("div",{class:"wb-guide-head"},M("span",{class:"wb-guide-dot"}),this.meta,this.paceSel=M("select",{class:"wb-guide-pace",title:"Pace"},...[["0","Instant"],["0.5","Fast"],["1","Normal"],["2","Slow"]].map(([t,o])=>M("option",{value:t,selected:Number(t)===this.pace},o))),M("button",{class:"wb-icon-btn",title:"Hide until the next action",onclick:()=>{this.card.hidden=!0}},"×")),this.text,this.controls=M("div",{class:"wb-guide-controls",hidden:!0})),this.paceSel.addEventListener("change",()=>{this.pace=Number(this.paceSel.value);try{localStorage.setItem(Vo,String(this.pace))}catch{}}),this.layer=M("div",{class:"wb-guide-layer"},this.halo,this.cursor),document.body.append(this.layer,this.card),this.pos={x:window.innerWidth/2,y:window.innerHeight-80},this.place(this.pos.x,this.pos.y),this.cursor.style.opacity="0",this.dragCard(),this.hideTimer=0}get active(){return this.enabled&&this.pace>0}wait(e){return new Promise(t=>setTimeout(t,e*this.pace))}place(e,t){this.pos={x:e,y:t},this.cursor.style.transform=`translate(${e-3}px, ${t-2}px)`}rect(e){if(!e)return null;if(e.x!==void 0&&e.y!==void 0)return{left:e.x,top:e.y,width:0,height:0};const[t,o]=String(e).split(":");let i=document.querySelector(`[data-guide="${CSS.escape(String(e))}"]`);if(!i&&t==="view"&&(i=document.querySelector('[data-guide="view"]')),!i&&t==="panel"){this.app.docks.open(o);const r=this.app.docks.aliases?.[o]?.[0]||o;i=document.querySelector(`[data-guide="tab:${CSS.escape(r)}"]`)||document.querySelector(`[data-panel="${CSS.escape(r)}"]`)}if(!i)return null;const s=i.getBoundingClientRect();return s.width||s.height?s:null}async moveTo(e,{click:t=!0}={}){if(!this.active)return;const o=this.rect(e);if(!o)return;const i=o.left+o.width/2,s=o.top+o.height/2;this.cursor.style.opacity="1";const r=this.pos.x,a=this.pos.y,l=Math.hypot(i-r,s-a),d=Math.min(900,250+l*.6)*this.pace,c=performance.now();await new Promise(h=>{const u=f=>{const p=Math.min(1,(f-c)/Math.max(1,d)),m=p<.5?2*p*p:1-(-2*p+2)**2/2;this.place(r+(i-r)*m,a+(s-a)*m),p<1?requestAnimationFrame(u):h()};requestAnimationFrame(u)}),t&&await this.click()}async click(){this.active&&(this.halo.style.transform=`translate(${this.pos.x-14}px, ${this.pos.y-14}px)`,this.halo.classList.remove("on"),this.halo.offsetWidth,this.halo.classList.add("on"),await this.wait(260))}async trace(e,t){const o=this.app.canvas;if(!this.active||!e?.length){t?.(e.length);return}const i=o.canvas.getBoundingClientRect(),s=([l,d])=>[i.left+l*o.cam.z+o.cam.x,i.top+d*o.cam.z+o.cam.y];await this.moveTo({x:s(e[0])[0],y:s(e[0])[1]},{click:!1});const r=Math.min(1600,300+e.length*12)*this.pace,a=performance.now();await new Promise(l=>{const d=c=>{const h=Math.min(1,(c-a)/Math.max(1,r)),u=Math.max(1,Math.round(h*e.length)),[f,p]=s(e[u-1]);this.place(f,p),t?.(u),h<1?requestAnimationFrame(d):l()};requestAnimationFrame(d)})}say(e,t="Agent",{sticky:o=this.sticky}={}){e&&this.app.emit("say",e,this.label||t),!(!this.enabled||!e)&&(this.text.textContent=e,this.meta.textContent=this.label||t,this.card.hidden=!1,clearTimeout(this.hideTimer),o||(this.hideTimer=setTimeout(()=>{this.card.hidden=!0,this.cursor.style.opacity="0"},9e3)))}setControls(e){this.sticky=!!e,this.controls.hidden=!e,this.controls.replaceChildren(...e||[]),e||(clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.card.hidden=!0,this.cursor.style.opacity="0"},4e3))}dragCard(){this.card.firstChild.addEventListener("pointerdown",t=>{if(t.target.closest("select, button"))return;const o=this.card.getBoundingClientRect(),i=t.clientX-o.left,s=t.clientY-o.top,r=l=>{Object.assign(this.card.style,{left:`${l.clientX-i}px`,top:`${l.clientY-s}px`,bottom:"auto",transform:"none"})},a=()=>{window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",a)};window.addEventListener("pointermove",r),window.addEventListener("pointerup",a)})}}const ut="ams_process_doc_v1",Yo="ams_tool_defaults_v1",Xo=[["select","Select and move","V"],["hand","Pan","H"],["laser","Laser pointer: a trail in the stroke color that fades out and leaves no mark","K"],["board","Board: drag out a new artboard (Shift keeps it square)",";"],null,["point","Point: a mark at a place (dimension 0)","0"],["line","Line: a point that moved (dimension 1)","1"],["plane","Plane: an enclosed area (dimension 2)","2"],null],je=[["select","Select and move","V"],["direct","Direct: edit points (click a mark, drag its points; double-click a segment adds one; Ctrl snaps)","⇧V"]],Tt=[["line","Line: a point that moved (dimension 1)","1"],["gesture","Gesture: the movement behind a form (construction: process view only)","⇧1"],["guide","Guide: construction, straight; Shift snaps the angle (process view only)","⇧1"]],Et=[["plane","Plane: an enclosed area (dimension 2)","2"],["circle","Circle: drag a box, an ellipse in it (Shift: a circle, Alt: from the center). Smooth is round; straight is a polygon","⇧2"],["rect","Rectangle: drag a box (Shift: a square, Alt: from the center)","⇧2"]],Nd={line:"line",plane:"plane",circle:"plane",gesture:"gesture",guide:"guide",brush:"brush"},Rd=["note","Note: a written annotation","T"],Zo="ams_brush_active",Qo="ams_shapes_v1",rs={circle:{sides:12},rect:{round:0}},ei="ams_sculpt_v1";class Dd{constructor(e,t={}){this.root=e,this.embed=t.embed||null,this.persist=!this.embed||!!this.embed.persist,this.handlers=new Map,this.logLines=[];let o=null;if(this.persist)try{o=JSON.parse(localStorage.getItem(ut)||"null")}catch{}if(!o&&this.embed&&(o=this.embed.document?Me(this.embed.document):Xe()),!o){const i=tt(an[1].source,{seed:1,by:{kind:"example",name:"exercise"}}).doc;i&&(i.title=an[1].title),o=i||Xe()}this.store=new Xa(o),this.tool="select",this.view={mode:"process",upTo:1/0},this.activeStageId=this.store.doc.stages[this.store.doc.stages.length-1]?.id;try{this.toolDefaults=JSON.parse(localStorage.getItem(Yo)||"{}")}catch{this.toolDefaults={}}try{this.lazy={radius:0,smoothing:0,...JSON.parse(localStorage.getItem("ams_lazy")||"{}")}}catch{this.lazy={radius:0,smoothing:0}}this.shapes=structuredClone(rs);try{const i=JSON.parse(localStorage.getItem(Qo)||"{}");for(const s of Object.keys(rs))Object.assign(this.shapes[s],i[s])}catch{}try{this.sculpt={tool:"push",radius:40,strength:.5,params:{},...JSON.parse(localStorage.getItem(ei)||"{}")}}catch{this.sculpt={tool:"push",radius:40,strength:.5,params:{}}}pa();try{this.brush={id:"ink",params:{},...JSON.parse(localStorage.getItem(Zo)||"{}")}}catch{this.brush={id:"ink",params:{}}}$e[this.sculpt.tool]||(this.sculpt.tool="push"),this.sculpt.params.simplify?.density<1&&delete this.sculpt.params.simplify.density;try{this.paint={stroke:null,fill:null,...JSON.parse(localStorage.getItem("ams_paint")||"{}")}}catch{this.paint={stroke:null,fill:null}}this.reference=null,this.assetStore=new Lc,window.addEventListener("pagehide",()=>{this.saveTimer&&(clearTimeout(this.saveTimer),this.saveTimer=0,this.saveDoc()),this.persistTimer&&(clearTimeout(this.persistTimer),this.persistTimer=0,this.scenes?.persist().catch(()=>{}))}),this.sources=new nr(this),this.composer=new ad(this),this.gestures=new sr(this),this.playlists=new or(this),this.artists=new Hs,this.store.subscribe((i,s)=>{this.persist&&!this.saveTimer&&(this.saveTimer=setTimeout(()=>{this.saveTimer=0,this.saveDoc()},s==="live board code"?3e3:300)),this.persist&&!this.persistTimer&&this.scenes&&s!=="scene"&&(this.persistTimer=setTimeout(()=>{this.persistTimer=0,this.scenes.persist().catch(()=>{})},s==="live board code"?5e3:1500)),s!=="live board code"&&(this.perfTick?.(),this.store.doc.stages.some(r=>r.id===this.activeStageId)||(this.activeStageId=this.store.doc.stages[0]?.id),this.emit("document",s),this.renderChrome())},{live:!0})}on(e,t){(this.handlers.get(e)||this.handlers.set(e,new Set).get(e)).add(t)}emit(e,...t){for(const o of this.handlers.get(e)||[])try{o(...t)}catch(i){console.error(`${e} listener failed:`,i)}}log(e,t="info"){this.logLines.push({t:Date.now(),text:e,kind:t}),this.logLines.length>400&&this.logLines.shift(),this.emit("log")}get activeStage(){return this.store.doc.stages.find(e=>e.id===this.activeStageId)||this.store.doc.stages[0]}setActiveStage(e){this.activeStageId=e,this.emit("stage"),this.renderChrome()}brushIds(){return Object.keys(Z).filter(e=>!Z[e].construction&&Z[e].roles?.some(t=>["line","plane","gesture"].includes(t)))}toolRole(e=this.tool){return e==="circle"||e==="rect"?"plane":e}radialItems(){const e=this.tool,t=s=>s.split(":")[0],o=s=>s.map(([r,a])=>({id:r,label:t(a),icon:this.pathIcon(r),active:r===e,run:()=>this.setTool(r)}));return je.some(s=>s[0]===e)?o(je):Tt.some(s=>s[0]===e)?o(Tt):Et.some(s=>s[0]===e)?o(Et):e==="brush"?this.brushIds().map(s=>({id:s,label:Z[s].label,icon:Gt(s),active:s===this.brush.id,run:()=>{this.pickBrush(s,{apply:!1}),this.setTool("brush")}})):e==="sculpt"?Object.entries($e).map(([s,r])=>({id:s,label:r.label,icon:un(s),active:s===this.sculpt.tool,run:()=>{this.setSculpt({tool:s}),this.setTool("sculpt")}})):[["select","Select"],["hand","Pan"],["laser","Laser"],["board","Board"],["point","Point"],["line","Line"],["plane","Plane"],["brush","Brush"],["sculpt","Sculpt"],["note","Note"]].map(([s,r])=>({id:s,label:r,icon:this.pathIcon(s),active:s===e,run:()=>this.setTool(s)}))}openRadial(){if(this.radial)return;const[e,t]=this.pointerAt||[window.innerWidth/2,window.innerHeight/2];this.radial=al({items:this.radialItems(),x:e,y:t,onClose:()=>{this.radial=null}})}openToolDetails(e,t){const o=this.tool;if(o==="sculpt"||o==="brush")return pt(this,e,t);if(["point","line","plane","gesture","guide","circle","rect"].includes(o))return Yn(this,this.toolRole(o),e,t,o==="circle"||o==="rect"?o:null);if(this.selectedElements().length)return pt(this,e,t)}pathTool(){return Nd[this.tool]||null}setPathChoice(e){if(this.tool==="rect")return;const t=this.pathTool();if(!t){this.canvas.setPath(e);return}this.setDefaults(t,{path:e}),this.canvas.setPath(e,{marks:!1})||this.canvas.flash(e==="straight"?"Straight":"Smooth")}flipPathChoice(){const e=this.pathTool(),t=e&&!this.canvas.draft?this.defaults(e).path==="straight":this.canvas.pathIsStraight();this.setPathChoice(t?"smooth":"straight")}cycleStack(e){const t={select:{ids:je.map(i=>i[0]),inside:()=>je.some(i=>i[0]===this.tool),current:()=>this.tool,shown:()=>this.selectTool||"select",go:i=>this.setTool(i)},line:{ids:Tt.map(i=>i[0]),inside:()=>Tt.some(i=>i[0]===this.tool),current:()=>this.tool,shown:()=>this.lineTool||"line",go:i=>this.setTool(i)},plane:{ids:Et.map(i=>i[0]),inside:()=>Et.some(i=>i[0]===this.tool),current:()=>this.tool,shown:()=>this.planeTool||"plane",go:i=>this.setTool(i)},brush:{ids:this.brushIds(),inside:()=>this.tool==="brush",current:()=>this.brush.id,shown:()=>this.brush.id,go:i=>{this.pickBrush(i,{apply:!1}),this.setTool("brush")}},sculpt:{ids:Object.keys($e),inside:()=>this.tool==="sculpt",current:()=>this.sculpt.tool,shown:()=>this.sculpt.tool,go:i=>{this.setSculpt({tool:i}),this.setTool("sculpt")}}}[e];if(!t)return;if(!t.inside())return t.go(t.shown());const o=t.ids.indexOf(t.current());t.go(t.ids[(o+1)%t.ids.length])}stackToolButton(e,t,o,i){const s=e.find(c=>c[0]===this.tool)||e.find(c=>c[0]===t)||e[0],r=()=>e.some(c=>c[0]===this.tool),a=s[2].replace("⇧",""),l=(c,h)=>Ie([{label:o},...e.map(([u,f,p])=>({icon:this.pathIcon(u),active:u===s[0],label:f.split(":")[0],hint:f,keys:p,run:()=>this.setTool(u)}))],c,h),d=M("button",{class:`wb-tool wb-tool-stack${r()?" on":""}`,"data-guide":`tool:${s[0]}`,title:`${s[1]} (${a}; ${i}). Click again for the list · right-click: brush and look for new marks`,html:`${this.pathIcon(s[0])}<kbd>${a}</kbd><span class="wb-tool-caret"></span>`});return d.addEventListener("click",()=>{if(r()){const c=d.getBoundingClientRect();l(c.left,c.bottom+4)}else this.setTool(s[0])}),d.addEventListener("contextmenu",c=>{c.preventDefault();const h=d.getBoundingClientRect();Yn(this,this.toolRole(s[0]),h.left,h.bottom+6,s[0])}),d}pathIcon(e){const t=this.defaults(this.toolRole(e)).path==="straight";return te(e==="line"?t?"lineStraight":"line":e==="plane"?t?"plane":"planeSmooth":e==="circle"?t?"circleStraight":"circle":e)}planeStackButton(){return this.stackToolButton(Et,this.planeTool,"Plane","Shift+2 cycles plane, circle and rectangle")}lineStackButton(){return this.stackToolButton(Tt,this.lineTool,"Line","Shift+1 cycles line, gesture and guide")}setTool(e){this.player?.take&&this.player.close(),Tt.some(t=>t[0]===e)&&(this.lineTool=e),(e==="select"||e==="direct")&&(this.selectTool=e),Et.some(t=>t[0]===e)&&(this.planeTool=e),e!=="direct"&&this.canvas&&(this.canvas.selPoints=[]),this.canvas?.finishClickPath?.(),this.tool=e,this.canvas?.updateCursor(),this.canvas?.paintAffected?.(),this.emit("tool"),this.renderChrome()}setViewMode(e){this.view.mode=e,this.canvas.invalidate(),this.emit("view"),this.renderChrome()}setUpTo(e){this.view.upTo=e,this.canvas.upTo=e,this.canvas.invalidate(),this.emit("view")}selectedElements(){return this.store.doc.elements.filter(e=>this.canvas?.selected.has(e.id))}selectIds(e){this.canvas.select(e)}groupSelection(){const e=[...this.canvas.selected];e.length>1&&(this.store.group(e),this.canvas.select(e))}ungroupSelection(){const e=[...this.canvas.selected];e.length&&this.store.ungroup(e)}setShape(e,t){if(rs[e]){Object.assign(this.shapes[e],t);try{localStorage.setItem(Qo,JSON.stringify(this.shapes))}catch{}this.emit("tool")}}setSculpt(e){const t=this.sculpt;e.params&&(t.params={...t.params,[t.tool]:{...t.params[t.tool]||{},...e.params}});for(const o of["tool","radius","strength"])o in e&&(t[o]=e[o]);t.radius=Math.max(4,Math.min(400,t.radius)),t.strength=Math.max(.02,Math.min(1,t.strength));try{localStorage.setItem(ei,JSON.stringify(t))}catch{}this.canvas?.invalidate(),this.emit("sculpt"),"tool"in e&&this.renderChrome()}sculptMenu(e,t){const o=this.sculpt.tool;Ie([{label:"Sculpt"},...Object.entries($e).map(([i,s])=>({icon:un(i),active:i===o,label:`${s.label}`,hint:s.doc,run:()=>{this.setSculpt({tool:i}),this.tool!=="sculpt"&&this.setTool("sculpt")}})),"-",{label:`Radius ${Math.round(this.sculpt.radius)} px`,keys:"[ ]",disabled:!0},{label:`Strength ${Math.round(this.sculpt.strength*100)}%`,keys:"Shift+[ ]",disabled:!0},"-",{label:"Show code",hint:"Sculpt tools are code: fork one or write your own",run:()=>this.openCode?.("sculpt",o)}],e,t)}setAccent(e){try{e?localStorage.setItem("ams_accent",e):localStorage.removeItem("ams_accent")}catch{}e?document.documentElement.style.setProperty("--wb-accent-2",e):document.documentElement.style.removeProperty("--wb-accent-2"),this.canvas?.invalidate()}setLazy(e){Object.assign(this.lazy,e),this.lazy.radius=Math.max(0,Math.min(200,Number(this.lazy.radius)||0)),this.lazy.smoothing=Math.max(0,Math.min(.95,Number(this.lazy.smoothing)||0)),this.lazy.simplify=Math.max(0,Math.min(40,Number(this.lazy.simplify)||0));try{localStorage.setItem("ams_lazy",JSON.stringify(this.lazy))}catch{}this.emit("lazy")}saveDoc(){if(this.persist)try{localStorage.setItem(ut,JSON.stringify(this.store.doc)),localStorage.setItem(`${ut}_saved`,String(Date.now()))}catch{try{localStorage.removeItem(ut),localStorage.setItem(`${ut}_saved`,"0")}catch{}this.warnedQuota||(this.warnedQuota=!0,this.log("This drawing is too large for quick saving; it is kept in the scene store instead."))}}toggleBoardPerf(e=!this.boardPerfOn){this.boardPerfOn=e;try{localStorage.setItem("ams_board_perf",e?"1":"0")}catch{}this.perfTick(),this.canvas.invalidate(),this.renderChrome?.()}perfWanted(e){return!!e&&(this.boardPerfOn||!!e.perf)}perfTick(){if(!(this.boardPerfOn||V(this.store.doc).some(o=>o.perf))){clearInterval(this.boardPerfTimer),this.boardPerfTimer=0,this.perfMarks=null;return}if(this.boardPerfTimer)return;const t=()=>{if(!(this.boardPerfOn||V(this.store.doc).some(o=>o.perf))){clearInterval(this.boardPerfTimer),this.boardPerfTimer=0;return}this.perfMarks=new Map;for(const o of this.store.doc.elements)this.perfMarks.set(o.board||H,(this.perfMarks.get(o.board||H)||0)+1);this.canvas.invalidate()};t(),this.boardPerfTimer=setInterval(t,1e3)}setBoardFlag(e,t,o){this.store.updateBoard(e,{[t]:!!o}),t==="perf"&&this.perfTick(),(t==="hidden"||t==="locked")&&this.canvas.select?.([])}boardPerfText(e){if(!this.perfWanted(e))return null;const t=we(e),o=this.isBoardLive(e.id),i=performance.now(),s=u=>u>=10?String(Math.round(u)):u.toFixed(1).replace(/\.0$/,"");if(t==="p5"){const u=this.frames?.perf.get(e.id);return o?u&&i-u.at<3e3?`p5·${u.fps}${u.calls>u.fps?`/${u.calls}`:""}FPS·${s(u.ms)}ms`:"p5·…":"paused"}if(t!=="drawing"||!e.code)return null;const r=this.runStats.get(e.id),a=(r?.at||[]).filter(u=>i-u<3e3),l=[...String(e.code).matchAll(/(?:source|fit)\(\s*['"`]([^'"`]+)['"`]/g)].map(u=>u[1]),d=[...new Set(l)].map(u=>`${u}:${s(this.sources.fps(u))}FPS`),c=/(?<![.\w$])fit\s*\(/.test(e.code)&&$s.has(e.id)?`fit${Math.round($s.get(e.id))}ms`:null,h=wa();return[o?`${s(a.length/3)}r/s`:"paused",r?`${s(r.ms)}ms`:null,o&&this.canvas.stats?.avg?`d${s(this.canvas.stats.avg)}ms`:null,c,...d,`${this.perfMarks?.get(e.id)??"…"}mk`,o&&h.layers?`${Math.round(h.bytes/1048576)}MB${h.quality<1?`·q${h.quality}`:""}`:null].filter(Boolean).join("·")}togglePerf(e=!this.perfOn){this.perfOn=e;try{localStorage.setItem("ams_perf",e?"1":"0")}catch{}if(cancelAnimationFrame(this.perfRaf),this.renderChrome(),!e)return;let t=this.canvas.stats?.frames||0,o=0,i=performance.now();const s=r=>{if(o++,r-i>=500){const a=this.canvas.stats?.frames||0,l=(r-i)/1e3,d=Math.round(o/l),c=Math.round((a-t)/l);t=a,o=0,i=r;const h=this.canvas.stats;this.perfEl&&(this.perfEl.textContent=`${d} fps · ${c?`${c} redraws/s · ${h?h.draw.toFixed(1):"–"} ms`:"idle"} · ${this.store.doc.elements.length} marks`,this.perfEl.title="fps: the browser's frame rate. Redraws: how often the canvas repaints (only when something changes), and the last repaint's time."),this.perfEl?.classList.toggle("slow",d<30||!!(c&&h&&h.avg>16))}this.perfRaf=requestAnimationFrame(s)};this.perfRaf=requestAnimationFrame(s)}setBackground(e="default"){e=String(e||"default").trim(),/^(none|clear|see-?through)$/i.test(e)&&(e="transparent"),/^#[0-9a-f]{6}00$/i.test(e)&&(e="transparent");const t=document.documentElement;e==="default"||e==="reset"?(t.style.removeProperty("--wb-canvas"),e="default"):t.style.setProperty("--wb-canvas",e),t.classList.toggle("wb-transparent",e==="transparent"),this.background=e;try{localStorage.setItem("ams_workspace_bg",e)}catch{}this.canvas?.invalidate(),this.emit("background",e),this.log(e==="default"?"Workspace background: the theme’s.":`Workspace background: ${e}.`)}p5Version(){try{return localStorage.getItem("ams_p5_version")==="1"?"1":"2"}catch{return"2"}}togglePoints(){this.canvas.showPoints=!this.canvas.showPoints;try{localStorage.setItem("ams_show_points",this.canvas.showPoints?"1":"0")}catch{}this.canvas.invalidate(),this.renderChrome()}setPaint(e,t){this.paint[e]=t||null;try{localStorage.setItem("ams_paint",JSON.stringify(this.paint))}catch{}const o=[...this.canvas.selected];if(o.length){const i=e==="stroke"?"color":"fill";this.store.change(e,s=>{for(const r of s.elements)o.includes(r.id)&&r.role!=="note"&&(t?r[i]=t:delete r[i],i==="color"&&!t&&(r.color=null))})}this.renderChrome()}paintValues(){const e=this.selectedElements?.()||[];return{stroke:e.length?e[0].color??null:this.paint.stroke,fill:e.length?e[0].fill??null:this.paint.fill}}openPaintPicker(e=this.pointerAt?.[0]??200,t=this.pointerAt?.[1]??200,{active:o=null,anchor:i=null}={}){const{stroke:s,fill:r}=this.paintValues();return hi(this,e,t,{stroke:s,fill:r,active:o,anchor:i,set:(a,l)=>this.setPaint(a,l||(a==="stroke"?"none":null))})}openGridMenu(e=this.pointerAt?.[0]??200,t=this.pointerAt?.[1]??200){return uo(this,e,t)}paintSwatches(){const{stroke:e,fill:t}=this.paintValues(),o=(i,s,r)=>{const a=M("button",{class:`wb-paint-${i}${s&&s!=="none"?"":" none"}${i==="stroke"&&!s?" ink":""}`,title:r,type:"button"},M("span",{style:i==="stroke"?{boxShadow:`inset 0 0 0 5px ${s&&s!=="none"?s:s?"transparent":"var(--wb-text)"}`}:{background:s||"transparent"}}));return a.addEventListener("click",l=>{l.stopPropagation(),this.openPaintPicker(0,0,{active:i,anchor:a})}),a.addEventListener("contextmenu",l=>{l.preventDefault(),Ie([{label:i==="fill"?"No fill":"No stroke",run:()=>this.setPaint(i,i==="stroke"?"none":null)},...i==="stroke"?[{label:"Brush ink (default)",run:()=>this.setPaint("stroke",null)}]:[],{label:"Swap stroke and fill",run:()=>this.swapPaint()},{label:"Stroke and fill together…",run:()=>this.openPaintPicker(l.clientX,l.clientY)}],l.clientX,l.clientY)}),a};return M("div",{class:"wb-paint","data-guide":"tool:paint"},o("fill",t,"Fill (right-click: none)"),o("stroke",e,"Stroke (right-click: brush ink)"),M("button",{class:"wb-paint-swap",title:"Swap stroke and fill",type:"button",onclick:()=>this.swapPaint()},"⇄"))}swapPaint(){const{stroke:e,fill:t}=this.paint;this.setPaint("stroke",t),this.setPaint("fill",e)}defaults(e){if(e==="brush"){const o=Z[this.brush.id]?this.brush.id:"ink",i=Z[o].roles||["line"],s=i.includes("line")?"line":i.includes("plane")?"plane":i.includes("gesture")?"gesture":"line";return{...this.defaults(s),role:s,realize:{brush:o,params:{...this.brush.params[o]||{}}}}}const t=this.toolDefaults[e]||{};return{color:e!=="note"&&this.paint?.stroke||t.color||null,fill:e!=="note"&&this.paint?.fill||null,why:t.why||"",realize:t.realize||structuredClone(rn[e]||rn.line),opacity:t.opacity??1,blend:t.blend||"normal",...(t.path??(e==="guide"?"straight":null))==="straight"?{path:"straight"}:{},...e==="note"?{note:t.note||{}}:{},...t.lazy?{lazy:t.lazy}:{}}}goToBoard(e,{fit:t=!0,animate:o=this.presenting}={}){const i=ie(this.store.doc,e);if(!i)return;this.activeBoard=i.id,this.presenting||this.canvas.selectBoard(i.hideLabel||i.hideBorder?null:i.id);const s=this.presenting?24:60;if(t&&o?this.canvas.animateTo(this.canvas.camFor(i.id,s)):t&&this.canvas.fit(s,i.id),t&&this.recorder?.recording){const r=this.store.doc.artboard,a=Math.min(16/r.width,9/r.height),l=Math.min(16/i.width,9/i.height);this.recorder.push({track:"camera",start:this.recorder.now(),dur:o?550:1,cx:(i.x+i.width/2)/r.width,cy:(i.y+i.height/2)/r.height,z:l/a*.96,label:i.title})}this.presenting&&this.presentHud(),this.emit("board"),this.renderChrome()}async newProject({keep:e=!0}={}){if(e){const t=`Project ${new Date().toLocaleString()}`.replace(/[/:]/g,"-"),o=this.assetPanel?.folder;this.assetPanel&&(this.assetPanel.folder=t);for(const i of this.scenes.all){const s=await this.scenes.docOf(i.id);s&&await this.saveDocToAssets(structuredClone(s))}this.assetPanel&&(this.assetPanel.folder=o||""),this.log(`Kept ${this.scenes.all.length} scene${this.scenes.all.length===1?"":"s"} in Assets → ${t}.`)}await this.scenes.resetProject()}makeMovable(e,t){const o=M("span",{class:"wb-grip",title:"Drag to move · double-click to put back"});e.prepend(o);let i;try{i=JSON.parse(localStorage.getItem("ams_island_places")||"{}")}catch{i={}}const s=()=>{const a=i[t];e.classList.toggle("wb-floating-island",!!a),a?Object.assign(e.style,{left:`${a.x}px`,top:`${a.y}px`}):Object.assign(e.style,{left:"",top:""})},r=()=>{try{localStorage.setItem("ams_island_places",JSON.stringify(i))}catch{}};s(),o.addEventListener("dblclick",()=>{delete i[t],r(),s()}),o.addEventListener("pointerdown",a=>{a.preventDefault(),a.stopPropagation();const l=this.stageArea.getBoundingClientRect(),d=e.getBoundingClientRect(),c=a.clientX-d.left,h=a.clientY-d.top,u=p=>{const m=Math.max(0,Math.min(l.width-d.width,p.clientX-l.left-c)),b=Math.max(0,Math.min(l.height-d.height,p.clientY-l.top-h));i[t]={x:Math.round(m),y:Math.round(b)},s()},f=()=>{window.removeEventListener("pointermove",u),window.removeEventListener("pointerup",f),r()};window.addEventListener("pointermove",u),window.addEventListener("pointerup",f)})}setUI(e){if(this.ui={tools:!0,view:!0,zoom:!0,panels:!0,...this.ui||{},...e},"all"in e)for(const t of["tools","view","zoom","panels"])this.ui[t]=e.all;delete this.ui.all;for(const t of["tools","view","zoom","panels"])this.root.classList.toggle(`hide-${t}`,!this.ui[t]);if(!this.embed)try{localStorage.setItem("ams_ui",JSON.stringify(this.ui))}catch{}requestAnimationFrame(()=>this.canvas?.resize()),this.emit("ui",this.ui)}toggleZen(){const e=this.ui||{},t=e.tools!==!1||e.view!==!1||e.zoom!==!1||e.panels!==!1;this.setUI({all:!t}),this.log(t?"Zen: Alt+Z brings the interface back. Cmd+K opens the command palette; Shift+Space the tools.":"Interface back.")}boardAtClient(e,t){const[o,i]=this.canvas.toWorld(...this.canvas.local({clientX:e,clientY:t}));return[...V(this.store.doc)].reverse().find(s=>!s.hidden&&o>=s.x&&o<=s.x+s.width&&i>=s.y&&i<=s.y+s.height)||null}sceneMenu(e,t){const o=this.scenes,i=o.list.active;Ie([{label:"Scenes"},...o.all.map((s,r)=>({active:s.id===i,label:`${r+1}. ${s.title||"Untitled"}`,run:()=>o.switchTo(s.id)})),"-",{label:"New scene",hint:"An empty drawing; this one stays as it is",run:()=>o.create()},{label:"Duplicate this scene",run:()=>o.duplicate()},{label:"Move earlier",disabled:o.all[0]?.id===i,run:()=>o.move(i,-1)},{label:"Move later",disabled:o.all.at(-1)?.id===i,run:()=>o.move(i,1)},o.all.length>1?"-":null,o.all.length>1?{label:"Delete this scene…",items:[{label:"Save it to Assets first",run:async()=>{await this.saveToAssets(),o.remove(i)}},{label:`Delete “${o.current?.title||"Untitled"}”`,run:()=>o.remove(i)},{label:"Cancel",run:()=>{}}]}:null],e,t)}present(e=!this.presenting){this.presenting=e,this.canvas.presenting=e,this.root.classList.toggle("presenting",e);try{e&&!document.fullscreenElement?document.documentElement.requestFullscreen?.().catch(()=>{}):!e&&document.fullscreenElement&&document.exitFullscreen?.()}catch{}e?(this.presentKeys||=t=>{if(!this.presenting||t.target.closest?.("input, textarea, select, [contenteditable]"))return;const o=Un(this.store.doc),i=r=>{t.preventDefault(),t.stopPropagation(),this.goToBoard(o[Math.max(0,Math.min(o.length-1,r))].id)},s=Math.max(0,o.findIndex(r=>r.id===this.activeBoard));["ArrowRight","PageDown"," "].includes(t.key)&&!t.metaKey?i(s+1):["ArrowLeft","PageUp"].includes(t.key)&&!t.metaKey?i(s-1):t.key==="Home"?i(0):t.key==="End"?i(o.length-1):t.altKey&&!t.metaKey&&/^Digit[1-9]$/.test(t.code||"")?i(Number(t.code.slice(-1))-1):t.key==="Escape"&&(t.preventDefault(),t.stopPropagation(),this.present(!1))},window.addEventListener("keydown",this.presentKeys,!0),this.canvas.selectBoard(null),requestAnimationFrame(()=>this.goToBoard(this.activeBoard||H))):(window.removeEventListener("keydown",this.presentKeys,!0),this.hud?.remove(),this.hud=null,requestAnimationFrame(()=>this.canvas.fit(60,this.activeBoard||H))),this.emit("present",e)}presentHud(){const e=Un(this.store.doc),t=e.findIndex(o=>o.id===this.activeBoard);this.hud||(this.hud=M("div",{class:"wb-present-hud"}),this.stageArea.append(this.hud)),this.hud.textContent=`${t+1} / ${e.length}  ·  ${e[t]?.title||""}`,this.hud.classList.remove("fade"),this.hud.offsetWidth,this.hud.classList.add("fade")}stepBoard(e){const t=Un(this.store.doc),o=Math.max(0,t.findIndex(i=>i.id===this.activeBoard));this.goToBoard(t[(o+e+t.length)%t.length].id)}renameBoard(e){const t=ie(this.store.doc,e);if(!t)return;const o=r=>this.store.updateBoard(e,{title:r}),i=(this.canvas.boardLabels||[]).find(r=>r.id===e);if(i&&i.y>0&&i.x<this.canvas.w){const r=this.canvas.canvas.getBoundingClientRect(),a=M("span",{class:"wb-board-rename",style:{left:`${r.left+i.x}px`,top:`${r.top+i.y}px`}},t.title);document.body.append(a),as(a,o,t.title,()=>a.remove());return}const s=document.querySelector(`[data-board-title="${CSS.escape(e)}"]`);s&&as(s,o)}boardMenu(e,t,o){const i=this.store.doc,s=ie(i,e),r=V(i).length;if(!s)return;const a=i.elements.filter(l=>(l.board||H)===e).length;Ie([{label:`${s.title}`},{label:"Go to",run:()=>this.goToBoard(e)},{label:"Rename…",run:()=>this.renameBoard(e)},{label:"Board",items:[{label:s.locked?"Unlock":"Lock",hint:"Locked: its marks cannot be selected or changed, and it cannot be moved or resized",run:()=>this.setBoardFlag(e,"locked",!s.locked)},{label:s.hidden?"Show":"Hide",hint:"Hidden: not drawn and not run (a dashed outline marks where it is)",run:()=>this.setBoardFlag(e,"hidden",!s.hidden)},{label:s.hideLabel?"Show title":"Hide title",run:()=>this.setBoardFlag(e,"hideLabel",!s.hideLabel)},{label:s.hideBorder?"Show border":"Hide border",hint:"No shadow or frame line: a board with no title and no border is only structure (selected, it still shows its outline so it can be moved)",run:()=>this.setBoardFlag(e,"hideBorder",!s.hideBorder)},s.code||s.pseudo?{label:s.codeMin?"Open its code on pages":"Minimize its code on pages",hint:"On an exported page its code is a bar of tabs (Pseudocode, Studio, p5.js) and opens on a click",run:()=>this.setBoardFlag(e,"codeMin",!s.codeMin)}:null,{label:s.mask?"Unmask":"Mask to board",hint:"Its marks are cropped to the board (a mask the size of the board); off, they may spill over its edge",run:()=>this.setBoardFlag(e,"mask",!s.mask)},{label:"Add to playlist",hint:"This board (or the selected boards): the media they show, or the boards themselves",run:()=>{const l=this.canvas.boardSet.has(e)&&this.canvas.boardSet.size>1?[...this.canvas.boardSet]:[e];this.playlistMenu(l.map(d=>this.playlistItemForBoard(ie(this.store.doc,d))),t,o,s)}},this.playableSource(s)?{label:this.playerShown(s)?"Hide media controls":"Show media controls",hint:"The player under the board: play, step, scrub, speed",run:()=>this.togglePlayer(s)}:null,{label:this.captureOf(e)?`Stop being a source (${this.captureOf(e).name})`:"Use as a source",hint:"Its picture (what is under it, then its marks), live, as a source other boards read by name",run:()=>this.setBoardCapture(e)},{label:s.perf?"Hide performance":"Show performance",hint:"A line under it: runs a second, code time, source fps (measured only while shown)",run:()=>this.setBoardFlag(e,"perf",!s.perf)}]},{label:"Code",hint:"The board’s own code: it redraws the board, live",run:()=>this.openCode?.("board",e)},this.sources.list.length?{label:"Source underneath",hint:"A source shown under the board: a reference, not part of its picture",items:[{label:"None",active:!s.source,run:()=>this.setBoardSource(e,null)},...this.sources.list.map(l=>({label:l.name,active:s.source===l.name,run:()=>this.setBoardSource(e,l.name,s.source?s.sourceOpacity:1)}))]}:null,we(s)==="drawing"?{label:"Mask",hint:"Show the board through a source or another board (opt-in): the mask's light or alpha decides what shows",items:[{label:"None",active:!s.maskWith,run:()=>this.setBoardMask(e,null)},...this.sources.list.map(l=>({label:l.name,active:s.maskWith?.source===l.name,run:()=>this.setBoardMask(e,{...s.maskWith||{},source:l.name,board:void 0,mode:s.maskWith?.mode||"luma"})})),...V(this.store.doc).filter(l=>l.id!==e&&we(l)==="drawing").length?["-"]:[],...V(this.store.doc).filter(l=>l.id!==e&&we(l)==="drawing").map(l=>({label:`${l.title} · board`,active:s.maskWith?.board===l.id,run:()=>this.setBoardMask(e,{...s.maskWith||{},board:l.id,source:void 0,mode:s.maskWith?.mode||"alpha"})}))]}:null,we(s)==="drawing"?{label:"Effects",hint:"Post effects on the board's picture (opt-in): threshold, levels, gradient map…",items:[...Object.entries(jt).map(([l,d])=>({label:d.label,hint:d.doc,run:()=>this.setBoardFx(e,"fx",[...s.fx||[],Ft([l])[0]])})),...s.fx?.length?["-",{label:"Remove effects",run:()=>this.setBoardFx(e,"fx",[])}]:[]]}:null,this.sources.list.length&&we(s)==="drawing"?{label:"Draw from a source",hint:"A demo: code that reads a source, which the board follows. Its code is yours to change",items:Ms.map(l=>{const d=this.sources.list.map(h=>h.name),c=s.source&&d.includes(s.source)?s.source:null;return d.length===1||c?{label:l.label,hint:l.hint,run:()=>this.sourceDemo(e,l.id,c||d[0])}:{label:l.label,hint:l.hint,items:d.map(h=>({label:h,run:()=>this.sourceDemo(e,l.id,h)}))}})}:null,{label:this.isBoardLive(e)?"Pause":"Play",hint:"Live boards run (their code follows sources, their brushes read live frames); paused boards are baked into a picture and stay paused until played",run:()=>this.toggleBoardRun(e)},{label:"Export as JSON",hint:"The marks as a file (.ams.json), to import again into any scene",run:()=>{const l=ss(this.selectionDoc(ids));l&&Se(JSON.stringify(l,null,2),`${this.slug()}-selection.ams.json`,"application/json")}},{label:"Copy as",items:[{label:"PNG",hint:"The board as a picture, on the clipboard",run:()=>this.copyBoard(e,"png")},{label:"SVG",hint:"The board as SVG (with its process record), on the clipboard",run:()=>this.copyBoard(e,"svg")},{label:"JSON",hint:"The board as studio JSON: paste (Cmd+V) into any scene",run:()=>this.copyBoard(e,"json")},s.code?{label:we(s)==="drawing"?"Studio code":"Its code",run:()=>this.copyBoard(e,"code")}:null,{label:"p5.js code",hint:"For the p5 editor: its code as a sketch (or the marks as plain p5 calls)",run:()=>this.copyBoard(e,"p5")}].filter(Boolean)},we(s)==="drawing"&&s.code?{label:"Convert to p5.js",hint:"A new board running its code as the p5 sketch the export writes (it pastes into the p5 editor as it is)",run:()=>this.convertBoard(e,"p5")}:null,we(s)==="p5"&&Ls(s.code)?{label:"Convert to studio code",hint:"A new drawing board with the studio code inside this sketch",run:()=>this.convertBoard(e,"studio")}:null,{label:"Bake",items:[{label:"To a PNG image",hint:"Its marks become one picture (undo brings them back)",run:()=>this.bakeBoard(e,"png")},{label:"To an SVG image",hint:"Its marks become one vector image, crisp at any zoom (undo brings them back)",run:()=>this.bakeBoard(e,"svg")}]},{label:"Export",items:[["png","PNG"],["svg","SVG"],["sheet","Process sheet"],["json","JSON (to import again)"],["p5","p5.js sketch"],["p5min","p5 (minimal code)"],...s.code?[["p5code","p5 (its code)"]]:[]].map(([l,d])=>({label:d,run:()=>this.exportAs(l,e)}))},this.embed?null:{active:(i.train||H)===e,label:(i.train||H)===e?"Models learn from this board":"Train on this board",run:()=>this.store.setTrainBoard(e)},s.main?null:{label:"Earlier",run:()=>this.store.moveBoard(e,-1)},s.main?null:{label:"Later",run:()=>this.store.moveBoard(e,1)},{label:"Duplicate",run:()=>this.duplicateBoard(e)},s.main||r<2?null:"-",s.main?null:{label:`Delete (its ${a} marks go to the blackboard)`,run:()=>{this.store.removeBoard(e),this.activeBoard===e&&this.goToBoard(H,{fit:!1})}},s.main||!a?null:{label:`Delete with its ${a} marks`,items:[{label:`Delete ${a} marks`,run:()=>{this.store.removeBoard(e,{deleteMarks:!0}),this.activeBoard===e&&this.goToBoard(H,{fit:!1})}},{label:"Cancel",run:()=>{}}]}],t,o)}duplicateBoard(e){const t=this.store.doc,o=ie(t,e),i=this.store.addBoard({title:`${o.title} copy`,width:o.width,height:o.height,ground:o.ground,adopt:!1}),s=t.elements.filter(l=>(l.board||H)===e).map(l=>l.id),r=ie(this.store.doc,i.id),a=this.store.duplicate(s,r.x-o.x,r.y-o.y);this.store.assignBoard(a,i.id),this.goToBoard(i.id)}setBrush(e){const t=this.brush;e.id&&Z[e.id]&&(t.id=e.id),e.params&&(t.params={...t.params,[t.id]:{...t.params[t.id]||{},...e.params}});try{localStorage.setItem(Zo,JSON.stringify(t))}catch{}this.emit("brush"),e.id&&this.renderChrome()}pickBrush(e,{apply:t=!0}={}){this.setBrush({id:e});const o=Z[e],i=t?this.selectedElements().filter(s=>o.roles?.includes(s.role)).map(s=>s.id):[];if(i.length){const s={...this.brush.params[e]||{}};this.store.change("brush",r=>{for(const a of r.elements)i.includes(a.id)&&(a.realize={brush:e,params:{...s}})}),this.log(`Brush “${o.label}” on ${i.length} mark${i.length===1?"":"s"}.`)}else this.tool!=="brush"&&!this.canvas.selected.size&&this.setTool("brush")}keepSlot(e){this.slots[e]={id:this.brush.id,params:{...this.brush.params[this.brush.id]||{}},stroke:this.paint?.stroke||null};try{localStorage.setItem("ams_brush_slots",JSON.stringify(this.slots))}catch{}this.log(`Slot ${e}: ${Z[this.brush.id]?.label||this.brush.id}.`)}useSlot(e){const t=this.slots[e];if(!t||!Z[t.id]){this.log(`Slot ${e} is empty (Ctrl+Shift+${e} keeps the active brush there).`);return}this.setBrush({id:t.id}),this.setBrush({params:t.params}),t.stroke!==void 0&&this.setPaint("stroke",t.stroke),this.tool!=="brush"&&this.setTool("brush")}brushMenu(e,t){const o=this.brush.id,i=this.brushIds();Ie([{label:"Brush"},...i.map(s=>({icon:Gt(s),active:s===o,label:`${Z[s].label}`,hint:`${Z[s].doc}${this.canvas.selected.size?" · applies to the selection (Cmd-click: only pick it)":""}`,run:r=>this.pickBrush(s,{apply:!(r?.metaKey||r?.ctrlKey)})})),"-",{label:"Settings…",hint:"Opt+right-click on the canvas",run:()=>{this.setTool("brush"),pt(this,e,t)}},{label:"Show code",run:()=>this.openCode?.("brush",o)},"-",{label:"Slots",hint:"Alt+Shift+1–9 picks a slot; Ctrl+Alt+Shift+1–9 keeps the active brush there",items:[1,2,3,4,5,6,7,8,9].map(s=>({label:`${s}  ${this.slots[s]?Z[this.slots[s].id]?.label||this.slots[s].id:"—"}`,keys:`⌥⇧${s}`,run:()=>this.useSlot(s)})).concat(["-",{label:"Keep the active brush in…",items:[1,2,3,4,5,6,7,8,9].map(s=>({label:`Slot ${s}`,keys:`⌃⌥⇧${s}`,run:()=>this.keepSlot(s)}))}])}],e,t)}setDefaults(e,t){if(e==="brush"){const{realize:i,...s}=t;if(i?.brush&&this.setBrush({id:i.brush}),i?.params&&this.setBrush({params:i.params}),Object.keys(s).length&&this.setDefaults(this.defaults("brush").role,s),!i)return;this.emit("tool");return}const o=this.defaults(e);t.realize&&(o.realize={brush:t.realize.brush||o.realize.brush,params:t.realize.brush&&t.realize.brush!==o.realize.brush?{}:{...o.realize.params,...t.realize.params||{}}}),"color"in t&&(o.color=t.color),"why"in t&&(o.why=t.why);for(const i of["opacity","blend","path","lazy"])i in t&&(o[i]=t[i]);t.note&&(o.note={...o.note||{},...t.note}),this.toolDefaults[e]=o;try{localStorage.setItem(Yo,JSON.stringify(this.toolDefaults))}catch{}this.emit("tool"),"path"in t&&this.renderChrome()}putScoreDoc(e,t="score"){const o=e?.meta?.script;if(!o)return this.scenes.create({doc:e});const i=fr(this.store.doc,o,{board:this.activeBoard||H,seed:e.meta.seed??1,by:e.meta.by});return i.error||!i.doc?this.scenes.create({doc:e}):(i.doc.title=this.store.doc.title,this.loadDocument(i.doc,t),null)}loadDocument(e,t="load"){this.store.replace(Me(e),t),this.canvas.select([]),this.setUpTo(1/0),this.setActiveStage(this.store.doc.stages[this.store.doc.stages.length-1]?.id)}mount(){this.root.innerHTML="";const e=M("div",{class:"wb"},M("aside",{class:"wb-dock","data-dock":"left"}),this.stageArea=M("main",{class:"wb-stage-area"}),M("aside",{class:"wb-dock","data-dock":"right"}),M("section",{class:"wb-dock","data-dock":"bottom"}));this.root.append(e,M("div",{"data-floating":""}),M("div",{class:"wb-dock-hint"})),this.docks=new Bc(this.root,{onLayout:()=>this.canvas?.resize()}),this.docks.aliases={brushes:["script","brush"],code:["script",null]},this.docks.onAlias=a=>{a&&this.codeMode?.(a)},this.canvas=new jc(this.stageArea,this.store,{getTool:()=>this.tool,getStage:()=>this.activeStage,getDefaults:a=>this.defaults(a),getSculpt:()=>this.sculpt,getLazy:()=>this.lazy,getShape:a=>this.shapes[a],onSelect:a=>{a?.length&&(this.selectedAsset=null),this.emit("selection"),this.renderChrome()},onNoteStyled:a=>this.setDefaults("note",{note:a}),onTool:a=>this.setTool(a),viewMode:()=>this.view.mode}),this.canvas.drawReference=a=>this.drawReference(a),this.canvas.onGrid=()=>this.renderChrome();try{const a=localStorage.getItem("ams_accent");a&&document.documentElement.style.setProperty("--wb-accent-2",a)}catch{}try{this.canvas.showPoints=localStorage.getItem("ams_show_points")==="1"}catch{}try{localStorage.getItem("ams_perf")==="1"&&requestAnimationFrame(()=>this.togglePerf(!0))}catch{}try{const a=localStorage.getItem("ams_workspace_bg");if(a&&a!=="default"){const l=this.log;this.log=()=>{},this.setBackground(a),this.log=l}}catch{}this.canvas.onContext=(a,l,d)=>{if(!a.altKey)return Ie(this.contextItems(l,d),a.clientX,a.clientY);const c=!l&&!this.canvas.selected.size&&this.boardAtClient(a.clientX,a.clientY);return c?po(this,c.id,a.clientX,a.clientY):pt(this,a.clientX,a.clientY)},this.activeBoard=H,this.canvas.onBoardSelect=a=>{this.activeBoard=a,this.selectedAsset=null,this.emit("board")},this.embed&&(this.canvas.showTrain=!1),this.canvas.onOpenProperties=()=>this.docks.open("properties"),this.canvas.onFlipPath=()=>this.flipPathChoice(),this.canvas.onPaintPicker=a=>this.openPaintPicker(a.clientX,a.clientY),this.canvas.onGridMenu=a=>this.openGridMenu(a.clientX,a.clientY),this.canvas.onToolDetails=a=>this.openToolDetails(a.clientX,a.clientY),window.addEventListener("pointermove",a=>{this.pointerAt=[a.clientX,a.clientY]},{capture:!0,passive:!0}),this.canvas.onBoardRename=a=>this.renameBoard(a),this.canvas.onBoardContext=(a,l)=>this.boardMenu(a,l.clientX,l.clientY),this.canvas.onBoardParams=(a,l)=>po(this,a,l.clientX,l.clientY),this.canvas.onDropAsset=(a,l)=>this.placeAsset(a,l).catch(d=>this.log(d.message,"error")),this.canvas.onDropSource=(a,l)=>this.placeSource(a,l),this.canvas.onDropFiles=(a,l)=>this.placeFiles(a,l).catch(d=>this.log(d.message,"error")),De.onImageLoad=()=>{this.canvas.baked?.clear(),this.canvas.invalidate()},this.canvas.composer=this.composer,this.canvas.isBoardLive=a=>this.isBoardLive(a),this.canvas.boardPerf=a=>this.boardPerfText(a),this.runStats=new Map;const t=this.store.runBoardCode.bind(this.store);this.store.runBoardCode=(a,...l)=>{if(!this.perfWanted(ie(this.store.doc,a)))return t(a,...l);const d=performance.now(),c=t(a,...l),h=performance.now()-d,u=this.runStats.get(a)||{at:[],ms:0};return u.at.push(d),u.at.length>200&&u.at.shift(),u.ms=u.ms?u.ms*.7+h*.3:h,this.runStats.set(a,u),c};try{localStorage.getItem("ams_board_perf")==="1"?this.toggleBoardPerf(!0):this.perfTick()}catch{}this.canvas.onToggleRun=(a,l)=>l?.altKey?this.soloBoard(a):this.toggleBoardRun(a),this.frames=new ir(this),this.runScript=tt,this.canvas.onDrawn=()=>this.frames.update(),this.canvas.onCamera=()=>{const a=`${Math.round(this.canvas.cam.z*100)}%`,l=this.zoomIsland?.querySelector("span");l&&(l.textContent=a);const d=this.topbar?.querySelector(".wb-zoom-pct");d&&(d.textContent=a)},this.topbar=M("div",{class:"wb-topbar"}),this.zoomIsland=M("div",{class:"wb-island wb-zoom"}),this.stageArea.append(this.topbar,this.zoomIsland),this.guide=new zd(this);try{localStorage.getItem("ams_guide_enabled")==="0"&&(this.guide.enabled=!1)}catch{}this.walkthroughs=new tr(this),this.toolList=Xo.filter(Boolean),this.docsTopics=()=>Yi();const o=a=>{this.docks.open("docs"),this.openDocs!==o&&this.openDocs(a)};this.openDocs??=o;const i=async a=>{if(this.docks.open("timeline"),this.openTake!==i)return this.openTake(a);throw new Error("Timeline unavailable")};this.openTake??=i;const s=(a,l)=>{if(this.docks.open("script"),this.openCode!==s)return this.openCode(a,l)};if(this.openCode??=s,qa(),this.history=new Qc(this),this.scenes=new Zi(this),this.persist){let a=0;try{const l=localStorage.getItem(`${ut}_saved`);a=l!=null?Number(l)||0:localStorage.getItem(ut)?1/0:0}catch{}a!==1/0&&this.scenes.restoreNewer(a).catch(()=>{})}if(this.scenes.on(()=>this.renderChrome()),!this.embed)try{const a=JSON.parse(localStorage.getItem("ams_ui")||"null");a&&requestAnimationFrame(()=>this.setUI(a))}catch{}try{this.slots=JSON.parse(localStorage.getItem("ams_brush_slots")||"{}")}catch{this.slots={}}window.addEventListener("keydown",a=>{const l=/^Digit([1-9])$/.exec(a.code||"");if(!l||this.presenting||a.metaKey||a.target.closest?.("input, textarea, select, [contenteditable], .cm-editor"))return;const d=Number(l[1]);if(a.altKey&&a.shiftKey&&a.ctrlKey)a.preventDefault(),this.keepSlot(d);else if(a.altKey&&a.shiftKey)a.preventDefault(),this.useSlot(d);else if(a.altKey&&!a.ctrlKey&&!a.shiftKey){const c=V(this.store.doc)[d-1];c&&(a.preventDefault(),this.goToBoard(c.id,{animate:!0}))}},!0),this.recorder=new Qi(this),this.player=new er(this),this.shortcuts=new pd(this),this.registerPanels();const r=!!localStorage.getItem("ams_workbench_camera_v1");this.docks.render(),requestAnimationFrame(()=>{this.canvas.resize(),r||this.canvas.fit(),this.renderChrome()}),this.bindKeys(),this.renderChrome(),this.embed||Ve(()=>import("./noSamples-DSjayTt7.js"),[],import.meta.url).then(a=>a.seedSamples(this.assetStore)).catch(()=>{}),this.followSources(),this.sources.startAll(),xd(this),this.diagnostics=rr(),document.addEventListener("copy",a=>{if(a.target.closest?.("input, textarea, select, [contenteditable], .cm-editor")||!this.canvas.selected.size)return;const l=ss(this.selectionDoc([...this.canvas.selected]));l&&(a.preventDefault(),a.clipboardData.setData("text/plain",JSON.stringify(l)),this.log(`Copied ${this.canvas.selected.size} marks: paste them into any scene.`))}),document.addEventListener("paste",a=>{if(a.target.closest?.("input, textarea, select, [contenteditable], .cm-editor"))return;const l=[...a.clipboardData?.files||[]],d=a.clipboardData?.getData("text/plain")||"";!l.length&&!d.trim()||(a.preventDefault(),this.pasteContent({files:l,text:d}).catch(c=>this.log(`Paste: ${c.message}`,"error")))}),this.log("Workbench ready.")}registerPanels(){const e=this.embed?.panels,t=(o,i,s,r,a,l={})=>{(!e||e.includes(o))&&this.docks.register({id:o,title:i,icon:s,natural:r,mount:d=>a(d,this),...l})};t("scenes","Scenes","scenes","left",zi),t("boards","Boards","board","left",Wc),t("stages","Stages","stages","left",Ui),t("outliner","Outliner","layers","left",Kc),this.embed&&t("properties","Properties","properties","left",Oo),t("assets","Assets","assets","left",o=>this.mountAssets(o)),t("sources","Sources","source","left",_i),t("gestures","Gestures","hand","left",Wi),this.embed||t("properties","Properties","properties","right",Oo),t("script","Code","script","right",Gi),t("process","Process","process","right",Hi),t("generate","Generate","sparkles","right",Ri),t("assistant","Assistant","chat","right",Ni),t("decide","Decide","exercise","right",Di),t("docs","Docs","book","right",ji),t("settings","Settings","gear","right",qi),t("shortcuts","Shortcuts","keyboard","right",Ki),t("timeline","Timeline","film","bottom",Fi),t("history","History","history","bottom",Ji),t("log","Log","log","bottom",Vi,{allowBottom:!0,openByDefault:!1})}mountAssets(e){this.assetPanel=new Xi({store:this.assetStore,onOpen:t=>this.openAsset(t),onPlaylist:(t,o,i)=>this.playlistMenu([this.playlistItemForAsset(t)],o,i),onSelect:t=>{this.selectedAsset=t?.id||null,t&&(this.canvas.select([]),this.canvas.selectBoard(null)),this.emit("asset")},onPlace:t=>{const o=this.canvas;this.placeAsset(t.id,o.toWorld(o.w/2,o.h/2)).catch(i=>this.log(i.message,"error"))},onUseAsReference:t=>this.setReferenceFromBlob(t.blob,t.title),onExport:t=>t.kind==="dataset"&&t.program?.jsonl?Se(t.program.jsonl,`${t.title}.jsonl`,"application/jsonl"):Se(t.blob,`${t.title}.png`,t.blob.type)}),this.assetPanel.render(e)}async openAsset(e){if(e.kind==="stream"&&e.meta?.stream){await this.streamAsset(e);return}if(!(e.program?.type==="ams-process"||e.program?.actions)&&(e.kind==="video"||/^(video|image)\//.test(e.blob?.type||""))){await this.previewAsset(e);return}if(e.kind==="audio"||e.kind==="text"){this.docks.open("timeline"),this.log(`Drag “${e.title}” onto the Timeline (or the canvas, for text).`);return}if(e.kind==="take"&&e.program?.clips){await this.openTake(e.id);return}if(e.kind==="walkthrough"&&e.program?.steps){await this.walkthroughs.loadUser(),this.walkthroughs.start(e.program.id);return}if(e.kind==="dataset"&&e.program?.jsonl){this.docks.open("decide");const o=this.decider.importJSONL(e.program.jsonl);this.log(`Dataset “${e.title}”: ${o} new decision labels added to Decide.`);return}if(e.program?.type==="ams-process"){await this.scenes.create({doc:e.program,title:e.title}),this.log(`Opened “${e.title}” as a new scene.`);return}if(e.program?.actions){const o=vo(e.program,{title:e.title,width:e.width||1e3,height:e.height||1e3});await this.scenes.create({doc:o,title:e.title}),this.log(`Opened “${e.title}” (converted from the first-phase drawing language).`);return}await this.setReferenceFromBlob(e.blob,e.title)}async streamAsset(e,t=null){const o=e.meta.stream,i=this.sources.list.find(l=>l.meta?.source===o.page&&l.meta?.assetId===e.id);if(i){const l=V(this.store.doc).find(d=>d.source===i.name&&!d.code);if(l)return this.goToBoard(l.id,{animate:!0}),l}const s=this.canvas,r=await this.addSourceUrl(o.page,{quality:o.quality||"480",start:o.start,end:o.end,title:o.note,lazy:!0,asset:!1,at:t||s.toWorld(s.w/2,s.h/2),assetId:e.id}),a=V(this.store.doc).find(l=>l.source===r&&!l.code);return a&&(this.store.updateBoard(a.id,{title:e.title}),this.applyAssetDefaults(r,a,e)),a}async addSourceUrl(e,{quality:t="480",start:o=null,end:i=null,title:s=null,lazy:r=!1,place:a=!0,asset:l=!0,at:d=null,assetId:c=null}={}){const{resolveMediaUrl:h}=await Ve(async()=>{const{resolveMediaUrl:b}=await import("./mediaUrl-xviUjwxp.js");return{resolveMediaUrl:b}},[],import.meta.url),u=await h(e,{quality:t}),f=await this.sources.add({kind:"url",url:u.url,mediaKind:u.kind,name:u.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)||"link",lazy:r,meta:{title:u.title,license:u.license,artist:u.artist,source:u.source,assetId:c,height:u.height,width:u.srcHeight?Math.round(u.srcHeight*(u.width/u.srcHeight)):null,srcWidth:u.width,srcHeight:u.srcHeight,note:s}});u.kind==="video"&&this.sources.update(f,{speed:0});const p=this.sources.entries.get(f)?.live?.video?.duration||u.duration;p&&(o!=null||i!=null)&&this.sources.update(f,{in:Math.max(0,(o??0)/p),out:Math.min(1,(i??p)/p)}),!r&&p&&o!=null&&(this.sources.entries.get(f).live.video.currentTime=o),this.log(`Source “${f}”: streamed from ${new URL(u.url).host}${u.license?` (${u.license}${u.artist?`, ${u.artist}`:""})`:""}.`);const m=this.canvas;if(a&&await this.placeSource(f,d||m.toWorld(m.w/2,m.h/2)),l&&!c){const b=`stream:${u.source}${o!=null?`#${o}-${i}`:""}`;await this.assetStore.get(b).catch(()=>null)||await this.assetStore.addStream({id:b,title:u.title,page:e,quality:t,start:o,end:i,note:"",license:u.license,artist:u.artist,folder:"Streams"})}return f}async buildSamplesScene(){const e=(await this.assetStore.all()).filter(l=>l.folder==="Samples"&&l.blob&&/^(video|image)\//.test(l.blob.type)).sort((l,d)=>String(l.title).localeCompare(d.title));if(!e.length)throw new Error("No samples in Assets (Samples folder)");await this.scenes.create({title:"Samples"});const t=4,o=1e3,i=1100;let s=0;for(const l of e){let d=this.sources.list.find(h=>h.kind==="asset"&&h.assetId===l.id)?.name;d||(d=await this.sources.add({kind:"asset",assetId:l.id}),this.sources.entries.get(d)?.live?.kind==="video"&&this.sources.update(d,{speed:0}));const c=await this.placeSource(d,[s%t*o+1300,Math.floor(s/t)*i+100],{go:!1});this.store.updateBoard(c.id,{title:l.title}),s++}const{STREAM_SAMPLES:r}=await Ve(async()=>{const{STREAM_SAMPLES:l}=await Promise.resolve().then(()=>qs);return{STREAM_SAMPLES:l}},void 0,import.meta.url);let a=0;for(const l of r){try{const d=await this.addSourceUrl(l.page,{quality:l.quality||"480",start:l.start,end:l.end,title:l.note,lazy:!0,place:!1,asset:!1}),c=await this.placeSource(d,[s%t*o+1300,Math.floor(s/t)*i+100],{go:!1}),h=this.sources.def(d)?.meta||{};this.store.updateBoard(c.id,{title:l.title,text:[l.note,h.license&&`${h.license}${h.artist?`, ${h.artist}`:""}`,"Streamed: nothing is downloaded."].filter(Boolean).join(`  
`)}),s++,a++}catch(d){this.log(`Samples: ${l.title}: ${d.message}`,"error")}await new Promise(d=>setTimeout(d,900))}return this.fitAllBoards(),e.length+a}playlistItemForBoard(e){const t=e.source&&this.sources.def(e.source);return t?t.meta?.assetId&&t.kind==="url"?{kind:"stream",ref:t.meta.assetId}:t.kind==="asset"?{kind:"asset",ref:t.assetId}:t.kind==="url"?{kind:"url",ref:t.meta?.source||t.url}:{kind:"source",ref:t.name}:{kind:"board",ref:e.title}}playlistItemForAsset(e){return e.kind==="stream"?{kind:"stream",ref:e.id}:{kind:"asset",ref:e.id}}async playlistAddMenu(e,t,o){const i=this.store.doc,s=h=>this.playlists.addItem(e,h),r=V(i).filter(h=>h.id!==e&&h.kind!=="playlist"&&h.kind!=="frame"&&!h.main),a=await this.assetStore.all(),l=a.filter(h=>h.kind==="stream"),d=[...new Set(l.map(h=>h.folder))].sort(),c=a.filter(h=>h.kind!=="stream"&&/^(video|image)\//.test(h.blob?.type||"")&&!h.program);Ie([{label:"Add to the playlist"},r.length?{label:"A board",hint:"It runs alone and the view goes to it",items:r.map(h=>({label:h.title,run:()=>s({kind:"board",ref:h.title})}))}:null,this.sources.list.length?{label:"A source",items:this.sources.list.map(h=>({label:h.name,run:()=>s({kind:"source",ref:h.name})}))}:null,d.length?{label:"A stream",items:d.map(h=>({label:h.replace(/^Streams\/?/,"")||"Streams",items:l.filter(u=>u.folder===h).map(u=>({label:u.title,run:()=>s({kind:"stream",ref:u.id})}))}))}:null,c.length?{label:"A clip or picture",items:c.map(h=>({label:h.title,run:()=>s({kind:"asset",ref:h.id})}))}:null,"-",{label:"An address…",hint:"A video or picture URL, or a Wikipedia / Commons File: page",run:async()=>{const h=await od("Address (https://…)","");h&&s({kind:"url",ref:h.trim()})}}].filter(Boolean),t,o)}newPlaylist(e,t=null,o=""){const i=t||{x:0,y:0,width:400},s=this.store.addBoard({title:"Playlist",x:Math.round(i.x+i.width+80),y:Math.round(i.y),width:440,height:360,ground:"#1c1c1c",adopt:!1});return this.store.updateBoard(s.id,{kind:"playlist",code:zr({target:o,loop:!0,items:e})}),this.setBoardLive(s.id,!0),s}playlistMenu(e,t,o,i=null){const s=V(this.store.doc).filter(a=>a.kind==="playlist"),r=i&&e[0]?.kind!=="board"?i.title:"";Ie([{label:`Add ${e.length>1?`${e.length} items`:"it"} to a playlist`},...s.map(a=>({label:a.title,run:()=>{for(const l of e)this.playlists.addItem(a.id,l)}})),s.length?"-":null,{label:"New playlist",run:()=>{const a=this.newPlaylist(e,i,r);this.canvas.selectBoard(a.id)}}].filter(Boolean),t,o)}captureOf(e){return this.sources.list.find(t=>t.kind==="board"&&t.boardId===e)||null}async setBoardCapture(e,t=!this.captureOf(e)){const o=this.captureOf(e),i=ie(this.store.doc,e);if(!i)return null;if(!t)return o&&this.sources.remove(o.name),this.emit("document","capture"),null;if(o)return o.name;const s=await this.sources.add({kind:"board",boardId:e,name:String(i.title).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)||"board"});return this.log(`Board “${i.title}” is a source: source('${s}') in code.`),this.emit("document","capture"),s}fitAllBoards(e=60){const t=V(this.store.doc).filter(d=>d.kind!=="frame");if(!t.length)return;const o=Math.min(...t.map(d=>d.x)),i=Math.min(...t.map(d=>d.y)),s=Math.max(...t.map(d=>d.x+d.width)),r=Math.max(...t.map(d=>d.y+d.height)),a=this.canvas,l=Math.min((a.w-2*e)/(s-o),(a.h-2*e)/(r-i),2);a.cam={z:l,x:a.w/2-(o+s)/2*l,y:a.h/2-(i+r)/2*l+10},a.saveCam?.(),a.invalidate()}applyAssetDefaults(e,t,o){const i=o?.meta?.defaults;if(!i)return;const s={};i.speed!=null&&(s.speed=i.speed),i.loop!=null&&(s.loop=i.loop),i.volume!=null&&(s.volume=i.volume),Object.keys(s).length&&this.sources.update(e,s),t&&(i.opacity!=null||i.blend||i.fit)&&this.setBoardSourceLook(t.id,{...i.opacity!=null?{opacity:i.opacity}:{},...i.blend?{blend:i.blend}:{},...i.fit?{fit:i.fit}:{}})}async previewAsset(e,t=null){let o=this.sources.list.find(a=>a.kind==="asset"&&a.assetId===e.id)?.name;if(!o){o=await this.sources.add({kind:"asset",assetId:e.id}),this.sources.entries.get(o)?.live?.kind==="video"&&this.sources.update(o,{speed:0});const a=this.sources.entries.get(o)?.live?.video?.duration,l=e.meta?.defaults;a&&(l?.in!=null||l?.out!=null)&&this.sources.update(o,{in:(l.in??0)/a,out:(l.out??a)/a})}const i=V(this.store.doc).find(a=>a.source===o&&a.title===o&&!a.code);if(i)return this.addPlayer(o,i),this.goToBoard(i.id,{animate:!0}),i;const s=this.canvas,r=await this.placeSource(o,t||s.toWorld(s.w/2,s.h/2));return this.applyAssetDefaults(o,r,e),this.log(`Source “${o}”: source('${o}') in code; a board previews it.`),r}async setReferenceFromBlob(e,t="reference"){const o=new Image;o.src=URL.createObjectURL(e),await o.decode(),this.reference={img:o,opacity:this.reference?.opacity??(Number(localStorage.getItem("ams_ref_opacity"))||.35),visible:!0,title:t},this.log(`Reference: ${t} (under the artboard; not part of the picture).`),this.canvas.invalidate(),this.renderChrome()}followSources(){const e=new Map,t=new Map;this.sources.lazyWanted=a=>V(this.store.doc).some(l=>(l.source===a||l.maskWith?.source===a)&&this.isBoardActive(l.id,l)&&l.width*this.canvas.cam.z>=240),this.sources.wanted=a=>io(a,1500)||V(this.store.doc).some(l=>(l.source===a||l.maskWith?.source===a||l.follow&&o(l.code,a))&&this.isBoardActive(l.id,l));const o=(a,l)=>new RegExp(`\\b(source|fit)\\(\\s*['"\`]${l.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}['"\`]`).test(a||"");this.sources.on(a=>{if(!a){this.renderChrome();return}const l=this.store.doc;(V(l).some(d=>d.source===a||d.maskWith?.source===a)||io(a))&&this.canvas?.invalidate();for(const d of V(l))!d.follow||Re(d)||!o(d.code,a)||!this.isBoardActive(d.id,d)||s(d)}),Gl(a=>{const l=ie(this.store.doc,a);l?.code&&!Re(l)&&this.isBoardActive(l.id,l)&&s(l,!0)});let i=1;this.followClock=setInterval(()=>{if(document.hidden)return;const a=performance.now();for(const l of V(this.store.doc)){const d=Re(l);if(!d||!l.follow||!l.code||t.has(l.id)||!this.isBoardActive(l.id,l))continue;const c=e.get(l.id);c&&a-c.at<Math.max(1e3/d,1.5*c.took)||r(l,{seed:++i,fresh:!0})}},8);const s=(a,l=!1)=>{if(t.has(a.id))return;const d=performance.now()-(e.get(a.id)?.at||0),c=l?0:Math.max(0,Math.max(30,2*(e.get(a.id)?.took||0))-d);t.set(a.id,setTimeout(()=>{t.delete(a.id);const h=ie(this.store.doc,a.id);!h?.code||!h.follow&&!l||r(h)},c))},r=(a,l={})=>{const d=a,c=performance.now(),h=this.store.runBoardCode(d.id,a.code,tt,{by:"code",transient:!0,...l});e.set(d.id,{at:performance.now(),took:performance.now()-c}),h.error&&!e.get(`${d.id}:err`)&&(e.set(`${d.id}:err`,!0),this.log(`Board “${a.title}” (following): ${h.error}`,"error")),h.error||e.delete(`${d.id}:err`)}}isBoardLive(e){const t=this.store.doc,o=ie(t,e);if(!o||o.paused||o.hidden)return!1;if(o.id===(this.activeBoard||H)||o.live)return!0;const i=ie(t,this.activeBoard||H);return rt(i)&&Tn(t,i).some(s=>s.id===o.id)}toggleBoardRun(e){const t=this.isBoardLive(e);this.store.change(t?"board paused":"board live",o=>{const i=!e||e===H?o.artboard:o.boards.find(s=>s.id===e);i&&(t?(i.paused=!0,delete i.live):(delete i.paused,(e||H)!==(this.activeBoard||H)&&(i.live=!0)))})}soloOnly(e){this.isBoardLive(e)&&V(this.store.doc).filter(t=>t.kind!=="frame"&&t.id!==e).every(t=>t.paused)||this.soloBoard(e)}soloBoard(e){const o=V(this.store.doc).filter(s=>s.kind!=="frame").filter(s=>s.id!==e),i=this.isBoardLive(e)&&o.every(s=>s.paused);this.store.change(i?"boards play":"solo board",s=>{const r=[{t:s.artboard,id:H},...s.boards.map(a=>({t:a,id:a.id}))];for(const{t:a,id:l}of r)if(a.kind!=="frame"){if(i){delete a.paused;continue}l===e?(delete a.paused,l!==(this.activeBoard||H)&&(a.live=!0)):(a.paused=!0,delete a.live)}}),this.log(i?"All boards play.":`Solo: only “${ie(this.store.doc,e)?.title}” runs.`)}boardFromSelection(e){const t=this.canvas.selectionBounds();if(!t||!e.length)return null;const o=40,i=Math.floor(t.x0-o),s=Math.floor(t.y0-o),r=Math.max(40,Math.ceil(t.x1+o-i)),a=Math.max(40,Math.ceil(t.y1+o-s)),l=this.store.doc.elements.find(h=>e.includes(h.id)),d=ie(this.store.doc,l?.board||H),c=this.store.addBoard({title:`Board ${V(this.store.doc).length}`,x:i,y:s,width:r,height:a,ground:d?.ground,adopt:!1});return this.store.change("marks to board",h=>{for(const u of h.elements)e.includes(u.id)&&(u.board=c.id)}),this.canvas.select([]),this.canvas.selectBoard(c.id),this.log(`Board “${c.title}” from ${e.length} mark${e.length===1?"":"s"}.`),c}isBoardActive(e,t=ie(this.store.doc,e)){return!!t&&this.isBoardLive(e)&&this.canvas.boardOnScreen(t,0)}setBoardLive(e,t){this.store.change(t?"board live":"board paused",o=>{const i=!e||e===H?o.artboard:o.boards.find(s=>s.id===e);i&&(t?(i.live=!0,delete i.paused):delete i.live)})}bakeMarks(e,{rect:t=null,title:o="baked",board:i=void 0,also:s=null,format:r="png"}={}){const a=this.store.doc,l=new Set(e),d=a.elements.filter(p=>l.has(p.id)&&p.role!=="note"&&p.points?.length);if(!d.length)return null;if(!t){const p=d.flatMap(k=>k.points.map(v=>v[0])),m=d.flatMap(k=>k.points.map(v=>v[1])),b=Math.min(...p),g=Math.min(...m),w=Math.max(...p),y=Math.max(...m),S=.04*Math.max(w-b,y-g)+24;t={x:b-S,y:g-S,width:w-b+2*S,height:y-g+2*S}}let c;if(r==="svg"){const p={...a,boards:[],artboard:{width:Math.ceil(t.width),height:Math.ceil(t.height),ground:"transparent"},elements:d.map(m=>({...m,board:void 0,points:m.points.map(([b,g,w,y])=>[b-t.x,g-t.y,w,y])}))};c=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(Bt(p,{mode:"picture"}))}`}else{const p=Math.min(2,4096/Math.max(t.width,t.height)),m=document.createElement("canvas");m.width=Math.max(1,Math.round(t.width*p)),m.height=Math.max(1,Math.round(t.height*p)),bt(m.getContext("2d"),{...a,elements:d},{mode:"picture",transform:{x:-t.x*p,y:-t.y*p,scale:p},ground:!1,frozen:!0,now:Date.now()}),c=m.toDataURL("image/png")}const h=new Set(d.map(p=>p.id)),u=i!==void 0?i:d[0].board,f=this.store.change(`bake ${o}`,p=>{p.elements=p.elements.filter(S=>!h.has(S.id)),s?.(p);const{x:m,y:b,width:g,height:w}=t,y=Ne({role:"image",src:c,label:`${o} (baked${r==="svg"?", SVG":""})`,why:`baked from ${d.length} marks`,bake:{count:d.length,ids:[...h].slice(0,500),at:Date.now(),format:r},points:[[m,b,0,.5],[m+g,b,0,.5],[m+g,b+w,0,.5],[m,b+w,0,.5]],...u&&u!==H?{board:u}:{}},d[0].stage||this.activeStage.id);return p.elements.push(y),y});return this.log(`Baked ${d.length} marks into one ${r==="svg"?"SVG":"PNG"} image (undo brings them back).`),f}bakeBoard(e,t="png"){const o=ie(this.store.doc,e);if(!o)return null;const i=this.store.doc.elements.filter(s=>(s.board||H)===o.id).map(s=>s.id);return i.length?this.bakeMarks(i,{format:t,rect:{x:o.x,y:o.y,width:o.width,height:o.height},title:o.title,board:o.id,also:s=>{delete(o.main?s.artboard:s.boards.find(r=>r.id===o.id)).follow}}):(this.log(`“${o.title}” has no marks to bake.`),null)}async convertBoard(e,t){const o=ie(this.store.doc,e);if(!o)return null;let i,s,r={width:o.width,height:o.height},a=o.ground;if(t==="p5"){if(we(o)!=="drawing"||!o.code)return this.log(`“${o.title}” has no studio code to convert.`,"error"),null;i="p5",s=(await this.p5CodeFor(o.id)).code}else{const c=we(o)==="p5"&&Jo(o.code);if(!c)return this.log(`“${o.title}” is not a sketch the studio wrote: only those convert back (bake it to an image instead).`,"error"),null;i="drawing",s=c.code,r={width:c.width||o.width,height:c.height||o.height},a=c.ground||o.ground}const l=`${o.title.replace(/ · (p5|studio)$/,"")} · ${t}`,d=this.store.addBoard({title:l,...r,ground:a});return this.store.updateBoard(d.id,{kind:i,code:s}),i==="drawing"&&this.store.runBoardCode(d.id,s,tt),(o.follow||o.live)&&this.setBoardLive(d.id,!0),this.goToBoard(d.id,{animate:!0}),this.log(`“${l}”: ${t==="p5"?"the board as a p5.js sketch (the same code runs in the p5 editor, with its pictures uploaded)":"the sketch as studio code"}.`),d}async copyBoard(e,t){const o=ie(this.store.doc,e);if(o)try{if(t==="png"){const i=await Wn(this.boardPicture(o,2,"picture"));await navigator.clipboard.write([new ClipboardItem({"image/png":i})])}else{const i=t==="svg"?Bt(Be(this.store.doc,o.id),{mode:"picture"}):t==="json"?JSON.stringify(Go(this.store.doc,o.id)):t==="p5"?we(o)==="p5"?o.code:(await this.p5CodeFor(o.id))?.code||Mn(Be(this.store.doc,o.id),{version:this.p5Version()}):o.code||"";await navigator.clipboard.writeText(i)}this.log(`Copied “${o.title}” as ${t==="code"?"its code":t.toUpperCase()}.`)}catch(i){this.log(`Copy: ${i.message}`,"error")}}async openLink(e,t=""){const o=String(e||"").trim();if(/^scene:/i.test(o)){const s=this.scenes.all.find(r=>r.title.toLowerCase()===o.slice(6).trim().toLowerCase());s?await this.scenes.switchTo(s.id):this.log(`No scene “${o.slice(6)}”.`,"error");return}if(/^asset:/i.test(o)){const s=(await this.assetStore.all()).find(r=>String(r.title).toLowerCase()===o.slice(6).trim().toLowerCase());s?this.openAsset(s):this.log(`No asset “${o.slice(6)}”.`,"error");return}const i=ke(this.store.doc,o);if(!i){this.log(`No board “${o}” in this scene.`,"error");return}this.goToBoard(i.id,{animate:!0})}setBoardFollow(e,t){this.store.change(t?"follow sources":"stop following",o=>{const i=!e||e===H?o.artboard:o.boards.find(s=>s.id===e);i&&(t?(i.follow=!0,delete i.paused):delete i.follow)})}async placeSource(e,t,{go:o=!0}={}){await this.sources.whenReady([e],5e3);const i=this.sources.entries.get(e)?.live?.video;for(let p=0;i&&!i.videoWidth&&p<50;p++)await new Promise(m=>setTimeout(m,100));const s=this.sources.view(e),r=800,a=this.sources.def(e)?.meta||{},l=i?.videoWidth||s?.width||a.srcWidth||4,d=i?.videoHeight||s?.height||a.srcHeight||3,c=r/Math.max(l,d),h=Math.round(l*c),u=Math.round(d*c),f=this.store.addBoard({title:e,width:h,height:u,x:Math.round(t[0]-h/2),y:Math.round(t[1]-u/2),adopt:!1});return this.setBoardSource(f.id,e,1),this.setBoardLive(f.id,!0),this.addPlayer(e,f),o&&this.goToBoard(f.id,{animate:!0}),f}playableSource(e){const t=e?.source,o=t&&this.sources.def(t);return t&&(this.sources.entries.get(t)?.live?.position?.()||o?.lazy&&o.mediaKind==="video")?t:null}mediaState(e){const t=this.sources.entries.get(e)?.live?.position?.()||null,o=this.sources.def(e)?.speed??1,i=this.sources.entries.get(e)?.live,s=this.sources.def(e);return{pos:t,speed:o,playing:o>0,loop:s?.loop!==!1,inP:s?.in??0,outP:s?.out??1,volume:this.sources.def(e)?.volume??0,sound:i?.hasAudio?.()??null}}mediaAct(e,t,o){const i=this.sources,s=i.entries.get(e)?.live,r=i.def(e)?.speed??1;if(!s)return;this.mediaLast||=new Map;const a=()=>{r>0&&(this.mediaLast.set(e,r),i.update(e,{speed:0}))};if(t==="play")r>0?a():(s.atEnd?.()&&s.seek(i.def(e)?.in??0),i.update(e,{speed:this.mediaLast.get(e)||1}));else if(t==="loop")i.update(e,{loop:i.def(e)?.loop===!1});else if(t==="in"||t==="out"){const l=s.position?.()?.fraction??0,d=i.def(e)||{};i.update(e,t==="in"?{in:Math.min(l,d.out??1)}:{out:Math.max(l,d.in??0)})}else if(t==="range")i.update(e,{in:0,out:1});else if(t==="step")a(),s.step(o);else if(t==="seek")s.seek(o);else if(t==="speed")i.update(e,{speed:Number(o)});else if(t==="volume")i.update(e,{volume:Math.max(0,Math.min(1,Number(o)))});else if(t==="mute"){const l=i.def(e)?.volume??0;l>0?(this.mediaLast.set(`${e}:vol`,l),i.update(e,{volume:0})):i.update(e,{volume:this.mediaLast.get(`${e}:vol`)||.7})}this.canvas.invalidate()}playerShown(e){return e?.kind==="player"?!e.hidden:!!(e?.controls&&this.playableSource(e))}togglePlayer(e){if(this.playableSource(e)){if(e.kind==="player"){this.setBoardFlag(e.id,"hidden",!e.hidden);return}this.store.updateBoard(e.id,{controls:!e.controls}),this.canvas.invalidate()}}addPlayer(e,t){const o=this.sources.entries.get(e)?.live,i=this.sources.def(e);if(!o?.position?.()&&!(i?.lazy&&i.mediaKind==="video")||t.kind==="player")return null;const s=V(this.store.doc).find(r=>r.kind==="player"&&r.source===e);return s||(this.store.updateBoard(t.id,{controls:!0}),t)}sourceDemo(e,t,o){const i=Ms.find(r=>r.id===t);if(!i)return;ie(this.store.doc,e)?.source&&this.setBoardSource(e,null),this.store.updateBoard(e,{rate:i.rate||0}),this.store.runBoardCode(e,i.code(o),this.runScript||tt),this.setBoardFollow(e,!0),this.openCode?.("board",e)}setBoardMask(e,t,o){const i=t&&{...t};if(i)for(const s of Object.keys(i))i[s]===void 0&&delete i[s];this.store.updateBoard(e,{maskWith:i},o),this.canvas.invalidate(),this.renderChrome?.()}setBoardFx(e,t,o,i){this.store.updateBoard(e,{[t]:o},i),this.canvas.invalidate(),this.renderChrome?.()}makeMask(e){const t=this.store.doc,o=t.elements.filter(a=>e.includes(a.id));if(!o.length)return null;const i=o[0].board&&o[0].board!==ve?o[0].board:H,s=ie(t,i);if(!s)return null;let r=null;return this.store.change("make mask",a=>{const l=Nn(a),d=en(a,s.width,s.height),c={id:l,title:`${s.title} · mask`,...d,ground:s.ground};a.boards.push(c);const h=c.x-s.x,u=c.y-s.y;for(const p of a.elements)e.includes(p.id)&&(p.board=l,p.points=p.points.map(([m,b,g,w])=>[m+h,b+u,g,w]));const f=i===H?a.artboard:a.boards.find(p=>p.id===i);f.maskWith={board:l,mode:"alpha"},r=c}),this.canvas.select([]),this.log(`“${s.title}” is masked by ${o.length} mark${o.length===1?"":"s"}, now on the board “${r.title}”.`),r}setBoardSourceLook(e,t){this.store.change("board source look",o=>{const i=!e||e===H?o.artboard:o.boards.find(s=>s.id===e);i?.source&&("opacity"in t&&(i.sourceOpacity=Math.max(0,Math.min(1,Number(t.opacity)))),"blend"in t&&(t.blend&&t.blend!=="normal"?i.sourceBlend=t.blend:delete i.sourceBlend),"fit"in t&&(t.fit==="contain"?i.sourceFit="contain":delete i.sourceFit))})}setBoardSource(e,t,o,i="cover"){this.store.change(t?"board source":"no board source",s=>{const r=!e||e===H?s.artboard:s.boards.find(a=>a.id===e);r&&(t||delete r.sourceBlend,t?(r.source=t,r.sourceOpacity=o??r.sourceOpacity??.5,i==="contain"?r.sourceFit="contain":delete r.sourceFit):(delete r.source,delete r.sourceOpacity,delete r.sourceFit))})}drawReference(e){for(const l of V(this.store.doc)){if(this.canvas.composedIds?.has(l.id))continue;const d=l.source&&(l.sourceOpacity??.5)>0&&this.composer.underlay(l);if(!d?.width)continue;const c=(l.sourceFit==="contain"?Math.min:Math.max)(l.width/d.width,l.height/d.height),h=d.width*c,u=d.height*c;e.save(),e.beginPath(),e.rect(l.x,l.y,l.width,l.height),e.clip(),e.globalAlpha=l.sourceOpacity??.5,l.sourceBlend&&l.sourceBlend!=="normal"&&(e.globalCompositeOperation=l.sourceBlend),e.drawImage(d,l.x+(l.width-h)/2,l.y+(l.height-u)/2,h,u),e.restore()}const t=this.reference;if(!t?.visible)return;const{width:o,height:i}=this.store.doc.artboard,s=Math.max(o/t.img.naturalWidth,i/t.img.naturalHeight),r=t.img.naturalWidth*s,a=t.img.naturalHeight*s;e.save(),e.beginPath(),e.rect(0,0,o,i),e.clip(),e.globalAlpha=t.opacity,e.drawImage(t.img,(o-r)/2,(i-a)/2,r,a),e.restore()}renderChrome(){if(!this.topbar)return;this.store.doc;const e=M("div",{class:"wb-island wb-tools-island"}),t=je.find(h=>h[0]===this.tool)||je.find(h=>h[0]===this.selectTool)||je[0],o=(h,u)=>Ie([{label:"Select"},...je.map(([f,p,m])=>({icon:te(f),active:f===t[0],label:p.split(":")[0],hint:p,keys:m,run:()=>this.setTool(f)}))],h,u),i=M("button",{class:`wb-tool wb-tool-stack${je.some(h=>h[0]===this.tool)?" on":""}`,"data-guide":`tool:${t[0]}`,title:`${t[1]} (${t[2]}). Click again or right-click for select and direct`,html:`${te(t[0])}<kbd>${t[2].replace("⇧","")}</kbd><span class="wb-tool-caret"></span>`});i.addEventListener("click",()=>{if(je.some(h=>h[0]===this.tool)){const h=i.getBoundingClientRect();o(h.left,h.bottom+4)}else this.setTool(t[0])}),i.addEventListener("contextmenu",h=>{h.preventDefault(),o(h.clientX,h.clientY)}),e.append(i);for(const h of Xo){if(!h){e.append(M("div",{class:"wb-sep"}));continue}const[u,f,p]=h;if(u==="select")continue;if(u==="plane"){e.append(this.planeStackButton());continue}if(u==="line"){e.append(this.lineStackButton());continue}const m=["point","line","plane"].includes(u);e.append(M("button",{class:`wb-tool${this.tool===u?" on":""}`,"data-guide":`tool:${u}`,title:`${f} (${p})${m?" · right-click: brush and look for new marks":""}`,html:`${te(u)}<kbd>${p}</kbd>`,onclick:()=>this.setTool(u),oncontextmenu:m?b=>{b.preventDefault();const g=b.currentTarget.getBoundingClientRect();Yn(this,u,g.left,g.bottom+6)}:null}))}const s=Z[this.brush.id]||Z.ink,r=M("button",{class:`wb-tool wb-tool-stack${this.tool==="brush"?" on":""}`,"data-guide":"tool:brush",title:`Brush: ${s.label} (B). Click again or right-click for the brushes`,html:`${Gt(this.brush.id)}<kbd>B</kbd><span class="wb-tool-caret"></span>`});r.addEventListener("click",()=>{if(this.tool==="brush"){const h=r.getBoundingClientRect();this.brushMenu(h.left,h.bottom+4)}else this.setTool("brush")}),r.addEventListener("contextmenu",h=>{h.preventDefault(),this.brushMenu(h.clientX,h.clientY)});const a=$e[this.sculpt.tool],l=M("button",{class:`wb-tool wb-tool-stack${this.tool==="sculpt"?" on":""}`,"data-guide":"tool:sculpt",title:`Sculpt: ${a?.label} (S; Shift+drag over a mark with other tools). Click again for the sculpt tools · right-click: this brush's settings (Option+right-click: the list)`,html:`${un(this.sculpt.tool)}<kbd>S</kbd><span class="wb-tool-caret"></span>`});l.addEventListener("click",h=>{if(this.tool==="sculpt"){const u=l.getBoundingClientRect();this.sculptMenu(u.left,u.bottom+4)}else this.setTool("sculpt")}),l.addEventListener("contextmenu",h=>{if(h.preventDefault(),h.altKey){this.sculptMenu(h.clientX,h.clientY);return}const u=l.getBoundingClientRect();this.tool!=="sculpt"&&this.setTool("sculpt"),pt(this,u.left,u.bottom+6)}),e.append(M("div",{class:"wb-sep"}),r,l);const d=this.shortcuts?.label("view.snap")||"";e.append(M("div",{class:"wb-sep"}),this.paintSwatches(),M("div",{class:"wb-sep"}),M("button",{class:`wb-tool${this.canvas.grid.snap?" on":""}`,"data-guide":"tool:snap",title:`Snap to grid${d?` (${d})`:""} · right-click: grid and drawing settings`,html:te("snap"),onclick:()=>this.canvas.setGrid({snap:!this.canvas.grid.snap}),oncontextmenu:h=>{h.preventDefault(),uo(this,h.clientX,h.clientY+8)}}));{const[h,u,f]=Rd;e.append(M("div",{class:"wb-sep"}),M("button",{class:`wb-tool${this.tool===h?" on":""}`,"data-guide":`tool:${h}`,title:`${u} (${f})`,html:`${te(h)}<kbd>${f}</kbd>`,onclick:()=>this.setTool(h)}))}const c=M("div",{class:"wb-island wb-view-island"},M("button",{class:"wb-tool","data-guide":"menu",title:"Menu",html:te("menu"),onclick:h=>this.openMenu(h.currentTarget)}),M("div",{class:"wb-sep"}),M("button",{class:"wb-tool","data-guide":"view",title:this.view.mode==="process"?"Process: guides, gestures and notes shown (\\ for the picture)":"Picture: the finished picture (\\ for the process)",html:te(this.view.mode==="process"?"viewProcess":"viewPicture"),onclick:()=>this.setViewMode(this.view.mode==="picture"?"process":"picture")}),this.reference?M("button",{class:`wb-tool${this.reference.visible?" on":""}`,title:`Reference underlay: ${this.reference.title} (R toggles)`,html:te("picture"),onclick:()=>{this.reference.visible=!this.reference.visible,this.canvas.invalidate(),this.renderChrome()}}):null,M("button",{class:`wb-tool${this.canvas.showPoints?" on":""}`,title:"Show marks' points (')",html:te("points"),onclick:()=>this.togglePoints()}),M("button",{class:"wb-tool","data-guide":"present",title:"Present the boards (Opt+Cmd+P): ← → to move, Esc to leave",html:te("play"),onclick:()=>this.present(!0)}),M("button",{class:"wb-tool",title:"Theme",html:te(document.documentElement.dataset.theme==="light"?"moon":"sun"),onclick:()=>this.toggleTheme()}));if(this.embed){if(this.zoomBarOn()&&!this.overlay){const h=M("span",{class:"wb-zoom-pct",title:"Zoom: click for 100%",onclick:()=>this.canvas.zoomAt(this.canvas.w/2,this.canvas.h/2,1/this.canvas.cam.z)},`${Math.round((this.canvas?.cam.z||1)*100)}%`);e.append(M("div",{class:"wb-sep wb-zoom-bar"}),M("button",{class:"wb-tool wb-zoom-bar",title:"Zoom out",html:te("down"),onclick:()=>this.canvas.zoomAt(this.canvas.w/2,this.canvas.h/2,1/1.2)}),Object.assign(h,{className:"wb-zoom-pct wb-zoom-bar"}),M("button",{class:"wb-tool wb-zoom-bar",title:"Zoom in",html:te("up"),onclick:()=>this.canvas.zoomAt(this.canvas.w/2,this.canvas.h/2,1.2)}),M("button",{class:"wb-tool wb-zoom-bar",title:"Fit the active board (F)",html:te("fit"),onclick:()=>{this.canvas.fit(60,this.activeBoard||H),this.renderChrome()}}))}e.prepend(M("button",{class:"wb-tool wb-menu-btn","data-guide":"menu",title:"Menu",html:te("menu"),onclick:h=>this.openMenu(h.currentTarget)}),M("div",{class:"wb-sep wb-menu-sep"})),this.topbar.replaceChildren(e,M("div",{class:"wb-topbar-spacer"})),this.makeMovable(e,"tools")}else this.topbar.replaceChildren(c,e,M("div",{class:"wb-topbar-spacer"})),this.makeMovable(c,"view"),this.makeMovable(e,"tools");this.zoomIsland.replaceChildren(M("button",{class:"wb-tool",title:"Zoom out",html:te("down"),onclick:()=>this.canvas.zoomAt(this.canvas.w/2,this.canvas.h/2,1/1.2)}),M("span",{},`${Math.round((this.canvas?.cam.z||1)*100)}%`),M("button",{class:"wb-tool",title:"Zoom in",html:te("up"),onclick:()=>this.canvas.zoomAt(this.canvas.w/2,this.canvas.h/2,1.2)}),M("button",{class:"wb-tool",title:"Fit the active board (F)",html:te("fit"),onclick:()=>{this.canvas.fit(60,this.activeBoard||H),this.renderChrome()}})),this.perfOn&&this.zoomIsland.append(this.perfEl||=M("span",{class:"wb-perf",title:"Frames per second while the canvas redraws · the last redraw · marks. Click: performance under each board",style:{cursor:"pointer"},onclick:()=>this.toggleBoardPerf()})),this.zoomIsland.oncontextmenu=h=>{h.preventDefault(),this.togglePerf()},this.makeMovable(this.zoomIsland,"zoom")}zoomBarOn(){try{return localStorage.getItem("ams_zoom_bar")!=="0"}catch{return!0}}setZoomBar(e){try{localStorage.setItem("ams_zoom_bar",e?"1":"0")}catch{}this.renderChrome()}toggleTheme(){const e=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=e;try{localStorage.setItem("ams_theme",e)}catch{}this.canvas.invalidate(),this.renderChrome()}setLayout({open:e=[],close:t=[],expand:o=[],collapse:i=[],reference:s,view:r,fit:a,find:l}={}){for(const d of e)this.docks.panels.has(d)&&this.docks.open(d);for(const d of t)this.docks.panels.has(d)&&this.docks.close(d);for(const d of o)this.docks.state.collapsed[d]&&this.docks.toggleDock(d);for(const d of i)this.docks.state.collapsed[d]||this.docks.toggleDock(d);if(s&&this.reference&&("visible"in s&&(this.reference.visible=!!s.visible),"opacity"in s&&(this.reference.opacity=Number(s.opacity))),r&&this.setViewMode(r),a&&this.canvas.fit(),l!==void 0&&this.assetPanel){this.docks.open("assets");const d=document.getElementById("assets-q");d&&(d.value=l,d.dispatchEvent(new Event("input")))}return this.canvas.invalidate(),this.renderChrome(),{panels:Object.fromEntries(Object.entries(this.docks.state.active)),collapsed:{...this.docks.state.collapsed},reference:this.reference?{title:this.reference.title,visible:this.reference.visible,opacity:this.reference.opacity}:null,view:this.view.mode}}layoutSnapshot(){return{docks:structuredClone(this.docks.state),view:this.view.mode,reference:this.reference?{visible:this.reference.visible,opacity:this.reference.opacity}:null,regions:this.showRegions}}restoreLayout(e){e&&(this.docks.state=e.docks,this.docks.save?.(),this.docks.render(),this.setViewMode(e.view),e.reference&&this.reference&&Object.assign(this.reference,e.reference),this.showRegions=e.regions,this.canvas.resize(),this.canvas.invalidate(),this.renderChrome())}async placeImage(e,[t,o],{title:i="image",asset:s=null}={}){const r=URL.createObjectURL(e),a=new Image;a.src=r,await a.decode();const l=1600,d=Math.min(1,l/Math.max(a.naturalWidth,a.naturalHeight)),c=document.createElement("canvas");c.width=Math.round(a.naturalWidth*d),c.height=Math.round(a.naturalHeight*d),c.getContext("2d").drawImage(a,0,0,c.width,c.height),URL.revokeObjectURL(r);const h=c.toDataURL(e.type==="image/png"?"image/png":"image/jpeg",.88),f=this.store.doc.artboard.width*.4,p=f*(a.naturalHeight/a.naturalWidth),m=t-f/2,b=o-p/2,g=this.store.addElement({role:"image",stage:this.activeStage.id,src:h,asset:s,label:i,points:[[m,b,0,.5],[m+f,b,0,.5],[m+f,b+p,0,.5],[m,b+p,0,.5]],why:`placed: ${i}`});return this.canvas.select([g.id]),this.log(`Placed “${i}” as an image layer.`),g}async placeAsset(e,t){const o=await this.assetStore.get(e);if(!o)throw new Error("Asset not found");const i=mt(this.store.doc,t[0],t[1]);if(i?.kind==="playlist"){this.playlists.addItem(i.id,this.playlistItemForAsset(o)),this.log(`Added “${o.title}” to “${i.title}”.`);return}if(o.program?.type==="ams-process"){const s=o.program,r=this.store.doc.artboard,a=r.width*.5/(s.artboard?.width||r.width),l=t[0]-s.artboard.width*a/2,d=t[1]-s.artboard.height*a/2,c=this.store.change(`place ${o.title}`,h=>{const u=`group-${Math.random().toString(36).slice(2,8)}`;h.groups=h.groups||{},h.groups[u]={name:o.title},Object.assign(h.brushes=h.brushes||{},s.brushes||{}),Object.assign(h.lines=h.lines||{},s.lines||{});const f=[];for(const p of s.elements||[]){if(p.role==="note")continue;const m=structuredClone(p);m.id=`${p.role}-${Math.random().toString(36).slice(2,9)}`,m.stage=this.activeStage.id,m.group=u,m.points=m.points.map(([b,g,...w])=>[l+b*a,d+g*a,...w]),h.elements.push(m),f.push(m.id)}return f});this.normalizeAfterPlace(),this.canvas.select(c),this.log(`Placed the drawing “${o.title}” as a group (${c.length} marks).`);return}if(o.kind==="text"){const s=(await o.blob.text()).trim().slice(0,4e3),r=this.store.addElement({role:"note",stage:this.activeStage.id,points:[[t[0],t[1],0,.5]],text:s,note:structuredClone(this.defaults("note").note||{}),label:o.title,why:`from “${o.title}”`});this.canvas.select([r.id]);return}if(o.kind==="audio"){this.log("Sound goes on the Timeline: drag it there."),this.docks.open("timeline");return}if(o.kind==="stream"&&o.meta?.stream){await this.streamAsset(o,t);return}if(o.kind==="video"||/^video\//.test(o.blob?.type||"")||o.blob?.type==="image/gif"){await this.previewAsset(o,t);return}if(!o.blob)throw new Error("This asset has no picture");await this.placeImage(o.blob,t,{title:o.title,asset:o.id})}async placeFiles(e,t){const o=r=>/\.json$/i.test(r.name)||r.type==="application/json";for(const r of e.filter(o))await this.importText(await r.text(),t,r.name);e=e.filter(r=>!o(r));let[i,s]=t;for(const r of e.filter(a=>a.type.startsWith("image/")))await this.placeImage(r,[i,s],{title:r.name.replace(/\.[^.]+$/,"")}),i+=30,s+=30}normalizeAfterPlace(){this.store.doc=Me(this.store.doc),this.canvas.invalidate(),this.emit("document","place")}contextItems(e,t){const o=this.contextItemsBase(e,t).filter(s=>!(this.overlay&&s?.label==="Fit artboard"));if(!this.hostActions?.length)return o;const i=[...this.canvas.selected];return[...o.filter(Boolean),"-",...this.hostActions.map(s=>({label:s.label,hint:s.hint,run:()=>this.emit("host-action",s.id,e?i:[])}))]}contextItemsBase(e,[t,o]=[0,0]){const i=p=>this.shortcuts.label(p),s=[...this.canvas.selected];if(!e||!s.length)return[{label:"Select all",keys:i("edit.selectAll"),run:()=>this.canvas.select(this.store.doc.elements.filter(p=>this.canvas.editable(p)).map(p=>p.id))},{label:"Fit artboard",keys:i("view.fit"),run:()=>{this.canvas.fit(),this.renderChrome()}},"-",{label:this.canvas.grid.show==="off"?"Show grid":"Hide grid",run:()=>this.canvas.setGrid({show:this.canvas.grid.show==="off"?"paper":"off"})},{label:this.canvas.grid.snap?"Snap off":"Snap to grid",run:()=>this.canvas.setGrid({snap:!this.canvas.grid.snap})},"-",{label:"Note here",run:()=>{this.setTool("note");const[p,m]=this.canvas.toScreen(t,o);this.canvas.startNote(p,m,t,o)}},{label:"Import here…",hint:"A selection, a board or a scene (.ams.json): marks land here, boards come in as new boards",run:()=>this.importFile([t,o])}];const r=this.store.doc.elements.filter(p=>s.includes(p.id)),a=r.length,l=a===1?r[0]:null,d=r.some(p=>p.group),c=r.some(p=>p.points.length>3&&!["point","note","image"].includes(p.role)),h=l&&!["note","image"].includes(l.role)?jn(l.role,this.store.doc):[],u=this.canvas.cam.z,f=p=>{const m=this.store.simplify(s,p/u);this.log(`Simplified: ${m.before} → ${m.after} points.`)};return[{label:l?l.label||l.role:`${a} elements`},{label:"Arrange",items:[{label:"Bring to front",run:()=>this.store.arrange(s,"front")},{label:"Bring forward",run:()=>this.store.arrange(s,"forward")},{label:"Send backward",run:()=>this.store.arrange(s,"backward")},{label:"Send to back",run:()=>this.store.arrange(s,"back")}]},{label:"Move to stage",items:this.store.doc.stages.map(p=>({label:p.name,run:()=>this.store.patchElements(s,{stage:p.id},"stage")}))},h.length?{label:"Brush",items:h.map(p=>({icon:Gt(p.id),label:p.label,run:()=>this.store.change("brush",m=>{for(const b of m.elements)s.includes(b.id)&&(b.realize={brush:p.id,params:{}})})}))}:null,c?{label:"Sculpt",hint:"Brush the selected marks into shape (Shift+drag over a mark does it with any tool)",items:[...Object.entries($e).map(([p,m])=>({icon:un(p),active:p===this.sculpt.tool,label:`${m.label}`,hint:m.doc,run:()=>{this.setSculpt({tool:p}),this.setTool("sculpt")}})),"-",{label:"Settings…",hint:"Opt+right-click anywhere",run:()=>{const[p,m]=this.canvas.toScreen(t,o),b=this.canvas.canvas.getBoundingClientRect();this.setTool("sculpt"),pt(this,b.left+p,b.top+m)}},{label:"Show code",run:()=>this.openCode?.("sculpt",this.sculpt.tool)}]}:null,c?{label:"Simplify",hint:"Fewer points, same shape",items:[{label:"Lightly",run:()=>f(1.5)},{label:"Moderately",run:()=>f(4)},{label:"Strongly",run:()=>f(10)}]}:null,"-",{label:"Duplicate",run:()=>{const p=this.store.duplicate(s,20/u,20/u);this.canvas.select(p)}},{label:"Create board from selection",hint:"A board around the selected marks, which move into it",run:()=>this.boardFromSelection(s)},{label:"Make mask",hint:"The selected marks become the mask of the board they are on: they move to a board of their own (a mask board), and the board shows only where they are",run:()=>this.makeMask(s)},{label:"Snap",hint:"To the grid (its finest lines); one undo step",items:(()=>{const p=this.canvas.grid.spacing/Math.max(1,this.canvas.grid.subdivisions),m=(b,g=1)=>{const w=this.store.snapMarks(s,b,p*g);this.log(`Snapped ${w} mark${w===1?"":"s"} (${b}${g>1?`, ${g}× grid`:""}).`)};return[{label:"Points to grid",hint:"Every point to the nearest grid point",run:()=>m("points")},{label:"Points to grid, tidy",hint:"Then repeated points merged and points on straight runs dropped",run:()=>m("tidy")},{label:"Position: top-left",hint:"The whole mark moves; its top-left corner lands on the grid",run:()=>m("topleft")},{label:"Position: center",hint:"The whole mark moves; its center lands on the grid",run:()=>m("center")},"-",{label:"Quantize 2× grid",hint:"Points to a grid twice as coarse, tidied",run:()=>m("tidy",2)},{label:"Quantize 4× grid",hint:"Points to a grid four times as coarse, tidied",run:()=>m("tidy",4)}]})()},{label:"Copy as",items:[{label:"SVG",hint:"The selection as SVG (with its process record), on the clipboard",run:()=>this.copySelection("svg",s)},{label:"PNG",hint:"The selection as a picture (transparent), on the clipboard",run:()=>this.copySelection("png",s)},{label:"p5 code",hint:"The selection as a minimal p5 sketch (plain calls), on the clipboard",run:()=>this.copySelection("p5",s)},{label:"JSON",hint:"The marks as studio JSON, on the clipboard: paste (Cmd+V) into any scene",run:()=>this.copySelection("json",s)}]},{label:"Bake",items:["png","svg"].map(p=>({label:p==="png"?"To a PNG image":"To an SVG image",hint:p==="png"?"The selected marks become one picture (undo brings them back)":"The selected marks become one vector image, crisp at any zoom (undo brings them back)",run:()=>{const m=this.bakeMarks(s,{format:p,title:s.length===1?this.store.doc.elements.find(b=>b.id===s[0])?.label||"mark":`${s.length} marks`});m&&this.canvas.select([m.id])}}))},{label:"Add to Assets",items:[{label:"As PNG",hint:"A picture of the selection; opens again as a drawing",run:()=>this.selectionToAssets("png",s)},{label:"As SVG",hint:"The selection as an SVG file (with its process record)",run:()=>this.selectionToAssets("svg",s)}]},a>1?{label:"Group",keys:i("edit.group"),run:()=>this.groupSelection()}:null,d?{label:"Ungroup",keys:i("edit.ungroup"),run:()=>this.ungroupSelection()}:null,{label:"Lock",hint:"Locked marks cannot be picked on the canvas (unlock in the Outliner)",run:()=>{this.store.patchElements(s,{locked:!0},"lock"),this.canvas.select([])}},{label:"Hide",hint:"Show again from the Outliner",run:()=>{this.store.patchElements(s,{hidden:!0},"hide"),this.canvas.select([])}},{label:"Show code",hint:"The selected marks as code: edit and apply",run:()=>this.openCode?.("selection")},l&&l.realize?.brush&&!["none","image"].includes(l.realize.brush)?{label:"Brush code",hint:`The code of the “${l.realize.brush}” brush`,run:()=>this.openCode?.("brush",l.realize.brush)}:null,{label:"Show in Outliner",run:()=>{this.docks.open("outliner"),this.emit("selection")}},"-",{label:"Delete",keys:i("edit.delete"),run:()=>this.store.removeElements(s)}]}openMenu(e){const t=e.getBoundingClientRect(),o=r=>this.shortcuts.label(r),s=[...this.embed?[{label:this.view.mode==="process"?"Show the picture":"Show the process",keys:o("view.toggle"),hint:"The finished picture, or the process: guides, gestures and notes",run:()=>this.setViewMode(this.view.mode==="process"?"picture":"process")},this.reference?{label:this.reference.visible?"Hide the reference":"Show the reference",keys:o("view.reference"),run:()=>{this.reference.visible=!this.reference.visible,this.canvas.invalidate(),this.renderChrome()}}:null,{label:this.canvas.showPoints?"Hide points":"Show points",keys:o("view.points"),hint:"The marks' points",run:()=>this.togglePoints()},{label:"Present",keys:o("view.present"),hint:"The boards one by one: ← → to move, Esc to leave",run:()=>this.present(!0)},this.overlay?null:{label:this.zoomBarOn()?"Hide the zoom controls":"Show the zoom controls",hint:"Zoom out, in and fit, at the end of the toolbar",run:()=>this.setZoomBar(!this.zoomBarOn())},{label:document.documentElement.dataset.theme==="light"?"Dark theme":"Light theme",run:()=>this.toggleTheme()},"-"].filter(Boolean):[],{label:"New scene",keys:this.shortcuts.label("scene.new"),hint:"An empty drawing in this project; the others stay",run:()=>this.scenes.create()},{label:"New project",hint:"Start over with one empty scene",items:[{label:"Keep this project in Assets, then start",run:()=>this.newProject({keep:!0})},{label:"Start without keeping it",run:()=>this.newProject({keep:!1})},{label:"Cancel",run:()=>{}}]},{label:"Open file",hint:"Process JSON, SVG with a process record, Excalidraw, or an image as reference (opens as a new scene)",run:()=>this.openFile()},{label:"Import into this scene…",hint:"A board, a selection or a scene (.ams.json) comes into this scene: boards as new boards, a selection where you are looking",run:()=>this.importFile()},{label:"Save to Assets",keys:this.shortcuts.label("file.save"),run:()=>this.saveToAssets()},{label:"Export",items:[{label:"PNG",hint:"The picture (or the process view, if shown)",run:()=>this.exportAs("png")},{label:"SVG",hint:"With the full process record inside; opens again as a process",run:()=>this.exportAs("svg")},{label:"p5.js sketch",hint:"A zip whose sketch re-runs the score",run:()=>this.exportAs("p5")},{label:"Process sheet",hint:"Stages, decisions and reasons on one page (PNG)",run:()=>this.exportAs("sheet")},{label:"p5 (minimal code)",hint:"The active board as a short sketch.js of plain p5 calls, for teaching (brush textures left out)",run:()=>this.exportAs("p5min")},{label:"Page (HTML)",hint:"Every board as a section: picture, process, replay and its text. The drawing travels inside",run:()=>this.exportAs("page")},{label:"Scene (JSON)",hint:"The whole scene, every board, as a file to open or import again (a board or a selection: their own menus)",run:()=>this.exportAs("scene-json")},{label:"Excalidraw",run:()=>this.exportAs("excalidraw")}]},"-",{label:"Settings",keys:this.shortcuts.label("app.settings"),run:()=>this.docks.open("settings")},{label:"Shortcuts",keys:this.shortcuts.label("app.shortcuts"),run:()=>this.docks.open("shortcuts")},{label:"Command palette",keys:this.shortcuts.label("app.palette"),run:()=>Br(this)},{label:"Docs",keys:this.shortcuts.label("app.docs"),run:()=>this.openDocs()},"-",{label:"Panels"},...[...this.docks.panels.values()].filter(r=>!["settings","shortcuts"].includes(r.id)).map(r=>({label:r.title,run:()=>this.docks.open(r.id)})),{label:"Reset layout",run:()=>this.docks.reset()},"-",{label:"Classic studio",hint:"The earlier studio (generation, mediums, training)",run:()=>{window.location.href="/classic.html"}}];Ie(this.embed&&!this.embed.full?this.leanMenu(s):s,t.left,t.bottom+6)}leanMenu(e){const t=/^(New scene|New project|Open file|Save to Assets|Settings|Shortcuts|Docs|Classic studio|Present)$/,o=/^(PNG|SVG|Scene \(JSON\)|Excalidraw)$/,i=[];for(const s of e){if(s!=="-"&&t.test(s.label))continue;const r=s!=="-"&&s.label==="Export"?{...s,items:s.items.filter(a=>o.test(a.label))}:s;r==="-"&&(!i.length||i.at(-1)==="-")||i.push(r)}for(;i.at(-1)==="-";)i.pop();return i}slug(){return String(this.store.doc.title||"drawing").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"drawing"}selectionDoc(e=[...this.canvas.selected],t=12){const o=this.store.doc,i=o.elements.filter(p=>e.includes(p.id));if(!i.length)return null;let s=1/0,r=1/0,a=-1/0,l=-1/0;for(const p of i)for(const[m,b]of p.points)s=Math.min(s,m),r=Math.min(r,b),a=Math.max(a,m),l=Math.max(l,b);const d=Math.max(t,...i.map(p=>Number(p.realize?.params?.width??p.realize?.params?.size??4)*2));s-=d,r-=d,a+=d,l+=d;const c=i.map(p=>{const m=structuredClone(p);return delete m.board,m.points=m.points.map(([b,g,w,y])=>[b-s,g-r,w,y]),m}),{boards:h,train:u,...f}=o;return{...structuredClone(f),title:`${o.title||"Untitled"} · selection`,artboard:{width:Math.ceil(a-s),height:Math.ceil(l-r),ground:"transparent"},elements:c}}async selectionBlob(e,t){const o=this.selectionDoc(t);if(!o)return null;if(e==="svg")return new Blob([Bt(o,{mode:this.view.mode})],{type:"image/svg+xml"});if(e==="p5")return new Blob([Mn({...o,artboard:{...o.artboard,ground:"#ffffff"}},{title:o.title,version:this.p5Version()})],{type:"text/javascript"});const i=Math.min(4,2e3/Math.max(o.artboard.width,o.artboard.height));return Wn(Vt(o,{scale:i,mode:this.view.mode}))}async copySelection(e,t){try{if(e==="json"){const i=ss(this.selectionDoc(t));if(!i)return;await navigator.clipboard.writeText(JSON.stringify(i)),this.log("Copied the selection as JSON: paste it (Cmd+V) into any scene.");return}const o=await this.selectionBlob(e,t);if(!o)return;e==="svg"||e==="p5"?await navigator.clipboard.writeText(await o.text()):await navigator.clipboard.write([new ClipboardItem({"image/png":o})]),this.log(`Copied the selection as ${e.toUpperCase()}.`)}catch(o){this.log(`Could not copy: ${o.message}`,"error")}}async selectionToAssets(e,t){const o=this.selectionDoc(t);if(!o)return;const i=await this.selectionBlob(e,t),s=this.assetPanel?.folder||"",r=e==="png"?await this.assetStore.add(i,{title:o.title,kind:"process",folder:s,tags:["selection"],program:o,meta:{elements:o.elements.length}}):await this.assetStore.add(i,{title:o.title,kind:"import",folder:s,tags:["selection","svg"],meta:{file:"selection.svg",type:"image/svg+xml"}});this.log(`Added “${r.title}” to Assets (${e.toUpperCase()}).`)}boardPicture(e,t,o,i=null){if(this.composer.needs(e)){const s=Date.now();this.composer.begin(this.store.doc,s);const r=this.composer.compose(e,{doc:this.store.doc,scale:t,now:s,mode:o,chain:[]}),a=document.createElement("canvas");return a.width=r.width,a.height=r.height,a.getContext("2d").drawImage(r,0,0),a}return Vt(i||this.store.doc,i?{scale:t,mode:o}:{board:e.id,scale:t,mode:o})}async p5CodeFor(e){const t=ie(this.store.doc,e);if(!t?.code)return null;const o={},i=[];for(const s of this.sources.list){if(!new RegExp(`(source|fit)\\(\\s*['"\`]${s.name}['"\`]`).test(t.code))continue;if(s.kind==="camera"){o[s.name]={kind:"camera"};continue}const r=await this.assetStore.get(s.assetId);if(!r?.blob)continue;const a=r.blob.type,l=a==="image/gif"?"gif":a.startsWith("video/")?a.split("/")[1]||"mp4":a==="image/png"?"png":"jpg",d=`${s.name}.${l}`;o[s.name]={file:d,kind:a.startsWith("video/")?"video":l==="gif"?"animated":"image"},i.push({name:d,data:r.blob})}return{code:Bd(t.code,{board:t,sources:o,loop:!!t.follow,rate:t.follow?Re(t):0,version:this.p5Version()}),files:i}}async pageHtml(e={}){const t=this.store.doc,o=e.boards?e.boards.map(r=>ie(t,r)).filter(Boolean):cr();for(const r of new Set(o.flatMap(dr))){const a=this.sources.def(r);if(!a||a.kind!=="asset")continue;const l=await this.assetStore.get(a.assetId);if(!l?.blob)continue;const d=l.blob.type;await new Promise(c=>{const h=new FileReader;h.onload=()=>c(h.result),h.readAsDataURL(l.blob)}),d.startsWith("video/")}const i={};for(const r of o.filter(a=>we(a)==="markdown"))for(const{target:a,embed:l}of ar(r.code||"")){const d=l&&ke(t,a);d&&!i[d.id]&&we(d)==="drawing"&&(i[d.id]=Vt(t,{board:d.id,scale:Math.min(1,900/Math.max(d.width,d.height)),mode:"picture"}).toDataURL("image/jpeg",.85))}V(t).some(r=>we(r)==="p5")&&await this.frames.p5Text();const s={};for(const r of V(t)){const a=we(r);if(!r.code||a!=="drawing"&&a!=="p5")continue;const l=a==="drawing"?r.code:Ls(r.code)?Jo(r.code)?.code:null,d=a==="p5"?r.code:(await this.p5CodeFor(r.id))?.code;s[r.id]={pseudo:r.pseudo||"",studio:l||"",p5:d||""}}return hr(t,{...e})}async exportAs(e,t=this.activeBoard||H){const o=ie(this.store.doc,t)||ie(this.store.doc,H);let i=e==="scene-json"||e==="page"?this.store.doc:Be(this.store.doc,o.id);e==="p5"&&(i={...i,meta:{...i.meta||{},script:o.code||(o.main?i.meta?.script:void 0)||void 0}});const s=o.main?this.slug():`${this.slug()}-${String(o.title).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;if(e==="png")this.boardPicture(o,2,this.view.mode,i).toBlob(r=>Se(r,`${s}.png`,"image/png"));else if(e==="sheet")vr(i).toBlob(r=>Se(r,`${s}-process.png`,"image/png"));else if(e==="svg")Se(Bt(i,{mode:this.view.mode}),`${s}.svg`,"image/svg+xml");else if(e==="json")Se(JSON.stringify(Go(this.store.doc,o.id),null,2),`${s}.ams.json`,"application/json");else if(e==="scene-json")Se(JSON.stringify(vd(this.store.doc),null,2),`${this.slug()}.ams.json`,"application/json");else if(e==="page")Se(await this.pageHtml(),`${this.slug()}.html`,"text/html");else if(e==="p5min")Se(Mn(i,{version:this.p5Version()}),`${s}-sketch.js`,"text/javascript");else if(e==="excalidraw")Se(JSON.stringify(Ks(i),null,2),`${s}.excalidraw`,"application/json");else if(e==="p5code"){const r=await this.p5CodeFor(o.id);if(!r){this.log(`“${o.title}” has no code of its own to export (Code → Board).`);return}const a=[{name:"index.html",data:Id(o.title,this.p5Version(),{ml5:Cd(r.code)})},{name:"sketch.js",data:r.code}];for(const d of r.files)a.push({name:d.name,data:new Uint8Array(await d.data.arrayBuffer())});const l=Mo(a);Se(new Blob([l],{type:"application/zip"}),`${s}-p5-code.zip`,"application/zip")}else if(e==="p5"){const r=Mo([{name:"index.html",data:mc(i.title,this.p5Version())},{name:"sketch.js",data:xr(i)}]);Se(new Blob([r],{type:"application/zip"}),`${s}-p5.zip`,"application/zip")}this.log(`Exported ${e==="scene-json"?"the scene as JSON":e}${e==="page"||e==="scene-json"?"":` (${o.title})`}.`)}importPartHere(e,t=null,o="import"){const i=this.store.change(`import ${o}`,s=>$d(s,e,{at:t}));return i.kind==="selection"?(this.canvas.select(i.elements),this.log(`Imported ${i.elements.length} marks.`)):(this.goToBoard(i.boards[0],{animate:!0}),this.log(`Imported ${i.boards.length===1?"a board":`${i.boards.length} boards`} (${i.elements.length} marks).`)),i}async importText(e,t=null,o="import"){let i;try{i=JSON.parse(e)}catch{return this.log(`${o}: not JSON.`,"error"),null}return Sd(i)?(!t&&i.meta?.part==="selection"&&(t=this.canvas.toWorld(this.canvas.w/2-(i.artboard?.width||0)*this.canvas.cam.z/2,this.canvas.h/2-(i.artboard?.height||0)*this.canvas.cam.z/2)),this.importPartHere(i,t,o)):(this.log(`${o}: not a studio drawing (open other files with Open file).`,"error"),null)}viewCenter(){return this.canvas.toWorld(this.canvas.w/2,this.canvas.h/2)}async pasteContent({files:e=[],text:t=""}){const o=this.viewCenter(),i=e.filter(l=>l.type.startsWith("image/"));for(const l of i)l.type==="image/svg+xml"?await this.placeSvg(await l.text(),o):await this.placeImage(l,o,{title:l.name?.replace(/\.[^.]+$/,"")||"pasted"});if(i.length)return;const s=t.trim(),r=Td(s);if(r==="json")return this.importText(s,null,"pasted");if(r==="svg"){if(/data-ams/.test(s))try{const l=xo(s);return this.importPartHere({...l,meta:{...l.meta||{},part:"selection"}},[o[0]-l.artboard.width/2,o[1]-l.artboard.height/2],"pasted SVG")}catch{}return this.placeSvg(s,o)}if(r==="p5"||r==="studio"){const l=r==="p5"&&Ad(s)||{width:800,height:600},d=this.store.addBoard({title:r==="p5"?"Pasted sketch":"Pasted code",...l,ground:r==="p5"?"#141414":void 0});if(this.store.updateBoard(d.id,{kind:r==="p5"?"p5":"drawing",code:s}),r==="studio"){const c=this.store.runBoardCode(d.id,s,tt);c.error&&this.log(`Pasted code: ${c.error}`,"error")}this.goToBoard(d.id,{animate:!0}),this.log(r==="p5"?"Pasted a p5.js sketch as a p5 board (files it loads come from the sources by name).":"Pasted studio code as a board of its own.");return}const a=this.store.addElement({role:"note",stage:this.activeStage.id,points:[[o[0],o[1],0,.5]],text:s.slice(0,4e3),note:structuredClone(this.defaults("note").note||{}),why:"pasted"});this.canvas.select([a.id])}async placeSvg(e,[t,o]){const i=/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(e),s=/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/.exec(e),r=/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/.exec(e);let a=Number(s?.[1]||i?.[1]||400),l=Number(r?.[1]||i?.[2]||300);const d=Math.min(1,800/Math.max(a,l));a*=d,l*=d;const c=t-a/2,h=o-l/2,u=this.store.addElement({role:"image",stage:this.activeStage.id,src:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(e)}`,label:"pasted SVG",points:[[c,h,0,.5],[c+a,h,0,.5],[c+a,h+l,0,.5],[c,h+l,0,.5]],why:"pasted"});return this.canvas.select([u.id]),u}importFile(e=null){const t=M("input",{type:"file",accept:".json,application/json"});t.addEventListener("change",async()=>{const o=t.files[0];o&&await this.importText(await o.text(),e,o.name)}),t.click()}openFile(){const e=M("input",{type:"file",accept:".json,.svg,.html,.excalidraw,application/json,image/svg+xml,text/html,image/*"});e.addEventListener("change",async()=>{const t=e.files[0];if(!t)return;if(t.type.startsWith("image/")&&!t.name.endsWith(".svg"))return this.setReferenceFromBlob(t,t.name);const o=await t.text();try{let i;if(t.name.endsWith(".html")||/<html[\s>]/i.test(o.slice(0,400))){if(i=ur(o),!i)throw new Error("no drawing inside this page")}else if(t.name.endsWith(".svg")||o.trim().startsWith("<"))i=xo(o);else{const s=JSON.parse(o);i=s.type==="excalidraw"||Array.isArray(s.elements)&&s.elements[0]?.type&&!s.stages?kr(s):s.actions?vo(s):s}i.title||=t.name.replace(/\.[^.]+$/,""),await this.scenes.create({doc:i,title:i.title}),this.log(`Opened ${t.name}.`)}catch(i){this.log(`Could not open ${t.name}: ${i.message}`,"error")}}),e.click()}referenceDataUrl(e=768){const t=this.reference?.img;if(!t)return null;const o=Math.min(1,e/Math.max(t.naturalWidth,t.naturalHeight)),i=document.createElement("canvas");i.width=Math.round(t.naturalWidth*o),i.height=Math.round(t.naturalHeight*o);const s=i.getContext("2d");return s.fillStyle="#fff",s.fillRect(0,0,i.width,i.height),s.drawImage(t,0,0,i.width,i.height),i.toDataURL("image/jpeg",.85)}async saveToAssets(){return this.saveDocToAssets(this.store.doc)}async saveDocToAssets(e,{tags:t=[]}={}){const o=Wn(Vt(e,{scale:Math.min(1,1200/Math.max(e.artboard.width,e.artboard.height)),mode:"picture"})),i=await this.assetStore.add(o,{title:e.title||"Untitled",kind:"process",folder:this.assetPanel?.folder||"",tags:[...new Set([...t,...e.stages.map(s=>s.kind)])],program:structuredClone(e),meta:{stages:e.stages.length,elements:e.elements.length,decisions:e.decisions.length}});return this.log(`Saved “${i.title}” to Assets.`),i}bindKeys(){}}const ti="ams-editor-v1",ni=1;function jd(n,{origin:e=location.origin}={}){const t=(A,P)=>window.parent.postMessage({channel:ti,...A},e==="null"?"*":e,P),o=A=>{const P=V(n.store.doc);return P.find($=>$.id===A||$.title===A)||P.find($=>$.id===H)};let i=0;const s=new Map,r=A=>{for(const P of A||[])s.set(P.id,{...s.get(P.id),...P});for(const P of s.values()){const $=V(n.store.doc).find(I=>I.id===P.id),E=Object.fromEntries(["title","width","height","ground","hideLabel","hideBorder","locked"].filter(I=>P[I]!==void 0).map(I=>[I,P[I]]));$?n.store.updateBoard(P.id,E):n.store.addBoard({id:P.id,...E,x:P.x,y:P.y,adopt:!1})}},a=A=>{const P=A==="auto"?matchMedia("(prefers-color-scheme: light)").matches?"light":"dark":A;P&&document.documentElement.dataset.theme!==P&&(document.documentElement.dataset.theme=P,n.canvas.invalidate(),n.renderChrome())},l=A=>{if(A){n.setBackground("transparent"),n.canvas.setGrid({show:"off"}),f({panels:!1,zoom:!1,view:!1}),n.overlay=!0;for(const P of[...d,"ui.all"])n.shortcuts.overrides[P]=[];for(const[P,$]of s)s.set(P,{...$,ground:"transparent",hideBorder:!0,hideLabel:!0});r()}},d=["view.fit","view.frameBoard","view.frameSelection","view.zoomIn","view.zoomOut"],c=A=>{if(A==="standalone"){n.overlay=!1,n.uiLocked=!1;for(const P of[...d,"ui.all"])delete n.shortcuts.overrides[P]}else n.uiLocked=!0,l(!0);n.renderChrome()};let h=!1;const u=({x:A,y:P,z:$})=>{const E=n.canvas;[A,P,$].every(Number.isFinite)&&(h=!0,E.cam={x:A,y:P,z:$},E.invalidate(),h=!1)},f=A=>{const P=Object.fromEntries(["all","tools","view","zoom","panels"].filter($=>A&&$ in A).map($=>[$,!!A[$]]));("panels"in P||"all"in P)&&document.documentElement.classList.toggle("ams-panels",!!("all"in P?P.all:P.panels)),n.hostSetUI(P)},p=A=>{A.actions&&(n.hostActions=A.actions.filter(P=>P?.id&&P?.label)),A.dock&&document.documentElement.classList.toggle("dock-left",A.dock==="left"),A.ui&&f(A.ui),A.theme&&a(A.theme),A.background&&n.setBackground(A.background),A.accent&&n.setAccent?.(A.accent),A.document&&n.loadDocument(A.document,"host"),r(A.boards),l(A.overlay),A.camera&&u(A.camera),A.fit&&requestAnimationFrame(()=>n.canvas.fit(A.fitPadding??40,o(A.fit===!0?null:A.fit)?.id))},m=(A,P="image/png")=>new Promise($=>A.toBlob($,P)),b=A=>{const P=n.canvas,$=P.draft&&(P.draftShown||P.draft),E=$?.points?.[0];return!E||E[0]<A.x||E[0]>A.x+A.width||E[1]<A.y||E[1]>A.y+A.height?null:{...$,stage:"draft",board:void 0,points:$.points.map(([I,R,j,G])=>[I-A.x,R-A.y,j,G])}},w={init:A=>(p(A||{}),{protocol:ni,boards:V(n.store.doc).map(P=>({id:P.id,title:P.title,width:P.width,height:P.height}))}),load:({document:A,boards:P,fit:$})=>(n.loadDocument(Me(A),"host"),r(P),$&&p({fit:$}),{rev:i}),loadExcalidraw:({scene:A})=>(n.loadDocument(kr(A),"host"),r(),{rev:i}),"get-document":()=>({rev:i,document:structuredClone(n.store.doc)}),export:async({board:A,ids:P,format:$="png",scale:E=1,transparent:I=!1,mode:R="picture",draft:j=!1})=>{if(P?.length&&($==="png"||$==="svg")){const O=await n.selectionBlob($,P);if(!O)throw new Error("Nothing to export");return{format:$,ids:P,blob:O}}const G=o(A);if($==="png"){let O;const K=j?b(G):null;if(I||K){const ee=Be(n.store.doc,G.id);I&&(ee.artboard={...ee.artboard,ground:"transparent"}),K&&(ee.stages=[...ee.stages||[],{id:"draft",visible:!0}],ee.elements=[...ee.elements,K]),O=n.boardPicture(G,E,R,ee)}else O=n.boardPicture(G,E,R);return{format:$,board:G.id,width:O.width,height:O.height,blob:await m(O)}}const D=Be(n.store.doc,G.id);if($==="svg")return{format:$,board:G.id,text:Bt(D,{mode:R})};if($==="json")return{format:$,board:G.id,document:structuredClone(D)};if($==="excalidraw")return{format:$,board:G.id,scene:Ks(D)};throw new Error(`Unknown export format ${$}`)},call:({name:A,args:P})=>window.ams.callTool(A,P||{}),"list-tools":()=>window.ams.listTools(),"set-ui":A=>(f(A),{}),theme:({theme:A})=>(a(A),{}),tool:({tool:A})=>(n.setTool(A),{}),mode:({mode:A})=>(c(A),{}),reference:async({url:A,blob:P,opacity:$,title:E,visible:I})=>{if(!A&&!P)return n.reference&&(n.reference.visible=!1,n.canvas.invalidate(),n.renderChrome()),{visible:!1};const R=P||await(await fetch(A)).blob();return await n.setReferenceFromBlob(R,E||"reference"),$!=null&&(n.reference.opacity=Number($)),I===!1&&(n.reference.visible=!1),n.canvas.invalidate(),n.renderChrome(),{visible:n.reference.visible,opacity:n.reference.opacity}},camera:A=>{A&&"z"in A&&u(A);const P=n.canvas;return{...P.cam,w:P.w,h:P.h}},focus:()=>(n.canvas.canvas.focus?.(),window.focus(),{}),fit:({board:A,padding:P}={})=>(n.canvas.fit(P??40,A?o(A).id:void 0),{})};window.addEventListener("message",async A=>{if(A.source!==window.parent||e!=="null"&&A.origin!==e)return;const P=A.data;if(!P||P.channel!==ti||typeof P.type!="string")return;const $=w[P.type];if(!$){P.id!=null&&t({type:"error",id:P.id,message:`Unknown message ${P.type}`});return}try{const E=await $(P);P.id!=null&&t({type:"result",id:P.id,value:E})}catch(E){P.id!=null&&t({type:"error",id:P.id,message:E?.message||String(E)})}});let y=0,S="";n.store.subscribe((A,P)=>{i++,S=P,y||(y=setTimeout(()=>{y=0,t({type:"change",rev:i,reason:S})},120))},{live:!0});const k=n.canvas.onCamera;let v=0;n.canvas.onCamera=()=>{k?.(),!(h||v)&&(v=requestAnimationFrame(()=>{v=0,t({type:"camera",...n.canvas.cam})}))};const T=n.canvas.invalidate;let x=0,L=!1;n.canvas.invalidate=function(...A){const P=T.apply(this,A),$=!!n.canvas.draft;return($||L)&&!x&&(x=requestAnimationFrame(()=>{x=0,t({type:"draft",active:!!n.canvas.draft})})),L=$,P},n.on("host-action",(A,P)=>t({type:"action",id:A,ids:P})),n.on("selection",()=>t({type:"selection",ids:[...n.canvas.selected]})),n.on("tool",()=>t({type:"tool",id:n.tool})),window.addEventListener("keydown",A=>{A.defaultPrevented||A.target.closest?.("input, textarea, select, [contenteditable]")||t({type:"key",key:A.key,code:A.code,alt:A.altKey,ctrl:A.ctrlKey,meta:A.metaKey,shift:A.shiftKey})}),t({type:"ready",protocol:ni,tools:window.ams.listTools().length})}const lt=new URLSearchParams(location.search);Qa(lt.get("noteFont")||"sans");{let n=lt.get("theme");n!=="light"&&n!=="dark"&&(n=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"),document.documentElement.dataset.theme=n}document.documentElement.classList.add("ams-embed");const Fd=["boards","outliner","properties"],_d=!1,Wd=[...Fd,...(lt.get("features")||"").split(",").filter(Boolean)],ye=new Dd(document.querySelector("#app"),{embed:{persist:lt.get("persist")==="1",panels:Wd,full:_d}});ye.mount();for(const n of["file.save","file.open","scene.new","scene.next","scene.prev","view.present","view.reference","app.docs","app.settings","app.shortcuts","score.run"])ye.shortcuts.overrides[n]=[];ye.hostSetUI=ye.setUI.bind(ye);ye.uiLocked=!0;ye.setUI=(...n)=>ye.uiLocked?void 0:ye.hostSetUI(...n);for(const n of["open","toggleDock"]){const e=ye.docks[n].bind(ye.docks);ye.docks[n]=(...t)=>(ye.ui?.panels===!1&&(document.documentElement.classList.add("ams-panels"),ye.hostSetUI({panels:!0})),e(...t))}lt.get("guide")!=="1"&&(ye.guide.enabled=!1);ye.hostSetUI({view:!1,panels:!1,tools:lt.get("tools")!=="0",zoom:lt.get("zoom")!=="0"});jd(ye,{origin:lt.get("origin")||location.origin});
