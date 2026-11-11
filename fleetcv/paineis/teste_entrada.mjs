/* A ENTRADA DA APLICAÇÃO — antes de entrar
   A 11/11/2026 o Yanick abriu a aplicação no computador para criar uma
   conta e perdeu-se: três portas, o "criar conta" escondido, um ⇄ que
   não dizia nada. E a base de dados estava a dormir (o Supabase
   gratuito pô-la em pausa), mas o ecrã dizia "é preciso estar ligado à
   internet" — com a internet ligada — e dizia-o lá em cima, fora da
   vista, de modo que o botão parecia não fazer nada.

   Prova-se aqui: o ecrã de entrada tem tudo à vista, cada caminho leva
   onde diz e volta ao início; com a base em baixo diz-se a verdade, ao
   pé do botão; e quando a base volta entra-se sem recarregar. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
/* Uma base que pode estar em baixo: enquanto window.__baseEmBaixo,
   não abre sessão nenhuma (como o Supabase em pausa). */
const emBaixo=`(function(){ var sb=window.supabase, cc=sb.createClient;
  sb.createClient=function(u,k,o){ var c=cc(u,k,o), si=c.auth.signInAnonymously;
    c.auth.signInAnonymously=function(){
      if(window.__baseEmBaixo) return Promise.resolve({data:null,error:{message:'Failed to fetch'}});
      return si.apply(this, arguments); };
    return c; }; })();`;
const pagina=(extra)=>'<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};'+(extra||'')+'</script>'+
  '<script>'+falso+'</script><script>'+emBaixo+'</script></head><body>\n'+app;
fs.writeFileSync('_entrada.html', pagina(''));
fs.writeFileSync('_entrada_baixo.html', pagina('window.__baseEmBaixo=true;'));

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const U='file://'+process.cwd()+'/_entrada.html';
const UB='file://'+process.cwd()+'/_entrada_baixo.html';

/* ── 1 · o ecrã de entrada, no computador ─────────────────── */
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
p.on('pageerror',e=>err.push(e.message));
const corpo=()=>p.textContent('body');
await p.goto(U); await p.waitForTimeout(800);
const c1=await corpo();
ok('abre no ecrã de entrada, com quem já tem conta e quem não tem',
   /Já tenho conta/i.test(c1) && /Ainda não tenho conta/i.test(c1));
ok('as quatro portas estão à vista',
   ['Entrar como proprietário','Entrar como condutor','Criar conta grátis','Experimentar sem conta']
     .every(t=>c1.includes(t)));
ok('e diz para que frotas é', /táxis, instituições e rent-a-car/.test(c1));

/* criar conta: uma porta só, e abre logo o formulário */
await p.click('[data-quem="criar"]');
ok('"Criar conta grátis" abre logo o formulário de criar',
   await esperar(async()=>/Criar a minha frota/.test(await p.textContent('#ecra'))));
ok('antes de entrar o cabeçalho diz "‹ Início"',
   await p.isVisible('#voltar') && /Início/.test(await p.textContent('#voltar')));
ok('e o ⇄ (que não dizia o que fazia) não aparece', !(await p.isVisible('#trocar')));
await p.click('#voltar');
ok('"‹ Início" volta ao ecrã de entrada',
   await esperar(async()=>/Ainda não tenho conta/i.test(await corpo())));

/* proprietário: entrar, e daí ao lado do condutor */
await p.click('[data-quem="dono"]');
ok('"Entrar como proprietário" abre o entrar do proprietário',
   await esperar(async()=>/Entrar como proprietário/.test(await p.textContent('#ecra'))));
const d1=await p.textContent('#ecra');
ok('com o "Criar conta grátis" à vista (e sem o código de experimentar)',
   /Criar conta grátis/.test(d1) && !/9999/.test(d1));
ok('e o caminho para o lado do condutor', await p.isVisible('[data-f="ir-condutor"]'));
await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','1234');
await p.click('[data-f="entrar"]');
ok('um condutor no entrar do proprietário: diz-se para onde ir',
   await esperar(async()=>/Entrar como condutor», em baixo/.test(await p.textContent('#ecra'))));
await p.click('[data-f="ir-condutor"]');
ok('e o caminho leva ao entrar do condutor',
   await esperar(async()=>/Entrar como condutor/.test(await p.textContent('#ecra')) &&
     /quatro números/.test(await p.textContent('#ecra'))));
