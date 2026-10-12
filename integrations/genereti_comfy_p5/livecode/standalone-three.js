import * as THREE from 'three';
export function threeRuntime(source,bridge,inputCanvas){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(bridge.render.width,bridge.render.height);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,bridge.render.width/bridge.render.height,.1,100);camera.position.z=4;
 const inputTexture=new THREE.CanvasTexture(inputCanvas);let callback=()=>{};
 new Function('THREE','scene','camera','renderer','tick','inputTexture',source)(THREE,scene,camera,renderer,fn=>callback=fn,inputTexture);
 return {canvas:renderer.domElement,paint(time){callback(time);renderer.render(scene,camera);},dispose(){inputTexture.dispose();renderer.dispose();}};
}
