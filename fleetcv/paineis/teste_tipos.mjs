/* OS TRÊS TIPOS DE FROTA — táxis, instituições, rent-a-car
   O mesmo FleetCV com três caras. Primeiro as contas puras de cada tipo
   (mapa/tipos.js): o horário, a zona, a conta de um aluguer, os
   documentos a caducar. Depois o caminho de cada cliente novo:

   · uma instituição cria a conta pela página de venda, marca o horário,
     a zona e os departamentos; um carro com o seguro a caducar avisa; o
     motorista não começa sem escrever para onde vai e porquê; um
     serviço fora do horário e fora da zona dá alerta; o relatório sai
     para o Excel;
   · uma agência de rent-a-car entrega um carro com fotografias, km e
     combustível, recebe-o com km a mais, combustível em falta e um risco,
     e a conta sai certa, pronta a mandar ao cliente. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const err=[];

/* ── as contas puras ───────────────────────────────────────── */
const g={}; new Function('window', fs.readFileSync('mapa/tipos.js','utf8')+';moduloTipos(window);')(g);
const F=g.FleetTipos;
const em=(a,m,d,h,mi)=>new Date(a,m-1,d,h,mi||0).getTime();   /* hora local */
const H={dias:[1,2,3,4,5], de:'08:00', ate:'18:00'};
ok('uma terça às 10:00 está dentro do horário', F.dentroDoHorario(em(2026,10,6,10), H));
ok('a mesma terça às 21:30 está fora', !F.dentroDoHorario(em(2026,10,6,21,30), H));
ok('um sábado está fora', !F.dentroDoHorario(em(2026,10,10,10), H));
const tFora={id:'x', inicio:em(2026,10,6,17,30), fim:em(2026,10,6,19,0)};
const fh=F.foraDoHorario(tFora, H);
ok('um serviço das 17:30 às 19:00 tem uma hora fora do horário', fh && fh.minutos>=55 && fh.minutos<=65,
   fh && fh.minutos+' min, a partir das '+new Date(fh.quando).toTimeString().slice(0,5));
ok('e um das 9 às 12 não tem nada fora', F.foraDoHorario({inicio:em(2026,10,6,9), fim:em(2026,10,6,12)}, H)===null);
ok('um horário da noite (22:00–06:00) dá a volta à meia-noite',
   F.dentroDoHorario(em(2026,10,6,23), {dias:[0,1,2,3,4,5,6], de:'22:00', ate:'06:00'}) &&
   !F.dentroDoHorario(em(2026,10,6,12), {dias:[0,1,2,3,4,5,6], de:'22:00', ate:'06:00'}));
const praia=F.ZONAS.find(z=>z.id==='praia');
ok('dentro da Praia não sai da zona', F.saiuDaZona([[14.92,-23.51,1,8],[14.95,-23.50,2,8]], praia)===null);
const fora=F.saiuDaZona([[14.92,-23.51,1,8],[15.11,-23.68,2,8]], praia);
ok('em Assomada já saiu da zona da Praia', fora && fora.km>20, fora && fora.km.toFixed(1)+' km');
ok('um ponto com má precisão não conta', F.saiuDaZona([[15.11,-23.68,2,500]], praia)===null);
const ca=F.contaAluguer({saida:{quando:0, km:10000, comb:8}, volta:{quando:2*86400000+1800000, km:10800, comb:4},
  precoDia:4000, kmDia:300, precoKmExtra:25, extras:[{d:'risco',valor:2000}]}, 48, 145);
ok('a conta de um aluguer: 2 dias (meia hora de tolerância), 200 km a mais, meio depósito em falta, um risco',
   ca.dias===2 && ca.kmExtra===200 && ca.valorKm===5000 && ca.litrosFalta===24 && ca.valorComb===3480 &&
   ca.total===8000+5000+3480+2000, JSON.stringify(ca));
ok('com km sem limite, não há km a mais',
   F.contaAluguer({saida:{quando:0,km:0,comb:8}, volta:{quando:1000,km:5000,comb:8}, precoDia:1, kmDia:0}, 45, 145).kmExtra===0);
ok('um aluguer que devia ter voltado ontem está atrasado',
   F.atrasado({previsto:Date.now()-86400000}) && !F.atrasado({previsto:Date.now()+3600000}) &&
   !F.atrasado({previsto:Date.now()-86400000, volta:{}}));
const daqui=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const av=F.avisosDoCarro({seguroAte:daqui(10), inspecaoAte:daqui(-3), licencaAte:daqui(90), km:9500, proxOleoKm:10000});
ok('documentos: seguro em 10 dias é aviso, inspecção caducada é crítica, licença longe não avisa, óleo perto avisa',
   av.length===3 && av.find(a=>a.doc==='Seguro').n==='AVISO' && av.find(a=>a.doc==='Inspecção').n==='CRITICO' &&
   av.find(a=>a.doc==='Óleo'), av.map(a=>a.d).join(' | '));
