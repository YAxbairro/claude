# FleetCV — Especificação Funcional e Técnica

**Versão:** 0.1 (rascunho para revisão)
**Contexto:** Cabo Verde · frotas de 6–20 viaturas · primeiro mercado: **táxis**
**Estado:** em discussão. Nada aqui é definitivo até ser validado com um proprietário real.

> Este documento é a **fonte da verdade** do projecto. Qualquer código escrito tem de
> corresponder ao que está aqui. Se a realidade contrariar o documento, muda-se o
> documento primeiro e só depois o código.

---

## 1. O problema, numa frase

O proprietário de táxis não consegue provar **onde o carro andou** nem **quanto gastou
realmente em combustível**. O motorista declara no fim do dia — "usei 2.000 de
combustível" — e esse número não tem prova nenhuma por trás.

### 1.1 Como funciona hoje (o fluxo real)

1. O motorista entra ao serviço e leva o carro.
2. Trabalha com o carro o turno inteiro.
3. A meio do dia tira dinheiro do caixa das corridas e abastece.
4. No fim do dia acerta contas: entrega o dinheiro e **declara** o que gastou em combustível.

### 1.2 Onde o dinheiro se perde

| Fuga | Como acontece | Quanto pesa |
|---|---|---|
| Valor de combustível inflacionado | Gastou 1.250, declara 2.000 | Alto, diário, difícil de provar |
| Combustível desviado | Abastece 40L, mete 25 no carro e 15 num bidão | Alto, invisível ao dia |
| Uso do carro fora de turno | Carro usado à noite ou ao fim-de-semana | Desgaste + combustível |
| Desvio de percurso | Serviços particulares durante o turno | Combustível + tempo |

### 1.3 O que a app faz

**Substitui a declaração por prova.** O motorista deixa de dizer quanto gastou: regista
cada abastecimento no momento, no posto, com foto e GPS. Ao fechar o turno, o total já
está feito — **a app diz o número, não ele**.

### 1.4 O que a app NÃO faz (v1)

- Não controla corridas, facturação nem receita do motorista.
- Não controla o caixa entregue ao dono.
- Não trata de manutenção, seguros nem multas.
- Não é um taxímetro nem uma app de despacho de corridas.

O dinheiro das corridas fica de fora **por decisão do cliente**. A app só toca em dinheiro
no ponto onde ele sai do bolso do dono: o combustível.

---

## 2. Princípios de desenho

Estes princípios decidem qualquer dúvida futura. Por ordem de importância:

1. **Prova, não declaração.** Nenhum número entra no sistema sem foto, GPS e hora
   carimbados no momento em que acontece.
2. **Nada se apaga, nada se edita.** Turnos fechados são imutáveis. Correcções entram como
   registos novos, com autor e justificação. O histórico é o produto.
3. **Medir em vez de bloquear.** A app não consegue obrigar o motorista a nada. Consegue
   tornar cada omissão visível e permanente. A regra disciplinar é do patrão; a app só
   entrega a prova.
4. **Privacidade fora do turno é inegociável.** Turno fechado = zero pontos de GPS
   gravados. Sem isto o motorista boicota a app e o sistema morre na primeira semana.
5. **Funciona sem rede.** O telemóvel grava tudo localmente e sincroniza quando puder.
   Ficar sem rede nunca pode impedir um motorista de trabalhar.
6. **Poucos alertas.** Um dono que recebe 30 notificações por dia desliga-as ao terceiro
   dia. Só o que exige acção humana chega ao telemóvel.
7. **Nunca confiar no telemóvel.** Relógio, GPS e fotos do lado do cliente podem ser
   manipulados. O servidor valida tudo o que consegue validar.

---

## 3. Utilizadores e papéis

| Papel | Quem é | O que pode fazer |
|---|---|---|
| **Proprietário** | Dono da frota | Tudo dentro da sua organização: carros, motoristas, definições, relatórios |
| **Gestor** | Pessoa de confiança do dono | Igual ao proprietário, excepto apagar a organização e gerir subscrição |
| **Motorista** | Quem conduz | Abrir/fechar o seu turno, registar abastecimentos, ver o seu histórico e o seu score |
| **Auditor** *(v2)* | Contabilista externo | Leitura apenas, sem localização em tempo real |

**Regra dura:** um motorista nunca vê dados de outro motorista, nem o mapa da frota.

---

## 4. Modelo de domínio

Cinco objectos centrais. Tudo o resto orbita à volta destes.

```
Organização
  ├── Carro ──────────────┐
  ├── Motorista ──────────┤
  │                       ▼
  └──────────────────► Turno ──┬──► Ponto GPS  (só dentro do turno)
                               ├──► Abastecimento ──► Foto do talão
                               ├──► Foto do quadrante (abertura e fecho)
                               └──► Alertas
```

### 4.1 Turno — a espinha dorsal

Um turno é **um motorista, um carro, um período contínuo**. Tudo pendura aqui: sem turno
aberto não se grava GPS nem se regista abastecimento.

**Regras duras:**

- Um carro só pode ter **um turno aberto** de cada vez.
- Um motorista só pode ter **um turno aberto** de cada vez.
- Um turno fechado é **imutável**. Nem o proprietário o pode editar.

### 4.2 Máquina de estados do turno

```
                  ┌──────────────────────────────────────┐
                  ▼                                      │
   [ABERTO] ──► [FECHADO]                                │
      │                                                  │
      ├──► [FECHADO_AUTOMATICO]   (16h sem fechar)       │
      ├──► [FECHADO_PELO_GESTOR]  (telemóvel morreu)     │
      └──► [ANULADO]              (aberto por engano,    │
                                   < 5 min, < 1 km) ─────┘
```

| Estado | Como se chega | Consequência |
|---|---|---|
| `ABERTO` | Motorista abre com foto do quadrante | GPS a gravar |
| `FECHADO` | Motorista fecha com foto do quadrante | Normal. Todas as contas correm |
| `FECHADO_AUTOMATICO` | 16h sem fecho, ou 3h sem movimento e sem sinal | Sem km final nem foto → alerta e penalização no score |
| `FECHADO_PELO_GESTOR` | Gestor fecha à mão (telemóvel morreu/partiu) | Km final declarado pelo gestor, marcado como não-provado |
| `ANULADO` | Abertura por engano, anulada nos primeiros 5 min e com menos de 1 km | Não conta para nada, mas fica no histórico |

