-- ════════════════════════════════════════════════════════════
-- AS REGRAS, POSTAS À PROVA
--
-- Correr com  ./provar.sh  — ele trata do Postgres.
--
-- É aqui que se vê se o produto faz o que promete. Tudo o resto
-- (os ecrãs, o mapa, as contas) é conforto. Isto é o que impede um
-- condutor de escrever no telemóvel dele que andou 40 km quando
-- andou 200, ou de voltar atrás nos quilómetros depois de o patrão
-- ter visto o alerta — e, desde que há várias frotas, o que impede um
-- patrão de ver os carros de outro.
--
-- Cada linha diz "(certo)" ou "(MAL)". O provar.sh conta os MAL.
-- ════════════════════════════════════════════════════════════
\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

insert into auth.users values ('11111111-1111-1111-1111-111111111111'),
                              ('22222222-2222-2222-2222-222222222222'),
                              ('33333333-3333-3333-3333-333333333333'),
                              ('44444444-4444-4444-4444-444444444444'),
                              ('55555555-5555-5555-5555-555555555555'),
                              ('66666666-6666-6666-6666-666666666666')
  on conflict do nothing;

-- a frota inicial, posta por quem é dono da base (como o SQL Editor)
select semear('patrao@exemplo.cv','9999');
update docs set corpo='{"lista":[{"id":"c1","matricula":"ST-28-ED"}]}'::jsonb
  where frota='f1' and coleccao='frota' and id='carros';
update docs set corpo='{"lista":[
  {"id":"m1","nome":"António","email":"a@x.cv","codigo":"1234"},
  {"id":"m2","nome":"Jorge","email":"j@x.cv","codigo":"8642"}]}'::jsonb
  where frota='f1' and coleccao='frota' and id='condutores';

-- ─── O PATRÃO ────────────────────────────────────────────────
call quem('11111111-1111-1111-1111-111111111111');
select ' 1 · o patrão entra: ' ||
  case when (entrar('patrao@exemplo.cv','9999'))->>'papel' = 'dono'
       then 'como dono (certo)' else 'NÃO ENTROU (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values ('frota','extra','{"x":1}'::jsonb)
  on conflict (frota,coleccao,id) do update set corpo=excluded.corpo;
reset role;
select ' 2 · o patrão escreve na frota: ' ||
  case when exists(select 1 from docs where frota='f1' and coleccao='frota' and id='extra')
       then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;

-- ─── O CONDUTOR, NOUTRO TELEMÓVEL ────────────────────────────
call quem('22222222-2222-2222-2222-222222222222');
select ' 3 · o António entra: ' ||
  case when (entrar('a@x.cv','1234'))->>'id' = 'm1'
       then 'e é o m1 (certo)' else 'NÃO ENTROU (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values ('frota','carros','{"lista":[]}'::jsonb)
  on conflict (frota,coleccao,id) do update set corpo=excluded.corpo;
reset role;
select ' 4 · o condutor mexe na frota: ' ||
  case when (select corpo->'lista'->0->>'matricula' from docs
             where frota='f1' and coleccao='frota' and id='carros') = 'ST-28-ED'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('turnos','t1','{"id":"t1","condutorId":"m1","kmGps":40}'::jsonb);
reset role;
select ' 5 · escreve o turno DELE: ' ||
  case when exists(select 1 from docs where frota='f1' and coleccao='turnos' and id='t1')
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
  case when (select corpo->>'fim' from docs where frota='f1' and coleccao='turnos' and id='t1')
            is not null then 'PASSOU (certo)' else 'RECUSOU (MAL)' end;

-- ─── O QUE ISTO TODO EXISTE PARA IMPEDIR ─────────────────────
set role authenticated;
update docs set corpo = corpo || '{"kmGps":5}'::jsonb
  where coleccao='turnos' and id='t1';
reset role;
select '10 · volta atrás nos km de um turno fechado: ' ||
  case when (select corpo->>'kmGps' from docs where frota='f1' and coleccao='turnos' and id='t1')='40'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
insert into docs(coleccao,id,corpo) values
  ('turnos','t1','{"id":"t1","condutorId":"m1","kmGps":5}'::jsonb)
  on conflict (frota,coleccao,id) do update set corpo=excluded.corpo;
