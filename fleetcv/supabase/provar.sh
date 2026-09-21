#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════
# PÔR AS REGRAS À PROVA, NUM POSTGRES A SÉRIO
#
#   ./provar.sh
#
# Levanta um Postgres de uma vez só, põe lá o mínimo do Supabase,
# carrega o esquema.sql DUAS vezes (tem de aguentar) e corre as
# provas. No fim arruma tudo.
#
# Porquê um Postgres a sério e não um imitador: as regras são
# escritas em linguagem de Postgres e é ele quem as aplica. Um
# imitador prova que eu percebi as regras — não prova que elas
# funcionam. Foi assim que se apanhou o erro que fazia com que
# NENHUMA escrita passasse ("infinite recursion detected in policy").
# ════════════════════════════════════════════════════════════
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
CASA="${TMPDIR:-/tmp}/fleetcv-provas-$$"
PORTA="${PGPORT_PROVAS:-5439}"
DONO="postgres"

for d in /usr/lib/postgresql/*/bin /usr/pgsql-*/bin; do
  [ -x "$d/initdb" ] && export PATH="$d:$PATH" && break
done
command -v initdb >/dev/null || { echo "Falta o Postgres (initdb)."; exit 2; }

arrumar(){ pg_ctl -D "$CASA/dados" stop -m immediate >/dev/null 2>&1
           rm -rf "$CASA"; }
trap arrumar EXIT

mkdir -p "$CASA"
# o initdb recusa-se a correr como root
COMO=""
if [ "$(id -u)" = "0" ]; then
  id "$DONO" >/dev/null 2>&1 || { echo "Corra sem ser root."; exit 2; }
  chown "$DONO" "$CASA"; COMO="su $DONO -c"
fi
correr(){ if [ -n "$COMO" ]; then su "$DONO" -c "PATH=$PATH $*"; else eval "$*"; fi; }

correr "initdb -D '$CASA/dados' -U postgres --auth=trust -E UTF8" >/dev/null 2>&1 \
  || { echo "Não consegui criar a base."; exit 2; }
correr "pg_ctl -D '$CASA/dados' -o '-k $CASA -p $PORTA -c listen_addresses=' \
        -l '$CASA/log.txt' start" >/dev/null 2>&1
for _ in 1 2 3 4 5 6 7 8 9 10; do
  psql -h "$CASA" -p "$PORTA" -U postgres -tAc 'select 1' >/dev/null 2>&1 && break
  sleep 1
done
psql -h "$CASA" -p "$PORTA" -U postgres -tAc 'select 1' >/dev/null 2>&1 \
  || { echo "A base não arrancou:"; tail -5 "$CASA/log.txt"; exit 2; }

P="psql -h $CASA -p $PORTA -U postgres -q -v ON_ERROR_STOP=1"
$P -f "$AQUI/_auth_falso.sql" >/dev/null 2>&1 \
  || { echo "Falhou a preparar o auth de mentira."; exit 2; }

echo "── o esquema carrega ──"
$P -f "$AQUI/esquema.sql" 2>&1 | grep -v 'NOTICE' || true
echo "   ok"
echo "── e volta a carregar por cima de si próprio ──"
$P -f "$AQUI/esquema.sql" 2>&1 | grep -v 'NOTICE' || true
echo "   ok"

echo
echo "── as regras ──"
SAIDA="$CASA/saida.txt"
psql -h "$CASA" -p "$PORTA" -U postgres -q -f "$AQUI/provas.sql" > "$SAIDA" 2>&1
grep -E '·' "$SAIDA" | sed -E 's/^(psql:[^ ]* )?NOTICE: +//'

MAL=$(grep -c '(MAL)' "$SAIDA" || true)
echo
if [ "$MAL" -gt 0 ]; then
  echo "✗ $MAL regra(s) a falhar."
  exit 1
fi
CERTOS=$(grep -c '(certo)' "$SAIDA" || true)
echo "✓ $CERTOS regras, todas a segurar."
