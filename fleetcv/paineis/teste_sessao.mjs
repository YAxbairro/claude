/* A SESSÃO QUE SE PERDE
   Num iPhone (Safari), a 10 de Outubro de 2026, a sessão anónima foi
   criada às 12:02:07 e 40 segundos depois já não estava no telemóvel:
   os nove "Entrar" seguintes chegaram à base sem ela, e o condutor via
   "sessão por abrir" sem conseguir entrar. Agora, antes de entrar, a
   aplicação confere a sessão e abre outra se for preciso; e se a base
   responder "sessão por abrir", abre outra e tenta mais uma vez. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_sessao.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_sessao.html';
const esperar=async(f,ms=6000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };

async function condutor(){
  const ctx=await b.newContext({viewport:{width:430,height:950}});
  const p=await ctx.newPage();
  p.on('pageerror',e=>err.push(e.message));
  await p.goto(U); await p.waitForTimeout(1200);
  await p.click('[data-quem="condutor"]'); await p.waitForTimeout(900);
  return {ctx, p, txt:()=>p.textContent('body')};
}

/* 1. o telemóvel perde a sessão antes de o condutor carregar em Entrar */
{
  const {ctx, p, txt}=await condutor();
  ok('liga-se ao Supabase', (await p.evaluate(()=>Nuvem.estado())).startsWith('supabase'));
  await p.evaluate(()=>window.__esquecerSessoes());
  await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','1234');
  await p.click('[data-f="entrar"]');
  ok('sem sessão no telemóvel, abre outra e entra',
     await esperar(async()=>/ST-28-ED/.test(await txt())));
  ok('e não mostra "sessão por abrir"', !/sessão por abrir/.test(await txt()));
  await ctx.close();
}

/* 2. o telemóvel tem sessão, mas a base responde como se não tivesse */
{
  const {ctx, p, txt}=await condutor();
  await p.evaluate(()=>{ window.__recusarUmaVez='entrar'; });
  await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','1234');
  await p.click('[data-f="entrar"]');
  ok('a base diz "sessão por abrir" uma vez: abre outra e tenta de novo',
     await esperar(async()=>/ST-28-ED/.test(await txt())));
  ok('a recusa foi mesmo usada', await p.evaluate(()=>window.__recusarUmaVez===null));
  await ctx.close();
}

/* 3. o código errado continua a ser só código errado */
{
  const {ctx, p, txt}=await condutor();
  await p.evaluate(()=>window.__esquecerSessoes());
  await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','0000');
  await p.click('[data-f="entrar"]');
  ok('o código errado diz que está errado',
     await esperar(async()=>/errados/.test(await txt())));
  await ctx.close();
}

/* 4. o patrão que cria conta com a sessão perdida também consegue */
{
  const ctx=await b.newContext({viewport:{width:430,height:950}});
  const p=await ctx.newPage();
  p.on('pageerror',e=>err.push(e.message));
  await p.goto(U+'#criar'); await p.waitForTimeout(1500);
  await p.evaluate(()=>window.__esquecerSessoes());
  const r=await p.evaluate(()=>Nuvem.criarConta({nome:'Ana Lopes', frota:'Táxis Ana',
    email:'ana-sessao@exemplo.cv', codigo:'abc123', tipo:'taxi'}));
  ok('criar conta sem sessão abre outra e cria', !!(r && r.papel==='dono'), JSON.stringify(r));
  await ctx.close();
}

ok('sem erros na página', err.length===0, err.join(' | '));
await b.close();
