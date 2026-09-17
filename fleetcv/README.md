# FleetCV

Controlo de frotas para Cabo Verde. Prova **onde o carro andou** e **quanto gastou
realmente em combustível** — sem instalar rastreador, só com o telemóvel do motorista.

**Primeiro mercado:** proprietários de táxis (6–20 viaturas).
Depois: rent-a-car e carros de serviço de instituições.

## Estado

**Fase 1 concluída.** A lógica toda está implementada e testada, ainda sem interface.

```bash
./fleetcv/db/run.sh                              # recria a base e corre os 18 cenários
python3 fleetcv/db/demo/gerar_demo.py demo.sql   # uma semana de três táxis na Praia
psql -X -A -t -d fleetcv -f fleetcv/db/demo/exportar_painel.sql -o dados.json
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
| 2 | Painel do dono (web) | ⬅️ a seguir |
| 3 | App do motorista (Android) | ⏳ |
| 4 | Piloto com 1 carro, 14 dias | ⏳ |
| 5 | Alargar a 3–5 carros | ⏳ |

## Stack previsto

App Flutter (Android) · Supabase (Postgres) · Next.js + MapLibre (painel) ·
Google ML Kit no telemóvel (leitura de quadrante e talões, offline)
