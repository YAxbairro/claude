/* NO SUPABASE
   É aqui que isto vai viver a sério: a página num endereço próprio
   (Vercel), a base de dados no Supabase, e as regras de quem pode
   escrever o quê dentro da própria base — não na boa vontade do
   telemóvel. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
/* como fica no Vercel: página no topo, config ao lado, biblioteca
   carregada antes da aplicação */
fs.writeFileSync('_comsupa.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_comsupa.html';
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};
const ctx=await b.newContext({viewport:{width:430,height:950},
  permissions:['geolocation'], geolocation:gps});

/* ── o patrão ───────────────────────────────────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U); await p.waitForTimeout(1800);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(600);
ok('a aplicação liga-se ao Supabase',
   (await p.evaluate(()=>Nuvem.estado())).startsWith('supabase'),
   await p.evaluate(()=>Nuvem.estado()));
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','0000');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(1200);
ok('a BASE DE DADOS recusa o código errado', /errados/.test(await txt()));
await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2000);
ok('e deixa entrar com o certo', (await txt()).includes('A frota agora'));

await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(800);
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(700);
await p.fill('#e-mat','CVS-77-01'); await p.fill('#e-marca','Kia');
await p.fill('#e-km','2000'); await p.fill('#e-dep','42');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(1500);
ok('o patrão cria uma viatura', /CVS-77-01/.test(await txt()));
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(700);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(700);
await p.fill('#e-nome','Maria Lopes'); await p.fill('#e-email2','maria@exemplo.cv');
await p.fill('#e-codigo','7788');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1500);
ok('e um condutor', /Maria Lopes/.test(await txt()));

/* ── o condutor novo, noutro separador ──────────────────── */
const co=await ctx.newPage();
co.on('pageerror',e=>err.push('condutor: '+e.message));
await co.setViewportSize({width:390,height:840});
await co.goto(U); await co.waitForTimeout(1800);
await co.click('#trocar').catch(()=>{}); await co.waitForTimeout(600);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(600);
await co.fill('#i-email','maria@exemplo.cv'); await co.fill('#i-cod','7788');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(2000);
ok('o condutor entra com o código que o patrão lhe deu',
   (await co.textContent('#ecra')).includes('Que carro vai levar'));
ok('e vê a viatura que o patrão acabou de criar',
   (await co.textContent('#ecra')).includes('CVS-77-01'));

await co.locator('[data-carro]').first().click(); await co.waitForTimeout(700);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1500);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(3000);
ok('abre turno', await co.isVisible('.volante'));
/* com o Supabase ligado, o condutor não pode ver «sem ligação» —
   veria, e julgaria que o turno não estava a chegar ao patrão */
ok('e não diz «sem ligação» com o Supabase ligado',
   !(await co.textContent('#ecra')).includes('sem ligação'),
   await co.evaluate(()=>Nuvem.estado()));

/* ── o tempo real, através do Supabase ──────────────────── */
async function ate(f, seg=25){ const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ if(await f()) return true;
    await new Promise(r=>setTimeout(r,400)); } return false; }
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(900);
/* tem de ser a Maria, não um turno de exemplo: já apanhámos um
   teste a passar por causa da frota de estreia */
ok('o turno da Maria aparece ao patrão sozinho',
   await ate(async()=>(await txt()).includes('Maria Lopes')));
const aoVivo=p.locator('[data-vivo]',{hasText:'Maria Lopes'}).first();
const km=async()=>{ const t=await aoVivo.textContent().catch(()=>'');
  const m=(t||'').match(/([\d,.]+) km/); return m?parseFloat(m[1].replace(',','.')):0; };
await ate(async()=>(await km())>0);
const k1=await km();
ok('e os quilómetros sobem sozinhos', await ate(async()=>(await km())>k1+0.05,30),
   k1+' → '+(await km()));

/* o patrão toca no carro e abre o turno a decorrer — é aqui que
   ele vê, ao vivo, se o carro já abasteceu e por quanto */
await aoVivo.click(); await p.waitForTimeout(900);
await p.locator('.carro-cx .bt.sec').click(); await p.waitForTimeout(900);
ok('o patrão abre o turno a decorrer pelo Supabase',
   (await txt()).includes('Em turno agora'));

await co.click('[data-f="ir-abast"]'); await co.waitForTimeout(700);
await co.fill('#i-valor','3200'); await co.waitForTimeout(400);
await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(900);
ok('o abastecimento chega ao patrão',
   await ate(async()=>(await txt()).includes('3.200')), '3.200 CVE');
await co.click('[data-f="ir-fim"]'); await co.waitForTimeout(600);
await co.click('[data-f="terminar"]'); await co.waitForTimeout(2000);
ok('e o turno fecha', (await co.textContent('#ecra')).includes('Turno terminado'));
await p.click('#voltar').catch(()=>{}); await p.waitForTimeout(900);
ok('e entra no histórico do patrão',
   await ate(async()=>(await txt()).includes('3.200')));

