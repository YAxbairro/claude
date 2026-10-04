/* ════════════════════════════════════════════════════════════
   A NUVEM
   O que liga o telemóvel do condutor ao ecrã do patrão.

   Antes, cada um guardava as suas coisas no seu telemóvel e nunca se
   viam. Agora há um sítio comum: o condutor escreve lá, o patrão lê de
   lá, e ao contrário. Quem está com a página aberta recebe as mudanças
   sozinho, em segundos — ninguém carrega em "actualizar".

   Três cuidados que mandam no desenho todo:

   1 · Escrever custa. Um turno de oito horas dá milhares de pontos de
       GPS; se cada um fosse uma escrita, a aplicação era travada e
       cortada por excesso. Por isso a posição sobe de 4 em 4 segundos
       (só se o carro mexeu) e o rasto inteiro é gravado de 45 em 45
       segundos, aos pedaços.

   2 · Cada papel escreve o seu. O condutor escreve o turno dele e onde
       está. O patrão escreve os carros, os condutores e as respostas
       aos alertas. Assim dois telemóveis nunca escrevem a mesma linha
       ao mesmo tempo.

   3 · Sem nuvem tem de funcionar na mesma. Se a nuvem não estiver
       disponível — sem rede, sem sessão iniciada — tudo continua a
       trabalhar com o que está guardado no próprio telemóvel, e sobe
       quando voltar. O condutor não pode ficar parado à porta de um
       cliente à espera de rede.
   ════════════════════════════════════════════════════════════ */