reset role;
select '11 · o mesmo, mas por upsert: ' ||
  case when (select corpo->>'kmGps' from docs where frota='f1' and coleccao='turnos' and id='t1')='40'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

set role authenticated;
delete from docs where coleccao='frota' and id='carros';
reset role;
select '12 · apaga a frota: ' ||
  case when exists(select 1 from docs where frota='f1' and coleccao='frota' and id='carros')
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
  case when exists(select 1 from docs where coleccao='frota' and id='carros')
        and exists(select 1 from docs where coleccao='frota' and id='config')
       then 'VÊ (certo)' else 'NÃO VÊ (MAL)' end;
reset role;

-- ─── OS SEGREDOS, QUE O CONDUTOR NÃO LÊ ──────────────────────
set role authenticated;
select '15 · o condutor lê a conta do patrão (e o código dele): ' ||
  case when (select count(*) from docs where coleccao='frota' and id='dono')=0
       then 'NÃO LÊ (certo)' else 'LÊ (MAL)' end;
select '16 · o condutor lê a lista com os códigos dos colegas: ' ||
  case when (select count(*) from docs where coleccao='frota' and id='condutores')=0
       then 'NÃO LÊ (certo)' else 'LÊ (MAL)' end;
select '17 · mas vê os nomes dos colegas, sem código nem e-mail: ' ||
  case when (select jsonb_array_length(corpo->'lista') from docs
              where coleccao='frota' and id='equipa') = 2
        and not exists (select 1 from docs, jsonb_array_elements(corpo->'lista') c
                         where coleccao='frota' and id='equipa'
                           and (c ? 'codigo' or c ? 'email'))
       then 'SÓ OS NOMES (certo)' else 'MAL FEITA (MAL)' end;
select '18 · o código do Jorge aparece em algum sítio que o António lê: ' ||
  case when not exists (select 1 from docs where corpo::text like '%8642%')
       then 'EM NENHUM (certo)' else 'APARECE (MAL)' end;
reset role;

-- ─── UM APARELHO QUE NÃO ENTROU ──────────────────────────────
call quem('33333333-3333-3333-3333-333333333333');
set role authenticated;
select '19 · quem não entrou lê: ' ||
  case when (select count(*) from docs)=0 then 'NADA (certo)'
       else 'VÊ COISAS (MAL)' end;
insert into docs(frota,coleccao,id,corpo) values ('f1','vivo','x','{"condutorId":null}'::jsonb);
reset role;
select '20 · quem não entrou escreve: ' ||
  case when not exists (select 1 from docs where coleccao='vivo' and id='x')
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;

-- ─── A TRAVA ─────────────────────────────────────────────────
-- cinco enganos seguidos
select entrar('j@x.cv','000'||i) from generate_series(1,5) i;
select '21 · ao quinto engano ainda diz só que está errado: ' ||
  case when (select falhas from tentativas where email='j@x.cv') = 5
       then 'cinco contados (certo)' else 'CONTOU MAL (MAL)' end;
select '22 · à sexta, fecha-se: ' ||
  case when (entrar('j@x.cv','0006'))->>'erro' like 'Demasiadas%'
       then 'travou (certo)' else 'DEIXOU CONTINUAR (MAL)' end;
select '23 · e nem o código certo abre: ' ||
  case when (entrar('j@x.cv','8642'))->>'erro' like 'Demasiadas%'
       then 'continua travado (certo)' else 'ABRIU (MAL)' end;
update tentativas set ultima = now() - interval '20 minutes' where email='j@x.cv';
select '24 · passado o quarto de hora, entra: ' ||
  case when (entrar('j@x.cv','8642'))->>'id' = 'm2'
       then 'entrou (certo)' else 'NÃO ENTROU (MAL)' end;

-- ════════════════════════════════════════════════════════════
-- UMA SEGUNDA FROTA
-- A Maria chega pela página principal e cria conta. A partir daqui
-- há duas frotas na mesma base, e nenhuma pode ver a outra.
-- ════════════════════════════════════════════════════════════
call quem('44444444-4444-4444-4444-444444444444');
set role authenticated;
select '25 · a Maria cria conta e fica dona de uma frota nova: ' ||
  case when (r->>'papel')='dono' and coalesce(r->>'frota','f1') <> 'f1'
       then 'frota ' || (r->>'frota') || ' (certo)'
       else 'NÃO CRIOU (MAL) ' || r::text end
  from (select criar_frota('Maria Lopes','Táxis Maria','maria@b.cv','abc123') r) x;
