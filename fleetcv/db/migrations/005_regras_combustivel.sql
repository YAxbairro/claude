-- FleetCV · 005 · Regras do combustível (SPEC §5.4)
--
-- O coração do produto: o motorista deixa de DECLARAR quanto gastou. Regista no
-- momento, no posto, e ao fechar o turno o total já está feito.

-- ═══ FOTO ════════════════════════════════════════════════════════════════════
-- R26 · a mesma foto não passa duas vezes. Se o hash já existir, não se cria
-- nada: devolve-se a foto original e levanta-se o alerta.
create or replace function fleetcv.registar_foto(
  p_id uuid, p_org uuid, p_caminho text, p_hash text, p_tipo fleetcv.tipo_foto,
  p_capturado_em timestamptz, p_lat double precision default null,
  p_lon double precision default null, p_bytes int default null,
  p_turno uuid default null, p_agora timestamptz default now()
) returns uuid language plpgsql as $$
declare v_existente uuid;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select id into v_existente from fleetcv.foto
   where organizacao_id = p_org and hash_sha256 = p_hash;

  if found then
    if v_existente <> p_id then
      perform fleetcv.criar_alerta(p_org, 'A16', p_turno, null, null, null,
        jsonb_build_object('foto_original', v_existente, 'hash', p_hash));
    end if;
    return v_existente;
  end if;

  insert into fleetcv.foto (id, organizacao_id, caminho, hash_sha256, bytes,
                            tipo, lat, lon, capturado_em, recebido_em)
  values (p_id, p_org, p_caminho, p_hash, p_bytes, p_tipo, p_lat, p_lon,
          p_capturado_em, p_agora)
  on conflict (id) do nothing;

  return p_id;
end;
$$;

-- ═══ R24 · O CARRO ESTAVA MESMO NO POSTO? ════════════════════════════════════
-- A verificação mais forte que temos. Um talão pedido a um amigo, ou de outro
-- carro, morre aqui: o rasto do próprio carro tem de mostrar a paragem naquele
-- posto, àquela hora.
--
-- Avalia-se duas vezes: ao registar (pode ainda não haver pontos, porque o lote
-- de GPS só sobe de 90 em 90 segundos) e no fecho do turno, que é a avaliação
-- que conta.
create or replace function fleetcv.confirmar_no_rasto(p_abast uuid)
returns boolean language plpgsql as $$
declare
  v_a       fleetcv.abastecimento%rowtype;
  v_lat     double precision;
  v_lon     double precision;
  v_raio    numeric;
  v_janela  numeric;
  v_ok      boolean;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select * into v_a from fleetcv.abastecimento where id = p_abast;
  v_raio   := fleetcv.def_num(v_a.organizacao_id, 'raio_posto_m', 150);
  v_janela := fleetcv.def_num(v_a.organizacao_id, 'janela_posto_s', 600);

  -- Se o posto é conhecido, confronta-se com as coordenadas OFICIAIS do posto.
  -- Se não é, só se pode confrontar com o sítio onde o telemóvel disse estar —
  -- verificação bem mais fraca, e fica registado que foi essa.
  select lat, lon into v_lat, v_lon from fleetcv.posto where id = v_a.posto_id;
  if v_lat is null then
    v_lat := v_a.lat; v_lon := v_a.lon;
  end if;

  if v_lat is null then
    return null;                                   -- sem coordenadas, não se conclui nada
  end if;

  select exists (
    select 1 from fleetcv.ponto_gps p
     where p.turno_id = v_a.turno_id
       and p.capturado_em between v_a.capturado_em - make_interval(secs => v_janela)
                              and v_a.capturado_em + make_interval(secs => v_janela)
       and fleetcv.distancia_m(p.lat, p.lon, v_lat, v_lon) <= v_raio
  ) into v_ok;

  update fleetcv.abastecimento set confirmado_no_rasto = v_ok where id = p_abast;
  return v_ok;
end;
$$;

-- ═══ REGISTAR ABASTECIMENTO ══════════════════════════════════════════════════
create or replace function fleetcv.registar_abastecimento(
  p_id            uuid,
  p_turno_id      uuid,
  p_valor_cts     bigint,
  p_capturado_em  timestamptz,
  p_posto_id      uuid    default null,
  p_posto_texto   text    default null,
  p_lat           double precision default null,
  p_lon           double precision default null,
  p_foto_talao_id uuid    default null,
  p_litros_ocr    numeric default null,
  p_hash_talao    text    default null,
  p_agora         timestamptz default now()
) returns uuid language plpgsql as $$
declare
  v_t          fleetcv.turno%rowtype;
  v_carro      fleetcv.carro%rowtype;
  v_ilha       text;
  v_preco      int;
  v_litros     numeric(8,3);
  v_duplicado  uuid;
  v_div        numeric;
