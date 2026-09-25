/* A REDE DE SEGURANÇA, CONTRA A BASE VERDADEIRA
   Esta caixa não deixa passar WebSockets — ou seja, é o cenário do
   condutor num sítio de rede má. Sem a rede de segurança o patrão
   ficava a olhar para um ecrã congelado. Aqui prova-se que não fica. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const app=fs.readFileSync('fleetcv.html','utf8');
const cfg=fs.readFileSync('/home/user/claude/fleetcv/site/fleetcv-config.js','utf8');
fs.writeFileSync('_real.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>'+cfg+'</script>'+
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>'+
  '</head><body>\n'+app);
const SPKI=process.env.CCR_SPKI||'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args: SPKI?['--ignore-certificate-errors-spki-list='+SPKI]:[] });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_real.html';
async function ate(f,seg=90){ const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ if(await f()) return true;
    await new Promise(r=>setTimeout(r,700)); } return false; }

const cp=await b.newContext({viewport:{width:430,height:950}});
const p=await cp.newPage(); p.on('pageerror',e=>err.push('patrão: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U); await p.waitForTimeout(2500);
await p.click('[data-quem="dono"]');
ok('liga-se ao Supabase verdadeiro',
   await ate(async()=>(await p.evaluate(()=>Nuvem.estado())).startsWith('supabase'),40),
   await p.evaluate(()=>Nuvem.estado()));
await p.fill('#i-email','yanickdrs@gmail.com'); await p.fill('#i-cod','761662');
await p.click('[data-f="entrar"]');
ok('o patrão entra', await ate(async()=>(await txt()).includes('A frota agora'),40));
ok('e o WebSocket está mesmo morto nesta caixa',
   !(await p.evaluate(()=>{ try{ return Nuvem.canalVivo?Nuvem.canalVivo():false; }
                            catch(e){ return false; } })));

/* o condutor, noutro "telemóvel" */
const cc=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const c=await cc.newPage(); c.on('pageerror',e=>err.push('condutor: '+e.message));
await c.goto(U); await c.waitForTimeout(2500);
await c.click('[data-quem="condutor"]');
await ate(async()=>(await c.evaluate(()=>Nuvem.estado())).startsWith('supabase'),40);
await c.fill('#i-email','prova@fleetcv.test'); await c.fill('#i-cod','5150');
await c.click('[data-f="entrar"]');
ok('o condutor entra',
   await ate(async()=>(await c.textContent('#ecra')).includes('Que carro vai levar'),40));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(900);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(2000);
await c.click('[data-f="comecar-sim"]');
ok('abre turno', await ate(async()=>c.isVisible('.volante'),40));
let la=14.9177, lo=-23.5092;
const andar=setInterval(()=>{ la+=0.00022; lo+=0.00016;
  cc.setGeolocation({latitude:la,longitude:lo,accuracy:6}).catch(()=>{}); },900);

await p.click('[data-tab="mapa"]'); await p.waitForTimeout(1200);
ok('SEM WEBSOCKET, o turno chega na mesma ao patrão',
   await ate(async()=>(await txt()).includes('PROVA'),90));
const vivo=p.locator('[data-vivo]',{hasText:'PROVA'}).first();
const km=async()=>{ const t=await vivo.textContent().catch(()=>'');
  const m=(t||'').match(/([\d,.]+) km/); return m?parseFloat(m[1].replace(',','.')):0; };
await ate(async()=>(await km())>0,60);
const k1=await km();
ok('e os quilómetros continuam a subir', await ate(async()=>(await km())>k1+0.05,90),
   k1+' → '+(await km()));

await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(900);
await c.click('[data-f="terminar"]');
clearInterval(andar);
ok('o turno fecha',
   await ate(async()=>(await c.textContent('#ecra')).includes('Turno terminado'),40));
ok('e o carro sai do mapa ao vivo do patrão',
   await ate(async()=>!(await txt()).includes('em turno neste momento')
                      || !(await txt()).includes('PROVA'),90));
console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
