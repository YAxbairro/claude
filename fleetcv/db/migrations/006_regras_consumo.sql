-- FleetCV · 006 · Consumo (SPEC §5.5)
--
-- A única defesa contra o desvio para bidão. Nenhuma foto o apanha: abastecer 40
-- litros e meter 25 no carro produz um talão perfeitamente verdadeiro. Só os
-- números ao longo de semanas denunciam.
--
-- Método tanque-a-tanque: o combustível metido em A2 e A3 é o que levou o carro
-- de A1 até A3. Por isso a janela tem N abastecimentos e usa N−1 quantidades.
-- Calcular consumo turno a turno não significa nada — com abastecimentos
-- parciais o depósito nunca está no mesmo nível em dois dias seguidos.

create or replace function fleetcv.avaliar_consumo(p_abast uuid)
returns void language plpgsql as $$
declare
  v_a        fleetcv.abastecimento%rowtype;
  v_carro    fleetcv.carro%rowtype;
  v_min_n    int;
  v_janela   record;
  v_ref      numeric;
  v_ref_n    int;
  v_desvio   numeric;
  v_seguidas int;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select * into v_a from fleetcv.abastecimento where id = p_abast;
  if v_a.km_no_momento is null then
    return;                                    -- ainda não sabemos o quadrante
  end if;
  select * into v_carro from fleetcv.carro where id = v_a.carro_id;

  -- Janela: os 3 últimos abastecimentos; alarga-se para trás (até 6) enquanto
  -- o percurso for curto de mais para a conta significar alguma coisa.
  with hist as (
    select id, litros, km_no_momento, capturado_em,
           row_number() over (order by capturado_em desc) as n
      from fleetcv.abastecimento
     where carro_id = v_a.carro_id
       and km_no_momento is not null
       and capturado_em <= v_a.capturado_em
  ), janelas as (
    select h.n as tamanho,
           (select max(km_no_momento) from hist where n = 1)
             - h.km_no_momento                                   as km,
           (select sum(litros) from hist h2 where h2.n < h.n)     as litros
      from hist h where h.n between 3 and 6
  )
  select km, litros into v_janela
    from janelas
   where km >= 100 or tamanho = 6
   order by tamanho limit 1;

  if v_janela.km is null or v_janela.km <= 0 or v_janela.litros is null then
    return;
  end if;

  -- R29 · antes de 5 abastecimentos o sistema está a aprender e cala-se.
  -- Um motorista novo não pode apanhar com um alerta por falta de histórico.
  v_min_n := fleetcv.def_num(v_a.organizacao_id, 'min_abastecimentos_base', 5);

  -- R28 · a referência é a média móvel do próprio carro a 90 dias, nunca um
  -- valor de catálogo: um carro velho bebe mais, e isso não é fraude.
  with base as (
    select id, litros, km_no_momento, capturado_em,
           row_number() over (order by capturado_em) as n
      from fleetcv.abastecimento
     where carro_id = v_a.carro_id
       and km_no_momento is not null
       and capturado_em < v_a.capturado_em
       and capturado_em >= v_a.capturado_em - interval '90 days'
  )
  select count(*),
         case when max(km_no_momento) - min(km_no_momento) > 0
              then sum(litros) filter (where n > 1)
                   / (max(km_no_momento) - min(km_no_momento)) * 100
         end
    into v_ref_n, v_ref
    from base;

  if v_ref_n < v_min_n then
    v_ref := null;                              -- sem base, sem alerta
  end if;

  insert into fleetcv.consumo_janela (
    carro_id, abastecimento_id, litros, km, l100, referencia_l100, desvio_pct)
  values (
    v_a.carro_id, p_abast, v_janela.litros, v_janela.km,
    round(v_janela.litros / v_janela.km * 100, 2), v_ref,
    case when v_ref > 0
         then round((v_janela.litros / v_janela.km * 100 - v_ref) / v_ref * 100, 2)
    end)
  on conflict (abastecimento_id) do nothing;

  if v_ref is null then
    return;
  end if;

  v_desvio := (v_janela.litros / v_janela.km * 100 - v_ref) / v_ref * 100;

  -- R30 · salto isolado
  if v_desvio >= fleetcv.def_num(v_a.organizacao_id, 'consumo_alerta_pct', 25) then
    perform fleetcv.criar_alerta(v_a.organizacao_id, 'A17', v_a.turno_id,
      v_a.carro_id, v_a.motorista_id, p_abast,
      jsonb_build_object('l100', round(v_janela.litros / v_janela.km * 100, 2),
                         'referencia_l100', round(v_ref, 2),
                         'desvio_pct', round(v_desvio, 1),
                         'km_janela', v_janela.km));
  end if;

  -- R31 · o sifão lento: três janelas seguidas acima de 10%. Nenhuma delas
  -- dispara sozinha, e é exactamente assim que este desvio passa despercebido.
  -- Ordenar pela hora do abastecimento, não pela hora de gravação: vários
  -- abastecimentos podem ser processados na mesma transacção (sincronização
  -- offline) e aí criado_em é igual para todos.
  select count(*) into v_seguidas from (
    select cj.desvio_pct
      from fleetcv.consumo_janela cj
      join fleetcv.abastecimento ab on ab.id = cj.abastecimento_id
     where cj.carro_id = v_a.carro_id
       and cj.referencia_l100 is not null
       and ab.capturado_em <= v_a.capturado_em
     order by ab.capturado_em desc limit 3
  ) u where u.desvio_pct >= fleetcv.def_num(v_a.organizacao_id, 'consumo_tendencia_pct', 10);

  if v_seguidas >= 3 then
    perform fleetcv.criar_alerta(v_a.organizacao_id, 'A18', v_a.turno_id,
      v_a.carro_id, v_a.motorista_id, p_abast,
      jsonb_build_object('janelas_acima', v_seguidas,
                         'desvio_actual_pct', round(v_desvio, 1),
                         'referencia_l100', round(v_ref, 2)));
  end if;
end;
$$;
