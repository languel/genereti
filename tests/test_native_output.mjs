import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('native client snapshots borrowed frames immediately, bounds uploads and closes the companion',async()=>{
 const calls=[],draws=[],callbacks=[];let demand;
 const canvas={width:0,height:0,getContext(){return {clearRect(){},drawImage(bitmap){draws.push(bitmap);}};},toBlob(callback){callbacks.push(callback);}};
 const context=vm.createContext({document:{createElement:()=>canvas},performance:{now:()=>1000},setInterval(callback){demand=callback;return 1;},clearInterval(){},fetch:async(url,options)=>{calls.push([url,options]);return {ok:true,status:200,json:async()=>url.endsWith('/open')?{token:'test-token'}:{active:true}};}});
 vm.runInContext(readFileSync(new URL('../integrations/genereti_comfy_stream/web/js/native-output.js',import.meta.url),'utf8').replace('export function','function'),context);
 const status={textContent:''},output=context.nativeOutput(status);assert.equal(await output.open(),true);
 const bitmap={width:32,height:24};output.publish({bitmap});assert.equal(draws[0],bitmap,'snapshot occurs before the source releases the bitmap');
 output.publish({bitmap});assert.equal(callbacks.length,1,'one encoding/upload in flight');
 output.setFit('cover');callbacks[0]({type:'image/png'});
 for(let i=0;i<20;i++)await Promise.resolve();
 assert.ok(calls.some(([url,options])=>url.includes('/frame?fit=cover')&&options.headers['Content-Type']==='image/png'));
 await demand();output.close();for(let i=0;i<10;i++)await Promise.resolve();assert.ok(calls.some(([url,options])=>url.endsWith('/test-token')&&options.method==='DELETE'));
 output.publish({bitmap});assert.equal(callbacks.length,1,'no encoding after disposal');
});
