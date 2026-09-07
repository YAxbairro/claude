# apps/ — client surfaces (planned)

These are the two user-facing apps described in the PRD. They are **not yet
built**; this note captures their intended shape so the next iteration can start
from a clear design. Both import `@fletcv/core` so the shift rules and
km/fuel/cost maths are identical to the API.

## `apps/driver` — Expo (React Native)

The phone app the condutor uses (PRD §6).

- **Start/end shift**: capture km by photo (foto do quadrante) or manual entry,
  then `startShift` / `endShift` from `@fletcv/core` locally before syncing.
- **Background GPS**: `expo-location` background task buffers `LocationPing`s
  during an open shift and batches them to `POST .../pings`.
- **Fuelling**: camera for the receipt/pump photo + litros/custo/km form,
  validated with `recordFuelling` before it leaves the device.
- **Offline-first**: a local SQLite mutation queue keyed on client-generated
  UUIDs; on reconnect, replay queued upserts (idempotent server-side). On
  launch, `isResumable` detects a shift left open (dead battery) and prompts for
  confirmation/correction (PRD §7).

## `apps/dashboard` — React + Vite (web)

The manager painel (PRD §6, step 7).

- **Live map** of active cars from `GET /orgs/:orgId/map` (localização, em rota,
  parado).
- **Shift detail**: route polyline + idle periods + computed summary from
  `GET /orgs/:orgId/shifts/:shiftId`.
- **Reports** per driver/vehicle/period from `GET /orgs/:orgId/reports/period`.
- **Corrections**: edit a record; each edit writes an audit entry (who, when,
  old vs new) via `@fletcv/core`'s `buildAuditEntry`.

## Institutional (later)

Requisition/approval screens, misuse-alert configuration, cost-centre reports,
PDF/Excel audit exports, documents & deadlines, and the public transparency
dashboard — all gated by the org's enabled modules (`hasModule`).