ok('o Excel recebe ponto e vírgula e aspas onde é preciso',
   F.csv([['a;b','c"d','e']])==='﻿"a;b";"c""d";e');

/* ── os caminhos na aplicação ──────────────────────────────── */
const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
fs.writeFileSync('_tipos.html','<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);
const U='file://'+process.cwd()+'/_tipos.html';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const esperar=async(f,ms=8000)=>{ const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await f()) return true; }catch(e){} await new Promise(r=>setTimeout(r,200)); }
  return false; };
const preencher=async(pg,o)=>{ for(const [k,v] of Object.entries(o)) await pg.fill('#'+k, v); };
const criarConta=async(pg, tipo, nome, frota, email, jaAqui)=>{
  if(!jaAqui){ await pg.goto(U+'#criar-'+tipo); await pg.waitForTimeout(1500); }
  await preencher(pg,{'e-c-nome':nome,'e-c-frota':frota,'e-c-email':email,'e-c-cod':'codigo1','e-c-cod2':'codigo1'});
  await pg.check('#e-c-aceito'); await pg.click('[data-f="criar"]');
  await esperar(async()=>/Guarde este código|A frota agora/.test(await pg.textContent('#ecra')));
  if(await pg.isVisible('[data-f="rec-guardado"]')) await pg.click('[data-f="rec-guardado"]');
  await esperar(async()=>/A frota agora/.test(await pg.textContent('#ecra')));
};

/* ══ UMA INSTITUIÇÃO ══════════════════════════════════════════ */
const ctx=await b.newContext({viewport:{width:430,height:950}, permissions:['geolocation'],
  geolocation:{latitude:14.9177, longitude:-23.5092, accuracy:8}});
const p=await ctx.newPage(); p.on('pageerror',e=>err.push('gestor: '+e.message));
const txt=()=>p.textContent('#ecra');
await p.goto(U+'#criar-instituicao'); await p.waitForTimeout(1500);
ok('o link da página de venda abre o criar conta com "Instituições" escolhido',
   await p.isVisible('.opcao.on[data-tipo="instituicao"]'));
await criarConta(p,'instituicao','Ana Lopes','Câmara da Ribeira','parque@camara.cv',true);
ok('a frota fica do tipo instituição', await esperar(async()=>(await p.evaluate(()=>Nuvem.dados().frota.tipo))==='instituicao'));
ok('e os separadores falam de motoristas', await esperar(async()=>/Motoristas/.test(await p.textContent('#nav'))));

/* as regras: horário que deixa hoje de fora, zona do Sal, departamentos */
await p.click('[data-tab="definicoes"]'); await p.waitForTimeout(600);
ok('as definições mostram as regras da instituição', /Horário de serviço/.test(await txt()) &&
   /Zona autorizada/.test(await txt()) && /Departamentos/.test(await txt()));
const amanha=(new Date().getDay()+1)%7;
await p.click('[data-f="h-dia"][data-dia="'+amanha+'"]'); await p.waitForTimeout(200);
await p.selectOption('#e-z-zona','sal');
await p.fill('#e-deps','Presidência\nObras');
await p.click('[data-f="guardar-tipo"]'); await p.waitForTimeout(800);
const regras=await p.evaluate(()=>{ const f=Nuvem.dados().frota; return {h:f.horario, z:f.zona, d:f.deps}; });
ok('ficam guardadas na frota', regras.h && regras.h.dias.join()===String(amanha) && regras.z && regras.z.id==='sal' &&
   regras.d.join()==='Presidência,Obras', JSON.stringify(regras));

/* um carro de Obras com o seguro a caducar */
await p.click('[data-tab="viaturas"]'); await p.waitForTimeout(500);
await p.click('[data-f="novo-carro"]'); await p.waitForTimeout(500);
await preencher(p,{'e-mat':'ST-10-CM','e-marca':'Toyota','e-modelo':'Hilux','e-km':'40000','e-dep':'70'});
await p.fill('#e-seguro', daqui(12));
await p.selectOption('#e-depto','Obras');
await p.click('[data-f="guardar-carro"]'); await p.waitForTimeout(800);
ok('a ficha do carro mostra os documentos e o departamento',
   /Seguro/.test(await txt()) && /caduca em 12 dias/.test(await txt()) && /Obras/.test(await txt()), (await txt()).match(/Seguro[^C]*/)?.[0]);
await p.click('[data-tab="alertas"]'); await p.waitForTimeout(500);
ok('o "Ver" avisa do seguro', await p.isVisible('#avisos-frota') && /Seguro caduca em 12 dias/.test(await txt()));