var Nuvem = (function(){
"use strict";

/* Com o carro a andar, o patrão tem de o ver andar: de quatro em quatro
   segundos o ponteiro dava saltos e parecia tudo atrasado. A segundo e
   meio já parece o que é. Mas um táxi passa metade do dia parado à
   espera de passageiro, e repetir a mesma posição de segundo e meio em
   segundo e meio era queimar os dados do condutor para dizer que nada
   mudou — por isso, parado, abranda sozinho. */
var RITMO_VIVO  = 1500;    /* com o carro a andar                        */
var RITMO_PARADO= 12000;   /* parado, ninguém precisa de saber tão vezes  */
var RITMO_RASTO = 45000;   /* de quanto em quanto tempo se grava o rasto */
var CAUDA       = 160;     /* pontos que viajam com a posição, para o
                              patrão ver logo o rabicho do carro         */
var PARTE_MAX   = 800;     /* pontos por pedaço de rasto gravado         */
var TECTO_VIVO  = 40000;   /* se a nuvem se queixar, abranda até aqui    */
var CAUDA_CHEIA = 30000;   /* a cauda inteira só vai de 30 em 30 s; pelo
                              meio vão só os pontos novos, e o ecrã do
                              patrão cose-os à cauda que já tem. Com os
                              160 pontos a cada segundo e meio, cada
                              posição pesava 8 kB em vez de menos de 1. */

var loja=null, quem=null, estado='a-ligar', ritmo=RITMO_VIVO, opGuardado={};
var ouvintes=[], subs=[], cacheRasto={};
var D = { frota:null, turnos:[], vivos:[] };

/* ════════════════════════════════════════════════════════
   A LOJA
   Onde as coisas ficam guardadas. Há duas, com a mesma porta:

   · a de longe — a base de dados partilhada. Liga telemóveis
     diferentes, em sítios diferentes. É esta que se quer.
   · a de perto — o próprio navegador. Liga separadores e janelas
     do mesmo aparelho, e mais nada. Serve quando a de longe não
     está disponível, e é o que faz o patrão ver o condutor quando
     os dois estão abertos no mesmo computador.

   O resto do ficheiro não sabe qual delas está a ser usada.
   ════════════════════════════════════════════════════════ */

/* ─── a loja do Supabase ─── */
/* A melhor de todas, e a que fica a custo nenhum: a página é um
   ficheiro parado (no Vercel, por exemplo) e fala directamente com
   a base de dados. Não há servidor para manter nem para pagar.

   Duas coisas que só assim se conseguem:

   · a página abre no topo do browser, sem moldura nenhuma, e por
     isso o telemóvel DÁ a localização. É o que falta na versão do
     Claude e não há maneira de contornar lá dentro.

   · as regras de quem pode escrever o quê vivem dentro da própria
     base de dados. Não é o telemóvel a portar-se bem: é a base a
     recusar. Nem o condutor mais esperto mexe na frota ou reabre um
     turno já fechado. */
function lojaDoSupabase(sb){
  var espelho={}, ouve={}, eu=null, canal=null, semRede=false;
  var canalVivo=false, relogioRede=null, ultimaLeitura=0, aLer=false;
  var tocar=function(c){
    (ouve[c]||[]).forEach(function(f){ try{ f(); }catch(e){} }); };

  /* Uma cópia da frota e de quem eu sou, aqui no telemóvel.
     Na Praia há sítios sem rede. Se o condutor abre a aplicação num
     deles, sem isto ficava preso no ecrã de entrada — e o turno dele
     nunca acontecia. Com isto, escolhe o carro e começa a trabalhar;
     o que escrever fica em fila e sobe quando houver rede.
     Serve só para desenhar os ecrãs: escrever continua a ser a base
     de dados a decidir, e uma cópia falsificada aqui não compra
     nada a ninguém. */
  var COPIA='fleetcv-supa-copia';
  var guardarCopia=function(){
    try{ localStorage.setItem(COPIA, JSON.stringify(
      {eu:eu, frota:espelho.frota||{}, quando:Date.now()})); }catch(e){} };
  var lerCopia=function(){
    try{ return JSON.parse(localStorage.getItem(COPIA)||'null'); }
    catch(e){ return null; } };
  var pousar=function(c,id,d){
    espelho[c]=espelho[c]||{};
    if(d===null) delete espelho[c][id]; else espelho[c][id]=d;
    tocar(c); };

  var erroDe=function(e, estado){
    if(!e) return null;
    var c='invalid_argument';
    if(/rate|429|too many/i.test(e.message||'')) c='resource_exhausted';
    if(/fetch|network|timeout/i.test(e.message||'')) c='unavailable';
    /* A base disse que não (as regras, ou um pedido mal feito)? Só isso
       é recusa. Sem rede (0), sessão caducada (401), demasiados pedidos
       (429) ou o servidor aflito (5xx) passam com o tempo. */
    var recusa = estado>=400 && estado<500 && [401,408,429].indexOf(estado)<0;
    return Object.assign(new Error(e.message||'erro'),
      {code:c, porque:e.message, estado:estado||0, recusa:recusa}); };

  /* O condutor não lê a lista dos condutores — leva os códigos de
     todos, e com eles entrava como qualquer colega. Lê a 'equipa', que
     a base faz sozinha com os nomes e mais nada. Aqui dentro ela passa
     a chamar-se 'condutores', e o resto da aplicação nem sabe. O patrão
     lê a verdadeira e ignora a outra. */
  var comoSeChama=function(c, id){
    if(c!=='frota' || id!=='equipa') return id;
    return (eu && eu.papel==='dono') ? null : 'condutores'; };

  /* Traz tudo de uma vez. Em duas perguntas, e não numa, de propósito:
     a frota são quatro documentos que quase nunca mudam, e os turnos
     são milhares. Numa pergunta só, ordenada pela data, bastavam 600
     turnos mais recentes para empurrar a frota para fora da lista — e
     o condutor abria a aplicação sem carro nenhum para escolher.
     As fotos e os percursos ficam de fora: são pesados e só se vão
     buscar quando alguém os quer ver. */
  /* O condutor só precisa da frota (os carros, os colegas, o preço).
     Antes recebia tudo o que o patrão recebe: a posição de cada colega
     de segundo e meio em segundo e meio, e os 600 turnos da frota de
     minuto a minuto. Com dez carros eram mais de 1 GB de dados móveis
     por turno em cada telemóvel, e as mensagens do tempo real
     multiplicavam-se pelo número de condutores. */
  var soFrota=function(){ return !!(eu && eu.papel && eu.papel!=='dono'); };
  /* Os 600 turnos vêm inteiros ao abrir e de meia em meia hora; pelo
     meio, a rede de segurança só pergunta pelos que mudaram. A folga
     de 15 minutos cobre os telemóveis de relógio adiantado ou atrasado. */
  var marcaTurnos=0, turnosInteiros=0;
  function trazer(doZero){
    if(aLer) return Promise.resolve(false);
    aLer=true;
    var sf=soFrota();
    var inteiros = doZero || !marcaTurnos || Date.now()-turnosInteiros > 30*60000;
    var qT=sb.from('docs').select('coleccao,id,corpo,quando').eq('coleccao','turnos');
    if(!inteiros) qT=qT.gte('quando', new Date(marcaTurnos-15*60000).toISOString());
    return Promise.all([
      sb.from('docs').select('coleccao,id,corpo').in('coleccao', sf?['frota']:['frota','vivo']),
      sf ? Promise.resolve({data:[]}) : qT.order('quando',{ascending:false}).limit(600)
    ]).then(function(rs){
      aLer=false;
      var t=rs[0], u=rs[1];
      if(t.error) throw erroDe(t.error);
      if(u.error) throw erroDe(u.error);
      if(!sf && inteiros) turnosInteiros=Date.now();
      (u.data||[]).forEach(function(x){
        var q=Date.parse(x.quando||''); if(q>marcaTurnos) marcaTurnos=q; });
      /* A frota e os turnos ao vivo vêm inteiros e substituem o que cá
         estava: é assim que um carro que já fechou o turno desaparece
         do mapa mesmo que se tenha perdido o aviso do fecho. Os turnos
         antigos só se juntam, nunca se apagam. */
      if(doZero) espelho={};
      espelho.frota={}; espelho.vivo={};
      (t.data||[]).forEach(function(x){
        var id=comoSeChama(x.coleccao, x.id); if(!id) return;
        (espelho[x.coleccao]=espelho[x.coleccao]||{})[id]=x.corpo; });
      (u.data||[]).forEach(function(x){ (espelho.turnos=espelho.turnos||{})[x.id]=x.corpo; });
      ultimaLeitura=Date.now();
      Object.keys(espelho).forEach(tocar);
      return true;
    }).catch(function(e){ aLer=false; throw e; });
  }

  /* A rede de segurança. O tempo real vive de um WebSocket, e um
     WebSocket cai: rede fraca, um wi-fi de café que bloqueia, o
     telemóvel a mudar de antena. Sem isto, o ecrã do patrão ficava
     congelado para sempre e ninguém dava por nada — que é pior do que
     dizer "não sei", porque ele acredita no que está a ver.
     Com o canal de pé, confere-se de minuto a minuto por desencargo;
     com ele em baixo, de oito em oito segundos, e aí o tempo real
     passa a ser quase-real em vez de nenhum. */
  function vigiarRede(){
    if(relogioRede) return;
    var conferir=function(){
      try{ if(typeof document!=='undefined' && document.hidden) return; }catch(e){}
      var cada = canalVivo ? 60000 : 8000;
      if(Date.now()-ultimaLeitura < cada) return;
      trazer(false).catch(function(){});
    };
    relogioRede=setInterval(conferir, 4000);
    /* voltar ao telemóvel depois de um tempo fora é o momento em que
       mais falta faz estar actualizado */
    try{ document.addEventListener('visibilitychange', function(){
      if(!document.hidden) trazer(false).catch(function(){}); }); }catch(e){}
  }

  return {
    longe:true, supabase:true,
    semRede:function(){ return semRede; },
    canalVivo:function(){ return canalVivo; },

    entrar:function(email, codigo){
      return sb.rpc('entrar', {p_email:email, p_codigo:codigo})
        .then(function(r){
          if(r.error) throw erroDe(r.error);
          if(r.data && r.data.erro) throw Object.assign(new Error(r.data.erro),
            {code:'invalid_argument', porque:r.data.erro});
          eu=r.data; return r.data; }); },
    /* criar conta: uma frota nova, e já lá dentro como dono */
    criarConta:function(d){
      return sb.rpc('criar_frota', {p_nome:d.nome, p_frota_nome:d.frota,
                                    p_email:d.email, p_codigo:d.codigo})
        .then(function(r){
          if(r.error) throw erroDe(r.error);
          if(r.data && r.data.erro) throw Object.assign(new Error(r.data.erro),
            {code:'invalid_argument', porque:r.data.erro});
          eu=r.data; return r.data; }); },
    mudarAcesso:function(actual, email, novo){
      return sb.rpc('mudar_acesso', {p_codigo_actual:actual,
                                     p_email_novo:email||'', p_codigo_novo:novo||''})
        .then(function(r){
          if(r.error) throw erroDe(r.error);
          return r.data||{erro:'Não foi possível mudar.'}; }); },
    apagarConta:function(codigo){
      return sb.rpc('apagar_frota', {p_codigo:codigo}).then(function(r){
        if(r.error) throw erroDe(r.error);
        if(r.data && r.data.ok){ eu=null;
          try{ localStorage.removeItem(COPIA); }catch(e){} }
        return r.data||{erro:'Não foi possível apagar.'}; }); },
    emailLivre:function(email){
      return sb.rpc('email_livre', {p_email:email}).then(function(r){
        return (r && !r.error) ? r.data : null; }); },
    /* o plano e até quando vai a experiência */
    minhaFrota:function(){
      return sb.from('frotas').select('id,nome,plano,ate,criada').maybeSingle()
        .then(function(r){
          var f=(r && !r.error && r.data) ? r.data : null;
          /* o e-mail com que o patrão entra está na conta dele, que só
             ele lê */
          var d=(espelho.frota||{}).dono;
          if(f && d){ f.email=d.email; f.nomeDono=d.nome; }
          return f; }); },
    sair:function(){
      try{ localStorage.removeItem(COPIA); }catch(e){}
      return sb.rpc('sair').then(function(){ eu=null; }); },
    eu:function(){ return eu; },

    /* traz tudo de uma vez e depois fica à escuta */
    comecar:function(){
      return sb.from('perfis').select('papel,quem,nome,frota').maybeSingle()
        .then(function(r){
          if(r && r.error) throw erroDe(r.error);
          eu = (r && r.data) ? {papel:r.data.papel, id:r.data.quem, nome:r.data.nome,
                                frota:r.data.frota} : null;
          if(!eu) return false;
          /* Em duas perguntas, e não numa, de propósito.
             A frota são quatro documentos que quase nunca mudam, e os
             turnos são milhares. Numa pergunta só, ordenada pela data,
             bastavam 600 turnos mais recentes para empurrar a frota
             para fora da lista — e o condutor abria a aplicação sem
             carro nenhum para escolher.
             As fotos e os percursos ficam de fora das duas: são
             pesados e só se vão buscar quando alguém os quer ver. */
          return trazer(true).then(function(){
              /* Pede-se só o que interessa, e por colecção. Sem isto,
                 cada fotografia de 50 kB que um condutor tira ia parar
                 ao telemóvel de toda a gente, sem ninguém a querer ver
                 — e aqui os dados pagam-se. */
              try{
                var chegou=function(m){
                  var apagou=m.eventType==='DELETE';
                  var l=(apagou?m.old:m.new)||{};
                  if(l.coleccao==='fotos'||l.coleccao==='rastos') return;
                  /* Os apagamentos são a excepção às regras de ler: o
                     Supabase manda-os a toda a gente, só com a chave. Sem
                     isto, um condutor "m1" de outra frota a fechar o
                     turno tirava do mapa o nosso "m1". */
                  if(l.frota && eu && eu.frota && l.frota!==eu.frota) return;
                  var id=comoSeChama(l.coleccao, l.id); if(!id) return;
                  var q=Date.parse(l.quando||'');
                  if(l.coleccao==='turnos' && q>marcaTurnos) marcaTurnos=q;
                  pousar(l.coleccao, id, apagou?null:l.corpo); };
                canal = sb.channel('fleetcv');
                (soFrota() ? ['frota'] : ['frota','turnos','vivo']).forEach(function(c){
                  canal.on('postgres_changes',
                    {event:'*', schema:'public', table:'docs',
                     filter:'coleccao=eq.'+c}, chegou); });
                canal.subscribe(function(estadoCanal){
                  canalVivo = (estadoCanal==='SUBSCRIBED'); });
              }catch(e){}
              semRede=false; guardarCopia();
              vigiarRede();
              return true; }); })
        /* Sem rede, mas com uma cópia de quem eu sou e da frota: vai-se
           na mesma. É o contrário do que parece prudente — mas mandar o
           condutor para o ecrã de entrada quando ele só quer começar a
           trabalhar é que era perder o turno. */
        .catch(function(){
          var c=lerCopia();
          if(!c || !c.eu) return false;
          eu=c.eu; espelho={frota:c.frota||{}};
          Object.keys(espelho).forEach(tocar);
          semRede=true;
          return true; }); },

    ler:function(c,id){
      var m=(espelho[c]||{})[id];
      if(m) return Promise.resolve(m);
      return sb.from('docs').select('corpo').eq('coleccao',c).eq('id',id)
        .maybeSingle().then(function(r){ return (r&&r.data)?r.data.corpo:null; })
        .catch(function(){ return null; }); },

    por:function(c,id,v){
      pousar(c,id,v);                       /* mostra já, confirma depois */
      if(c==='frota') guardarCopia();
      var linha={coleccao:c, id:id, corpo:v, quando:new Date().toISOString()};
      /* A base põe a frota de quem escreve se ela faltar; mandá-la é só
         dizer o mesmo às claras. Se não for a nossa, é recusada. */
      if(eu && eu.frota) linha.frota=eu.frota;
      return sb.from('docs').upsert(linha, {onConflict:'frota,coleccao,id'})
        .then(function(r){ if(r.error) throw erroDe(r.error, r.status); }); },

    tirar:function(c,id){
      pousar(c,id,null);
      return sb.from('docs').delete().eq('coleccao',c).eq('id',id)
        .then(function(r){ if(r.error) throw erroDe(r.error); }); },

    verDoc:function(c,id,fn){
      (ouve[c]=ouve[c]||[]).push(function(){ fn((espelho[c]||{})[id]||null); });
      setTimeout(function(){ fn((espelho[c]||{})[id]||null); },0);
      return function(){}; },

    verColeccao:function(c,fn,err,ordem,quantos){
      var dar=function(){
        var v=Object.keys(espelho[c]||{}).map(function(k){ return espelho[c][k]; });
        if(ordem) v.sort(function(a,b){ return (b[ordem]||0)-(a[ordem]||0); });
        fn(quantos?v.slice(0,quantos):v); };
      (ouve[c]=ouve[c]||[]).push(dar);
      setTimeout(dar,0);
      return function(){}; },

    ondeCampo:function(c,campo,valor){
      /* o percurso e as fotos vivem fora do espelho */
      return sb.from('docs').select('corpo').eq('coleccao',c)
        .eq('corpo->>'+campo, valor)
        .then(function(r){
          if(r.error) return [];
          return (r.data||[]).map(function(x){ return x.corpo; }); })
        .catch(function(){ return []; }); },

    licenca:function(){ return Promise.resolve(!!(eu&&eu.papel==='dono')); },

    /* o registo de erros: só se escreve (ver registar, mais abaixo) */
    registar:function(linha){
      return sb.from('erros').insert(linha)
        .then(function(r){ if(r && r.error) throw erroDe(r.error, r.status); }); }
  };
}

/* ─── a loja do servidor ─── */
/* A melhor das três: o condutor abre um endereço no telemóvel dele,
   entra com o e-mail e o código que o patrão lhe deu, e pronto. Não
   precisa de conta em lado nenhum.

   O servidor manda as novidades por uma linha que fica aberta, por
   isso não se anda aqui a perguntar de dois em dois segundos se
   mudou alguma coisa. E é lá que se verifica quem pode escrever o
   quê — aqui num telemóvel isso era só boa vontade. */
function lojaDoServidor(){
  var espelho={}, ouve={}, fonte=null, eu=null;
  var tocar=function(c){
    (ouve[c]||[]).forEach(function(f){ try{ f(); }catch(e){} }); };
  var guardar=function(c,id,d){
    espelho[c]=espelho[c]||{};
    if(d===null) delete espelho[c][id]; else espelho[c][id]=d;
    tocar(c); };

  var pedir=function(rota, corpo){
    return fetch(rota, corpo
      ? {method:'POST', headers:{'content-type':'application/json'},
         body:JSON.stringify(corpo), credentials:'same-origin'}
      : {credentials:'same-origin'})
      .then(function(r){ return r.json().then(function(j){
        if(!r.ok) throw Object.assign(new Error(j.erro||('HTTP '+r.status)),
          {code: r.status===429?'resource_exhausted':'invalid_argument',
           porque:j.erro});
        return j; }); });
  };

  return {
    longe:true, servidor:true,
    entrar:function(email, codigo){
      return pedir('/api/entrar', {email:email, codigo:codigo})
        .then(function(j){ eu=j; return j; }); },
    sair:function(){ return pedir('/api/sair', {}).then(function(){ eu=null; }); },
    eu:function(){ return eu; },

    /* traz tudo de uma vez e depois fica à escuta */
    comecar:function(){
      return pedir('/api/eu').then(function(j){
        eu = j.papel ? j : null;
        if(!eu) return false;
        return pedir('/api/tudo').then(function(t){
          espelho.frota={};
          ['config','carros','condutores','exemplos'].forEach(function(k){
            if(t.frota[k]) espelho.frota[k]=t.frota[k]; });
          espelho.turnos={}; (t.turnos||[]).forEach(function(x){
            espelho.turnos[x.id]=x.d; });
          espelho.vivo={}; (t.vivo||[]).forEach(function(x){
            espelho.vivo[x.id]=x.d; });
          Object.keys(espelho).forEach(tocar);
          try{
            fonte=new EventSource('/api/eventos');
            fonte.onmessage=function(m){
              try{ var x=JSON.parse(m.data); guardar(x.c, x.id, x.d); }catch(e){} };
          }catch(e){}
          return true;
        });
      }).catch(function(){ return false; });
    },

    ler:function(c,id){
      return Promise.resolve((espelho[c]||{})[id] || null); },
    por:function(c,id,v){
      guardar(c,id,v);                        /* mostra já, confirma depois */
      return pedir('/api/doc', {c:c, id:id, d:v}); },
    tirar:function(c,id){
      guardar(c,id,null);
      return pedir('/api/apagar', {c:c, id:id}); },
    verDoc:function(c,id,fn){
      (ouve[c]=ouve[c]||[]).push(function(){ fn((espelho[c]||{})[id]||null); });
      setTimeout(function(){ fn((espelho[c]||{})[id]||null); },0);
      return function(){}; },
    verColeccao:function(c,fn,err,ordem,quantos){
      var dar=function(){
        var v=Object.keys(espelho[c]||{}).map(function(k){ return espelho[c][k]; });
        if(ordem) v.sort(function(a,b){ return (b[ordem]||0)-(a[ordem]||0); });
        fn(quantos?v.slice(0,quantos):v); };
      (ouve[c]=ouve[c]||[]).push(dar);
      setTimeout(dar,0);
      return function(){}; },
    ondeCampo:function(c,campo,valor){
      if(c==='rastos')
        return pedir('/api/rasto/'+encodeURIComponent(valor)).then(function(j){
          return (j.pts&&j.pts.length)?[{turno:valor, parte:0, pts:j.pts}]:[]; });
      return Promise.resolve(Object.keys(espelho[c]||{})
        .map(function(k){ return espelho[c][k]; })
        .filter(function(x){ return x[campo]===valor; })); },
    /* a frota vem já semeada do servidor; os turnos de exemplo
       são o patrão que os traz, e só ele os pode escrever */
    licenca:function(){ return Promise.resolve(!!(eu&&eu.papel==='dono')); }
  };
}

/* ─── a loja de longe ─── */
/* CUIDADO, e foi caro: esta base de dados devolve os documentos
   CONGELADOS. Está escrito no contrato dela — "delivered snapshots
   and their data() are frozen". Quem tentar mudar um campo leva um
   erro e pára a meio, calado.

   Foi exactamente isso que aconteceu: o patrão editava uma viatura,
   o código fazia carro.matricula = ... por cima de um objecto
   congelado, rebentava, e nada era guardado nem havia mensagem
   nenhuma. No servidor não se via, porque lá cada leitura devolve
   objectos novos.

   Por isso tudo o que sai daqui sai copiado. O resto da aplicação
   trabalha com coisas suas, que pode mudar à vontade. */
function _descongelar(o){
  if(o==null) return o;
  try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return o; }
}

function lojaDeLonge(db){
  return {
    longe:true,
    ler:function(c,id){ return db.doc(c+'/'+id).get().then(function(s){
      return s.exists?_descongelar(s.data()):null; }); },
    por:function(c,id,v){ return db.doc(c+'/'+id).set(v); },
    tirar:function(c,id){ return db.doc(c+'/'+id).delete(); },
    verDoc:function(c,id,fn,err){
      return db.doc(c+'/'+id).onSnapshot(function(s){
        fn(s.exists?_descongelar(s.data()):null); }, err); },
    verColeccao:function(c,fn,err,ordem,quantos){
      var q=db.collection(c);
      if(ordem) q=q.orderBy(ordem,'desc');
      if(quantos) q=q.limit(quantos);
      return q.onSnapshot(function(s){
        fn(s.docs.map(function(d){ return _descongelar(d.data()); })); }, err); },
    ondeCampo:function(c,campo,valor){
      return db.collection(c).where(campo,'==',valor).get().then(function(s){
        return s.docs.map(function(d){ return _descongelar(d.data()); }); }); },
    licenca:function(c,id,ms){
      return db.doc(c+'/'+id).acquire({holder:'semeador', ttlMs:ms})
        .then(function(r){ return !!r.acquired; }); }
  };
}

/* ─── a loja de perto ─── */
/* Guarda cada documento numa chave do navegador e avisa os outros
   separadores. O navegador só avisa as OUTRAS janelas, por isso quem
   escreve avisa-se também a si próprio. */
function lojaDePerto(){
  var raiz='fcv:', ouve={}, canal=null;
  try{ canal=new BroadcastChannel('fleetcv'); }catch(e){}
  var chave=function(c,id){ return raiz+c+'/'+id; };
  var lerJson=function(k){
    try{ var r=localStorage.getItem(k); return r?JSON.parse(r):null; }
    catch(e){ return null; } };
  var tocar=function(c){
    (ouve[c]||[]).forEach(function(f){ try{ f(); }catch(e){} }); };
  var avisar=function(c){
    tocar(c);
    try{ if(canal) canal.postMessage(c); }catch(e){} };
  try{ if(canal) canal.onmessage=function(e){ tocar(e.data); }; }catch(e){}
  try{ window.addEventListener('storage', function(e){
    if(e.key&&e.key.indexOf(raiz)===0) tocar(e.key.slice(raiz.length).split('/')[0]);
  }); }catch(e){}

  var todos=function(c){
    var v=[], pre=raiz+c+'/';
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k&&k.indexOf(pre)===0){ var d=lerJson(k); if(d) v.push(d); } }
    }catch(e){}
    return v; };
  var seguir=function(c,fn){
    (ouve[c]=ouve[c]||[]).push(fn);
    setTimeout(fn,0);
    return function(){ ouve[c]=(ouve[c]||[]).filter(function(x){ return x!==fn; }); }; };

  return {
    longe:false,
    ler:function(c,id){ return Promise.resolve(lerJson(chave(c,id))); },
    por:function(c,id,v){
      try{ localStorage.setItem(chave(c,id), JSON.stringify(v)); }
      catch(e){ return Promise.reject({code:'quota_exceeded'}); }
      avisar(c); return Promise.resolve(); },
    tirar:function(c,id){
      try{ localStorage.removeItem(chave(c,id)); }catch(e){}
      avisar(c); return Promise.resolve(); },
    verDoc:function(c,id,fn){
      return seguir(c, function(){ fn(lerJson(chave(c,id))); }); },
    verColeccao:function(c,fn,err,ordem,quantos){
      return seguir(c, function(){
        var v=todos(c);
        if(ordem) v.sort(function(a,b){ return (b[ordem]||0)-(a[ordem]||0); });
        fn(quantos?v.slice(0,quantos):v); }); },
    ondeCampo:function(c,campo,valor){
      return Promise.resolve(todos(c).filter(function(x){ return x[campo]===valor; })); },
    /* num só aparelho não há corrida que valha a pena travar */
    licenca:function(){ return Promise.resolve(true); }
  };
}

