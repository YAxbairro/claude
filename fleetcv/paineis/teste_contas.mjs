/* CONTAS DE PROPRIETÁRIO — do princípio ao fim
   Alguém chega pela página principal, carrega em "Criar conta", e
   tem de sair de lá com uma frota que é só dele: junta um carro, junta
   um condutor, manda-lhe o acesso pelo WhatsApp, e o condutor entra e
   trabalha — sem nunca ver a frota de outro, e sem ver os códigos dos
   colegas. É isto que deixa o FleetCV ter mais do que um cliente. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_contas.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_contas.html';
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};
const esperar=async(f,ms=6000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };

const ctx=await b.newContext({viewport:{width:430,height:950},
  permissions:['geolocation'], geolocation:gps});

/* ── o Manuel chega pela página principal ─────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('Manuel: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U+'#criar'); await p.waitForTimeout(1800);
ok('o link "Criar conta" abre logo o ecrã de criar', /Criar conta/.test(await txt()));
ok('e limpa o #criar do endereço', !(await p.evaluate(()=>location.hash)));

const preencher=async(o)=>{ for(const [k,v] of Object.entries(o)) await p.fill('#'+k, v); };
await preencher({'e-c-nome':'Manuel Tavares','e-c-frota':'Táxis Tavares',
  'e-c-email':'manuel@tavares.cv','e-c-cod':'tavares1','e-c-cod2':'tavares9'});
await p.click('[data-f="criar"]'); await p.waitForTimeout(400);
ok('códigos diferentes: avisa antes de ir à base', /não são iguais/.test(await txt()));
await preencher({'e-c-email':'patrao@exemplo.cv','e-c-cod2':'tavares1'});
await p.click('[data-f="criar"]'); await p.waitForTimeout(1200);
ok('um e-mail que já tem conta noutra frota é recusado', /já tem conta/.test(await txt()));
await preencher({'e-c-email':'manuel@tavares.cv'});
await p.click('[data-f="criar"]');
ok('com tudo certo, entra na frota nova',
   await esperar(async()=>/A frota agora/.test(await txt())));
ok('e dão-lhe as boas-vindas com os primeiros passos',
   /Bem-vindo à sua frota/.test(await txt()));
const f0=await p.evaluate(()=>Nuvem.dados().frota);
ok('a frota nova está vazia (não herdou a de ninguém)',
   f0 && f0.carros.length===0 && f0.condutores.length===0,
   f0 ? f0.carros.length+' carros, '+f0.condutores.length+' condutores' : 'sem frota');
ok('e tem o nome que ele escolheu',
   /Táxis Tavares/.test(await p.textContent('#sub-marca')));
await p.waitForTimeout(1500);
ok('não leva turnos inventados',
   (await p.evaluate(()=>Nuvem.dados().turnos.length))===0);

/* o primeiro carro, pelo botão dos primeiros passos */
await p.click('[data-f="passo-carro"]'); await p.waitForTimeout(900);
await p.fill('#e-mat','ST-51-TV'); await p.fill('#e-marca','Toyota');
await p.fill('#e-km','88000'); await p.fill('#e-dep','45');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(1200);
ok('o primeiro carro entra pelos primeiros passos', /ST-51-TV/.test(await txt()));

/* um condutor com o e-mail de um condutor de OUTRA frota */
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(700);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(700);
await p.fill('#e-nome','Intruso'); await p.fill('#e-email2','antonio@exemplo.cv');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1200);
ok('o e-mail de um condutor de outra frota é recusado logo ali',
   /noutra frota/.test(await txt()));
/* e um a sério */
await p.fill('#e-nome','Rui Gomes'); await p.fill('#e-email2','rui@tavares.cv');
await p.fill('#e-tel','991 12 34');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1500);
ok('o condutor dele entra', /Rui Gomes/.test(await txt()));
ok('e a ficha diz que falta mandar-lhe o acesso', /mandar-lhe o acesso/.test(await txt()));
const zap=await p.getAttribute('#mandar-zap','href');
const cod=await p.evaluate(()=>Nuvem.dados().frota.condutores[0].codigo);
const msg=decodeURIComponent((zap||'').split('text=')[1]||'');
ok('o botão do WhatsApp vai para o número dele, com +238',
   /^https:\/\/wa\.me\/2389911234\?/.test(zap||''), (zap||'').slice(0,40));
