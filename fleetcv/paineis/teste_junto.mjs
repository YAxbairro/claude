/* O ficheiro junto: o ecrã de escolha, e os dois painéis a funcionar
   lá dentro sem se estorvarem. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const URL='file://'+process.cwd()+'/fleetcv.html';

function nova(ctx){ const p=ctx.newPage(); return p; }
const movel=()=>b.newContext({ viewport:{width:390,height:840}, isMobile:true,
  hasTouch:true, permissions:['geolocation'],
  geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} });

/* ── 1 · a porta de entrada ─────────────────────────────── */
let ctx = await movel(); let p = await nova(ctx);
p.on('pageerror',e=>err.push(e.message));
await p.goto(URL); await p.waitForTimeout(500);
ok('abre a perguntar quem é', (await p.textContent('body')).includes('Sou condutor'));
ok('as duas portas', (await p.locator('[data-quem]').count())===2);
await p.screenshot({path:'j0-escolha.png'});

/* ── 2 · condutor ───────────────────────────────────────── */
await p.click('[data-quem="condutor"]'); await p.waitForTimeout(400);
ok('CONDUTOR abre no login', (await p.textContent('#ecra')).includes('antonio@exemplo.cv'));
ok('o corpo fica marcado como condutor', (await p.getAttribute('body','class'))==='condutor');
await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','1234');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(300);
await p.locator('[data-carro]').first().click(); await p.waitForTimeout(300);
await p.click('[data-f="ir-gps"]'); await p.waitForTimeout(1500);
await p.click('[data-f="comecar"]'); await p.waitForTimeout(600);
ok('volante com o mapa da Praia', await p.isVisible('.volante') && await p.isVisible('.mapa'));
const sv = await p.locator('.mapa').innerHTML();
ok('o mapa é o verdadeiro', sv.includes('var(--rua)') && sv.length>8000,
   Math.round(sv.length/1024)+' kB');
const btC = await p.evaluate(()=>
  parseFloat(getComputedStyle(document.querySelector('.bt')).fontSize));
await p.screenshot({path:'j1-condutor.png'});

/* ── 3 · lembra-se da escolha ───────────────────────────── */
await p.reload(); await p.waitForTimeout(700);
ok('ao voltar já não pergunta outra vez',
   !(await p.textContent('body')).includes('Sou condutor'));
ok('e volta ao turno que estava aberto', await p.isVisible('.volante'));

/* ── 4 · o botão ⇄ volta a perguntar ────────────────────── */
await p.click('#trocar'); await p.waitForTimeout(700);
ok('o ⇄ volta ao ecrã de escolha', (await p.textContent('body')).includes('Sou o proprietário'));

/* ── 5 · proprietário, no mesmo ficheiro ────────────────── */
await p.click('[data-quem="dono"]'); await p.waitForTimeout(500);
ok('PROPRIETÁRIO abre no login', (await p.textContent('#ecra')).includes('patrao@exemplo.cv'));
/* os dois usam .bt com medidas diferentes de propósito: os botões do
   condutor são maiores porque ele mexe neles ao volante. Se as folhas
   de estilo se misturassem, ficariam iguais. */
const btD = await p.evaluate(()=>
  parseFloat(getComputedStyle(document.querySelector('.bt')).fontSize));
ok('as folhas de estilo não se misturam', btC>btD,
   'condutor '+btC+'px · dono '+btD+'px');
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(1200);
const mp = await p.textContent('#ecra');
ok('a frota ao vivo', mp.includes('em turno'));
ok('carros no mapa', await p.isVisible('.mapa'));
await p.screenshot({path:'j2-dono.png'});

await p.click('[data-tab="alertas"]'); await p.waitForTimeout(600);
const al = await p.textContent('#ecra');
ok('os alertas continuam a cruzar dados', /nunca lá esteve|litros aos 100 km/.test(al));

/* ── 6 · os dois guardam em sítios diferentes ───────────── */
const chaves = await p.evaluate(()=>Object.keys(localStorage).sort());
ok('cada painel guarda o seu', chaves.includes('fleetcv-condutor') &&
   chaves.some(k=>/dono|patrao|proprietario/.test(k)) && chaves.includes('fleetcv-quem'),
   chaves.join(', '));

/* ── 7 · o turno do condutor sobreviveu à ida e volta ───── */
await p.click('#trocar'); await p.waitForTimeout(600);
await p.click('[data-quem="condutor"]'); await p.waitForTimeout(700);
ok('o turno do condutor não se perdeu', await p.isVisible('.volante'));

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
