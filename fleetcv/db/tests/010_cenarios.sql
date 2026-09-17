-- FleetCV · Cenários de aceitação da Fase 1 (SPEC §17)
--
-- Critério da fase: o sistema apanha exactamente os alertas esperados, e —
-- tão importante quanto isso — NÃO inventa alertas quando não há nada de errado.

\set ORG    '11111111-1111-1111-1111-111111111111'
\set CARRO1 '22222222-2222-2222-2222-222222222201'
\set CARRO2 '22222222-2222-2222-2222-222222222202'
\set M1     '33333333-3333-3333-3333-333333333301'
\set M2     '33333333-3333-3333-3333-333333333302'
\set PROP   '33333333-3333-3333-3333-333333333309'
\set PLATEAU   '44444444-4444-4444-4444-444444444401'
\set PALMAREJO '44444444-4444-4444-4444-444444444402'

-- Turno curto para construir histórico (usado nos testes de consumo).
create or replace function fleetcv_teste.turno_simples(
  p_carro uuid, p_motorista uuid, p_inicio timestamptz,
  p_km int, p_valor_cts bigint
) returns uuid language plpgsql as $$
declare
  v_t   uuid := gen_random_uuid();
  v_km0 int;
  v_n   int := p_km * 1000 / 750 + 1;
  v_fim timestamptz;
