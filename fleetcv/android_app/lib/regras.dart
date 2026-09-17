/// As regras do FleetCV.
///
/// Este ficheiro é Dart puro — sem Flutter, sem base de dados, sem ecrãs — para
/// poder ser testado sozinho. É a tradução das funções SQL da Fase 1, e os
/// limites são exactamente os mesmos (SPEC §15). Mudar um limite aqui obriga a
/// mudá-lo no SQL e no `LIM` da aplicação web.
library;

import 'dart:math' as math;

class Limites {
  static const int gapKm = 3;               // R33 · buraco no quadrante entre turnos
  static const int kmMaxTurno = 500;        // R14 · km plausíveis num turno
  static const double divAvisoPct = 15;     // R16 · divergência quadrante vs GPS
  static const double divCriticaPct = 25;
  static const int semSinalS = 900;         // R09 · 15 min sem ponto
  static const int precisaoMaxM = 50;       // filtro de pontos maus
  static const double velMaxKmh = 180;      // filtro de saltos impossíveis
  static const double divLitrosPct = 3;     // R22 · talão vs valor pago
  static const int raioPostoM = 150;        // R24 · paragem no posto
  static const int paragemMinS = 120;
  static const int bateriaMortaPct = 5;     // abaixo disto, o silêncio do GPS não é culpa
  static const int turnoMaxS = 57600;       // 16 h · fecho automático
}

/// Penalizações do score — a mesma tabela de `fleetcv.penalizacao`.
const Map<String, int> penalizacoes = {
  'A04': 50, 'A06': 40, 'A19': 30, 'A15': 30, 'A16': 30, 'A14': 30,
  'A13': 25, 'A12': 25, 'A08': 15, 'A09': 15, 'A11': 10, 'A20': 10, 'A21': 5,
};

enum Nivel { info, aviso, critico }

class Alerta {
  final String codigo;
  final Nivel nivel;
  final String descricao;
  final int? diferencaCve;

  const Alerta(this.codigo, this.nivel, this.descricao, {this.diferencaCve});

  Map<String, dynamic> paraJson() => {
        'codigo': codigo,
        'nivel': nivel.name,
        'descricao': descricao,
        if (diferencaCve != null) 'diferencaCve': diferencaCve,
      };
}

class Verificacao {
  final bool passou;
  final bool critica;
  final String titulo;
  final String detalhe;
  final String valor;

  const Verificacao(this.titulo, this.detalhe, this.valor,
      {this.passou = true, this.critica = false});
}

class Ponto {
  final double lat;
  final double lon;
  final int momentoMs;
  final int precisaoM;
  final double? velocidadeKmh;
  final int? bateriaPct;
  final bool falso; // Android denuncia localização simulada

  const Ponto({
    required this.lat,
    required this.lon,
    required this.momentoMs,
    required this.precisaoM,
    this.velocidadeKmh,
    this.bateriaPct,
    this.falso = false,
  });

