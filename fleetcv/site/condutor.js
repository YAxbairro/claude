function appCondutor(){

"use strict";

/* ─── a frota ────────────────────────────────────────────
   Não está escrita aqui: é o patrão que a define no painel dele, e
   chega a este telemóvel pela nuvem. Se o patrão acrescentar um carro
   às três da tarde, ele aparece nesta lista sem ninguém reinstalar
   nada. Estes valores são só o que se mostra enquanto a nuvem não
   responde. */
var FROTA = { precoLitro:145, carros:[], condutores:[] };

/* Os postos são os verdadeiros do OpenStreetMap (ver mapa_praia). */
var POSTOS = MAPA_PRAIA.postos;
var LIM = {gapKm:3, kmMax:500, gapAbsurdo:2000, precisaoMax:50, velMax:180,
           divLitros:3};

var S = {ecra:'entrar', eu:null, carro:null, turno:null, turnos:[],
         gps:{estado:'desligado', precisao:null, vel:0, velAlvo:0, porque:null, autoriz:null}, bateria:null,
         foto:null, r:{}, aviso:null, simular:false, verTurno:null,
         avisoEcraVisto:!!Nuvem.local('aviso-ecra')};
var vigia=null, tic=null, pulso=null, cronoSim=null, ultima=null, vista={}, primeiroTiro=null;
var salvo=null;
var medida={W:400,H:620};

/* ─── utilitários ────────────────────────────────────────── */
function nf(v,d){ d=d||0; var p=Math.abs(Number(v)||0).toFixed(d).split('.');
  p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return (Number(v)<0?'−':'')+p.join(','); }
function hms(s){ s=Math.max(0,Math.floor(s));
  return String(Math.floor(s/3600)).padStart(2,'0')+':'+
         String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function hh(ms){ var d=new Date(ms);
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function dt(ms){ var d=new Date(ms), a=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  m=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return a[d.getDay()]+' '+d.getDate()+' '+m[d.getMonth()]; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function el(id){ return document.getElementById(id); }
function dist(a,b,c,d){ var R=6371000,g=Math.PI/180;
  return 2*R*Math.asin(Math.sqrt(Math.pow(Math.sin((c-a)*g/2),2)+
    Math.cos(a*g)*Math.cos(c*g)*Math.pow(Math.sin((d-b)*g/2),2))); }
function kmRasto(p){ var m=0,a=null;
  for(var i=0;i<(p||[]).length;i++){ var x=p[i];
    if(x[3]!=null&&x[3]>LIM.precisaoMax) continue;
    if(a){ var s=(x[2]-a[2])/1000, d=dist(a[0],a[1],x[0],x[1]);
      if(s>0&&(d/s)*3.6<=LIM.velMax) m+=d; }
    a=x; }
  return m/1000; }
/* Guarda-se sempre no próprio telemóvel — é o que segura o turno se
   a rede cair ou a bateria acabar — e a nuvem leva-o ao patrão. */
function guardar(){
  Nuvem.local('condutor', {eu:S.eu&&S.eu.id, carro:S.carro&&S.carro.id,
    turno:S.turno, turnos:S.turnos.slice(0,20)});
  if(S.turno&&!S.turno.fim)
    Nuvem.posicao(S.turno, {kmGps:kmRasto(S.turno.rasto), bateria:S.bateria,
      onde:ondeEstou()});
}
function carregar(){ return Nuvem.local('condutor'); }
function ondeEstou(){
  var u=S.ultimaPos||(S.turno&&S.turno.rasto.length
    ? S.turno.rasto[S.turno.rasto.length-1] : null);
  return u?bairroDe(u[0],u[1]):null; }

/* ─── GPS ────────────────────────────────────────────────── */
/* Três coisas diferentes fazem o GPS "não funcionar", e a mensagem
   tem de dizer qual delas é, senão o condutor fica preso no ecrã:
     1) a página está dentro de uma moldura (é assim que o Claude a
        mostra) e o telemóvel nem chega a perguntar;
     2) o condutor recusou, ou a localização do telemóvel está
        desligada;
     3) está dentro de um prédio e ainda não apanhou satélites.    */
function emMoldura(){ try{ return window.self!==window.top; }catch(e){ return true; } }

function verAutorizacao(){
  if(!navigator.permissions||!navigator.permissions.query) return;
  try{ navigator.permissions.query({name:'geolocation'}).then(function(a){
    S.gps.autoriz=a.state;
    a.onchange=function(){ S.gps.autoriz=a.state;
      if(a.state==='granted'&&S.gps.estado!=='ligado') ligarGps(); else pintarTopo(); };
  }).catch(function(){}); }catch(e){}
}

function ligarGps(){
  if(S.simular) return;
  if(!navigator.geolocation){
    S.gps.estado='indisponivel';
    S.gps.porque='Este telemóvel não sabe dar a localização ao navegador.';
    pintar(); return; }
  if(!window.isSecureContext){
    S.gps.estado='indisponivel';
    S.gps.porque='A página tem de abrir em https:// para o telemóvel dar a localização.';
    pintar(); return; }
  if(vigia!=null) return;
  S.gps.estado='a-procurar'; S.gps.porque=null; verAutorizacao(); pintar();
  /* O maximumAge é o que separa isto do Waze. Com 4000, estávamos a
     dizer ao telemóvel "uma posição de há quatro segundos serve" — e
     ele obedecia, devolvendo a mesma leitura vezes sem conta. O
     ponteiro andava sempre atrás do carro e a velocidade chegava
     tarde. A zero, ele é obrigado a ir buscar uma nova, e um Android
     dá cerca de uma por segundo. */
  var op={enableHighAccuracy:true, maximumAge:0, timeout:30000};
  /* um primeiro tiro rápido e grosseiro, para não ficar parado em
     "a procurar" enquanto o GPS fino não acerta */
  try{ navigator.geolocation.getCurrentPosition(aceitarGps, falhouGps,
    {enableHighAccuracy:false, maximumAge:60000, timeout:8000}); }catch(e){}
  try{ vigia=navigator.geolocation.watchPosition(aceitarGps, falhouGps, op); }
  catch(e){ falhouGps({code:2}); }
  primeiroTiro=setTimeout(function(){
    if(S.gps.estado==='a-procurar'&&!S.gps.porque){
      S.gps.porque='Já vão '+15+' segundos à procura. À janela ou na rua costuma apanhar '+
        'em poucos segundos.'; pintar(); } }, 15000);
}

function aceitarGps(pos){
  var c=pos.coords, antes=S.gps.estado;
  if(primeiroTiro){ clearTimeout(primeiroTiro); primeiroTiro=null; }
  S.gps.estado='ligado'; S.gps.porque=null; S.gps.precisao=Math.round(c.accuracy);
  /* O telemóvel mede a velocidade pelo desvio do sinal dos satélites,
     não pela distância entre dois pontos, e entrega-a já limpa. Alisá-la
     outra vez, como se fazia aqui, era só atrasá-la — e era por isso que
     o número parecia estar sempre a chegar tarde. Agora usa-se como vem.
     A conta à mão, de ponto a ponto, essa salta muito; só essa é alisada,
     e só serve para telemóveis que não dão a velocidade. */
  var doTelemovel = c.speed!=null && c.speed>=0;
  var kmh = doTelemovel ? c.speed*3.6 : calcVel(pos);
  S.gps.velAlvo = doTelemovel ? kmh
                : (S.gps.velAlvo||0)*0.35 + kmh*0.65;
  if(S.turno&&!S.turno.fim&&c.accuracy<=120)
    S.turno.rasto.push([+c.latitude.toFixed(6), +c.longitude.toFixed(6),
      pos.timestamp, Math.round(c.accuracy), Math.round(kmh)]);
  S.ultimaPos=[c.latitude, c.longitude];
  if(S.turno&&!S.turno.fim)
    Nuvem.posicao(S.turno, {kmGps:kmRasto(S.turno.rasto), bateria:S.bateria,
      onde:ondeEstou()});
  if(S.ecra==='gps'&&antes!=='ligado') pintar();
  else if(S.ecra==='volante') pintar(); else pintarTopo();
}

function falhouGps(e){
  var moldura=emMoldura();
  if(e.code===3){
    if(S.gps.estado!=='ligado'){ S.gps.estado='a-procurar';
      S.gps.porque='O telemóvel ainda não apanhou satélites. Dentro de um prédio '+
        'demora; à janela ou na rua apanha em segundos.'; }
  } else if(e.code===1){
    S.gps.estado='recusado';
    /* Dentro do Claude o GPS não funciona, e não há botão nenhum que
       resolva: a página é sempre mostrada dentro de uma moldura e o
       telemóvel não deixa pedir localização de lá. Mandar o condutor
       procurar um botão que não existe é pior do que dizer a verdade. */
    S.gps.porque = moldura
      ? 'O telemóvel não deixa pedir a localização a uma página mostrada dentro '+
        'do Claude, e não há como contornar isso aqui. Esta versão serve para '+
        'experimentar: pode abrir turno, fotografar o quadrante, abastecer e '+
        'fechar — só o caminho no mapa é que não fica gravado. Para gravar o '+
        'caminho, a aplicação tem de estar instalada num endereço seu.'
      : (S.gps.autoriz==='denied'
        ? 'A localização está bloqueada para este site. No navegador: cadeado ao lado '+
          'do endereço → Localização → Permitir, e recarregue a página.'
        : 'Não foi dada autorização. Carregue outra vez em "Ligar o GPS" e responda '+
          '"Permitir" à pergunta do telemóvel.');
  } else {
    S.gps.estado='sem-sinal';
    S.gps.porque='O telemóvel não conseguiu a posição. Veja se a localização está '+
      'ligada nas definições do telemóvel (não só no navegador).';
  }
  if(vigia!=null&&e.code===1){ navigator.geolocation.clearWatch(vigia); vigia=null; }
  pintar();
}
function calcVel(pos){
  var a={lat:pos.coords.latitude, lon:pos.coords.longitude, t:pos.timestamp}, v=0;
  if(ultima){ var s=(a.t-ultima.t)/1000;
    if(s>0.5) v=Math.min(dist(ultima.lat,ultima.lon,a.lat,a.lon)/s*3.6, LIM.velMax); }
  ultima=a; return v;
}
function desligarGps(){ if(vigia!=null){ navigator.geolocation.clearWatch(vigia); vigia=null; }
  if(primeiroTiro){ clearTimeout(primeiroTiro); primeiroTiro=null; }
  if(cronoSim){ clearInterval(cronoSim); cronoSim=null; }
  S.gps.estado='desligado'; S.gps.vel=0; S.gps.porque=null; ultima=null; vista={}; }
function bateria(){ if(!navigator.getBattery) return;
  navigator.getBattery().then(function(b){ S.bateria=Math.round(b.level*100);
    b.addEventListener('levelchange',function(){ S.bateria=Math.round(b.level*100);
      pintarTopo(); }); pintarTopo(); }).catch(function(){}); }

/* ─── experimentar sem conduzir ──────────────────────────── */
/* O carro do ensaio anda pelas ruas verdadeiras da Praia e vira nos
   cruzamentos, para o condutor ver ao certo o que vai ver na rua. */
function simular(){
  var r=Date.now()%99991;
  var rnd=function(){ r=(r*1103515245+12345)%2147483648; return r/2147483648; };
  var caminho=percursoPorRuas(rnd, 1200, 28);
  if(caminho.length<10){ caminho=[]; var la=14.9177, lo=-23.5092;
    for(var z=0;z<300;z++){ la+=0.00012; lo+=0.00009*(z%40<20?1:-1);
      caminho.push([la,lo]); } }
  var n=0;
  cronoSim=setInterval(function(){
    if(!S.turno||S.turno.fim){ clearInterval(cronoSim); cronoSim=null; return; }
    for(var q=0;q<2;q++){
      var p=caminho[n%caminho.length];
      var vel=(n%23<3)?0:(20+Math.round(rnd()*30));   /* semáforos e paragens */
      S.turno.rasto.push([+p[0].toFixed(6), +p[1].toFixed(6),
        S.turno.inicio+n*4000, 8, vel]);
      S.gps.velAlvo=vel; S.ultimaPos=[p[0],p[1]]; n++;
    }
    S.gps.estado='ligado'; S.gps.precisao=8;
    Nuvem.posicao(S.turno, {kmGps:kmRasto(S.turno.rasto), bateria:S.bateria,
      onde:ondeEstou()});
    if(S.ecra==='volante') pintar();
  }, 420);
}

/* ─── foto ───────────────────────────────────────────────── */
/* A fotografia tem de chegar ao patrão e tem de caber. Uma foto de
   telemóvel são uns megabytes; encolhe-se, e se mesmo assim ficar
   pesada baixa-se a qualidade até caber — o que importa é ler os
   números do quadrante ou do talão, não a beleza da imagem. E os
   dados são pagos pelo condutor. */
var FOTO_MAX=110000;
function lerFoto(f,cb){
  var fr=new FileReader();
  fr.onload=function(){
    var im=new Image();
    im.onload=function(){
      try{
        var k=Math.min(1, 620/Math.max(im.width,im.height));
        var cv=document.createElement('canvas');
        cv.width=Math.round(im.width*k); cv.height=Math.round(im.height*k);
        cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
        var q=0.62, d=cv.toDataURL('image/jpeg',q);
        while(d.length>FOTO_MAX && q>0.28){ q-=0.1; d=cv.toDataURL('image/jpeg',q); }
        if(d.length>FOTO_MAX){
          var cv2=document.createElement('canvas');
          cv2.width=Math.round(cv.width*0.7); cv2.height=Math.round(cv.height*0.7);
          cv2.getContext('2d').drawImage(cv,0,0,cv2.width,cv2.height);
          d=cv2.toDataURL('image/jpeg',0.5);
        }
        cb(d);
      }catch(e){ cb(fr.result); } };
    im.onerror=function(){ cb(fr.result); };
    im.src=fr.result; };
  fr.readAsDataURL(f); }

/* ─── contas do turno ────────────────────────────────────── */
function contas(t){
  var v=[], kmQ=t.kmFim-t.kmInicio, kmG=kmRasto(t.rasto), dif=0;
  v.push({ok:true, t1:'Quilometragem registada',
    t2:nf(t.kmInicio)+' → '+nf(t.kmFim), vl:nf(kmQ)+' km'});
  if(t.gap>LIM.gapKm){
    v.push({ok:false, t1:'O carro andou fora do turno',
      t2:'estava '+nf(t.gap)+' km à frente de onde ficou', vl:'+'+nf(t.gap)+' km'});
    dif += Math.round(t.gap*7.5/100*FROTA.precoLitro);
  }
  if(t.rasto.length>5){
    var d=kmQ>0?(kmQ-kmG)/kmQ*100:0;
    var bate=Math.abs(d)<15;
    v.push({ok:bate, t1:'O GPS bate com o conta-quilómetros',
      t2:bate?'diferença de '+nf(d,1)+'%, o normal':
        nf(kmQ-kmG)+' km andados sem se saber para onde', vl:nf(kmG,1)+' km'});
  } else v.push({ok:false, t1:'Percurso gravado', t2:'o GPS não esteve ligado', vl:'—'});

  t.abast.forEach(function(a){
    var litros=a.valor/FROTA.precoLitro;
    v.push({ok:!!a.foto, t1:'Talão fotografado',
      t2:esc(a.posto)+' · '+hh(a.hora), vl:nf(a.valor)+' CVE'});
    v.push({ok:litros<=t.deposito*1.05, t1:'Os litros cabem no depósito',
      t2:nf(litros,2)+' num depósito de '+nf(t.deposito), vl:nf(litros,2)+' l'});
    if(a.litrosTalao){
      var dd=Math.abs(a.litrosTalao-litros)/litros*100, b2=dd<=LIM.divLitros;
      var noTalao=Math.round(a.litrosTalao*FROTA.precoLitro);
      v.push({ok:b2, t1:'O que escreveu bate com o talão',
        t2:b2?'escreveu '+nf(a.valor)+' CVE e o talão diz o mesmo'
             :'escreveu '+nf(a.valor)+' CVE · o talão dá '+nf(noTalao)+' CVE',
        vl:b2?'bate':nf(a.valor-noTalao)+' CVE'});
      if(!b2) dif += a.valor-noTalao;
    }
  });
  return {v:v, dif:dif, kmQ:kmQ, kmG:kmG};
}

/* ─── mapa ───────────────────────────────────────────────── */
/* O desenho está em desenharMapa(); aqui só se decide o que
   mostrar ao condutor enquanto conduz. */
function mapa(rasto, seguir){
  var pts=(rasto||[]).filter(function(p){ return p[3]==null||p[3]<=LIM.precisaoMax; });
  var aviso=null;
  if(!pts.length) aviso = S.gps.estado==='recusado'||S.gps.estado==='indisponivel'
    ? 'sem GPS — conta pelo quadrante' : 'à espera do GPS…';
  return desenharMapa({
    pts:pts, W:medida.W, H:medida.H, pad:26, seguir:seguir!==false, vista:vista,
    minSpan:0.0125, minSpanVazio:0.05, pulsar:true, aviso:aviso, margemBaixo:62,
    centro: S.ultimaPos || [14.9195,-23.5087],
    abast: (S.turno&&S.turno.abast||[]).map(function(a){
      return {lat:a.lat, lon:a.lon, posto:a.posto}; }),
    rotulo:'O caminho do carro no mapa da Praia'});
}
/* Entre uma leitura e a seguinte o ecrã ficava parado. Isto faz o
   número e o arco perseguirem a última leitura dez vezes por segundo,
   mexendo só esses dois pedaços do ecrã — redesenhar o mapa inteiro a
   este ritmo punha um telemóvel barato de joelhos. */
function pulsarVel(){
  var alvo=S.gps.velAlvo||0;
  S.gps.vel += (alvo - S.gps.vel)*0.28;
  if(Math.abs(alvo-S.gps.vel)<0.25) S.gps.vel=alvo;
  var n=el('v-num'); if(n) n.textContent=Math.round(S.gps.vel);
  var a=el('v-arco');
  if(a){
    var C=Math.PI*22, f=Math.max(0,Math.min(S.gps.vel/120,1));
    a.setAttribute('stroke-dashoffset',(C*(1-f)).toFixed(1));
    a.setAttribute('stroke', S.gps.vel>90?'var(--crit)'
      :(S.gps.vel>70?'var(--warn)':'var(--accent)'));
  }
}
function arco(v){
  var f=Math.max(0,Math.min(v/120,1)), C=Math.PI*22;
  var cor=v>90?'var(--crit)':(v>70?'var(--warn)':'var(--accent)');
  return '<svg class="arco" viewBox="0 0 52 30" aria-hidden="true">'+
    '<path d="M4 26 A22 22 0 0 1 48 26" fill="none" stroke="var(--line)" '+
    'stroke-width="4.5" stroke-linecap="round" opacity=".5"/>'+
    '<path id="v-arco" d="M4 26 A22 22 0 0 1 48 26" fill="none" stroke="'+cor+'" '+
    'stroke-width="4.5" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" '+
    'stroke-dashoffset="'+(C*(1-f)).toFixed(1)+
    '" style="transition:stroke-dashoffset .12s linear, stroke .3s"/></svg>';
}
function caixaFoto(t,d){
  return S.foto
    ? '<label class="foto feita"><img src="'+S.foto+'" alt="'+esc(t)+'">'+
      '<span class="re">Repetir</span><input type="file" accept="image/*" '+
      'capture="environment" id="ff"></label>'
    : '<label class="foto"><span class="ic">📷</span><span class="t">'+esc(t)+'</span>'+
      '<span class="t2">'+esc(d)+'</span><input type="file" accept="image/*" '+
      'capture="environment" id="ff"></label>';
}
function postosPerto(lat,lon,n){
  if(lat==null) return [];
  return POSTOS.map(function(p){ return {p:p, m:Math.round(dist(lat,lon,p.lat,p.lon))}; })
    .sort(function(a,b){ return a.m-b.m; }).slice(0,n||4);
}

/* ═══ OS ECRÃS ═══════════════════════════════════════════ */
function ajustarMapa(){
  var cx=document.querySelector('.volante'); if(!cx) return;
  var W=Math.round(cx.clientWidth), H=Math.round(cx.clientHeight);
  if(W<60||H<60) return;
  if(Math.abs(W-medida.W)<6&&Math.abs(H-medida.H)<6) return;
  medida={W:W, H:H}; vista={};
  var sv=cx.querySelector('.mapa');
  if(sv) sv.outerHTML=mapa(S.turno?S.turno.rasto:[], true);
}
/* A nuvem traz novidades a toda a hora. Cada uma repintava o ecrã, e
   quem estivesse a escrever os quilómetros via o campo esvaziar-se
   debaixo dos dedos. Agora a novidade espera pelo dedo sair. */
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

function pintarTopo(){
  var p=[];
  if(S.ecra!=='entrar'){
    var r={ligado:'GPS ligado','a-procurar':'a procurar',recusado:'sem GPS',
      'sem-sinal':'sem sinal',indisponivel:'sem GPS',desligado:'GPS desligado'}[S.gps.estado];
    var c=S.gps.estado==='ligado'?'viva':(S.gps.estado==='recusado'||
      S.gps.estado==='indisponivel'?'morta':'');
    p.push('<span class="pill '+c+'">'+r+'</span>');
    if(S.bateria!=null) p.push('<span class="pill">'+S.bateria+'%</span>');
    /* se não houver ligação, o patrão não está a ver nada disto — e o
       condutor tem de o saber, senão julga que já entregou o turno */
    if(!/^(supabase|servidor|ligada|a-ligar)$/.test(Nuvem.estado()))
      p.push('<span class="pill" title="Sem ligação: o turno fica guardado '+
        'aqui e sobe quando houver rede">sem ligação</span>');
    /* Um condutor tem de saber se o que fez já chegou ao patrão.
       Sem isto fechava o turno, via "terminado", e podia nunca ter
       saído do telemóvel. */
    var pe=Nuvem.porEnviar();
    if(pe) p.push('<span class="pill morta" title="Ainda por enviar. Sobe '+
      'sozinho assim que houver rede.">'+pe+' por enviar</span>');
  }
  el('dir').innerHTML=p.join('');
}

function pintar(){
  var h='', b='';

  if(S.ecra==='entrar'){
    h='<div style="height:10px"></div>'+
      '<h1>Entrar</h1>'+
      '<p class="sub">O email e o código de quatro números que o patrão lhe deu.</p>'+
      '<label class="campo"><span class="lb">Email</span>'+
      '<input type="text" id="i-email" value="'+esc(S.r.email||'')+
      '" placeholder="o.seu@email.cv"></label>'+
      '<label class="campo"><span class="lb">Código</span>'+
      '<input type="number" inputmode="numeric" id="i-cod" value="'+esc(S.r.cod||'')+
      '" placeholder="0000"></label>';
    if(S.aviso) h+='<div class="cartao mau"><p class="p-nota">'+esc(S.aviso)+'</p></div>';
    /* os códigos de exemplo só servem aberto como ficheiro; no site a
       sério não existem, e um condutor a sério ficava baralhado */
    if(!(Nuvem.temServidor && Nuvem.temServidor()))
      h+='<div class="cartao nota"><p class="p-nota"><b>Para experimentar:</b><br>'+
        'antonio@exemplo.cv · 1234<br>jorge@exemplo.cv · 2345<br>'+
        'nuno@exemplo.cv · 3456</p></div>';
    else
      h+='<p class="p-nota" style="margin-top:4px">Não tem código? Peça-o ao patrão '+
        '— ele manda-lho pelo WhatsApp.</p>';
    b='<button class="bt pri" data-f="entrar">Entrar</button>';
  }

  else if(S.ecra==='carro'){
    h='<div class="passo">Passo 1 de 3</div><h1>Que carro vai levar?</h1>'+
      '<p class="sub">Olá, '+esc(S.eu.nome)+'.</p>';
    h+=FROTA.carros.map(function(c){
      return '<button class="escolha'+(S.carro&&S.carro.id===c.id?' on':'')+
        '" data-carro="'+c.id+'">'+
        '<span><span class="mat">'+esc(c.matricula)+'</span><br>'+
        '<span class="s">'+esc(c.marca+' '+c.modelo)+' · depósito de '+c.deposito+' l</span>'+
        '</span><span class="d">'+nf(c.km)+'<small>km</small></span></button>'; }).join('');
    b=(S.turnos.length?'<button class="lig" data-f="ir-meus">Os meus turnos</button>':'')+
      '<button class="lig" data-f="sair">Sair</button>';
  }

  else if(S.ecra==='km-inicio'){
    var km=S.r.km==null?S.carro.km:S.r.km, gap=km-S.carro.km;
    h='<div class="passo">Passo 2 de 3</div><h1>Quantos km marca?</h1>'+
      '<p class="sub">'+esc(S.carro.matricula)+' · fotografe o conta-quilómetros, '+
      'ou escreva o número.</p>'+
      (S.gps.estado==='recusado'||S.gps.estado==='indisponivel'
        ? '<div class="cartao aviso"><p class="p-nota"><b>Sem GPS, a fotografia é '+
          'a única prova.</b> Fotografe o quadrante, mesmo que escreva o número '+
          'à mão.</p></div>' : '')+
      caixaFoto('Fotografar o conta-quilómetros','abre a câmara do telemóvel')+
      '<div class="ou">ou</div>'+
      '<label class="campo"><span class="lb">Escrever à mão</span>'+
      '<input type="number" inputmode="numeric" id="i-km" value="'+km+'">'+
      '<span class="aj">Este carro ficou em '+nf(S.carro.km)+' km da última vez.</span>'+
      '</label>';
    if(gap>LIM.gapKm) h+='<div class="cartao mau"><h2>São '+nf(gap)+' km a mais</h2>'+
      '<p class="p-nota" style="margin-top:5px">O carro andou desde o último turno. '+
      'Fica registado. Se foi à oficina, diga ao patrão.</p></div>';
    if(gap<0) h+='<div class="cartao mau"><h2>Parece a menos</h2>'+
      '<p class="p-nota" style="margin-top:5px">O conta-quilómetros não anda para trás. '+
      'Confira o número: este carro ficou em '+nf(S.carro.km)+' km.</p></div>';
    /* Um zero a mais e o carro fica com um conta-quilómetros errado
       para sempre — e todos os turnos seguintes ficam errados com
       ele. Mais de 2.000 km desde o último turno é quase de certeza
       engano de dedo. */
    var absurdo = gap>LIM.gapAbsurdo;
    if(absurdo) h+='<div class="cartao mau"><h2>Este número parece um engano</h2>'+
      '<p class="p-nota" style="margin-top:5px">São '+nf(gap)+' km desde o último '+
      'turno — mais do que a volta a Santiago vinte vezes. Confira se não escapou '+
      'um algarismo. O carro ficou em <b>'+nf(S.carro.km)+' km</b>.</p></div>';
    b='<button class="bt pri" data-f="ir-gps"'+((gap<0||absurdo)?' disabled':'')+
      '>Continuar</button>'+
      '<button class="lig" data-f="ir-carro">Trocar de carro</button>';
  }

  else if(S.ecra==='gps'){
    var e=S.gps.estado;
    h='<div class="passo">Passo 3 de 3</div><h1>Ligar o GPS</h1>'+
      '<p class="sub">É o GPS que grava o caminho do carro.</p>'+
      '<div class="cartao">'+
      '<div class="vf"><span class="mk s">✓</span><span><span class="t1">'+
      'Só durante o turno</span><br><span class="t2">Quando fechar, deixa de haver '+
      'localização. Nem o patrão a vê.</span></span></div>'+
      '<div class="vf"><span class="mk s">✓</span><span><span class="t1">'+
      'O senhor vê tudo</span><br><span class="t2">O mapa da Praia fica-lhe no ecrã '+
      'enquanto conduz.</span></span></div></div>';
    if(e==='ligado') h+='<div class="cartao bom"><h2>GPS ligado</h2>'+
      '<p class="p-nota" style="margin-top:4px">Encontrou o carro com '+
      (S.gps.precisao||'—')+' metros de precisão.</p></div>';
    else if(e==='recusado'||e==='indisponivel')
      h+='<div class="cartao aviso"><h2>'+(emMoldura()&&e==='recusado'
        ?'Aqui o GPS não funciona':'O telemóvel não deu a localização')+'</h2>'+
        '<p class="p-nota" style="margin-top:4px">'+esc(S.gps.porque||'')+'</p>'+
        '<p class="p-nota" style="margin-top:7px">Pode começar na mesma: os '+
        'quilómetros contam pelo conta-quilómetros e as fotografias contam na '+
        'mesma. <b>Fotografe sempre o quadrante</b> — sem GPS, é a foto que '+
        'segura as contas.</p></div>';
    else if(e==='a-procurar') h+='<div class="cartao"><h2>A procurar sinal</h2>'+
      '<p class="p-nota" style="margin-top:4px">'+esc(S.gps.porque||
      'Dentro de um edifício pode demorar. Encoste-se a uma janela.')+'</p></div>';
    else if(e==='sem-sinal') h+='<div class="cartao aviso"><h2>Sem sinal</h2>'+
      '<p class="p-nota" style="margin-top:4px">'+esc(S.gps.porque||'')+'</p></div>';
    b = (e==='ligado' ? '<button class="bt pri" data-f="comecar">Começar turno</button>'
      : ((emMoldura()&&e==='recusado')
          ? '<button class="bt pri" data-f="comecar">Começar sem GPS</button>'
          : '<button class="bt pri" data-f="pedir-gps">'+(e==='recusado'
              ?'Tentar outra vez':'Ligar o GPS')+'</button>'+
            '<button class="lig" data-f="comecar">Começar sem GPS</button>'))+
      '<button class="lig" data-f="comecar-sim">Experimentar sem conduzir</button>';
  }

  else if(S.ecra==='volante'){
    var t=S.turno, km=kmRasto(t.rasto);
    var ondeAgora=S.ultimaPos||(t.rasto.length?t.rasto[t.rasto.length-1]:null);
    var bairro=ondeAgora?bairroDe(ondeAgora[0],ondeAgora[1]):null;
    h='<div class="volante">'+mapa(t.rasto,true)+
      '<div class="hud"><div class="vel"><span class="n num" id="v-num">'+
      Math.round(S.gps.vel)+'</span><span class="u">KM/H</span>'+arco(S.gps.vel)+'</div>'+
      (bairro?'<div class="onde">'+esc(bairro)+'</div>':'')+'</div>'+
      '<div class="baixo">'+
      '<div><b class="num">'+nf(km,1)+'</b><span>km</span></div>'+
      '<div><b class="num">'+hms((Date.now()-t.inicio)/1000)+'</b>'+
      '<span><i class="rec"></i>a gravar</span></div>'+
      '<div><b class="num">'+nf(t.totalCve)+'</b><span>CVE</span></div></div></div>';
    if(t.abast.length)
      h+='<div class="cartao"><h2>Já abasteceu</h2>'+t.abast.map(function(a,ia){
        return '<div class="vf"><span class="mk s">✓</span>'+
          '<span style="flex:1"><span class="t1">'+
          nf(a.valor)+' CVE · '+nf(a.valor/FROTA.precoLitro,2)+' litros</span><br>'+
          '<span class="t2">'+hh(a.hora)+' · '+esc(a.posto)+'</span></span>'+
          /* enganos acontecem, e um número errado aqui vira um alerta
             no ecrã do patrão que ninguém sabe explicar */
          '<button class="lig" data-apagar="'+ia+'" style="width:auto;padding:4px 8px;'+
          'font-size:12px">Apagar</button></div>';
      }).join('')+'<p class="p-nota" style="margin-top:8px">Meteu um valor errado? '+
      'Apague e registe outra vez. Enquanto o turno não fechar, dá.</p></div>';
    /* O maior risco deste sistema é humano e é simples: o condutor
       mete o telemóvel no bolso, o ecrã apaga-se, e o navegador
       deixa de gravar o caminho. Depois o GPS não bate com o
       quadrante e parece desvio quando foi só o bolso. Vale mais
       dizer-lho uma vez do que descobrir no fim do dia. */
    if(!S.simular && !S.avisoEcraVisto)
      h+='<div class="cartao nota"><p class="p-nota"><b>Deixe o ecrã aceso.</b> '+
        'Se o telemóvel adormecer, o caminho deixa de ser gravado e os '+
        'quilómetros não vão bater no fim. Ponha-o no suporte, com carregador. '+
        '<button class="lig" data-f="percebi" style="width:auto;padding:2px 6px;'+
        'font-size:12.5px">Percebi</button></p></div>';
    if(S.simular) h+='<div class="cartao nota"><p class="p-nota"><b>A experimentar.</b> '+
      'O carro anda sozinho por ruas verdadeiras da Praia. Pode abastecer e terminar '+
      'na mesma.</p></div>';
    else if(S.gps.estado!=='ligado')
      h+='<div class="cartao aviso"><h2>'+(S.gps.estado==='a-procurar'
        ?'A procurar sinal':'O GPS parou')+'</h2><p class="p-nota" style="margin-top:4px">'+
        esc(S.gps.porque||'O caminho deixou de ser gravado. Os quilómetros do quadrante '+
        'contam na mesma.')+'</p>'+(S.gps.estado==='recusado'||S.gps.estado==='sem-sinal'
        ?'<button class="lig" data-f="pedir-gps" style="margin-top:8px">Ligar outra vez'+
         '</button>':'')+'</div>';
    b='<div class="par"><button class="bt sec" data-f="ir-abast">Abastecer</button>'+
      '<button class="bt perigo" data-f="ir-fim">Terminar</button></div>';
  }

  else if(S.ecra==='abastecer'){
    var t2=S.turno, u=t2.rasto[t2.rasto.length-1];
    var perto=postosPerto(u?u[0]:null, u?u[1]:null, 4);
    var esc2=S.r.posto||(perto[0]?perto[0].p.nome:'');
    var val=S.r.valor||0, lt=val?val/FROTA.precoLitro:0;
    h='<h1>Abastecer</h1>';
    if(perto.length){
      h+='<div class="cartao nota"><p class="p-nota" style="margin-bottom:9px">'+
        '<b>O GPS diz que está aqui.</b> Se não for, escolha outro.</p>'+
        perto.map(function(x){
          return '<button class="escolha'+(esc2===x.p.nome?' on':'')+'" data-posto="'+
            esc(x.p.nome)+'" style="margin-bottom:6px"><span><span style="font-weight:600">'+
            esc(x.p.nome)+'</span><br><span class="s">a '+
            (x.m<1000?x.m+' metros':nf(x.m/1000,1)+' km')+'</span></span>'+
            (esc2===x.p.nome?'<span class="d" style="color:var(--accent)">✓</span>':'')+
            '</button>'; }).join('')+'</div>';
    } else h+='<label class="campo"><span class="lb">Em que posto está</span>'+
      '<input type="text" id="i-posto" value="'+esc(esc2)+'" placeholder="nome do posto">'+
      '</label>';
    var pEsc=null, dEsc=null;
    for(var ip=0; ip<POSTOS.length; ip++) if(POSTOS[ip].nome===esc2) pEsc=POSTOS[ip];
    if(pEsc&&u) dEsc=Math.round(dist(u[0],u[1],pEsc.lat,pEsc.lon));
    if(dEsc!=null&&dEsc>400)
      h+='<div class="cartao aviso"><h2>Este posto fica longe de si</h2>'+
        '<p class="p-nota" style="margin-top:4px">O GPS põe-no a '+
        (dEsc<1000?dEsc+' metros':nf(dEsc/1000,1)+' km')+' de '+esc(esc2)+
        '. Pode guardar na mesma, mas o patrão vai ver a diferença.</p></div>';
    if(lt > t2.deposito*1.05)
      h+='<div class="cartao mau"><h2>Isso não cabe no depósito</h2>'+
        '<p class="p-nota" style="margin-top:5px">'+nf(val)+' CVE dão '+nf(lt,1)+
        ' litros, e o depósito deste carro leva '+nf(t2.deposito)+'. Confira o valor '+
        '— se estiver certo, o patrão vai perguntar porquê.</p></div>';
    h+=caixaFoto('Fotografar o talão','ou a bomba, se o talão não der')+
      '<div class="ou">e</div>'+
      '<label class="campo"><span class="lb">Quanto pagou (CVE)</span>'+
      '<input type="number" inputmode="numeric" id="i-valor" value="'+(val||'')+
      '" placeholder="0"><span class="aj">'+(val
        ? 'A '+nf(FROTA.precoLitro,2)+' por litro são <b>'+nf(lt,2)+' litros</b>.'
        : 'Preço do mês: '+nf(FROTA.precoLitro,2)+' CVE por litro.')+'</span></label>'+
      '<label class="campo"><span class="lb">Litros escritos no talão</span>'+
      '<input type="number" inputmode="decimal" step="0.01" id="i-litros" value="'+
      (S.r.litros||'')+'" placeholder="se der para ler"></label>';
    if(lt>S.carro.deposito*1.05) h+='<div class="cartao mau"><h2>Não cabe no depósito</h2>'+
      '<p class="p-nota" style="margin-top:5px">'+nf(lt,2)+' litros num depósito de '+
      nf(S.carro.deposito)+'. Confirme o valor.</p></div>';
    b='<button class="bt pri" data-f="guardar-abast"'+(val>0?'':' disabled')+
      '>Registar</button><button class="lig" data-f="ir-volante">Voltar ao turno</button>';
  }

  else if(S.ecra==='km-fim'){
    var t3=S.turno;
    var kmF=S.r.kmF==null?t3.kmInicio+Math.round(kmRasto(t3.rasto)):S.r.kmF;
    var p2=kmF-t3.kmInicio;
    h='<h1>Terminar o turno</h1>'+
      '<p class="sub">Última vez: quantos km marca agora?</p>'+
      caixaFoto('Fotografar o conta-quilómetros','ou escreva em baixo')+
      '<div class="ou">ou</div>'+
      '<label class="campo"><span class="lb">Escrever à mão</span>'+
      '<input type="number" inputmode="numeric" id="i-kmf" value="'+kmF+'">'+
      '<span class="aj">Começou com '+nf(t3.kmInicio)+' km · '+
      (p2>=0?'andou <b>'+nf(p2)+' km</b>':'<b>não pode ser menos</b>')+'</span></label>';
    if(p2>LIM.kmMax) h+='<div class="cartao mau"><h2>Parece a mais</h2>'+
      '<p class="p-nota" style="margin-top:5px">'+nf(p2)+' km num turno é pouco provável.'+
      '</p></div>';
    b='<button class="bt pri" data-f="terminar"'+(p2>=0&&p2<=LIM.kmMax?'':' disabled')+
      '>Terminar</button><button class="lig" data-f="ir-volante">Voltar ao turno</button>';
  }

  else if(S.ecra==='resumo'){
    /* O mesmo ecrã serve para o turno que o condutor acabou de fechar
       e para qualquer um que ele queira rever na lista dele. */
    var t4 = S.verTurno
      ? S.turnos.filter(function(x){ return x.id===S.verTurno; })[0] || S.turnos[0]
      : S.turnos[0];
    if(!t4){ S.ecra='carro'; return pintar(); }
    var c=contas(t4);
    var mau=c.v.filter(function(x){ return !x.ok; }).length;
    h='<h1>'+(S.verTurno?dt(t4.inicio):'Turno terminado')+'</h1>'+
      '<p class="sub">'+esc(t4.matricula)+' · '+hh(t4.inicio)+'–'+hh(t4.fim)+' · '+
      nf((t4.fim-t4.inicio)/36e5,1)+' horas</p>'+
      ((t4.rasto||[]).length>3
        ? '<div class="mapinha">'+desenharMapa({pts:t4.rasto, W:400, H:220, pad:18,
            minSpan:0.006, abast:(t4.abast||[]).map(function(a){
              return {lat:a.lat, lon:a.lon, posto:a.posto}; }),
            rotulo:'O caminho que fez neste turno'})+'</div>'
        : '')+
      (Nuvem.porEnviar()
        ? '<div class="cartao aviso"><h2>Ainda a enviar</h2>'+
          '<p class="p-nota" style="margin-top:4px">Faltam '+Nuvem.porEnviar()+
          ' coisas por subir para o patrão. Vai sozinho assim que houver rede — '+
          'pode fechar a aplicação, não se perde. '+
          '<button class="lig" data-f="tentar-enviar" style="width:auto;'+
          'padding:2px 6px;font-size:12.5px">Tentar agora</button></p></div>'
        : '')+
      '<div class="cartao '+(mau?'aviso':'bom')+'"><h2>'+
      (mau?mau+' ponto'+(mau>1?'s':'')+' a explicar ao patrão':'Está tudo certo')+'</h2>'+
      '<p class="p-nota" style="margin-top:5px">'+
      (mau?'O patrão vê isto do lado dele.':'Nada a explicar a ninguém. Bom trabalho.')+
      '</p></div>'+
      '<div class="cartao">'+c.v.map(function(x){
        return '<div class="vf"><span class="mk '+(x.ok?'s':'n')+'">'+(x.ok?'✓':'!')+
          '</span><span style="flex:1"><span class="t1">'+x.t1+'</span><br>'+
          '<span class="t2">'+x.t2+'</span></span><span class="vl">'+x.vl+'</span></div>';
      }).join('')+'</div>';
    if(c.dif>0) h+='<div class="cartao mau"><h2>Por explicar</h2>'+
      '<div class="num" style="font-size:28px;font-weight:500;color:var(--crit);'+
      'margin-top:4px">'+nf(c.dif)+' CVE</div></div>';
    b = S.verTurno
      ? '<button class="bt pri" data-f="ir-meus">Voltar aos meus turnos</button>'
      : '<button class="bt pri" data-f="ir-carro">Novo turno</button>'+
        '<button class="lig" data-f="ir-meus">Os meus turnos</button>';
  }

  else if(S.ecra==='meus'){
    h='<h1>Os meus turnos</h1>';
    h+='<p class="sub">Toque num turno para o rever com o mapa.</p>';
    h+= S.turnos.length ? S.turnos.map(function(t){
        var c2=contas(t), mau=c2.v.filter(function(x){return !x.ok;}).length;
        return '<button class="turno-lin" data-ver="'+esc(t.id)+'">'+
          '<span><span style="font-weight:600">'+nf(t.kmFim-t.kmInicio)+' km · '+
          esc(t.matricula)+'</span><br><span class="s" style="font-size:12.5px;'+
          'color:var(--muted)">'+dt(t.inicio)+' · '+hh(t.inicio)+'–'+hh(t.fim)+' · '+
          nf(t.totalCve)+' CVE</span></span>'+
          '<span class="selo" style="background:'+
          (mau?'var(--warn-wash)':'var(--ok-wash)')+';color:'+
          (mau?'var(--warn)':'var(--ok)')+'">'+
          (mau?mau+' a ver':'tudo bem')+'</span>'+
          '<span class="seta">›</span></button>'; }).join('')
      : '<div class="cartao"><div class="vazio">Ainda não terminou nenhum turno.</div></div>';
    b='<button class="bt pri" data-f="ir-carro">Abrir turno</button>'+
      '<button class="lig" data-f="sair">Sair</button>';
  }

  el('ecra').className = S.ecra==='volante' ? 'col cheia' : 'col';
  el('ecra').innerHTML=h;
  el('accoes').innerHTML=b;
  var pv=paraOndeVolta();
  el('voltar').hidden = !(pv && pv!=='ficar');
  armarVoltar();
  pintarTopo();
  if(S.ecra==='volante') ajustarMapa();
}

/* ─── voltar ──────────────────────────────────────────────
   Cada ecrã sabe de onde se veio. O "‹ Voltar" do cabeçalho e o botão
   de voltar do telemóvel fazem o mesmo. Com o turno aberto, ao volante,
   o botão do telemóvel NÃO sai da aplicação: sair era o GPS parar de
   gravar a meio do caminho, sem o condutor dar por isso. */
function paraOndeVolta(){
  switch(S.ecra){
    case 'entrar':
      return (document.getElementById('trocar') && !(Nuvem.ensaio&&Nuvem.ensaio()))
        ? 'porta' : null;
    case 'km-inicio': return 'carro';
    case 'gps':       return 'km-inicio';
    case 'abastecer':
    case 'km-fim':    return 'volante';
    case 'volante':   return 'ficar';
    case 'resumo':    return S.verTurno ? 'meus' : 'carro';
    case 'meus':      return (S.turno && !S.turno.fim) ? 'volante' : 'carro';
  }
  return null;
}
function voltar(){
  var v=paraOndeVolta();
  if(!v || v==='ficar') return;
  if(v==='porta'){ var t=document.getElementById('trocar'); if(t) t.click(); return; }
  /* voltar do GPS aos km não apaga os km que já escreveu; o resto
     limpa o que estava a meio, como os botões de cada ecrã */
  if(v!=='km-inicio'){ S.foto=null; S.r={}; }
  if(v==='meus'||v==='carro') S.verTurno=null;
  S.aviso=null; S.ecra=v; pintar();
  var m=document.querySelector('main'); if(m) m.scrollTop=0;
}
var guardaVoltar=false, ignorarVolta=false;
function armarVoltar(){
  var ha=!!paraOndeVolta();
  try{
    if(ha && !guardaVoltar){ history.pushState({fleetcv:'voltar'}, ''); guardaVoltar=true; }
    else if(!ha && guardaVoltar){ guardaVoltar=false; ignorarVolta=true; history.back(); }
  }catch(e){}
}
window.addEventListener('popstate', function(){
  if(ignorarVolta){ ignorarVolta=false; return; }
  if(!guardaVoltar) return;
  guardaVoltar=false;
  voltar();
  armarVoltar();
});
document.addEventListener('click', function(e){
  if(e.target.closest && e.target.closest('#voltar')) voltar(); });

/* ═══ ACÇÕES ═════════════════════════════════════════════ */
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState==='hidden') guardar(); });
window.addEventListener('pagehide', guardar);

document.addEventListener('input', function(e){
  var t=e.target, id=t.id;
  if(id==='i-email') S.r.email=t.value;
  if(id==='i-cod') S.r.cod=t.value;
  if(id==='i-km'){ S.r.km=+t.value; suave(); }
  if(id==='i-valor'){ S.r.valor=+t.value; suave(); }
  if(id==='i-litros') S.r.litros=+t.value;
  if(id==='i-kmf'){ S.r.kmF=+t.value; suave(); }
  if(id==='i-posto') S.r.posto=t.value;
});
var adiado=null;
function suave(){ clearTimeout(adiado); adiado=setTimeout(function(){
  var a=document.activeElement, id=a&&a.id, p=a&&a.selectionStart;
  pintar(); if(id){ var n=el(id); if(n){ n.focus();
    try{ n.setSelectionRange(p,p); }catch(x){} } } }, 300); }

document.addEventListener('change', function(e){
  if(e.target.id==='ff'&&e.target.files&&e.target.files[0])
    lerFoto(e.target.files[0], function(u){ S.foto=u; pintar(); });
});

document.addEventListener('click', function(e){
  var b=e.target.closest('[data-f],[data-carro],[data-posto],[data-ver],[data-apagar]');
  if(!b) return;
  var d=b.dataset;
  if(d.carro){ S.carro=FROTA.carros.filter(function(c){ return c.id===d.carro; })[0];
    S.foto=null; S.r={km:S.carro.km}; S.ecra='km-inicio'; pintar(); return; }
  if(d.posto!=null){ S.r.posto=d.posto; pintar(); return; }
  if(d.ver){ S.verTurno=d.ver; S.ecra='resumo'; pintar(); return; }
  if(d.apagar!=null && S.turno && !S.turno.fim){
    var ia=+d.apagar, aa=S.turno.abast[ia];
    if(!aa) return;
    if(!confirm('Apagar o abastecimento de '+nf(aa.valor)+' CVE?')) return;
    S.turno.abast.splice(ia,1);
    S.turno.totalCve=S.turno.abast.reduce(function(s,x){ return s+x.valor; },0);
    Nuvem.posicao(S.turno, {kmGps:kmRasto(S.turno.rasto), bateria:S.bateria,
      onde:ondeEstou()}, true);
    guardar(); pintar(); return; }

  var f=d.f;
  if(f==='entrar'){
    var em=(S.r.email||'').trim().toLowerCase(), co=String(S.r.cod||'').trim();
    if(!em||!co){ S.aviso='Escreva o email e o código.'; pintar(); return; }
    /* Quem confere o código é a nuvem: havendo servidor é ele, e o
       código nunca chega a este telemóvel. */
    S.aviso='a entrar…'; pintar();
    Nuvem.entrar(em, co).then(function(r){
      if(r.erro||r.papel!=='condutor'){
        S.aviso = r.erro || 'Esta conta é do proprietário, não de condutor.';
        pintar(); return; }
      S.eu = FROTA.condutores.filter(function(c){ return c.id===r.id; })[0]
             || {id:r.id, nome:r.nome, email:em};
      S.aviso=null; S.r={}; guardar(); S.ecra='carro'; pintar();
    });
  }
  if(f==='sair'){
    Nuvem.sair();
    S.eu=null; S.r={}; guardar(); S.ecra='entrar'; pintar(); }
  if(f==='ir-carro'){ S.foto=null; S.r={}; S.ecra='carro'; pintar(); }
  if(f==='tentar-enviar'){ Nuvem.tentarAgora(); pintar(); return; }
  if(f==='percebi'){ S.avisoEcraVisto=true;
    Nuvem.local('aviso-ecra', true); pintar(); return; }
  if(f==='ir-meus'){ S.verTurno=null; S.ecra='meus'; pintar(); }
  if(f==='ir-gps'){ S.simular=false; ligarGps(); S.ecra='gps'; pintar(); }
  if(f==='pedir-gps'){ ligarGps(); pintar(); }
  if(f==='comecar') comecar(false);
  if(f==='comecar-sim') comecar(true);
  if(f==='ir-volante'){ S.foto=null; S.r={}; S.ecra='volante'; pintar(); }
  if(f==='ir-abast'){ S.foto=null; S.r={}; S.ecra='abastecer'; pintar(); }
  if(f==='guardar-abast'){
    var v=S.r.valor||0; if(v<=0) return;
    var u2=S.turno.rasto[S.turno.rasto.length-1];
    var pp=postosPerto(u2?u2[0]:null, u2?u2[1]:null, 1);
    S.turno.abast.push({hora:Date.now(), valor:v, litrosTalao:S.r.litros||null,
      foto:S.foto, posto:S.r.posto||(pp[0]?pp[0].p.nome:'posto'),
      lat:u2?u2[0]:null, lon:u2?u2[1]:null});
    S.turno.totalCve+=v;
    S.foto=null; S.r={};
    Nuvem.posicao(S.turno, {kmGps:kmRasto(S.turno.rasto), bateria:S.bateria,
      onde:ondeEstou()}, true);
    guardar(); S.ecra='volante'; pintar();
  }
  if(f==='ir-fim'){ S.foto=null; S.r={}; S.ecra='km-fim'; pintar(); }
  if(f==='terminar') terminar();
});

/* Alguns telemóveis deixam pedir para o ecrã não adormecer. Onde
   der, pede-se; onde não der, fica o aviso acima. */
var trava=null;
function segurarEcra(){
  try{
    if(navigator.wakeLock && navigator.wakeLock.request && !trava)
      navigator.wakeLock.request('screen').then(function(t){
        trava=t; t.addEventListener('release', function(){ trava=null; });
      }).catch(function(){});
  }catch(e){}
}
function largarEcra(){ try{ if(trava){ trava.release(); trava=null; } }catch(e){} }
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState==='visible' && S.turno && !S.turno.fim) segurarEcra(); });

