-- FleetCV · 004 · Regras do turno (SPEC §5.1, §5.2, §5.3, §5.6)
--
-- NOTA DE SEGURANÇA: na Fase 2, quando isto for para Supabase, estas funções
-- passam a SECURITY DEFINER com dono próprio, para que nenhum cliente consiga
-- levantar a bandeira fleetcv.motor por sua conta. Em Fase 1 ficam simples para
-- serem testáveis.

-- ─── Km já percorridos até um dado momento do turno ──────────────────────────
-- Serve para estimar o quadrante na hora do abastecimento (o motorista não vai
-- fotografar o conta-quilómetros na bomba — seria mais um passo que ele salta).
create or replace function fleetcv.km_gps_m_ate(p_turno uuid, p_momento timestamptz)
returns int language sql stable as $$
  with p as (
    select lat, lon, capturado_em,
           lag(lat) over w as lat0, lag(lon) over w as lon0,
           extract(epoch from capturado_em - lag(capturado_em) over w) as ds
      from fleetcv.ponto_gps
     where turno_id = p_turno and capturado_em <= p_momento
       and coalesce(precisao_m, 0) <= 50
    window w as (order by capturado_em)
  ), s as (
    select fleetcv.distancia_m(lat0, lon0, lat, lon) as d, ds from p where lat0 is not null
  )
  select coalesce(sum(d), 0)::int from s where ds > 0 and (d / ds) * 3.6 <= 180;
$$;

-- ═══ ABRIR TURNO ═════════════════════════════════════════════════════════════
create or replace function fleetcv.abrir_turno(
  p_turno_id        uuid,
  p_carro_id        uuid,
  p_motorista_id    uuid,
  p_km_inicial      int,
  p_aberto_em       timestamptz,
  p_km_inicial_ocr  int default null,
  p_foto_id         uuid default null,
  p_gps_activo      boolean default true,
  p_agora           timestamptz default now()
) returns uuid language plpgsql as $$
declare
  v_org        uuid;
  v_carro      fleetcv.carro%rowtype;
  v_existente  fleetcv.estado_turno;
  v_gap        int;
  v_indisp     boolean;
  v_tolerancia numeric;
  v_ultimo_fecho timestamptz;
