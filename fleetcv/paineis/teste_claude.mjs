/* NO CAMINHO DO CLAUDE
   A base de dados do Claude devolve os documentos CONGELADOS. Quem
   tentar mudar um campo leva um erro e pára a meio, calado — foi
   assim que a aplicação publicada deixou de guardar fosse o que
   fosse, enquanto todos os outros testes passavam.

   Aqui corre-se tudo contra um simulador que congela igual. Se
   passar aqui, guarda lá. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app = fs.readFileSync('fleetcv.html','utf8');
const falso = fs.readFileSync('_db_falso.js','utf8');
fs.writeFileSync('_comodb.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const ctx = await b.newContext({ viewport:{width:430,height:950},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} });
const p = await ctx.newPage();
p.on('pageerror',e=>err.push(e.message));
const txt=()=>p.textContent('#ecra');
await p.goto('file://'+process.cwd()+'/_comodb.html'); await p.waitForTimeout(1500);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
ok('o patrão entra', (await txt()).includes('A frota agora'));

/* ── VIATURAS ───────────────────────────────────────────── */
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(700);
await p.locator('[data-carro]').first().click(); await p.waitForTimeout(600);
await p.click('[data-f="editar-carro"]'); await p.waitForTimeout(600);
await p.fill('#e-marca','Toyota Novo'); await p.waitForTimeout(300);
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(1200);
ok('EDITAR uma viatura guarda', /Toyota Novo/.test(await txt()));

const novaViatura = async (mat, extra) => {
  await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(500);
  await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(600);
  if(mat!=null) await p.fill('#e-mat',mat);
  if(extra) await extra();
  await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(1200);
  return await txt(); };

ok('VIATURA NOVA guarda', /ST-28-ED/.test(await novaViatura('ST-28-ED')));
/* a matrícula é livre: cada ilha e cada idade de carro tem a sua */
for(const m of ['SV 14 AB','28-ED-ST','CVS1234','sa09tk','PROVISÓRIA 2','7777'])
  ok('aceita a matrícula «'+m+'» tal como foi escrita',
     (await novaViatura(m)).includes(m), m);
ok('e aceita até sem matrícula nenhuma',
   /Carro \d/.test(await novaViatura('')));
ok('mas não deixa duas iguais',
   /Já existe/.test(await novaViatura('ST-28-ED')));

/* ── CONDUTORES ─────────────────────────────────────────── */
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(700);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(600);
await p.fill('#e-nome','Maria Lopes'); await p.fill('#e-email2','maria@exemplo.cv');
await p.fill('#e-codigo','7788');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1200);
ok('CONDUTOR NOVO guarda', /Maria Lopes/.test(await txt()));
await p.click('[data-f="editar-cond"]'); await p.waitForTimeout(600);
await p.fill('#e-tel','+238 991 55 44'); await p.waitForTimeout(200);
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(1200);
ok('EDITAR um condutor guarda', /991 55 44/.test(await txt()));
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(600);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(600);
await p.fill('#e-nome','Sem chave');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(800);
ok('condutor sem email nem código não passa', /Faltam o email/.test(await txt()));

/* ── DEFINIÇÕES ─────────────────────────────────────────── */
await p.click('[data-tab="definicoes"]'); await p.waitForTimeout(700);
await p.fill('#e-preco','152.50'); await p.waitForTimeout(200);
await p.click('[data-f="guardar-defs"]'); await p.waitForTimeout(1200);
ok('o PREÇO DO LITRO guarda', /152,50/.test(await txt()), '152,50 CVE');
await p.fill('#e-nomefrota','Táxis Yanick'); await p.waitForTimeout(200);
await p.click('[data-f="guardar-defs"]'); await p.waitForTimeout(1200);
ok('o nome da frota guarda',
   (await p.textContent('#sub-marca')).includes('Táxis Yanick'));

/* ── ALERTAS ────────────────────────────────────────────── */
await p.click('[data-tab="alertas"]'); await p.waitForTimeout(900);
const nA = await p.locator('[data-res]').count();
if(nA){ await p.locator('[data-res]').first().click(); await p.waitForTimeout(1000);
  ok('RESOLVER um alerta guarda',
     (await p.locator('[data-res]').count())<nA, nA+' → '+(await p.locator('[data-res]').count()));
} else ok('RESOLVER um alerta guarda', false, 'não havia alertas');

/* ── TUDO SOBREVIVE A RECARREGAR ────────────────────────── */
await p.reload(); await p.waitForTimeout(2500);
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(900);
const vv = await txt();
ok('depois de recarregar: as viaturas ficaram',
   /ST-28-ED/.test(vv) && /Toyota Novo/.test(vv));
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(700);
ok('depois de recarregar: os condutores ficaram', /Maria Lopes/.test(await txt()));
await p.click('[data-tab="definicoes"]'); await p.waitForTimeout(700);
ok('depois de recarregar: o preço ficou',
   (await p.inputValue('#e-preco'))==='152.5', await p.inputValue('#e-preco'));

/* ── O CONDUTOR, no mesmo caminho ───────────────────────── */
const co = await (await b.newContext({ viewport:{width:390,height:840},
  isMobile:true, hasTouch:true, permissions:['geolocation'],
  geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} })).newPage();
co.on('pageerror',e=>err.push('condutor: '+e.message));
await co.goto('file://'+process.cwd()+'/_comodb.html'); await co.waitForTimeout(1500);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(500);
await co.fill('#i-email','antonio@exemplo.cv'); await co.fill('#i-cod','1234');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(1500);
ok('o condutor entra', (await co.textContent('#ecra')).includes('Que carro vai levar'));
await co.locator('[data-carro]').first().click(); await co.waitForTimeout(600);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1300);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(2500);
ok('o condutor abre turno', await co.isVisible('.volante'));
await co.click('[data-f="ir-abast"]'); await co.waitForTimeout(700);
await co.fill('#i-valor','2000'); await co.waitForTimeout(400);
await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(900);
ok('o condutor abastece', (await co.textContent('#ecra')).includes('2.000'));
await co.click('[data-f="ir-fim"]'); await co.waitForTimeout(600);
await co.click('[data-f="terminar"]'); await co.waitForTimeout(1500);
ok('o condutor fecha o turno',
   (await co.textContent('#ecra')).includes('Turno terminado'));

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
