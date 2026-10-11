import test from 'node:test';
import assert from 'node:assert/strict';
import {parameters,SHADER} from '../integrations/genereti_comfy_texture/web/texture-gpu.js';
import {analysisSize,detectBlobs,BlobTracker} from '../integrations/genereti_comfy_texture/web/utilities.js';
test('analysis resolution bounds both axes and preserves aspect',()=>{assert.deepEqual(analysisSize(1920,1080,256),[256,144]);assert.deepEqual(analysisSize(100,1000,256),[26,256]);assert.deepEqual(analysisSize(16,8,256),[16,8]);});
test('connected blobs include diagonal pixels, discard small specks and retain largest',()=>{
 const data=new Uint8Array(8*8*4);for(const [x,y] of [[1,1],[2,2],[3,3],[6,6]])data[(y*8+x)*4]=255;
 const blobs=detectBlobs({data,width:8,height:8},.02,32);assert.equal(blobs.length,1);assert.equal(blobs[0].area,3/64);assert.equal(blobs[0].width,3/8);assert.equal(blobs[0].x,2.5/8);
});
test('blob IDs track motion, bridge missing frames, age out and reset',()=>{
 const t=new BlobTracker(),blob=x=>({x,y:.5,width:.1,height:.1,area:.01});
 const a=t.update([blob(.2),blob(.8)],1000,.1,2).jsonValue.blobs;assert.deepEqual(a.map(b=>b.id),[1,2]);
 const b=t.update([blob(.81),blob(.21)],1100,.1,2).jsonValue.blobs;assert.deepEqual(b.map(b=>b.id),[2,1]);assert.ok(Math.abs(b[0].vx-.1)<1e-6);
 t.update([],1200,.1,2);assert.equal(t.update([blob(.22)],1300,.1,2).jsonValue.blobs[0].id,1);
 for(let i=0;i<3;i++)t.update([],1400+i*100,.1,2);
 assert.equal(t.update([blob(.22)],1800,.1,2).jsonValue.blobs[0].id,3);
 t.reset();assert.equal(t.update([blob(.22)],2000,.1,2).jsonValue.blobs[0].id,1);
});
test('utility parameters validate levels and preserve convolution packing',()=>{
 assert.throws(()=>parameters('Level',{black:1,white:0}));assert.throws(()=>parameters('ColorMap',{low:1,high:0}));
 const p=parameters('Convolve',{...Object.fromEntries(Array.from({length:9},(_,i)=>['k'+i,i])),normalize:true,bias:.5,mix:1});assert.deepEqual([...p.slice(4,13)],[0,1,2,3,4,5,6,7,8]);assert.equal(p[16],.5);assert.equal(p[0],29);assert.ok(SHADER.includes('utilityPixel(op,uv)'));
});
