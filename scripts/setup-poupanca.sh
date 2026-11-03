#!/usr/bin/env sh
# Instala ferramentas de poupança de tokens para Claude Code (macOS / Linux / WSL)
set -e
if command -v brew >/dev/null 2>&1; then brew install rtk
else curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh; fi
rtk init -g
rtk gain
npx ccusage@latest daily