/* ─── a frota de estreia ────────────────────────────────── */
var DONO_EXEMPLO={email:'patrao@exemplo.cv', codigo:'9999', nome:'Dona Fátima'};

/* Os dois painéis precisam da mesma, com os mesmos números, senão o
   condutor escolhia um carro que o patrão não tem. Fica aqui, uma
   vez. Assim que o patrão mexer na frota dele, é a dele que manda. */
function frotaNova(){
  return { nome:'Táxis Praia, Lda', precoLitro:145,
    carros:[
      {id:'c1',matricula:'CV-01-AB',marca:'Toyota',modelo:'Corolla',ano:2015,
       deposito:50,km:120000,estado:'ACTIVO',proxOleoKm:125000},
      {id:'c2',matricula:'CV-02-CD',marca:'Nissan',modelo:'Almera',ano:2012,
       deposito:46,km:208400,estado:'ACTIVO',proxOleoKm:210000},
      {id:'c3',matricula:'CV-03-EF',marca:'Hyundai',modelo:'Accent',ano:2017,
       deposito:45,km:64300,estado:'ACTIVO',proxOleoKm:70000}],
    condutores:[
      {id:'m1',nome:'António Semedo',email:'antonio@exemplo.cv',codigo:'1234',
       telefone:'+238 991 10 01',estado:'ACTIVO'},
      {id:'m2',nome:'Jorge Tavares',email:'jorge@exemplo.cv',codigo:'2345',
       telefone:'+238 991 10 02',estado:'ACTIVO'},
      {id:'m3',nome:'Nuno Rocha',email:'nuno@exemplo.cv',codigo:'3456',
       telefone:'+238 991 10 03',estado:'ACTIVO'}] };
}

