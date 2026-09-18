import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:390,height:840}, isMobile:true, hasTouch:true,
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} });
const p = await ctx.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
p.on('console',m=>{ if(m.type()==='error'&&!/CERT|font/i.test(m.text())) err.push(m.text()); });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const txt=()=>p.textContent('#ecra');

await p.goto('file://'+process.cwd()+'/painel_condutor.html'); await p.waitForTimeout(500);
ok('abre DIRECTO no login do condutor', (await txt()).includes('Entrar'));
ok('mostra as contas de teste', (await txt()).includes('antonio@exemplo.cv'));

await p.fill('#i-email','antonio@exemplo.cv'); await p.fill('#i-cod','0000');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(300);
ok('código errado recusado', (await txt()).includes('errados'));
await p.fill('#i-cod','1234'); await p.click('[data-f="entrar"]'); await p.waitForTimeout(400);
ok('1 · escolher carro', (await txt()).includes('Que carro vai levar'));
ok('três carros', (await p.locator('[data-carro]').count())===3);

await p.locator('[data-carro]').first().click(); await p.waitForTimeout(400);
ok('2 · quilometragem', (await txt()).includes('Quantos km marca'));
ok('foto e número lado a lado', await p.isVisible('#ff') && await p.isVisible('#i-km'));
await p.click('[data-f="ir-gps"]'); await p.waitForTimeout(1500);
ok('3 · GPS', (await txt()).includes('GPS'));
ok('GPS ligado', (await txt()).includes('GPS ligado'));

await p.click('[data-f="comecar"]'); await p.waitForTimeout(700);
ok('VOLANTE abre', await p.isVisible('.volante'));
ok('mapa', await p.isVisible('.mapa'));
ok('velocímetro', await p.isVisible('.vel .n'));
for(let i=1;i<=6;i++){
  await ctx.setGeolocation({latitude:14.9177+i*0.0004, longitude:-23.5092+i*0.00016, accuracy:8});
  await p.waitForTimeout(1100); }
await p.waitForTimeout(400);
ok('velocidade a mexer', parseFloat(await p.locator('.vel .n').textContent())>0,
   (await p.locator('.vel .n').textContent())+' km/h');
ok('km a somar', parseFloat((await p.locator('.baixo b').first().textContent()).replace(',','.'))>0,
   await p.locator('.baixo b').first().textContent()+' km');
await p.screenshot({path:'pc-volante.png'});

await p.click('[data-f="ir-abast"]'); await p.waitForTimeout(500);
const ab=await txt();
ok('abastecer', ab.includes('Abastecer'));
ok('GPS encontra o posto', /Enacol|Vivo/.test(ab),
   (ab.match(/(Enacol|Vivo)[A-Za-zÀ-ú .]*/)||[])[0]);
await p.fill('#i-valor','2000'); await p.waitForTimeout(500);
ok('calcula litros', (await txt()).includes('13,79'));
await p.fill('#i-litros','8.62'); await p.waitForTimeout(300);
await p.click('[data-f="guardar-abast"]'); await p.waitForTimeout(500);
ok('volta ao volante com o abastecimento', (await txt()).includes('2.000 CVE'));
await p.screenshot({path:'pc-abast.png'});

await p.click('[data-f="ir-fim"]'); await p.waitForTimeout(400);
ok('terminar', (await txt()).includes('Terminar o turno'));
await p.click('[data-f="terminar"]'); await p.waitForTimeout(700);
const fim=await txt();
ok('resumo do turno', fim.includes('Turno terminado'));
ok('apanhou o talão inflacionado', fim.includes('Por explicar'));
await p.screenshot({path:'pc-resumo.png'});

await p.click('[data-f="ir-meus"]'); await p.waitForTimeout(400);
ok('os meus turnos', (await p.locator('[data-ver]').count())>0);
/* o condutor também tem de poder rever um turno antigo, com o mapa */
await p.locator('[data-ver]').first().click(); await p.waitForTimeout(700);
ok('o turno antigo abre com o mapa',
   await p.isVisible('.mapinha') && /km andados|Quilometragem/.test(await txt()));