**Porque é que o auto-fecho existe:** se um turno ficar aberto para sempre, o GPS grava a
noite toda (viola o princípio 4) e a contabilidade de km do carro fica bloqueada. O
auto-fecho protege o motorista *e* os dados.

### 4.3 Carro

Campos que importam para a lógica:

- Matrícula, marca/modelo, ano
- **Capacidade do depósito (litros)** → serve para detectar litros impossíveis
- **Tipo de combustível** (gasolina / gasóleo) → serve para escolher o preço certo
- **Consumo de referência (L/100km)** → valor inicial do fabricante, substituído pela
  média real do carro assim que houver histórico
- **Km actual** → sempre o km do último fecho de turno
- **Estado**: `activo` · `indisponível` (oficina, parado) · `vendido`

> O estado `indisponível` é importante: um carro na oficina anda km sem turno (o mecânico
> testa). Sem este estado, isso gerava um alerta falso de "uso fora de turno" e o dono
> começava a ignorar os alertas.

### 4.4 Abastecimento

- Data/hora, turno, carro, motorista
- **Valor pago (CVE)** — o número que o motorista declara
- **Litros** — calculados a partir do valor e do preço oficial em vigor
- Posto (da lista, ou GPS + nome escrito à mão)
- Foto do talão (obrigatória) · foto da bomba (opcional)
- Posição GPS no momento do registo
- Leitura do OCR guardada **em separado** do valor confirmado pelo motorista

### 4.5 Ponto de GPS

Só existe dentro de um turno aberto. Cada ponto guarda:

- Coordenadas, precisão (metros), velocidade, altitude
- `capturado_em` (hora do telemóvel) e `recebido_em` (hora do servidor)
- **`mock` (booleano)** — se o Android indicou localização falsa
- `bateria` (%) — ajuda a distinguir "telemóvel morreu" de "motorista desligou"

---

## 5. Regras de negócio

Numeradas para poderem ser testadas uma a uma. **Cada regra tem de ter um teste
automático.** Os valores entre parêntesis são configuráveis por organização.

### 5.1 Abertura de turno

| # | Regra |
|---|---|
| **R01** | Foto do quadrante obrigatória, tirada **ao vivo** pela câmara. Galeria bloqueada. |
| **R02** | O OCR propõe o km; o motorista confirma ou corrige. Guardam-se os dois valores. |
| **R03** | Km de abertura **nunca** pode ser inferior ao km do último fecho daquele carro. |
| **R04** | Se km de abertura > último fecho + tolerância (3 km) → **gap de quilometragem** (ver R14). |
| **R05** | Não abre turno se o carro já tiver turno aberto, ou estiver `indisponível`. |
| **R06** | Se o GPS estiver desligado, a app pede para ligar. Se recusar, o turno abre na mesma, mas marcado `sem_gps_desde_o_inicio`. |

### 5.2 Durante o turno

| # | Regra |
|---|---|
| **R07** | GPS amostrado a cada **10s em movimento** e **60s parado**; envio em lote a cada **90s**. |
| **R08** | Sem rede, os pontos ficam no telemóvel e sincronizam depois. Nunca se perdem. |
| **R09** | Mais de **15 min** sem qualquer ponto de GPS com turno aberto → alerta. |
| **R10** | Qualquer ponto com `mock = true` → alerta **crítico** imediato. Localização falsa é acto deliberado, não é engano. |
| **R11** | Paragem de mais de **20 min** fora das zonas conhecidas → alerta informativo. |
| **R12** | Relógio adulterado, detectado por duas vias independentes: **(a)** o telemóvel mede o seu próprio desvio contra o servidor em cada sincronização e reporta-o — acima de **5 min** é alerta; **(b)** dentro de um mesmo lote, a diferença entre horas de sistema tem de bater com o contador monotónico do Android (que não se pode alterar) — mais de **60 s** de discrepância significa que alguém mexeu no relógio a meio do turno. |
| *(nota)* | Comparar a hora do telemóvel com a hora do servidor **não serve**: em modo offline o atraso é legítimo e diário. Seria o alerta falso mais comum de todos. |

### 5.3 Fecho de turno

| # | Regra |
|---|---|
| **R13** | Foto do quadrante obrigatória, ao vivo. Km final ≥ km inicial. |
| **R14** | `km_percorridos = km_final − km_inicial`. Fora do intervalo plausível (0–500 km) → bloqueia e pede reconfirmação da foto. |
| **R15** | Compara-se `km_percorridos` (quadrante) com `km_gps` (soma do rasto). O GPS costuma ficar **3 a 8% abaixo** — é normal, perde sinal. |
| **R16** | A divergência mede-se sobre o quadrante — o número declarado: `(km_quadrante − km_gps) ÷ km_quadrante`. A partir de **15%** → aviso; a partir de **25%** → crítico: andou sem GPS. |
| **R17** | Se `km_gps > km_quadrante + 10%` → o quadrante está errado ou foi adulterado. Alerta crítico. |
| **R18** | O total de combustível do turno é **calculado pela app**, nunca escrito pelo motorista. |

### 5.4 Combustível

| # | Regra |
|---|---|
| **R19** | Abastecimento só se regista **dentro de um turno aberto**. Fora disso, só o gestor o pode lançar à mão. |
| **R20** | Foto do talão obrigatória, ao vivo. Sem foto, o abastecimento entra como `não provado` e penaliza o score. |
| **R21** | `litros = valor_pago ÷ preço_oficial_em_vigor(mês, ilha, tipo de combustível)`. |
| **R22** | Se o OCR também ler os litros no talão e divergirem mais de **3%** do calculado → talão inconsistente, alerta. |
| **R23** | `litros > capacidade_do_depósito × 1,05` → **impossível**. Alerta crítico. Não cabe no carro. |
| **R24** | **A verificação mais forte:** o rasto de GPS tem de mostrar uma paragem naquele posto, àquela hora (raio de 150 m, ±10 min). Não mostra → alerta crítico: talão de outro carro. |
| **R25** | O mesmo talão (mesmo posto + valor + hora) não passa duas vezes. Duplicado → alerta crítico. |
| **R26** | A foto é identificada por hash. Foto já usada antes → alerta crítico. |

