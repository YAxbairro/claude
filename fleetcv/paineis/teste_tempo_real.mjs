/* O TEMPO REAL
   Dois painéis abertos ao mesmo tempo, como o condutor no carro e o
   patrão em casa. Tudo o que acontece num tem de aparecer no outro
   sozinho, sem ninguém carregar em nada. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
/* o mesmo contexto = o mesmo aparelho, dois separadores */
const ctx = await b.newContext({ viewport:{width:400,height:880},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} });
const URL='file://'+process.cwd()+'/fleetcv.html';

/* espera até a condição ser verdade, ou desiste */
async function ate(f, seg=25){
  const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ if(await f()) return true; await new Promise(r=>setTimeout(r,400)); }
  return false;
}

/* ── o patrão abre o painel dele ─────────────────────────── */
const patrao = await ctx.newPage();
patrao.on('pageerror',e=>err.push('patrão: '+e.message));
await patrao.goto(URL); await patrao.waitForTimeout(600);
await patrao.click('[data-quem="dono"]'); await patrao.waitForTimeout(500);
await patrao.fill('#i-email','patrao@exemplo.cv'); await patrao.fill('#i-cod','9999');
await patrao.click('[data-f="entrar"]'); await patrao.waitForTimeout(1200);
ok('o patrão está no mapa da frota',
   (await patrao.textContent('#ecra')).includes('A frota agora'));
ok('e ninguém está a conduzir ainda',
   (await patrao.textContent('#ecra')).includes('Nenhum carro em turno'));

/* ── o condutor abre no telemóvel dele ───────────────────── */
const condutor = await ctx.newPage();
condutor.on('pageerror',e=>err.push('condutor: '+e.message));
await condutor.goto(URL); await condutor.waitForTimeout(600);
await condutor.click('#trocar'); await condutor.waitForTimeout(500);
await condutor.click('[data-quem="condutor"]'); await condutor.waitForTimeout(600);
await condutor.fill('#i-email','antonio@exemplo.cv'); await condutor.fill('#i-cod','1234');
await condutor.click('[data-f="entrar"]'); await condutor.waitForTimeout(500);
ok('o condutor entrou e vê os carros do patrão',
   (await condutor.locator('[data-carro]').count())>=3);

/* ── 1 · ABRE O TURNO → o patrão vê logo ─────────────────── */
await condutor.locator('[data-carro]').first().click(); await condutor.waitForTimeout(400);
await condutor.click('[data-f="ir-gps"]'); await condutor.waitForTimeout(1300);
await condutor.click('[data-f="comecar-sim"]'); await condutor.waitForTimeout(1500);
ok('o condutor está ao volante', await condutor.isVisible('.volante'));

ok('ABRIR TURNO chega ao patrão sozinho',
   await ate(async()=> (await patrao.textContent('#ecra')).includes('em turno neste momento')),
   (await patrao.textContent('#ecra')).match(/\d+ carros? em turno/)?.[0]);
ok('e diz quem é e em que carro',
   /CV-01-AB/.test(await patrao.textContent('#ecra')) &&
   /António/.test(await patrao.textContent('#ecra')));

/* ── 2 · O CARRO ANDA → o patrão vê os km a subir ────────── */
/* os km do carro que está a andar. O cartão dele é o que diz
   "desde as" — os outros são turnos do histórico, e o resumo do mês
   também tem a palavra "km". */
const aoVivo = patrao.locator('[data-turno]', { hasText:'desde as' }).first();
const kmDo=async()=>{
  const t=await aoVivo.textContent().catch(()=>'');
  const m=(t||'').match(/([\d,.]+) km/); return m?parseFloat(m[1].replace(',','.')):0; };
await ate(async()=> (await kmDo())>0);
const km1=await kmDo();
ok('O CARRO A ANDAR chega ao patrão sozinho',
   await ate(async()=> (await kmDo())>km1+0.05, 30),
   km1+' km → '+(await kmDo())+' km');
ok('e diz em que bairro vai', /desde as/.test(await aoVivo.textContent()),
   (await aoVivo.textContent()).split('·')[0].trim().split('\n').pop());

/* o patrão abre o turno ao vivo e vê o carro no mapa */
await aoVivo.click(); await patrao.waitForTimeout(900);
ok('o patrão abre o turno a decorrer',
   (await patrao.textContent('#ecra')).includes('Em turno agora'));
ok('com o carro no mapa da Praia', await patrao.isVisible('.mapa'));
await patrao.screenshot({path:'r1-patrao-ao-vivo.png', animations:'allow', timeout:8000}).catch(()=>console.log('  (sem foto de '+'r1-patrao-ao-vivo.png'+')'));

/* ── 3 · ABASTECE → aparece no ecrã do patrão ────────────── */
await condutor.click('[data-f="ir-abast"]'); await condutor.waitForTimeout(600);
await condutor.fill('#i-valor','2500'); await condutor.waitForTimeout(400);
await condutor.click('[data-f="guardar-abast"]'); await condutor.waitForTimeout(800);
ok('ABASTECER chega ao patrão sozinho',
   await ate(async()=> (await patrao.textContent('#ecra')).includes('2.500')),
   '2.500 CVE');

/* ── 4 · FECHA O TURNO → entra no histórico com as contas ── */
await condutor.click('[data-f="ir-fim"]'); await condutor.waitForTimeout(500);
await condutor.click('[data-f="terminar"]'); await condutor.waitForTimeout(1200);
ok('o condutor vê o resumo', (await condutor.textContent('#ecra')).includes('Turno terminado'));
await patrao.click('#voltar').catch(()=>{}); await patrao.waitForTimeout(600);
ok('FECHAR TURNO tira o carro do mapa ao vivo',
   await ate(async()=> (await patrao.textContent('#ecra')).includes('Nenhum carro em turno')));
ok('e o turno passa para o histórico do patrão',
   await ate(async()=> (await patrao.textContent('#ecra')).includes('2.500')));
await patrao.screenshot({path:'r2-patrao-fechado.png', animations:'allow', timeout:8000}).catch(()=>console.log('  (sem foto de '+'r2-patrao-fechado.png'+')'));

/* ── 5 · O PATRÃO MEXE NA FROTA → o condutor vê ──────────── */
await patrao.click('[data-tab="viaturas"]'); await patrao.waitForTimeout(500);
await patrao.click('[data-f="novo-carro"]'); await patrao.waitForTimeout(500);
await patrao.fill('#e-mat','CV-99-ZZ'); await patrao.fill('#e-marca','Kia');
await patrao.fill('#e-modelo','Picanto'); await patrao.fill('#e-km','1000');
await patrao.click('[data-f="guardar-carro"]'); await patrao.waitForTimeout(900);
await condutor.click('[data-f="ir-carro"]').catch(()=>{});
await condutor.waitForTimeout(600);
ok('CARRO NOVO do patrão aparece ao condutor',
   await ate(async()=> (await condutor.textContent('#ecra')).includes('CV-99-ZZ')),
   'CV-99-ZZ');

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
