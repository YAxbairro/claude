#!/bin/sh
# Pôr o FleetCV a trabalhar. Só precisa de ter o Node instalado
# (versão 22 ou mais recente).
#
#   ./arrancar.sh
#
# Para mudar a conta do proprietário antes da primeira vez:
#
#   FLEETCV_DONO_EMAIL=eu@aminhaempresa.cv \
#   FLEETCV_DONO_CODIGO=4721 ./arrancar.sh
#
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Falta o Node. Instale-o em https://nodejs.org (versão 22 ou mais recente)."
  exit 1
fi
V=$(node -p "process.versions.node.split('.')[0]")
if [ "$V" -lt 22 ]; then
  echo "O Node instalado é a versão $V. É precisa a 22 ou mais recente."
  exit 1
fi

export NODE_NO_WARNINGS=1
exec node servidor.mjs
