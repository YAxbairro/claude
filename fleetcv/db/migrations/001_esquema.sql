-- FleetCV · 001 · Esquema base
-- Ver SPEC.md secção 13. Dinheiro em cêntimos (inteiro), distâncias em metros (inteiro),
-- datas em UTC. Nada de vírgula flutuante em dinheiro.

create schema if not exists fleetcv;

-- ─── Tipos ───────────────────────────────────────────────────────────────────

create type fleetcv.papel as enum ('PROPRIETARIO','GESTOR','MOTORISTA','AUDITOR');

create type fleetcv.estado_turno as enum (
  'ABERTO','FECHADO','FECHADO_AUTOMATICO','FECHADO_PELO_GESTOR','ANULADO');

create type fleetcv.estado_carro as enum ('ACTIVO','INDISPONIVEL','VENDIDO');

create type fleetcv.tipo_combustivel as enum ('GASOLINA','GASOLEO');

create type fleetcv.nivel_alerta as enum ('INFO','AVISO','CRITICO');

create type fleetcv.resolucao_alerta as enum ('JUSTIFICADO','CONFIRMADO','ERRO_SISTEMA');

create type fleetcv.tipo_foto as enum (
  'QUADRANTE_ABERTURA','QUADRANTE_FECHO','TALAO','BOMBA');

-- ─── Organização e utilizadores ──────────────────────────────────────────────

create table fleetcv.organizacao (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  ilha         text not null,
  definicoes   jsonb not null default '{}',   -- ver SPEC §15
  criado_em    timestamptz not null default now()
);

create table fleetcv.utilizador (
  id              uuid primary key default gen_random_uuid(),
  organizacao_id  uuid not null references fleetcv.organizacao(id),
  nome            text not null,
  telefone        text not null,
  papel           fleetcv.papel not null,
  pin_hash        text,
  aparelho_id     text,                        -- um motorista, um aparelho
  activo          boolean not null default true,
  criado_em       timestamptz not null default now(),
  unique (organizacao_id, telefone)
);

-- ─── Frota ───────────────────────────────────────────────────────────────────

create table fleetcv.carro (
  id                       uuid primary key default gen_random_uuid(),
  organizacao_id           uuid not null references fleetcv.organizacao(id),
  matricula                text not null,
  marca                    text,
  modelo                   text,
  ano                      int,
  tipo_combustivel         fleetcv.tipo_combustivel not null,
  capacidade_deposito_l    numeric(6,2) not null,
  consumo_referencia_l100  numeric(5,2) not null,   -- só até haver histórico real
  km_actual                int not null default 0,
  estado                   fleetcv.estado_carro not null default 'ACTIVO',
  criado_em                timestamptz not null default now(),
  unique (organizacao_id, matricula),
  constraint deposito_plausivel check (capacidade_deposito_l between 20 and 200)
);

-- Carro na oficina ou parado: os km que anda aqui não geram alerta de uso
-- fora de turno (R34). Sem isto, o dono recebia alertas falsos e deixava de olhar.
create table fleetcv.indisponibilidade (
  id         uuid primary key default gen_random_uuid(),
  carro_id   uuid not null references fleetcv.carro(id),
  inicio     timestamptz not null,
  fim        timestamptz,
  motivo     text not null,
  criado_em  timestamptz not null default now()
);

-- ─── Referências: postos, preços, zonas ──────────────────────────────────────

create table fleetcv.posto (
  id              uuid primary key default gen_random_uuid(),
  organizacao_id  uuid references fleetcv.organizacao(id),  -- nulo = posto global
  nome            text not null,
  marca           text,
  lat             double precision not null,
  lon             double precision not null,
  ilha            text not null
);

-- Preço fixado pela ARME, muda todos os meses (SPEC §5.4 R21).
create table fleetcv.preco_combustivel (
  id                uuid primary key default gen_random_uuid(),
  ilha              text not null,
  tipo              fleetcv.tipo_combustivel not null,
  preco_cts_litro   int not null check (preco_cts_litro > 0),
  valido_de         date not null,
  valido_ate        date,
  unique (ilha, tipo, valido_de)
);

