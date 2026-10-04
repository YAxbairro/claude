/* O CONTA-QUILÓMETROS E O PARCIAL — "ODO" e "Trip" no mesmo quadrante
   No teste do Yanick (02/10) o painel mostrava "ODO 6140km" e, por
   baixo, "Trip 137.0km". O leitor propôs 13.701: leu o parcial como
   "137.01" e fez dele um número de milhares, que ganhou ao 6140 por
   ter mais algarismos. Agora o leitor sabe onde está cada palavra na
   fotografia: o número por baixo (ou à direita) de "ODO" é o
   conta-quilómetros; o de "Trip" é o parcial e fica de fora.

   Primeiro com o que o leitor podia ter lido (as variantes do erro),
   depois com um quadrante desenhado, lido pelo leitor a sério (os
   modelos vêm das cópias em node_modules, sem rede). */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const src=fs.readFileSync('mapa/leitor_quadrante.js','utf8');
const g={}; new Function('window','self',src+';moduloLeitorQuadrante(self);')(undefined,g);
const L=g.LeitorQuadrante;
const caixa=(text,x,y,w,h)=>({text,x,y,w,h,conf:90});
const ODO=[caixa('ODO',60,300,80,30), caixa('6140km',60,340,190,40)];
const trip=t=>[caixa('Trip',420,420,80,30), caixa(t,420,460,220,40)];

{ const k=L.km([caixa('19:29',500,40,120,40),...ODO,...trip('137.0km')],0); ok('"ODO 6140km" e, por baixo, "Trip 137.0km": é o 6140', k===6140, k); }
ok('o parcial lido como "137.01" já não vira 13.701', L.km([...ODO,...trip('137.01km')],0)===6140, L.km([...ODO,...trip('137.01km')],0));
ok('nem um parcial com mais algarismos ganha ao do "ODO"', L.km([...ODO,...trip('13701km')],0)===6140, L.km([...ODO,...trip('13701km')],0));
ok('com os rótulos na mesma linha também', L.km([caixa('ODO 6140km',60,340,260,40), caixa('TRIP A 137.0',360,340,240,40)],0)===6140);
ok('sem rótulos, o inteiro com "km" passa à frente das décimas', L.km([caixa('6140km',60,340,190,40), caixa('137.0km',420,460,200,40)],0)===6140);
ok('sabendo onde o carro ficou, igual', L.km([...ODO,...trip('137.01km')],6100)===6140);
ok('um painel com "TRIP" ao lado do total (e mais nada) lê o total', L.km([caixa('007444 TRIP',40,300,300,50), caixa('2.2',360,300,60,40)],0)===7444,
   L.km([caixa('007444 TRIP',40,300,300,50), caixa('2.2',360,300,60,40)],0));
ok('o "x1000 r/min" do conta-rotações não conta', L.km([caixa('×1000r/min',40,100,200,30)],0)===null);
ok('um conta-quilómetros com décimas não perde para um "20°" mal lido',
   L.km([caixa('20°0',40,40,80,30), caixa('984.1 km',40,200,200,40), caixa('0344129.4',40,300,300,60)],0)===344129);

/* ── um quadrante desenhado, lido a sério ─────────────────── */
const NM=path.resolve('node_modules');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage();
const tipos={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.onnx':'application/octet-stream','.txt':'text/plain'};
await p.route('https://teste.local/**', r=>{
  const u=new URL(r.request().url()).pathname;
  if(u==='/p.html') return r.fulfill({contentType:'text/html', body:
    '<!doctype html><meta charset=utf8><script src="/nm/onnxruntime-web/dist/ort.wasm.min.js"></script>'+
    '<script>'+src+';moduloLeitorQuadrante(window);</script>'});
  const f=path.join(NM, u.replace(/^\/nm\//,''));
  r.fulfill({path:f, contentType:tipos[path.extname(f)]||'application/octet-stream'}); });
await p.goto('https://teste.local/p.html');
const lido=await p.evaluate(async()=>{
  const A='/nm/@gutenye/ocr-models/assets/';
  await LeitorQuadrante.preparar({det:A+'ch_PP-OCRv4_det_infer.onnx', rec:A+'ch_PP-OCRv4_rec_infer.onnx', dic:A+'ppocr_keys_v1.txt'});
  /* como o painel do teste: fundo escuro, hora em cima, ODO e Trip um por baixo do outro */
  const c=document.createElement('canvas'); c.width=1280; c.height=900;
  const x=c.getContext('2d'); x.fillStyle='#101418'; x.fillRect(0,0,1280,900);
  x.fillStyle='#f4f4f4'; x.font='bold 70px sans-serif'; x.fillText('19:29',760,140);
  x.font='bold 46px sans-serif'; x.fillText('ODO',150,520);
  x.font='bold 64px sans-serif'; x.fillText('6140km',150,600);
  x.font='bold 46px sans-serif'; x.fillText('Trip',640,700);
  x.font='bold 64px sans-serif'; x.fillText('137.0km',640,780);
  const it=await LeitorQuadrante.lerImagem(c);
  return {it:it.map(i=>({text:i.text, x:Math.round(i.x), y:Math.round(i.y), w:Math.round(i.w), h:Math.round(i.h)})),
          km:LeitorQuadrante.km(it,0)}; });
ok('o leitor dá onde está cada palavra', lido.it.length>0 && lido.it.every(i=>i.x!=null && i.w>0),
   lido.it.map(i=>i.text).join(' ¦ '));
ok('e no quadrante desenhado escolhe o 6140, não o parcial', lido.km===6140, lido.km);
await b.close();