reset role;
select set_config('provas.b', (select frota from perfis
  where uid='44444444-4444-4444-4444-444444444444'), false) is not null;

select '26 · o código dela fica baralhado, não à vista: ' ||
  case when (select corpo ? 'hash' and not corpo ? 'codigo'
                    and corpo->>'hash' <> 'abc123'
               from docs where frota=current_setting('provas.b')
                           and coleccao='frota' and id='dono')
       then 'baralhado (certo)' else 'À VISTA (MAL)' end;

select '27 · a frota nova não leva turnos inventados: ' ||
  case when exists (select 1 from docs where frota=current_setting('provas.b')
                       and coleccao='frota' and id='exemplos')
       then 'marcada (certo)' else 'VAI LEVAR (MAL)' end;

set role authenticated;
select '28 · a Maria vê alguma coisa da frota do outro: ' ||
  case when (select count(*) from docs where frota='f1')=0
        and (select count(*) from docs where coleccao='turnos')=0
       then 'NADA (certo)' else 'VÊ (MAL)' end;
select '29 · mas vê a dela: ' ||
  case when (select count(*) from docs where coleccao='frota')>=5
       then 'VÊ (certo)' else 'NÃO VÊ (MAL)' end;
select '30 · e a linha da frota dela, com o prazo da experiência: ' ||
  case when (select count(*) from frotas)=1
        and (select plano from frotas)='ensaio'
        and (select ate from frotas) > now() + interval '29 days'
       then '30 dias (certo)' else 'MAL (MAL)' end;
insert into docs(frota,coleccao,id,corpo)
  values ('f1','frota','carros','{"lista":[]}'::jsonb)
  on conflict (frota,coleccao,id) do update set corpo=excluded.corpo;
insert into docs(coleccao,id,corpo)
  values ('frota','config','{"nome":"Táxis Maria","precoLitro":150}'::jsonb)
  on conflict (frota,coleccao,id) do update set corpo=excluded.corpo;
delete from docs where frota='f1';
update docs set corpo='{}'::jsonb where frota='f1';
reset role;
select '31 · a Maria escreve na frota do outro, dizendo qual é: ' ||
  case when (select corpo->'lista'->0->>'matricula' from docs
             where frota='f1' and coleccao='frota' and id='carros') = 'ST-28-ED'
       then 'RECUSOU (certo)' else 'DEIXOU PASSAR (MAL)' end;
select '32 · o "config" dela vai para a frota dela, não para a do outro: ' ||
  case when (select corpo->>'precoLitro' from docs where frota=current_setting('provas.b')
               and coleccao='frota' and id='config')='150'
        and (select corpo->>'precoLitro' from docs where frota='f1'
               and coleccao='frota' and id='config')='145'
       then 'cada um na sua (certo)' else 'MISTUROU (MAL)' end;
select '33 · a Maria apaga ou estraga a frota do outro: ' ||
  case when (select count(*) from docs where frota='f1' and corpo <> '{}'::jsonb) >= 8
       then 'NÃO TOCOU (certo)' else 'ESTRAGOU (MAL)' end;

-- os e-mails: um e-mail, uma frota
call quem('66666666-6666-6666-6666-666666666666');
set role authenticated;
select '34 · criar conta com o e-mail de outro patrão: ' ||
  case when (criar_frota('Zé','X','PATRAO@exemplo.cv','zzzzzz'))->>'erro' like '%já tem conta%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
select '35 · criar conta com o e-mail de um condutor de outra frota: ' ||
  case when (criar_frota('Zé','X','a@x.cv','zzzzzz'))->>'erro' like '%já tem conta%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
select '36 · criar conta com um código de 4 algarismos: ' ||
  case when (criar_frota('Zé','X','ze@x.cv','1234'))->>'erro' like '%pelo menos 6%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
reset role;

call quem('44444444-4444-4444-4444-444444444444');
set role authenticated;
select '37 · o e-mail de um condutor do outro, visto pela Maria: ' ||
  case when email_livre('a@x.cv') = false and email_livre('novo@b.cv') = true
       then 'ocupado (certo)' else 'MAL (MAL)' end;