begin
  perform set_config('fleetcv.motor', 'on', true);

  -- Idempotência: o telemóvel pode reenviar o mesmo turno depois de ficar sem rede.
  select estado into v_existente from fleetcv.turno where id = p_turno_id;
  if found then
    return p_turno_id;
  end if;

  select * into v_carro from fleetcv.carro where id = p_carro_id;
  if not found then
    raise exception 'Carro % não existe', p_carro_id using errcode = 'P0002';
  end if;
  v_org := v_carro.organizacao_id;

  -- R05 · carro indisponível ou vendido não abre turno
  if v_carro.estado <> 'ACTIVO' then
    raise exception 'Carro % está % e não pode abrir turno', v_carro.matricula, v_carro.estado
      using errcode = 'P0001';
  end if;

  -- R05 · um turno aberto por carro (o índice único garante, mas a mensagem
  -- tem de ser compreensível para quem está na rua)
  if exists (select 1 from fleetcv.turno
              where carro_id = p_carro_id and estado = 'ABERTO') then
    raise exception 'O carro % já tem um turno aberto', v_carro.matricula
      using errcode = 'P0001';
  end if;
  if exists (select 1 from fleetcv.turno
              where motorista_id = p_motorista_id and estado = 'ABERTO') then
    raise exception 'Este motorista já tem um turno aberto noutro carro'
      using errcode = 'P0001';
  end if;

  -- R03 · o quadrante não anda para trás
  if p_km_inicial < v_carro.km_actual then
    raise exception 'Km de abertura (%) é inferior ao último fecho (%). Confirme a foto do quadrante.',
      p_km_inicial, v_carro.km_actual using errcode = 'P0001';
  end if;

  -- R32/R33 · buraco de quilometragem = o carro andou sem turno.
  -- Esta é a regra que funciona mesmo contra quem nunca abre a app.
  -- Calcula-se antes de inserir (precisamos do km anterior do carro), mas o
  -- alerta só se cria depois: um alerta aponta para um turno que já existe.
  v_tolerancia := fleetcv.def_num(v_org, 'gap_km_tolerancia', 3);
  v_gap := p_km_inicial - v_carro.km_actual;

  if v_gap > v_tolerancia then
    select max(coalesce(fechado_em, aberto_em)) into v_ultimo_fecho
      from fleetcv.turno where carro_id = p_carro_id and estado <> 'ANULADO';

    -- R34 · carro na oficina anda km legitimamente: não é alerta, mas fica registado
    select exists (
      select 1 from fleetcv.indisponibilidade
       where carro_id = p_carro_id
         and inicio <= p_aberto_em
         and coalesce(fim, p_aberto_em) >= coalesce(v_ultimo_fecho, inicio)
    ) into v_indisp;
  end if;

  insert into fleetcv.turno (
    id, organizacao_id, carro_id, motorista_id, estado, aberto_em,
    km_inicial, km_inicial_ocr, foto_inicial_id, sem_gps_desde_inicio)
  values (
    p_turno_id, v_org, p_carro_id, p_motorista_id, 'ABERTO', p_aberto_em,
    p_km_inicial, p_km_inicial_ocr, p_foto_id, not p_gps_activo);

  if v_gap > v_tolerancia and not coalesce(v_indisp, false) then
    perform fleetcv.criar_alerta(v_org, 'A19', p_turno_id, p_carro_id, p_motorista_id, null,
      jsonb_build_object('gap_km', v_gap,
                         'km_ultimo_fecho', v_carro.km_actual,
                         'km_abertura', p_km_inicial,
                         'desde', v_ultimo_fecho));
  end if;

  perform fleetcv.criar_alerta(v_org, 'A01', p_turno_id, p_carro_id, p_motorista_id, null,
    jsonb_build_object('km_inicial', p_km_inicial));

  return p_turno_id;
end;
$$;

-- ═══ PONTOS DE GPS ═══════════════════════════════════════════════════════════
create or replace function fleetcv.registar_pontos(
  p_turno_id uuid, p_pontos jsonb, p_agora timestamptz default now()
) returns int language plpgsql as $$
declare
  v_turno   fleetcv.turno%rowtype;
  v_n       int;
  v_mock    int;
  v_desvio  int;
  v_salto   numeric;
  v_limite  numeric;
  v_min     timestamptz;
  v_max     timestamptz;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select * into v_turno from fleetcv.turno where id = p_turno_id;
  if not found then
    raise exception 'Turno % não existe', p_turno_id using errcode = 'P0002';
  end if;
  if v_turno.estado <> 'ABERTO' then
    raise exception 'Turno % está %: não aceita mais pontos', p_turno_id, v_turno.estado
      using errcode = 'P0001';
  end if;

  select min((p ->> 'capturado_em')::timestamptz),
         max((p ->> 'capturado_em')::timestamptz)
    into v_min, v_max
    from jsonb_array_elements(p_pontos) p;

  perform fleetcv.garantir_particao(v_min);
  perform fleetcv.garantir_particao(v_max);

  insert into fleetcv.ponto_gps (
    turno_id, lat, lon, precisao_m, velocidade_kmh, bateria_pct,
    mock, monotonico_ms, desvio_relogio_s, capturado_em, recebido_em)
  select p_turno_id, x.lat, x.lon, x.precisao_m, x.velocidade_kmh, x.bateria_pct,
         coalesce(x.mock, false), x.monotonico_ms, x.desvio_relogio_s,
         x.capturado_em, p_agora
    from jsonb_to_recordset(p_pontos) as x(
      lat double precision, lon double precision, precisao_m int,
      velocidade_kmh numeric, bateria_pct int, mock boolean,
      monotonico_ms bigint, desvio_relogio_s int, capturado_em timestamptz);

  get diagnostics v_n = row_count;

  -- R10 · localização falsa. Não é engano de ninguém: instala-se de propósito.
  select count(*) into v_mock
    from jsonb_to_recordset(p_pontos) as x(mock boolean) where x.mock;
  if v_mock > 0 then
    update fleetcv.turno set mock_detectado = true where id = p_turno_id;
    perform fleetcv.criar_alerta(v_turno.organizacao_id, 'A04', p_turno_id,
      v_turno.carro_id, v_turno.motorista_id, null,
      jsonb_build_object('pontos_falsos', v_mock));
  end if;

  -- R12 · relógio adulterado.
  -- Duas deteções independentes, porque comparar a hora do telemóvel com a do
  -- servidor não serve: em modo offline o atraso é legítimo e não é fraude.
  v_limite := fleetcv.def_num(v_turno.organizacao_id, 'desvio_relogio_s', 300);

  --  (a) desvio medido pelo próprio telemóvel na última sincronização com o servidor
  select max(abs(coalesce(x.desvio_relogio_s, 0))) into v_desvio
    from jsonb_to_recordset(p_pontos) as x(desvio_relogio_s int);

  --  (b) o relógio mexeu a meio do turno: o tempo do sistema saltou, mas o
  --      contador monotónico do Android (que não se pode alterar) não saltou.
  select max(abs(s.d)) into v_salto from (
    select extract(epoch from x.capturado_em - lag(x.capturado_em) over w)
           - (x.monotonico_ms - lag(x.monotonico_ms) over w) / 1000.0 as d
      from jsonb_to_recordset(p_pontos) as x(
        capturado_em timestamptz, monotonico_ms bigint)
    window w as (order by x.capturado_em)
  ) s;

  if coalesce(v_desvio, 0) > v_limite or coalesce(v_salto, 0) > 60 then
    update fleetcv.turno set relogio_suspeito = true where id = p_turno_id;
    perform fleetcv.criar_alerta(v_turno.organizacao_id, 'A06', p_turno_id,
      v_turno.carro_id, v_turno.motorista_id, null,
      jsonb_build_object('desvio_s', v_desvio, 'salto_s', round(coalesce(v_salto, 0))));
  end if;

  return v_n;
