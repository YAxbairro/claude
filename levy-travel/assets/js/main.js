/* Levy Travel — interações. Sem bibliotecas: leve e fiável no telemóvel. */
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
  root.classList.add("js");

  var CAT = { cultura: "Cultura e história", caminhada: "Caminhada", mar: "Praia e mar" };
  var LEVEL = { 1: "Fácil", 2: "Moderada", 3: "Exigente" };
  var ICON = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="2"/><path d="M10 21l2-6 3 3v3M8 12l2-4 4 1 2 4M10 8l-2 4"/></svg>',
    meal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };
  $("#year").textContent = new Date().getFullYear();

  /* ------------------------------------------------ navegação */
  var nav = $("#nav"), heroCard = $("#heroCard"), burger = $("#burger"), menu = $("#menu");
  function onScrollNav() { nav.classList.toggle("is-solid", window.scrollY > heroCard.offsetTop + heroCard.offsetHeight - 80); }
  function setMenu(open) {
    menu.hidden = !open; burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", open); document.body.classList.toggle("lock", open);
  }
  burger.addEventListener("click", function () { setMenu(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ------------------------------------------------ capa: entrada + profundidade */
  var heroImg = $(".hero__layer img");
  function ready() { root.classList.add("ready"); }
  if (heroImg.complete) setTimeout(ready, 60); else { heroImg.addEventListener("load", ready); heroImg.addEventListener("error", ready); }
  setTimeout(ready, 2500);
  $$(".hero__letters span").forEach(function (s, i) { s.style.transitionDelay = (0.15 + i * 0.05) + "s"; });

  var photoLayers = $$('[data-layer="photo"]'), word = $(".hero__word");
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, ticking = false;
  function paintHero() {
    ticking = false;
    var y = window.scrollY, h = heroCard.offsetHeight;
    if (y > h + 200) return;
    mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
    var p = reduced ? 0 : y;
    photoLayers.forEach(function (l) { l.style.transform = "translate3d(" + (-mouse.x * 8) + "px," + (p * 0.18 - mouse.y * 6) + "px,0)"; });
    word.style.transform = "translate3d(" + (mouse.x * 14) + "px," + (p * 0.42 + mouse.y * 8) + "px,0)";
    if (Math.abs(mouse.tx - mouse.x) > 0.002 || Math.abs(mouse.ty - mouse.y) > 0.002) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(paintHero); } }
  if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    heroCard.addEventListener("pointermove", function (e) {
      var r = heroCard.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width - 0.5; mouse.ty = (e.clientY - r.top) / r.height - 0.5; request();
    });
    heroCard.addEventListener("pointerleave", function () { mouse.tx = 0; mouse.ty = 0; request(); });
  }
  window.addEventListener("scroll", function () { onScrollNav(); request(); }, { passive: true });
  window.addEventListener("resize", function () { onScrollNav(); request(); });
  onScrollNav();

  /* ------------------------------------------------ excursões */
  var filt = { cat: "all", len: null }, sortBy = "rec";
  function card(t) {
    var facts = '<span>' + ICON.clock + esc(t.hours) + '</span>';
    if (t.level) facts += '<span>' + ICON.walk + LEVEL[t.level] + ' · ' + esc(t.walk) + ' a pé</span>';
    else if (/Almoço|Piquenique/i.test(t.included.join(" "))) facts += '<span>' + ICON.meal + 'Almoço incluído</span>';
    return '<button class="card" data-open="' + t.id + '" aria-label="' + esc(t.title) + ', ' + t.price + ' euros por pessoa. Ver detalhes">' +
      '<span class="card__img"><img src="' + IMG(t.img) + '" alt="" loading="lazy" decoding="async">' +
      '<span class="tag tag--' + t.cat + '">' + CAT[t.cat] + '</span><span class="len">' + esc(t.length) + '</span></span>' +
      '<span class="card__body"><span class="card__title">' + esc(t.title) + '</span>' +
      '<span class="card__lead">' + esc(t.lead) + '</span>' +
      '<span class="facts">' + facts + '</span>' +
      '<span class="card__foot"><span class="price"><b>' + t.price + ' €</b><small>por pessoa</small></span><span class="more">Ver detalhes' + ICON.arrow + '</span></span>' +
      '</span></button>';
  }
  function renderTours(animate) {
    var list = TOURS.filter(function (t) { return (filt.cat === "all" || t.cat === filt.cat) && (!filt.len || t.length === filt.len); });
    if (sortBy === "asc") list = list.slice().sort(function (a, b) { return a.price - b.price; });
    if (sortBy === "desc") list = list.slice().sort(function (a, b) { return b.price - a.price; });
    $("#grid").innerHTML = list.map(function (t, i) { return '<li' + (animate ? ' class="pop" style="animation-delay:' + Math.min(i, 8) * 0.05 + 's"' : '') + '>' + card(t) + '</li>'; }).join("");
    $("#count").textContent = list.length === 1 ? "1 excursão" : list.length + " excursões";
    $("#empty").hidden = list.length > 0;
  }
  $$("#filters .chip").forEach(function (c) {
    c.addEventListener("click", function () {
      if (c.dataset.cat) {
        filt.cat = c.dataset.cat;
        $$("#filters [data-cat]").forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      } else {
        filt.len = filt.len === c.dataset.len ? null : c.dataset.len;
        $$("#filters [data-len]").forEach(function (x) { var on = x.dataset.len === filt.len; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      }
      renderTours(true);
    });
  });
  $("#sort").addEventListener("change", function () { sortBy = this.value; renderTours(true); });
  $("#clearFilters").addEventListener("click", function () { filt = { cat: "all", len: null }; $$("#filters .chip").forEach(function (x) { var on = x.dataset.cat === "all"; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); renderTours(true); });
  renderTours(false);

  /* ------------------------------------------------ janela de detalhe */
  var openModal = null, lastFocus = null;
  function showModal(m) {
    lastFocus = document.activeElement; openModal = m; m.hidden = false; m.classList.remove("is-closing");
    document.body.classList.add("lock");
    var box = $(".modal__box", m); box.focus({ preventScroll: true });
    var sc = $(".modal__scroll", m); if (sc) sc.scrollTop = 0;
  }
  function closeModal(cb) {
    var m = openModal; if (!m) { if (cb) cb(); return; }
    openModal = null; m.classList.add("is-closing");
    setTimeout(function () { m.hidden = true; m.classList.remove("is-closing"); document.body.classList.remove("lock"); if (cb) cb(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }, reduced ? 0 : 280);
  }
  function openTour(id) {
    var t = byId(id); if (!t) return;
    var pics = [t.img].concat(t.gallery || []);
    var li = function (a) { return a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); };
    $("#mBody").innerHTML =
      '<div class="gal' + (pics.length > 1 ? ' gal--multi' : '') + '"><div class="gal__track" id="galTrack">' + pics.map(function (p, i) { return '<img src="' + IMG(p) + '" alt="' + (i ? '' : esc(t.title)) + '">'; }).join("") + '</div>' +
      (pics.length > 1 ? '<button class="gal__nav gal__nav--p" data-gal="-1" aria-label="Fotografia anterior">' + ICON.left + '</button><button class="gal__nav gal__nav--n" data-gal="1" aria-label="Fotografia seguinte">' + ICON.right + '</button><div class="gal__dots">' + pics.map(function (_, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join("") + '</div>' : '') + '</div>' +
      '<div class="m__pad">' +
      '<div class="m__tags"><span class="tag tag--' + t.cat + '">' + CAT[t.cat] + '</span><span class="len">' + esc(t.length) + '</span></div>' +
      '<h2 class="m__title" id="mTitle">' + esc(t.title) + '</h2>' +
      '<dl class="m__facts"><div><dt>Horário</dt><dd>' + esc(t.hours) + '</dd></div><div><dt>Encontro</dt><dd>' + esc(t.meet) + ', no hotel</dd></div>' +
      '<div><dt>Esforço</dt><dd>' + (t.level ? LEVEL[t.level] + ' · ' + esc(t.walk) + ' a pé' : 'Passeio tranquilo') + '</dd></div><div><dt>Grupo</dt><dd>Mínimo ' + t.min + ' pessoas</dd></div></dl>' +
      '<div class="m__text">' + t.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + '</div>' +
      (t.warn ? '<p class="m__warn"><b>Antes de reservar</b>' + esc(t.warn) + '</p>' : '') +
      '<div class="m__lists"><div><h3>Incluído</h3><ul>' + li(t.included) + '</ul></div><div class="bring"><h3>O que trazer</h3><ul>' + li(t.bring) + '</ul></div></div>' +
      '</div>';
    $("#mBar").innerHTML = '<span class="price"><b>' + t.price + ' €</b><small>por pessoa</small></span><button class="btn btn--coral" data-book="' + t.id + '">Reservar esta excursão</button>';
    showModal($("#modal"));
    var track = $("#galTrack"), dots = $$(".gal__dots i");
    if (dots.length) track.addEventListener("scroll", function () {
      var i = Math.round(track.scrollLeft / track.clientWidth); dots.forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }, { passive: true });
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]"); if (o) { openTour(o.dataset.open); return; }
    if (e.target.closest("[data-close]")) { closeModal(); return; }
    var g = e.target.closest("[data-gal]");
    if (g) { var tr = $("#galTrack"); tr.scrollBy({ left: tr.clientWidth * +g.dataset.gal, behavior: "smooth" }); return; }
    var b = e.target.closest("[data-book]");
    if (b) { closeModal(function () { pick(b.dataset.book, b.dataset.pax); }); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (openModal) closeModal(); else if (!menu.hidden) setMenu(false); }
    if (e.key === "Tab" && openModal) {
      var f = $$('button, a[href], input, select, textarea', openModal).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === $(".modal__box", openModal))) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  $("#creditsBtn").addEventListener("click", function () { showModal($("#credits")); });
  $("#creditsList").innerHTML = (window.LEVY_CREDITS || []).map(function (c) { return '<li><span>' + esc(c.label) + '</span><a href="' + esc(c.url) + '" target="_blank" rel="noopener">Ver ↗</a></li>'; }).join("");

  /* ------------------------------------------------ transfers */
  var rate = "day", pax = 2;
  var TR = { "tr-praia": { to: "Praia", c: "var(--sea)" }, "tr-cidade-velha": { to: "Cidade Velha", c: "var(--coral)" }, "tr-tarrafal": { to: "Tarrafal", c: "var(--sun)" } };
  function renderTransfers() {
    $("#tcards").innerHTML = TRANSFERS.map(function (t) {
      var info = TR[t.id] || { to: t.label, c: "var(--sea)" }, p = t[rate];
      return '<li class="tcard" style="--c:' + info.c + '"><p class="tcard__route"><span>Aeroporto</span><i></i><span>Hotel</span></p>' +
        '<h3>' + esc(info.to) + '</h3>' +
        '<p class="tcard__price"><b>' + p + ' €</b><small>por pessoa</small></p>' +
        '<p class="tcard__total">Total para ' + pax + ' pessoas: <b>' + (p * pax) + ' €</b></p>' +
        '<button class="btn btn--ink" data-book="' + t.id + ':' + rate + '" data-pax="' + pax + '">Reservar transfer</button></li>';
    }).join("");
    $("#paxOut").textContent = pax;
    $("#transfers").classList.toggle("is-night", rate === "night");
  }
  $$(".seg__b").forEach(function (b) {
    b.addEventListener("click", function () {
      rate = b.dataset.rate;
      $$(".seg__b").forEach(function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      renderTransfers();
    });
  });
  $("#paxMinus").addEventListener("click", function () { pax = Math.max(2, pax - 1); renderTransfers(); });
  $("#paxPlus").addEventListener("click", function () { pax = Math.min(20, pax + 1); renderTransfers(); });
  renderTransfers();

  /* ------------------------------------------------ mapa de Cabo Verde */
  (function map() {
    var svg = $("#cvMap"), geo = (window.LEVY_GEO || { islands: [] }).islands;
    if (!svg || !geo.length) return;
    var W = 600, H = 560, lonMin = -25.45, lonMax = -22.6, latMin = 14.75, latMax = 17.25, cos = Math.cos(16 * Math.PI / 180);
    var s = Math.min((W - 40) / ((lonMax - lonMin) * cos), (H - 40) / (latMax - latMin));
    var ox = (W - (lonMax - lonMin) * cos * s) / 2, oy = (H - (latMax - latMin) * s) / 2;
    var P = function (lon, lat) { return [ox + (lon - lonMin) * cos * s, oy + (latMax - lat) * s]; };
    // onde pôr o nome de cada ilha, em relação ao seu contorno
    var LBL = { "Santo Antão": "top", "São Vicente": "bottom", "Santa Luzia": "right", "São Nicolau": "bottom", "Sal": "right", "Boa Vista": "bottom", "Maio": "right", "Santiago": "left", "Fogo": "bottom", "Brava": "left" };
    var h = "";
    geo.forEach(function (isl) {
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      var d = isl.ring.map(function (p, i) { var q = P(p[0], p[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + "Z";
      var home = isl.name === "Santiago";
      h += '<path class="isl' + (home ? " isl--home" : "") + '" d="' + d + '"/>';
      var where = LBL[isl.name]; if (!where) return;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, x, y, a;
      if (where === "top") { x = cx; y = y0 - 8; a = "middle"; }
      else if (where === "bottom") { x = cx; y = y1 + 17; a = "middle"; }
      else if (where === "left") { x = x0 - 10; y = cy + 6; a = "end"; }
      else { x = x1 + 10; y = cy + 5; a = "start"; }
      h += '<text class="isl-label' + (home ? " isl-label--home" : "") + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + a + '">' + isl.name + '</text>';
    });
    svg.innerHTML = h;
  })();

  /* ------------------------------------------------ reserva */
  var fService = $("#fService"), fDate = $("#fDate"), fPax = $("#fPax");
  (function options() {
    var h = '<option value="">Escolha uma opção</option><optgroup label="Excursões">';
    TOURS.forEach(function (t) { h += '<option value="' + t.id + '">' + esc(t.title) + ' · ' + t.price + ' €</option>'; });
    h += '</optgroup><optgroup label="Transfers do aeroporto">';
    TRANSFERS.forEach(function (t) {
      var to = (TR[t.id] || { to: t.label }).to;
      h += '<option value="' + t.id + ':day">Transfer ' + esc(to) + ' (diurno) · ' + t.day + ' €</option>';
      h += '<option value="' + t.id + ':night">Transfer ' + esc(to) + ' (noturno) · ' + t.night + ' €</option>';
    });
    fService.innerHTML = h + "</optgroup>";
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    fDate.min = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  })();
  function service(v) {
    if (!v) return null;
    if (v.indexOf("tr-") === 0) {
      var p = v.split(":"), tr = TRANSFERS.filter(function (x) { return x.id === p[0]; })[0]; if (!tr) return null;
      var night = p[1] === "night";
      return { name: "Transfer aeroporto → hotel em " + (TR[tr.id] || { to: "" }).to + " (tarifa " + (night ? "noturna" : "diurna") + ")", price: night ? tr.night : tr.day, meet: null };
    }
    var t = byId(v); return t ? { name: t.title, price: t.price, meet: t.meet, hours: t.hours } : null;
  }
  function fmtDate(v) { try { return new Date(v + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }); } catch (e) { return v; } }
  function summary() {
    var s = service(fService.value), n = parseInt(fPax.value, 10);
    $("#sService").textContent = s ? s.name : "Escolha uma excursão ou transfer";
    $("#sDate").textContent = fDate.value ? fmtDate(fDate.value) : "—";
    $("#sPax").textContent = isNaN(n) ? "—" : n;
    $("#sEach").textContent = s ? s.price + " €" : "—";
    $("#sTotal").textContent = s && n >= 2 ? (s.price * n) + " €" : "—";
  }
  [fService, fDate, fPax].forEach(function (el) { el.addEventListener("input", summary); el.addEventListener("change", summary); });
  function pick(val, n) {
    fService.value = val; if (n) fPax.value = n; summary();
    $("#result").hidden = true;
    var top = $("#reservar").getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    setTimeout(function () { (fDate.value ? $("#fName") : fDate).focus({ preventScroll: true }); }, reduced ? 0 : 700);
  }
  $("#form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#fName"), err = $("#fErr"), probs = [];
    [fService, fDate, fPax, name].forEach(function (f) { f.classList.remove("bad"); });
    if (!fService.value) probs.push([fService, "Escolha a excursão ou o transfer."]);
    if (!fDate.value) probs.push([fDate, "Escolha a data."]);
    else if (fDate.value < fDate.min) probs.push([fDate, "Essa data já passou. Escolha uma data a partir de hoje."]);
    var n = parseInt(fPax.value, 10); if (isNaN(n) || n < 2) probs.push([fPax, "O mínimo são 2 pessoas."]);
    if (!name.value.trim()) probs.push([name, "Escreva o seu nome."]);
    if (probs.length) { probs.forEach(function (p) { p[0].classList.add("bad"); }); err.textContent = probs[0][1]; err.hidden = false; probs[0][0].focus(); return; }
    err.hidden = true;
    var s = service(fService.value);
    var lines = ["Olá! Gostaria de fazer um pedido de reserva:", "", "• " + s.name, "• Data: " + fmtDate(fDate.value), "• Pessoas: " + n];
    if (s.hours) lines.push("• Horário: " + s.hours + " (encontro às " + s.meet + ")");
    if ($("#fHotel").value.trim()) lines.push("• Hotel: " + $("#fHotel").value.trim());
    lines.push("• Total estimado: " + (s.price * n) + " € (" + s.price + " € por pessoa)");
    if ($("#fMsg").value.trim()) lines.push("", $("#fMsg").value.trim());
    lines.push("", "Nome: " + name.value.trim());
    var text = lines.join("\n");
    $("#resultText").textContent = text;
    var send = $("#send"), note = $("#resultNote");
    if (CONTACT.whatsapp) { send.href = "https://wa.me/" + CONTACT.whatsapp + "?text=" + encodeURIComponent(text); send.textContent = "Enviar por WhatsApp"; send.hidden = false; note.textContent = "Abre o WhatsApp com a mensagem pronta. A reserva fica confirmada quando a Levy Travel responder."; }
    else if (CONTACT.email) { send.href = "mailto:" + CONTACT.email + "?subject=" + encodeURIComponent("Pedido de reserva") + "&body=" + encodeURIComponent(text); send.textContent = "Enviar por email"; send.hidden = false; note.textContent = "Abre o seu email com a mensagem pronta. A reserva fica confirmada quando a Levy Travel responder."; }
    else { send.hidden = true; note.textContent = "Copie a mensagem e envie-a à Levy Travel. A reserva fica confirmada quando receber resposta."; }
    $("#result").hidden = false;
    if (window.innerWidth < 900) $("#result").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  });
  $("#copy").addEventListener("click", function () {
    var btn = this, text = $("#resultText").textContent;
    var ok = function () { btn.textContent = "Copiado ✓"; setTimeout(function () { btn.textContent = "Copiar pedido"; }, 1800); };
    var fb = function () { var r = document.createRange(); r.selectNodeContents($("#resultText")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Texto selecionado"; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fb); else fb();
  });
  summary();

  /* ------------------------------------------------ revelação ao fazer scroll */
  var rev = $$(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    rev.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 0.08 + "s"; io.observe(el); });
  } else rev.forEach(function (el) { el.classList.add("in"); });
})();
