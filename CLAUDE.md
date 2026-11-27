# Instruções permanentes do projeto

O utilizador é um cidadão de Cabo Verde. Escreve em português (às vezes kriolu) e quer respostas **curtas, diretas e assertivas**.

## Em cada pergunta
1. Procurar em todas as fontes possíveis: leis no Boletim Oficial (boe.incv.cv; ver `djobe/scripts/boe.py` e `get.sh`), sites oficiais (inps.cv, mf.gov.cv, governo.cv) e imprensa (Expresso das Ilhas, Inforpress, A Nação, etc.).
2. Responder só com o que tem fonte verificada; dizer claramente o que falta saber.
3. Guardar o resultado em `conhecimento/`:
   - uma ficha nova em `conhecimento/perguntas/AAAA-MM-DD-tema.md` (pergunta, resposta curta, lei com citação exata, factos com data, fontes, o que falta);
   - atualizar `conhecimento/fontes/indice.md`, `conhecimento/ideias-e-decisoes.md` (sugestões e decisões do utilizador) e `conhecimento/trabalho/registo.md`.
4. Se a pergunta trouxer uma lei nova, acrescentá-la ao Djobe (`djobe/scripts/build_kb.py`), com um caso em `djobe/tests/cases.json`; correr `node djobe/tests/retrieval.test.js`, `python3 djobe/scripts/sync_search.py` e republicar o artefacto.
5. Fazer commit e push no branch de trabalho.
