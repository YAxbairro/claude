/* A APLICAÇÃO ANDROID — o que a página faz quando corre lá dentro
   Dentro da aplicação FleetCV instalada (Capacitor), o GPS vem de um
   serviço do Android com notificação fixa (@capacitor-community/
   background-geolocation), que continua com o ecrã apagado. Aqui a
   aplicação é imitada: um window.Capacitor de mentira com os mesmos
   módulos, que entrega posições quando o teste manda — também com a
   página escondida, como faz o serviço de verdade.

   A imitação faz o que a aplicação verdadeira faz (visto no teste do
   Yanick, 02/10, num Samsung A24): a página vem do site, sem o
   @capacitor/core, e os módulos são os que o Android injecta — o
   addWatcher devolve logo o número da vigia (não uma promessa), e a
   licença da localização demora o tempo de o condutor responder. A
   imitação de antes devolvia uma promessa e escondeu o erro.

   A parte nativa (o serviço, a notificação, as licenças) prova-se no
   APK (android/LEIA-ME.md); esta prova a ligação da página a ela. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_app_android.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_app_android.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,250)); } return false; };
const ANDROID='Mozilla/5.0 (Linux; Android 16; SM-A245F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

/* a aplicação de mentira: os módulos como o Android os injecta */
const capacitor=(op)=>{
  op=op||{};
  window.__nat={watchers:0, removidos:0, bateriaPedida:0, definicoes:0, opcoes:null, cb:null,
                ordem:[], seguras:0, largadas:0, licenca:'prompt', aPedir:false,
                turnos:[], fins:0, buffer:[], esquecido:0};
  const P=v=>new Promise(r=>setTimeout(()=>r(v), 30));
  const bateria={
    estado(){ return P(Object.assign({semRestricoes: __nat.bateriaPedida>0, fabricante:'samsung'},
                                     op.antiga ? {} : {versao: op.semEnvio ? '1.0.1' : '1.2.0'})); },
    pedir(){ __nat.bateriaPedida++; return P(); } };
  if(!op.antiga){
    bateria.segurar=function(){ __nat.seguras++; return P(); };
    bateria.largar=function(){ __nat.largadas++; return P(); }; }
  /* 1.2.0: o lado nativo guarda e manda as posições se a página adormecer */
  if(!op.antiga && !op.semEnvio){
    bateria.turno=function(o){ __nat.turnos.push(JSON.parse(JSON.stringify(o))); return P(); };
    bateria.fim=function(){ __nat.fins++; return P(); };
    bateria.pontos=function(o){ return P({pontos: __nat.buffer.filter(x=>x[2]>(o.desde||0))}); };
    bateria.esquecer=function(o){ __nat.esquecido=o.ate; __nat.buffer=__nat.buffer.filter(x=>x[2]>o.ate); return P(); }; }
  window.Capacitor={ isNativePlatform:()=>true, Plugins:{
    BackgroundGeolocation:{
      checkPermissions(){ __nat.ordem.push('ver'); return P({location:__nat.licenca}); },
      requestPermissions(){ __nat.ordem.push('pedir-localizacao'); __nat.aPedir=true;
        return new Promise(r=>setTimeout(()=>{ __nat.aPedir=false;
          __nat.licenca=op.recusa?'denied':'granted'; r({location:__nat.licenca}); }, 400)); },
      /* como na aplicação: devolve o número da vigia, logo */
      addWatcher(o, cb){ __nat.watchers++; __nat.opcoes=o; __nat.cb=cb;
        __nat.ordem.push('gps:'+__nat.licenca); return 'cb'+__nat.watchers; },
      removeWatcher(){ __nat.removidos++; __nat.cb=null; return P(); },
      openSettings(){ __nat.definicoes++; return P(); } },
    LocalNotifications:{ requestPermissions(){
      __nat.ordem.push(__nat.aPedir ? 'notificacoes-AO-MESMO-TEMPO' : 'notificacoes');
      return P({display:'granted'}); } },
    Bateria: bateria } };
};
const vivoNaBase=pg=>pg.evaluate(()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
  if(k.startsWith('sb:d|f1|vivo|')) return JSON.parse(localStorage.getItem(k)); } return null; });
/* o serviço do Android a entregar uma posição */
let passo=0;
const posicao=(pg,extra)=>pg.evaluate(a=>{ if(__nat.cb) __nat.cb(Object.assign({latitude:14.9177+a.n*0.0004,
  longitude:-23.5092+a.n*0.0002, accuracy:6, speed:9, bearing:30, time:Date.now()}, a.extra||{})); }, {n:passo++, extra});