/* ─── avisar quem está a ver ────────────────────────────── */
function avisar(){
  for(var i=0;i<ouvintes.length;i++){ try{ ouvintes[i](); }catch(e){} } }

/* ─── a gaveta do próprio telemóvel ─────────────────────── */
function local(chave, valor){
  try{
    if(valor===undefined){
      var r=localStorage.getItem('fleetcv-'+chave);
      return r?JSON.parse(r):null; }
    localStorage.setItem('fleetcv-'+chave, JSON.stringify(valor));
  }catch(e){}
  return null;
}

/* ─── arrancar ──────────────────────────────────────────── */
/* op.frotaNova()  · a frota de estreia, se ainda não houver nenhuma
   op.exemplos(f)  · turnos de exemplo, para não abrir um ecrã vazio   */
/* Há Supabase quando alguém deixou as duas chaves ao lado da página
   (ver fleetcv-config.js). É o melhor dos quatro: página no topo do
   browser — logo, GPS a funcionar — e regras dentro da própria base
   de dados. */
function ligarSupabase(papel){
  /* Quem carregou em "só quero experimentar" não fala com a base de
     dados de ninguém. Nem se liga: fica com uma frota de mentira
     guardada no próprio telemóvel, e sai de lá quando quiser. É a
     diferença entre deixar alguém ver o produto e deixar alguém mexer
     na frota de um taxista que está a trabalhar. */
  try{ if(localStorage.getItem('fleetcv-ensaio')) return Promise.resolve(null); }
  catch(e){}
  var c = window.FLEETCV_CONFIG;
  if(!c || !c.supabaseUrl || !c.supabaseChave) return Promise.resolve(null);
  if(!window.supabase || !window.supabase.createClient) return Promise.resolve(null);
  try{
    /* Uma sessão por painel. Com uma só, o patrão que abrisse o painel
       do condutor noutro separador para mostrar a alguém passava a ser
       condutor nos dois — e o dele deixava de conseguir escrever. Assim
       cada painel é como um telemóvel à parte, mesmo no mesmo aparelho. */
    var ref=String(c.supabaseUrl).replace(/^https?:\/\//,'').split('.')[0];
    var chave='fleetcv-sb-'+(papel||'app');
    try{
      /* quem já tinha entrado antes disto não tem de entrar outra vez:
         a sessão antiga passa para o primeiro painel que abrir */
      var velha='sb-'+ref+'-auth-token';
      if(!localStorage.getItem(chave) && localStorage.getItem(velha)){
        localStorage.setItem(chave, localStorage.getItem(velha));
        localStorage.removeItem(velha); }
    }catch(e){}
    var sb = window.supabase.createClient(c.supabaseUrl, c.supabaseChave, {
      auth:{ persistSession:true, autoRefreshToken:true, storageKey:chave } });
    /* Cada telemóvel entra sem conta nenhuma; quem ele é diz-se
       depois, com o email e o código que o patrão deu. */
    return sb.auth.getSession().then(function(s){
      if(s && s.data && s.data.session) return sb;
      return sb.auth.signInAnonymously().then(function(r){
        return (r && r.error) ? null : sb; });
    }).catch(function(){ return null; });
  }catch(e){ return Promise.resolve(null); }
}

/* Só há servidor quando a página vem de um. Aberta como ficheiro, ou
   publicada no Claude, não há — e passa-se aos outros motores. */
function noEnsaio(){
  try{ return !!localStorage.getItem('fleetcv-ensaio'); }catch(e){ return false; }
}
function haServidor(){
  if(noEnsaio()) return Promise.resolve(false);
  if(typeof fetch!=='function') return Promise.resolve(false);
  if(!/^https?:$/.test(location.protocol)) return Promise.resolve(false);
  var corta=new Promise(function(ok){ setTimeout(function(){ ok(false); }, 4000); });
  return Promise.race([
    fetch('/api/ping', {credentials:'same-origin'})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){ return !!(j&&j.fleetcv); })
      .catch(function(){ return false; }),
    corta ]);
}

