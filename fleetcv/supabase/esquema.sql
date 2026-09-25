-- ════════════════════════════════════════════════════════════
-- A BASE DE DADOS DO FLEETCV, NO SUPABASE
--
-- Cole isto todo no SQL Editor do Supabase e carregue em Run. Pode
-- voltar a correr sem estragar nada — e é assim que se actualiza: uma
-- base da versão anterior (uma frota só) passa a esta sozinha, com a
-- frota que lá estava a ficar como a primeira.
--
-- A ideia é a mesma do resto da aplicação: uma tabela só, com uma
-- colecção, um nome e o conteúdo. O que muda no telemóvel do
-- condutor é exactamente o que fica gravado aqui.
--
-- O que aqui manda de verdade são as REGRAS lá em baixo. Num
-- telemóvel, "o condutor só escreve o turno dele" era boa vontade:
-- quem soubesse mexer escrevia o que quisesse. Aqui é a própria
-- base de dados que recusa, e não há telemóvel que a convença.
--
-- VÁRIAS FROTAS. Cada proprietário que cria conta fica com a sua, e
-- as regras fecham cada uma sobre si: um patrão não vê os carros de
-- outro, um condutor não vê a frota a que não pertence, e ninguém
-- escreve fora da sua. Não é a aplicação a filtrar — é a base a
-- recusar, linha a linha.
-- ════════════════════════════════════════════════════════════

-- o código do proprietário guarda-se baralhado, com a mesma receita
-- que se usa para palavras-passe (o Supabase já traz isto instalado)
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─── as frotas ───────────────────────────────────────────────
-- Uma linha por proprietário que criou conta. O plano e a data até
-- quando vai o período de experiência vivem aqui, fora do alcance do
-- telemóvel: quem mexe nisto é quem cobra.
create table if not exists public.frotas (
  id         text primary key,
  nome       text,
  criada     timestamptz not null default now(),
  criada_por uuid,
  plano      text not null default 'ensaio',
  ate        timestamptz default now() + interval '30 days'
);

-- ─── onde tudo fica ──────────────────────────────────────────
create table if not exists public.docs (
  frota    text,
  coleccao text not null,
  id       text not null,
  corpo    jsonb not null,
  quando   timestamptz not null default now()
);
alter table public.docs add column if not exists frota text;

-- ─── quem está a ver ─────────────────────────────────────────
-- Cada telemóvel entra sem conta nenhuma (o Supabase dá-lhe um
-- número anónimo) e depois diz quem é com o email e o código. É esta
-- tabela que liga uma coisa à outra — e que diz de que frota é.
create table if not exists public.perfis (
  uid   uuid primary key references auth.users(id) on delete cascade,
  papel text not null check (papel in ('dono','condutor')),
  quem  text not null,
  nome  text,
  desde timestamptz not null default now()
);
alter table public.perfis add column if not exists frota text;

-- ─── a passagem da versão de uma frota só ────────────────────
-- O que já lá estava, sem frota nenhuma, é a frota número um. Fica
-- sem prazo: é a de quem começou isto.
do $$
begin
  if exists (select 1 from public.docs where frota is null)
     or exists (select 1 from public.perfis where frota is null) then
    insert into public.frotas(id, nome, plano, ate)
      values ('f1', coalesce((select corpo->>'nome' from public.docs
                              where frota is null and coleccao='frota'
                                and id='config'), 'A minha frota'),
              'fundador', null)
      on conflict (id) do nothing;
    update public.docs   set frota='f1' where frota is null;
    update public.perfis set frota='f1' where frota is null;
  end if;
end $$;

