/* O CÓDIGO ESQUECIDO
   Um patrão que se esquece do código não pode ficar fora da frota à
   espera de alguém. Ao criar a conta recebe um código de recuperação
   (doze letras e algarismos), guarda-o, e com ele escolhe um código
   novo sozinho. Cada código de recuperação serve uma vez; quem estava
   dentro com o código antigo sai. Sem ele — ou enquanto a base não
   tiver as funções — o ecrã manda falar pelo WhatsApp. O condutor
   pede o código ao patrão, que o vê na ficha dele. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_recuperar.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_recuperar.html';
const esperar=async(f,ms=6000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const FORMA=/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const ctx=await b.newContext({viewport:{width:430,height:950}});
/* outro telemóvel, na mesma base (o imitador guarda-a no navegador) */
const outroTel=async(nome)=>{ const pg=await ctx.newPage();
  await pg.addInitScript(n=>{ window.__outroTelemovel=n; }, nome);
  pg.on('pageerror',e=>err.push(nome+': '+e.message)); return pg; };
const preencher=async(pg,o)=>{ for(const [k,v] of Object.entries(o)) await pg.fill('#'+k, v); };

/* ── o Manuel cria a conta e recebe o código de recuperação ── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('Manuel: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U+'#criar'); await p.waitForTimeout(1800);
await preencher(p,{'e-c-nome':'Manuel Tavares','e-c-frota':'Táxis Tavares',
  'e-c-email':'manuel@tavares.cv','e-c-cod':'tavares1','e-c-cod2':'tavares1'});
await p.check('#e-c-aceito');
await p.click('[data-f="criar"]');
ok('ao criar a conta aparece o código de recuperação',
   await esperar(async()=>/Guarde este código/.test(await txt())));
const rec1=(await p.textContent('#rec-codigo')).trim();
ok('com a forma certa', FORMA.test(rec1), rec1);
const zapEu=await p.getAttribute('a[href^="https://wa.me/?text="]','href');
ok('dá para o mandar para si próprio no WhatsApp, com a conta',
   decodeURIComponent(zapEu||'').includes(rec1) && decodeURIComponent(zapEu||'').includes('manuel@tavares.cv'));
ok('o ecrã não tem "Voltar": só se sai pelo "Já guardei"', !(await p.isVisible('#voltar')));
await p.click('[data-f="rec-guardado"]');
ok('"Já guardei" leva à frota', await esperar(async()=>/A frota agora/.test(await txt())));

/* outro telemóvel onde o Manuel também entrou com o código de hoje */
const velho=await outroTel('telemovel-velho');
await velho.goto(U+'#dono'); await velho.waitForTimeout(1500);
await velho.fill('#i-email','manuel@tavares.cv'); await velho.fill('#i-cod','tavares1');
await velho.click('[data-f="entrar"]');
await esperar(async()=>/A frota agora/.test(await velho.textContent('#ecra')));

/* ── esqueceu-se: noutro telemóvel, pelo ecrã de entrar ─────── */
const n=await outroTel('telemovel-novo');
const ntxt=()=>n.textContent('#ecra');
await n.goto(U+'#dono'); await n.waitForTimeout(1500);
await n.fill('#i-email','manuel@tavares.cv');
ok('o ecrã de entrar tem "Esqueci-me do código"', await n.isVisible('[data-f="ir-recuperar"]'));
await n.click('[data-f="ir-recuperar"]'); await n.waitForTimeout(400);
ok('abre o ecrã de recuperar', /Esqueci-me do código/.test(await ntxt()));
ok('com o e-mail que já tinha escrito', (await n.inputValue('#e-r-email'))==='manuel@tavares.cv');
ok('e diz o que fazer sem o código de recuperação (WhatsApp)',
   /\+238 955 78 82/.test(await ntxt()) &&
   /^https:\/\/wa\.me\/2389557882\?/.test(await n.getAttribute('a[href^="https://wa.me/2389557882"]','href')||''));
ok('e ao condutor, que o peça ao patrão', /É condutor\?/.test(await ntxt()));
ok('aqui há "Voltar", para o ecrã de entrar', await n.isVisible('#voltar'));

await preencher(n,{'e-r-rec':'ABCD-EFG','e-r-novo':'manuel22','e-r-novo2':'manuel22'});
await n.click('[data-f="recuperar"]'); await n.waitForTimeout(300);
ok('um código de recuperação curto é apanhado antes de ir à base', /12 letras/.test(await ntxt()));
await preencher(n,{'e-r-rec':'ABCD-EFGH-JKLM','e-r-novo2':'manuel23'});
await n.click('[data-f="recuperar"]'); await n.waitForTimeout(300);
ok('códigos novos diferentes também', /não são iguais/.test(await ntxt()));
await preencher(n,{'e-r-novo2':'manuel22'});
await n.click('[data-f="recuperar"]'); await n.waitForTimeout(1200);
ok('um código de recuperação errado não abre',
   /recuperação errados/.test(await ntxt()));
/* escrito à pressa: minúsculas e sem os tracinhos */
await preencher(n,{'e-r-rec':rec1.toLowerCase().replace(/-/g,' ')});
await n.click('[data-f="recuperar"]');
ok('com o certo (mesmo em minúsculas e sem tracinhos), entra',
   await esperar(async()=>/Guarde este código/.test(await ntxt())));
