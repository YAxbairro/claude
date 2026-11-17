/* Levy Travel — orquestração: scroll, capítulos, interações. */
(function () {
  "use strict";

  var TOURS = window.LEVY_TOURS || [], TRANSFERS = window.LEVY_TRANSFERS || [], CONTACT = window.LEVY_CONTACT || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var IMG = function (n) { return "assets/img/" + n + ".jpg"; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var byId = function (id) { return TOURS.filter(function (t) { return t.id === id; })[0]; };

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animate = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined" && !reduced;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lenis = null, hero = null, island = null, dest = null;
  if (animate) { root.classList.add("anim"); gsap.registerPlugin(ScrollTrigger); }

  var LEVEL = { 1: "Fácil", 2: "Nível 2", 3: "Nível 3 · exigente" };

  /* ---------------------------------------------------------------- utilidades */
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }); }
  function goTo(el) { if (!el) return; scrollToY(el.getBoundingClientRect().top + window.scrollY); }
  function lock(on) { document.body.classList.toggle("is-locked", on); if (lenis) { if (on) lenis.stop(); else lenis.start(); } }
  function splitChars(el) {
    var t = el.textContent; el.textContent = "";
    return t.split("").map(function (ch) { var s = document.createElement("span"); s.className = "ch"; s.textContent = ch === " " ? " " : ch; el.appendChild(s); return s; });
  }
  function splitWords(el) {
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
          var o = document.createElement("span"); o.className = "split-w"; var i = document.createElement("span"); i.textContent = w; o.appendChild(i); frag.appendChild(o); out.push(i);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        var o2 = document.createElement("span"); o2.className = "split-w"; var i2 = document.createElement("span");
        el.replaceChild(o2, node); i2.appendChild(node); o2.appendChild(i2); out.push(i2);
      }
    });
    return out;
  }
  var SCR = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789°′";
  function scramble(el, text) {
    if (!animate) { el.textContent = text; return; }
    var o = { p: 0 };
    gsap.to(o, { p: 1, duration: .8, ease: "power2.out", overwrite: true, onUpdate: function () {
      var n = Math.floor(o.p * text.length), s = text.slice(0, n);
      for (var i = n; i < text.length; i++) s += text[i] === " " ? " " : SCR[Math.floor(Math.random() * SCR.length)];
      el.textContent = s;
    } });
  }

  /* ---------------------------------------------------------------- grão + relógio */
  (function grain() {
    var c = document.createElement("canvas"); c.width = c.height = 180;
    var x = c.getContext("2d"), d = x.createImageData(180, 180);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    try { $(".grain").style.backgroundImage = "url(" + c.toDataURL() + ")"; } catch (e) { /* sem grão */ }
  })();
  function tick() {
    var d = new Date(Date.now() - 3600 * 1000), h = d.getUTCHours(), m = d.getUTCMinutes();
    $("#clock").textContent = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  tick(); setInterval(tick, 20000);
  $("#year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------- scroll suave */
  if (animate && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href"); if (id.length < 2) return;
    var t = $(id); if (!t) return;
    e.preventDefault(); closeMenu(); closeDetail();
    if (id === "#excursoes") { stageGo(0); return; }
    goTo(t);
  });

  /* barra: cor conforme o fundo, esconde ao descer */
  var bar = $("#bar"), lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    bar.classList.toggle("is-hidden", y > lastY + 4 && y > window.innerHeight * 0.8 && !document.body.classList.contains("menu-open"));
    if (y < lastY - 4) bar.classList.remove("is-hidden");
    lastY = y;
  }, { passive: true });
  function inkWhen(sel, test) {
    $$(sel).forEach(function (el) {
      if (!animate) return;
      ScrollTrigger.create({ trigger: el, start: "top 40px", end: "bottom 40px", onToggle: function (s) { if (!test || test()) bar.classList.toggle("is-ink", s.isActive); else bar.classList.remove("is-ink"); } });
    });
  }
  inkWhen(".intro"); inkWhen(".book"); inkWhen(".tr", function () { return $("#transfers").dataset.mode === "day"; });

  /* ---------------------------------------------------------------- menu */
  var menuBtn = $("#menuBtn"), menu = $("#menu");
  function openMenu() {
    menu.hidden = false; menuBtn.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-open"); bar.classList.remove("is-ink"); lock(true);
    if (animate) {
      gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: .9, ease: "expo.inOut" });
      gsap.fromTo($$(".menu__nav a"), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: .06, ease: "expo.out", delay: .35 });
      gsap.fromTo("#menuImg", { scale: 1.3 }, { scale: 1, duration: 1.6, ease: "expo.out" });
    }
  }
  function closeMenu() {
    if (menu.hidden) return;
    menuBtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); lock(false);
    if (animate) gsap.to(menu, { clipPath: "inset(100% 0 0 0)", duration: .7, ease: "expo.inOut", onComplete: function () { menu.hidden = true; } });
    else menu.hidden = true;
    ScrollTrigger && ScrollTrigger.refresh && animate && ScrollTrigger.update();
  }
  menuBtn.addEventListener("click", function () { if (menu.hidden) openMenu(); else closeMenu(); });
  $$(".menu__nav a").forEach(function (a) {
    a.addEventListener("mouseenter", function () {
      var img = $("#menuImg"); if (img.getAttribute("src") === IMG(a.dataset.img)) return;
      img.src = IMG(a.dataset.img);
      if (animate) gsap.fromTo(img, { scale: 1.15, opacity: .4 }, { scale: 1, opacity: 1, duration: 1, ease: "expo.out" });
    });
  });

  /* ---------------------------------------------------------------- som do mar */
  var audio = null;
  $("#sound").addEventListener("click", function () {
    var btn = this, on = btn.getAttribute("aria-pressed") !== "true";
    try {
      if (!audio) {
        var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
        var len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch), last = 0; for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } }
        var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = .6;
        var swell = ctx.createGain(); swell.gain.value = .55;
        var master = ctx.createGain(); master.gain.value = 0;
        var lfo = ctx.createOscillator(); lfo.frequency.value = .085; var lfoG = ctx.createGain(); lfoG.gain.value = 380; lfo.connect(lfoG); lfoG.connect(lp.frequency);
        var lfo2 = ctx.createOscillator(); lfo2.frequency.value = .085; var lfo2G = ctx.createGain(); lfo2G.gain.value = .4; lfo2.connect(lfo2G); lfo2G.connect(swell.gain);
        src.connect(lp); lp.connect(swell); swell.connect(master); master.connect(ctx.destination);
        src.start(); lfo.start(); lfo2.start();
        audio = { ctx: ctx, master: master };
      }
      if (audio.ctx.state === "suspended") audio.ctx.resume();
      audio.master.gain.setTargetAtTime(on ? .5 : 0, audio.ctx.currentTime, .6);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Desligar som do mar" : "Ligar som do mar");
    } catch (e) { btn.hidden = true; }
  });

  /* ---------------------------------------------------------------- cursor + magnético */
  if (animate && fine) {
    var cur = $("#cursor"), lab = $("#cursorLabel");
    var cx = gsap.quickTo(cur, "x", { duration: .45, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: .45, ease: "power3" });
    window.addEventListener("pointermove", function (e) { cx(e.clientX); cy(e.clientY); cur.classList.add("is-on"); }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { cur.classList.remove("is-on"); });
    document.addEventListener("pointerover", function (e) {
      var l = e.target.closest("[data-cursor]"), a = e.target.closest("a, button, input, select, label");
      cur.classList.toggle("is-label", !!l); cur.classList.toggle("is-link", !l && !!a);
      if (l) lab.textContent = l.dataset.cursor;
    });
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .5, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", function () { gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1,.35)" }); });
    });
  }

  /* ---------------------------------------------------------------- 1 · CAPA */
  try {
    hero = window.LevyGL.Hero($("#heroGL"), { src: IMG("hero"), reduced: reduced });
    root.classList.add("gl-hero");
    if (!animate) { hero.state.reveal = 1; hero.state.textOn = 1; }
  } catch (e) { hero = null; }
  if (!fine) $("#heroHint").textContent = "Toque na água";
  if (fine) $("#hero").setAttribute("data-cursor", "Agite a água");

  if (animate) {
    ScrollTrigger.create({ trigger: "#hero", start: "top top", end: "bottom top", scrub: true, onUpdate: function (s) { if (hero) hero.state.scroll = s.progress; } });
    gsap.to(".hero__ui", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "45% top", scrub: true } });
  }

  /* ---------------------------------------------------------------- abertura */
  function loaderRun() {
    var L = $("#loader");
    if (!animate) { L && L.remove(); return Promise.resolve(); }
    lock(true); window.scrollTo(0, 0);
    var svg = $("#loaderIslands"), geo = (window.LEVY_GEO || { islands: [] }).islands;
    var W = 1000, H = 900, lonMin = -25.5, lonMax = -22.55, latMin = 14.72, latMax = 17.3, cos = Math.cos(16 * Math.PI / 180);
    var sx = W / ((lonMax - lonMin) * cos), sy = H / (latMax - latMin), s = Math.min(sx, sy);
    var ox = (W - (lonMax - lonMin) * cos * s) / 2, oy = (H - (latMax - latMin) * s) / 2;
    var P = function (lon, lat) { return [(ox + (lon - lonMin) * cos * s).toFixed(1), (oy + (latMax - lat) * s).toFixed(1)]; };
    var html = "";
    geo.forEach(function (isl) {
      var d = isl.ring.map(function (p, i) { var q = P(p[0], p[1]); return (i ? "L" : "M") + q[0] + " " + q[1]; }).join("") + "Z";
      html += '<path d="' + d + '" class="' + (isl.name === "Santiago" ? "is-home" : "") + '"/>';
    });
    svg.innerHTML = html;
    var paths = $$("path", svg), names = geo.map(function (g) { return g.name; }).filter(Boolean);
    paths.forEach(function (p) { var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    var cnt = { v: 0 }, cEl = $("#loaderCount"), nEl = $("#loaderName");
    var ready = Promise.all([hero ? hero.ready : Promise.resolve(), document.fonts ? document.fonts.ready : Promise.resolve()]);
    var minTime = new Promise(function (r) { setTimeout(r, 1900); });
    var tl = gsap.timeline();
    tl.to(paths, { strokeDashoffset: 0, duration: 1.6, stagger: .07, ease: "power2.inOut" }, 0)
      .to(cnt, { v: 100, duration: 2.1, ease: "power1.inOut", onUpdate: function () {
        var v = Math.round(cnt.v); cEl.textContent = (v < 10 ? "00" : v < 100 ? "0" : "") + v;
        nEl.textContent = v >= 96 ? "Santiago" : names[Math.min(names.length - 1, Math.floor(cnt.v / 100 * names.length))];
      } }, 0);
    return Promise.all([ready, minTime, new Promise(function (r) { tl.eventCallback("onComplete", r); })]).then(function () {
      return new Promise(function (done) {
        var home = $(".is-home", svg), bb = home.getBBox(), rect = svg.getBoundingClientRect();
        var sc = rect.width / W, hx = rect.left + (bb.x + bb.width / 2) * Math.min(sc, rect.height / H) + (rect.width - W * Math.min(sc, rect.height / H)) / 2;
        var hy = rect.top + (bb.y + bb.height / 2) * Math.min(sc, rect.height / H) + (rect.height - H * Math.min(sc, rect.height / H)) / 2;
        gsap.set(L, { clipPath: "circle(150% at " + hx + "px " + hy + "px)" });
        gsap.timeline({ onComplete: function () { L.remove(); lock(false); done(); } })
          .to([".loader__row", "path:not(.is-home)"], { opacity: 0, duration: .5, ease: "power2.in" }, 0)
          .to(home, { fill: "rgba(255,90,54,.9)", duration: .4 }, 0)
          .to(L, { clipPath: "circle(0% at " + hx + "px " + hy + "px)", duration: 1.2, ease: "expo.inOut" }, .45);
      });
    });
  }

  function heroIn() {
    if (!animate) return;
    if (hero) {
      gsap.to(hero.state, { reveal: 1, duration: 2.4, ease: "expo.out" });
      gsap.to(hero.state, { textOn: 1, duration: 1.8, delay: .5, ease: "power2.out" });
      setTimeout(function () { hero.ripple(.5, .45, 2.2); }, 700);
    } else {
      gsap.fromTo(".hero__word", { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.6, ease: "expo.out" });
    }
    gsap.fromTo(".bar", { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, delay: .6, ease: "expo.out", clearProps: "transform,opacity" });
    gsap.to("[data-hero]", { opacity: 1, duration: 1.2, stagger: .12, delay: .9, ease: "power2.out" });
  }

  /* ---------------------------------------------------------------- 2 · manifesto */
  function initIntro() {
    if (!animate) return;
    var el = $("#introText"), parts = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(" ")); return; } var s = document.createElement("span"); s.className = "w"; s.textContent = w; f.appendChild(s); parts.push(s); });
        el.replaceChild(f, n);
      } else { n.classList.add("w"); parts.push(n); }
    });
    gsap.to(parts, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true } });
    $$(".inl", el).forEach(function (i) { gsap.fromTo(i, { width: 0 }, { width: "1.7em", ease: "none", scrollTrigger: { trigger: i, start: "top 85%", end: "top 55%", scrub: true } }); });
  }

  /* ---------------------------------------------------------------- 3 · palco 3D */
  var stage = $("#ilhas"), STEPS = 2 + TOURS.length, stepVH = 85, curTour = -2, curChapter = -1;
  function stageGo(i) {
    if (root.classList.contains("no-3d")) { setHud(i); goTo(stage); return; }
    var top = stage.getBoundingClientRect().top + window.scrollY;
    var stepPx = (stage.offsetHeight - window.innerHeight) / STEPS;
    scrollToY(top + (2 + i + 0.5) * stepPx);
  }
  function renderIndex() {
    $("#tourIndex").innerHTML = TOURS.map(function (t, i) {
      return '<li><button data-i="' + i + '"><span>' + esc(t.short) + '</span><span>' + t.price + ' €</span></button></li>';
    }).join("");
    $$("#tourIndex button").forEach(function (b) { b.addEventListener("click", function () { stageGo(+b.dataset.i); }); });
  }
  var CHAPTERS = [
    { k: "O arquipélago", t: "Dez ilhas a flutuar <em>no Atlântico.</em>", s: "Contornos reais de cada ilha, relevo exagerado para se ler a montanha. Barlavento a norte, Sotavento a sul." },
    { k: "Ilha de Santiago", t: "A ilha onde <em>Cabo Verde</em> começou.", s: "A capital, Praia. A primeira cidade, Cidade Velha, Património Mundial da UNESCO. O Pico da Antónia a 1394 m." },
    { k: "Excursões", t: "Onze maneiras de <em>conhecer a ilha.</em>", s: "Todas com guia em português e recolha na recepção do seu hotel em Praia." }
  ];
  function setChapter(i) {
    if (i === curChapter) return; curChapter = i;
    var c = CHAPTERS[i], box = $("#chapter");
    var apply = function () { $("#chapterKicker").textContent = c.k; $("#chapterTitle").innerHTML = c.t; $("#chapterSub").textContent = c.s; };
    if (!animate) { apply(); return; }
    gsap.to(box, { opacity: 0, y: -16, duration: .35, ease: "power2.in", overwrite: true, onComplete: function () {
      apply();
      var w = splitWords($("#chapterTitle"));
      gsap.set(box, { opacity: 1, y: 0 });
      gsap.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: .04, ease: "expo.out" });
      gsap.fromTo(["#chapterKicker", "#chapterSub"], { opacity: 0 }, { opacity: 1, duration: .8, delay: .2 });
    } });
  }
  function setHud(i) {
    if (i === curTour) return; curTour = i;
    var hud = $("#hud");
    $$("#tourIndex button").forEach(function (b) { b.classList.toggle("is-active", +b.dataset.i === i); });
    if (i < 0) {
      if (island) island.setTour(null);
      if (animate && !hud.hidden) gsap.to(hud, { opacity: 0, y: 20, duration: .4, onComplete: function () { hud.hidden = true; } }); else hud.hidden = true;
      return;
    }
    var t = TOURS[i];
    if (island) island.setTour(t.id);
    var fill = function () {
      $("#hudImg").src = IMG(t.img); $("#hudImg").alt = t.title;
      $("#hudTag").textContent = t.tag + " · " + t.length;
      $("#hudTitle").textContent = t.title; $("#hudLead").textContent = t.lead;
      $("#hudHours").textContent = t.hours; $("#hudMeet").textContent = t.meet;
      $("#hudLevel").textContent = t.level ? LEVEL[t.level] + " · " + t.walk : "Passeio";
      $("#hudPrice").textContent = t.price; $("#hudOpen").dataset.open = t.id;
    };
    if (!animate) { fill(); hud.hidden = false; return; }
    if (hud.hidden) { fill(); hud.hidden = false; gsap.fromTo(hud, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: "expo.out" }); gsap.fromTo("#hudImg", { scale: 1.25 }, { scale: 1, duration: 1.4, ease: "expo.out" }); return; }
    gsap.to(".hud__body > *, .hud__img img", { opacity: 0, duration: .2, overwrite: true, onComplete: function () {
      fill();
      gsap.fromTo(".hud__body > *", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, stagger: .04, ease: "expo.out" });
      gsap.fromTo(".hud__img img", { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" });
    } });
  }
  function initStage() {
    renderIndex();
    try {
      if (!animate) throw new Error("static");
      island = window.LevyIsland.Archipelago($("#islandGL"), { labels: $("#labels") });
    } catch (e) { island = null; }
    if (!island) {
      root.classList.add("no-3d"); setChapter(2); setHud(0);
      return;
    }
    stage.style.height = (STEPS * stepVH + 100) + "vh";
    setChapter(0);
    ScrollTrigger.create({
      trigger: stage, start: "top top", end: "bottom bottom",
      onUpdate: function (s) {
        var step = s.progress * STEPS;
        $("#stageBar").style.transform = "scaleX(" + s.progress + ")";
        island.setDive((step - 0.45) / 1.2);
        if (step < 0.9) { setChapter(0); setHud(-1); stage.classList.remove("is-tours"); }
        else if (step < 2) { setChapter(1); setHud(-1); stage.classList.remove("is-tours"); }
        else { setChapter(2); stage.classList.add("is-tours"); setHud(Math.min(TOURS.length - 1, Math.floor(step - 2))); }
      }
    });
  }

  /* ---------------------------------------------------------------- 4 · destinos */
  var DEST = [
    { n: "Tarrafal", img: "tarrafal-praia", tour: "tarrafal", c: "15°16′N  23°45′O", d: "Vila de pescadores, areia dourada e coqueiros. Uma das praias mais bonitas da ilha." },
    { n: "Cidade Velha", img: "cv-vista", tour: "cidade-velha", c: "14°55′N  23°36′O", d: "A primeira cidade de Cabo Verde, entre o vale e o mar. Património Mundial da UNESCO." },
    { n: "São Filipe", img: "cv-forte", tour: "city-tour-cidade-velha", c: "14°55′N  23°36′O", d: "A Fortaleza de São Filipe, de canhões virados ao Atlântico, por cima da Cidade Velha." },
    { n: "Pico da Antónia", img: "pico-1", tour: "pico-antonia", c: "15°03′N  23°38′O", d: "O ponto mais alto da ilha, entre floresta de eucaliptos e cristas rochosas." },
    { n: "Malagueta", img: "malagueta", tour: "serra-malagueta", c: "15°11′N  23°41′O", d: "Parque natural da Serra Malagueta, com vistas até à Ilha do Fogo." },
    { n: "Ribeira da Barca", img: "barca-1", tour: "aguas-belas", c: "15°08′N  23°46′O", d: "De bote de pesca até à Gruta das Águas Belas e à Praia de Angra, só acessível por mar." }
  ];
  var curDest = -1;
  function setDest(i) {
    if (i === curDest) return; var first = curDest < 0; curDest = i;
    var d = DEST[i], nameEl = $("#destName");
    $$("#destList li").forEach(function (li, k) { li.classList.toggle("is-active", k === i); });
    $("#destOpen").dataset.open = d.tour;
    if (root.classList.contains("no-gl-dest")) $("#destFallback").style.backgroundImage = "url(" + IMG(d.img) + ")";
    if (!animate || first) { nameEl.innerHTML = '<span class="in">' + esc(d.n) + '</span>'; $("#destDesc").textContent = d.d; $("#destCoord").textContent = d.c; return; }
    gsap.to($(".in", nameEl), { yPercent: -105, skewX: -8, duration: .4, ease: "power3.in", overwrite: true, onComplete: function () {
      nameEl.innerHTML = '<span class="in">' + esc(d.n) + '</span>';
      gsap.fromTo($(".in", nameEl), { yPercent: 105, skewX: 8 }, { yPercent: 0, skewX: 0, duration: 1.1, ease: "expo.out" });
    } });
    gsap.fromTo("#destDesc", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .7, delay: .2, onStart: function () { $("#destDesc").textContent = d.d; } });
    scramble($("#destCoord"), d.c);
  }
  function initDest() {
    $("#destList").innerHTML = DEST.map(function (d) { return "<li>" + esc(d.n) + "</li>"; }).join("");
    try { dest = window.LevyGL.Dest($("#destGL"), DEST.map(function (d) { return IMG(d.img); })); }
    catch (e) { dest = null; root.classList.add("no-gl-dest"); }
    setDest(0);
    if (!animate) { $(".dest").style.height = "auto"; $(".dest__pin").style.position = "relative"; if (dest) dest.state.f = 0; return; }
    $(".dest").style.height = (DEST.length * 90 + 40) + "vh";
    var vel = 0;
    ScrollTrigger.create({ trigger: ".dest", start: "top top", end: "bottom bottom", onUpdate: function (s) {
      var f = s.progress * (DEST.length - 1);
      if (dest) { dest.state.f = f; vel += (Math.max(-3, Math.min(3, s.getVelocity() / 900)) - vel) * .2; dest.state.vel = vel; }
      var fr = f - Math.floor(f);
      setDest(Math.min(DEST.length - 1, Math.floor(f) + (fr > 0.7 ? 1 : 0)));
    } });
  }

  /* ---------------------------------------------------------------- 5 · transfers */
  var rate = "day";
  function paxN() { var p = $("#pax"), n = parseInt(p.value, 10); if (isNaN(n) || n < 2) n = 2; if (n > 20) n = 20; p.value = n; return n; }
  function paintTransfers(tween) {
    var n = paxN();
    $$(".tr__row").forEach(function (row, i) {
      var t = TRANSFERS[i], p = t[rate], pp = $(".tr__pp", row), sum = $(".tr__sum", row);
      $(".tr__n", row).textContent = n;
      if (tween && animate) {
        var o = { a: +pp.textContent || 0, b: parseInt(sum.textContent, 10) || 0 };
        gsap.to(o, { a: p, b: p * n, duration: .9, ease: "expo.out", onUpdate: function () { pp.textContent = Math.round(o.a); sum.textContent = Math.round(o.b) + " €"; } });
      } else { pp.textContent = p; sum.textContent = p * n + " €"; }
    });
  }
  function initTransfers() {
    var names = { "tr-praia": ["Hotel em", "Praia", "2.2s"], "tr-cidade-velha": ["Hotel em", "Cidade Velha", "3s"], "tr-tarrafal": ["Hotel em", "Tarrafal", "4.4s"] };
    $("#trList").innerHTML = TRANSFERS.map(function (t) {
      var nm = names[t.id] || ["", t.label, "3s"];
      return '<li class="tr__row" data-reveal><h3 class="tr__dest"><em>' + nm[0] + '</em>' + nm[1] + '</h3>' +
        '<p class="tr__price"><b class="tr__pp">' + t.day + '</b><small>€ por pessoa</small></p>' +
        '<p class="tr__path" aria-hidden="true"><span>Aeroporto</span><i><b style="--dur:' + nm[2] + '"></b></i><span>' + nm[1] + '</span></p>' +
        '<p class="tr__total">Total para <span class="tr__n">2</span> pessoas: <span class="tr__sum"></span></p></li>';
    }).join("");
    var sec = $("#transfers"), btn = $("#dayNight");
    btn.addEventListener("click", function () {
      rate = rate === "day" ? "night" : "day";
      sec.dataset.mode = rate;
      btn.setAttribute("aria-pressed", rate === "night" ? "true" : "false");
      btn.setAttribute("aria-label", rate === "night" ? "Mudar para tarifa diurna" : "Mudar para tarifa noturna");
      $("#dnLabel").textContent = rate === "night" ? "Tarifa noturna" : "Tarifa diurna";
      var r = sec.getBoundingClientRect(); bar.classList.toggle("is-ink", rate === "day" && r.top < 40 && r.bottom > 40);
      paintTransfers(true);
    });
    $("#paxMinus").addEventListener("click", function () { $("#pax").value = paxN() - 1; paintTransfers(true); });
    $("#paxPlus").addEventListener("click", function () { $("#pax").value = paxN() + 1; paintTransfers(true); });
    $("#pax").addEventListener("change", function () { paintTransfers(true); });
    paintTransfers(false);
    // estrelas
    var c = $("#stars"), x = c.getContext("2d");
    function draw() {
      var w = c.width = c.offsetWidth, h = c.height = c.offsetHeight; x.clearRect(0, 0, w, h);
      for (var i = 0; i < Math.floor(w * h / 2600); i++) { var r = Math.random(); x.fillStyle = "rgba(238,235,227," + (0.2 + r * 0.7) + ")"; x.fillRect(Math.random() * w, Math.random() * h, r > .92 ? 2 : 1, r > .92 ? 2 : 1); }
    }
    draw(); window.addEventListener("resize", draw);
  }

  /* ---------------------------------------------------------------- 6 · morabeza */
  function initMora() {
    if (!animate) { $(".mora").style.height = "auto"; return; }
    $(".mora").style.height = "320vh";
    var tl = gsap.timeline({ scrollTrigger: { trigger: ".mora", start: "top top", end: "bottom bottom", scrub: .6 } });
    tl.fromTo("#moraWord", { scale: .8 }, { scale: 1, duration: .2, ease: "none" })
      .to("#moraWord", { scale: 6, duration: .5, ease: "power2.in" })
      .to("#moraMask", { opacity: 0, duration: .25, ease: "none" }, "-=.25")
      .fromTo(".mora__photo", { scale: 1.35 }, { scale: 1, duration: .55, ease: "power2.out" }, .2)
      .fromTo("#moraDef > *", { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: .05, duration: .2 }, .78);
  }

  /* ---------------------------------------------------------------- 7 · reserva */
  function service(val) {
    if (!val) return null;
    if (val.indexOf("tr-") === 0) {
      var p = val.split(":"), tr = TRANSFERS.filter(function (x) { return x.id === p[0]; })[0]; if (!tr) return null;
      var night = p[1] === "night";
      return { name: "Transfer " + tr.label + " (tarifa " + (night ? "noturna" : "diurna") + ")", price: night ? tr.night : tr.day, meet: null };
    }
    var t = byId(val); return t ? { name: t.title + " (" + t.hours + ")", price: t.price, meet: t.meet } : null;
  }
  function total() {
    var s = service($("#fTour").value), n = parseInt($("#fPax").value, 10), el = $("#fTotal");
    var v = s && n >= 2 ? s.price * n : null;
    if (v === null) { el.textContent = "—"; return; }
    if (!animate) { el.textContent = v + " €"; return; }
    var o = { v: parseInt(el.textContent, 10) || 0 };
    gsap.to(o, { v: v, duration: .8, ease: "expo.out", overwrite: true, onUpdate: function () { el.textContent = Math.round(o.v) + " €"; } });
  }
  function initBook() {
    var sel = $("#fTour"), h = '<option value="">uma excursão</option><optgroup label="Excursões">';
    TOURS.forEach(function (t) { h += '<option value="' + t.id + '">' + esc(t.short) + '</option>'; });
    h += '</optgroup><optgroup label="Transfers">';
    TRANSFERS.forEach(function (t) {
      var short = t.label.replace("Aeroporto ⇄ Hotel em ", "transfer ");
      h += '<option value="' + t.id + ':day">' + esc(short) + ' (dia)</option><option value="' + t.id + ':night">' + esc(short) + ' (noite)</option>';
    });
    sel.innerHTML = h + "</optgroup>";
    var date = $("#fDate"), d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    date.min = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    sel.addEventListener("change", total); $("#fPax").addEventListener("input", total);

    $("#bookForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#fName"), paxEl = $("#fPax"), err = $("#fError"), res = $("#fResult"), probs = [];
      [name, sel, date, paxEl].forEach(function (f) { f.classList.remove("is-invalid"); });
      if (!name.value.trim()) probs.push([name, "Falta o seu nome."]);
      if (!sel.value) probs.push([sel, "Escolha uma excursão ou um transfer."]);
      if (!date.value) probs.push([date, "Escolha a data."]);
      else if (date.value < date.min) probs.push([date, "Essa data já passou. Escolha uma data a partir de hoje."]);
      var n = parseInt(paxEl.value, 10); if (isNaN(n) || n < 2) probs.push([paxEl, "O mínimo são 2 pessoas."]);
      if (probs.length) {
        probs.forEach(function (p) { p[0].classList.add("is-invalid"); });
        err.textContent = probs[0][1]; err.hidden = false; res.hidden = true; probs[0][0].focus(); return;
      }
      err.hidden = true;
      var s = service(sel.value);
      var when = new Date(date.value + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      var lines = ["Pedido de reserva · Levy Travel", "", "Nome: " + name.value.trim(), "Serviço: " + s.name, "Data: " + when, "Pessoas: " + n];
      if ($("#fHotel").value.trim()) lines.push("Hotel: " + $("#fHotel").value.trim());
      if (s.meet) lines.push("Encontro: " + s.meet + " na recepção do hotel");
      lines.push("Total estimado: " + (s.price * n) + " € (" + s.price + " € por pessoa)");
      var text = lines.join("\n"); $("#fSummary").textContent = text;
      var send = $("#fSend"), note = $("#fNote");
      if (CONTACT.whatsapp) { send.href = "https://wa.me/" + CONTACT.whatsapp + "?text=" + encodeURIComponent(text); $("span", send).textContent = "Enviar por WhatsApp"; send.hidden = false; note.textContent = "Abre o WhatsApp com o pedido pronto a enviar. A reserva fica confirmada quando a Levy Travel responder."; }
      else if (CONTACT.email) { send.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Pedido de reserva") + "&body=" + encodeURIComponent(text); $("span", send).textContent = "Enviar por email"; send.hidden = false; note.textContent = "Abre o email com o pedido pronto a enviar. A reserva fica confirmada quando a Levy Travel responder."; }
      else { send.hidden = true; note.textContent = "Copie o pedido e envie-o à Levy Travel. A reserva fica confirmada quando receber resposta."; }
      res.hidden = false;
      if (animate) { gsap.fromTo(res, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "expo.out" }); ScrollTrigger.refresh(); }
    });
    $("#fCopy").addEventListener("click", function () {
      var l = $("span", this), text = $("#fSummary").textContent;
      var ok = function () { l.textContent = "Copiado"; setTimeout(function () { l.textContent = "Copiar pedido"; }, 1800); };
      var fb = function () { var r = document.createRange(); r.selectNodeContents($("#fSummary")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); l.textContent = "Selecionado: copie com Ctrl+C"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fb); else fb();
    });
  }

  /* ---------------------------------------------------------------- detalhe */
  var detail = $("#detail"), credits = $("#credits"), openEl = null, lastFocus = null, fromRect = null;
  function openPanel(el, src) {
    lastFocus = document.activeElement; openEl = el; el.hidden = false; lock(true);
    var p = $(".detail__panel", el);
    if (animate) {
      var r = src && src.getBoundingClientRect ? src.getBoundingClientRect() : null, W = window.innerWidth, H = window.innerHeight;
      fromRect = r ? "inset(" + Math.max(0, r.top) + "px " + Math.max(0, W - r.right) + "px " + Math.max(0, H - r.bottom) + "px " + Math.max(0, r.left) + "px)" : "inset(50% 0 50% 0)";
      gsap.fromTo(p, { clipPath: fromRect }, { clipPath: "inset(0px 0px 0px 0px)", duration: 1.1, ease: "expo.inOut" });
      gsap.fromTo($$(".detail__content > *", el), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: .05, delay: .55, ease: "expo.out" });
      var im = $(".detail__media img", el); if (im) gsap.fromTo(im, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" });
    }
    p.focus({ preventScroll: true });
    var sc = $(".detail__scroll", el); if (sc) sc.scrollTop = 0;
  }
  function closeDetail() {
    var el = openEl; if (!el) return; openEl = null;
    var done = function () { el.hidden = true; lock(false); };
    if (animate) gsap.to($(".detail__panel", el), { clipPath: "inset(0px 0px 100% 0px)", duration: .8, ease: "expo.inOut", onComplete: done }); else done();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function showTour(id, src) {
    var t = byId(id); if (!t) return;
    $("#dImg").src = IMG(t.img); $("#dImg").alt = t.title;
    var li = function (a) { return a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); };
    $("#dBody").innerHTML =
      '<div class="detail__content">' +
      '<p class="kicker">' + esc(t.tag) + ' · ' + esc(t.length) + '</p>' +
      '<h2 class="detail__title" id="dTitle">' + esc(t.title) + '</h2>' +
      '<dl class="detail__facts"><div><dt>Horário</dt><dd>' + esc(t.hours) + '</dd></div><div><dt>Encontro</dt><dd>' + esc(t.meet) + ' na recepção do hotel em Praia</dd></div>' +
      '<div><dt>Esforço</dt><dd>' + (t.level ? esc(LEVEL[t.level]) + ' · ' + esc(t.walk) + ' a pé' : 'Passeio') + '</dd></div><div><dt>Grupo</dt><dd>Mínimo de ' + t.min + ' pessoas</dd></div></dl>' +
      '<div class="detail__text">' + t.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + '</div>' +
      (t.warn ? '<p class="detail__warn"><b>Antes de reservar</b>' + esc(t.warn) + '</p>' : '') +
      '<div class="detail__lists"><div><h3>Incluído</h3><ul>' + li(t.included) + '</ul></div><div><h3>O que trazer</h3><ul>' + li(t.bring) + '</ul></div></div>' +
      (t.gallery.length ? '<div class="detail__gallery">' + t.gallery.map(function (g) { return '<img src="' + IMG(g) + '" alt="" loading="lazy">'; }).join("") + '</div>' : '') +
      '</div><div class="detail__cta"><p><b>' + t.price + ' €</b>por pessoa · mínimo 2</p><button class="pill pill--ember pill--xl" data-book="' + t.id + '"><span>Reservar</span></button></div>';
    openPanel(detail, src);
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { closeDetail(); return; }
    var o = e.target.closest("[data-open]"); if (o) { showTour(o.dataset.open, o.closest(".hud") || o); return; }
    var b = e.target.closest("[data-book]");
    if (b) { var id = b.dataset.book; closeDetail(); $("#fTour").value = id; total(); setTimeout(function () { goTo($("#reservar")); }, 450); }
  });
  $("#creditsOpen").addEventListener("click", function () { openPanel(credits, this); });
  $("#creditsList").innerHTML = (window.LEVY_CREDITS || []).map(function (c) { return '<li><span>' + esc(c.label) + '</span><a href="' + esc(c.url) + '" target="_blank" rel="noopener">Wikimedia Commons ↗</a></li>'; }).join("");
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (openEl) closeDetail(); else closeMenu(); }
    if (e.key === "Tab" && openEl) {
      var f = $$('button, a[href], input, select, [tabindex]:not([tabindex="-1"])', openEl).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------------------------------------------------------------- rodapé: peso das letras segue o cursor */
  function initFoot() {
    var w = $("#footWord"), chars = splitChars(w);
    if (!animate || !fine) return;
    window.addEventListener("pointermove", function (e) {
      var r = w.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
      chars.forEach(function (c) {
        var b = c.getBoundingClientRect(), d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
        var wg = 400 + 500 * Math.max(0, 1 - d / 420);
        c.style.fontVariationSettings = '"wght" ' + Math.round(wg);
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- revelações genéricas */
  function initReveals() {
    if (!animate) return;
    ScrollTrigger.batch("[data-reveal]", { start: "top 88%", once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: .08, ease: "expo.out", overwrite: true }); } });
    $$("[data-split]").forEach(function (h) {
      var w = splitWords(h); gsap.set(w, { yPercent: 110 });
      ScrollTrigger.create({ trigger: h, start: "top 85%", once: true, onEnter: function () { gsap.to(w, { yPercent: 0, duration: 1.2, stagger: .05, ease: "expo.out" }); } });
    });
  }

  /* ---------------------------------------------------------------- arranque */
  initIntro(); initStage(); initDest(); initTransfers(); initMora(); initBook(); initFoot(); initReveals();
  if (animate) {
    ScrollTrigger.refresh();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  loaderRun().then(heroIn);
})();
