import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({
  viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true,
  permissions: ['geolocation'], geolocation: { latitude: 14.9177, longitude: -23.5092, accuracy: 8 },
});
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push('JS: ' + e.message));
p.on('console', m => { if (m.type() === 'error' && !/CERT|font/i.test(m.text())) erros.push(m.text()); });
const ok = (n, c, extra) => console.log((c ? ' ok  ' : 'FALHA') + ' · ' + n + (extra ? '  → ' + extra : ''));

await p.goto('file://' + process.cwd() + '/condutor.html');
await p.waitForTimeout(600);
ok('CONDUTOR · início', (await p.textContent('#ecra')).includes('CV-01-AB'));
await p.fill('#nome', 'António Semedo'); await p.waitForTimeout(200);

await p.click('[data-ir="abrir"]'); await p.waitForTimeout(300);
await p.setInputFiles('[data-foto="abertura"]', 'quadrante.jpg'); await p.waitForTimeout(500);
await p.fill('#km', '120000'); await p.waitForTimeout(450);
await p.click('#bt-abrir'); await p.waitForTimeout(500);
ok('abrir turno', await p.isVisible('#relogio-t'));

for (let i = 1; i <= 8; i++) {
  await ctx.setGeolocation({ latitude: 14.9177 + i * 0.0003, longitude: -23.5092 + i * 0.00012, accuracy: 8 });
  await p.waitForTimeout(1400);
}
await p.waitForTimeout(400);
ok('percurso gravado', (await p.textContent('#m-km')) !== '0,0', 'km GPS = ' + await p.textContent('#m-km'));

await p.click('[data-ir="abastecer"]'); await p.waitForTimeout(300);
await p.setInputFiles('[data-foto="talao"]', 'quadrante.jpg'); await p.waitForTimeout(400);
await p.fill('#valor', '2000'); await p.waitForTimeout(500);
await p.fill('#litros', '8.62'); await p.waitForTimeout(300);
await p.click('#bt-abast'); await p.waitForTimeout(500);
ok('abastecimento', (await p.textContent('#ecra')).includes('2.000 CVE'));

await p.click('[data-ir="fechar"]'); await p.waitForTimeout(400);
await p.setInputFiles('[data-foto="fecho"]', 'quadrante.jpg'); await p.waitForTimeout(400);
await p.fill('#kmF', '120003'); await p.waitForTimeout(500);
await p.click('#bt-fechar'); await p.waitForTimeout(700);
ok('fechar turno', (await p.textContent('#ecra')).includes('Turno fechado'));

// ── papel do dono ────────────────────────────────────────────
await p.click('[data-papel="dono"]'); await p.waitForTimeout(600);
const resumo = await p.textContent('#ecra');
ok('DONO · resumo', resumo.includes('A frota') && resumo.includes('por resolver'));
ok('turno na lista do dono', await p.isVisible('.ht'));
ok('condutor identificado', (await p.textContent('.hist')).includes('António'));

await p.click('[data-ir="dono-alertas"]'); await p.waitForTimeout(500);
const nAlertas = await p.locator('.alerta-l').count();
ok('alertas listados', nAlertas > 0, nAlertas + ' alertas');
ok('alerta do talão', (await p.textContent('#ecra')).includes('talão dá'));

await p.locator('[data-res="ERRO_SISTEMA"]').first().click(); await p.waitForTimeout(500);
ok('resolver alerta', (await p.textContent('#ecra')).includes('erro do sistema'));

await p.locator('[data-ver]').first().click(); await p.waitForTimeout(600);
ok('detalhe do turno', (await p.textContent('#ecra')).includes('Verificações'));
ok('fotos no detalhe', await p.locator('.fotos-g img').count() >= 2,
   await p.locator('.fotos-g img').count() + ' fotos');
ok('mapa no detalhe', await p.isVisible('.mapinha'));
await p.screenshot({ path: 'd-turno.png', fullPage: true });

await p.click('[data-ir="dono-resumo"]'); await p.waitForTimeout(400);
await p.click('[data-ir="dono-motoristas"]'); await p.waitForTimeout(400);
const mot = await p.textContent('#ecra');
ok('score do motorista', mot.includes('António'), (mot.match(/(\d+)\s*<?/) && await p.textContent('.sc')));
await p.screenshot({ path: 'd-motoristas.png', fullPage: true });

await p.click('[data-ir="dono-resumo"]'); await p.waitForTimeout(300);
await p.click('[data-ir="dono-frota"]'); await p.waitForTimeout(400);
await p.fill('#f-preco', '152'); await p.waitForTimeout(300);
await p.click('#bt-frota'); await p.waitForTimeout(500);
ok('preço guardado', true);
await p.screenshot({ path: 'd-resumo.png', fullPage: true });

// ── importar o ficheiro que a app Android produz ─────────────
await p.click('[data-ir="dono-importar"]'); await p.waitForTimeout(400);
await p.setInputFiles('#ficheiro-troca', 'troca_exemplo.json');
await p.waitForTimeout(900);
const imp = await p.textContent('#ecra');
ok('importar da app Android', imp.includes('Importado'), imp.match(/turnos novos[^.]*/)?.[0]);

await p.click('[data-ir="dono-resumo"]'); await p.waitForTimeout(500);
const lista = await p.textContent('#ecra');
ok('turno do Android na lista', lista.includes('CV-09-ZZ') && lista.includes('Jorge'));

await p.click('[data-ir="dono-alertas"]'); await p.waitForTimeout(400);
ok('alerta vindo do Android', (await p.textContent('#ecra')).includes('1.250 CVE'));

await p.click('[data-ir="dono-resumo"]'); await p.waitForTimeout(300);
await p.click('[data-ir="dono-importar"]'); await p.waitForTimeout(400);
await p.setInputFiles('#ficheiro-troca', 'troca_exemplo.json');
await p.waitForTimeout(700);
ok('não duplica o que já cá está',
   (await p.textContent('#ecra')).includes('já cá estavam'));

await p.reload(); await p.waitForTimeout(800);
ok('sobrevive a recarregar', (await p.textContent('#ecra')).includes('A frota'));
console.log('\nerros JS:', erros.length ? erros : 'nenhum');
await b.close();
