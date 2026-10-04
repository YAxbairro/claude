/* AS IMAGENS DA GOOGLE PLAY
   Tira as capturas do ecrã do condutor (frota de exemplo, mapa de Cabo
   Verde servido aqui), mete-as numa moldura com uma frase, e desenha o
   ícone de 512 px e o gráfico de 1024×500. Corre a partir de
   fleetcv/paineis (precisa do fleetcv.html montado e do playwright):

     cd fleetcv/paineis && node ../android/play/imagens.mjs [pasta-das-letras]

   A pasta das letras é opcional: os ficheiros .woff2 do Google Fonts e o
   fontes.css, para as letras saírem certas sem rede. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
/* o playwright é o dos paineis (é de lá que isto corre) */
const { chromium } = await import(pathToFileURL(path.resolve('node_modules/playwright/index.mjs')).href);

const AQUI=path.resolve('../android/play');
const FONTES=process.argv[2];
const NM=path.resolve('node_modules');
const leafletJs=fs.readFileSync(path.join(NM,'leaflet/dist/leaflet.js'),'utf8');
const leafletCss=fs.readFileSync(path.join(NM,'leaflet/dist/leaflet.css'),'utf8');
const pmlJs=fs.readFileSync(path.join(NM,'protomaps-leaflet/dist/protomaps-leaflet.js'),'utf8');
const FICHEIRO=fs.readdirSync('../site/mapa').filter(f=>f.endsWith('.pmtiles'))[0];
const MAPA=fs.readFileSync(path.join('../site/mapa',FICHEIRO));
const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_play.html', '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira", mapa:"https://mapa.local/'+FICHEIRO+'"};</script>'+
  '<script>'+falso+'</script><style>'+leafletCss+'</style>'+
  '<script>'+leafletJs+'</script><script>'+pmlJs+'</script></head><body>\n'+app);

