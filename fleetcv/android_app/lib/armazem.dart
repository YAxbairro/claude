/// Onde os turnos ficam guardados no telemóvel.
///
/// Sem rede, um turno inteiro tem de caber aqui e sair intacto quando houver
/// ligação. Nada se apaga: um turno fechado é imutável, como no motor SQL.
library;

import 'dart:convert';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import 'regras.dart';

class Carro {
  String id;
  String matricula;
  String marca;
  String modelo;
  double depositoL;
  int kmActual;

  Carro({
    required this.id,
    required this.matricula,
    this.marca = '',
    this.modelo = '',
    this.depositoL = 50,
    this.kmActual = 0,
  });

  factory Carro.deJson(Map<String, dynamic> j) => Carro(
        id: j['id'] as String,
        matricula: j['matricula'] as String,
        marca: j['marca'] as String? ?? '',
        modelo: j['modelo'] as String? ?? '',
        depositoL: (j['depositoL'] as num?)?.toDouble() ?? 50,
        kmActual: j['kmActual'] as int? ?? 0,
      );

  Map<String, dynamic> paraJson() => {
        'id': id, 'matricula': matricula, 'marca': marca, 'modelo': modelo,
        'depositoL': depositoL, 'kmActual': kmActual,
      };
}

class Frota {
  double precoLitro;
  List<Carro> carros;

  Frota({this.precoLitro = 145, required this.carros});

  factory Frota.omissao() => Frota(carros: [
        Carro(
            id: 'c1',
            matricula: 'CV-01-AB',
            marca: 'Toyota',
            modelo: 'Corolla',
            depositoL: 50,
            kmActual: 120000),
      ]);