### 5.5 Consumo — a rede de segurança lenta

Esta é a única defesa contra o desvio para bidão. Nenhuma foto o apanha; só os números ao
longo do tempo.

| # | Regra |
|---|---|
| **R27** | Consumo **não** se calcula turno a turno (os abastecimentos são parciais, o depósito nunca está no mesmo nível). Calcula-se por **janela acumulada**: `soma(litros) ÷ soma(km) × 100`, sobre os últimos **3 abastecimentos** ou **500 km**. |
| **R28** | A referência de cada carro é a **média móvel dos últimos 90 dias** desse carro, não um valor de catálogo. Cada carro tem o seu consumo, e um carro velho bebe mais — isso não é fraude. |
| **R29** | São precisos pelo menos **5 abastecimentos** de histórico antes de gerar qualquer alerta de consumo. Antes disso, o sistema está a aprender e cala-se. |
| **R30** | Consumo da janela **25% acima** da referência do carro → alerta. |
| **R31** | Subida sustentada acima de **10%** durante 3 janelas seguidas → alerta de tendência. É este que apanha o sifão lento, o que nunca dispara um alerta isolado. |

### 5.6 Uso fora de turno

| # | Regra |
|---|---|
| **R32** | A cada abertura de turno: `gap = km_abertura − km_do_último_fecho`. |
| **R33** | `gap > 3 km` com o carro `activo` → alerta **crítico**: o carro andou sem turno. Regista-se quem fechou o turno anterior e quem abriu este. |
| **R34** | Carro `indisponível` no intervalo → sem alerta, mas o gap fica registado no histórico do carro. |

> **Porque é que a R33 é a regra mais valiosa de todas:** não precisa de GPS, não precisa
> de rede, não precisa da colaboração de ninguém. Mesmo que o motorista nunca abra a app
> durante um uso indevido, o buraco aparece no quadrante no dia seguinte. É a única regra
> que funciona contra alguém que simplesmente ignora o sistema.

---

## 6. Motor de alertas

### 6.1 Severidades

| Nível | Significado | Vai a push? |
|---|---|---|
| 🔴 **Crítico** | Indício directo de fraude ou impossibilidade física | Sim, imediato |
| 🟡 **Aviso** | Anomalia que precisa de explicação | Só no resumo diário |
| 🔵 **Info** | Bom saber, sem acção | Não, só no painel |

### 6.2 Catálogo completo

| Código | Alerta | Regra | Nível |
|---|---|---|---|
| `A01` | Turno aberto | — | 🔵 |
| `A02` | Turno fechado com resumo | — | 🔵 |
| `A03` | Sem sinal de GPS há mais de 15 min | R09 | 🟡 |
| `A04` | **Localização falsa detectada** | R10 | 🔴 |
| `A05` | Paragem longa fora de zona conhecida | R11 | 🔵 |
| `A06` | Relógio do telemóvel adulterado | R12 | 🔴 |
| `A07` | Km do quadrante e do GPS não batem | R16 | 🟡 |
| `A08` | Quadrante muito à frente do GPS (>25%) | R16 | 🔴 |
| `A09` | GPS à frente do quadrante | R17 | 🔴 |
| `A10` | Abastecimento registado | — | 🔵 |
| `A11` | Abastecimento sem talão | R20 | 🟡 |
| `A12` | Litros do talão não batem com o valor | R22 | 🟡 |
| `A13` | **Litros não cabem no depósito** | R23 | 🔴 |
| `A14` | **Carro não estava no posto à hora do talão** | R24 | 🔴 |
| `A15` | **Talão duplicado** | R25 | 🔴 |
| `A16` | **Foto reutilizada** | R26 | 🔴 |
| `A17` | Consumo acima do normal | R30 | 🟡 |
| `A18` | Consumo a subir há 3 janelas | R31 | 🟡 |
| `A19` | **Carro andou fora de turno** | R33 | 🔴 |
| `A20` | Turno fechado automaticamente | R— | 🟡 |
| `A21` | Turno fechado pelo gestor | R— | 🟡 |

### 6.3 Regras anti-ruído

- **Agrupamento:** o mesmo alerta, no mesmo turno, agrupa-se num só. Não chegam 4 pushes
  de "sem GPS" no mesmo turno.
- **Silêncio nocturno:** alertas 🟡 entre as 22h e as 7h ficam para o resumo da manhã.
  Os 🔴 passam sempre.
- **Resumo diário:** uma notificação por dia, a uma hora escolhida pelo dono, com tudo o
  que não foi crítico.
- **Fecho de alerta:** todo o alerta 🔴 tem de ser fechado por uma pessoa, com uma de três
  respostas: *justificado* · *confirmado como desvio* · *erro do sistema*. A terceira
  resposta é a que nos diz que a regra está mal calibrada.

> A última é a mais importante para o projecto: se num piloto de duas semanas muitos
> alertas forem marcados como "erro do sistema", é sinal de que os limites estão apertados
> de mais e o dono vai deixar de olhar para a app.

---

## 7. Anti-fraude: cada ataque e a sua resposta

Tabela de ataque/defesa. Se alguém propuser mudar uma regra, é aqui que se vê o que se
perde.

