-- ════════════════════════════════════════════════════════════
-- O MÍNIMO DO SUPABASE, PARA SE PODER PROVAR AS REGRAS AQUI
--
-- No Supabase, o "auth" vem de casa: é ele que diz quem é o
-- telemóvel que está a falar. Num Postgres nosso não existe, e sem
-- ele não se consegue experimentar regra nenhuma. Isto põe cá o
-- indispensável — e nada disto vai para o Supabase.
-- ════════════════════════════════════════════════════════════
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon')
    then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated')
    then create role authenticated nologin; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users  (id uuid primary key);
create table if not exists auth.sessao (uid uuid);

-- quem está a ver. No Supabase vem do crachá que o telemóvel traz.
create or replace function auth.uid() returns uuid
  language sql stable security definer as $$ select uid from auth.sessao limit 1 $$;

-- trocar de telemóvel, no meio da prova
create or replace procedure public.quem(p uuid) language sql as
  $$ delete from auth.sessao; insert into auth.sessao values (p); $$;

do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime')
    then create publication supabase_realtime; end if;
end $$;

-- o Supabase dá tudo por omissão às tabelas novas; imita-se, para os
-- "revoke" do esquema terem alguma coisa para tirar
alter default privileges in schema public grant all on tables to anon, authenticated;
grant usage on schema auth   to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on procedure public.quem(uuid) to anon, authenticated;
