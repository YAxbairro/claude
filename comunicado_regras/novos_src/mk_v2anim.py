# VÍDEO 2 "Membros das mesas": batidas A/B (mesmo motor de v1anim.html, ?v=V2) -> motion/v2/beats.js
import os,json
HERE=os.path.dirname(os.path.abspath(__file__)); D=HERE+'/motion/v2'; os.makedirs(D,exist_ok=True)
# (n, estilo, t0, t1, ícones, kicker, [(texto, papel, entrada)])
B=[
('21','B',0.0,3.6,['TXT'],'ATENÇÃO',[('MEMBROS DAS MESAS','hn',1.0),('DAS ASSEMBLEIAS DE VOTO','n',2.1)]),
('22','A',3.6,8.2,['PALACIO2'],'NO DIA 15 DE NOVEMBRO',[('CABO VERDE ELEGE','n',5.4),('O PRESIDENTE DA REPÚBLICA','b',6.3)]),
('23a','B',8.2,11.2,['cracha'],None,[('SE FOSTE INDICADO','n',8.4),('PARA INTEGRAR','b',9.4),('UMA MESA DE VOTO','r',10.0)]),
('23b','B',11.2,16.5,['MESA'],None,[('A TUA PRESENÇA','n',11.3),('É FUNDAMENTAL','h',11.9),('PARA O BOM FUNCIONAMENTO','n',12.6),('DAS OPERAÇÕES ELEITORAIS','r',14.6)]),
('24a','A',16.5,19.9,['CODIGO'],'CÓDIGO ELEITORAL',[('A CNE','hn',16.7),('RECORDA','r',17.2)]),
('24b','A',19.9,23.6,['selo'],None,[('O EXERCÍCIO DA FUNÇÃO','n',20.1),('DE MEMBRO DE MESA','n',21.0),('É OBRIGATÓRIO','h',22.0)]),
('25','B',23.6,29.1,['relogio'],'POR ISSO',[('COMPARECE ÀS','n',24.5),('7H DA MANHÃ','h',25.4),('PARA GARANTIR O INÍCIO','n',26.9),('PONTUAL DA VOTAÇÃO','r',27.8)]),
('26a','A',29.1,32.9,['notas'],None,[('OS MEMBROS DAS MESAS','n',29.9),('VÃO RECEBER','b',30.8),('3.500$00','hn',31.3)]),
('26b','A',32.9,36.5,['prato'],None,[('INCLUINDO O SUBSÍDIO','n',33.0),('DE ALIMENTAÇÃO','b',34.1),('DE 1.000$00','r',35.0)]),
('27','B',36.5,41.5,['MESAPRES'],'PRESIDENTES DAS MESAS',[('TERÃO AINDA UM SUBSÍDIO','n',37.9),('DE COMUNICAÇÃO','b',39.2),('DE 500$00','h',40.0)]),
('28','A',41.5,47.8,['troca'],None,[('OS SUPLENTES','hn',41.8),('SÓ TERÃO DIREITO À COMPENSAÇÃO','n',42.3),('CASO SUBSTITUAM','b',44.1),('EFETIVAMENTE UM MEMBRO DA MESA','r',45.6)]),
('29','B',47.8,53.2,['banco'],'ATENÇÃO',[('OS PAGAMENTOS SERÃO','n',48.8),('EFETUADOS POSTERIORMENTE','b',49.7),('POR TRANSFERÊNCIA BANCÁRIA','r',51.1)]),
('30','A',53.2,55.8,['TXT'],None,[('A TUA PRESENÇA','n',53.4),('FAZ A DIFERENÇA','h',54.2)]),
('31','B',55.8,64.26,'FIM',None,[('JUNTOS POR ELEIÇÕES','n',57.2),('LIVRES, JUSTAS E TRANSPARENTES','r',58.3)]),
]
beats=[dict(n=n,st=st,t0=t0,t1=t1,ics=ics,kick=k,lines=[list(l) for l in L]) for n,st,t0,t1,ics,k,L in B]
open(D+'/beats.js','w').write('window.BEATS='+json.dumps(beats,ensure_ascii=False)+';')