function comecar(sim){
  S.simular=!!sim;
  S.turno={ id:'t'+Date.now(), inicio:Date.now(), fim:null,
    carroId:S.carro.id, matricula:S.carro.matricula, condutor:S.eu.nome,
    kmInicio:(S.r.km==null?S.carro.km:S.r.km), kmFim:null,
    gap:(S.r.km==null?S.carro.km:S.r.km)-S.carro.km,
    deposito:S.carro.deposito, rasto:[], abast:[], totalCve:0,
    fotoInicio:S.foto, simulado:!!sim };
  S.turno.condutorId=S.eu.id;
  S.foto=null; S.r={};
  if(sim){ desligarGps(); simular(); } else ligarGps();
  if(!tic) tic=setInterval(function(){ if(S.ecra==='volante') pintar(); }, 1000);
  if(!pulso) pulso=setInterval(function(){ if(S.ecra==='volante') pulsarVel(); }, 100);
  if(!salvo) salvo=setInterval(guardar, 8000);
  /* o patrão passa a ver este turno no mapa dele a partir de agora */
  segurarEcra();
  Nuvem.abrirTurno(S.turno);
  Nuvem.guardandoRasto(function(){ return S.turno; });
  Nuvem.posicao(S.turno, {onde:ondeEstou()}, true);
  guardar(); S.ecra='volante'; pintar();
}