update docs set corpo='{"lista":[{"id":"m1","nome":"Roubado","email":"a@x.cv","codigo":"1234"}]}'::jsonb
  where coleccao='frota' and id='condutores';
reset role;
select '38 · e ela junta-o à frota dela à mesma: ' ||
  case when (select jsonb_array_length(corpo->'lista') from docs
              where frota=current_setting('provas.b')
                and coleccao='frota' and id='condutores') = 0
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;

set role authenticated;
update docs set corpo='{"lista":[{"id":"m1","nome":"Rui","email":"r@b.cv","codigo":"1111"}]}'::jsonb
  where coleccao='frota' and id='condutores';
reset role;
select '39 · um condutor dela, com e-mail novo: ' ||
  case when (select corpo->'lista'->0->>'nome' from docs
              where frota=current_setting('provas.b')
                and coleccao='frota' and id='equipa') = 'Rui'
       then 'PASSOU, e a equipa acompanhou (certo)' else 'NÃO PASSOU (MAL)' end;

-- o condutor dela
call quem('55555555-5555-5555-5555-555555555555');
select '40 · o Rui entra, e cai na frota da Maria: ' ||
  case when (r->>'id')='m1' and (r->>'frota')=current_setting('provas.b')
       then 'certinho (certo)' else 'NOUTRA (MAL) ' || r::text end
  from (select entrar('r@b.cv','1111') r) x;
set role authenticated;
select '41 · o Rui vê os turnos da outra frota: ' ||
  case when (select count(*) from docs where coleccao='turnos')=0
       then 'NÃO VÊ (certo)' else 'VÊ (MAL)' end;
insert into docs(coleccao,id,corpo) values
  ('turnos','t1','{"id":"t1","condutorId":"m1","kmGps":7}'::jsonb);
reset role;
select '42 · o Rui abre um "t1" (o mesmo nome de um do outro): ' ||
  case when (select corpo->>'kmGps' from docs where frota=current_setting('provas.b')
               and coleccao='turnos' and id='t1')='7'
        and (select corpo->>'kmGps' from docs where frota='f1'
               and coleccao='turnos' and id='t1')='40'
       then 'cada um o seu (certo)' else 'PISOU O OUTRO (MAL)' end;
set role authenticated;
select '43 · o Rui muda o código da patroa: ' ||
  case when (mudar_acesso('abc123','r@b.cv','hackhack'))->>'erro' is not null
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
reset role;

-- a Maria noutro telemóvel, e a mudar o código
call quem('66666666-6666-6666-6666-666666666666');
select '44 · a Maria entra noutro telemóvel com o código dela: ' ||
  case when (entrar('maria@b.cv','abc123'))->>'frota' = current_setting('provas.b')
       then 'entrou (certo)' else 'NÃO ENTROU (MAL)' end;
set role authenticated;
update docs set corpo = corpo || '{"email":"outra@b.cv"}'::jsonb
  where coleccao='frota' and id='dono';
reset role;
select '45 · e reescreve a conta dela à mão, sem passar pela porta: ' ||
  case when (select corpo->>'email' from docs where frota=current_setting('provas.b')
               and coleccao='frota' and id='dono') = 'maria@b.cv'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
set role authenticated;
select '46 · muda o código sem saber o actual: ' ||
  case when (mudar_acesso('errado','','novo456'))->>'erro' like '%actual%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
select '47 · muda para o e-mail de outro patrão: ' ||
  case when (mudar_acesso('abc123','patrao@exemplo.cv',''))->>'erro' like '%noutra conta%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
select '48 · muda o código, sabendo o actual: ' ||
  case when (mudar_acesso('abc123','','novo456'))->>'ok' = 'true'
       then 'MUDOU (certo)' else 'NÃO MUDOU (MAL)' end;
reset role;
select '49 · o código velho já não abre: ' ||
  case when (entrar('maria@b.cv','abc123'))->>'erro' is not null
       then 'não abre (certo)' else 'ABRE (MAL)' end;
select '50 · e o novo abre: ' ||
  case when (entrar('maria@b.cv','novo456'))->>'papel' = 'dono'
       then 'abre (certo)' else 'NÃO ABRE (MAL)' end;

