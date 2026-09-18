/* ════════════════════════════════════════════════════════════
   O MAPA DA PRAIA
   As ruas, a costa e os postos são os verdadeiros, tirados do
   OpenStreetMap e guardados dentro da própria aplicação — por
   isso o mapa aparece mesmo sem rede nenhuma.
   ════════════════════════════════════════════════════════════ */
var _fundoCache = {}, _indice = null;

/* Distância em metros entre dois pontos. O módulo do mapa tem a sua
   própria, para não depender de nada do resto da aplicação. */
function _dist(a, b, c, d){
  var R=6371000, g=Math.PI/180;
  return 2*R*Math.asin(Math.sqrt(
    Math.pow(Math.sin((c-a)*g/2),2) +
    Math.cos(a*g)*Math.cos(c*g)*Math.pow(Math.sin((d-b)*g/2),2)));
}

/* Guarda os cantos de cada rua uma única vez, para depois poder
   deitar fora num instante as que estão fora do ecrã. */
function _prepararIndice(){
  if(_indice) return _indice;
  var cantos = function(l){
    var mnA=1/0,mxA=-1/0,mnO=1/0,mxO=-1/0;
    for(var i=0;i<l.length;i+=2){
      if(l[i]<mnA)mnA=l[i]; if(l[i]>mxA)mxA=l[i];
      if(l[i+1]<mnO)mnO=l[i+1]; if(l[i+1]>mxO)mxO=l[i+1]; }
    return [mnA,mnO,mxA,mxO]; };
  _indice = {costa:(MAPA_PRAIA.costa||[]).map(cantos), ruas:{}};
  for(var k in MAPA_PRAIA.ruas) _indice.ruas[k]=MAPA_PRAIA.ruas[k].map(cantos);
  return _indice;
}
/* Em que bairro da Praia está este ponto. Serve tanto para
   escrever no mapa como para dizer ao patrão por onde andou. */
function bairroDe(lat, lon){
  var b1=null, d1=1e9, b2=null, d2=1e9;
  (MAPA_PRAIA.locais||[]).forEach(function(l){
    if(l.g===0) return;                       /* "Praia" é a cidade toda */
    var dA=(l.a-lat)*111320, dO=(l.o-lon)*111320*Math.cos(lat*Math.PI/180);
    var d=Math.sqrt(dA*dA+dO*dO);
    if(l.g===1){ if(d<d1){ d1=d; b1=l.n; } } else if(d<d2){ d2=d; b2=l.n; } });
  /* o bairro grande é o que toda a gente conhece; o pequeno só
     quando não há bairro grande por perto */
  if(b1&&d1<2600) return b1;
  if(b2&&d2<1200) return b2;
  return null;
}
function bairrosDoRasto(pts){
  var ordem=[], ultimo=null;
  for(var i=0;i<(pts||[]).length;i+=Math.max(1,Math.floor(pts.length/90))){
    var b=bairroDe(pts[i][0], pts[i][1]);
    if(b&&b!==ultimo){ if(ordem.indexOf(b)<0) ordem.push(b); ultimo=b; } }
  return ordem;
}
function _toca(a,b){ return !(a[2]<b[0]||a[0]>b[2]||a[3]<b[1]||a[1]>b[3]); }

/* Projeção simples: à escala da Praia a Terra é plana o bastante. */
function _proj(caixa, W, H, pad){
  var kx = Math.cos((caixa[0]+caixa[2])/2 * Math.PI/180);
  var sO = (caixa[3]-caixa[1])*kx || 1e-9, sA = (caixa[2]-caixa[0]) || 1e-9;
  var s  = Math.min((W-2*pad)/sO, (H-2*pad)/sA);
  var ox = (W - sO*s)/2, oy = (H - sA*s)/2;
  return { s:s, caixa:caixa,
    X:function(lon){ return ox + (lon-caixa[1])*kx*s; },
    Y:function(lat){ return H - (oy + (lat-caixa[0])*s); } };
}

