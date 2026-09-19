/* ════════════════════════════════════════════════════════════
   UM CLAUDE DE MENTIRA, PARA OS TESTES

   A base de dados do Claude devolve os documentos CONGELADOS — está
   escrito no contrato dela: "delivered snapshots and their data() are
   frozen". Quem tentar escrever por cima de um leva um erro e pára a
   meio, sem dizer nada.

   O servidor devolve objectos novos a cada leitura, por isso lá nada
   disto se via. Era por isso que os testes passavam todos e a
   aplicação publicada não guardava nada.

   Este simulador congela tudo, como o verdadeiro. Se a aplicação
   passar aqui, passa lá.
   ════════════════════════════════════════════════════════════ */
(function(){
  var loja={}, ouvintes=[];
  var gelar=function(o){
    if(o && typeof o==='object'){
      Object.keys(o).forEach(function(k){ gelar(o[k]); });
      Object.freeze(o);
    }
    return o; };
  var copia=function(o){ return JSON.parse(JSON.stringify(o)); };
  var tocar=function(){ ouvintes.slice().forEach(function(f){
    setTimeout(f,0); }); };

  function instantaneo(cam){
    var d=loja[cam];
    return Object.freeze({ id:cam.split('/').pop(), exists:!!d,
      data:function(){ return d?gelar(copia(d)):undefined; },
      metadata:{fromCache:false, hasPendingWrites:false} });
  }
  function docRef(cam){
    return {
      id:cam.split('/').pop(), path:cam,
      get:function(){ return Promise.resolve(instantaneo(cam)); },
      set:function(d){
        if(!d||typeof d!=='object'||Array.isArray(d))
          return Promise.reject({code:'invalid_argument', message:'corpo tem de ser objecto'});
        var t=JSON.stringify(d);
        if(t.length>256*1024)
          return Promise.reject({code:'invalid_argument', message:'documento grande demais'});
        loja[cam]=JSON.parse(t); tocar(); return Promise.resolve(); },
      update:function(d){ if(!loja[cam])
          return Promise.reject({code:'invalid_argument', message:'não existe'});
        Object.keys(d).forEach(function(k){ loja[cam][k]=copia(d[k]); });
        tocar(); return Promise.resolve(); },
      delete:function(){ delete loja[cam]; tocar(); return Promise.resolve(); },
      acquire:function(){ return Promise.resolve({acquired:true, holder:'x'}); },
      onSnapshot:function(fn, err){
        var dar=function(){ try{ fn(instantaneo(cam)); }catch(e){
          console.error('ERRO NO OUVINTE:', e && e.message); } };
        ouvintes.push(dar); setTimeout(dar,0);
        return function(){ ouvintes=ouvintes.filter(function(x){ return x!==dar; }); }; },
      collection:function(s){ return colRef(cam+'/'+s); }
    };
  }
  function colRef(cam, filtros, ordem, lim){
    filtros=filtros||[];
    var apanhar=function(){
      var v=[];
      Object.keys(loja).forEach(function(k){
        var pre=cam+'/';
        if(k.indexOf(pre)!==0) return;
        if(k.slice(pre.length).indexOf('/')>=0) return;
        var d=loja[k];
        for(var i=0;i<filtros.length;i++){
          var f=filtros[i];
          if(f[1]==='=='&&d[f[0]]!==f[2]) return;
        }
        v.push(instantaneo(k)); });
      if(ordem) v.sort(function(a,b){
        var x=a.data()[ordem[0]]||0, y=b.data()[ordem[0]]||0;
        return ordem[1]==='desc'?y-x:x-y; });
      if(lim) v=v.slice(0,lim);
      return v; };
    return {
      path:cam,
      where:function(c,o,val){ return colRef(cam, filtros.concat([[c,o,val]]), ordem, lim); },
      orderBy:function(c,d){ return colRef(cam, filtros, [c,d||'asc'], lim); },
      limit:function(n){ return colRef(cam, filtros, ordem, n); },
      doc:function(id){ return docRef(cam+'/'+(id||('x'+Math.random().toString(36).slice(2)))); },
      add:function(d){ var r=this.doc(); return r.set(d).then(function(){ return r; }); },
      get:function(){ var v=apanhar();
        return Promise.resolve(Object.freeze({docs:v, size:v.length, empty:!v.length,
          docChanges:function(){ return []; },
          metadata:{fromCache:false, hasPendingWrites:false}})); },
      onSnapshot:function(fn, err){
        var dar=function(){ var v=apanhar();
          try{ fn(Object.freeze({docs:v, size:v.length, empty:!v.length,
            docChanges:function(){ return []; },
            metadata:{fromCache:false, hasPendingWrites:false}})); }
          catch(e){ console.error('ERRO NO OUVINTE:', e && e.message); } };
        ouvintes.push(dar); setTimeout(dar,0);
        return function(){ ouvintes=ouvintes.filter(function(x){ return x!==dar; }); }; }
    };
  }

  window.claude = { use:function(nome){
    if(nome==='db') return Promise.resolve(Object.freeze({
      doc:function(p){ return docRef(p); },
      collection:function(p){ return colRef(p); } }));
    if(nome==='user') return Promise.resolve(Object.freeze({
      isOwner:function(){ return true; }, canEdit:function(){ return true; },
      can:function(){ return true; }, id:function(){ return Promise.resolve('u1'); } }));
    return Promise.resolve(null);
  }};
})();
