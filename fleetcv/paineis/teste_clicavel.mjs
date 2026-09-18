/* TUDO CLICÁVEL
   Percorre o painel do patrão a tocar em cada coisa que devia levar a
   algum lado, e confirma que leva. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const pasta=fs.mkdtempSync(path.join(os.tmpdir(),'fcv-'));
const porta=8700+Math.floor(Math.random()*280);
const proc=spawn(process.execPath,['servidor/servidor.mjs'],{env:{...process.env,
  FLEETCV_PORTA:String(porta), NODE_NO_WARNINGS:'1',
  FLEETCV_DADOS:path.join(pasta,'d.db'), FLEETCV_APP:'servidor/fleetcv.html'},stdio:'ignore'});
const U='http://127.0.0.1:'+porta+'/';
for(let i=0;i<60;i++){ try{ if((await fetch(U+'api/ping')).ok) break; }catch(e){}
  await new Promise(r=>setTimeout(r,250)); }

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];

/* um condutor a andar, para haver um carro no mapa */
const movel={viewport:{width:390,height:840},isMobile:true,hasTouch:true,
  permissions:['geolocation'],geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}};
const co=await (await b.newContext(movel)).newPage();
co.on('pageerror',e=>err.push('condutor: '+e.message));
await co.goto(U); await co.waitForTimeout(700);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(400);
await co.fill('#i-email','antonio@exemplo.cv'); await co.fill('#i-cod','1234');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(1800);
await co.locator('[data-carro]').first().click(); await co.waitForTimeout(400);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1200);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(5000);
await co.click('[data-f="ir-abast"]'); await co.waitForTimeout(600);
await co.fill('#i-valor','2000'); await co.waitForTimeout(400);
await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(800);

const p=await (await b.newContext({viewport:{width:430,height:950}})).newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U); await p.waitForTimeout(700);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(400);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(4000);

/* ── o carro no mapa ─────────────────────────────────────── */
ok('o carro no mapa é um botão', (await p.locator('.carro-mapa').count())>0);
await p.locator('.carro-mapa').first().click({force:true}); await p.waitForTimeout(900);
const c = await p.textContent('.carro-cx').catch(()=>'');
ok('tocar no carro abre o cartão do turno', !!c);
ok('diz o condutor', /António Semedo/.test(c));
ok('diz a matrícula e o modelo', /CV-01-AB/.test(c) && /Corolla/.test(c));
ok('diz há quanto tempo anda', /em turno/.test(c), (c.match(/\d\d:\d\d:\d\d/)||[])[0]);
ok('diz os km', /km andados/.test(c), (c.match(/([\d,]+)km andados/)||[])[1]+' km');
ok('diz se já abasteceu', /Abasteceu 2\.000 CVE/.test(c));
ok('diz onde vai e a que velocidade', /km\/h/.test(c),
   c.split('·')[0].split('×').pop().trim());
ok('diz a bateria e o GPS', /bateria/.test(c) && /GPS/.test(c));
await p.screenshot({path:'k1-cartao.png', animations:'allow', timeout:9000}).catch(()=>{});

/* ── tudo dentro do cartão leva a algum lado ─────────────── */
await p.locator('.carro-cx [data-cond-nome]').click(); await p.waitForTimeout(700);
ok('o nome do condutor abre a ficha dele', (await txt()).includes('António Semedo'));
ok('e mostra o código de acesso dele', /código/.test(await txt()));
await p.click('#voltar'); await p.waitForTimeout(600);
await p.locator('.carro-cx [data-carro-lig]').click(); await p.waitForTimeout(700);
ok('a matrícula abre a ficha do carro', /litros por 100 km/.test(await txt()));
await p.click('#voltar'); await p.waitForTimeout(600);
await p.locator('.carro-cx .item.fino').first().click(); await p.waitForTimeout(900);
ok('o abastecimento abre o turno', (await txt()).includes('Em turno agora'));
await p.click('#voltar'); await p.waitForTimeout(600);
await p.click('[data-f="fechar-cartao"]'); await p.waitForTimeout(500);
ok('o cartão fecha', (await p.locator('.carro-cx').count())===0);

/* ── os números do resumo ────────────────────────────────── */
await p.locator('[data-tile="alertas"]').click(); await p.waitForTimeout(700);
ok('"CVE por explicar" abre os alertas', (await txt()).includes('Para ver'));
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(700);
await p.locator('[data-tile="turnos"]').first().click(); await p.waitForTimeout(700);
ok('"turnos" abre a lista completa', (await txt()).includes('Todos os turnos'));
const nT = (await p.locator('[data-turno]').count());
ok('com todos lá dentro', nT>5, nT+' turnos');
await p.locator('[data-f="so-problemas"]').click(); await p.waitForTimeout(600);
ok('e dá para ver só os que têm problemas',
   (await txt()).includes('a investigar'),
   (await p.locator('[data-turno]').count())+' turnos');
await p.click('[data-f="sem-filtro"]'); await p.waitForTimeout(500);
ok('e voltar a todos', (await txt()).includes('Todos os turnos'));

/* ── as contas ───────────────────────────────────────────── */
await p.click('[data-tab="contas"]'); await p.waitForTimeout(700);
await p.locator('[data-mes]').first().click(); await p.waitForTimeout(700);
ok('a linha do mês abre os turnos desse mês', /Turnos de \w+/.test(await txt()));

/* ── o abastecimento dentro de um turno ──────────────────── */
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(600);
await p.locator('[data-turno]').last().click(); await p.waitForTimeout(1600);
await p.locator('[data-abast]').first().click().catch(()=>{});
await p.waitForTimeout(700);
ok('o abastecimento leva o filme ao momento certo',
   await p.isVisible('.replay .barra'));
ok('e diz se o carro esteve mesmo no posto',
   /da bomba|nunca lá esteve/.test(await txt()));
await p.screenshot({path:'k2-turno.png', animations:'allow', timeout:9000}).catch(()=>{});

/* ── nada ficou sem sítio para onde ir ───────────────────── */
const orfaos = await p.evaluate(()=>{
  const sel='[data-f],[data-tab],[data-turno],[data-carro],[data-cond],[data-res],'+
    '[data-carro-lig],[data-cond-nome],[data-vivo],[data-tile],[data-mes],'+
    '[data-turnos-de],[data-turnos-cond],[data-abast],[data-posto-mapa],#voltar';
  return [...document.querySelectorAll('#ecra button')]
    .filter(x=>!x.closest(sel)).map(x=>x.textContent.trim().slice(0,30)); });
ok('nenhum botão sem destino', orfaos.length===0, orfaos.join(' | ')||'nenhum');

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close(); proc.kill(); fs.rmSync(pasta,{recursive:true,force:true});
