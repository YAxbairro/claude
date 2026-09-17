# FleetCV — app Android (Fase 3)

A app do condutor em Flutter. Existe para fazer três coisas que o navegador
não faz:

| | Navegador | Esta app |
|---|---|---|
| Gravar o percurso com o **ecrã apagado** | pára | **grava**, por serviço em primeiro plano |
| Detectar **GPS falso** | não vê | `Position.isMocked` → alerta A04 |
| Funcionar **sem rede nenhuma** | limitado | tudo em SQLite no aparelho |

## Onde está o quê

```
lib/regras.dart    as regras. Dart puro, sem Flutter — a tradução das funções
                   SQL da Fase 1, com os mesmos limites e os mesmos códigos
lib/armazem.dart   modelos e SQLite
lib/main.dart      os ecrãs e o serviço de GPS
test/              os cenários da Fase 1, agora contra o código da app
```

`regras.dart` não importa Flutter de propósito: é o ficheiro que tem de estar
certo, e assim testa-se sozinho, depressa, sem emulador.

## Instalar o APK

Não é preciso SDK nenhum instalado: o GitHub compila-o.

1. Separador **Actions** → execução **FleetCV · APK**
2. Descarregar o artefacto `fleetcv-apk`
3. Copiar para o telemóvel e instalar (é preciso autorizar "origens desconhecidas")

## Compilar em casa

```bash
cd fleetcv/android_app
flutter create --platforms=android --project-name fleetcv --org cv.fleetcv .
python3 preparar_android.py
flutter pub get && flutter test && flutter build apk --release
```

A pasta `android/` é **gerada**, não guardada no repositório: são milhares de
linhas de código de plataforma que ninguém edita. As permissões — a única parte
que decidimos — estão em `preparar_android.py`, à vista.

## Três limites, ditos com clareza

- **Sem sincronização.** Os turnos ficam no aparelho. Ligá-los ao painel do dono
  precisa de um servidor (Supabase) e de uma conta que ainda não existe.
- **Sem leitura automática** do quadrante e do talão. Os números escrevem-se à
  mão. A leitura offline (ML Kit) entra depois desta compilação estar verde.
- **O Android pode na mesma matar o serviço** em aparelhos com poupança de
  bateria agressiva. Descobre-se no piloto, não aqui.
