/* O SERVIDOR, DE PONTA A PONTA
   Dois navegadores separados — não dois separadores. Não partilham
   nada: nem gavetas, nem canais, nem nada. Só o servidor. É o mais
   perto que se consegue de dois telemóveis em sítios diferentes. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* O teste arranca o seu próprio servidor, com uma base de dados
   vazia. Sem isto, os turnos de uma corrida ficavam na frente da
   seguinte e o teste passava ou falhava conforme a hora do dia. */
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'fleetcv-'));
const porta = 8100 + Math.floor(Math.random()*400);
const proc = spawn(process.execPath, ['servidor/servidor.mjs'], {
  env: {...process.env, FLEETCV_PORTA:String(porta), NODE_NO_WARNINGS:'1',
        FLEETCV_DADOS: path.join(pasta,'dados.db'),
        FLEETCV_APP: 'servidor/fleetcv.html'},
  stdio: 'ignore' });
const URL = 'http://127.0.0.1:'+porta+'/';
for(let i=0; i<60; i++){
  try{ const r=await fetch(URL+'api/ping'); if(r.ok) break; }catch(e){}
  await new Promise(r=>setTimeout(r,250));
}
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
async function ate(f, seg=25){
  const fim=Date.now()+seg*1000;
  while(Date.now()<fim){ if(await f()) return true; await new Promise(r=>setTimeout(r,400)); }
  return false;
}
const aparelho = async (movel) => {
  const c = await b.newContext(movel
    ? { viewport:{width:390,height:840}, isMobile:true, hasTouch:true,
        permissions:['geolocation'],
        geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8} }
    : { viewport:{width:430,height:900} });
  const p = await c.newPage();
  p.on('pageerror',e=>err.push(e.message));
  return p;
};

/* ── o computador do patrão ─────────────────────────────── */
const patrao = await aparelho(false);
await patrao.goto(URL); await patrao.waitForTimeout(900);
ok('a aplicação vem do servidor', (await patrao.textContent('body')).includes('Sou condutor'));
await patrao.click('[data-quem="dono"]'); await patrao.waitForTimeout(500);
await patrao.fill('#i-email','patrao@exemplo.cv'); await patrao.fill('#i-cod','0000');
await patrao.click('[data-f="entrar"]'); await patrao.waitForTimeout(1200);
ok('o SERVIDOR recusa o código errado',
   (await patrao.textContent('#ecra')).includes('errados'));
await patrao.fill('#i-cod','9999');
await patrao.click('[data-f="entrar"]'); await patrao.waitForTimeout(2500);
ok('e deixa entrar com o certo',
   (await patrao.textContent('#ecra')).includes('A frota agora'));

/* ── o telemóvel do condutor: outro navegador ────────────── */
const condutor = await aparelho(true);
await condutor.goto(URL); await condutor.waitForTimeout(900);
await condutor.click('[data-quem="condutor"]'); await condutor.waitForTimeout(500);
await condutor.fill('#i-email','antonio@exemplo.cv'); await condutor.fill('#i-cod','1234');
await condutor.click('[data-f="entrar"]'); await condutor.waitForTimeout(1800);
ok('o condutor entra do telemóvel dele',
   (await condutor.textContent('#ecra')).includes('Que carro vai levar'));
ok('e recebe a frota do servidor',
   (await condutor.locator('[data-carro]').count())>=3);

/* ── ABRIR TURNO ─────────────────────────────────────────── */
await condutor.locator('[data-carro]').first().click(); await condutor.waitForTimeout(400);
await condutor.click('[data-f="ir-gps"]'); await condutor.waitForTimeout(1300);
await condutor.click('[data-f="comecar-sim"]'); await condutor.waitForTimeout(1500);
ok('o condutor está ao volante', await condutor.isVisible('.volante'));
ok('ABRIR TURNO atravessa o servidor',
   await ate(async()=>(await patrao.textContent('#ecra')).includes('em turno neste momento')),
   'entre dois navegadores diferentes');

const aoVivo = patrao.locator('[data-vivo]', { hasText:'desde as' }).first();
const kmDo=async()=>{ const t=await aoVivo.textContent().catch(()=>'');
  const m=(t||'').match(/([\d,.]+) km/); return m?parseFloat(m[1].replace(',','.')):0; };
await ate(async()=>(await kmDo())>0);
const km1=await kmDo();
ok('O CARRO A ANDAR atravessa o servidor',
   await ate(async()=>(await kmDo())>km1+0.05, 30), km1+' km → '+(await kmDo())+' km');

/* tocar no carro abre o cartão com tudo à vista; o turno
   completo, com o mapa, abre-se a partir dele */
await aoVivo.click(); await patrao.waitForTimeout(900);
await patrao.locator('.carro-cx .bt.sec').click(); await patrao.waitForTimeout(900);
ok('o patrão vê o percurso no mapa da Praia', await patrao.isVisible('.mapa'));

/* ── ABASTECER ───────────────────────────────────────────── */
await condutor.click('[data-f="ir-abast"]'); await condutor.waitForTimeout(600);
await condutor.fill('#i-valor','3000'); await condutor.waitForTimeout(400);
await condutor.click('[data-f="guardar-abast"]'); await condutor.waitForTimeout(800);
ok('ABASTECER atravessa o servidor',
   await ate(async()=>(await patrao.textContent('#ecra')).includes('3.000')), '3.000 CVE');

/* ── FECHAR ──────────────────────────────────────────────── */
await condutor.click('[data-f="ir-fim"]'); await condutor.waitForTimeout(500);
await condutor.click('[data-f="terminar"]'); await condutor.waitForTimeout(1500);
await patrao.click('#voltar').catch(()=>{}); await patrao.waitForTimeout(800);
ok('FECHAR TURNO tira o carro do mapa ao vivo',
   await ate(async()=>(await patrao.textContent('#ecra')).includes('Nenhum carro em turno')));
ok('e o turno entra no histórico do patrão',
   await ate(async()=>(await patrao.textContent('#ecra')).includes('3.000')));

/* ── O PATRÃO MUDA A FROTA ───────────────────────────────── */
await patrao.click('[data-tab="viaturas"]'); await patrao.waitForTimeout(600);
await patrao.click('[data-f="novo-carro"]'); await patrao.waitForTimeout(600);
await patrao.fill('#e-mat','CV-77-QQ'); await patrao.fill('#e-marca','Kia');
await patrao.fill('#e-modelo','Picanto'); await patrao.fill('#e-km','1000');
await patrao.click('[data-f="guardar-carro"]'); await patrao.waitForTimeout(1200);
await condutor.click('[data-f="ir-carro"]').catch(()=>{}); await condutor.waitForTimeout(800);
ok('CARRO NOVO atravessa o servidor até ao condutor',
   await ate(async()=>(await condutor.textContent('#ecra')).includes('CV-77-QQ')), 'CV-77-QQ');

/* ── A SESSÃO SOBREVIVE ──────────────────────────────────── */
await condutor.reload(); await condutor.waitForTimeout(2500);
ok('o condutor não tem de entrar outra vez',
   !(await condutor.textContent('#ecra')).includes('Entrar'));

/* ── O SERVIDOR NÃO ACREDITA NO TELEMÓVEL ────────────────── */
const tentou = await condutor.evaluate(async()=>{
  const r=await fetch('/api/doc', {method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({c:'frota', id:'carros', d:{lista:[]}})});
  return (await r.json()).erro || 'DEIXOU PASSAR'; });
ok('um condutor não consegue mexer na frota', tentou!=='DEIXOU PASSAR', tentou);

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
proc.kill();
fs.rmSync(pasta, {recursive:true, force:true});
