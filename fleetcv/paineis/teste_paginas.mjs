/* AS PÁGINAS DE PRIVACIDADE, TERMOS E AJUDA
   Abrem-se bem num telemóvel pequeno, nos dois temas, ligam umas às
   outras, e a página principal liga a elas. E o que a política de
   privacidade promete tem de ser o que o código faz: se alguém mudar
   o passo do GPS ou o prazo dos registos de erros sem mudar a página,
   isto falha. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=path.resolve('../site');
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const err=[];

/* ── o que se promete é o que se faz ──────────────────────── */
const priv=fs.readFileSync(path.join(SITE,'privacidade.html'),'utf8');
const cond=fs.readFileSync('painel_condutor.html','utf8');
const esq=fs.readFileSync('../supabase/esquema.sql','utf8');
const passo=cond.match(/var PASSO_M=(\d+), PASSO_MS=(\d+);/);
ok('o passo do GPS da política é o do código',
   passo && priv.includes('a cada '+passo[1]+' metros') && priv.includes('a cada '+(+passo[2]/1000)),
   passo && passo[1]+' m / '+(+passo[2]/1000)+' s');
const prazo=esq.match(/delete from public\.erros where quando < now\(\) - interval '(\d+) days'/);
ok('o prazo dos registos de erros da política é o da base',
   prazo && priv.includes('ao fim de '+prazo[1]+' dias'), prazo && prazo[1]+' dias');
ok('a política diz onde fica a base (Irlanda, como o projecto do Supabase)', /Irlanda/.test(priv));
const dono=fs.readFileSync('painel_dono.html','utf8');
const versao=(dono.match(/var TERMOS='([\d-]+)'/)||[])[1];
const [a,m,d]=(versao||'0-0-0').split('-').map(Number);
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const dataEscrita='Versão de '+d+' de '+MESES[m-1]+' de '+a;
ok('a versão que se aceita ao criar conta é a data dos termos e da política',
   fs.readFileSync(path.join(SITE,'termos.html'),'utf8').includes(dataEscrita) && priv.includes(dataEscrita),
   dataEscrita);

/* ── num telemóvel pequeno, nos dois temas ────────────────── */
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const tema of ['light','dark']){
  const ctx=await b.newContext({viewport:{width:360,height:740}, colorScheme:tema});
  await ctx.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
  for(const pg of ['privacidade','termos','ajuda']){
    const p=await ctx.newPage(); p.on('pageerror',e=>err.push(pg+': '+e.message));
    /* como o site serve: /paginas.css e /icone.png a partir da raiz */
    await p.route('file:///paginas.css', r=>r.fulfill({path:path.join(SITE,'paginas.css'), contentType:'text/css'}));
    await p.route('file:///icone.png', r=>r.fulfill({path:path.join(SITE,'icone.png'), contentType:'image/png'}));
    await p.goto('file://'+path.join(SITE,pg+'.html'));
    const v=await p.evaluate(()=>({larg:document.documentElement.scrollWidth, vista:innerWidth,
      fundo:getComputedStyle(document.body).backgroundColor, tinta:getComputedStyle(document.body).color,
      titulo:document.title, links:[...document.querySelectorAll('footer a')].map(a=>a.getAttribute('href'))}));
    const escuro=/rgb\((\d+)/.exec(v.fundo)[1]<60;
    ok(pg+' ('+tema+'): sem arrastar para o lado, com o fundo do tema',
       v.larg<=v.vista && escuro===(tema==='dark'), v.larg+'px · '+v.fundo);
    if(tema==='light'){
      const outras=['privacidade','termos','ajuda'].filter(x=>x!==pg).map(x=>'/'+x);
      ok(pg+': o rodapé liga às outras páginas e ao WhatsApp',
         outras.every(x=>v.links.includes(x)) && v.links.some(x=>/wa\.me\/2389557882/.test(x)), v.links.join(' '));
    }
    await p.close();
  }
  await ctx.close();
}

/* ── a ajuda ──────────────────────────────────────────────── */
const ctx=await b.newContext({viewport:{width:390,height:800}, permissions:['clipboard-read','clipboard-write']});
await ctx.route('https://fonts.googleapis.com/**', r=>r.fulfill({body:'', contentType:'text/css'}));
const p=await ctx.newPage(); p.on('pageerror',e=>err.push('ajuda: '+e.message));
await p.goto('file://'+path.join(SITE,'ajuda.html')+'#condutor');
ok('a ajuda aberta em #condutor abre logo a primeira pergunta do condutor',
   await p.evaluate(()=>document.getElementById('condutor').nextElementSibling.open===true));
ok('fala do "Esqueci-me do código" e do código de recuperação',
   /Esqueci-me do código/.test(await p.textContent('main')) && /código de recuperação/.test(await p.textContent('main')));
await p.click('#copiar'); await p.waitForTimeout(300);
const copiado=await p.evaluate(()=>navigator.clipboard.readText());
ok('o aviso para os condutores copia-se com um toque',
   /AVISO SOBRE O USO DA FLEETCV/.test(copiado) && /Tomei conhecimento/.test(copiado));
ok('e diz que o GPS só regista com o turno aberto', /só enquanto o turno está aberto/.test(copiado));
await ctx.close();

/* ── a página principal, a do Android e a aplicação ligam a elas ── */
const idx=fs.readFileSync(path.join(SITE,'index.html'),'utf8');
ok('a página principal liga à ajuda, privacidade e termos',
   ['/ajuda','/privacidade','/termos'].every(x=>idx.includes('href="'+x+'"')));
ok('a página do Android diz ao condutor o que se regista',
   fs.readFileSync(path.join(SITE,'android.html'),'utf8').includes('href="/privacidade#condutor"'));
const vercel=JSON.parse(fs.readFileSync(path.join(SITE,'vercel.json'),'utf8'));
ok('o site serve /privacidade sem o .html', vercel.cleanUrls===true);

console.log('\nerros JS:', err.length?err.join(' | '):'nenhum');
await b.close();
