#!/bin/sh
# Banco de ensaio do EnvioNativo.java, fora do Android: uma base de
# mentira (servidor HTTP local) e posições de GPS entregues como o
# serviço as entrega. Precisa de Java 17+ e da biblioteca org.json.
set -e
cd "$(dirname "$0")"
mkdir -p lib out
[ -f lib/json.jar ] || curl -sSL -o lib/json.jar \
  https://repo.maven.apache.org/maven2/org/json/json/20240303/json-20240303.jar
javac -nowarn -d out -cp lib/json.jar $(find stubs -name '*.java') \
  ../android/app/src/main/java/cv/fleetcv/condutor/EnvioNativo.java \
  teste/cv/fleetcv/condutor/Banco.java
java -cp out:lib/json.jar cv.fleetcv.condutor.Banco