-- Zonas como círculos (centro + raio), não polígonos: evita a dependência de
-- PostGIS e chega para o que a v1 precisa (base, postos, área de operação).
create table fleetcv.zona (
  id              uuid primary key default gen_random_uuid(),
  organizacao_id  uuid not null references fleetcv.organizacao(id),
  nome            text not null,
  lat             double precision not null,
  lon             double precision not null,
  raio_m          int not null,
  tipo            text not null default 'OPERACAO'
);

-- ─── Fotos ───────────────────────────────────────────────────────────────────

create table fleetcv.foto (
  id              uuid primary key default gen_random_uuid(),
  organizacao_id  uuid not null references fleetcv.organizacao(id),
  caminho         text not null,
  hash_sha256     text not null,
  bytes           int,
  tipo            fleetcv.tipo_foto not null,
  lat             double precision,
  lon             double precision,
  capturado_em    timestamptz not null,
  recebido_em     timestamptz not null default now()
);

-- R26: a mesma foto não passa duas vezes na mesma organização.
create unique index foto_hash_unico on fleetcv.foto (organizacao_id, hash_sha256);

-- ─── Turno ───────────────────────────────────────────────────────────────────

create table fleetcv.turno (
  id                     uuid primary key,          -- gerado no telemóvel (idempotência)
  organizacao_id         uuid not null references fleetcv.organizacao(id),
  carro_id               uuid not null references fleetcv.carro(id),
  motorista_id           uuid not null references fleetcv.utilizador(id),
  estado                 fleetcv.estado_turno not null default 'ABERTO',

  aberto_em              timestamptz not null,
  fechado_em             timestamptz,

  km_inicial             int not null,
  km_inicial_ocr         int,                       -- o que o OCR leu, antes de confirmar
  foto_inicial_id        uuid references fleetcv.foto(id),
  km_final               int,
  km_final_ocr           int,
  foto_final_id          uuid references fleetcv.foto(id),

  km_gps_m               int,
  duracao_s              int,
  segundos_sem_gps       int not null default 0,

  total_combustivel_cts  bigint not null default 0,
  total_litros           numeric(8,3) not null default 0,

  relogio_suspeito       boolean not null default false,
  mock_detectado         boolean not null default false,
  sem_gps_desde_inicio   boolean not null default false,
  bateria_final_pct      int,

  fechado_por            uuid references fleetcv.utilizador(id),
  criado_em              timestamptz not null default now(),

  constraint km_final_coerente check (km_final is null or km_final >= km_inicial)
);

-- Regra dura: um carro só pode ter um turno aberto; um motorista também.
create unique index turno_um_aberto_por_carro
  on fleetcv.turno (carro_id) where estado = 'ABERTO';
create unique index turno_um_aberto_por_motorista
  on fleetcv.turno (motorista_id) where estado = 'ABERTO';

create index turno_carro_tempo on fleetcv.turno (carro_id, aberto_em desc);
create index turno_motorista_tempo on fleetcv.turno (motorista_id, aberto_em desc);

-- ─── Pontos de GPS (a tabela que cresce) ─────────────────────────────────────
-- ≈1,4 milhões de linhas/mês com 20 carros. Particionada por mês para que a
-- limpeza aos 90 dias seja um DROP de partição e não um DELETE gigante.
create table fleetcv.ponto_gps (
  id                bigint generated always as identity,
  turno_id          uuid not null references fleetcv.turno(id),
  lat               double precision not null,
  lon               double precision not null,
  precisao_m        int,
  velocidade_kmh    numeric(5,1),
  bateria_pct       int,
  mock              boolean not null default false,   -- R10: localização falsa
  monotonico_ms     bigint,                           -- relógio que não se pode mexer
  desvio_relogio_s  int,                              -- medido pelo telemóvel na última sincronização
  capturado_em      timestamptz not null,
  recebido_em       timestamptz not null default now(),
  primary key (id, capturado_em)
) partition by range (capturado_em);

create table fleetcv.ponto_gps_default partition of fleetcv.ponto_gps default;

create index ponto_gps_turno on fleetcv.ponto_gps (turno_id, capturado_em);

-- ─── Abastecimento ───────────────────────────────────────────────────────────

