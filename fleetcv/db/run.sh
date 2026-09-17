#!/usr/bin/env bash
# FleetCV · Fase 1 — recria a base de dados do zero e corre os cenários.
#
#   ./fleetcv/db/run.sh
#
# Precisa de um PostgreSQL 14+ acessível (variáveis PG* normais do psql).
set -euo pipefail

BD="${FLEETCV_BD:-fleetcv}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PGOPTIONS='--client-min-messages=warning'

echo "→ a recriar a base de dados '$BD'"
dropdb --if-exists "$BD"
createdb "$BD"

echo "→ migrações"
for f in "$DIR"/migrations/*.sql; do
  printf '   %s\n' "$(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -d "$BD" -f "$f"
done

echo "→ dados de partida"
for f in "$DIR"/seed/*.sql; do
  printf '   %s\n' "$(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -d "$BD" -f "$f"
done

echo "→ utilitários de teste"
psql -q -v ON_ERROR_STOP=1 -d "$BD" -f "$DIR/tests/000_utilitarios.sql"

echo "→ cenários"
psql -q -v ON_ERROR_STOP=1 -d "$BD" -f "$DIR/tests/010_cenarios.sql"
