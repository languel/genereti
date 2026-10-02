export const examples={
p5:`function setup(){ createCanvas(512,512); background(245); }
function draw(){
  if(mouseIsPressed){ noStroke(); fill(20,40,60,90); circle(mouseX,mouseY,24); }
}`,
glsl:`precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
void main(){
 vec2 uv=gl_FragCoord.xy/u_resolution;
 gl_FragColor=vec4(0.5+0.5*cos(u_time+uv.xyx*6.0+vec3(0,2,4)),1.0);
}`,
three:`const mesh=new THREE.Mesh(new THREE.TorusKnotGeometry(1,.3,96,16),new THREE.MeshNormalMaterial());
scene.add(mesh); camera.position.z=4;
tick((time)=>{mesh.rotation.x=time*.3;mesh.rotation.y=time*.5;});`,
strudel:`$: note("<c3 e3 g3 [a2 e3]>").s("sine").slow(2)
 .color("#a5d6a7").markcss('color: #171b22; background: #a5d6a7; border-radius: 4px; box-shadow: 0 0 18px #a5d6a7;')
 ._pianoroll()`,
html:`<style>
body{margin:0;background:#101828;color:#f3ddbc;font:28px Georgia}
main{padding:40px} .orb{width:180px;height:180px;border-radius:50%;background:linear-gradient(40deg,#faac69,#89d7d2);animation:drift 3s infinite alternate}
@keyframes drift{to{transform:translate(130px,60px) rotate(45deg)}}
</style><main><h1>Live canvas</h1><div class="orb"></div></main>`,
markdown:`# Ink and light

A **live document** you can send to generation.

> Change the words, then press Cmd/Ctrl+Enter.

- Shapes
- Sound
- Stories

\`\`\`js
const color = "teal";
\`\`\``
};