/* Com a base de dados à vista, começa-se de mãos vazias: a frota de
   exemplo é para quem experimenta, e aparecer um segundo com os carros
   da "Táxis Praia" a quem acabou de criar a sua própria frota era
   confuso. Sem base (aberto como ficheiro, ou no ensaio), fica a de
   exemplo, que é o que se quer ver. */
function frotaVazia(){ return {nome:'', precoLitro:145, carros:[], condutores:[]}; }
function vaiHaverSupabase(){
  var c=window.FLEETCV_CONFIG;
  return !noEnsaio() && !!(c && c.supabaseUrl && c.supabaseChave);
}

function arrancar(op){
  op=op||{}; opGuardado=op;
  D.frota  = local('frota')  || (vaiHaverSupabase() ? frotaVazia() : frotaNova());
  D.turnos = local('turnos') || [];
  fila     = local('fila')   || [];
  avisar();
  var pedido;
  try{ pedido = (!noEnsaio() && window.claude && claude.use) ? claude.use('db')
                                              : Promise.resolve(null); }
  catch(e){ pedido = Promise.resolve(null); }
  var seguir=function(x){
    loja = x ? lojaDeLonge(x) : lojaDePerto();
    if(x){ try{ if(claude.use) claude.use('user').then(function(u){ quem=u; }); }
           catch(e){} }
    return semear(op).then(escutar).then(function(){
      estado = loja.longe ? 'ligada' : 'perto'; avisar(); retomarFila(); });
  };
  /* A ordem é a da qualidade: Supabase, servidor próprio, base do
     Claude, e por fim só este aparelho. Fica o primeiro que houver. */
  ligarSupabase(op.papel).then(function(sb){
    if(sb){
      var ls=lojaDoSupabase(sb); loja=ls; enviarRegistos();
      return ls.comecar().then(function(entrou){
        estado = !entrou ? 'supabase-por-entrar'
               : ls.semRede() ? 'supabase-sem-rede' : 'supabase';
        if(!entrou){ avisar(); return; }
        return semear(op).then(escutar).then(function(){
          avisar(); retomarFila(); });
      });
    }
    return seguirSemSupabase();
  }).catch(function(){
    try{ seguir(null); }catch(e){ estado='sozinha'; avisar(); } });

  function seguirSemSupabase(){
  return haServidor().then(function(sim){
    if(!sim) return pedido.then(seguir);
    var s=lojaDoServidor();
    loja=s;
    return s.comecar().then(function(entrou){
      estado = entrou ? 'servidor' : 'servidor-por-entrar';
      if(!entrou){ avisar(); return; }
      return semear(op).then(escutar).then(function(){ avisar(); retomarFila(); });
    });
  });
  }
}

/* ─── a primeira vez: pôr lá a frota ────────────────────── */
/* Dois telemóveis podem abrir a aplicação ao mesmo tempo na estreia.
   A licença curta garante que só um é que semeia. */
function semear(op){
  return semearFrota().then(function(){ return semearExemplos(op); })
    .catch(function(){});
}

/* A frota tem de existir para o condutor poder escolher um carro.
   Qualquer um dos painéis a pode semear — dá o mesmo resultado, com
   os mesmos números — e a licença curta garante que só um o faz. */
function semearFrota(){
  return loja.ler('frota','config').then(function(s){
    if(s) return;
    return loja.licenca('frota','config',20000).then(function(posso){
      if(!posso) return;
      return loja.ler('frota','config').then(function(s2){
        if(s2) return;
        var f=D.frota||frotaNova();
        return Promise.all([
          loja.por('frota','config',{precoLitro:f.precoLitro,
                                     nome:f.nome||'A minha frota'}),
          loja.por('frota','carros',{lista:f.carros||[]}),
          loja.por('frota','condutores',{lista:f.condutores||[]})]);
      });
    });
  });
}

/* Os turnos de exemplo são outra história, e por isso têm a sua
   própria marca: só o painel do patrão os traz, e se o condutor
   tiver aberto a aplicação primeiro — semeando a frota — o patrão
   ainda assim abre com turnos para ver em vez de um ecrã vazio.
   Uma vez semeados, nunca mais: a partir daí os turnos são os
   verdadeiros. */
function semearExemplos(op){
  if(!op.exemplos) return Promise.resolve();
  return loja.ler('frota','exemplos').then(function(m){
    if(m) return;
    return loja.licenca('frota','exemplos',20000).then(function(posso){
      if(!posso) return;
      return loja.ler('frota','exemplos').then(function(m2){
        if(m2) return;
        return loja.ler('frota','carros').then(function(c){
          var f={ nome:(D.frota||{}).nome, precoLitro:(D.frota||{}).precoLitro,
                  carros:(c&&c.lista)||[], condutores:[] };
          return loja.ler('frota','condutores').then(function(m3){
            f.condutores=(m3&&m3.lista)||[];
            if(!f.carros.length||!f.condutores.length) return;
            return (op.exemplos(f)||[]).reduce(function(pr,t){
              return pr.then(function(){ return gravarTurnoNovo(t); }); },
              Promise.resolve())
              .then(function(){
                return loja.por('frota','exemplos',{quando:Date.now()}); });
          });
        });
      });
    });
  });
}

/* ─── ficar à escuta ────────────────────────────────────── */
function escutar(){
  var erro=function(e){ if(e&&e.code==='revoked'){ estado='sozinha'; avisar(); } };

  var frotaNova=function(mudar){
    var f=D.frota||{};
    var n={nome:f.nome, precoLitro:f.precoLitro,
           carros:f.carros||[], condutores:f.condutores||[]};
    mudar(n); D.frota=n; local('frota', n); avisar(); };

  subs.push(loja.verDoc('frota','config', function(d){
    if(d) frotaNova(function(n){ n.precoLitro=d.precoLitro; n.nome=d.nome; }); },
    erro));

  subs.push(loja.verDoc('frota','carros', function(d){
    if(d) frotaNova(function(n){ n.carros=d.lista||[]; }); }, erro));

  subs.push(loja.verDoc('frota','condutores', function(d){
    if(d) frotaNova(function(n){ n.condutores=d.lista||[]; }); }, erro));

  /* os turnos já fechados: o histórico */
  subs.push(loja.verColeccao('turnos', function(lista){
    var v=lista.filter(function(t){ return t && t.fim; });
    D.turnos=v; local('turnos', v.slice(0,60)); avisar(); },
    erro, 'inicio', 200));

  /* quem está a andar agora, com a posição ao vivo */
  var caudas={};
  subs.push(loja.verColeccao('vivo', function(lista){
    var agora=Date.now(), vistas={};
    /* uma posição com só os pontos novos: cose-se à cauda que já cá
       estava, para o rabicho do carro no mapa não encolher */
    /* (em cópias: o documento que chega pode ser o mesmo que o
       condutor está a mandar, e mexer-lhe estragava o envio) */
    lista=lista.map(function(t){
      if(!t || !t.id) return t;
      t=Object.assign({}, t);
      var velha=caudas[t.id], r=t.rasto||[], desde=t.caudaDesde||0;
      if(t.caudaParcial && velha && desde>=velha.desde){
        var junta=velha.pts.slice(0, desde-velha.desde).concat(r);
        var corte=Math.max(0, junta.length-CAUDA);
        t.rasto=junta.slice(corte); t.caudaDesde=velha.desde+corte;
      }
      delete t.caudaParcial;
      caudas[t.id]={desde:t.caudaDesde||0, pts:t.rasto||[]}; vistas[t.id]=1;
      return t; });
    Object.keys(caudas).forEach(function(k){ if(!vistas[k]) delete caudas[k]; });
    /* Antes deitavam-se fora os turnos calados há mais de dez
       minutos. Era pior do que parecia: um condutor que se esquece de
       fechar, ou a quem morre a bateria, desaparecia do ecrã do
       patrão — e o turno ficava aberto nos dados, invisível, sem
       nunca entrar no histórico. Agora ficam todos, marcados com há
       quanto tempo não dão notícias, e o patrão pode fechá-los. */
    D.vivos=lista.filter(function(t){ return t && !t.fim && t.momento; })
      .map(function(t){
        t.aoVivo=true;
        t.calado=Math.max(0, agora-t.momento);
        t.aSerio=t.calado<=600000;      /* mesmo a andar agora */
        /* parado, o telemóvel manda de 12 em 12 s: 45 s calado já é sem sinal */
        t.semSinal=!!t.fora || t.calado>45000;
        return t; });
    avisar(); }, erro));

  return Promise.resolve();
}