| # | Como se rouba | O que o apanha | Fica tapado? |
|---|---|---|---|
| 1 | Declarar 2.000 tendo gasto 1.250 | Foto do talão + OCR + preço oficial (R21) | ✅ Sim |
| 2 | Fotografar o talão de outra pessoa | O rasto de GPS não mostra o carro no posto (R24) | ✅ Sim |
| 3 | Usar o mesmo talão duas vezes | Talão e foto identificados por hash (R25, R26) | ✅ Sim |
| 4 | Fotografar uma foto antiga do quadrante | Câmara ao vivo, galeria bloqueada, carimbo de hora e GPS | 🟡 Quase |
| 5 | Desligar o GPS a meio do turno | Contabiliza-se o tempo sem sinal (R09) + os km aparecem no quadrante (R15) | ✅ Sim |
| 6 | App de GPS falso | Android denuncia `mock` (R10) | ✅ Sim |
| 7 | Atrasar o relógio do telemóvel | Comparação com a hora do servidor (R12) | ✅ Sim |
| 8 | Não abrir a app nesse dia | O buraco de km aparece no turno seguinte (R33) | ✅ Sim |
| 9 | Abastecer 40L e meter 25 no carro | Nada imediato. Só a média de consumo ao longo de semanas (R27–R31) | 🟡 Lento |
| 10 | Adulterar fisicamente o quadrante | A app não apanha. Mas passa a exigir mexer no carro — outro nível de risco para ele | ❌ Não |
| 11 | Dar o telemóvel a outra pessoa | A app não apanha. *(v2: foto do motorista à abertura)* | ❌ Não |

**O ponto que importa perceber:** a app não torna a fraude impossível. Torna-a **cara e
arriscada**. Para desviar 800 escudos, o motorista passa a ter de estar fisicamente no
posto, abastecer a sério, e falsificar papel à frente da câmara — arriscando o emprego. A
maior parte das pessoas desiste muito antes disso.

---

## 8. Score de confiança

Um número de 0 a 100 por motorista, calculado sobre os **últimos 30 dias**. Serve para o
dono olhar para uma lista e saber com quem tem de falar.

**Começa em 100. Penalizações por turno:**

| Situação | Penalização |
|---|---|
| Localização falsa (A04) | −50 |
| Relógio adulterado (A06) | −40 |
| Carro andou fora de turno (A19) | −30 |
| Talão duplicado ou foto reutilizada (A15, A16) | −30 |
| Carro não estava no posto (A14) | −30 |
| Litros impossíveis (A13) | −25 |
| Valor declarado acima do talão (A12) | −25 |
| Divergência de km acima de 25% (A08, A09) | −15 |
| Abastecimento sem talão (A11) | −10 |
| Turno fechado automaticamente (A20) | −10 |
| Fecho pelo gestor (A21) | −5 |
| Cada 10 min completos sem sinal de GPS | −1 *(máx. −20 por turno)* |

**Recuperação:** +3 por cada turno completo e sem alertas, até ao máximo de 100.

**Regras de leitura:**

- O **motorista vê o seu próprio score** e o que o baixou. Um sistema de vigilância que o
  motorista não pode consultar gera revolta; um que ele pode consultar e melhorar gera
  outro comportamento.
- Ninguém vê o score dos colegas.
- O score **não é prova de roubo**. É um indicador de disciplina de registo. Um motorista
  honesto com um telemóvel velho vai ter score baixo — e o dono tem de saber disso.

> ⚠️ Decisão a tomar com o cliente: o score deve ser visível ao motorista desde o primeiro
> dia, ou só depois de duas semanas a habituar-se à app? A minha recomendação é **desde o
> primeiro dia**, com os primeiros 14 dias em modo de adaptação (sem penalização).

---

## 9. GPS, bateria e dados móveis

Em Cabo Verde os dados custam e o telemóvel tem de aguentar 10 horas. Se a app gastar a
bateria, o motorista desliga-a — e nenhuma regra deste documento serve para nada.

### 9.1 Amostragem

| Situação | Frequência |
|---|---|
| Em movimento (> 5 km/h) | 1 ponto / 10 s |
| Parado | 1 ponto / 60 s |
| Envio para o servidor | Lote a cada 90 s |

O mapa do dono fica com cerca de **1 minuto de atraso**. Ninguém nota, e gasta cerca de
dez vezes menos do que o envio ponto a ponto.

### 9.2 Contas de consumo (por motorista, por dia)

| Item | Volume |
|---|---|
| ~2.400 pontos de GPS, comprimidos | ≈ 190 KB |
| 3 fotos (abertura, talão, fecho) a ≈ 250 KB | ≈ 750 KB |
| **Total por turno** | **< 1 MB** |

Menos de 1 MB por dia, ou seja, **cerca de 30 MB por mês**. É um argumento de venda, não
um detalhe técnico: cabe em qualquer pacote de dados.

### 9.3 Bateria

- Serviço em primeiro plano com **notificação permanente** ("Turno em curso — FleetCV").
  É obrigatório no Android moderno para gravar em segundo plano, e é honesto: o motorista
  vê sempre que está a ser gravado. Nada acontece às escondidas.
- Fotos reduzidas a 1600 px no lado maior, JPEG qualidade 75 (≈ 250 KB).
- O nível de bateria vai em cada ponto. É assim que se distingue **"o telemóvel morreu"**
  (bateria a descer até 3%, depois silêncio) de **"o motorista desligou o GPS"** (bateria
  a 60% e silêncio de repente). Só a segunda é que penaliza o score.

---

## 10. Funcionamento sem rede

O motorista tem de conseguir trabalhar um turno inteiro sem rede nenhuma.

### 10.1 Como funciona

1. Todos os eventos são gravados primeiro numa base de dados local no telemóvel.
2. Cada evento nasce com um **identificador único gerado no telemóvel** (UUID).
3. Uma fila envia os eventos por ordem, com nova tentativa em intervalos crescentes.
4. O servidor aceita o mesmo identificador uma só vez. Reenviar não duplica nada.
5. As fotos vão numa fila separada, porque são pesadas. **O evento não espera pela foto** —
   o turno fecha na mesma, e a foto liga-se a ele quando subir.

### 10.2 Consequências no desenho

- Não existem conflitos de edição, porque **nada se edita**: tudo são registos novos.
- O servidor guarda sempre `capturado_em` (telemóvel) e `recebido_em` (servidor). É essa
  diferença que denuncia relógios adulterados (R12).
- Se a app for reinstalada com eventos por enviar, esses eventos perdem-se. **Aviso no
  ecrã sempre que houver fila por sincronizar**, com o número de itens pendentes.

---

## 11. Privacidade

Não é só uma questão legal — é o que decide se o motorista aceita ou boicota a app.

