/* DENTRO DO EMBRULHO
   O Claude, e qualquer outro sítio que aloje isto, envolve a nossa
   página dentro do <body> dele. Aí os nossos <style> deixam de estar
   na cabeça do documento e passam a ser filhos do corpo — e o corpo é
   trocado por inteiro logo ao arrancar.

   Já aconteceu: a aplicação abriu no telemóvel sem desenho nenhum,
   com as letras soltas e os ícones do tamanho do ecrã. Localmente
   nunca se via, porque um ficheiro aberto sozinho não leva embrulho.
   Este teste põe o embrulho de propósito. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app = fs.readFileSync('fleetcv.html','utf8');
const embrulho = '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<style>:root{color-scheme:light}body{margin:0;padding:0;'+
  'font:14px -apple-system,sans-serif;background:#faf9f5;color:#141413}'+
  'img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n'+app;
fs.writeFileSync('_embrulho.html', embrulho);

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const ctx = await b.newContext({ viewport:{width:390,height:840}, isMobile:true,
  hasTouch:true, permissions:[] });
const p = await ctx.newPage();
p.on('pageerror',e=>err.push(e.message));
await p.goto('file://'+process.cwd()+'/_embrulho.html'); await p.waitForTimeout(1200);

const med = async () => p.evaluate(()=>{
  const po=document.querySelector('.porta');
  const sv=document.querySelector('.porta .ic svg');
  const mk=document.querySelector('.escolha-cx .marca');
  return { estilos: document.head.querySelectorAll('style').length,
    padding: po?getComputedStyle(po).padding:null,
    svg: sv?parseFloat(getComputedStyle(sv).width):null,
    fundo: po?getComputedStyle(po).backgroundColor:null,
    marca: mk?parseFloat(getComputedStyle(mk).fontSize):null }; });
let m = await med();
ok('as folhas de estilo sobreviveram ao arranque', m.estilos>=4, m.estilos+' folhas');
ok('as portas têm o desenho certo', m.padding==='18px 17px', m.padding);
ok('os ícones ficam pequenos, não do tamanho do ecrã', m.svg===25, m.svg+'px');
ok('a marca tem o tamanho certo', m.marca===27, m.marca+'px');
ok('as portas têm fundo próprio', m.fundo!=='rgba(0, 0, 0, 0)', m.fundo);
await p.screenshot({path:'e1-escolha.png'});

/* e continua a valer depois de trocar de ecrã, que é quando o corpo
   é substituído outra vez */
await p.click('[data-quem="condutor"]'); await p.waitForTimeout(800);
m = await med();
ok('e sobrevivem à escolha do painel', (await p.evaluate(()=>
  document.head.querySelectorAll('style').length))>=4);
const bt = await p.evaluate(()=>{ const x=document.querySelector('.bt');
  return x?parseFloat(getComputedStyle(x).fontSize):null; });
ok('o painel do condutor está desenhado', bt===16.5, bt+'px');
ok('e o corpo ficou marcado', (await p.getAttribute('body','class'))==='condutor');
await p.screenshot({path:'e2-condutor.png'});

await p.click('#trocar'); await p.waitForTimeout(700);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(900);
const bd = await p.evaluate(()=>{ const x=document.querySelector('.bt');
  return x?parseFloat(getComputedStyle(x).fontSize):null; });
ok('o painel do patrão também', bd===15.5, bd+'px');

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