-- A chave passa a ser (frota, colecção, nome): duas frotas podem ter
-- cada uma o seu 'frota/config', o seu turno 't1', o seu condutor 'm1'.
do $$
declare v_pk text; v_nome text;
begin
  select string_agg(a.attname, ',' order by k.ord), c.conname
    into v_pk, v_nome
    from pg_constraint c
    cross join lateral unnest(c.conkey) with ordinality k(num, ord)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.num
   where c.conrelid = 'public.docs'::regclass and c.contype = 'p'
   group by c.conname;
  if v_pk is distinct from 'frota,coleccao,id' then
    if v_nome is not null then
      execute format('alter table public.docs drop constraint %I', v_nome);
    end if;
    alter table public.docs alter column frota set not null;
    alter table public.docs add primary key (frota, coleccao, id);
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid='public.docs'::regclass
                    and conname='docs_frota_fk') then
    alter table public.docs add constraint docs_frota_fk
      foreign key (frota) references public.frotas(id) on delete cascade;
  end if;
end $$;

drop index if exists public.docs_coleccao_quando;
create index if not exists docs_frota_coleccao_quando
  on public.docs (frota, coleccao, quando desc);
-- o percurso e as fotos procuram-se pelo turno a que pertencem
create index if not exists docs_turno
  on public.docs ((corpo->>'turno'));

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

-- ─── quem sou eu, para as regras ─────────────────────────────
create or replace function public.meu_papel()
returns text language sql stable security definer set search_path = public as $$
  select papel from perfis where uid = auth.uid();
$$;

create or replace function public.meu_id()
returns text language sql stable security definer set search_path = public as $$
  select quem from perfis where uid = auth.uid();
$$;

create or replace function public.minha_frota()
returns text language sql stable security definer set search_path = public as $$
  select frota from perfis where uid = auth.uid();
$$;

-- O telemóvel não diz de que frota é o que escreve: a base põe a de
-- quem está a escrever. Assim nem um telemóvel antigo, nem um mal
-- intencionado, consegue escrever na frota de outro por engano — e o
-- que tentar pôr lá à mão esbarra nas regras.
alter table public.docs alter column frota set default public.minha_frota();

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
     where t.frota = (select public.minha_frota())
       and t.coleccao = 'turnos'
       and t.id = p_turno
       and t.corpo->>'condutorId' = (select public.meu_id()));
$$;

-- ─── um e-mail, uma porta ────────────────────────────────────
-- Entra-se com e-mail e código, sem dizer de que frota se é. Por isso
-- um e-mail só pode estar numa frota: se estivesse em duas, quem
-- entrasse caía numa delas à sorte. Esta pergunta responde se um
-- e-mail já está a ser usado FORA da frota indicada.
create or replace function public._email_noutra(p_email text, p_frota text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from docs d
     where d.coleccao = 'frota'
       and d.frota is distinct from p_frota
       and ((d.id = 'dono' and lower(d.corpo->>'email') = lower(trim(p_email)))
         or (d.id = 'condutores' and exists (
               select 1 from jsonb_array_elements(coalesce(d.corpo->'lista','[]'::jsonb)) o
                where lower(o->>'email') = lower(trim(p_email))))));
$$;

