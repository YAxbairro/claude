---
name: elenco
description: Cria personagens consistentes para vídeo IA (face lock, roupa, ficha de personagem) e escreve os prompts de imagem para Nano Banana Pro (Gemini) ou Seedream. Usar para criar, alterar ou fichar uma personagem.
---
# /elenco: personagens consistentes

Ler sempre primeiro a `biblia.md` do projeto. Fluxo por **estações, nunca saltar**:

1. **Face lock**: retrato do peito para cima, de frente, **fundo cinzento neutro 18%, luz sem sombras** (nada de luz "cozida" que passa para as cenas). Fotorrealista, textura de pele real.
2. **Adições**: cabelo, cicatrizes, sinais, expressões. Sempre a partir do face lock aprovado.
3. **Roupa**: primeiro proposta em texto → OK do Yax → imagem de corpo inteiro com o face lock como referência.
4. **Ficha**: 3 painéis por defeito (frente sem cabeça cortada, costas, cara de perto), tudo de frente, mesmo fundo.
5. **Versões** (ex.: "depois"): partir **da ficha original**, nunca de outra versão (evita desvio do tom de pele).

## Regras aprendidas
- Repetir sempre na prompt os **traços fixos** escritos na bíblia (ex.: "same small mole on left cheek").
- Figurantes: escrever etnia e tom de pele explicitamente.
- Nunca palavras como "drug/addiction": descrever só o aspeto físico.
- Saída de cada pedido: (1) lista numerada das referências a anexar e por que ordem, (2) a prompt num bloco de código pronto a colar.
