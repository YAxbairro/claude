# Setup para Claude Code Local (Windows)

## Passo 1: Configurar MCP Playwright

Corre este comando no terminal:
```bash
npx @playwright/mcp@latest --headless
```

Ou adiciona ao ficheiro `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Passo 2: Cola o prompt abaixo no Claude Code