ok('e a mensagem leva o endereço, o e-mail e o código',
   msg.includes('#condutor') && msg.includes('rui@tavares.cv') && msg.includes(cod),
   msg.split('\n')[2]);
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(700);
ok('com carro e condutor, os primeiros passos saem do caminho',
   !/Bem-vindo à sua frota/.test(await txt()));

/* ── o Rui, no telemóvel dele, pelo link que recebeu ──────── */
const co=await ctx.newPage();
co.on('pageerror',e=>err.push('Rui: '+e.message));
await co.setViewportSize({width:390,height:840});
await co.goto(U+'#condutor'); await co.waitForTimeout(1800);
const ctxt=()=>co.textContent('#ecra');
ok('o link do WhatsApp abre direito no ecrã de entrar do condutor',
   await co.isVisible('#i-email'));
await co.fill('#i-email','rui@tavares.cv'); await co.fill('#i-cod',cod);
await co.click('[data-f="entrar"]');
ok('o Rui entra com o código que recebeu',
   await esperar(async()=>/Que carro vai levar/.test(await ctxt())));
const tc=await ctxt();
ok('vê o carro da frota dele', tc.includes('ST-51-TV'));
ok('e não vê os carros de outra frota', !tc.includes('ST-28-ED') && !tc.includes('SV-14-AB'));
const conds=await co.evaluate(()=>Nuvem.dados().frota.condutores);
ok('a lista de colegas que chega ao telemóvel dele não leva códigos',
   conds.length===1 && conds.every(x=>!('codigo' in x) && !('email' in x)),
   JSON.stringify(conds));
ok('o patrão, no mesmo aparelho, continua dono (sessões à parte)',
   await p.evaluate(()=>Nuvem.estado())==='supabase' &&
   /A frota agora/.test(await txt()));

await co.locator('[data-carro]').first().click(); await co.waitForTimeout(700);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1500);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(3000);
ok('o Rui abre turno', await co.isVisible('.volante'));
ok('e o Manuel vê-o a andar, sozinho',
   await esperar(async()=>(await p.evaluate(()=>Nuvem.dados().vivos.length))===1, 8000));

/* ── a outra frota, noutro telemóvel ──────────────────────── */
/* Na mesma base, que é o que interessa: o imitador guarda a base no
   navegador, e outro contexto do navegador seria outra base — a prova
   passava sem provar nada. */
const outroTel=async(nome)=>{ const pg=await ctx.newPage();
  await pg.addInitScript(n=>{ window.__outroTelemovel=n; }, nome); return pg; };
const o=await outroTel('patrao-f1');
o.on('pageerror',e=>err.push('patrão f1: '+e.message));
await o.goto(U+'#dono'); await o.waitForTimeout(1800);
await o.fill('#i-email','patrao@exemplo.cv'); await o.fill('#i-cod','9999');
await o.click('[data-f="entrar"]');
await esperar(async()=>/A frota agora/.test(await o.textContent('#ecra')));
await o.waitForTimeout(1500);
const df=await o.evaluate(()=>({carros:Nuvem.dados().frota.carros.map(c=>c.matricula),
  conds:Nuvem.dados().frota.condutores.map(c=>c.nome),
  vivos:Nuvem.dados().vivos.map(v=>v.condutor)}));
ok('o patrão da outra frota não vê o carro do Manuel', !df.carros.includes('ST-51-TV'),
   df.carros.join(', '));
ok('nem o condutor dele', !df.conds.includes('Rui Gomes'));
ok('nem o turno que está a decorrer', !df.vivos.includes('Rui Gomes'),
   df.vivos.join(', ')||'nenhum');

