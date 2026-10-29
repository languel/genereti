import {test} from 'node:test';import assert from 'node:assert/strict';
import {drumSequencerPanel} from '../integrations/genereti_comfy_chop/web/audio-sequencers.js';
import {drumGlyph} from '../integrations/genereti_comfy_chop/web/drum-glyphs.js';
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(tag){return {tag,style:{},dataset:{},children:[],attributes:{},classList:{add(){},toggle(){}},clientWidth:470,clientHeight:100,width:470,height:100,value:'',append(...kids){this.children.push(...kids);},replaceChildren(...kids){this.children=kids;this.value='';},get options(){return this.children;},setAttribute(k,v){this.attributes[k]=v;},getContext(){return context;},getBoundingClientRect(){return {left:0,top:0,width:470,height:100};},addEventListener(){},setPointerCapture(){},focus(){}};}
globalThis.document={getElementById(){return true;},createElement:element};globalThis.window={devicePixelRatio:1};globalThis.getComputedStyle=()=>({color:'#fff'});globalThis.ResizeObserver=class{observe(){}};
test('refreshing an open add-row dropdown preserves options and the pending choice',()=>{
 const node={widgets:[{name:'pattern',value:'kick:1000;snare:0010;hat:1010'},{name:'division',value:4},{name:'velocity',value:.7},{name:'ratchet',value:1}],setDirtyCanvas(){}};
 const panel=drumSequencerPanel({node}),select=panel.el.children[0].children.find(e=>e.tag==='select');
 assert.equal(panel.viewCanvas,panel.el.children[1]);
 const options=select.children;select.value='rim';panel.refresh();panel.refresh();assert.equal(select.children,options);assert.equal(select.value,'rim');select.onchange();assert.match(node.widgets[0].value,/rim:0000/);assert.equal(select.value,'');assert(!select.children.some(o=>o.value==='rim'));
});
test('drum pads have distinct outline glyphs for every instrument',()=>{const names=['kick','snare','rim','clap','hat','openhat','tomlo','tomhi','ride','cowbell'];assert.equal(new Set(names.map(drumGlyph)).size,names.length);for(const name of names)assert.match(drumGlyph(name),/aria-hidden="true".*<path d=/);});
