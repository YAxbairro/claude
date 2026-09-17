-- Exporta o estado da frota em JSON, no formato que o painel consome.
-- Correr:  psql -X -A -t -d fleetcv -f exportar_painel.sql -o dados.json
with turnos as (
  select t.id, t.aberto_em, t.fechado_em, c.matricula, c.modelo, c.marca,
         u.nome as motorista, split_part(u.nome,' ',1) as primeiro,
         t.km_final - t.km_inicial as km, round(t.km_gps_m/1000.0,1) as km_gps,
         t.km_inicial, t.km_final, t.total_litros, t.total_combustivel_cts/100 as cve,
         t.segundos_sem_gps, t.duracao_s, t.bateria_final_pct,
         coalesce((select jsonb_agg(jsonb_build_object('codigo',a.codigo,'nivel',a.nivel,
                    'descricao',ca.descricao,'dados',a.dados) order by a.nivel desc)
            from fleetcv.alerta a join fleetcv.catalogo_alerta ca on ca.codigo=a.codigo
           where a.turno_id=t.id and a.nivel<>'INFO'), '[]'::jsonb) as alertas
    from fleetcv.turno t
    join fleetcv.carro c on c.id=t.carro_id
    join fleetcv.utilizador u on u.id=t.motorista_id
), detalhe as (
  select id from turnos where matricula='CV-01-AB' and aberto_em::date='2026-09-17'
), rasto as (
  select jsonb_agg(jsonb_build_array(round(lat::numeric,5), round(lon::numeric,5),
                   round(coalesce(velocidade_kmh,0)::numeric,0)) order by capturado_em) as pts
    from (select lat, lon, velocidade_kmh, capturado_em,
                 row_number() over (order by capturado_em) as n
            from fleetcv.ponto_gps where turno_id=(select id from detalhe)) x
   where n % 3 = 0
), ultimo_score as (
  select distinct on (motorista_id) motorista_id, valor, detalhe, janela_ate
    from fleetcv.score_motorista order by motorista_id, janela_ate desc
)
select jsonb_build_object(
  'organizacao', (select jsonb_build_object('nome',nome,'ilha',ilha) from fleetcv.organizacao limit 1),
  'preco_litro', (select preco_cts_litro/100.0 from fleetcv.preco_combustivel where tipo='GASOLINA' limit 1),
  'turnos', (select jsonb_agg(to_jsonb(t) order by t.aberto_em desc) from turnos t),
  'turno_detalhe', (select id from detalhe),
  'rasto', (select pts from rasto),
  'abastecimento_detalhe', (select jsonb_build_object('valor_cve', valor_cts/100,
      'litros', litros, 'litros_ocr', litros_ocr, 'hora', capturado_em,
      'confirmado', confirmado_no_rasto,
      'posto', (select nome from fleetcv.posto where id=posto_id),
      'posto_lat', (select lat from fleetcv.posto where id=posto_id),
      'posto_lon', (select lon from fleetcv.posto where id=posto_id))
    from fleetcv.abastecimento where turno_id=(select id from detalhe)),
  'carros', (select jsonb_agg(jsonb_build_object('matricula',c.matricula,'marca',c.marca,
      'modelo',c.modelo,'km',c.km_actual,'deposito',c.capacidade_deposito_l,
      'consumo', (select round(avg(l100),2) from fleetcv.consumo_janela cj where cj.carro_id=c.id))
      order by c.matricula) from fleetcv.carro c where c.estado='ACTIVO'),
  'scores', (select jsonb_agg(jsonb_build_object('nome',split_part(u.nome,' ',1),
      'completo',u.nome,'valor',s.valor,'detalhe',s.detalhe) order by s.valor)
      from ultimo_score s join fleetcv.utilizador u on u.id=s.motorista_id),
  'consumo', (select jsonb_agg(jsonb_build_object('matricula',c.matricula,
      'l100',round(cj.l100,2),'quando',ab.capturado_em::date) order by ab.capturado_em)
      from fleetcv.consumo_janela cj join fleetcv.carro c on c.id=cj.carro_id
      join fleetcv.abastecimento ab on ab.id=cj.abastecimento_id)
);
