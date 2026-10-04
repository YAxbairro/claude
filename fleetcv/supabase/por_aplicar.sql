-- ════════════════════════════════════════════════════════════
-- POR APLICAR NA BASE VERDADEIRA (o Supabase pede aprovação)
-- Tudo isto já está em esquema.sql e provado por provar.sh (provas
-- 70–80). Pode correr-se mais de uma vez sem estragar nada.
--   1. o registo de erros (tabela erros)
--   2. entrar e sair só com sessão; a regra dos perfis mais leve
--   3. o código de recuperação (novo_codigo_recuperacao, recuperar_acesso)
-- A aplicação funciona sem isto: sem a tabela não regista erros, e sem
-- as funções o "esqueci-me do código" manda falar pelo WhatsApp.
-- ════════════════════════════════════════════════════════════

-- 1 ─────────────────────────────────────────────────────────
-- O registo de erros: o que corre mal nos telemóveis (o GPS que pára
-- com o ecrã apagado, uma licença recusada, um erro da página) chega
-- aqui, para se saber o que aconteceu sem depender de "não funciona".
-- Os telemóveis só escrevem: não lêem nada, nem o seu. A frota e quem
-- escreveu põe-nas a base (não se podem inventar), e cada telemóvel
-- escreve no máximo 120 por hora — um erro em ciclo não enche a base.
create table if not exists public.erros(
  id       bigint generated always as identity primary key,
  quando   timestamptz not null default now(),
  frota    text default public.minha_frota(),
  quem     uuid default auth.uid(),
  tipo     text not null check (tipo in ('erro','aviso','info')),
  onde     text not null check (length(onde) <= 60),
  mensagem text not null check (length(mensagem) <= 600),
  detalhe  jsonb check (detalhe is null or pg_column_size(detalhe) <= 4000),
  ua       text check (ua is null or length(ua) <= 300),
  versao   text check (versao is null or length(versao) <= 60)
);
create index if not exists erros_quem_quando on public.erros(quem, quando);
create index if not exists erros_frota_quando on public.erros(frota, quando);
alter table public.erros enable row level security;
revoke all on public.erros from public, anon, authenticated;
grant insert (tipo, onde, mensagem, detalhe, ua, versao) on public.erros to authenticated;
drop policy if exists erros_escrever on public.erros;
create policy erros_escrever on public.erros for insert to authenticated
  with check (quem is not distinct from auth.uid());

create index if not exists erros_quando on public.erros(quando);
create or replace function public._erros_tecto() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  -- o que tem mais de 90 dias sai (é o que diz a política de privacidade)
  delete from public.erros where quando < now() - interval '90 days';
  if (select count(*) from public.erros
       where quem is not distinct from new.quem
         and quando > now() - interval '1 hour') >= 120 then
    return null;
  end if;
  return new;
end $$;
revoke execute on function public._erros_tecto() from public, anon, authenticated;
drop trigger if exists erros_tecto on public.erros;
create trigger erros_tecto before insert on public.erros
  for each row execute function public._erros_tecto();

-- 2 ─────────────────────────────────────────────────────────
revoke execute on function public.entrar(text,text) from public, anon;
grant  execute on function public.entrar(text,text) to authenticated;
revoke execute on function public.sair() from public, anon;
grant  execute on function public.sair() to authenticated;
drop policy if exists perfis_meu on public.perfis;
create policy perfis_meu on public.perfis
  for select using (uid = (select auth.uid()));

-- 3 ─────────────────────────────────────────────────────────
-- ─── o código de recuperação ─────────────────────────────────
-- Um patrão que esquece o código ficava fora da conta para sempre. Ao
-- criar a conta (e quando quiser, nas definições) recebe um código de
-- recuperação — doze letras e algarismos, mostrado uma vez, guardado
-- aqui só baralhado. Com o e-mail e esse código, noutro telemóvel, muda
-- o código e entra; o de recuperação gasta-se e vem logo outro. Os
-- outros telemóveis que estavam dentro como patrão saem. A trava das
-- cinco tentativas é a mesma do entrar.
create or replace function public._codigo_recuperacao() returns text
  language sql volatile set search_path = public as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                           1 + (get_byte(x.b, g.i) % 32), 1), '' order by g.i)
    from (select extensions.gen_random_bytes(12) as b) x, generate_series(0, 11) as g(i);
$$;
create or replace function public._guardar_recuperacao(p_frota text) returns text
  language plpgsql security definer set search_path = public as $$
declare
  v_cod text := public._codigo_recuperacao();
begin
  update docs set corpo = corpo || jsonb_build_object('recuperacao',
                    extensions.crypt(v_cod, extensions.gen_salt('bf', 8))),
                  quando = now()
   where frota = p_frota and coleccao = 'frota' and id = 'dono';
  return substr(v_cod,1,4) || '-' || substr(v_cod,5,4) || '-' || substr(v_cod,9,4);
end $$;