  factory Ponto.deJson(Map<String, dynamic> j) => Ponto(
        lat: (j['lat'] as num).toDouble(),
        lon: (j['lon'] as num).toDouble(),
        momentoMs: j['t'] as int,
        precisaoM: j['p'] as int? ?? 0,
        velocidadeKmh: (j['v'] as num?)?.toDouble(),
        bateriaPct: j['b'] as int?,
        falso: (j['f'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> paraJson() => {
        'lat': lat, 'lon': lon, 't': momentoMs, 'p': precisaoM,
        'v': velocidadeKmh, 'b': bateriaPct, 'f': falso ? 1 : 0,
      };
}

class Abastecimento {
  final int momentoMs;
  final int valorCve;
  final double? litrosTalao;
  final bool temFoto;
  final double? lat;
  final double? lon;

  const Abastecimento({
    required this.momentoMs,
    required this.valorCve,
    this.litrosTalao,
    this.temFoto = false,
    this.lat,
    this.lon,
  });

  factory Abastecimento.deJson(Map<String, dynamic> j) => Abastecimento(
        momentoMs: j['t'] as int,
        valorCve: j['valor'] as int,
        litrosTalao: (j['litrosTalao'] as num?)?.toDouble(),
        temFoto: (j['temFoto'] as int? ?? 0) == 1,
        lat: (j['lat'] as num?)?.toDouble(),
        lon: (j['lon'] as num?)?.toDouble(),
      );

  Map<String, dynamic> paraJson() => {
        't': momentoMs, 'valor': valorCve, 'litrosTalao': litrosTalao,
        'temFoto': temFoto ? 1 : 0, 'lat': lat, 'lon': lon,
      };
}

/// Distância entre dois pontos, em metros. Haversine — o mesmo que
/// `fleetcv.distancia_m()`. Chega para alguns km com erro muito abaixo da
/// precisão do GPS de um telemóvel.
double distanciaM(double lat1, double lon1, double lat2, double lon2) {
  const raio = 6371000.0;
  const g = math.pi / 180;
  final a = math.pow(math.sin((lat2 - lat1) * g / 2), 2) +
      math.cos(lat1 * g) *
          math.cos(lat2 * g) *
          math.pow(math.sin((lon2 - lon1) * g / 2), 2);
  return 2 * raio * math.asin(math.sqrt(a));
}

/// Km segundo o GPS. Descarta pontos imprecisos e saltos impossíveis — sem este
/// filtro o GPS urbano "anda" com o carro parado e inventa quilómetros que dão
/// alertas falsos. Igual a `fleetcv.km_gps_m()`.
double kmDoRasto(List<Ponto> pontos) {
  var metros = 0.0;
  Ponto? anterior;
  for (final p in pontos) {
    if (p.precisaoM > Limites.precisaoMaxM) continue;
    if (anterior != null) {
      final segundos = (p.momentoMs - anterior.momentoMs) / 1000;
      final d = distanciaM(anterior.lat, anterior.lon, p.lat, p.lon);
      if (segundos > 0 && (d / segundos) * 3.6 <= Limites.velMaxKmh) {
        metros += d;
      }
    }
    anterior = p;
  }
  return metros / 1000;
}

/// Maior interrupção isolada do sinal, em segundos. Um intervalo que começa
/// logo a seguir a um ponto com a bateria no fim não conta: a bateria prova a
/// causa, e penalizar aí seria punir quem não teve culpa.
double maiorFalhaS(List<Ponto> pontos) {
  var maior = 0.0;
  for (var i = 1; i < pontos.length; i++) {
    if ((pontos[i - 1].bateriaPct ?? 100) <= Limites.bateriaMortaPct) continue;
    final g = (pontos[i].momentoMs - pontos[i - 1].momentoMs) / 1000;
    if (g > maior) maior = g;
  }
  return maior;
}

/// Total de tempo sem sinal. Só conta falhas acima de 5 minutos — a amostragem
/// normal nunca lá chega.
double semSinalS(List<Ponto> pontos) {
  var total = 0.0;
  for (var i = 1; i < pontos.length; i++) {
    if ((pontos[i - 1].bateriaPct ?? 100) <= Limites.bateriaMortaPct) continue;
    final g = (pontos[i].momentoMs - pontos[i - 1].momentoMs) / 1000;
    if (g > 300) total += g;
  }
  return total;
}

String _n(num v, [int casas = 0]) {
  final s = v.abs().toStringAsFixed(casas).split('.');
  final inteiro = s[0].replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => '.');
  final sinal = v < 0 ? '−' : '';
  return casas > 0 ? '$sinal$inteiro,${s[1]}' : '$sinal$inteiro';
}

class Resultado {
  final List<Verificacao> verificacoes;
  final List<Alerta> alertas;
  final double kmGps;
  final int kmQuadrante;

  const Resultado(this.verificacoes, this.alertas, this.kmGps, this.kmQuadrante);
}

/// Avalia um turno fechado. É a tradução de `fleetcv.fechar_turno()` mais as
/// regras do combustível — as mesmas contas, os mesmos limites, os mesmos
/// códigos de alerta.
Resultado avaliarTurno({
  required int kmInicial,
  required int kmFinal,
  required int gapKm,
  required List<Ponto> rasto,
  required List<Abastecimento> abastecimentos,
  required double precoLitro,
  required double depositoL,
  required bool temFotoAbertura,
  required bool temFotoFecho,
}) {
  final v = <Verificacao>[];
  final a = <Alerta>[];
  final kmQ = kmFinal - kmInicial;
  final kmG = kmDoRasto(rasto);
  final temRasto = rasto.length > 5;

  final fotosOk = temFotoAbertura && temFotoFecho;
  v.add(Verificacao('Quadrante fotografado nas duas pontas',
      '${_n(kmInicial)} → ${_n(kmFinal)}', '${_n(kmQ)} km',
      passou: fotosOk));
  if (!fotosOk) {
    a.add(const Alerta('A11', Nivel.aviso, 'Turno sem foto do quadrante'));
  }

  // R10 · localização falsa: acto deliberado, não engano de ninguém
  final falsos = rasto.where((p) => p.falso).length;
  if (falsos > 0) {
    v.add(Verificacao('Localização verdadeira',
        '$falsos pontos vindos de uma app de GPS falso', 'falsa',
        passou: false, critica: true));
    a.add(Alerta('A04', Nivel.critico,
        'Localização falsa detectada em $falsos pontos'));
  }

  if (temRasto) {
    final div = kmQ > 0 ? (kmQ - kmG) / kmQ * 100 : 0.0;
    final gpsAFrente = kmG > kmQ * 1.10;
    final critico = gpsAFrente || div >= Limites.divCriticaPct;
    final aviso = !critico && div.abs() >= Limites.divAvisoPct;
    v.add(Verificacao(
        'Km do GPS batem com o quadrante',
        'divergência de ${_n(div, 1)}% · o GPS fica sempre um pouco abaixo',
        '${_n(kmG, 1)} km',
        passou: !critico && !aviso, critica: critico));
    if (critico) {
      a.add(Alerta(gpsAFrente ? 'A09' : 'A08', Nivel.critico,
          'Quadrante e GPS não batem (${_n(div, 1)}%)'));
    } else if (aviso) {
      a.add(Alerta('A07', Nivel.aviso, 'Divergência de km de ${_n(div, 1)}%'));
    }

    final falha = maiorFalhaS(rasto);
    v.add(Verificacao('Sinal de GPS sem falhas longas',
        'maior interrupção do sinal', '${_n(falha / 60)} min',
        passou: falha <= Limites.semSinalS));
    if (falha > Limites.semSinalS) {
      a.add(Alerta('A03', Nivel.aviso,
          'Sem sinal de GPS durante ${_n(falha / 60)} minutos'));
    }
  } else {
    v.add(const Verificacao('Sem percurso gravado',
        'o GPS não esteve activo durante o turno', '—',
        passou: false));
    a.add(const Alerta('A03', Nivel.aviso, 'Turno sem percurso de GPS'));
  }

  // R33 · o carro andou sem turno aberto
  if (gapKm > Limites.gapKm) {
    v.add(Verificacao('O carro andou fora de turno',
        'abriu com ${_n(kmInicial)}, o fecho anterior foi ${_n(kmInicial - gapKm)}',
        '+${_n(gapKm)} km',
        passou: false, critica: true));
    a.add(Alerta('A19', Nivel.critico,
        'O carro andou ${_n(gapKm)} km sem turno aberto'));
  }

  for (final ab in abastecimentos) {
    v.add(Verificacao('Talão fotografado', 'abastecimento registado',
        '${_n(ab.valorCve)} CVE',
        passou: ab.temFoto));
    if (!ab.temFoto) {
      a.add(const Alerta('A11', Nivel.aviso, 'Abastecimento sem talão'));
    }

    // R21 · litros = valor ÷ preço oficial. É isto que tira o poder de inventar.
    final litros = ab.valorCve / precoLitro;
    final cabe = litros <= depositoL * 1.05;
    v.add(Verificacao('Litros cabem no depósito',
        '${_n(litros, 2)} l num depósito de ${_n(depositoL)} l',
        '${_n(litros, 2)} l',
        passou: cabe, critica: !cabe));
    if (!cabe) {
      a.add(Alerta('A13', Nivel.critico,
          'Declarou ${_n(litros, 2)} litros num depósito de ${_n(depositoL)}'));
    }

    // R22 · o que está no talão contra o que foi declarado
    if (ab.litrosTalao != null) {
      final d = (ab.litrosTalao! - litros).abs() / litros * 100;
      final bate = d <= Limites.divLitrosPct;
      final noTalao = (ab.litrosTalao! * precoLitro).round();
      v.add(Verificacao('Valor pago bate com o talão',
          'pagou ${_n(ab.valorCve)} CVE, que dariam ${_n(litros, 2)} l · '
          'o talão mostra ${_n(ab.litrosTalao!, 2)} l',
          bate ? 'bate' : '${_n(noTalao)} CVE',
          passou: bate));
      if (!bate) {
        a.add(Alerta('A12', Nivel.aviso,
            'Declarou ${_n(ab.valorCve)} CVE mas o talão dá ${_n(noTalao)} CVE',
            diferencaCve: ab.valorCve - noTalao));
      }
    }

    // R24 · o carro esteve mesmo parado no posto?
    if (temRasto && ab.lat != null) {
      var parado = 0.0;
      int? anterior;
      for (final p in rasto) {
        if (distanciaM(p.lat, p.lon, ab.lat!, ab.lon!) <= Limites.raioPostoM) {
          if (anterior != null) parado += (p.momentoMs - anterior) / 1000;
          anterior = p.momentoMs;
        } else {
          anterior = null;
        }
      }
      final okParagem = parado >= Limites.paragemMinS;
      v.add(Verificacao('O carro esteve mesmo parado no posto',
          'o percurso mostra ${_n(parado / 60, 1)} min dentro de '
          '${Limites.raioPostoM} m do local',
          okParagem ? 'confirmado' : 'não',
          passou: okParagem, critica: !okParagem));
      if (!okParagem) {
        a.add(const Alerta('A14', Nivel.critico,
            'O rasto não mostra o carro parado no posto'));
      }
    }
  }

  return Resultado(v, a, kmG, kmQ);
}

/// Score de confiança: 0 a 100 sobre os últimos 30 dias. Mede disciplina de
/// registo, NÃO honestidade. Um motorista cuidadoso com um telemóvel velho vai
/// ter score baixo, e isso tem de se saber antes de acusar alguém.
int calcularScore({
  required List<List<Alerta>> alertasPorTurno,
  required List<int> semSinalSegundos,
  required Set<String> resolvidosComoErroDoSistema,
}) {
  var penalizacao = 0;
  var limpos = 0;
  for (var i = 0; i < alertasPorTurno.length; i++) {
    var maus = 0;
    for (final al in alertasPorTurno[i]) {
      if (resolvidosComoErroDoSistema.contains(al.codigo)) continue;
      penalizacao += penalizacoes[al.codigo] ?? 0;
      if (al.nivel != Nivel.info) maus++;
    }
    final semSinal = i < semSinalSegundos.length ? semSinalSegundos[i] : 0;
    penalizacao += math.min(semSinal ~/ 600, 20);
    if (maus == 0) limpos++;
  }
  return math.max(0, math.min(100, 100 - penalizacao + limpos * 3));
}
