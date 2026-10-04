import {DEFAULT_P5_SKETCH} from '../web/js/p5-default.js';

export const examples={
p5:DEFAULT_P5_SKETCH,
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

Inline math: $E = mc^2$.

$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$

> Change the words, then press Cmd/Ctrl+Enter.

- Shapes
- Sound
- Stories

\`\`\`js
const color = "teal";
\`\`\``,
tixy:`// @param gridSize = 16 (1..64, step:1)
// @param speed = 1 (0..4)
// @param color1 = "#e8e8e8" (color)
// @param color0 = "#ff547d" (color)
sin(t * speed + x / 4) * cos(t * speed + y / 4)`,
playcore:`// @param threshold = 0.2 (-1..1)
export const settings = { fps:30, fontSize:18, color:"#e8e8e8", backgroundColor:"transparent" };
export function main({x,y},context){
 const wave = Math.sin(x*.22+context.time/450)*Math.cos(y*.24);
 return wave > __.params.threshold ? {char:"●",color:"#89d7d2"} : "·";
}`,
manim:String.raw`// @param radius = 1.5 (0.25..3)
// @param stepThrough = false
const circle = new Circle({radius: __.params.radius, color: "#89d7d2"});
await scene.play(new Create(circle));
await cue("Square");
await scene.play(new Transform(circle, new Square({sideLength: __.params.radius*2, color:"#ff547d"})));
const equation = new MathTex({latex: "e^{i\\pi}+1=0", color:"#e8e8e8"});
await equation.waitForRender();
await scene.play(new FadeOut(circle), new FadeIn(equation));`,
latex:String.raw`\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}`,
svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
 <circle cx="256" cy="256" r="180" fill="none" stroke="#89d7d2" stroke-width="8"/>
 <path d="M76 256 Q256 20 436 256 T76 256" fill="none" stroke="#ff547d" stroke-width="5"/>
</svg>`,
orca:`// @param bpm = 120 (20..400)
.4C.............
................
.8D4............
................
.1Rz............
................`,
hyperframes:`<!-- @param duration = 8 (1..120) -->
<!-- @param loop = true -->
<style>main{height:100%;display:grid;place-items:center;color:#e8e8e8;font:28px system-ui}.orb{width:150px;height:150px;border-radius:50%;background:#89d7d2;transform:translateX(calc(sin(var(--hf-time))*90px))}p{position:absolute;bottom:12px}</style>
<main data-composition-id="demo"><div class="orb"></div><p>Finite composition · $e^{i\\pi}+1=0$</p></main>`
};
