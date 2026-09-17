/// FleetCV — app do condutor (Android).
///
/// O que esta versão faz e a web não fazia:
///  · grava o percurso com o ecrã apagado, através de um serviço em primeiro
///    plano — é a razão de existir desta fase;
///  · denuncia localização falsa (`isMocked`), que o navegador não expõe;
///  · funciona sem rede nenhuma, do princípio ao fim do turno.
library;

import 'dart:async';
import 'dart:io';

import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'armazem.dart';
import 'regras.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FleetCvApp());
}

const _tinta = Color(0xFF0F1618);
const _acento = Color(0xFF0B7F8E);
const _acentoEscuro = Color(0xFF3FC0CE);
const _ok = Color(0xFF3E7B22);
const _aviso = Color(0xFFA86A05);
const _critico = Color(0xFFB02E20);

class FleetCvApp extends StatelessWidget {
  const FleetCvApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FleetCV',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: _acento),
        scaffoldBackgroundColor: const Color(0xFFEDF0F0),
        textTheme: const TextTheme().apply(bodyColor: _tinta, displayColor: _tinta),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
            seedColor: _acentoEscuro, brightness: Brightness.dark),
        scaffoldBackgroundColor: const Color(0xFF0B1011),
      ),
      home: const EcraPrincipal(),
    );
  }
}

enum Ecra { inicio, abrir, turno, abastecer, fechar, resumo }

String nf(num v, [int casas = 0]) {
  final partes = v.abs().toStringAsFixed(casas).split('.');
  final inteiro =
      partes[0].replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => '.');
  final sinal = v < 0 ? '−' : '';
  return casas > 0 ? '$sinal$inteiro,${partes[1]}' : '$sinal$inteiro';
}

String hms(int segundos) {
  final h = segundos ~/ 3600;
  final m = (segundos % 3600) ~/ 60;
  final s = segundos % 60;
  return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}'
      ':${s.toString().padLeft(2, '0')}';
}

