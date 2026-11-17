/* Levy Travel — o arquipélago em 3D (Three.js r128).
   Relevo gerado a partir dos contornos reais (Natural Earth) e das altitudes dos picos;
   cada ilha é uma rocha a flutuar no nevoeiro, como uma maqueta. */
(function () {
  "use strict";
  if (typeof THREE === "undefined") return;

  var K = 100;                       // unidades por grau
  var LAT0 = 15.95, LON0 = -24.0, COS = Math.cos(15.5 * Math.PI / 180);
  var HM = 0.0048;                   // unidades por metro (relevo exagerado ~4x)

  function px(lon) { return (lon - LON0) * COS * K; }
  function pz(lat) { return (LAT0 - lat) * K; }

  /* Picos e relevo de cada ilha: [lon, lat, altitude m, raio em graus] */
  var RELIEF = {
    "Santiago": { base: 120, peaks: [[-23.637, 15.045, 1394, 0.055], [-23.68, 15.18, 1064, 0.05], [-23.66, 15.11, 820, 0.05], [-23.6, 14.98, 520, 0.05], [-23.73, 15.25, 420, 0.04]] },
    "Fogo": { base: 300, peaks: [[-24.35, 14.95, 2829, 0.085]] },
    "Santo Antão": { base: 250, peaks: [[-25.17, 17.07, 1979, 0.09], [-25.05, 17.1, 1500, 0.08]] },
    "São Nicolau": { base: 120, peaks: [[-24.32, 16.62, 1312, 0.06], [-24.15, 16.58, 500, 0.05]] },
    "São Vicente": { base: 60, peaks: [[-24.95, 16.86, 725, 0.04]] },
    "Brava": { base: 150, peaks: [[-24.7, 14.86, 976, 0.04]] },
    "Santa Luzia": { base: 40, peaks: [[-24.74, 16.76, 395, 0.03]] },
    "Sal": { base: 15, peaks: [[-22.95, 16.75, 406, 0.035]] },
    "Boa Vista": { base: 30, peaks: [[-22.85, 16.08, 387, 0.06]] },
    "Maio": { base: 30, peaks: [[-23.18, 15.25, 436, 0.05]] },
    "": { base: 30, peaks: [] }
  };

  /* ruído determinístico */
  function hash(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function ridged(x, y) {
    var v = 0, a = 0.5, f = 1;
    for (var i = 0; i < 5; i++) { var n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1); v += a * n * n; f *= 2.1; a *= 0.5; }
    return v;
  }
  function fbm(x, y) { var v = 0, a = 0.5, f = 1; for (var i = 0; i < 4; i++) { v += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return v; }

  function inside(ring, x, y) {
    var c = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function coastDist(ring, x, y) {
    var m = 1e9;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var ax = ring[j][0], ay = ring[j][1], bx = ring[i][0], by = ring[i][1];
      var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? ((x - ax) * dx + (y - ay) * dy) / l : 0;
      t = Math.max(0, Math.min(1, t));
      var ex = ax + t * dx - x, ey = ay + t * dy - y, d = ex * ex + ey * ey;
      if (d < m) m = d;
    }
    return Math.sqrt(m);
  }

  function elevationM(rel, lon, lat, dc) {
    var coast = Math.min(1, dc / 0.03); coast = coast * coast * (3 - 2 * coast);
    var bump = 0;
    for (var i = 0; i < rel.peaks.length; i++) {
      var p = rel.peaks[i], dx = (lon - p[0]) / p[3], dy = (lat - p[1]) / p[3];
      bump = Math.max(bump, p[2] * Math.exp(-(dx * dx + dy * dy)));
    }
    var r = ridged(lon * 38, lat * 38);
    var h = rel.base * (0.6 + fbm(lon * 60, lat * 60)) + bump * (0.45 + 0.85 * r);
    return coast * h;
  }

  var COL = {
    sand: new THREE.Color("#c8b083"), dry: new THREE.Color("#9c7b52"), earth: new THREE.Color("#6e4f37"),
    green: new THREE.Color("#55703a"), deep: new THREE.Color("#3b5a2e"), rock: new THREE.Color("#3d3530"),
    peak: new THREE.Color("#6a5d52"), base: new THREE.Color("#211c19"), base2: new THREE.Color("#3a2c24")
  };
  Object.keys(COL).forEach(function (k) { COL[k].convertSRGBToLinear(); });

  function buildIsland(isl, step) {
    var ring = isl.ring, rel = RELIEF[isl.name] || RELIEF[""];
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    ring.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var pad = step * 2; minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    var nx = Math.ceil((maxX - minX) / step) + 1, ny = Math.ceil((maxY - minY) / step) + 1;
    var pos = new Float32Array(nx * ny * 3), ins = new Uint8Array(nx * ny), hgt = new Float32Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var lon = minX + i * step, lat = minY + j * step, k = j * nx + i;
      var inn = inside(ring, lon, lat), dc = coastDist(ring, lon, lat), y;
      if (inn) { y = 0.04 + elevationM(rel, lon, lat, dc) * HM; ins[k] = 1; }
      else { y = -0.05 - Math.min(1, dc / (step * 2)) * 0.5; ins[k] = dc < step * 1.6 ? 2 : 0; }
      hgt[k] = y;
      pos[k * 3] = px(lon); pos[k * 3 + 1] = y; pos[k * 3 + 2] = pz(lat);
    }
    var idx = [];
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      var keep = (ins[a] === 1 || ins[b] === 1 || ins[c] === 1 || ins[d] === 1) && ins[a] && ins[b] && ins[c] && ins[d];
      if (keep) { idx.push(a, c, b, b, c, d); }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    var nrm = g.attributes.normal.array, col = new Float32Array(nx * ny * 3), c3 = new THREE.Color();
    var maxH = 0; for (k = 0; k < hgt.length; k++) maxH = Math.max(maxH, hgt[k]);
    for (k = 0; k < nx * ny; k++) {
      var h = hgt[k], slope = 1 - nrm[k * 3 + 1], lonk = minX + (k % nx) * step, latk = minY + Math.floor(k / nx) * step;
      var n = fbm(lonk * 90, latk * 90), rel01 = maxH > 0 ? h / maxH : 0;
      if (h < 0.09) c3.copy(COL.sand).lerp(COL.dry, Math.max(0, h) / 0.09);
      else c3.copy(COL.dry).lerp(COL.earth, Math.min(1, rel01 * 1.6));
      var greenAmt = Math.max(0, Math.min(1, (n - 0.36) * 3.2)) * (1 - Math.min(1, slope * 2.2)) * (rel01 > 0.08 ? 1 : 0.2);
      if (isl.name === "Sal" || isl.name === "Boa Vista" || isl.name === "Maio") greenAmt *= 0.15;
      c3.lerp(n > 0.55 ? COL.deep : COL.green, greenAmt * 0.85);
      c3.lerp(COL.rock, Math.min(1, slope * 1.8) * 0.75);
      if (rel01 > 0.75) c3.lerp(COL.peak, (rel01 - 0.75) * 2);
      if (h < 0) c3.copy(COL.rock);
      col[k * 3] = c3.r; col[k * 3 + 1] = c3.g; col[k * 3 + 2] = c3.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));

    /* rocha por baixo: anéis que encolhem até uma ponta irregular */
    var L = 9, simp = [], stepR = Math.max(1, Math.floor(ring.length / 70));
    for (i = 0; i < ring.length; i += stepR) simp.push(ring[i]);
    var cx = 0, cz = 0; simp.forEach(function (p) { cx += px(p[0]); cz += pz(p[1]); }); cx /= simp.length; cz /= simp.length;
    var span = Math.max(px(maxX) - px(minX), pz(minY) - pz(maxY));
    var depth = span * 0.55 + 4;
    var upos = [], ucol = [], uidx = [], M = simp.length;
    for (var l = 0; l <= L; l++) {
      var tt = l / L, s = 1 - Math.pow(tt, 1.25) * 0.94, yy = -0.02 - tt * depth;
      for (i = 0; i < M; i++) {
        var jit = l === 0 ? 0 : (hash(i * 3.1, l * 7.7) - 0.5) * 0.22 * span * (0.15 + tt * 0.5);
        var ox = px(simp[i][0]) - cx, oz = pz(simp[i][1]) - cz;
        upos.push(cx + ox * s + jit, yy + (l ? (hash(i, l) - 0.5) * depth * 0.07 : 0), cz + oz * s + jit * 0.7);
        c3.copy(COL.base2).lerp(COL.base, tt).multiplyScalar(0.75 + hash(i * 1.7, l * 2.3) * 0.5);
        ucol.push(c3.r, c3.g, c3.b);
      }
    }
    upos.push(cx, -depth * 1.05, cz); ucol.push(COL.base.r, COL.base.g, COL.base.b);
    for (l = 0; l < L; l++) for (i = 0; i < M; i++) {
      var a0 = l * M + i, a1 = l * M + (i + 1) % M, b0 = a0 + M, b1 = a1 + M;
      uidx.push(a0, a1, b0, a1, b1, b0);
    }
    var tip = (L + 1) * M;
    for (i = 0; i < M; i++) uidx.push(L * M + i, L * M + (i + 1) % M, tip);
    var ug = new THREE.BufferGeometry();
    ug.setAttribute("position", new THREE.Float32BufferAttribute(upos, 3));
    ug.setAttribute("color", new THREE.Float32BufferAttribute(ucol, 3));
    ug.setIndex(uidx); ug.computeVertexNormals();

    var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0, side: THREE.DoubleSide });
    var grp = new THREE.Group();
    grp.add(new THREE.Mesh(g, mat));
    var under = new THREE.Mesh(ug, mat); grp.add(under);
    var labelLat = isl.name === "Santiago" ? 15.12 : (minY + maxY) / 2, labelLon = (minX + maxX) / 2;
    return { group: grp, rel: rel, ring: ring, center: new THREE.Vector3(px(labelLon), maxH + 1.2, pz(labelLat)), maxH: maxH, depth: depth };
  }

  function cloudTexture(seed) {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var x = c.getContext("2d");
    for (var i = 0; i < 70; i++) {
      var a = hash(seed + i, i * 1.3) * Math.PI * 2, d = Math.pow(hash(i, seed * 2.1), 0.7) * 80;
      var cx = 128 + Math.cos(a) * d * 1.3, cy = 128 + Math.sin(a) * d * 0.55;
      var r = 14 + hash(i * 2.7, seed) * 40 * (1 - d / 110);
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(226,234,230,0.13)"); g.addColorStop(0.6, "rgba(226,234,230,0.05)"); g.addColorStop(1, "rgba(226,234,230,0)");
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    }
    var t = new THREE.CanvasTexture(c); return t;
  }

  function Archipelago(canvas, opts) {
    opts = opts || {};
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    var BG = new THREE.Color("#0a1514");
    renderer.setClearColor(BG, 1);
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 80, 520);
    var camera = new THREE.PerspectiveCamera(38, 1, 0.5, 2000);

    scene.add(new THREE.HemisphereLight(0xcfe3dc, 0x1a1410, 0.55));
    var sun = new THREE.DirectionalLight(0xffd9a8, 2.1); sun.position.set(-70, 55, 30); scene.add(sun);
    var rim = new THREE.DirectionalLight(0x7fb7ad, 0.45); rim.position.set(80, 20, -90); scene.add(rim);

    var geo = (window.LEVY_GEO || { islands: [] }).islands, islands = {}, all = [];
    geo.forEach(function (isl) {
      var o = buildIsland(isl, isl.name === "Santiago" ? 0.0017 : 0.0034);
      o.name = isl.name; o.phase = hash(o.center.x, o.center.z) * 6.28;
      scene.add(o.group); all.push(o); if (isl.name) islands[isl.name] = o;
    });
    var S = islands["Santiago"];

    /* nuvens */
    var ctexs = [cloudTexture(1), cloudTexture(7), cloudTexture(13)], clouds = [];
    for (var i = 0; i < 30; i++) {
      var base = 0.5 + Math.random() * 0.4;
      var m = new THREE.SpriteMaterial({ map: ctexs[i % 3], transparent: true, depthWrite: false, opacity: base, fog: false, rotation: (Math.random() - 0.5) * 0.4 });
      var sp = new THREE.Sprite(m), sc = 50 + Math.random() * 70;
      sp.scale.set(sc, sc * 0.6, 1);
      var near = i < 10;
      sp.userData.base = base;
      sp.position.set(
        near ? S.center.x + (Math.random() - 0.5) * 90 : (Math.random() - 0.5) * 320,
        near ? 30 + Math.random() * 30 : 20 + Math.random() * 60,
        near ? S.center.z + (Math.random() - 0.5) * 90 : (Math.random() - 0.5) * 300);
      sp.userData.v = 0.6 + Math.random() * 1.2;
      scene.add(sp); clouds.push(sp);
    }
    /* poeira */
    var dg = new THREE.BufferGeometry(), dp = [];
    for (i = 0; i < 900; i++) dp.push((Math.random() - 0.5) * 420, -60 + Math.random() * 160, (Math.random() - 0.5) * 380);
    dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
    var dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfd6cf, size: 0.5, transparent: true, opacity: 0.45, depthWrite: false }));
    scene.add(dust);

    /* altura do terreno de Santiago num ponto */
    function heightAt(lon, lat) {
      var dc = coastDist(S.ring, lon, lat);
      return inside(S.ring, lon, lat) ? 0.04 + elevationM(S.rel, lon, lat, dc) * HM : 0;
    }
    function placeVec(p, lift) { return new THREE.Vector3(px(p.lon), heightAt(p.lon, p.lat) + (lift || 0), pz(p.lat)); }

    /* percurso */
    var routeMat = new THREE.MeshBasicMaterial({ color: 0xff5a36, fog: false, toneMapped: false });
    var routeMesh = null, routeCount = 0, routeProg = { v: 0 };
    function buildRoute(ids) {
      if (routeMesh) { scene.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null; }
      if (!ids || ids.length < 2) return;
      var P = window.LEVY_PLACES, pts = [];
      for (var a = 0; a < ids.length - 1; a++) {
        var A = P[ids[a]], B = P[ids[a + 1]], n = 26;
        var nx = -(B.lat - A.lat), ny = (B.lon - A.lon), bend = 0.12;
        for (var s = (a ? 1 : 0); s <= n; s++) {
          var t = s / n, arc = Math.sin(t * Math.PI) * bend;
          var lon = A.lon + (B.lon - A.lon) * t + nx * arc, lat = A.lat + (B.lat - A.lat) * t + ny * arc;
          pts.push(new THREE.Vector3(px(lon), heightAt(lon, lat) + 0.35 + Math.sin(t * Math.PI) * 0.6, pz(lat)));
        }
      }
      var curve = new THREE.CatmullRomCurve3(pts);
      var tube = new THREE.TubeGeometry(curve, pts.length * 3, 0.09, 6, false);
      routeCount = tube.index.count;
      tube.setDrawRange(0, 0);
      routeMesh = new THREE.Mesh(tube, routeMat); scene.add(routeMesh);
    }

    /* câmara */
    var archC = new THREE.Vector3(px(-24.05), 0, pz(15.95));
    var shots = {
      arch: { pos: archC.clone().add(new THREE.Vector3(0, 250, 215)), look: archC.clone().add(new THREE.Vector3(0, -10, 10)) },
      santiago: { pos: S.center.clone().add(new THREE.Vector3(10, 42, 44)), look: S.center.clone().add(new THREE.Vector3(0, -2, 2)) }
    };
    var cam = { pos: shots.arch.pos.clone(), look: shots.arch.look.clone() };
    var target = { pos: cam.pos.clone(), look: cam.look.clone() };
    var tourShot = null, dive = 0, mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var mobile = function () { return canvas.clientWidth < 760; };

    function shotForTour(ids) {
      var P = window.LEVY_PLACES, box = new THREE.Box3();
      ids.forEach(function (id) { box.expandByPoint(placeVec(P[id])); });
      var c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      var ext = Math.max(size.x, size.z, 6);
      var dist = ext * 1.4 + 22;
      var dir = new THREE.Vector3(0.28, 0.95, 0.9).normalize();
      var look = c.clone();
      if (!mobile()) look.x -= ext * 0.1 + 1.5; else look.z += ext * 0.18 + 2;
      return { pos: look.clone().add(dir.multiplyScalar(dist * (mobile() ? 1.25 : 1))), look: look };
    }

    function compose() {
      var a = shots.arch, b = shots.santiago, t = dive;
      var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      target.pos.copy(a.pos).lerp(b.pos, e); target.look.copy(a.look).lerp(b.look, e);
      if (mobile()) { target.pos.y *= 1.25; target.pos.z += 12 * (1 - e) + 14 * e; }
      if (tourShot) { target.pos.copy(tourShot.pos); target.look.copy(tourShot.look); }
    }

    /* etiquetas HTML */
    var labelsEl = opts.labels, labels = [];
    function makeLabel(text, kind, pos) {
      var el = document.createElement("div"); el.className = "lab lab--" + kind;
      el.innerHTML = '<i></i><span>' + text + '</span>';
      labelsEl.appendChild(el);
      var o = { el: el, pos: pos, kind: kind, on: false }; labels.push(o); return o;
    }
    all.forEach(function (o) { if (o.name) o.label = makeLabel(o.name, o.name === "Santiago" ? "home" : "isl", o.center.clone()); });
    var placeLabels = {};
    Object.keys(window.LEVY_PLACES || {}).forEach(function (id) {
      placeLabels[id] = makeLabel(window.LEVY_PLACES[id].name, "place", placeVec(window.LEVY_PLACES[id], 0.4));
    });
    var activeIds = [];
    function updateLabels() {
      var w = canvas.clientWidth, h = canvas.clientHeight, v = new THREE.Vector3();
      labels.forEach(function (o) {
        var show = false;
        if (o.kind === "isl") show = dive < 0.55 && !tourShot;
        if (o.kind === "home") show = !tourShot;
        if (o.kind === "place") show = !!tourShot && activeIds.indexOf(o.id) >= 0;
        if (show) {
          v.copy(o.pos).project(camera);
          if (v.z > 1) show = false;
          else {
            var sx = (v.x + 1) / 2 * w;
            o.el.style.transform = "translate3d(" + sx.toFixed(1) + "px," + ((1 - v.y) / 2 * h).toFixed(1) + "px,0)";
            o.el.classList.toggle("is-left", sx > w - 170);
          }
        }
        if (show !== o.on) { o.on = show; o.el.classList.toggle("is-on", show); }
      });
    }
    Object.keys(placeLabels).forEach(function (id) { placeLabels[id].id = id; });

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.fov = w < 760 ? 50 : 38; camera.updateProjectionMatrix();
      compose();
    }
    window.addEventListener("resize", resize);
    canvas.parentNode.addEventListener("pointermove", function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5); mouse.ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    var visible = false, raf = 0, clock = new THREE.Clock(), started = false;
    function frame() {
      var raw = clock.getDelta(), dt = Math.min(0.05, raw), dl = Math.min(0.5, raw), t = clock.elapsedTime;
      var k = function (rate) { return 1 - Math.exp(-rate * dl); };
      mouse.x += (mouse.tx - mouse.x) * k(2.4); mouse.y += (mouse.ty - mouse.y) * k(2.4);
      cam.pos.lerp(target.pos, k(3.2)); cam.look.lerp(target.look, k(4));
      var span = cam.pos.distanceTo(cam.look);
      camera.position.copy(cam.pos);
      camera.position.x += mouse.x * span * 0.06 + Math.sin(t * 0.13) * span * 0.012;
      camera.position.y += -mouse.y * span * 0.04;
      camera.lookAt(cam.look);
      scene.fog.near = span * 0.75; scene.fog.far = span * 2.6 + 60;
      all.forEach(function (o) {
        var amp = o.name === "Santiago" ? 0.25 : 0.9;
        o.group.position.y = Math.sin(t * 0.5 + o.phase) * amp * (tourShot ? 0.2 : 1);
        if (o.label) o.label.pos.y = o.center.y + o.group.position.y;
      });
      var cloudK = tourShot ? 0 : 1;
      clouds.forEach(function (c) {
        c.position.x += c.userData.v * dt * 1.6; if (c.position.x > 190) c.position.x = -190;
        c.material.opacity += (c.userData.base * cloudK - c.material.opacity) * k(3);
        c.visible = c.material.opacity > 0.01;
      });
      dust.rotation.y += dt * 0.004;
      if (routeMesh) routeMesh.geometry.setDrawRange(0, Math.floor(routeCount * routeProg.v / 6) * 6);
      renderer.render(scene, camera);
      updateLabels();
    }
    function loop() { raf = 0; if (!visible) return; frame(); raf = requestAnimationFrame(loop); }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) { clock.getDelta(); loop(); }
    }, { rootMargin: "120px" }).observe(canvas);
    resize();
    renderer.compile(scene, camera);

    return {
      setDive: function (p) { dive = Math.max(0, Math.min(1, p)); compose(); },
      setTour: function (id) {
        var ids = id ? (window.LEVY_ROUTES[id] || []) : [];
        activeIds = ids.slice();
        if (!id) { tourShot = null; buildRoute(null); compose(); return; }
        tourShot = shotForTour(ids.length ? ids : ["praia"]);
        buildRoute(ids);
        routeProg.v = 0;
        if (window.gsap) gsap.to(routeProg, { v: 1, duration: 2.2, ease: "power2.inOut", overwrite: true });
        else routeProg.v = 1;
        compose();
      },
      resize: resize,
      renderOnce: function () { frame(); }
    };
  }

  window.LevyIsland = { Archipelago: Archipelago };
})();
