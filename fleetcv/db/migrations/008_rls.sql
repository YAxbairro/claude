-- FleetCV · 008 · Segurança ao nível da linha
--
-- Multi-cliente desde o primeiro dia. Fazê-lo agora custa este ficheiro;
-- acrescentá-lo depois obrigava a reescrever tudo.
--
-- Em Fase 1 o contexto vem de variáveis de sessão. No Supabase (Fase 2) estas
-- duas funções passam a ler o JWT (auth.uid()) — muda só aqui, nem uma política.

create or replace function fleetcv.utilizador_actual() returns uuid
language sql stable as $$
  select nullif(current_setting('fleetcv.utilizador_id', true), '')::uuid;
$$;

-- SECURITY DEFINER é obrigatório nestas duas: elas consultam fleetcv.utilizador,
-- que é uma tabela protegida por uma política que as chama a elas. Sem isto, a
-- política chamava-se a si própria até rebentar a pilha.
create or replace function fleetcv.org_actual() returns uuid
language sql stable security definer set search_path = fleetcv, pg_temp as $$
  select organizacao_id from fleetcv.utilizador where id = fleetcv.utilizador_actual();
$$;

create or replace function fleetcv.e_gestor() returns boolean
language sql stable security definer set search_path = fleetcv, pg_temp as $$
  select coalesce((select papel in ('PROPRIETARIO','GESTOR')
                     from fleetcv.utilizador where id = fleetcv.utilizador_actual()), false);
$$;

alter table fleetcv.turno          enable row level security;
alter table fleetcv.ponto_gps      enable row level security;
alter table fleetcv.abastecimento  enable row level security;
alter table fleetcv.alerta         enable row level security;
alter table fleetcv.carro          enable row level security;
alter table fleetcv.utilizador     enable row level security;
alter table fleetcv.score_motorista enable row level security;

-- Turnos: o gestor vê a frota toda; o motorista vê só os seus.
create policy turno_leitura on fleetcv.turno for select using (
  organizacao_id = fleetcv.org_actual()
  and (fleetcv.e_gestor() or motorista_id = fleetcv.utilizador_actual()));

-- O rasto de GPS é o dado mais sensível de todos: segue sempre o turno.
create policy ponto_leitura on fleetcv.ponto_gps for select using (
  exists (select 1 from fleetcv.turno t
           where t.id = ponto_gps.turno_id
             and t.organizacao_id = fleetcv.org_actual()
             and (fleetcv.e_gestor() or t.motorista_id = fleetcv.utilizador_actual())));

create policy abastecimento_leitura on fleetcv.abastecimento for select using (
  organizacao_id = fleetcv.org_actual()
  and (fleetcv.e_gestor() or motorista_id = fleetcv.utilizador_actual()));

-- Alertas: só o gestor. O motorista vê o seu score e o que o baixou (que já é
-- a informação útil), não a lista de suspeitas sobre ele.
create policy alerta_leitura on fleetcv.alerta for select using (
  organizacao_id = fleetcv.org_actual() and fleetcv.e_gestor());

create policy carro_leitura on fleetcv.carro for select using (
  organizacao_id = fleetcv.org_actual());

-- Cada um vê-se a si próprio; o gestor vê a equipa.
create policy utilizador_leitura on fleetcv.utilizador for select using (
  organizacao_id = fleetcv.org_actual()
  and (fleetcv.e_gestor() or id = fleetcv.utilizador_actual()));

create policy score_leitura on fleetcv.score_motorista for select using (
  exists (select 1 from fleetcv.utilizador u
           where u.id = score_motorista.motorista_id
             and u.organizacao_id = fleetcv.org_actual()
             and (fleetcv.e_gestor() or u.id = fleetcv.utilizador_actual())));

-- A escrita passa toda pelas funções do motor, nunca directamente do cliente.
-- Os papéis são do agrupamento, não da base de dados: recriar a base não os apaga.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'fleetcv_app') then
    create role fleetcv_app nologin;
  end if;
end $$;
grant usage on schema fleetcv to fleetcv_app;
grant select on all tables in schema fleetcv to fleetcv_app;
grant execute on all functions in schema fleetcv to fleetcv_app;