const entrarComCarro=async pg=>{
  await pg.goto(U+'#condutor'); await pg.waitForTimeout(1500);
  await pg.fill('#i-email','antonio@exemplo.cv'); await pg.fill('#i-cod','1234');
  await pg.click('[data-f="entrar"]'); await pg.waitForTimeout(1500);
  await pg.locator('[data-carro]').first().click(); await pg.waitForTimeout(400); };

/* ── o condutor, na aplicação (a primeira vez: sem licenças ainda) ── */
const ctx=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.addInitScript(capacitor);
const txt=()=>c.textContent('#ecra');
await entrarComCarro(c);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(150);
ok('um toque em "Continuar" chega ao passo do GPS (antes, o primeiro toque rebentava)',
   /Ligar o GPS/.test(await txt()));
await c.waitForTimeout(900);
const n1=await c.evaluate(()=>__nat);
ok('primeiro a licença da localização, e só depois o GPS do Android',
   n1.ordem.indexOf('pedir-localizacao')>=0 && n1.ordem.indexOf('gps:granted')>n1.ordem.indexOf('pedir-localizacao') &&
   n1.ordem.indexOf('gps:prompt')<0, n1.ordem.join(' → '));
ok('e a das notificações depois, nunca ao mesmo tempo',
   n1.ordem.indexOf('notificacoes')>n1.ordem.indexOf('gps:granted') && n1.ordem.indexOf('notificacoes-AO-MESMO-TEMPO')<0);
ok('na aplicação, o GPS vem do serviço do Android (e não do navegador)', n1.watchers===1);
ok('com a notificação fixa (é ela que o mantém com o ecrã apagado)',
   !!(n1.opcoes && n1.opcoes.backgroundMessage && n1.opcoes.backgroundTitle), n1.opcoes&&n1.opcoes.backgroundTitle);
ok('e com as posições frescas, uma a uma', n1.opcoes && n1.opcoes.stale===false && n1.opcoes.distanceFilter===0);
ok('o telemóvel fica seguro acordado enquanto o GPS corre', n1.seguras===1);
ok('o condutor lê que pode apagar o ecrã', /Pode apagar o ecrã/.test(await txt()));
ok('e não o aviso de deixar a página aberta, nem o de abrir no Chrome',
   !/Deixe esta página aberta|Abra no Chrome|Instale a aplicação/.test(await txt()));
ok('com a versão nova da aplicação, não pede para actualizar', !/versão nova da aplicação/.test(await txt()));

await posicao(c); await c.waitForTimeout(500);
ok('a primeira posição do serviço liga o GPS', /GPS ligado/.test(await txt()));
ok('sem a bateria livre, o passo principal é tirá-la da poupança (e diz porquê)',
   /Falta um passo: a bateria/.test(await txt()) && /Samsung/.test(await txt()) &&
   (await c.textContent('[data-f="bateria"].bt.pri'))!=null && await c.isVisible('.lig[data-f="comecar"]'));
await c.click('[data-f="bateria"]'); await c.waitForTimeout(2200);
ok('o botão abre o pedido do Android', await c.evaluate(()=>__nat.bateriaPedida)===1);
ok('e, dada a licença, o aviso sai e fica "Começar turno"',
   !/Falta um passo/.test(await txt()) && await c.isVisible('.bt.pri[data-f="comecar"]'));
await c.click('[data-f="comecar"]'); await c.waitForTimeout(1500);
ok('o turno abre', await c.isVisible('.volante'));
for(let i=0;i<6;i++){ await posicao(c); await c.waitForTimeout(400); }
const reg=await c.evaluate(()=>(window.__erros||[]).map(e=>e.onde+': '+e.mensagem));
ok('o registo guarda em que modo o turno abriu', reg.some(r=>/^turno-aberto: app/.test(r)), reg.join(' | '));

/* ── o patrão ─────────────────────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
await p.locator('[data-vivo]').first().click(); await p.waitForTimeout(800);

/* ── o condutor apaga o ecrã: o serviço continua a dar posições ── */
await c.bringToFront();
await c.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});
  document.dispatchEvent(new Event('visibilitychange')); });
const v0=await vivoNaBase(c);
for(let i=0;i<8;i++){ await posicao(c); await c.waitForTimeout(700); }
const v1=await vivoNaBase(c);
ok('com o ecrã apagado, o condutor NÃO é dado como fora da aplicação', v1 && !v1.fora, JSON.stringify({fora:v1&&v1.fora}));
ok('e as posições continuam a chegar à base', v1 && v0 && v1.lat>v0.lat && v1.momento>v0.momento,
   (v0&&v0.lat)+' → '+(v1&&v1.lat));
