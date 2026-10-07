/* ─── OS TRÊS TIPOS DE FROTA ─────────────────────────────────
   O FleetCV é um só: a mesma base, a mesma aplicação, o mesmo GPS.
   O tipo da frota (escolhido ao criar a conta, guardado na
   configuração dela) muda as palavras, os módulos que aparecem e as
   contas próprias de cada negócio:

     taxi        o patrão e os condutores, por turnos
     instituicao o gestor do parque e os motoristas, por serviços,
                 com horário, guia de marcha, zona e departamentos
     rentacar    a agência e os alugueres: entrega e devolução com
                 fotografias, km e combustível, e as contas no fim

   As contas daqui são puras (sem ecrã nem rede), para se provarem
   sozinhas (paineis/teste_tipos.mjs). */
function moduloTipos(G){
var TIPOS={
  taxi:{ id:'taxi', nome:'Táxis', um:'Táxi', icone:'🚕',
    gestor:'patrão', Gestor:'Patrão', condutor:'condutor', Condutor:'Condutor',
    condutores:'condutores', Condutores:'Condutores',
    turno:'turno', Turno:'Turno', turnos:'turnos', Turnos:'Turnos',
    frase:'Os táxis da frota: por onde andam, os km e o combustível de cada turno.',
    modulos:{} },
  instituicao:{ id:'instituicao', nome:'Instituições', um:'Instituição', icone:'🏛️',
    gestor:'gestor', Gestor:'Gestor', condutor:'motorista', Condutor:'Motorista',
    condutores:'motoristas', Condutores:'Motoristas',
    turno:'serviço', Turno:'Serviço', turnos:'serviços', Turnos:'Serviços',
    frase:'Os carros de serviço: quem os leva, para onde, porquê, e fora de horas.',
    modulos:{horario:true, guia:true, zona:true, departamentos:true} },
  rentacar:{ id:'rentacar', nome:'Rent-a-car', um:'Rent-a-car', icone:'🔑',
    gestor:'gestor', Gestor:'Gestor', condutor:'funcionário', Condutor:'Funcionário',
    condutores:'funcionários', Condutores:'Funcionários',
    turno:'serviço', Turno:'Serviço', turnos:'serviços', Turnos:'Serviços',
    frase:'Os carros alugados: a entrega e a devolução com fotografias, e as contas certas.',
    modulos:{alugueres:true, zona:true} }
};
function de(t){ return TIPOS[t] || TIPOS.taxi; }

/* zonas já feitas: o centro e o raio (km) */
var ZONAS=[
  {id:'praia', nome:'Cidade da Praia', lat:14.9330, lon:-23.5133, km:12},
  {id:'santiago', nome:'Ilha de Santiago', lat:15.0800, lon:-23.6200, km:45},
  {id:'saovicente', nome:'São Vicente', lat:16.8520, lon:-24.9600, km:16},
  {id:'sal', nome:'Ilha do Sal', lat:16.7400, lon:-22.9300, km:22},
  {id:'boavista', nome:'Boa Vista', lat:16.0900, lon:-22.8100, km:32},
  {id:'fogo', nome:'Ilha do Fogo', lat:14.9300, lon:-24.3700, km:20},
  {id:'santoantao', nome:'Santo Antão', lat:17.0700, lon:-25.1700, km:28}
];
function metros(a1,o1,a2,o2){
  var R=6371000, r=Math.PI/180, da=(a2-a1)*r, dO=(o2-o1)*r;
  var x=Math.sin(da/2)*Math.sin(da/2)+Math.cos(a1*r)*Math.cos(a2*r)*Math.sin(dO/2)*Math.sin(dO/2);
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }

/* O ponto mais longe do centro da zona. null se nunca saiu (ou se não
   há zona). O rasto é [[lat, lon, ms, precisão], …]; os pontos com má
   precisão não contam — um GPS a saltar não é um carro fora da ilha. */
function saiuDaZona(rasto, zona){
  if(!zona || !(zona.km>0) || !(rasto||[]).length) return null;
  var pior=null;
  rasto.forEach(function(p){
    if(p[3]!=null && p[3]>80) return;
    var d=metros(zona.lat, zona.lon, p[0], p[1])/1000;
    if(d>zona.km && (!pior || d>pior.km)) pior={km:d, lat:p[0], lon:p[1], quando:p[2]}; });
  return pior;
}

/* O horário de serviço: {dias:[1..5] (0=domingo), de:'07:30', ate:'18:30'}.
   Hora do telemóvel de quem vê (em Cabo Verde, a de Cabo Verde). */
var DIAS=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
function minutosDe(hhmm){ var m=String(hhmm||'').match(/^(\d{1,2}):(\d{2})$/);
  return m ? (+m[1])*60+(+m[2]) : null; }
function dentroDoHorario(ms, h){
  if(!h) return true;
  var d=new Date(ms), dia=d.getDay(), min=d.getHours()*60+d.getMinutes();
  if((h.dias||[]).indexOf(dia)<0) return false;
  var de=minutosDe(h.de), ate=minutosDe(h.ate);
  if(de==null || ate==null) return true;
  return de<=ate ? (min>=de && min<ate) : (min>=de || min<ate);   /* turno da noite */
}
/* Quanto do turno foi fora do horário: os minutos, e o primeiro
   momento. Com percurso, conta-se ponto a ponto; sem ele, pelas horas
   de começo e fim (de 5 em 5 minutos). */
function foraDoHorario(t, h){
  if(!h || !t || !t.inicio) return null;
  var fim=t.fim||Date.now(), marcas=[];
  var r=(t.rasto||[]).filter(function(p){ return p[2]>=t.inicio && p[2]<=fim; });
  if(r.length>1) marcas=r.map(function(p){ return p[2]; });
  else for(var x=t.inicio; x<=fim; x+=300000) marcas.push(x);
  if(marcas[marcas.length-1]<fim) marcas.push(fim);
  var fora=0, primeiro=null;
  for(var i=0;i<marcas.length;i++){
    if(dentroDoHorario(marcas[i], h)) continue;
    if(primeiro==null) primeiro=marcas[i];
    if(i>0) fora+=Math.min(marcas[i]-marcas[i-1], 600000);
  }
  if(primeiro==null) return null;
  return {minutos:Math.max(1, Math.round(fora/60000)), quando:primeiro,
          dia:DIAS[new Date(primeiro).getDay()]};
}
function horarioEmTexto(h){
  if(!h) return 'sem horário';
  var ds=(h.dias||[]).slice().sort();
  var nomes=ds.map(function(d){ return DIAS[d].slice(0,3); });
  var dias = ds.join()==='1,2,3,4,5' ? 'segunda a sexta'
           : ds.join()==='1,2,3,4,5,6' ? 'segunda a sábado'
           : ds.length===7 ? 'todos os dias' : nomes.join(', ');
  return dias+', '+h.de+'–'+h.ate;
}

/* ─── rent-a-car: as contas de um aluguer ─────────────────────
   a = {saida:{quando, km, comb}, volta:{quando, km, comb}, precoDia,
        kmDia (0 = sem limite), precoKmExtra, extras:[{d, valor}]}
   comb em oitavos do depósito (0 vazio … 8 cheio). Uma hora de
   tolerância na entrega antes de contar outro dia. */
function contaAluguer(a, deposito, precoLitro){
  var s=a.saida||{}, v=a.volta||{};
  var fim=v.quando||Date.now();
  var dias=Math.max(1, Math.ceil((fim-(s.quando!=null?s.quando:fim)-3600000)/86400000));
  var km=(v.km!=null && s.km!=null) ? Math.max(0, v.km-s.km) : 0;
  var incluidos=(a.kmDia>0) ? dias*a.kmDia : null;
  var kmExtra=incluidos!=null ? Math.max(0, km-incluidos) : 0;
  var oitavos=(v.comb!=null && s.comb!=null) ? Math.max(0, s.comb-v.comb) : 0;
  var litros=oitavos/8*(deposito||45);
  var valorDias=dias*(a.precoDia||0);
  var valorKm=Math.round(kmExtra*(a.precoKmExtra||0));
  var valorComb=Math.round(litros*(precoLitro||0));
  var valorExtras=(a.extras||[]).reduce(function(x,e){ return x+(+e.valor||0); },0);
  return {dias:dias, km:km, incluidos:incluidos, kmExtra:kmExtra, valorDias:valorDias,
          valorKm:valorKm, litrosFalta:+litros.toFixed(1), valorComb:valorComb,
          valorExtras:valorExtras, total:valorDias+valorKm+valorComb+valorExtras};
}
function atrasado(a, agora){
  return !!(a && !a.volta && a.previsto && (agora||Date.now()) > a.previsto+3600000);
}
var COMB=['Vazio','1/8','1/4','3/8','1/2','5/8','3/4','7/8','Cheio'];

/* ─── documentos e manutenção (os três tipos) ─────────────────
   Datas em 'AAAA-MM-DD'. Avisa 30 dias antes; caducado é crítico. */
var DOCS=[{k:'seguroAte', nome:'Seguro'}, {k:'inspecaoAte', nome:'Inspecção'},
          {k:'licencaAte', nome:'Licença / alvará'}];
function avisosDoCarro(c, agora){
  var v=[], hoje=agora||Date.now();
  if(!c || c.estado==='PARADO') return v;
  DOCS.forEach(function(d){
    if(!c[d.k]) return;
    var ate=new Date(c[d.k]+'T23:59:59').getTime();
    if(isNaN(ate)) return;
    var dias=Math.floor((ate-hoje)/86400000);
    if(dias<0) v.push({n:'CRITICO', doc:d.nome, dias:dias,
      d:d.nome+' caducado há '+(-dias)+(dias===-1?' dia':' dias')});
    else if(dias<=30) v.push({n:'AVISO', doc:d.nome, dias:dias,
      d:d.nome+(dias===0?' caduca hoje':' caduca em '+dias+(dias===1?' dia':' dias'))});
  });
  if(c.proxOleoKm>0 && !c.kmPorPreencher && c.km>0){
    var falta=c.proxOleoKm-c.km;
    if(falta<=0) v.push({n:'CRITICO', doc:'Óleo', d:'Mudança de óleo passada há '+Math.round(-falta)+' km'});
    else if(falta<=1000) v.push({n:'AVISO', doc:'Óleo', d:'Mudança de óleo daqui a '+Math.round(falta)+' km'});
  }
  return v;
}

/* uma linha de CSV (para o Excel: ponto e vírgula, aspas onde é preciso) */
function csv(linhas){
  return '﻿'+linhas.map(function(l){ return l.map(function(x){
    var s=x==null?'':String(x);
    return /[;"\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }).join(';'); }).join('\r\n');
}

G.FleetTipos={TIPOS:TIPOS, de:de, ZONAS:ZONAS, metros:metros, saiuDaZona:saiuDaZona,
  DIAS:DIAS, dentroDoHorario:dentroDoHorario, foraDoHorario:foraDoHorario,
  horarioEmTexto:horarioEmTexto, contaAluguer:contaAluguer, atrasado:atrasado, COMB:COMB,
  DOCS:DOCS, avisosDoCarro:avisosDoCarro, csv:csv};
}
if(typeof window!=='undefined') moduloTipos(window);
