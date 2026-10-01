/* ==========================================================
   LUX96 — procedural wood engine
   A WebGL fragment shader that grows figured, lit wood grain.
   Wood.species  — timber presets
   Wood.texture(name, w, h, seed) -> <canvas> (flat-lit texture)
   Wood.slab(canvas, name)        -> live, cursor-lit slab
   ========================================================== */
(function () {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  const species = {
    walnut:   { name: "American Black Walnut", c: ["#1a100a", "#43291a", "#6b4630"], freq: 1.55, warp: 1.25, figure: 0.9, pores: 0.22, sheen: 0.55 },
    oak:      { name: "European White Oak",    c: ["#6a4e2f", "#a9845a", "#cdae82"], freq: 2.5,  warp: 0.55, figure: 0.4, pores: 0.32, sheen: 0.35 },
    iroko:    { name: "Iroko",                 c: ["#4f3218", "#8a5d2e", "#ad7b44"], freq: 2.0,  warp: 0.85, figure: 0.6, pores: 0.26, sheen: 0.45 },
    mahogany: { name: "African Mahogany",      c: ["#3d150c", "#74301c", "#9c4a2b"], freq: 1.15, warp: 0.45, figure: 0.3, pores: 0.18, sheen: 0.65 },
    teak:     { name: "Teak",                  c: ["#553a1c", "#956635", "#b88a52"], freq: 1.9,  warp: 0.95, figure: 0.55, pores: 0.24, sheen: 0.5 },
    ash:      { name: "Ash",                   c: ["#9c7f5a", "#d4bd98", "#ebdec4"], freq: 1.75, warp: 0.7,  figure: 0.5, pores: 0.3, sheen: 0.3 },
  };

  const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;

  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform vec2 uLight; uniform float uLit;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
uniform float uFreq; uniform float uWarp; uniform float uFigure; uniform float uPores;
uniform float uSeed; uniform float uScale; uniform float uSheen; uniform vec2 uKnot;

// Lattice hash kept to small magnitudes: large products let mobile GPU compilers
// round neighbouring cells differently, which shows up as hard seams.
float hash(vec2 p){ p = mod(p, 289.); vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+17.1; a*=.5; } return v; }

// x = latewood, y = tone, z = fibre, w = pores
vec4 grain(vec2 p){
  vec2 s = vec2(uSeed, uSeed*1.7);
  vec2 q = p;
  q.y += (fbm(vec2(p.x*.045, p.y*.22)+s)-.5)*uWarp*2.6;
  q.y += (fbm(vec2(p.x*.2, p.y*.9)+s.yx)-.5)*uWarp*.35;
  vec2 d = p - uKnot; float r2 = dot(d*vec2(.5,1.), d*vec2(.5,1.));
  q.y += uFigure * d.y * 1.4 * exp(-r2*1.6);
  float g = q.y*uFreq*6. + fbm(vec2(q.x*.035, q.y*.45)+s*2.)*7. + fbm(q*vec2(.08,1.4)+s)*1.2;
  float band = fract(g);
  float edge = .9 + .07*noise(vec2(p.x*.3, floor(g))+s);
  float late = smoothstep(.45,edge,band) * (1. - smoothstep(edge,1.,band));
  late *= .55 + .45*noise(vec2(p.x*.6, g*.7)+s);
  float tone = fbm(vec2(p.x*.14, q.y*.7)+s*3.);
  float fibre = .5*noise(vec2(p.x*1.1, q.y*75.)+s) + .5*noise(vec2(p.x*3.2, q.y*170.)+s.yx);
  float pore = smoothstep(.8,.98, noise(vec2(p.x*34., q.y*520.)+s)) * (.4 + .6*late);
  return vec4(late, tone, fibre, pore);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy / uRes.y) * uScale;
  vec4 g = grain(p);
  vec3 col = mix(uC2, uC3, smoothstep(.2,.8,g.y));
  col = mix(col, uC1, g.x*.78);
  col *= .88 + .24*g.z;
  col = mix(col, uC1*.8, g.w*uPores*1.2);

  if (uLit > .5) {
    float e = 1.5/uRes.y*uScale;
    vec4 gx = grain(p+vec2(e,0.)); vec4 gy = grain(p+vec2(0.,e));
    float h0 = g.x*.25 + g.z*.12 - g.w*.3;
    float hx = gx.x*.25 + gx.z*.12 - gx.w*.3;
    float hy = gy.x*.25 + gy.z*.12 - gy.w*.3;
    vec3 N = normalize(vec3((h0-hx)*.5, (h0-hy)*.5, 1.));
    vec2 aspect = vec2(uRes.x/uRes.y, 1.);
    vec2 dl = (uLight - uv) * aspect;
    vec3 L = normalize(vec3(dl, .7));
    float dist = length(dl);
    float pool = exp(-dist*dist*1.4);
    float diff = .75 + .25*max(dot(N,L),0.);
    vec3 H = normalize(L + vec3(0.,0.,1.));
    float nh = max(dot(N,H),0.);
    float spec = (pow(nh, 22.)*.5 + pow(nh, 180.)*.35) * uSheen * (.65 + .7*g.z);
    col = col * (.22 + 1.1*pool*diff) + spec * pool * vec3(1.,.85,.62);
    col *= 1. - .4*smoothstep(.5,1.15,length((uv-.5)*vec2(1.25,1.)));
  }
  gl_FragColor = vec4(pow(col, vec3(.95)), 1.);
}`;

  function makeGL(canvas, opts) {
    const gl = canvas.getContext("webgl", Object.assign({ antialias: false, premultipliedAlpha: false }, opts));
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    ["uRes", "uLight", "uLit", "uC1", "uC2", "uC3", "uFreq", "uWarp", "uFigure", "uPores", "uSeed", "uScale", "uSheen", "uKnot"]
      .forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));
    return { gl, u };
  }

  function setSpecies(ctx, sp, seed, scale) {
    const { gl, u } = ctx;
    const [c1, c2, c3] = sp.c.map(hex);
    gl.uniform3fv(u.uC1, c1); gl.uniform3fv(u.uC2, c2); gl.uniform3fv(u.uC3, c3);
    gl.uniform1f(u.uFreq, sp.freq); gl.uniform1f(u.uWarp, sp.warp);
    gl.uniform1f(u.uFigure, sp.figure); gl.uniform1f(u.uPores, sp.pores);
    gl.uniform1f(u.uSheen, sp.sheen); gl.uniform1f(u.uSeed, seed);
    gl.uniform1f(u.uScale, scale);
    gl.uniform2f(u.uKnot, 1.2 + (seed % 3) * 0.7, 0.45 + (seed % 2) * 0.2);
  }

  // ---------- Flat textures (shared offscreen context, cached) ----------
  let gen = null;
  const cache = new Map();
  function texture(name, w = 1024, h = 1024, seed = 7, pxPerUnit = 380) {
    const key = [name, w, h, seed, pxPerUnit].join("|");
    if (cache.has(key)) return cache.get(key);
    const sp = species[name] || species.walnut;
    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    try {
      if (!gen) {
        const c = document.createElement("canvas");
        gen = makeGL(c, { preserveDrawingBuffer: true });
      }
      if (!gen) throw new Error("no webgl");
      const { gl, u } = gen;
      gl.canvas.width = w; gl.canvas.height = h;
      gl.viewport(0, 0, w, h);
      setSpecies(gen, sp, seed, h / pxPerUnit);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uLit, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      out.getContext("2d").drawImage(gl.canvas, 0, 0);
    } catch (e) {
      fallback(out, sp);
    }
    cache.set(key, out);
    return out;
  }

  // 2D fallback when WebGL is unavailable
  function fallback(c, sp) {
    const x = c.getContext("2d");
    x.fillStyle = sp.c[1]; x.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < c.height; y += 3) {
      const t = Math.sin(y * 0.05 * sp.freq + Math.sin(y * 0.011) * 4);
      x.fillStyle = t > 0.7 ? sp.c[0] : t < -0.5 ? sp.c[2] : "transparent";
      x.globalAlpha = 0.35;
      x.fillRect(0, y, c.width, 2);
    }
    x.globalAlpha = 1;
  }

  // ---------- Live lit slab ----------
  function slab(canvas, name = "walnut", seed = 3) {
    let ctx;
    try { ctx = makeGL(canvas); } catch (e) { ctx = null; }
    if (!ctx) {
      canvas.classList.add("no-webgl");
      return { setSpecies() {}, setLight() {}, resize() {}, destroy() {} };
    }
    const { gl, u } = ctx;
    let sp = species[name], light = [0.62, 0.58], dirty = true, raf = 0, visible = true;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(r.width * dpr()));
      canvas.height = Math.max(2, Math.round(r.height * dpr()));
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    }
    function draw() {
      raf = 0;
      if (!dirty || !visible) return;
      dirty = false;
      setSpecies(ctx, sp, seed, canvas.height / dpr() / 380);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform2f(u.uLight, light[0], light[1]);
      gl.uniform1f(u.uLit, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    const request = () => { dirty = true; if (!raf) raf = requestAnimationFrame(draw); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) request(); });
    io.observe(canvas);
    const ro = new ResizeObserver(() => { resize(); request(); });
    ro.observe(canvas);
    resize(); request();
    return {
      setSpecies(n) { sp = species[n] || sp; request(); },
      setLight(x, y) { light = [x, y]; request(); },
      resize,
      destroy() { io.disconnect(); ro.disconnect(); },
    };
  }

  window.Wood = { species, texture, slab };
})();
