/* O MAPA DE CABO VERDE, NOSSO
   Todas as ilhas num ficheiro só (site/mapa/cabo-verde-*.pmtiles, 17 MB,
   recortado do OpenStreetMap pelo Protomaps), lido aos pedaços. O patrão
   e o condutor vêem-no escuro e limpo no tema escuro, com as ruas e os
   nomes; e a rua onde o carro está aparece escrita, tirada do próprio
   mapa. Sem o ficheiro, ficam os quadradinhos do OpenStreetMap.

   Corre sem rede: as bibliotecas vão dentro da página, o ficheiro do
   mapa é servido aos pedaços (como o site faz) e o OpenStreetMap é
   imitado — e contado, para se saber que não foi preciso. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const NM=path.resolve('node_modules');
const leafletJs=fs.readFileSync(path.join(NM,'leaflet/dist/leaflet.js'),'utf8');
const leafletCss=fs.readFileSync(path.join(NM,'leaflet/dist/leaflet.css'),'utf8');
const pmlJs=fs.readFileSync(path.join(NM,'protomaps-leaflet/dist/protomaps-leaflet.js'),'utf8');
const FICHEIRO=fs.readdirSync('../site/mapa').filter(f=>f.endsWith('.pmtiles'))[0];
const MAPA=fs.readFileSync(path.join('../site/mapa',FICHEIRO));
const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_mapa_cv.html', '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira", mapa:"https://mapa.local/'+FICHEIRO+'"};</script>'+
  '<script>'+falso+'</script><style>'+leafletCss+'</style>'+
  '<script>'+leafletJs+'</script><script>'+pmlJs+'</script></head><body>\n'+app);

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/58BAwAI/AL+hc2rNAAAAABJRU5ErkJggg==','base64');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_mapa_cv.html';
const esperar=async(f,ms=10000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,250)); } return false; };

/* o ficheiro do mapa, aos pedaços, como o site o serve */
const servirMapa=async(ctx, conta)=>ctx.route('https://mapa.local/**', r=>{
  const rg=r.request().headers()['range'];
  const m=rg && rg.match(/bytes=(\d+)-(\d*)/);
  if(!m) return r.fulfill({status:200, body:MAPA, contentType:'application/octet-stream'});
  const de=+m[1], ate=m[2]?Math.min(+m[2], MAPA.length-1):MAPA.length-1;
  if(conta) conta.pedacos++, conta.bytes+=ate-de+1;
  r.fulfill({status:206, body:MAPA.subarray(de, ate+1), contentType:'application/octet-stream',
    headers:{'content-range':'bytes '+de+'-'+ate+'/'+MAPA.length, 'accept-ranges':'bytes',
             'access-control-allow-origin':'*', 'access-control-expose-headers':'content-range'}}); });
const imitarOsm=async(ctx, conta)=>ctx.route('https://tile.openstreetmap.org/**', r=>{ conta.osm++;
  r.fulfill({body:PNG, contentType:'image/png'}); });

const condutorNaEstrada=async(ctx)=>{
  const c=await ctx.newPage(); c.on('pageerror',e=>err.push('condutor: '+e.message));
  await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
  await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
  await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
  await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
  await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
  await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2500);
  return c; };
const patraoASeguir=async(ctx)=>{
  const p=await ctx.newPage(); p.on('pageerror',e=>err.push('patrão: '+e.message));
  await p.goto(U+'#dono'); await p.waitForTimeout(1500);
  await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
  await p.click('[data-f="entrar"]');
  await esperar(()=>p.isVisible('#lugar-mapa-frota .leaflet-container'));
  await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(3000);
  return p; };
const desenhado=(pg, sel)=>pg.evaluate(sel=>{
  const cx=document.querySelector(sel); if(!cx) return null;
  return {raster:cx.classList.contains('raster'),
          canvas:cx.querySelectorAll('canvas.leaflet-tile-loaded, .leaflet-tile-loaded canvas, canvas.leaflet-tile').length,
          img:cx.querySelectorAll('img.leaflet-tile-loaded').length,
          atrib:(cx.querySelector('.leaflet-control-attribution')||{}).textContent||''}; }, sel);

