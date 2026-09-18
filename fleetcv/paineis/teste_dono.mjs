import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport:{width:390,height:860}, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
const err=[]; p.on('pageerror',e=>err.push(e.message));
p.on('console',m=>{ if(m.type()==='error'&&!/CERT|font/i.test(m.text())) err.push(m.text()); });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const txt=()=>p.textContent('#ecra');

await p.goto('file://'+process.cwd()+'/painel_dono.html'); await p.waitForTimeout(700);
ok('abre no login do patrão', (await txt()).includes('Painel do proprietário'));
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','1111');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(300);
ok('código errado recusado', (await txt()).includes('errados'));
await p.fill('#i-cod','9999'); await p.click('[data-f="entrar"]'); await p.waitForTimeout(700);

// ── MAPA ──
const mp = await txt();
ok('MAPA · abre com a frota', mp.includes('A frota agora'));
/* Sem condutores a conduzir não há nada ao vivo — e tem de dizê-lo
   em vez de mostrar um mapa vazio sem explicação. O tempo real
   verifica-se em teste_tempo_real.mjs, com os dois painéis abertos. */
ok('diz que ninguém está em turno', mp.includes('Nenhum carro em turno'));
ok('mapa desenhado', await p.isVisible('.mapa'));
ok('CVE por explicar', mp.includes('por explicar'));
await p.screenshot({path:'d1-mapa.png'});

// um turno do histórico
await p.locator('[data-turno]').first().click(); await p.waitForTimeout(900);
ok('turno do histórico abre', /km andados/i.test(await txt()));
ok('foi buscar o percurso', await p.isVisible('.mapa'));
await p.click('#voltar'); await p.waitForTimeout(400);
ok('o botão voltar funciona', (await txt()).includes('A frota agora'));

// ── VIATURAS ──
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(400);
ok('VIATURAS · lista', (await p.locator('[data-carro]').count())>=3);
await p.locator('[data-carro]').first().click(); await p.waitForTimeout(500);
const fc = await txt();
ok('ficha da viatura', fc.includes('litros por 100 km'));
ok('manutenção do óleo', fc.includes('Próxima mudança de óleo'));
ok('quem conduz este carro', fc.includes('Quem conduz'));
ok('turnos do carro', (await p.locator('[data-turno]').count())>0);
await p.screenshot({path:'d2-carro.png'});

// editar viatura
await p.click('[data-f="editar-carro"]'); await p.waitForTimeout(400);
await p.fill('#e-marca','Toyota'); await p.fill('#e-modelo','Corolla GLi');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(600);
ok('editar viatura guarda', (await txt()).includes('Corolla GLi'));

// ── CONDUTORES ──
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(400);
ok('CONDUTORES · lista', (await p.locator('[data-cond]').count())>=3);
await p.locator('[data-cond]').first().click(); await p.waitForTimeout(500);
const fd = await txt();
ok('ficha do condutor', fd.includes('Cuidado a registar'));
ok('mostra o código de acesso', /c[óo]digo/i.test(fd));
ok('carros que leva', fd.includes('Carros que leva'));
await p.screenshot({path:'d3-condutor.png'});

// do condutor para o carro (ligação cruzada)
await p.locator('[data-carro-lig]').first().click(); await p.waitForTimeout(500);
ok('do condutor salta para a viatura', (await txt()).includes('litros por 100 km'));

// ── novo condutor ──
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(400);
const antes = await p.locator('[data-cond]').count();
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(400);
await p.fill('#e-nome','Maria Lopes'); await p.fill('#e-email2','maria@exemplo.cv');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(600);
ok('acrescentar condutor', (await txt()).includes('Maria Lopes'));
await p.click('[data-f="parar-cond"]'); await p.waitForTimeout(400);
ok('desactivar condutor', (await txt()).includes('Reactivar'));
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(400);
ok('fica na lista como inactivo', (await txt()).includes('inactivo'));

// ── ALERTAS ──
await p.click('[data-tab="alertas"]'); await p.waitForTimeout(500);
const al = await txt();
ok('ALERTAS · lista', al.includes('Para ver'));
ok('apanhou o talão', /talão dá/.test(al));
ok('apanhou o carro à noite', /sem turno aberto/.test(al));
ok('mostra o dinheiro', /CVE/.test(al));
await p.locator('[data-res="ERRO"]').first().click(); await p.waitForTimeout(500);
ok('resolver alerta', (await txt()).includes('não fazia sentido'));
await p.screenshot({path:'d4-alertas.png'});

// alerta → turno
await p.locator('[data-turno]').first().click(); await p.waitForTimeout(600);
const tu = await txt();
ok('TURNO · abre do alerta', tu.includes('As contas'));
ok('mapa do percurso', await p.isVisible('.mapa'));
/* o percurso vem da nuvem: o botão só aparece quando ele chegar */
await p.locator('[data-f="replay"]').waitFor({timeout:15000}).catch(()=>{});
ok('botão de ver o carro andar', await p.isVisible('[data-f="replay"]'));
await p.click('[data-f="replay"]'); await p.waitForTimeout(1600);
ok('o percurso anima', (await txt()).includes('Parar'));
await p.screenshot({path:'d5-turno.png'});

// turno → condutor (ligação cruzada)
await p.locator('[data-cond-nome]').first().click(); await p.waitForTimeout(500);
ok('do turno salta para o condutor', (await txt()).includes('Cuidado a registar'));

// ── CONTAS ──
await p.click('[data-tab="contas"]'); await p.waitForTimeout(500);
const co = await txt();
ok('CONTAS · por mês', co.includes('Por explicar')||co.includes('por explicar'));
ok('por viatura', co.includes('Por viatura'));
ok('por condutor', co.includes('Por condutor'));
await p.locator('td').first().click({trial:true}).catch(()=>{});
await p.screenshot({path:'d6-contas.png'});

await p.reload(); await p.waitForTimeout(800);
ok('sobrevive a recarregar', (await txt()).includes('A frota agora'));

/* ─── os cruzamentos de dados novos ────────────────────────── */
await p.click('[data-tab="alertas"]'); await p.waitForTimeout(600);
const al2 = await p.textContent('#ecra');
ok('apanha talão de posto onde o carro nunca esteve',
   /nunca lá esteve/.test(al2), (al2.match(/ficou a [\d.]+ m/)||[])[0]);
ok('apanha gasto por 100 km fora do normal',
   /litros aos 100 km/.test(al2), (al2.match(/Gastou [\d,]+ litros/)||[])[0]);

/* o mapa tem de ser mesmo o da Praia, não uma grelha inventada */
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(700);
const svg = await p.locator('.mapa').first().innerHTML();
ok('o mapa é o verdadeiro da Praia', svg.includes('var(--rua)') && svg.length>8000,
   Math.round(svg.length/1024)+' kB de ruas e costa');
ok('mostra os bairros pelo nome', /Plat|Palmarejo|Achada|Fazenda|Safende|Calabaceira/.test(svg));
ok('mostra os postos de combustível', svg.includes('var(--warn-wash)'));
const postos = await p.evaluate(()=>MAPA_PRAIA.postos.length);
ok('os postos são os verdadeiros do OpenStreetMap', postos>=10, postos+' postos');
ok('há escala no mapa', /km<\/text>|m<\/text>/.test(svg));

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