/* ── o Manuel muda o código ───────────────────────────────── */
/* um separador escondido atrás de outros não se desenha, e o clique
   fica à espera dele para sempre: traz-se para a frente */
await p.bringToFront();
await p.click('[data-tab="definicoes"]'); await p.waitForTimeout(1200);
ok('nas definições diz até quando vai a experiência',
   /Experiência grátis até/.test(await txt()));
ok('e com que e-mail está a entrar', (await txt()).includes('manuel@tavares.cv'));
await p.fill('#e-a-actual','errado'); await p.fill('#e-a-novo','novo-tavares');
await p.fill('#e-a-novo2','novo-tavares');
await p.click('[data-f="mudar-acesso"]'); await p.waitForTimeout(1000);
ok('sem o código de hoje, não muda', /actual não está certo/.test(await txt()));
await p.fill('#e-a-actual','tavares1'); await p.fill('#e-a-novo','novo-tavares');
await p.fill('#e-a-novo2','novo-tavares');
await p.click('[data-f="mudar-acesso"]'); await p.waitForTimeout(1000);
ok('com ele, muda', /Mudado/.test(await txt()));

const m2=await outroTel('manuel-2');
m2.on('pageerror',e=>err.push('Manuel 2: '+e.message));
await m2.goto(U+'#dono'); await m2.waitForTimeout(1800);
await m2.fill('#i-email','manuel@tavares.cv'); await m2.fill('#i-cod','tavares1');
await m2.click('[data-f="entrar"]'); await m2.waitForTimeout(1200);
ok('noutro telemóvel, o código velho já não abre',
   /errados/.test(await m2.textContent('#ecra')));
await m2.fill('#i-cod','novo-tavares');
await m2.click('[data-f="entrar"]');
ok('e o novo abre, na frota dele',
   await esperar(async()=>/Táxis Tavares/.test(await m2.textContent('#sub-marca'))),
   await m2.textContent('#sub-marca'));
ok('sem mostrar a frota de exemplo pelo caminho',
   !(await m2.evaluate(()=>Nuvem.dados().frota.carros.some(c=>c.matricula==='CV-01-AB'))));

/* ── o Manuel desiste e apaga a conta ─────────────────────── */
await m2.close();
await p.bringToFront();
p.on('dialog', d=>d.accept());
await p.click('[data-tab="definicoes"]'); await p.waitForTimeout(1200);
await p.fill('#e-x-cod','tavares1');
await p.click('[data-f="apagar-conta"]'); await p.waitForTimeout(1200);
ok('apagar a conta com o código velho não apaga', /não está certo/.test(await txt()));
await p.fill('#e-x-cod','novo-tavares');
await p.click('[data-f="apagar-conta"]');
ok('com o código certo, apaga e volta à porta',
   await esperar(async()=>/conta foi apagada/.test(await txt())));
const resta=await p.evaluate(()=>{ let n=0;
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(k.startsWith('sb:d|')){ const f=k.split('|')[1];
      const fs=JSON.parse(localStorage.getItem('sb:frotas')||'{}');
      if(!fs[f]) n++; } } return n; });
ok('e na base não fica nada da frota dele', resta===0, resta+' restos');
await co.bringToFront(); await co.reload(); await co.waitForTimeout(2500);
ok('o Rui, ao voltar, já não entra em frota nenhuma',
   await co.isVisible('#i-email'));

/* ── um telemóvel que se lembrava de ter entrado ──────────── */
const ctx4=await b.newContext({viewport:{width:430,height:950}});
await ctx4.addInitScript(()=>{
  localStorage.setItem('fleetcv-quem','dono');
  localStorage.setItem('fleetcv-dono-sessao','true'); });
const v=await ctx4.newPage();
v.on('pageerror',e=>err.push('sessão velha: '+e.message));
await v.goto(U); await v.waitForTimeout(2500);
ok('sem sessão na base, pede o código em vez de mostrar uma frota vazia',
   await v.isVisible('#i-email'));
ok('e oferece criar conta', /Criar conta grátis/.test(await v.textContent('#ecra')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
