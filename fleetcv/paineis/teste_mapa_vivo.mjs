/* O MAPA A SÉRIO — seguir um carro em tempo real
   O patrão tem de ver ONDE o carro está: num mapa com ruas, que não
   muda de escala sozinho, onde o carro desliza em vez de saltar. Tocar
   no carro segue-o (sem abrir logo um cartão que tapa tudo); mexer no
   mapa com o dedo larga-o; um botão volta a segui-lo.

   Corre sem rede: a biblioteca do mapa vai dentro da página e os
   quadradinhos das ruas são imitados. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const NM=path.resolve('node_modules/leaflet/dist');
const leafletJs=fs.readFileSync(path.join(NM,'leaflet.js'),'utf8');
const leafletCss=fs.readFileSync(path.join(NM,'leaflet.css'),'utf8');
const app=fs.readFileSync('fleetcv.html','utf8')
  /* a biblioteca do Supabase de verdade substituía a de mentira */
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
const cabeca='<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script>';
fs.writeFileSync('_mapa_vivo.html', cabeca+'<style>'+leafletCss+'</style>'+
  '<script>'+leafletJs+'</script></head><body>\n'+app);
fs.writeFileSync('_mapa_sem.html', cabeca+'</head><body>\n'+app);

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==','base64');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_mapa_vivo.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const ctx=await b.newContext({viewport:{width:400,height:860},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
await ctx.route('https://tile.openstreetmap.org/**', r=>r.fulfill({body:PNG, contentType:'image/png'}));

/* ── o condutor sai com o carro ───────────────────────────── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2500);
ok('o condutor está na estrada', await c.isVisible('.volante'));

/* ── o patrão ─────────────────────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]');
await esperar(async()=>/A frota agora/.test(await p.textContent('#ecra')));
ok('o mapa é o mapa a sério (com ruas), não o desenho',
   await esperar(()=>p.isVisible('#lugar-mapa-frota .leaflet-container')));
ok('o carro em turno aparece no mapa, com a matrícula',
   await esperar(async()=>(await p.locator('.carro-vivo .cv-mat').count())>=1),
   (await p.locator('.carro-vivo .cv-mat').allTextContents()).join(', '));

await p.evaluate(()=>{ document.querySelector('.mapa-vivo').dataset.marca='o-mesmo'; });
const pos=()=>p.evaluate(()=>{ const e=document.querySelector('.carro-vivo');
  const r=e.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2, t:e.style.transform}; });
const z0=await p.evaluate(()=>document.querySelector('.mapa-vivo .leaflet-proxy')?.style.transform||'');
const p0=await pos();
await p.waitForTimeout(4500);
const p1=await pos();
ok('o carro mexe-se no mapa sozinho', p0.t!==p1.t);
ok('o mapa não se refaz a cada novidade (é o mesmo, com o mesmo zoom)',
   await p.evaluate(()=>document.querySelector('.mapa-vivo').dataset.marca==='o-mesmo') &&
   (await p.evaluate(()=>document.querySelector('.mapa-vivo .leaflet-proxy')?.style.transform||''))===z0);

/* deslizar: ao meio de duas posições o carro está a meio caminho */
const passos=await p.evaluate(()=>new Promise(ok=>{ const e=document.querySelector('.carro-vivo');
  const vistos=new Set(); const t0=performance.now();
  const olha=()=>{ vistos.add(e.style.transform); if(performance.now()-t0<2500) requestAnimationFrame(olha); else ok(vistos.size); };
  requestAnimationFrame(olha); }));
ok('o carro desliza (muitas posições pelo meio), não salta', passos>=10, passos+' posições em 2,5 s');

/* ── tocar no carro: seguir, não tapar ────────────────────── */
/* o carro está sempre a deslizar: um clique por coordenadas pode cair
   onde ele estava há um instante; toca-se no próprio carro */
await p.locator('.carro-vivo').first().dispatchEvent('click');
await p.waitForTimeout(900);
ok('tocar no carro mostra a faixa curta', await p.isVisible('.faixa'));
ok('com a velocidade', /km\/h/.test(await p.textContent('.faixa')));
ok('e NÃO abre logo o cartão grande', !(await p.isVisible('.carro-cx')));
const perto=async()=>{ const m=await p.evaluate(()=>{
    const cx=document.querySelector('.mapa-vivo').getBoundingClientRect();
    const e=document.querySelector('.carro-vivo.on')||document.querySelector('.carro-vivo');
    const r=e.getBoundingClientRect();
    return Math.hypot(r.left+r.width/2-(cx.left+cx.width/2), r.top+r.height/2-(cx.top+cx.height/2)); });
  return m; };