ok('e diz que entrou com o código novo', /entrou com o código novo/.test(await ntxt()));
const rec2=(await n.textContent('#rec-codigo')).trim();
ok('e recebe logo um código de recuperação novo', FORMA.test(rec2) && rec2!==rec1, rec2);
await n.click('[data-f="rec-guardado"]');
ok('na frota dele', await esperar(async()=>/Táxis Tavares/.test(await n.textContent('#sub-marca'))),
   await n.textContent('#sub-marca'));

/* ── o que mudou ───────────────────────────────────────────── */
await velho.bringToFront(); await velho.reload();
ok('o telemóvel que estava dentro com o código antigo sai',
   await esperar(async()=>await velho.isVisible('#i-email'), 5000));
await velho.fill('#i-email','manuel@tavares.cv'); await velho.fill('#i-cod','tavares1');
await velho.click('[data-f="entrar"]'); await velho.waitForTimeout(1200);
ok('o código antigo já não abre', /errados/.test(await velho.textContent('#ecra')));
await velho.fill('#i-cod','manuel22');
await velho.click('[data-f="entrar"]');
ok('o novo abre', await esperar(async()=>/A frota agora/.test(await velho.textContent('#ecra'))));

const u=await outroTel('reusar');
await u.goto(U+'#dono'); await u.waitForTimeout(1500);
await u.click('[data-f="ir-recuperar"]'); await u.waitForTimeout(300);
await preencher(u,{'e-r-email':'manuel@tavares.cv','e-r-rec':rec1,'e-r-novo':'roubado1','e-r-novo2':'roubado1'});
await u.click('[data-f="recuperar"]'); await u.waitForTimeout(1200);
ok('o código de recuperação já usado não serve outra vez',
   /recuperação errados/.test(await u.textContent('#ecra')));

/* ── nas definições: tirar um código novo ──────────────────── */
await n.bringToFront();
await n.click('[data-tab="definicoes"]'); await n.waitForTimeout(800);
ok('as definições têm o cartão do código de recuperação', /Código de recuperação/.test(await ntxt()));
await n.fill('#e-q-cod','errado'); await n.click('[data-f="nova-rec"]'); await n.waitForTimeout(800);
ok('sem o código de hoje, não dá', /não está certo/.test(await ntxt()));
await n.fill('#e-q-cod','manuel22'); await n.click('[data-f="nova-rec"]');
ok('com ele, mostra um código novo para guardar',
   await esperar(async()=>/Guarde este código/.test(await ntxt())));
const rec3=(await n.textContent('#rec-codigo')).trim();
ok('diferente do anterior', FORMA.test(rec3) && rec3!==rec2, rec3);
await n.click('[data-f="rec-guardado"]'); await n.waitForTimeout(300);
await preencher(u,{'e-r-rec':rec2});
await u.click('[data-f="recuperar"]'); await u.waitForTimeout(1200);
ok('o anterior deixou de servir', /recuperação errados/.test(await u.textContent('#ecra')));

/* ── a trava: cinco enganos e fica de castigo ─────────────── */
for(let i=0;i<3;i++){ await u.click('[data-f="recuperar"]'); await u.waitForTimeout(500); }
await preencher(u,{'e-r-rec':rec3});
await u.click('[data-f="recuperar"]'); await u.waitForTimeout(1200);
ok('ao fim de cinco enganos, nem o certo passa durante um quarto de hora',
   /Demasiadas tentativas/.test(await u.textContent('#ecra')));

/* ── o condutor ─────────────────────────────────────────────── */
const c=await outroTel('condutor');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
ok('o condutor que se esqueceu sabe que o pede ao patrão',
   /esqueceu-se dele\? Peça-o ao patrão/.test(await c.textContent('#ecra')));
await ctx.close();

/* ── uma base ainda sem as funções (por aplicar) ───────────── */
const ctx2=await b.newContext({viewport:{width:430,height:950}});
await ctx2.addInitScript(()=>{ window.__semFuncoes=['recuperar_acesso','novo_codigo_recuperacao']; });
const s=await ctx2.newPage(); s.on('pageerror',e=>err.push('sem funções: '+e.message));
const stxt=()=>s.textContent('#ecra');
await s.goto(U+'#criar'); await s.waitForTimeout(1800);
await preencher(s,{'e-c-nome':'Ana Silva','e-c-frota':'Táxis Ana',
  'e-c-email':'ana@silva.cv','e-c-cod':'anasilva','e-c-cod2':'anasilva'});
await s.check('#e-c-aceito');
await s.click('[data-f="criar"]');
ok('sem as funções, criar a conta segue direito para a frota',
   await esperar(async()=>/A frota agora/.test(await stxt())));
s.on('dialog', d=>d.accept());
await s.click('[data-tab="definicoes"]'); await s.waitForTimeout(600);
await s.click('[data-f="sair"]'); await s.waitForTimeout(800);
await s.click('[data-f="ir-recuperar"]'); await s.waitForTimeout(300);
await preencher(s,{'e-r-email':'ana@silva.cv','e-r-rec':'ABCD-EFGH-JKLM','e-r-novo':'anasilva2','e-r-novo2':'anasilva2'});
await s.click('[data-f="recuperar"]'); await s.waitForTimeout(1200);
ok('e recuperar manda falar pelo WhatsApp, sem erro feio',
   /Ainda não dá para recuperar por aqui/.test(await stxt()));
await ctx2.close();

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