/* o motorista */
await p.click('[data-tab="condutores"]'); await p.waitForTimeout(500);
ok('o ecrã chama-lhes motoristas', /Motoristas/.test(await txt()) && /Acrescentar motorista/.test(await txt()));
await p.click('[data-f="novo-cond"]'); await p.waitForTimeout(500);
await p.fill('#e-nome','Rui Tavares'); await p.fill('#e-email2','rui@camara.cv');
await p.click('[data-f="guardar-cond"]'); await p.waitForTimeout(800);
const cod=await p.evaluate(()=>Nuvem.dados().frota.condutores[0].codigo);
const c=await ctx.newPage(); c.on('pageerror',e=>err.push('motorista: '+e.message));
await c.goto(U+'#condutor'); await c.waitForTimeout(1500);
await c.fill('#i-email','rui@camara.cv'); await c.fill('#i-cod',cod);
await c.click('[data-f="entrar"]');
await esperar(async()=>await c.isVisible('[data-carro]'));
await c.locator('[data-carro]').first().click(); await c.waitForTimeout(400);
await c.click('[data-f="ir-gps"]');
ok('antes de sair, o motorista vê a guia de marcha', await esperar(async()=>await c.isVisible('#guia')));
await esperar(async()=>await c.isVisible('[data-f="comecar"].bt'), 8000);
ok('o botão diz "Começar serviço"', /Começar serviço/.test(await c.textContent('[data-f="comecar"].bt').catch(()=>'')));
await c.click('[data-f="comecar"].bt'); await c.waitForTimeout(400);
ok('sem destino nem motivo, não começa', /Escreva para onde vai/.test(await c.textContent('#ecra')) &&
   !(await c.isVisible('.volante')));
await c.fill('#g-destino','Assomada'); await c.fill('#g-motivo','Vistoria da obra da escola');
await c.click('[data-f="comecar"].bt');
ok('com os dois, começa', await esperar(async()=>await c.isVisible('.volante')));

/* o gestor vê o serviço: com a guia, fora do horário e fora da zona */
await p.bringToFront();
ok('o serviço chega ao gestor com o destino e o motivo', await esperar(async()=>
   (await p.evaluate(()=>(Nuvem.dados().vivos[0]||{}).destino))==='Assomada'));
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(600);
await p.locator('[data-vivo]').first().click().catch(()=>{});
await p.waitForTimeout(800);
await p.click('[data-f="detalhes"]').catch(()=>{}); await p.waitForTimeout(600);
ok('nos detalhes: a guia de marcha', await esperar(async()=>/Guia de marcha: Assomada/.test(await txt())));
ok('e o alerta de fora do horário', await esperar(async()=>/fora do horário/.test(await txt())),
   ((await txt()).match(/Serviço fora do horário[^·]*/)||[''])[0].slice(0,70));
ok('e o de fora da zona (o carro anda na Praia, a zona autorizada é o Sal)',
   await esperar(async()=>/Saiu da zona autorizada/.test(await txt()), 15000));

/* o relatório para o Excel */
await p.click('[data-tab="contas"]'); await p.waitForTimeout(500);
const [baixa]=await Promise.all([p.waitForEvent('download',{timeout:8000}).catch(()=>null), p.click('[data-f="relatorio"]')]);
let csv=''; if(baixa){ const q=await baixa.path(); csv=fs.readFileSync(q,'utf8'); }
ok('as contas descarregam um relatório para o Excel, com departamento, destino e motivo',
   !!baixa && /Departamento/.test(csv) && /Destino/.test(csv) && /Motivo/.test(csv), baixa && baixa.suggestedFilename());
await ctx.close();

/* ══ UM RENT-A-CAR ════════════════════════════════════════════ */
const ctx2=await b.newContext({viewport:{width:430,height:950}});
const r=await ctx2.newPage(); r.on('pageerror',e=>err.push('rent-a-car: '+e.message));
const rtxt=()=>r.textContent('#ecra');
await criarConta(r,'rentacar','Sónia Mendes','Praia Rent','reservas@praiarent.cv');
ok('a frota é de rent-a-car, com o separador dos alugueres',
   await esperar(async()=>/Alugueres/.test(await r.textContent('#nav'))) &&
   (await r.evaluate(()=>Nuvem.dados().frota.tipo))==='rentacar');