/* ════════════════════════════════════════════════════════
   ESCREVER
   ════════════════════════════════════════════════════════ */
/* O que vai dentro do documento do turno.
   Fora ficam o rasto (milhares de pontos) e as FOTOGRAFIAS. Uma
   fotografia de quadrante, já encolhida, pesa uns 140 kB; um
   documento não leva mais de 256 kB. Três fotos num turno e o
   documento era recusado inteiro — o turno não chegava ao patrão e
   ninguém dava por nada, porque o erro era engolido.
   Agora cada foto é um documento seu e o turno leva só a marca de
   que ela existe. */
function semRasto(t){
  var c={}, fora={rasto:1, todos:1, fotoInicio:1, fotoFim:1};
  for(var k in t) if(!fora[k]) c[k]=t[k];
  c.temFotoInicio=!!t.fotoInicio; c.temFotoFim=!!t.fotoFim;
  c.abast=(t.abast||[]).map(function(a){
    var b={}; for(var j in a) if(j!=='foto') b[j]=a[j];
    b.temFoto=!!(a.foto||a.temFoto); return b; });
  return c;
}

/* ─── as fotografias ─────────────────────────────────────
   Cada uma no seu documento, com o nome do turno lá dentro para se
   saber de quem é. Lêem-se só quando alguém as quer ver. */
/* As fotografias sobem assim que são tiradas (a do quadrante logo ao
   abrir o turno, a do talão logo ao abastecer). Antes subiam só no
   fim: o patrão não via nada durante o turno, e um telemóvel que
   morresse antes de fechar levava as provas com ele. As que já
   subiram não voltam a subir no fim — são dados do condutor. */
var fotosOk = local('fotos-ok') || {};
function guardarFoto(chave, turno, dados){
  if(!loja||!dados) return Promise.resolve();
  if(fotosOk[chave]) return Promise.resolve();
  if(dados.length>300000) return Promise.resolve();
  return naFila('fotos', chave, {chave:chave, turno:turno, dados:dados,
                                 quando:Date.now()});
}
function fotoSubiu(chave){
  fotosOk[chave]=Date.now();
  var ks=Object.keys(fotosOk);
  if(ks.length>120) ks.sort(function(a,b){ return fotosOk[a]-fotosOk[b]; })
    .slice(0, ks.length-120).forEach(function(k){ delete fotosOk[k]; });
  local('fotos-ok', fotosOk);
}
function fotoDe(chave){
  if(!loja) return Promise.resolve(null);
  return loja.ler('fotos', chave).then(function(d){ return d?d.dados:null; })
    .catch(function(){ return null; });
}
function fotosDoTurno(id){
  if(!loja) return Promise.resolve({});
  return loja.ondeCampo('fotos','turno',id).then(function(v){
    var r={}; (v||[]).forEach(function(x){ if(x&&x.dados) r[x.chave]=x.dados; });
    return r; }).catch(function(){ return {}; });
}

/* ─── a fila de espera ───────────────────────────────────
   Na Praia há sítios sem rede, e um condutor não pode ficar à porta
   de um cliente à espera de sinal. Antes, uma escrita que falhava
   era deitada fora sem uma palavra: o turno fechava no telemóvel e
   nunca chegava ao patrão. Agora fica em fila, tenta outra vez, e
   quem está a ver sabe quantas coisas estão por enviar. */
var fila=[], aTentar=false, relogioFila=null;

function naFila(c, id, d){
  /* uma escrita nova ao mesmo sítio substitui a antiga: o que conta
     é o estado final, não o caminho até lá */
  fila = fila.filter(function(x){ return !(x.c===c && x.id===id); });
  fila.push({c:c, id:id, d:d, tentativas:0});
  guardarFila(); avisar();
  if(!relogioFila) relogioFila=setInterval(esvaziarFila, 12000);
  return esvaziarFila();
}
function guardarFila(){
  /* a fila sobrevive a fechar a aplicação: o telemóvel pode ficar
     sem bateria antes de haver rede */
  try{ local('fila', fila.slice(0,60)); }catch(e){}
}
function esvaziarFila(){
  if(!loja || aTentar || !fila.length) return Promise.resolve();
  aTentar=true;
  var x=fila[0];
  return loja.por(x.c, x.id, x.d).then(function(){
    if(x.c==='fotos') fotoSubiu(x.id);
    fila.shift(); guardarFila(); aTentar=false; avisar();
    if(fila.length) return esvaziarFila();
  }).catch(function(e){
    aTentar=false; x.tentativas++;
    /* Antes desistia-se à primeira de tudo o que não parecesse falta de
       rede, e ao fim de 40 tentativas de tudo o resto: uma sessão
       caducada, um 503 do servidor, oito minutos num sítio sem rede, e
       a fotografia do quadrante ia para o lixo. Agora só se desiste do
       que a base RECUSA, e só depois de várias vezes: a recusa pode vir
       de o turno de que a fotografia depende ainda não ter chegado. O
       resto espera o tempo que for preciso. */
    var recusa = !!(e && (e.recusa || e.code==='quota_exceeded'));
    if(recusa) x.recusas=(x.recusas||0)+1;
    if((x.recusas||0)>=8){ fila.shift(); }
    /* o que falha passa para o fim, para não prender o que vem atrás */
    else if(fila.length>1 && (recusa || x.tentativas%5===0)){ fila.push(fila.shift()); }
    guardarFila(); avisar();
    if(recusa && fila.length) setTimeout(esvaziarFila, 1500);
  });
}
function porEnviar(){ return fila.length; }
function retomarFila(){
  if(!fila.length) return;
  if(!relogioFila) relogioFila=setInterval(esvaziarFila, 12000);
  esvaziarFila();
}
/* a rede voltou, ou o condutor voltou à aplicação: tenta-se já */
try{
  window.addEventListener('online', function(){ retomarFila(); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) retomarFila(); });
}catch(e){}

function gravarTurnoNovo(t){
  if(!loja) return Promise.resolve();
  var p=[loja.por('turnos', t.id, semRasto(t))];
  if((t.rasto||[]).length) p.push(gravarRasto(t.id, t.rasto));
  return Promise.all(p).catch(function(){});
}

/* O rasto vai aos pedaços: um documento não leva mais do que cabe, e
   assim uma gravação que falha não leva o turno todo à frente. */
/* Sobe só o pedaço que mudou. Antes subia o percurso TODO de 45 em 45
   segundos, desde o começo do turno: com a aplicação Android (o GPS o
   turno inteiro), às 6 horas era 1 MB de cada vez — mais de 100 MB por
   hora dos dados do condutor. Fica guardado no telemóvel quantos pontos
   cada pedaço já levou, para não recomeçar do zero se a aplicação
   reabrir a meio do turno. */
var subido=null;
function gravarRasto(id, pts){
  if(!loja||!pts||!pts.length) return Promise.resolve();
  if(!subido) subido=local('rasto-subido')||{};
  if(subido.turno!==id) subido={turno:id, partes:{}};
  var novas=[];
  for(var i=0, n=0; i<pts.length; i+=PARTE_MAX, n++){
    var tam=Math.min(PARTE_MAX, pts.length-i);
    if(subido.partes[n]===tam) continue;
    subido.partes[n]=tam;
    novas.push({n:n, pts:pts.slice(i, i+tam)});
  }
  if(!novas.length) return Promise.resolve();
  local('rasto-subido', subido);
  return novas.reduce(function(p, x){
    return p.then(function(){
      return naFila('rastos', id+'_'+x.n, {turno:id, parte:x.n, pts:x.pts});
    });
  }, Promise.resolve()).catch(function(){});
}

/* Ler o rasto todo de um turno — só quando alguém abre o mapa dele. */
function rastoDe(id){
  if(cacheRasto[id]) return Promise.resolve(cacheRasto[id]);
  if(!loja) return Promise.resolve(null);
  return loja.ondeCampo('rastos','turno',id).then(function(ds){
    var partes=[];
    ds.forEach(function(x){ partes[x.parte]=x.pts||[]; });
    var todos=[];
    for(var i=0;i<partes.length;i++) if(partes[i]) todos=todos.concat(partes[i]);
    cacheRasto[id]=todos;
    return todos;
  }).catch(function(){ return null; });
}

