/* VARREDURA: percorre a aplicação toda à procura de buracos. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const pasta=fs.mkdtempSync(path.join(os.tmpdir(),'fcv-'));
const porta=9500+Math.floor(Math.random()*400);
const proc=spawn(process.execPath,['servidor/servidor.mjs'],{env:{...process.env,
  FLEETCV_PORTA:String(porta),NODE_NO_WARNINGS:'1',FLEETCV_DADOS:path.join(pasta,'d.db'),
  FLEETCV_APP:'servidor/fleetcv.html'},stdio:'ignore'});
const U='http://127.0.0.1:'+porta+'/';
for(let i=0;i<60;i++){ try{ if((await fetch(U+'api/ping')).ok) break; }catch(e){}
  await new Promise(r=>setTimeout(r,250)); }
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const achados=[]; const nota=(o,q)=>achados.push(o+' :: '+q);
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};

/* ── o condutor, passo a passo ──────────────────────────── */
const co=await (await b.newContext({viewport:{width:390,height:840},isMobile:true,
  hasTouch:true, permissions:['geolocation'], geolocation:gps})).newPage();
co.on('pageerror',e=>nota('condutor','ERRO JS: '+e.message));
await co.goto(U); await co.waitForTimeout(700);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(500);

/* entrar com campos vazios */
await co.click('[data-f="entrar"]'); await co.waitForTimeout(600);
if(!/Escreva/.test(await co.textContent('#ecra'))) nota('condutor','entrar vazio não avisa');
await co.fill('#i-email','antonio@exemplo.cv'); await co.fill('#i-cod','1234');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(1800);

/* km de início: o que impede disparates? */
await co.locator('[data-carro]').first().click(); await co.waitForTimeout(600);
const temKm = await co.isVisible('#i-km');
if(temKm){
  await co.fill('#i-km','1'); await co.waitForTimeout(500);
  const t=await co.textContent('#ecra');
  if(!/trás|menor|abaixo/i.test(t)) nota('condutor','km inicial muito abaixo do último não avisa');
  await co.fill('#i-km','999999'); await co.waitForTimeout(700);
  const t2=await co.textContent('#ecra');
  const travado = await co.locator('[data-f="ir-gps"]').isDisabled();
  if(!/engano|confira|absurdo/i.test(t2) || !travado)
    nota('condutor','km inicial absurdo (999999) passa sem travão'+
      (travado?'':' [botão não bloqueado]'));
  await co.fill('#i-km','120050');
}
await co.waitForTimeout(400);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1400);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(3500);

/* abastecer: o que impede disparates? */
await co.click('[data-f="ir-abast"]'); await co.waitForTimeout(700);
const bloq = await co.locator('[data-f="guardar-abast"]').isDisabled();
if(!bloq){ await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(600);
  if(await co.isVisible('.volante')) nota('abastecer','guardou com valor 0 / vazio'); }
await co.fill('#i-valor','999999'); await co.waitForTimeout(600);
if(!/cabe|depósito|muito/i.test(await co.textContent('#ecra')))
  nota('abastecer','999.999 CVE (mais de 6000 litros) não avisa nada');
await co.fill('#i-valor','2000'); await co.waitForTimeout(500);
await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(900);
if(!await co.isVisible('.volante')) nota('abastecer','não voltou ao volante');

/* fechar: km finais */
await co.click('[data-f="ir-fim"]'); await co.waitForTimeout(700);
const temKf = await co.isVisible('#i-kmf');
if(temKf){
  await co.fill('#i-kmf','1'); await co.waitForTimeout(500);
  const bl2 = await co.locator('[data-f="terminar"]').isDisabled();
  if(!bl2){ await co.click('[data-f="terminar"]'); await co.waitForTimeout(700);
    if(/Turno terminado/.test(await co.textContent('#ecra')))
      nota('fechar','aceitou km final menor que o inicial'); }
  const t=await co.textContent('#ecra');
  if(!/trás|menor|abaixo|não pode/i.test(t))
    nota('fechar','km final impossível não explica porquê');
}
await co.fill('#i-kmf','120220'); await co.waitForTimeout(400);
await co.click('[data-f="terminar"]'); await co.waitForTimeout(1500);
if(!/Turno terminado/.test(await co.textContent('#ecra')))
  nota('fechar','não fechou o turno');

/* ── o patrão ───────────────────────────────────────────── */
const p=await (await b.newContext({viewport:{width:430,height:950}})).newPage();
p.on('pageerror',e=>nota('patrão','ERRO JS: '+e.message));
await p.goto(U); await p.waitForTimeout(700);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(400);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(3000);

/* dá para mudar o preço do litro? é o número que manda em tudo */
const ecras=['mapa','viaturas','condutores','alertas','contas','definicoes'];
let achouPreco=false;
for(const e of ecras){
  await p.click('[data-tab="'+e+'"]'); await p.waitForTimeout(800);
  const t=await p.textContent('#ecra');
  if(/preço|litro/i.test(t) && /\[data-f/.test(await p.innerHTML('#ecra'))) achouPreco=true;
}
const temDefinicoes = await p.evaluate(()=>
  !!document.querySelector('[data-tab="definicoes"],[data-f="definicoes"]'));
if(!temDefinicoes) nota('patrão','não há ecrã de definições: preço do litro, nome da frota');

/* dá para o patrão sair da sessão? */
await p.click('[data-tab="definicoes"]').catch(()=>{}); await p.waitForTimeout(700);
const dt=await p.textContent('#ecra').catch(()=>'');
if(!/Preço do litro/i.test(dt)) nota('patrão','não dá para mudar o preço do litro');
if(!await p.isVisible('[data-f="sair"]')) nota('patrão','não há forma de sair da sessão');
if(!await p.isVisible('[data-f="copia"]')) nota('patrão','não dá para guardar uma cópia');

/* um turno esquecido há horas: o patrão tem de o poder fechar */
await p.evaluate(async()=>{
  const t={ id:'esquecido', condutorId:'m2', carroId:'c2', matricula:'CV-02-CD',
    condutor:'Jorge Tavares', inicio:Date.now()-9*3600e3, kmInicio:208400,
    precoLitro:145, deposito:46, abast:[], totalCve:0, rasto:[],
    momento:Date.now()-8*3600e3, kmGps:40 };
  await fetch('/api/doc',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({c:'vivo', id:'esquecido', d:t})});
  await fetch('/api/doc',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({c:'turnos', id:'esquecido', d:t})}); });
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(2500);
await p.locator('[data-vivo]').first().click().catch(()=>{}); await p.waitForTimeout(900);
if(!await p.isVisible('[data-f="fechar-turno"]'))
  nota('patrão','não pode fechar um turno que o condutor deixou aberto há 8 horas');

/* os alertas: dá para exportar / enviar? */
await p.click('[data-tab="contas"]'); await p.waitForTimeout(800);
if(!/Copiar|enviar|exportar/i.test(await p.textContent('#ecra')))
  nota('contas','não dá para tirar as contas de dentro da aplicação');

console.log('\n══ O QUE FALTA ══');
if(!achados.length) console.log('  nada encontrado');
achados.forEach(a=>console.log('  · '+a));
await b.close(); proc.kill(); fs.rmSync(pasta,{recursive:true,force:true});
