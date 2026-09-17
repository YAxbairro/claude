#!/usr/bin/env python3
"""Gera uma semana de operação de uma frota de táxis na Praia.

Os percursos são simulados como andamento numa malha de ruas, com paragens
para recolher e largar passageiros. Os números que aparecem no painel (km,
litros, consumo, alertas) NÃO são inventados aqui: saem todos do motor de
regras em SQL a partir destes pontos.
"""
import math, random, json, sys
from datetime import datetime, timedelta, timezone

random.seed(7)

PRAIA = (14.9177, -23.5092)
M_LAT = 1 / 111320.0
def m_lon(lat): return 1 / (111320.0 * math.cos(math.radians(lat)))

ORG   = '11111111-1111-1111-1111-111111111111'
CARRO = {1: '22222222-2222-2222-2222-222222222201',
         2: '22222222-2222-2222-2222-222222222202',
         3: '22222222-2222-2222-2222-222222222203'}
MOT   = {1: '33333333-3333-3333-3333-333333333301',
         2: '33333333-3333-3333-3333-333333333302',
         3: '33333333-3333-3333-3333-333333333303'}
PLATEAU = ('44444444-4444-4444-4444-444444444401', 14.91950, -23.50870)

def rasto(inicio_s, minutos, intervalo=30, bateria_de=100, bateria_ate=55,
          mock=False, desvio=0, lat0=None, lon0=None):
    """Andamento numa malha de ruas: segmentos rectos, viragens a 90°, paragens."""
    lat, lon = (lat0 or PRAIA[0]), (lon0 or PRAIA[1])
    pontos, t, rumo = [], 0, random.choice([0, 90, 180, 270])
    total = minutos * 60
    while t < total:
        # um troço de rua: 4 a 14 pontos no mesmo rumo
        for _ in range(random.randint(4, 14)):
            if t >= total: break
            v = random.uniform(18, 46)                      # km/h no trânsito da cidade
            d = v / 3.6 * intervalo
            rad = math.radians(rumo + random.uniform(-6, 6))
            lat += math.cos(rad) * d * M_LAT
            lon += math.sin(rad) * d * m_lon(lat)
            # manter o carro dentro da cidade
            if abs(lat - PRAIA[0]) > 0.045: rumo = (rumo + 180) % 360
            if abs(lon - PRAIA[1]) > 0.045: rumo = (rumo + 180) % 360
            pontos.append((lat, lon, round(v, 1), t))
            t += intervalo
        # paragem de passageiro
        if random.random() < 0.5:
            for _ in range(random.randint(1, 4)):
                if t >= total: break
                pontos.append((lat, lon, 0.0, t))
                t += intervalo
        rumo = (rumo + random.choice([-90, 90, 0])) % 360

    n = max(len(pontos) - 1, 1)
    return [{
        'lat': round(p[0], 6), 'lon': round(p[1], 6),
        'precisao_m': random.choice([6, 8, 10, 12, 15]),
        'velocidade_kmh': p[2],
        'bateria_pct': round(bateria_de + (bateria_ate - bateria_de) * i / n),
        'mock': mock, 'monotonico_ms': 1000000 + p[3] * 1000,
        'desvio_relogio_s': desvio,
        'capturado_em_s': inicio_s + p[3],
    } for i, p in enumerate(pontos)]

def parar(inicio_s, minutos, lat, lon, bateria=75):
    return [{
        'lat': lat, 'lon': lon, 'precisao_m': 7, 'velocidade_kmh': 0.0,
        'bateria_pct': bateria, 'mock': False,
        'monotonico_ms': 5000000 + i * 60000, 'desvio_relogio_s': 0,
        'capturado_em_s': inicio_s + i * 60,
    } for i in range(minutos + 1)]

def ts(dia, segundos):
    return f"'2026-09-{dia:02d} 00:00:00+00'::timestamptz + interval '{segundos} seconds'"

def sql_pontos(turno, pontos, recebido=None):
    """Os pontos vão como literal JSON: jsonb_build_array tem limite de 100 argumentos."""
    linhas = []
    for bloco in [pontos[i:i+500] for i in range(0, len(pontos), 500)]:
        arr = json.dumps([{
            'lat': p['lat'], 'lon': p['lon'], 'precisao_m': p['precisao_m'],
            'velocidade_kmh': p['velocidade_kmh'], 'bateria_pct': p['bateria_pct'],
            'mock': p['mock'], 'monotonico_ms': p['monotonico_ms'],
            'desvio_relogio_s': p['desvio_relogio_s'],
            'capturado_em': p['capturado_em_iso'],
        } for p in bloco], separators=(',', ':'))
        linhas.append("  perform fleetcv.registar_pontos('%s', $j$%s$j$::jsonb, %s);"
                      % (turno, arr, recebido or 'now()'))
    return "\n".join(linhas)

out = ["-- GERADO POR gerar_demo.py — não editar à mão",
       "-- Uma semana de operação de três táxis na cidade da Praia.",
       "-- truncate e não delete: os gatilhos de imutabilidade recusam apagar",
       "-- alertas e turnos linha a linha, que é exactamente o que devem fazer.",
       "do $$ begin perform set_config('fleetcv.motor','on',true);",
       "  truncate fleetcv.consumo_janela, fleetcv.score_motorista, fleetcv.alerta,",
       "           fleetcv.abastecimento, fleetcv.ponto_gps, fleetcv.turno, fleetcv.foto",
       "    restart identity cascade;",
       "  delete from fleetcv.indisponibilidade;",
       "  update fleetcv.carro set km_actual = 120000 where id = '%s';" % CARRO[1],
       "  update fleetcv.carro set km_actual = 208400 where id = '%s';" % CARRO[2],
       "end $$;",
       ""]

