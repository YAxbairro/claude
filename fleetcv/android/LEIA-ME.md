# A aplicação Android do condutor

A mesma FleetCV (abre `https://fleetcv.vercel.app/app#condutor`), dentro de
uma aplicação Android feita com o [Capacitor](https://capacitorjs.com). A
diferença é o GPS: uma página no navegador pára quando o ecrã se apaga; aqui
o GPS vem de um serviço do Android com notificação fixa
([@capacitor-community/background-geolocation](https://github.com/capacitor-community/background-geolocation)),
que continua com o ecrã apagado e com outras aplicações abertas.

Como a aplicação carrega o site, **as mudanças no site chegam sem instalar
nada de novo**. Só é preciso um APK novo quando muda a parte nativa (este
directório).

## O que tem de nativo

- o serviço de GPS em segundo plano, com a notificação "FleetCV · GPS ligado";
- `android.useLegacyBridge` (sem isto o GPS parava aos 5 min em segundo plano)
  e `CapacitorHttp` (o Android trava os pedidos da página ao fim de 5 min em
  segundo plano; assim vão pelo lado nativo) — ver `capacitor.config.json`;
- `BateriaPlugin.java`: pergunta se a FleetCV está livre da poupança de
  bateria e pede ao condutor que a liberte (os Samsung e Xiaomi matam
  aplicações em segundo plano); segura o telemóvel acordado durante o
  turno (`segurar`/`largar`, desde a 1.0.1) e diz a versão da aplicação
  (a página pede para actualizar quem tiver uma anterior);
- licenças: localização, notificações, câmara, ecrã aceso;
- desde a 1.2.0, `EnvioNativo.java`: ouve as posições do serviço do GPS e
  guarda-as num ficheiro, e se a página estiver calada há mais de 20 s
  manda ela própria a posição ao vivo para a base (o mesmo pedido que a
  página faz, com a chave da sessão que a página lhe passa a cada envio).
  Quando a página volta, junta ao percurso os pontos guardados. No teste
  de 10/10 (Samsung Galaxy A02, Android 11) o envio parava 2 a 3 minutos
  depois de o ecrã apagar, com a bateria já sem restrições: o Android
  adormecia ou matava a página. E `MainActivity`: o processo da página
  fica com a importância da aplicação, e se mesmo assim for abaixo a
  aplicação não fecha (antes fechava, com o GPS) — a página volta quando
  o condutor a abrir. Provado fora do Android num banco de ensaio
  (servidor de mentira) e, ao vivo, o mesmo pedido aceite pela base
  verdadeira com a página do condutor fechada.

A página sabe que está dentro da aplicação (`window.Capacitor`) e usa o GPS
nativo em vez do do navegador (`paineis/painel_condutor.html`, `nativo()`).
Atenção: a página vem do site, sem o `@capacitor/core` — os módulos são os
que o Android injecta, e um método de "callback" (o `addWatcher`) devolve
logo o número da vigia, não uma promessa. E as licenças pedem-se uma de cada
vez: a localização antes de ligar o GPS (senão, no Android 14+, o serviço não
fica em primeiro plano e o GPS pára com o ecrã apagado).
Provado em `paineis/teste_app_android.mjs`, com a aplicação imitada.

## Compilar

Precisa de Java 21, Node e do SDK do Android (plataforma 36):

```sh
npm install
npx cap sync android
cd android
echo "sdk.dir=/caminho/do/android-sdk" > local.properties
./gradlew assembleRelease
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk` e
publica-se como `site/FleetCV.apk` (https://fleetcv.vercel.app/FleetCV.apk).
Antes de publicar um novo, subir o `versionCode` em `android/app/build.gradle`.

## A chave da assinatura

O Android só aceita uma actualização assinada com a **mesma chave**. A chave
não está no GitHub: está na base de dados do Supabase, na tabela
`public._cofre` (fechada — sem acesso pela aplicação, só pelo SQL Editor),
nas linhas `android_chave_p12_base64` e `android_chave_senha`.

```sh
# no SQL Editor: select valor from _cofre where nome='android_chave_p12_base64';
base64 -d > fleetcv.p12        # colar o valor
export FLEETCV_KS=$PWD/fleetcv.p12
export FLEETCV_KS_SENHA='...'   # o valor de android_chave_senha
./gradlew assembleRelease
```

Impressão digital do certificado (SHA-256):
`DB:69:CD:25:8C:E1:E7:68:C0:B3:A9:E5:36:A4:DD:A4:EA:F9:B5:11:E9:4C:B6:F8:9D:15:DB:E1:C2:29:9C:8C`

Nunca apagar essas duas linhas: sem a chave, quem já tem a aplicação teria de
a desinstalar para receber a seguinte.

## Google Play

Tudo o que a Play pede (pacote AAB, textos, imagens, formulários, a escolha
da chave) está em [`play/LEIA-ME.md`](play/LEIA-ME.md). A partir da 1.1.0 a
aplicação é feita para o Android 16 (API 36: `compileSdkVersion` e
`targetSdkVersion` em `android/variables.gradle`), como a Play exige desde
31/08/2026, e ajusta a página às barras do sistema
(`android.adjustMarginsForEdgeToEdge: "auto"` no `capacitor.config.json`).

```sh
./gradlew bundleRelease     # sai em android/app/build/outputs/bundle/release/app-release.aab
```