function terminar(){
  var t=S.turno;
  var kmF=S.r.kmF==null?t.kmInicio+Math.round(kmRasto(t.rasto)):S.r.kmF;
  if(kmF<t.kmInicio||kmF-t.kmInicio>LIM.kmMax) return;
  t.kmFim=kmF; t.fim=Date.now(); t.fotoFim=S.foto;
  t.kmGps=+kmRasto(t.rasto).toFixed(1);
  t.semSinalS=maiorBuraco(t.rasto);
  t.fotos=!!(t.fotoInicio&&t.fotoFim);
  t.precoLitro=FROTA.precoLitro;
  /* A prova de cada abastecimento calcula-se aqui, onde está o rasto
     inteiro. O patrão recebe dois números em vez de milhares de
     pontos de GPS. */
  (t.abast||[]).forEach(function(a){
    a.temFoto=!!a.foto;
    a.prova=provaDoPosto(t.rasto, a.posto, LIM.raioPosto); });
  desligarGps();
  if(tic){ clearInterval(tic); tic=null; }
  if(pulso){ clearInterval(pulso); pulso=null; }
  if(salvo){ clearInterval(salvo); salvo=null; }
  S.carro.km=kmF;
  S.turnos.unshift(t); S.turno=null; S.foto=null; S.r={}; S.simular=false;
  /* sobe o turno inteiro, com o rasto, e sai do mapa ao vivo */
  largarEcra();
  Nuvem.fecharTurno(t);
  if(S.carro) Nuvem.guardarFrota(FROTA);
  guardar(); S.ecra='resumo'; pintar();
}

