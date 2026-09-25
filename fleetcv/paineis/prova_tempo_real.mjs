/* O TEMPO REAL, CONTRA A BASE VERDADEIRA — de fora
   Um condutor escreve onde está; o patrão da frota dele tem de o
   receber pelo canal ao vivo (WebSocket) em menos de um segundo — e o
   patrão de OUTRA frota não pode receber nada. É a única peça que a
   máquina do Claude não consegue provar (não deixa passar WebSockets),
   por isso corre numa máquina de fora:

     npm i @supabase/supabase-js && node prova_tempo_real.mjs

   Cria duas frotas de prova e apaga-as no fim. Não precisa de código
   nenhum: as contas nascem e morrem aqui. */
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const URL='https://jhjtjjyplihabowxkfhs.supabase.co';
const CHAVE='sb_publishable_wYOl-KJg755TF38iEkq5jA_1K6f1N_R';
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const cliente=()=>createClient(URL, CHAVE, {auth:{persistSession:false,autoRefreshToken:false}});
const dorme=ms=>new Promise(r=>setTimeout(r,ms));
const marca=Date.now().toString(36);
const cod=()=>crypto.randomBytes(9).toString('base64url');

async function patrao(nome){
  const sb=cliente(); await sb.auth.signInAnonymously();
  const c=cod();
  const r=await sb.rpc('criar_frota',{p_nome:'Prova '+nome,p_frota_nome:'Prova '+nome,
    p_email:'prova-rt-'+nome+'-'+marca+'@fleetcv.test',p_codigo:c});
  if(r.error||r.data.erro) throw new Error('criar_frota: '+JSON.stringify(r.error||r.data));
  return {sb, codigo:c, frota:r.data.frota};
}
function escutar(sb){
  const chegou=[];
  const canal=sb.channel('prova-'+Math.random());
  canal.on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'coleccao=eq.vivo'},
    m=>chegou.push({quando:Date.now(), m}));
  const pronto=new Promise(ok=>canal.subscribe(s=>{ if(s==='SUBSCRIBED') ok(true); }));
  return {chegou, pronto, canal};
}

const A=await patrao('a'), B=await patrao('b');
ok('duas frotas de prova criadas', !!(A.frota&&B.frota), A.frota+' e '+B.frota);

/* a frota A com um carro e um condutor */
const cc=String(1000+crypto.randomInt(9000));
const emailCond='prova-rt-c-'+marca+'@fleetcv.test';
let r=await A.sb.from('docs').upsert([
  {frota:A.frota,coleccao:'frota',id:'carros',corpo:{lista:[{id:'c1',matricula:'PV-RT-01'}]}},
  {frota:A.frota,coleccao:'frota',id:'condutores',corpo:{lista:[{id:'m1',nome:'Condutor RT',
    email:emailCond,codigo:cc,estado:'ACTIVO'}]}}],{onConflict:'frota,coleccao,id'});
ok('o patrão A junta carro e condutor', !r.error, r.error&&r.error.message);

const eA=escutar(A.sb), eB=escutar(B.sb);
const ligou=await Promise.race([Promise.all([eA.pronto,eB.pronto]), dorme(15000).then(()=>false)]);
ok('os dois patrões ficam ligados ao canal ao vivo', !!ligou);
/* O "ligado" chega um instante antes de o servidor começar mesmo a
   mandar as mudanças da base; na primeira prova perdeu-se a primeira
   posição assim. Na aplicação isto não se nota (a posição seguinte
   chega segundo e meio depois, e a rede de segurança lê tudo de novo),
   mas aqui quer-se medir o canal, não o arranque. */
await dorme(2000);

const C=cliente(); await C.auth.signInAnonymously();
const en=await C.rpc('entrar',{p_email:emailCond,p_codigo:cc});
ok('o condutor entra', en.data&&en.data.papel==='condutor', JSON.stringify(en.data));

/* dez posições, de segundo e meio em segundo e meio, como na estrada */
const enviadas={};
for(let i=0;i<10;i++){
  const corpo={id:'t-rt',condutorId:'m1',lat:14.9177+i*0.0003,lon:-23.5092,vel:30+i,momento:Date.now()};
  const t0=Date.now();
  enviadas[30+i]=t0;
  r=await C.from('docs').upsert({frota:A.frota,coleccao:'vivo',id:'t-rt',corpo},{onConflict:'frota,coleccao,id'});
  if(r.error){ ok('o condutor escreve a posição',false,r.error.message); break; }
  await dorme(1500);
}
await dorme(2000);
const doA=eA.chegou.filter(x=>x.m.eventType!=='DELETE');
/* cada posição leva uma velocidade diferente: é por ela que se sabe
   qual chegou, e quanto tempo levou desde que o condutor a mandou */
const atrasos=doA.map(x=>enviadas[x.m.new.corpo.vel]!=null
  ? x.quando-enviadas[x.m.new.corpo.vel] : null).filter(x=>x!=null);
ok('o patrão A recebe as 10 posições ao vivo', doA.length>=10,
   doA.length+' recebidas: '+doA.map(x=>x.m.new.corpo.vel).join(' '));
const med=atrasos.sort((a,b)=>a-b)[Math.floor(atrasos.length/2)];
ok('em menos de um segundo', med!=null && med<1000, 'atraso típico '+med+' ms · pior '+Math.max(...atrasos)+' ms');
ok('com a velocidade dentro', doA.length && doA[doA.length-1].m.new.corpo.vel===39,
   doA.length?'última: '+doA[doA.length-1].m.new.corpo.vel+' km/h':'');
ok('o patrão B (outra frota) não recebe nenhuma', eB.chegou.filter(x=>x.m.eventType!=='DELETE').length===0,
   eB.chegou.length+' recebidas');

/* o condutor fecha: a posição sai do mapa */
await C.from('docs').delete().eq('coleccao','vivo').eq('id','t-rt');
await dorme(2500);
const apagou=eA.chegou.find(x=>x.m.eventType==='DELETE');
ok('quando fecha, o patrão A recebe a saída do mapa', !!apagou,
   apagou?'com a frota na chave: '+apagou.m.old.frota:'');
const deB=eB.chegou.find(x=>x.m.eventType==='DELETE');
ok('(o patrão B também recebe o apagamento, só com a chave — é por isso que a aplicação confere a frota)',
   true, deB?'recebeu, frota '+deB.m.old.frota+' ≠ '+B.frota:'não recebeu');

/* arrumar */
await A.sb.removeAllChannels(); await B.sb.removeAllChannels();
const la=await A.sb.rpc('apagar_frota',{p_codigo:A.codigo});
const lb=await B.sb.rpc('apagar_frota',{p_codigo:B.codigo});
ok('as duas frotas de prova apagadas', la.data&&la.data.ok && lb.data&&lb.data.ok);
process.exit(0);
