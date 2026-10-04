/* O MAPA DA FROTA CORTADO — só o canto de cima com ruas
   No teste do Yanick (02/10), no telemóvel do patrão, o mapa "A frota
   agora" mostrava ruas só num quadrado em cima à esquerda; o resto
   cinzento, com o carro no meio do cinzento. O do "turno todo" estava
   bem. O mapa da frota vive fora das repinturas e fica à espera,
   desligado da página, enquanto o patrão vê outro ecrã. Se nesse tempo
   a janela muda de tamanho (voltar de outra aplicação, o teclado, a
   barra do telemóvel), a biblioteca do mapa mede a caixa desligada —
   zero por zero — e guarda essa medida. Ao voltar ao mapa, ninguém a
   corrigia: as ruas carregavam só à volta do canto de cima.

   Mede-se a parte do mapa coberta de ruas (os quadradinhos carregados). */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const NM=path.resolve('node_modules/leaflet/dist');
const leafletJs=fs.readFileSync(path.join(NM,'leaflet.js'),'utf8');
const leafletCss=fs.readFileSync(path.join(NM,'leaflet.css'),'utf8');
const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_mapa_tamanho.html', '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script><style>'+leafletCss+'</style>'+
  '<script>'+leafletJs+'</script></head><body>\n'+app);

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==','base64');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_mapa_tamanho.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const ctx=await b.newContext({viewport:{width:393,height:873}});
await ctx.route('https://tile.openstreetmap.org/**', r=>r.fulfill({body:PNG, contentType:'image/png'}));

/* a parte da caixa do mapa coberta por quadradinhos carregados */
const coberto=(pg,sel)=>pg.evaluate(sel=>{
  const caixa=document.querySelector(sel); if(!caixa) return -1;
  const c=caixa.getBoundingClientRect(); if(!c.width) return -1;
  const ts=[...caixa.querySelectorAll('img.leaflet-tile-loaded')].map(t=>t.getBoundingClientRect());
  let n=0, dentro=0;
  for(let i=0;i<12;i++) for(let j=0;j<12;j++){
    const x=c.left+(i+.5)*c.width/12, y=c.top+(j+.5)*c.height/12; n++;
    if(ts.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)) dentro++; }
  return Math.round(100*dentro/n); }, sel);

/* ── o condutor anda (ensaio) ─────────────────────────────── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2500);

/* ── o patrão segue o carro ───────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]');
await esperar(()=>p.isVisible('#lugar-mapa-frota .leaflet-container'));
await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(2500);
const c0=await coberto(p, '#lugar-mapa-frota .mapa-vivo');
ok('a seguir o carro, o mapa da frota tem ruas de ponta a ponta', c0>=95, c0+'%');

/* vai a outro ecrã; a janela muda de tamanho enquanto lá está */
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(1500);
await p.setViewportSize({width:393, height:700}); await p.waitForTimeout(400);
await p.setViewportSize({width:393, height:873}); await p.waitForTimeout(400);
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(2500);
const c1=await coberto(p, '#lugar-mapa-frota .mapa-vivo');
ok('de volta ao mapa, depois de a janela mudar de tamanho, as ruas enchem o mapa todo', c1>=95, c1+'%');
const centro=await p.evaluate(()=>{ const m=document.querySelector('#lugar-mapa-frota .carro-vivo.on')||
    document.querySelector('#lugar-mapa-frota .carro-vivo'); const c=document.querySelector('#lugar-mapa-frota .mapa-vivo');
  if(!m||!c) return null; const a=m.getBoundingClientRect(), r=c.getBoundingClientRect();
  return {dx:Math.round(a.left+a.width/2-(r.left+r.width/2)), dy:Math.round(a.top+a.height/2-(r.top+r.height/2))}; });
ok('e o carro seguido está no meio do mapa', centro && Math.abs(centro.dx)<30 && Math.abs(centro.dy)<30, JSON.stringify(centro));

/* o mesmo, a mudar de tamanho com o mapa à vista (rodar o telemóvel) */
await p.setViewportSize({width:700, height:873}); await p.waitForTimeout(1500);
const c2=await coberto(p, '#lugar-mapa-frota .mapa-vivo');
ok('com a janela mais larga, as ruas acompanham', c2>=95, c2+'%');

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