/* Estica a caixa até ao formato do ecrã, para o zoom ser igual nos
   dois sentidos, e nunca deixa apertar abaixo de ~1,2 km — senão o
   condutor via um risco sozinho, sem uma rua para se situar. */
function _caixa(cA, cO, spanA, spanO, minSpan, W, H, pad){
  var kx=Math.cos(cA*Math.PI/180), alvo=(W-2*pad)/(H-2*pad);
  spanA=Math.max(spanA||0, 1e-7); spanO=Math.max(spanO||0, 1e-7);
  /* 1 · encher até ao formato do ecrã, para não esticar o desenho */
  if((spanO*kx)/spanA < alvo) spanO = spanA*alvo/kx; else spanA = spanO*kx/alvo;
  /* 2 · o mínimo conta pelo lado maior: num ecrã ao alto é a altura */
  var maior=Math.max(spanA, spanO*kx);
  if(maior<minSpan){ var k=minSpan/maior; spanA*=k; spanO*=k; }
  return [cA-spanA/2, cO-spanO/2, cA+spanA/2, cO+spanO/2];
}
/* Aceita tanto pontos de rasto [lat,lon,…] como carros {lat,lon}. */
function _ponto(p){ return p==null ? null
  : (p.lat!=null ? [p.lat, p.lon] : (p.length>=2 ? [p[0], p[1]] : null)); }
function _abrange(lista, minSpan, W, H, pad){
  var mnA=1/0,mxA=-1/0,mnO=1/0,mxO=-1/0, n=0;
  for(var i=0;i<lista.length;i++){ var q=_ponto(lista[i]); if(!q) continue;
    n++; if(q[0]<mnA)mnA=q[0]; if(q[0]>mxA)mxA=q[0];
    if(q[1]<mnO)mnO=q[1]; if(q[1]>mxO)mxO=q[1]; }
  if(!n) return _caixa(14.9195,-23.5087,0,0,minSpan,W,H,pad);
  return _caixa((mnA+mxA)/2,(mnO+mxO)/2,mxA-mnA,mxO-mnO,minSpan,W,H,pad);
}

/* A seguir o carro: o mapa fica quieto enquanto o carro anda pelo
   meio do ecrã e só salta quando ele chega perto da borda — como
   um GPS de carro a sério, e assim o fundo não é redesenhado a
   cada segundo. */
function _seguir(vista, alvo, minSpan, W, H, pad){
  if(vista && vista.caixa){
    var c=vista.caixa;
    var fA=(alvo[0]-c[0])/(c[2]-c[0]), fO=(alvo[1]-c[1])/(c[3]-c[1]);
    if(fA>0.25&&fA<0.75&&fO>0.25&&fO<0.75) return c;
  }
  var nova=_caixa(alvo[0], alvo[1], 0, 0, minSpan, W, H, pad);
  if(vista) vista.caixa=nova;
  return nova;
}

function _caminho(plano, pr){
  var d='';
  for(var i=0;i<plano.length;i+=2)
    d += (i?'L':'M') + pr.X(plano[i+1]).toFixed(1) + ' ' + pr.Y(plano[i]).toFixed(1);
  return d;
}