/* ─── a posição ao vivo ─────────────────────────────────── */
/* Chamada a cada ponto de GPS, mas só sobe de 4 em 4 segundos e só se
   o carro mexeu. É este travão que faz caber um dia de trabalho. */
var pendente=null, relogioVivo=null, ultimaSubida=0, aEscrever=false;
var caudaInteira=0, enviados=0, turnoDaCauda=null;
var ondeUltima=null, mexeu=true;

function posicao(t, extra, jaa){
  if(!t||!t.id) return;
  var u=(t.rasto||[])[(t.rasto||[]).length-1], a=extra&&extra.agora;
  pendente = {
    id:t.id, carroId:t.carroId, matricula:t.matricula, condutor:t.condutor,
    condutorId:t.condutorId||null, inicio:t.inicio, fim:null,
    kmInicio:t.kmInicio, totalCve:t.totalCve||0,
    /* sem o preço e o depósito, o patrão via "2.000 CVE · 0,00 litros"
       e as contas do turno ao vivo davam alertas sem sentido */
    precoLitro:t.precoLitro||null, deposito:t.deposito||null,
    abast:(t.abast||[]).map(function(a){
      return {hora:a.hora, valor:a.valor, posto:a.posto, lat:a.lat, lon:a.lon,
              litrosTalao:a.litrosTalao||null, temFoto:!!a.foto||!!a.temFoto,
              chaveFoto:a.chaveFoto||null}; }),
    temFotoInicio: !!t.fotoInicio || !!t.temFotoInicio,
    kmLidoInicio: t.kmLidoInicio||null,
    /* o telemóvel pára a página quando o ecrã apaga ou se abre outra
       aplicação: o patrão tem de saber que é isso, e não o carro parado */
    fora: !!t.foraDesde, foraDesde: t.foraDesde||null, pausas: t.pausas||[],
    /* onde está agora: o último ponto do GPS, mesmo que não tenha ficado
       no percurso (parado, só se guarda um de 30 em 30 s) */
    lat:a?a[0]:(u?u[0]:null), lon:a?a[1]:(u?u[1]:null),
    precisao:a?a[2]:(u?u[3]:null), vel:a?a[3]:(u?u[4]:0),
    kmGps: extra&&extra.kmGps!=null ? +extra.kmGps.toFixed(2) : null,
    bateria: extra?extra.bateria:null,
    onde: extra?extra.onde:null,
    simulado: !!t.simulado,
    rasto:(t.rasto||[]).slice(-CAUDA),
    /* onde começa a cauda no caminho todo: é por aqui que o patrão cose
       os pedaços (a hora dos pontos não serve — no ensaio misturam-se) */
    caudaDesde: Math.max(0, (t.rasto||[]).length-CAUDA),
    nPontos: (t.rasto||[]).length,
    momento: Date.now()
  };
  /* andou mais de uns treze metros, ou vai com velocidade? então é um
     carro a mexer-se e vale a pena contá-lo já (parado, o GPS dança uns
     metros para cá e para lá, e isso não é andar) */
  mexeu = !ondeUltima || pendente.lat==null
       || Math.abs(pendente.lat-ondeUltima[0])>0.00012
       || Math.abs(pendente.lon-ondeUltima[1])>0.00012
       || (pendente.vel||0) > 3;
  if(!relogioVivo) relogioVivo=setInterval(subir, 500);
  subir(jaa);
}

function subir(jaa){
  if(!loja||!pendente||aEscrever) return;
  var agora=Date.now();
  /* o relógio do telemóvel andou para trás (acerto da hora pela rede):
     sem isto, as posições deixavam de subir até ele lá voltar */
  if(ultimaSubida>agora) ultimaSubida=0;
  var espera = mexeu ? ritmo : Math.max(ritmo, RITMO_PARADO);
  if(!jaa && agora-ultimaSubida < espera) return;
  var p=pendente; pendente=null; ultimaSubida=agora; aEscrever=true;
  if(p.lat!=null) ondeUltima=[p.lat, p.lon];
  var r=p.rasto||[], n=p.nPontos||0;
  if(r.length && turnoDaCauda===p.id && enviados>0 && enviados<=n
     && agora-caudaInteira<CAUDA_CHEIA){
    /* só os pontos que o patrão ainda não tem (e um de sobra, para coser) */
    var k=Math.min(r.length, n-enviados+1);
    p=Object.assign({}, p, {rasto:r.slice(r.length-k), caudaDesde:n-k, caudaParcial:true});
  } else { caudaInteira=agora; turnoDaCauda=p.id; }
  var antes=enviados; enviados=n;
  loja.por('vivo', p.id, p).then(function(){
    aEscrever=false;
    if(ritmo>RITMO_VIVO) ritmo=Math.max(RITMO_VIVO, ritmo-2000);
  }).catch(function(e){
    aEscrever=false;
    /* não chegou: a próxima leva a cauda inteira, para não ficar buraco */
    enviados=antes; caudaInteira=0;
    /* a nuvem queixou-se do ritmo: abrandar em vez de insistir */
    if(e&&e.code==='resource_exhausted') ritmo=Math.min(TECTO_VIVO, ritmo*2);
  });
}

/* ─── abrir, ir gravando, e fechar ──────────────────────── */
var relogioRasto=null;

function abrirTurno(t){
  if(!loja) return Promise.resolve();
  return naFila('turnos', t.id, semRasto(t));
}

function guardandoRasto(dar){
  if(relogioRasto) clearInterval(relogioRasto);
  relogioRasto=setInterval(function(){
    var t=dar(); if(!t||!t.id||!(t.rasto||[]).length) return;
    gravarRasto(t.id, t.rasto);
  }, RITMO_RASTO);
}

function fecharTurno(t){
  pendente=null;
  if(relogioRasto){ clearInterval(relogioRasto); relogioRasto=null; }
  if(relogioVivo){ clearInterval(relogioVivo); relogioVivo=null; }
  if(!loja) return Promise.resolve();
  cacheRasto[t.id]=(t.rasto||[]).slice();
  return gravarRasto(t.id, t.rasto)
    .then(function(){
      /* as fotos são a prova: cada uma vai no seu sítio */
      var ps=[];
      if(t.fotoInicio) ps.push(guardarFoto(t.id+'_inicio', t.id, t.fotoInicio));
      if(t.fotoFim)    ps.push(guardarFoto(t.id+'_fim',    t.id, t.fotoFim));
      (t.abast||[]).forEach(function(a,i){
        if(a.foto) ps.push(guardarFoto(a.chaveFoto||(t.id+'_ab'+i), t.id, a.foto)); });
      return Promise.all(ps); })
    .then(function(){ return naFila('turnos', t.id, semRasto(t)); })
    .then(function(){ return loja.tirar('vivo', t.id); })
    .catch(function(){});
}

/* ─── o patrão a mexer na frota e a responder aos alertas ─ */
function guardarFrota(f){
  /* As listas copiam-se ANTES de escrever. Gravar avisa quem está à
     escuta, e esse aviso volta aqui a substituir as listas — se se
     escrevesse directamente de f, a segunda gravação já ia com a
     lista velha que o aviso acabou de lá pôr, e a alteração
     perdia-se sem dar erro nenhum. */
  var cfg={precoLitro:f.precoLitro, nome:f.nome||''};
  var carros=(f.carros||[]).slice();
  var conds=(f.condutores||[]).slice();
  D.frota={nome:cfg.nome, precoLitro:cfg.precoLitro,
           carros:carros, condutores:conds};
  local('frota', D.frota);
  if(!loja) return Promise.resolve();
  return Promise.all([
    loja.por('frota','config',cfg),
    loja.por('frota','carros',{lista:carros}),
    loja.por('frota','condutores',{lista:conds})
  ]).catch(function(){});
}
function guardarTurno(t){
  if(!loja) return Promise.resolve();
  return naFila('turnos', t.id, semRasto(t));
}
function apagarTurno(id){
  if(!loja) return Promise.resolve();
  return loja.tirar('turnos', id).catch(function(){});
}

