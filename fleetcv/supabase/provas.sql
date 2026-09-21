-- ════════════════════════════════════════════════════════════
-- AS REGRAS, POSTAS À PROVA
--
-- Correr com  ./provar.sh  — ele trata do Postgres.
--
-- É aqui que se vê se o produto faz o que promete. Tudo o resto
-- (os ecrãs, o mapa, as contas) é conforto. Isto é o que impede um
-- condutor de escrever no telemóvel dele que andou 40 km quando
-- andou 200, ou de voltar atrás nos quilómetros depois de o patrão
-- ter visto o alerta.
--
-- Cada linha diz "(certo)" ou "(MAL)". O provar.sh conta os MAL.
-- ════════════════════════════════════════════════════════════
\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

insert into auth.users values ('11111111-1111-1111-1111-111111111111'),
                              ('22222222-2222-2222-2222-222222222222'),
                              ('33333333-3333-3333-3333-333333333333')
  on conflict do nothing;

-- a frota inicial, posta por quem é dono da base (como o SQL Editor)
select semear('patrao@exemplo.cv','9999');
update docs set corpo='{"lista":[{"id":"c1","matricula":"ST-28-ED"}]}'::jsonb
  where coleccao='frota' and id='carros';
update docs set corpo='{"lista":[
  {"id":"m1","nome":"António","email":"a@x.cv","codigo":"1234"},
  {"id":"m2","nome":"Jorge","email":"j@x.cv","codigo":"2345"}]}'::jsonb
  where coleccao='frota' and id='condutores';

-- ─── O PATRÃO ────────────────────────────────────────────────
call quem('11111111-1111-1111-1111-111111111111');
select ' 1 · o patrão entra: ' ||
  case when (entrar('patrao@exemplo.cv','9999'))->>'papel' = 'dono'
       then 'como dono (certo)' else 'NÃO ENTROU (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values ('frota','extra','{"x":1}'::jsonb)
  on conflict (coleccao,id) do update set corpo=excluded.corpo;
reset role;
select ' 2 · o patrão escreve na frota: ' ||
  case when exists(select 1 from docs where coleccao='frota' and id='extra')
       then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;

-- ─── O CONDUTOR, NOUTRO TELEMÓVEL ────────────────────────────
call quem('22222222-2222-2222-2222-222222222222');
select ' 3 · o António entra: ' ||
  case when (entrar('a@x.cv','1234'))->>'id' = 'm1'
       then 'e é o m1 (certo)' else 'NÃO ENTROU (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values ('frota','carros','{"lista":[]}'::jsonb)
  on conflict (coleccao,id) do update set corpo=excluded.corpo;
reset role;
select ' 4 · o condutor mexe na frota: ' ||
  case when (select corpo->'lista'->0->>'matricula' from docs
             where coleccao='frota' and id='carros') = 'ST-28-ED'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('turnos','t1','{"id":"t1","condutorId":"m1","kmGps":40}'::jsonb);
reset role;
select ' 5 · escreve o turno DELE: ' ||
  case when exists(select 1 from docs where coleccao='turnos' and id='t1')
       then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('turnos','t2','{"id":"t2","condutorId":"m2","kmGps":40}'::jsonb);
reset role;
select ' 6 · escreve o turno de OUTRO: ' ||
  case when exists(select 1 from docs where coleccao='turnos' and id='t2')
       then 'DEIXOU PASSAR (MAL)' else 'RECUSOU (certo)' end;

-- o percurso e as fotos pertencem ao turno, e é o turno que diz de quem são
set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('rastos','r1','{"turno":"t1","pontos":[1,2]}'::jsonb);
insert into docs(coleccao,id,corpo) values
  ('fotos','f9','{"turno":"t2","img":"x"}'::jsonb);
reset role;
select ' 7 · sobe o percurso do turno dele: ' ||
  case when exists(select 1 from docs where coleccao='rastos' and id='r1')
       then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;
select ' 8 · sobe uma foto para o turno de outro: ' ||
  case when exists(select 1 from docs where coleccao='fotos' and id='f9')
       then 'DEIXOU PASSAR (MAL)' else 'RECUSOU (certo)' end;

set role authenticated;
update docs set corpo = corpo || '{"fim":1700000000000}'::jsonb
  where coleccao='turnos' and id='t1';
reset role;
select ' 9 · fecha o turno dele: ' ||
  case when (select corpo->>'fim' from docs where coleccao='turnos' and id='t1')
            is not null then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;

-- ─── O QUE ISTO TODO EXISTE PARA IMPEDIR ─────────────────────
set role authenticated;
update docs set corpo = corpo || '{"kmGps":5}'::jsonb
  where coleccao='turnos' and id='t1';
reset role;
select '10 · volta atrás nos km de um turno fechado: ' ||
  case when (select corpo->>'kmGps' from docs where coleccao='turnos' and id='t1')='40'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('turnos','t1','{"id":"t1","condutorId":"m1","kmGps":5}'::jsonb)
  on conflict (coleccao,id) do update set corpo=excluded.corpo;
reset role;
select '11 · o mesmo, mas por upsert: ' ||
  case when (select corpo->>'kmGps' from docs where coleccao='turnos' and id='t1')='40'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
delete from docs where coleccao='frota' and id='carros';
reset role;
select '12 · apaga a frota: ' ||
  case when exists(select 1 from docs where coleccao='frota' and id='carros')
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

create or replace function public._tenta_semear() returns text
  language plpgsql as $x$
  begin perform semear('ladrao@x.cv','0000');
        return 'DEIXOU PASSAR (MAL)';
  exception when others then return 'RECUSOU (certo)'; end $x$;
set role authenticated;
select '13 · chama semear e fica dono da frota: ' || public._tenta_semear();
reset role;

set role authenticated;
select '14 · o condutor vê a frota para escolher o carro: ' ||
  case when (select count(*) from docs where coleccao='frota')>=4
       then 'VÊ (certo)' else 'NÃO VÊ (MAL)' end;
reset role;

-- ─── UM APARELHO QUE NÃO ENTROU ──────────────────────────────
call quem('33333333-3333-3333-3333-333333333333');
set role authenticated;
select '15 · quem não entrou lê: ' ||
  case when (select count(*) from docs)=0 then 'NADA (certo)'
       else 'VÊ COISAS (MAL)' end;
reset role;

-- ─── A TRAVA ─────────────────────────────────────────────────
-- cinco enganos seguidos
select entrar('j@x.cv','000'||i) from generate_series(1,5) i;
select '16 · ao quinto engano ainda diz só que está errado: ' ||
  case when (select falhas from tentativas where email='j@x.cv') = 5
       then 'cinco contados (certo)' else 'CONTOU MAL (MAL)' end;
select '17 · à sexta, fecha-se: ' ||
  case when (entrar('j@x.cv','0006'))->>'erro' like 'Demasiadas%'
       then 'travou (certo)' else 'DEIXOU CONTINUAR (MAL)' end;
select '18 · e nem o código certo abre: ' ||
  case when (entrar('j@x.cv','2345'))->>'erro' like 'Demasiadas%'
       then 'continua travado (certo)' else 'ABRIU (MAL)' end;
update tentativas set ultima = now() - interval '20 minutes' where email='j@x.cv';
select '19 · passado o quarto de hora, entra: ' ||
  case when (entrar('j@x.cv','2345'))->>'id' = 'm2'
       then 'entrou (certo)' else 'NÃO ENTROU (MAL)' end;