/* O fundo (costa + ruas) muda pouco: guarda-se feito. */
function _fundo(caixa, W, H, pad){
  var chave = caixa.map(function(v){ return v.toFixed(5); }).join(',')+'|'+W+'x'+H+'x'+pad;
  if(_fundoCache[chave]) return _fundoCache[chave];
  var ix=_prepararIndice(), pr=_proj(caixa,W,H,pad), svg='';
  var mA=(caixa[2]-caixa[0])*0.25, mO=(caixa[3]-caixa[1])*0.25;
  var vista=[caixa[0]-mA, caixa[1]-mO, caixa[2]+mA, caixa[3]+mO];

  (MAPA_PRAIA.costa||[]).forEach(function(c,i){
    if(!_toca(ix.costa[i],vista)) return;
    svg += '<path d="'+_caminho(c,pr)+'" fill="none" stroke="var(--costa)" '+
      'stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'; });

  /* as pequenas primeiro, as grandes por cima */
  var zoom=Math.max(0.8, Math.min(1.5, 2200/Math.max(400,
    (caixa[2]-caixa[0])*111320)));
  [['residential',1,'var(--rua2)'],['tertiary',1.5,'var(--rua2)'],
   ['secondary',2.4,'var(--rua)'],['primary',3.2,'var(--rua)']].forEach(function(x){
    var lista=MAPA_PRAIA.ruas[x[0]]; if(!lista) return;
    lista.forEach(function(r,i){
      if(!_toca(ix.ruas[x[0]][i],vista)) return;
      svg += '<path d="'+_caminho(r,pr)+'" fill="none" stroke="'+x[2]+'" stroke-width="'+
        (x[1]*zoom).toFixed(2)+'" stroke-linejoin="round" stroke-linecap="round"/>'; });
  });

  /* os nomes dos bairros: sem eles o condutor vê riscos, com eles
     sabe logo que está em Palmarejo ou na Achadinha */
  var largura=(caixa[3]-caixa[1])*111320*Math.cos(caixa[0]*Math.PI/180);
  var postos=[];                     /* onde já há um nome escrito */
  var cabe=function(x,y,w,alt){
    for(var i=0;i<postos.length;i++){ var c=postos[i];
      if(Math.abs(x-c[0])<(w+c[2])/2 && Math.abs(y-c[1])<(alt+c[3])/2) return false; }
    postos.push([x,y,w,alt]); return true; };
  /* os maiores primeiro: se dois nomes se pisarem, fica o mais conhecido */
  (MAPA_PRAIA.locais||[]).slice().sort(function(a,b){ return a.g-b.g; })
   .forEach(function(l){
    if(l.g===2 && largura>3000) return;      /* os pequenos só de perto */
    if(l.g===0 && largura<9000) return;      /* "Praia" só de muito longe */
    var x=pr.X(l.o), y=pr.Y(l.a);
    if(x<8||x>W-8||y<14||y>H-8) return;
    var tam=(l.g===0?13:11);
    if(!cabe(x, y, l.n.length*tam*0.55+10, tam+8)) return;
    svg += '<text x="'+x.toFixed(0)+'" y="'+y.toFixed(0)+'" text-anchor="middle" '+
      'fill="var(--muted)" font-size="'+tam+'" font-weight="600" '+
      'letter-spacing="'+(l.g===0?'.1em':'.04em')+'" '+
      'font-family="IBM Plex Sans,sans-serif" paint-order="stroke" '+
      'stroke="var(--terra)" stroke-width="3.5" opacity="'+(l.g===0?'.75':'.62')+'">'+
      l.n.replace(/[&<>]/g,'')+'</text>'; });

  var feito={svg:svg, pr:pr};
  var chaves=Object.keys(_fundoCache);
  if(chaves.length>16) delete _fundoCache[chaves[0]];
  _fundoCache[chave]=feito;
  return feito;
}

/* Desenha o mapa.
   pts        · o percurso [lat, lon, momento, precisão, velocidade]
   ate        · quantos pontos desenhar a cheio (para ver o carro andar)
   seguir     · zoom fixo colado ao carro (ecrã de condução)
   vista      · objeto do chamador onde fica guardado o enquadramento
   abast      · onde abasteceu
   carros     · setas extra {lat,lon,ang,rotulo} para a vista da frota
   centro     · [lat,lon] quando ainda não há percurso nenhum          */
