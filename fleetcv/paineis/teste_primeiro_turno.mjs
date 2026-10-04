/* O CARRO SEM KM — preenchido pelo primeiro turno
   O patrão que vive fora (ou que junta um carro novo à frota) não sabe
   quantos km o carro tem. Escolhe "preencher automaticamente no primeiro
   turno": o primeiro condutor fotografa o quadrante e escreve os km e o
   combustível, e o carro fica com eles — quem, quando, e a fotografia.

   E o erro que se encontrou pelo caminho: os km do carro nunca seguiam
   os turnos (o condutor não pode escrever na frota), e cada turno novo
   começava nos km do dia em que o carro foi criado. Agora é a base que
   os acerta, no fecho de cada turno. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/,'');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_primeiro.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_primeiro.html';
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){}
    await new Promise(r=>setTimeout(r,200)); } return false; };
const ctx=await b.newContext({viewport:{width:390,height:844},
  permissions:['geolocation','camera'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const MAT='ST-NV-01';
/* o carro, tal como está na base (e não só no ecrã de quem o vê) */
const naBase=pg=>pg.evaluate(m=>{
  const fc=JSON.parse(localStorage.getItem('sb:d|f1|frota|carros')||'{"lista":[]}');
  return fc.lista.filter(c=>c.matricula===m)[0]||null; }, MAT);

/* ── o patrão junta o carro sem saber os km ──────────────── */
const p=await ctx.newPage();
p.on('pageerror',e=>err.push('patrão: '+e.message));
const ptxt=()=>p.textContent('#ecra');
await p.goto(U+'#dono'); await p.waitForTimeout(1500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]');
await esperar(async()=>/A frota agora/.test(await ptxt()));
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(500);
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(500);
ok('a viatura nova tem a escolha "Preencher automaticamente no primeiro turno"',
   /Preencher automaticamente no primeiro turno/.test(await ptxt()));
ok('com a explicação por baixo',
   /fotografa o quadrante e escreve os km e o combustível/.test(await ptxt()));
await p.fill('#e-mat', MAT); await p.fill('#e-marca','Toyota'); await p.fill('#e-modelo','Corolla');
await p.click('[data-modo="auto"]'); await p.waitForTimeout(400);
ok('ao escolhê-la, o campo dos km desaparece', !(await p.isVisible('#e-km')));
ok('e o da mudança de óleo também (conta-se a partir dos km)', !(await p.isVisible('#e-oleo')));
ok('o que já estava escrito fica', (await p.inputValue('#e-mat'))===MAT);
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(800);
ok('a ficha do carro diz que está à espera do primeiro turno',
   /À espera do primeiro turno/.test(await ptxt()));
const c0=await naBase(p);
ok('e fica assim na base', c0 && c0.kmPorPreencher===true, JSON.stringify(c0));
await p.click('#voltar'); await p.waitForTimeout(500);
ok('na lista, "km no 1.º turno" em vez de 0 km',
   (await ptxt()).includes(MAT) && /km no 1\.º turno/.test(await ptxt()));

/* ── o condutor, no primeiro turno com este carro ─────────── */
const c=await ctx.newPage();
c.on('pageerror',e=>err.push('condutor: '+e.message));
const ctxt=()=>c.textContent('#ecra');
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','antonio@exemplo.cv'); await c.fill('#i-cod','1234');
await c.click('[data-f="entrar"]'); await c.waitForTimeout(1500);
ok('o condutor vê o carro novo, marcado "km por preencher"',
   await esperar(async()=>/km por\s*preencher/.test(await ctxt())));
await c.locator('[data-carro]', {hasText:MAT}).click(); await c.waitForTimeout(500);
ok('abre o ecrã do primeiro turno', /Primeiro turno deste carro/.test(await ctxt()));
ok('sem km inventados no campo', (await c.inputValue('#i-km'))==='');
ok('e sem km não se passa à frente', await c.isDisabled('[data-f="ir-gps"]'));
await c.click('.foto');
await esperar(()=>c.evaluate(()=>{ const v=document.getElementById('cam-v'); return v&&v.videoWidth>0; }));
ok('a câmara pede o quadrante com os km e o ponteiro',
   /km e o ponteiro do combustível/.test(await c.textContent('#cam-guia')));