/* ── AS REGRAS: é isto que só a base de dados consegue ──── */
const tentar = async (pag, corpo) => pag.evaluate(async(c)=>{
  const sb=window.supabase.createClient('','');
  const r=await sb.from('docs').upsert(c);
  return (r.error&&r.error.message)||'DEIXOU PASSAR'; }, corpo);

ok('um condutor não mexe na frota',
   (await tentar(co,{coleccao:'frota',id:'carros',corpo:{lista:[]}}))!=='DEIXOU PASSAR',
   await tentar(co,{coleccao:'frota',id:'carros',corpo:{lista:[]}}));
ok('nem escreve o turno de outro condutor',
   (await tentar(co,{coleccao:'turnos',id:'x9',
     corpo:{id:'x9',condutorId:'m1',inicio:1}}))!=='DEIXOU PASSAR');
/* o turno que a Maria acabou de fechar, tal como está na base */
const fechado = await co.evaluate(()=>{
  const ses=localStorage.getItem('sb-sessao');
  const pf=JSON.parse(localStorage.getItem('sb:perfil:'+ses)||'null');
  let melhor=null;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k||k.indexOf('sb:docs:turnos:')!==0) continue;
    const c=JSON.parse(localStorage.getItem(k)||'null');
    if(!c||!c.fim||!pf||c.condutorId!==pf.quem) continue;
    if(!melhor||c.fim>melhor.fim) melhor=c; }
  return melhor; });
if(fechado)
  ok('nem reabre um turno já fechado para corrigir os km',
     (await tentar(co,{coleccao:'turnos',id:fechado.id,
       corpo:{id:fechado.id,condutorId:fechado.condutorId,kmFim:1}}))
       !=='DEIXOU PASSAR',
     await tentar(co,{coleccao:'turnos',id:fechado.id,
       corpo:{id:fechado.id,condutorId:fechado.condutorId,kmFim:1}}));
else ok('nem reabre um turno já fechado', false, 'não encontrei o turno');

/* ── A TRAVA: um código de 4 algarismos não se adivinha ──── */
/* Noutro telemóvel — é o que um ladrão seria: aparelho novo, sem
   sessão nenhuma, a tentar códigos à sorte. */
const ctx2=await b.newContext({viewport:{width:390,height:840}});
const ld=await ctx2.newPage();
ld.on('pageerror',e=>err.push('ladrão: '+e.message));
await ld.goto(U); await ld.waitForTimeout(1800);
await ld.click('#trocar').catch(()=>{}); await ld.waitForTimeout(500);
await ld.click('[data-quem="condutor"]'); await ld.waitForTimeout(600);
let travou='nunca travou';
for(let i=0;i<7;i++){
  await ld.fill('#i-email','antonio@exemplo.cv');
  await ld.fill('#i-cod',String(1000+i));
  await ld.click('[data-f="entrar"]'); await ld.waitForTimeout(700);
  const t=await ld.textContent('#ecra');
  if(/Demasiadas tentativas/.test(t)){ travou='à '+(i+1)+'.ª tentativa'; break; } }
ok('cinco enganos no código e a porta fecha-se', travou!=='nunca travou', travou);
/* e nem o código certo abre enquanto estiver de castigo */
await ld.fill('#i-cod','1234');
await ld.click('[data-f="entrar"]'); await ld.waitForTimeout(900);
ok('e nem o código certo abre enquanto está de castigo',
   /Demasiadas tentativas/.test(await ld.textContent('#ecra')));

/* ── UMA FROTA COM ANOS DE TURNOS ─────────────────────────── */
/* A frota são quatro documentos velhos; os turnos são milhares e
   são todos mais recentes. Se a aplicação os for buscar na mesma
   pergunta, ordenados pela data, a frota cai fora da lista e o
   condutor abre a aplicação sem carro nenhum para escolher. Aqui
   simula-se um ano de trabalho. */
const ctx3=await b.newContext({viewport:{width:390,height:840}});
await ctx3.addInitScript(()=>{
  const P='sb:', velho=new Date(Date.now()-365*864e5).toISOString();
  const pr=(k,v)=>localStorage.setItem(P+k, JSON.stringify(v));
  pr('docs:frota:dono',{email:'patrao@exemplo.cv',codigo:'9999',nome:'Proprietário'});
  pr('docs:frota:config',{nome:'Táxis Praia, Lda',precoLitro:145});
  pr('docs:frota:carros',{lista:[{id:'c1',matricula:'ST-28-ED',marca:'Toyota',
    modelo:'Corolla',ano:2015,deposito:50,km:120000,estado:'ACTIVO',
    proxOleoKm:125000}]});
  pr('docs:frota:condutores',{lista:[{id:'m1',nome:'António Semedo',
    email:'antonio@exemplo.cv',codigo:'1234',estado:'ACTIVO'}]});
  ['dono','config','carros','condutores'].forEach(k=>
    localStorage.setItem(P+'quando:frota:'+k, JSON.stringify(velho)));
  /* 800 turnos, todos mais recentes do que a frota */
  for(let i=0;i<800;i++){
    const q=new Date(Date.now()-(800-i)*36e5).toISOString();
    pr('docs:turnos:t'+i, {id:'t'+i, condutorId:'m1', carroId:'c1',
      matricula:'ST-28-ED', condutor:'António Semedo',
      inicio:Date.parse(q), fim:Date.parse(q)+3e6, kmGps:40, abast:[]});
    localStorage.setItem(P+'quando:turnos:t'+i, JSON.stringify(q)); }
});
const ve=await ctx3.newPage();
ve.on('pageerror',e=>err.push('frota velha: '+e.message));
await ve.goto(U); await ve.waitForTimeout(2000);
await ve.click('#trocar').catch(()=>{}); await ve.waitForTimeout(500);
await ve.click('[data-quem="condutor"]'); await ve.waitForTimeout(600);
await ve.fill('#i-email','antonio@exemplo.cv'); await ve.fill('#i-cod','1234');
await ve.click('[data-f="entrar"]'); await ve.waitForTimeout(2500);
const tv=await ve.textContent('#ecra');
ok('com 800 turnos guardados, o condutor continua a ver os carros',
   tv.includes('ST-28-ED'),
   tv.includes('ST-28-ED')?'':'ecrã: '+tv.slice(0,90).replace(/\s+/g,' '));

