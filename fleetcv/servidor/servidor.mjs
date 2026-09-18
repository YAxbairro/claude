/* ════════════════════════════════════════════════════════════
   O SERVIDOR DO FLEETCV

   O terceiro motor. Os outros dois — a base de dados do Claude e o
   próprio navegador — servem para experimentar, mas obrigam quem abre
   a aplicação a ter conta nalgum sítio. Este não: o condutor abre um
   endereço no telemóvel dele, escreve o e-mail e o código que o patrão
   lhe deu, e trabalha. É isto que um táxi na Praia precisa.

   Não usa biblioteca nenhuma — só o que vem dentro do Node. Um
   ficheiro, uma base de dados num ficheiro ao lado, e arranca com
   `node servidor.mjs`.

   Duas coisas que só um servidor pode fazer, e que são a razão de ele
   existir:

   1 · Mandar a novidade a quem está a ver. O telemóvel do patrão fica
       com uma linha aberta para aqui (chama-se SSE) e recebe cada
       mudança no momento em que ela acontece, sem andar a perguntar.

   2 · Impedir o que não deve acontecer. Um condutor pode escrever o
       turno dele e mais nada: não mexe na frota, não apaga o turno de
       outro, não inventa um abastecimento em nome de ninguém. Num
       telemóvel isso era só boa vontade; aqui é verificado.
   ════════════════════════════════════════════════════════════ */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const AQUI    = path.dirname(fileURLToPath(import.meta.url));
const PORTA   = Number(process.env.PORT || process.env.FLEETCV_PORTA || 8080);
const FICHEIRO= process.env.FLEETCV_DADOS  || path.join(AQUI, 'dados.db');
const APP     = process.env.FLEETCV_APP    || path.join(AQUI, 'fleetcv.html');
const SESSAO_H= 720;                       /* a sessão dura 30 dias      */
const MAX_ERRO= 6;                         /* tentativas antes de travar */
const TRAVA_MS= 15*60*1000;

/* ─── a base de dados ────────────────────────────────────── */
/* Uma tabela só, com a mesma forma que a aplicação já usava: uma
   colecção, um nome, e o conteúdo. Assim o que muda no telemóvel é
   exactamente o que fica gravado aqui. */
