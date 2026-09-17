# O piloto

Catorze dias, um carro, um condutor. É esta fase que diz se o FleetCV vale
alguma coisa — tudo o que veio antes foi preparação.

> Nenhuma das perguntas desta página se responde a escrever código. Só um carro
> na rua responde.

## O que já está pronto

| Peça | Onde |
|---|---|
| App do condutor (Android) | Actions → `FleetCV · APK` → artefacto `fleetcv-apk` |
| Painel do dono + versão web do condutor | o endereço do artefacto publicado |
| Ponte entre os dois | app: **Enviar turnos ao dono** → painel: **Importar** |

**Não é preciso servidor.** O condutor manda o ficheiro pelo WhatsApp e o dono
importa-o. Vão os turnos e as fotos. Para um carro, isto chega e não custa nada.

## Antes do primeiro dia

1. Instalar o APK no telemóvel do condutor (autorizar "origens desconhecidas").
2. No painel, em **Frota**: matrícula, km actuais do quadrante, litros do
   depósito, e o preço da gasolina que a ARME tem em vigor este mês.
3. **Falar com o condutor, antes de instalar.** A conversa decide o piloto mais
   do que a app:
   - o GPS só grava **dentro do turno** — fora dele ninguém o vê;
   - a notificação permanente é para ele saber sempre quando está a gravar;
   - ele vê o seu próprio score e o que o baixou;
   - o que se procura é o combustível, não ele.
4. Carregador de isqueiro no carro. Não é opcional.

## Todos os dias, um minuto

O condutor: abre turno com foto → conduz → abastece com foto → fecha com foto.
Ao fim do dia (ou da semana) toca em **Enviar turnos ao dono**.

O dono: importa, olha os alertas, e fecha cada um com uma de três respostas.
**A terceira é a mais importante do piloto:**

| Resposta | Quando |
|---|---|
| Justificado | há explicação boa |
| É desvio | confirmou-se |
| **Erro do sistema** | **o alerta não fazia sentido** |

Cada "erro do sistema" tira a penalização ao condutor **e** diz-nos que uma
regra está mal calibrada. Se ao fim de duas semanas houver muitos, o problema é
nosso, não do condutor.

## Anotar num papel, todos os dias

Cinco números. Levam um minuto e são a resposta do piloto:

1. **Bateria no fim do turno** (aparece no topo da app)
2. **Turnos que ele se esqueceu de abrir ou de fechar**
3. **Minutos sem sinal** (no detalhe do turno)
4. **Alertas fechados como "erro do sistema"**
5. **Uma frase do condutor** sobre o que o irritou nesse dia

## O que estamos mesmo a testar

| Pergunta | Como se sabe | Se correr mal |
|---|---|---|
| A bateria aguenta 10 horas? | número 1 | reduzir a amostragem do GPS |
| O Android mata o serviço? | buracos no percurso com bateria cheia | excluir a app da poupança de bateria |
| Ele usa a app todos os dias? | número 2 | é a regra do patrão que resolve, não a app |
| Os limites estão certos para a Praia? | número 4 | mexer nos valores, que são configuráveis |
| O dono olha para aquilo? | ele abre sem que lhe peçam? | o produto não vale nada se não |

## Ao fim dos catorze dias

O piloto passou se:

- **14 dias sem perder um único turno**
- a bateria chegou ao fim do turno em todos eles
- o dono apontar **pelo menos uma coisa que não sabia antes** — é este o teste
  que interessa; os outros são higiene
- os "erros do sistema" forem poucos e sabermos calibrar os que houve

Se passar, vale a pena montar servidor a sério (Supabase) e alargar a três ou
cinco carros. Antes disso, não.

## O que ainda não existe, e propositadamente

- **Sincronização automática.** Precisa de conta e de servidor; num carro só, o
  ficheiro pelo WhatsApp faz o mesmo trabalho.
- **Leitura automática do quadrante e do talão.** Os números escrevem-se à mão.
  Se o piloto mostrar que isso irrita o condutor, passa a prioridade.
- **Vários condutores no mesmo painel em tempo real.** Só faz sentido com
  servidor.
