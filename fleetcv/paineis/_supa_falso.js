/* ════════════════════════════════════════════════════════════
   UM SUPABASE DE MENTIRA, PARA OS TESTES

   Imita o que a aplicação usa do Supabase, incluindo as regras de
   quem pode escrever o quê — que é a parte que interessa provar — e
   as várias frotas: cada uma fechada sobre si, os códigos escondidos
   dos condutores, um e-mail numa frota só. As regras a sério estão no
   esquema.sql e provam-se no provar.sh; isto é para ver a aplicação
   a portar-se bem com elas.

   Guarda no navegador para que dois separadores se vejam, como a
   base verdadeira faz entre telemóveis. Cada separador tem a sua
   sessão (a chave vem do storageKey, como no supabase-js).
   ════════════════════════════════════════════════════════════ */
(function(){
  var RAIZ='sb:', ouvintes=[], canal=null;
  try{ canal=new BroadcastChannel('fleetcv-supa'); }catch(e){}
  var ler=function(k){ try{ var r=localStorage.getItem(RAIZ+k);
    return r?JSON.parse(r):undefined; }catch(e){ return undefined; } };
  var por=function(k,v){ localStorage.setItem(RAIZ+k, JSON.stringify(v)); };
  var tirar=function(k){ localStorage.removeItem(RAIZ+k); };
  var chaves=function(){ var v=[];
    for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i);
      if(k&&k.indexOf(RAIZ)===0) v.push(k.slice(RAIZ.length)); } return v; };
  var kd=function(f,c,id){ return 'd|'+f+'|'+c+'|'+id; };
  var kq=function(f,c,id){ return 'q|'+f+'|'+c+'|'+id; };
  var doc=function(f,c,id){ return ler(kd(f,c,id)); };
  var todasFrotas=function(){ return ler('frotas')||{}; };
  var baralhar=function(c){ return 'h:'+String(c).split('').reverse().join(''); };
  var certo=function(dono, c){
    if(!dono) return false;
    if(dono.hash) return dono.hash===baralhar(c);
    return !!dono.codigo && String(dono.codigo)===c; };

  /* ── um e-mail, uma frota ── */
  var emailNoutra=function(em, frota){
    em=String(em||'').trim().toLowerCase();
    return Object.keys(todasFrotas()).some(function(f){
      if(f===frota) return false;
      var d=doc(f,'frota','dono');
      if(d && String(d.email||'').toLowerCase()===em) return true;
      return ((doc(f,'frota','condutores')||{}).lista||[]).some(function(x){
        return String(x.email||'').toLowerCase()===em; }); }); };

  /* cada aba vê como a sua sessão veria: o crivo do docs_ler */
  function criarCliente(chaveSessao){
    var sessao=null;
    var perfil=function(){ return sessao ? ler('perfil:'+sessao) : null; };
    var podeLer=function(l){
      var pf=perfil();
      if(!pf || !l || l.frota!==pf.frota) return false;
      if(pf.papel!=='dono' && l.coleccao==='frota'
         && (l.id==='dono'||l.id==='condutores')) return false;
      return true; };
    var podeEscrever=function(f, c, id, corpo){
      var pf=perfil();
      if(!pf) return 'sessão por abrir';
      if(f!==pf.frota) return 'new row violates row-level security policy';
      if(pf.papel==='dono'){
        if(c==='frota' && (id==='dono'||id==='equipa'))
          return 'new row violates row-level security policy';
        return null; }
      if(c==='frota') return 'só o proprietário mexe na frota';
      if(c==='turnos'||c==='vivo'){
        if(!corpo || corpo.condutorId!==pf.quem) return 'este turno é de outro condutor';
        var ja=doc(f,'turnos',corpo.id);
        if(c==='turnos' && ja && ja.fim) return 'um turno fechado não se volta a escrever';
        return null; }
      if(c==='rastos'||c==='fotos'){
        var t=doc(f,'turnos',corpo&&corpo.turno);
        if(!t) return 'não há turno com esse nome';
        if(t.condutorId!==pf.quem) return 'isto é de outro condutor';
        return null; }
      return 'não se pode escrever aqui'; };

    /* como no Supabase: cada escuta pode pedir só uma colecção; o que
       a sessão não pode ler nem chega — menos os apagamentos, que
       chegam a toda a gente só com a chave */
    var passaCrivo=function(fl, linha){
      if(!fl) return true;
      var m=String(fl).match(/^coleccao=eq\.(.+)$/);
      if(!m) return true;
      return linha && linha.coleccao===m[1]; };
    var entregar=function(ev, linha){
      if(ev!=='DELETE' && !podeLer(linha)) return;
      ouvintes.forEach(function(o){
        if(o.cliente!==cli || !passaCrivo(o.crivo, linha)) return;
        setTimeout(function(){
          o.fn(ev==='DELETE'
            ? {eventType:ev, new:{}, old:{frota:linha.frota, coleccao:linha.coleccao, id:linha.id}}
            : {eventType:ev, new:linha, old:{}}); },0); }); };

    function gravar(f,c,id,corpo,quando){
      por(kd(f,c,id), corpo);
      por(kq(f,c,id), quando||new Date().toISOString());
      avisarTodos('UPDATE', {frota:f, coleccao:c, id:id, corpo:corpo});
      /* o gatilho da 'equipa': a lista sem códigos, para os condutores */
      if(c==='frota' && id==='condutores'){
        var eq={lista:(corpo.lista||[]).map(function(x){
          var r={id:x.id, nome:x.nome}; if(x.estado) r.estado=x.estado; return r; })};
        por(kd(f,'frota','equipa'), eq);
        por(kq(f,'frota','equipa'), new Date().toISOString());
        avisarTodos('UPDATE', {frota:f, coleccao:'frota', id:'equipa', corpo:eq}); } }

    function tabela(nome){
      var filtros=[], ordem=null, lim=null, umSo=false, apagar=false;
      var api={
        select:function(){ return api; },
        eq:function(c,v){ filtros.push([c,'eq',v]); return api; },
        in:function(c,v){ filtros.push([c,'in',v]); return api; },
        order:function(c,o){ ordem=[c,(o&&o.ascending)?'asc':'desc']; return api; },
        limit:function(n){ lim=n; return api; },
        maybeSingle:function(){ umSo=true; return api; },
        single:function(){ umSo=true; return api; },
        upsert:function(d, op){
          var pf=perfil();
          /* sem frota no pedido, a base põe a de quem escreve */
          var f=d.frota || (pf&&pf.frota);
          if(op && op.onConflict && op.onConflict!=='frota,coleccao,id')
            return Promise.resolve({data:null, error:{message:
              'there is no unique or exclusion constraint matching the ON CONFLICT specification'}});
          var nao=podeEscrever(f, d.coleccao, d.id, d.corpo);
          if(!nao && d.coleccao==='frota' && d.id==='condutores'){
            var repetido=(d.corpo.lista||[]).filter(function(x){
              return x.email && emailNoutra(x.email, f); })[0];
            if(repetido) nao='O e-mail '+repetido.email+' já está a ser usado noutra frota.'; }
          if(nao) return Promise.resolve({data:null, error:{message:nao}});
          gravar(f, d.coleccao, d.id, d.corpo, d.quando);
          return Promise.resolve({data:null, error:null}); },
        delete:function(){ apagar=true; return api; },
        then:function(ok, mal){ return Promise.resolve(correr()).then(ok, mal); },
        catch:function(mal){ return Promise.resolve(correr()).catch(mal); },
        finally:function(fn){ return Promise.resolve(correr()).finally(fn); }
      };

      /* corre a pergunta e devolve sempre {data,error}, como o Supabase */
      function correr(){
        try{
          var pf=perfil();
          if(nome==='perfis')
            return {data: pf?{papel:pf.papel, quem:pf.quem, nome:pf.nome,
                              frota:pf.frota}:null, error:null};
          if(nome==='frotas'){
            var fr=pf ? todasFrotas()[pf.frota] : null;
            return {data: umSo?(fr||null):(fr?[fr]:[]), error:null}; }
          if(apagar){
            var alvo=filtros.filter(function(x){ return x[0]==='coleccao'; })[0];
            var qual=filtros.filter(function(x){ return x[0]==='id'; })[0];
            var c=alvo&&alvo[2], id=qual&&qual[2];
            var f0=pf&&pf.frota, corpo=pf?doc(f0,c,id):null;
            if(!corpo) return {data:null, error:null};
            if(pf.papel!=='dono' && !(c==='vivo' && corpo.condutorId===pf.quem))
              return {data:null, error:null};          /* não vê, não apaga */
            if(pf.papel==='dono' && c==='frota' && (id==='dono'||id==='equipa'))
              return {data:null, error:null};
            tirar(kd(f0,c,id)); tirar(kq(f0,c,id));
            avisarTodos('DELETE', {frota:f0, coleccao:c, id:id});
            return {data:null, error:null}; }
          var v=[];
          chaves().forEach(function(k){
            if(k.indexOf('d|')!==0) return;
            var q=k.split('|'), f=q[1], c=q[2], id=q.slice(3).join('|');
            var corpo=ler(k); if(!corpo) return;
            if(!podeLer({frota:f, coleccao:c, id:id})) return;
            var passa=true;
            filtros.forEach(function(x){
              var campo=x[0], op=x[1], val=x[2];
              var actual = campo==='coleccao'?c : campo==='id'?id : campo==='frota'?f
                : (campo.indexOf('corpo->>')===0
                    ? corpo[campo.slice(8)] : undefined);
              if(op==='eq' && actual!==val) passa=false;
              if(op==='in' && val.indexOf(actual)<0) passa=false; });
            if(passa) v.push({frota:f, coleccao:c, id:id, corpo:corpo,
                              quando:ler(kq(f,c,id))||''}); });
          if(ordem) v.sort(function(a,b){
            /* a data é uma coluna da tabela, não um campo do corpo */
            var x=(ordem[0]==='quando'?a.quando:a.corpo[ordem[0]])||0;
            var y=(ordem[0]==='quando'?b.quando:b.corpo[ordem[0]])||0;
            return ordem[1]==='desc'?(x<y?1:x>y?-1:0):(x<y?-1:x>y?1:0); });
          if(lim) v=v.slice(0,lim);
          v=v.map(function(x){ return {frota:x.frota, coleccao:x.coleccao,
                                       id:x.id, corpo:x.corpo}; });
          return {data: umSo?(v[0]||null):v, error:null};
        }catch(e){ return {data:null, error:{message:String(e)}}; } }

      return api;
    }

    /* ── as portas: entrar, criar conta, mudar o código ── */
    var rpcs={
      sair:function(){ if(sessao) tirar('perfil:'+sessao); return null; },
      entrar:function(a){
        var em=String(a.p_email||'').trim().toLowerCase();
        var co=String(a.p_codigo||'').trim();
        /* a trava do esquema.sql: cinco enganos e fica de castigo */
        var QUARTO=15*60*1000;
        var t=ler('trava:'+em);
        if(t && t.falhas>=5 && (Date.now()-t.ultima)<QUARTO)
          return {erro:'Demasiadas tentativas. Espere um quarto de hora e tente outra vez.'};
        if(t && (Date.now()-t.ultima)>=QUARTO) t=null;
        var fs=todasFrotas(), r=null;
        Object.keys(fs).forEach(function(f){
          if(r) return;
          var d=doc(f,'frota','dono');
          if(d && String(d.email).toLowerCase()===em && certo(d,co)){
            if(fs[f].plano==='suspensa'){ r={erro:'Esta frota está suspensa. '+
              'Fale com a FleetCV pelo WhatsApp.'}; return; }
            por('perfil:'+sessao, {papel:'dono', quem:'dono',
                                   nome:d.nome||'Proprietário', frota:f});
            r={papel:'dono', id:'dono', nome:d.nome||'Proprietário', frota:f}; } });
        if(!r) Object.keys(fs).forEach(function(f){
          if(r) return;
          var m=((doc(f,'frota','condutores')||{}).lista||[]).filter(function(x){
            return String(x.email||'').toLowerCase()===em && String(x.codigo||'')===co
              && x.estado!=='INACTIVO'; })[0];
          if(m){
            por('perfil:'+sessao, {papel:'condutor', quem:m.id, nome:m.nome, frota:f});
            r={papel:'condutor', id:m.id, nome:m.nome, frota:f}; } });
        if(r && !r.erro){ tirar('trava:'+em); return r; }
        if(r) return r;
        por('trava:'+em, {falhas:((t&&t.falhas)||0)+1, ultima:Date.now()});
        return {erro:'E-mail ou código errados.'}; },
      criar_frota:function(a){
        var em=String(a.p_email||'').trim().toLowerCase();
        var co=String(a.p_codigo||'').trim(), nm=String(a.p_nome||'').trim();
        if(!sessao) return {erro:'sessão por abrir'};
        if(nm.length<2) return {erro:'Escreva o seu nome.'};
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))
          return {erro:'Este e-mail não parece estar certo.'};
        if(co.length<6) return {erro:'O código tem de ter pelo menos 6 algarismos ou letras.'};
        if(emailNoutra(em, null))
          return {erro:'Este e-mail já tem conta. Carregue em "Entrar" e use o seu código.'};
        var f='f'+Math.random().toString(16).slice(2,14);
        var nf=String(a.p_frota_nome||'').trim()||'A minha frota';
        var fs=todasFrotas();
        fs[f]={id:f, nome:nf, plano:'ensaio',
               ate:new Date(Date.now()+30*864e5).toISOString(),
               criada:new Date().toISOString()};
        por('frotas', fs);
        gravar(f,'frota','dono',{email:em, hash:baralhar(co), nome:nm});
        gravar(f,'frota','config',{nome:nf, precoLitro:145});
        gravar(f,'frota','carros',{lista:[]});
        gravar(f,'frota','condutores',{lista:[]});
        gravar(f,'frota','exemplos',{quando:Date.now(), nenhum:true});
        por('perfil:'+sessao, {papel:'dono', quem:'dono', nome:nm, frota:f});
        return {papel:'dono', id:'dono', nome:nm, frota:f}; },
      mudar_acesso:function(a){
        var pf=perfil();
        if(!pf || pf.papel!=='dono') return {erro:'Só o proprietário muda isto.'};
        var d=doc(pf.frota,'frota','dono');
        if(!certo(d, String(a.p_codigo_actual||'').trim()))
          return {erro:'O código actual não está certo.'};
        var em=String(a.p_email_novo||'').trim().toLowerCase()||d.email;
        var co=String(a.p_codigo_novo||'').trim();
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))
          return {erro:'Este e-mail não parece estar certo.'};
        if(co && co.length<6)
          return {erro:'O código novo tem de ter pelo menos 6 algarismos ou letras.'};
        if(emailNoutra(em, pf.frota))
          return {erro:'Esse e-mail já está a ser usado noutra conta.'};
        var n={email:em, nome:d.nome, hash: co?baralhar(co):(d.hash||baralhar(d.codigo))};
        gravar(pf.frota,'frota','dono',n);
        return {ok:true, email:em}; },
      apagar_frota:function(a){
        var pf=perfil();
        if(!pf || pf.papel!=='dono') return {erro:'Só o proprietário apaga a conta.'};
        var fs=todasFrotas();
        if((fs[pf.frota]||{}).plano==='fundador')
          return {erro:'A frota fundadora não se apaga pela aplicação.'};
        if(!certo(doc(pf.frota,'frota','dono'), String(a.p_codigo||'').trim()))
          return {erro:'O código não está certo.'};
        chaves().forEach(function(k){
          if(k.indexOf('d|'+pf.frota+'|')===0||k.indexOf('q|'+pf.frota+'|')===0) tirar(k);
          if(k.indexOf('perfil:')===0 && (ler(k)||{}).frota===pf.frota) tirar(k); });
        delete fs[pf.frota]; por('frotas', fs);
        return {ok:true}; },
      email_livre:function(a){
        var pf=perfil();
        if(!pf || pf.papel!=='dono') return null;
        return !emailNoutra(a.p_email, pf.frota); }
    };

    var cli={
      auth:{
        getSession:function(){
          sessao = sessao || localStorage.getItem(chaveSessao);
          return Promise.resolve({data:{session: sessao?{user:{id:sessao}}:null}}); },
        signInAnonymously:function(){
          sessao='anon-'+Math.random().toString(36).slice(2);
          localStorage.setItem(chaveSessao, sessao);
          return Promise.resolve({error:null}); }
      },
      rpc:function(nome, args){
        var f=rpcs[nome];
        if(!f) return Promise.resolve({data:null, error:{message:'função '+nome+' não existe'}});
        return Promise.resolve({data:f(args||{}), error:null}); },
      from:tabela,
      channel:function(){ return {
        on:function(ev, op, fn){
          ouvintes.push({cliente:cli, fn:fn, crivo:op&&op.filter}); return this; },
        subscribe:function(cb){ if(cb) setTimeout(function(){ cb('SUBSCRIBED'); },0);
          return this; } }; },
      _entregar:entregar
    };
    clientes.push(cli);
    return cli;
  }

  var clientes=[];
  function avisarTodos(ev, linha, local){
    clientes.forEach(function(c){ c._entregar(ev, linha); });
    if(local!==false){ try{ if(canal) canal.postMessage({ev:ev, linha:linha}); }
      catch(e){} } }
  try{ if(canal) canal.onmessage=function(m){
    avisarTodos(m.data.ev, m.data.linha, false); }; }catch(e){}

  window.supabase = { createClient:function(url, chave, op){
    var ref=String(url||'').replace(/^https?:\/\//,'').split('.')[0];
    /* window.__outroTelemovel: um separador que finge ser outro
       aparelho a falar com a MESMA base — a base aqui vive no
       navegador, e outro contexto do navegador era outra base */
    var k=(window.__outroTelemovel ? 'tel-'+window.__outroTelemovel+'-' : '') +
          ((op&&op.auth&&op.auth.storageKey) || ('sb-'+ref+'-auth-token'));
    return criarCliente(k); } };

  /* a semente: uma base que já estava no ar antes das várias frotas,
     com a frota do fundador (o código dele ainda à vista, como nas
     bases antigas) e sem a marca dos exemplos — o painel do patrão
     trá-los, como fazia */
  if(!ler('frotas')){
    por('frotas', {f1:{id:'f1', nome:'Táxis Praia, Lda', plano:'fundador', ate:null}});
    var antes=new Date(Date.now()-90*864e5).toISOString();
    var semente=function(id, corpo){ por(kd('f1','frota',id), corpo);
                                     por(kq('f1','frota',id), antes); };
    semente('dono', {email:'patrao@exemplo.cv', codigo:'9999', nome:'Proprietário'});
    semente('config', {nome:'Táxis Praia, Lda', precoLitro:145});
    semente('carros', {lista:[
      {id:'c1',matricula:'ST-28-ED',marca:'Toyota',modelo:'Corolla',ano:2015,
       deposito:50,km:120000,estado:'ACTIVO',proxOleoKm:125000},
      {id:'c2',matricula:'SV-14-AB',marca:'Nissan',modelo:'Almera',ano:2012,
       deposito:46,km:208400,estado:'ACTIVO',proxOleoKm:210000}]});
    var cs=[
      {id:'m1',nome:'António Semedo',email:'antonio@exemplo.cv',codigo:'1234',
       estado:'ACTIVO'},
      {id:'m2',nome:'Jorge Tavares',email:'jorge@exemplo.cv',codigo:'2345',
       estado:'ACTIVO'}];
    semente('condutores', {lista:cs});
    semente('equipa', {lista:cs.map(function(x){
      return {id:x.id, nome:x.nome, estado:x.estado}; })});
  }
})();