ok('o mapa aproxima-se e põe o carro ao meio', (await perto())<40, Math.round(await perto())+' px do meio');
await p.waitForTimeout(4000);
ok('e continua com ele ao meio enquanto anda', (await perto())<40, Math.round(await perto())+' px do meio');
const zoomSeguir=await p.evaluate(()=>{ const t=document.querySelector('.mapa-vivo .leaflet-tile');
  return t?t.src:''; });
ok('ao perto (zoom de rua)', /\/1[6-9]\//.test(zoomSeguir), zoomSeguir.split('.org/')[1]);

/* ── mexer no mapa com o dedo: larga o carro ──────────────── */
const cx=await p.evaluate(()=>{ const r=document.querySelector('.mapa-vivo').getBoundingClientRect();
  return {x:r.left+r.width/2, y:r.top+r.height/2}; });
await p.mouse.move(cx.x+60, cx.y+60); await p.mouse.down();
await p.mouse.move(cx.x-40, cx.y-20, {steps:8}); await p.mouse.move(cx.x-120, cx.y-60, {steps:8});
await p.mouse.up(); await p.waitForTimeout(800);
ok('arrastar o mapa deixa de o seguir, e aparece "Voltar a seguir"',
   await esperar(()=>p.isVisible('[data-f="seguir-de-novo"]'),3000));
await p.waitForTimeout(3500);
ok('e o mapa fica onde o patrão o deixou', (await perto())>60, Math.round(await perto())+' px do meio');
await p.click('[data-f="seguir-de-novo"]'); await p.waitForTimeout(900);
ok('"Voltar a seguir" põe o carro outra vez ao meio', (await perto())<40, Math.round(await perto())+' px do meio');

/* ── os detalhes, só quando se pedem ──────────────────────── */
await p.click('[data-f="detalhes"]'); await p.waitForTimeout(500);
ok('"Mais detalhes" abre o cartão com tudo', await p.isVisible('.carro-cx'));
await p.click('[data-f="detalhes"]'); await p.waitForTimeout(400);
ok('e fecha-se outra vez', !(await p.isVisible('.carro-cx')));

/* ── o turno todo, ao vivo, no mapa a sério ───────────────── */
await p.click('.faixa [data-turno]'); await p.waitForTimeout(1500);
ok('o turno ao vivo também é no mapa a sério',
   await p.isVisible('#lugar-mapa-turno .leaflet-container'));
ok('com o caminho desenhado',
   (await p.locator('#lugar-mapa-turno path.leaflet-interactive').count())>=1);
ok('e o carro seguido ao meio', (await perto())<60, Math.round(await perto())+' px do meio');
await p.click('#voltar'); await p.waitForTimeout(800);
ok('ao voltar, o mapa da frota ainda segue o mesmo carro', await p.isVisible('.faixa'));
await p.click('[data-f="parar-seguir"]'); await p.waitForTimeout(700);
ok('o × deixa de seguir', !(await p.isVisible('.faixa')));

/* ── sem os quadradinhos do mapa, volta ao desenho ────────── */
const ctx2=await b.newContext({viewport:{width:400,height:860}});
await ctx2.route('https://tile.openstreetmap.org/**', r=>r.abort());
const s=await ctx2.newPage();
s.on('pageerror',e=>err.push('sem quadrados: '+e.message));
await s.goto(U+'#dono'); await s.waitForTimeout(1500);
await s.fill('#i-email','patrao@exemplo.cv'); await s.fill('#i-cod','9999');
await s.click('[data-f="entrar"]');
ok('sem rede para o mapa, volta sozinho ao desenho da Praia',
   await esperar(()=>s.isVisible('svg.mapa'),10000));
const s2=await ctx2.newPage();
/* (o mesmo aparelho: já com a sessão aberta do separador de cima) */
await s2.goto('file://'+process.cwd()+'/_mapa_sem.html#dono'); await s2.waitForTimeout(1500);
if(await s2.isVisible('#i-email')){
  await s2.fill('#i-email','patrao@exemplo.cv'); await s2.fill('#i-cod','9999');
  await s2.click('[data-f="entrar"]'); }
ok('e sem a biblioteca do mapa, também', await esperar(()=>s2.isVisible('svg.mapa'),8000));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