  factory Frota.deJson(Map<String, dynamic> j) => Frota(
        precoLitro: (j['precoLitro'] as num?)?.toDouble() ?? 145,
        carros: (j['carros'] as List<dynamic>)
            .map((c) => Carro.deJson(c as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> paraJson() => {
        'precoLitro': precoLitro,
        'carros': carros.map((c) => c.paraJson()).toList(),
      };

  Carro porId(String id) =>
      carros.firstWhere((c) => c.id == id, orElse: () => carros.first);
}

class Turno {
  final String id;
  String estado; // ABERTO · FECHADO
  final int inicioMs;
  int? fimMs;
  String carroId;
  String matricula;
  String condutor;
  int kmInicial;
  int? kmFinal;
  int gapKm;
  double precoLitro;
  double depositoL;
  List<Ponto> rasto;
  List<Abastecimento> abastecimentos;
  String? fotoAbertura;
  String? fotoFecho;
  List<String> fotosTalao;
  List<Alerta> alertas;
  int semSinalSegundos;
  int? bateriaFimPct;

  Turno({
    required this.id,
    required this.inicioMs,
    required this.carroId,
    required this.matricula,
    required this.condutor,
    required this.kmInicial,
    required this.gapKm,
    required this.precoLitro,
    required this.depositoL,
    this.estado = 'ABERTO',
    this.fimMs,
    this.kmFinal,
    List<Ponto>? rasto,
    List<Abastecimento>? abastecimentos,
    this.fotoAbertura,
    this.fotoFecho,
    List<String>? fotosTalao,
    List<Alerta>? alertas,
    this.semSinalSegundos = 0,
    this.bateriaFimPct,
  })  : rasto = rasto ?? <Ponto>[],
        abastecimentos = abastecimentos ?? <Abastecimento>[],
        fotosTalao = fotosTalao ?? <String>[],
        alertas = alertas ?? <Alerta>[];

  int get totalCve =>
      abastecimentos.fold<int>(0, (s, a) => s + a.valorCve);

  double get totalLitros => totalCve / precoLitro;

  int get kmPercorridos => (kmFinal ?? kmInicial) - kmInicial;

  Map<String, dynamic> paraJson() => {
        'id': id,
        'estado': estado,
        'inicioMs': inicioMs,
        'fimMs': fimMs,
        'carroId': carroId,
        'matricula': matricula,
        'condutor': condutor,
        'kmInicial': kmInicial,
        'kmFinal': kmFinal,
        'gapKm': gapKm,
        'precoLitro': precoLitro,
        'depositoL': depositoL,
        'rasto': rasto.map((p) => p.paraJson()).toList(),
        'abastecimentos': abastecimentos.map((a) => a.paraJson()).toList(),
        'fotoAbertura': fotoAbertura,
        'fotoFecho': fotoFecho,
        'fotosTalao': fotosTalao,
        'alertas': alertas.map((a) => a.paraJson()).toList(),
        'semSinalSegundos': semSinalSegundos,
        'bateriaFimPct': bateriaFimPct,
      };

  factory Turno.deJson(Map<String, dynamic> j) => Turno(
        id: j['id'] as String,
        estado: j['estado'] as String? ?? 'FECHADO',
        inicioMs: j['inicioMs'] as int,
        fimMs: j['fimMs'] as int?,
        carroId: j['carroId'] as String? ?? 'c1',
        matricula: j['matricula'] as String? ?? '',
        condutor: j['condutor'] as String? ?? '',
        kmInicial: j['kmInicial'] as int,
        kmFinal: j['kmFinal'] as int?,
        gapKm: j['gapKm'] as int? ?? 0,
        precoLitro: (j['precoLitro'] as num?)?.toDouble() ?? 145,
        depositoL: (j['depositoL'] as num?)?.toDouble() ?? 50,
        rasto: (j['rasto'] as List<dynamic>? ?? [])
            .map((x) => Ponto.deJson(x as Map<String, dynamic>))
            .toList(),
        abastecimentos: (j['abastecimentos'] as List<dynamic>? ?? [])
            .map((x) => Abastecimento.deJson(x as Map<String, dynamic>))
            .toList(),
        fotoAbertura: j['fotoAbertura'] as String?,
        fotoFecho: j['fotoFecho'] as String?,
        fotosTalao:
            (j['fotosTalao'] as List<dynamic>? ?? []).cast<String>().toList(),
        alertas: (j['alertas'] as List<dynamic>? ?? [])
            .map((x) => Alerta(
                  (x as Map<String, dynamic>)['codigo'] as String,
                  Nivel.values.firstWhere((n) => n.name == x['nivel'],
                      orElse: () => Nivel.aviso),
                  x['descricao'] as String,
                  diferencaCve: x['diferencaCve'] as int?,
                ))
            .toList(),
        semSinalSegundos: j['semSinalSegundos'] as int? ?? 0,
        bateriaFimPct: j['bateriaFimPct'] as int?,
      );
}

class Armazem {
  Database? _bd;

  Future<Database> get bd async {
    if (_bd != null) return _bd!;
    final caminho = p.join(await getDatabasesPath(), 'fleetcv.db');
    _bd = await openDatabase(
      caminho,
      version: 1,
      onCreate: (db, _) async {
        await db.execute(
            'CREATE TABLE frota (id INTEGER PRIMARY KEY, dados TEXT NOT NULL)');
        await db.execute('CREATE TABLE turnos ('
            'id TEXT PRIMARY KEY, inicio INTEGER NOT NULL, '
            'estado TEXT NOT NULL, dados TEXT NOT NULL)');
      },
    );
    return _bd!;
  }

  Future<Frota> lerFrota() async {
    final linhas = await (await bd).query('frota', where: 'id = 1');
    if (linhas.isEmpty) return Frota.omissao();
    return Frota.deJson(
        jsonDecode(linhas.first['dados'] as String) as Map<String, dynamic>);
  }

  Future<void> guardarFrota(Frota f) async {
    await (await bd).insert('frota', {'id': 1, 'dados': jsonEncode(f.paraJson())},
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> guardarTurno(Turno t) async {
    await (await bd).insert(
        'turnos',
        {
          'id': t.id,
          'inicio': t.inicioMs,
          'estado': t.estado,
          'dados': jsonEncode(t.paraJson()),
        },
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Turno>> lerTurnos({int limite = 50}) async {
    final linhas = await (await bd)
        .query('turnos', orderBy: 'inicio DESC', limit: limite);
    return linhas
        .map((l) =>
            Turno.deJson(jsonDecode(l['dados'] as String) as Map<String, dynamic>))
        .toList();
  }

  Future<Turno?> turnoAberto() async {
    final linhas = await (await bd)
        .query('turnos', where: 'estado = ?', whereArgs: ['ABERTO'], limit: 1);
    if (linhas.isEmpty) return null;
    return Turno.deJson(
        jsonDecode(linhas.first['dados'] as String) as Map<String, dynamic>);
  }
}