| Regra | Porquê |
|---|---|
| GPS **só** com turno aberto | Fora do turno não existe um único ponto gravado. Nem o dono pode ver. |
| Notificação permanente durante o turno | O motorista vê sempre quando está a ser gravado |
| O motorista vê tudo o que foi gravado sobre ele | Sem caixa negra |
| Rasto detalhado apagado ao fim de **90 dias** | Fica só a linha simplificada e os totais |
| Fotos apagadas ao fim de **6 meses** | Ficam os números e os alertas |
| Consentimento assinado no primeiro arranque | Texto simples, em português, no ecrã |

**Ao contratar, o motorista tem de assinar** que aceita o rastreio durante o horário de
trabalho. A app mostra esse texto no primeiro arranque e guarda a aceitação com data.

---

## 12. Arquitectura

### 12.1 Escolhas e razões

| Camada | Escolha | Porquê |
|---|---|---|
| App do motorista | **Flutter (Android)** | Único caminho para gravar GPS com o ecrã apagado. iOS fica para v2 — o parque é quase todo Android |
| Base de dados | **Supabase (PostgreSQL)** | Postgres a sério, autenticação, armazenamento de fotos e tempo real numa só peça. Começa grátis |
| Painel do dono | **Next.js + React** | Tabelas e mapas são muito melhores em web do que em Flutter Web |
| Mapas | **MapLibre GL** | Livre, sem custo por utilizador |
| Leitura do quadrante e do talão | **Google ML Kit, no telemóvel** | Funciona **offline** e não custa nada por leitura. Decisivo: o posto de combustível é logo o sítio onde a rede falha |
| Notificações | **Firebase Cloud Messaging** | Gratuito |
| Regras de negócio | **Funções SQL no Postgres** | Correm ao fechar o turno, dentro da transacção. Determinísticas e fáceis de testar |

> **Nota sobre a leitura automática (OCR):** ela **propõe**, o motorista **confirma**, o
> dono **vê a foto**. Nunca um número entra sozinho. Um quadrante digital sujo, de noite,
> com reflexo, lê-se mal — e a foto é a prova verdadeira, não o número.

### 12.2 Desenho

```
┌──────────────────┐         ┌───────────────────┐
│  App do motorista │        │  Painel do dono   │
│  Flutter Android  │        │  Next.js web      │
│  + SQLite local   │        │  + MapLibre       │
└────────┬─────────┘         └─────────┬─────────┘
         │  fila de sincronização      │
         └──────────────┬──────────────┘
                        ▼
              ┌──────────────────┐
              │     Supabase     │
              │  Postgres + RLS  │
              │  Storage (fotos) │
              │  Realtime (mapa) │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Motor de regras │
              │  funções SQL     │
              │  → alertas → FCM │
              └──────────────────┘
```

### 12.3 Autenticação

- **Sem SMS.** Custa dinheiro em Cabo Verde e falha com frequência.
- O gestor cria o motorista e entrega um **número de telefone + PIN de 6 dígitos**.
- O motorista muda o PIN no primeiro acesso.
- **Um motorista, um aparelho.** A sessão fica ligada ao telemóvel; entrar noutro aparelho
  expulsa o anterior e avisa o gestor. Isto dificulta passar a conta a outra pessoa.
- Sessão longa (30 dias), porque um motorista sem rede não consegue voltar a entrar.

### 12.4 Segurança dos dados

- Segurança ao nível da linha (RLS) por organização — **desde o primeiro dia**. Fazer
  multi-cliente agora custa pouco; acrescentar depois obriga a reescrever tudo.
- Motorista só lê as linhas dos seus próprios turnos.
- Fotos em armazenamento privado, acessíveis por ligação assinada de curta duração.
- Turno fechado é protegido por gatilho na base de dados: qualquer tentativa de alteração
  é rejeitada pelo Postgres, não pela aplicação.

---

## 13. Esquema da base de dados

Esboço. A versão final (DDL) é escrita na Fase 1.

```
organizacao       id · nome · ilha · criado_em · definicoes(jsonb)

utilizador        id · organizacao_id · nome · telefone · papel
                  pin_hash · aparelho_id · ultimo_acesso · activo

carro             id · organizacao_id · matricula · marca · modelo · ano
                  tipo_combustivel · capacidade_deposito_l
                  consumo_referencia_l100 · km_actual · estado

indisponibilidade id · carro_id · inicio · fim · motivo

turno             id(uuid do telemóvel) · organizacao_id · carro_id · motorista_id
                  estado · aberto_em · fechado_em · bateria_final_pct
                  km_inicial · km_inicial_ocr · foto_inicial_id
                  km_final   · km_final_ocr   · foto_final_id
                  km_gps_m · duracao_s · segundos_sem_gps
                  total_combustivel_cve · total_litros
                  relogio_suspeito(bool) · mock_detectado(bool)
                  ⚠ imutável quando estado ≠ ABERTO (gatilho)

ponto_gps         id · turno_id · lat · lon · precisao_m · velocidade_kmh
                  bateria_pct · mock(bool) · monotonico_ms · desvio_relogio_s
                  capturado_em · recebido_em
                  ⚠ tabela particionada por mês

abastecimento     id(uuid do telemóvel) · turno_id · carro_id · motorista_id
                  valor_cve · litros_calculados · litros_ocr
                  posto_id · lat · lon · foto_talao_id · hash_talao
                  capturado_em · recebido_em · confirmado_no_rasto(bool)

posto             id · organizacao_id(nulo = global) · nome · marca · lat · lon · ilha

preco_combustivel id · ilha · tipo · preco_cve_litro · valido_de · valido_ate
                  (actualizado quando a ARME publica)

zona              id · organizacao_id · nome · lat · lon · raio_m · tipo
                  (círculos, não polígonos: evita a dependência de PostGIS e
                   chega para base, postos e área de operação)

foto              id · organizacao_id · caminho · hash_sha256 · bytes
                  capturado_em · lat · lon · tipo

alerta            id · organizacao_id · codigo · nivel · turno_id · carro_id
                  motorista_id · abastecimento_id · dados(jsonb) · ocorrencias
                  ocorrido_em (hora do facto) · criado_em (hora da gravação)
                  fechado_em · fechado_por · resolucao · nota

score_motorista   motorista_id · janela_de · janela_ate · valor · detalhe(jsonb)
```

**Notas de implementação:**

