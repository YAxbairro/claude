import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({
  viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true,
  permissions: ['geolocation'], geolocation: { latitude: 14.9177, longitude: -23.5092, accuracy: 8 },
});
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push('JS: ' + e.message));
p.on('console', m => { if (m.type()==='error' && !/CERT|font/i.test(m.text())) erros.push(m.text()); });
const ok = (n, c, x) => console.log((c ? ' ok  ' : 'FALHA') + ' · ' + n + (x ? '  → ' + x : ''));
const txt = () => p.textContent('#ecra');

await p.goto('file://' + process.cwd() + '/condutor.html');
await p.waitForTimeout(600);
ok('abre na configuração', (await txt()).includes('Bem-vindo'));

await p.click('[data-fazer="demo-rapida"]'); await p.waitForTimeout(900);
const hoje = await txt();
ok('dados de exemplo entram', hoje.includes('CVE em combustível'));
ok('turnos na lista', (await p.locator('[data-turno]').count()) > 0,
   (await p.locator('[data-turno]').count()) + ' turnos');
ok('dinheiro por explicar', /CVE por explicar/.test(hoje));
await p.screenshot({ path: 's-hoje.png', fullPage: true });

await p.click('[data-tab="alertas"]'); await p.waitForTimeout(500);
const al = await txt();
const nAlertas = await p.locator('[data-res="JUSTIFICADO"]').count();
ok('alertas gerados', nAlertas > 0, nAlertas + ' por resolver');
ok('apanhou o talão inflacionado', /talão dá/.test(al));
ok('apanhou o carro à noite', /sem turno aberto/.test(al));
ok('apanhou o GPS desligado', /Sem sinal de GPS/.test(al));
await p.screenshot({ path: 's-alertas.png', fullPage: true });

await p.locator('[data-res="ERRO_SISTEMA"]').first().click(); await p.waitForTimeout(500);
ok('resolver um alerta', (await txt()).includes('não fazia sentido'));

await p.locator('[data-turno]').first().click(); await p.waitForTimeout(600);
const det = await txt();
ok('detalhe do turno', det.includes('conta-quilómetros'));
ok('mapa do percurso', await p.isVisible('.mapinha'));
ok('sete verificações', (await p.locator('.vf').count()) >= 6,
   (await p.locator('.vf').count()) + ' verificações');
await p.screenshot({ path: 's-turno.png', fullPage: true });

await p.click('[data-tab="equipa"]'); await p.waitForTimeout(500);
ok('equipa com pontuação', /\d{2}/.test(await txt()));

await p.click('[data-tab="mais"]'); await p.waitForTimeout(400);
await p.click('[data-fazer="ir-relatorio"]'); await p.waitForTimeout(500);
ok('contas do mês', (await txt()).includes('Por explicar'));
await p.screenshot({ path: 's-contas.png', fullPage: true });

// ── passar a condutor e gravar um turno inteiro ──────────────
await p.click('[data-tab="mais"]'); await p.waitForTimeout(400);
await p.click('[data-fazer="papel-condutor"]'); await p.waitForTimeout(500);
ok('passa a condutor', (await txt()).includes('Os meus turnos'));
await p.fill('#c-nome', 'Yanick'); await p.waitForTimeout(300);

await p.click('[data-fazer="ir-abrir"]'); await p.waitForTimeout(400);
await p.setInputFiles('[data-foto="abertura"]', 'quadrante.jpg'); await p.waitForTimeout(600);
await p.click('[data-fazer="abrir-turno"]'); await p.waitForTimeout(2500);
const emTurno = await txt();
ok('turno a decorrer', emTurno.includes('km andados'));
// ler o medidor pelo elemento, não por expressão sobre o texto todo:
// os dígitos do relógio colavam-se ao número e falseavam a leitura
const kmTexto = await p.locator('.medidores b').first().textContent();
const kmNum = parseFloat(kmTexto.replace(/\./g, '').replace(',', '.'));
ok('percurso gravado a velocidade plausível', kmNum > 3 && kmNum < 60, kmTexto + ' km');
await p.screenshot({ path: 's-emturno.png', fullPage: true });

await p.click('[data-fazer="ir-abastecer"]'); await p.waitForTimeout(400);
await p.setInputFiles('[data-foto="talao"]', 'quadrante.jpg'); await p.waitForTimeout(400);
await p.fill('#valor', '2000'); await p.waitForTimeout(600);
ok('calcula os litros', (await txt()).includes('13,79'));
await p.fill('#litros', '8.62'); await p.waitForTimeout(300);
await p.click('[data-fazer="guardar-abast"]'); await p.waitForTimeout(500);
ok('abastecimento registado', (await txt()).includes('2.000 CVE'));

await p.click('[data-fazer="ir-fechar"]'); await p.waitForTimeout(500);
await p.setInputFiles('[data-foto="fecho"]', 'quadrante.jpg'); await p.waitForTimeout(500);
await p.click('[data-fazer="fechar-turno"]'); await p.waitForTimeout(900);
const fim = await txt();
ok('fecha e mostra as contas', fim.includes('O que escreveu bate com o talão'));
ok('apanha o talão no turno real', fim.includes('Por explicar neste turno'));
await p.screenshot({ path: 's-fecho.png', fullPage: true });

await p.reload(); await p.waitForTimeout(900);
ok('sobrevive a recarregar', (await txt()).length > 50);
console.log('\nerros JS:', erros.length ? erros : 'nenhum');
await b.close();
