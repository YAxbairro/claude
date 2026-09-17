-- FleetCV · Utilitários de teste
-- Os testes registam resultados numa tabela em vez de abortarem ao primeiro
-- erro: queremos ver o quadro todo de uma vez, não um falhanço de cada vez.

create schema if not exists fleetcv_teste;

create table if not exists fleetcv_teste.resultado (
  n        serial primary key,
  nome     text not null,
  passou   boolean not null,
  detalhe  text
);

create or replace function fleetcv_teste.verificar(
  p_nome text, p_cond boolean, p_detalhe text default null
) returns void language plpgsql as $$
begin
  insert into fleetcv_teste.resultado (nome, passou, detalhe)
  values (p_nome, coalesce(p_cond, false), p_detalhe);
end;
$$;

create or replace function fleetcv_teste.reset() returns void language plpgsql as $$
begin
  perform set_config('fleetcv.motor', 'on', true);
  truncate fleetcv.consumo_janela, fleetcv.score_motorista, fleetcv.alerta,
           fleetcv.abastecimento, fleetcv.ponto_gps, fleetcv.turno, fleetcv.foto
    restart identity cascade;
  delete from fleetcv.indisponibilidade;
  update fleetcv.carro set km_actual = 120000, estado = 'ACTIVO'
   where id = '22222222-2222-2222-2222-222222222201';
  update fleetcv.carro set km_actual = 200000, estado = 'ACTIVO'
   where id = '22222222-2222-2222-2222-222222222202';
end;
$$;

create or replace function fleetcv_teste.tem_alerta(p_turno uuid, p_codigo text)
returns boolean language sql stable as $$
  select exists (select 1 from fleetcv.alerta
                  where turno_id = p_turno and codigo = p_codigo);
$$;

create or replace function fleetcv_teste.alertas(p_turno uuid)
returns text language sql stable as $$
  select coalesce(string_agg(codigo || '(' || nivel || ')', ' ' order by codigo), 'nenhum')
    from fleetcv.alerta where turno_id = p_turno;
$$;

create or replace function fleetcv_teste.alertas_serios(p_turno uuid)
returns int language sql stable as $$
  select count(*)::int from fleetcv.alerta
   where turno_id = p_turno and nivel in ('AVISO','CRITICO');
$$;

-- ─── Gerador de rasto ────────────────────────────────────────────────────────
-- Vaivém de pequena amplitude à volta de um ponto: é assim que se move um táxi
-- dentro da cidade, e mantém o carro dentro da zona de operação.
-- Distância total = (p_pontos − 1) × p_metros, exacta, para os testes poderem
-- afirmar valores em vez de aproximações.
create or replace function fleetcv_teste.gerar_rasto(
  p_turno uuid, p_inicio timestamptz, p_pontos int,
  p_metros numeric default 75, p_intervalo_s int default 10,
  p_lat0 double precision default 14.91770,
  p_lon0 double precision default -23.50920,
  p_bateria_de int default 100, p_bateria_ate int default 60,
  p_mock boolean default false, p_desvio_relogio_s int default 0,
  p_monotonico_base bigint default 1000000,
  p_flip int default 20,
  p_salto_relogio_s int default 0,
  p_recebido_em timestamptz default null
) returns int language plpgsql as $$
declare v_pontos jsonb;
begin
  with s as (
    select i, case when ((i / p_flip) % 2) = 0 then 1 else -1 end as dir
      from generate_series(0, p_pontos - 1) i
  ), c as (
    select i, sum(dir * p_metros / 111320.0) over (order by i) as dlat from s
  )
  select jsonb_agg(jsonb_build_object(
      'lat', p_lat0 + dlat,
      'lon', p_lon0,
      'precisao_m', 10,
      'velocidade_kmh', round(p_metros / p_intervalo_s * 3.6, 1),
      'bateria_pct', round(p_bateria_de
                     + (p_bateria_ate - p_bateria_de) * i::numeric
                       / greatest(p_pontos - 1, 1)),
      'mock', p_mock,
      'monotonico_ms', p_monotonico_base + i::bigint * p_intervalo_s * 1000,
      'desvio_relogio_s', p_desvio_relogio_s,
      -- o salto aplica-se a meio, como quando alguém mexe no relógio a meio do turno
      'capturado_em', p_inicio + make_interval(secs => i * p_intervalo_s)
                      + case when i > p_pontos / 2
                             then make_interval(secs => p_salto_relogio_s)
                             else interval '0' end
    ) order by i) into v_pontos from c;

  return fleetcv.registar_pontos(p_turno, v_pontos,
           coalesce(p_recebido_em, p_inicio + make_interval(secs => p_pontos * p_intervalo_s)));
end;
$$;

-- Paragem para abastecer: pontos parados nas coordenadas do posto.
create or replace function fleetcv_teste.parar(
  p_turno uuid, p_inicio timestamptz, p_minutos int,
  p_lat double precision, p_lon double precision,
  p_bateria int default 80, p_monotonico_base bigint default 9000000,
  p_recebido_em timestamptz default null
) returns int language plpgsql as $$
declare v_pontos jsonb;
begin
  select jsonb_agg(jsonb_build_object(
      'lat', p_lat, 'lon', p_lon, 'precisao_m', 8, 'velocidade_kmh', 0,
      'bateria_pct', p_bateria, 'mock', false,
      'monotonico_ms', p_monotonico_base + i::bigint * 60000,
      'desvio_relogio_s', 0,
      'capturado_em', p_inicio + make_interval(secs => i * 60)
    ) order by i) into v_pontos
    from generate_series(0, p_minutos) i;

  return fleetcv.registar_pontos(p_turno, v_pontos,
           coalesce(p_recebido_em, p_inicio + make_interval(mins => p_minutos)));
end;
$$;

-- Foto de conveniência para os testes (hash único por omissão).
create or replace function fleetcv_teste.foto(
  p_tipo fleetcv.tipo_foto, p_quando timestamptz, p_hash text default null,
  p_turno uuid default null
) returns uuid language sql as $$
  select fleetcv.registar_foto(
    gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
    'fotos/teste.jpg', coalesce(p_hash, gen_random_uuid()::text),
    p_tipo, p_quando, null, null, 250000, p_turno);
$$;