begin
  select km_actual into v_km0 from fleetcv.carro where id = p_carro;
  perform fleetcv.abrir_turno(v_t, p_carro, p_motorista, v_km0, p_inicio,
    v_km0, fleetcv_teste.foto('QUADRANTE_ABERTURA', p_inicio), true, p_inicio);
  perform fleetcv_teste.gerar_rasto(v_t, p_inicio, v_n, 750, 60,
    14.91770, -23.50920, 100, 70, false, 0, 1000000, 10);
  v_fim := p_inicio + make_interval(secs => v_n * 60);
  perform fleetcv.registar_abastecimento(
    gen_random_uuid(), v_t, p_valor_cts, p_inicio + make_interval(secs => v_n * 30),
    null, 'Posto sem coordenadas', null, null,
    fleetcv_teste.foto('TALAO', p_inicio), null, gen_random_uuid()::text);
  perform fleetcv.fechar_turno(v_t, v_km0 + p_km, v_fim, v_km0 + p_km,
    fleetcv_teste.foto('QUADRANTE_FECHO', v_fim), v_fim);
  return v_t;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- C01 · Turno honesto: não pode gerar um único alerta
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t     uuid := gen_random_uuid();
  v_a     uuid := gen_random_uuid();
  v_i     timestamptz := '2026-09-01 06:00:00+00';
  v_meio  timestamptz;
  v_fim   timestamptz;
  v_turno fleetcv.turno%rowtype;
  v_conf  boolean;
  v_score int;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000,
    fleetcv_teste.foto('QUADRANTE_ABERTURA', v_i), true, v_i);

  perform fleetcv_teste.gerar_rasto(v_t, v_i, 1201, 75, 10);      -- 90,0 km
  v_meio := v_i + interval '12010 seconds';

  perform fleetcv_teste.parar(v_t, v_meio, 5, 14.91950, -23.50870, 85, 9000000);

  -- 2.000 CVE a 145,00/litro = 13,793 litros. O talão diz 13,79: bate.
  perform fleetcv.registar_abastecimento(v_a, v_t, 200000, v_meio + interval '2 minutes',
    '44444444-4444-4444-4444-444444444401', null, 14.91950, -23.50870,
    fleetcv_teste.foto('TALAO', v_meio), 13.79, 'talao-c01');

  perform fleetcv_teste.gerar_rasto(v_t, v_meio + interval '6 minutes', 1201, 75, 10,
    14.91770, -23.50920, 85, 60, false, 0, 20000000);            -- mais 90,0 km
  v_fim := v_meio + interval '6 minutes' + interval '12010 seconds';

  perform fleetcv.fechar_turno(v_t, 120180, v_fim, 120180,
    fleetcv_teste.foto('QUADRANTE_FECHO', v_fim), v_fim);

  select * into v_turno from fleetcv.turno where id = v_t;
  select confirmado_no_rasto into v_conf from fleetcv.abastecimento where id = v_a;
  select valor into v_score from fleetcv.score_motorista
   where motorista_id = '33333333-3333-3333-3333-333333333301';

  perform fleetcv_teste.verificar('C01 · turno honesto não gera alertas',
    fleetcv_teste.alertas_serios(v_t) = 0, fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C01 · km do GPS bate com o quadrante',
    abs(v_turno.km_gps_m - 180000) < 3000, 'km_gps_m=' || v_turno.km_gps_m);
  perform fleetcv_teste.verificar('C01 · total de combustível calculado pela app',
    v_turno.total_combustivel_cts = 200000 and v_turno.total_litros = 13.793,
    'cts=' || v_turno.total_combustivel_cts || ' litros=' || v_turno.total_litros);
  perform fleetcv_teste.verificar('C01 · abastecimento confirmado no rasto',
    v_conf, 'confirmado=' || coalesce(v_conf::text, 'nulo'));
  perform fleetcv_teste.verificar('C01 · score mantém-se em 100',
    v_score = 100, 'score=' || v_score);
  perform fleetcv_teste.verificar('C01 · quadrante do carro actualizado',
    (select km_actual from fleetcv.carro
      where id = '22222222-2222-2222-2222-222222222201') = 120180);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C02 · Declara 2.000, o talão diz 1.250
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_a uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-02 06:00:00+00';
  v_dados jsonb;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 601, 75, 10);
  perform fleetcv_teste.parar(v_t, v_i + interval '6010 seconds', 5,
    14.91950, -23.50870, 85, 9000000);

  -- 1.250 CVE dariam 8,62 litros; ele declara 2.000 (13,79 litros).
  perform fleetcv.registar_abastecimento(v_a, v_t, 200000,
    v_i + interval '6010 seconds' + interval '2 minutes',
    '44444444-4444-4444-4444-444444444401', null, 14.91950, -23.50870,
    fleetcv_teste.foto('TALAO', v_i), 8.62, 'talao-c02');

  select dados into v_dados from fleetcv.alerta where abastecimento_id = v_a and codigo = 'A12';

  perform fleetcv_teste.verificar('C02 · talão inflacionado dispara A12',
    fleetcv_teste.tem_alerta(v_t, 'A12'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C02 · o alerta diz quanto era e quanto declarou',
    (v_dados ->> 'valor_declarado_cve')::int = 2000
      and (v_dados ->> 'valor_no_talao_cve')::int between 1240 and 1260,
    v_dados::text);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C03 · Talão de um posto onde o carro nunca esteve
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_a uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-03 06:00:00+00'; v_fim timestamptz;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 601, 75, 10);      -- só no Plateau
  v_fim := v_i + interval '6010 seconds';

  -- Talão do Palmarejo, a 1,6 km do percurso do carro
  perform fleetcv.registar_abastecimento(v_a, v_t, 200000, v_i + interval '3000 seconds',
    '44444444-4444-4444-4444-444444444402', null, 14.91500, -23.52400,
    fleetcv_teste.foto('TALAO', v_i), 13.79, 'talao-c03');

  perform fleetcv.fechar_turno(v_t, 120045, v_fim, 120045, null, v_fim);

  perform fleetcv_teste.verificar('C03 · talão de posto onde o carro não esteve dispara A14',
    fleetcv_teste.tem_alerta(v_t, 'A14'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C03 · abastecimento marcado como não confirmado',
    (select confirmado_no_rasto from fleetcv.abastecimento where id = v_a) = false);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C04 · O carro andou fora de turno (a regra que não precisa de GPS)
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t1 uuid := gen_random_uuid(); v_t2 uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-04 06:00:00+00';
  v_dados jsonb;
begin
  perform fleetcv.abrir_turno(v_t1, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t1, v_i, 601, 75, 10);
  perform fleetcv.fechar_turno(v_t1, 120045, v_i + interval '6010 seconds', 120045, null,
    v_i + interval '6010 seconds');

  -- No dia seguinte o quadrante está 40 km à frente de onde ficou.
  perform fleetcv.abrir_turno(v_t2, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333302', 120085, v_i + interval '1 day',
    120085, null, true, v_i + interval '1 day');

  select dados into v_dados from fleetcv.alerta where turno_id = v_t2 and codigo = 'A19';

  perform fleetcv_teste.verificar('C04 · buraco no quadrante dispara A19',
    fleetcv_teste.tem_alerta(v_t2, 'A19'), fleetcv_teste.alertas(v_t2));
  perform fleetcv_teste.verificar('C04 · o alerta diz quantos km foram',
    (v_dados ->> 'gap_km')::int = 40, v_dados::text);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C05 · GPS desligado 40 minutos
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-05 06:00:00+00';
  v_retoma timestamptz; v_fim timestamptz; v_km int; v_score int; v_seg int;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 601, 75, 10, 14.91770, -23.50920, 100, 90);
  v_retoma := v_i + interval '6000 seconds' + interval '40 minutes';
  perform fleetcv_teste.gerar_rasto(v_t, v_retoma, 601, 75, 10,
    14.91770, -23.50920, 90, 80, false, 0, 30000000);
  v_fim := v_retoma + interval '6010 seconds';

  v_km := round(fleetcv.km_gps_m(v_t) / 1000.0);
  perform fleetcv.fechar_turno(v_t, 120000 + v_km, v_fim, 120000 + v_km, null, v_fim);

  select segundos_sem_gps into v_seg from fleetcv.turno where id = v_t;
  select valor into v_score from fleetcv.score_motorista
   where motorista_id = '33333333-3333-3333-3333-333333333301';

  perform fleetcv_teste.verificar('C05 · 40 min sem sinal dispara A03',
    fleetcv_teste.tem_alerta(v_t, 'A03'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C05 · tempo sem sinal contabilizado',
    v_seg = 2400, 'segundos_sem_gps=' || v_seg);
  perform fleetcv_teste.verificar('C05 · score desce 4 pontos (1 por cada 10 min)',
    v_score = 96, 'score=' || v_score);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C06 · Bateria acabou e o turno nunca fechou
--       Não se penaliza quem ficou sem bateria: a bateria é que prova a causa.
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-06 06:00:00+00';
  v_turno fleetcv.turno%rowtype; v_dados jsonb; v_n int;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  -- 2 horas de rasto com a bateria a descer até 3%
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 721, 75, 10, 14.91770, -23.50920, 100, 3);

  -- Quatro horas depois do último sinal, a limpeza automática corre.
  v_n := fleetcv.fechar_turnos_abandonados(v_i + interval '6 hours');

  select * into v_turno from fleetcv.turno where id = v_t;
  select dados into v_dados from fleetcv.alerta where turno_id = v_t and codigo = 'A20';

  perform fleetcv_teste.verificar('C06 · turno esquecido fecha-se sozinho',
    v_turno.estado = 'FECHADO_AUTOMATICO', 'estado=' || v_turno.estado);
  perform fleetcv_teste.verificar('C06 · dispara A20', fleetcv_teste.tem_alerta(v_t, 'A20'));
  perform fleetcv_teste.verificar('C06 · o sistema percebe que foi a bateria',
    (v_dados ->> 'telemovel_sem_bateria')::boolean, v_dados::text);
  perform fleetcv_teste.verificar('C06 · sem penalização de GPS por ficar sem bateria',
    v_turno.segundos_sem_gps = 0, 'segundos_sem_gps=' || v_turno.segundos_sem_gps);
  perform fleetcv_teste.verificar('C06 · fica sem km final (não foi fotografado)',
    v_turno.km_final is null);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C07 · Litros que não cabem no depósito
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_a uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-07 06:00:00+00'; v_dados jsonb;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 301, 75, 10);
  -- 7.685 CVE = 53 litros num depósito de 50
  perform fleetcv.registar_abastecimento(v_a, v_t, 768500, v_i + interval '1500 seconds',
    null, 'Enacol', 14.91770, -23.50920, fleetcv_teste.foto('TALAO', v_i), null, 'talao-c07');

  select dados into v_dados from fleetcv.alerta where abastecimento_id = v_a and codigo = 'A13';

  perform fleetcv_teste.verificar('C07 · litros acima da capacidade disparam A13',
    fleetcv_teste.tem_alerta(v_t, 'A13'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C07 · o alerta mostra litros e capacidade',
    (v_dados ->> 'litros')::numeric > 52 and (v_dados ->> 'capacidade_l')::numeric = 50,
    v_dados::text);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C08 · Relógio do telemóvel atrasado duas horas
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-08 06:00:00+00';
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 301, 75, 10, 14.91770, -23.50920,
    100, 90, false, -7200);          -- o telemóvel informa o desvio que mediu

  perform fleetcv_teste.verificar('C08 · relógio adulterado dispara A06',
    fleetcv_teste.tem_alerta(v_t, 'A06'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C08 · turno fica marcado como relógio suspeito',
    (select relogio_suspeito from fleetcv.turno where id = v_t));
end $$;

-- C08b · Relógio mexido a meio do turno: o desvio reportado é zero, mas o
--        contador monotónico do Android denuncia o salto.
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-08 06:00:00+00';
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 301, 75, 10, 14.91770, -23.50920,
    100, 90, false, 0, 1000000, 20, 1800);   -- salto de 30 min a meio

  perform fleetcv_teste.verificar('C08b · salto do relógio a meio do turno dispara A06',
    fleetcv_teste.tem_alerta(v_t, 'A06'), fleetcv_teste.alertas(v_t));
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C09 · App de localização falsa
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-09 06:00:00+00';
  v_fim timestamptz; v_score int;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 301, 75, 10, 14.91770, -23.50920,
    100, 90, true);                   -- mock = true
  v_fim := v_i + interval '3010 seconds';
  perform fleetcv.fechar_turno(v_t, 120023, v_fim, 120023, null, v_fim);

  select valor into v_score from fleetcv.score_motorista
   where motorista_id = '33333333-3333-3333-3333-333333333301';

  perform fleetcv_teste.verificar('C09 · localização falsa dispara A04',
    fleetcv_teste.tem_alerta(v_t, 'A04'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C09 · turno fica marcado',
    (select mock_detectado from fleetcv.turno where id = v_t));
  perform fleetcv_teste.verificar('C09 · score cai 50 pontos',
    v_score = 50, 'score=' || v_score);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C10 · Turno inteiro sem rede — o teste mais importante da lista.
--       Ficar sem rede não é falta do motorista e não pode gerar um só alerta.
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_a uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-10 06:00:00+00';
  v_fim timestamptz; v_sinc timestamptz; v_n int;
begin
  v_fim  := v_i + interval '6010 seconds';
  v_sinc := v_fim + interval '3 hours';      -- só apanhou rede à noite, em casa

  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000,
    fleetcv_teste.foto('QUADRANTE_ABERTURA', v_i), true, v_sinc);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 601, 75, 10, 14.91770, -23.50920,
    100, 70, false, 0, 1000000, 20, 0, v_sinc);
  perform fleetcv.registar_abastecimento(v_a, v_t, 200000, v_i + interval '3000 seconds',
    null, 'Enacol', 14.91770, -23.50920, fleetcv_teste.foto('TALAO', v_i),
    13.79, 'talao-c10', v_sinc);
  perform fleetcv.fechar_turno(v_t, 120045, v_fim, 120045,
    fleetcv_teste.foto('QUADRANTE_FECHO', v_fim), v_sinc);

  select count(*) into v_n from fleetcv.ponto_gps where turno_id = v_t;

  perform fleetcv_teste.verificar('C10 · turno offline não gera alertas',
    fleetcv_teste.alertas_serios(v_t) = 0, fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C10 · chegaram todos os pontos',
    v_n = 601, 'pontos=' || v_n);
  perform fleetcv_teste.verificar('C10 · o atraso da sincronização fica registado',
    (select max(recebido_em) - max(capturado_em) from fleetcv.ponto_gps
      where turno_id = v_t) > interval '2 hours');
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C11 · Dois turnos abertos no mesmo carro
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t1 uuid := gen_random_uuid(); v_t2 uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-11 06:00:00+00'; v_bloqueou boolean := false;
begin
  perform fleetcv.abrir_turno(v_t1, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  begin
    perform fleetcv.abrir_turno(v_t2, '22222222-2222-2222-2222-222222222201',
      '33333333-3333-3333-3333-333333333302', 120000, v_i + interval '1 hour',
      120000, null, true, v_i + interval '1 hour');
  exception when others then v_bloqueou := true;
  end;
  perform fleetcv_teste.verificar('C11 · segundo turno no mesmo carro é bloqueado', v_bloqueou);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C12 · O mesmo talão submetido duas vezes
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t1 uuid := gen_random_uuid(); v_t2 uuid := gen_random_uuid();
  v_a1 uuid := gen_random_uuid(); v_a2 uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-12 06:00:00+00'; v_dev uuid; v_n int;
begin
  perform fleetcv.abrir_turno(v_t1, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t1, v_i, 301, 75, 10);
  perform fleetcv.registar_abastecimento(v_a1, v_t1, 200000, v_i + interval '1500 seconds',
    null, 'Enacol', 14.91770, -23.50920, null, null, 'talao-repetido');
  perform fleetcv.fechar_turno(v_t1, 120023, v_i + interval '3010 seconds', 120023, null,
    v_i + interval '3010 seconds');

  perform fleetcv.abrir_turno(v_t2, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120023, v_i + interval '1 day',
    120023, null, true, v_i + interval '1 day');
  v_dev := fleetcv.registar_abastecimento(v_a2, v_t2, 200000,
    v_i + interval '1 day' + interval '1 hour',
    null, 'Enacol', 14.91770, -23.50920, null, null, 'talao-repetido');

  select count(*) into v_n from fleetcv.abastecimento where hash_talao = 'talao-repetido';

  perform fleetcv_teste.verificar('C12 · talão repetido dispara A15',
    fleetcv_teste.tem_alerta(v_t2, 'A15'), fleetcv_teste.alertas(v_t2));
  perform fleetcv_teste.verificar('C12 · o duplicado não é gravado', v_n = 1, 'n=' || v_n);
  perform fleetcv_teste.verificar('C12 · devolve o abastecimento original', v_dev = v_a1);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C13 · O sifão lento: consumo a subir devagar, sem nunca dar um salto
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_i timestamptz := '2026-06-01 06:00:00+00';
  v_t uuid; v_d int := 0; v_a18 boolean; v_a17 boolean;
begin
  -- 8 dias normais: 150 km com 11,25 litros = 7,5 L/100km
  for i in 1..8 loop
    v_t := fleetcv_teste.turno_simples('22222222-2222-2222-2222-222222222201',
      '33333333-3333-3333-3333-333333333301', v_i + make_interval(days => v_d),
      150, 163125);
    v_d := v_d + 1;
  end loop;

  -- Depois começa a subir devagarinho: 8,6 · 8,8 · 9,0 · 9,2 L/100km
  foreach v_d in array array[8,9,10,11] loop
    v_t := fleetcv_teste.turno_simples('22222222-2222-2222-2222-222222222201',
      '33333333-3333-3333-3333-333333333301', v_i + make_interval(days => v_d),
      150, (array[187050, 191400, 195750, 200100])[v_d - 7]);
  end loop;

  select exists (select 1 from fleetcv.alerta where codigo = 'A18'
                  and carro_id = '22222222-2222-2222-2222-222222222201') into v_a18;
  select exists (select 1 from fleetcv.alerta where codigo = 'A17'
                  and carro_id = '22222222-2222-2222-2222-222222222201') into v_a17;

  perform fleetcv_teste.verificar('C13 · subida sustentada dispara A18', v_a18,
    (select string_agg(round(l100,2) || '→' || coalesce(round(desvio_pct,1)::text,'—'), '  '
                       order by criado_em)
       from fleetcv.consumo_janela));
  perform fleetcv_teste.verificar('C13 · nenhum salto isolado dispara A17 (é subtil de propósito)',
    not v_a17);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C14 · Carro na oficina anda km legitimamente: não pode gerar alerta
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t1 uuid := gen_random_uuid(); v_t2 uuid := gen_random_uuid();
  v_i timestamptz := '2026-09-14 06:00:00+00';
begin
  perform fleetcv.abrir_turno(v_t1, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv.fechar_turno(v_t1, 120000, v_i + interval '1 hour', 120000, null,
    v_i + interval '1 hour');

  insert into fleetcv.indisponibilidade (carro_id, inicio, fim, motivo)
  values ('22222222-2222-2222-2222-222222222201',
          v_i + interval '2 hours', v_i + interval '20 hours', 'Oficina: travões');

  perform fleetcv.abrir_turno(v_t2, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120012, v_i + interval '1 day',
    120012, null, true, v_i + interval '1 day');

  perform fleetcv_teste.verificar('C14 · km da oficina não geram A19',
    not fleetcv_teste.tem_alerta(v_t2, 'A19'), fleetcv_teste.alertas(v_t2));
  perform fleetcv_teste.verificar('C14 · mas o quadrante regista os km na mesma',
    (select km_inicial from fleetcv.turno where id = v_t2) = 120012);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C15 · Quadrante diz 240 km, GPS diz 180
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-15 06:00:00+00';
  v_fim timestamptz; v_dados jsonb;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 2401, 75, 10);     -- exactamente 180,000 km
  v_fim := v_i + interval '24010 seconds';
  perform fleetcv.fechar_turno(v_t, 120240, v_fim, 120240, null, v_fim);

  select dados into v_dados from fleetcv.alerta where turno_id = v_t and codigo = 'A08';

  perform fleetcv_teste.verificar('C15 · divergência de 25% dispara A08',
    fleetcv_teste.tem_alerta(v_t, 'A08'), fleetcv_teste.alertas(v_t));
  perform fleetcv_teste.verificar('C15 · o alerta mostra os dois números',
    (v_dados ->> 'km_quadrante')::int = 240
      and (v_dados ->> 'km_gps')::numeric between 179 and 181, v_dados::text);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C16 · Carro novo, pouco histórico: o sistema tem de se calar
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_i timestamptz := '2026-08-01 06:00:00+00'; v_t uuid; v_n int;
begin
  -- Três turnos com consumo altíssimo (20 L/100km), mas sem base de comparação
  for i in 0..2 loop
    v_t := fleetcv_teste.turno_simples('22222222-2222-2222-2222-222222222202',
      '33333333-3333-3333-3333-333333333301', v_i + make_interval(days => i),
      150, 435000);
  end loop;

  select count(*) into v_n from fleetcv.alerta
   where carro_id = '22222222-2222-2222-2222-222222222202' and codigo in ('A17','A18');

  perform fleetcv_teste.verificar('C16 · sem 5 abastecimentos não há alerta de consumo',
    v_n = 0, 'alertas de consumo=' || v_n);
  perform fleetcv_teste.verificar('C16 · mas as janelas já vão sendo calculadas',
    (select count(*) from fleetcv.consumo_janela
      where carro_id = '22222222-2222-2222-2222-222222222202') >= 1);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C17 · Um turno fechado é imutável, nem para o proprietário
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-16 06:00:00+00';
  v_bloqueou boolean := false; v_bloqueou_ponto boolean := false;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 301, 75, 10);
  perform fleetcv.fechar_turno(v_t, 120023, v_i + interval '3010 seconds', 120023, null,
    v_i + interval '3010 seconds');

  -- Fora das funções do motor, a bandeira está baixada: a base de dados recusa.
  perform set_config('fleetcv.motor', 'off', true);
  begin
    update fleetcv.turno set km_final = 120100 where id = v_t;
  exception when others then v_bloqueou := true;
  end;
  begin
    delete from fleetcv.ponto_gps where turno_id = v_t;
  exception when others then v_bloqueou_ponto := true;
  end;

  perform fleetcv_teste.verificar('C17 · não se edita um turno fechado', v_bloqueou);
  perform fleetcv_teste.verificar('C17 · não se apagam pontos de GPS', v_bloqueou_ponto);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- C18 · Um motorista não vê os turnos de outro
