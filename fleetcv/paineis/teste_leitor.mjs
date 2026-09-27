/* LER OS KM NA FOTOGRAFIA DO QUADRANTE — dentro da aplicação
   O condutor fotografa o conta-quilómetros e o telemóvel lê os números
   (PaddleOCR, no próprio telemóvel, num Worker): o campo dos km fica
   preenchido, o condutor confere. O que ele escreveu à mão manda sempre.
   E o patrão vê quando o número escrito não bate com a fotografia.

   Corre sem rede: o motor (ONNX Runtime) e os modelos, que a aplicação
   vai buscar ao jsDelivr, servem-se aqui das cópias em node_modules. As
   fotografias do quadrante são desenhadas pelo próprio teste, com
   números conhecidos. A precisão em fotografias verdadeiras mede-se à
   parte, em ocr/ (58 quadrantes reais). */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_leitor.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const NM=path.resolve('node_modules');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_leitor.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,250)); } return false; };
const ctx=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
/* o jsDelivr, servido das cópias locais (e contado) */
let pedidosCdn=0;
await ctx.route('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/**', r=>{ pedidosCdn++;
  const f=path.join(NM,'onnxruntime-web/dist', new URL(r.request().url()).pathname.split('/').pop());
  r.fulfill({path:f, headers:{'access-control-allow-origin':'*',
    'content-type': f.endsWith('.wasm')?'application/wasm':(f.endsWith('.mjs')||f.endsWith('.js'))?'text/javascript':'application/octet-stream'}}); });
await ctx.route('https://cdn.jsdelivr.net/npm/@gutenye/ocr-models@1.4.2/assets/**', r=>{ pedidosCdn++;
  const f=path.join(NM,'@gutenye/ocr-models/assets', new URL(r.request().url()).pathname.split('/').pop());
  r.fulfill({path:f, headers:{'access-control-allow-origin':'*'}}); });

/* ── as fotografias do quadrante, desenhadas ──────────────── */
const des=await ctx.newPage();
const quadrante=async(km)=>Buffer.from(await des.evaluate(km=>{
  const c=document.createElement('canvas'); c.width=1280; c.height=720;
  const x=c.getContext('2d'); x.fillStyle='#15171a'; x.fillRect(0,0,1280,720);
  /* o velocímetro à volta, que o leitor tem de ignorar */
  x.fillStyle='#f2f2f2'; x.font='bold 54px sans-serif';
  [[180,560,'20'],[160,380,'40'],[250,215,'60'],[420,110,'80'],[610,80,'100'],
   [800,110,'120'],[970,215,'140'],[1050,380,'160'],[1030,560,'180']].forEach(p=>x.fillText(p[2],p[0],p[1]));
  x.font='34px sans-serif'; x.fillText('km/h',590,300);
  if(km){
    x.fillStyle='#000'; x.fillRect(420,420,440,110);
    x.fillStyle='#f5f5f5'; x.font='bold 84px monospace'; x.fillText(km,448,505);
    x.font='30px sans-serif'; x.fillText('km',875,505);
  }
  return c.toDataURL('image/jpeg',0.9).split(',')[1]; }, km),'base64');
const foto=async(pg,km)=>pg.setInputFiles('#ff',{name:'quadrante.jpg',mimeType:'image/jpeg',buffer:await quadrante(km)});