/* ═══ ARRANQUE ═══════════════════════════════════════════
   A frota vem do patrão, pela nuvem, por isso não está cá quando a
   página abre. Mostra-se o que houver e completa-se quando chegar. */
var arrancado=false;

function comServidor(){ return Nuvem.temServidor(); }
function retomar(){
  var L=carregar();
  if(!L) return;
  var acha=function(lista,id){
    var r=null; (lista||[]).forEach(function(x){ if(x.id===id) r=x; }); return r; };
  if(L.turnos) S.turnos=L.turnos;
  if(!S.eu&&L.eu) S.eu=acha(FROTA.condutores, L.eu);
  if(!S.carro&&L.carro) S.carro=acha(FROTA.carros, L.carro);
  if(!S.turno&&L.turno&&!L.turno.fim&&S.eu){
    S.turno=L.turno;
    S.carro=acha(FROTA.carros, L.turno.carroId)||S.carro;
    S.simular=!!L.turno.simulado;
    S.ecra='volante';
    if(S.simular) simular(); else ligarGps();
    if(!tic) tic=setInterval(function(){ if(S.ecra==='volante') pintar(); },1000);
    if(!pulso) pulso=setInterval(function(){ if(S.ecra==='volante') pulsarVel(); },100);
    if(!salvo) salvo=setInterval(guardar, 8000);
    Nuvem.guardandoRasto(function(){ return S.turno; });
  } else if(S.eu && S.ecra==='entrar') S.ecra='carro';
  /* No ensaio não se pede e-mail nem código a ninguém: quem carregou em
     "só quero experimentar" quer VER, não quer preencher formulários.
     Entra-se como o primeiro condutor da frota de mentira. */
  if(!S.eu && Nuvem.ensaio && Nuvem.ensaio()){
    var q=(FROTA.condutores||[])[0];
    if(q){ S.eu=q; S.ecra='carro'; guardar(); }
  }
}