ok('os primeiros passos falam de entregar carros', /Entregue o primeiro carro/.test(await rtxt()));
await r.click('[data-tab="definicoes"]'); await r.waitForTimeout(500);
await r.fill('#e-kmDia','300'); await r.fill('#e-precoKmExtra','25');
await r.click('[data-f="guardar-tipo"]'); await r.waitForTimeout(500);
await r.click('[data-tab="viaturas"]'); await r.waitForTimeout(400);
await r.click('[data-f="novo-carro"]'); await r.waitForTimeout(400);
await preencher(r,{'e-mat':'ST-77-RC','e-marca':'Hyundai','e-modelo':'i10','e-km':'10000','e-dep':'48','e-precodia':'4000'});
await r.click('[data-f="guardar-carro"]'); await r.waitForTimeout(600);
await r.click('[data-tab="alugueres"]'); await r.waitForTimeout(400);
await r.click('[data-f="novo-aluguer"]'); await r.waitForTimeout(400);
await r.click('[data-carro-al]'); await r.waitForTimeout(300);
ok('ao escolher o carro, vêm o preço dele e os km', (await r.inputValue('#e-a-preco'))==='4000' &&
   (await r.inputValue('#e-a-km'))==='10000' && (await r.inputValue('#e-a-kmdia'))==='300');
await preencher(r,{'e-a-nome':'John Smith','e-a-tel':'991 22 33','e-a-doc':'P1234567'});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC','base64');
await r.setInputFiles('#f-carro',[{name:'frente.png',mimeType:'image/png',buffer:png},{name:'tras.png',mimeType:'image/png',buffer:png}]);
ok('as fotografias do carro aparecem antes de entregar', await esperar(async()=>(await r.locator('.foto-q').count())===2));
await r.click('[data-f="guardar-aluguer"]');
ok('entregue: fica na rua, com a conta a correr', await esperar(async()=>/A conta até agora/.test(await rtxt())));
ok('as fotografias sobem para a base, com o aluguer', await esperar(async()=>(await r.evaluate(()=>
   Object.keys(localStorage).filter(k=>/^sb:d\|[^|]+\|fotos\|al/.test(k)).length))===2));
await r.click('[data-tab="alugueres"]'); await r.waitForTimeout(400);
ok('o resumo diz 1 na rua e 0 disponíveis', /1narua0disponíveis/.test((await rtxt()).replace(/\s/g,'')));
await r.locator('[data-aluguer]').first().click(); await r.waitForTimeout(400);
/* volta com 700 km (300 incluídos num dia), meio depósito, um risco */
await r.fill('#e-v-km','10700');
await r.click('[data-f="comb"][data-campo="e-v-comb"][data-v="4"]'); await r.waitForTimeout(200);
await r.fill('#e-v-extrad','Risco na porta'); await r.fill('#e-v-extra','2000');
await r.click('[data-f="fechar-aluguer"]'); await r.waitForTimeout(600);
const total=4000+400*25+Math.round(24*145)+2000;
ok('recebido: a conta certa (1 dia + 400 km a mais + 24 litros em falta + o risco)',
   /Carro recebido/.test(await rtxt()) && (await r.textContent('#total-aluguer')).replace(/\D/g,'')===String(total),
   await r.textContent('#total-aluguer'));
const zap=decodeURIComponent((await r.getAttribute('#mandar-conta','href')||'').split('text=')[1]||'');
ok('e manda-se ao cliente pelo WhatsApp, com o total', /^https:\/\/wa\.me\/2389912233/.test(await r.getAttribute('#mandar-conta','href')) &&
   zap.includes('Risco na porta') && zap.replace(/\D/g,'').includes(String(total)));
ok('o carro fica com os km da devolução', (await r.evaluate(()=>Nuvem.dados().frota.carros[0].km))===10700);
await r.click('[data-tab="contas"]'); await r.waitForTimeout(400);
ok('as contas mostram a receita do mês', /1 alugueres/.test(await rtxt()));
/* um aluguer atrasado aparece no "Ver" */
await r.evaluate(()=>{ const f=Nuvem.dados().frota;
  const l=(f.alugueres||[]).concat([{id:'alx', carroId:f.carros[0].id, matricula:f.carros[0].matricula,
    cliente:{nome:'Atrasado Silva'}, saida:{quando:Date.now()-3*86400000, km:10700, comb:8},
    previsto:Date.now()-86400000, precoDia:4000, kmDia:0, precoKmExtra:0}]);
  Nuvem.guardarAlugueres(l); });
await r.click('[data-tab="alertas"]'); await r.waitForTimeout(600);
ok('um aluguer atrasado aparece no "Ver"', /Atrasado: Atrasado Silva/.test(await rtxt()));
await ctx2.close();

/* ══ O TÁXI CONTINUA IGUAL ══════════════════════════════════ */
const ctx3=await b.newContext({viewport:{width:430,height:950}});
const t=await ctx3.newPage(); t.on('pageerror',e=>err.push('táxi: '+e.message));
await criarConta(t,'taxi','Manuel Tavares','Táxis Tavares','manuel@taxis.cv');
ok('um táxi continua com "Condutores" e sem regras de instituição',
   /Condutores/.test(await t.textContent('#nav')) && (await t.evaluate(()=>Nuvem.dados().frota.tipo))==='taxi');
await ctx3.close();

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
