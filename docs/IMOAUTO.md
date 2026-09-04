# Robô ImoAuto

Robô de operações com subagentes especializados: encontra anúncios, conduz a
conversa com o proprietário, cria a publicação no site, gera o flyer e publica
nas redes — com um humano no ponto exato onde a lei o exige.

## O princípio de desenho

Há uma coisa que este sistema deliberadamente **não** faz: contactar
desconhecidos automaticamente. A Meta proíbe-o, e quem paga a fatura é a conta
Business do ImoAuto — o ativo de marketing mais caro que existe aqui.

A solução não é abdicar do objetivo, é mudar o ponto de entrada:

```
Subagentes vasculham   →   Telegram (a tua consola)   →   TU envias a 1ª mensagem
                                                                    ↓
publica nas redes  ←  cria listagem no site  ←  robô assume a conversa (WhatsApp)
```

Tu escreves uma frase. O robô faz o resto — e a partir daí é tudo automático e
tudo permitido, porque a conversa foi aberta por um humano.

Essa regra vive em `imoauto/compliance.py` e não é contornável: todos os envios
passam por lá. Os testes provam-no.

## Arquitetura

| Módulo | O que faz |
|---|---|
| `orquestrador.py` | O robô central. Recebe eventos, escolhe o subagente, executa. |
| `compliance.py` | O guarda. Decide se um envio é permitido. |
| `store.py` | SQLite: leads, conversas, listagens, publicações, registo. |
| `bot.py` | Consola no Telegram (long polling, sem servidor). |
| `webhook.py` | Recebe mensagens do WhatsApp e eventos do site. |
| `cli.py` | `bot`, `webhook`, `diagnostico`, `lead`. |

### Subagentes (`imoauto/agents/`)

| Subagente | Trabalho |
|---|---|
| **Aquisição** | Lê um anúncio, extrai dados, pontua 0-100 e rascunha a abordagem — para tu enviares. Nunca contacta. |
| **Vendas** | Assume a conversa no WhatsApp depois da resposta: explica, recolhe dados, pede fotos, escala para ti quando não sabe. |
| **Copy** | Títulos, descrições, legendas e hashtags em português de Portugal. |
| **SEO** | Title, meta description, slug, palavras-chave e schema.org. |
| **Design** | Escreve o briefing visual e manda gerar o flyer. |
| **Publicação** | Prepara os rascunhos e publica no Facebook/Instagram após o teu OK. |

Cada subagente tem um trabalho só e não chama os outros — quem coordena é o
orquestrador.

## Ciclo de vida de um lead

```
descoberto → enviado → contactado → respondeu → a_negociar → publicado
                ↑           ↑
         (Telegram)   (TU, na app WhatsApp)
```

## Instalação

```bash
pip install -r requirements.txt
cp .env.example .env      # preenche o .env
python -m imoauto.cli diagnostico
```

O diagnóstico diz-te exatamente o que falta. Só três coisas são essenciais para
arrancar: `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

### Arrancar

```bash
python -m imoauto.cli bot          # consola do Telegram
python -m imoauto.cli webhook      # servidor de webhooks (porta 8080)
```

O webhook precisa de HTTPS público. Em testes, um túnel resolve:

```bash
cloudflared tunnel --url http://localhost:8080
```

Depois, na Meta, aponta o webhook para `https://<túnel>/webhook/whatsapp` com o
mesmo `WHATSAPP_VERIFY_TOKEN` que puseste no `.env`.

## Modo simulação

`IMOAUTO_DRY_RUN=1` (por omissão) — o robô faz tudo, escreve tudo, regista tudo,
mas **nada sai para o mundo**. Cada envio aparece na consola com o prefixo
`[DRY_RUN ...]`. Corre assim uns dias, lê os rascunhos, e só depois passas a `0`.

Mesmo ao vivo, `IMOAUTO_APROVAR_POSTS=1` mantém a segunda tranca: nenhum post sai
sem tocares no botão do Telegram.

## Comandos do Telegram

| Comando | Faz |
|---|---|
| `/leads` | Leads por contactar, ordenados por nota. |
| `/lead <texto>` | Colas o texto de um anúncio, ele qualifica-o na hora. |
| `/estado` | Modo, configurações em falta, contagem de leads. |
| `/publicar <id>` | Força a publicação de um rascunho. |

Cada lead chega com botões: **Abrir WhatsApp** (leva-te à conversa com a
mensagem sugerida), **Já contactei**, **Descartar**.

## Testes

```bash
python test_imoauto.py
```

13 testes, sem chaves e sem rede. Cobrem a conformidade (contacto frio bloqueado,
janela de 24h, template fora da janela), o armazenamento, e o fluxo completo do
anúncio ao post pronto.

## WhatsApp: qual dos teus números

A Coexistence da Meta (disponível em todos os países desde maio de 2026) liga a
API ao mesmo número que usas na app — histórico sincronizado, sem segundo número.
Exige que esse número esteja na app **WhatsApp Business**, não na app pessoal.
É o número que quase não usas que deve ir para aqui.

## O que ainda é manual, e porquê

A varredura ampla e contínua de Marketplace, grupos e Instagram não tem API
oficial. `POST /webhook/lead` e `/lead <texto>` aceitam anúncios de qualquer
origem — colas o texto, o subagente qualifica. Scraping em escala é frágil e
bloqueado ativamente; não vale o risco de queimar a conta.

## Estado

Fase 1 completa e testada. O que falta ligar são credenciais, não código:
tokens da Meta, token de admin do site, e os endpoints reais do ImoAuto em
`clients/site.py` (três constantes no topo do ficheiro).
