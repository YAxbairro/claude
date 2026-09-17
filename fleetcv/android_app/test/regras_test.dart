// Os mesmos cenários dos testes SQL da Fase 1, agora contra o código da app.
// Se estes falharem, a app e o motor deixaram de concordar.

import 'package:flutter_test/flutter_test.dart';
import 'package:fleetcv/regras.dart';

/// Gera um percurso plausível: passos curtos a velocidade de carro.
List<Ponto> rasto({
  int pontos = 60,
  double metrosPorPonto = 250,
  int intervaloS = 30,
  int bateriaDe = 100,
  int bateriaAte = 60,
  bool falso = false,
  int saltoAposIndice = -1,
  int saltoS = 0,
}) {
  final lista = <Ponto>[];
  var lat = 14.9177;
  const inicio = 1758000000000;
  var t = 0;
  for (var i = 0; i < pontos; i++) {
    if (i == saltoAposIndice) t += saltoS;
    lat += metrosPorPonto / 111320.0;
    t += intervaloS;
    lista.add(Ponto(
      lat: lat,
      lon: -23.5092,
      momentoMs: inicio + t * 1000,
      precisaoM: 10,
      velocidadeKmh: metrosPorPonto / intervaloS * 3.6,
      bateriaPct: (bateriaDe + (bateriaAte - bateriaDe) * i / (pontos - 1)).round(),
      falso: falso,
    ));
  }
  return lista;
}

Resultado avaliar({
  int kmInicial = 120000,
  int? kmFinal,
  int gapKm = 0,
  List<Ponto>? pontos,
  List<Abastecimento> abastecimentos = const [],
  double preco = 145,
  double deposito = 50,
  bool fotos = true,
}) {
  final r = pontos ?? rasto();
  return avaliarTurno(
    kmInicial: kmInicial,
    kmFinal: kmFinal ?? kmInicial + kmDoRasto(r).round(),
    gapKm: gapKm,
    rasto: r,
    abastecimentos: abastecimentos,
    precoLitro: preco,
    depositoL: deposito,
    temFotoAbertura: fotos,
    temFotoFecho: fotos,
  );
}

List<String> codigos(Resultado r) => r.alertas.map((a) => a.codigo).toList();

void main() {
  test('distância entre dois pontos conhecidos', () {
    // 0,001 grau de latitude ≈ 111 m em qualquer sítio do planeta
    final d = distanciaM(14.9177, -23.5092, 14.9187, -23.5092);
    expect(d, closeTo(111.2, 1.5));
  });

  test('km do GPS descarta saltos impossíveis', () {
    final bons = rasto(pontos: 41, metrosPorPonto: 250, intervaloS: 30);
    expect(kmDoRasto(bons), closeTo(10.0, 0.2)); // 40 troços × 250 m

    // o mesmo percurso a 2.500 km/h: nada deve contar
    final maus = rasto(pontos: 41, metrosPorPonto: 250, intervaloS: 1);
    expect(kmDoRasto(maus), 0);
  });

  test('km do GPS descarta pontos imprecisos', () {
    final r = rasto(pontos: 21)
        .map((p) => Ponto(
            lat: p.lat, lon: p.lon, momentoMs: p.momentoMs,
            precisaoM: 200, bateriaPct: p.bateriaPct))
        .toList();
    expect(kmDoRasto(r), 0);
  });

  test('C01 · turno honesto não gera alertas', () {
    final r = avaliar(abastecimentos: [
      Abastecimento(
          momentoMs: 1758000600000, valorCve: 2000, litrosTalao: 13.79,
          temFoto: true),
    ]);
    expect(codigos(r), isEmpty);
  });

  test('C02 · talão inflacionado dispara A12 com a diferença', () {
    final r = avaliar(abastecimentos: [
      const Abastecimento(
          momentoMs: 1758000600000, valorCve: 2000, litrosTalao: 8.62,
          temFoto: true),
    ]);
    expect(codigos(r), contains('A12'));
    final a = r.alertas.firstWhere((x) => x.codigo == 'A12');
    expect(a.diferencaCve, closeTo(750, 5));
  });

  test('C04 · o carro andou fora de turno', () {
    expect(codigos(avaliar(gapKm: 40)), contains('A19'));
    expect(codigos(avaliar(gapKm: 2)), isNot(contains('A19')));
  });

  test('C05 · 40 minutos sem sinal disparam A03', () {
    final r = rasto(pontos: 60, saltoAposIndice: 30, saltoS: 2400);
    expect(maiorFalhaS(r), greaterThan(Limites.semSinalS.toDouble()));
    expect(semSinalS(r), closeTo(2430, 40));
    expect(codigos(avaliar(pontos: r)), contains('A03'));
  });

  test('C06 · o silêncio de um telemóvel sem bateria não penaliza', () {
    // bateria a chegar a 2%: a falha que se segue tem causa provada
    final r = rasto(pontos: 40, bateriaDe: 60, bateriaAte: 2,
        saltoAposIndice: 38, saltoS: 3600);
    expect(maiorFalhaS(r), lessThan(Limites.semSinalS.toDouble()));
  });

  test('C07 · litros que não cabem no depósito', () {
    final r = avaliar(abastecimentos: [
      const Abastecimento(momentoMs: 1758000600000, valorCve: 7685, temFoto: true),
    ]);
    expect(codigos(r), contains('A13'));
  });

  test('C09 · localização falsa dispara A04', () {
    final r = avaliar(pontos: rasto(falso: true));
    expect(codigos(r), contains('A04'));
    expect(r.alertas.firstWhere((a) => a.codigo == 'A04').nivel, Nivel.critico);
  });

  test('C15 · quadrante muito à frente do GPS', () {
    final r = rasto(pontos: 41, metrosPorPonto: 250, intervaloS: 30); // 10 km
    expect(codigos(avaliar(pontos: r, kmFinal: 120013)), contains('A08'));
    expect(codigos(avaliar(pontos: r, kmFinal: 120011)), isEmpty);
  });

  test('GPS à frente do quadrante é sinal de quadrante mexido', () {
    final r = rasto(pontos: 41, metrosPorPonto: 250, intervaloS: 30);
    expect(codigos(avaliar(pontos: r, kmFinal: 120008)), contains('A09'));
  });

  test('turno sem foto do quadrante fica marcado', () {
    expect(codigos(avaliar(fotos: false)), contains('A11'));
  });

  test('score: um desvio confirmado desce, um erro do sistema não', () {
    const alertas = [
      [Alerta('A12', Nivel.aviso, 'talão')],
    ];
    expect(
        calcularScore(
            alertasPorTurno: alertas,
            semSinalSegundos: const [0],
            resolvidosComoErroDoSistema: const {}),
        75);
    expect(
        calcularScore(
            alertasPorTurno: alertas,
            semSinalSegundos: const [0],
            resolvidosComoErroDoSistema: const {'A12'}),
        100); // 100 − 0 + 3, limitado a 100
  });

  test('score: tempo sem sinal desconta 1 ponto por cada 10 minutos', () {
    expect(
        calcularScore(
            alertasPorTurno: const [[]],
            semSinalSegundos: const [2400],
            resolvidosComoErroDoSistema: const {}),
        99); // −4 pelo sinal, +3 pelo turno limpo
  });
}
