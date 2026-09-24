-- Esquema da base de dados do site Lutuima Veiga.
--
-- Reconstruído a partir da aplicação publicada em lutuimaveiga.com: os nomes
-- das tabelas, colunas e valores vêm das chamadas que o site original fazia
-- ao Supabase. A base de dados original ficou inacessível com a perda da conta
-- Lovable, por isso o esquema é recriado aqui de raiz.

-- ---------------------------------------------------------------- enumerações

create type service_type as enum ('15_minutes', '30_minutes');

create type contact_preference as enum (
  'whatsapp_voice',   -- Chamada de Voz WhatsApp
  'whatsapp_video',   -- Chamada de Vídeo WhatsApp
  'normal_voice'      -- Chamada de Voz Normal
);

create type appointment_status as enum ('pending', 'confirmed', 'cancelled');

create type payment_status as enum ('pending', 'paid', 'failed');

-- ------------------------------------------------------------------- serviços

-- Uma linha por oferta de consultoria. Cada linha carrega os dois preços
-- (15 e 30 minutos), tal como no site original.
create table services (
  id                uuid primary key default gen_random_uuid(),
  active            boolean not null default true,
  price_15_minutes  numeric(10, 2) not null,
  price_30_minutes  numeric(10, 2) not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ------------------------------------------------------------ datas bloqueadas

-- Dias em que não se aceitam marcações, geridos pela administração.
create table blocked_dates (
  id           uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason       text,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------- marcações

create table appointments (
  id                 uuid primary key default gen_random_uuid(),
  client_name        text not null,
  client_surname     text not null,
  client_email       text not null,
  client_phone       text not null,
  client_instagram   text,
  service_type       service_type not null,
  scheduled_date     date not null,
  scheduled_time     time not null,
  contact_preference contact_preference not null,
  notes              text,
  amount             numeric(10, 2) not null,
  status             appointment_status not null default 'pending',
  payment_status     payment_status not null default 'pending',
  stripe_session_id  text,
  created_at         timestamptz not null default now()
);

-- Duas pessoas não podem reservar a mesma hora. A verificação que o site faz
-- antes de gravar é uma cortesia; esta restrição é o que realmente garante.
-- Marcações falhadas libertam a hora, por isso ficam de fora do índice.
create unique index appointments_slot_unico
  on appointments (scheduled_date, scheduled_time)
  where payment_status <> 'failed';

create index appointments_por_data on appointments (scheduled_date desc);

-- ----------------------------------------------------------- administradores

create table admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- O site chama esta função para decidir se mostra a área administrativa.
-- SECURITY DEFINER para poder ler admin_users sem expor a tabela, e search_path
-- fixo para que não possa ser desviada por um schema plantado pelo chamador.
create or replace function check_is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = _user_id);
$$;

grant execute on function check_is_admin(uuid) to anon, authenticated;

-- --------------------------------------------------------- segurança das linhas

alter table services      enable row level security;
alter table blocked_dates enable row level security;
alter table appointments  enable row level security;
alter table admin_users   enable row level security;

-- Preços e dias bloqueados são informação pública: a página inicial e o
-- formulário de marcação leem-nos sem sessão iniciada.
create policy "preços visíveis a todos"
  on services for select
  to anon, authenticated
  using (true);

create policy "datas bloqueadas visíveis a todos"
  on blocked_dates for select
  to anon, authenticated
  using (true);

-- Qualquer visitante pode criar uma marcação, mas apenas por pagar: o estado
-- inicial é imposto aqui para que ninguém se auto-confirme sem passar pelo
-- Stripe.
create policy "qualquer visitante pode marcar"
  on appointments for insert
  to anon, authenticated
  with check (status = 'pending' and payment_status = 'pending');

-- Ler marcações alheias exporia dados pessoais de clientes, por isso a leitura
-- é exclusiva da administração. O site consulta uma marcação concreta pelo seu
-- id nas páginas de pagamento — essas passam pelas edge functions, que usam a
-- service role e não estão sujeitas a estas políticas.
create policy "só administradores veem marcações"
  on appointments for select
  to authenticated
  using (check_is_admin(auth.uid()));

create policy "só administradores alteram marcações"
  on appointments for update
  to authenticated
  using (check_is_admin(auth.uid()))
  with check (check_is_admin(auth.uid()));

create policy "administradores gerem datas bloqueadas"
  on blocked_dates for all
  to authenticated
  using (check_is_admin(auth.uid()))
  with check (check_is_admin(auth.uid()));

create policy "administradores veem a própria entrada"
  on admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- ------------------------------------------------------------- dados iniciais

-- ATENÇÃO: os preços reais perderam-se com a base de dados original. Estes
-- valores são um marcador de posição — confirmar com o cliente e corrigir com:
--   update services set price_15_minutes = X, price_30_minutes = Y;
insert into services (active, price_15_minutes, price_30_minutes)
values (true, 25.00, 45.00);

-- ------------------------------------------- restrição de check_is_admin
-- Aplicado depois do esquema inicial, em resposta ao analisador de segurança
-- do Supabase: sem esta guarda qualquer pessoa podia percorrer ids de
-- utilizadores e descobrir quais são administradores.

create or replace function check_is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and _user_id = auth.uid()
     and exists (select 1 from admin_users where user_id = _user_id);
$$;

revoke execute on function check_is_admin(uuid) from anon;
grant execute on function check_is_admin(uuid) to authenticated;

-- ------------------------- leitura anónima sem expor dados pessoais
-- O site precisa de ler marcações sem sessão iniciada, para saber que horas
-- estão ocupadas e para mostrar o resumo na página de pagamento. Mas as
-- marcações contêm nome, email e telefone de clientes reais.
--
-- A política autoriza a leitura; as permissões de coluna decidem o que é
-- legível. Consultas com `select *` passam a falhar para o papel anónimo,
-- por isso o cliente pede as colunas explicitamente
-- (ver APPOINTMENT_PUBLIC_COLUMNS em src/integrations/supabase/types.ts).

create policy "leitura publica das colunas de agendamento"
  on appointments for select
  to anon
  using (true);

revoke select on appointments from anon;

grant select (
  id, service_type, scheduled_date, scheduled_time,
  amount, status, payment_status, created_at
) on appointments to anon;
