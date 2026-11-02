---
name: biblia
description: Constrói a "bíblia" de um videoclipe ou filme IA - premissa, tom, era, lugares, personagens com traços fixos (cara, roupa, movimento), regras de produção. Usar no início de cada projeto de vídeo IA, ou quando o Yax diz "bíblia", "lock das personagens", "começar videoclipe".
---
# /biblia: a bíblia do projeto

Objetivo: um único ficheiro `negocio/clientes/<slug>/biblia.md` que **todas** as outras skills (elenco, cenario, planos) leem antes de escrever qualquer prompt. Assim o Claude nunca inventa personagens ou lugares diferentes.

## Entrevista (curta: o Yax tem pouco tempo)
Pergunta só o que não estiver já no roteiro/brief:
1. Título, música (duração), mensagem numa frase
2. Tom (ex.: drama social realista) e o que **nunca** fazer (ex.: glamorizar)
3. Lugares reais? → pedir fotos reais de referência
4. Personagens: idade, papel, marca visual fixa
5. Ferramentas: Gemini/Nano Banana Pro (imagem) · Kling ou Seedance (vídeo) · versão

## Estrutura do ficheiro
- **Premissa e tese** (2 linhas)
- **Tom e paleta** (frio/quente e quando), grão, lentes
- **Regras** (o que nunca aparece; palavras proibidas nos prompts)
- **Lugares**: nome → ficheiro de referência → descrição fixa (materiais, cores, luz)
- **Personagens**: nome → ficha → **traços fixos** (cara, cabelo, marcas, roupa por fase) → **movimento** (como anda, postura) → **imobilidade** (o que faz quando está parado) → versões (antes/depois)
- **Linha do tempo** da música com a fase de cada personagem
- **Registo de referências**: tag → ficheiro (ex.: `@mae` → `producao/personagens/mae-base.jpg`)
