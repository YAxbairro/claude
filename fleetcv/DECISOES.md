# Decisões em aberto e pressupostos assumidos

As perguntas da secção 19 do SPEC ainda não têm resposta. Para não parar o trabalho,
cada uma tem um **pressuposto** assumido, escolhido para ser o mais conservador possível.

> Quando houver resposta, muda-se aqui e no SPEC. O que está no código é sempre
> configurável, precisamente para que a resposta não obrigue a reescrever nada.

| # | Pergunta | Pressuposto assumido | O que muda se a resposta for outra |
|---|---|---|---|
| **D01** | De quem é o telemóvel? | **Do motorista**, e ele paga os próprios dados | É por isso que a app gasta menos de 1 MB por turno e que o GPS só grava dentro do turno. Se os telemóveis forem da empresa, podemos ser mais agressivos na amostragem e ganhar precisão |
| **D02** | Há abastecimento informal, sem talão? | **Raro.** Sem talão, o abastecimento entra como não-provado (A11, aviso) — não bloqueia | Se for comum, A11 passa a informativo e cria-se um tipo "compra sem talão" que não penaliza o score |
| **D03** | Um táxi tem um motorista ou dois turnos? | **Um motorista por carro, um turno por dia** | O modelo já suporta vários turnos por dia; muda só a leitura dos relatórios |
| **D04** | Quantos km faz um táxi por dia na Praia? | **150 km**, com limite plausível de 500 | O limite de 500 km está em `km_max_turno` e muda-se numa linha |
| **D05** | O score é visível ao motorista desde o início? | **Sim**, com 14 dias de adaptação sem penalizações | `adaptacao_dias` na configuração |
| **D06** | Preço actual do combustível e onde a ARME o publica? | **145,00 CVE/litro** (gasolina) e 125,00 (gasóleo), inseridos à mão | Se a ARME publicar em página fixa, automatiza-se a actualização mensal |
| **D07** | Há um proprietário para o piloto? | **Ainda não.** É a peça mais importante e não se resolve com código | Sem isto, as fases 2 e 3 constroem-se às cegas |

## O que fica a faltar se D07 não se resolver

As fases 1 a 3 produzem um sistema tecnicamente correcto e sem valor comprovado. Só o
piloto com um carro real responde às perguntas que nenhum teste responde:

- A bateria aguenta um turno de 10 horas num telemóvel de 5 anos?
- O motorista tira as fotos todos os dias, ou desiste à terceira?
- Quantos alertas por semana é que o dono aguenta antes de deixar de olhar?
- Os limites (15%, 25%, 3 km, 20 min) estão certos para a Praia?

**Nenhuma destas se responde a escrever código.**
