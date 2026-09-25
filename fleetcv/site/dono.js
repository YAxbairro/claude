function appDono(){

"use strict";

/* ════════════════════════════════════════════════════════════
   FleetCV — painel do proprietário
   Tudo ligado a tudo: de qualquer sítio se chega ao turno, e do
   turno volta-se ao condutor e à viatura.
   ════════════════════════════════════════════════════════════ */

var LIM={gapKm:3, kmMax:500, divAviso:15, divCritica:25, semSinalS:900,
         precisaoMax:50, velMax:180, divLitros:3, raioPosto:150, paragemMin:120};
var PENAL={A04:50,A06:40,A19:30,A15:30,A16:30,A14:30,A13:25,A12:25,A17:20,
           A08:15,A09:15,A11:10,A20:10,A21:5,A07:5,A03:5};
var DONO={email:'patrao@exemplo.cv', codigo:'9999', nome:'Dona Fátima'};
/* Os postos são os verdadeiros do OpenStreetMap (ver mapa_praia). */
var POSTOS=MAPA_PRAIA.postos;

var S={ ecra:'entrar', voltarPara:null, frota:null, turnos:[], sessao:false,
        sel:null, r:{}, aviso:null, replay:null, vivos:[], cartao:null,
        filtro:null, codigoNovo:'', lupa:null };
var tic=null, cronoReplay=null;

/* ─── utilitários ────────────────────────────────────────── */
function nf(v,d){ d=d||0; var p=Math.abs(Number(v)||0).toFixed(d).split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return (Number(v)<0?'−':'')+p.join(','); }
function hh(ms){ var d=new Date(ms);
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function hms(s){ s=Math.max(0,Math.floor(s));
  return String(Math.floor(s/3600)).padStart(2,'0')+':'+
    String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function dt(ms){ var d=new Date(ms), a=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  m=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return a[d.getDay()]+' '+d.getDate()+' '+m[d.getMonth()]; }
function mesDe(ms){ var d=new Date(ms), m=['Janeiro','Fevereiro','Março','Abril','Maio',
  'Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return m[d.getMonth()]+' de '+d.getFullYear(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function uid(p){ return (p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function el(id){ return document.getElementById(id); }
function dist(a,b,c,d){ var R=6371000,g=Math.PI/180;
  return 2*R*Math.asin(Math.sqrt(Math.pow(Math.sin((c-a)*g/2),2)+
    Math.cos(a*g)*Math.cos(c*g)*Math.pow(Math.sin((d-b)*g/2),2))); }
function kmRasto(p){ var m=0,a=null;
  for(var i=0;i<(p||[]).length;i++){ var x=p[i];
    if(x[3]!=null&&x[3]>LIM.precisaoMax) continue;
    if(a){ var s=(x[2]-a[2])/1000, d=dist(a[0],a[1],x[0],x[1]);
      if(s>0&&(d/s)*3.6<=LIM.velMax) m+=d; } a=x; }
  return m/1000; }
function maiorFalha(p){ var mx=0;
  for(var i=1;i<(p||[]).length;i++) mx=Math.max(mx,(p[i][2]-p[i-1][2])/1000);
  return mx; }
function kmDoTurno(t){
  return t.kmGps!=null ? t.kmGps : kmRasto(t.rasto); }
/* ─── a matrícula ─────────────────────────────────────────
   Escreve-se como está na chapa, e fica como foi escrita. Em Cabo
   Verde a chapa muda com a ilha e com a idade do carro — ST-28-ED,
   28-ED-ST, CVS-1234, SV, SA — e quem tem o carro à frente sabe
   melhor do que esta aplicação qual é a forma certa. Por isso não
   se corrige nem se recusa nada; o exemplo no campo é só para
   mostrar o género. */
function verMatricula(t, ignorar){
  var s=String(t||'').trim();
  if(!s) return {ok:''};
  var igual=function(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); };
  var repetida=(S.frota.carros||[]).filter(function(c){
    return c.id!==ignorar && igual(c.matricula)===igual(s) && igual(s); })[0];
  if(repetida) return {erro:'Já existe uma viatura com esta matrícula.'};
  return {ok:s};
}

/* O aviso tanto pode ser uma frase solta como uma frase ligada a um
   campo. Isto trata dos dois, e marca o campo em falta a vermelho —
   num telemóvel, um erro escrito lá em cima e o campo lá em baixo
   não se veem ao mesmo tempo. */
function caixaAviso(){
  if(!S.aviso) return '';
  var t = typeof S.aviso==='string' ? S.aviso : (S.aviso.d||'');
  if(!t) return '';
  var mau = typeof S.aviso==='object' && S.aviso.campo;
  return '<div class="cartao '+(mau?'mau':'aviso')+'"><p class="p-nota">'+
    esc(t)+'</p></div>';
}
function marcado(id){
  return (S.aviso && typeof S.aviso==='object' && S.aviso.campo===id)
    ? ' class="erro"' : ''; }

/* Uma frota acabada de criar está vazia, e um ecrã vazio não diz o
   que fazer a seguir. Isto diz: três passos, e cada um leva lá. Some
   sozinho quando já há carro e condutor. */
function primeirosPassos(){
  var f=S.frota||{carros:[],condutores:[]};
  var temCarro=(f.carros||[]).length>0, temCond=(f.condutores||[]).length>0;
  if(temCarro && temCond) return '';
  var passo=function(feito, n, t, d, acc){
    return '<div class="passo'+(feito?' feito':'')+'"><span class="n">'+
      (feito?'\u2713':n)+'</span><span style="flex:1"><b>'+t+'</b><br>'+
      '<span class="s">'+d+'</span></span>'+
      (feito||!acc?'':'<button class="bt pri pq" data-f="'+acc+'">Juntar</button>')+'</div>'; };
  return '<div class="cartao passos"><h2>Bem-vindo à sua frota</h2>'+
    '<p class="p-nota" style="margin:4px 0 10px">Três passos e fica a ver os '+
    'seus carros a andar.</p>'+
    passo(temCarro,1,'Junte o primeiro carro','A matrícula e os quilómetros de hoje.',
          'passo-carro')+
    passo(temCond,2,'Junte um condutor','O nome, o e-mail e o telefone. '+
          'O código é a aplicação que inventa.','passo-cond')+
    passo(false,3,'Mande-lhe o acesso','Na ficha dele há um botão que manda '+
          'tudo pelo WhatsApp: o endereço, o e-mail e o código.',null)+
    '</div>';
}

/* Até quando vai a experiência. Só se mostra quando falta pouco — a
   frota do fundador e os planos pagos não têm prazo. */
function avisoDoPlano(){
  var c=S.conta;
  if(!c || c.plano!=='ensaio' || !c.ate) return '';
  var dias=Math.ceil((new Date(c.ate).getTime()-Date.now())/864e5);
  if(dias>7) return '';
  return '<div class="cartao '+(dias<=0?'mau':'aviso')+'"><p class="p-nota">'+
    (dias<=0 ? '<b>A experiência grátis acabou.</b> ' :
     '<b>Faltam '+dias+(dias===1?' dia':' dias')+' de experiência grátis.</b> ')+
    'Para continuar, fale connosco pelo WhatsApp: <b>+238 955 78 82</b>.'+
    '</p></div>';
}

/* O texto que o patrão manda ao condutor, e o endereço que o abre já
   no painel certo. */
function acessoDe(m){
  var app=location.origin+location.pathname.replace(/index\.html$/,'');
  return 'Olá '+m.nome.split(' ')[0]+'! Os turnos passam a ser registados no '+
    'FleetCV.\n\n1. Abra no telemóvel: '+app+'#condutor\n'+
    '2. Entre com:\n   E-mail: '+m.email+'\n   Código: '+m.codigo+'\n\n'+
    'Antes de cada turno: escolha o carro, fotografe o conta-quilómetros e '+
    'carregue em Começar.';
}
function numeroWhats(t){
  var d=String(t||'').replace(/\D/g,'');
  if(!d) return '';
  if(d.length===7) d='238'+d;              /* número de Cabo Verde sem indicativo */
  return d;
}

function carroDe(id){ return S.frota.carros.filter(function(c){return c.id===id;})[0]; }
function condutorDe(nome){
  return S.frota.condutores.filter(function(c){return c.nome===nome;})[0]; }
/* A frota é do patrão: é ele que a escreve, e os telemóveis dos
   condutores recebem a mudança sozinhos. */
function guardar(){ Nuvem.guardarFrota(S.frota); Nuvem.local('dono-sessao', S.sessao); }

/* ═══ AS CONTAS — as mesmas regras de sempre ═══════════════ */
/* O talão diz um posto. O GPS diz onde o carro esteve. Isto compara
   as duas coisas: o carro tem de ter estado perto desse posto, parado,
   à hora do talão. Sem isto, qualquer talão da rua serve de prova. */
function esteveNoPosto(t, a){
  /* o condutor já mandou a prova feita; só se recalcula quando o
     rasto está mesmo aqui (turnos de exemplo, ou já carregados) */
  if(a.prova) return a.prova;
  if(!(t.rasto||[]).length) return null;
  return provaDoPosto(t.rasto, a.posto, LIM.raioPosto);
}

/* Quanto gastou por 100 km. Um táxi destes anda nos 7 a 11 litros;
   muito acima disso, o combustível foi parar a outro lado.
   Conta-se pelos litros do talão quando ele existe: o talão é a
   verdade, o valor escrito é só o que o condutor diz. */
function consumo(t){
  var km=(t.kmFim||0)-t.kmInicio;
  var l=(t.abast||[]).reduce(function(s,a){
    return s + (a.litrosTalao || a.valor/t.precoLitro); }, 0);
  return (km>25&&l>0) ? l/km*100 : null;
}

function avaliar(t){
  var v=[], al=[];
  /* Um turno a decorrer não se julga pelas contas do fecho: ainda não
     há quilometragem final nem foto de saída, e chamar-lhe alerta
     seria acusar o condutor de não ter feito o que ainda não chegou
     a hora de fazer. O que já dá para verificar — o combustível, o
     sinal, o carro ter andado fora de turno — verifica-se na mesma. */
  var aberto = !t.fim;
  var kmQ=(t.kmFim||0)-t.kmInicio, kmG=t.kmGps!=null?t.kmGps:kmRasto(t.rasto);
  var temRasto=(t.rasto||[]).length>5 || t.kmGps!=null;

  if(aberto){
    v.push({ok:true, t1:'Turno a decorrer',
      t2:'começou às '+hh(t.inicio)+' com o quadrante nos '+nf(t.kmInicio),
      vl:nf(kmG,1)+' km'});
  } else {
    v.push({ok:!!t.fotos, t1:'Fotografou o conta-quilómetros',
      t2:nf(t.kmInicio)+' → '+nf(t.kmFim), vl:nf(kmQ)+' km'});
    if(!t.fotos) al.push({c:'A11',n:'AVISO',d:'Turno sem foto do conta-quilómetros'});
  }

  if(t.gap>LIM.gapKm){
    v.push({ok:false, t1:'O carro não andou fora do turno',
      t2:'estava '+nf(t.gap)+' km à frente de onde ficou', vl:'+'+nf(t.gap)+' km'});
    al.push({c:'A19',n:'CRITICO',d:'O carro andou '+nf(t.gap)+' km sem turno aberto',
      dif:Math.round(t.gap*7.5/100*t.precoLitro)});
  } else v.push({ok:true, t1:'O carro não andou fora do turno',
      t2:'o conta-quilómetros continua onde ficou', vl:'bate'});

  if(temRasto && !aberto){
    var d=kmQ>0?(kmQ-kmG)/kmQ*100:0;
    var critico=kmG>kmQ*1.10||d>=LIM.divCritica, aviso=!critico&&Math.abs(d)>=LIM.divAviso;
    v.push({ok:!critico&&!aviso, t1:'O GPS bate com o conta-quilómetros',
      t2:(critico||aviso)?nf(kmQ-kmG)+' km andados sem se saber para onde'
        :'diferença de '+nf(d,1)+'%, o normal', vl:nf(kmG,1)+' km'});
    if(critico) al.push({c:'A08',n:'CRITICO',d:'Conta-quilómetros e GPS não batem ('+
      nf(d,1)+'%)', dif:Math.round((kmQ-kmG)*7.5/100*t.precoLitro)});
    else if(aviso) al.push({c:'A07',n:'AVISO',d:'Diferença de km de '+nf(d,1)+'%'});
    var falha=t.semSinalS!=null?t.semSinalS:maiorFalha(t.rasto);
    v.push({ok:falha<=LIM.semSinalS, t1:'O sinal não teve buracos',
      t2:'maior interrupção', vl:nf(falha/60)+' min'});
    if(falha>LIM.semSinalS) al.push({c:'A03',n:'AVISO',
      d:'Sem sinal de GPS durante '+nf(falha/60)+' minutos'});
  } else if(temRasto){
    /* a decorrer só se pode olhar para os buracos de sinal */
    var falhaV=t.semSinalS!=null?t.semSinalS:maiorFalha(t.rasto);
    v.push({ok:falhaV<=LIM.semSinalS, t1:'O sinal não teve buracos',
      t2:'maior interrupção até agora', vl:nf(falhaV/60)+' min'});
    if(falhaV>LIM.semSinalS) al.push({c:'A03',n:'AVISO',
      d:'Sem sinal de GPS durante '+nf(falhaV/60)+' minutos'});
  } else if(!aberto){
    v.push({ok:false, t1:'Percurso gravado',
      t2:'o GPS não esteve ligado — as contas ficam pelo quadrante e pelas fotos',
      vl:'—'});
    al.push({c:'A03',n:'AVISO',d:'Turno sem percurso gravado'});
  } else {
    v.push({ok:false, t1:'Percurso a ser gravado',
      t2:'ainda não chegou sinal deste telemóvel', vl:'—'});
  }

  (t.abast||[]).forEach(function(a){
    v.push({ok:!!a.temFoto, t1:'Talão fotografado',
      t2:esc(a.posto||'posto')+' · '+hh(a.hora), vl:nf(a.valor)+' CVE'});
    if(!a.temFoto) al.push({c:'A11',n:'AVISO',d:'Abastecimento sem talão'});
    var litros=a.valor/t.precoLitro, cabe=litros<=t.deposito*1.05;
    v.push({ok:cabe, t1:'Os litros cabem no depósito',
      t2:nf(litros,2)+' num depósito de '+nf(t.deposito), vl:nf(litros,2)+' l'});
    if(!cabe) al.push({c:'A13',n:'CRITICO',d:'Declarou '+nf(litros,2)+
      ' litros num depósito de '+nf(t.deposito)});
    var np=esteveNoPosto(t, a);
    if(np){
      if(!np.esteve){
        v.push({ok:false, t1:'O carro esteve neste posto',
          t2:'o GPS nunca o pôs a menos de '+nf(np.metros)+' m de '+esc(a.posto),
          vl:nf(np.metros)+' m'});
        al.push({c:'A14',n:'CRITICO',d:'Talão de '+a.posto+
          ' mas o carro nunca lá esteve (ficou a '+nf(np.metros)+' m)',
          dif:a.valor});
      } else if(np.parouS<LIM.paragemMin){
        v.push({ok:false, t1:'O carro parou para abastecer',
          t2:'passou por '+esc(a.posto)+' mas não parou o tempo de encher',
          vl:nf(np.parouS)+' s'});
        al.push({c:'A14',n:'AVISO',d:'Passou pelo posto sem parar ('+
          nf(np.parouS)+' segundos)'});
      } else v.push({ok:true, t1:'O carro esteve mesmo no posto',
        t2:'parado '+nf(np.parouS/60,1)+' minutos a '+nf(np.metros)+' m da bomba',
        vl:'confirmado'});
    }
    if(a.litrosTalao){
      var dd=Math.abs(a.litrosTalao-litros)/litros*100, b=dd<=LIM.divLitros;
      var noTalao=Math.round(a.litrosTalao*t.precoLitro);
      v.push({ok:b, t1:'O que escreveu bate com o talão',
        t2:b?'escreveu '+nf(a.valor)+' CVE e o talão diz o mesmo'
            :'escreveu '+nf(a.valor)+' CVE · o talão dá '+nf(noTalao)+' CVE',
        vl:b?'bate':nf(a.valor-noTalao)+' CVE'});
      if(!b) al.push({c:'A12',n:'AVISO',d:'Escreveu '+nf(a.valor)+
        ' CVE mas o talão dá '+nf(noTalao)+' CVE', dif:a.valor-noTalao});
    }
  });
  var cons=aberto?null:consumo(t);
  if(cons!=null){
    var mau=cons>14, meio=!mau&&cons>11.5;
    v.push({ok:!mau&&!meio, t1:'O gasto por 100 km faz sentido',
      t2:(mau||meio)?'um táxi destes anda nos 7 a 11 litros aos 100'
        :'dentro do normal para este carro', vl:nf(cons,1)+' l/100km'});
    if(mau) al.push({c:'A17',n:'CRITICO',d:'Gastou '+nf(cons,1)+
      ' litros aos 100 km — muito acima do normal',
      dif:Math.round((cons-9.5)/100*kmQ*t.precoLitro)});
    else if(meio) al.push({c:'A17',n:'AVISO',d:'Gasto de '+nf(cons,1)+
      ' litros aos 100 km, acima do normal'});
  }
  return {v:v, al:al, kmQ:kmQ, kmG:kmG, consumo:cons};
}
function alertasDe(t){ return (t.alertas&&t.alertas.length!==undefined)?t.alertas:avaliar(t).al; }
function porResolver(t){ var r=t.resolucoes||{};
  return alertasDe(t).filter(function(a){ return !r[a.c]; }); }
function dinheiroDe(t){ var r=t.resolucoes||{};
  return alertasDe(t).reduce(function(s,a){
    if(r[a.c]&&r[a.c].r==='ERRO') return s; return s+(a.dif||0); },0); }
function turnosDoCarro(id){ return S.turnos.filter(function(t){ return t.carroId===id; }); }
function turnosDoCondutor(n){ return S.turnos.filter(function(t){ return t.condutor===n; }); }
function score(nome){
  var lim=Date.now()-30*864e5, pen=0, limpos=0, n=0;
  turnosDoCondutor(nome).forEach(function(t){
    if(t.fim==null||t.inicio<lim) return; n++;
    var r=t.resolucoes||{}, maus=0;
    alertasDe(t).forEach(function(a){
      if(r[a.c]&&r[a.c].r==='ERRO') return; pen+=PENAL[a.c]||0; maus++; });
    pen+=Math.min(Math.floor((t.semSinalS||0)/600),20);
    if(!maus) limpos++; });
  return {valor:Math.max(0,Math.min(100,100-pen+limpos*3)), n:n, limpos:limpos}; }
function consumoDoCarro(id){
  var ts=turnosDoCarro(id).filter(function(t){ return t.fim; });
  var km=0, l=0;
  ts.forEach(function(t){ km+=(t.kmFim||0)-t.kmInicio;
    (t.abast||[]).forEach(function(a){ l+=a.valor/t.precoLitro; }); });
  return km>0 ? l/km*100 : 0; }
function consumoCondutorNoCarro(nome, carroId){
  var ts=S.turnos.filter(function(t){ return t.condutor===nome&&t.carroId===carroId&&t.fim; });
  var km=0,l=0;
  ts.forEach(function(t){ km+=(t.kmFim||0)-t.kmInicio;
    (t.abast||[]).forEach(function(a){ l+=a.valor/t.precoLitro; }); });
  return {l100: km>0?l/km*100:0, km:km, n:ts.length}; }

/* ════════════════════════════════════════════════════════════
   DADOS DE PARTIDA
   Os turnos são inventados; as contas que os julgam são as mesmas
   que julgam os turnos verdadeiros.
   ════════════════════════════════════════════════════════════ */
/* A frota de estreia está no módulo da nuvem: é a mesma nos dois
   painéis, senão o condutor escolhia carros que o patrão não tem. */
function frotaNova(){ return Nuvem.frotaNova(); }

/* Um turno de exemplo que anda por ruas verdadeiras da Praia, pára
   num posto verdadeiro a meio e volta a andar. Assim o que o patrão
   vê agora é igual ao que vai ver quando isto for a sério. */
function percurso(semente, n, inicioMs, buracoMin){
  var r=semente||1, rnd=function(){ r=(r*1103515245+12345)%2147483648;
    return r/2147483648; };
  var caminho=percursoPorRuas(rnd, n, 190);
  if(caminho.length<10){ caminho=[[14.9177,-23.5092]];
    for(var z=1;z<n;z++) caminho.push([14.9177+z*0.0002, -23.5092+z*0.00015]); }
  var pts=[], tempo=0;
  for(var i=0;i<caminho.length;i++){
    var q=caminho[i], ant=caminho[i?i-1:0];
    var m=i?dist(ant[0],ant[1],q[0],q[1]):0;
    tempo+=30;
    pts.push([+q[0].toFixed(6), +q[1].toFixed(6), inicioMs+tempo*1000,
              8+Math.round(rnd()*8), Math.min(90,Math.round(m/30*3.6))]);
  }
  /* A paragem no posto. Procura-se no caminho todo o ponto que passa
     mais perto de um posto verdadeiro — assim o carro pára onde já ia
     passar, em vez de saltar do nada para a bomba. */
  var meio=0, posto=null, pd=1e9;
  for(var j=Math.floor(pts.length*0.2); j<Math.floor(pts.length*0.8); j++)
    MAPA_PRAIA.postos.forEach(function(x){
      var d=dist(pts[j][0],pts[j][1],x.lat,x.lon);
      if(d<pd){ pd=d; posto=x; meio=j; } });
  if(!posto){ posto=MAPA_PRAIA.postos[0]; meio=Math.floor(pts.length*0.5); }
  var pm=pts[meio], extra=[];
  /* entra no posto, fica lá parado, e volta ao caminho */
  for(var k=1;k<=7;k++) extra.push([posto.lat, posto.lon, pm[2]+k*60000, 7, 0]);
  pts=pts.slice(0,meio+1).concat(extra, pts.slice(meio+1).map(function(x){
    return [x[0],x[1],x[2]+7*60000,x[3],x[4]]; }));
  if(buracoMin){
    var a=Math.floor(pts.length*0.62), b=Math.floor(pts.length*0.80);
    var salto=buracoMin*60000;
    pts=pts.slice(0,a).concat(pts.slice(b).map(function(x){
      return [x[0],x[1],x[2]+salto,x[3],x[4]]; }));
  }
  return {pts:pts, posto:posto.nome, postoLat:posto.lat, postoLon:posto.lon,
          postoMs:pm[2]+120000};
}

function turnoInventado(caso, carro, condutor, quando, semente){
  var p=percurso(semente, 290+(semente%7)*20, quando, caso==='gps'?52:0);
  var kmG=kmRasto(p.pts);
  var kmQ=Math.round(kmG*1.035);
  if(caso==='gps') kmQ=Math.round(kmG+40);
  var gap=caso==='noite'?37:0;
  var litros=Math.max(10, kmQ*7.5/100*1.25);
  var valor=Math.round(litros*S.frota.precoLitro/50)*50;
  var litrosTalao=valor/S.frota.precoLitro;
  if(caso==='talao') litrosTalao=+(litrosTalao*0.62).toFixed(2);
  if(caso==='bidao'){ valor=Math.round(40*S.frota.precoLitro); litrosTalao=40; }
  if(caso==='posto'){ /* talão de um posto do outro lado da cidade */
    var outro=MAPA_PRAIA.postos[(semente+5)%MAPA_PRAIA.postos.length];
    if(outro.nome===p.posto) outro=MAPA_PRAIA.postos[(semente+6)%MAPA_PRAIA.postos.length];
    p.posto=outro.nome; p.postoLat=outro.lat; p.postoLon=outro.lon; }
  var posto=p.posto;
  var t={ id:uid('t'), inicio:quando, fim:p.pts[p.pts.length-1][2],
    carroId:carro.id, matricula:carro.matricula, condutor:condutor,
    kmInicio:carro.km+gap, kmFim:carro.km+gap+kmQ, gap:gap,
    precoLitro:S.frota.precoLitro, deposito:carro.deposito,
    rasto:p.pts, kmGps:+kmG.toFixed(1),
    semSinalS: caso==='gps'?3120:0, fotos:true, exemplo:true, caso:caso,
    abast:[{hora:p.postoMs, valor:valor, litrosTalao:+litrosTalao.toFixed(2),
            temFoto:true, posto:posto, lat:p.postoLat, lon:p.postoLon,
            prova:provaDoPosto(p.pts, posto, LIM.raioPosto)}],
    totalCve:valor };
  t.alertas=avaliar(t).al;
  carro.km=t.kmFim;
  return t;
}

/* Os turnos de exemplo. Semeados uma única vez, na estreia, para o
   patrão não abrir um ecrã vazio e não perceber para que serve isto.
   A partir daí os turnos verdadeiros vêm dos telemóveis. */
function turnosDeExemplo(frota){
  var guardado=S.frota; S.frota=frota;
  var casos=['limpo','limpo','limpo','talao','limpo','limpo','noite','limpo','gps',
             'limpo','posto','bidao','limpo','limpo','limpo'];
  var novos=[], sem=7, nC=frota.carros.length;
  var nDias=Math.ceil(casos.length/nC);
  var base=new Date(); base.setHours(0,0,0,0);
  for(var i=0;i<casos.length;i++){
    var carro=frota.carros[i%nC];
    var cond=frota.condutores[i%frota.condutores.length];
    var d=Math.floor(i/nC);
    var quando=base.getTime()-(nDias-d)*864e5+(6*60+(i%nC)*35)*60000;
    var t=turnoInventado(casos[i], carro, cond.nome, quando, sem+=13);
    t.condutorId=cond.id;
    novos.push(t);
  }
  S.frota=guardado;
  return novos;
}

/* ─── quem está a andar agora ─────────────────────────────
   Já não se inventa nada: estes turnos são os que os condutores têm
   abertos neste momento, tal como chegam da nuvem. */
function emTurno(){ return S.vivos||[]; }
/* Os percursos ficam guardados à parte: os turnos são substituídos
   por inteiro a cada novidade que chega, e o percurso que se foi
   buscar perdia-se com eles. */
var rastos={}, aBuscar={};
/* As fotografias são a prova. Sem as poder ver, o patrão está outra
   vez a acreditar na palavra do condutor — que é o que isto veio
   substituir. Vão-se buscar quando ele abre o turno. */
var fotos={}, aBuscarFoto={};
function fotosDo(t){
  if(fotos[t.id]) return fotos[t.id];
  if(!aBuscarFoto[t.id]){
    aBuscarFoto[t.id]=true;
    Nuvem.fotosDoTurno(t.id).then(function(f){
      fotos[t.id]=f||{};
      if(S.ecra==='turno' && S.sel===t.id) pintar(); });
  }
  return null;
}
function quadroFoto(src, rot){
  return '<button class="foto-q" data-foto="'+esc(src)+'">'+
    '<img src="'+src+'" alt="'+esc(rot)+'" loading="lazy">'+
    '<span>'+esc(rot)+'</span></button>';
}
function percursoDe(t){
  if(rastos[t.id]) return rastos[t.id];
  if(!aBuscar[t.id]){
    aBuscar[t.id]=true;
    Nuvem.rastoDe(t.id).then(function(pts){
      rastos[t.id] = pts || [];
      if(S.ecra==='turno' && S.sel===t.id) pintar();
    });
  }
  return t.rasto || [];
}
function turnoVivo(id){
  var r=null; emTurno().forEach(function(t){ if(t.id===id) r=t; }); return r; }

/* O desenho está em desenharMapa(), que é o mesmo nos dois painéis.
   Aqui só se decide o que mostrar ao patrão. */

/* Percurso de um turno. `ate` limita quantos pontos se desenham — é
   assim que o botão de ver o carro andar funciona. */
function mapaTurno(t, ate, altura, op){
  var pts=(t.rasto||[]).filter(function(p){ return p[3]==null||p[3]<=LIM.precisaoMax; });
  return desenharMapa({
    pts:pts, ate:ate, W:460, H:altura||280, pad:24, minSpan:0.009,
    pulsar:!!t.aoVivo, rotuloCarro:t.aoVivo?t.matricula:null,
    aviso: pts.length>=3 ? null
      : (op&&op.aCarregar ? 'a ir buscar o percurso…'
                          : 'este turno não tem percurso gravado'),
    abast:(t.abast||[]).map(function(a){
      return {lat:a.lat, lon:a.lon, posto:a.posto}; }),
    rotulo:'Percurso do turno no mapa da Praia'});
}

/* Onde estão os carros que estão em turno agora. */
function mapaFrota(){
  var activos=emTurno();
  var carros=activos.map(function(t){
    var r=t.rasto||[], u=r[r.length-1]||[14.9195,-23.5087],
        a=r[Math.max(0,r.length-4)]||u;
    return {id:t.id, lat:u[0], lon:u[1], rotulo:t.matricula,
      ang:Math.atan2((u[1]-a[1])*Math.cos(u[0]*Math.PI/180), u[0]-a[0])*180/Math.PI,
      cor: t.aSerio===false ? 'var(--muted)'
         : (porResolver(t).length?'var(--warn)':'var(--ok)')}; });
  return desenharMapa({
    pts:[], carros:carros, W:460, H:330, pad:30, minSpan:0.02,
    escolhido: S.cartao,
    centro: carros.length?null:[14.9195,-23.5087],
    aviso: carros.length?null:'nenhum carro em turno neste momento',
    rotulo:'Onde estão os carros agora. Toque num carro para o ver.'});
}

/* ─── o cartão do carro ───────────────────────────────────
   Quem toca num carro no mapa quer saber daquele carro, e quer saber
   já: há quanto tempo anda, quantos quilómetros, se abasteceu ou
   não, quem o leva. Tudo o que está aqui dentro leva a algum lado —
   a matrícula à ficha do carro, o nome à ficha do condutor, o
   abastecimento ao turno. */
function cartaoDoCarro(t){
  var r=t.rasto||[], u=r[r.length-1];
  var onde=u?bairroDe(u[0],u[1]):null;
  var km=kmDoTurno(t), horas=(Date.now()-t.inicio)/36e5;
  var abast=t.abast||[];
  var litros=abast.reduce(function(s,a){ return s+a.valor/(t.precoLitro||145); },0);
  var carro=carroDe(t.carroId);
  var vel=u&&u[4]!=null?u[4]:0;
  var calado = Date.now()-(t.momento||t.inicio);
  var parado = calado>300000;
  var alertas=porResolver(t);

  var linha=function(bom, t1, t2, vl, extra){
    return '<div class="vf"><span class="mk '+(bom?'s':'n')+'">'+(bom?'✓':'!')+
      '</span><span style="flex:1"><span class="t1">'+t1+'</span><br>'+
      '<span class="t2">'+t2+'</span></span><span class="vl">'+vl+'</span></div>'; };

  var h='<div class="cartao carro-cx">'+
    '<div class="carro-topo">'+
      '<div><button class="lig forte" data-carro-lig="'+t.carroId+'">'+
        '<span class="ponto"></span>'+esc(t.matricula)+'</button>'+
        (carro?'<span class="s"> · '+esc(carro.marca||'')+' '+
          esc(carro.modelo||'')+'</span>':'')+
        '<br><button class="lig" data-cond-nome="'+esc(t.condutor)+'">'+
        esc(t.condutor)+'</button></div>'+
      '<button class="fechar" data-f="fechar-cartao" aria-label="Fechar">×</button>'+
    '</div>'+
    '<p class="p-nota carro-onde">'+(onde?'<b>'+esc(onde)+'</b>':'a localizar')+
      (parado?' · <span style="color:var(--'+(calado>7200000?'crit':'warn')+
        ')">sem notícias há '+(calado>7200000?nf(calado/36e5,1)+' horas'
          :nf(calado/60000)+' min')+'</span>'
        : ' · '+nf(vel)+' km/h')+
      (t.bateria!=null?' · bateria '+t.bateria+'%':'')+
      (u&&u[3]!=null?' · GPS '+nf(u[3])+' m':'')+'</p>'+
    '<div class="tiles tres">'+
      '<div><b class="num">'+hms((Date.now()-t.inicio)/1000)+'</b>'+
        '<span>em turno</span></div>'+
      '<div><b class="num">'+nf(km,1)+'</b><span>km andados</span></div>'+
      '<div><b class="num">'+nf(t.totalCve||0)+'</b><span>CVE gastos</span></div>'+
    '</div>';

  if(abast.length){
    h+=abast.map(function(a){
      return '<button class="item fino" data-turno="'+t.id+'">'+
        '<span><span class="p">Abasteceu '+nf(a.valor)+' CVE</span><br>'+
        '<span class="s">'+hh(a.hora)+' · '+esc(a.posto||'posto')+' · '+
        nf(a.valor/(t.precoLitro||145),2)+' litros</span></span>'+
        '<span class="seta">›</span></button>'; }).join('');
  } else {
    h+='<div class="vf"><span class="mk n">○</span><span style="flex:1">'+
      '<span class="t1">Ainda não abasteceu neste turno</span><br>'+
      '<span class="t2">'+(horas>4?'já leva '+nf(horas,1)+' horas de turno'
        :'começou há '+nf(horas,1)+' horas')+'</span></span></div>';
  }

  h+='<p class="p-nota" style="margin-top:9px">Começou às '+hh(t.inicio)+
    ' com o quadrante nos '+nf(t.kmInicio)+' km'+
    (litros?' · '+nf(litros,2)+' litros até agora':'')+'.</p>';

  if(alertas.length)
    h+='<button class="item alerta-cx" data-turno="'+t.id+'">'+
      '<span><span class="p">'+alertas.length+
      (alertas.length===1?' coisa para ver':' coisas para ver')+'</span><br>'+
      '<span class="s">'+esc(alertas[0].d)+'</span></span>'+
      '<span class="seta">›</span></button>';

  h+='<button class="bt sec" data-turno="'+t.id+'" style="margin-top:10px">'+
    'Ver o turno todo, com o mapa</button>';
  /* Um condutor esquece-se de fechar e o carro fica "em turno" para
     sempre; o turno seguinte não abre limpo e o mapa mente. Passadas
     duas horas sem notícias, o patrão pode fechá-lo daqui. */
  if(calado>7200000)
    h+='<button class="bt perigo pq" data-f="fechar-turno" data-t="'+t.id+
      '" style="margin-top:8px">Fechar este turno</button>'+
      '<p class="p-nota" style="margin-top:6px">Sem notícias há mais de duas horas. '+
      'Fechar aqui fica registado como fecho do patrão, não do condutor.</p>';
  return h+'</div>';
}

/* ════════════════════════════════════════════════════════════
   ECRÃS
   ════════════════════════════════════════════════════════════ */
function vfLinhas(v){ return '<div class="cartao">'+v.map(function(x){
  return '<div class="vf"><span class="mk '+(x.ok?'s':'n')+'">'+(x.ok?'✓':'!')+'</span>'+
    '<span style="flex:1"><span class="t1">'+x.t1+'</span><br>'+
    '<span class="t2">'+x.t2+'</span></span><span class="vl">'+x.vl+'</span></div>';
  }).join('')+'</div>'; }

function itemTurno(t){
  var pr=porResolver(t);
  var cls=pr.some(function(a){return a.n==='CRITICO';})?'c':(pr.length?'n':'s');
  var rot=cls==='s'?'tudo bem':(cls==='n'?pr.length+' a ver':'a investigar');
  return '<button class="item" data-turno="'+t.id+'">'+
    '<span><span class="p">'+nf((t.kmFim||0)-t.kmInicio)+' km · '+esc(t.matricula)+'</span>'+
    '<br><span class="s">'+esc(t.condutor)+' · '+dt(t.inicio)+' · '+hh(t.inicio)+'–'+
    hh(t.fim)+' · '+nf(t.totalCve)+' CVE</span></span>'+
    '<span class="d"><span class="selo '+cls+'">'+rot+'</span></span></button>'; }

/* ─── não pintar por cima de quem está a escrever ─────────
   A nuvem traz novidades a toda a hora — um condutor a andar manda
   a posição de 4 em 4 segundos. Cada novidade repintava o ecrã, e
   quem estivesse a meio de preencher uma viatura via o campo ser
   substituído por outro vazio. Escrevia a matrícula e ela
   desaparecia por baixo dos dedos; carregava em Guardar e não
   guardava nada, sem dizer porquê.
   Agora a novidade fica em espera e o ecrã só se repinta quando o
   dedo sair do campo. */
var pinturaEmEspera=false;
function aEscrever(){
  var a=document.activeElement;
  return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
}
function pintarSePuder(){
  if(aEscrever()){ pinturaEmEspera=true; return; }
  pintar();
}
document.addEventListener('focusout', function(){
  setTimeout(function(){
    if(pinturaEmEspera && !aEscrever()){ pinturaEmEspera=false; pintar(); }
  }, 80);
});

function pintar(){
  var h='', b=true;

  /* ── entrar ─────────────────────────────────────────── */
  if(S.ecra==='entrar'){
    h='<div style="height:10px"></div><h1>Entrar</h1>'+
      '<p class="sub">Painel do proprietário.</p>'+
      '<label class="campo"><span class="lb">Email</span>'+
      '<input type="text" id="i-email" value="'+esc(S.r.email||'')+
      '" placeholder="patrao@exemplo.cv"></label>'+
      '<label class="campo"><span class="lb">Código</span>'+
      '<input type="password" id="i-cod" autocomplete="current-password" value="'+
      esc(S.r.cod||'')+'" placeholder="o seu código"></label>';
    h+=caixaAviso();
    h+='<button class="bt pri" data-f="entrar">Entrar</button>';
    /* Com a base de dados ligada, quem ainda não tem conta cria-a aqui.
       Sem ela (aberto como ficheiro) não há onde guardar contas, e fica
       o código de experimentar de sempre. */
    h+= Nuvem.podeCriarConta && Nuvem.podeCriarConta()
      ? '<div class="cartao nota" style="margin-top:14px"><p class="p-nota">'+
        '<b>Ainda não tem conta?</b> Crie a sua frota em dois minutos. '+
        'Os primeiros 30 dias são por nossa conta.</p>'+
        '<button class="bt sec pq" data-f="ir-criar" style="margin-top:10px">'+
        'Criar conta grátis</button></div>'
      : '<div class="cartao nota"><p class="p-nota"><b>Para experimentar:</b><br>'+
        'patrao@exemplo.cv · 9999</p></div>';
    b=false;
  }

  /* ── criar conta ────────────────────────────────────── */
  /* Quem chega pela página principal fica com a sua frota, vazia e só
     dele. Pede-se o mínimo: quem é, como se chama a frota, e o e-mail
     e o código com que vai voltar a entrar. */
  else if(S.ecra==='criar'){
    var cc=function(id){ return esc(S.r[id]||''); };
    h='<div style="height:10px"></div><h1>Criar conta</h1>'+
      '<p class="sub">30 dias grátis, sem cartão. Depois, se servir, '+
      'fala-se do preço.</p>'+caixaAviso()+
      '<label class="campo"><span class="lb">O seu nome</span>'+
      '<input type="text" id="e-c-nome"'+marcado('e-c-nome')+' autocomplete="name" value="'+
      cc('e-c-nome')+'" placeholder="Ex.: Manuel Tavares"></label>'+
      '<label class="campo"><span class="lb">Nome da frota</span>'+
      '<input type="text" id="e-c-frota"'+marcado('e-c-frota')+' value="'+
      cc('e-c-frota')+'" placeholder="Ex.: Táxis Tavares"></label>'+
      '<label class="campo"><span class="lb">E-mail</span>'+
      '<input type="email" id="e-c-email"'+marcado('e-c-email')+' autocomplete="email" value="'+
      cc('e-c-email')+'" placeholder="o.seu@email.cv"></label>'+
      '<label class="campo"><span class="lb">Código para entrar</span>'+
      '<input type="password" id="e-c-cod"'+marcado('e-c-cod')+' autocomplete="new-password" value="'+
      cc('e-c-cod')+'" placeholder="pelo menos 6 algarismos ou letras">'+
      '<span class="aj">É a sua chave. Não a dê a ninguém — os condutores '+
      'recebem cada um a sua.</span></label>'+
      '<label class="campo"><span class="lb">O mesmo código outra vez</span>'+
      '<input type="password" id="e-c-cod2"'+marcado('e-c-cod2')+' autocomplete="new-password" value="'+
      cc('e-c-cod2')+'"></label>'+
      '<button class="bt pri" data-f="criar">Criar a minha frota</button>'+
      '<p style="text-align:center;margin:14px 0 0"><button class="lig" '+
      'data-f="ir-entrar">Já tenho conta — entrar</button></p>';
    b=false;
  }

  /* ── mapa da frota ──────────────────────────────────── */
  else if(S.ecra==='mapa'){
    var vivos=emTurno();
    /* quem está mesmo a andar, e quem ficou para trás com o turno
       aberto — são coisas diferentes e não podem contar juntas */
    var aAndar=vivos.filter(function(t){ return t.aSerio!==false; });
    var calados=vivos.filter(function(t){ return t.aSerio===false; });
    var nVivos=aAndar.length;
    var hoje=S.turnos.filter(function(t){ return t.fim &&
      new Date(t.inicio).toDateString()===new Date().toDateString(); });
    var base=hoje.length?hoje:S.turnos.slice(0,3);
    var km=base.reduce(function(s,t){ return s+((t.kmFim||0)-t.kmInicio); },0);
    var cve=base.reduce(function(s,t){ return s+(t.totalCve||0); },0);
    var nAl=S.turnos.reduce(function(s,t){ return s+porResolver(t).length; },0);
    var porExplicar=S.turnos.reduce(function(s,t){ return s+dinheiroDe(t); },0);

    h=primeirosPassos()+avisoDoPlano()+'<h1>A frota agora</h1>'+
      '<p class="sub">'+(nVivos?'<span class="ponto"></span>'+nVivos+
        (nVivos===1?' carro':' carros')+' em turno neste momento'
        :'Nenhum carro em turno')+
        (calados.length?' · <b style="color:var(--warn)">'+calados.length+
          ' por fechar</b>':'')+'</p>'+
      mapaFrota();
    var escolhido = S.cartao ? turnoVivo(S.cartao) : null;
    if(escolhido) h+=cartaoDoCarro(escolhido);
    else if(nVivos) h+='<p class="dica">Toque num carro no mapa para ver '+
      'tudo o que se passa nele.</p>';
    if(calados.length) h+='<div class="cartao aviso"><h2>'+calados.length+
      (calados.length===1?' turno por fechar':' turnos por fechar')+'</h2>'+
      '<p class="p-nota" style="margin-top:4px">Estes telemóveis deixaram de dar '+
      'notícias e o turno ficou aberto. Toque para ver e fechar — enquanto não '+
      'fechar, o carro continua a contar como se estivesse na rua.</p></div>';
    vivos.forEach(function(t){
      if(S.cartao===t.id) return;      /* já está aberto aqui em cima */
      var kmv=kmDoTurno(t), u=(t.rasto||[])[(t.rasto||[]).length-1];
      var onde=u?bairroDe(u[0],u[1]):null;
      var cal=Date.now()-(t.momento||t.inicio), zumbi=t.aSerio===false;
      h+='<button class="item'+(zumbi?' zumbi':'')+'" data-vivo="'+t.id+'">'+
        '<span><span class="p">'+(zumbi?'<span class="parado"></span>'
          :'<span class="ponto"></span>')+esc(t.matricula)+' · '+
        esc(t.condutor)+'</span><br><span class="s">'+
        (zumbi ? 'sem notícias há '+(cal>36e5?nf(cal/36e5,1)+' horas'
                   :nf(cal/60000)+' min')+' · por fechar'
               : (onde?esc(onde)+' · ':'')+'desde as '+hh(t.inicio)+' · '+
                 nf(kmv,1)+' km · '+hms((Date.now()-t.inicio)/1000))+
        '</span></span><span class="seta">›</span></button>'; });
    h+='<div class="tiles clic">'+
      '<div data-tile="contas"><b class="num">'+nf(km)+'</b><span>km '+
      (hoje.length?'hoje':'nos últimos dias')+'</span></div>'+
      '<div data-tile="contas"><b class="num">'+nf(cve)+
      '</b><span>CVE em combustível</span></div>'+
      '<div data-tile="turnos"><b class="num">'+base.length+
      '</b><span>turnos</span></div>'+
      '<div data-tile="alertas" class="'+(porExplicar>0?'mau':'bom')+
      '"><b class="num">'+nf(porExplicar)+'</b><span>CVE por explicar</span>'+
      '</div></div>';
    if(nAl) h+='<button class="item" data-f="ir-alertas" style="border-color:var(--crit)">'+
      '<span><span class="p" style="color:var(--crit)">'+nAl+' '+
      (nAl===1?'coisa':'coisas')+' para ver</span><br><span class="s">'+
      'toque para resolver uma a uma</span></span><span class="seta">›</span></button>';
    h+='<h3>Últimos turnos</h3>'+
      S.turnos.slice(0,5).map(itemTurno).join('')+
      (S.turnos.length>5
        ? '<button class="lig" data-tile="turnos" style="margin-top:4px">'+
          'Ver os '+S.turnos.length+' turnos ›</button>' : '');
  }

  /* ── viaturas ───────────────────────────────────────── */
  else if(S.ecra==='viaturas'){
    h='<h1>Viaturas</h1><p class="sub">'+S.frota.carros.length+' carros</p>';
    h+=S.frota.carros.map(function(c){
      var ts=turnosDoCarro(c.id).filter(function(t){ return t.fim; });
      var cons=consumoDoCarro(c.id);
      var oleo=c.proxOleoKm-c.km;
      return '<button class="item" data-carro="'+c.id+'">'+
        '<span><span class="p" style="font-family:var(--mono)">'+esc(c.matricula)+'</span>'+
        (c.estado!=='ACTIVO'?' <span class="selo i">parado</span>':'')+
        '<br><span class="s">'+esc(c.marca+' '+c.modelo)+' · '+nf(c.km)+' km · '+
        ts.length+' turnos</span>'+
        (oleo<=1000?'<br><span class="selo n" style="margin-top:4px">óleo em '+
          nf(Math.max(0,oleo))+' km</span>':'')+
        '</span><span class="d"><span class="num" style="font-size:15px">'+
        nf(cons,1)+'</span><br><span class="s" style="font-size:11px">l/100</span></span>'+
        '</button>'; }).join('');
    h+='<button class="bt sec pq" data-f="novo-carro">+ Acrescentar viatura</button>';
  }

  /* ── ficha da viatura ───────────────────────────────── */
  else if(S.ecra==='carro'){
    var c=carroDe(S.sel); if(!c){ S.ecra='viaturas'; return pintar(); }
    var ts=turnosDoCarro(c.id).filter(function(t){ return t.fim; });
    var km=ts.reduce(function(s,t){ return s+((t.kmFim||0)-t.kmInicio); },0);
    var cve=ts.reduce(function(s,t){ return s+(t.totalCve||0); },0);
    var cons=consumoDoCarro(c.id);
    var oleo=c.proxOleoKm-c.km;
    var quem={}; ts.forEach(function(t){ quem[t.condutor]=(quem[t.condutor]||0)+1; });

    h='<h1 style="font-family:var(--mono)">'+esc(c.matricula)+'</h1>'+
      '<p class="sub">'+esc(c.marca+' '+c.modelo+(c.ano?' · '+c.ano:''))+'</p>'+
      '<div class="tiles">'+
      '<div><b class="num">'+nf(c.km)+'</b><span>km no conta-quilómetros</span></div>'+
      '<div><b class="num">'+nf(cons,2)+'</b><span>litros por 100 km</span></div>'+
      '<div><b class="num">'+nf(cve)+'</b><span>CVE em combustível</span></div>'+
      '<div><b class="num">'+ts.length+'</b><span>turnos · '+nf(km)+' km</span></div></div>';
    h+='<div class="cartao'+(oleo<=1000?' aviso':'')+'"><h2>Manutenção</h2>'+
      '<div class="linhas" style="margin-top:6px">'+
      '<div><span class="k">Próxima mudança de óleo</span><span class="v">'+
      nf(c.proxOleoKm)+' km</span></div>'+
      '<div><span class="k">Faltam</span><span class="v"'+
      (oleo<=1000?' style="color:var(--warn)"':'')+'>'+nf(Math.max(0,oleo))+' km</span></div>'+
      '</div>'+
      '<button class="bt sec pq" data-f="oleo-feito" style="margin-top:9px">'+
      'Mudei o óleo agora</button></div>';
    if(Object.keys(quem).length)
      h+='<div class="cartao"><h2>Quem conduz este carro</h2><div class="linhas" '+
        'style="margin-top:4px">'+Object.keys(quem).map(function(n){
          var cc=consumoCondutorNoCarro(n, c.id);
          return '<div><span class="k"><button class="lig" data-cond-nome="'+esc(n)+
            '" style="padding:0">'+esc(n)+'</button></span>'+
            '<span class="v">'+nf(cc.l100,2)+' l/100</span></div>'; }).join('')+'</div>'+
        '<p class="p-nota" style="margin-top:8px">Mesmo carro, mesmas ruas: se um gasta '+
        'muito mais do que outro, a diferença não é do carro.</p></div>';
    h+='<h3>Turnos deste carro</h3>'+
      (ts.length?ts.slice(0,8).map(itemTurno).join('')
        :'<div class="cartao"><div class="vazio">Sem turnos.</div></div>')+
      (ts.length>8 ? '<button class="lig" data-turnos-de="'+c.id+'">Ver os '+
        ts.length+' turnos deste carro ›</button>' : '');
    h+='<div class="par" style="margin-top:6px">'+
      '<button class="bt sec pq" data-f="editar-carro">Editar</button>'+
      '<button class="bt perigo pq" data-f="parar-carro">'+
      (c.estado==='ACTIVO'?'Pôr de lado':'Voltar a usar')+'</button></div>';
  }

  /* ── editar viatura ─────────────────────────────────── */
  else if(S.ecra==='editar-carro'){
    var ec=S.sel?carroDe(S.sel):null;
    /* o que o utilizador escreveu manda sobre o que está gravado */
    var cp=function(id, seVazio){
      return S.r[id]!=null ? S.r[id] : (seVazio==null?'':seVazio); };
    h='<h1>'+(ec?'Editar viatura':'Nova viatura')+'</h1>'+caixaAviso()+
      '<label class="campo"><span class="lb">Matrícula</span>'+
      '<input type="text" id="e-mat"'+marcado('e-mat')+' value="'+
      esc(cp('e-mat', ec?ec.matricula:''))+
      '" placeholder="ST-28-ED" autocapitalize="characters" '+
      'autocomplete="off" spellcheck="false"><span class="aj">Escreva-a como '+
      'está na chapa. Fica tal e qual.</span></label>'+
      '<div class="par"><label class="campo"><span class="lb">Marca</span>'+
      '<input type="text" id="e-marca"'+marcado('e-marca')+' value="'+esc(cp('e-marca', ec?ec.marca:''))+
      '"></label>'+
      '<label class="campo"><span class="lb">Modelo</span>'+
      '<input type="text" id="e-modelo"'+marcado('e-modelo')+' value="'+esc(cp('e-modelo', ec?ec.modelo:''))+
      '"></label></div>'+
      '<div class="par"><label class="campo"><span class="lb">Km agora</span>'+
      '<input type="number" inputmode="numeric" id="e-km"'+marcado('e-km')+' value="'+
      esc(cp('e-km', ec?ec.km:''))+'" placeholder="0"></label>'+
      '<label class="campo"><span class="lb">Depósito (l)</span>'+
      '<input type="number" inputmode="numeric" id="e-dep"'+marcado('e-dep')+' value="'+
      esc(cp('e-dep', ec?ec.deposito:45))+'"></label></div>'+
      '<label class="campo"><span class="lb">Óleo a mudar aos</span>'+
      '<input type="number" inputmode="numeric" id="e-oleo"'+marcado('e-oleo')+' value="'+
      esc(cp('e-oleo', ec?ec.proxOleoKm:''))+'" placeholder="0"><span class="aj">A aplicação avisa quando faltarem '+
      '1.000 km.</span></label>'+
      '<button class="bt pri" data-f="guardar-carro">Guardar</button>';
    if(ec) h+='<button class="bt perigo pq" data-f="apagar-carro">Apagar viatura</button>'+
      '<p class="p-nota">Apagar leva os turnos deste carro com ele. Se é só para deixar '+
      'de o usar, prefira <b>pôr de lado</b>.</p>';
  }

  /* ── condutores ─────────────────────────────────────── */
  else if(S.ecra==='condutores'){
    h='<h1>Condutores</h1><p class="sub">'+S.frota.condutores.length+' pessoas</p>';
    h+=S.frota.condutores.map(function(m){
      var s=score(m.nome);
      var cor=s.valor>=95?'var(--ok)':(s.valor>=80?'var(--warn)':'var(--crit)');
      return '<button class="item" data-cond="'+m.id+'">'+
        '<span><span class="p">'+esc(m.nome)+'</span>'+
        (m.estado!=='ACTIVO'?' <span class="selo i">inactivo</span>':'')+
        '<br><span class="s">'+esc(m.email)+' · código '+esc(m.codigo)+'</span></span>'+
        '<span class="d"><span class="num" style="font-size:17px;color:'+cor+'">'+
        s.valor+'</span><br><span class="s" style="font-size:11px">'+s.n+' turnos</span>'+
        '</span></button>'; }).join('');
    h+='<button class="bt sec pq" data-f="novo-cond">+ Acrescentar condutor</button>'+
      '<p class="p-nota">O número mede <b>cuidado a registar</b>, não honestidade.</p>';
  }

  /* ── ficha do condutor ──────────────────────────────── */
  else if(S.ecra==='condutor'){
    var m=S.frota.condutores.filter(function(x){return x.id===S.sel;})[0];
    if(!m){ S.ecra='condutores'; return pintar(); }
    var ts2=turnosDoCondutor(m.nome).filter(function(t){ return t.fim; });
    var s2=score(m.nome);
    var cor2=s2.valor>=95?'var(--ok)':(s2.valor>=80?'var(--warn)':'var(--crit)');
    var km2=ts2.reduce(function(s,t){ return s+((t.kmFim||0)-t.kmInicio); },0);
    var cve2=ts2.reduce(function(s,t){ return s+(t.totalCve||0); },0);
    var dif2=ts2.reduce(function(s,t){ return s+dinheiroDe(t); },0);
    var carros={}; ts2.forEach(function(t){ carros[t.carroId]=1; });

    var zap='https://wa.me/'+numeroWhats(m.telefone)+'?text='+
      encodeURIComponent(acessoDe(m));
    h='<h1>'+esc(m.nome)+'</h1><p class="sub">'+esc(m.email)+' · código <b>'+
      esc(m.codigo)+'</b>'+(m.telefone?' · '+esc(m.telefone):'')+'</p>'+
      '<div class="cartao'+(S.novoCond===m.id?' nota':'')+'">'+
      (S.novoCond===m.id ? '<h2>Falta só mandar-lhe o acesso</h2>'+
        '<p class="p-nota" style="margin:4px 0 10px">Vai o endereço da aplicação, '+
        'o e-mail e o código. Ele abre no telemóvel e entra.</p>' : '')+
      '<div class="par">'+
      '<a class="bt pri pq" id="mandar-zap" style="flex:2" href="'+esc(zap)+'" target="_blank" '+
      'rel="noopener">Mandar pelo WhatsApp</a>'+
      '<button class="bt sec pq" data-f="copiar-acesso">Copiar</button></div>'+
      '<p class="p-nota" id="acesso-copiado" style="margin-top:6px"></p></div>'+
      '<div class="cartao"><div style="display:flex;align-items:baseline;gap:8px">'+
      '<h2>Cuidado a registar</h2><span class="num" style="margin-left:auto;'+
      'font-size:24px;font-weight:500;color:'+cor2+'">'+s2.valor+'</span></div>'+
      '<div class="barra-mini"><span style="width:'+s2.valor+'%;background:'+cor2+
      '"></span></div><p class="p-nota" style="margin-top:7px">'+s2.n+
      ' turnos nos últimos 30 dias · '+s2.limpos+' sem nada a apontar</p></div>'+
      '<div class="tiles">'+
      '<div><b class="num">'+ts2.length+'</b><span>turnos</span></div>'+
      '<div><b class="num">'+nf(km2)+'</b><span>km</span></div>'+
      '<div><b class="num">'+nf(cve2)+'</b><span>CVE gastos</span></div>'+
      '<div class="'+(dif2>0?'mau':'bom')+'"><b class="num">'+nf(dif2)+
      '</b><span>CVE por explicar</span></div></div>';
    if(Object.keys(carros).length)
      h+='<div class="cartao"><h2>Carros que leva</h2><div class="linhas" '+
        'style="margin-top:4px">'+Object.keys(carros).map(function(id){
          var cc=consumoCondutorNoCarro(m.nome,id), car=carroDe(id);
          if(!car) return '';
          return '<div><span class="k"><button class="lig" data-carro-lig="'+id+
            '" style="padding:0;font-family:var(--mono)">'+esc(car.matricula)+
            '</button></span><span class="v">'+nf(cc.l100,2)+' l/100 · '+cc.n+
            ' turnos</span></div>'; }).join('')+'</div></div>';
    h+='<h3>Turnos</h3>'+(ts2.length?ts2.slice(0,8).map(itemTurno).join('')
      :'<div class="cartao"><div class="vazio">Sem turnos.</div></div>')+
      (ts2.length>8 ? '<button class="lig" data-turnos-cond="'+esc(m.nome)+
        '">Ver os '+ts2.length+' turnos deste condutor ›</button>' : '');
    h+='<div class="par" style="margin-top:6px">'+
      '<button class="bt sec pq" data-f="editar-cond">Editar</button>'+
      '<button class="bt perigo pq" data-f="parar-cond">'+
      (m.estado==='ACTIVO'?'Desactivar':'Reactivar')+'</button></div>';
  }

  /* ── editar condutor ────────────────────────────────── */
  else if(S.ecra==='editar-cond'){
    var em=S.sel?S.frota.condutores.filter(function(x){return x.id===S.sel;})[0]:null;
    var cp2=function(id, seVazio){
      return S.r[id]!=null ? S.r[id] : (seVazio==null?'':seVazio); };
    h='<h1>'+(em?'Editar condutor':'Novo condutor')+'</h1>'+caixaAviso()+
      '<label class="campo"><span class="lb">Nome</span>'+
      '<input type="text" id="e-nome"'+marcado('e-nome')+' value="'+esc(cp2('e-nome', em?em.nome:''))+
      '" autocomplete="off"></label>'+
      '<label class="campo"><span class="lb">Email</span>'+
      '<input type="email" id="e-email2"'+marcado('e-email2')+' value="'+esc(cp2('e-email2', em?em.email:''))+
      '" placeholder="nome@exemplo.cv" autocapitalize="off" '+
      'autocomplete="off" spellcheck="false"></label>'+
      '<div class="par"><label class="campo"><span class="lb">Telefone</span>'+
      '<input type="tel" id="e-tel"'+marcado('e-tel')+' value="'+esc(cp2('e-tel', em?em.telefone:''))+
      '" placeholder="+238 991 00 00"></label>'+
      '<label class="campo"><span class="lb">Código</span>'+
      '<input type="text" id="e-codigo"'+marcado('e-codigo')+' inputmode="numeric" value="'+
      esc(cp2('e-codigo', em?em.codigo:S.codigoNovo))+'" maxlength="6"></label></div>'+
      '<p class="p-nota">É com o email e o código que ele entra na aplicação dele.</p>'+
      '<button class="bt pri" data-f="guardar-cond">Guardar</button>';
    if(em) h+='<button class="bt perigo pq" data-f="apagar-cond">Apagar condutor</button>'+
      '<p class="p-nota">Apagar leva os turnos dele. Para deixar de o usar sem perder '+
      'o histórico, prefira <b>desactivar</b>.</p>';
  }

  /* ── alertas ────────────────────────────────────────── */
  else if(S.ecra==='alertas'){
    var linhas=[];
    S.turnos.forEach(function(t){ var r=t.resolucoes||{};
      alertasDe(t).forEach(function(a){ linhas.push({t:t,a:a,r:r[a.c]}); }); });
    linhas.sort(function(x,y){ if(!!x.r!==!!y.r) return x.r?1:-1;
      if(x.a.n!==y.a.n) return x.a.n==='CRITICO'?-1:1; return y.t.inicio-x.t.inicio; });
    h='<h1>Para ver</h1><p class="sub">Feche cada um com uma de três respostas.</p>';
    h+= linhas.length ? linhas.map(function(L){
        var cr=L.a.n==='CRITICO';
        return '<div class="cartao'+(cr?' mau':' aviso')+'"'+(L.r?' style="opacity:.55"':'')+'>'+
          '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">'+
          '<span class="selo '+(cr?'c':'n')+'">'+(cr?'importante':'a ver')+'</span>'+
          '<span class="s" style="font-size:12px;color:var(--muted)">'+dt(L.t.inicio)+
          ' · '+esc(L.t.matricula)+' · '+esc(L.t.condutor)+'</span></div>'+
          '<div style="font-weight:600;margin-top:7px;font-size:14.5px">'+esc(L.a.d)+'</div>'+
          (L.a.dif?'<div class="num" style="font-size:20px;font-weight:500;'+
            'margin-top:5px;color:var(--crit)">'+nf(L.a.dif)+' CVE</div>':'')+
          (L.r?'<p class="p-nota" style="margin-top:7px">Fechado como <b>'+
            ({OK:'justificado',DESVIO:'é mesmo desvio',ERRO:'não fazia sentido'}[L.r.r])+
            '</b></p>'
           :'<div class="par" style="margin-top:10px">'+
            '<button class="bt sec pq" data-res="OK" data-t="'+L.t.id+'" data-c="'+L.a.c+
            '">Tem explicação</button>'+
            '<button class="bt sec pq" data-res="DESVIO" data-t="'+L.t.id+'" data-c="'+
            L.a.c+'">É desvio</button>'+
            '<button class="bt sec pq" data-res="ERRO" data-t="'+L.t.id+'" data-c="'+
            L.a.c+'">Não fazia sentido</button></div>')+
          '<button class="lig" data-turno="'+L.t.id+'">Ver o turno todo ›</button></div>';
      }).join('')
      : '<div class="cartao bom"><div class="vazio">Nada para ver.</div></div>';
  }

  /* ── o turno, com o mapa a andar ────────────────────── */
  else if(S.ecra==='turno'){
    var t=turnoVivo(S.sel)||S.turnos.filter(function(x){return x.id===S.sel;})[0];
    if(!t){ S.ecra='mapa'; return pintar(); }
    var aoVivo=!!t.aoVivo;
    /* Os turnos chegam da nuvem sem o percurso — são milhares de
       pontos que não fazem falta na lista. Vai-se buscar só quando
       alguém abre este turno, e uma vez só. */
    var aCarregar = !aoVivo && !rastos[t.id];
    if(!aoVivo) t.rasto = percursoDe(t);
    t.rasto = t.rasto || [];
    var av=avaliar(t);
    var n=S.replay==null?t.rasto.length:S.replay;
    var frac=t.rasto.length?n/t.rasto.length:1;
    var dur=(aoVivo?Date.now():t.fim)-t.inicio;

    h='<h1>'+(aoVivo?'<span class="ponto"></span>Em turno agora':dt(t.inicio))+'</h1>'+
      '<p class="sub">'+
      '<button class="lig" data-carro-lig="'+t.carroId+'" style="padding:0;'+
      'font-family:var(--mono)">'+esc(t.matricula)+'</button> · '+
      '<button class="lig" data-cond-nome="'+esc(t.condutor)+'" style="padding:0">'+
      esc(t.condutor)+'</button> · '+hh(t.inicio)+'–'+(aoVivo?'agora':hh(t.fim))+
      ' · '+nf(dur/36e5,1)+' horas</p>';
    h+=mapaTurno(t, S.replay, 290, {aCarregar:aCarregar});
    if(!aoVivo&&t.rasto.length>5)
      h+='<div class="replay"><button class="bt sec pq" data-f="replay" '+
        'style="width:auto;padding:8px 14px">'+(cronoReplay?'❚❚ Parar':'▶ Ver o carro andar')+
        '</button><span class="barra"><span style="width:'+(frac*100).toFixed(0)+
        '%"></span></span><span class="t">'+hh(t.rasto[Math.max(0,n-1)][2])+'</span></div>';
    h+='<div class="tiles" style="margin-top:4px">'+
      '<div><b class="num">'+nf((t.kmFim||t.kmInicio+Math.round(kmDoTurno(t)))-
        t.kmInicio)+'</b><span>km andados</span></div>'+
      '<div><b class="num">'+nf(kmDoTurno(t),1)+'</b><span>km pelo GPS</span></div>'+
      '<div><b class="num">'+nf(t.totalCve)+'</b><span>CVE em combustível</span></div>'+
      '<div><b class="num">'+hms(dur/1000)+'</b><span>tempo</span></div></div>';
    /* as fotografias, em grande, antes das contas */
    var fs=fotosDo(t)||{};
    var quadros=[];
    if(fs[t.id+'_inicio']) quadros.push(quadroFoto(fs[t.id+'_inicio'],
      'Quadrante ao começar · '+nf(t.kmInicio)+' km'));
    (t.abast||[]).forEach(function(a,ia){
      if(fs[t.id+'_ab'+ia]) quadros.push(quadroFoto(fs[t.id+'_ab'+ia],
        'Talão · '+nf(a.valor)+' CVE · '+hh(a.hora))); });
    if(fs[t.id+'_fim']) quadros.push(quadroFoto(fs[t.id+'_fim'],
      'Quadrante ao acabar · '+nf(t.kmFim)+' km'));
    if(quadros.length)
      h+='<div class="cartao"><h2>As fotografias</h2>'+
        '<p class="p-nota" style="margin:2px 0 9px">Toque para ver em grande.</p>'+
        '<div class="fotos">'+quadros.join('')+'</div></div>';
    else if(t.exemplo)
      h+='<div class="cartao nota"><h2>Turno de exemplo</h2>'+
        '<p class="p-nota" style="margin-top:4px">Os turnos de estreia não têm '+
        'fotografias — servem só para mostrar como fica. Os turnos verdadeiros '+
        'trazem o quadrante e os talões.</p></div>';
    else if(!aoVivo && (t.temFotoInicio||t.temFotoFim||
        (t.abast||[]).some(function(a){ return a.temFoto; })))
      h+='<div class="cartao"><h2>As fotografias</h2>'+
        '<p class="p-nota" style="margin-top:4px">'+
        (aBuscarFoto[t.id]&&!fotos[t.id] ? 'a ir buscar…'
          : 'O condutor tirou fotografias mas ainda não chegaram aqui — '+
            'o telemóvel dele deve estar sem rede.')+'</p></div>';
    else if(!aoVivo)
      h+='<div class="cartao aviso"><h2>Sem fotografias</h2>'+
        '<p class="p-nota" style="margin-top:4px">Este turno não tem foto do '+
        'conta-quilómetros nem do talão. Fica só a palavra do condutor.</p></div>';

    if((t.abast||[]).length)
      h+='<div class="cartao"><h2>Abastecimentos</h2>'+
        '<p class="p-nota" style="margin:2px 0 8px">Toque para ver onde o carro '+
        'estava a essa hora.</p>'+t.abast.map(function(a,ia){
          var prova=esteveNoPosto(t,a);
          return '<button class="item fino" data-abast="'+ia+'">'+
            '<span><span class="p">'+nf(a.valor)+' CVE · '+
            nf(a.valor/t.precoLitro,2)+' litros</span><br><span class="s">'+
            hh(a.hora)+' · '+esc(a.posto||'posto')+
            (prova ? (prova.esteve
              ? ' · a '+nf(prova.metros)+' m da bomba'
              : ' · <b style="color:var(--crit)">o carro nunca lá esteve</b>')
              : '')+'</span></span><span class="seta">›</span></button>'; }).join('')+
        '</div>';
    if(!aoVivo){
      h+='<h3>As contas</h3>'+vfLinhas(av.v);
      var d=dinheiroDe(t);
      if(d>0) h+='<div class="cartao mau"><h2>Por explicar neste turno</h2>'+
        '<div class="num" style="font-size:27px;font-weight:500;color:var(--crit);'+
        'margin-top:4px">'+nf(d)+' CVE</div></div>';
    } else h+='<div class="cartao nota"><p class="p-nota">O turno ainda não fechou. '+
      'As contas aparecem quando o condutor terminar.</p></div>';
  }

  /* ── contas ─────────────────────────────────────────── */
  /* ── todos os turnos ─────────────────────────────────── */
  /* Faltava. A lista do mapa mostra cinco; quando o patrão quer
     procurar um turno de há duas semanas, ou ver tudo o que um carro
     fez em Setembro, é aqui. Chega-se cá de todo o lado: do número
     no resumo, da linha do mês nas contas, da ficha do carro e da
     ficha do condutor. */
  else if(S.ecra==='turnos'){
    var fl=S.filtro||{};
    var lista=S.turnos.filter(function(t){
      if(!t.fim) return false;
      if(fl.carro && t.carroId!==fl.carro) return false;
      if(fl.condutor && t.condutor!==fl.condutor) return false;
      if(fl.mes){ var dd=new Date(t.inicio);
        if(dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')!==fl.mes)
          return false; }
      if(fl.so==='problemas' && !porResolver(t).length) return false;
      return true; });

    var nome='Todos os turnos';
    if(fl.mes) nome='Turnos de '+mesDe(new Date(fl.mes+'-02').getTime());
    if(fl.carro){ var cf=carroDe(fl.carro); nome='Turnos do '+(cf?cf.matricula:'carro'); }
    if(fl.condutor) nome='Turnos de '+fl.condutor;
    if(fl.so==='problemas') nome='Turnos a investigar';

    var kmT=lista.reduce(function(s,t){ return s+((t.kmFim||0)-t.kmInicio); },0);
    var cveT=lista.reduce(function(s,t){ return s+(t.totalCve||0); },0);
    var difT=lista.reduce(function(s,t){ return s+dinheiroDe(t); },0);

    h='<h1>'+esc(nome)+'</h1><p class="sub">'+lista.length+
      (lista.length===1?' turno':' turnos')+'</p>';
    if(fl.mes||fl.carro||fl.condutor||fl.so)
      h+='<button class="lig" data-f="sem-filtro" style="margin-bottom:9px">'+
        '× ver todos os turnos</button>';
    h+='<div class="tiles clic">'+
      '<div><b class="num">'+nf(kmT)+'</b><span>km</span></div>'+
      '<div><b class="num">'+nf(cveT)+'</b><span>CVE</span></div>'+
      '<div data-f="so-problemas" class="'+(difT>0?'mau':'bom')+'">'+
      '<b class="num">'+nf(difT)+'</b><span>por explicar</span></div></div>';
    h+= lista.length ? lista.map(itemTurno).join('')
      : '<div class="cartao"><div class="vazio">Nenhum turno com estas contas.</div></div>';
    /* este é um ecrã de topo: a barra de baixo fica — quem entra aqui
       pelo resumo tem de poder sair para qualquer outro lado */
  }

  /* ── definições ──────────────────────────────────────
     O preço do litro muda todos os meses, e é o número que manda em
     tudo: quantos litros cabem num abastecimento, se o talão bate
     com o valor, quanto se gasta aos 100 km. Sem o poder mudar, as
     contas de Outubro eram feitas com o preço de Setembro. */
  else if(S.ecra==='definicoes'){
    var cfg=function(id, se){ return S.r[id]!=null ? S.r[id] : se; };
    h='<h1>Definições</h1><p class="sub">O que manda nas contas de toda a '+
      'frota.</p>'+caixaAviso()+
      '<label class="campo"><span class="lb">Preço do litro (CVE)</span>'+
      '<input type="number" inputmode="decimal" step="0.01" id="e-preco"'+
      marcado('e-preco')+' value="'+esc(cfg('e-preco', S.frota.precoLitro))+'">'+
      '<span class="aj">É a ARME que o fixa, e muda todos os meses. '+
      'Mudar aqui muda as contas dos turnos novos; os antigos ficam com o preço '+
      'que tinham no dia.</span></label>'+
      '<label class="campo"><span class="lb">Nome da frota</span>'+
      '<input type="text" id="e-nomefrota"'+marcado('e-nomefrota')+' value="'+
      esc(cfg('e-nomefrota', S.frota.nome||''))+'"></label>'+
      '<button class="bt pri" data-f="guardar-defs">Guardar</button>';
    var conta=S.conta||{};
    if(Nuvem.podeCriarConta && Nuvem.podeCriarConta() && S.conta===undefined
       && !S.aPedirConta){
      S.aPedirConta=true;
      Nuvem.minhaFrota().then(function(c){ S.conta=c||null; S.aPedirConta=false;
        if(S.ecra==='definicoes' && !aEscrever()) pintar(); }); }
    var plano = !conta.plano ? '' :
      conta.plano==='fundador' ? 'Frota fundadora — sem prazo.' :
      conta.plano==='pago' ? 'Plano pago.' :
      conta.plano==='ensaio' && conta.ate ? 'Experiência grátis até '+
        new Date(conta.ate).toLocaleDateString('pt-PT',{day:'numeric',month:'long'})+
        '. Para continuar: WhatsApp +238 955 78 82.' : '';
    h+='<div class="cartao"><h2>Esta conta</h2>'+
      '<p class="p-nota" style="margin-top:5px">Está a ver como <b>'+
      esc(conta.email||DONO.email)+'</b>. Os condutores entram com o email e o código '+
      'que lhes der na ficha de cada um.</p>'+
      (plano?'<p class="p-nota" style="margin-top:6px">'+esc(plano)+'</p>':'')+
      '<button class="bt sec pq" data-f="sair" style="margin-top:10px">'+
      'Sair desta conta</button></div>';
    if(Nuvem.podeCriarConta && Nuvem.podeCriarConta() && !(Nuvem.ensaio&&Nuvem.ensaio()))
      h+='<div class="cartao"><h2>Mudar o e-mail ou o código</h2>'+
        '<p class="p-nota" style="margin:5px 0 8px">Para mudar seja o que for, '+
        'confirme primeiro o código que usa hoje.</p>'+
        '<label class="campo"><span class="lb">Código de hoje</span>'+
        '<input type="password" id="e-a-actual"'+marcado('e-a-actual')+
        ' autocomplete="current-password" value="'+esc(S.r['e-a-actual']||'')+'"></label>'+
        '<label class="campo"><span class="lb">E-mail novo <i>(deixe em branco '+
        'para manter)</i></span><input type="email" id="e-a-email"'+marcado('e-a-email')+
        ' value="'+esc(S.r['e-a-email']||'')+'"></label>'+
        '<label class="campo"><span class="lb">Código novo <i>(em branco para '+
        'manter)</i></span><input type="password" id="e-a-novo"'+marcado('e-a-novo')+
        ' autocomplete="new-password" value="'+esc(S.r['e-a-novo']||'')+'"></label>'+
        '<label class="campo"><span class="lb">Código novo, outra vez</span>'+
        '<input type="password" id="e-a-novo2"'+marcado('e-a-novo2')+
        ' autocomplete="new-password" value="'+esc(S.r['e-a-novo2']||'')+'"></label>'+
        '<button class="bt sec pq" data-f="mudar-acesso">Mudar</button></div>';
    /* Ir-se embora tem de ser tão fácil como entrar. A frota fundadora
       não se apaga por aqui (a base também recusa). */
    if(Nuvem.podeCriarConta && Nuvem.podeCriarConta() && !(Nuvem.ensaio&&Nuvem.ensaio())
       && conta.plano && conta.plano!=='fundador')
      h+='<div class="cartao"><h2>Apagar a conta</h2>'+
        '<p class="p-nota" style="margin:5px 0 8px">Apaga a frota, os carros, os '+
        'condutores e todos os turnos e fotografias. Não se desfaz.</p>'+
        '<label class="campo"><span class="lb">O seu código, para confirmar</span>'+
        '<input type="password" id="e-x-cod"'+marcado('e-x-cod')+
        ' autocomplete="current-password" value="'+esc(S.r['e-x-cod']||'')+'"></label>'+
        '<button class="bt perigo pq" data-f="apagar-conta">Apagar tudo</button></div>';
    h+='<div class="cartao"><h2>Guardar uma cópia</h2>'+
      '<p class="p-nota" style="margin-top:5px">Leva a frota e os turnos todos '+
      'num ficheiro. Vale a pena fazer isto de vez em quando.</p>'+
      '<button class="bt sec pq" data-f="copia" style="margin-top:10px">'+
      'Descarregar cópia</button></div>';
  }

  else if(S.ecra==='contas'){
    var meses={};
    S.turnos.filter(function(t){ return t.fim; }).forEach(function(t){
      var d=new Date(t.inicio), k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      meses[k]=meses[k]||{ms:t.inicio,km:0,cve:0,n:0,dif:0};
      meses[k].km+=(t.kmFim||0)-t.kmInicio; meses[k].cve+=t.totalCve||0;
      meses[k].n++; meses[k].dif+=dinheiroDe(t); });
    var ks=Object.keys(meses).sort().reverse();
    h='<h1>Contas</h1><p class="sub">O que a frota andou e o que custou.</p>';
    /* Isto era uma tabela de seis colunas. Num telemóvel ficava mais
       larga do que o ecrã, e a coluna que mais interessa — o que está
       por explicar — era a última, a que o patrão nunca via sem
       arrastar para o lado. Passa a ser um cartão por mês, que cabe. */
    h+= ks.length ? ks.map(function(k){ var m=meses[k];
        return '<button class="item mes" data-mes="'+k+'">'+
          '<span style="flex:1">'+
          '<span class="p">'+mesDe(m.ms)+'</span>'+
          '<span class="mes-nums">'+
            '<b>'+m.n+'</b><i>turnos</i>'+
            '<b>'+nf(m.km)+'</b><i>km</i>'+
            '<b>'+nf(m.cve)+'</b><i>CVE</i>'+
            '<b>'+nf(m.km?m.cve/m.km:0,2)+'</b><i>por km</i>'+
          '</span>'+
          (m.dif ? '<span class="mes-mau">'+nf(m.dif)+' CVE por explicar</span>' :
                   '<span class="mes-bom">tudo explicado</span>')+
          '</span><span class="seta">›</span></button>'; }).join('')
      : '<div class="cartao"><div class="vazio">Ainda não há contas.</div></div>';

    h+='<h3>Por viatura</h3><div class="cartao"><div class="linhas">'+
      S.frota.carros.map(function(c){
        var ts3=turnosDoCarro(c.id).filter(function(t){return t.fim;});
        var cve3=ts3.reduce(function(s,t){ return s+(t.totalCve||0); },0);
        return '<div><span class="k"><button class="lig" data-carro-lig="'+c.id+
          '" style="padding:0;font-family:var(--mono)">'+esc(c.matricula)+'</button></span>'+
          '<span class="v">'+nf(consumoDoCarro(c.id),2)+' l/100 · '+nf(cve3)+' CVE</span>'+
          '</div>'; }).join('')+'</div></div>';

    h+='<h3>Por condutor</h3><div class="cartao"><div class="linhas">'+
      S.frota.condutores.map(function(m){
        var ts4=turnosDoCondutor(m.nome).filter(function(t){return t.fim;});
        var d4=ts4.reduce(function(s,t){ return s+dinheiroDe(t); },0);
        return '<div><span class="k"><button class="lig" data-cond-nome="'+esc(m.nome)+
          '" style="padding:0">'+esc(m.nome)+'</button></span>'+
          '<span class="v"'+(d4?' style="color:var(--crit)"':'')+'>'+ts4.length+
          ' turnos · '+nf(d4)+' CVE</span></div>'; }).join('')+'</div></div>';

    h+='<button class="bt sec pq" data-f="copiar">Copiar o resumo para enviar</button>'+
      '<p class="p-nota" id="copiado"></p>';
  }

  if(S.lupa) h+='<div class="lupa" data-f="fechar-lupa">'+
    '<img src="'+S.lupa+'" alt="fotografia em grande">'+
    '<span class="lupa-x">× fechar</span></div>';
  el('ecra').innerHTML=h;
  el('nav').parentNode.hidden = !b;
  el('voltar').hidden = !S.voltarPara;
  el('sub-marca').textContent = S.sessao&&S.frota ? ' · '+S.frota.nome : '';
  pintarNav(); pintarTopo();
}

var TABS=[{id:'mapa',ic:'🗺️',nm:'Mapa'},{id:'viaturas',ic:'🚕',nm:'Viaturas'},
          {id:'condutores',ic:'👤',nm:'Condutores'},{id:'alertas',ic:'⚠️',nm:'Ver'},
          {id:'contas',ic:'📊',nm:'Contas'},{id:'definicoes',ic:'⚙️',nm:'Mais'}];
function pintarNav(){
  if(!S.sessao){ el('nav').innerHTML=''; return; }
  var nAl=S.turnos.reduce(function(s,t){ return s+porResolver(t).length; },0);
  el('nav').innerHTML=TABS.map(function(t){
    var act = S.ecra===t.id ||
      (t.id==='viaturas'&&['carro','editar-carro'].indexOf(S.ecra)>=0) ||
      (t.id==='condutores'&&['condutor','editar-cond'].indexOf(S.ecra)>=0);
    return '<button data-tab="'+t.id+'"'+(act?' aria-current="page"':'')+'>'+
      '<span class="ic">'+t.ic+'</span>'+t.nm+
      (t.id==='alertas'&&nAl?'<span class="bolha">'+nAl+'</span>':'')+'</button>';
  }).join('');
}
function pintarTopo(){
  el('dir').innerHTML = S.sessao
    ? ((/^(supabase|servidor|ligada)$/.test(Nuvem.estado()) ? ''
         : '<span class="pill" title="Sem ligação: só vê o que se passa '+
           'neste aparelho">só este aparelho</span>')+
       (emTurno().length?'<span class="pill viva"><span class="ponto"></span>'+
        emTurno().length+' em turno</span>':''))
    : '';
}

/* ════════════════════════════════════════════════════════════
   NAVEGAR E AGIR
   ════════════════════════════════════════════════════════════ */
function ir(ecra, sel, voltar){
  pararReplay();
  S.ecra=ecra; if(sel!==undefined) S.sel=sel;
  S.voltarPara = voltar===undefined ? null : voltar;
  S.r={}; S.replay=null;
  pintar();
  var m=document.querySelector('main'); if(m) m.scrollTop=0;
}
function pararReplay(){ if(cronoReplay){ clearInterval(cronoReplay); cronoReplay=null; } }

document.addEventListener('input', function(e){
  var id=e.target.id;
  if(id==='i-email') S.r.email=e.target.value;
  if(id==='i-cod') S.r.cod=e.target.value;
  /* tudo o que começa por "e-" é um campo de formulário: guarda-se à
     medida que se escreve, para nada se perder se o ecrã se repintar */
  if(id && id.indexOf('e-')===0){ S.r[id]=e.target.value;
    if(S.aviso && S.aviso.campo===id){ S.aviso=null; pinturaEmEspera=true; } }
});

document.addEventListener('click', function(e){
  var b=e.target.closest('[data-f],[data-tab],[data-turno],[data-carro],[data-cond],'+
    '[data-res],[data-carro-lig],[data-cond-nome],[data-vivo],[data-posto-mapa],'+
    '[data-tile],[data-mes],[data-turnos-de],[data-turnos-cond],[data-abast],'+
    '[data-foto],'+
    '#voltar');
  if(!b) return;
  var d=b.dataset;

  /* tocar num carro do mapa abre o cartão dele, ali mesmo; tocar
     outra vez fecha. Não tira ninguém do ecrã onde está. */
  if(d.vivo){
    S.cartao = (S.cartao===d.vivo) ? null : d.vivo;
    if(S.ecra!=='mapa') ir('mapa'); else pintar();
    return; }
  if(d.postoMapa){ S.aviso={t:'Posto de combustível', d:d.postoMapa};
    pintar(); setTimeout(function(){ S.aviso=null; pintar(); }, 3200); return; }
  if(d.foto){
    S.lupa = S.lupa===d.foto ? null : d.foto; pintar(); return; }
  if(d.tile){
    if(d.tile==='turnos') S.filtro=null;
    if(d.tile==='alertas'){ ir('alertas', null, {ecra:S.ecra, sel:S.sel}); return; }
    ir(d.tile, null, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.mes){ S.filtro={mes:d.mes}; ir('turnos', null, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.turnosDe){ S.filtro={carro:d.turnosDe};
    ir('turnos', null, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.turnosCond){ S.filtro={condutor:d.turnosCond};
    ir('turnos', null, {ecra:S.ecra, sel:S.sel}); return; }

  if(b.id==='voltar'){ var v=S.voltarPara; ir(v.ecra, v.sel, v.voltar||null); return; }
  if(d.tab){ ir(d.tab, null, null); return; }
  if(d.turno){ ir('turno', d.turno, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.carro){ ir('carro', d.carro, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.carroLig){ ir('carro', d.carroLig, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.cond){ ir('condutor', d.cond, {ecra:S.ecra, sel:S.sel}); return; }
  if(d.condNome){
    var m=S.frota.condutores.filter(function(x){ return x.nome===d.condNome; })[0];
    if(m) ir('condutor', m.id, {ecra:S.ecra, sel:S.sel});
    return; }
  if(d.abast!==undefined){
    /* levar o filme do percurso até ao momento do abastecimento */
    var tv=turnoVivo(S.sel)||S.turnos.filter(function(x){return x.id===S.sel;})[0];
    if(tv){ var aa=(tv.abast||[])[+d.abast], rr=tv.rasto||[];
      if(aa&&rr.length){
        var mp=0;
        for(var iq=0;iq<rr.length;iq++) if(rr[iq][2]<=aa.hora) mp=iq;
        if(cronoReplay){ clearInterval(cronoReplay); cronoReplay=null; }
        S.replay=Math.max(2,mp+1); pintar(); } }
    return; }
  if(d.res){
    var t=S.turnos.filter(function(x){ return x.id===d.t; })[0];
    if(t){ t.resolucoes=t.resolucoes||{};
      t.resolucoes[d.c]={r:d.res, quando:Date.now()};
      Nuvem.guardarTurno(t); pintar(); }
    return; }

  var f=d.f;
  if(f==='entrar'){
    var em=(S.r.email||'').trim().toLowerCase(), co=String(S.r.cod||'').trim();
    if(!em||!co){ S.aviso='Escreva o email e o código.'; pintar(); return; }
    S.aviso='a entrar…'; pintar();
    Nuvem.entrar(em, co).then(function(r){
      if(r.erro||r.papel!=='dono'){
        S.aviso = r.erro || 'Esta conta é de condutor, não do proprietário.';
        pintar(); return; }
      S.sessao=true; S.aviso=null; Nuvem.local('dono-sessao', true); ir('mapa');
    });
  }
  if(f==='ir-criar'){ S.aviso=null; ir('criar'); return; }
  if(f==='ir-entrar'){ S.aviso=null; ir('entrar'); return; }
  if(f==='criar'){
    var gc=function(id){ var n=el(id); return (n?n.value:(S.r[id]||'')).trim(); };
    var cn=gc('e-c-nome'), cf=gc('e-c-frota'), ce=gc('e-c-email').toLowerCase();
    var k1=gc('e-c-cod'), k2=gc('e-c-cod2');
    var mau=function(campo, d){ S.aviso={campo:campo, d:d}; pintar(); };
    if(cn.length<2) return mau('e-c-nome','Escreva o seu nome.');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ce))
      return mau('e-c-email','Este e-mail não parece estar certo.');
    if(k1.length<6) return mau('e-c-cod',
      'O código tem de ter pelo menos 6 algarismos ou letras.');
    if(k1!==k2) return mau('e-c-cod2','Os dois códigos não são iguais.');
    S.aviso='a criar a sua frota…'; pintar();
    Nuvem.criarConta({nome:cn, frota:cf, email:ce, codigo:k1}).then(function(r){
      if(r.erro){ S.aviso = /e-mail/i.test(r.erro)
          ? {campo:'e-c-email', d:r.erro} : r.erro; pintar(); return; }
      S.sessao=true; S.aviso=null; S.conta=undefined;
      Nuvem.local('dono-sessao', true); ir('mapa');
    });
    return; }
  if(f==='passo-carro'){ ir('viaturas'); setTimeout(function(){
    var bt=document.querySelector('[data-f="novo-carro"]'); if(bt) bt.click(); },0);
    return; }
  if(f==='passo-cond'){ ir('condutores'); setTimeout(function(){
    var bt=document.querySelector('[data-f="novo-cond"]'); if(bt) bt.click(); },0);
    return; }
  if(f==='copiar-acesso'){
    var mc=S.frota.condutores.filter(function(x){return x.id===S.sel;})[0];
    var alvo2=el('acesso-copiado'), txt2=mc?acessoDe(mc):'';
    var mostrar=function(){ if(alvo2){ alvo2.style.whiteSpace='pre-wrap';
      alvo2.textContent=txt2; } };
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt2).then(function(){
        if(alvo2) alvo2.textContent='Copiado. Cole numa mensagem para ele.';
      }).catch(mostrar);
    else mostrar();
    return; }
  if(f==='mudar-acesso'){
    var ga=function(id){ var n=el(id); return (n?n.value:(S.r[id]||'')).trim(); };
    var act=ga('e-a-actual'), ne=ga('e-a-email').toLowerCase();
    var n1=ga('e-a-novo'), n2=ga('e-a-novo2');
    var mau2=function(campo, d){ S.aviso={campo:campo, d:d}; pintar(); };
    if(!act) return mau2('e-a-actual','Escreva o código que usa hoje.');
    if(!ne && !n1) return mau2('e-a-email','Escreva o e-mail novo, o código novo, ou os dois.');
    if(ne && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ne))
      return mau2('e-a-email','Este e-mail não parece estar certo.');
    if(n1 && n1.length<6) return mau2('e-a-novo',
      'O código novo tem de ter pelo menos 6 algarismos ou letras.');
    if(n1!==n2) return mau2('e-a-novo2','Os dois códigos novos não são iguais.');
    S.aviso='a mudar…'; pintar();
    Nuvem.mudarAcesso(act, ne, n1).then(function(r){
      if(!r || r.erro){ S.aviso={campo:/actual/i.test((r&&r.erro)||'')?'e-a-actual':'e-a-email',
        d:(r&&r.erro)||'Não foi possível mudar.'}; pintar(); return; }
      S.r={}; S.conta=undefined;
      S.aviso={d:'Mudado. Da próxima vez entre com '+(r.email||ne)+
        (n1?' e o código novo.':'.')};
      pintar(); });
    return; }
  if(f==='apagar-conta'){
    var xn=el('e-x-cod'), xc=(xn?xn.value:(S.r['e-x-cod']||'')).trim();
    if(!xc){ S.aviso={campo:'e-x-cod', d:'Escreva o seu código para confirmar.'};
      pintar(); return; }
    if(!confirm('Apagar a frota e tudo o que está lá dentro? Não se desfaz.')) return;
    S.aviso='a apagar…'; pintar();
    Nuvem.apagarConta(xc).then(function(r){
      if(!r || r.erro){ S.aviso={campo:'e-x-cod', d:(r&&r.erro)||'Não foi possível apagar.'};
        pintar(); return; }
      S.sessao=false; S.conta=undefined; Nuvem.local('dono-sessao', false);
      ir('entrar'); S.aviso={d:'A conta foi apagada. Obrigado por ter experimentado.'};
      pintar(); });
    return; }
  if(f==='fechar-lupa'){ S.lupa=null; pintar(); return; }
  if(f==='fechar-cartao'){ S.cartao=null; pintar(); return; }
  if(f==='guardar-defs'){
    var vd=function(id){ var n=el(id); return n?n.value:(S.r[id]||''); };
    var pr=+String(vd('e-preco')).replace(',','.');
    if(!(pr>0&&pr<1000)){ S.aviso={campo:'e-preco',
      d:'Escreva o preço do litro em CVE. Anda pelos 140.'}; pintar(); return; }
    S.frota.precoLitro=Math.round(pr*100)/100;
    S.frota.nome=vd('e-nomefrota').trim()||'A minha frota';
    S.r={}; S.aviso={d:'Guardado. Os turnos novos passam a contar a '+
      nf(S.frota.precoLitro,2)+' CVE por litro.'};
    guardar(); pintar(); return; }
  if(f==='sair'){
    if(!confirm('Sair desta conta neste aparelho?')) return;
    Nuvem.sair();
    S.sessao=false; S.r={}; S.aviso=null; S.conta=undefined;
    Nuvem.local('dono-sessao', false);
    ir('entrar'); return; }
  if(f==='copia'){
    /* Uma cópia de tudo, num ficheiro. Descarregar faz-se de duas
       maneiras conforme o sítio: servida por um servidor é um link
       normal; dentro do Claude é preciso pedir ao próprio Claude,
       que é quem manda no que sai para o telemóvel. */
    var tudo={ quando:new Date().toISOString(), frota:S.frota, turnos:S.turnos };
    var texto=JSON.stringify(tudo,null,1);
    var nome='fleetcv-'+new Date().toISOString().slice(0,10)+'.json';
    var localmente=function(){
      var a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([texto],{type:'application/json'}));
      a.download=nome; a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000); };
    var feito=function(){ S.aviso={d:'Cópia guardada. Ponha-a num sítio seguro — '+
      'é a única coisa que a salva se este telemóvel se perder.'}; pintar(); };
    var falhou=function(){ S.aviso={d:'Não foi possível descarregar a cópia aqui. '+
      'Abra a aplicação no computador e tente outra vez.'}; pintar(); };
    try{
      if(window.claude && claude.use)
        claude.use('downloads').then(function(d){
          if(!d){ try{ localmente(); feito(); }catch(e){ falhou(); } return; }
          d.save({filename:nome, data:texto}).then(feito).catch(falhou);
        }).catch(function(){ try{ localmente(); feito(); }catch(e){ falhou(); } });
      else { localmente(); feito(); }
    }catch(e){ falhou(); }
    return; }
  if(f==='fechar-turno'){
    var tf=turnoVivo(d.t);
    if(!tf) return;
    if(!confirm('Fechar o turno de '+tf.condutor+' no '+tf.matricula+'?\n\n'+
      'Os quilómetros contam pelo GPS, porque não há leitura final do '+
      'conta-quilómetros. Fica registado que foi o patrão a fechar.')) return;
    var kmG=kmDoTurno(tf);
    tf.fim=tf.momento||Date.now();
    tf.kmFim=tf.kmInicio+Math.round(kmG);
    tf.kmGps=+kmG.toFixed(1);
    tf.fotos=false; tf.fechadoPeloDono=true;
    tf.alertas=(tf.alertas||[]).concat([{c:'A21',n:'AVISO',
      d:'Turno fechado pelo proprietário — o condutor não o fechou'}]);
    var cc=carroDe(tf.carroId); if(cc){ cc.km=tf.kmFim; guardar(); }
    Nuvem.guardarTurno(tf);
    Nuvem.fecharTurnoDeOutro(tf.id);
    S.cartao=null; S.aviso={d:'Turno fechado. Ficou marcado como fecho do patrão.'};
    pintar(); return; }
  if(f==='sem-filtro'){ S.filtro=null; pintar(); return; }
  if(f==='so-problemas'){
    S.filtro=S.filtro||{};
    S.filtro.so = S.filtro.so==='problemas' ? null : 'problemas';
    pintar(); return; }
  if(f==='ir-alertas') ir('alertas');
  if(f==='novo-carro'){ S.r={}; ir('editar-carro', null, {ecra:'viaturas'}); }
  if(f==='editar-carro'){ S.r={}; ir('editar-carro', S.sel, {ecra:'carro', sel:S.sel}); }
  if(f==='guardar-carro'){
    var v=function(id){ var n=el(id); return n?n.value:(S.r[id]||''); };
    /* Só se recusa uma coisa: duas viaturas com a mesma matrícula,
       porque depois ninguém sabe de quem são os turnos. Tudo o resto
       aceita-se como vier — quem está a preencher sabe o que tem. */
    var mat=verMatricula(v('e-mat'), S.sel);
    if(mat.erro){ S.aviso={campo:'e-mat', d:mat.erro}; pintar(); return; }
    var c=S.sel?carroDe(S.sel):null, eNovo=!c;
    if(!c){ c={id:uid('c'), estado:'ACTIVO'}; S.frota.carros=S.frota.carros.concat([c]); }
    var km=+v('e-km')||0, dep=+v('e-dep')||45;
    if(!eNovo && km<c.km-1 && !confirm('O conta-quilómetros vai para trás: de '+
      nf(c.km)+' para '+nf(km)+' km. Tem a certeza?')) return;
    c.matricula=mat.ok || ('Carro '+(S.frota.carros.length));
    c.marca=v('e-marca').trim(); c.modelo=v('e-modelo').trim();
    c.km=km; c.deposito=dep;
    c.proxOleoKm=+v('e-oleo')||km+5000;
    S.r={}; S.aviso=null;
    guardar(); ir('carro', c.id, {ecra:'viaturas'});
  }
  if(f==='parar-carro'){
    var cc=carroDe(S.sel);
    cc.estado = cc.estado==='ACTIVO' ? 'PARADO' : 'ACTIVO';
    guardar(); pintar();
  }
  if(f==='apagar-carro'){
    if(!confirm('Apagar esta viatura leva os turnos dela. Tem a certeza?')) return;
    S.turnos.forEach(function(t){ if(t.carroId===S.sel) Nuvem.apagarTurno(t.id); });
    S.turnos=S.turnos.filter(function(t){ return t.carroId!==S.sel; });
    S.frota.carros=S.frota.carros.filter(function(c){ return c.id!==S.sel; });
    guardar(); ir('viaturas');
  }
  if(f==='oleo-feito'){
    var co2=carroDe(S.sel); co2.proxOleoKm=co2.km+5000; guardar(); pintar();
  }
  if(f==='novo-cond'){ S.r={};
    S.codigoNovo=String(Math.floor(1000+Math.random()*9000));
    ir('editar-cond', null, {ecra:'condutores'}); }
  if(f==='editar-cond'){ S.r={}; ir('editar-cond', S.sel, {ecra:'condutor', sel:S.sel}); }
  if(f==='guardar-cond'){
    var g=function(id){ var n=el(id); return n?n.value:(S.r[id]||''); };
    var nome=g('e-nome').trim(), mail=g('e-email2').trim().toLowerCase();
    var cod=g('e-codigo').trim();
    /* O email e o código não são capricho: são a chave com que este
       condutor entra. Sem eles não entra, e mais vale dizer já. */
    if(!mail || !cod){
      S.aviso={campo:mail?'e-codigo':'e-email2',
        d:'Faltam o email e o código — é com eles que o condutor entra na '+
          'aplicação dele.'}; pintar(); return; }
    var jaTem=(S.frota.condutores||[]).filter(function(x){
      return x.id!==S.sel && String(x.email||'').toLowerCase()===mail; })[0];
    if(jaTem){ S.aviso={campo:'e-email2',
      d:'Já existe um condutor com este email ('+jaTem.nome+'). Dois condutores '+
        'com o mesmo email não dava para saber quem entrou.'};
      pintar(); return; }
    var tel=g('e-tel').trim(), qual=S.sel;
    /* Entra-se só com e-mail e código, sem dizer de que frota se é —
       por isso um e-mail não pode estar em duas. Pergunta-se à base
       antes de gravar, para o aviso aparecer aqui e não o condutor
       ficar à porta sem saber porquê. */
    Nuvem.emailLivre(mail).then(function(livre){
      if(livre===false){ S.aviso={campo:'e-email2',
        d:'Este e-mail já está a ser usado noutra frota do FleetCV. '+
          'Use outro e-mail para este condutor.'}; pintar(); return; }
      var m2=qual?S.frota.condutores.filter(function(x){return x.id===qual;})[0]:null;
      var antes=m2?m2.nome:null, eNovo2=!m2;
      if(!m2){ m2={id:uid('m'), estado:'ACTIVO'};
        S.frota.condutores=S.frota.condutores.concat([m2]); }
      if(!nome) nome='Condutor '+(S.frota.condutores.length);
      m2.nome=nome; m2.email=mail; m2.telefone=tel;
      m2.codigo=cod;
      S.r={}; S.aviso=null;
      if(eNovo2) S.novoCond=m2.id;
      // se o nome mudou, os turnos antigos continuam a ser dele
      if(antes&&antes!==m2.nome)
        S.turnos.forEach(function(t){ if(t.condutor===antes){
          t.condutor=m2.nome; Nuvem.guardarTurno(t); } });
      guardar(); ir('condutor', m2.id, {ecra:'condutores'});
    });
  }
  if(f==='parar-cond'){
    var m3=S.frota.condutores.filter(function(x){return x.id===S.sel;})[0];
    m3.estado = m3.estado==='ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    guardar(); pintar();
  }
  if(f==='apagar-cond'){
    if(!confirm('Apagar este condutor leva os turnos dele. Tem a certeza?')) return;
    var m4=S.frota.condutores.filter(function(x){return x.id===S.sel;})[0];
    S.turnos.forEach(function(t){ if(t.condutor===m4.nome) Nuvem.apagarTurno(t.id); });
    S.turnos=S.turnos.filter(function(t){ return t.condutor!==m4.nome; });
    S.frota.condutores=S.frota.condutores.filter(function(x){ return x.id!==S.sel; });
    guardar(); ir('condutores');
  }
  if(f==='replay'){
    var t2=turnoVivo(S.sel)||S.turnos.filter(function(x){return x.id===S.sel;})[0];
    if(!t2) return;
    if(cronoReplay){ pararReplay(); S.replay=null; pintar(); return; }
    S.replay=2;
    cronoReplay=setInterval(function(){
      S.replay += Math.max(2, Math.round(t2.rasto.length/90));
      if(S.replay>=t2.rasto.length){ S.replay=t2.rasto.length; pararReplay(); }
      pintar();
    }, 70);
    pintar();
  }
  if(f==='copiar'){
    var linhas=['FleetCV · '+S.frota.nome];
    S.frota.carros.forEach(function(c){
      var ts=turnosDoCarro(c.id).filter(function(t){return t.fim;});
      linhas.push(c.matricula+': '+ts.length+' turnos · '+
        nf(ts.reduce(function(s,t){return s+(t.totalCve||0);},0))+' CVE · '+
        nf(consumoDoCarro(c.id),2)+' l/100');
    });
    var tot=S.turnos.reduce(function(s,t){ return s+dinheiroDe(t); },0);
    linhas.push('Por explicar: '+nf(tot)+' CVE');
    var txt=linhas.join('\n');
    var alvo=el('copiado');
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt).then(function(){
        if(alvo) alvo.textContent='Copiado. Cole no WhatsApp.';
      }).catch(function(){ if(alvo) alvo.textContent=txt; });
    else if(alvo) alvo.textContent=txt;
  }
});

/* ════════════════════════════════════════════════════════════
   ARRANQUE
   ════════════════════════════════════════════════════════════ */
/* Liga-se à nuvem e fica à escuta. Tudo o que um condutor fizer
   — abrir turno, andar, abastecer, fechar — chega aqui sozinho. */
S.sessao = !!Nuvem.local('dono-sessao');
/* No ensaio entra-se logo: quem está a experimentar quer ver a frota,
   não quer adivinhar um código. */
if(!S.sessao && Nuvem.ensaio && Nuvem.ensaio()) S.sessao=true;
S.ecra = S.sessao ? 'mapa' : 'entrar';
/* quem veio da página principal pelo "Criar conta" cai logo no ecrã
   de criar, e não no de entrar */
try{
  if(!S.sessao && localStorage.getItem('fleetcv-quero-criar')) S.ecra='criar';
  localStorage.removeItem('fleetcv-quero-criar');
}catch(e){}

Nuvem.aoMudar(function(){
  var d=Nuvem.dados();
  if(d.frota) S.frota=d.frota;
  S.turnos=d.turnos||[];
  S.vivos=d.vivos||[];
  if(S.cartao && !turnoVivo(S.cartao)) S.cartao=null;
  /* O telemóvel lembrava-se de ter entrado, mas a base diz que não há
     sessão (saiu noutro sítio, ou a sessão caducou). Mostrar a frota
     vazia era pior do que pedir o código outra vez. */
  var est=Nuvem.estado();
  if(S.sessao && (est==='supabase-por-entrar'||est==='servidor-por-entrar')
     && !(Nuvem.ensaio&&Nuvem.ensaio())){
    S.sessao=false; Nuvem.local('dono-sessao', false);
    if(S.ecra!=='criar'){ S.ecra='entrar'; pintar(); return; } }
  /* o prazo da experiência, lido uma vez por sessão */
  if(S.sessao && est==='supabase' && S.conta===undefined && !S.aPedirConta){
    S.aPedirConta=true;
    Nuvem.minhaFrota().then(function(c){ S.conta=c||null; S.aPedirConta=false;
      pintarSePuder(); }); }
  if(S.ecra!=='entrar' && S.ecra!=='criar') pintarSePuder(); else pintarTopo();
});
Nuvem.arrancar({
  papel: 'dono',
  exemplos: function(f){ return turnosDeExemplo(f); }
});
pintar();
tic=setInterval(function(){
  if(S.ecra==='turno'&&turnoVivo(S.sel)) pintar(); }, 1000);
}
