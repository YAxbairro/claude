/* AS FOTOGRAFIAS DO QUADRANTE E DO TALÃO — que têm de entrar
   No teste do Yanick nenhuma entrou: nem a do quadrante ao abrir, nem a do
   fim, nem havia abastecimentos. O telemóvel saía para a câmara, a
   aplicação repintava-se entretanto e a fotografia voltava para um botão
   que já não existia; em telemóveis com pouca memória o Android fechava
   a página. Aqui prova-se o caminho novo: a câmara abre dentro da
   aplicação, a fotografia fica, sobe logo, e o patrão vê-a durante o
   turno. E os caminhos de recurso, quando a câmara de dentro não dá.

   O Chromium traz uma câmara de mentira (--use-fake-device-for-media-stream). */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_camara.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_camara.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};
const ctx=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation','camera'], geolocation:gps});

/* o que está na base de mentira (vive no navegador) */
const naBase=(pg, coleccao)=>pg.evaluate(c=>{ const r=[];
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(k.startsWith('sb:d|f1|'+c+'|')) r.push(k.split('|').slice(3).join('|')); }
  return r; }, coleccao);

/* ── o condutor ───────────────────────────────────────────── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
const txt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(500);

await c.click('.foto');
ok('carregar em "Fotografar" abre a câmara DENTRO da aplicação', await c.isVisible('#camara'));
ok('com a imagem da câmara a correr',
   await esperar(()=>c.evaluate(()=>{ const v=document.getElementById('cam-v');
     return v && v.videoWidth>0 && !v.paused; })));
ok('e diz o que fotografar', /conta-quilómetros|números/i.test(await c.textContent('#cam-guia')),
   await c.textContent('#cam-guia'));

/* o que perdia as fotografias: a aplicação a repintar-se com a câmara
   aberta. Força-se aqui uma novidade da frota a meio. */
await c.evaluate(()=>{ for(let i=0;i<4;i++) window.dispatchEvent(new Event('focus'));
  Nuvem.guardarFrota && Nuvem.dados().frota && Nuvem.guardarFrota(Nuvem.dados().frota); });
await c.waitForTimeout(700);
ok('a câmara aguenta a aplicação a repintar-se por trás', await c.isVisible('#camara'));
await c.click('#cam-tirar'); await c.waitForTimeout(900);
ok('disparar fecha a câmara', !(await c.isVisible('#camara')));
ok('e a fotografia do quadrante FICA no ecrã', await c.isVisible('.foto.feita img'));
ok('e a câmara foi largada (não fica a gastar bateria)',
   await c.evaluate(()=>!document.getElementById('cam-v').srcObject));
const tam=await c.evaluate(()=>Math.round(document.querySelector('.foto.feita img').src.length/1024));
ok('leve, para os dados do condutor', tam>0 && tam<170, tam+' kB');

/* o telemóvel fecha a página a meio (chamada, falta de memória) */
await c.fill('#i-km','120050'); await c.waitForTimeout(600);
await c.reload(); await c.waitForTimeout(3000);
ok('se a página recarregar, volta ao mesmo passo', /Quantos km/.test(await txt()));
ok('com a fotografia que já tinha tirado', await c.isVisible('.foto.feita img'));
ok('e com os km que já tinha escrito', (await c.inputValue('#i-km'))==='120050');

await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2500);
ok('abre o turno', await c.isVisible('.volante'));
const tid=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.id);
ok('a fotografia do quadrante SOBE LOGO, com o turno a começar',
   await esperar(async()=>(await naBase(c,'fotos')).includes(tid+'_inicio')));

/* ── o patrão, durante o turno ────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(700);
await p.click('.faixa [data-f="detalhes"]'); await p.waitForTimeout(1500);
ok('o patrão vê a fotografia do quadrante DURANTE o turno',
   await esperar(async()=>/Quadrante ao começar/.test(await p.textContent('#ecra')), 10000));

/* ── o abastecimento, com a fotografia do talão ───────────── */
await c.bringToFront();
await c.click('[data-f="ir-abast"]'); await c.waitForTimeout(600);
await c.click('.foto'); await c.waitForTimeout(300);
ok('no abastecimento, a câmara também abre dentro', await c.isVisible('#camara'));
ok('a pedir o talão', /talão/i.test(await c.textContent('#cam-guia')), await c.textContent('#cam-guia'));
await esperar(()=>c.evaluate(()=>document.getElementById('cam-v').videoWidth>0));
await c.click('#cam-tirar'); await c.waitForTimeout(900);
ok('a fotografia do talão fica', await c.isVisible('.foto.feita img'));
await c.fill('#i-valor','2000'); await c.waitForTimeout(500);
await c.click('[data-f="guardar-abast"]'); await c.waitForTimeout(1200);
ok('o abastecimento regista-se e volta ao volante', await c.isVisible('.volante') &&
   /Já abasteceu/.test(await txt()));
ok('a fotografia do talão SOBE LOGO',
   await esperar(async()=>(await naBase(c,'fotos')).some(k=>k.startsWith(tid+'_ab'))));
await p.bringToFront();
ok('e o patrão vê o talão durante o turno',
   await esperar(async()=>/Talão · 2\.000 CVE/.test(await p.textContent('#ecra')), 12000));