/* ── com o mapa de Cabo Verde ─────────────────────────────── */
const conta={pedacos:0, bytes:0, osm:0};
const ctx=await b.newContext({viewport:{width:393,height:873}, colorScheme:'dark'});
await servirMapa(ctx, conta); await imitarOsm(ctx, conta);
const c=await condutorNaEstrada(ctx);
const p=await patraoASeguir(ctx);
const dp=await desenhado(p, '#lugar-mapa-frota .mapa-vivo');
ok('o mapa do patrão é o de Cabo Verde (desenhado aqui, não quadradinhos de fora)',
   dp && !dp.raster && dp.canvas>0, JSON.stringify(dp));
ok('com a atribuição ao OpenStreetMap', dp && /OpenStreetMap/.test(dp.atrib), dp && dp.atrib);
ok('lê o ficheiro aos pedaços, não inteiro', conta.pedacos>0 && conta.bytes<MAPA.length/4,
   conta.pedacos+' pedaços, '+Math.round(conta.bytes/1024)+' kB de '+Math.round(MAPA.length/1024)+' kB');
ok('o patrão vê a rua onde o carro vai (tirada do próprio mapa)',
   await esperar(async()=>/(Rua|Avenida|Estrada|Praça|Largo|Travessa|Circular)\s/i.test(await p.textContent('.faixa-onde')), 40000),
   (await p.textContent('.faixa-onde')).split('·')[0].trim());
await p.screenshot({path:'_mapa_cv_dono.png'}).catch(()=>{});

await c.bringToFront(); await c.waitForTimeout(3000);
const dc=await desenhado(c, '#lugar-mapa-volante .mapa-vivo');
ok('o volante do condutor também', dc && !dc.raster && dc.canvas>0, JSON.stringify(dc));
ok('e o condutor vê a rua por cima do mapa',
   await esperar(async()=>/(Rua|Avenida|Estrada|Praça|Largo|Travessa|Circular)\s/i.test(await c.textContent('.onde')), 40000),
   (await c.textContent('.onde').catch(()=>'—')));
ok('sem pedir nada ao OpenStreetMap', conta.osm===0, conta.osm+' quadradinhos');
await c.screenshot({path:'_mapa_cv_volante.png'}).catch(()=>{});
await ctx.close();

/* ── sem o ficheiro do mapa: os quadradinhos do OpenStreetMap ── */
const conta2={pedacos:0, bytes:0, osm:0};
const ctx2=await b.newContext({viewport:{width:393,height:873}});
await ctx2.route('https://mapa.local/**', r=>r.fulfill({status:404, body:'não há'}));
await imitarOsm(ctx2, conta2);
await condutorNaEstrada(ctx2);
const p2=await patraoASeguir(ctx2);
await p2.waitForTimeout(1500);
const d2=await desenhado(p2, '#lugar-mapa-frota .mapa-vivo');
ok('sem o ficheiro, o mapa passa sozinho aos quadradinhos do OpenStreetMap',
   d2 && d2.raster && conta2.osm>0, JSON.stringify(d2)+' · '+conta2.osm+' quadradinhos');
await ctx2.close();

/* ── na aplicação Android: o mapa não vai pela parte nativa ── */
const conta3={pedacos:0, bytes:0, osm:0};
const ctx3=await b.newContext({viewport:{width:393,height:873}});
await servirMapa(ctx3, conta3); await imitarOsm(ctx3, conta3);
await ctx3.addInitScript(()=>{
  /* o que o Capacitor faz: guarda o fetch da página e troca-o pelo nativo */
  window.__nativo=[]; window.CapacitorWebFetch=window.fetch;
  const pagina=window.fetch;
  window.fetch=function(r,o){ const u=typeof r==='string'?r:(r&&r.url)||''; window.__nativo.push(u);
    return pagina(r,o); }; });
await condutorNaEstrada(ctx3);
const p3=await patraoASeguir(ctx3);
const nat=await p3.evaluate(()=>window.__nativo.filter(u=>/\.pmtiles/.test(u)).length);
const d3=await desenhado(p3, '#lugar-mapa-frota .mapa-vivo');
ok('na aplicação, o ficheiro do mapa vai pelo caminho da página (nenhum pedaço pela parte nativa)',
   nat===0 && d3 && !d3.raster && conta3.pedacos>0, nat+' pela parte nativa · '+conta3.pedacos+' pedaços');
await ctx3.close();

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
