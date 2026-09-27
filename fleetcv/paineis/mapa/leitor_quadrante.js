/* ════════════════════════════════════════════════════════
   LER OS KM NA FOTOGRAFIA DO QUADRANTE
   Os modelos do PaddleOCR (PP-OCRv4, livres, Apache 2.0) a correr no
   próprio telemóvel, com o ONNX Runtime: sem chave, sem custo por
   fotografia, e a fotografia não sai do telemóvel para ser lida.

   Escolhido numa corrida com 58 fotografias verdadeiras de quadrantes
   (paineis/ocr/): o Tesseract acertou 8; o PaddleOCR, sabendo onde o
   carro ficou da última vez, acertou 42 e só se enganou numa. Quando
   não tem a certeza, não propõe nada — e o condutor escreve.

   Sem o OpenCV (eram mais 10 MB para o telemóvel do condutor): as
   zonas de texto encontram-se aqui, a partir do mapa que o modelo dá.

   Funciona em qualquer sítio onde haja o `ort` (a página ou um Worker).
   ════════════════════════════════════════════════════════ */
function moduloLeitorQuadrante(raiz){
"use strict";

var sessDet=null, sessRec=null, dicionario=null;
var LIMIAR=0.03;          /* o modelo diz, ponto a ponto, se é texto */
var LADO_DET=1280;        /* o lado maior da imagem que o detector vê */

function tela(w,h){
  if(typeof OffscreenCanvas!=='undefined') return new OffscreenCanvas(w,h);
  var c=document.createElement('canvas'); c.width=w; c.height=h; return c;
}

/* a imagem, em números: canais B, G, R (como o modelo aprendeu) */
function paraTensor(px, w, h){
  var n=w*h, f=new Float32Array(3*n);
  for(var i=0;i<n;i++){
    f[i]=px[i*4+2]/255; f[n+i]=px[i*4+1]/255; f[2*n+i]=px[i*4]/255; }
  return new raiz.ort.Tensor('float32', f, [1,3,h,w]);
}

async function preparar(m){
  if(sessDet) return;
  var op={executionProviders:['wasm'], graphOptimizationLevel:'all'};
  sessDet=await raiz.ort.InferenceSession.create(m.det, op);
  sessRec=await raiz.ort.InferenceSession.create(m.rec, op);
  var txt=await (await fetch(m.dic)).text();
  dicionario=txt.split('\n'); dicionario.push(' ');
}

/* Onde há texto: zonas ligadas do mapa do detector, alargadas como o
   PaddleOCR faz (o modelo marca o miolo das letras, não a letra toda) */
async function zonas(img){
  var W0=img.width, H0=img.height, k=Math.min(1, LADO_DET/Math.max(W0,H0));
  var W=Math.max(32, Math.ceil(W0*k/32)*32), H=Math.max(32, Math.ceil(H0*k/32)*32);
  var c=tela(W,H), x=c.getContext('2d'); x.drawImage(img,0,0,W,H);
  var r=await sessDet.run({[sessDet.inputNames[0]]: paraTensor(x.getImageData(0,0,W,H).data, W, H)});
  var mapa=r[sessDet.outputNames[0]].data;
  var visto=new Uint8Array(W*H), fila=new Int32Array(W*H), caixas=[];
  for(var p=0;p<W*H;p++){
    if(visto[p] || !(mapa[p]>LIMIAR)) continue;
    var ini=0, fim=0, x0=W, x1=0, y0=H, y1=0, n=0;
    fila[fim++]=p; visto[p]=1;
    while(ini<fim){
      var q=fila[ini++], qx=q%W, qy=(q/W)|0; n++;
      if(qx<x0)x0=qx; if(qx>x1)x1=qx; if(qy<y0)y0=qy; if(qy>y1)y1=qy;
      var viz=[q-1, q+1, q-W, q+W];
      for(var v=0;v<4;v++){ var z=viz[v];
        if(z<0||z>=W*H||visto[z]) continue;
        if((v===0&&qx===0)||(v===1&&qx===W-1)) continue;
        if(mapa[z]>LIMIAR){ visto[z]=1; fila[fim++]=z; } }
    }
    var w=x1-x0+1, h=y1-y0+1;
    if(n<10 || Math.min(w,h)<3) continue;
    var d=1.5*w*h/(2*(w+h));
    caixas.push({x:Math.max(0,(x0-d)/W*W0), y:Math.max(0,(y0-d)/H*H0),
      w:Math.min(W0,(x1+1+d)/W*W0)-Math.max(0,(x0-d)/W*W0),
      h:Math.min(H0,(y1+1+d)/H*H0)-Math.max(0,(y0-d)/H*H0)});
  }
  return caixas;
}

/* o que está escrito numa zona (descodificação CTC, a mais simples) */
async function texto(img, cx){
  if(cx.h>cx.w*1.6 || cx.h<4) return null;          /* texto ao alto: não é o conta-km */
  var H=48, W=Math.max(16, Math.min(1600, Math.round(cx.w*H/cx.h)));
  var c=tela(W,H), x=c.getContext('2d');
  x.drawImage(img, cx.x, cx.y, cx.w, cx.h, 0, 0, W, H);
  var r=await sessRec.run({[sessRec.inputNames[0]]: paraTensor(x.getImageData(0,0,W,H).data, W, H)});
  var o=r[sessRec.outputNames[0]], T=o.dims[1], C=o.dims[2], d=o.data;
  var s='', antes=-1, soma=0, n=0;
  for(var t=0;t<T;t++){
    var m=-1, mi=0;
    for(var j=0;j<C;j++){ var v=d[t*C+j]; if(v>m){ m=v; mi=j; } }
    if(mi!==0 && mi!==antes){ s+=dicionario[mi-1]||''; soma+=m; n++; }
    antes=mi;
  }
  return {text:s, conf:n?soma/n*100:0, h:cx.h};
}

async function lerImagem(img){
  var cs=await zonas(img), it=[];
  for(var i=0;i<cs.length;i++){ var t=await texto(img, cs[i]); if(t&&t.text) it.push(t); }
  return it;
}

/* ─── do que se leu, qual é o número do conta-quilómetros ─── */
var ESCALA={}; for(var e=10;e<=320;e+=10) ESCALA[e]=1;
/* "100120", "160180200": números do velocímetro colados */
function daEscala(s){
  if(s.length<4) return false;
  function parte(r){ if(!r) return true;
    for(var n=2;n<=3;n++){ var p=r.slice(0,n); if(p[0]!=='0' && ESCALA[+p] && parte(r.slice(n))) return true; }
    return false; }
  return parte(s);
}
function candidatos(itens){
  var c=[];
  (itens||[]).forEach(function(it){
    var t=' '+String(it.text||'')+' ';
    var odo=/ODO|ODOMETER/i.test(t);
    t=t.replace(/\b\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}\b/g,' ');     /* datas */
    t=t.replace(/\b\d{1,2}[:h]\d{2}\b/g,' ');                      /* relógio */
    t=t.replace(/(\d)\s*[°º]\s*C/gi,'$1C ');                        /* temperatura */
    /* letras que o OCR confunde com algarismos, só dentro de pedaços
       que já têm algarismos ("S0008" é 50008; "ODO" fica "ODO") */
    t=t.replace(/[0-9Oo°DIl|!SB]+/g,function(p){
      if(!/\d/.test(p)) return p;
      return p.replace(/[Oo°D]/g,'0').replace(/[Il|!]/g,'1').replace(/S/g,'5').replace(/B/g,'8'); });
    /* tambor: algarismos soltos (0 4 0 7 3 0) — juntar "20 180" inventava números */
    t=t.replace(/(^|\s)(\d(?:\s\d){2,})(?=\s)/g,function(m,a,g){ return a+g.replace(/\s/g,''); });
    /* "0292 14": grupo com zero à esquerda, partido */
    t=t.replace(/(^|\s)(0\d{2,5})\s(\d{1,3})(?=\s|km|KM)/g,'$1$2$3');
    /* depois de ODO, tudo o que vem é o número: "ODO 2 15965" */
    if(odo) t=t.replace(/(ODO\w*\s*(?:KM)?\s*)((?:\d+\s)+\d+)/i,function(m,a,g){ return a+g.replace(/\s/g,''); });
    var re=/\d[\d.,]*\d|\d/g, m;
    while((m=re.exec(t))){
      var s=m[0], mm=s.match(/^(\d+)[.,](\d)$/);
      var inteiro=mm?mm[1]:s.replace(/[.,]/g,'');
      var sem0=inteiro.replace(/^0+/,'');
      if(sem0.length<3||sem0.length>7) continue;
      var depois=t.slice(re.lastIndex, re.lastIndex+4);
      c.push({v:parseInt(inteiro,10), nz:inteiro.length, zero:inteiro[0]==='0',
        km:/^\s?(km|KM|Km|krn)/.test(depois), odo:odo, escala:daEscala(inteiro),
        h:it.h||0, conf:it.conf||0});
    }
  });
  return c;
}
/* Sabendo onde o carro ficou, só vale um número dali para a frente
   (até 2.500 km): é assim que quase nunca se engana. Sem saber (o
   primeiro turno), escolhe o mais provável — e o condutor confere. */