Nuvem.aoMudar(function(){
  var d=Nuvem.dados();
  if(d.frota){
    FROTA.precoLitro = d.frota.precoLitro || FROTA.precoLitro;
    FROTA.carros     = d.frota.carros     || FROTA.carros;
    FROTA.condutores = d.frota.condutores || FROTA.condutores;
    /* o patrão pode ter mudado a matrícula ou o preço a meio do turno */
    if(S.eu)    S.eu    = FROTA.condutores.filter(function(x){
                            return x.id===S.eu.id; })[0] || S.eu;
    if(S.carro) S.carro = FROTA.carros.filter(function(x){
                            return x.id===S.carro.id; })[0] || S.carro;
  }
  /* No ensaio entra-se sozinho — mas só quando a frota chegar. O
     retomar() corre uma vez só, e pode correr antes disso. */
  if(!S.eu && FROTA.condutores.length && Nuvem.ensaio && Nuvem.ensaio()){
    S.eu=FROTA.condutores[0];
    if(S.ecra==='entrar') S.ecra='carro';
    guardar();
  }
  /* O retomar procura o condutor na lista para lhe devolver o turno
     aberto — por isso espera pela lista. Antes bastava a nuvem ter
     respondido, e ela responde uns instantes ANTES de a lista chegar:
     sem rede, o condutor caía no ecrã de entrar e o turno aberto
     ficava para trás. Só não se espera quando não vem lista nenhuma
     (ninguém entrou ainda); para o resto há os 8 segundos lá em baixo. */
  var semLista=/por-entrar$/.test(Nuvem.estado());
  if(!arrancado && (FROTA.condutores.length || semLista)){
    arrancado=true; retomar();
  }
  /* O telemóvel lembrava-se de quem era, mas a base diz que não há
     sessão (o patrão mudou-lhe o código, ou a sessão caducou). Sem
     turno aberto, pede-se o código outra vez em vez de o deixar a
     escolher carros que depois não consegue gravar. Com turno aberto
     não se lhe tira o chão: o turno continua e sobe quando entrar. */
  var est=Nuvem.estado();
  if(S.eu && !S.turno && (est==='supabase-por-entrar'||est==='servidor-por-entrar')
     && !(Nuvem.ensaio&&Nuvem.ensaio())){
    S.eu=null; S.carro=null; S.ecra='entrar'; guardar(); }
  pintarSePuder();
});
Nuvem.arrancar({papel:"condutor"});
/* se a nuvem não responder em 8 segundos, segue-se com o que há */
setTimeout(function(){ if(!arrancado){ arrancado=true; retomar(); pintar(); } }, 8000);
pintar();
bateria();
}
