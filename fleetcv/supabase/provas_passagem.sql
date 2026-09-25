-- ════════════════════════════════════════════════════════════
-- A PASSAGEM, POSTA À PROVA
--
-- Há uma base no ar, da versão de uma frota só, com a frota do Yanick
-- lá dentro e telemóveis que já entraram. A versão nova tem de passar
-- por cima disso sem deixar ninguém à porta. Isto monta uma base como
-- essa, com dados, carrega o esquema novo por cima — duas vezes — e
-- confere.
-- ════════════════════════════════════════════════════════════
\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

-- a base como estava: uma frota só
\ir _esquema_antigo.sql
insert into auth.users values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
                              ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
  on conflict do nothing;
select semear('dono@antigo.cv','970000');
update docs set corpo='{"lista":[{"id":"m1","nome":"Maria","email":"maria@antigo.cv","codigo":"4321"}]}'::jsonb
  where coleccao='frota' and id='condutores';
insert into docs(coleccao,id,corpo) values
  ('turnos','t9','{"id":"t9","condutorId":"m1","kmGps":29.6,"fim":1}'::jsonb);
-- um telemóvel que já tinha entrado como patrão
call quem('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select entrar('dono@antigo.cv','970000') is not null;

-- a versão nova por cima, duas vezes
\ir esquema.sql
\ir esquema.sql

select 'P1 · tudo o que lá estava ficou na frota f1: ' ||
  case when not exists (select 1 from docs where frota is distinct from 'f1')
        and (select count(*) from docs) >= 6
       then 'tudo (certo)' else 'PERDEU-SE ALGO (MAL)' end;
select 'P2 · a f1 é a do fundador, sem prazo: ' ||
  case when (select plano='fundador' and ate is null from frotas where id='f1')
       then 'sem prazo (certo)' else 'COM PRAZO (MAL)' end;
select 'P3 · o telemóvel que já tinha entrado continua dentro, na f1: ' ||
  case when (select frota from perfis
              where uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 'f1'
       then 'continua (certo)' else 'FICOU À PORTA (MAL)' end;
set role authenticated;
select 'P4 · e vê a frota dele sem voltar a entrar: ' ||
  case when (select count(*) from docs where coleccao='turnos') = 1
       then 'vê (certo)' else 'NÃO VÊ (MAL)' end;
reset role;
select 'P5 · o patrão entra com o código de sempre: ' ||
  case when (entrar('dono@antigo.cv','970000'))->>'frota' = 'f1'
       then 'entra (certo)' else 'NÃO ENTRA (MAL)' end;
call quem('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
select 'P6 · a condutora entra com o código dela: ' ||
  case when (entrar('maria@antigo.cv','4321'))->>'frota' = 'f1'
       then 'entra (certo)' else 'NÃO ENTRA (MAL)' end;
set role authenticated;
select 'P7 · e já não lê o código do patrão, mas vê a equipa: ' ||
  case when (select count(*) from docs where coleccao='frota' and id='dono') = 0
        and (select corpo->'lista'->0->>'nome' from docs
              where coleccao='frota' and id='equipa') = 'Maria'
       then 'certo (certo)' else 'MAL (MAL)' end;
reset role;
call quem('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
set role authenticated;
select 'P8 · o patrão muda o código e ele passa a ficar baralhado: ' ||
  case when (mudar_acesso('970000','','nova-senha'))->>'ok' = 'true'
       then 'mudou (certo)' else 'NÃO MUDOU (MAL)' end;
reset role;
select 'P9 · sem o código à vista em lado nenhum: ' ||
  case when (select not corpo ? 'codigo' and corpo ? 'hash'
               from docs where coleccao='frota' and id='dono')
        and (entrar('dono@antigo.cv','nova-senha'))->>'papel' = 'dono'
       then 'baralhado e a abrir (certo)' else 'MAL (MAL)' end;
