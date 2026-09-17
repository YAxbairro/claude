-- FleetCV · 007 · Score de confiança (SPEC §8)
--
-- 0 a 100 por motorista, sobre os últimos 30 dias. NÃO é prova de roubo: é
-- disciplina de registo. Um motorista honesto com um telemóvel velho vai ter
-- score baixo, e o dono tem de saber isso antes de acusar alguém.
-- O motorista vê o seu próprio score e o que o baixou. Um sistema que ele não
-- pode consultar gera revolta; um que ele pode consultar e melhorar muda o
-- comportamento.

create or replace function fleetcv.calcular_score(p_motorista uuid, p_ate date)
returns int language plpgsql as $$
declare
  v_de          date := p_ate - 29;
  v_u           fleetcv.utilizador%rowtype;
  v_adaptacao   int;
  v_pen_alertas int;
  v_pen_gps     int;
  v_bonus       int;
  v_limpos      int;
  v_valor       int;
  v_detalhe     jsonb;
begin
  perform set_config('fleetcv.motor', 'on', true);

  select * into v_u from fleetcv.utilizador where id = p_motorista;
  v_adaptacao := fleetcv.def_num(v_u.organizacao_id, 'adaptacao_dias', 14);

  -- Período de adaptação: nas primeiras duas semanas ninguém é penalizado por
  -- estar a aprender a usar a app.
  if v_u.criado_em > (p_ate - v_adaptacao)::timestamptz then
    insert into fleetcv.score_motorista (motorista_id, janela_de, janela_ate, valor, detalhe)
    values (p_motorista, v_de, p_ate, 100,
            jsonb_build_object('adaptacao', true, 'motivo', 'Primeiros dias com a app'))
    on conflict (motorista_id, janela_ate)
      do update set valor = 100, detalhe = excluded.detalhe, calculado_em = now();
    return 100;
  end if;

  -- Penalizações por alerta (cada alerta conta uma vez, não por ocorrência)
  select coalesce(sum(p.pontos), 0) into v_pen_alertas
    from fleetcv.alerta a
    join fleetcv.penalizacao p on p.codigo = a.codigo
   where a.motorista_id = p_motorista
     and a.ocorrido_em::date between v_de and p_ate
     and (a.resolucao is null or a.resolucao <> 'ERRO_SISTEMA');
  -- Um alerta resolvido como "erro do sistema" não penaliza ninguém. É também
  -- assim que descobrimos que uma regra está mal calibrada.

  -- Tempo sem sinal: 1 ponto por cada 10 minutos completos, máximo 20 por turno
  select coalesce(sum(least(floor(segundos_sem_gps / 600.0), 20)), 0) into v_pen_gps
    from fleetcv.turno
   where motorista_id = p_motorista
     and coalesce(fechado_em, aberto_em)::date between v_de and p_ate;

  -- Recuperação: +3 por turno completo e sem alertas de aviso ou crítico
  select count(*) into v_limpos
    from fleetcv.turno t
   where t.motorista_id = p_motorista
     and t.estado = 'FECHADO'
     and t.fechado_em::date between v_de and p_ate
     and not exists (
       select 1 from fleetcv.alerta a
        where a.turno_id = t.id and a.nivel in ('AVISO','CRITICO'));
  v_bonus := v_limpos * 3;

  v_valor := greatest(0, least(100, 100 - v_pen_alertas - v_pen_gps + v_bonus));

  v_detalhe := jsonb_build_object(
    'penalizacao_alertas', v_pen_alertas,
    'penalizacao_sem_gps', v_pen_gps,
    'turnos_limpos',       v_limpos,
    'bonus',               v_bonus,
    'alertas', coalesce((
      select jsonb_agg(jsonb_build_object('codigo', a.codigo, 'pontos', p.pontos,
                                          'quando', a.ocorrido_em))
        from fleetcv.alerta a
        join fleetcv.penalizacao p on p.codigo = a.codigo
       where a.motorista_id = p_motorista
         and a.ocorrido_em::date between v_de and p_ate
         and (a.resolucao is null or a.resolucao <> 'ERRO_SISTEMA')), '[]'::jsonb));

  insert into fleetcv.score_motorista (motorista_id, janela_de, janela_ate, valor, detalhe)
  values (p_motorista, v_de, p_ate, v_valor, v_detalhe)
  on conflict (motorista_id, janela_ate)
    do update set valor = excluded.valor, detalhe = excluded.detalhe, calculado_em = now();

  return v_valor;
end;
$$;