end;
$$;

-- ═══ PARAGENS LONGAS FORA DE ZONA (R11) ══════════════════════════════════════
create or replace function fleetcv.detectar_paragens(p_turno uuid)
returns int language plpgsql as $$
declare
  v_turno    fleetcv.turno%rowtype;
  v_limite_s int;
  v_raio     int := 100;      -- quanto o GPS "anda" com o carro parado
  v_p        record;
  v_lat0     double precision;
  v_lon0     double precision;
  v_inicio   timestamptz;
  v_ultimo   timestamptz;
  v_n        int := 0;
begin
  select * into v_turno from fleetcv.turno where id = p_turno;
  v_limite_s := fleetcv.def_num(v_turno.organizacao_id, 'paragem_longa_s', 1200);

  -- Sem zonas definidas não há "fora de zona": calamo-nos em vez de alertar
  -- sobre tudo. Alerta falso é o que faz o dono desistir da app.
  if not exists (select 1 from fleetcv.zona where organizacao_id = v_turno.organizacao_id) then
    return 0;
  end if;

  for v_p in
    select lat, lon, capturado_em from fleetcv.ponto_gps
     where turno_id = p_turno and coalesce(precisao_m, 0) <= 50
     order by capturado_em
  loop
    if v_lat0 is null then
      v_lat0 := v_p.lat; v_lon0 := v_p.lon;
      v_inicio := v_p.capturado_em; v_ultimo := v_p.capturado_em;
      continue;
    end if;

    if fleetcv.distancia_m(v_lat0, v_lon0, v_p.lat, v_p.lon) <= v_raio then
      v_ultimo := v_p.capturado_em;                 -- continua parado
    else
      if extract(epoch from v_ultimo - v_inicio) >= v_limite_s
         and not exists (
           select 1 from fleetcv.zona z
            where z.organizacao_id = v_turno.organizacao_id
              and fleetcv.distancia_m(z.lat, z.lon, v_lat0, v_lon0) <= z.raio_m)
      then
        v_n := v_n + 1;
        perform fleetcv.criar_alerta(v_turno.organizacao_id, 'A05', p_turno,
          v_turno.carro_id, v_turno.motorista_id, null,
          jsonb_build_object('lat', v_lat0, 'lon', v_lon0,
            'minutos', round(extract(epoch from v_ultimo - v_inicio) / 60),
            'desde', v_inicio));
      end if;
      v_lat0 := v_p.lat; v_lon0 := v_p.lon;
      v_inicio := v_p.capturado_em; v_ultimo := v_p.capturado_em;
    end if;
  end loop;

  return v_n;
