#!/bin/bash
# Duplo clique para arrancar o ImoAuto (macOS e Linux).
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
    python3 arrancar.py
else
    echo
    echo "  ============================================================"
    echo "    Falta instalar o Python (e o robô precisa dele)"
    echo "  ============================================================"
    echo
    echo "    1. Vai a:  https://www.python.org/downloads/"
    echo "    2. Carrega no botão amarelo grande \"Download Python\""
    echo "    3. Abre o ficheiro descarregado e segue o instalador"
    echo "    4. Quando acabar, volta a abrir este ARRANCAR"
    echo
    echo "    É gratuito e demora dois minutos."
    echo
    read -n 1 -s -r -p "  Carrega numa tecla para fechar."
fi