- Dinheiro em **cêntimos de escudo (número inteiro)**. Nunca vírgula flutuante em dinheiro.
- Distâncias em **metros (inteiro)**. Km só na apresentação.
- Datas em **UTC** na base de dados; hora de Cabo Verde (UTC−1) só no ecrã.
- `ponto_gps` é a tabela que cresce: ≈ 1,4 milhões de linhas por mês com 20 carros.
  Particionada por mês; ao fim de 90 dias o rasto é simplificado (Douglas-Peucker) e a
  partição antiga é apagada.

---

## 14. Ecrãs

### 14.1 App do motorista — 5 ecrãs, e chega

| Ecrã | O que tem |
|---|---|
| **Entrar** | Telefone + PIN |
| **Início** | O carro atribuído, o meu score, botão grande **ABRIR TURNO** |
| **Em turno** | Tempo decorrido · km de hoje · estado do GPS · botão **ABASTECI** · botão **FECHAR TURNO** |
| **Abastecer** | Câmara → foto do talão → valor (proposto pelo OCR) → posto → confirmar |
| **Fechar turno** | Câmara → foto do quadrante → km → resumo do dia → confirmar |
| *(+)* **Histórico** | Os meus turnos e o meu score, com o que o baixou |

**Regras de interface, e não são negociáveis:**

- Botões grandes. Isto usa-se com o carro a trabalhar, com sol na tela, muitas vezes com
  uma mão só.
- **Máximo 3 toques** para qualquer acção.
- Funciona a 100% sem rede, com indicador claro de itens por sincronizar.
- Nada de formulários longos. Foto → confirmar → pronto.

### 14.2 Painel do dono

| Página | O que mostra |
|---|---|
| **Agora** | Mapa ao vivo com os carros em turno · alertas abertos · turnos do dia |
| **Turnos** | Lista com filtros · detalhe com mapa do percurso, fotos e todas as contas |
| **Alertas** | Fila por resolver · fechar com justificação |
| **Combustível** | Abastecimentos, gasto por carro, consumo e sua evolução |
| **Carros** | Ficha, histórico de km, consumo, indisponibilidades |
| **Motoristas** | Score, histórico, comparação entre motoristas |
| **Relatórios** | Mensal por carro e por motorista · exportar para Excel/PDF |
| **Definições** | Preços do combustível, zonas, limites dos alertas, horários |

**O ecrã que vende o produto** é o detalhe do turno: percurso no mapa, foto do quadrante à
abertura e ao fecho, talão de combustível, e as contas todas lado a lado —
*declarado vs provado*. É isso que se mostra a um dono para ele perceber em 10 segundos.

---

## 15. Configurável por organização

Nenhum destes números fica fixo no código. Cada frota é diferente, e no piloto vamos
querer mexer neles sem publicar nova versão da app.

| Definição | Valor por omissão |
|---|---|
| Duração máxima do turno até fecho automático | 16 h |
| Inactividade até fecho automático | 3 h |
| Tolerância no gap de km entre turnos | 3 km |
| Divergência de km que gera aviso | 15 % |
| Divergência de km que gera alerta crítico | 25 % |
| Tempo sem GPS que gera alerta | 15 min |
| Paragem longa fora de zona | 20 min |
| Desvio de consumo que gera alerta | 25 % |
| Raio de confirmação no posto | 150 m |
| Janela de tempo de confirmação no posto | ± 10 min |
| Km máximo plausível por turno | 500 km |
| Período de adaptação sem penalização | 14 dias |
| Hora do resumo diário | 20:00 |

---

## 16. Fases e critérios de aceitação

Cada fase termina com **algo que se pode testar**. Nenhuma fase começa sem a anterior
estar aceite.

### Fase 0 — Especificação ✅
**Entregue.** Falta a revisão do Yanick contra a realidade de Cabo Verde (secção 19).
**Entrega:** este documento, revisto e corrigido pelo Yanick.
**Aceite quando:** as regras R01–R34 estiverem confirmadas contra a realidade de Cabo Verde.

### Fase 1 — Fundação (base de dados e regras) ✅ ← *feito*
**Entregue:** `fleetcv/db/` — esquema PostgreSQL, as 34 regras em SQL, dados de partida de
uma frota da Praia, e 18 cenários com 48 verificações automáticas.
**Correr:** `./fleetcv/db/run.sh`
**Resultado:** 48/48 verificações passam, sem interface nenhuma. Se a lógica não estivesse
certa aqui, nenhum ecrã bonito a salvava.

### Fase 2 — Painel do dono ← *a seguir*
**Entrega:** web com mapa, turnos, alertas e relatórios, sobre os dados de teste.
**Aceite quando:** for possível abrir um turno de teste e ver percurso, fotos, contas e
alertas — e perceber a história toda sem explicação nenhuma.

### Fase 3 — App do motorista
**Entrega:** app Android, compilada automaticamente no GitHub (ficheiro APK pronto a
instalar).
**Aceite quando:** um turno real completo num telemóvel verdadeiro, **com modo de avião
ligado metade do tempo**, chegar inteiro ao painel.

### Fase 4 — Piloto
**Entrega:** 1 carro, 1 motorista, 14 dias.
**Aceite quando:** 14 dias seguidos sem perder dados, a bateria aguentar o turno, e o dono
apontar **pelo menos uma coisa que não sabia antes**.
**É esta fase que diz se o projecto vale alguma coisa.** Tudo o que vem antes é preparação.

### Fase 5 — Alargar
3 a 5 carros, calibrar os limites com base nos alertas marcados como "erro do sistema",
e só depois falar com outros proprietários.

---

## 17. Cenários de teste

A Fase 1 tem de reproduzir todos estes cenários e dar o resultado esperado.

