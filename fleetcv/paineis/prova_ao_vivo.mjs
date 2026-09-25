/* A PROVA AO VIVO — o site publicado, a base de dados verdadeira
   Faz o caminho de um cliente novo do princípio ao fim, no endereço
   que está no ar: cria uma conta, junta um carro e um condutor, o
   condutor entra e anda, o patrão vê-o andar e fechar o turno — e no
   fim apaga a conta, para não deixar lixo na base de ninguém.

   Não precisa de código nenhum: a conta é criada aqui, com um e-mail
   de teste e um código tirado à sorte, e morre aqui.

     node prova_ao_vivo.mjs                       (https://fleetcv.vercel.app)
     SITE=https://outro.vercel.app node prova_ao_vivo.mjs

   Numa máquina atrás de um proxy que abre o HTTPS (como a do Claude),
   passe a impressão digital do certificado dele em CCR_SPKI. */
import { chromium } from 'playwright';
import crypto from 'node:crypto';

const SITE=(process.env.SITE||'https://fleetcv.vercel.app').replace(/\/$/,'');
const SPKI=process.env.CCR_SPKI||'';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args: SPKI?['--ignore-certificate-errors-spki-list='+SPKI]:[] });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const ate=async(f,seg=40)=>{ const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,700)); } return false; };
const marca=Date.now().toString(36);
const EMAIL='prova-'+marca+'@fleetcv.test';
const CODIGO=crypto.randomBytes(9).toString('base64url');
const MAT='PV-'+marca.slice(-4).toUpperCase();
console.log('site:', SITE, '· conta de prova:', EMAIL);

/* ── a página principal ───────────────────────────────────── */
const r0=await fetch(SITE+'/');
const h0=await r0.text();
ok('a página principal está no endereço principal',
   r0.ok && /O condutor diz/.test(h0) && h0.includes('/app#criar'));
const r1=await fetch(SITE+'/app');
ok('e a aplicação em /app', r1.ok && /porteiro\.js/.test(await r1.text()));

/* ── o patrão novo ────────────────────────────────────────── */
const cp=await b.newContext({viewport:{width:430,height:950}});
const p=await cp.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
p.on('dialog',d=>d.accept());
const txt=()=>p.textContent('#ecra');
await p.goto(SITE+'/app#criar');
ok('"Criar conta" abre o ecrã de criar',
   await ate(async()=>/Criar conta/.test(await txt()),30));
ok('e liga-se ao Supabase verdadeiro',
   await ate(async()=>(await p.evaluate(()=>Nuvem.estado())).startsWith('supabase'),30),
   await p.evaluate(()=>Nuvem.estado()));
for(const [k,v] of Object.entries({'e-c-nome':'Prova Automática',
  'e-c-frota':'Frota de Prova '+marca,'e-c-email':EMAIL,
  'e-c-cod':CODIGO,'e-c-cod2':CODIGO})) await p.fill('#'+k, v);
await p.click('[data-f="criar"]');
ok('cria a conta e entra na frota nova',
   await ate(async()=>/Bem-vindo à sua frota/.test(await txt())), (await txt()).slice(0,80));
ok('vazia, sem turnos inventados',
   await p.evaluate(()=>{ const d=Nuvem.dados();
     return d.frota.carros.length===0 && d.turnos.length===0; }));

await p.click('[data-f="passo-carro"]'); await p.waitForTimeout(1200);
await p.fill('#e-mat',MAT); await p.fill('#e-marca','Toyota');
await p.fill('#e-km','50000'); await p.fill('#e-dep','45');
await p.click('[data-f="guardar-carro"]');
ok('junta um carro', await ate(async()=>(await txt()).includes(MAT),15));
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(800);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(800);
await p.fill('#e-nome','Condutor de Prova');
await p.fill('#e-email2','prova-c-'+marca+'@fleetcv.test');
await p.click('[data-f="guardar-cond"]');
ok('junta um condutor', await ate(async()=>/mandar-lhe o acesso/.test(await txt()),15));
const zap=await p.getAttribute('#mandar-zap','href');
const cod=await p.evaluate(()=>Nuvem.dados().frota.condutores[0].codigo);
ok('o WhatsApp leva o endereço certo',
   decodeURIComponent(zap||'').includes(SITE+'/app#condutor'));
/* dar tempo à escrita de chegar à base antes de o condutor entrar */
await p.waitForTimeout(2500);

/* ── o condutor, no telemóvel dele ────────────────────────── */
const cc=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const c=await cc.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
const ctxt=()=>c.textContent('#ecra');
await c.goto(SITE+'/app#condutor');
await ate(async()=>(await c.evaluate(()=>Nuvem.estado())).startsWith('supabase'),30);
await c.fill('#i-email','prova-c-'+marca+'@fleetcv.test'); await c.fill('#i-cod',cod);
await c.click('[data-f="entrar"]');
ok('o condutor entra com o código que recebeu',
   await ate(async()=>/Que carro vai levar/.test(await ctxt())));
const tc=await ctxt();
ok('vê o carro da frota dele, e só esse', tc.includes(MAT) && !tc.includes('ST-28-ED'));
const lista=await c.evaluate(()=>Nuvem.dados().frota.condutores);
ok('e os códigos não lhe chegam ao telemóvel',
   lista.length===1 && lista.every(x=>!('codigo' in x)), JSON.stringify(lista));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(900);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(2000);
await c.click('[data-f="comecar-sim"]');
ok('abre turno', await ate(async()=>c.isVisible('.volante'),20));

/* ── o patrão vê-o andar ──────────────────────────────────── */
await p.bringToFront();
await p.click('[data-tab="mapa"]');
ok('o turno chega ao patrão sozinho',
   await ate(async()=>(await p.evaluate(()=>Nuvem.dados().vivos.length))===1, 60));
const km0=await p.evaluate(()=>(Nuvem.dados().vivos[0]||{}).kmGps||0);
const subiu=await ate(async()=>(await p.evaluate(()=>(Nuvem.dados().vivos[0]||{}).kmGps||0))>km0, 60);
const km1=await p.evaluate(()=>(Nuvem.dados().vivos[0]||{}).kmGps||0);
ok('e os quilómetros sobem no ecrã do patrão', subiu, km0+' → '+km1);

await c.bringToFront();
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(900);
await c.click('[data-f="terminar"]');
ok('o turno fecha', await ate(async()=>/Turno terminado/.test(await ctxt()),20));
await p.bringToFront();
ok('e entra no histórico do patrão',
   await ate(async()=>(await p.evaluate(()=>Nuvem.dados().turnos.length))>=1, 60));

/* ── e vai-se embora, sem deixar lixo ─────────────────────── */
await p.click('[data-tab="definicoes"]');
await ate(async()=>/Apagar a conta/.test(await txt()),15);
await p.fill('#e-x-cod',CODIGO);
await p.click('[data-f="apagar-conta"]');
ok('apaga a conta de prova', await ate(async()=>/conta foi apagada/.test(await txt()),20));
await p.fill('#i-email',EMAIL); await p.fill('#i-cod',CODIGO);
await p.click('[data-f="entrar"]');
ok('e ela já não abre', await ate(async()=>/errados/.test(await txt()),15));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
