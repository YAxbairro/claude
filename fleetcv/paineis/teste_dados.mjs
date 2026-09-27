/* O QUE CADA TELEMÓVEL GASTA — para crescer sem rebentar
   Contas feitas com a base verdadeira, antes desta prova: cada posição
   ao vivo levava os últimos 160 pontos do caminho (8 kB) de segundo e
   meio em segundo e meio, e ia parar ao telemóvel de TODOS os condutores
   da frota, não só ao do patrão. Com dez carros eram mais de 1 GB de
   dados por turno em cada telemóvel, e as mensagens do tempo real (que
   o Supabase cobra) multiplicavam-se pelo número de condutores. E a
   rede de segurança voltava a descarregar os 600 turnos da frota de
   minuto a minuto.

   Aqui mede-se, com contadores na base de mentira, o que cada
   telemóvel manda, recebe e lê. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_dados.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_dados.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const ctx=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const contas=(pg,onde)=>pg.evaluate(o=>window[o]||{}, onde);
const kb=x=>(x/1024).toFixed(1)+' kB';

/* ── o patrão, com o mapa aberto ──────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]');
await esperar(async()=>/A frota agora/.test(await p.textContent('#ecra')));
/* a frota de exemplo nasce ao entrar; volta-se a abrir, como no dia a
   dia de uma frota que já tem histórico */
await p.waitForTimeout(1500); await p.reload();
await esperar(async()=>/A frota agora/.test(await p.textContent('#ecra')));

/* ── o condutor sai com o carro (a andar de mentira) ──────── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
/* conta-se a partir daqui: o que o condutor gasta a conduzir */
await c.evaluate(()=>{ window.__recebidas={}; window.__enviadas={}; window.__lidas={}; });
await p.evaluate(()=>{ window.__recebidas={}; });
await c.click('[data-f="comecar-sim"]');
ok('o condutor está na estrada', await esperar(()=>c.isVisible('.volante')));
await c.waitForTimeout(45000);

const cr=await contas(c,'__recebidas'), ce=await contas(c,'__enviadas');
const pr=await contas(p,'__recebidas');
const n=(m,k)=>(m[k]||{}).n||0, by=(m,k)=>(m[k]||{}).bytes||0;
console.log('   em 45 s a conduzir — o condutor recebeu:', JSON.stringify(cr),
  '\n   mandou:', JSON.stringify(ce), '\n   o patrão recebeu:', JSON.stringify(pr));

ok('o telemóvel do condutor NÃO recebe as posições ao vivo (nem a dele, nem as dos colegas)',
   n(cr,'vivo')===0, n(cr,'vivo')+' mensagens, '+kb(by(cr,'vivo')));
ok('nem os turnos da frota', n(cr,'turnos')===0, n(cr,'turnos')+' mensagens');
ok('o patrão recebe as posições', n(pr,'vivo')>=15, n(pr,'vivo')+' em 45 s');

const vivo=await p.evaluate(()=>Nuvem.dados().vivos[0]);
const inteira=JSON.stringify({coleccao:'vivo', id:vivo.id, corpo:vivo}).length;
const media=by(pr,'vivo')/Math.max(1,n(pr,'vivo'));
ok('cada posição chega leve: só os pontos novos, não a cauda inteira',
   media < inteira*0.35, 'média '+kb(media)+' por posição; com a cauda inteira seriam '+kb(inteira));
ok('e o que o condutor manda também é leve',
   by(ce,'vivo')/Math.max(1,n(ce,'vivo')) < inteira*0.35,
   'média '+kb(by(ce,'vivo')/Math.max(1,n(ce,'vivo'))));

/* o rabicho do carro no mapa do patrão não pode encolher */
const doCondutor=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.length);
const noPatrao=vivo.rasto.length;
ok('o patrão tem a cauda inteira, cosida dos pedaços',
   noPatrao >= Math.min(160, doCondutor) - 12, noPatrao+' pontos no patrão, '+doCondutor+' no condutor (tecto 160)');
const ts=vivo.rasto.map(q=>q[2]);
ok('sem pontos repetidos nem fora de ordem',
   ts.every((t,i)=>i===0 || t>ts[i-1]));
await p.bringToFront();
const onde0=await p.evaluate(()=>{ const v=Nuvem.dados().vivos[0]; return v.lat+','+v.lon+','+v.momento; });
ok('e a posição continua a mexer no ecrã do patrão',
   await esperar(async()=>(await p.evaluate(()=>{ const v=Nuvem.dados().vivos[0]; return v.lat+','+v.lon+','+v.momento; }))!==onde0, 6000));

/* ── a rede de segurança: só pergunta pelos turnos que mudaram ─── */
/* os turnos do exemplo nasceram agora; põem-se com um mês, como os de
   uma frota que já trabalha há algum tempo */
await p.evaluate(()=>{
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(k.startsWith('sb:q|f1|turnos|')) localStorage.setItem(k, JSON.stringify('2026-08-01T10:00:00.000Z')); }
  window.__lidas={}; });
await p.waitForTimeout(800);
const antesDeVoltar=await contas(p,'__lidas');
await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
await p.waitForTimeout(1500);
const pl=await contas(p,'__lidas');
console.log('   escondido:', await p.evaluate(()=>document.hidden), '· antes de voltar:', JSON.stringify(antesDeVoltar), '· depois:', JSON.stringify(pl));
ok('ao voltar ao ecrã, o patrão NÃO volta a descarregar o histórico todo',
   n(pl,'turnos')<=2, n(pl,'turnos')+' turnos lidos');
ok('e o histórico continua lá', await p.evaluate(()=>Nuvem.dados().turnos.length)>=5,
   await p.evaluate(()=>Nuvem.dados().turnos.length)+' turnos');

/* ── e o turno fecha e chega ao histórico como antes ──────── */
await c.bringToFront();
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
await c.fill('#i-kmfim', String(await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.kmInicio+3))).catch(()=>{});
await c.click('[data-f="terminar"]');
ok('o turno fecha', await esperar(async()=>/Turno terminado/.test(await c.textContent('#ecra')), 10000));
await p.bringToFront();
ok('e sai do mapa do patrão e entra no histórico',
   await esperar(()=>p.evaluate(id=>Nuvem.dados().vivos.length===0 &&
     Nuvem.dados().turnos.some(t=>t.id===id), vivo.id), 15000));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
