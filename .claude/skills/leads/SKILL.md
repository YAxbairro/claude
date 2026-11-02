---
name: leads
description: Enche o pipeline. Corre o cacador-leads para encontrar N leads novos (por defeito 30) numa linha de negócio e depois o copywriter para escrever as mensagens prontas a enviar. Uso - /leads [artistas|marcas|web|cv] [quantidade]
---
# /leads [linha] [quantidade]

Argumentos: `$ARGUMENTS` (por defeito: artistas, 30).

1. Lança o sub-agente **cacador-leads** com a linha e a quantidade pedidas.
2. Quando terminar, lança o **copywriter** só para os leads novos (estado `novo`).
3. Muda esses leads para o estado `pronto-a-enviar` (fica na coluna `notas` como `[msg em envios/AAAA-MM-DD.md]`).
4. Commit + push.
5. Diz ao Yax: quantos leads, os 3 melhores e o caminho do ficheiro com as mensagens prontas.
