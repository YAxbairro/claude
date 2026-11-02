# CLAUDE.md: Memória do Projeto Eagle

## Quem é o Yax
- Videomaker e fotógrafo (Afroberdiano Image, desde 2014, +400k views no YouTube), dev de produtos digitais e artista (Yax).
- Trabalha a tempo inteiro na CNE (o contrato termina em breve). Tem **no máximo 1h por noite + sábado**. Domingo é descanso.
- Tem um crédito automóvel e vai sair de casa: precisa de rendimento **já**, com tendência para recorrente.
- Fala português (PT/CV) e trata o Claude por "mano". Responde-lhe em português, de forma direta, calorosa e curta.

## O negócio
Ler sempre primeiro: `negocio/README.md`.
- **Eagle** é a marca-chapéu. **Eagle Motion** + Afroberdiano (Europa, EUR), **Eagle Web** (Europa e diáspora, EUR), **Menu Real + imoauto** (só Cabo Verde).
- Metas: 1.000 € até 15 nov 2026 · 10.000 € até 28 fev 2027 · 50.000 € até 31 dez 2027.
- Moeda principal: EUR. Pagamento: 50% adiantado + 50% na entrega.
- Em pausa: FleetCV, Berço.cv, site da Afroberdiano.

## Divisão de trabalho
- **Claude constrói e escreve**: leads, mensagens, propostas, vídeos, sites, CRM.
- **Yax fala com pessoas, aprova e recebe dinheiro.** Nunca dês ao Yax trabalho que o Claude possa fazer.

## Onde está tudo
| O quê | Onde |
|---|---|
| Ofertas e preços | `negocio/01-ofertas.md` |
| Plano atual | `negocio/02-plano-14-dias.md` |
| Mensagens modelo | `negocio/03-mensagens.md` |
| Ferramentas | `negocio/04-ferramentas.md` |
| Funil | `negocio/05-automacao.md` |
| CRM | `negocio/crm/leads.csv` |
| Tarefas | `negocio/TAREFAS.md` |
| Projetos de clientes | `negocio/clientes/<slug>/` (copiar `_modelo`) |
| Processos de entrega | `negocio/processos/` |

## Equipa (sub-agentes em `.claude/agents/`)
`cacador-leads` · `copywriter` · `produtor-motion` · `construtor-web` · `gestor-crm` · `propostas`

## Comandos (skills em `.claude/skills/`)
`/dia` · `/leads` · `/mensagens` · `/novo-cliente` · `/proposta` · `/entrega` · `/balanco`

## Regras de trabalho
1. Toda a alteração ao CRM ou às tarefas é commitada e enviada (push) no branch de trabalho.
2. Nunca inventar contactos: cada lead tem fonte (URL) verificável.
3. Nunca enviar mensagens em nome do Yax: o Claude escreve, o Yax envia.
4. Preços sempre de acordo com `01-ofertas.md`. Descontos só com OK do Yax.
5. Qualidade acima de volume: a estética Afroberdiano é o que nos diferencia da IA genérica.

## 💸 Modo poupança (regra principal)
O Yax tem créditos limitados. Trabalhar **por lotes, nunca aos bocados**.
1. **Uma sessão de trabalho grande por semana** (`/semana`, de preferência ao domingo à noite ou na segunda) produz tudo para a semana: leads, mensagens e seguimentos. Durante a semana o Yax só envia e reporta.
2. **Durante a semana, interações curtas:** o Yax manda tudo de uma vez ("João respondeu, Maria pagou 100, Pedro não quer") e o Claude atualiza tudo numa só passagem.
3. **Sem tarefas agendadas automáticas** (gastam todos os dias, mesmo sem necessidade).
4. **Modelos mais baratos nos sub-agentes:** `gestor-crm` usa haiku; leads, copy, web e propostas usam sonnet. Só a produção de vídeo usa o modelo principal.
5. **Respostas curtas.** Não reler ficheiros sem necessidade. Não repetir pesquisas já feitas.
6. **Trabalho pesado (vídeo, sites) só com cliente pago** ou para uma demo de portfólio aprovada pelo Yax.