const nt=await c.evaluate(()=>__nat.turnos);
const ultT=nt[nt.length-1]||{};
ok('a cada envio, a página passa ao lado nativo o turno, a base e a chave da sessão',
   nt.length>=1 && /^t\d+/.test(ultT.id||'') && ultT.url==='https://x.supabase.co' &&
   ultT.chave==='anon-de-mentira' && /^jwt-/.test(ultT.token||'') && ultT.frota==='f1' &&
   ultT.corpo && ultT.corpo.id===ultT.id && ultT.corpo.lat!=null && ultT.precisaoMax===50,
   JSON.stringify({n:nt.length, id:ultT.id, url:ultT.url, token:(ultT.token||'').slice(0,4), frota:ultT.frota}));
ok('mas sem gastar: no máximo de 5 em 5 segundos', nt.length<=3, nt.length+' em ~6 s');
/* o Android adormece a aplicação minuto e meio: quando volta, fica registado */
await c.evaluate(()=>{ const antes=Date.now; Date.now=()=>antes()+90000; window.__antes=antes; });
await posicao(c); await c.waitForTimeout(300);
await c.evaluate(()=>{ Date.now=window.__antes; });
const reg2=await c.evaluate(()=>(window.__erros||[]).filter(e=>e.onde==='gps-parou').map(e=>e.mensagem));
ok('se o GPS parar mais de um minuto, fica no registo (com o ecrã apagado)',
   reg2.some(m=>/^9\d s sem posições, com o ecrã apagado/.test(m)), reg2.join(' | '));
await p.bringToFront();
ok('o patrão vê o carro a andar, com velocidade (e sem "saiu da aplicação")',
   await esperar(async()=>{ const f=await p.textContent('.faixa'); return !/saiu da aplicação|Sem sinal/.test(f) &&
     (await p.evaluate(()=>document.querySelector('.faixa-nums .num').textContent.trim()))!=='—'; }, 8000),
   await p.evaluate(()=>document.querySelector('.faixa-nums .num').textContent.trim()));

/* ── fecha o turno: o serviço (e a notificação) param ─────── */
await c.bringToFront();
await c.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'visible'});
  document.dispatchEvent(new Event('visibilitychange')); });
const vAntes=await vivoNaBase(c);
await c.evaluate(v=>{
  /* o caminho que só o lado nativo viu (a página dormia): doze pontos,
     a cem metros e dez segundos uns dos outros (36 km/h), depois do
     último que a página tem */
  const r=v.rasto||[], t0=(r.length?r[r.length-1][2]:Date.now())+1000;
  for(let i=0;i<12;i++) __nat.buffer.push([+(14.93+i*0.0009).toFixed(6), +(-23.50+i*0.0006).toFixed(6), t0+i*10000, 5, 36]);
  document.dispatchEvent(new Event('visibilitychange')); }, vAntes);
await c.waitForTimeout(1500);
const vDepois=await vivoNaBase(c);
ok('ao voltar, os pontos que o lado nativo guardou entram no percurso (e nos km)',
   vDepois && vAntes && vDepois.nPontos>=vAntes.nPontos+10 && vDepois.kmGps>vAntes.kmGps+0.8,
   JSON.stringify({pontos:[vAntes&&vAntes.nPontos, vDepois&&vDepois.nPontos], km:[vAntes&&vAntes.kmGps, vDepois&&vDepois.kmGps]}));
ok('e o lado nativo esquece-os, para não entrarem duas vezes',
   await c.evaluate(()=>__nat.esquecido>0 && __nat.buffer.length===0));
await c.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
await c.waitForTimeout(800);
const vOutra=await vivoNaBase(c);
ok('voltar outra vez não os junta de novo', vOutra && vOutra.nPontos<=vDepois.nPontos+1,
   (vDepois&&vDepois.nPontos)+' → '+(vOutra&&vOutra.nPontos));
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
await c.click('[data-f="terminar"]'); await c.waitForTimeout(1500);
ok('o turno fecha', /Turno terminado/.test(await txt()));
ok('e o serviço do GPS desliga-se (a notificação some), e o telemóvel fica livre para dormir',
   await c.evaluate(()=>__nat.removidos>=1 && __nat.largadas>=1));
