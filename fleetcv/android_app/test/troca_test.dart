// O ficheiro de troca é um contrato entre duas aplicações que não se
// compilam juntas. Se um nome de campo mudar aqui sem mudar no painel, a
// importação passa a perder dados em silêncio — que é a pior maneira de
// falhar. Este teste fixa os nomes.

import 'package:flutter_test/flutter_test.dart';
import 'package:fleetcv/armazem.dart';
import 'package:fleetcv/regras.dart';
import 'package:fleetcv/troca.dart';

Turno _turnoDeExemplo() {
  const inicio = 1758000000000;
  return Turno(
    id: 't1',
    inicioMs: inicio,
    carroId: 'c1',
    matricula: 'CV-01-AB',
    condutor: 'António Semedo',
    kmInicial: 120000,
    gapKm: 0,
    precoLitro: 145,
    depositoL: 50,
    estado: 'FECHADO',
    fimMs: inicio + 27000000,
    kmFinal: 120180,
    semSinalSegundos: 0,
    bateriaFimPct: 58,
    rasto: [
      for (var i = 0; i < 10; i++)
        Ponto(
          lat: 14.9177 + i * 0.002,
          lon: -23.5092,
          momentoMs: inicio + i * 30000,
          precisaoM: 10,
          velocidadeKmh: 27,
          bateriaPct: 90,
        ),
    ],
    abastecimentos: const [
      Abastecimento(
          momentoMs: inicio + 10000000,
          valorCve: 2000,
          litrosTalao: 8.62,
          temFoto: true,
          lat: 14.9195,
          lon: -23.5087),
    ],
    alertas: const [
      Alerta('A12', Nivel.aviso, 'talão não bate', diferencaCve: 750),
    ],
  );
}

void main() {
  test('o ficheiro de troca usa os nomes que o painel espera', () async {
    final j = await turnoParaTroca(_turnoDeExemplo(), comFotos: false);

    // Nomes do turno — os mesmos que o painel web guarda
    for (final campo in [
      'id', 'estado', 'inicio', 'fim', 'matricula', 'condutor',
      'kmInicial', 'kmFinal', 'gap', 'precoLitro', 'deposito',
      'kmGps', 'semSinalS', 'totalCve', 'totalLitros',
      'rasto', 'abastecimentos', 'alertas', 'fotoKeys',
    ]) {
      expect(j.containsKey(campo), isTrue, reason: 'falta o campo "$campo"');
    }

    expect(j['id'], 't1');
    expect(j['estado'], 'FECHADO');
    expect(j['totalCve'], 2000);
    expect(j['origem'], 'android');
  });

  test('um ponto do rasto é [lat, lon, momento, precisão, velocidade]', () async {
    final j = await turnoParaTroca(_turnoDeExemplo(), comFotos: false);
    final ponto = (j['rasto'] as List).first as List;
    expect(ponto.length, 5);
    expect(ponto[0], closeTo(14.9177, 0.0001)); // lat
    expect(ponto[1], closeTo(-23.5092, 0.0001)); // lon
    expect(ponto[2], 1758000000000); // momento em milissegundos
    expect(ponto[3], 10); // precisão em metros
  });

  test('um abastecimento usa hora/valor/litrosTalao/temFoto/lat/lon', () async {
    final j = await turnoParaTroca(_turnoDeExemplo(), comFotos: false);
    final a = (j['abastecimentos'] as List).first as Map<String, dynamic>;
    expect(a.keys.toSet(),
        {'hora', 'valor', 'litrosTalao', 'temFoto', 'lat', 'lon'});
    expect(a['valor'], 2000);
    expect(a['litrosTalao'], 8.62);
  });

  test('um alerta usa c/n/d/dif, com o nível em maiúsculas', () async {
    final j = await turnoParaTroca(_turnoDeExemplo(), comFotos: false);
    final al = (j['alertas'] as List).first as Map<String, dynamic>;
    expect(al['c'], 'A12');
    expect(al['n'], 'AVISO'); // o painel compara com 'CRITICO' / 'AVISO'
    expect(al['dif'], 750);
  });

  test('sem fotos, as chaves das fotos vão na mesma', () async {
    final t = _turnoDeExemplo()
      ..fotoAbertura = '/x/a.jpg'
      ..fotoFecho = '/x/f.jpg'
      ..fotosTalao.add('/x/t.jpg');
    final j = await turnoParaTroca(t, comFotos: false);
    expect(j['fotoKeys'], ['abertura', 'talao1', 'fecho']);
    expect(j.containsKey('fotos'), isFalse);
  });
}
