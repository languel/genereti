// Resize and mirror on the GPU before exporting a sampled frame.
export function frameSize(width,height,maxSide){const scale=maxSide?Math.min(1,maxSide/Math.max(width,height)):1;return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];}
export function sampleDue(now,last,fps,held,hasFrame){return !hasFrame||(!held&&fps>0&&now-last>=1000/fps);}
const renderers=new WeakMap();
function renderer(canvas){
  if(renderers.has(canvas))return renderers.get(canvas);
  const gl=canvas.getContext('webgl',{alpha:false,preserveDrawingBuffer:true,antialias:false});
  if(!gl)throw Error('GPU camera preprocessing requires WebGL.');
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0,1);}');const fs=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D image;uniform bool flip;void main(){vec2 t=vec2(flip?1.-uv.x:uv.x,1.-uv.y);gl_FragColor=texture2D(image,t);}');
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const r={draw(video,maxSide,flip){const [width,height]=frameSize(video.videoWidth,video.videoHeight,maxSide);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,canvas.width,canvas.height);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);gl.uniform1i(gl.getUniformLocation(program,'flip'),flip?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);},dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);renderers.delete(canvas);}};renderers.set(canvas,r);return r;
}
export function drawSample(canvas,video,maxSide,flipped){renderer(canvas).draw(video,maxSide,flipped);}
export function disposeSample(canvas){renderers.get(canvas)?.dispose();}