-- quem cobra é que decide
update frotas set plano='suspensa' where id=current_setting('provas.b');
select '51 · uma frota suspensa não deixa entrar: ' ||
  case when (entrar('maria@b.cv','novo456'))->>'erro' like '%suspensa%'
       then 'fechada (certo)' else 'ABRIU (MAL)' end;
update frotas set plano='ensaio' where id=current_setting('provas.b');
call quem('66666666-6666-6666-6666-666666666666');
select entrar('maria@b.cv','novo456') is not null;
set role authenticated;
update frotas set plano='pago', ate=null;
reset role;
select '52 · a Maria passa-se para o plano pago sozinha: ' ||
  case when (select plano from frotas where id=current_setting('provas.b'))='ensaio'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;

select '53 · as novidades ao vivo estão ligadas: ' ||
  case when exists (select 1 from pg_publication_tables
                     where pubname='supabase_realtime' and tablename='docs')
       then 'ligadas (certo)' else 'DESLIGADAS (MAL)' end;

-- ─── LINHAS NOVAS NA FROTA DE OUTRO ──────────────────────────
-- Escrever por cima do que o outro tem já esbarra em não o conseguir
-- ler. Mas uma linha NOVA, com um nome que o outro ainda não usou, só
-- a regra de escrever a trava — e é a que falta provar.
call quem('66666666-6666-6666-6666-666666666666');
set role authenticated;
insert into docs(frota,coleccao,id,corpo)
  values ('f1','turnos','intruso','{"id":"intruso","kmGps":1}'::jsonb);
reset role;
select '54 · a Maria mete um turno novo na frota do outro: ' ||
  case when not exists (select 1 from docs where id='intruso')
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;

-- O Rui é o "m1" na frota da Maria — e o António também é "m1" na
-- outra. Sem a frota na regra, o Rui escrevia turnos em nome do António.
call quem('55555555-5555-5555-5555-555555555555');
set role authenticated;
insert into docs(frota,coleccao,id,corpo)
  values ('f1','turnos','t-rui','{"id":"t-rui","condutorId":"m1","kmGps":3}'::jsonb);
insert into docs(frota,coleccao,id,corpo)
  values ('f1','vivo','t-rui','{"id":"t-rui","condutorId":"m1","lat":14.9}'::jsonb);
reset role;
select '55 · o Rui (m1 lá) escreve como o m1 de cá: ' ||
  case when not exists (select 1 from docs where id='t-rui')
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;

-- ─── IR-SE EMBORA ────────────────────────────────────────────
-- Quem experimenta e não fica leva tudo com ele. Mas só o dono, só
-- com o código, e a frota fundadora não se apaga por aqui.
call quem('55555555-5555-5555-5555-555555555555');
set role authenticated;
select '56 · o Rui (condutor) apaga a frota da patroa: ' ||
  case when (apagar_frota('novo456'))->>'erro' is not null
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
reset role;
call quem('66666666-6666-6666-6666-666666666666');
set role authenticated;
select '57 · a Maria apaga a conta sem o código certo: ' ||
  case when (apagar_frota('errado'))->>'erro' is not null
        and exists (select 1 from docs where coleccao='frota' and id='config')
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
select '58 · com o código certo: ' ||
  case when (apagar_frota('novo456'))->>'ok' = 'true'
       then 'APAGOU (certo)' else 'NÃO APAGOU (MAL)' end;
reset role;
select '59 · e não fica nada dela, nem o condutor lá dentro: ' ||
  case when not exists (select 1 from docs where frota=current_setting('provas.b'))
        and not exists (select 1 from frotas where id=current_setting('provas.b'))
        and not exists (select 1 from perfis where frota=current_setting('provas.b'))
       then 'nada (certo)' else 'FICOU LIXO (MAL)' end;
select '60 · e a outra frota ficou inteira: ' ||
  case when (select count(*) from docs where frota='f1') >= 8
       then 'inteira (certo)' else 'ESTRAGADA (MAL)' end;
call quem('11111111-1111-1111-1111-111111111111');
set role authenticated;
select '61 · a frota fundadora apaga-se pela aplicação: ' ||
  case when (apagar_frota('9999'))->>'erro' like '%fundadora%'
       then 'RECUSOU (certo)' else 'DEIXOU (MAL)' end;
reset role;
