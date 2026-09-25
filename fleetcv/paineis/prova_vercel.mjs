/* A PROVA DE PONTA A PONTA, NO SÍTIO VERDADEIRO
   Site no Vercel, base no Supabase, dois "telemóveis" diferentes.
   Nada de simuladores: é a coisa real. */
import { chromium } from 'playwright';
const U='https://fleetcv.vercel.app/';
/* O Chromium de teste não lê o CA do proxy desta caixa. Em vez de
   desligar a verificação, dá-se-lhe a impressão digital exacta da
   chave desse CA — continua a recusar qualquer outro certificado. */
const SPKI=process.env.CCR_SPKI||'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args: SPKI?['--ignore-certificate-errors-spki-list='+SPKI]:[] });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
async function ate(f,seg=40){ const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ if(await f()) return true;
    await new Promise(r=>setTimeout(r,500)); } return false; }

/* ── o patrão, no computador dele ── */
const cp=await b.newContext({viewport:{width:430,height:950}});
const p=await cp.newPage(); p.on('pageerror',e=>err.push('patrão: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U); await p.waitForTimeout(3000);
await p.click('[data-quem="dono"]');
/* daqui até à Irlanda o proxy desta caixa leva uns segundos; espera-se
   pelo estado em vez de adivinhar um tempo */
ok('o site liga-se ao Supabase',
   await ate(async()=>(await p.evaluate(()=>Nuvem.estado())).startsWith('supabase'),30),
   await p.evaluate(()=>Nuvem.estado()));
await p.fill('#i-email','yanickdrs@gmail.com'); await p.fill('#i-cod','761662');
await p.click('[data-f="entrar"]');
ok('o patrão entra com o código dele',
   await ate(async()=>(await txt()).includes('A frota agora'),30));

await p.click('[data-tab="condutores"]'); await p.waitForTimeout(900);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(800);
await p.fill('#e-nome','PROVA (apagar)'); await p.fill('#e-email2','prova@fleetcv.test');
await p.fill('#e-codigo','5150');
await p.click('[data-f="guardar-cond"]');
ok('cria um condutor', await ate(async()=>/PROVA/.test(await txt()),30));

/* ── o condutor, noutro telemóvel, com GPS a sério ── */
const cc=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const c=await cc.newPage(); c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.goto(U); await c.waitForTimeout(3000);
await c.click('[data-quem="condutor"]');
await ate(async()=>(await c.evaluate(()=>Nuvem.estado())).startsWith('supabase'),30);
await c.fill('#i-email','prova@fleetcv.test'); await c.fill('#i-cod','5150');
await c.click('[data-f="entrar"]');
ok('o condutor entra no telemóvel dele',
   await ate(async()=>(await c.textContent('#ecra')).includes('Que carro vai levar'),30));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(900);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(2000);
const estGps=await c.evaluate(()=>document.body.innerText.includes('sem GPS'));
ok('O GPS FUNCIONA (não diz "sem GPS")', !estGps);
await c.click('[data-f="comecar-sim"]');
ok('abre turno', await ate(async()=>c.isVisible('.volante'),30));

/* o carro anda mesmo: mexe-se a posição do "telemóvel" */
let la=14.9177, lo=-23.5092;
const andar=setInterval(()=>{ la+=0.00022; lo+=0.00016;
  cc.setGeolocation({latitude:la, longitude:lo, accuracy:6}).catch(()=>{}); }, 900);

await p.click('[data-tab="mapa"]'); await p.waitForTimeout(1200);
ok('o turno chega ao patrão sozinho',
   await ate(async()=>(await txt()).includes('PROVA')));
const vivo=p.locator('[data-vivo]',{hasText:'PROVA'}).first();
const km=async()=>{ const t=await vivo.textContent().catch(()=>'');
  const m=(t||'').match(/([\d,.]+) km/); return m?parseFloat(m[1].replace(',','.')):0; };
await ate(async()=>(await km())>0);
const k1=await km();
ok('os quilómetros sobem sozinhos no ecrã do patrão',
   await ate(async()=>(await km())>k1+0.05,40), k1+' → '+(await km()));

await c.click('[data-f="ir-abast"]'); await c.waitForTimeout(900);
await c.fill('#i-valor','2000'); await c.waitForTimeout(500);
await c.click('[data-f="guardar-abast"]'); await c.waitForTimeout(1500);
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(900);
await c.click('[data-f="terminar"]');
clearInterval(andar);
ok('o turno fecha',
   await ate(async()=>(await c.textContent('#ecra')).includes('Turno terminado'),30));
await p.click('#voltar').catch(()=>{}); await p.waitForTimeout(1200);
ok('e o abastecimento entra nas contas do patrão',
   await ate(async()=>(await txt()).includes('2.000')));

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