-- Para o ecrã do patrão avisar logo, antes de gravar.
create or replace function public.email_livre(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select case when (select public.meu_papel()) = 'dono'
              then not public._email_noutra(p_email, (select public.minha_frota()))
         end;
$$;

-- ─── confere um código ───────────────────────────────────────
-- O do proprietário guarda-se baralhado ("hash"); o de uma base
-- antiga pode ainda estar à vista ("codigo") e continua a abrir.
create or replace function public._codigo_certo(p_dono jsonb, p_codigo text)
returns boolean language sql stable set search_path = public as $$
  select case
    when p_dono ? 'hash'
      then extensions.crypt(p_codigo, p_dono->>'hash') = p_dono->>'hash'
    else coalesce(p_dono->>'codigo','') <> '' and p_dono->>'codigo' = p_codigo
  end;
$$;

-- ─── entrar ──────────────────────────────────────────────────
-- Confere o email e o código contra o que está gravado e marca
-- quem é este telemóvel — e de que frota. É "security definer"
-- porque precisa de ler os códigos e a trava, que mais ninguém lê.
create or replace function public.entrar(p_email text, p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dono  jsonb;
  v_cond  jsonb;
  v_frota text;
  v_plano text;
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
  for v_frota, v_dono in
    select d.frota, d.corpo from docs d
     where d.coleccao='frota' and d.id='dono'
       and lower(d.corpo->>'email') = v_email
  loop
    if public._codigo_certo(v_dono, v_cod) then
      select plano into v_plano from frotas where id = v_frota;
      if v_plano = 'suspensa' then
        return jsonb_build_object('erro',
          'Esta frota está suspensa. Fale com a FleetCV pelo WhatsApp.');
      end if;
      insert into perfis(uid, papel, quem, nome, frota)
        values (auth.uid(), 'dono', 'dono',
                coalesce(v_dono->>'nome','Proprietário'), v_frota)
        on conflict (uid) do update
          set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome,
              frota=excluded.frota;
      delete from tentativas where email = v_email;
      return jsonb_build_object('papel','dono','id','dono',
                                'nome',coalesce(v_dono->>'nome','Proprietário'),
                                'frota',v_frota);
    end if;
  end loop;

  -- os condutores
  select d.frota, c into v_frota, v_cond
  from docs d, jsonb_array_elements(coalesce(d.corpo->'lista','[]'::jsonb)) c
  where d.coleccao='frota' and d.id='condutores'
    and lower(c->>'email') = v_email
    and (c->>'codigo') = v_cod
    and coalesce(c->>'estado','ACTIVO') <> 'INACTIVO'
  order by d.quando
  limit 1;

  if v_cond is not null then
    select plano into v_plano from frotas where id = v_frota;
    if v_plano = 'suspensa' then
      return jsonb_build_object('erro',
        'Esta frota está suspensa. Fale com o seu patrão.');
    end if;
    insert into perfis(uid, papel, quem, nome, frota)
      values (auth.uid(), 'condutor', v_cond->>'id', v_cond->>'nome', v_frota)
      on conflict (uid) do update
        set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome,
            frota=excluded.frota;
    delete from tentativas where email = v_email;
    return jsonb_build_object('papel','condutor','id',v_cond->>'id',
                              'nome',v_cond->>'nome','frota',v_frota);
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

-- ─── uma frota nova ──────────────────────────────────────────
-- O que fica feito numa frota acabada de nascer: o proprietário (com o
-- código baralhado), o nome, o preço do litro, as listas vazias — e a
-- marca de que já não leva turnos de exemplo. Sem essa marca, no dia
-- em que o patrão juntasse o primeiro carro e o primeiro condutor, a
-- aplicação enchia-lhe a frota verdadeira de turnos inventados.
create or replace function public._nova_frota(p_nome text, p_frota_nome text,
                                              p_email text, p_codigo text,
                                              p_uid uuid, p_id text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_id text := coalesce(p_id, 'f' || substr(replace(gen_random_uuid()::text,'-',''),1,12));
  v_frota_nome text := coalesce(nullif(trim(p_frota_nome),''), 'A minha frota');
begin
  insert into frotas(id, nome, criada_por) values (v_id, v_frota_nome, p_uid);
  insert into docs(frota, coleccao, id, corpo) values
    (v_id, 'frota', 'dono', jsonb_build_object(
        'email', lower(trim(p_email)),
        'hash',  extensions.crypt(trim(p_codigo), extensions.gen_salt('bf', 8)),
        'nome',  coalesce(nullif(trim(p_nome),''), 'Proprietário'))),
    (v_id, 'frota', 'config', jsonb_build_object('nome', v_frota_nome,
                                                 'precoLitro', 145)),
    (v_id, 'frota', 'carros', '{"lista":[]}'::jsonb),
    (v_id, 'frota', 'condutores', '{"lista":[]}'::jsonb),
    (v_id, 'frota', 'exemplos', jsonb_build_object(
        'quando', floor(extract(epoch from now())*1000), 'nenhum', true));
  return v_id;
end;
$$;

-- ─── criar conta ─────────────────────────────────────────────
-- É a porta de quem chega pela página principal: nome, e-mail e um
-- código que ele próprio escolhe. Sai daqui já dentro, como dono da
-- frota nova.
create or replace function public.criar_frota(p_nome text, p_frota_nome text,
                                              p_email text, p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_cod   text := trim(coalesce(p_codigo,''));
  v_nome  text := trim(coalesce(p_nome,''));
  v_id    text;
begin
  if auth.uid() is null then
    return jsonb_build_object('erro','sessão por abrir');
  end if;
  if length(v_nome) < 2 then
    return jsonb_build_object('erro','Escreva o seu nome.');
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('erro','Este e-mail não parece estar certo.');
  end if;
  if length(v_cod) < 6 then
    return jsonb_build_object('erro',
      'O código tem de ter pelo menos 6 algarismos ou letras.');
  end if;

  -- dois pedidos com o mesmo e-mail ao mesmo tempo: um espera pelo outro
  perform pg_advisory_xact_lock(hashtext('fleetcv-email:' || v_email));
  if public._email_noutra(v_email, null) then
    return jsonb_build_object('erro',
      'Este e-mail já tem conta. Carregue em "Entrar" e use o seu código.');
  end if;
  -- quem anda a fabricar contas não passa das três por telemóvel,
  -- nem de trinta por hora no total
  if (select count(*) from frotas where criada_por = auth.uid()) >= 3 then
    return jsonb_build_object('erro',
      'Já criou três frotas a partir deste telemóvel. Fale connosco.');
  end if;
  if (select count(*) from frotas where criada > now() - interval '1 hour') >= 30 then
    return jsonb_build_object('erro',
      'Estão a nascer muitas contas agora. Tente daqui a um bocadinho.');
  end if;

  v_id := public._nova_frota(v_nome, p_frota_nome, v_email, v_cod, auth.uid());
  insert into perfis(uid, papel, quem, nome, frota)
    values (auth.uid(), 'dono', 'dono', v_nome, v_id)
    on conflict (uid) do update
      set papel=excluded.papel, quem=excluded.quem, nome=excluded.nome,
          frota=excluded.frota;
  return jsonb_build_object('papel','dono','id','dono','nome',v_nome,'frota',v_id);
end;
$$;

-- ─── o proprietário muda o e-mail ou o código dele ───────────
-- Pede o código actual: um telemóvel esquecido em cima da mesa não
-- chega para ficar com a frota de ninguém.
create or replace function public.mudar_acesso(p_codigo_actual text,
                                               p_email_novo text,
                                               p_codigo_novo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_frota text := (select public.minha_frota());
  v_dono  jsonb;
  v_email text := lower(trim(coalesce(p_email_novo,'')));
  v_cod   text := trim(coalesce(p_codigo_novo,''));
  v_falhas int;
begin
  if (select public.meu_papel()) is distinct from 'dono' then
    return jsonb_build_object('erro','Só o proprietário muda isto.');
  end if;
  select corpo into v_dono from docs
   where frota = v_frota and coleccao='frota' and id='dono';
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

  if v_email = '' then v_email := lower(v_dono->>'email'); end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('erro','Este e-mail não parece estar certo.');
  end if;
  if v_cod <> '' and length(v_cod) < 6 then
    return jsonb_build_object('erro',
      'O código novo tem de ter pelo menos 6 algarismos ou letras.');
  end if;
  perform pg_advisory_xact_lock(hashtext('fleetcv-email:' || v_email));
  if public._email_noutra(v_email, v_frota) then
    return jsonb_build_object('erro','Esse e-mail já está a ser usado noutra conta.');
  end if;

  update docs
     set corpo = (corpo - 'codigo' - 'hash')
                 || jsonb_build_object('email', v_email)
                 || case when v_cod <> ''
                         then jsonb_build_object('hash',
                                extensions.crypt(v_cod, extensions.gen_salt('bf', 8)))
                         else jsonb_build_object('hash', coalesce(corpo->>'hash',
                                extensions.crypt(corpo->>'codigo',
                                                 extensions.gen_salt('bf', 8))))
                    end,
         quando = now()
   where frota = v_frota and coleccao='frota' and id='dono';
  delete from tentativas where email = lower(v_dono->>'email');
  return jsonb_build_object('ok', true, 'email', v_email);
end;
$$;

-- ─── o proprietário apaga a conta ────────────────────────────
-- Quem experimenta e não fica tem de poder ir-se embora e levar tudo
-- com ele: a frota, os turnos, as fotografias, os condutores. Pede o
-- código, como para mudar o acesso. A frota fundadora não se apaga
-- por aqui — essa, só à mão, no SQL Editor.
create or replace function public.apagar_frota(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_frota text := (select public.minha_frota());
  v_dono  jsonb;
begin
  if (select public.meu_papel()) is distinct from 'dono' then
    return jsonb_build_object('erro','Só o proprietário apaga a conta.');
  end if;
  if (select plano from frotas where id = v_frota) = 'fundador' then
    return jsonb_build_object('erro',
      'A frota fundadora não se apaga pela aplicação.');
  end if;
  select corpo into v_dono from docs
   where frota = v_frota and coleccao='frota' and id='dono';
  if not public._codigo_certo(v_dono, trim(coalesce(p_codigo,''))) then
    return jsonb_build_object('erro','O código não está certo.');
  end if;
  delete from perfis where frota = v_frota;
  delete from frotas where id = v_frota;       -- e os docs vão com ela
  return jsonb_build_object('ok', true);
end;
$$;

-- ─── a semente, para quem instala à mão ──────────────────────
-- Numa base vazia, cria a primeira frota a partir do SQL Editor.
-- Havendo já alguma, não mexe em nada. As contas novas nascem pela
-- aplicação (criar_frota); isto fica só para a primeira instalação.
create or replace function public.semear(p_email text, p_codigo text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from frotas) then
    return 'Já estava semeada — nada mudou.';
  end if;
  perform public._nova_frota('Proprietário', 'A minha frota',
                             p_email, p_codigo, null, 'f1');
  -- a primeira é a de quem instala: não tem prazo
  update frotas set plano = 'fundador', ate = null where id = 'f1';
  return 'Pronto. Entre com ' || lower(trim(p_email)) || ' e o código que escolheu.';
end;
$$;

-- ─── a lista que os condutores vêem ──────────────────────────
-- A lista dos condutores leva o código de cada um: o patrão precisa
-- dele para o mandar. Mas um condutor que a lesse ficava com o código
-- de todos os colegas — e entrava como qualquer um deles. Por isso os
-- condutores não a lêem: lêem esta, que a base refaz sozinha sempre
-- que o patrão mexe na verdadeira, só com o nome de cada um.
create or replace function public._equipa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into docs(frota, coleccao, id, corpo, quando)
  values (new.frota, 'frota', 'equipa',
          jsonb_build_object('lista', coalesce((
            select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                     'id', c->'id', 'nome', c->'nome', 'estado', c->'estado')))
              from jsonb_array_elements(coalesce(new.corpo->'lista','[]'::jsonb)) c),
            '[]'::jsonb)),
          now())
  on conflict (frota, coleccao, id)
    do update set corpo = excluded.corpo, quando = excluded.quando;
  return null;
end;
$$;

drop trigger if exists docs_equipa on public.docs;
create trigger docs_equipa
  after insert or update on public.docs
  for each row when (new.coleccao = 'frota' and new.id = 'condutores')
  execute function public._equipa();

-- E ao gravar a lista, a base confere que nenhum dos e-mails está já
-- noutra frota. O ecrã do patrão pergunta antes (email_livre); isto é
-- para o caso de um telemóvel que não pergunte.
create or replace function public._emails_unicos()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_mail text;
begin
  select lower(c->>'email') into v_mail
    from jsonb_array_elements(coalesce(new.corpo->'lista','[]'::jsonb)) c
   where coalesce(c->>'email','') <> ''
     and public._email_noutra(c->>'email', new.frota)
   limit 1;
  if v_mail is not null then
    raise exception 'O e-mail % já está a ser usado noutra frota.', v_mail
      using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists docs_emails_unicos on public.docs;
create trigger docs_emails_unicos
  before insert or update on public.docs
  for each row when (new.coleccao = 'frota' and new.id = 'condutores')
  execute function public._emails_unicos();

-- a lista dos condutores de uma base antiga ainda não tem a versão
-- sem códigos: faz-se agora, tocando-lhe sem mudar nada
update public.docs set quando = quando
 where coleccao = 'frota' and id = 'condutores'
   and not exists (select 1 from public.docs e
                    where e.frota = docs.frota
                      and e.coleccao = 'frota' and e.id = 'equipa');

-- ════════════════════════════════════════════════════════════
-- AS REGRAS
-- ════════════════════════════════════════════════════════════
alter table public.docs   enable row level security;
alter table public.perfis enable row level security;
alter table public.frotas enable row level security;

drop policy if exists perfis_meu on public.perfis;
create policy perfis_meu on public.perfis
  for select using (uid = auth.uid());

-- cada um vê a linha da sua frota (o nome, o plano, até quando)
drop policy if exists frotas_minha on public.frotas;
create policy frotas_minha on public.frotas
  for select using (id = (select public.minha_frota()));

-- LER: quem entrou vê a SUA frota. O patrão precisa de ver os turnos
-- de todos, e o condutor precisa de ver a frota para escolher o carro.
-- Os segredos ficam de fora para o condutor: a conta do patrão e a
-- lista com os códigos dos colegas (ele lê a 'equipa', sem códigos).
drop policy if exists docs_ler on public.docs;
create policy docs_ler on public.docs
  for select using (
    frota = (select public.minha_frota())
    and ((select public.meu_papel()) = 'dono'
         or not (coleccao = 'frota' and id in ('dono','condutores')))
  );

-- ESCREVER: aqui é que está o valor disto. Sempre dentro da frota de
-- quem escreve, e:
--   · a frota é do patrão e mais ninguém lhe toca (a conta dele muda
--     só por mudar_acesso, e a 'equipa' é a base que a faz)
--   · um condutor escreve o turno dele, a posição dele e o
--     percurso dele — e nada mais
--   · um turno fechado não se volta a escrever, senão corrigia-se
--     os quilómetros depois de o patrão ter visto o alerta
drop policy if exists docs_escrever on public.docs;
create policy docs_escrever on public.docs
  for insert with check (
    frota = (select public.minha_frota())
    and (
      ((select public.meu_papel()) = 'dono'
        and not (coleccao = 'frota' and id in ('dono','equipa')))
      or (coleccao in ('turnos','vivo') and corpo->>'condutorId' = (select public.meu_id()))
      or (coleccao in ('rastos','fotos') and public.turno_meu(corpo->>'turno'))
    )
  );

drop policy if exists docs_mudar on public.docs;
create policy docs_mudar on public.docs
  for update using (
    frota = (select public.minha_frota())
    and (
      ((select public.meu_papel()) = 'dono'
        and not (coleccao = 'frota' and id in ('dono','equipa')))
      or (coleccao in ('turnos','vivo')
          and corpo->>'condutorId' = (select public.meu_id())
          and (coleccao = 'vivo' or corpo->>'fim' is null))
      or (coleccao in ('rastos','fotos') and public.turno_meu(corpo->>'turno'))
    )
  ) with check (
    frota = (select public.minha_frota())
    and (
      ((select public.meu_papel()) = 'dono'
        and not (coleccao = 'frota' and id in ('dono','equipa')))
      or (coleccao in ('turnos','vivo') and corpo->>'condutorId' = (select public.meu_id()))
      or (coleccao in ('rastos','fotos') and public.turno_meu(corpo->>'turno'))
    )
  );

drop policy if exists docs_apagar on public.docs;
create policy docs_apagar on public.docs
  for delete using (
    frota = (select public.minha_frota())
    and (
      ((select public.meu_papel()) = 'dono'
        and not (coleccao = 'frota' and id in ('dono','equipa')))
      or (coleccao = 'vivo' and corpo->>'condutorId' = (select public.meu_id()))
    )
  );

-- ─── as novidades ao vivo ────────────────────────────────────
-- É isto que faz o carro mexer-se no ecrã do patrão sem ninguém
-- carregar em nada. O Supabase aplica as regras de LER a cada
-- novidade, por isso cada telemóvel só recebe as da sua frota.
-- (Os apagamentos são a excepção — chegam a todos, só com a chave —
-- e é por isso que a chave leva a frota e a aplicação a confere.)
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime'
                   and schemaname='public' and tablename='docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- ─── quem pode chamar o quê ──────────────────────────────────
-- O "from public" é o que conta: o Postgres dá execute a toda a gente
-- assim que uma função nasce, e tirá-la só ao anon e ao authenticated
-- não tirava nada — continuavam a herdá-la por PUBLIC.
--
-- A semente e as peças internas só se correm por dentro. Se a semente
-- ficasse ao alcance de qualquer telemóvel, o primeiro a chegar a uma
-- base vazia ficava dono dela.
revoke execute on function public.semear(text,text)
  from public, anon, authenticated;
revoke execute on function public._nova_frota(text,text,text,text,uuid,text)
  from public, anon, authenticated;
revoke execute on function public._email_noutra(text,text)
  from public, anon, authenticated;
revoke execute on function public._codigo_certo(jsonb,text)
  from public, anon, authenticated;
revoke execute on function public._equipa() from public, anon, authenticated;
revoke execute on function public._emails_unicos() from public, anon, authenticated;
-- entrar e criar conta têm de estar abertas: são as portas. Mas só a
-- quem já tem sessão (anónima que seja) — é ela que fica marcada.
revoke execute on function public.entrar(text,text) from public;
grant  execute on function public.entrar(text,text) to anon, authenticated;
revoke execute on function public.sair() from public;
grant  execute on function public.sair() to anon, authenticated;
revoke execute on function public.criar_frota(text,text,text,text) from public, anon;
grant  execute on function public.criar_frota(text,text,text,text) to authenticated;
revoke execute on function public.mudar_acesso(text,text,text) from public, anon;
grant  execute on function public.mudar_acesso(text,text,text) to authenticated;
revoke execute on function public.apagar_frota(text) from public, anon;
grant  execute on function public.apagar_frota(text) to authenticated;
revoke execute on function public.email_livre(text) from public, anon;
grant  execute on function public.email_livre(text) to authenticated;
-- Estas são de uso interno das regras. Mesmo não deixando ver nada de
-- ninguém (devolvem sempre o que é de quem pergunta), não têm de estar
-- abertas a quem ainda nem entrou.
revoke execute on function public.meu_papel()     from public, anon;
revoke execute on function public.meu_id()        from public, anon;
revoke execute on function public.minha_frota()   from public, anon;
revoke execute on function public.turno_meu(text) from public, anon;
grant  execute on function public.meu_papel() to authenticated;
grant  execute on function public.meu_id() to authenticated;
grant  execute on function public.minha_frota() to authenticated;
grant  execute on function public.turno_meu(text) to authenticated;
grant  select, insert, update, delete on public.docs to authenticated;
grant  select on public.perfis to authenticated;
grant  select on public.frotas to authenticated;
-- a tabela da trava não se lê nem se escreve de fora. O Supabase dá
-- tudo por omissão às tabelas novas, por isso tira-se à mão.
revoke all on public.tentativas from public, anon, authenticated;
revoke all on public.docs   from anon;
revoke all on public.perfis from anon;
revoke all on public.frotas from anon;
revoke insert, update, delete on public.frotas from authenticated;
revoke insert, update, delete on public.perfis from authenticated;