begin
  perform set_config('fleetcv.motor', 'on', true);

  -- Idempotência
  if exists (select 1 from fleetcv.abastecimento where id = p_id) then
    return p_id;
  end if;

  select * into v_t from fleetcv.turno where id = p_turno_id;
  if not found then
    raise exception 'Turno % não existe', p_turno_id using errcode = 'P0002';
  end if;

  -- R19 · abastecimento só dentro de turno aberto. Fora disso é o gestor que lança.
  if v_t.estado <> 'ABERTO' then
    raise exception 'Turno % está %: abastecimento fora de turno só pelo gestor',
      p_turno_id, v_t.estado using errcode = 'P0001';
  end if;

  select * into v_carro from fleetcv.carro where id = v_t.carro_id;
  select ilha into v_ilha from fleetcv.organizacao where id = v_t.organizacao_id;

  -- R25 · o mesmo talão não passa duas vezes
  if p_hash_talao is not null then
    select id into v_duplicado from fleetcv.abastecimento
     where organizacao_id = v_t.organizacao_id and hash_talao = p_hash_talao;
    if found then
      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A15', p_turno_id,
        v_t.carro_id, v_t.motorista_id, v_duplicado,
        jsonb_build_object('talao', p_hash_talao,
                           'ja_usado_em', v_duplicado,
                           'tentativa_em', p_capturado_em));
      return v_duplicado;
    end if;
  end if;

  -- R21 · litros = valor ÷ preço oficial da ARME.
  -- É isto que tira o poder de inventar: 2.000 escudos são exactamente X litros.
  v_preco  := fleetcv.preco_cts_litro(v_ilha, v_carro.tipo_combustivel, p_capturado_em::date);
  v_litros := round(p_valor_cts::numeric / v_preco, 3);

  insert into fleetcv.abastecimento (
    id, organizacao_id, turno_id, carro_id, motorista_id,
    valor_cts, preco_cts_litro, litros, litros_ocr,
    posto_id, posto_texto, lat, lon, foto_talao_id, hash_talao,
    capturado_em, recebido_em)
  values (
    p_id, v_t.organizacao_id, p_turno_id, v_t.carro_id, v_t.motorista_id,
    p_valor_cts, v_preco, v_litros, p_litros_ocr,
    p_posto_id, p_posto_texto, p_lat, p_lon, p_foto_talao_id, p_hash_talao,
    p_capturado_em, p_agora);

  update fleetcv.turno
     set total_combustivel_cts = total_combustivel_cts + p_valor_cts,
         total_litros          = total_litros + v_litros
   where id = p_turno_id;

  -- R23 · não cabe no depósito. Física, não estatística.
  if v_litros > v_carro.capacidade_deposito_l * 1.05 then
    perform fleetcv.criar_alerta(v_t.organizacao_id, 'A13', p_turno_id,
      v_t.carro_id, v_t.motorista_id, p_id,
      jsonb_build_object('litros', v_litros,
                         'capacidade_l', v_carro.capacidade_deposito_l,
                         'valor_cve', p_valor_cts / 100));
  end if;

  -- R20 · sem talão não há prova
  if p_foto_talao_id is null then
    perform fleetcv.criar_alerta(v_t.organizacao_id, 'A11', p_turno_id,
      v_t.carro_id, v_t.motorista_id, p_id,
      jsonb_build_object('valor_cve', p_valor_cts / 100));
  end if;

  -- R22 · o que o OCR leu no talão tem de bater com o valor pago ao preço oficial
  if p_litros_ocr is not null and v_litros > 0 then
    v_div := abs(p_litros_ocr - v_litros) / v_litros * 100;
    if v_div > fleetcv.def_num(v_t.organizacao_id, 'divergencia_litros_pct', 3) then
      perform fleetcv.criar_alerta(v_t.organizacao_id, 'A12', p_turno_id,
        v_t.carro_id, v_t.motorista_id, p_id,
        jsonb_build_object('litros_talao', p_litros_ocr,
                           'litros_calculados', v_litros,
                           'divergencia_pct', round(v_div, 1),
                           'valor_declarado_cve', p_valor_cts / 100,
                           'valor_no_talao_cve', round(p_litros_ocr * v_preco / 100)));
    end if;
  end if;

  perform fleetcv.confirmar_no_rasto(p_id);     -- melhor esforço; o fecho reavalia

  perform fleetcv.criar_alerta(v_t.organizacao_id, 'A10', p_turno_id,
    v_t.carro_id, v_t.motorista_id, p_id,
    jsonb_build_object('valor_cve', p_valor_cts / 100, 'litros', v_litros));

  return p_id;
end;
$$;

-- ═══ AVALIAÇÃO NO FECHO ══════════════════════════════════════════════════════
-- Só no fecho é que o rasto está completo. É aqui que a R24 vale como prova.
create or replace function fleetcv.avaliar_abastecimento_no_fecho(p_abast uuid)
returns void language plpgsql as $$
declare v_a fleetcv.abastecimento%rowtype; v_ok boolean; v_posto text;
begin
  v_ok := fleetcv.confirmar_no_rasto(p_abast);
  select * into v_a from fleetcv.abastecimento where id = p_abast;

  if v_ok is false then
    select nome into v_posto from fleetcv.posto where id = v_a.posto_id;
    perform fleetcv.criar_alerta(v_a.organizacao_id, 'A14', v_a.turno_id,
      v_a.carro_id, v_a.motorista_id, p_abast,
      jsonb_build_object('posto', coalesce(v_posto, v_a.posto_texto, 'desconhecido'),
                         'hora', v_a.capturado_em,
                         'valor_cve', v_a.valor_cts / 100,
                         'posto_identificado', v_a.posto_id is not null));
  end if;
end;
$$;
