-- ════════════════════════════════════════════════════════════
-- A VERSÃO ANTERIOR DO ESQUEMA — UMA FROTA SÓ. NÃO É PARA COLAR.
--
-- Fica aqui só para o provar.sh conseguir provar a passagem: monta
-- uma base como as que já estão no ar, põe-lhe dados, carrega o
-- esquema.sql novo por cima e confere que ninguém ficou à porta.
-- ════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- A BASE DE DADOS DO FLEETCV, NO SUPABASE
--
-- Cole isto todo no SQL Editor do Supabase e carregue em Run. Uma
-- vez só. Pode voltar a correr sem estragar nada.
--
-- A ideia é a mesma do resto da aplicação: uma tabela só, com uma
-- colecção, um nome e o conteúdo. O que muda no telemóvel do
-- condutor é exactamente o que fica gravado aqui.
--
-- O que aqui manda de verdade são as REGRAS lá em baixo. Num
-- telemóvel, "o condutor só escreve o turno dele" era boa vontade:
-- quem soubesse mexer escrevia o que quisesse. Aqui é a própria
-- base de dados que recusa, e não há telemóvel que a convença.
-- ════════════════════════════════════════════════════════════

-- ─── onde tudo fica ──────────────────────────────────────────
create table if not exists public.docs (
  coleccao text not null,
  id       text not null,
  corpo    jsonb not null,
  quando   timestamptz not null default now(),
  primary key (coleccao, id)
);

create index if not exists docs_coleccao_quando
  on public.docs (coleccao, quando desc);

-- o percurso e as fotos procuram-se pelo turno a que pertencem
create index if not exists docs_turno
  on public.docs ((corpo->>'turno'));

-- ─── quem está a ver ─────────────────────────────────────────
-- Cada telemóvel entra sem conta nenhuma (o Supabase dá-lhe um
-- número anónimo) e depois diz quem é com o email e o código que o
-- patrão lhe deu. É esta tabela que liga uma coisa à outra.
create table if not exists public.perfis (
  uid   uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('dono','condutor')),
  quem  text not null,
  nome  text,
  desde timestamptz not null default now()
);

-- ─── a trava ─────────────────────────────────────────────────
-- Um código de quatro algarismos adivinha-se em
-- dez mil tentativas, e uma máquina faz isso num minuto. Cinco
-- enganos no mesmo e-mail e fica quinze minutos à espera. Quem se
-- engana a escrever nunca dá por isto; quem anda a tentar à sorte
-- não passa daqui.
create table if not exists public.tentativas (
  email   text primary key,
  falhas  int  not null default 0,
  ultima  timestamptz not null default now()
);
alter table public.tentativas enable row level security;
-- ninguém lê esta tabela a não ser a própria função
drop policy if exists tentativas_ninguem on public.tentativas;