/* ── o condutor (sem a câmara de dentro: vai pelo ficheiro) ── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.addInitScript(()=>{ try{ navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('sem câmara')); }catch(e){} });
const txt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]', {hasText:'ST-28-ED'}).click(); await c.waitForTimeout(500);
ok('o carro ficou nos 120.000 km', (await c.inputValue('#i-km'))==='120000');

const t0=Date.now();
await foto(c,'120050');
ok('ao fotografar, diz que está a ler (e que da primeira vez demora mais)',
   await esperar(async()=>/A ler os números da fotografia/.test(await txt()),4000));
ok('lê os km na fotografia e preenche o campo',
   await esperar(async()=>(await c.inputValue('#i-km'))==='120050', 90000), await c.inputValue('#i-km'));
ok('e diz de onde veio, para o condutor conferir',
   /Lido na fotografia: 120\.050 km/.test(await txt()));
console.log('   (a primeira leitura, com o leitor a chegar: '+((Date.now()-t0)/1000).toFixed(1)+' s)');
ok('o motor e os modelos vieram do jsDelivr', pedidosCdn>=4, pedidosCdn+' pedidos');

const t1=Date.now(), antes=pedidosCdn;
await foto(c,'120061');
ok('repetir a fotografia volta a ler, e troca o que ela própria tinha preenchido',
   await esperar(async()=>(await c.inputValue('#i-km'))==='120061', 30000), await c.inputValue('#i-km'));
console.log('   (a segunda leitura: '+((Date.now()-t1)/1000).toFixed(1)+' s)');
ok('da segunda vez já não vai buscar nada', pedidosCdn===antes, (pedidosCdn-antes)+' pedidos');

/* o que o condutor escreveu à mão manda */
await c.fill('#i-km','120070'); await c.waitForTimeout(500);
await foto(c,'120050');
ok('se o condutor já escreveu outro número, não lho troca',
   await esperar(async()=>/Na fotografia li 120\.050 km/.test(await txt()), 30000) &&
   (await c.inputValue('#i-km'))==='120070', await c.inputValue('#i-km'));
ok('mas avisa-o para conferir', /Confira o número que escreveu/.test(await txt()));

/* uma fotografia sem números */
await foto(c,'');
ok('sem números na fotografia, diz que não conseguiu ler',
   await esperar(async()=>/Não consegui ler os números/.test(await txt()), 30000));
ok('e o campo fica com o que lá estava', (await c.inputValue('#i-km'))==='120070');

/* segue com o número escrito (que não bate com a fotografia) */
await foto(c,'120050');
await esperar(async()=>/Na fotografia li 120\.050/.test(await txt()), 30000);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2000);
const t=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno);
ok('o turno guarda o que se leu, ao lado do que se escreveu',
   t.kmInicio===120070 && t.kmLidoInicio===120050, t.kmInicio+' / '+t.kmLidoInicio);

/* ── o patrão vê que não bate ─────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(700);
await p.click('.faixa [data-turno]'); await p.waitForTimeout(1500);
ok('durante o turno, o patrão vê na fotografia que o número não bate',
   await esperar(async()=>/Quadrante ao começar · 120\.070 km · a foto mostra 120\.050/.test(await p.textContent('#ecra')), 10000));

/* ── no fim do turno também lê ────────────────────────────── */
await c.bringToFront();
await c.waitForTimeout(2500);
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
const proposto=+(await c.inputValue('#i-kmf'));
await foto(c,'120120');
ok('no fim, lê o conta-quilómetros e troca a conta do GPS pelo número da fotografia',
   await esperar(async()=>(await c.inputValue('#i-kmf'))==='120120', 30000),
   proposto+' → '+(await c.inputValue('#i-kmf')));
ok('sabendo onde o turno começou, não aceita um número de trás',
   await (async()=>{ await c.fill('#i-kmf',''); await c.evaluate(()=>{});
     await foto(c,'119000');
     return await esperar(async()=>/Não consegui ler os números/.test(await txt()), 30000); })());

/* fecha com o número da fotografia; o patrão vê o aviso nas contas */
await c.fill('#i-kmf','120120'); await c.waitForTimeout(500);
await c.click('[data-f="terminar"]'); await c.waitForTimeout(1500);
ok('o turno fecha', /Turno terminado/.test(await txt()));
await p.bringToFront();
ok('e nas contas do turno, o patrão vê o aviso: o número escrito não bate com a fotografia',
   await esperar(async()=>/escreveu 120\.070, a fotografia mostra 120\.050/.test(await p.textContent('#ecra')), 15000));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