end;
$$;

-- ═══ FECHAR TURNO ════════════════════════════════════════════════════════════
create or replace function fleetcv.fechar_turno(
  p_turno_id     uuid,
  p_km_final     int,
  p_fechado_em   timestamptz,
  p_km_final_ocr int default null,
  p_foto_id      uuid default null,
  p_agora        timestamptz default now()
) returns void language plpgsql as $$
declare
  v_t          fleetcv.turno%rowtype;
  v_km_quad    int;
  v_km_gps_m   int;
  v_km_gps     numeric;
  v_div_pct    numeric;
  v_sem_gps    int;
  v_maior_gap  int;
  v_max_km     numeric;
  v_bateria    int;
  v_a          record;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select * into v_t from fleetcv.turno where id = p_turno_id;
  if not found then
    raise exception 'Turno % não existe', p_turno_id using errcode = 'P0002';
  end if;
  if v_t.estado <> 'ABERTO' then
    return;                                 -- idempotente: reenvio depois de sincronizar
  end if;

  -- R13
  if p_km_final < v_t.km_inicial then
    raise exception 'Km final (%) é inferior ao inicial (%). Confirme a foto do quadrante.',
      p_km_final, v_t.km_inicial using errcode = 'P0001';
  end if;

  -- R14 · valor implausível é quase sempre erro de leitura, não fraude.
  -- Bloqueia-se e pede-se nova foto, em vez de gravar lixo para sempre.
  v_km_quad := p_km_final - v_t.km_inicial;
  v_max_km  := fleetcv.def_num(v_t.organizacao_id, 'km_max_turno', 500);
  if v_km_quad > v_max_km then
    raise exception 'Km percorridos (%) acima do plausível (%). Confirme a foto do quadrante.',
      v_km_quad, v_max_km using errcode = 'P0001';
  end if;

  v_km_gps_m  := fleetcv.km_gps_m(p_turno_id);
  v_km_gps    := v_km_gps_m / 1000.0;
  v_sem_gps   := fleetcv.segundos_sem_gps(p_turno_id);
  v_maior_gap := fleetcv.maior_intervalo_sem_gps(p_turno_id);

  select bateria_pct into v_bateria from fleetcv.ponto_gps
   where turno_id = p_turno_id order by capturado_em desc limit 1;

  update fleetcv.turno set
    estado           = 'FECHADO',
    fechado_em       = p_fechado_em,
    km_final         = p_km_final,
    km_final_ocr     = p_km_final_ocr,
    foto_final_id    = p_foto_id,
    km_gps_m         = v_km_gps_m,
    duracao_s        = extract(epoch from p_fechado_em - v_t.aberto_em)::int,
    segundos_sem_gps = v_sem_gps,
    bateria_final_pct = v_bateria
  where id = p_turno_id;

  update fleetcv.carro set km_actual = p_km_final where id = v_t.carro_id;

  -- R09 · sem sinal
  if v_maior_gap > fleetcv.def_num(v_t.organizacao_id, 'sem_gps_alerta_s', 900) then
    perform fleetcv.criar_alerta(v_t.organizacao_id, 'A03', p_turno_id,
      v_t.carro_id, v_t.motorista_id, null,
      jsonb_build_object('maior_intervalo_min', round(v_maior_gap / 60.0),
                         'total_min', round(v_sem_gps / 60.0)));
  end if;

  -- R16/R17 · quadrante vs GPS.
  -- A divergência mede-se sobre o quadrante, que é o número declarado.
  -- O GPS fica normalmente 3 a 8% abaixo (perde sinal): isso é normal e não alerta.
  if v_km_quad > 0 then
    v_div_pct := (v_km_quad - v_km_gps) / v_km_quad * 100;

    if v_km_gps > v_km_quad * 1.10 then
      -- GPS à frente do quadrante: ou o quadrante foi mal lido, ou foi mexido
      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A09', p_turno_id,
        v_t.carro_id, v_t.motorista_id, null,
        jsonb_build_object('km_quadrante', v_km_quad, 'km_gps', round(v_km_gps, 1)));
    elsif v_div_pct >= fleetcv.def_num(v_t.organizacao_id, 'divergencia_critica_pct', 25) then
      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A08', p_turno_id,
        v_t.carro_id, v_t.motorista_id, null,
        jsonb_build_object('km_quadrante', v_km_quad, 'km_gps', round(v_km_gps, 1),
                           'divergencia_pct', round(v_div_pct, 1)));
    elsif abs(v_div_pct) >= fleetcv.def_num(v_t.organizacao_id, 'divergencia_aviso_pct', 15) then
      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A07', p_turno_id,
        v_t.carro_id, v_t.motorista_id, null,
        jsonb_build_object('km_quadrante', v_km_quad, 'km_gps', round(v_km_gps, 1),
                           'divergencia_pct', round(v_div_pct, 1)));
    end if;
  end if;

  perform fleetcv.detectar_paragens(p_turno_id);

  -- Estimar o quadrante na hora de cada abastecimento, para a conta do consumo
  for v_a in select id, capturado_em from fleetcv.abastecimento
              where turno_id = p_turno_id order by capturado_em
  loop
    update fleetcv.abastecimento
       set km_no_momento = v_t.km_inicial
           + case when v_km_gps_m > 0
                  then round(fleetcv.km_gps_m_ate(p_turno_id, v_a.capturado_em) / 1000.0)
                  else round(v_km_quad * extract(epoch from v_a.capturado_em - v_t.aberto_em)
                             / greatest(extract(epoch from p_fechado_em - v_t.aberto_em), 1))
             end
     where id = v_a.id;

    perform fleetcv.avaliar_abastecimento_no_fecho(v_a.id);
    perform fleetcv.avaliar_consumo(v_a.id);
  end loop;

  perform fleetcv.criar_alerta(v_t.organizacao_id, 'A02', p_turno_id,
    v_t.carro_id, v_t.motorista_id, null,
    jsonb_build_object('km', v_km_quad, 'km_gps', round(v_km_gps, 1),
                       'combustivel_cve', (select total_combustivel_cts from fleetcv.turno where id = p_turno_id) / 100));

  perform fleetcv.calcular_score(v_t.motorista_id, p_fechado_em::date);
