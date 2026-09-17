-- FleetCV · Dados de partida: uma frota de táxis na Praia, ilha de Santiago.
-- Identificadores fixos para os testes poderem referi-los.

insert into fleetcv.organizacao (id, nome, ilha, definicoes, criado_em) values
  ('11111111-1111-1111-1111-111111111111', 'Táxis Praia, Lda', 'Santiago',
   '{}'::jsonb, now() - interval '2 years');

insert into fleetcv.utilizador (id, organizacao_id, nome, telefone, papel, criado_em) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111',
   'António Semedo', '+2389911001', 'MOTORISTA', now() - interval '1 year'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111',
   'Jorge Tavares',  '+2389911002', 'MOTORISTA', now() - interval '1 year'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111',
   'Nuno Rocha (novo)', '+2389911003', 'MOTORISTA', now() - interval '3 days'),
  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111111',
   'Dona Fátima (proprietária)', '+2389911009', 'PROPRIETARIO', now() - interval '2 years');

insert into fleetcv.carro (id, organizacao_id, matricula, marca, modelo, ano,
                           tipo_combustivel, capacidade_deposito_l,
                           consumo_referencia_l100, km_actual, estado) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111',
   'CV-01-AB', 'Toyota', 'Corolla', 2015, 'GASOLINA', 50, 7.50, 120000, 'ACTIVO'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111',
   'CV-02-CD', 'Nissan', 'Almera', 2012, 'GASOLINA', 46, 8.00, 200000, 'ACTIVO');

-- Postos reais do Plateau e arredores (coordenadas aproximadas)
insert into fleetcv.posto (id, organizacao_id, nome, marca, lat, lon, ilha) values
  ('44444444-4444-4444-4444-444444444401', null, 'Plateau',            'Enacol',
   14.91950, -23.50870, 'Santiago'),
  ('44444444-4444-4444-4444-444444444402', null, 'Palmarejo',          'Vivo',
   14.91500, -23.52400, 'Santiago'),
  ('44444444-4444-4444-4444-444444444403', null, 'Achada Santo António','Enacol',
   14.92600, -23.51700, 'Santiago');

-- Preço fixado pela ARME. Muda todos os meses: é uma linha nova, não uma edição.
insert into fleetcv.preco_combustivel (ilha, tipo, preco_cts_litro, valido_de) values
  ('Santiago', 'GASOLINA', 14500, '2020-01-01'),   -- 145,00 CVE/litro
  ('Santiago', 'GASOLEO',  12500, '2020-01-01');

-- Zona de operação: a cidade da Praia. Sem zonas definidas, a regra das
-- paragens longas cala-se de propósito (ver R11).
insert into fleetcv.zona (organizacao_id, nome, lat, lon, raio_m, tipo) values
  ('11111111-1111-1111-1111-111111111111', 'Cidade da Praia',
   14.91770, -23.50920, 6000, 'OPERACAO');
