-- FleetCV · 003 · Catálogo de alertas e tabela de penalizações (SPEC §6.2 e §8)

insert into fleetcv.catalogo_alerta (codigo, nivel, descricao, regra) values
  ('A01','INFO'   ,'Turno aberto',                                   null),
  ('A02','INFO'   ,'Turno fechado',                                  null),
  ('A03','AVISO'  ,'Sem sinal de GPS há mais de 15 minutos',         'R09'),
  ('A04','CRITICO','Localização falsa detectada',                    'R10'),
  ('A05','INFO'   ,'Paragem longa fora de zona conhecida',           'R11'),
  ('A06','CRITICO','Relógio do telemóvel adulterado',                'R12'),
  ('A07','AVISO'  ,'Km do quadrante e do GPS não batem',             'R16'),
  ('A08','CRITICO','Quadrante muito à frente do GPS',                'R16'),
  ('A09','CRITICO','GPS à frente do quadrante',                      'R17'),
  ('A10','INFO'   ,'Abastecimento registado',                        null),
  ('A11','AVISO'  ,'Abastecimento sem talão',                        'R20'),
  ('A12','AVISO'  ,'Litros do talão não batem com o valor pago',     'R22'),
  ('A13','CRITICO','Litros não cabem no depósito',                   'R23'),
  ('A14','CRITICO','Carro não estava no posto à hora do talão',      'R24'),
  ('A15','CRITICO','Talão duplicado',                                'R25'),
  ('A16','CRITICO','Foto reutilizada',                               'R26'),
  ('A17','AVISO'  ,'Consumo acima do normal',                        'R30'),
  ('A18','AVISO'  ,'Consumo a subir há três janelas',                'R31'),
  ('A19','CRITICO','Carro andou fora de turno',                      'R33'),
  ('A20','AVISO'  ,'Turno fechado automaticamente',                  null),
  ('A21','AVISO'  ,'Turno fechado pelo gestor',                      null);

-- Penalizações no score de confiança. Um alerta que não esteja aqui não desconta.
insert into fleetcv.penalizacao (codigo, pontos) values
  ('A04', 50),   -- localização falsa: acto deliberado
  ('A06', 40),   -- relógio adulterado: acto deliberado
  ('A19', 30),   -- carro andou fora de turno
  ('A15', 30),
  ('A16', 30),
  ('A14', 30),
  ('A13', 25),
  ('A12', 25),   -- valor declarado acima do talão: a prova mais directa de desvio
  ('A08', 15),
  ('A09', 15),
  ('A11', 10),
  ('A20', 10),
  ('A21',  5);
-- Repare-se no que NÃO está aqui: A03 (sem sinal) desconta pelo tempo, não pelo
-- alerta; A17/A18 (consumo) são do carro e não se imputam ao motorista sem
-- investigação; A05/A07 são informação, não culpa.
