/* O CONDUTOR SAI DA APLICAÇÃO A MEIO DO TURNO
   No teste do Yanick (30/09) o carro ficou "parado" no mapa do patrão,
   com a última velocidade (19 km/h), mais de dez minutos: o telemóvel
   do condutor parou a página dez segundos depois de abrir o turno
   (ecrã apagado ou outra aplicação à frente) — uma página não corre em
   segundo plano. Aqui prova-se o que passa a acontecer:
   · o patrão sabe logo que o condutor saiu, e a que horas;
   · um carro calado há mais de 45 s fica cinzento e sem velocidade;
   · o condutor, ao voltar, é avisado de quanto tempo o GPS parou;
   · e isso fica no turno, para o patrão ver nas contas. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_fora.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_fora.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,250)); } return false; };
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};
const ctx=await b.newContext({viewport:{width:390,height:844}, permissions:['geolocation'], geolocation:gps});
/* o telemóvel a mandar a página para segundo plano (ecrã apagado) */
const esconder=pg=>pg.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});
  document.dispatchEvent(new Event('visibilitychange')); });
const vivoNaBase=pg=>pg.evaluate(()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
  if(k.startsWith('sb:d|f1|vivo|')) return JSON.parse(localStorage.getItem(k)); } return null; });

/* ── o condutor abre o turno (GPS a sério, não o ensaio) ──── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
const txt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(1500);
ok('antes de começar, o condutor é avisado: deixar a página aberta no ecrã',
   /Deixe esta página aberta no ecrã/.test(await txt()));
ok('(no Chrome não há o aviso do Instagram)', !/Abra no Chrome/.test(await txt()));
await c.click('[data-f="comecar"]'); await c.waitForTimeout(2500);
ok('o turno abre', await c.isVisible('.volante'));

/* ── o patrão segue o carro ───────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
const ptxt=()=>p.textContent('#ecra');
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(800);
ok('com o carro a mandar, a faixa não fala de sinal', !/Sem sinal|saiu da aplicação/.test(await p.textContent('.faixa')));
ok('e o carro não está a cinzento', !(await p.evaluate(()=>/--muted/.test((document.querySelector('svg.mapa g.carro-mapa path')||{}).outerHTML||''))));

/* ── o condutor apaga o ecrã ──────────────────────────────── */
await c.bringToFront();
await esconder(c);
ok('ao sair, o telemóvel ainda avisa a base que saiu',
   await esperar(async()=>{ const v=await vivoNaBase(c); return v && v.fora===true && v.foraDesde>0; }));
await p.bringToFront();
ok('o patrão vê logo que o condutor saiu da aplicação (e não um carro parado)',
   await esperar(async()=>/O condutor saiu da aplicação/.test(await p.textContent('.faixa')), 10000));
ok('sem a velocidade antiga', await p.evaluate(()=>document.querySelector('.faixa-nums .num').textContent.trim())==='—');

/* ── 11 min depois, o condutor volta à aplicação ──────────── */
await c.bringToFront();
/* (o relógio adianta-se 11 min só no instante de voltar, e volta ao
   sítio: é também a prova de que um relógio que recua não pára o envio) */
await c.evaluate(()=>{ const antes=Date.now; Date.now=()=>antes()+11*60000;
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});
  document.dispatchEvent(new Event('visibilitychange')); Date.now=antes; });
await c.waitForTimeout(800);
ok('ao voltar, o condutor é avisado de quanto tempo o GPS esteve parado',
   /O GPS esteve parado 11 min/.test(await txt()), ((await txt()).match(/O GPS esteve parado[^.]*/)||[''])[0]);
ok('e porquê', /Deixe a FleetCV aberta no ecrã/.test(await txt()));
const t1=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno);
ok('a saída fica no turno', (t1.pausas||[]).length===1 && !t1.foraDesde, JSON.stringify(t1.pausas));
await c.click('[data-f="ok-fora"]'); await c.waitForTimeout(300);
ok('"Percebi" fecha o aviso', !/O GPS esteve parado/.test(await txt()));
await p.bringToFront();
ok('e o patrão volta a ver o carro normal',
   await esperar(async()=>!/saiu da aplicação|Sem sinal/.test(await p.textContent('.faixa')), 15000));

/* ── um telemóvel que se cala sem dizer nada (sem bateria) ── */
await c.close();
ok('calado mais de 45 s: o patrão vê "Sem sinal", e o carro a cinzento',
   await esperar(async()=>/Sem sinal há/.test(await p.textContent('.faixa')) &&
     await p.evaluate(()=>/--muted/.test((document.querySelector('svg.mapa g.carro-mapa path')||{}).outerHTML||'')), 70000));
ok('sem a velocidade antiga', await p.evaluate(()=>document.querySelector('.faixa-nums .num').textContent.trim())==='—');

/* ── fecha o turno: nas contas, o tempo sem GPS ───────────── */
const c2=await ctx.newPage();
c2.on('pageerror',e=>err.push('condutor: '+e.message));
await c2.goto(U+'#condutor'); await c2.waitForTimeout(3000);
if(/O GPS esteve parado/.test(await c2.textContent('#ecra'))) await c2.click('[data-f="ok-fora"]');
await c2.click('[data-f="ir-fim"]'); await c2.waitForTimeout(600);
await c2.click('[data-f="terminar"]'); await c2.waitForTimeout(1500);
ok('o turno fecha', /Turno terminado/.test(await c2.textContent('#ecra')));
await p.bringToFront();
await p.click('[data-tab="turnos"]').catch(()=>{}); await p.waitForTimeout(800);
await p.click('[data-turno="'+t1.id+'"]'); await p.waitForTimeout(1500);
ok('nas contas do turno: saiu da aplicação, e quanto tempo sem GPS',
   await esperar(async()=>/saiu 1 vez · 11 min sem GPS/.test(await ptxt()), 15000),
   ((await ptxt()).match(/saiu[^·]*·[^G]*GPS/)||[''])[0]);

/* ── aberto dentro do Instagram ───────────────────────────── */
const ctx2=await b.newContext({viewport:{width:390,height:844}, permissions:['geolocation'], geolocation:gps,
  userAgent:'Mozilla/5.0 (Linux; Android 16; X; wv) AppleWebKit/537.36 Chrome/153 Mobile Safari/537.36 Instagram 448.0'});
const i=await ctx2.newPage();
await i.goto(U+'#condutor'); await i.waitForTimeout(1500);
await i.fill('#i-email','antonio@exemplo.cv'); await i.fill('#i-cod','1234');
await i.click('[data-f="entrar"]'); await i.waitForTimeout(1500);
await i.locator('[data-carro]').first().click(); await i.waitForTimeout(400);
await i.click('[data-f="ir-gps"]'); await i.waitForTimeout(1000);
ok('aberto dentro do Instagram, pede para abrir no Chrome', /Abra no Chrome/.test(await i.textContent('#ecra')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