const letras=async ctx=>{
  if(!FONTES) return;
  await ctx.route('https://fonts.googleapis.com/**', r=>r.fulfill({path:path.join(FONTES,'fontes.css'), contentType:'text/css'}));
  await ctx.route('https://fonts.gstatic.com/**', r=>r.fulfill({
    path:path.join(FONTES, new URL(r.request().url()).pathname.slice(1).replace(/\//g,'_')), contentType:'font/woff2'})); };
const servirMapa=ctx=>ctx.route('https://mapa.local/**', r=>{
  const m=(r.request().headers()['range']||'').match(/bytes=(\d+)-(\d*)/);
  if(!m) return r.fulfill({status:200, body:MAPA});
  const de=+m[1], ate=m[2]?Math.min(+m[2],MAPA.length-1):MAPA.length-1;
  r.fulfill({status:206, body:MAPA.subarray(de,ate+1), headers:{'content-range':'bytes '+de+'-'+ate+'/'+MAPA.length,
    'accept-ranges':'bytes','access-control-allow-origin':'*','access-control-expose-headers':'content-range'}}); });

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const U='file://'+process.cwd()+'/_play.html';
const tirar=[];   /* [ficheiro, frase] */

for(const tema of ['light','dark']){
  const ctx=await b.newContext({viewport:{width:360,height:720}, deviceScaleFactor:3, colorScheme:tema});
  await letras(ctx); await servirMapa(ctx);
  const c=await ctx.newPage();
  await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
  await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
  await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
  if(tema==='light'){ await c.screenshot({path:path.join(AQUI,'_c1.png')}); tirar.push(['_c1.png','Escolhe o carro e começa o turno']); }
  await c.locator('[data-carro]').first().click(); await c.waitForTimeout(500);
  if(tema==='light'){ await c.screenshot({path:path.join(AQUI,'_c2.png')}); tirar.push(['_c2.png','Uma fotografia do conta-quilómetros e pronto']); }
  await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
  await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(9000);
  /* o aviso do modo de experimentar não é para a loja */
  await c.evaluate(()=>document.querySelectorAll('.cartao.nota').forEach(x=>{
    if(/A experimentar/.test(x.textContent)) x.remove(); }));
  await c.screenshot({path:path.join(AQUI,'_c3'+tema+'.png')});
  tirar.push(['_c3'+tema+'.png', tema==='light'?'O percurso fica gravado, mesmo com o ecrã apagado':'De noite, o mapa escurece']);
  await ctx.close();
}

/* a moldura: 1080×1920, a frase em cima, o ecrã por baixo */
const p=await b.newPage({viewport:{width:1080,height:1920}});
await letras(p.context());
let n=0;
for(const [f,frase] of tirar){
  const img='data:image/png;base64,'+fs.readFileSync(path.join(AQUI,f)).toString('base64');
  await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&display=swap">
  <body style="margin:0;width:1080px;height:1920px;background:#0B7F8E;display:flex;flex-direction:column;align-items:center;overflow:hidden">
  <h1 style="font:700 74px/1.12 Archivo,'Liberation Sans',sans-serif;color:#fff;text-align:center;margin:110px 80px 70px;
    letter-spacing:-.02em;text-wrap:balance">${frase}</h1>
  <img src="${img}" style="width:840px;border-radius:44px;box-shadow:0 30px 80px rgba(0,0,0,.35);border:10px solid #06191C"></body>`);
  await p.waitForTimeout(600);
  await p.screenshot({path:path.join(AQUI,'captura-'+(++n)+'.png')});
  fs.unlinkSync(path.join(AQUI,f));
}

/* o alfinete da FleetCV (o mesmo de android/icones.mjs) */
const alfinete=(cx,cy,s)=>`
  <path d="M ${cx-44*s} ${cy+30*s} C ${cx-30*s} ${cy+14*s}, ${cx-18*s} ${cy+30*s}, ${cx-6*s} ${cy+10*s}" fill="none"
        stroke="#fff" stroke-opacity=".55" stroke-width="${5*s}" stroke-linecap="round" stroke-dasharray="${1*s} ${10*s}"/>
  <path transform="translate(${cx-24*s} ${cy-40*s}) scale(${2*s})"
        d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"
        fill="#fff"/>`;
/* ícone: quadrado cheio (a Play arredonda sozinha) */
await p.setViewportSize({width:512,height:512});
await p.setContent(`<body style="margin:0"><svg width="512" height="512"><rect width="512" height="512" fill="#0B7F8E"/>${alfinete(256,266,4.4)}</svg></body>`);
await p.screenshot({path:path.join(AQUI,'icone-512.png'), clip:{x:0,y:0,width:512,height:512}});
/* gráfico de destaque */
await p.setViewportSize({width:1024,height:500});
await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700&family=IBM+Plex+Sans:wght@500&display=swap">
  <body style="margin:0;width:1024px;height:500px;background:#0B7F8E;display:flex;align-items:center;gap:44px;padding:0 70px;box-sizing:border-box">
  <svg width="210" height="210" style="flex:none"><rect width="210" height="210" rx="46" fill="#06191C" fill-opacity=".22"/>${alfinete(105,110,1.8)}</svg>
  <div><div style="font:700 88px/1 Archivo,'Liberation Sans',sans-serif;color:#fff;letter-spacing:-.02em">FleetCV</div>
  <div style="font:500 34px/1.3 'IBM Plex Sans','Liberation Sans',sans-serif;color:#E3F1F3;margin-top:18px;max-width:600px">
  Os táxis da frota no mapa, os quilómetros e o combustível de cada turno.</div></div></body>`);
await p.waitForTimeout(600);
await p.screenshot({path:path.join(AQUI,'grafico-1024x500.png')});
await b.close();
fs.unlinkSync('_play.html');
console.log('feito:', fs.readdirSync(AQUI).filter(f=>f.endsWith('.png')).join(', '));