end;
$$;

-- ═══ FECHO AUTOMÁTICO (turno esquecido) ══════════════════════════════════════
-- Sem isto, um turno esquecido grava GPS a noite toda — o que viola o princípio
-- da privacidade — e bloqueia a contabilidade de km do carro.
create or replace function fleetcv.fechar_turnos_abandonados(p_agora timestamptz default now())
returns int language plpgsql as $$
declare v_t record; v_n int := 0; v_ultimo timestamptz; v_bateria int;
begin
  perform set_config('fleetcv.motor', 'on', true);

  for v_t in
    select t.*, o.definicoes from fleetcv.turno t
      join fleetcv.organizacao o on o.id = t.organizacao_id
     where t.estado = 'ABERTO'
  loop
    select max(capturado_em) into v_ultimo from fleetcv.ponto_gps where turno_id = v_t.id;
    select bateria_pct into v_bateria from fleetcv.ponto_gps
     where turno_id = v_t.id order by capturado_em desc limit 1;

    if extract(epoch from p_agora - v_t.aberto_em)
         > fleetcv.def_num(v_t.organizacao_id, 'turno_max_s', 57600)          -- 16 h
       or (v_ultimo is not null
           and extract(epoch from p_agora - v_ultimo)
               > fleetcv.def_num(v_t.organizacao_id, 'inactividade_max_s', 10800))  -- 3 h
    then
      update fleetcv.turno set
        estado            = 'FECHADO_AUTOMATICO',
        fechado_em        = coalesce(v_ultimo, p_agora),
        km_gps_m          = fleetcv.km_gps_m(v_t.id),
        segundos_sem_gps  = fleetcv.segundos_sem_gps(v_t.id),
        duracao_s         = extract(epoch from coalesce(v_ultimo, p_agora) - v_t.aberto_em)::int,
        bateria_final_pct = v_bateria
      where id = v_t.id;

      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A20', v_t.id,
        v_t.carro_id, v_t.motorista_id, null,
        jsonb_build_object('aberto_em', v_t.aberto_em,
                           'ultimo_sinal', v_ultimo,
                           'bateria_final', v_bateria,
                           'telemovel_sem_bateria', coalesce(v_bateria, 100) <= 5));

      perform fleetcv.calcular_score(v_t.motorista_id, p_agora::date);
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end;
$$;

