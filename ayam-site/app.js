/* ============================================================
   AYAM Viagens & Turismo — comportamento
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine) and (min-width:1024px)').matches;
  var WA = '2389990900';
  var MAIL = 'ayam.reservas@gmail.com';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ============================================================
     DADOS — fonte única: carrossel, gaveta, pesquisa e formulário
     ============================================================ */
  var DESTINOS = [
    {
      id: 'fogo', country: 'Cabo Verde', name: 'Ilha do Fogo', code: 'SFL',
      coords: '14.895° N · 24.495° W', season: 'Nov — Jun', flight: '0h35 · directo',
      tz: 'Atlantic/Cape_Verde', tags: ['Natureza', 'Entre ilhas', 'Aventura'], len: '3 a 5 noites',
      desc: 'Um vulcão activo com uma aldeia dentro da cratera. Chã das Caldeiras produz vinho e café em solo de lava, e a subida ao Pico faz-se de madrugada para chegar ao cume com o nascer do sol.'
    },
    {
      id: 'maldivas', country: 'Maldivas', name: 'Atol de Baa', code: 'MLE',
      coords: '5.210° N · 73.068° E', season: 'Nov — Abr', flight: '≈ 20h · via LIS/DXB',
      tz: 'Indian/Maldives', tags: ['Lua-de-mel', 'Praia', 'Bem-estar'], len: '7 a 10 noites',
      desc: 'Reserva da Biosfera da UNESCO, é aqui que as mantas se juntam às centenas na baía de Hanifaru. Villas sobre a água, casa de mergulho privada e o silêncio de quem está longe de tudo.'
    },
    {
      id: 'dubai', country: 'Emirados', name: 'Dubai', code: 'DXB',
      coords: '25.197° N · 55.274° E', season: 'Nov — Mar', flight: '≈ 13h · via LIS',
      tz: 'Asia/Dubai', tags: ['Cidade', 'Compras', 'Família'], len: '4 a 7 noites',
      desc: 'A escala que vale a viagem. Entre o deserto e o Golfo, hotelaria do mais alto nível, jantar no topo do mundo e madrugadas de balão sobre as dunas.'
    },
    {
      id: 'lisboa', country: 'Portugal', name: 'Lisboa', code: 'LIS',
      coords: '38.714° N · 9.139° W', season: 'Abr — Out', flight: '≈ 5h30 · directo',
      tz: 'Europe/Lisbon', tags: ['Cidade', 'Cultura', 'Família'], len: '4 a 7 noites',
      desc: 'A ligação mais curta entre Cabo Verde e a Europa. Alfama ao amanhecer, mercados de bairro, e a porta de entrada para toda a rede de voos europeia.'
    },
    {
      id: 'rio', country: 'Brasil', name: 'Rio de Janeiro', code: 'GIG',
      coords: '22.952° S · 43.210° W', season: 'Dez — Mar', flight: '≈ 11h · via LIS',
      tz: 'America/Sao_Paulo', tags: ['Cidade', 'Praia', 'Cultura'], len: '7 a 10 noites',
      desc: 'Do Pão de Açúcar ao pôr do sol no Arpoador, o Rio faz-se de miradouros e de música. Do outro lado do mesmo Atlântico, com a língua partilhada.'
    },
    {
      id: 'krabi', country: 'Tailândia', name: 'Railay, Krabi', code: 'KBV',
      coords: '8.012° N · 98.838° E', season: 'Nov — Mar', flight: '≈ 19h · via LIS/BKK',
      tz: 'Asia/Bangkok', tags: ['Praia', 'Aventura', 'Lua-de-mel'], len: '10 a 14 noites',
      desc: 'Uma península só acessível por barco, fechada por falésias de calcário sobre o mar de Andamão. O sossego da Tailândia sem o ruído de Phuket.'
    },
    {
      id: 'quioto', country: 'Japão', name: 'Quioto', code: 'KIX',
      coords: '35.009° N · 135.667° E', season: 'Mar — Abr · Out — Nov', flight: '≈ 20h · via LIS',
      tz: 'Asia/Tokyo', tags: ['Cultura', 'Cidade', 'Bem-estar'], len: '10 a 14 noites',
      desc: 'Mil e seiscentos templos, ruas de madeira e um bosque de bambu que assobia com o vento. Vá na floração das cerejeiras ou no vermelho dos áceres.'
    },
    {
      id: 'amalfi', country: 'Itália', name: 'Costa Amalfitana', code: 'NAP',
      coords: '40.628° N · 14.485° E', season: 'Mai — Jun · Set', flight: '≈ 9h · via LIS',
      tz: 'Europe/Rome', tags: ['Lua-de-mel', 'Cultura', 'Praia'], len: '7 a 10 noites',
      desc: 'Positano desce a encosta até ao mar em socalcos de casas cor de açafrão. Almoço em Ravello e barco privado até Capri, longe das multidões de Agosto.'
    },
    {
      id: 'bali', country: 'Indonésia', name: 'Bali', code: 'DPS',
      coords: '8.431° S · 115.279° E', season: 'Abr — Out', flight: '≈ 22h · via LIS/DXB',
      tz: 'Asia/Makassar', tags: ['Bem-estar', 'Lua-de-mel', 'Natureza'], len: '12 a 16 noites',
      desc: 'Os socalcos de arroz de Tegallalang ao amanhecer, retiros de ioga em Ubud e praias de areia negra vulcânica a sul. Uma ilha que se percorre devagar.'
    }
  ];

  var INCLUI = [
    'Voos e emissão de bilhetes',
    'Estadia seleccionada para o seu perfil',
    'Transfers de chegada e partida',
    'Seguro de viagem',
    'Vistos e documentação, quando aplicável',
    'Travel Agent dedicado e apoio 24/7'
  ];

  var destLabel = function (d) { return d.country + ' · ' + d.name; };

  /* pequeno impulso ao seleccionar — confirma o toque */
  function pop(el) {
    if (!hasGSAP || REDUCE || !el) return;
    gsap.fromTo(el, { scale: .9 }, { scale: 1, duration: .45, ease: 'back.out(3)' });
  }

  /* ============================================================
     RELÓGIOS
     ============================================================ */
  function fmtTime(tz) {
    try {
      return new Intl.DateTimeFormat('pt-PT', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    } catch (e) { return '—'; }
  }
  function tick() {
    $$('[data-tz]').forEach(function (el) { el.textContent = fmtTime(el.dataset.tz); });
    var cv = $('#clockCV');
    if (cv) cv.textContent = fmtTime('Atlantic/Cape_Verde') + ' · UTC−1';
  }

  /* ============================================================
     CARROSSEL 3D
     ============================================================ */
  var deck = $('#deck'), stage = $('#deckStage'), bgs = $('#deckBgs'), dots = $('#deckDots');
  var cards = [], bgImgs = [], dotEls = [], active = 0;

  function buildDeck() {
    if (!stage) return;
    stage.innerHTML = DESTINOS.map(function (d, i) {
      return '<button class="deck__card" data-i="' + i + '" aria-label="' + destLabel(d) + '">' +
        '<img src="assets/d-' + d.id + '.webp" alt="' + d.name + ', ' + d.country + '" width="760" height="950" loading="lazy" decoding="async">' +
        '<span class="deck__num mono">' + (i + 1) + ' / ' + DESTINOS.length + '</span>' +
        '<span class="deck__cap"><span class="deck__cc">' + d.country + '</span><span class="deck__cn">' + d.name + '</span></span>' +
        '</button>';
    }).join('');
    bgs.innerHTML = DESTINOS.map(function (d, i) {
      return '<img src="assets/bg-' + d.id + '.webp" alt="" class="' + (i === 0 ? 'is-on' : '') + '" loading="lazy" decoding="async">';
    }).join('');
    dots.innerHTML = DESTINOS.map(function (d, i) {
      return '<button class="deck__dot' + (i === 0 ? ' is-on' : '') + '" data-i="' + i + '" aria-label="Ir para ' + d.name + '"></button>';
    }).join('');
    cards = $$('.deck__card', stage);
    bgImgs = $$('img', bgs);
    dotEls = $$('.deck__dot', dots);
  }

  function layoutDeck(animate) {
    if (!cards.length) return;
    var cw = cards[0].getBoundingClientRect().width || 240;
    var n = cards.length, half = Math.floor(n / 2);
    cards.forEach(function (c, i) {
      /* deslocamento circular: o activo fica sempre ao centro, com cartões de ambos os lados */
      var o = ((((i - active) % n) + n + half) % n) - half;
      var abs = Math.abs(o), sign = o < 0 ? -1 : (o > 0 ? 1 : 0);

      /* leque comprimido: cada cartão afasta-se menos do que o anterior */
      var x = 0, k;
      for (k = 1; k <= abs; k++) x += cw * 0.58 * Math.pow(0.76, k - 1);
      x *= sign;

      var vars = {
        xPercent: -50, yPercent: -50,
        x: x,
        z: -abs * 190,
        rotateY: -sign * Math.min(abs, 3) * 25,
        scale: 1 - Math.min(abs, 4) * 0.055,
        opacity: abs > 3 ? 0 : 1 - abs * 0.09,
        duration: animate ? 0.78 : 0,
        ease: 'power3.out',
        overwrite: 'auto'
      };
      if (hasGSAP) gsap.to(c, vars);
      c.style.zIndex = String(60 - abs);
      c.classList.toggle('is-active', i === active);
      c.setAttribute('aria-hidden', abs > 3 ? 'true' : 'false');
      c.tabIndex = i === active ? 0 : -1;
    });

    bgImgs.forEach(function (im, i) { im.classList.toggle('is-on', i === active); });
    dotEls.forEach(function (d, i) { d.classList.toggle('is-on', i === active); });
    updateInfo(animate);
  }

  function updateInfo(animate) {
    var d = DESTINOS[active];
    if (!d) return;
    var set = function () {
      $('#diCountry').textContent = d.country;
      $('#diName').textContent = d.name;
      $('#diDesc').textContent = d.desc;
      $('#diFacts').innerHTML = [
        ['Código', d.code], ['Melhor época', d.season],
        ['Voo desde RAI', d.flight], ['Hora local', fmtTime(d.tz)]
      ].map(function (f) {
        return '<span class="deck-info__f"><span class="deck-info__fk">' + f[0] + '</span><span class="deck-info__fv">' + f[1] + '</span></span>';
      }).join('');
    };
    if (hasGSAP && animate && !REDUCE) {
      var panel = $('#deckInfo');
      gsap.timeline()
        .to(panel, { opacity: .25, y: 6, duration: .18, ease: 'power2.in' })
        .add(set)
        .to(panel, { opacity: 1, y: 0, duration: .42, ease: 'power3.out' });
    } else { set(); }
  }

  function goTo(i, animate) {
    var n = DESTINOS.length;
    active = ((i % n) + n) % n;          /* dá a volta nos extremos */
    layoutDeck(animate !== false);
  }

  function initDeck() {
    if (!deck) return;
    buildDeck();
    layoutDeck(false);

    $('#deckPrev').addEventListener('click', function () { goTo(active - 1); });
    $('#deckNext').addEventListener('click', function () { goTo(active + 1); });
    dots.addEventListener('click', function (e) {
      var b = e.target.closest('.deck__dot');
      if (b) goTo(+b.dataset.i);
    });
    stage.addEventListener('click', function (e) {
      var c = e.target.closest('.deck__card');
      if (!c) return;
      var i = +c.dataset.i;
      if (i === active) openDrawer(DESTINOS[i].id);
      else goTo(i);
    });
    deck.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target === deck) { e.preventDefault(); openDrawer(DESTINOS[active].id); }
      }
    });

    /* arrastar */
    var dragging = false, startX = 0, moved = 0;
    deck.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.deck__arrow')) return;
      dragging = true; startX = e.clientX; moved = 0;
      deck.setPointerCapture(e.pointerId);
    });
    deck.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = e.clientX - startX;
      var cw = cards[0] ? cards[0].getBoundingClientRect().width : 240;
      if (Math.abs(moved) > cw * 0.34) {
        goTo(active + (moved < 0 ? 1 : -1));
        startX = e.clientX; moved = 0;
      }
    });
    var stop = function () { dragging = false; };
    deck.addEventListener('pointerup', stop);
    deck.addEventListener('pointercancel', stop);

    $('#diOpen').addEventListener('click', function () { openDrawer(DESTINOS[active].id); });
    $('#diQuote').addEventListener('click', function () { jumpToForm(null, destLabel(DESTINOS[active])); });

    window.addEventListener('resize', function () { layoutDeck(false); });
  }

  /* ============================================================
     PESQUISA
     ============================================================ */
  function initSearch() {
    var box = $('#search'), input = $('#searchInput'), results = $('#searchResults');
    if (!box) return;
    var cur = 0, list = [];

    function render(q) {
      q = (q || '').trim().toLowerCase();
      list = DESTINOS.filter(function (d) {
        if (!q) return true;
        return (d.name + ' ' + d.country + ' ' + d.code + ' ' + d.tags.join(' ')).toLowerCase().indexOf(q) > -1;
      });
      cur = 0;
      if (!list.length) {
        results.innerHTML = '<p class="search__empty">Sem resultados para “' + q + '”. Escreva-nos e tratamos de qualquer destino.</p>';
        return;
      }
      results.innerHTML = list.map(function (d, i) {
        return '<button class="search__item' + (i === 0 ? ' is-cur' : '') + '" data-id="' + d.id + '" role="option">' +
          '<img src="assets/d-' + d.id + '.webp" alt="" loading="lazy">' +
          '<span class="search__t"><span class="search__c">' + d.country + '</span><span class="search__n">' + d.name + '</span></span>' +
          '<span class="search__code">' + d.code + '</span></button>';
      }).join('');
    }

    function highlight() {
      $$('.search__item', results).forEach(function (el, i) { el.classList.toggle('is-cur', i === cur); });
      var el = $$('.search__item', results)[cur];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    function open() {
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      if (window.__lenis) window.__lenis.stop();
      input.value = ''; render('');
      setTimeout(function () { input.focus(); }, 80);
    }
    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (window.__lenis) window.__lenis.start();
      $('#searchOpen').focus();
    }
    function pick(id) {
      var i = DESTINOS.map(function (d) { return d.id; }).indexOf(id);
      close();
      if (i < 0) return;
      goTo(i);
      var t = $('#destinos');
      setTimeout(function () {
        if (window.__lenis) window.__lenis.scrollTo(t, { offset: -10, duration: 1.2 });
        else t.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }

    $('#searchOpen').addEventListener('click', open);
    $$('[data-search-close]').forEach(function (el) { el.addEventListener('click', close); });
    input.addEventListener('input', function () { render(input.value); });
    results.addEventListener('click', function (e) {
      var b = e.target.closest('.search__item');
      if (b) pick(b.dataset.id);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !box.classList.contains('is-open')) {
        e.preventDefault(); open(); return;
      }
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); cur = Math.min(list.length - 1, cur + 1); highlight(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, cur - 1); highlight(); }
      if (e.key === 'Enter' && list[cur]) { e.preventDefault(); pick(list[cur].id); }
      trap(e, $('.search__panel'));
    });
  }

  /* ============================================================
     GAVETA
     ============================================================ */
  var drawer = $('#drawer'), lastFocus = null;

  function openDrawer(id) {
    var d = DESTINOS.filter(function (x) { return x.id === id; })[0];
    if (!d || !drawer) return;
    lastFocus = document.activeElement;

    $('#drawerImg').src = 'assets/w-' + d.id + '.webp';
    $('#drawerImg').alt = d.name + ', ' + d.country;
    $('#drawerCountry').textContent = d.country;
    $('#drawerTitle').textContent = d.name;
    $('#drawerDesc').textContent = d.desc;
    $('#drawerTags').innerHTML = d.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');
    $('#drawerFacts').innerHTML = [
      ['Código', d.code], ['Melhor época', d.season],
      ['Voo desde RAI', d.flight], ['Duração sugerida', d.len],
      ['Coordenadas', d.coords], ['Hora local', fmtTime(d.tz)]
    ].map(function (f) {
      return '<div class="drawer__fact"><span class="drawer__fk">' + f[0] + '</span><span class="drawer__fv">' + f[1] + '</span></div>';
    }).join('');
    $('#drawerInc').innerHTML = INCLUI.map(function (i) { return '<li>' + i + '</li>'; }).join('');
    $('#drawerWa').href = 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('Olá AYAM! Gostava de saber mais sobre uma viagem a ' + d.name + ' (' + d.country + ').');
    $('#drawerQuote').dataset.dest = destLabel(d);

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    if (window.__lenis) window.__lenis.stop();
    setTimeout(function () { $('.drawer__close').focus(); }, 60);
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (window.__lenis) window.__lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  function trap(e, container) {
    if (e.key !== 'Tab' || !container) return;
    var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============================================================
     FORMULÁRIO
     ============================================================ */
  var state = { tipo: '', destinos: [], outro: '', adultos: 2, criancas: 0, nome: '', contacto: '', nota: '', tier: '' };
  var stepNow = 1;
  var STEP_NAMES = ['Tipo de viagem', 'Destinos', 'Datas e viajantes', 'Os seus dados'];

  function buildMonths() {
    var sel = $('#mes');
    if (!sel) return;
    var now = new Date(), out = ['<option value="Ainda não sei">Ainda não sei</option>'];
    for (var i = 0; i < 18; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      var label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
      out.push('<option>' + label.charAt(0).toUpperCase() + label.slice(1) + '</option>');
    }
    sel.innerHTML = out.join('');
    sel.selectedIndex = 2;
  }

  function buildDestChips() {
    var box = $('#chipsDestino');
    if (!box) return;
    box.innerHTML = DESTINOS.map(function (d) {
      var l = destLabel(d);
      return '<button type="button" class="chip" aria-pressed="false" data-v="' + l + '">' + l + '</button>';
    }).join('');
  }

  function showStep(n, dir) {
    var stage2 = $('.form__stage');
    if (!stage2) return;
    var from = $('.step:not([hidden])', stage2);
    var to = $('.step[data-step="' + n + '"]', stage2);
    if (!to || from === to) return;
    if (from) from.hidden = true;
    to.hidden = false;
    if (hasGSAP && !REDUCE) {
      gsap.fromTo(to, { opacity: 0, x: (dir === -1 ? -18 : 18) }, { opacity: 1, x: 0, duration: .45, ease: 'power3.out' });
    }
    stepNow = n;
    var done = n === 5;
    $('#formNav').hidden = done;
    $('#btnBack').hidden = done || n === 1;
    $('#btnNext').textContent = n === 4 ? 'Enviar pedido' : 'Continuar';
    if (!done) {
      $('#stepNow').textContent = String(n);
      $('#stepName').textContent = STEP_NAMES[n - 1];
    }
    for (var i = 1; i <= 4; i++) $('#m' + i).classList.toggle('is-done', i <= (done ? 4 : n));
    if (n === 4) renderReview();
  }

  function destinosLabel() {
    var l = state.destinos.slice();
    if (state.outro) l.push(state.outro);
    return l.length ? l.join(', ') : 'A definir';
  }
  function paxLabel() {
    var p = state.adultos + (state.adultos === 1 ? ' adulto' : ' adultos');
    if (state.criancas > 0) p += ' · ' + state.criancas + (state.criancas === 1 ? ' criança' : ' crianças');
    return p;
  }
  function renderReview() {
    var rows = [
      ['Tipo', state.tipo || 'A definir'],
      ['Destinos', destinosLabel()],
      ['Partida', $('#mes').value],
      ['Duração', $('#noites').value],
      ['Viajantes', paxLabel()]
    ];
    if (state.tier) rows.unshift(['Pacote', state.tier]);
    var orc = $('#orcamentoPax').value;
    if (orc) rows.push(['Orçamento', orc]);
    $('#review').innerHTML = rows.map(function (r) {
      return '<div class="review__row"><span class="review__k">' + r[0] + '</span><span class="review__v">' + r[1] + '</span></div>';
    }).join('');
  }
  function buildMessage() {
    var L = ['*Pedido de proposta — AYAM*', ''];
    if (state.tier) L.push('Pacote: ' + state.tier);
    L.push('Tipo: ' + (state.tipo || 'A definir'));
    L.push('Destinos: ' + destinosLabel());
    L.push('Partida: ' + $('#mes').value);
    L.push('Duração: ' + $('#noites').value);
    L.push('Viajantes: ' + paxLabel());
    var orc = $('#orcamentoPax').value;
    if (orc) L.push('Orçamento por pessoa: ' + orc);
    L.push('', 'Nome: ' + state.nome, 'Contacto: ' + state.contacto);
    if (state.nota) L.push('Nota: ' + state.nota);
    L.push('', 'Enviado pelo site ayam.cv');
    return L.join('\n');
  }
  function setErr(id, msg) { var el = $(id); if (el) el.textContent = msg || ''; }

  function validate(n) {
    if (n === 1) {
      if (!state.tipo) { setErr('#err1', 'Escolha uma opção para continuarmos.'); return false; }
      setErr('#err1', ''); return true;
    }
    if (n === 2) {
      state.outro = $('#outroDestino').value.trim();
      if (!state.destinos.length && !state.outro) { setErr('#err2', 'Escolha um destino ou escreva outro.'); return false; }
      setErr('#err2', ''); return true;
    }
    if (n === 4) {
      var ok = true;
      state.nome = $('#nome').value.trim();
      state.contacto = $('#contacto').value.trim();
      state.nota = $('#nota').value.trim();
      $('#nome').closest('.field').classList.toggle('is-bad', !state.nome);
      setErr('#errNome', state.nome ? '' : 'Diga-nos como se chama.');
      if (!state.nome) ok = false;
      var valid = state.contacto.length >= 6;
      $('#contacto').closest('.field').classList.toggle('is-bad', !valid);
      setErr('#errContacto', valid ? '' : 'Precisamos de um telefone ou email para responder.');
      if (!valid) ok = false;
      return ok;
    }
    return true;
  }

  function jumpToForm(tier, dest) {
    if (tier) {
      state.tier = tier;
      var map = { 'Escapadinha': '3 a 5 noites', 'Circuito': '7 a 10 noites', 'Sob medida': 'Mais de 14 noites' };
      if (map[tier] && $('#noites')) $('#noites').value = map[tier];
    }
    if (dest) {
      var chip = $$('#chipsDestino .chip').filter(function (c) { return c.dataset.v === dest; })[0];
      if (chip && chip.getAttribute('aria-pressed') !== 'true') {
        chip.setAttribute('aria-pressed', 'true');
        state.destinos.push(dest);
      }
    }
    var target = $('#orcamento');
    if (window.__lenis) window.__lenis.scrollTo(target, { offset: -10, duration: 1.1 });
    else target.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () {
      var live = $('.step:not([hidden])');
      var first = live && $('button, input, select', live);
      if (first) first.focus({ preventScroll: true });
    }, 420);
  }

  function initForm() {
    var form = $('#quoteForm');
    if (!form) return;
    buildMonths();
    buildDestChips();

    $$('#chipsTipo .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('#chipsTipo .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        state.tipo = c.textContent.trim();
        pop(c);
        setErr('#err1', '');
      });
    });

    $('#chipsDestino').addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c) return;
      var on = c.getAttribute('aria-pressed') === 'true';
      c.setAttribute('aria-pressed', on ? 'false' : 'true');
      pop(c);
      var v = c.dataset.v;
      if (on) state.destinos = state.destinos.filter(function (x) { return x !== v; });
      else state.destinos.push(v);
      setErr('#err2', '');
    });

    $$('[data-stepper]').forEach(function (st) {
      var key = st.dataset.stepper, min = +st.dataset.min, max = +st.dataset.max, out = $('output', st);
      st.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var v = Math.min(max, Math.max(min, (+out.textContent) + (+b.dataset.dir)));
        out.textContent = String(v);
        state[key] = v;
        $$('button', st).forEach(function (x) {
          x.disabled = (+x.dataset.dir === -1 && v === min) || (+x.dataset.dir === 1 && v === max);
        });
      });
    });

    $('#btnNext').addEventListener('click', function () {
      if (!validate(stepNow)) return;
      if (stepNow < 4) { showStep(stepNow + 1, 1); return; }
      var msg = buildMessage();
      $('#waLink').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      $('#mailLink').href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent('Pedido de proposta — ' + (state.nome || 'site')) +
        '&body=' + encodeURIComponent(msg);
      showStep(5, 1);
      window.open($('#waLink').href, '_blank', 'noopener');
    });
    $('#btnBack').addEventListener('click', function () { if (stepNow > 1) showStep(stepNow - 1, -1); });
    $('#restart').addEventListener('click', function () {
      state = { tipo: '', destinos: [], outro: '', adultos: 2, criancas: 0, nome: '', contacto: '', nota: '', tier: '' };
      $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      form.reset();
      $$('[data-stepper]').forEach(function (st) { $('output', st).textContent = st.dataset.stepper === 'adultos' ? '2' : '0'; });
      buildMonths();
      showStep(1, -1);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); $('#btnNext').click(); });

    $$('[data-quote-tier]').forEach(function (b) {
      b.addEventListener('click', function () { jumpToForm(b.dataset.quoteTier, null); });
    });
    $('#drawerQuote').addEventListener('click', function () {
      var dest = $('#drawerQuote').dataset.dest;
      closeDrawer();
      setTimeout(function () { jumpToForm(null, dest); }, 240);
    });
  }

  /* ============================================================
     MENU
     ============================================================ */
  function initMenu() {
    var burger = $('#burger'), menu = $('#menu');
    if (!burger || !menu) return;
    function setMenu(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
        document.body.classList.add('is-locked');
        if (window.__lenis) window.__lenis.stop();
        if (hasGSAP && !REDUCE) {
          gsap.fromTo('.menu__link', { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: .6, stagger: .055, ease: 'power3.out', delay: .18 });
        }
      } else {
        menu.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        if (window.__lenis) window.__lenis.start();
        setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 720);
      }
    }
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('.menu__link, .menu__foot a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
      if (menu.classList.contains('is-open')) trap(e, menu);
    });
  }

  /* ============================================================
     ARRANQUE
     ============================================================ */
  $('#year').textContent = new Date().getFullYear();
  tick();
  setInterval(tick, 20000);
  initDeck();
  initSearch();
  initForm();
  initMenu();

  $$('.fade-img').forEach(function (img) {
    if (img.complete) img.classList.add('is-loaded');
    else img.addEventListener('load', function () { img.classList.add('is-loaded'); });
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-drawer-close]')) closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeDrawer();
    trap(e, $('#drawerPanel'));
  });

  var toTop = $('#toTop');
  toTop.addEventListener('click', function () {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.3 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -10, duration: 1.25 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------
     Sem GSAP ou movimento reduzido: tudo estático e legível
     ------------------------------------------------------------ */
  if (!hasGSAP || REDUCE) {
    var pl = $('#preload');
    if (pl) pl.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (typeof window.Lenis !== 'undefined') {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- pré-carregamento: o avião desce pela rota do logótipo ---------- */
  var preload = $('#preload');
  var tl = gsap.timeline();

  function heroIn(at) {
    tl.from('[data-hero="1"]', { opacity: 0, y: 16, duration: .7, ease: 'power3.out' }, at)
      .from('.hero h1 .ln__i', { yPercent: 112, duration: 1.05, stagger: .09, ease: 'expo.out' }, at + .08)
      .from('.float', { opacity: 0, x: 34, duration: .8, stagger: .1, ease: 'power3.out' }, at + .2)
      .from('[data-hero="3"]', { opacity: 0, y: 18, duration: .8, ease: 'power3.out' }, at + .32)
      .from('[data-hero="4"]', { opacity: 0, y: 18, duration: .8, ease: 'power3.out' }, at + .4)
      .from('.readout__grid > *', { opacity: 0, y: 10, duration: .6, stagger: .05, ease: 'power2.out' }, at + .46);
  }

  var seenIntro = false;
  try { seenIntro = sessionStorage.getItem('ayam-intro') === '1'; sessionStorage.setItem('ayam-intro', '1'); }
  catch (e) { /* modo privado: mostra a introdução à mesma */ }

  var plPath = $('#plPath'), plTrail = $('#plTrail'), plPlane = $('#plPlane');

  if (seenIntro || !plPath || !plTrail) {
    /* já viu nesta sessão — vai directo ao herói */
    if (preload) preload.style.display = 'none';
    heroIn(0);
    ScrollTrigger.refresh();
  } else {
    var plSvg = plPath.ownerSVGElement;
    var plLen = plTrail.getTotalLength();
    var vb = plSvg.viewBox.baseVal;

    /* o rasto começa por desenhar; preserveAspectRatio="none" dá escalas
       independentes em x e y, por isso o ângulo tem de usar as duas */
    gsap.set(plTrail, { strokeDasharray: plLen, strokeDashoffset: plLen });
    gsap.set(plPath, { opacity: 0 });

    var flight = { t: 0 };
    function placePlane() {
      var r = plSvg.getBoundingClientRect();
      if (!r.width) return;
      var sx = r.width / vb.width, sy = r.height / vb.height;
      var a = plTrail.getPointAtLength(plLen * flight.t);
      var bnext = plTrail.getPointAtLength(Math.min(plLen, plLen * flight.t + 2));
      var ang = Math.atan2((bnext.y - a.y) * sy, (bnext.x - a.x) * sx) * 180 / Math.PI;
      gsap.set(plPlane, { x: a.x * sx, y: a.y * sy, rotation: ang + 90 });
    }
    placePlane();

    tl.to(plPath, { opacity: 1, duration: .45, ease: 'power2.out' }, 0)
      .to(plPlane, { opacity: 1, duration: .3, ease: 'power2.out' }, .15)
      .to(flight, { t: 1, duration: 1.25, ease: 'power1.inOut', onUpdate: placePlane }, .15)
      .to(plTrail, { strokeDashoffset: 0, duration: 1.25, ease: 'power1.inOut' }, .15)
      .from('#plMark', { opacity: 0, y: 14, duration: .7, ease: 'power3.out' }, .75)
      .to('#plRule', { scaleX: 1, duration: .6, ease: 'power3.out' }, 1.05)
      .to(plPlane, { opacity: 0, duration: .3, ease: 'power2.in' }, 1.4)
      .to('.preload__stage', { y: -16, opacity: 0, duration: .45, ease: 'power2.in' }, 1.5)
      .to(preload, {
        yPercent: -100, duration: .9, ease: 'expo.inOut',
        onComplete: function () { preload.style.display = 'none'; ScrollTrigger.refresh(); }
      }, 1.62);
    heroIn(1.95);
  }

  gsap.to('#heroMedia', { yPercent: 13, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__body, .readout, .hero__float', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true } });

  /* ---------- parallax dos fundos de secção ---------- */
  $$('section .bg__img, footer .bg__img').forEach(function (img) {
    var host = img.closest('section, footer');
    if (!host) return;
    gsap.fromTo(img, { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- navegação, progresso, rota ---------- */
  var nav = $('#nav'), progressBar = $('#progressBar');
  var routeLive = $('#routeLive'), routePlane = $('#routePlane');
  var routeOn = routeLive && window.matchMedia('(min-width:1180px)').matches;

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var p = self.progress, y = self.scroll();
      nav.classList.toggle('is-stuck', y > 80);
      toTop.classList.toggle('is-on', y > window.innerHeight * 1.2);
      gsap.set(progressBar, { scaleX: p });
      if (routeOn) {
        routeLive.setAttribute('d', 'M17 0 L17 ' + (1000 * p).toFixed(1));
        gsap.set(routePlane, { y: $('#route').clientHeight * p });
      }
    }
  });

  $$('.nav__link').forEach(function (link) {
    var sec = document.querySelector(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 40%', end: 'bottom 40%',
      onToggle: function (self) { link.setAttribute('aria-current', self.isActive ? 'true' : 'false'); }
    });
  });

  /* ---------- manifesto ---------- */
  var man = $('[data-manifesto]');
  if (man) {
    (function wrapWords(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('hl')) n.classList.add('w'); else wrapWords(n);
        }
      });
    })(man);
    gsap.from(man.querySelectorAll('.w'), {
      opacity: .18, stagger: .55, ease: 'none',
      scrollTrigger: { trigger: man, start: 'top 84%', end: 'bottom 64%', scrub: .7 }
    });
  }

  /* ---------- títulos: cascata palavra a palavra ---------- */
  function splitWords(el) {
    if (el.dataset.wd) return $$('.wd', el);
    el.dataset.wd = '1';
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var sp = document.createElement('span');
            sp.className = 'wd'; sp.textContent = part;
            frag.appendChild(sp);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('wd')) walk(n);
      });
    })(el);
    return $$('.wd', el);
  }

  $$('main h2, .air h2').forEach(function (h) {
    /* o manifesto tem o seu próprio efeito, e o h2 do bloco de números é um eyebrow */
    if (h.classList.contains('manifesto') || h.classList.contains('eyebrow')) return;
    if (!h.textContent.trim()) return;
    h.removeAttribute('data-reveal');           /* sai do ciclo genérico abaixo */
    var words = splitWords(h);
    if (!words.length) return;
    gsap.from(words, {
      opacity: 0, yPercent: 55, rotateX: -32, transformPerspective: 700, transformOrigin: '50% 100%',
      duration: .85, stagger: .035, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 87%', once: true }
    });
  });

  /* o fio do eyebrow desenha-se: o mesmo gesto da rota, repetido em cada secção */
  $$('.eyebrow').forEach(function (e) {
    gsap.fromTo(e, { '--rule': 0 }, {
      '--rule': 1, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: e, start: 'top 92%', once: true }
    });
  });

  /* ---------- revelações e contadores ---------- */
  $$('[data-reveal]').forEach(function (el) {
    gsap.from(el, { opacity: 0, y: 30, duration: .95, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  var groups = new Map();
  $$('[data-reveal-stagger]').forEach(function (el) {
    var p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach(function (items, parent) {
    gsap.from(items, { opacity: 0, y: 28, duration: .85, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: parent, start: 'top 86%', once: true } });
  });
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count), sfx = el.dataset.suffix || '', o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = Math.round(o.v) + sfx; }
    });
  });

  /* ---------- a chegada do carrossel ---------- */
  if (stage) {
    gsap.from(stage, {
      scale: .88, opacity: 0, y: 30, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#destinos', start: 'top 78%', once: true }
    });
  }

  /* ---------- Cabo Verde ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    var st = $('#cvSticky'), media = $('#cvMedia');
    if (!st || !media) return;
    gsap.fromTo(media, { clipPath: 'inset(11% 9% round 2px)', scale: 1.06 }, {
      clipPath: 'inset(0% 0% round 0px)', scale: 1, ease: 'none',
      scrollTrigger: { trigger: st, start: 'top bottom', end: 'top top', scrub: .6 }
    });
    gsap.to(media, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: st, start: 'top top', end: 'bottom top', scrub: true } });
  });

  var kri = $('#kriolu');
  if (kri) {
    kri.innerHTML = kri.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="ln" style="display:inline-block;vertical-align:top"><span class="ln__i">' + w + '</span></span>';
    }).join(' ');
    gsap.from(kri.querySelectorAll('.ln__i'), {
      yPercent: 110, duration: 1, stagger: .045, ease: 'expo.out',
      scrollTrigger: { trigger: kri, start: 'top 82%', once: true }
    });
  }

  /* ---------- marquee ---------- */
  var mTrack = $('#marqueeTrack');
  if (mTrack) {
    mTrack.innerHTML += mTrack.innerHTML;
    var mTween = gsap.to(mTrack, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var ts = gsap.utils.clamp(-6, 6, 1 + self.getVelocity() / 900);
        gsap.to(mTween, { timeScale: ts === 0 ? 1 : ts, duration: .35, overwrite: true });
        gsap.to(mTween, { timeScale: 1, duration: 1.1, delay: .4, overwrite: false });
      }
    });
  }

  /* ---------- inclinação 3D dos painéis de vidro ---------- */
  if (FINE) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: px * 6, rotateX: -py * 6, transformPerspective: 900, duration: .5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: .75, ease: 'power3.out' });
      });
    });

    /* cursor e magnetismo */
    var cur = $('#cursor'), curT = $('#cursorT');
    var cx = gsap.quickTo(cur, 'x', { duration: .42, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: .42, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: .3 }); });
    document.addEventListener('mouseenter', function () { gsap.to(cur, { opacity: 1, duration: .3 }); });
    document.addEventListener('mouseover', function (e) {
      var c = e.target.closest('.deck__card');
      if (c) { curT.textContent = c.classList.contains('is-active') ? 'abrir' : 'ver'; cur.classList.add('is-big'); }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('.deck__card')) cur.classList.remove('is-big');
    });

    $$('[data-magnetic]').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      var qy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.28);
        qy((e.clientY - (r.top + r.height / 2)) * 0.42);
      });
      el.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); layoutDeck(false); });

})();
