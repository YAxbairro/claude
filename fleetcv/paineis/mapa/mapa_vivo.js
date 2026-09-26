/* ════════════════════════════════════════════════════════════
   O MAPA A SÉRIO
   O desenho da Praia que vem dentro da aplicação serve para quando
   não há rede — mas tem só as estradas grandes, sem nomes, e
   redesenha-se inteiro de cada vez que um carro mexe, mudando de
   escala. O patrão olhava e não sabia dizer onde o carro estava.

   Este é um mapa como os do telemóvel: ruas com nome, prédios, zoom
   com os dedos. O carro desliza de uma posição para a seguinte em
   vez de saltar, e quem toca num carro fica a segui-lo: o mapa
   aproxima-se e acompanha-o pela cidade.

   Precisa de duas coisas de fora: a biblioteca Leaflet e os
   quadradinhos do mapa (do OpenStreetMap). Faltando qualquer delas
   — sem rede, ou dentro de uma moldura que as bloqueie — a aplicação
   volta sozinha ao desenho de sempre.
   ════════════════════════════════════════════════════════════ */
var MapaVivo = (function(){
"use strict";

var PRAIA=[14.9195,-23.5087];
var semQuadrados=false, avisos=[];

function haLeaflet(){ return !!(window.L && window.L.map && window.L.divIcon); }
function pronto(){ return haLeaflet() && !semQuadrados; }
function quandoFalhar(fn){ avisos.push(fn); }
function falhou(){
  if(semQuadrados) return;
  semQuadrados=true;
  avisos.forEach(function(f){ try{ f(); }catch(e){} });
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

/* A seta do carro. A cor diz o estado (a andar, com alertas, calado);
   a matrícula vai por cima, legível sobre qualquer rua. */
function seta(cor){
  return '<svg viewBox="-13 -13 26 26" width="32" height="32" aria-hidden="true">'+
    '<path d="M0 -11 L7.5 9 L0 4.6 L-7.5 9 Z" fill="'+cor+'" stroke="#fff" '+
    'stroke-width="2" stroke-linejoin="round"/></svg>';
}
function icone(c){
  return L.divIcon({
    className:'carro-vivo',
    iconSize:[56,56], iconAnchor:[28,28],
    html:'<span class="cv-onda" style="background:'+c.cor+'"></span>'+
      '<span class="cv-seta" style="transform:rotate('+Math.round(c.ang||0)+'deg)">'+
      seta(c.cor)+'</span>'+
      (c.rotulo?'<span class="cv-mat">'+esc(c.rotulo)+'</span>':'')});
}

/* Um mapa que sobrevive às repinturas. Os ecrãs desta aplicação
   refazem-se inteiros a cada novidade; se o mapa fosse com eles,
   voltava ao zoom de partida e carregava as ruas outra vez de segundo
   e meio em segundo e meio. Por isso vive numa caixa sua, que se
   muda de sítio para o lugar marcado no ecrã novo. */
function novo(op){
  op=op||{};
  var caixa=document.createElement('div');
  caixa.className='mapa-vivo';
  var mapa=null, carros={}, cauda=null, chaveVista=null;
  var aSeguir=null, largou=false, carregouUm=false, erros=0, larg=0, alt=0;

  function criar(){
    mapa=L.map(caixa,{zoomControl:true, attributionControl:true})
      .setView(PRAIA,13);
    mapa.attributionControl.setPrefix(false);
    var q=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {maxZoom:19, attribution:'© OpenStreetMap'});
    q.on('tileload', function(){ carregouUm=true; });
    /* sem nenhum quadradinho que chegue, é porque não há como os trazer */
    q.on('tileerror', function(){ erros++; if(!carregouUm && erros>=6) falhou(); });
    q.addTo(mapa);
    /* mexer no mapa com o dedo é querer olhar para outro lado: deixa-se
       de seguir até o patrão pedir outra vez */
    mapa.on('dragstart', function(){
      if(aSeguir && !largou){ largou=true; if(op.largou) op.largou(aSeguir); } });
  }

  function encaixar(lugar){
    if(!lugar) return false;
    if(caixa.parentNode!==lugar) lugar.appendChild(caixa);
    if(!mapa) criar();
    if(caixa.clientWidth!==larg || caixa.clientHeight!==alt){
      larg=caixa.clientWidth; alt=caixa.clientHeight;
      mapa.invalidateSize({pan:false}); }
    return true;
  }

  /* De uma posição para a seguinte, a deslizar. Os carros mandam a
     posição de segundo e meio em segundo e meio; saltar de uma para a
     outra parecia um carro aos solavancos. */
  function andar(m, para){
    var de=m.getLatLng();
    if(m._anim){ cancelAnimationFrame(m._anim); m._anim=null; }
    if(!de || de.distanceTo(para)>3000){ m.setLatLng(para); seguirA(m, para); return; }
    var t0=performance.now(), ms=1300;
    var passo=function(agora){
      var f=Math.min(1,(agora-t0)/ms);
      var p=L.latLng(de.lat+(para.lat-de.lat)*f, de.lng+(para.lng-de.lng)*f);
      m.setLatLng(p); seguirA(m, p);
      m._anim = f<1 ? requestAnimationFrame(passo) : null;
    };
    m._anim=requestAnimationFrame(passo);
  }
  function seguirA(m, p){
    if(aSeguir && m._id===aSeguir && !largou && caixa.parentNode)
      mapa.panTo(p,{animate:false});
  }
  function rodar(m, ang){
    var e=m.getElement&&m.getElement();
    var s=e&&e.querySelector('.cv-seta');
    if(s) s.style.transform='rotate('+Math.round(ang||0)+'deg)';
  }
  function pintarCor(m, cor){
    var e=m.getElement&&m.getElement(); if(!e) return;
    var p=e.querySelector('.cv-seta path'); if(p) p.setAttribute('fill', cor);
    var o=e.querySelector('.cv-onda'); if(o) o.style.background=cor;
  }

  /* os carros da frota: um marcador por carro, que se mexe e não
     se refaz */
  function carrosNoMapa(lista){
    var vistos={};
    lista.forEach(function(c){
      if(c.lat==null||c.lon==null) return;
      vistos[c.id]=1;
      var para=L.latLng(c.lat,c.lon), m=carros[c.id];
      if(!m){
        m=L.marker(para,{icon:icone(c), keyboard:true, title:c.rotulo||'',
                         riseOnHover:true}).addTo(mapa);
        m._id=c.id;
        m.on('click', function(){ if(op.escolher) op.escolher(c.id); });
        carros[c.id]=m;
      } else {
        andar(m, para); rodar(m, c.ang); pintarCor(m, c.cor);
      }
      var e=m.getElement&&m.getElement();
      if(e) e.classList.toggle('on', aSeguir===c.id);
    });
    Object.keys(carros).forEach(function(id){
      if(vistos[id]) return;
      mapa.removeLayer(carros[id]); delete carros[id]; });
  }

  function enquadrar(pontos, chave, zoomUm){
    if(chaveVista===chave) return;
    chaveVista=chave;
    if(!pontos.length){ mapa.setView(PRAIA,13); return; }
    if(pontos.length===1){ mapa.setView(pontos[0], zoomUm||16); return; }
    mapa.fitBounds(L.latLngBounds(pontos),{padding:[44,44], maxZoom:16});
  }

  return {
    caixa:caixa,
    encaixar:encaixar,
    aSeguir:function(){ return aSeguir; },
    largou:function(){ return largou; },
    mapa:function(){ return mapa; },

    /* A frota agora: todos os carros em turno; `seguir` é o que o
       patrão escolheu acompanhar. */
    frota:function(d){
      if(!mapa) return;
      var lista=d.carros||[];
      carrosNoMapa(lista);
      var alvo=null;
      lista.forEach(function(c){ if(c.id===d.seguir) alvo=c; });
      if(alvo){
        if(aSeguir!==alvo.id){
          aSeguir=alvo.id; largou=false; chaveVista='seguir:'+alvo.id;
          mapa.setView([alvo.lat,alvo.lon], Math.max(mapa.getZoom(),17));
        }
        var pts=(alvo.rasto||[]).map(function(p){ return [p[0],p[1]]; });
        if(pts.length>1){
          if(!cauda) cauda=L.polyline(pts,{color:'var(--accent)', weight:5,
            opacity:.55, lineJoin:'round'}).addTo(mapa);
          else cauda.setLatLngs(pts);
        } else if(cauda){ mapa.removeLayer(cauda); cauda=null; }
      } else {
        aSeguir=null; largou=false;
        if(cauda){ mapa.removeLayer(cauda); cauda=null; }
        enquadrar(lista.map(function(c){ return [c.lat,c.lon]; }),
          'todos:'+lista.map(function(c){ return c.id; }).sort().join(','), 15);
      }
    },

    /* Um turno: o caminho todo, o que já foi andado (no filme do
       percurso), o carro onde está, e onde abasteceu. Ao vivo, segue
       o carro. */
    turno:function(d){
      if(!mapa) return;
      var pts=(d.pts||[]).map(function(p){ return [p[0],p[1]]; });
      var n=d.ate==null ? pts.length : Math.max(1,Math.min(d.ate,pts.length));
      var feito=pts.slice(0,n);
      if(!this._todo){
        this._todo=L.polyline([], {color:'#1d2a2c', weight:3, opacity:.22}).addTo(mapa);
        this._feito=L.polyline([], {color:'var(--accent)', weight:5, opacity:.9,
                                    lineJoin:'round'}).addTo(mapa);
        this._inicio=L.circleMarker(PRAIA,{radius:6, color:'var(--ok)', weight:3,
                                           fillColor:'#fff', fillOpacity:1});
        this._postos=L.layerGroup().addTo(mapa);
      }
      this._todo.setLatLngs(d.ate==null?[]:pts);
      this._feito.setLatLngs(feito);
      if(pts.length){ this._inicio.setLatLng(pts[0]); if(!mapa.hasLayer(this._inicio)) this._inicio.addTo(mapa); }
      else if(mapa.hasLayer(this._inicio)) mapa.removeLayer(this._inicio);
      var chavePostos=JSON.stringify(d.abast||[]);
      if(this._chavePostos!==chavePostos){
        this._chavePostos=chavePostos; this._postos.clearLayers();
        var gp=this._postos;
        (d.abast||[]).forEach(function(a){
          if(a.lat==null) return;
          L.circleMarker([a.lat,a.lon],{radius:8, color:'#fff', weight:2,
            fillColor:'var(--warn)', fillOpacity:1})
            .bindTooltip(esc(a.posto||'abastecimento'),{direction:'top'}).addTo(gp); });
      }
      var u=feito[feito.length-1], a=feito[Math.max(0,feito.length-4)];
      var lista = u ? [{id:'turno', lat:u[0], lon:u[1], rotulo:d.rotulo||'',
        cor:'var(--accent)',
        ang:a?Math.atan2((u[1]-a[1])*Math.cos(u[0]*Math.PI/180), u[0]-a[0])*180/Math.PI:0}]
        : [];
      carrosNoMapa(lista);
      if(d.aoVivo && u){
        if(aSeguir!=='turno' && !largou){
          aSeguir='turno'; chaveVista='seguir:'+d.id;
          mapa.setView(u, Math.max(mapa.getZoom(),16)); }
      } else {
        aSeguir=null;
        enquadrar(pts, 'turno:'+d.id+':'+(pts.length>0), 16);
      }
    },

    /* voltar a seguir, depois de o patrão ter mexido no mapa */
    centrar:function(){
      largou=false;
      var m=aSeguir&&carros[aSeguir];
      if(m) mapa.setView(m.getLatLng(), Math.max(mapa.getZoom(),16));
    },
    /* ver a frota toda outra vez */
    verTodos:function(){ chaveVista=null; aSeguir=null; largou=false; },
    /* um turno novo aberto no mesmo mapa volta a enquadrar-se */
    esquecer:function(){ chaveVista=null; aSeguir=null; largou=false; }
  };
}

return { pronto:pronto, novo:novo, quandoFalhar:quandoFalhar };
})();
