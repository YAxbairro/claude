# FleetCV — a aplicação

Um só endereço, dois papéis: **condutor** e **dono**.

```
frota.html   a aplicação inteira, sem compilação nem dependências
teste.mjs    22 verificações que percorrem os dois papéis do princípio ao fim
```

## Como está organizada

**Primeira vez** → três passos: nome da empresa, os carros, o preço do combustível.
Ou o atalho **«Ver com dados de exemplo»**, que enche tudo sozinho.

**Condutor** — Turno · Mais
Abrir turno (foto do conta-quilómetros) → conduzir → «Abasteci» (foto do talão) →
fechar turno (foto). No fim vê as contas do seu próprio turno.

**Dono** — Hoje · Turnos · Ver · Equipa · Mais
- **Hoje**: km, combustível, turnos, e o dinheiro que falta explicar
- **Ver**: cada coisa encontrada, com três respostas possíveis
- **Equipa**: quem regista com cuidado e quem não
- **Mais**: contas do mês, carros e preço, dados de exemplo

## Os dados de exemplo

Duas semanas de trabalho de três táxis, com os cinco casos lá dentro: dias normais,
um talão inflacionado, um carro usado à noite, um GPS desligado e um bidão cheio.

**As contas são as verdadeiras.** O que é inventado são os turnos; o sistema que os
julga é o mesmo que julga os turnos reais — os mesmos limites de `LIM`, as mesmas
regras do motor SQL da Fase 1 e da app Android.

Serve para duas coisas: experimentar tudo sem carro, e mostrar a um dono de táxis
no telemóvel, em dois minutos.

## Testar

```bash
npm i playwright && node teste.mjs
```

Percorre a configuração inicial, os dados de exemplo, os alertas, a resolução de um
alerta, o detalhe de um turno, a equipa, as contas, e um turno inteiro gravado do
princípio ao fim no papel de condutor.

## O que ainda não faz

- **O GPS pára quando o telemóvel adormece** — é um limite do navegador. A app
  Android (`fleetcv/android_app`) grava com o ecrã apagado.
- **Não lê o conta-quilómetros nem o talão sozinha.** Os números escrevem-se à mão.
