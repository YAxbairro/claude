/* PREENCHER FORMULÁRIOS COMO UMA PESSOA
   Devagar, a pensar entre campos, com um condutor a andar na rua a
   mandar novidades de 4 em 4 segundos. Era assim que se perdia tudo:
   cada novidade repintava o ecrã por cima de quem estava a escrever. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const pasta=fs.mkdtempSync(path.join(os.tmpdir(),'fcv-'));
const porta=9000+Math.floor(Math.random()*400);
const proc=spawn(process.execPath,['servidor/servidor.mjs'],{env:{...process.env,
  FLEETCV_PORTA:String(porta),NODE_NO_WARNINGS:'1',FLEETCV_DADOS:path.join(pasta,'d.db'),
  FLEETCV_APP:'servidor/fleetcv.html'},stdio:'ignore'});
const U='http://127.0.0.1:'+porta+'/';
for(let i=0;i<60;i++){ try{ if((await fetch(U+'api/ping')).ok) break; }catch(e){}
  await new Promise(r=>setTimeout(r,250)); }

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const gps={latitude:14.9177,longitude:-23.5092,accuracy:8};

/* um condutor na rua, a mandar novidades o tempo todo */
const co=await (await b.newContext({viewport:{width:390,height:840},isMobile:true,
  hasTouch:true, permissions:['geolocation'], geolocation:gps})).newPage();
await co.goto(U); await co.waitForTimeout(700);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(400);
await co.fill('#i-email','antonio@exemplo.cv'); await co.fill('#i-cod','1234');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(1600);
await co.locator('[data-carro]').first().click(); await co.waitForTimeout(400);
await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1200);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(2000);

const p=await (await b.newContext({viewport:{width:430,height:950}})).newPage();
p.on('pageerror',e=>err.push(e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U); await p.waitForTimeout(700);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(400);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(3000);
ok('há um condutor a andar a mandar novidades',
   (await txt()).includes('em turno neste momento'));

/* ── viatura nova, preenchida devagar ───────────────────── */
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(600);
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(600);
await p.type('#e-mat','ST-28-ED',{delay:200});
await p.waitForTimeout(2500);                        // pensar
ok('a matrícula não se apaga enquanto se escreve',
   (await p.inputValue('#e-mat'))==='ST-28-ED', await p.inputValue('#e-mat'));
await p.click('#e-marca'); await p.type('#e-marca','Kia',{delay:150});
await p.waitForTimeout(3000);
ok('nem quando se muda de campo',
   (await p.inputValue('#e-mat'))==='ST-28-ED' && (await p.inputValue('#e-marca'))==='Kia',
   (await p.inputValue('#e-mat'))+' / '+(await p.inputValue('#e-marca')));
await p.click('#e-modelo'); await p.type('#e-modelo','Picanto',{delay:120});
await p.fill('#e-km','15000'); await p.waitForTimeout(3000);
ok('nem passados mais três segundos',
   (await p.inputValue('#e-modelo'))==='Picanto' && (await p.inputValue('#e-km'))==='15000');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(1500);
ok('GUARDA a viatura', /ST-28-ED/.test(await txt()), (await txt()).slice(0,20).trim());
await p.reload(); await p.waitForTimeout(3000);
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(900);
ok('e continua lá depois de recarregar', /ST-28-ED/.test(await txt()));

/* ── a matrícula é obrigatória e verificada ─────────────── */
const tentar = async (mat, espera) => {
  await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(600);
  if(mat) await p.fill('#e-mat',mat);
  await p.fill('#e-km','1000'); await p.fill('#e-dep','45');
  await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(700);
  const t=await txt();
  const ficou = await p.isVisible('#e-mat');
  await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(500);
  return {ficou, t};
};
let r = await tentar('');
ok('sem matrícula NÃO guarda', r.ficou && /Escreva a matrícula/.test(r.t));
r = await tentar('AB');
ok('matrícula curta de mais não passa', r.ficou && /curta/.test(r.t));
r = await tentar('STEDXX');
ok('matrícula sem número não passa', r.ficou && /número/.test(r.t));
r = await tentar('ST-28-ED');
ok('matrícula repetida não passa', r.ficou && /Já existe/.test(r.t));

/* formas verdadeiras de Cabo Verde, todas aceites */
for(const [mat, fica] of [['SV-14-AB','SV-14-AB'],['28-ED-ST','28-ED-ST'],
                          ['CVS1234','CVS-1234'],['sa 09 tk','SA-09-TK']]){
  await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(500);
  await p.fill('#e-mat',mat); await p.fill('#e-km','1000'); await p.fill('#e-dep','45');
  await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(900);
  ok('aceita '+mat, (await txt()).includes(fica), fica);
  await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(400);
}

/* ── condutor novo, também devagar ──────────────────────── */
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(600);
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(600);
await p.type('#e-nome','Maria Lopes',{delay:120});
await p.waitForTimeout(3000);
await p.click('#e-email2'); await p.type('#e-email2','maria@exemplo.cv',{delay:100});
await p.waitForTimeout(3000);
ok('o condutor também não se apaga a meio',
   (await p.inputValue('#e-nome'))==='Maria Lopes');
await p.fill('#e-codigo','12'); await p.click('[data-f="guardar-cond"]');
await p.waitForTimeout(700);
ok('código curto não passa', /4 a 6 algarismos/.test(await txt()));
await p.fill('#e-codigo','7788'); await p.click('[data-f="guardar-cond"]');
await p.waitForTimeout(1200);
ok('GUARDA o condutor', /Maria Lopes/.test(await txt()));
await p.reload(); await p.waitForTimeout(3000);
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(900);
ok('e continua lá depois de recarregar', /Maria Lopes/.test(await txt()));

/* e o condutor novo consegue mesmo entrar */
const co2=await (await b.newContext({viewport:{width:390,height:840},isMobile:true,
  hasTouch:true, permissions:['geolocation'], geolocation:gps})).newPage();
await co2.goto(U); await co2.waitForTimeout(700);
await co2.click('[data-quem="condutor"]'); await co2.waitForTimeout(400);
await co2.fill('#i-email','maria@exemplo.cv'); await co2.fill('#i-cod','7788');
await co2.click('[data-f="entrar"]'); await co2.waitForTimeout(1800);
ok('e entra com o código que o patrão lhe deu',
   (await co2.textContent('#ecra')).includes('Que carro vai levar'));

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close(); proc.kill(); fs.rmSync(pasta,{recursive:true,force:true});