ok('com os litros certos (2.000 CVE a 145 = 13,79 litros, não "0,00 litros")',
   /Abasteceu 2\.000 CVE[^]*?13,79 litros/.test(await p.textContent('#ecra')),
   ((await p.textContent('#ecra')).match(/Abasteceu [\d.]+ CVE[^]*?[\d,]+ litros/)||[''])[0]);
ok('e as contas do turno ao vivo não dão disparates',
   !/NaN|Infinity|undefined/.test(await p.textContent('#ecra')),
   ((await p.textContent('#ecra')).match(/.{40}(NaN|Infinity|undefined).{20}/)||[''])[0]);

/* o servidor aflito: uma sessão caducada e um 503 a meio. Antes, a
   fila deitava a fotografia fora à primeira recusa destas. */
await c.bringToFront();
await c.evaluate(()=>{ window.__falharEscritas=4; });
await c.click('[data-f="ir-abast"]'); await c.waitForTimeout(500);
await c.click('.foto'); await esperar(()=>c.evaluate(()=>document.getElementById('cam-v').videoWidth>0));
await c.click('#cam-tirar'); await c.waitForTimeout(700);
await c.fill('#i-valor','1000'); await c.waitForTimeout(400);
await c.click('[data-f="guardar-abast"]'); await c.waitForTimeout(800);
const chave2=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.abast[1].chaveFoto);
ok('com o servidor a falhar (sessão caducada, 503), a fotografia não se perde: espera na fila',
   !(await naBase(c,'fotos')).includes(chave2) &&
   await c.evaluate(k=>JSON.parse(localStorage.getItem('fleetcv-fila')||'[]').some(x=>x.id===k), chave2));
await c.evaluate(()=>window.dispatchEvent(new Event('online')));
ok('e sobe quando o servidor volta',
   await esperar(async()=>(await naBase(c,'fotos')).includes(chave2), 60000));
c.once('dialog', d=>d.accept());
await c.locator('[data-apagar="1"]').click(); await c.waitForTimeout(800);

/* apagar um abastecimento não troca as fotografias dos outros */
await c.bringToFront();
await c.click('[data-f="ir-abast"]'); await c.waitForTimeout(500);
await c.fill('#i-valor','500'); await c.waitForTimeout(400);
await c.click('[data-f="guardar-abast"]'); await c.waitForTimeout(800);
c.once('dialog', d=>d.accept());
await c.locator('[data-apagar="0"]').click(); await c.waitForTimeout(800);
const ab=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.abast);
ok('apagar o primeiro abastecimento deixa o segundo sem fotografia (e não herda a do outro)',
   ab.length===1 && ab[0].valor===500 && !ab[0].temFoto);

/* ── fechar ───────────────────────────────────────────────── */
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
await c.click('.foto'); await esperar(()=>c.evaluate(()=>document.getElementById('cam-v').videoWidth>0));
await c.click('#cam-tirar'); await c.waitForTimeout(900);
await c.click('[data-f="terminar"]'); await c.waitForTimeout(2500);
ok('fecha o turno', /Turno terminado/.test(await txt()));
ok('a fotografia do fim sobe', await esperar(async()=>(await naBase(c,'fotos')).includes(tid+'_fim')));
const enviadas=await c.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('fleetcv-fotos-ok')||'{}')));
ok('cada fotografia subiu uma vez só (as do princípio não voltam a subir no fim)',
   enviadas.includes(tid+'_inicio') && enviadas.includes(tid+'_fim'), enviadas.length+' marcadas');

/* ── quando a câmara de dentro não dá ─────────────────────── */
const ctx2=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:gps});
const n=await ctx2.newPage();
n.on('pageerror',e=>err.push('sem câmara: '+e.message));
await n.goto(U+'#condutor'); await n.waitForTimeout(1500);
await n.evaluate(()=>{ navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('NotAllowedError')); });
await n.fill('#i-email','antonio@exemplo.cv'); await n.fill('#i-cod','1234');
await n.click('[data-f="entrar"]'); await n.waitForTimeout(1500);
await n.locator('[data-carro]').first().click(); await n.waitForTimeout(500);
await n.click('.foto'); await n.waitForTimeout(600);
ok('sem licença para a câmara, oferece a câmara do telemóvel',
   await n.isVisible('#cam-falhou') && /câmara do telemóvel/.test(await n.textContent('#cam-falhou')));
await n.setInputFiles('#ff', {name:'quadrante.jpg', mimeType:'image/jpeg',
  buffer: await (async()=>{ const pg=await ctx2.newPage();
    const b64=await pg.evaluate(()=>{ const c=document.createElement('canvas'); c.width=1600; c.height=1200;
      const x=c.getContext('2d'); x.fillStyle='#ddd'; x.fillRect(0,0,1600,1200);
      x.fillStyle='#000'; x.font='bold 200px sans-serif'; x.fillText('120456',300,650);
      return c.toDataURL('image/jpeg',0.9).split(',')[1]; });
    await pg.close(); return Buffer.from(b64,'base64'); })()});
await n.waitForTimeout(1200);
ok('e a fotografia de lá também entra', await n.isVisible('.foto.feita img'));
ok('com a câmara de dentro fechada', !(await n.isVisible('#camara')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
