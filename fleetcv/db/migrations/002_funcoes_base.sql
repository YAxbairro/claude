-- FleetCV · 002 · Funções de apoio e imutabilidade
-- Princípio 2 do SPEC: nada se apaga, nada se edita. O histórico é o produto.

-- ─── Geografia (sem PostGIS) ─────────────────────────────────────────────────
-- Haversine. Chega para distâncias de alguns km com erro muito abaixo da
-- precisão do próprio GPS de um telemóvel.
create or replace function fleetcv.distancia_m(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable parallel safe as $$
  select 6371000 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
    * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- ─── Definições por organização (SPEC §15) ───────────────────────────────────
-- Nenhum limite fica fixo no código: no piloto vamos querer calibrar sem
-- publicar nova versão da app.
create or replace function fleetcv.def_num(p_org uuid, p_chave text, p_omissao numeric)
returns numeric language sql stable as $$
  select coalesce((definicoes ->> p_chave)::numeric, p_omissao)
    from fleetcv.organizacao where id = p_org;
$$;

-- ─── Preço oficial do combustível (R21) ──────────────────────────────────────
create or replace function fleetcv.preco_cts_litro(
  p_ilha text, p_tipo fleetcv.tipo_combustivel, p_data date
) returns int language plpgsql stable as $$
declare v_preco int;
begin
  select preco_cts_litro into v_preco
    from fleetcv.preco_combustivel
   where ilha = p_ilha and tipo = p_tipo
     and valido_de <= p_data
     and (valido_ate is null or valido_ate >= p_data)
   order by valido_de desc limit 1;

  if v_preco is null then
    raise exception 'Sem preço de % para % em % (a ARME publica todos os meses)',
      p_tipo, p_ilha, p_data
      using errcode = 'P0002';
  end if;
  return v_preco;
end;
$$;

-- ─── Partições mensais de ponto_gps ──────────────────────────────────────────
-- Chamada antes de inserir. Aos 90 dias a limpeza é um DROP de partição, não um
-- DELETE de milhões de linhas.
create or replace function fleetcv.garantir_particao(p_momento timestamptz)
returns void language plpgsql as $$
declare
  v_inicio date := date_trunc('month', p_momento at time zone 'UTC')::date;
  v_fim    date := (date_trunc('month', p_momento at time zone 'UTC') + interval '1 month')::date;
  v_nome   text := 'ponto_gps_' || to_char(v_inicio, 'YYYY_MM');
begin
  if to_regclass('fleetcv.' || v_nome) is null then
    execute format(
      'create table fleetcv.%I partition of fleetcv.ponto_gps for values from (%L) to (%L)',
      v_nome, v_inicio, v_fim);
  end if;
exception
  when others then null;   -- corrida entre sessões, ou já existe: a DEFAULT apanha
end;
$$;

-- ─── Alertas ─────────────────────────────────────────────────────────────────
-- Agrupamento (SPEC §6.3): o mesmo alerta no mesmo contexto conta ocorrências
-- em vez de criar linhas novas. Um dono com 30 notificações por dia desliga-as.
create or replace function fleetcv.criar_alerta(
  p_org uuid, p_codigo text,
  p_turno uuid default null, p_carro uuid default null,
  p_motorista uuid default null, p_abastecimento uuid default null,
  p_dados jsonb default '{}'
) returns uuid language plpgsql as $$
declare v_nivel fleetcv.nivel_alerta; v_id uuid; v_ocorrido timestamptz;
begin
  select nivel into v_nivel from fleetcv.catalogo_alerta where codigo = p_codigo;
  if v_nivel is null then
    raise exception 'Alerta % não existe no catálogo', p_codigo;
  end if;

  -- O alerta é datado pelo facto, não pela gravação: um turno sincronizado três
  -- dias depois não pode aparecer no relatório de hoje.
  select coalesce(
    (select capturado_em from fleetcv.abastecimento where id = p_abastecimento),
    (select coalesce(fechado_em, aberto_em) from fleetcv.turno where id = p_turno),
    now()) into v_ocorrido;

  insert into fleetcv.alerta (
    organizacao_id, codigo, nivel, turno_id, carro_id,
    motorista_id, abastecimento_id, dados, ocorrido_em)
  values (p_org, p_codigo, v_nivel, p_turno, p_carro,
          p_motorista, p_abastecimento, p_dados, v_ocorrido)
  on conflict (codigo, coalesce(abastecimento_id, turno_id)) do update
    set ocorrencias = fleetcv.alerta.ocorrencias + 1,
        dados       = excluded.dados
  returning id into v_id;

  return v_id;
end;
$$;

-- ─── Imutabilidade ───────────────────────────────────────────────────────────
-- O motor de regras escreve campos calculados (km_no_momento, totais). Fá-lo
-- levantando uma bandeira local à transacção. Nenhum utilizador a consegue pôr,
-- porque só as funções SECURITY DEFINER do motor a levantam.
create or replace function fleetcv.motor_activo() returns boolean
language sql stable as $$
  select coalesce(current_setting('fleetcv.motor', true), 'off') = 'on';
$$;

create or replace function fleetcv.bloquear_escrita() returns trigger
language plpgsql as $$
begin
  if fleetcv.motor_activo() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception '% em %.% não é permitido: registo imutável (SPEC princípio 2)',
    tg_op, tg_table_schema, tg_table_name
    using errcode = 'P0001';
end;
$$;

-- Turno: editável só enquanto ABERTO. Depois de fechado, nem o proprietário lhe toca.
create or replace function fleetcv.bloquear_turno_fechado() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Turnos não se apagam' using errcode = 'P0001';
  end if;
  if old.estado <> 'ABERTO' and not fleetcv.motor_activo() then
    raise exception 'Turno % está % e é imutável', old.id, old.estado
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Alerta: só se pode fechar (quem resolve, como resolveu, e a nota). Mais nada.
create or replace function fleetcv.bloquear_alerta() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Alertas não se apagam' using errcode = 'P0001';
  end if;
  if not fleetcv.motor_activo() and (
       new.codigo   is distinct from old.codigo
    or new.nivel    is distinct from old.nivel
    or new.turno_id is distinct from old.turno_id
    or new.dados    is distinct from old.dados
    or new.criado_em is distinct from old.criado_em) then
    raise exception 'De um alerta só se podem mudar os campos de resolução'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger turno_imutavel before update or delete on fleetcv.turno
  for each row execute function fleetcv.bloquear_turno_fechado();

create trigger ponto_imutavel before update or delete on fleetcv.ponto_gps
  for each row execute function fleetcv.bloquear_escrita();

create trigger abastecimento_imutavel before update or delete on fleetcv.abastecimento
  for each row execute function fleetcv.bloquear_escrita();

create trigger foto_imutavel before update or delete on fleetcv.foto
  for each row execute function fleetcv.bloquear_escrita();

create trigger alerta_so_resolucao before update or delete on fleetcv.alerta
  for each row execute function fleetcv.bloquear_alerta();

-- ─── Quilómetros percorridos segundo o GPS ───────────────────────────────────
-- Filtra o lixo do GPS urbano: pontos imprecisos e saltos impossíveis. Sem este
-- filtro, o GPS "anda" com o carro parado e inventa km que geram alertas falsos.
create or replace function fleetcv.km_gps_m(p_turno uuid) returns int
language sql stable as $$
  with p as (
    select lat, lon, capturado_em,
           lag(lat) over w as lat0,
           lag(lon) over w as lon0,
           extract(epoch from capturado_em - lag(capturado_em) over w) as ds
      from fleetcv.ponto_gps
     where turno_id = p_turno
       and coalesce(precisao_m, 0) <= 50
    window w as (order by capturado_em)
  ), s as (
    select fleetcv.distancia_m(lat0, lon0, lat, lon) as d, ds from p where lat0 is not null
  )
  select coalesce(sum(d), 0)::int from s
   where ds > 0 and (d / ds) * 3.6 <= 180;   -- nada de 180 km/h num táxi
$$;

-- ─── Tempo sem sinal ─────────────────────────────────────────────────────────
-- Conta só as falhas verdadeiras (>5 min). A amostragem normal é de 10 a 60 s,
-- por isso nunca entra aqui.
-- A bateria é que distingue "o telemóvel morreu" de "o motorista desligou":
-- um intervalo que começa logo a seguir a um ponto com bateria ≤5% não conta.
create or replace function fleetcv.segundos_sem_gps(p_turno uuid) returns int
language sql stable as $$
  with p as (
    select capturado_em, bateria_pct,
           lag(capturado_em) over w as anterior,
           lag(bateria_pct)  over w as bateria_anterior
      from fleetcv.ponto_gps where turno_id = p_turno
    window w as (order by capturado_em)
  )
  select coalesce(sum(extract(epoch from capturado_em - anterior)), 0)::int
    from p
   where anterior is not null
     and extract(epoch from capturado_em - anterior) > 300
     and coalesce(bateria_anterior, 100) > 5;
$$;

-- Maior intervalo isolado sem sinal — é este que dispara a R09.
create or replace function fleetcv.maior_intervalo_sem_gps(p_turno uuid) returns int
language sql stable as $$
  with p as (
    select capturado_em, bateria_pct,
           lag(capturado_em) over w as anterior,
           lag(bateria_pct)  over w as bateria_anterior
      from fleetcv.ponto_gps where turno_id = p_turno
    window w as (order by capturado_em)
  )
  select coalesce(max(extract(epoch from capturado_em - anterior)), 0)::int
    from p
   where anterior is not null and coalesce(bateria_anterior, 100) > 5;
$$;