ok('onde há o caminho de volta para o proprietário', await p.isVisible('[data-f="ir-dono"]'));
await p.click('[data-f="ir-dono"]');
ok('que leva ao entrar do proprietário',
   await esperar(async()=>/O e-mail e o código que escolheu/.test(await p.textContent('#ecra'))));
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]');
ok('o proprietário entra', await esperar(async()=>await p.isVisible('#nav button')));
ok('e depois de entrar já há o ⇄', await p.isVisible('#trocar'));
await ctx.close();

/* ── 2 · a base de dados a dormir ─────────────────────────── */
const c2=await b.newContext({viewport:{width:1440,height:800}});
const q=await c2.newPage();
q.on('pageerror',e=>err.push('baixo: '+e.message));
await q.goto(UB); await q.waitForTimeout(500);
await q.click('[data-quem="dono"]');
ok('com a base em baixo, o entrar diz logo que o servidor não responde',
   await esperar(async()=>/O servidor não está a responder/.test(await q.textContent('#ecra'))));
ok('e que não é a internet de quem lá está', /Não é a sua internet/.test(await q.textContent('#ecra')));
await q.fill('#i-email','patrao@exemplo.cv'); await q.fill('#i-cod','9999');
await q.click('[data-f="entrar"]');
const t2=await esperar(async()=>!/a entrar…/.test(await q.textContent('#ecra')), 20000);
const e2=await q.textContent('#ecra');
ok('entrar não diz "código errado" a quem tem o código certo',
   t2 && !/errad|não conhec|incorrect/i.test(e2) && /não está a responder/.test(e2), e2.slice(0,120));

await q.click('[data-f="ir-criar"]'); await q.waitForTimeout(400);
for(const [k,v] of Object.entries({'e-c-nome':'Donu App','e-c-frota':'App Ayx',
  'e-c-email':'donu@fleet.cv','e-c-cod':'abc12345','e-c-cod2':'abc12345'})) await q.fill('#'+k,v);
await q.check('#e-c-aceito');
await q.click('[data-f="criar"]');
const t3=await esperar(async()=>/não está a responder agora — não é a sua internet/.test(
  await q.textContent('#ecra')), 20000);
ok('criar conta com a base em baixo: a verdade, e não "ligue-se à internet"',
   t3 && !/preciso estar ligado à internet/.test(await q.textContent('#ecra')));
const vis=await q.evaluate(()=>{ const x=[...document.querySelectorAll('#ecra .cartao.mau, #ecra .cartao.aviso')].pop();
  if(!x) return null; const r=x.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight; });
ok('e o aviso fica à vista, ao pé do botão (antes ficava lá em cima)', vis===true);
const ordem=await q.evaluate(()=>{ const a=[...document.querySelectorAll('#ecra .cartao.mau, #ecra .cartao.aviso')].pop(),
  bt=document.querySelector('[data-f="criar"]');
  return !!(a&&bt&&(a.compareDocumentPosition(bt)&Node.DOCUMENT_POSITION_FOLLOWING)); });
ok('mesmo antes do botão "Criar a minha frota"', ordem);
ok('o que se escreveu não se perdeu', await q.inputValue('#e-c-email')==='donu@fleet.cv');

/* a base acorda: carregar outra vez basta, sem recarregar a página */
await q.evaluate(()=>{ window.__baseEmBaixo=false; });
await q.click('[data-f="criar"]');
ok('quando a base volta, carregar outra vez cria a conta (sem recarregar)',
   await esperar(async()=>/Guarde este código|Mapa/.test(await q.textContent('body')), 20000),
   (await q.textContent('#ecra')).slice(0,100));
await c2.close();

/* ── 3 · no telemóvel, a mesma entrada ───────────────────── */
const c3=await b.newContext({viewport:{width:360,height:740}});
const r=await c3.newPage();
r.on('pageerror',e=>err.push('telemóvel: '+e.message));
await r.goto(U); await r.waitForTimeout(600);
const larg=await r.evaluate(()=>({doc:document.documentElement.scrollWidth, ecr:innerWidth}));
ok('a 360 px o ecrã de entrada não transborda', larg.doc<=larg.ecr, larg.doc+' ≤ '+larg.ecr);
await r.click('[data-quem="condutor"]');
ok('no telemóvel, "Entrar como condutor" abre o entrar do condutor',
   await esperar(async()=>/Entrar como condutor/.test(await r.textContent('#ecra'))));
const l2=await r.evaluate(()=>({doc:document.documentElement.scrollWidth, ecr:innerWidth}));
ok('e o cabeçalho com "‹ Início" não transborda', l2.doc<=l2.ecr, l2.doc+' ≤ '+l2.ecr);
await c3.close();

ok('sem erros na página', !err.length, err.slice(0,3).join(' | '));
await b.close();
