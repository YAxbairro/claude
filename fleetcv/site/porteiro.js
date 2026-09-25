/* ─── o porteiro ──────────────────────────────────────────
   Decide qual dos dois painéis arranca. A escolha fica guardada,
   por isso só se pergunta na primeira vez; o botão ⇄ no cabeçalho
   volta a perguntar.                                              */
(function(){
  "use strict";

  /* ─── pôr as folhas de estilo a salvo ───────────────────
     Quando esta página é servida por outro sítio — o Claude, por
     exemplo — ela vem embrulhada dentro do <body> dele. Os nossos
     <style> deixam de estar na cabeça do documento e passam a ser
     filhos do corpo. E a primeira coisa que este porteiro faz é
     trocar o corpo inteiro por outro ecrã, o que apagava as folhas
     de estilo com ele: ficava tudo sem desenho nenhum, letras
     soltas e ícones do tamanho do ecrã.
     Por isso, antes de mexer no corpo, sobem para a cabeça. */
  (function salvarEstilos(){
    var cx=document.body; if(!cx) return;
    var soltos=cx.querySelectorAll('style, link[rel="stylesheet"], title, meta');
    for(var i=0;i<soltos.length;i++) document.head.appendChild(soltos[i]);
  })();

  var QUEM='fleetcv-quem', DEMO='fleetcv-ensaio';
  var sv=function(d){ return '<svg viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'; };
  /* um volante para quem conduz, uma chave para quem e dono */
  var IC_VOLANTE=sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>'+
    '<path d="M3.3 10.2h6.1M14.6 10.2h6.1M12 15v6"/>');
  /* uma seta a apontar para dentro: entrar e ver, sem compromisso */
  var IC_ENSAIO=sv('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>'+
    '<path d="M10 17l5-5-5-5M15 12H3"/>');
  var IC_CHAVE=sv('<circle cx="8.5" cy="8.5" r="4.5"/>'+
    '<path d="M11.7 11.7 20 20M17.2 17.2l-2 2M19.6 14.8l-2 2"/>');
  var CORPOS={
    condutor:"<div class=\"topo\">\n  <div class=\"marca\"><span class=\"pt\"></span>FleetCV<span style=\"font-weight:400;\n    font-size:12px;color:var(--muted)\"> \u00b7 condutor</span></div>\n  <div class=\"dir\" id=\"dir\"></div>\n  <button class=\"trocar\" id=\"trocar\" title=\"Trocar de painel\">\u21c4</button>\n</div>\n<main><div class=\"col\" id=\"ecra\"></div></main>\n<div class=\"rodape\"><div class=\"col\" id=\"accoes\"></div></div>",
    dono:"<div class=\"topo\">\n  <button class=\"voltar\" id=\"voltar\" hidden>\u2039</button>\n  <div class=\"marca\"><span class=\"pt\"></span>FleetCV<span style=\"font-weight:400;\n    font-size:12px;color:var(--muted)\" id=\"sub-marca\"></span></div>\n  <div class=\"dir\" id=\"dir\"></div>\n  <button class=\"trocar\" id=\"trocar\" title=\"Trocar de painel\">\u21c4</button>\n</div>\n<main><div class=\"col\" id=\"ecra\"></div></main>\n<div class=\"nav\"><div class=\"in\" id=\"nav\"></div></div>" };

  function arrancar(quem){
    document.body.className=quem;
    document.body.innerHTML=CORPOS[quem];
    var b=document.getElementById('trocar');
    if(b) b.onclick=function(){
      try{ localStorage.removeItem(QUEM); localStorage.removeItem(DEMO); }
      catch(e){}
      location.reload(); };
    if(quem==='condutor') appCondutor(); else appDono();
  }

  function perguntar(){
    document.body.className='escolher';
    document.body.innerHTML=
      '<div class="escolha-cx">'+
      '<div class="marca"><span class="pt"></span>FleetCV</div>'+
      '<p>Controlo de frota para táxis, na Praia.</p>'+
      '<button class="porta" data-quem="condutor">'+
        '<span class="ic">'+IC_VOLANTE+'</span>'+
        '<span><span class="t">Sou condutor</span>'+
        '<span class="d">Abrir turno, marcar os km, abastecer e fechar o dia.</span>'+
        '</span><span class="seta">\u203A</span></button>'+
      '<button class="porta" data-quem="dono">'+
        '<span class="ic">'+IC_CHAVE+'</span>'+
        '<span><span class="t">Sou o proprietário</span>'+
        '<span class="d">Ver os carros ao vivo, os turnos, os alertas e as contas.</span>'+
        '</span><span class="seta">\u203A</span></button>'+
      '<button class="porta ensaio" data-demo="1">'+
        '<span class="ic">'+IC_ENSAIO+'</span>'+
        '<span><span class="t">Só quero experimentar</span>'+
        '<span class="d">Uma frota de mentira, só neste telemóvel. '+
        'Não precisa de conta nem de código.</span>'+
        '</span><span class="seta">\u203A</span></button>'+
      '<p class="pe">A escolha fica guardada neste telemóvel. Para trocar, '+
      'carregue em <b>\u21C4</b> no canto de cima.</p></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-quem]'),
      function(x){ x.onclick=function(){
        var q=x.getAttribute('data-quem');
        try{ localStorage.removeItem(DEMO); localStorage.setItem(QUEM,q); }catch(e){}
        arrancar(q); }; });
    /* Quem carrega em experimentar não entra na frota de ninguém: a
       aplicação passa a guardar tudo no próprio telemóvel e nem chega a
       falar com a base de dados. Cada pessoa fica com a sua frota de
       mentira, e ninguém vê a de ninguém. */
    var ex=document.querySelector('[data-demo]');
    if(ex) ex.onclick=function(){
      try{ localStorage.setItem(DEMO,'1'); }catch(e){}
      escolherPapelDoEnsaio(); };
  }

  /* No ensaio pergunta-se na mesma de que lado se quer ver, mas sem
     e-mail nem código: entra-se directamente. */
  function escolherPapelDoEnsaio(){
    document.body.className='escolher';
    document.body.innerHTML=
      '<div class="escolha-cx">'+
      '<div class="marca"><span class="pt"></span>FleetCV</div>'+
      '<p>A experimentar. Os dados ficam só neste telemóvel.</p>'+
      '<button class="porta" data-quem="condutor">'+
        '<span class="ic">'+IC_VOLANTE+'</span>'+
        '<span><span class="t">Ver o lado do condutor</span>'+
        '<span class="d">Abrir turno e ver o carro andar pela Praia.</span>'+
        '</span><span class="seta">\u203A</span></button>'+
      '<button class="porta" data-quem="dono">'+
        '<span class="ic">'+IC_CHAVE+'</span>'+
        '<span><span class="t">Ver o lado do proprietário</span>'+
        '<span class="d">A frota ao vivo, os turnos e as contas.</span>'+
        '</span><span class="seta">\u203A</span></button>'+
      '<p class="pe">Abra os dois ao mesmo tempo, em dois separadores, '+
      'para ver um a falar com o outro. Para sair do ensaio, carregue em '+
      '<b>\u21C4</b> no canto de cima.</p></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-quem]'),
      function(x){ x.onclick=function(){
        var q=x.getAttribute('data-quem');
        try{ localStorage.setItem(QUEM,q); }catch(e){}
        arrancar(q); }; });
  }

  var guardado=null, ensaio=null;
  try{ guardado=localStorage.getItem(QUEM); ensaio=localStorage.getItem(DEMO); }
  catch(e){}
  /* A porta pode vir escolhida no endereço. É assim que o link que o
     patrão manda ao condutor (…#condutor) abre logo no ecrã de entrar
     dele, e que os botões da página principal levam cada um ao seu
     sítio (#dono, #criar, #experimentar). Lê-se uma vez e apaga-se,
     para um recarregar não voltar a mandar no que o telemóvel já
     escolheu. */
  var pedido=String(location.hash||'').replace(/^#/,'');
  try{
    if(pedido==='condutor'||pedido==='dono'||pedido==='criar'){
      localStorage.removeItem(DEMO); ensaio=null;
      guardado = pedido==='criar' ? 'dono' : pedido;
      localStorage.setItem(QUEM, guardado);
      if(pedido==='criar') localStorage.setItem('fleetcv-quero-criar','1');
    }
    if(pedido==='experimentar'){
      localStorage.removeItem(QUEM); localStorage.setItem(DEMO,'1');
      guardado=null; ensaio='1';
    }
  }catch(e){}
  if(pedido) try{ history.replaceState(null,'',location.pathname+location.search); }
             catch(e){}
  if(guardado==='condutor'||guardado==='dono') arrancar(guardado);
  else if(ensaio) escolherPapelDoEnsaio();
  else perguntar();
})();