-- ════════════════════════════════════════════════════════════════════════════
do $$ begin perform fleetcv_teste.reset(); end $$;
do $$
declare
  v_t uuid := gen_random_uuid(); v_i timestamptz := '2026-09-17 06:00:00+00';
  v_proprios int; v_alheios int; v_do_gestor int;
begin
  perform fleetcv.abrir_turno(v_t, '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301', 120000, v_i, 120000, null, true, v_i);
  perform fleetcv_teste.gerar_rasto(v_t, v_i, 101, 75, 10);

  set local role fleetcv_app;

  perform set_config('fleetcv.utilizador_id', '33333333-3333-3333-3333-333333333301', true);
  select count(*) into v_proprios from fleetcv.turno;

  perform set_config('fleetcv.utilizador_id', '33333333-3333-3333-3333-333333333302', true);
  select count(*) into v_alheios from fleetcv.turno;

  perform set_config('fleetcv.utilizador_id', '33333333-3333-3333-3333-333333333309', true);
  select count(*) into v_do_gestor from fleetcv.turno;

  reset role;

  perform fleetcv_teste.verificar('C18 · o motorista vê o seu turno', v_proprios = 1);
  perform fleetcv_teste.verificar('C18 · não vê o turno do colega',
    v_alheios = 0, 'viu ' || v_alheios);
  perform fleetcv_teste.verificar('C18 · a proprietária vê a frota toda', v_do_gestor = 1);
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Resumo
-- ════════════════════════════════════════════════════════════════════════════
\echo ''
select case when passou then 'OK' else 'FALHA' end as "res",
       nome as "cenário",
       coalesce(detalhe, '') as "detalhe"
  from fleetcv_teste.resultado order by n;

\echo ''
do $$
declare v_ok int; v_total int;
begin
  select count(*) filter (where passou), count(*) into v_ok, v_total
    from fleetcv_teste.resultado;
  raise notice '% de % verificações passaram', v_ok, v_total;
  if v_ok < v_total then
    raise exception 'Fase 1 não passa: % verificações falharam', v_total - v_ok;
  end if;
end $$;
