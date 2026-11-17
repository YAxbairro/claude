/* Levy Travel — WebGL sem bibliotecas: água viva na capa e transições líquidas nos destinos. */
(function () {
  "use strict";

  var VS = "attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }";

  var COMMON = [
    "precision highp float;",
    "varying vec2 vUv;",
    "vec2 cover(vec2 uv, vec2 res, vec2 img){ float rs=res.x/res.y, ri=img.x/img.y; vec2 s = rs>ri ? vec2(1.0, ri/rs) : vec2(rs/ri, 1.0); return (uv-0.5)*s+0.5; }",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }"
  ].join("\n");

  var HERO_FS = COMMON + [
    "uniform sampler2D uTex; uniform sampler2D uText;",
    "uniform vec2 uRes; uniform vec2 uImg; uniform float uTime; uniform float uScroll; uniform float uReveal; uniform float uTextOn;",
    "uniform vec4 uRip[12];",
    "uniform vec2 uMouse;",
    "uniform vec3 uLine;", // x: water line (uv.y), y: text bottom, z: text top
    "void main(){",
    "  vec2 uv = vUv; float asp = uRes.x/uRes.y; float t = uTime;",
    "  float zoom = 1.0 + (1.0-uReveal)*0.35 + uScroll*0.18;",
    "  vec2 par = (uMouse-0.5)*0.012;",
    "  vec2 zuv = (uv-0.5)/zoom + 0.5 + par;",
    "  vec3 raw = texture2D(uTex, cover(zuv,uRes,uImg)).rgb;",
    "  float water = smoothstep(-0.03, 0.10, raw.b - raw.r*0.9);",
    "  vec2 w = vec2(fbm(zuv*vec2(5.0,7.0)+vec2(t*0.10,t*0.07)), fbm(zuv*vec2(6.0,5.0)-vec2(t*0.08,-t*0.11)+3.7)) - 0.5;",
    "  vec2 disp = w*0.010;",
    "  float caust = 0.0;",
    "  for(int i=0;i<12;i++){",
    "    vec4 r = uRip[i]; float age = t - r.z;",
    "    if(age < 0.0 || age > 5.0) continue;",
    "    vec2 d = uv - r.xy; d.x *= asp; float dist = length(d);",
    "    float front = age*0.30;",
    "    float k = dist - front;",
    "    float ring = sin(k*62.0) * exp(-abs(k)*11.0) * exp(-age*0.9) * r.w;",
    "    disp += (d/(dist+0.0001)) * ring * 0.015;",
    "    caust += ring;",
    "  }",
    "  disp *= mix(0.25, 1.0, water);",
    "  disp *= 1.0 + uScroll*2.0;",
    "  vec2 iuv = cover(zuv + disp, uRes, uImg);",
    "  vec3 col;",
    "  col.r = texture2D(uTex, iuv + vec2(disp.x*0.25,0.0)).r;",
    "  col.g = texture2D(uTex, iuv).g;",
    "  col.b = texture2D(uTex, iuv - vec2(disp.x*0.25,0.0)).b;",
    "  float sparkle = pow(max(0.0, fbm(zuv*vec2(30.0,40.0)+t*0.6) - 0.55)*2.2, 3.0);",
    "  col += (caust*0.10 + sparkle*0.35) * water;",
    // letters: above the water line crisp, below refracted and tinted by the sea
    "  float sub = clamp((uLine.x - uv.y)/max(0.0001, uLine.x - uLine.y), 0.0, 1.0);",
    "  vec2 tdisp = disp*(1.0 + sub*3.2) + vec2(sin(uv.y*90.0 + t*2.2)*0.0035*sub, 0.0);",
    "  float ta = texture2D(uText, uv + tdisp).a;",
    "  vec3 sea = texture2D(uTex, cover(zuv + disp*2.0, uRes, uImg)).rgb;",
    "  vec3 tcol = mix(vec3(0.985,0.975,0.95), sea*1.35 + vec3(0.06,0.14,0.14), smoothstep(0.0,1.0,sub)*0.6);",
    "  float a = ta * uTextOn * (1.0 - sub*0.22);",
    "  col = mix(col, tcol, a);",
    "  float foam = exp(-abs(uv.y - uLine.x - w.x*0.01)*260.0) * texture2D(uText, uv + vec2(0.0,0.004)).a * uTextOn;",
    "  col += foam*0.55;",
    "  float vig = smoothstep(1.25, 0.25, length((uv-0.5)*vec2(asp*0.75,1.0)));",
    "  col *= mix(0.42, 1.0, vig);",
    "  col = mix(col, col*vec3(0.75,0.86,0.86), uScroll);",
    "  col *= 1.0 - uScroll*0.5;",
    "  col = mix(vec3(0.039,0.082,0.078), col, uReveal);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var DEST_FS = COMMON + [
    "uniform sampler2D uA; uniform sampler2D uB; uniform vec2 uRes; uniform vec2 uImgA; uniform vec2 uImgB;",
    "uniform float uP; uniform float uTime; uniform vec2 uMouse; uniform float uVel;",
    "void main(){",
    "  vec2 uv = vUv; float asp = uRes.x/uRes.y;",
    "  vec2 m = (uMouse-0.5)*0.02;",
    "  float n = fbm(uv*vec2(asp,1.0)*2.2 + vec2(uTime*0.03, 0.0));",
    "  float v = n*0.45 + (1.0-uv.y)*0.55;",
    "  float p = uP;",
    "  float mask = 1.0 - smoothstep(p*1.3-0.3, p*1.3, v);",
    "  float e = clamp(mask*(1.0-mask)*4.0, 0.0, 1.0);",
    "  vec2 st = vec2(0.0, uVel*0.04*(uv.y-0.5));",
    "  vec2 ua = (uv-0.5)/(1.0+p*0.18)+0.5 + vec2(0.0, e*0.05) + (n-0.5)*e*0.12 + m + st;",
    "  vec2 ub = (uv-0.5)/(1.18-p*0.18)+0.5 - vec2(0.0, e*0.05) - (n-0.5)*e*0.12 + m + st;",
    "  vec3 a = texture2D(uA, cover(ua,uRes,uImgA)).rgb;",
    "  vec2 cb = cover(ub,uRes,uImgB);",
    "  vec3 b = vec3(texture2D(uB, cb + vec2(e*0.012,0.0)).r, texture2D(uB, cb).g, texture2D(uB, cb - vec2(e*0.012,0.0)).b);",
    "  vec3 col = mix(a, b, mask);",
    "  col += e*vec3(1.0,0.36,0.2)*0.22;",
    "  float vig = smoothstep(1.3, 0.2, length((uv-0.5)*vec2(asp*0.8,1.0)));",
    "  col *= mix(0.55, 1.0, vig);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function shader(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  function program(gl, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(p, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); var nm = info.name.replace("[0]", ""); U[nm] = gl.getUniformLocation(p, info.name); }
    return U;
  }
  function texture(gl, src, unit) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 21, 20, 255]));
    return t;
  }
  function loadImage(url) {
    return new Promise(function (res, rej) { var im = new Image(); im.decoding = "async"; im.onload = function () { res(im); }; im.onerror = rej; im.src = url; });
  }
  function context(canvas) {
    var o = { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" };
    return canvas.getContext("webgl", o) || canvas.getContext("experimental-webgl", o);
  }
  function fit(canvas, gl, maxDpr) {
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 1.5);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); return true; }
    return false;
  }
  function visibility(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }, { rootMargin: "100px" }).observe(el);
  }

  /* ------------------------------------------------------------ Capa */
  function Hero(canvas, opts) {
    var gl = context(canvas);
    if (!gl) throw new Error("no webgl");
    var U = program(gl, HERO_FS);
    var tex = texture(gl, null, 0), text = texture(gl, null, 1);
    gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uText, 1);
    var textCanvas = document.createElement("canvas"), tctx = textCanvas.getContext("2d");
    var img = { w: 1, h: 1 }, rip = new Float32Array(48), ripI = 0, start = performance.now();
    for (var i = 0; i < 12; i++) rip[i * 4 + 2] = -100;
    var state = { scroll: 0, reveal: 0, textOn: 0, mouse: [0.5, 0.5], tm: [0.5, 0.5] };
    var line = [0.42, 0.3, 0.6], running = true, visible = true, raf = 0, last = { x: -1, y: -1, t: 0 };
    var reduced = opts && opts.reduced;

    function drawText() {
      var W = canvas.width, H = canvas.height;
      textCanvas.width = W; textCanvas.height = H;
      tctx.clearRect(0, 0, W, H);
      var mobile = canvas.clientWidth < 700;
      var size = mobile ? W * 0.27 : Math.min(W * 0.205, H * 0.5);
      var FONT = function (s) { return "italic 500 " + s + "px 'Bodoni Moda', 'Didot', 'Bodoni 72', serif"; };
      tctx.font = FONT(size);
      var tw = tctx.measureText("Santiago").width, maxW = W * (mobile ? 0.9 : 0.86);
      if (tw > maxW) { size = size * maxW / tw; tctx.font = FONT(size); }
      tctx.textAlign = "center"; tctx.textBaseline = "alphabetic"; tctx.fillStyle = "#fff";
      var cy = H * (mobile ? 0.5 : 0.56);
      tctx.fillText("Santiago", W / 2, cy);
      // linha de água ~ a meio das letras
      var top = cy - size * 0.68, bottom = cy + size * 0.2;
      line = [1 - (cy - size * 0.28) / H, 1 - bottom / H, 1 - top / H];
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, text);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }
    function resize() { fit(canvas, gl, 1.5); drawText(); }
    function ripple(x, y, amp) {
      var t = (performance.now() - start) / 1000;
      rip[ripI * 4] = x; rip[ripI * 4 + 1] = y; rip[ripI * 4 + 2] = t; rip[ripI * 4 + 3] = amp;
      ripI = (ripI + 1) % 12;
    }
    function pointer(e) {
      var r = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      var x = (p.clientX - r.left) / r.width, y = 1 - (p.clientY - r.top) / r.height;
      state.tm = [x, y];
      var now = performance.now(), dx = x - last.x, dy = y - last.y;
      if (now - last.t > 70 && (dx * dx + dy * dy > 0.0009 || e.type === "pointerdown")) {
        ripple(x, y, e.type === "pointerdown" ? 1.6 : 0.85);
        last = { x: x, y: y, t: now };
      }
    }
    canvas.parentNode.addEventListener("pointermove", pointer, { passive: true });
    canvas.parentNode.addEventListener("pointerdown", pointer, { passive: true });
    canvas.parentNode.addEventListener("touchmove", pointer, { passive: true });
    window.addEventListener("resize", resize);
    visibility(canvas, function (v) { visible = v; if (v && !raf) loop(); });

    var auto = 0;
    function frame() {
      var t = (performance.now() - start) / 1000;
      if (t - auto > (reduced ? 999 : 2.6)) { auto = t; if (!reduced) ripple(0.2 + Math.random() * 0.6, 0.15 + Math.random() * 0.35, 0.7); }
      state.mouse[0] += (state.tm[0] - state.mouse[0]) * 0.05; state.mouse[1] += (state.tm[1] - state.mouse[1]) * 0.05;
      gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform2f(U.uImg, img.w, img.h);
      gl.uniform1f(U.uTime, t); gl.uniform1f(U.uScroll, state.scroll); gl.uniform1f(U.uReveal, state.reveal);
      gl.uniform1f(U.uTextOn, state.textOn); gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
      gl.uniform3f(U.uLine, line[0], line[1], line[2]);
      gl.uniform4fv(U.uRip, rip);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() { raf = 0; if (!visible || !running) return; frame(); raf = requestAnimationFrame(loop); }

    var ready = loadImage(opts.src).then(function (im) {
      img = { w: im.naturalWidth, h: im.naturalHeight };
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      var f = document.fonts && document.fonts.load ? document.fonts.load("italic 500 100px 'Bodoni Moda'") : Promise.resolve();
      return f.then(function () { resize(); loop(); });
    });
    return { state: state, ready: ready, ripple: ripple, resize: resize };
  }

  /* ------------------------------------------------------------ Destinos */
  function Dest(canvas, urls) {
    var gl = context(canvas);
    if (!gl) throw new Error("no webgl");
    var U = program(gl, DEST_FS);
    var texA = texture(gl, null, 0), texB = texture(gl, null, 1);
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);
    var imgs = [], state = { f: 0, vel: 0, mouse: [0.5, 0.5], tm: [0.5, 0.5] }, cur = [-1, -1], start = performance.now(), visible = false, raf = 0;
    function bind(unit, t, i) {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[i]);
    }
    canvas.parentNode.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(); state.tm = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }, { passive: true });
    window.addEventListener("resize", function () { fit(canvas, gl, 1.5); });
    visibility(canvas, function (v) { visible = v; if (v && !raf && imgs.length) loop(); });
    function frame() {
      fit(canvas, gl, 1.5);
      var n = imgs.length, f = Math.max(0, Math.min(n - 1, state.f));
      var i = Math.min(n - 2, Math.floor(f)), fr = f - i;
      if (f >= n - 1) { i = n - 2; fr = 1; }
      var p = fr < 0.42 ? 0 : (fr > 0.98 ? 1 : (fr - 0.42) / 0.56);
      p = p * p * (3 - 2 * p);
      if (cur[0] !== i) { bind(0, texA, i); bind(1, texB, i + 1); cur = [i, i + 1]; }
      state.mouse[0] += (state.tm[0] - state.mouse[0]) * 0.06; state.mouse[1] += (state.tm[1] - state.mouse[1]) * 0.06;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uImgA, imgs[i].naturalWidth, imgs[i].naturalHeight);
      gl.uniform2f(U.uImgB, imgs[i + 1].naturalWidth, imgs[i + 1].naturalHeight);
      gl.uniform1f(U.uP, p); gl.uniform1f(U.uTime, (performance.now() - start) / 1000);
      gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]); gl.uniform1f(U.uVel, state.vel);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() { raf = 0; if (!visible) return; frame(); raf = requestAnimationFrame(loop); }
    var ready = Promise.all(urls.map(loadImage)).then(function (list) { imgs = list; fit(canvas, gl, 1.5); if (visible) loop(); });
    return { state: state, ready: ready };
  }

  window.LevyGL = { Hero: Hero, Dest: Dest };
})();
