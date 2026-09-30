/* QUANTO GASTA O TELEMÓVEL DO CONDUTOR — dados e bateria
   Com a aplicação Android, o GPS corre o turno inteiro (um ponto por
   segundo, com o ecrã apagado). Aqui mede-se o telemóvel a meio de um
   turno de 6 horas, com o ecrã apagado: 100 segundos, metade a andar e
   metade parado, e conta-se o que sobe para a base e o que o telemóvel
   faz por cada ponto de GPS.

   Antes (30/09): de 45 em 45 s reenviava o percurso TODO desde o começo
   do turno (às 6 h eram ~1 MB de cada vez); guardava um ponto por
   segundo mesmo parado; recontava os km do turno inteiro a cada ponto;
   e com o ecrã apagado continuava a desenhar o volante. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_consumo.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_consumo.html';
const ANDROID='Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const kB=x=>(x/1024).toFixed(1)+' kB', MB=x=>(x/1048576).toFixed(1)+' MB';
/* cada pedido HTTPS leva ~2 kB de cabeçalhos (a chave, a sessão, e a
   resposta do Supabase: medida, ~900 bytes), além do que se envia */
const CABECALHOS=2048;

/* a aplicação imitada, como em teste_app_android.mjs */
const capacitor=()=>{
  window.__nat={cb:null, removidos:0};
  window.Capacitor={ isNativePlatform:()=>true, Plugins:{
    BackgroundGeolocation:{
      addWatcher(op, cb){ __nat.cb=cb; return Promise.resolve('w1'); },
      removeWatcher(){ __nat.removidos++; __nat.cb=null; return Promise.resolve(); },
      openSettings(){ return Promise.resolve(); } },
    LocalNotifications:{ requestPermissions:()=>Promise.resolve({display:'granted'}) },
    Bateria:{ estado:()=>Promise.resolve({semRestricoes:true}), pedir(){ return Promise.resolve(); } } } };
};

const ctx=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const c=await ctx.newPage();
c.on('pageerror',e=>err.push(e.message));
await c.addInitScript(capacitor);
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.evaluate(()=>__nat.cb({latitude:14.9177, longitude:-23.5092, accuracy:6, speed:0, time:Date.now()}));
await c.waitForTimeout(400);
await c.click('[data-f="comecar"]'); await c.waitForTimeout(1500);
ok('o turno abre', await c.isVisible('.volante'));

/* ── 6 horas de turno já feitas ─────────────────────────────
   O GPS da aplicação entrega 6 h de pontos, um por segundo (20 min a
   andar a 36 km/h, 25 min parado à espera de cliente, e assim), com a
   hora de cada um — e a aplicação guarda-os como na estrada. Depois o
   Android fecha-a e ela reabre a meio do turno. */
await c.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  const agora=Date.now(), N=6*3600; let lat=14.9177, lon=-23.5092, rumo=0;
  for(let i=0;i<N;i++){
    const anda=(i%2700)<1200;
    if(anda){ rumo+=0.002*Math.sin(i/90); lat+=0.00009*Math.cos(rumo); lon+=0.00009*Math.sin(rumo); }
    const j=anda?0:(Math.random()-0.5)*0.00005;
    __nat.cb({latitude:lat+j, longitude:lon+j, accuracy:6+(i%5), speed:anda?10:0, bearing:0,
      time:agora-(N-i)*1000}); }
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}); });
await c.waitForTimeout(9000);             /* o telemóvel guarda o turno de 8 em 8 s */
const nRasto=await c.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.length);
console.log('   (6 h de GPS: 21600 pontos dados, '+nRasto+' guardados no percurso)');
ok('parado, não se guarda um ponto por segundo (e a andar, um a cada 20 m)', nRasto < 21600*0.4, nRasto+' de 21600');
await c.close();
const c2=await ctx.newPage();
c2.on('pageerror',e=>err.push(e.message));
await c2.addInitScript(capacitor);
await c2.goto(U+'#condutor'); await c2.waitForTimeout(2500);
ok('a aplicação reabre no turno, com as 6 h', await c2.isVisible('.volante') &&
   await c2.evaluate(n=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.length>=n, nRasto));
if(!(await c2.evaluate(()=>!!__nat.cb))) console.log('   (o GPS não voltou a ligar-se sozinho)');
const cdp=await ctx.newCDPSession(c2);
await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});   /* um telemóvel, não um computador */
await c2.waitForTimeout(47000);   /* a primeira gravação depois de reabrir (essa leva tudo, uma vez) */

