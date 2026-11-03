# Instala ferramentas de poupança de tokens para Claude Code (Windows / PowerShell)
# 1) RTK: comprime o output dos comandos antes de chegar ao Claude (60-90% menos tokens no Bash)
winget install rtk-ai.rtk
rtk init -g          # instala o hook PreToolUse no Claude Code
rtk gain             # confirma que funciona (mostra estatísticas)
# 2) ccusage: mostra quanto gastas por dia/sessão (para medir a poupança)
npx ccusage@latest daily