function desenharMapa(op){
  op = op || {};
  var W=op.W||460, H=op.H||300, pad=op.pad||20, min=op.minSpan||0.011;
  var pts=(op.pts||[]).filter(function(p){ return p[3]==null||p[3]<=50; });
  var n = pts.length ? (op.ate==null ? pts.length
                                     : Math.max(1,Math.min(op.ate,pts.length))) : 0;
  var caixa;
  if(op.seguir && n)            caixa=_seguir(op.vista, pts[n-1], min, W, H, pad);
  else {
    var refs=pts.concat(op.carros||[]);
    if(!refs.length) refs=[op.centro||[14.9195,-23.5087]];
    caixa=_abrange(refs, refs.length>1?min:(op.minSpanVazio||min), W, H, pad);
  }
  var f=_fundo(caixa, W, H, pad), pr=f.pr;

  var svg='<svg class="mapa'+(op.classe?' '+op.classe:'')+'" viewBox="0 0 '+W+' '+H+'" '+
    'preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+
    (op.rotulo||'Mapa da Praia')+'"><rect width="'+W+'" height="'+H+
    '" fill="var(--terra)"/>'+f.svg;

  /* postos de combustível */
  if(op.postos!==false)
    (MAPA_PRAIA.postos||[]).forEach(function(p){
      var x=pr.X(p.lon), y=pr.Y(p.lat);
      if(x<-14||x>W+14||y<-14||y>H+14) return;
      svg += '<g class="posto-mapa" data-posto-mapa="'+
        String(p.nome).replace(/[&<>"]/g,'')+'" role="button" tabindex="0" '+
        'transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')">'+
        '<title>'+String(p.nome).replace(/[&<>]/g,'')+'</title>'+
        '<circle r="15" fill="transparent"/>'+
        '<circle r="6" fill="var(--warn-wash)" stroke="var(--warn)" stroke-width="1.2" '+
        'opacity=".9"/><path d="M-1.6 -2.6h3.2v5.2h-3.2z" fill="var(--warn)"/></g>'; });

  /* o percurso: cinzento até ao fim, aceso até onde vamos */
  if(pts.length>1){
    var partes=function(lista){
      var ps=[], act=[];
      for(var i=0;i<lista.length;i++){
        if(i&&(lista[i][2]-lista[i-1][2])>300000){ if(act.length>1) ps.push(act); act=[]; }
        act.push((act.length?'L':'M')+pr.X(lista[i][1]).toFixed(1)+' '+
          pr.Y(lista[i][0]).toFixed(1)); }
      if(act.length>1) ps.push(act); return ps; };
    if(op.ate!=null)
      partes(pts).forEach(function(p){ svg+='<path d="'+p.join(' ')+'" fill="none" '+
        'stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" '+
        'stroke-linecap="round" opacity=".16"/>'; });
    partes(pts.slice(0,Math.max(2,n))).forEach(function(p){
      svg+='<path d="'+p.join(' ')+'" fill="none" stroke="var(--accent)" '+
        'stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round" '+
        'opacity=".25"/><path d="'+p.join(' ')+'" fill="none" stroke="var(--accent)" '+
        'stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'; });
    /* onde o sinal se perdeu — o buraco é a prova, não se esconde */
    if(op.buraco!==false)
      for(var i=1;i<n&&i<pts.length;i++)
        if((pts[i][2]-pts[i-1][2])>300000)
          svg+='<path d="M'+pr.X(pts[i-1][1]).toFixed(1)+' '+pr.Y(pts[i-1][0]).toFixed(1)+
            'L'+pr.X(pts[i][1]).toFixed(1)+' '+pr.Y(pts[i][0]).toFixed(1)+
            '" stroke="var(--crit)" stroke-width="2" stroke-dasharray="5 5" fill="none"/>';
  }

  /* onde abasteceu */
  (op.abast||[]).forEach(function(a){
    if(a.lat==null) return;
    var x=pr.X(a.lon), y=pr.Y(a.lat);
    svg += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="12" fill="none" '+
      'stroke="var(--warn)" stroke-width="1.6" opacity=".65"/>'+
      '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="6" fill="var(--warn)" '+
      'stroke="var(--surface)" stroke-width="1.6"/>';
    if(a.posto) svg += '<text x="'+(x+16).toFixed(1)+'" y="'+(y+4).toFixed(1)+
      '" fill="var(--ink)" font-size="11" font-weight="600" '+
      'font-family="IBM Plex Sans,sans-serif" paint-order="stroke" '+
      'stroke="var(--terra)" stroke-width="3.5">'+
      String(a.posto).replace(/[&<>]/g,'')+'</text>';
  });

  /* o carro */
  if(n){
    var u=pts[n-1], ant=pts[Math.max(0,n-4)];
    var ang=(n>1)?Math.atan2(pr.X(u[1])-pr.X(ant[1]),
                             -(pr.Y(u[0])-pr.Y(ant[0])))*180/Math.PI:0;
    if(pts.length>1)
      svg += '<circle cx="'+pr.X(pts[0][1]).toFixed(1)+'" cy="'+pr.Y(pts[0][0]).toFixed(1)+
        '" r="5" fill="var(--surface)" stroke="var(--ok)" stroke-width="2.5"/>';
    svg += '<g transform="translate('+pr.X(u[1]).toFixed(1)+','+pr.Y(u[0]).toFixed(1)+')">'+
      (op.pulsar?'<circle r="15" fill="var(--accent)" opacity=".18">'+
        '<animate attributeName="r" values="11;20;11" dur="2.4s" repeatCount="indefinite"/>'+
        '<animate attributeName="opacity" values=".26;0;.26" dur="2.4s" '+
        'repeatCount="indefinite"/></circle>':'<circle r="13" fill="var(--accent)" '+
        'opacity=".16"/>')+
      '<g transform="rotate('+ang.toFixed(0)+')">'+
      '<path d="M0 -11 L7.5 9 L0 4.6 L-7.5 9 Z" fill="var(--accent)" '+
      'stroke="var(--surface)" stroke-width="1.8" stroke-linejoin="round"/></g>'+
      (op.rotuloCarro?'<text y="-22" text-anchor="middle" fill="var(--ink)" '+
        'font-size="12" font-weight="700" font-family="IBM Plex Mono,monospace" '+
        'paint-order="stroke" stroke="var(--terra)" stroke-width="3.5">'+
        String(op.rotuloCarro).replace(/[&<>]/g,'')+'</text>':'')+'</g>';
  }

  /* Os carros da frota. Cada um é um botão: quem toca num carro
     quer saber daquele carro, e não há motivo para o obrigar a
     procurá-lo depois numa lista por baixo do mapa. O círculo
     transparente por trás é o que se toca — a seta sozinha era
     pequena de mais para um dedo. */
  (op.carros||[]).forEach(function(c){
    var x=pr.X(c.lon), y=pr.Y(c.lat), cor=c.cor||'var(--ok)';
    var escolhido = op.escolhido && op.escolhido===c.id;
    svg += '<g class="carro-mapa'+(escolhido?' on':'')+'" '+
      (c.id?'data-vivo="'+String(c.id).replace(/[^\w-]/g,'')+'" ':'')+
      'transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')" '+
      'role="button" tabindex="0" aria-label="'+
      String(c.rotulo||'carro').replace(/[&<>"]/g,'')+'">'+
      '<circle r="26" fill="transparent"/>'+
      (escolhido?'<circle r="21" fill="none" stroke="'+cor+'" stroke-width="2" '+
        'opacity=".85"/>':'')+
      '<circle r="16" fill="'+cor+'" opacity=".16"><animate attributeName="r" '+
      'values="12;20;12" dur="2.6s" repeatCount="indefinite"/></circle>'+
      '<g transform="rotate('+(c.ang||0).toFixed(0)+')">'+
      '<path d="M0 -11 L7.5 9 L0 4.6 L-7.5 9 Z" fill="'+cor+'" stroke="var(--surface)" '+
      'stroke-width="1.8" stroke-linejoin="round"/></g>'+
      '<text y="-22" text-anchor="middle" fill="var(--ink)" font-size="12" '+
      'font-weight="700" font-family="IBM Plex Mono,monospace" paint-order="stroke" '+
      'stroke="var(--terra)" stroke-width="3.5">'+
      String(c.rotulo||'').replace(/[&<>]/g,'')+'</text></g>'; });

  /* a escala, para se saber que distância é aquela */
  var mPorPx = 111320/pr.s, alvo=Math.min(W,H)*0.28*mPorPx;
  var passos=[50,100,200,500,1000,2000,5000,10000], esc=passos[0];
  passos.forEach(function(p){ if(Math.abs(p-alvo)<Math.abs(esc-alvo)) esc=p; });
  var larg=esc/mPorPx;
  if(larg>20&&larg<W*0.7)
    svg += '<g transform="translate(13,'+(H-12-(op.margemBaixo||0))+')">'+
      '<path d="M0 0H'+larg.toFixed(0)+'M0 -4V4M'+larg.toFixed(0)+' -4V4" '+
      'stroke="var(--muted)" stroke-width="1.3"/>'+
      '<text x="'+(larg/2).toFixed(0)+'" y="-7" text-anchor="middle" fill="var(--muted)" '+
      'font-size="10" font-family="IBM Plex Mono,monospace" paint-order="stroke" '+
      'stroke="var(--terra)" stroke-width="3">'+
      (esc>=1000?(esc/1000)+' km':esc+' m')+'</text></g>';

  if(op.aviso)
    svg += '<g transform="translate('+(W/2)+','+(H/2)+')">'+
      '<rect x="-108" y="-17" width="216" height="34" rx="17" fill="var(--surface)" '+
      'opacity=".92" stroke="var(--line)"/><text text-anchor="middle" y="4.5" '+
      'fill="var(--muted)" font-size="13" font-family="IBM Plex Sans,sans-serif">'+
      String(op.aviso).replace(/[&<>]/g,'')+'</text></g>';

  return svg + '</svg>';
}


/* ════════════════════════════════════════════════════════════
   ANDAR PELAS RUAS
   Para os ensaios e para os turnos de exemplo: em vez de inventar
   um risco no ar, o carro anda mesmo pelas ruas da Praia, virando
   nos cruzamentos. É o que o patrão vai ver quando isto for a
   sério, por isso é o que tem de ver agora.
   ════════════════════════════════════════════════════════════ */
var _rede = null;

function _redeDaPraia(){
  if(_rede) return _rede;
  var vias=[], grelha={};
  ['primary','secondary','tertiary','residential'].forEach(function(k){
    (MAPA_PRAIA.ruas[k]||[]).forEach(function(v){ if(v.length>=6) vias.push(v); }); });
  /* uma grelha de ~220 m para achar depressa o que está ao lado */
  var chave=function(a,o){ return Math.round(a/0.002)+'_'+Math.round(o/0.002); };
  vias.forEach(function(v, iv){
    for(var i=0;i<v.length;i+=2){
      var c=chave(v[i], v[i+1]);
      (grelha[c] || (grelha[c]=[])).push([iv, i]); } });
  _rede={vias:vias, grelha:grelha, chave:chave};
  return _rede;
}

function _vizinhos(rede, lat, lon, raio){
  var perto=[], ca=Math.round(lat/0.002), co=Math.round(lon/0.002);
  for(var da=-1;da<=1;da++) for(var dO=-1;dO<=1;dO++){
    var c=rede.grelha[(ca+da)+'_'+(co+dO)]; if(!c) continue;
    for(var k=0;k<c.length;k++){
      var v=rede.vias[c[k][0]], i=c[k][1];
      var dA=(v[i]-lat)*111320, dOo=(v[i+1]-lon)*111320*Math.cos(lat*Math.PI/180);
      if(dA*dA+dOo*dOo <= raio*raio) perto.push(c[k]); } }
  return perto;
}

/* Devolve uma lista de [lat,lon] espaçada de `passoM` metros.
   rnd() é a fonte de acaso, para o mesmo turno dar sempre o mesmo
   caminho e os ensaios serem repetíveis. */
function percursoPorRuas(rnd, quantos, passoM){
  var rede=_redeDaPraia();
  if(!rede.vias.length) return [];
  passoM = passoM || 30;
  var iv=Math.floor(rnd()*rede.vias.length), i=0, dir=1;
  var v=rede.vias[iv];
  i = (Math.floor(rnd()*(v.length/2))|0)*2;
  var pos=[v[i], v[i+1]], saida=[pos.slice()], sobra=0, desdeCurva=0;

  var avancar=function(){
    var prox=i+dir*2;
    if(prox<0 || prox>=rede.vias[iv].length) return false;
    var w=rede.vias[iv];
    var alvo=[w[prox], w[prox+1]];
    var m=_dist(pos[0],pos[1],alvo[0],alvo[1]);
    /* parte o troço em passos de passoM metros */
    var andado=0;
    while(andado + (passoM-sobra) <= m){
      andado += (passoM-sobra); sobra=0;
      var f=andado/m;
      saida.push([pos[0]+(alvo[0]-pos[0])*f, pos[1]+(alvo[1]-pos[1])*f]);
      if(saida.length>=quantos) return 'cheio';
    }
    sobra += (m-andado);
    pos=alvo; i=prox; desdeCurva++;
    return true;
  };

  for(var passos=0; passos<quantos*6 && saida.length<quantos; passos++){
    var r=avancar();
    if(r==='cheio') break;
    if(r && desdeCurva<6+Math.floor(rnd()*22)) continue;
    /* cruzamento: procura outra rua que passe aqui ao lado */
    var perto=_vizinhos(rede, pos[0], pos[1], 45).filter(function(x){
      return x[0]!==iv; });
    if(perto.length){
      var e=perto[Math.floor(rnd()*perto.length)];
      iv=e[0]; i=e[1]; desdeCurva=0;
      dir = (i===0) ? 1 : (i>=rede.vias[iv].length-2 ? -1 : (rnd()<0.5?-1:1));
      pos=[rede.vias[iv][i], rede.vias[iv][i+1]];
    } else if(!r){
      dir=-dir; desdeCurva=0;            /* rua sem saída: volta para trás */
    } else desdeCurva=0;
  }
  return saida;
}


/* ════════════════════════════════════════════════════════════
   A PROVA DO POSTO
   O talão diz um posto. O GPS diz por onde o carro andou. Isto junta
   as duas coisas num número que cabe no turno: a que distância o
   carro chegou do posto, e quanto tempo lá esteve parado.

   Fica calculado no telemóvel do condutor, quando ele fecha o turno,
   porque é lá que está o rasto inteiro. O patrão recebe só o
   resultado — assim não é preciso mandar milhares de pontos de GPS
   pela rede dele só para responder a uma pergunta de dois números.
   ════════════════════════════════════════════════════════════ */
function provaDoPosto(rasto, nomePosto, raio){
  if(!nomePosto || !(rasto||[]).length) return null;
  var posto=null;
  (MAPA_PRAIA.postos||[]).forEach(function(x){ if(x.nome===nomePosto) posto=x; });
  if(!posto) return null;                  /* posto escrito à mão: não dá */
  raio = raio || 150;
  var perto=[], maisPerto=1e9;
  for(var i=0;i<rasto.length;i++){
    var d=_dist(rasto[i][0], rasto[i][1], posto.lat, posto.lon);
    if(d<maisPerto) maisPerto=d;
    if(d<=raio) perto.push(rasto[i]);
  }
  return {
    metros: Math.round(maisPerto),
    esteve: perto.length>0,
    parouS: perto.length ? Math.round((perto[perto.length-1][2]-perto[0][2])/1000) : 0
  };
}

/* O maior buraco de sinal, em segundos. Mesma ideia: calcula-se onde
   está o rasto e viaja só o número. */
function maiorBuraco(rasto){
  var mx=0;
  for(var i=1;i<(rasto||[]).length;i++)
    mx=Math.max(mx, (rasto[i][2]-rasto[i-1][2])/1000);
  return Math.round(mx);
}
