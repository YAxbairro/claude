/* A APLICAÇÃO ANDROID — o que a página faz quando corre lá dentro
   Dentro da aplicação FleetCV instalada (Capacitor), o GPS vem de um
   serviço do Android com notificação fixa (@capacitor-community/
   background-geolocation), que continua com o ecrã apagado. Aqui a
   aplicação é imitada: um window.Capacitor de mentira com os mesmos
   módulos, que entrega posições quando o teste manda — também com a
   página escondida, como faz o serviço de verdade.

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
const ANDROID='Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

/* a aplicação de mentira: o que o Capacitor põe na página */
const capacitor=()=>{
  window.__nat={watchers:0, removidos:0, bateriaPedida:0, definicoes:0, opcoes:null, cb:null};
  window.Capacitor={
    isNativePlatform:()=>true,
    Plugins:{
      BackgroundGeolocation:{
        addWatcher(op, cb){ __nat.watchers++; __nat.opcoes=op; __nat.cb=cb; return Promise.resolve('w'+__nat.watchers); },
        removeWatcher(){ __nat.removidos++; __nat.cb=null; return Promise.resolve(); },
        openSettings(){ __nat.definicoes++; return Promise.resolve(); } },
      LocalNotifications:{ requestPermissions:()=>Promise.resolve({display:'granted'}) },
      Bateria:{ estado:()=>Promise.resolve({semRestricoes: __nat.bateriaPedida>0}),
                pedir(){ __nat.bateriaPedida++; return Promise.resolve(); } }
    }
  };
};
const vivoNaBase=pg=>pg.evaluate(()=>{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
  if(k.startsWith('sb:d|f1|vivo|')) return JSON.parse(localStorage.getItem(k)); } return null; });
/* o serviço do Android a entregar uma posição */
let passo=0;
const posicao=(pg,extra)=>pg.evaluate(a=>{ if(__nat.cb) __nat.cb(Object.assign({latitude:14.9177+a.n*0.0004,
  longitude:-23.5092+a.n*0.0002, accuracy:6, speed:9, bearing:30, time:Date.now()}, a.extra||{})); }, {n:passo++, extra});

/* ── o condutor, na aplicação (sem licença de GPS no navegador: não precisa) ── */
const ctx=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID});
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.addInitScript(capacitor);
const txt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
const n1=await c.evaluate(()=>__nat);
ok('na aplicação, o GPS vem do serviço do Android (e não do navegador)', n1.watchers===1);
ok('com a notificação fixa (é ela que o mantém com o ecrã apagado)',
   !!(n1.opcoes && n1.opcoes.backgroundMessage && n1.opcoes.backgroundTitle), n1.opcoes&&n1.opcoes.backgroundTitle);
ok('e com as posições frescas, uma a uma', n1.opcoes && n1.opcoes.stale===false && n1.opcoes.distanceFilter===0);
ok('o condutor lê que pode apagar o ecrã', /Pode apagar o ecrã/.test(await txt()));
ok('e não o aviso de deixar a página aberta, nem o de abrir no Chrome',
   !/Deixe esta página aberta|Abra no Chrome|Instale a aplicação/.test(await txt()));
ok('pede para tirar a FleetCV da poupança de bateria', await esperar(async()=>/poupança de bateria/.test(await txt())));
await c.click('[data-f="bateria"]'); await c.waitForTimeout(2200);
ok('o botão abre o pedido do Android', await c.evaluate(()=>__nat.bateriaPedida)===1);
ok('e, dada a licença, o aviso desaparece', !/Tire a FleetCV da poupança/.test(await txt()));

await posicao(c); await c.waitForTimeout(500);
ok('a primeira posição do serviço liga o GPS', /GPS ligado/.test(await txt()));
await c.click('[data-f="comecar"]'); await c.waitForTimeout(1500);
ok('o turno abre', await c.isVisible('.volante'));
for(let i=0;i<6;i++){ await posicao(c); await c.waitForTimeout(400); }

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
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
await c.click('[data-f="terminar"]'); await c.waitForTimeout(1500);
ok('o turno fecha', /Turno terminado/.test(await txt()));
ok('e o serviço do GPS desliga-se (a notificação some)', await c.evaluate(()=>__nat.removidos)>=1);

/* ── sem licença de localização ───────────────────────────── */
await c.locator('[data-f="novo-turno"], [data-f="ir-carro"]').first().click().catch(()=>{});
await c.waitForTimeout(500);
if(!(await c.isVisible('[data-carro]'))){ await c.goto(U+'#condutor'); await c.waitForTimeout(1500); }
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(600);
await c.evaluate(()=>__nat.cb && __nat.cb(null, {code:'NOT_AUTHORIZED', message:'sem licença'}));
await c.waitForTimeout(400);
ok('sem licença de localização, explica e oferece as definições',
   /não tem licença para a localização/.test(await txt()) && await c.isVisible('[data-f="definicoes-gps"]'));
await c.click('[data-f="definicoes-gps"]'); await c.waitForTimeout(300);
ok('o botão abre as definições da aplicação', await c.evaluate(()=>__nat.definicoes)===1);
await c.click('#voltar'); await c.waitForTimeout(500);
ok('recuar sem abrir turno desliga o GPS (e a notificação)',
   await c.evaluate(()=>__nat.removidos)>=2, 'removidos: '+(await c.evaluate(()=>__nat.removidos)));

/* ── no navegador de um Android: sugere a aplicação ───────── */
const ctx2=await b.newContext({viewport:{width:390,height:844}, userAgent:ANDROID,
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const w=await ctx2.newPage();
w.on('pageerror',e=>err.push('navegador: '+e.message));
await w.goto(U+'#condutor'); await w.waitForTimeout(1500);
await w.fill('#i-email','antonio@exemplo.cv'); await w.fill('#i-cod','1234');
await w.click('[data-f="entrar"]'); await w.waitForTimeout(1500);
await w.locator('[data-carro]').first().click(); await w.waitForTimeout(400);
await w.click('[data-f="ir-gps"]'); await w.waitForTimeout(800);
ok('no navegador de um Android, sugere instalar a aplicação',
   /Tem Android\? Instale a aplicação/.test(await w.textContent('#ecra')) &&
   (await w.getAttribute('a[href="/android"]','href'))==='/android');
ok('e mantém o aviso de deixar a página aberta', /Deixe esta página aberta/.test(await w.textContent('#ecra')));

/* ── num computador, nada disso ───────────────────────────── */
const ctx3=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const d=await ctx3.newPage();
await d.goto(U+'#condutor'); await d.waitForTimeout(1500);
await d.fill('#i-email','antonio@exemplo.cv'); await d.fill('#i-cod','1234');
await d.click('[data-f="entrar"]'); await d.waitForTimeout(1500);
await d.locator('[data-carro]').first().click(); await d.waitForTimeout(400);
await d.click('[data-f="ir-gps"]'); await d.waitForTimeout(800);
ok('fora do Android, não fala da aplicação', !/Instale a aplicação/.test(await d.textContent('#ecra')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
