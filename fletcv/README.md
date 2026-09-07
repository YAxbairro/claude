# FletCV

Phone-based fleet management for Cabo Verde — control routes, shifts, fuel and
kilometres in real time, with no dedicated GPS hardware. Designed to scale from
a 5-taxi business up to a public institution by turning modules on and off on a
fixed core.

See [`docs/PRD.md`](docs/PRD.md) for the product spec and
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the technical design and status.

## What's in this repo

A pnpm/TypeScript monorepo. The MVP núcleo (fixed core) and a backend API are
implemented and tested; the mobile app and dashboard are planned (see
`apps/README.md`).

```
fletcv/
├── packages/
│   ├── core/     @fletcv/core — pure domain: shift FSM, km/fuel/cost maths,
│   │             validations, idle detection, audit, module gating (47 tests)
│   └── api/      @fletcv/api — Fastify + zod REST API over the core (8 tests)
├── apps/         driver (Expo) & dashboard (React+Vite) — planned scaffolds
└── docs/PRD.md   product requirements
```

## Quick start

```bash
# Node 22+, pnpm 9+
pnpm install
pnpm -r test        # run all tests (55 passing)
pnpm -r typecheck   # strict typecheck
pnpm -r build       # compile

# run the API
pnpm --filter @fletcv/api build && pnpm --filter @fletcv/api start
# → FletCV API listening on http://0.0.0.0:3000  (PORT env to change)
```

## Try the MVP flow against the API

```bash
BASE=http://localhost:3000

# 1. Manager creates the account (Modo Livre by default)
ORG=$(curl -s -X POST $BASE/orgs -d '{"name":"Táxis do Tio"}' -H 'content-type: application/json')
OID=$(echo "$ORG" | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# 2. Add a vehicle and a driver
VID=$(curl -s -X POST $BASE/orgs/$OID/vehicles -H 'content-type: application/json' \
  -d '{"plate":"ST-01-AA","fuelType":"diesel","initialOdometerKm":100000,"tankCapacityLiters":60}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')
DID=$(curl -s -X POST $BASE/orgs/$OID/drivers -H 'content-type: application/json' \
  -d '{"name":"João"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# 3. Start a shift
SID=$(curl -s -X POST $BASE/orgs/$OID/shifts/start -H 'content-type: application/json' \
  -d "{\"vehicleId\":\"$VID\",\"driverId\":\"$DID\",\"startOdometerKm\":100000}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# 4. Fuel up mid-shift (20 L, 2400 CVE = 240000 cents)
curl -s -X POST $BASE/orgs/$OID/shifts/$SID/fuel -H 'content-type: application/json' \
  -d '{"liters":20,"costCents":240000,"odometerKm":100100}'

# 5. End the shift → automatic km / consumption / cost-per-km
curl -s -X POST $BASE/orgs/$OID/shifts/$SID/end -H 'content-type: application/json' \
  -d '{"endOdometerKm":100200}'
# → summary: { distanceKm: 200, kmPerLiter: 10, costPerKmCents: 1200, ... }
```

## Status

Implemented and tested: vehicles/drivers, start/end shift with km validation,
fuelling with plausibility checks, automatic km/consumption/cost-per-km, GPS
route + idle detection, live map, period reports, free/controlled-mode gating,
and plan/module feature flags. See the status table in `ARCHITECTURE.md`.
