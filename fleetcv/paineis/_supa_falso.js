/* ════════════════════════════════════════════════════════════
   UM SUPABASE DE MENTIRA, PARA OS TESTES

   Imita o que a aplicação usa do Supabase, incluindo as regras de
   quem pode escrever o quê — que é a parte que interessa provar.
   Guarda no navegador para que dois separadores se vejam, como a
   base verdadeira faz entre telemóveis.
   ════════════════════════════════════════════════════════════ */
(function(){
  var RAIZ='sb:', ouvintes=[], canal=null, sessao=null;
  try{ canal=new BroadcastChannel('fleetcv-supa'); }catch(e){}
  var ler=function(k){ try{ var r=localStorage.getItem(RAIZ+k);
    return r?JSON.parse(r):undefined; }catch(e){ return undefined; } };
  var por=function(k,v){ localStorage.setItem(RAIZ+k, JSON.stringify(v)); };
  var tirar=function(k){ localStorage.removeItem(RAIZ+k); };
  var chaves=function(){ var v=[];
    for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i);
      if(k&&k.indexOf(RAIZ)===0) v.push(k.slice(RAIZ.length)); } return v; };
  /* como no Supabase: cada escuta pode pedir só uma colecção, e o
     que não passa no crivo nem chega ao telemóvel */
  var passaCrivo=function(f, linha){
    if(!f) return true;
    var m=String(f).match(/^coleccao=eq\.(.+)$/);
    if(!m) return true;
    return linha && linha.coleccao===m[1]; };
  var tocar=function(ev, linha, local){
    ouvintes.slice().forEach(function(o){
      if(!passaCrivo(o.crivo, linha)) return;
      setTimeout(function(){
        o.fn({eventType:ev, new:linha, old:linha}); },0); });
    if(local!==false){ try{ if(canal) canal.postMessage({ev:ev, linha:linha}); }
      catch(e){} } };
  try{ if(canal) canal.onmessage=function(m){
    tocar(m.data.ev, m.data.linha, false); }; }catch(e){}

  /* ── as regras, as mesmas do esquema.sql ── */
  var perfil=function(){ return sessao ? ler('perfil:'+sessao) : null; };
  var podeEscrever=function(c, corpo){
    var pf=perfil();
    if(!pf) return 'sessão por abrir';
    if(pf.papel==='dono') return null;
    if(c==='frota') return 'só o proprietário mexe na frota';
    if(c==='turnos'||c==='vivo'){
      if(!corpo || corpo.condutorId!==pf.quem) return 'este turno é de outro condutor';
      var ja=ler('docs:turnos:'+corpo.id);
      if(c==='turnos' && ja && ja.fim) return 'um turno fechado não se volta a escrever';
      return null; }
    if(c==='rastos'||c==='fotos'){
      var t=ler('docs:turnos:'+(corpo&&corpo.turno));
      if(!t) return 'não há turno com esse nome';
      if(t.condutorId!==pf.quem) return 'isto é de outro condutor';
      return null; }
    return 'não se pode escrever aqui'; };

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
      upsert:function(d){
        var nao=podeEscrever(d.coleccao, d.corpo);
        if(nao) return Promise.resolve({data:null, error:{message:nao}});
        por('docs:'+d.coleccao+':'+d.id, d.corpo);
        por('quando:'+d.coleccao+':'+d.id, d.quando||new Date().toISOString());
        tocar('UPDATE', {coleccao:d.coleccao, id:d.id, corpo:d.corpo});
        return Promise.resolve({data:null, error:null}); },
      delete:function(){ apagar=true; return api; },
      then:function(ok, mal){ return Promise.resolve(correr()).then(ok, mal); },
      catch:function(mal){ return Promise.resolve(correr()).catch(mal); },
      finally:function(f){ return Promise.resolve(correr()).finally(f); }
    };

    /* corre a pergunta e devolve sempre {data,error}, como o Supabase */
    function correr(){
      try{
        if(apagar){
          var alvo=filtros.filter(function(f){ return f[0]==='coleccao'; })[0];
          var qual=filtros.filter(function(f){ return f[0]==='id'; })[0];
          var c=alvo&&alvo[2], id=qual&&qual[2];
          var corpo=ler('docs:'+c+':'+id);
          var pf0=perfil();
          if(!pf0 || (pf0.papel!=='dono' && !(c==='vivo'&&corpo&&
              corpo.condutorId===pf0.quem)))
            return {data:null, error:{message:'só o proprietário pode apagar'}};
          tirar('docs:'+c+':'+id);
          tocar('DELETE', {coleccao:c, id:id});
          return {data:null, error:null}; }
        if(nome==='perfis'){
          var pf=perfil();
          return {data: pf?{papel:pf.papel, quem:pf.quem, nome:pf.nome}:null,
                  error:null}; }
        var v=[];
        chaves().forEach(function(k){
          if(k.indexOf('docs:')!==0) return;
          var q=k.split(':'), c=q[1], id=q.slice(2).join(':');
          var corpo=ler(k); if(!corpo) return;
          var passa=true;
          filtros.forEach(function(f){
            var campo=f[0], op=f[1], val=f[2];
            var actual = campo==='coleccao'?c : campo==='id'?id
              : (campo.indexOf('corpo->>')===0
                  ? corpo[campo.slice(8)] : undefined);
            if(op==='eq' && actual!==val) passa=false;
            if(op==='in' && val.indexOf(actual)<0) passa=false; });
          if(passa) v.push({coleccao:c, id:id, corpo:corpo,
                            quando:ler('quando:'+c+':'+id)||''}); });
        if(ordem) v.sort(function(a,b){
          /* a data é uma coluna da tabela, não um campo do corpo */
          var x=(ordem[0]==='quando'?a.quando:a.corpo[ordem[0]])||0;
          var y=(ordem[0]==='quando'?b.quando:b.corpo[ordem[0]])||0;
          return ordem[1]==='desc'?(x<y?1:x>y?-1:0):(x<y?-1:x>y?1:0); });
        if(lim) v=v.slice(0,lim);
        v=v.map(function(x){ return {coleccao:x.coleccao, id:x.id, corpo:x.corpo}; });
        return {data: umSo?(v[0]||null):v, error:null};
      }catch(e){ return {data:null, error:{message:String(e)}}; } }

    return api;
  }

  window.supabase = { createClient:function(){
    return {
      auth:{
        getSession:function(){
          sessao = sessao || localStorage.getItem('sb-sessao');
          return Promise.resolve({data:{session: sessao?{user:{id:sessao}}:null}}); },
        signInAnonymously:function(){
          sessao='anon-'+Math.random().toString(36).slice(2);
          localStorage.setItem('sb-sessao', sessao);
          return Promise.resolve({error:null}); }
      },
      rpc:function(nome, args){
        if(nome==='sair'){ if(sessao) tirar('perfil:'+sessao);
          return Promise.resolve({error:null}); }
        if(nome!=='entrar') return Promise.resolve({data:null, error:null});
        var em=String(args.p_email||'').trim().toLowerCase();
        var co=String(args.p_codigo||'').trim();
        /* a trava do esquema.sql: cinco enganos e fica de castigo */
        var QUARTO=15*60*1000;
        var t=ler('trava:'+em);
        if(t && t.falhas>=5 && (Date.now()-t.ultima)<QUARTO)
          return Promise.resolve({data:{erro:'Demasiadas tentativas. Espere '+
            'um quarto de hora e tente outra vez.'}, error:null});
        if(t && (Date.now()-t.ultima)>=QUARTO) t=null;
        var falhou=function(){
          por('trava:'+em, {falhas:((t&&t.falhas)||0)+1, ultima:Date.now()});
          return Promise.resolve({data:{erro:'E-mail ou código errados.'},
                                  error:null}); };
        var dono=ler('docs:frota:dono');
        if(dono && String(dono.email).toLowerCase()===em && String(dono.codigo)===co){
          var pd={papel:'dono', quem:'dono', nome:dono.nome||'Proprietário'};
          por('perfil:'+sessao, pd); tirar('trava:'+em);
          return Promise.resolve({data:{papel:'dono', id:'dono', nome:pd.nome},
                                  error:null}); }
        var cs=(ler('docs:frota:condutores')||{}).lista||[];
        var m=cs.filter(function(x){
          return String(x.email||'').toLowerCase()===em && String(x.codigo||'')===co
            && x.estado!=='INACTIVO'; })[0];
        if(m){ por('perfil:'+sessao, {papel:'condutor', quem:m.id, nome:m.nome});
          tirar('trava:'+em);
          return Promise.resolve({data:{papel:'condutor', id:m.id, nome:m.nome},
                                  error:null}); }
        return falhou(); },
      from:tabela,
      channel:function(){ return {
        on:function(ev, op, fn){
          ouvintes.push({fn:fn, crivo:op&&op.filter}); return this; },
        subscribe:function(){ return this; } }; }
    }; } };

  /* a semente que o esquema.sql faz no Supabase */
  if(!ler('docs:frota:dono')){
    /* a frota nasce primeiro: é a mais antiga de todas */
    ['dono','config','carros','condutores'].forEach(function(k){
      por('quando:frota:'+k, new Date(Date.now()-90*864e5).toISOString()); });
    por('docs:frota:dono', {email:'patrao@exemplo.cv', codigo:'9999',
                            nome:'Proprietário'});
    por('docs:frota:config', {nome:'Táxis Praia, Lda', precoLitro:145});
    por('docs:frota:carros', {lista:[
      {id:'c1',matricula:'ST-28-ED',marca:'Toyota',modelo:'Corolla',ano:2015,
       deposito:50,km:120000,estado:'ACTIVO',proxOleoKm:125000},
      {id:'c2',matricula:'SV-14-AB',marca:'Nissan',modelo:'Almera',ano:2012,
       deposito:46,km:208400,estado:'ACTIVO',proxOleoKm:210000}]});
    por('docs:frota:condutores', {lista:[
      {id:'m1',nome:'António Semedo',email:'antonio@exemplo.cv',codigo:'1234',
       estado:'ACTIVO'},
      {id:'m2',nome:'Jorge Tavares',email:'jorge@exemplo.cv',codigo:'2345',
       estado:'ACTIVO'}]});
  }
})();