/* ── o condutor apaga o ecrã; 100 s: 50 a andar, 50 parado ── */
await c2.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});
  document.dispatchEvent(new Event('visibilitychange'));
  window.__enviadas={}; window.__mudancas=0; window.__msGps=0; window.__nGps=0;
  const u=JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.slice(-1)[0];
  window.__ultima=[u[0], u[1]];
  new MutationObserver(m=>{ window.__mudancas+=m.length; })
    .observe(document.getElementById('ecra'), {subtree:true, childList:true, characterData:true, attributes:true});
});
const nAntes=await c2.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.length);
const T=100;
for(let s=0;s<T;s++){
  await c2.evaluate(s=>{
    const anda=s<50, u=__ultima;
    if(anda){ u[0]+=0.00009; u[1]+=0.00002; }
    const t0=performance.now();
    if(__nat.cb) __nat.cb({latitude:u[0]+(anda?0:(Math.random()-0.5)*0.00003), longitude:u[1],
      accuracy:6, speed:anda?10:0, bearing:10, time:Date.now()});
    __msGps+=performance.now()-t0; __nGps++; }, s);
  await c2.waitForTimeout(1000);
}
await c2.waitForTimeout(9000);    /* o telemóvel guarda o turno de 8 em 8 s */
const r=await c2.evaluate(()=>{
  const e=window.__enviadas||{}, g=k=>e[k]||{n:0,bytes:0};
  /* só o que é da aplicação (a base de mentira também guarda no localStorage) */
  let ls=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(k.startsWith('fleetcv-')) ls+=(localStorage.getItem(k)||'').length; }
  return {vivo:g('vivo'), rastos:g('rastos'), turnos:g('turnos'),
    mudancas:__mudancas, msGps:__msGps/__nGps, ls,
    rasto:JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto.length}; });
await cdp.send('Emulation.setCPUThrottlingRate', {rate:1});
const pedidos=r.vivo.n+r.rastos.n+r.turnos.n;
const bytes=r.vivo.bytes+r.rastos.bytes+r.turnos.bytes;
const porHora=(bytes+pedidos*CABECALHOS)*3600/T;
console.log('   em '+T+' s: posição ao vivo '+r.vivo.n+'× '+kB(r.vivo.bytes)+
  ' · percurso '+r.rastos.n+'× '+kB(r.rastos.bytes)+' · turno '+r.turnos.n+'× '+kB(r.turnos.bytes));
console.log('   com os cabeçalhos: '+MB(porHora)+' por hora → '+MB(porHora*12)+' num turno de 12 h');
console.log('   pontos guardados nos 100 s: '+(r.rasto-nAntes)+' (50 a andar, 50 parado)');

ok('a meio do turno, o percurso já não sobe todo outra vez (só o que é novo)',
   r.rastos.bytes < 60*1024, kB(r.rastos.bytes)+' em '+T+' s');
ok('e com o ecrã apagado também', r.rasto-nAntes < 65, (r.rasto-nAntes)+' pontos em 100 s');
ok('ao todo, menos de 5 MB por hora a esta altura do turno', porHora < 5*1048576, MB(porHora)+'/h');
ok('cada ponto de GPS custa pouco ao telemóvel (sem recontar o turno todo)',
   r.msGps < 4, r.msGps.toFixed(2)+' ms por ponto, com o processador de um telemóvel');
ok('com o ecrã apagado, não se desenha o ecrã', r.mudancas < 20, r.mudancas+' mudanças em '+T+' s');
ok('o que fica guardado no telemóvel é pouco (a meio de um turno de 6 h)', r.ls*2 < 1048576, MB(r.ls*2)+' (em UTF-16)');

/* ── e nada se perde: os km, o fecho, o percurso na base ── */
await c2.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});
  document.dispatchEvent(new Event('visibilitychange')); });
await c2.waitForTimeout(600);
const km=await c2.evaluate(()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
  if(k.startsWith('sb:d|f1|vivo|')) return JSON.parse(localStorage.getItem(k)).kmGps; } return null; });
ok('os km do GPS continuam certos (36 km/h × 2 h 40 a andar, mais o fim)', km>85 && km<110, km+' km');
await c2.click('[data-f="ir-fim"]'); await c2.waitForTimeout(600);
await c2.click('[data-f="terminar"]'); await c2.waitForTimeout(5000);
ok('o turno fecha', /Turno terminado/.test(await c2.textContent('#ecra')));
const naBase=await c2.evaluate(()=>{ const t=JSON.parse(localStorage.getItem('fleetcv-condutor')).turnos[0];
  let n=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(k.startsWith('sb:d|f1|rastos|'+t.id+'_')) n+=(JSON.parse(localStorage.getItem(k)).pts||[]).length; }
  return {n, rasto:t.rasto?t.rasto.length:null, id:t.id}; });
ok('e o percurso inteiro está na base, sem buracos', naBase.n>0 && naBase.n===naBase.rasto, naBase.n+' de '+naBase.rasto+' pontos');

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