String horas(int ms) {
  final d = DateTime.fromMillisecondsSinceEpoch(ms);
  return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

String dataCurta(int ms) {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  final d = DateTime.fromMillisecondsSinceEpoch(ms);
  return '${dias[d.weekday - 1]} ${d.day} ${meses[d.month - 1]}';
}

class EcraPrincipal extends StatefulWidget {
  const EcraPrincipal({super.key});

  @override
  State<EcraPrincipal> createState() => _EcraPrincipalState();
}

class _EcraPrincipalState extends State<EcraPrincipal> {
  final _armazem = Armazem();
  final _bateria = Battery();
  final _camara = ImagePicker();

  Frota _frota = Frota.omissao();
  List<Turno> _turnos = [];
  Turno? _turno;
  Ecra _ecra = Ecra.inicio;
  String _carroId = 'c1';
  String _condutor = '';

  StreamSubscription<Position>? _subGps;
  Timer? _relogio;
  String _estadoGps = 'desligado';
  int? _precisaoM;
  int? _bateriaPct;
  bool _falsoDetectado = false;

  // rascunhos dos formulários
  String? _fotoTemp;
  int _kmRascunho = 0;
  int _valorRascunho = 0;
  double? _litrosRascunho;

  @override
  void initState() {
    super.initState();
    _arrancar();
  }

  @override
  void dispose() {
    _subGps?.cancel();
    _relogio?.cancel();
    super.dispose();
  }

  Future<void> _arrancar() async {
    final f = await _armazem.lerFrota();
    final ts = await _armazem.lerTurnos();
    final aberto = await _armazem.turnoAberto();
    if (!mounted) return;
    setState(() {
      _frota = f;
      _turnos = ts;
      _turno = aberto;
      if (!f.carros.any((c) => c.id == _carroId)) _carroId = f.carros.first.id;
      if (aberto != null) {
        _carroId = aberto.carroId;
        _condutor = aberto.condutor;
        _ecra = Ecra.turno;
      }
    });
    if (aberto != null) await _ligarGps();
    _lerBateria();
  }

  Future<void> _lerBateria() async {
    try {
      final n = await _bateria.batteryLevel;
      if (mounted) setState(() => _bateriaPct = n);
    } catch (_) {
      // alguns aparelhos não respondem; a app não depende disto
    }
  }

  /// O serviço em primeiro plano é o que mantém o GPS vivo com o ecrã apagado.
  /// A notificação permanente não é um detalhe: é o que torna a gravação
  /// visível ao condutor, em vez de acontecer às escondidas.
  Future<void> _ligarGps() async {
    if (_subGps != null) return;
    var permissao = await Geolocator.checkPermission();
    if (permissao == LocationPermission.denied) {
      permissao = await Geolocator.requestPermission();
    }
    if (permissao == LocationPermission.denied ||
        permissao == LocationPermission.deniedForever) {
      if (mounted) setState(() => _estadoGps = 'recusado');
      return;
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      if (mounted) setState(() => _estadoGps = 'desligado');
      return;
    }

    // Não pode ser const: ForegroundNotificationConfig não tem construtor constante.
    final definicoes = AndroidSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
      intervalDuration: Duration(seconds: 10),
      foregroundNotificationConfig: ForegroundNotificationConfig(
        notificationTitle: 'FleetCV · turno em curso',
        notificationText: 'A gravar o percurso. Pára quando fechar o turno.',
        enableWakeLock: true,
        setOngoing: true,
      ),
    );

    setState(() => _estadoGps = 'a-procurar');
    _subGps = Geolocator.getPositionStream(locationSettings: definicoes)
        .listen(_novoPonto, onError: (_) {
      if (mounted) setState(() => _estadoGps = 'sem-sinal');
    });
    _relogio ??= Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _turno != null) setState(() {});
    });
  }

  Future<void> _desligarGps() async {
    await _subGps?.cancel();
    _subGps = null;
    _relogio?.cancel();
    _relogio = null;
    if (mounted) setState(() => _estadoGps = 'desligado');
  }

  void _novoPonto(Position pos) {
    final t = _turno;
    if (t == null || t.estado != 'ABERTO') return;
    final ponto = Ponto(
      lat: pos.latitude,
      lon: pos.longitude,
      momentoMs: pos.timestamp.millisecondsSinceEpoch,
      precisaoM: pos.accuracy.round(),
      velocidadeKmh: pos.speed * 3.6,
      bateriaPct: _bateriaPct,
      falso: pos.isMocked,
    );
    t.rasto.add(ponto);
    if (pos.isMocked) _falsoDetectado = true;
    if (t.rasto.length % 20 == 0) {
      _armazem.guardarTurno(t);
      _lerBateria();
    }
    if (mounted) {
      setState(() {
        _estadoGps = 'ligado';
        _precisaoM = pos.accuracy.round();
      });
    }
  }

  /// A foto é tirada na câmara, nunca escolhida da galeria, e guardada no
  /// aparelho. É ela — não o número escrito — que prova o quadrante.
  Future<String?> _tirarFoto() async {
    final x = await _camara.pickImage(
      source: ImageSource.camera,
      maxWidth: 1280,
      imageQuality: 60,
    );
    if (x == null) return null;
    final pasta = await getApplicationDocumentsDirectory();
    final destino = p.join(pasta.path,
        'foto_${DateTime.now().millisecondsSinceEpoch}.jpg');
    await File(x.path).copy(destino);
    return destino;
  }

  Carro get _carro => _frota.porId(_carroId);

  Future<void> _abrirTurno() async {
    final km = _kmRascunho;
    if (_fotoTemp == null || km < _carro.kmActual) return;
    final t = Turno(
      id: 't${DateTime.now().millisecondsSinceEpoch}',
      inicioMs: DateTime.now().millisecondsSinceEpoch,
      carroId: _carro.id,
      matricula: _carro.matricula,
      condutor: _condutor.isEmpty ? 'Condutor' : _condutor,
      kmInicial: km,
      gapKm: km - _carro.kmActual,
      precoLitro: _frota.precoLitro,
      depositoL: _carro.depositoL,
      fotoAbertura: _fotoTemp,
    );
    await _armazem.guardarTurno(t);
    setState(() {
      _turno = t;
      _fotoTemp = null;
      _falsoDetectado = false;
      _ecra = Ecra.turno;
    });
    await _ligarGps();
  }

  Future<void> _registarAbastecimento() async {
    final t = _turno;
    if (t == null || _valorRascunho <= 0) return;
    final ultimo = t.rasto.isEmpty ? null : t.rasto.last;
    t.abastecimentos.add(Abastecimento(
      momentoMs: DateTime.now().millisecondsSinceEpoch,
      valorCve: _valorRascunho,
      litrosTalao: _litrosRascunho,
      temFoto: _fotoTemp != null,
      lat: ultimo?.lat,
      lon: ultimo?.lon,
    ));
    if (_fotoTemp != null) t.fotosTalao.add(_fotoTemp!);
    await _armazem.guardarTurno(t);
    setState(() {
      _fotoTemp = null;
      _valorRascunho = 0;
      _litrosRascunho = null;
      _ecra = Ecra.turno;
    });
  }

  Future<void> _fecharTurno() async {
    final t = _turno;
    if (t == null || _fotoTemp == null) return;
    final km = _kmRascunho;
    final percorridos = km - t.kmInicial;
    if (percorridos < 0 || percorridos > Limites.kmMaxTurno) return;

    t.kmFinal = km;
    t.fimMs = DateTime.now().millisecondsSinceEpoch;
    t.estado = 'FECHADO';
    t.fotoFecho = _fotoTemp;
    t.semSinalSegundos = semSinalS(t.rasto).round();
    t.bateriaFimPct = _bateriaPct;
    t.alertas = avaliarTurno(
      kmInicial: t.kmInicial,
      kmFinal: km,
      gapKm: t.gapKm,
      rasto: t.rasto,
      abastecimentos: t.abastecimentos,
      precoLitro: t.precoLitro,
      depositoL: t.depositoL,
      temFotoAbertura: t.fotoAbertura != null,
      temFotoFecho: true,
    ).alertas;

    await _desligarGps();
    _carro.kmActual = km;
    await _armazem.guardarFrota(_frota);
    await _armazem.guardarTurno(t);
    final ts = await _armazem.lerTurnos();
    if (!mounted) return;
    setState(() {
      _turnos = ts;
      _turno = null;
      _fotoTemp = null;
      _ecra = Ecra.resumo;
    });
  }

  @override
  Widget build(BuildContext context) {
    final escuro = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: escuro ? const Color(0xFF141A1B) : Colors.white,
        elevation: 0,
        title: Row(children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
                color: escuro ? _acentoEscuro : _acento, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          const Text('FleetCV',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
        ]),
        actions: [
          Center(child: _pilulaGps(escuro)),
          if (_bateriaPct != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Center(
                  child: Text('$_bateriaPct%',
                      style: const TextStyle(fontSize: 12))),
            ),
        ],
      ),
      body: SafeArea(child: _corpo()),
    );
  }

  Widget _pilulaGps(bool escuro) {
    final rotulos = {
      'ligado': 'GPS activo',
      'a-procurar': 'GPS a procurar',
      'recusado': 'GPS recusado',
      'sem-sinal': 'sem sinal',
      'desligado': 'GPS desligado',
    };
    final vivo = _estadoGps == 'ligado';
    final morto = _estadoGps == 'recusado';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: vivo
            ? _ok.withValues(alpha: 0.15)
            : morto
                ? _critico.withValues(alpha: 0.15)
                : Colors.grey.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '${rotulos[_estadoGps]}${vivo && _precisaoM != null ? ' ±${_precisaoM}m' : ''}',
        style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: vivo ? _ok : (morto ? _critico : Colors.grey)),
      ),
    );
  }

  Widget _corpo() {
    switch (_ecra) {
      case Ecra.abrir:
        return _ecraAbrir();
      case Ecra.turno:
        return _ecraTurno();
      case Ecra.abastecer:
        return _ecraAbastecer();
      case Ecra.fechar:
        return _ecraFechar();
      case Ecra.resumo:
        return _ecraResumo();
      case Ecra.inicio:
        return _ecraInicio();
    }
  }

  Widget _cartao({required Widget filho, Color? fundo}) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: fundo ?? Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.25)),
        ),
        child: filho,
      );

  Widget _botao(String texto, VoidCallback? aoTocar, {Color? cor}) => SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: aoTocar,
          style: FilledButton.styleFrom(
            backgroundColor: cor,
            padding: const EdgeInsets.symmetric(vertical: 17),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(texto,
              style:
                  const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w600)),
        ),
      );

  Widget _caixaFoto(String titulo, String dica) {
    return InkWell(
      onTap: () async {
        final caminho = await _tirarFoto();
        if (caminho != null && mounted) setState(() => _fotoTemp = caminho);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: _fotoTemp != null ? _ok : Colors.grey.withValues(alpha: 0.5),
              width: 2,
              style: _fotoTemp != null ? BorderStyle.solid : BorderStyle.solid),
        ),
        child: _fotoTemp != null
            ? Column(children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(File(_fotoTemp!),
                      height: 190, width: double.infinity, fit: BoxFit.cover),
                ),
                const SizedBox(height: 8),
                const Text('Tocar para repetir',
                    style: TextStyle(fontSize: 12.5)),
              ])
            : Column(children: [
                const Icon(Icons.photo_camera_outlined, size: 30),
                const SizedBox(height: 8),
                Text(titulo,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 3),
                Text(dica,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12.5, color: Colors.grey)),
              ]),
      ),
    );
  }

  Widget _campoNumero(String rotulo, int valor, String ajuda,
      void Function(int) aoMudar) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(rotulo.toUpperCase(),
          style: const TextStyle(
              fontSize: 11.5, fontWeight: FontWeight.w600, letterSpacing: 0.6)),
      const SizedBox(height: 5),
      TextFormField(
        initialValue: valor > 0 ? valor.toString() : '',
        keyboardType: TextInputType.number,
        style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500),
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          helperText: ajuda,
          helperMaxLines: 3,
        ),
        onChanged: (v) => setState(() => aoMudar(int.tryParse(v) ?? 0)),
      ),
    ]);
  }

  Widget _lista(List<Widget> filhos) => ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: filhos,
      );

  Widget _ecraInicio() {
    final fechados = _turnos.where((t) => t.estado == 'FECHADO').toList();
    return Column(children: [
      Expanded(
        child: _lista([
          _cartao(
            filho: Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_carro.matricula,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w600)),
                Text('${_carro.marca} ${_carro.modelo}',
                    style: const TextStyle(fontSize: 12.5, color: Colors.grey)),
              ]),
              const Spacer(),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(nf(_carro.kmActual),
                    style: const TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w500)),
                const Text('km no quadrante',
                    style: TextStyle(fontSize: 11, color: Colors.grey)),
              ]),
            ]),
          ),
          const SizedBox(height: 14),
          if (_condutor.isEmpty)
            _cartao(
              filho: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Quem está a conduzir?',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 8),
                TextFormField(
                  decoration: const InputDecoration(
                      border: OutlineInputBorder(), hintText: 'O seu nome'),
                  onChanged: (v) => _condutor = v,
                ),
              ]),
            ),
          const SizedBox(height: 14),
          const Text('Os meus turnos',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 8),
          if (fechados.isEmpty)
            _cartao(
              filho: const Text(
                'Ainda não gravou nenhum turno.\nToque em Abrir turno para começar.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            )
          else
            ...fechados.take(10).map(_linhaTurno),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: _botao('Abrir turno', () {
          setState(() {
            _fotoTemp = null;
            _kmRascunho = _carro.kmActual;
            _ecra = Ecra.abrir;
          });
        }),
      ),
    ]);
  }

  Widget _linhaTurno(Turno t) {
    final criticos =
        t.alertas.where((a) => a.nivel == Nivel.critico).length;
    final cor = criticos > 0
        ? _critico
        : (t.alertas.isEmpty ? _ok : _aviso);
    final rotulo = criticos > 0
        ? 'rever'
        : (t.alertas.isEmpty ? 'limpo' : '${t.alertas.length} aviso');
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: _cartao(
        filho: Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${nf(t.kmPercorridos)} km · ${t.matricula}',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(
                '${dataCurta(t.inicioMs)} · ${horas(t.inicioMs)}'
                '–${horas(t.fimMs ?? t.inicioMs)} · ${nf(t.totalCve)} CVE',
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ]),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
                color: cor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6)),
            child: Text(rotulo,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: cor)),
          ),
        ]),
      ),
    );
  }

  Widget _ecraAbrir() {
    final gap = _kmRascunho - _carro.kmActual;
    return Column(children: [
      Expanded(
        child: _lista([
          const Text('Abrir turno',
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
          Text('${_carro.matricula} · fotografe o conta-quilómetros antes de arrancar.',
              style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 14),
          _caixaFoto('Foto do quadrante',
              'A câmara abre-se — não vale foto da galeria'),
          const SizedBox(height: 14),
          _campoNumero('Km no quadrante', _kmRascunho,
              'Último fecho: ${nf(_carro.kmActual)} km', (v) => _kmRascunho = v),
          if (gap > Limites.gapKm) ...[
            const SizedBox(height: 14),
            _cartao(
              fundo: _critico.withValues(alpha: 0.10),
              filho: Text(
                  'O carro andou ${nf(gap)} km sem turno.\n'
                  'Fica registado e o dono é avisado. Se foi à oficina, diga-lhe.',
                  style: const TextStyle(fontSize: 13)),
            ),
          ],
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Column(children: [
          _botao(
              _fotoTemp == null ? 'Falta a foto do quadrante' : 'Começar turno',
              _fotoTemp == null ? null : _abrirTurno),
          TextButton(
              onPressed: () => setState(() {
                    _fotoTemp = null;
                    _ecra = Ecra.inicio;
                  }),
              child: const Text('Cancelar')),
        ]),
      ),
    ]);
  }

  Widget _ecraTurno() {
    final t = _turno!;
    final decorridos =
        (DateTime.now().millisecondsSinceEpoch - t.inicioMs) ~/ 1000;
    return Column(children: [
      Expanded(
        child: _lista([
          _cartao(
            filho: Column(children: [
              Text(hms(decorridos),
                  style: const TextStyle(
                      fontSize: 42, fontWeight: FontWeight.w500, height: 1)),
              const SizedBox(height: 4),
              Text('${t.matricula} · desde as ${horas(t.inicioMs)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 14),
              Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                _metrica(nf(kmDoRasto(t.rasto), 1), 'km GPS'),
                _metrica(nf(t.totalCve), 'CVE'),
                _metrica('${t.rasto.length}', 'pontos'),
              ]),
            ]),
          ),
          if (_falsoDetectado) ...[
            const SizedBox(height: 14),
            _cartao(
              fundo: _critico.withValues(alpha: 0.10),
              filho: const Text(
                  'Localização falsa detectada. O dono é avisado quando o turno fechar.',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ],
          const SizedBox(height: 14),
          _cartao(
            filho: const Text(
                'O percurso só é gravado com o turno aberto. Ao fechar, deixa de '
                'haver localização — nem o dono a vê.',
                style: TextStyle(fontSize: 12.5, color: Colors.grey)),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Row(children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() {
                _fotoTemp = null;
                _valorRascunho = 0;
                _ecra = Ecra.abastecer;
              }),
              style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 17)),
              child: const Text('Abasteci'),
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: _botao('Fechar turno', () {
              setState(() {
                _fotoTemp = null;
                _kmRascunho =
                    t.kmInicial + kmDoRasto(t.rasto).round();
                _ecra = Ecra.fechar;
              });
            }, cor: _critico),
          ),
        ]),
      ),
    ]);
  }

  Widget _metrica(String valor, String rotulo) =>
      Column(children: [
        Text(valor,
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500)),
        Text(rotulo,
            style: const TextStyle(fontSize: 10.5, color: Colors.grey)),
      ]);

  Widget _ecraAbastecer() {
    final litros = _valorRascunho / _frota.precoLitro;
    return Column(children: [
      Expanded(
        child: _lista([
          const Text('Abastecimento',
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
          const Text('Registe agora, no posto. No fim do dia a conta já está feita.',
              style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 14),
          _caixaFoto('Foto do talão', 'É esta foto que prova o valor'),
          const SizedBox(height: 14),
          _campoNumero(
              'Valor pago (CVE)',
              _valorRascunho,
              _valorRascunho > 0
                  ? 'A ${nf(_frota.precoLitro, 2)} CVE/litro dá ${nf(litros, 2)} litros'
                  : 'Preço oficial: ${nf(_frota.precoLitro, 2)} CVE/litro',
              (v) => _valorRascunho = v),
          const SizedBox(height: 14),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('LITROS NO TALÃO (SE DER PARA LER)',
                style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.6)),
            const SizedBox(height: 5),
            TextFormField(
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500),
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                helperText: 'Se não bater com o valor pago, o dono é avisado.',
                helperMaxLines: 2,
              ),
              onChanged: (v) =>
                  _litrosRascunho = double.tryParse(v.replaceAll(',', '.')),
            ),
          ]),
          if (litros > _carro.depositoL * 1.05) ...[
            const SizedBox(height: 14),
            _cartao(
              fundo: _critico.withValues(alpha: 0.10),
              filho: Text(
                  'Não cabe no depósito: ${nf(litros, 2)} litros num depósito de '
                  '${nf(_carro.depositoL)}. Confirme o valor.',
                  style: const TextStyle(fontSize: 13)),
            ),
          ],
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Column(children: [
          _botao('Registar abastecimento',
              _valorRascunho > 0 ? _registarAbastecimento : null),
          TextButton(
              onPressed: () => setState(() {
                    _fotoTemp = null;
                    _ecra = Ecra.turno;
                  }),
              child: const Text('Voltar')),
        ]),
      ),
    ]);
  }

  Widget _ecraFechar() {
    final t = _turno!;
    final percorridos = _kmRascunho - t.kmInicial;
    final valido = _fotoTemp != null &&
        percorridos >= 0 &&
        percorridos <= Limites.kmMaxTurno;
    return Column(children: [
      Expanded(
        child: _lista([
          const Text('Fechar turno',
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
          const Text('Última foto do quadrante e está feito.',
              style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 14),
          _caixaFoto('Foto do quadrante', 'Como na abertura'),
          const SizedBox(height: 14),
          _campoNumero(
              'Km no quadrante',
              _kmRascunho,
              'Abriu com ${nf(t.kmInicial)} km · '
              '${percorridos >= 0 ? '${nf(percorridos)} km percorridos' : 'não pode ser menor que a abertura'}',
              (v) => _kmRascunho = v),
          if (percorridos > Limites.kmMaxTurno) ...[
            const SizedBox(height: 14),
            _cartao(
              fundo: _critico.withValues(alpha: 0.10),
              filho: Text(
                  '${nf(percorridos)} km num turno é pouco provável. '
                  'Confirme a foto — quase sempre é um dígito a mais.',
                  style: const TextStyle(fontSize: 13)),
            ),
          ],
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Column(children: [
          _botao(_fotoTemp == null ? 'Falta a foto do quadrante' : 'Fechar turno',
              valido ? _fecharTurno : null),
          TextButton(
              onPressed: () => setState(() {
                    _fotoTemp = null;
                    _ecra = Ecra.turno;
                  }),
              child: const Text('Voltar ao turno')),
        ]),
      ),
    ]);
  }

  Widget _ecraResumo() {
    if (_turnos.isEmpty) return _ecraInicio();
    final t = _turnos.first;
    final r = avaliarTurno(
      kmInicial: t.kmInicial,
      kmFinal: t.kmFinal ?? t.kmInicial,
      gapKm: t.gapKm,
      rasto: t.rasto,
      abastecimentos: t.abastecimentos,
      precoLitro: t.precoLitro,
      depositoL: t.depositoL,
      temFotoAbertura: t.fotoAbertura != null,
      temFotoFecho: t.fotoFecho != null,
    );
    final criticos = r.alertas.where((a) => a.nivel == Nivel.critico).length;
    return Column(children: [
      Expanded(
        child: _lista([
          const Text('Turno fechado',
              style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
          Text(
              '${t.matricula} · ${horas(t.inicioMs)}–${horas(t.fimMs ?? t.inicioMs)}',
              style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 14),
          _cartao(
            fundo: (criticos > 0
                    ? _critico
                    : (r.alertas.isEmpty ? _ok : _aviso))
                .withValues(alpha: 0.10),
            filho: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                  criticos > 0
                      ? 'Há coisas para o dono ver'
                      : (r.alertas.isEmpty
                          ? 'Turno limpo'
                          : '${r.alertas.length} ponto(s) a explicar'),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 6),
              Text(
                  r.alertas.isEmpty
                      ? 'Todas as verificações passaram. Nada a explicar a ninguém.'
                      : r.alertas.map((a) => a.descricao).join('\n'),
                  style: const TextStyle(fontSize: 13)),
            ]),
          ),
          const SizedBox(height: 14),
          _cartao(
            filho: Column(children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('Verificações',
                    style:
                        TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              const SizedBox(height: 4),
              ...r.verificacoes.map((v) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                              v.passou
                                  ? Icons.check_circle_outline
                                  : Icons.error_outline,
                              size: 19,
                              color: v.passou
                                  ? _ok
                                  : (v.critica ? _critico : _aviso)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(v.titulo,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13.5)),
                                  Text(v.detalhe,
                                      style: const TextStyle(
                                          fontSize: 12, color: Colors.grey)),
                                ]),
                          ),
                          const SizedBox(width: 8),
                          Text(v.valor,
                              style: const TextStyle(
                                  fontSize: 13.5, fontWeight: FontWeight.w500)),
                        ]),
                  )),
            ]),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: _botao('Voltar ao início',
            () => setState(() => _ecra = Ecra.inicio)),
      ),
    ]);
  }
}