| # | Cenário | Resultado esperado |
|---|---|---|
| **C01** | Turno normal: abre, anda 180 km, abastece 2.000 com talão certo, fecha | Sem alertas. Score +3 |
| **C02** | Declara 2.000, o talão diz 1.250 | 🟡 A12 |
| **C03** | Talão de posto onde o carro nunca esteve | 🔴 A14 |
| **C04** | Km de abertura 40 km acima do fecho anterior | 🔴 A19 |
| **C05** | GPS desligado durante 40 min a meio do turno | 🟡 A03, score −4 |
| **C06** | Bateria chega a 0% e o turno nunca fecha | 🟡 A20 às 16h, **sem** penalização por GPS (bateria prova a causa) |
| **C07** | Declara 50 litros num depósito de 40 | 🔴 A13 |
| **C08** | Relógio do telemóvel atrasado 2 horas | 🔴 A06 |
| **C09** | App de localização falsa activa | 🔴 A04, score −50 |
| **C10** | Turno inteiro sem rede, sincroniza só no fim | Tudo chega intacto. **Sem alertas** — falta de rede não é falta do motorista |
| **C11** | Tentar abrir segundo turno no mesmo carro | Bloqueado na app e no servidor |
| **C12** | Mesmo talão submetido em dois turnos | 🔴 A15 no segundo |
| **C13** | Consumo a subir 8% por semana durante 3 semanas | 🟡 A18 na terceira janela — o sifão lento |
| **C14** | Carro na oficina, anda 12 km sem turno | **Sem alerta**, mas fica registado |
| **C15** | Quadrante diz 240 km, GPS diz 180 km | 🔴 A08 (divergência de 25%) |
| **C16** | Motorista novo, 3 abastecimentos só | **Sem alerta de consumo** — ainda não há base (R29) |

> **C10 e C14 e C16 são os testes mais importantes da lista.** Qualquer sistema apanha
> fraude óbvia. O que mata estes produtos são os **alertas falsos**: ao terceiro alerta
> injusto, o dono deixa de abrir a aplicação e o motorista deixa de confiar nela.

---

## 18. Riscos

| Risco | Gravidade | O que fazemos |
|---|---|---|
| Motorista recusa-se a usar | 🔴 Alto | GPS só em turno · score visível a ele · a regra é do patrão, a app só prova |
| Bateria não aguenta o turno | 🔴 Alto | Amostragem adaptativa · medido na Fase 4 · carregador de isqueiro no piloto |
| Telemóvel velho ou sem espaço | 🟡 Médio | Android 8+ · app leve · fotos pequenas |
| OCR falha com quadrante sujo | 🟡 Médio | Confirmação manual sempre · a foto é que é a prova |
| Alertas a mais, dono desiste | 🔴 Alto | Só 🔴 no telemóvel · resolução "erro do sistema" para calibrar |
| Abastecimento informal, sem talão | 🟡 Médio | *Em aberto — ver secção 19* |
| Custo dos dados móveis | 🟢 Baixo | < 1 MB/dia, medido |
| Dono não quer pagar | 🟡 Médio | Piloto gratuito primeiro; preço só depois de haver prova de poupança |

---

## 19. Decisões em aberto

Precisam de resposta do Yanick antes ou durante a Fase 1.

| # | Pergunta | Porque importa |
|---|---|---|
| **D01** | **De quem é o telemóvel — do motorista ou da empresa?** | Se for do motorista, ele paga os dados e a bateria, e tem todos os motivos para não colaborar. Pode mudar o desenho todo |
| **D02** | Os taxistas abastecem sempre em posto formal com talão? Há compra informal? | Sem talão, a R20 enche o sistema de avisos falsos |
| **D03** | Um táxi é conduzido por uma pessoa só, ou há turno de dia e turno de noite? | Decide se a atribuição carro↔motorista é fixa ou rotativa |
| **D04** | Quantos km faz um táxi por dia, em média, na Praia? | Calibra os limites plausíveis (R14) |
| **D05** | O score deve ser visível ao motorista desde o primeiro dia? | Recomendação: sim, com 14 dias de adaptação |
| **D06** | Qual é o preço do combustível hoje, e onde a ARME o publica? | Dá para automatizar a actualização mensal, em vez de ser à mão |
| **D07** | Já tens um proprietário disposto a fazer o piloto? | É a peça mais importante do projecto inteiro, e não é código |

---

## 20. Glossário

| Termo | Significado |
|---|---|
| **Quadrante** | Conta-quilómetros (odómetro) do carro |
| **Turno** | Período contínuo em que um motorista tem o carro ao serviço |
| **Rasto** | Sequência de pontos de GPS de um turno |
| **Gap de quilometragem** | Diferença entre o km de fecho de um turno e o de abertura do seguinte |
| **Janela de consumo** | Conjunto de abastecimentos usado para calcular L/100km |
| **Score de confiança** | 0–100 por motorista, disciplina de registo (não é prova de roubo) |
| **CVE** | Escudo cabo-verdiano |
| **ARME** | Entidade que fixa os preços dos combustíveis em Cabo Verde |
| **Localização falsa** | App que engana o GPS do telemóvel (*mock location*) |

---

## 21. Registo de alterações

### v0.2 — depois da Fase 1

Escrever o código obrigou a corrigir quatro coisas que estavam erradas na v0.1. Ficam
registadas com o motivo, porque o motivo é mais importante do que a correcção.

| O que mudou | Porquê |
|---|---|
| **R12 — deteção do relógio adulterado** foi refeita | A regra original comparava a hora do telemóvel com a do servidor. Isso **quebra em modo offline**: um turno sincronizado ao fim do dia tem horas legitimamente atrasadas, e teria dado alerta falso todos os dias. Agora usa o desvio que o próprio telemóvel mede na sincronização, mais o contador monotónico do Android — que não se pode alterar nem em modo de avião |
| **Alertas passaram a ter `ocorrido_em` além de `criado_em`** | Um alerta estava a ser datado pela hora em que a linha era gravada. Com sincronização offline, um turno de terça-feira que só sobe na quinta contava no relatório de quinta e desaparecia do de terça. O score chegou a dar 100 a um motorista apanhado com GPS falso — foi um teste que apanhou isto |
| **Zonas passaram de polígonos a círculos** | Polígonos obrigavam a PostGIS. Centro e raio chegam para base, postos e área de operação, e a instalação fica muito mais simples |
| **R16 — a divergência mede-se sobre o quadrante**, com limites ≥15% e ≥25% | Faltava dizer sobre que número se calcula a percentagem. Sobre o GPS ou sobre o quadrante dá resultados diferentes, e a fronteira exacta entre aviso e crítico dependia disso |

