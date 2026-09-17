# FleetCV

Controlo de frotas para Cabo Verde. Prova **onde o carro andou** e **quanto gastou
realmente em combustível** — sem instalar rastreador, só com o telemóvel do motorista.

**Primeiro mercado:** proprietários de táxis (6–20 viaturas).
Depois: rent-a-car e carros de serviço de instituições.

## Estado

**Fase 0 — Especificação.** Ainda não há código.

👉 **[SPEC.md](SPEC.md)** — a fonte da verdade do projecto: regras, modelo de dados,
alertas, anti-fraude, arquitectura e plano de fases.

## Fases

| Fase | O que é | Estado |
|---|---|---|
| 0 | Especificação | 🔄 em revisão |
| 1 | Base de dados + regras + testes | ⏳ |
| 2 | Painel do dono (web) | ⏳ |
| 3 | App do motorista (Android) | ⏳ |
| 4 | Piloto com 1 carro, 14 dias | ⏳ |
| 5 | Alargar a 3–5 carros | ⏳ |

## Stack previsto

App Flutter (Android) · Supabase (Postgres) · Next.js + MapLibre (painel) ·
Google ML Kit no telemóvel (leitura de quadrante e talões, offline)
