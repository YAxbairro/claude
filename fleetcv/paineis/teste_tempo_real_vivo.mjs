/* TEMPO REAL A SÉRIO
   O que o Yanick viu: o número da velocidade parado, o ponteiro atrás
   do carro. Aqui mede-se, em vez de se acreditar. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const app=fs.readFileSync('fleetcv.html','utf8');
fs.writeFileSync('_vivo.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '</head><body>\n'+app);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_vivo.html';
const ctx=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'],
  geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const p=await ctx.newPage();
p.on('pageerror',e=>err.push(e.message));

/* ── 1 · o GPS é pedido sem posições velhas ── */
await p.addInitScript(()=>{
  window.__pedidos=[];
  const w=navigator.geolocation.watchPosition.bind(navigator.geolocation);
  navigator.geolocation.watchPosition=function(ok,mal,op){
    window.__pedidos.push(op||{}); return w(ok,mal,op); };
});
await p.goto(U); await p.waitForTimeout(1500);
await p.click('[data-quem="condutor"]'); await p.waitForTimeout(600);
await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','1234');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(1500);
await p.locator('[data-carro]').first().click(); await p.waitForTimeout(600);
await p.click('[data-f="ir-gps"]'); await p.waitForTimeout(1200);
await p.click('[data-f="comecar-sim"]'); await p.waitForTimeout(2500);

const ped=await p.evaluate(()=>window.__pedidos);
ok('o GPS é pedido sem aceitar posições velhas',
   ped.length>0 && ped[0].maximumAge===0 && ped[0].enableHighAccuracy===true,
   ped.length?('maximumAge='+ped[0].maximumAge):'nunca pediu');

/* ── 2 · o número da velocidade mexe entre leituras ── */
ok('está ao volante', await p.isVisible('.volante'));
const lerVel=()=>p.evaluate(()=>{
  const n=document.getElementById('v-num');
  return n?+n.textContent:null; });
const amostras=[];
for(let i=0;i<14;i++){ amostras.push(await lerVel());
  await new Promise(r=>setTimeout(r,180)); }
const distintos=new Set(amostras.filter(v=>v!=null)).size;
ok('o número da velocidade muda sozinho', distintos>=4,
   distintos+' valores diferentes em 2,5 s: '+amostras.join(' '));

/* ── 3 · o arco acompanha o número ── */
const arco=await p.evaluate(()=>{
  const a=document.getElementById('v-arco');
  return a?a.getAttribute('stroke-dashoffset'):null; });
await new Promise(r=>setTimeout(r,700));
const arco2=await p.evaluate(()=>{
  const a=document.getElementById('v-arco');
  return a?a.getAttribute('stroke-dashoffset'):null; });
ok('o arco acompanha', arco!=null && arco2!=null && arco!==arco2,
   arco+' → '+arco2);

/* ── 4 · o ponteiro persegue, não salta ── */
/* Amostra-se depressa. Se o mostrador estivesse a copiar a leitura em
   bruto, via-se um salto de dezenas de km/h de uma amostra para a
   outra (o ensaio pára em semáforos). A perseguir, cada passo é
   pequeno mesmo quando o percurso todo é grande. */
const finas=[];
for(let i=0;i<40;i++){ finas.push(await lerVel());
  await new Promise(r=>setTimeout(r,60)); }
const vals=finas.filter(v=>v!=null);
let maiorPasso=0;
for(let i=1;i<vals.length;i++)
  maiorPasso=Math.max(maiorPasso, Math.abs(vals[i]-vals[i-1]));
const amplitude=Math.max(...vals)-Math.min(...vals);
ok('o ponteiro persegue a leitura em vez de saltar',
   amplitude>=8 && maiorPasso<=amplitude*0.6,
   'percorreu '+amplitude+' km/h, maior passo '+maiorPasso);

/* ── 5 · parado, a posição sobe menos vezes ── */
const fonte=fs.readFileSync('fleetcv.html','utf8');
const mv=fonte.match(/RITMO_VIVO\s*=\s*(\d+)/);
const mp=fonte.match(/RITMO_PARADO\s*=\s*(\d+)/);
ok('anda depressa, parado abranda',
   !!mv && !!mp && +mv[1]<=1500 && +mp[1]>=10000,
   mv&&mp ? ('a andar '+mv[1]+' ms · parado '+mp[1]+' ms') : 'não encontrei');

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