ok('e dá para voltar', await p.isVisible('[data-f="ir-meus"]'));
await p.screenshot({path:'pc-meu-turno.png'});
await p.click('[data-f="ir-meus"]'); await p.waitForTimeout(400);
await p.reload(); await p.waitForTimeout(700);
ok('sobrevive a recarregar', (await txt()).length>30);

/* ─── o GPS quando corre mal: é onde o condutor se perdia ─── */
const ctx2 = await b.newContext({ viewport:{width:390,height:840}, isMobile:true,
  hasTouch:true, permissions:[] });                       // sem autorização
const q = await ctx2.newPage();
const err2=[]; q.on('pageerror',e=>err2.push(e.message));
await q.goto('file://'+process.cwd()+'/painel_condutor.html'); await q.waitForTimeout(400);
await q.fill('#i-email','jorge@exemplo.cv'); await q.fill('#i-cod','2345');
await q.click('[data-f="entrar"]'); await q.waitForTimeout(300);
await q.locator('[data-carro]').first().click(); await q.waitForTimeout(300);
await q.click('[data-f="ir-gps"]'); await q.waitForTimeout(2500);
const gz = await q.textContent('#ecra');
ok('GPS recusado é explicado, não fica calado',
   /não deu a localização|separador/.test(gz) && /Permitir|separador|definições/.test(gz));
ok('mesmo sem GPS dá para começar', await q.isVisible('[data-f="comecar"]'));
ok('e dá para tentar outra vez', (await q.textContent('#accoes')).includes('outra vez'));
await q.screenshot({path:'pc-gpsmau.png'});

/* dentro de uma moldura (é assim que o Claude mostra) a mensagem muda */
const ctx3 = await b.newContext({ viewport:{width:420,height:840}, permissions:[] });
const q2 = await ctx3.newPage();
await q2.goto('file://'+process.cwd()+'/_moldura.html'); await q2.waitForTimeout(800);
const fr = q2.frames()[1];
await fr.fill('#i-email','jorge@exemplo.cv'); await fr.fill('#i-cod','2345');
await fr.click('[data-f="entrar"]'); await q2.waitForTimeout(300);
await fr.locator('[data-carro]').first().click(); await q2.waitForTimeout(300);
await fr.click('[data-f="ir-gps"]'); await q2.waitForTimeout(2500);
ok('dentro de moldura manda abrir em separador',
   (await fr.textContent('#ecra')).includes('separador'));

/* ─── experimentar sem conduzir: anda por ruas verdadeiras ── */
const ctx4 = await b.newContext({ viewport:{width:390,height:840}, isMobile:true,
  hasTouch:true, permissions:[] });
const q3 = await ctx4.newPage();
await q3.goto('file://'+process.cwd()+'/painel_condutor.html'); await q3.waitForTimeout(400);
await q3.fill('#i-email','nuno@exemplo.cv'); await q3.fill('#i-cod','3456');
await q3.click('[data-f="entrar"]'); await q3.waitForTimeout(300);
await q3.locator('[data-carro]').nth(1).click(); await q3.waitForTimeout(300);
await q3.click('[data-f="ir-gps"]'); await q3.waitForTimeout(1200);
await q3.click('[data-f="comecar-sim"]'); await q3.waitForTimeout(10000);
ok('ensaio: mapa a mexer', await q3.isVisible('.mapa'));
const kmSim = parseFloat((await q3.locator('.baixo b').first().textContent()).replace(',','.'));
ok('ensaio: km a somar', kmSim>0.1, kmSim+' km');
ok('ensaio: diz o bairro', await q3.isVisible('.onde'),
   await q3.locator('.onde').textContent().catch(()=>'—'));
const rasto = await q3.evaluate(()=>JSON.parse(localStorage.getItem('fleetcv-condutor')).turno.rasto);
const naPraia = rasto.every(p=>p[0]>14.88&&p[0]<14.98&&p[1]>-23.58&&p[1]<-23.45);
ok('ensaio: não sai da Praia', naPraia, rasto.length+' pontos');
await q3.screenshot({path:'pc-ensaio.png'});

console.log('\nerros JS:', err.length+err2.length?[...err,...err2]:'nenhum');
await b.close();
