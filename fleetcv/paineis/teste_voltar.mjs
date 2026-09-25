/* VOLTAR — o botão do cabeçalho e o do telemóvel
   Cada ecrã tem de ter por onde voltar, e o botão de voltar do próprio
   telemóvel tem de recuar um ecrã, não fechar a aplicação. Com o turno
   aberto, ao volante, não pode sair de todo: sair era o GPS parar. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_voltar.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_voltar.html';
const esperar=async(f,ms=6000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,150)); } return false; };
const ctx=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});

/* o botão de voltar do telemóvel é o "voltar" do navegador */
const botaoDoTelemovel=async pg=>{ await pg.evaluate(()=>history.back()); await pg.waitForTimeout(500); };
const temVoltar=pg=>pg.isVisible('#voltar');

/* ══ O PATRÃO ══════════════════════════════════════════════ */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
ok('patrão · no ecrã de entrar há "Voltar"', await temVoltar(p));
await p.click('#voltar');
ok('e leva à escolha entre condutor e patrão',
   await esperar(()=>p.isVisible('[data-quem="dono"]')));

/* mudar só o # não recarrega a página; vindo de fora (da página
   principal) é sempre uma página nova, e é isso que se imita aqui */
await p.goto('about:blank'); await p.goto(U+'#criar'); await p.waitForTimeout(1500);
ok('no criar conta há "Voltar"', await temVoltar(p));
await botaoDoTelemovel(p);
ok('e o botão do telemóvel leva ao ecrã de entrar', /Painel do proprietário/.test(await txt()));
await p.click('[data-f="ir-criar"]'); await p.waitForTimeout(500);
for(const [k,v] of Object.entries({'e-c-nome':'Manuel Tavares','e-c-frota':'Táxis Tavares',
  'e-c-email':'manuel@tavares.cv','e-c-cod':'tavares1','e-c-cod2':'tavares1'})) await p.fill('#'+k,v);
await p.click('[data-f="criar"]');
await esperar(async()=>/A frota agora/.test(await txt()));
ok('no mapa (o ecrã de partida) não há "Voltar"', !(await temVoltar(p)));

await p.click('[data-tab="contas"]'); await p.waitForTimeout(500);
ok('noutro separador há "Voltar"', await temVoltar(p));
await botaoDoTelemovel(p);
ok('e o botão do telemóvel volta ao mapa, sem sair', /A frota agora/.test(await txt()));

await p.click('[data-f="passo-carro"]'); await p.waitForTimeout(800);
ok('a ficha de carro novo tem "Voltar"', await temVoltar(p) && /Nov/.test(await txt()));
await p.click('#voltar'); await p.waitForTimeout(500);
ok('e volta às viaturas', /Viaturas/.test(await txt()));
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(600);
await p.fill('#e-mat','ST-51-TV'); await p.fill('#e-km','88000'); await p.fill('#e-dep','45');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(800);
ok('a ficha do carro gravado tem "Voltar"', await temVoltar(p) && /ST-51-TV/.test(await txt()));
await botaoDoTelemovel(p);
ok('o telemóvel volta à lista de viaturas', /Viaturas/.test(await txt()));
await botaoDoTelemovel(p);
ok('e daí ao mapa', /A frota agora/.test(await txt()));

await p.click('[data-tab="condutores"]'); await p.waitForTimeout(500);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(500);
await p.fill('#e-nome','Rui Gomes'); await p.fill('#e-email2','rui@tavares.cv');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1200);
ok('a ficha do condutor tem "Voltar"', await temVoltar(p) && /Rui Gomes/.test(await txt()));
await p.click('#voltar'); await p.waitForTimeout(500);
ok('e volta à lista de condutores', /Condutores/.test(await txt()));
const cod=await p.evaluate(()=>Nuvem.dados().frota.condutores[0].codigo);

/* ══ O CONDUTOR ════════════════════════════════════════════ */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
const ctxt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
ok('condutor · no ecrã de entrar há "Voltar"', await temVoltar(c));
await c.fill('#i-email','rui@tavares.cv'); await c.fill('#i-cod',cod);
await c.click('[data-f="entrar"]');
await esperar(async()=>/Que carro vai levar/.test(await ctxt()));
ok('no passo 1 (escolher o carro) não há "Voltar"', !(await temVoltar(c)));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(500);
ok('no passo 2 (os km) há "Voltar"', await temVoltar(c) && /Quantos km/.test(await ctxt()));
await c.click('#voltar'); await c.waitForTimeout(400);
ok('e volta à escolha do carro', /Que carro vai levar/.test(await ctxt()));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(500);
await c.fill('#i-km','88012'); await c.waitForTimeout(300);
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
ok('no passo 3 (o GPS) há "Voltar" — antes não havia', await temVoltar(c) && /Ligar o GPS/.test(await ctxt()));
await botaoDoTelemovel(c);
ok('o telemóvel volta aos km', /Quantos km/.test(await ctxt()));
ok('sem perder os km que escreveu', (await c.inputValue('#i-km'))==='88012');
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2500);
ok('ao volante não há "Voltar"', await c.isVisible('.volante') && !(await temVoltar(c)));
await botaoDoTelemovel(c); await botaoDoTelemovel(c);
ok('e o botão do telemóvel NÃO tira o condutor do turno (nem à segunda)',
   await c.isVisible('.volante'));
await c.click('[data-f="ir-abast"]'); await c.waitForTimeout(600);
ok('no abastecer há "Voltar"', await temVoltar(c));
await botaoDoTelemovel(c);
ok('o telemóvel volta ao volante', await c.isVisible('.volante'));
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
ok('no terminar há "Voltar"', await temVoltar(c));
await c.click('#voltar'); await c.waitForTimeout(500);
ok('e volta ao volante, com o turno aberto', await c.isVisible('.volante'));
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
await c.click('[data-f="terminar"]'); await c.waitForTimeout(1500);
ok('fecha o turno', /Turno terminado/.test(await ctxt()));
await botaoDoTelemovel(c);
ok('do resumo, o telemóvel volta à escolha do carro', /Que carro vai levar/.test(await ctxt()));
ok('e aí já aparece "Os meus turnos"', await c.isVisible('[data-f="ir-meus"]'));
await c.click('[data-f="ir-meus"]'); await c.waitForTimeout(500);
ok('os meus turnos têm "Voltar"', await temVoltar(c) && /Os meus turnos/.test(await ctxt()));
await c.locator('[data-ver]').first().click(); await c.waitForTimeout(500);
await botaoDoTelemovel(c);
ok('de um turno antigo, o telemóvel volta à lista', /Os meus turnos/.test(await ctxt()));

/* no cabeçalho tem de caber tudo, num telemóvel estreito */
await c.setViewportSize({width:360,height:740});
await c.click('#voltar'); await c.waitForTimeout(300);
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
const larg=await c.evaluate(()=>({doc:document.documentElement.scrollWidth, ecr:innerWidth}));
ok('a 360 px o cabeçalho com "Voltar" não transborda', larg.doc<=larg.ecr, larg.doc+' ≤ '+larg.ecr);

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