create or replace function public.novo_codigo_recuperacao(p_codigo_actual text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_frota  text := (select public.minha_frota());
  v_dono   jsonb;
  v_falhas int;
begin
  if (select public.meu_papel()) is distinct from 'dono' then
    return jsonb_build_object('erro','Só o proprietário faz isto.');
  end if;
  select corpo into v_dono from docs
   where frota = v_frota and coleccao = 'frota' and id = 'dono';
  if v_dono is null then
    return jsonb_build_object('erro','Não encontrei a sua conta.');
  end if;
  select falhas into v_falhas from tentativas
   where email = lower(v_dono->>'email') and ultima > now() - interval '15 minutes';
  if coalesce(v_falhas,0) >= 5 then
    return jsonb_build_object('erro',
      'Demasiadas tentativas. Espere um quarto de hora e tente outra vez.');
  end if;
  if not public._codigo_certo(v_dono, trim(coalesce(p_codigo_actual,''))) then
    insert into tentativas(email, falhas, ultima)
      values (lower(v_dono->>'email'), 1, now())
      on conflict (email) do update
        set falhas = case when tentativas.ultima > now() - interval '15 minutes'
                          then tentativas.falhas + 1 else 1 end,
            ultima = now();
    return jsonb_build_object('erro','O código actual não está certo.');
  end if;
  delete from tentativas where email = lower(v_dono->>'email');
  return jsonb_build_object('codigo', public._guardar_recuperacao(v_frota));
end $$;

create or replace function public.recuperar_acesso(p_email text, p_recuperacao text,
                                                   p_codigo_novo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email  text := lower(trim(coalesce(p_email,'')));
  v_rec    text := upper(regexp_replace(coalesce(p_recuperacao,''), '[^A-Za-z0-9]', '', 'g'));
  v_cod    text := trim(coalesce(p_codigo_novo,''));
  v_frota  text;
  v_dono   jsonb;
  v_plano  text;
  v_falhas int;
  v_ultima timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('erro','sessão por abrir');
  end if;
  select falhas, ultima into v_falhas, v_ultima from tentativas where email = v_email;
  if v_falhas is not null and v_falhas >= 5
     and v_ultima > now() - interval '15 minutes' then
    return jsonb_build_object('erro',
      'Demasiadas tentativas. Espere um quarto de hora e tente outra vez.');
  end if;
  if length(v_cod) < 6 then
    return jsonb_build_object('erro',
      'O código novo tem de ter pelo menos 6 algarismos ou letras.');
  end if;
  select d.frota, d.corpo into v_frota, v_dono from docs d
   where d.coleccao = 'frota' and d.id = 'dono' and lower(d.corpo->>'email') = v_email
   limit 1;
  if v_dono is null or not (v_dono ? 'recuperacao') or length(v_rec) <> 12
     or extensions.crypt(v_rec, v_dono->>'recuperacao') <> v_dono->>'recuperacao' then
    insert into tentativas(email, falhas, ultima)
      values (v_email, 1, now())
      on conflict (email) do update
        set falhas = case when tentativas.ultima > now() - interval '15 minutes'
                          then tentativas.falhas + 1 else 1 end,
            ultima = now();
    return jsonb_build_object('erro','E-mail ou código de recuperação errados.');
  end if;
  select plano into v_plano from frotas where id = v_frota;
  if v_plano = 'suspensa' then
    return jsonb_build_object('erro',
      'Esta frota está suspensa. Fale com a FleetCV pelo WhatsApp.');
  end if;
  update docs
     set corpo = (corpo - 'codigo' - 'hash' - 'recuperacao')
                 || jsonb_build_object('hash',
                      extensions.crypt(v_cod, extensions.gen_salt('bf', 8))),
         quando = now()
   where frota = v_frota and coleccao = 'frota' and id = 'dono';
  delete from tentativas where email = v_email;
  -- quem estava dentro com o código antigo sai
  delete from perfis where frota = v_frota and papel = 'dono' and uid <> auth.uid();
  insert into perfis(uid, papel, quem, nome, frota)
    values (auth.uid(), 'dono', 'dono', coalesce(v_dono->>'nome','Proprietário'), v_frota)
    on conflict (uid) do update
      set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome,
          frota=excluded.frota;
  return jsonb_build_object('papel','dono','id','dono',
                            'nome',coalesce(v_dono->>'nome','Proprietário'),
                            'frota',v_frota,
                            'recuperacao', public._guardar_recuperacao(v_frota));
end $$;
revoke execute on function public._codigo_recuperacao() from public, anon, authenticated;
revoke execute on function public._guardar_recuperacao(text) from public, anon, authenticated;
revoke execute on function public.novo_codigo_recuperacao(text) from public, anon;
grant  execute on function public.novo_codigo_recuperacao(text) to authenticated;
revoke execute on function public.recuperar_acesso(text,text,text) from public, anon;
grant  execute on function public.recuperar_acesso(text,text,text) to authenticated;
