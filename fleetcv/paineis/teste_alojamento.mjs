/* O SITE PRONTO A MUDAR DE CASA
   Hoje o site está na Vercel (vercel.json). Para vender, muda-se para o
   Cloudflare Pages (grátis e com uso comercial), que lê os cabeçalhos do
   _headers e os desvios do _redirects. Os dois têm de dizer o mesmo:
   senão, ao mudar, o APK deixava de se descarregar como aplicação, o mapa
   deixava de ficar guardado, ou a configuração ficava presa na cache.
   E o Cloudflare recusa ficheiros com mais de 25 MiB. */
import fs from 'node:fs';
import path from 'node:path';

const SITE=path.resolve('../site');
const ok=(n,c,x)=>console.log((c?' ok  ':'FALHA')+' · '+n+(x!==undefined?'  → '+x:''));
const vercel=JSON.parse(fs.readFileSync(path.join(SITE,'vercel.json'),'utf8'));

/* o _headers: blocos "caminho" + linhas indentadas "Chave: valor" */
const regras=[]; let atual=null;
for(const l of fs.readFileSync(path.join(SITE,'_headers'),'utf8').split('\n')){
  if(!l.trim() || l.trim().startsWith('#')) continue;
  if(!/^\s/.test(l)){ atual={padrao:l.trim(), h:{}}; regras.push(atual); continue; }
  const i=l.indexOf(':'); atual.h[l.slice(0,i).trim().toLowerCase()]=l.slice(i+1).trim(); }
const doCloudflare=p=>{ const h={};
  for(const r of regras){
    const re=new RegExp('^'+r.padrao.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$');
    if(re.test(p)) Object.assign(h, r.h); }
  return h; };
const daVercel=p=>{ const h={};
  for(const r of vercel.headers){
    if(new RegExp('^'+r.source+'$').test(p)) for(const x of r.headers) h[x.key.toLowerCase()]=x.value; }
  return h; };

const caminhos=['/','/app','/privacidade','/FleetCV.apk','/teste/FleetCV-1.2.0.apk','/teste/FleetCV-1.2.0.aab','/teste/FleetCV-1.0.1.apk',
  '/fleetcv-config.js','/mapa.js','/condutor.js','/dono.js','/porteiro.js','/estilo.css',
  '/mapa/'+fs.readdirSync(path.join(SITE,'mapa')).find(f=>f.endsWith('.pmtiles'))];
for(const p of caminhos){
  const v=daVercel(p), c=doCloudflare(p);
  const dif=[...new Set([...Object.keys(v),...Object.keys(c)])].filter(k=>v[k]!==c[k]);
  ok(p+': os mesmos cabeçalhos na Vercel e no Cloudflare', dif.length===0,
     dif.length ? dif.map(k=>k+': '+(v[k]||'—')+' / '+(c[k]||'—')).join(' · ') : Object.keys(v).length+' cabeçalhos');
}
/* nenhuma regra da Vercel fica sem caminho de prova */
const semProva=vercel.headers.filter(r=>!caminhos.some(p=>new RegExp('^'+r.source+'$').test(p)));
ok('cada regra do vercel.json é posta à prova', semProva.length===0, semProva.map(r=>r.source).join(' '));

const red=fs.readFileSync(path.join(SITE,'_redirects'),'utf8');
ok('os desvios da Vercel também estão no _redirects',
   (vercel.redirects||[]).every(r=>new RegExp('^'+r.source.replace(/\//g,'\\/')+'\\s+'+
     r.destination.replace(/\//g,'\\/')+'\\s+'+(r.permanent?'301':'302')+'$','m').test(red)));

/* o Cloudflare Pages não aceita ficheiros com mais de 25 MiB */
const grandes=[]; const andar=d=>{ for(const f of fs.readdirSync(d)){ const q=path.join(d,f);
  const s=fs.statSync(q); if(s.isDirectory()) andar(q); else if(s.size>25*1024*1024) grandes.push(f); } };
andar(SITE);
ok('nenhum ficheiro do site passa dos 25 MiB', grandes.length===0, grandes.join(', ')||'o maior é o mapa, '+
   Math.round(fs.statSync(path.join(SITE,'mapa',fs.readdirSync(path.join(SITE,'mapa')).find(f=>f.endsWith('.pmtiles')))).size/1048576)+' MiB');

/* a aplicação Android aponta para o endereço do site */
const cap=JSON.parse(fs.readFileSync('../android/capacitor.config.json','utf8'));
const casa=new URL(cap.server.url).host;
ok('a aplicação Android só navega para endereços que conhece', cap.server.allowNavigation.includes(casa), casa);
