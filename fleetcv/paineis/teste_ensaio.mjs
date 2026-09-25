/* O ENSAIO — qualquer pessoa experimenta, sem conta e sem tocar na
   frota de ninguém. É isto que faz o site poder ser mostrado. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_supa_falso.js','utf8');
/* com o Supabase configurado e a funcionar — para provar que mesmo
   assim o ensaio não lhe toca */
fs.writeFileSync('_ensaio.html',
  '<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>window.FLEETCV_CONFIG={supabaseUrl:"https://x.supabase.co",'+
  'supabaseChave:"anon-de-mentira"};</script>'+
  '<script>'+falso+'</script></head><body>\n'+app);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_ensaio.html';
const ctx=await b.newContext({viewport:{width:390,height:840},
  permissions:['geolocation'], geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const p=await ctx.newPage(); p.on('pageerror',e=>err.push(e.message));
await p.goto(U); await p.waitForTimeout(1500);

ok('o botão de experimentar está à entrada', await p.isVisible('[data-demo]'),
   (await p.textContent('[data-demo]')||'').replace(/\s+/g,' ').slice(0,42));
await p.click('[data-demo]'); await p.waitForTimeout(600);
ok('pergunta de que lado se quer ver, sem pedir conta',
   (await p.textContent('body')).includes('Ver o lado do condutor'));
await p.click('[data-quem="condutor"]'); await p.waitForTimeout(2000);
ok('entra direito, sem e-mail nem código',
   (await p.textContent('#ecra')).includes('Que carro vai levar'),
   (await p.textContent('#ecra')).slice(0,40).replace(/\s+/g,' '));
ok('NÃO se ligou a base de dados nenhuma',
   (await p.evaluate(()=>Nuvem.estado()))==='perto',
   await p.evaluate(()=>Nuvem.estado()));
/* o que interessa não é quantos documentos lá estão (o simulador
   semeia a frota sozinho ao carregar), é que o ensaio não ESCREVA
   nada: nem turnos, nem posições ao vivo, nem perfis */
const sujou=async()=>p.evaluate(()=>{ let v=[];
  for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||'';
    if(/^sb:(docs:(turnos|vivo|rastos|fotos)|perfil:)/.test(k)) v.push(k); }
  return v; });
ok('e não escreveu nada na base de dados', (await sujou()).length===0,
   (await sujou()).join(' ')||'nada escrito');

/* dá para trabalhar a sério no ensaio */
await p.locator('[data-carro]').first().click(); await p.waitForTimeout(700);
await p.click('[data-f="ir-gps"]'); await p.waitForTimeout(1500);
await p.click('[data-f="comecar-sim"]'); await p.waitForTimeout(2500);
ok('abre turno no ensaio', await p.isVisible('.volante'));

/* e o patrão, noutro separador do mesmo telemóvel, vê */
const d=await ctx.newPage(); d.on('pageerror',e=>err.push('patrão: '+e.message));
await d.goto(U); await d.waitForTimeout(1500);
await d.click('#trocar').catch(()=>{}); await d.waitForTimeout(500);
await d.click('[data-demo]').catch(()=>{}); await d.waitForTimeout(500);
await d.click('[data-quem="dono"]').catch(()=>{}); await d.waitForTimeout(2500);
await d.click('[data-tab="mapa"]').catch(()=>{}); await d.waitForTimeout(1500);
const fim=Date.now()+25000; let viu=false;
while(Date.now()<fim){ if((await d.textContent('#ecra')).includes('em turno neste momento')){viu=true;break;}
  await new Promise(r=>setTimeout(r,500)); }
ok('os dois lados falam um com o outro no mesmo telemóvel', viu);

/* e sai-se do ensaio */
await p.click('#trocar').catch(()=>{}); await p.waitForTimeout(1200);
ok('o ⇄ tira do ensaio e volta a perguntar',
   await p.isVisible('[data-demo]'));
ok('mesmo depois de um turno inteiro, a base continua intacta',
   (await sujou()).length===0, (await sujou()).join(' ')||'nada escrito');
console.log('\nerros:', err.length?err:'nenhum');
await b.close();