await c.click('#cam-tirar'); await c.waitForTimeout(800);
ok('a fotografia fica', await c.isVisible('.foto.feita img'));
await c.fill('#i-km','120384'); await c.waitForTimeout(700);
await c.click('[data-nivel="0.5"]'); await c.waitForTimeout(400);
ok('escolhe o combustível no ponteiro (½)',
   await c.evaluate(()=>document.querySelector('[data-nivel="0.5"]').classList.contains('on')));
ok('com os km escritos, já se passa', !(await c.isDisabled('[data-f="ir-gps"]')));
await c.click('[data-f="ir-gps"]'); await c.waitForTimeout(800);
await c.click('[data-f="comecar-sim"]'); await c.waitForTimeout(2000);
ok('abre o turno', await c.isVisible('.volante'));

/* ── o carro preencheu-se sozinho ─────────────────────────── */
const c1=await naBase(c);
ok('a base preencheu o carro com os km e o combustível do primeiro turno',
   c1 && c1.km===120384 && c1.combustivel===0.5 && !c1.kmPorPreencher, JSON.stringify(c1));
ok('com quem e quando', c1 && c1.kmPreenchido && c1.kmPreenchido.condutor==='António Semedo'
   && c1.kmPreenchido.km===120384);
ok('e a mudança de óleo passa a contar dali', c1 && c1.proxOleoKm===125384, c1&&c1.proxOleoKm);

await p.bringToFront();
await p.locator('[data-carro]', {hasText:MAT}).click(); await p.waitForTimeout(800);
ok('o patrão vê os km na ficha do carro',
   await esperar(async()=>/120\.384/.test(await ptxt())));
ok('e de onde vieram: o condutor, os km e o combustível',
   /Preenchido no primeiro turno/.test(await ptxt()) && /António Semedo/.test(await ptxt())
   && /meio depósito \(~23 l\)/.test(await ptxt()), ((await ptxt()).match(/Preenchido[^.]*\./)||[''])[0]);
await p.click('text=Ver a fotografia do quadrante'); await p.waitForTimeout(1500);
ok('"Ver a fotografia do quadrante" leva ao turno, com a fotografia',
   await esperar(async()=>/Quadrante ao começar/.test(await ptxt()), 10000));

/* ── o fecho deixa o carro onde o turno acabou ────────────── */
await c.bringToFront();
await c.waitForTimeout(3000);
await c.click('[data-f="ir-fim"]'); await c.waitForTimeout(600);
const kmF=+(await c.inputValue('#i-kmf'));
await c.click('[data-f="terminar"]'); await c.waitForTimeout(1500);
ok('o turno fecha', /Turno terminado/.test(await ctxt()));
const c2=await naBase(c);
ok('e o carro fica nos km do fim (antes ficava para sempre nos da criação)',
   kmF>120384 && c2 && c2.km===kmF, kmF+' no fim · '+(c2&&c2.km)+' no carro');

/* ── o turno seguinte começa onde o outro acabou ──────────── */
await c.click('[data-f="novo-turno"]').catch(()=>{});
await c.waitForTimeout(600);
if(!(await c.isVisible('[data-carro]'))){ await c.goto(U+'#condutor'); await c.waitForTimeout(2000); }
await c.locator('[data-carro]', {hasText:MAT}).click(); await c.waitForTimeout(600);
ok('no turno seguinte, o ecrã é o de sempre (já não é o do primeiro turno)',
   /Quantos km marca/.test(await ctxt()));
ok('e propõe os km onde o outro acabou, sem alerta de km a mais',
   (await c.inputValue('#i-km'))===String(kmF) && !/a mais/.test(await ctxt()),
   await c.inputValue('#i-km'));

/* ── escrever os km à mão continua como era ───────────────── */
await p.bringToFront();
/* (o turno a decorrer abre no mapa, com os detalhes — pode já não haver "Voltar") */
if(await p.isVisible('#voltar')){ await p.click('#voltar'); await p.waitForTimeout(400); }
if(await p.isVisible('#voltar')){ await p.click('#voltar'); await p.waitForTimeout(400); }
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(400);
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(400);
ok('"Escrevo eu agora" vem escolhido por omissão, com o campo dos km',
   await p.isVisible('#e-km') && await p.evaluate(()=>document.querySelector('[data-modo="eu"]').classList.contains('on')));

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
