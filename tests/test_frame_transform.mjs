import test from 'node:test';
import assert from 'node:assert/strict';
import {inverseQuad} from '../integrations/genereti_comfy_inputs/web/js/frame-transform.js';
const map=(m,[x,y])=>{const w=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/w,(m[3]*x+m[4]*y+m[5])/w];};
test('projective inverse maps arbitrary destination corners back to source corners',()=>{
 const corners=[[.1,.2],[.8,.1],[.9,.85],[.2,.9]],m=inverseQuad(corners),expected=[[0,0],[1,0],[1,1],[0,1]];
 corners.forEach((p,i)=>map(m,p).forEach((v,j)=>assert.ok(Math.abs(v-expected[i][j])<1e-7)));
});
test('rotation and identity preserve corner orientation',()=>{
 const corners=[[0,0],[1,0],[1,1],[0,1]];
 assert.deepEqual(map(inverseQuad(corners),[.25,.75]),[.25,.75]);
 assert.deepEqual(map(inverseQuad(corners.map(([x,y])=>[y,1-x])),[0,1]),[0,0]);
 assert.throws(()=>inverseQuad([[0,0],[0,0],[0,0],[0,0]]));
});

test('automatic output framing stays inside a distorted quad and preserves aspect',async()=>{
 const {automaticFrame,insideQuad}=await import('../integrations/genereti_comfy_inputs/web/js/frame-transform.js');
 const quad=[[.12,.1],[.9,.15],[.75,.85],[.2,.9]],f=automaticFrame(quad);
 assert.ok(f[2]-f[0]>.5);assert.ok(Math.abs((f[2]-f[0])-(f[3]-f[1]))<1e-8);
 for(const p of [[f[0],f[1]],[f[2],f[1]],[f[2],f[3]],[f[0],f[3]]])assert.ok(insideQuad(p,quad));
});

test('editor zoom preserves anchored source point and fit exposes offscreen corners',async()=>{
 const {zoomEditorView,editorPoint,fitEditorView}=await import('../integrations/genereti_comfy_inputs/web/js/frame-transform.js');
 const view={scale:.84,x:.08,y:.08},anchor=[.3,.7],before=editorPoint(view,anchor),after=editorPoint(zoomEditorView(view,2,anchor),anchor);
 after.forEach((v,i)=>assert.ok(Math.abs(v-before[i])<1e-9));
 const quad=[[-.5,-.2],[1.7,.2],[1.2,1.8],[0,1]],fit=fitEditorView(quad);
 for(const [x,y] of quad){assert.ok(x*fit.scale+fit.x>=.079);assert.ok(x*fit.scale+fit.x<=.921);assert.ok(y*fit.scale+fit.y>=.079);assert.ok(y*fit.scale+fit.y<=.921);}
 assert.equal(zoomEditorView(view,1e6).scale,16);
});

test('locked crop preserves opposite anchor, ratio, and viewport bounds',async()=>{
 const {resizeCrop,automaticFrame,insideQuad}=await import('../integrations/genereti_comfy_inputs/web/js/frame-transform.js');
 const r=resizeCrop([.1,.2,.8,.9],0,-2,-2,16/9);
 assert.equal(r[2],.8);assert.equal(r[3],.9);
 assert.ok(r[0]>=0&&r[1]>=0);
 assert.ok(Math.abs((r[2]-r[0])/(r[3]-r[1])-16/9)<1e-8);
 const q=[[.1,.1],[.9,.15],[.8,.9],[.2,.8]],f=automaticFrame(q,16/9);
 assert.ok(Math.abs((f[2]-f[0])/(f[3]-f[1])-16/9)<1e-8);
 for(const p of [[f[0],f[1]],[f[2],f[1]],[f[2],f[3]],[f[0],f[3]]])assert.ok(insideQuad(p,q));
});
test('quad rotation preserves pixel distances and centroid on rectangular streams',async()=>{
 const {rotateQuad}=await import('../integrations/genereti_comfy_inputs/web/js/frame-transform.js');
 const q=[[.1,.1],[.8,.2],[.9,.8],[.2,.9]],r=rotateQuad(q,Math.PI/3,2);
 const dist=(a,b)=>Math.hypot((a[0]-b[0])*2,a[1]-b[1]);
 for(let i=0;i<4;i++)assert.ok(Math.abs(dist(q[i],q[(i+1)%4])-dist(r[i],r[(i+1)%4]))<1e-8);
 for(let j=0;j<2;j++)assert.ok(Math.abs(q.reduce((n,p)=>n+p[j],0)-r.reduce((n,p)=>n+p[j],0))<1e-8);
});

test('Ctrl snapping uses display-space distance and rejects out-of-bounds crop targets',async()=>{
 const {snapControlPoint}=await import('../integrations/genereti_comfy_inputs/web/js/frame-transform.js');
 assert.deepEqual(snapControlPoint([.51,.49],[[.5,.5],[.9,.9]],600,300),[.5,.5]);
 assert.equal(snapControlPoint([.55,.5],[[.5,.5]],600,300),null);
 assert.equal(snapControlPoint([-.01,.5],[[-.01,.5]],600,300,12,true),null);
 assert.deepEqual(snapControlPoint([.52,.5],[[.5,.5]],300,150),[.5,.5]);
});
