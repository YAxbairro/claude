# FleetCV

Controlo de frotas para Cabo Verde. Prova **onde o carro andou** e **quanto gastou
realmente em combustível** — sem instalar rastreador, só com o telemóvel do motorista.

**Primeiro mercado:** proprietários de táxis (6–20 viaturas).
Depois: rent-a-car e carros de serviço de instituições.

## Estado

**A aplicação está de pé e a caminho do piloto.** Os dois painéis — o do condutor e o do
proprietário — vivem num ficheiro só, `fleetcv/paineis/fleetcv.html`, que pergunta à
entrada quem é que abriu. Tudo o que acontece num aparece no outro em segundos.

👉 **[site/INSTALAR.md](site/INSTALAR.md)** — pôr isto no ar em meia hora, com Supabase e
Vercel. É o caminho que serve para trabalhar a sério: a página fica num endereço próprio
(o que destranca o GPS) e as regras passam para dentro da base de dados.

```bash
cd fleetcv/paineis && python3 juntar.py   # constrói fleetcv.html e site/index.html
node teste_supabase.mjs                    # 25 verificações ao caminho todo
cd ../supabase && ./provar.sh              # 19 regras, num Postgres a sério
./fleetcv/db/run.sh                        # a base de dados de fase 1 e os 18 cenários
```

👉 **[SPEC.md](SPEC.md)** — a fonte da verdade: regras, modelo de dados, alertas,
anti-fraude, arquitectura e fases.
👉 **[DECISOES.md](DECISOES.md)** — o que ainda está por decidir e com que pressupostos
se avançou.

## Fases

| Fase | O que é | Estado |
|---|---|---|
| 0 | Especificação | ✅ |
| 1 | Base de dados + regras + testes | ✅ 48/48 verificações |
| 2 | Painel do proprietário | ✅ 44 verificações |
| 3 | Painel do condutor | ✅ 35 verificações |
| 4 | Os dois num link só, a falar em tempo real | ✅ 16 + 15 verificações |
| 5 | Supabase + Vercel (GPS a sério, regras na base) | ✅ 19 verificações |
| 6 | Piloto com 1 carro, 14 dias | ⬅️ a seguir |
| 7 | Alargar a 3–5 carros | ⏳ |

## O que isto é, por dentro

Uma página só, sem framework nenhum, que corre no telemóvel do condutor e no do patrão.
Por baixo há uma **nuvem com quatro motores e a mesma porta** — Supabase, servidor
próprio, base partilhada do Claude, ou o próprio navegador — e o resto do código não sabe
qual está a ser usado. Foi o que permitiu mudar de casa sem reescrever nada.

O mapa da Praia vai dentro do ficheiro: ruas, costa, 11 bombas de combustível e 40
bairros com nome, tirados do OpenStreetMap. Não há mosaicos a descarregar, por isso
funciona com pouca rede e não gasta dados de ninguém.

| Pasta | O que lá está |
|---|---|
| `paineis/` | a aplicação, os testes e o mapa |
| `site/` | o que vai para o Vercel, e o guia de instalação |
| `supabase/` | o `esquema.sql`: as tabelas e as regras de quem escreve o quê |
| `servidor/` | o caminho alternativo, com um servidor nosso |
| `db/` | a base de dados e as regras de negócio da fase 1 |