/* ── ABRIR A APLICAÇÃO NUM SÍTIO SEM REDE ─────────────────── */
/* Na Praia há sítios sem rede. Se o condutor abre a aplicação num
   deles, tem de conseguir escolher o carro e começar a trabalhar na
   mesma — o que escrever fica em fila e sobe depois. Antes ficava
   preso no ecrã de entrada e o turno nunca acontecia. */
/* o MESMO telemóvel, como ele fica quando se fecha a aplicação */
const guardado=await ve.evaluate(()=>({
  copia:   localStorage.getItem('fleetcv-supa-copia'),
  condutor:localStorage.getItem('fleetcv-condutor'),
  quem:    localStorage.getItem('fleetcv-quem'),
  sessao:  localStorage.getItem('sb-sessao') }));
const cp=guardado.copia?JSON.parse(guardado.copia):null;
ok('o telemóvel guardou a frota e quem é',
   !!(cp && cp.eu && cp.frota && Object.keys(cp.frota).length>=3),
   cp && cp.eu ? cp.eu.papel+', '+Object.keys(cp.frota).length+' documentos'
               : 'não guardou');

const ctx4=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'], geolocation:gps});
await ctx4.addInitScript(([g])=>{
  /* o telemóvel tal como ficou */
  for(const k of ['copia','condutor','quem'])
    if(g[k]) localStorage.setItem(
      k==='copia'?'fleetcv-supa-copia':'fleetcv-'+k, g[k]);
  if(g.sessao) localStorage.setItem('sb-sessao', g.sessao);
  /* ...e a base de dados sem dar sinal, como num sítio sem cobertura */
  const esperar=setInterval(()=>{
    if(!window.supabase||!window.supabase.createClient) return;
    clearInterval(esperar);
    const antes=window.supabase.createClient;
    window.supabase.createClient=function(){
      const c=antes.apply(this,arguments);
      const morto=()=>Promise.reject(new Error('fetch failed'));
      c.from=function(){ const q={select:()=>q, eq:()=>q, in:()=>q,
        order:()=>q, limit:()=>q, maybeSingle:()=>q, upsert:morto,
        delete:()=>q, then:(ok,mal)=>morto().then(ok,mal),
        catch:m=>morto().catch(m)}; return q; };
      return c; }; },5);
}, [guardado]);
const sr=await ctx4.newPage();
sr.on('pageerror',e=>err.push('sem rede: '+e.message));
await sr.goto(U); await sr.waitForTimeout(2500);
await sr.click('[data-quem="condutor"]').catch(()=>{});
await sr.waitForTimeout(1500);
const tsr=await sr.textContent('#ecra');
ok('sem rede, o condutor continua a ver os carros',
   /Que carro vai levar/.test(tsr) && /ST-28-ED/.test(tsr),
   await sr.evaluate(()=>Nuvem.estado()));
/* o selo vive no cabeçalho, não no ecrã */
const topo=await sr.textContent('#dir').catch(()=>'');
ok('e avisa-o, no cabeçalho, de que está sem ligação',
   (await sr.evaluate(()=>Nuvem.estado()))==='supabase-sem-rede' &&
   topo.includes('sem ligação'),
   (await sr.evaluate(()=>Nuvem.estado()))+' · cabeçalho: "'+
     topo.replace(/\s+/g,' ').trim()+'"');
/* e consegue mesmo começar a trabalhar */
await sr.locator('[data-carro]').first().click().catch(()=>{});
await sr.waitForTimeout(700);
await sr.click('[data-f="ir-gps"]').catch(()=>{}); await sr.waitForTimeout(1500);
await sr.click('[data-f="comecar-sim"]').catch(()=>{}); await sr.waitForTimeout(2500);
ok('e abre o turno na mesma, para subir quando houver rede',
   await sr.isVisible('.volante'),
   (await sr.evaluate(()=>Nuvem.porEnviar()))+' por enviar');

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