-- ─── entrar ──────────────────────────────────────────────────
-- Confere o email e o código contra o que está gravado e marca
-- quem é este telemóvel. É "security definer" porque precisa de ler
-- os códigos e a trava, que mais ninguém pode ler.
create or replace function public.entrar(p_email text, p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dono jsonb;
  v_cond jsonb;
  v_email text := lower(trim(p_email));
  v_cod   text := trim(p_codigo);
  v_falhas int;
  v_ultima timestamptz;
begin
  if auth.uid() is null then
    return jsonb_build_object('erro','sessão por abrir');
  end if;

  select falhas, ultima into v_falhas, v_ultima
    from tentativas where email = v_email;
  if v_falhas is not null and v_falhas >= 5
     and v_ultima > now() - interval '15 minutes' then
    return jsonb_build_object('erro',
      'Demasiadas tentativas. Espere um quarto de hora e tente outra vez.');
  end if;
  -- passados os quinze minutos, a conta recomeça do zero
  if v_ultima is not null and v_ultima <= now() - interval '15 minutes' then
    v_falhas := 0;
  end if;

  -- o proprietário
  select corpo into v_dono from docs where coleccao='frota' and id='dono';
  if v_dono is not null
     and lower(v_dono->>'email') = v_email
     and (v_dono->>'codigo') = v_cod then
    insert into perfis(uid, papel, quem, nome)
      values (auth.uid(), 'dono', 'dono', coalesce(v_dono->>'nome','Proprietário'))
      on conflict (uid) do update
        set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome;
    delete from tentativas where email = v_email;
    return jsonb_build_object('papel','dono','id','dono',
                              'nome',coalesce(v_dono->>'nome','Proprietário'));
  end if;

  -- os condutores
  select c into v_cond
  from docs d, jsonb_array_elements(d.corpo->'lista') c
  where d.coleccao='frota' and d.id='condutores'
    and lower(c->>'email') = v_email
    and (c->>'codigo') = v_cod
    and coalesce(c->>'estado','ACTIVO') <> 'INACTIVO'
  limit 1;

  if v_cond is not null then
    insert into perfis(uid, papel, quem, nome)
      values (auth.uid(), 'condutor', v_cond->>'id', v_cond->>'nome')
      on conflict (uid) do update
        set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome;
    delete from tentativas where email = v_email;
    return jsonb_build_object('papel','condutor','id',v_cond->>'id',
                              'nome',v_cond->>'nome');
  end if;

  insert into tentativas(email, falhas, ultima)
    values (v_email, coalesce(v_falhas,0) + 1, now())
    on conflict (email) do update
      set falhas = coalesce(v_falhas,0) + 1, ultima = now();
  return jsonb_build_object('erro','E-mail ou código errados.');
end;
$$;

create or replace function public.sair()
returns void language sql security definer set search_path = public as $$
  delete from perfis where uid = auth.uid();
$$;

-- ─── quem sou eu, para as regras ─────────────────────────────
create or replace function public.meu_papel()
returns text language sql stable security definer set search_path = public as $$
  select papel from perfis where uid = auth.uid();
$$;

create or replace function public.meu_id()
returns text language sql stable security definer set search_path = public as $$
  select quem from perfis where uid = auth.uid();
$$;

-- O percurso e as fotografias pertencem a um turno, e é o turno que
-- diz de quem são. Isso obriga a ir ver a tabela docs a partir de uma
-- regra que está EM CIMA da tabela docs — e o Postgres recusa-se, com
-- "infinite recursion detected in policy". Não é um aviso: nenhuma
-- escrita passava, nem a do proprietário.
-- A saída é esta função. Sendo "security definer", corre por conta de
-- quem a criou e não volta a passar pelas regras — a volta fecha-se.
create or replace function public.turno_meu(p_turno text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from docs t
     where t.coleccao = 'turnos'
       and t.id = p_turno
       and t.corpo->>'condutorId' = (select public.meu_id()));
$$;

-- ─── a semente ───────────────────────────────────────────────
-- A conta do proprietário e uma frota de estreia, só se ainda não
-- houver nada. Corra isto DEPOIS de mudar o email e o código.
create or replace function public.semear(p_email text, p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from docs where coleccao='frota' and id='dono') then
    return 'Já estava semeada — nada mudou.';
  end if;
  insert into docs(coleccao,id,corpo) values
    ('frota','dono', jsonb_build_object('email',lower(trim(p_email)),
                                        'codigo',trim(p_codigo),
                                        'nome','Proprietário')),
    ('frota','config', '{"nome":"A minha frota","precoLitro":145}'::jsonb),
    ('frota','carros', '{"lista":[]}'::jsonb),
    ('frota','condutores', '{"lista":[]}'::jsonb);
  return 'Pronto. Entre com ' || lower(trim(p_email)) || ' e o código que escolheu.';
end;
$$;

-- ════════════════════════════════════════════════════════════
-- AS REGRAS
-- ════════════════════════════════════════════════════════════
alter table public.docs   enable row level security;
alter table public.perfis enable row level security;

drop policy if exists perfis_meu on public.perfis;
create policy perfis_meu on public.perfis
  for select using (uid = auth.uid());

-- LER: quem entrou vê tudo. O patrão precisa de ver os turnos de
-- todos, e o condutor precisa de ver a frota para escolher o carro.
drop policy if exists docs_ler on public.docs;
create policy docs_ler on public.docs
  for select using ((select public.meu_papel()) is not null);

-- ESCREVER: aqui é que está o valor disto.
--   · a frota é do patrão e mais ninguém lhe toca
--   · um condutor escreve o turno dele, a posição dele e o
--     percurso dele — e nada mais
--   · um turno fechado não se volta a escrever, senão corrigia-se
--     os quilómetros depois de o patrão ter visto o alerta
drop policy if exists docs_escrever on public.docs;
create policy docs_escrever on public.docs
  for insert with check (
    (select public.meu_papel()) = 'dono'
    or (coleccao in ('turnos','vivo') and corpo->>'condutorId' = (select public.meu_id()))
    or (coleccao in ('rastos','fotos')
        and public.turno_meu(corpo->>'turno'))
  );

drop policy if exists docs_mudar on public.docs;
create policy docs_mudar on public.docs
  for update using (
    (select public.meu_papel()) = 'dono'
    or (coleccao in ('turnos','vivo')
        and corpo->>'condutorId' = (select public.meu_id())
        and (coleccao = 'vivo' or corpo->>'fim' is null))
    or (coleccao in ('rastos','fotos')
        and public.turno_meu(corpo->>'turno'))
  ) with check (
    (select public.meu_papel()) = 'dono'
    or (coleccao in ('turnos','vivo') and corpo->>'condutorId' = (select public.meu_id()))
    or coleccao in ('rastos','fotos')
  );

drop policy if exists docs_apagar on public.docs;
create policy docs_apagar on public.docs
  for delete using (
    (select public.meu_papel()) = 'dono'
    or (coleccao = 'vivo' and corpo->>'condutorId' = (select public.meu_id()))
  );

-- ─── as novidades ao vivo ────────────────────────────────────
-- É isto que faz o carro mexer-se no ecrã do patrão sem ninguém
-- carregar em nada. As fotografias ficam de fora de propósito:
-- não vale a pena mandar 100 kB a toda a gente sempre que uma
-- chega; vão-se buscar só quando alguém as quer ver.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime'
                   and schemaname='public' and tablename='docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- ─── quem pode chamar o quê ──────────────────────────────────
-- A semente só se corre aqui no SQL Editor. Se ficasse ao alcance
-- de qualquer telemóvel, o primeiro a chegar ficava dono da frota.
-- O "from public" é o que conta: o Postgres dá execute a toda a gente
-- assim que uma função nasce, e tirá-la só ao anon e ao authenticated
-- não tirava nada — continuavam a herdá-la por PUBLIC.
revoke execute on function public.semear(text,text)
  from public, anon, authenticated;
-- entrar tem de estar aberto: é a porta.
grant  execute on function public.entrar(text,text) to anon, authenticated;
grant  execute on function public.sair() to anon, authenticated;
-- Estas três são de uso interno das regras. Mesmo não deixando ver
-- nada de ninguém (devolvem sempre o que é de quem pergunta), não têm
-- de estar abertas a quem ainda nem entrou. Outra vez o "from public":
-- sem ele o grant a seguir não fecha nada.
revoke execute on function public.meu_papel()     from public, anon;
revoke execute on function public.meu_id()        from public, anon;
revoke execute on function public.turno_meu(text) from public, anon;
grant  execute on function public.meu_papel() to authenticated;
grant  execute on function public.meu_id() to authenticated;
grant  execute on function public.turno_meu(text) to authenticated;
grant  select, insert, update, delete on public.docs to authenticated;
grant  select on public.perfis to authenticated;
-- a tabela da trava não se lê nem se escreve de fora. O Supabase dá
-- tudo por omissão às tabelas novas, por isso tira-se à mão.
revoke all on public.tentativas from public, anon, authenticated;
revoke all on public.docs   from anon;
revoke all on public.perfis from anon;
