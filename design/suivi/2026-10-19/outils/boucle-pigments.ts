// Prototype local : mouvement cyclique de la couleur, grain du papier conservé.
export async function createPigmentLoop(canvas:HTMLCanvasElement, source:HTMLImageElement){
 await source.decode();
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)throw new Error('WebGL indisponible');
 const vertex=`attribute vec2 position; varying vec2 uv;
 void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
 const fragment=`precision highp float;
 varying vec2 uv; uniform sampler2D painting; uniform vec2 texel; uniform float phase;
 vec3 color(vec2 p){return texture2D(painting,clamp(p,vec2(0.001),vec2(.999))).rgb;}
 vec3 soft(vec2 p){
  vec2 d=texel*2.2;
  return (color(p)*4.+color(p+d)+color(p-d)+color(p+vec2(d.x,-d.y))+color(p+vec2(-d.x,d.y)))/8.;
 }
 void main(){
  vec2 p=vec2(uv.x,1.-uv.y);
  vec3 base=color(p); vec3 low=soft(p);
  // Des phases spatiales différentes évitent une pulsation collective.
  vec2 field=vec2(
   sin(phase+p.x*6.2+p.y*4.1)+.32*sin(2.*phase-p.y*8.7+p.x*2.3),
   cos(phase-p.x*4.8+p.y*5.3)+.30*sin(3.*phase+p.x*5.6-p.y*3.2)
  );
  float chroma=max(max(low.r,low.g),low.b)-min(min(low.r,low.g),low.b);
  float ink=.35+.65*smoothstep(.018,.085,chroma);
  vec2 displacement=field*vec2(.006,.009)*ink;
  // Déplacer les masses colorées, réappliquer le grain fin à sa place d'origine.
  vec3 result=soft(p+displacement)+(base-low);
  gl_FragColor=vec4(clamp(result,0.,1.),1.);
 }`;
 const program=gl.createProgram()!;
 for(const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
  const shader=gl.createShader(type)!;gl.shaderSource(shader,code);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Shader');
  gl.attachShader(program,shader);gl.deleteShader(shader);
 }
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Programme');
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
 gl.uniform2f(gl.getUniformLocation(program,'texel'),1/source.naturalWidth,1/source.naturalHeight);
 const phase=gl.getUniformLocation(program,'phase');
 canvas.width=1280;canvas.height=Math.round(1280*source.naturalHeight/source.naturalWidth);
 gl.viewport(0,0,canvas.width,canvas.height);
 return {draw(turn:number){
  gl.uniform1f(phase,(turn%1)*Math.PI*2);gl.drawArrays(gl.TRIANGLES,0,6);
  canvas.dataset.phase=(turn%1).toFixed(5);
 }, available(){return !gl.isContextLost();}};
}