**Também foi preciso decidir, e ficou assim:** só contam para "tempo sem sinal" as falhas
acima de 5 minutos (a amostragem normal nunca lá chega); um intervalo que começa logo a
seguir a um ponto com bateria ≤5% não conta nem penaliza, porque a bateria prova a causa.

### v0.3 — os painéis com o mapa verdadeiro

Pôr a Praia a sério dentro dos painéis abriu uma prova que na v0.2 era impossível, e
fechou um buraco que ninguém tinha visto.

| O que mudou | Porquê |
|---|---|
| **R24 / A14 passa a ser verificável** | A regra "o carro tinha de estar no posto à hora do talão" existia desde a v0.1, mas não havia coordenadas de postos verdadeiros — só uma lista inventada. Com os 11 postos do OpenStreetMap, o painel compara o posto do talão com o percurso: se o GPS nunca pôs o carro a menos de 150 m, é crítico; se passou lá mas não parou os 120 s, é aviso |
| **A17 conta-se pelos litros do talão, não pelo valor escrito** | O valor em CVE é o que o condutor diz; o talão é o que aconteceu. Contar o gasto aos 100 km pelo valor escrito fazia um talão inflacionado disparar dois alertas pelo mesmo facto — o do talão e o do consumo — e o patrão via o mesmo desvio contado duas vezes |
| **O percurso grava-se de 8 em 8 segundos e quando o ecrã se apaga** | Estava só em memória até ao fim do turno. Um telemóvel que morre às 14h levava consigo a manhã inteira, e o que sobrava era a palavra do condutor — exactamente o que isto existe para substituir |
| **O mapa não usa mapas de internet** | Os telemóveis dos condutores pagam os dados e muitas vezes não têm rede. A costa, as ruas, os bairros e os postos vão dentro do ficheiro; o mapa aparece igual sem rede nenhuma |

**Também foi preciso decidir, e ficou assim:** quando o GPS falha, a aplicação tem de
dizer *qual* das três coisas falhou — a página está numa moldura e o telemóvel nem chega
a perguntar, o condutor não autorizou, ou ainda não apanhou satélites. Um "sem GPS" sem
explicação deixa o condutor preso no ecrã e o turno por abrir.

### v0.4 — os dois painéis a falar em tempo real

Até aqui cada painel guardava as coisas no seu telemóvel e nunca se viam: o turno que o
António fechava não chegava ao patrão. Ligá-los obrigou a decidir o que viaja pela rede e
o que não viaja.

| O que mudou | Porquê |
|---|---|
| **A posição sobe de 4 em 4 segundos, e só se o carro mexeu** | Um turno de oito horas dá milhares de pontos de GPS. Uma escrita por ponto esgotava o ritmo permitido e a aplicação era travada a meio do dia — e o condutor pagava os dados. Se a nuvem se queixar do ritmo, a aplicação abranda em vez de insistir |
| **O rasto viaja aos pedaços, de 45 em 45 segundos** | Um documento tem tamanho máximo. Um turno inteiro num só não cabe, e uma gravação falhada levaria o turno todo à frente. Aos pedaços, o que já subiu fica |
| **As provas calculam-se no telemóvel do condutor** | O patrão precisa de saber se o carro esteve no posto do talão, não dos milhares de pontos que respondem a essa pergunta. A distância ao posto e o tempo parado (R24) passam a ser calculados ao fechar o turno e viajam como dois números |
| **Os km ao vivo vêm contados do telemóvel** | O patrão só recebe o rabicho do percurso, o suficiente para o desenhar. Contar os quilómetros outra vez aqui dava só os últimos — o número do turno andava para trás enquanto o carro andava para a frente |
| **Cada papel escreve o seu** | O condutor escreve o turno dele e onde está; o patrão escreve os carros, os condutores e as respostas aos alertas. Sem isto, dois telemóveis escreviam a mesma linha e o último a chegar apagava o outro |

**Também foi preciso decidir, e ficou assim:** um turno que não dá notícias há mais de 10
minutos deixa de contar como "a decorrer" — o telemóvel morreu ou ficou sem rede, e o
mapa não pode continuar a mostrar um carro parado como se estivesse a trabalhar. E sem
ligação nenhuma tudo continua a funcionar com o que está guardado no próprio telemóvel:
o condutor não pode ficar à porta de um cliente à espera de rede.

### v0.5 — o servidor

Os dois motores anteriores serviam para experimentar, mas ambos exigiam que quem abre a
aplicação tivesse conta nalgum sítio — e um taxista na Praia tem um telemóvel, não uma
conta. O servidor resolve isso, e ao resolvê-lo trouxe a primeira coisa deste projecto
que é mesmo verificada em vez de acordada.

| O que mudou | Porquê |
|---|---|
| **As regras de escrita passam a ser aplicadas, não pedidas** | "O condutor só escreve o turno dele" era boa vontade: num telemóvel, quem soubesse mexer escrevia o que quisesse — a frota, o turno de outro, um turno fechado. Agora o servidor recusa: um condutor escreve o turno dele, a posição dele e o percurso dele, e mais nada |
| **Um turno fechado não se volta a escrever** | Sem isto, um condutor podia reabrir o turno de ontem e corrigir os km depois de o patrão ter visto o alerta. A prova tem de ficar quieta |
| **Um condutor só pode ter um turno ao vivo** | Um telemóvel que morre a meio deixa cá um turno marcado como "a andar agora". Quando o mesmo condutor abre outro, o antigo sai — senão o patrão via o mesmo homem em dois carros ao mesmo tempo. Ao fim de uma hora sem notícias, sai de qualquer maneira: o percurso e o turno ficam gravados, só a marca de "está a andar" é que cai |
| **Seis enganos no código travam aquele e-mail por quinze minutos** | Um código de quatro dígitos adivinha-se em dez mil tentativas. Com o travão, não |

**Também foi preciso decidir, e ficou assim:** o código continua a ser de quatro dígitos e
guardado tal como é, porque o condutor escreve-o ao volante e o patrão precisa de o poder
ver para lho dizer ao telefone. É uma escolha, não um descuido — e obriga a que isto viva
atrás de https, senão o código viaja à vista de quem estiver na mesma rede.