ok('e o lado nativo deixa de guardar e de mandar posições', await c.evaluate(()=>__nat.fins>=1));

/* ── a licença tirada nas definições, a meio ──────────────── */
await c.locator('[data-f="novo-turno"], [data-f="ir-carro"]').first().click().catch(()=>{});
await c.waitForTimeout(500);
if(!(await c.isVisible('[data-carro]'))){ await c.goto(U+'#condutor'); await c.waitForTimeout(1500); }
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(700);
await c.evaluate(()=>__nat.cb && __nat.cb(null, {code:'NOT_AUTHORIZED', message:'User denied location permission'}));
await c.waitForTimeout(400);
ok('sem licença de localização, explica e oferece as definições',
   /não tem licença para a localização/.test(await txt()) && await c.isVisible('[data-f="definicoes-gps"]'));
await c.click('[data-f="definicoes-gps"]'); await c.waitForTimeout(300);
ok('o botão abre as definições da aplicação', await c.evaluate(()=>__nat.definicoes)===1);
await c.click('#voltar'); await c.waitForTimeout(500);
ok('recuar sem abrir turno desliga o GPS (e a notificação)',
   await c.evaluate(()=>__nat.removidos)>=2, 'removidos: '+(await c.evaluate(()=>__nat.removidos)));

/* ── o condutor diz "não" à localização ───────────────────── */
const ctxR=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const r=await ctxR.newPage();
r.on('pageerror',e=>err.push('recusa: '+e.message));
await r.addInitScript(capacitor, {recusa:true});
await entrarComCarro(r);
await r.click('[data-f="ir-gps"]'); await r.waitForTimeout(900);
ok('recusada a localização, não liga o GPS e mostra como dar a licença',
   await r.evaluate(()=>__nat.watchers)===0 && /não tem licença para a localização/.test(await r.textContent('#ecra')) &&
   await r.isVisible('[data-f="definicoes-gps"]'));

/* ── a aplicação antiga (1.0.0): pede para actualizar ─────── */
const ctxA=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const a=await ctxA.newPage();
a.on('pageerror',e=>err.push('antiga: '+e.message));
await a.addInitScript(capacitor, {antiga:true});
await entrarComCarro(a);
await a.click('[data-f="ir-gps"]'); await a.waitForTimeout(900);
await a.evaluate(()=>__nat.cb && __nat.cb({latitude:14.9177, longitude:-23.5092, accuracy:6, speed:0, time:Date.now()}));
await a.waitForTimeout(400);
ok('com a aplicação antiga, o GPS liga na mesma e pede para instalar a versão nova',
   await a.evaluate(()=>__nat.watchers)===1 && /versão nova da aplicação/.test(await a.textContent('#ecra')) &&
   (await a.getAttribute('a[href="/FleetCV.apk"]','href'))==='/FleetCV.apk');

const ctxB=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const a2=await ctxB.newPage();
a2.on('pageerror',e=>err.push('1.0.1: '+e.message));
await a2.addInitScript(capacitor, {semEnvio:true});
await entrarComCarro(a2);
await a2.click('[data-f="ir-gps"]'); await a2.waitForTimeout(900);
await a2.evaluate(()=>__nat.cb && __nat.cb({latitude:14.9177, longitude:-23.5092, accuracy:6, speed:0, time:Date.now()}));
await a2.waitForTimeout(400);
ok('com a 1.0.1 (sem o envio nativo), também pede para instalar a versão nova',
   /versão nova da aplicação/.test(await a2.textContent('#ecra')));

/* ── no navegador de um Android: sugere a aplicação ───────── */
const ctx2=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID,
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const w=await ctx2.newPage();
w.on('pageerror',e=>err.push('navegador: '+e.message));
await entrarComCarro(w);
await w.click('[data-f="ir-gps"]'); await w.waitForTimeout(800);
ok('no navegador de um Android, sugere instalar a aplicação',
   /Tem Android\? Instale a aplicação/.test(await w.textContent('#ecra')) &&
   (await w.getAttribute('a[href="/android"]','href'))==='/android');
ok('e mantém o aviso de deixar a página aberta', /Deixe esta página aberta/.test(await w.textContent('#ecra')));

/* ── num computador, nada disso ───────────────────────────── */
const ctx3=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const d=await ctx3.newPage();
await entrarComCarro(d);
await d.click('[data-f="ir-gps"]'); await d.waitForTimeout(800);
ok('fora do Android, não fala da aplicação', !/Instale a aplicação/.test(await d.textContent('#ecra')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