const bd = new DatabaseSync(FICHEIRO);
bd.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS docs(
    coleccao TEXT NOT NULL, id TEXT NOT NULL,
    corpo TEXT NOT NULL, quando INTEGER NOT NULL,
    PRIMARY KEY(coleccao, id));
  CREATE INDEX IF NOT EXISTS docs_col ON docs(coleccao, quando DESC);
  CREATE TABLE IF NOT EXISTS sessoes(
    token TEXT PRIMARY KEY, papel TEXT NOT NULL, quem TEXT NOT NULL,
    nome TEXT NOT NULL, expira INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS erros_entrada(
    email TEXT NOT NULL, quando INTEGER NOT NULL);
`);

const qLer    = bd.prepare('SELECT corpo FROM docs WHERE coleccao=? AND id=?');
const qPor    = bd.prepare(`INSERT INTO docs(coleccao,id,corpo,quando) VALUES(?,?,?,?)
                            ON CONFLICT(coleccao,id) DO UPDATE
                            SET corpo=excluded.corpo, quando=excluded.quando`);
const qTirar  = bd.prepare('DELETE FROM docs WHERE coleccao=? AND id=?');
const qTodos  = bd.prepare('SELECT id,corpo FROM docs WHERE coleccao=? ORDER BY quando DESC');
const qLimite = bd.prepare('SELECT id,corpo FROM docs WHERE coleccao=? ORDER BY quando DESC LIMIT ?');

const ler   = (c,id)   => { const r=qLer.get(c,id); return r?JSON.parse(r.corpo):null; };
const por   = (c,id,d) => { qPor.run(c,id,JSON.stringify(d),Date.now()); };
const tirar = (c,id)   => { qTirar.run(c,id); };
const todos = (c,n)    => (n?qLimite.all(c,n):qTodos.all(c))
                            .map(r=>({id:r.id, d:JSON.parse(r.corpo)}));

/* ─── a frota de estreia ─────────────────────────────────── */
/* Sem carros e sem condutores gravados, nenhum condutor consegue
   entrar — e o patrão ainda não teve oportunidade de os criar. Por
   isso na primeira vez que arranca, o servidor põe cá uma frota de
   estreia, a mesma que a aplicação usa quando corre sozinha. O
   patrão muda-a, apaga-a, põe a dele. */
function semearFrota(){
  if(ler('frota','config')) return;
  por('frota','config', {nome:'Táxis Praia, Lda', precoLitro:145});
  por('frota','carros', {lista:[
    {id:'c1',matricula:'CV-01-AB',marca:'Toyota',modelo:'Corolla',ano:2015,
     deposito:50,km:120000,estado:'ACTIVO',proxOleoKm:125000},
    {id:'c2',matricula:'CV-02-CD',marca:'Nissan',modelo:'Almera',ano:2012,
     deposito:46,km:208400,estado:'ACTIVO',proxOleoKm:210000},
    {id:'c3',matricula:'CV-03-EF',marca:'Hyundai',modelo:'Accent',ano:2017,
     deposito:45,km:64300,estado:'ACTIVO',proxOleoKm:70000}]});
  por('frota','condutores', {lista:[
    {id:'m1',nome:'António Semedo',email:'antonio@exemplo.cv',codigo:'1234',
     telefone:'+238 991 10 01',estado:'ACTIVO'},
    {id:'m2',nome:'Jorge Tavares',email:'jorge@exemplo.cv',codigo:'2345',
     telefone:'+238 991 10 02',estado:'ACTIVO'},
    {id:'m3',nome:'Nuno Rocha',email:'nuno@exemplo.cv',codigo:'3456',
     telefone:'+238 991 10 03',estado:'ACTIVO'}]});
  console.log('frota de estreia criada — o proprietário pode mudá-la no painel');
}

/* ─── quem está a ver, para lhes mandar as novidades ─────── */
const aVer = new Set();
function espalhar(c, id, d){
  const linha = 'data: ' + JSON.stringify({c, id, d}) + '\n\n';
  for(const r of aVer){ try{ r.write(linha); }catch(e){ aVer.delete(r); } }
}

/* ─── entrar ─────────────────────────────────────────────── */
function donoDaFrota(){
  return ler('frota','dono') || {
    email: (process.env.FLEETCV_DONO_EMAIL || 'patrao@exemplo.cv').toLowerCase(),
    codigo: String(process.env.FLEETCV_DONO_CODIGO || '9999'),
    nome: process.env.FLEETCV_DONO_NOME || 'Proprietário' };
}
function travado(email){
  bd.prepare('DELETE FROM erros_entrada WHERE quando<?').run(Date.now()-TRAVA_MS);
  const n=bd.prepare('SELECT count(*) n FROM erros_entrada WHERE email=?').get(email).n;
  return n>=MAX_ERRO;
}
function errou(email){
  bd.prepare('INSERT INTO erros_entrada(email,quando) VALUES(?,?)').run(email,Date.now());
}
function abrirSessao(papel, quem, nome){
  const token=crypto.randomBytes(32).toString('hex');
  bd.prepare('INSERT INTO sessoes(token,papel,quem,nome,expira) VALUES(?,?,?,?,?)')
    .run(token, papel, quem, nome, Date.now()+SESSAO_H*3600*1000);
  return token;
}
function sessaoDe(pedido){
  const m=/(?:^|;\s*)fcv=([a-f0-9]{64})/.exec(pedido.headers.cookie||'');
  if(!m) return null;
  const s=bd.prepare('SELECT * FROM sessoes WHERE token=?').get(m[1]);
  if(!s) return null;
  if(s.expira < Date.now()){
    bd.prepare('DELETE FROM sessoes WHERE token=?').run(m[1]); return null; }
  return s;
}

/* ─── quem pode escrever o quê ───────────────────────────── */
/* É este pedaço que faz a diferença entre uma aplicação honesta e uma
   aplicação em que cada telemóvel escreve o que lhe apetece. */
function podeEscrever(s, c, id, d){
  if(!s) return 'é preciso entrar primeiro';
  if(s.papel==='dono') return null;                 /* o patrão manda em tudo */

  if(c==='frota') return 'só o proprietário mexe na frota';

  if(c==='turnos' || c==='vivo'){
    if(!d) return 'falta o conteúdo';
    if(d.condutorId && d.condutorId!==s.quem)
      return 'este turno é de outro condutor';
    if(!d.condutorId) return 'o turno tem de dizer de quem é';
    const jaLa = ler(c, id);
    if(jaLa && jaLa.condutorId && jaLa.condutorId!==s.quem)
      return 'este turno é de outro condutor';
    if(jaLa && jaLa.fim && c==='turnos')
      return 'um turno fechado não se volta a escrever';
    return null;
  }

  if(c==='rastos'){
    const turnoId=String(id).replace(/_\d+$/,'');
    const t=ler('turnos', turnoId);
    if(!t) return 'não há turno com esse nome';
    if(t.condutorId!==s.quem) return 'este percurso é de outro condutor';
    return null;
  }
  return 'não se pode escrever aqui';
}
function podeApagar(s, c){
  if(!s) return 'é preciso entrar primeiro';
  if(s.papel==='dono') return null;
  if(c==='vivo') return null;             /* o condutor fecha o turno dele */
  return 'só o proprietário pode apagar';
}

/* ─── as respostas ───────────────────────────────────────── */
const json = (r, o, cod=200, extra={}) => {
  const t=JSON.stringify(o);
  r.writeHead(cod, {'content-type':'application/json; charset=utf-8',
    'content-length':Buffer.byteLength(t), 'cache-control':'no-store', ...extra});
  r.end(t); };

function corpoDe(pedido, limite=1024*1024){
  return new Promise((ok, mal)=>{
    let t='', n=0;
    pedido.on('data', p=>{ n+=p.length;
      if(n>limite){ mal(new Error('grande demais')); pedido.destroy(); return; }
      t+=p; });
    pedido.on('end', ()=>{ try{ ok(t?JSON.parse(t):{}); }catch(e){ mal(e); } });
    pedido.on('error', mal);
  });
}

const servidor = http.createServer(async (pedido, resposta) => {
  const url = new URL(pedido.url, 'http://x');
  const rota = url.pathname;
  const seguro = (pedido.headers['x-forwarded-proto']||'').includes('https');

  try{
    /* ── a aplicação ── */
    if(pedido.method==='GET' && (rota==='/' || rota==='/index.html')){
      const html = fs.readFileSync(APP);
      resposta.writeHead(200, {'content-type':'text/html; charset=utf-8',
        'content-length':html.length, 'cache-control':'no-cache'});
      return resposta.end(html);
    }
    if(rota==='/api/ping') return json(resposta, {fleetcv:true});

    /* ── entrar ── */
    if(pedido.method==='POST' && rota==='/api/entrar'){
      const {email='', codigo=''} = await corpoDe(pedido, 4096);
      const e=String(email).trim().toLowerCase(), c=String(codigo).trim();
      if(travado(e)) return json(resposta,
        {erro:'Demasiadas tentativas. Espere um quarto de hora.'}, 429);

      const dono=donoDaFrota();
      if(e===String(dono.email).toLowerCase() && c===String(dono.codigo)){
        const token=abrirSessao('dono','dono',dono.nome||'Proprietário');
        return json(resposta, {papel:'dono', id:'dono', nome:dono.nome||'Proprietário'},
          200, {'set-cookie':biscoito(token, seguro)});
      }
      const lista=(ler('frota','condutores')||{}).lista||[];
      const m=lista.find(x=> String(x.email||'').toLowerCase()===e
                          && String(x.codigo||'')===c);
      if(m && m.estado!=='INACTIVO'){
        const token=abrirSessao('condutor', m.id, m.nome||'');
        return json(resposta, {papel:'condutor', id:m.id, nome:m.nome},
          200, {'set-cookie':biscoito(token, seguro)});
      }
      errou(e);
      return json(resposta, {erro:'E-mail ou código errados.'}, 401);
    }

    /* ── sair ── */
    if(pedido.method==='POST' && rota==='/api/sair'){
      const m=/(?:^|;\s*)fcv=([a-f0-9]{64})/.exec(pedido.headers.cookie||'');
      if(m) bd.prepare('DELETE FROM sessoes WHERE token=?').run(m[1]);
      return json(resposta, {ok:true}, 200,
        {'set-cookie':'fcv=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'});
    }

    const s = sessaoDe(pedido);

    /* ── quem sou eu ── */
    if(rota==='/api/eu')
      return json(resposta, s?{papel:s.papel, id:s.quem, nome:s.nome}:{papel:null});

    if(!s) return json(resposta, {erro:'é preciso entrar primeiro'}, 401);

    /* ── tudo o que há, de uma vez, ao abrir ── */
    if(rota==='/api/tudo'){
      return json(resposta, {
        frota: {
          config:     ler('frota','config'),
          carros:     ler('frota','carros'),
          condutores: ler('frota','condutores'),
          exemplos:   ler('frota','exemplos') },
        turnos: todos('turnos', 300),
        vivo:   todos('vivo') });
    }

    /* ── o percurso de um turno, só quando alguém o abre ── */
    if(rota.startsWith('/api/rasto/')){
      const t=decodeURIComponent(rota.slice('/api/rasto/'.length));
      const partes=[];
      for(const {d} of todos('rastos')) if(d.turno===t) partes[d.parte]=d.pts||[];
      let pts=[]; for(const p of partes) if(p) pts=pts.concat(p);
      return json(resposta, {pts});
    }

    /* ── a linha aberta: as novidades chegam por aqui ── */
    if(rota==='/api/eventos'){
      resposta.writeHead(200, {'content-type':'text/event-stream',
        'cache-control':'no-cache', 'connection':'keep-alive',
        'x-accel-buffering':'no'});
      resposta.write('retry: 3000\n\n');
      aVer.add(resposta);
      /* de vez em quando um sinal de vida, senão há redes que cortam */
      const bater=setInterval(()=>{ try{ resposta.write(': ok\n\n'); }
                                    catch(e){} }, 25000);
      pedido.on('close', ()=>{ clearInterval(bater); aVer.delete(resposta); });
      return;
    }

    /* ── escrever ── */
    if(pedido.method==='POST' && rota==='/api/doc'){
      const {c, id, d} = await corpoDe(pedido);
      if(!c||!id||typeof d!=='object'||!d)
        return json(resposta, {erro:'pedido mal formado'}, 400);
      const nao = podeEscrever(s, c, String(id), d);
      if(nao) return json(resposta, {erro:nao}, 403);
      por(c, String(id), d);
      espalhar(c, String(id), d);
      /* Um condutor conduz um carro de cada vez. Se ficou por aqui um
         turno ao vivo antigo dele — o telemóvel morreu, trocou de
         aparelho, o turno nunca foi fechado — sai agora, senão o
         patrão via o mesmo homem em dois sítios ao mesmo tempo. */
      if(c==='vivo' && d.condutorId)
        for(const outro of todos('vivo'))
          if(outro.id!==String(id) && outro.d.condutorId===d.condutorId){
            tirar('vivo', outro.id);
            espalhar('vivo', outro.id, null);
          }
      return json(resposta, {ok:true});
    }

    if(pedido.method==='POST' && rota==='/api/apagar'){
      const {c, id} = await corpoDe(pedido, 4096);
      if(!c||!id) return json(resposta, {erro:'pedido mal formado'}, 400);
      const nao = podeApagar(s, c);
      if(nao) return json(resposta, {erro:nao}, 403);
      tirar(c, String(id));
      espalhar(c, String(id), null);
      return json(resposta, {ok:true});
    }

    return json(resposta, {erro:'não há nada aqui'}, 404);

  }catch(e){
    return json(resposta, {erro:'o servidor não conseguiu: '+e.message}, 500);
  }
});

function biscoito(token, seguro){
  return 'fcv='+token+'; Path=/; Max-Age='+(SESSAO_H*3600)+
         '; HttpOnly; SameSite=Strict'+(seguro?'; Secure':'');
}

servidor.listen(PORTA, () => {
  console.log('FleetCV a trabalhar em http://localhost:'+PORTA);
  console.log('dados em ' + FICHEIRO);
  semearFrota();
  const d=donoDaFrota();
  if(!ler('frota','dono')){
    por('frota','dono', d);
    console.log('proprietário: ' + d.email + ' · código ' + d.codigo);
    console.log('(mude com FLEETCV_DONO_EMAIL e FLEETCV_DONO_CODIGO)');
  }
});

/* De hora a hora: fora as sessões caducadas, e fora os turnos ao vivo
   que já não dão notícias há mais de uma hora. Um telemóvel que morre
   a meio do turno deixa cá um; o percurso e o turno ficam gravados, é
   só a marca de "está a andar agora" que sai. */
setInterval(()=>{ try{
  bd.prepare('DELETE FROM sessoes WHERE expira<?').run(Date.now());
  const limite = Date.now() - 3600*1000;
  for(const {id, d} of todos('vivo'))
    if(!d.momento || d.momento < limite){
      tirar('vivo', id); espalhar('vivo', id, null); }
}catch(e){} }, 3600*1000).unref();

export { servidor, bd };
