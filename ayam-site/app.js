/* ============================================================
   AYAM Viagens & Turismo — comportamento
   ============================================================ */
(function () {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var WA = '2389990900';
  var MAIL = 'ayam.reservas@gmail.com';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ============================================================
     DADOS — fonte única para o carrossel e para a gaveta
     ============================================================ */
  var DESTINOS = [
    {
      id: 'fogo', country: 'Cabo Verde', name: 'Ilha do Fogo', code: 'SFL',
      coords: '14.895° N · 24.495° W', season: 'Nov — Jun', flight: '0h35 · directo',
      tz: 'Atlantic/Cape_Verde', tags: ['Natureza', 'Entre ilhas', 'Aventura'],
      desc: 'Um vulcão activo com uma aldeia dentro da cratera. Chã das Caldeiras produz vinho e café em solo de lava, e a subida ao Pico faz-se de madrugada para chegar ao cume com o nascer do sol. A ilha mais dramática do arquipélago, a trinta e cinco minutos de voo da Praia.',
      len: '3 a 5 noites'
    },
    {
      id: 'maldivas', country: 'Maldivas', name: 'Atol de Baa', code: 'MLE',
      coords: '5.210° N · 73.068° E', season: 'Nov — Abr', flight: '≈ 20h · via LIS/DXB',
      tz: 'Indian/Maldives', tags: ['Lua-de-mel', 'Praia', 'Bem-estar'],
      desc: 'Reserva da Biosfera da UNESCO, o Atol de Baa é onde as mantas se juntam às centenas na baía de Hanifaru entre Maio e Novembro. Villas sobre a água, casa de mergulho privada e o silêncio que só existe a duzentos quilómetros do continente mais próximo.',
      len: '7 a 10 noites'
    },
    {
      id: 'dubai', country: 'Emirados', name: 'Dubai', code: 'DXB',
      coords: '25.197° N · 55.274° E', season: 'Nov — Mar', flight: '≈ 13h · via LIS',
      tz: 'Asia/Dubai', tags: ['Cidade', 'Compras', 'Família'],
      desc: 'A escala que vale a viagem. Entre o deserto e o Golfo, Dubai combina hotelaria de altíssimo nível com jantar no topo do mundo e madrugadas de balão sobre as dunas. Excelente ponto de ligação para a Ásia, e um destino inteiro por si só.',
      len: '4 a 7 noites'
    },
    {
      id: 'lisboa', country: 'Portugal', name: 'Lisboa', code: 'LIS',
      coords: '38.714° N · 9.139° W', season: 'Abr — Out', flight: '≈ 5h30 · directo',
      tz: 'Europe/Lisbon', tags: ['Cidade', 'Cultura', 'Família'],
      desc: 'A ligação mais curta entre Cabo Verde e a Europa. Alfama ao amanhecer, mercados de bairro, e a porta de entrada para toda a rede de voos europeia. Tratamos de estadia, transfers e das ligações seguintes sem que tenha de pensar nisso.',
      len: '4 a 7 noites'
    },
    {
      id: 'rio', country: 'Brasil', name: 'Rio de Janeiro', code: 'GIG',
      coords: '22.952° S · 43.210° W', season: 'Dez — Mar', flight: '≈ 11h · via LIS',
      tz: 'America/Sao_Paulo', tags: ['Cidade', 'Praia', 'Cultura'],
      desc: 'Do Pão de Açúcar ao pôr do sol no Arpoador, o Rio faz-se de miradouros e de música. Do outro lado do mesmo Atlântico, com uma língua partilhada e uma proximidade cultural que se sente à chegada.',
      len: '7 a 10 noites'
    },
    {
      id: 'krabi', country: 'Tailândia', name: 'Railay, Krabi', code: 'KBV',
      coords: '8.012° N · 98.838° E', season: 'Nov — Mar', flight: '≈ 19h · via LIS/BKK',
      tz: 'Asia/Bangkok', tags: ['Praia', 'Aventura', 'Lua-de-mel'],
      desc: 'Uma península só acessível por barco, fechada por falésias de calcário que caem a pique sobre o mar de Andamão. Escalada, caiaque entre ilhotas e praias que ao fim da tarde ficam vazias. O sossego da Tailândia sem o ruído de Phuket.',
      len: '10 a 14 noites'
    },
    {
      id: 'quioto', country: 'Japão', name: 'Quioto', code: 'KIX',
      coords: '35.009° N · 135.667° E', season: 'Mar — Abr · Out — Nov',
      flight: '≈ 20h · via LIS', tz: 'Asia/Tokyo', tags: ['Cultura', 'Cidade', 'Bem-estar'],
      desc: 'Mil e seiscentos templos, ruas de madeira e um bosque de bambu que assobia com o vento. Vá na floração das cerejeiras, em Abril, ou no vermelho dos áceres, em Novembro — as duas janelas esgotam com um ano de antecedência.',
      len: '10 a 14 noites'
    },
    {
      id: 'amalfi', country: 'Itália', name: 'Costa Amalfitana', code: 'NAP',
      coords: '40.628° N · 14.485° E', season: 'Mai — Jun · Set', flight: '≈ 9h · via LIS',
      tz: 'Europe/Rome', tags: ['Lua-de-mel', 'Cultura', 'Praia'],
      desc: 'Positano desce a encosta até ao mar em socalcos de casas cor de açafrão. Almoço em Ravello, barco privado até Capri e limoncello ao fim da tarde. Evite Agosto: Maio e Setembro dão-lhe a mesma costa sem as multidões.',
      len: '7 a 10 noites'
    },
    {
      id: 'bali', country: 'Indonésia', name: 'Bali', code: 'DPS',
      coords: '8.431° S · 115.279° E', season: 'Abr — Out', flight: '≈ 22h · via LIS/DXB',
      tz: 'Asia/Makassar', tags: ['Bem-estar', 'Lua-de-mel', 'Natureza'],
      desc: 'Os socalcos de arroz de Tegallalang ao amanhecer, retiros de ioga em Ubud e praias de areia negra vulcânica a sul. Uma ilha que se percorre devagar, entre templos e vales, com estadias que vão de cabanas na selva a resorts sobre a falésia.',
      len: '12 a 16 noites'
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

  /* ============================================================
     RELÓGIOS — hora local real em cada destino
     ============================================================ */
  function fmtTime(tz) {
    try {
      return new Intl.DateTimeFormat('pt-PT', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) { return '—'; }
  }
  function tick() {
    $$('[data-tz]').forEach(function (el) { el.textContent = fmtTime(el.dataset.tz); });
    var cv = $('#clockCV');
    if (cv) cv.textContent = fmtTime('Atlantic/Cape_Verde') + ' · UTC−1';
  }

  /* ============================================================
     CARROSSEL — cartões a partir dos dados
     ============================================================ */
  function renderCards() {
    var track = $('#railTrack');
    if (!track) return;
    track.innerHTML = DESTINOS.map(function (d) {
      return '' +
        '<article class="card" role="listitem">' +
          '<div class="card__frame">' +
            '<img class="card__img" src="assets/d-' + d.id + '.jpg" alt="' + d.name + ', ' + d.country + '" width="760" height="950" loading="lazy" decoding="async">' +
            '<div class="card__veil"></div>' +
            '<span class="card__code">' + d.code + '</span>' +
            '<div class="card__over">' +
              '<span class="card__country">' + d.country + '</span>' +
              '<h3 class="card__name">' + d.name + '</h3>' +
            '</div>' +
            '<button class="card__hit" data-dest="' + d.id + '" aria-label="Ver detalhes de ' + d.name + ', ' + d.country + '">' +
              '<span class="card__open" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>' +
              '</span>' +
            '</button>' +
          '</div>' +
          '<div class="card__meta">' +
            '<div class="card__row"><span class="card__rk">Coordenadas</span><span class="card__rv">' + d.coords + '</span></div>' +
            '<div class="card__row"><span class="card__rk">Melhor época</span><span class="card__rv card__rv--gold">' + d.season + '</span></div>' +
            '<div class="card__row"><span class="card__rk">Voo</span><span class="card__rv">' + d.flight + '</span></div>' +
            '<div class="card__row"><span class="card__rk">Hora local</span><span class="card__rv" data-tz="' + d.tz + '">—</span></div>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ============================================================
     GAVETA DE DESTINO
     ============================================================ */
  var drawer = $('#drawer');
  var lastFocus = null;

  function openDrawer(id) {
    var d = DESTINOS.filter(function (x) { return x.id === id; })[0];
    if (!d || !drawer) return;
    lastFocus = document.activeElement;

    $('#drawerImg').src = 'assets/w-' + d.id + '.jpg';
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
    $('#drawerQuote').dataset.dest = d.country + ' \u00b7 ' + d.name;

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

  /* prende o foco dentro de um contentor aberto */
  function trap(e, container) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
      .filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============================================================
     FORMULÁRIO DE PROPOSTA
     ============================================================ */
  var state = { tipo: '', destinos: [], outro: '', mes: '', noites: '', adultos: 2, criancas: 0, orc: '', nome: '', contacto: '', nota: '', tier: '' };
  var stepNow = 1;
  var STEP_NAMES = ['Tipo de viagem', 'Destinos', 'Datas e viajantes', 'Os seus dados'];

  function buildMonths() {
    var sel = $('#mes');
    if (!sel) return;
    var now = new Date(), out = [];
    out.push('<option value="Ainda não sei">Ainda não sei</option>');
    for (var i = 0; i < 18; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      var label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
      label = label.charAt(0).toUpperCase() + label.slice(1);
      out.push('<option>' + label + '</option>');
    }
    sel.innerHTML = out.join('');
    sel.selectedIndex = 2;
  }

  function buildDestChips() {
    var box = $('#chipsDestino');
    if (!box) return;
    box.innerHTML = DESTINOS.map(function (d) {
      var label = d.country + ' \u00b7 ' + d.name;
      return '<button type="button" class="chip" aria-pressed="false" data-v="' + label + '">' + label + '</button>';
    }).join('');
  }

  function showStep(n, dir) {
    var stage = $('.form__stage');
    if (!stage) return;
    var from = $('.step:not([hidden])', stage);
    var to = $('.step[data-step="' + n + '"]', stage);
    if (!to) return;

    if (from === to) return;
    if (from) from.hidden = true;
    to.hidden = false;

    if (hasGSAP && !REDUCE) {
      gsap.fromTo(to, { opacity: 0, x: (dir === -1 ? -18 : 18) },
        { opacity: 1, x: 0, duration: .45, ease: 'power3.out' });
    }

    stepNow = n;
    var isDone = n === 5;
    $('#formNav').hidden = isDone;
    $('#btnBack').hidden = isDone || n === 1;
    $('#btnNext').textContent = n === 4 ? 'Enviar pedido' : 'Continuar';
    if (!isDone) {
      $('#stepNow').textContent = String(n);
      $('#stepName').textContent = STEP_NAMES[n - 1];
    }
    for (var i = 1; i <= 4; i++) {
      $('#m' + i).classList.toggle('is-done', i <= (isDone ? 4 : n));
    }
    if (n === 4) renderReview();
  }

  function destinosLabel() {
    var list = state.destinos.slice();
    if (state.outro) list.push(state.outro);
    return list.length ? list.join(', ') : 'A definir';
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
      ['Partida', $('#mes') ? $('#mes').value : ''],
      ['Duração', $('#noites') ? $('#noites').value : ''],
      ['Viajantes', paxLabel()]
    ];
    if (state.tier) rows.unshift(['Pacote', state.tier]);
    var orc = $('#orcamentoPax') ? $('#orcamentoPax').value : '';
    if (orc) rows.push(['Orçamento', orc]);
    $('#review').innerHTML = rows.map(function (r) {
      return '<div class="review__row"><span class="review__k">' + r[0] + '</span><span class="review__v">' + r[1] + '</span></div>';
    }).join('');
  }

  function buildMessage() {
    var L = [];
    L.push('*Pedido de proposta — AYAM*');
    L.push('');
    if (state.tier) L.push('Pacote: ' + state.tier);
    L.push('Tipo: ' + (state.tipo || 'A definir'));
    L.push('Destinos: ' + destinosLabel());
    L.push('Partida: ' + $('#mes').value);
    L.push('Duração: ' + $('#noites').value);
    L.push('Viajantes: ' + paxLabel());
    var orc = $('#orcamentoPax').value;
    if (orc) L.push('Orçamento por pessoa: ' + orc);
    L.push('');
    L.push('Nome: ' + state.nome);
    L.push('Contacto: ' + state.contacto);
    if (state.nota) { L.push('Nota: ' + state.nota); }
    L.push('');
    L.push('Enviado pelo site ayam.cv');
    return L.join('\n');
  }

  function setErr(id, msg) {
    var el = $(id);
    if (el) el.textContent = msg || '';
  }

  function validate(n) {
    if (n === 1) {
      if (!state.tipo) { setErr('#err1', 'Escolha uma opção para continuarmos.'); return false; }
      setErr('#err1', ''); return true;
    }
    if (n === 2) {
      state.outro = $('#outroDestino').value.trim();
      if (!state.destinos.length && !state.outro) {
        setErr('#err2', 'Escolha um destino ou escreva outro.'); return false;
      }
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

  function initForm() {
    var form = $('#quoteForm');
    if (!form) return;
    buildMonths();
    buildDestChips();

    /* chips de tipo — escolha única */
    $$('#chipsTipo .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('#chipsTipo .chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        state.tipo = c.textContent.trim();
        setErr('#err1', '');
      });
    });

    /* chips de destino — escolha múltipla */
    $('#chipsDestino').addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c) return;
      var on = c.getAttribute('aria-pressed') === 'true';
      c.setAttribute('aria-pressed', on ? 'false' : 'true');
      var v = c.dataset.v;
      if (on) state.destinos = state.destinos.filter(function (x) { return x !== v; });
      else state.destinos.push(v);
      setErr('#err2', '');
    });

    /* contadores */
    $$('[data-stepper]').forEach(function (st) {
      var key = st.dataset.stepper;
      var min = +st.dataset.min, max = +st.dataset.max;
      var out = $('output', st);
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
      /* passo 4 → gera links e mostra conclusão */
      var msg = buildMessage();
      $('#waLink').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      $('#mailLink').href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent('Pedido de proposta — ' + (state.nome || 'site')) +
        '&body=' + encodeURIComponent(msg);
      showStep(5, 1);
      window.open($('#waLink').href, '_blank', 'noopener');
    });

    $('#btnBack').addEventListener('click', function () {
      if (stepNow > 1) showStep(stepNow - 1, -1);
    });

    $('#restart').addEventListener('click', function () {
      state = { tipo: '', destinos: [], outro: '', mes: '', noites: '', adultos: 2, criancas: 0, orc: '', nome: '', contacto: '', nota: '', tier: '' };
      $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      form.reset();
      $$('[data-stepper]').forEach(function (st) {
        var d = st.dataset.stepper === 'adultos' ? '2' : '0';
        $('output', st).textContent = d;
      });
      buildMonths();
      showStep(1, -1);
    });

    /* Enter avança em vez de submeter */
    form.addEventListener('submit', function (e) { e.preventDefault(); $('#btnNext').click(); });

    /* atalhos para o formulário a partir dos pacotes e da gaveta */
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
     MENU EM ECRÃ INTEIRO
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
          gsap.fromTo('.menu__link', { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: .6, stagger: .055, ease: 'power3.out', delay: .18 });
        }
      } else {
        menu.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        if (window.__lenis) window.__lenis.start();
        setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 720);
      }
    }

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('.menu__link, .menu__foot a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
      if (menu.classList.contains('is-open')) trap(e, menu);
    });
  }

  /* ============================================================
     ARRANQUE
     ============================================================ */
  $('#year').textContent = new Date().getFullYear();
  renderCards();
  tick();
  setInterval(tick, 20000);
  initForm();
  initMenu();

  /* imagens que aparecem suavemente */
  $$('.fade-img').forEach(function (img) {
    if (img.complete) img.classList.add('is-loaded');
    else img.addEventListener('load', function () { img.classList.add('is-loaded'); });
  });

  /* gaveta */
  document.addEventListener('click', function (e) {
    var hit = e.target.closest('[data-dest]');
    if (hit && hit.classList.contains('card__hit')) { openDrawer(hit.dataset.dest); return; }
    if (e.target.closest('[data-drawer-close]')) closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeDrawer();
    trap(e, $('#drawerPanel'));
  });

  /* voltar ao topo */
  var toTop = $('#toTop');
  toTop.addEventListener('click', function () {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.3 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* âncoras internas */
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
     Sem GSAP ou com movimento reduzido: tudo estático e legível
     ------------------------------------------------------------ */
  if (!hasGSAP || REDUCE) {
    var pl = $('#preload');
    if (pl) pl.remove();
    var vp = $('#railViewport');
    if (vp) {
      vp.style.overflowX = 'auto';
      $('#railPrev').addEventListener('click', function () { vp.scrollBy({ left: -340, behavior: 'smooth' }); });
      $('#railNext').addEventListener('click', function () { vp.scrollBy({ left: 340, behavior: 'smooth' }); });
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------
     Scroll suave
     ------------------------------------------------------------ */
  if (typeof window.Lenis !== 'undefined') {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------
     Pré-carregamento + entrada do herói
     ------------------------------------------------------------ */
  var preload = $('#preload'), fill = $('#preloadFill'), num = $('#preloadNum');
  var counter = { v: 0 };
  var intro = gsap.timeline();
  intro
    .to(fill, { scaleX: 1, duration: .95, ease: 'power2.inOut' }, 0)
    .to(counter, {
      v: 100, duration: .95, ease: 'power2.inOut',
      onUpdate: function () { num.textContent = String(Math.round(counter.v)).padStart(2, '0'); }
    }, 0)
    .to('.preload__inner', { y: -14, opacity: 0, duration: .45, ease: 'power2.in' }, '>-0.05')
    .to(preload, {
      yPercent: -100, duration: .9, ease: 'expo.inOut',
      onComplete: function () { preload.style.display = 'none'; ScrollTrigger.refresh(); }
    }, '<0.1')
    .from('[data-hero="1"]', { opacity: 0, y: 16, duration: .7, ease: 'power3.out' }, '-=0.45')
    .from('.hero h1 .ln__i', { yPercent: 112, duration: 1.05, stagger: .09, ease: 'expo.out' }, '-=0.55')
    .from('[data-hero="3"]', { opacity: 0, y: 18, duration: .8, ease: 'power3.out' }, '-=0.65')
    .from('[data-hero="4"]', { opacity: 0, y: 18, duration: .8, ease: 'power3.out' }, '-=0.62')
    .from('.readout__grid > *', { opacity: 0, y: 10, duration: .6, stagger: .05, ease: 'power2.out' }, '-=0.6');

  gsap.to('#heroMedia', {
    yPercent: 13, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__body, .readout', {
    opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true }
  });

  /* ------------------------------------------------------------
     Navegação, progresso, rota
     ------------------------------------------------------------ */
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

  /* secção activa na navegação */
  $$('.nav__link').forEach(function (link) {
    var sec = document.querySelector(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 40%', end: 'bottom 40%',
      onToggle: function (self) { link.setAttribute('aria-current', self.isActive ? 'true' : 'false'); }
    });
  });

  /* ------------------------------------------------------------
     Manifesto — palavras que acendem
     ------------------------------------------------------------ */
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
          if (n.classList.contains('hl')) n.classList.add('w');
          else wrapWords(n);
        }
      });
    })(man);

    gsap.from(man.querySelectorAll('.w'), {
      opacity: .16, stagger: .55, ease: 'none',
      scrollTrigger: { trigger: man, start: 'top 82%', end: 'bottom 62%', scrub: .7 }
    });
  }

  /* ------------------------------------------------------------
     Revelações e contadores
     ------------------------------------------------------------ */
  $$('[data-reveal]').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 26, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  var groups = new Map();
  $$('[data-reveal-stagger]').forEach(function (el) {
    var p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach(function (items, parent) {
    gsap.from(items, {
      opacity: 0, y: 24, duration: .85, stagger: .07, ease: 'power3.out',
      scrollTrigger: { trigger: parent, start: 'top 85%', once: true }
    });
  });

  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count), sfx = el.dataset.suffix || '', o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = Math.round(o.v) + sfx; }
    });
  });

  /* ------------------------------------------------------------
     CARROSSEL — fixação horizontal, setas, arrasto, progresso
     ------------------------------------------------------------ */
  var mm = gsap.matchMedia();
  var railFill = $('#railFill');
  var railPrev = $('#railPrev'), railNext = $('#railNext');

  mm.add('(min-width: 860px)', function () {
    var viewport = $('#railViewport'), track = $('#railTrack');
    if (!viewport || !track) return;

    var distance = function () { return Math.max(1, track.scrollWidth - window.innerWidth); };
    var pad = function () { return window.innerHeight * 0.4; };

    var scrubTween = gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: viewport, start: 'top top',
        end: function () { return '+=' + (distance() + pad()); },
        pin: true, scrub: .85, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) {
          gsap.set(railFill, { scaleX: self.progress });
          railPrev.disabled = self.progress < .01;
          railNext.disabled = self.progress > .99;
        }
      }
    });

    /* parallax dentro de cada cartão */
    $$('.card').forEach(function (card) {
      var img = $('.card__img', card);
      if (!img) return;
      gsap.fromTo(img, { xPercent: -9 }, {
        xPercent: 9, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: scrubTween, start: 'left right', end: 'right left', scrub: true }
      });
    });

    /* setas — avançam um cartão de cada vez */
    function stepBy(dir) {
      var card = $('.card');
      if (!card) return;
      var cw = card.getBoundingClientRect().width + 18;
      var ratio = (distance() + pad()) / distance();
      var y = (window.__lenis ? window.__lenis.scroll : window.scrollY) + dir * cw * ratio;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: .7 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    }
    var onPrev = function () { stepBy(-1); };
    var onNext = function () { stepBy(1); };
    railPrev.addEventListener('click', onPrev);
    railNext.addEventListener('click', onNext);

    /* arrastar na horizontal move a página */
    var dragging = false, startX = 0, startY = 0;
    function down(e) {
      if (e.target.closest('button')) return;
      dragging = true; startX = e.clientX;
      startY = window.__lenis ? window.__lenis.scroll : window.scrollY;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!dragging) return;
      var ratio = (distance() + pad()) / distance();
      var y = startY + (startX - e.clientX) * ratio;
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }
    function up() { dragging = false; viewport.classList.remove('is-dragging'); }
    viewport.addEventListener('pointerdown', down);
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);

    return function () {
      gsap.set(track, { clearProps: 'x' });
      railPrev.removeEventListener('click', onPrev);
      railNext.removeEventListener('click', onNext);
      viewport.removeEventListener('pointerdown', down);
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
    };
  });

  /* em telemóvel o carrossel desliza nativamente */
  mm.add('(max-width: 859px)', function () {
    var viewport = $('#railViewport');
    if (!viewport) return;
    var onScroll = function () {
      var max = viewport.scrollWidth - viewport.clientWidth;
      gsap.set(railFill, { scaleX: max > 0 ? viewport.scrollLeft / max : 0 });
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return function () { viewport.removeEventListener('scroll', onScroll); };
  });

  /* ------------------------------------------------------------
     Cabo Verde + editorial
     ------------------------------------------------------------ */
  mm.add('(min-width: 760px)', function () {
    var st = $('#cvSticky'), media = $('#cvMedia');
    if (!st || !media) return;
    gsap.fromTo(media, { clipPath: 'inset(11% 9% round 2px)', scale: 1.06 }, {
      clipPath: 'inset(0% 0% round 0px)', scale: 1, ease: 'none',
      scrollTrigger: { trigger: st, start: 'top bottom', end: 'top top', scrub: .6 }
    });
    gsap.to(media, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: st, start: 'top top', end: 'bottom top', scrub: true }
    });
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

  var diffImg = $('#diffImg');
  if (diffImg) {
    gsap.fromTo(diffImg, { yPercent: -6, scale: 1.1 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: diffImg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ------------------------------------------------------------
     Marquee
     ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     Cursor e magnetismo
     ------------------------------------------------------------ */
  if (window.matchMedia('(hover:hover) and (pointer:fine) and (min-width:1024px)').matches) {
    var cur = $('#cursor'), curT = $('#cursorT');
    var cx = gsap.quickTo(cur, 'x', { duration: .42, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: .42, ease: 'power3' });
    window.addEventListener('mousemove', function (e) { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: .3 }); });
    document.addEventListener('mouseenter', function () { gsap.to(cur, { opacity: 1, duration: .3 }); });

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('.card__hit')) { curT.textContent = 'ver'; cur.classList.add('is-big'); }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('.card__hit')) cur.classList.remove('is-big');
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

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
