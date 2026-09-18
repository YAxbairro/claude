# FleetCV — a aplicação

Um só endereço, dois papéis: **condutor** e **dono**.

```
frota.html   a aplicação inteira, sem compilação nem dependências
teste.mjs    28 verificações que percorrem os dois papéis do princípio ao fim
```

## O condutor, passo a passo

Sete ecrãs, um de cada vez, sem nada a mais.

| | |
|---|---|
| **1 · Entrar** | email e código de quatro números, que o patrão lhe dá |
| **2 · Que carro vai levar** | a lista dos carros da frota, com os km de cada um |
| **3 · Quantos km marca** | fotografa o conta-quilómetros **ou** escreve o número |
| **4 · Ligar o GPS** | explica porquê, e que fora do turno ninguém o vê |
| **5 · O volante** | o mapa a ocupar o ecrã, com a velocidade e os km ao vivo |
| **6 · Abastecer** | o GPS diz qual é o posto mais perto; foto do talão ou à mão |
| **7 · Terminar** | última foto ou número, e saem as contas do turno |

Nada é obrigatório duas vezes: a foto **ou** o número chegam, em qualquer dos
passos onde há quilometragem.

### O volante

Enquanto conduz vê o caminho a ser desenhado, o carro com o nariz virado para
onde vai, a velocidade em números grandes com um arco que muda de cor, os
quilómetros, o tempo e o que já gastou. E dois botões: **Abastecer** e
**Terminar**.

### Os postos

`POSTOS` tem dez postos da Praia com coordenadas aproximadas. O GPS ordena-os
por distância e propõe o mais perto; o condutor confirma ou escolhe outro.

## O dono

**Hoje · Turnos · Ver · Equipa · Mais**. Em **Equipa** estão os emails e os
códigos para dar a cada condutor.

## Experimentar sem carro

- **«Ver com dados de exemplo»** na configuração inicial: duas semanas de três
  táxis, com os cinco casos lá dentro.
- **«Experimentar sem conduzir»**, no ecrã do GPS: o carro anda sozinho e dá
  para abastecer e terminar como num turno a sério.

Um turno só é simulado quando o condutor o pede. Ter dados de exemplo gravados
nunca transforma um turno verdadeiro num turno inventado.

## Testar

```bash
npm i playwright && node teste.mjs
```

## O que ainda não faz

- **O GPS pára quando o telemóvel adormece** — limite do navegador. A app
  Android (`fleetcv/android_app`) grava com o ecrã apagado.
- **Não lê o conta-quilómetros nem o talão sozinha.** Os números escrevem-se
  à mão.