-- ═══ FECHO PELO GESTOR (telemóvel morreu ou partiu) ══════════════════════════
create or replace function fleetcv.fechar_turno_pelo_gestor(
  p_turno_id uuid, p_km_final int, p_gestor uuid, p_fechado_em timestamptz,
  p_nota text default null, p_agora timestamptz default now()
) returns void language plpgsql as $$
declare v_t fleetcv.turno%rowtype;
begin
  perform set_config('fleetcv.motor', 'on', true);
  select * into v_t from fleetcv.turno where id = p_turno_id;

  if v_t.estado not in ('ABERTO','FECHADO_AUTOMATICO') then
    raise exception 'Turno % está % e não pode ser fechado pelo gestor', p_turno_id, v_t.estado
      using errcode = 'P0001';
  end if;
  if p_km_final < v_t.km_inicial then
    raise exception 'Km final (%) inferior ao inicial (%)', p_km_final, v_t.km_inicial
      using errcode = 'P0001';
  end if;

  update fleetcv.turno set
    estado      = 'FECHADO_PELO_GESTOR',
    fechado_em  = p_fechado_em,
    km_final    = p_km_final,
    km_gps_m    = fleetcv.km_gps_m(p_turno_id),
    duracao_s   = extract(epoch from p_fechado_em - v_t.aberto_em)::int,
    fechado_por = p_gestor
  where id = p_turno_id;

  update fleetcv.carro set km_actual = p_km_final where id = v_t.carro_id;

  -- Fica marcado como não-provado: o km foi declarado, não fotografado.
  perform fleetcv.criar_alerta(v_t.organizacao_id, 'A21', p_turno_id,
    v_t.carro_id, v_t.motorista_id, null,
    jsonb_build_object('km_final_declarado', p_km_final, 'gestor', p_gestor, 'nota', p_nota));

  perform fleetcv.calcular_score(v_t.motorista_id, p_fechado_em::date);
end;
$$;

-- ═══ ANULAR (aberto por engano) ══════════════════════════════════════════════
create or replace function fleetcv.anular_turno(
  p_turno_id uuid, p_agora timestamptz default now()
) returns void language plpgsql as $$
declare v_t fleetcv.turno%rowtype; v_km numeric;
begin
  perform set_config('fleetcv.motor', 'on', true);
  select * into v_t from fleetcv.turno where id = p_turno_id;

  if v_t.estado <> 'ABERTO' then
    raise exception 'Só se anula um turno aberto' using errcode = 'P0001';
  end if;
  if extract(epoch from p_agora - v_t.aberto_em) > 300 then
    raise exception 'Um turno só se anula nos primeiros 5 minutos' using errcode = 'P0001';
  end if;

  v_km := fleetcv.km_gps_m(p_turno_id) / 1000.0;
  if v_km > 1 then
    raise exception 'O carro já andou % km: feche o turno em vez de o anular', round(v_km, 1)
      using errcode = 'P0001';
  end if;

  update fleetcv.turno set estado = 'ANULADO', fechado_em = p_agora where id = p_turno_id;
end;
$$;