/* ─── o registo de erros ────────────────────────────────── */
/* O que corre mal nos telemóveis chega à base (tabela erros): o GPS
   que pára com o ecrã apagado, uma licença recusada, um erro da página.
   No teste de 02/10 só se soube o que aconteceu indo aos registos do
   servidor; agora fica escrito, com a hora, o telemóvel e a versão.
   Cada mensagem igual vai uma vez por sessão, e no máximo 40 por
   sessão — um erro em ciclo não gasta os dados do condutor. Se a base
   ainda não tiver a tabela, cala-se até à próxima sessão. */
var porRegistar=[], registados=0, jaVistos={}, semRegisto=false;
function versaoSite(){
  try{ var s=document.querySelector('script[src*="?v="]');
    return s ? (s.getAttribute('src').split('?v=')[1]||'').slice(0,20) : ''; }catch(e){ return ''; }
}
function registar(tipo, onde, mensagem, detalhe){
  if(semRegisto || registados>=40) return;
  mensagem=String(mensagem==null?'':mensagem).slice(0,500);
  var chave=tipo+'|'+onde+'|'+mensagem;
  if(jaVistos[chave]) return; jaVistos[chave]=1; registados++;
  var d={}; try{ d=JSON.parse(JSON.stringify(detalhe||{})); }catch(e){}
  try{ d.pagina=location.hash||''; d.escondida=!!document.hidden; }catch(e){}
  porRegistar.push({tipo:tipo, onde:String(onde).slice(0,60), mensagem:mensagem, detalhe:d,
    ua:String((typeof navigator!=='undefined'&&navigator.userAgent)||'').slice(0,300),
    versao:versaoSite()});
  if(porRegistar.length>20) porRegistar.shift();
  enviarRegistos();
}
function enviarRegistos(){
  if(!loja || !loja.registar || !porRegistar.length) return;
  var l=porRegistar.shift();
  loja.registar(l).then(enviarRegistos).catch(function(e){
    /* a tabela ainda não existe (ou não deixa): não se insiste */
    if(e && e.recusa) semRegisto=true; else porRegistar.unshift(l); });
}
try{
  window.addEventListener('error', function(ev){
    var m=(ev && ev.message)||'';
    if(!m || m==='Script error.') return;          /* de fora da página: não se sabe nada */
    registar('erro', 'pagina', m, {onde:(ev.filename||'').split('/').pop()+':'+(ev.lineno||0)});
  });
  window.addEventListener('unhandledrejection', function(ev){
    var r=ev && ev.reason; var m=(r && (r.message||r.toString&&r.toString()))||'';
    if(m) registar('erro', 'promessa', m);
  });
}catch(e){}

/* ════════════════════════════════════════════════════════ */
return {
  arrancar:arrancar,
  registar:registar,
  aoMudar:function(f){ ouvintes.push(f); },
  estado:function(){ return estado; },
  ensaio:noEnsaio,
  dados:function(){ return D; },
  podeEscrever:function(){
    if(!quem||!quem.can) return null;
    try{ return quem.can('data.write'); }catch(e){ return null; } },
  abrirTurno:abrirTurno,
  guardandoRasto:guardandoRasto,
  posicao:posicao,
  fecharTurno:fecharTurno,
  guardarFrota:guardarFrota,
  guardarTurno:guardarTurno,
  /* o patrão a fechar um turno que o condutor deixou aberto: tira-o
     do mapa ao vivo sem lhe tocar no percurso */
  fecharTurnoDeOutro:function(id){
    if(!loja) return Promise.resolve();
    return loja.tirar('vivo', id).catch(function(){}); },
  gravarTurnoNovo:gravarTurnoNovo,
  apagarTurno:apagarTurno,
  rastoDe:rastoDe,
  fotoDe:fotoDe,
  fotosDoTurno:fotosDoTurno,
  /* uma fotografia que sobe já (entra na fila, atrás do turno) */
  enviarFoto:function(chave, turno, dados){
    return guardarFoto(chave, turno, dados).catch(function(){}); },
  porEnviar:porEnviar,
  tentarAgora:esvaziarFila,
  local:local,
  frotaNova:frotaNova,
  /* Entrar. Com servidor é ele que confere o código e devolve quem é —
     e só ele conhece os códigos todos. Sem servidor, confere-se com a
     lista da frota, como até aqui. */
  temServidor:function(){ return !!(loja&&(loja.servidor||loja.supabase)); },
  entrar:function(email, codigo){
    var e=String(email||'').trim().toLowerCase(), c=String(codigo||'').trim();
    if(loja&&loja.supabase)
      return loja.entrar(e,c).then(function(j){
        return loja.comecar().then(function(){
          return semear(opGuardado).then(escutar).then(function(){
            estado='supabase'; avisar();
            return {papel:j.papel, id:j.id, nome:j.nome}; }); });
      }).catch(function(x){
        return {erro: x.porque || 'Não foi possível entrar.'}; });
    if(loja&&loja.servidor)
      return loja.entrar(e,c).then(function(j){
        return loja.comecar().then(function(){
          return semear(opGuardado).then(escutar).then(function(){
            estado='servidor'; avisar();
            return {papel:j.papel, id:j.id, nome:j.nome}; }); });
      }).catch(function(x){
        return {erro: x.porque || 'Não foi possível entrar.'}; });
    return Promise.resolve(entrarCaDentro(e,c));
  },
  sair:function(){
    if(loja&&(loja.servidor||loja.supabase)){
      /* o que ficou guardado era desta conta; a próxima que entrar
         neste telemóvel não tem de o ver, nem por um segundo */
      try{ localStorage.removeItem('fleetcv-frota');
           localStorage.removeItem('fleetcv-turnos'); }catch(e){}
      D.frota=frotaVazia(); D.turnos=[]; D.vivos=[]; avisar();
      return loja.sair().catch(function(){});
    }
    return Promise.resolve();
  },
  /* Criar conta de proprietário. Só há contas com o Supabase: sem ele
     não há onde as guardar, e diz-se isso em vez de fingir. */
  podeCriarConta:function(){ return !!(loja&&loja.supabase); },
  criarConta:function(d){
    if(!(loja&&loja.supabase))
      return Promise.resolve({erro:'Para criar conta é preciso estar ligado à internet.'});
    return loja.criarConta(d).then(function(j){
      return loja.comecar().then(function(){
        return semear(opGuardado).then(escutar).then(function(){
          estado='supabase'; avisar();
          return {papel:j.papel, id:j.id, nome:j.nome, frota:j.frota}; }); });
    }).catch(function(x){
      return {erro: x.porque || 'Não foi possível criar a conta.'}; });
  },
  mudarAcesso:function(actual, email, novo){
    if(!(loja&&loja.supabase))
      return Promise.resolve({erro:'Isto só se muda com a internet ligada.'});
    return loja.mudarAcesso(actual, email, novo).catch(function(x){
      return {erro: (x&&x.porque) || 'Não foi possível mudar.'}; });
  },
  apagarConta:function(codigo){
    if(!(loja&&loja.supabase))
      return Promise.resolve({erro:'Isto só se faz com a internet ligada.'});
    return loja.apagarConta(codigo).then(function(r){
      if(r && r.ok){
        try{ localStorage.removeItem('fleetcv-frota');
             localStorage.removeItem('fleetcv-turnos'); }catch(e){}
        D.frota=frotaVazia(); D.turnos=[]; D.vivos=[];
        estado='supabase-por-entrar'; avisar(); }
      return r;
    }).catch(function(x){ return {erro:(x&&x.porque)||'Não foi possível apagar.'}; });
  },
  /* true: pode usar · false: já está noutra frota · null: não se sabe */
  emailLivre:function(email){
    if(!(loja&&loja.supabase)) return Promise.resolve(true);
    return loja.emailLivre(email).catch(function(){ return null; });
  },
  minhaFrota:function(){
    if(!(loja&&loja.supabase)) return Promise.resolve(null);
    return loja.minhaFrota().catch(function(){ return null; });
  }
};

/* Sem servidor: a lista da frota é o que há. Serve para experimentar;
   não é segurança nenhuma, e por isso o servidor existe. */
function entrarCaDentro(email, codigo){
  var f=D.frota||{};
  var m=(f.condutores||[]).filter(function(x){
    return String(x.email||'').toLowerCase()===email
        && String(x.codigo||'')===codigo; })[0];
  if(m&&m.estado!=='INACTIVO')
    return {papel:'condutor', id:m.id, nome:m.nome};
  if(email===DONO_EXEMPLO.email && codigo===DONO_EXEMPLO.codigo)
    return {papel:'dono', id:'dono', nome:DONO_EXEMPLO.nome};
  return {erro:'E-mail ou código errados.'};
}
})();