# carro e motorista extra
out.append(f"""insert into fleetcv.carro (id, organizacao_id, matricula, marca, modelo, ano,
  tipo_combustivel, capacidade_deposito_l, consumo_referencia_l100, km_actual, estado)
values ('{CARRO[3]}', '{ORG}', 'CV-03-EF', 'Hyundai', 'Accent', 2017,
        'GASOLINA', 45, 7.20, 64300, 'ACTIVO')
on conflict (id) do update set km_actual = 64300, estado = 'ACTIVO';
""")

km = {1: 120000, 2: 208400, 3: 64300}
PRECO = 14500
turnos = []

# dia, carro, minutos de turno, litros a comprar, tipo de ocorrência
plano = [
    (14, 1, 430, 13.8, None),      (14, 2, 400, 12.9, None),
    (14, 3, 380, 11.4, None),
    (15, 1, 445, 14.2, None),      (15, 2, 415, 13.1, 'sem_gps'),
    (15, 3, 390, 11.9, None),
    (16, 1, 420, 13.4, None),      (16, 2, 405, 12.7, None),
    (16, 3, 395, 12.1, None),
    (17, 1, 450, 14.5, 'talao'),   (17, 2, 410, 13.0, None),
    (17, 3, 385, 11.6, None),
    (18, 1, 435, 13.9, None),      (18, 2, 420, 13.3, 'gap'),
    (18, 3, 400, 12.3, None),
]

for dia, c, minutos, litros, ocorrencia in plano:
    turno = f"a{dia:02d}{c}0000-0000-4000-8000-0000000000{c}{dia:02d}"[:36]
    turno = "%08x-%04x-4%03x-8%03x-%012x" % (dia * 1000 + c, c, dia, c, dia * 100 + c)
    inicio = 6 * 3600 + (c - 1) * 900
    pontos = rasto(inicio, minutos,
                   mock=False,
                   desvio=0,
                   bateria_ate=45 if c == 2 else 58)
    # paragem para abastecer, a meio
    meio = inicio + minutos * 30
    paragem = parar(meio, 6, PLATEAU[1], PLATEAU[2])
    if ocorrencia == 'sem_gps':                      # 35 min sem sinal
        corte = len(pontos) // 2
        pontos = pontos[:corte] + [{**p, 'capturado_em_s': p['capturado_em_s'] + 2100}
                                   for p in pontos[corte:]]
    todos = sorted(pontos + paragem, key=lambda p: p['capturado_em_s'])
    base = datetime(2026, 9, dia, tzinfo=timezone.utc)
    for p in todos:
        p['capturado_em_iso'] = (base + timedelta(seconds=p['capturado_em_s'])).isoformat()
        # O contador monotónico tem de andar ao mesmo ritmo que o relógio: se não
        # andar, o motor conclui — e bem — que alguém mexeu na hora do telemóvel.
        p['monotonico_ms'] = 1000000 + p['capturado_em_s'] * 1000

    gap = 37 if ocorrencia == 'gap' else 0         # o carro andou de noite
    valor = int(round(litros * PRECO))
    litros_ocr = round(litros, 2)
    if ocorrencia == 'talao':
        litros_ocr = round(litros * 0.62, 2)          # talão de 1.300, declarou 2.100
    fim = inicio + minutos * 60

    out.append(f"""do $$
declare v_t uuid := '{turno}'; v_km int; v_km0 int;
begin
  select km_actual + {gap} into v_km0 from fleetcv.carro where id = '{CARRO[c]}';
  perform fleetcv.abrir_turno(v_t, '{CARRO[c]}', '{MOT[c]}', v_km0,
    {ts(dia, inicio)}, v_km0,
    fleetcv_teste.foto('QUADRANTE_ABERTURA', {ts(dia, inicio)}), true, {ts(dia, inicio)});
{sql_pontos(turno, todos, ts(dia, fim))}
  perform fleetcv.registar_abastecimento(gen_random_uuid(), v_t, {valor},
    {ts(dia, meio + 120)}, '{PLATEAU[0]}', null, {PLATEAU[1]}, {PLATEAU[2]},
    fleetcv_teste.foto('TALAO', {ts(dia, meio)}), {litros_ocr},
    'talao-{dia}-{c}', {ts(dia, fim)});
  v_km := round(fleetcv.km_gps_m(v_t) / 1000.0 * 1.04);
  perform fleetcv.fechar_turno(v_t, v_km0 + v_km, {ts(dia, fim)}, v_km0 + v_km,
    fleetcv_teste.foto('QUADRANTE_FECHO', {ts(dia, fim)}), {ts(dia, fim)});
end $$;
""")

out.append("""do $$
declare v_m record;
begin
  for v_m in select id from fleetcv.utilizador where papel = 'MOTORISTA' loop
    perform fleetcv.calcular_score(v_m.id, '2026-09-18');
  end loop;
end $$;""")

open(sys.argv[1], 'w').write("\n".join(out))
print(f"gerado: {sys.argv[1]}")
