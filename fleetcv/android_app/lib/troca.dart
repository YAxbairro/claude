/// O ficheiro de troca entre a app do condutor e o painel do dono.
///
/// Num piloto de um carro não vale a pena montar servidor nenhum: o condutor
/// exporta os turnos, manda-os pelo WhatsApp, e o dono importa-os no painel.
/// Sem contas, sem custos, sem rede obrigatória.
///
/// O formato é o mesmo que o painel web já usa por dentro — assim a importação
/// não precisa de traduzir nada, e um erro de tradução é um erro que não pode
/// acontecer.
library;

import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'armazem.dart';
import 'regras.dart';

const int versaoFormato = 1;

Map<String, dynamic> _alertaParaTroca(Alerta a) => {
      'c': a.codigo,
      'n': a.nivel.name.toUpperCase(),
      'd': a.descricao,
      if (a.diferencaCve != null) 'dif': a.diferencaCve,
    };

Future<String?> _lerFotoBase64(String? caminho) async {
  if (caminho == null) return null;
  final f = File(caminho);
  if (!await f.exists()) return null;
  final bytes = await f.readAsBytes();
  return 'data:image/jpeg;base64,${base64Encode(bytes)}';
}

/// Um turno no formato que o painel entende.
Future<Map<String, dynamic>> turnoParaTroca(Turno t,
    {bool comFotos = true}) async {
  final chaves = <String>[];
  final fotos = <String, String>{};

  if (comFotos) {
    final abertura = await _lerFotoBase64(t.fotoAbertura);
    if (abertura != null) {
      fotos['abertura'] = abertura;
      chaves.add('abertura');
    }
    for (var i = 0; i < t.fotosTalao.length; i++) {
      final talao = await _lerFotoBase64(t.fotosTalao[i]);
      if (talao != null) {
        fotos['talao${i + 1}'] = talao;
        chaves.add('talao${i + 1}');
      }
    }
    final fecho = await _lerFotoBase64(t.fotoFecho);
    if (fecho != null) {
      fotos['fecho'] = fecho;
      chaves.add('fecho');
    }
  } else {
    if (t.fotoAbertura != null) chaves.add('abertura');
    for (var i = 0; i < t.fotosTalao.length; i++) {
      chaves.add('talao${i + 1}');
    }
    if (t.fotoFecho != null) chaves.add('fecho');
  }

  return {
    'id': t.id,
    'estado': t.estado,
    'inicio': t.inicioMs,
    'fim': t.fimMs,
    'carroId': t.carroId,
    'matricula': t.matricula,
    'condutor': t.condutor,
    'kmInicial': t.kmInicial,
    'kmFinal': t.kmFinal,
    'gap': t.gapKm,
    'precoLitro': t.precoLitro,
    'deposito': t.depositoL,
    'kmGps': double.parse(kmDoRasto(t.rasto).toStringAsFixed(1)),
    'semSinalS': t.semSinalSegundos,
    'bateriaFim': t.bateriaFimPct,
    'totalCve': t.totalCve,
    'totalLitros': t.totalLitros,
    'rasto': t.rasto
        .map((x) => [
              double.parse(x.lat.toStringAsFixed(6)),
              double.parse(x.lon.toStringAsFixed(6)),
              x.momentoMs,
              x.precisaoM,
              x.velocidadeKmh?.round(),
            ])
        .toList(),
    'abastecimentos': t.abastecimentos
        .map((a) => {
              'hora': a.momentoMs,
              'valor': a.valorCve,
              'litrosTalao': a.litrosTalao,
              'temFoto': a.temFoto,
              'lat': a.lat,
              'lon': a.lon,
            })
        .toList(),
    'alertas': t.alertas.map(_alertaParaTroca).toList(),
    'fotoKeys': chaves,
    'origem': 'android',
    if (comFotos && fotos.isNotEmpty) 'fotos': fotos,
  };
}

/// Escreve o ficheiro de troca e devolve-o. As fotos vão lá dentro: são elas a
/// prova, e um ficheiro sem provas não serve para o dono decidir nada.
Future<File> escreverFicheiroDeTroca({
  required Frota frota,
  required List<Turno> turnos,
  bool comFotos = true,
}) async {
  final fechados = turnos.where((t) => t.estado == 'FECHADO').toList();
  final conteudo = {
    'fleetcv': versaoFormato,
    'exportadoEm': DateTime.now().millisecondsSinceEpoch,
    'frota': frota.paraJson(),
    'turnos': [
      for (final t in fechados) await turnoParaTroca(t, comFotos: comFotos),
    ],
  };

  final agora = DateTime.now();
  final nome = 'fleetcv-'
      '${agora.year}${agora.month.toString().padLeft(2, '0')}'
      '${agora.day.toString().padLeft(2, '0')}-'
      '${agora.hour.toString().padLeft(2, '0')}'
      '${agora.minute.toString().padLeft(2, '0')}.json';

  final pasta = await getTemporaryDirectory();
  final ficheiro = File(p.join(pasta.path, nome));
  await ficheiro.writeAsString(jsonEncode(conteudo));
  return ficheiro;
}
