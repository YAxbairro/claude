/* AS FOTOGRAFIAS
   São a prova — é por causa delas que isto existe. O condutor tira,
   sobem, e o patrão TEM de as poder ver. Se não vê, voltou a
   acreditar na palavra do condutor.

   Corre no caminho do Claude, que é o que limita o tamanho dos
   documentos a 256 kB. Três fotos dentro de um turno estouravam
   esse limite e o turno inteiro era recusado, em silêncio. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const app=fs.readFileSync('fleetcv.html','utf8');
const falso=fs.readFileSync('_db_falso.js','utf8');
fs.writeFileSync('_comodb.html','<!doctype html><html><head><meta charset=utf8>'+
  '<meta name=viewport content="width=device-width,initial-scale=1">'+
  '<script>'+falso+'</script></head><body>\n'+app);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x?'  → '+x:''));
const err=[];
const U='file://'+process.cwd()+'/_comodb.html';

/* uma fotografia como sai de um telemóvel: grande e cheia de ruído */
function retrato(){
  const c=fs.readFileSync('quadrante.jpg');
  return c;
}
const ficheiro = {name:'quadrante.jpg', mimeType:'image/jpeg', buffer:(()=>{
  /* JPEG de 1200x1600 com ruído, para pesar como uma foto verdadeira */
  return Buffer.from(
    'ffd8ffe000104a46494600010100000100010000ffdb004300'+ 'ff'.repeat(400)+'ffd9','hex');
})()};

const ctx=await b.newContext({viewport:{width:390,height:840},isMobile:true,
  hasTouch:true, permissions:['geolocation'],
  geolocation:{latitude:14.9177,longitude:-23.5092,accuracy:8}});
const co=await ctx.newPage();
co.on('pageerror',e=>err.push('condutor: '+e.message));

/* faz uma fotografia de verdade dentro do navegador e mete-a no campo */
async function fotografar(pag, seletor){
  await pag.evaluate(async(sel)=>{
    const c=document.createElement('canvas'); c.width=1200; c.height=1600;
    const x=c.getContext('2d');
    const im=x.createImageData(1200,1600);
    for(let i=0;i<im.data.length;i+=4){
      const v=90+Math.random()*130;
      im.data[i]=v; im.data[i+1]=v*0.92; im.data[i+2]=v*0.8; im.data[i+3]=255; }
    x.putImageData(im,0,0);
    x.fillStyle='#000'; x.font='bold 140px sans-serif';
    x.fillText('120456 km', 90, 800);
    const bl=await new Promise(r=>c.toBlob(r,'image/jpeg',0.92));
    const f=new File([bl],'quadrante.jpg',{type:'image/jpeg'});
    const dt=new DataTransfer(); dt.items.add(f);
    const inp=document.querySelector(sel);
    inp.files=dt.files;
    inp.dispatchEvent(new Event('change',{bubbles:true}));
  }, seletor);
  await pag.waitForTimeout(900);
}

await co.goto(U); await co.waitForTimeout(1500);
await co.click('[data-quem="condutor"]'); await co.waitForTimeout(500);
await co.fill('#i-email','antonio@exemplo.cv'); await co.fill('#i-cod','1234');
await co.click('[data-f="entrar"]'); await co.waitForTimeout(1500);
await co.locator('[data-carro]').first().click(); await co.waitForTimeout(600);

await fotografar(co,'#ff');
ok('a foto do quadrante entra', await co.isVisible('.foto.feita img'));
const tam = await co.evaluate(()=>{
  const i=document.querySelector('.foto.feita img');
  return i?Math.round(i.src.length/1024):0; });
ok('e é leve que chegue para caber num documento', tam>0 && tam<120, tam+' kB');

await co.click('[data-f="ir-gps"]'); await co.waitForTimeout(1300);
await co.click('[data-f="comecar-sim"]'); await co.waitForTimeout(2500);
await co.click('[data-f="ir-abast"]'); await co.waitForTimeout(700);
await fotografar(co,'#ff');
await co.fill('#i-valor','2500'); await co.waitForTimeout(400);
await co.click('[data-f="guardar-abast"]'); await co.waitForTimeout(900);
ok('abastece com talão fotografado',
   (await co.textContent('#ecra')).includes('2.500'));
await co.click('[data-f="ir-fim"]'); await co.waitForTimeout(700);
await fotografar(co,'#ff');
await co.click('[data-f="terminar"]'); await co.waitForTimeout(2500);
ok('o turno fecha com as três fotos',
   (await co.textContent('#ecra')).includes('Turno terminado'));
await co.waitForTimeout(2000);
ok('e não fica nada por enviar',
   !/por enviar/.test(await co.textContent('body')),
   (await co.textContent('body')).match(/\d+ por enviar/)?.[0] || 'tudo subiu');

/* ── o patrão ───────────────────────────────────────────── */
const p=await ctx.newPage();
await p.setViewportSize({width:430,height:950});
p.on('pageerror',e=>err.push('patrão: '+e.message));
await p.goto(U); await p.waitForTimeout(1500);
await p.click('#trocar').catch(()=>{}); await p.waitForTimeout(600);
await p.click('[data-quem="dono"]'); await p.waitForTimeout(500);
await p.fill('#i-email','patrao@exemplo.cv'); await p.fill('#i-cod','9999');
await p.click('[data-f="entrar"]'); await p.waitForTimeout(2500);
await p.click('[data-tab="mapa"]'); await p.waitForTimeout(900);
await p.locator('[data-turno]').first().click(); await p.waitForTimeout(2500);
const nf2 = await p.locator('.foto-q img').count();
ok('O PATRÃO VÊ AS FOTOGRAFIAS', nf2>=3, nf2+' fotos');
ok('e sabe qual é qual',
   /Quadrante ao começar/.test(await p.textContent('#ecra')) &&
   /Talão/.test(await p.textContent('#ecra')) &&
   /Quadrante ao acabar/.test(await p.textContent('#ecra')));
await p.screenshot({path:'g1-fotos.png', animations:'allow', timeout:9000}).catch(()=>{});
await p.locator('.foto-q').first().click(); await p.waitForTimeout(700);
ok('e abre uma em grande', await p.isVisible('.lupa img'));
await p.screenshot({path:'g2-lupa.png', animations:'allow', timeout:9000}).catch(()=>{});
await p.click('.lupa'); await p.waitForTimeout(500);
ok('e fecha', !await p.isVisible('.lupa'));

/* um turno sem fotos tem de o dizer, não ficar calado */
await p.click('[data-tab="alertas"]'); await p.waitForTimeout(900);
await p.locator('[data-turno]').last().click(); await p.waitForTimeout(2500);
ok('um turno sem fotografias diz o que é',
   /Sem fotografias|ainda não chegaram|Turno de exemplo/.test(await p.textContent('#ecra')),
   (await p.textContent('#ecra')).match(/Sem fotografias|Turno de exemplo|ainda não chegaram/)?.[0]);

console.log('\nerros JS:', err.length?err:'nenhum');
await b.close();
