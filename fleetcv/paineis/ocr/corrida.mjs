/* A CORRIDA DOS LEITORES — o leitor da aplicação contra fotografias
   verdadeiras de quadrantes. Primeiro:  python3 buscar_fotos.py
   Depois, a partir de paineis/:
     python3 -m http.server 8765 --bind 127.0.0.1 &
     node ocr/corrida.mjs
   Conta os acertos de duas maneiras: sem saber nada do carro (o
   primeiro turno) e sabendo onde ele ficou (todos os outros). O que
   interessa mais é a segunda coluna, e quantas vezes ERRA: quando
   propõe um número errado, o condutor pode não reparar. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const AQUI=new URL('.', import.meta.url).pathname;
const meta=JSON.parse(fs.readFileSync(AQUI+'meta.json','utf8'));
const src=fs.readFileSync(AQUI+'../mapa/leitor_quadrante.js','utf8');
const g={}; new Function('window','self',src+';moduloLeitorQuadrante(self);')(undefined,g);
const L=g.LeitorQuadrante;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage();
await p.goto('http://127.0.0.1:'+(process.env.PORTA||8765)+'/ocr/pista.html');
await p.evaluate(()=>window.preparar());
const verdadeDe=a=>parseInt(String(Array.isArray(a)?a[0]:a).split(/[.,]/)[0].replace(/\D/g,''),10);
let s=0,serr=0,cp=0,cerr=0,ms=0;
for(const m of meta){
  const r=await p.evaluate(a=>window.lerFoto(a,1280), '/ocr/fotos/'+m.f);
  const t=verdadeDe(m.a), c=L.candidatos(r.it); ms+=r.ms;
  const a=L.escolher(c); if(a!=null){ if(a===t) s++; else serr++; }
  /* o carro ficou uns km antes (0 a 400) */
  const x=L.escolher(c, Math.max(1,t-((t*7)%400))); if(x!=null){ if(x===t) cp++; else cerr++; }
}
console.log(`sem saber: ${s}/${meta.length} (errou ${serr})  ·  sabendo onde ficou: ${cp}/${meta.length} (errou ${cerr})  ·  ${Math.round(ms/meta.length)} ms por fotografia`);
await b.close();
