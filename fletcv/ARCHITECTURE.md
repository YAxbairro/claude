# FletCV — Architecture

This document explains how the codebase realises the PRD's "núcleo fixo +
módulos opcionais" idea, and why the stack was chosen.

## The core idea: one set of rules, three surfaces

FletCV has three runtime surfaces — a **driver phone app**, a **manager
dashboard**, and a **backend API**. All three need to agree on the same rules:
what a valid shift is, how km/consumption/cost are computed, when a stop counts
as "parado", which modules a plan unlocks.

If those rules were reimplemented per surface, they would drift — and for a
product whose whole value is *trustworthy numbers for auditing public spending*,
drift is fatal. So the rules live once, in a pure TypeScript package
(`@fletcv/core`), imported by everything else.

```
                    ┌─────────────────────┐
                    │   @fletcv/core      │  pure domain, no I/O
                    │  rules · maths ·    │  (fully unit-tested)
                    │  validations · FSM  │
                    └──────────┬──────────┘
             ┌─────────────────┼──────────────────┐
             │                 │                  │
    ┌────────▼───────┐ ┌───────▼────────┐ ┌───────▼─────────┐
    │ apps/driver    │ │ packages/api   │ │ apps/dashboard  │
    │ Expo (RN)      │ │ Fastify + zod  │ │ React + Vite    │
    │ offline-first  │ │ Store boundary │ │ map · reports   │
    └────────────────┘ └────────────────┘ └─────────────────┘
```

## Stack decisions

| Decision | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One language across phone, web and server; the domain core can be *shared code*, not a re-implementation. |
| Monorepo | pnpm workspaces | `@fletcv/core` is consumed by every package via `workspace:*`; one install, one test run. |
| Domain core | Pure functions, no I/O | Deterministic, trivially testable, runs identically offline on the phone and on the server. |
| API | Fastify + zod | Fast, small, first-class TypeScript; zod validates every request body and doubles as the schema. |
| Persistence | `Store` interface (in-memory today) | The API depends only on the interface. SQLite for the single-tenant pilot, Postgres for institutional scale — swapped without touching routes. |
| Money | integer cents (CVE) | No floating-point drift in financial totals that must reconcile for audits. |
| Distance of record | odometer delta, not GPS | GPS route length is an estimate/visual; the billable/auditable distance is always the driver's odometer reading. |

**Why not Flutter?** The dominant risk is *rules being wrong*, not UI polish. A
shared TypeScript core lets the same tested code compute consumption on the
phone (offline) and on the server, and lets us prove it correct with unit tests
in CI. Flutter would force the rules to be re-expressed in Dart on the client.

## Packages

### `packages/core` — the fixed núcleo (implemented, 47 tests)

| File | PRD ref | Responsibility |
|---|---|---|
| `types.ts` | §5.1 | Entities: Organization, User, Vehicle, Driver, Shift, FuelRecord, LocationPing, Requisition. |
| `shift.ts` | §5.2, §6, §7 | Shift state machine: `startShift` (free vs controlled), `endShift` (km validations), `markNeedsReview` (dead-battery), `isResumable`. |
| `fuel.ts` | §6 | `recordFuelling` with plausibility + in-range odometer checks. |
| `calculations.ts` | §6 | km travelled, km/L, L/100km, cost/km; per-shift summary and period aggregation (pooled totals, not averaged). |
| `geo.ts` | §5.1 | Haversine, route length, and idle-period ("tempo parado") detection. |
| `validation.ts` | §7 | Plausibility limits for litres, cost, and per-shift distance. |
| `audit.ts` | §7 | Field-level change history (who, when, old vs new) for corrections. |
| `modules.ts` | §5.3, §9 | Plan → module mapping and feature gating (`hasModule`, `assertModule`). |

### `packages/api` — backend (implemented, 8 tests)

Fastify app (`buildApp`) wiring the core to HTTP, plus a `Store` boundary with
an `InMemoryStore`. Routes cover the full MVP flow:

- `POST /orgs`, `GET /orgs/:orgId`
- `POST/GET /orgs/:orgId/vehicles`, `.../drivers`
- `POST /orgs/:orgId/shifts/start`, `.../:shiftId/end`
- `POST /orgs/:orgId/shifts/:shiftId/fuel`
- `POST /orgs/:orgId/shifts/:shiftId/pings` (batch — offline sync)
- `GET /orgs/:orgId/shifts/:shiftId` (shift + summary + route + idle periods)
- `GET /orgs/:orgId/map` (live: active cars + last position)
- `GET /orgs/:orgId/reports/period?from&to&groupBy=driver|vehicle`

Domain errors map to `422` with a machine-readable `code`; zod failures to `400`.

### `apps/driver`, `apps/dashboard` — planned scaffolds

Not yet built. See `apps/README.md` for the intended shape (Expo driver app
with an offline mutation queue keyed on client-generated UUIDs; React+Vite
dashboard consuming `/map` and `/reports`).

## Offline-first & sync (PRD §7)

- Every write accepts a **client-generated `id`** and is an **upsert**. The
  driver app generates UUIDs offline, queues mutations, and replays them on
  reconnect; replays are idempotent, so no duplicates.
- GPS pings are **batched** (`POST .../pings`) rather than streamed, matching a
  phone that buffers points while offline.
- A shift left `open` (dead battery) is detected on next launch via
  `isResumable`; the manager sees it and can correct hours/km, with the change
  recorded in the audit trail.

## Implementation status vs PRD

| PRD feature | Status |
|---|---|
| Vehicles & drivers CRUD | ✅ core + API |
| Start/end shift, km validation | ✅ core + API (tested) |
| Fuelling + plausibility checks | ✅ core + API (tested) |
| km / consumption / cost-per-km | ✅ core + API (tested) |
| GPS route + idle detection | ✅ core + API (tested) |
| Live map (active cars) | ✅ API |
| Period reports (driver/vehicle) | ✅ API |
| Free vs Controlled mode gate | ✅ core + API (start-shift gate) |
| Module/plan feature flags | ✅ core |
| Audit trail for corrections | ✅ core (API endpoints pending) |
| Requisition/approval endpoints | ⏳ core types ready; routes pending |
| Misuse alerts, cost centres, exports, docs/deadlines, public dashboard | ⏳ planned modules |
| Driver app / dashboard UIs | ⏳ scaffolds planned |
| SQLite/Postgres persistence | ⏳ `Store` interface ready for it |
| OCR of quadrante/recibo | ⏳ open question (MVP: manual + photo) |

## Roadmap

1. **Persistence** — SQLite `Store` implementation; wire `apps/dashboard`.
2. **Driver app** — Expo shell: capture km photo, start/end shift, background
   GPS, offline queue.
3. **Controlled mode** — requisition CRUD + approval endpoints.
4. **Institutional modules** — misuse alerts, cost centres, PDF/Excel audit
   exports, documents & deadlines, public transparency dashboard.