create table fleetcv.abastecimento (
  id                    uuid primary key,        -- gerado no telemóvel (idempotência)
  organizacao_id        uuid not null references fleetcv.organizacao(id),
  turno_id              uuid not null references fleetcv.turno(id),
  carro_id              uuid not null references fleetcv.carro(id),
  motorista_id          uuid not null references fleetcv.utilizador(id),

  valor_cts             bigint not null check (valor_cts > 0),
  preco_cts_litro       int not null,
  litros                numeric(8,3) not null,   -- calculado: valor ÷ preço oficial
  litros_ocr            numeric(8,3),            -- o que o OCR leu no talão

  posto_id              uuid references fleetcv.posto(id),
  posto_texto           text,
  lat                   double precision,
  lon                   double precision,

  foto_talao_id         uuid references fleetcv.foto(id),
  hash_talao            text,                    -- posto+valor+hora: o mesmo talão não passa 2x
  km_no_momento         int,                     -- estimado no fecho do turno

  confirmado_no_rasto   boolean,                 -- R24: o carro estava mesmo no posto?
  capturado_em          timestamptz not null,
  recebido_em           timestamptz not null default now()
);

create index abastecimento_carro_tempo on fleetcv.abastecimento (carro_id, capturado_em);
create index abastecimento_turno on fleetcv.abastecimento (turno_id);
create unique index abastecimento_talao_unico
  on fleetcv.abastecimento (organizacao_id, hash_talao) where hash_talao is not null;

-- ─── Alertas ─────────────────────────────────────────────────────────────────

create table fleetcv.catalogo_alerta (
  codigo      text primary key,
  nivel       fleetcv.nivel_alerta not null,
  descricao   text not null,
  regra       text                                  -- regra do SPEC que o origina
);

create table fleetcv.alerta (
  id                uuid primary key default gen_random_uuid(),
  organizacao_id    uuid not null references fleetcv.organizacao(id),
  codigo            text not null references fleetcv.catalogo_alerta(codigo),
  nivel             fleetcv.nivel_alerta not null,
  turno_id          uuid references fleetcv.turno(id),
  carro_id          uuid references fleetcv.carro(id),
  motorista_id      uuid references fleetcv.utilizador(id),
  abastecimento_id  uuid references fleetcv.abastecimento(id),
  dados             jsonb not null default '{}',
  ocorrencias       int not null default 1,        -- agrupamento anti-ruído
  -- Quando o facto aconteceu (hora do turno) vs quando a linha foi escrita.
  -- Com sincronização offline os dois podem estar a dias de distância, e é o
  -- primeiro que conta para relatórios e para o score.
  ocorrido_em       timestamptz not null default now(),
  criado_em         timestamptz not null default now(),
  fechado_em        timestamptz,
  fechado_por       uuid references fleetcv.utilizador(id),
  resolucao         fleetcv.resolucao_alerta,
  nota              text
);

-- Agrupamento (SPEC §6.3): o mesmo alerta no mesmo contexto não se repete.
create unique index alerta_unico_por_contexto
  on fleetcv.alerta (codigo, coalesce(abastecimento_id, turno_id));

create index alerta_abertos on fleetcv.alerta (organizacao_id, criado_em desc)
  where fechado_em is null;

-- ─── Consumo ─────────────────────────────────────────────────────────────────
-- Janela acumulada, não turno a turno (R27): com abastecimentos parciais o
-- depósito nunca está no mesmo nível, por isso a conta diária não significa nada.
create table fleetcv.consumo_janela (
  id                uuid primary key default gen_random_uuid(),
  carro_id          uuid not null references fleetcv.carro(id),
  abastecimento_id  uuid not null references fleetcv.abastecimento(id),
  litros            numeric(8,3) not null,
  km                int not null,
  l100              numeric(6,2) not null,
  referencia_l100   numeric(6,2),                  -- média móvel do carro a 90 dias
  desvio_pct        numeric(6,2),
  criado_em         timestamptz not null default now(),
  unique (abastecimento_id)
);

-- ─── Score ───────────────────────────────────────────────────────────────────

create table fleetcv.penalizacao (
  codigo   text primary key references fleetcv.catalogo_alerta(codigo),
  pontos   int not null
);

create table fleetcv.score_motorista (
  motorista_id  uuid not null references fleetcv.utilizador(id),
  janela_de     date not null,
  janela_ate    date not null,
  valor         int not null check (valor between 0 and 100),
  detalhe       jsonb not null default '{}',
  calculado_em  timestamptz not null default now(),
  primary key (motorista_id, janela_ate)
);