function escolher(c, esperado){
  if(esperado>0){
    var perto=[];
    c.forEach(function(x){ [x.v, Math.floor(x.v/10)].forEach(function(v){
      if(v>=esperado-2 && v<=esperado+2500) perto.push({v:v, d:v-esperado, h:x.h}); }); });
    if(!perto.length) return null;
    perto.sort(function(a,b){ return a.d-b.d || b.h-a.h; });
    return perto[0].v;
  }
  var f=c.filter(function(x){ return !x.escala && x.nz>=4 && !(x.v<=300 && x.v%10===0); });
  if(!f.length) return null;
  function pontos(x){ return (x.nz>=5?100:0) + (x.zero&&x.nz>=5?60:0) + (x.km||x.odo?80:0)
    + Math.min(x.h,80)*0.5 + x.conf*0.1; }
  f.sort(function(a,b){ return pontos(b)-pontos(a); });
  return f[0].v;
}

raiz.LeitorQuadrante={
  preparar:preparar, lerImagem:lerImagem,
  candidatos:candidatos, escolher:escolher,
  km:function(itens, esperado){ return escolher(candidatos(itens), esperado); }
};
}
/* na página fica já pronto; no Worker que lê as fotografias, este mesmo
   código é levado como texto (moduloLeitorQuadrante.toString()) */
if(typeof window!=='undefined') moduloLeitorQuadrante(window);
