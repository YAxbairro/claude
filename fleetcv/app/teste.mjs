import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({
  viewport:{width:390,height:840}, isMobile:true, hasTouch:true,
  permissions:['geolocation'], geolocation:{latitude:14.9177, longitude:-23.5092, accuracy:8},
});
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push('JS: ' + e.message));
p.on('console', m => { if (m.type()==='error' && !/CERT|font/i.test(m.text())) erros.push(m.text()); });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const txt=()=>p.textContent('#ecra');

await p.goto('file://' + process.cwd() + '/condutor.html');
await p.waitForTimeout(600);
ok('abre na configuração', (await txt()).includes('Bem-vindo'));
await p.click('[data-fazer="demo-rapida"]'); await p.waitForTimeout(900);
ok('dados de exemplo', (await txt()).includes('CVE em combustível'));

await p.click('[data-tab="equipa"]'); await p.waitForTimeout(500);
const eq = await txt();
ok('equipa mostra email e código', eq.includes('antonio@exemplo.cv') && eq.includes('1234'));

// ════ CONDUTOR ════
await p.click('[data-tab="mais"]'); await p.waitForTimeout(400);
await p.click('[data-fazer="papel-condutor"]'); await p.waitForTimeout(500);
ok('1 · ecrã de entrar', (await txt()).includes('Entrar'));

await p.fill('#e-email', 'antonio@exemplo.cv'); await p.fill('#e-codigo', '9999');
await p.click('[data-fazer="entrar"]'); await p.waitForTimeout(400);
ok('código errado é recusado', (await txt()).includes('errados'));

await p.fill('#e-codigo', '1234');
await p.click('[data-fazer="entrar"]'); await p.waitForTimeout(600);
ok('2 · escolher o carro', (await txt()).includes('Que carro vai levar'));
ok('lista os três carros', (await p.locator('[data-carro]').count()) === 3);

await p.locator('[data-carro]').first().click(); await p.waitForTimeout(500);
ok('3 · quilometragem', (await txt()).includes('Quantos km marca'));
ok('dá para escrever à mão', await p.isVisible('#km'));
ok('e dá para fotografar', await p.isVisible('[data-foto="abertura"]'));
await p.click('[data-fazer="ir-gps"]'); await p.waitForTimeout(500);
ok('4 · pedir o GPS', (await txt()).includes('Ligar o GPS'));
// com a permissão já concedida o sinal pode chegar antes de o botão ser tocado
if (await p.locator('[data-fazer="pedir-gps"]').count())
  await p.click('[data-fazer="pedir-gps"]');
await p.waitForTimeout(1500);
ok('GPS aceite', (await txt()).includes('GPS ligado'));

await p.click('[data-fazer="comecar"]'); await p.waitForTimeout(800);
ok('5 · o volante abre', await p.isVisible('.volante'));
ok('mapa ao vivo', await p.isVisible('.mapa-vivo'));
ok('velocímetro', await p.isVisible('.vel .n'));

for (let i = 1; i <= 7; i++) {
  await ctx.setGeolocation({ latitude:14.9177+i*0.0004, longitude:-23.5092+i*0.00016, accuracy:8 });
  await p.waitForTimeout(1100);
}
await p.waitForTimeout(500);
const velTexto = await p.locator('.vel .n').textContent();
const kmTexto = await p.locator('.hud-baixo b').first().textContent();
ok('velocidade a mexer', parseFloat(velTexto) > 0, velTexto + ' km/h');
ok('quilómetros a somar', parseFloat(kmTexto.replace(',', '.')) > 0, kmTexto + ' km');
ok('o carro aparece no mapa', (await p.locator('.mapa-vivo path').count()) > 2);
await p.screenshot({ path: 'v-volante.png' });

await p.click('[data-fazer="ir-abastecer"]'); await p.waitForTimeout(600);
const ab = await txt();
ok('6 · abastecer', ab.includes('Abastecer'));
ok('GPS encontra o posto mais perto', ab.includes('Enacol') || ab.includes('Vivo'),
   (ab.match(/(Enacol|Vivo)[^·]*/)||[])[0]);
ok('mostra a distância ao posto', /metros|km/.test(ab));
await p.fill('#valor', '2000'); await p.waitForTimeout(600);
ok('calcula os litros', (await txt()).includes('13,79'));
await p.fill('#litros', '8.62'); await p.waitForTimeout(300);
await p.click('[data-fazer="guardar-abast"]'); await p.waitForTimeout(700);
ok('volta ao volante com o abastecimento', (await txt()).includes('2.000 CVE'));
await p.screenshot({ path: 'v-abastecer.png' });

await p.click('[data-fazer="ir-km-fim"]'); await p.waitForTimeout(500);
ok('7 · terminar', (await txt()).includes('Terminar o turno'));
const kmFim = await p.inputValue('#kmF');
ok('sugere os km do GPS', parseInt(kmFim) > 120000, kmFim);
await p.click('[data-fazer="fechar-turno"]'); await p.waitForTimeout(900);
const fim = await txt();
ok('mostra as contas do turno', fim.includes('O que escreveu bate com o talão'));
ok('apanhou o talão inflacionado', fim.includes('Por explicar neste turno'));
await p.screenshot({ path: 'v-fim.png' });

await p.reload(); await p.waitForTimeout(900);
ok('sobrevive a recarregar', (await txt()).length > 40);
console.log('\nerros JS:', erros.length ? erros : 'nenhum');
await b.close();
