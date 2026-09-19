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

var RITMO_VIVO  = 4000;    /* de quanto em quanto tempo sobe a posição   */
var RITMO_RASTO = 45000;   /* de quanto em quanto tempo se grava o rasto */
var CAUDA       = 160;     /* pontos que viajam com a posição, para o
                              patrão ver logo o rabicho do carro         */
var PARTE_MAX   = 800;     /* pontos por pedaço de rasto gravado         */
var TECTO_VIVO  = 40000;   /* se a nuvem se queixar, abranda até aqui    */

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
function lojaDeLonge(db){
  return {
    longe:true,
    ler:function(c,id){ return db.doc(c+'/'+id).get().then(function(s){
      return s.exists?s.data():null; }); },
    por:function(c,id,v){ return db.doc(c+'/'+id).set(v); },
    tirar:function(c,id){ return db.doc(c+'/'+id).delete(); },
    verDoc:function(c,id,fn,err){
      return db.doc(c+'/'+id).onSnapshot(function(s){
        fn(s.exists?s.data():null); }, err); },
    verColeccao:function(c,fn,err,ordem,quantos){
      var q=db.collection(c);
      if(ordem) q=q.orderBy(ordem,'desc');
      if(quantos) q=q.limit(quantos);
      return q.onSnapshot(function(s){
        fn(s.docs.map(function(d){ return d.data(); })); }, err); },
    ondeCampo:function(c,campo,valor){
      return db.collection(c).where(campo,'==',valor).get().then(function(s){
        return s.docs.map(function(d){ return d.data(); }); }); },
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
/* Só há servidor quando a página vem de um. Aberta como ficheiro, ou
   publicada no Claude, não há — e passa-se aos outros motores. */
function haServidor(){
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

function arrancar(op){
  op=op||{}; opGuardado=op;
  D.frota  = local('frota')  || frotaNova();
  D.turnos = local('turnos') || [];
  avisar();
  var pedido;
  try{ pedido = (window.claude && claude.use) ? claude.use('db')
                                              : Promise.resolve(null); }
  catch(e){ pedido = Promise.resolve(null); }
  var seguir=function(x){
    loja = x ? lojaDeLonge(x) : lojaDePerto();
    if(x){ try{ if(claude.use) claude.use('user').then(function(u){ quem=u; }); }
           catch(e){} }
    return semear(op).then(escutar).then(function(){
      estado = loja.longe ? 'ligada' : 'perto'; avisar(); });
  };
  /* Primeiro pergunta-se se há servidor. Havendo, é ele — é o único
     dos três em que o condutor entra com o código do patrão e não
     precisa de conta em mais lado nenhum. */
  haServidor().then(function(sim){
    if(!sim) return pedido.then(seguir);
    var s=lojaDoServidor();
    loja=s;
    return s.comecar().then(function(entrou){
      estado = entrou ? 'servidor' : 'servidor-por-entrar';
      if(!entrou){ avisar(); return; }
      return semear(op).then(escutar).then(avisar);
    });
  }).catch(function(){
    try{ seguir(null); }catch(e){ estado='sozinha'; avisar(); } });
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
  subs.push(loja.verColeccao('vivo', function(lista){
    var agora=Date.now();
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
        return t; });
    avisar(); }, erro));

  return Promise.resolve();
}

/* ════════════════════════════════════════════════════════
   ESCREVER
   ════════════════════════════════════════════════════════ */
function semRasto(t){
  var c={}; for(var k in t) if(k!=='rasto'&&k!=='todos') c[k]=t[k];
  return c;
}

function gravarTurnoNovo(t){
  if(!loja) return Promise.resolve();
  var p=[loja.por('turnos', t.id, semRasto(t))];
  if((t.rasto||[]).length) p.push(gravarRasto(t.id, t.rasto));
  return Promise.all(p).catch(function(){});
}

/* O rasto vai aos pedaços: um documento não leva mais do que cabe, e
   assim uma gravação que falha não leva o turno todo à frente. */
function gravarRasto(id, pts){
  if(!loja||!pts||!pts.length) return Promise.resolve();
  var partes=[];
  for(var i=0;i<pts.length;i+=PARTE_MAX)
    partes.push(pts.slice(i, i+PARTE_MAX));
  return partes.reduce(function(p, pedaco, n){
    return p.then(function(){
      return loja.por('rastos', id+'_'+n, {turno:id, parte:n, pts:pedaco});
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

function posicao(t, extra, jaa){
  if(!t||!t.id) return;
  var u=(t.rasto||[])[(t.rasto||[]).length-1];
  pendente = {
    id:t.id, carroId:t.carroId, matricula:t.matricula, condutor:t.condutor,
    condutorId:t.condutorId||null, inicio:t.inicio, fim:null,
    kmInicio:t.kmInicio, totalCve:t.totalCve||0,
    abast:(t.abast||[]).map(function(a){
      return {hora:a.hora, valor:a.valor, posto:a.posto, lat:a.lat, lon:a.lon,
              litrosTalao:a.litrosTalao||null, temFoto:!!a.foto||!!a.temFoto}; }),
    lat:u?u[0]:null, lon:u?u[1]:null, precisao:u?u[3]:null, vel:u?u[4]:0,
    kmGps: extra&&extra.kmGps!=null ? +extra.kmGps.toFixed(2) : null,
    bateria: extra?extra.bateria:null,
    onde: extra?extra.onde:null,
    simulado: !!t.simulado,
    rasto:(t.rasto||[]).slice(-CAUDA),
    momento: Date.now()
  };
  if(!relogioVivo) relogioVivo=setInterval(subir, 1000);
  subir(jaa);
}

function subir(jaa){
  if(!loja||!pendente||aEscrever) return;
  var agora=Date.now();
  if(!jaa && agora-ultimaSubida < ritmo) return;
  var p=pendente; pendente=null; ultimaSubida=agora; aEscrever=true;
  loja.por('vivo', p.id, p).then(function(){
    aEscrever=false;
    if(ritmo>RITMO_VIVO) ritmo=Math.max(RITMO_VIVO, ritmo-4000);
  }).catch(function(e){
    aEscrever=false;
    /* a nuvem queixou-se do ritmo: abrandar em vez de insistir */
    if(e&&e.code==='resource_exhausted') ritmo=Math.min(TECTO_VIVO, ritmo*2);
  });
}

/* ─── abrir, ir gravando, e fechar ──────────────────────── */
var relogioRasto=null;

function abrirTurno(t){
  if(!loja) return Promise.resolve();
  return loja.por('turnos', t.id, semRasto(t)).catch(function(){});
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
    .then(function(){ return loja.por('turnos', t.id, semRasto(t)); })
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
  return loja.por('turnos', t.id, semRasto(t)).catch(function(){});
}
function apagarTurno(id){
  if(!loja) return Promise.resolve();
  return loja.tirar('turnos', id).catch(function(){});
}

/* ════════════════════════════════════════════════════════ */
return {
  arrancar:arrancar,
  aoMudar:function(f){ ouvintes.push(f); },
  estado:function(){ return estado; },
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
  local:local,
  frotaNova:frotaNova,
  /* Entrar. Com servidor é ele que confere o código e devolve quem é —
     e só ele conhece os códigos todos. Sem servidor, confere-se com a
     lista da frota, como até aqui. */
  temServidor:function(){ return !!(loja&&loja.servidor); },
  entrar:function(email, codigo){
    var e=String(email||'').trim().toLowerCase(), c=String(codigo||'').trim();
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
    if(loja&&loja.servidor) return loja.sair().catch(function(){});
    return Promise.resolve();
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
