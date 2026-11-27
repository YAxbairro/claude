# Djobe

Chat que explica as leis e a informação oficial de Cabo Verde em linguagem simples, sempre com a fonte (lei e artigo).

## Como funciona
- `data/docs.json`: as leis e documentos carregados (31).
- `data/chunks.json`: o texto dividido artigo a artigo (~3.700 partes).
- `search.js`: pesquisa (BM25) que encontra os artigos relevantes. É copiada para dentro de `index.html` com `python3 build/sync_search.py`.
- `index.html`: o chat. O Claude usa a ferramenta `pesquisar_leis` para procurar os artigos antes de responder e cita cada facto com o código do artigo.

## Testes
`node tests/retrieval.test.js` verifica, para 18 perguntas reais (`tests/cases.json`), se o artigo certo aparece nos resultados. Cada caso tem a resposta certa confirmada no texto da lei.

## Atualizar as leis
Os scripts em `build/` descarregam os atos do Boletim Oficial (boe.incv.cv), extraem o texto coluna a coluna e cortam cada ato. Os PDFs não estão no repositório.

## Lacunas conhecidas
- Código Civil, Código de Processo Civil e Código da Estrada original (2005) ainda não estão carregados.
- O Código Laboral é a versão de 2007 mais a alteração de 2016; podem existir alterações posteriores.
- O IRPS e o IVA são as versões originais (2014 e 2003); os Orçamentos do Estado podem ter mudado taxas.
