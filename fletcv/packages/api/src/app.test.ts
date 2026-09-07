import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";

let app: FastifyInstance;

beforeEach(() => {
  app = buildApp();
});
afterEach(async () => {
  await app.close();
});

async function json(method: string, url: string, body?: unknown) {
  const res = await app.inject({ method: method as "GET", url, payload: body as object });
  return { status: res.statusCode, body: res.json() as any };
}

/** Set up an org + vehicle + driver and return their ids. */
async function seed(mode: "free" | "controlled" = "free") {
  const org = await json("POST", "/orgs", { name: "Táxis do Tio", mode });
  const vehicle = await json("POST", `/orgs/${org.body.id}/vehicles`, {
    plate: "ST-01-AA",
    fuelType: "diesel",
    initialOdometerKm: 100_000,
    tankCapacityLiters: 60,
  });
  const driver = await json("POST", `/orgs/${org.body.id}/drivers`, { name: "João" });
  return { orgId: org.body.id, vehicleId: vehicle.body.id, driverId: driver.body.id };
}

describe("health", () => {
  it("responds ok", async () => {
    const r = await json("GET", "/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});

describe("MVP flow (PRD §6, Modo Livre)", () => {
  it("runs the full núcleo flow and computes consumption + cost/km", async () => {
    const { orgId, vehicleId, driverId } = await seed();

    // Start shift
    const start = await json("POST", `/orgs/${orgId}/shifts/start`, {
      vehicleId,
      driverId,
      startOdometerKm: 100_000,
      startOdometerSource: "photo",
      startedAt: "2026-02-01T08:00:00.000Z",
    });
    expect(start.status).toBe(201);
    expect(start.body.status).toBe("open");
    const shiftId = start.body.id;

    // GPS pings during the shift (batch, as the app would sync them)
    const pings = await json("POST", `/orgs/${orgId}/shifts/${shiftId}/pings`, {
      pings: [
        { lat: 14.9, lng: -23.5, speedKmh: 40, at: "2026-02-01T08:10:00.000Z" },
        { lat: 14.91, lng: -23.51, speedKmh: 0, at: "2026-02-01T08:20:00.000Z" },
        { lat: 14.91, lng: -23.51, speedKmh: 0, at: "2026-02-01T08:40:00.000Z" },
        { lat: 14.95, lng: -23.55, speedKmh: 50, at: "2026-02-01T09:00:00.000Z" },
      ],
    });
    expect(pings.status).toBe(202);
    expect(pings.body.accepted).toBe(4);

    // Fuel up mid-shift: 20 L for 2400 CVE at 100_100 km
    const fuel = await json("POST", `/orgs/${orgId}/shifts/${shiftId}/fuel`, {
      liters: 20,
      costCents: 240_000,
      odometerKm: 100_100,
      photoRef: "s3://receipt-1.jpg",
    });
    expect(fuel.status).toBe(201);

    // End shift at 100_200 km => 200 km driven
    const end = await json("POST", `/orgs/${orgId}/shifts/${shiftId}/end`, {
      endOdometerKm: 100_200,
      endedAt: "2026-02-01T16:00:00.000Z",
    });
    expect(end.status).toBe(200);
    expect(end.body.shift.status).toBe("closed");
    // 200 km / 20 L = 10 km/L; 240000 cents / 200 km = 1200 cents/km
    expect(end.body.summary.distanceKm).toBe(200);
    expect(end.body.summary.kmPerLiter).toBe(10);
    expect(end.body.summary.costPerKmCents).toBe(1200);

    // Shift detail exposes route + idle detection
    const detail = await json("GET", `/orgs/${orgId}/shifts/${shiftId}`);
    expect(detail.body.route.points).toBe(4);
    expect(detail.body.route.idlePeriods.length).toBe(1); // the 20-min stop
    expect(detail.body.fuel).toHaveLength(1);
  });

  it("shows active cars on the live map, then removes them when the shift ends", async () => {
    const { orgId, vehicleId, driverId } = await seed();
    const start = await json("POST", `/orgs/${orgId}/shifts/start`, {
      vehicleId,
      driverId,
      startOdometerKm: 100_000,
    });
    await json("POST", `/orgs/${orgId}/shifts/${start.body.id}/pings`, {
      pings: [{ lat: 14.9, lng: -23.5, speedKmh: 30, at: "2026-02-01T08:10:00.000Z" }],
    });

    const map1 = await json("GET", `/orgs/${orgId}/map`);
    expect(map1.body.activeCount).toBe(1);
    expect(map1.body.cars[0].lastPing.lat).toBe(14.9);

    await json("POST", `/orgs/${orgId}/shifts/${start.body.id}/end`, { endOdometerKm: 100_050 });
    const map2 = await json("GET", `/orgs/${orgId}/map`);
    expect(map2.body.activeCount).toBe(0);
  });
});

describe("validation (PRD §7)", () => {
  it("rejects a final odometer below the start with a domain error code", async () => {
    const { orgId, vehicleId, driverId } = await seed();
    const start = await json("POST", `/orgs/${orgId}/shifts/start`, {
      vehicleId,
      driverId,
      startOdometerKm: 100_000,
    });
    const end = await json("POST", `/orgs/${orgId}/shifts/${start.body.id}/end`, {
      endOdometerKm: 99_000,
    });
    expect(end.status).toBe(422);
    expect(end.body.error).toBe("END_ODOMETER_BEFORE_START");
  });

  it("rejects an implausible fuelling volume", async () => {
    const { orgId, vehicleId, driverId } = await seed();
    const start = await json("POST", `/orgs/${orgId}/shifts/start`, {
      vehicleId,
      driverId,
      startOdometerKm: 100_000,
    });
    const fuel = await json("POST", `/orgs/${orgId}/shifts/${start.body.id}/fuel`, {
      liters: 500, // way above the 60 L tank
      costCents: 100_000,
      odometerKm: 100_010,
    });
    expect(fuel.status).toBe(422);
    expect(fuel.body.error).toBe("IMPLAUSIBLE_LITERS");
  });

  it("returns 400 on a malformed body", async () => {
    const { orgId } = await seed();
    const bad = await json("POST", `/orgs/${orgId}/vehicles`, { plate: "" });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe("VALIDATION");
  });
});

describe("controlled mode (PRD §5.2)", () => {
  it("blocks starting a shift without an approved requisition", async () => {
    const { orgId, vehicleId, driverId } = await seed("controlled");
    const start = await json("POST", `/orgs/${orgId}/shifts/start`, {
      vehicleId,
      driverId,
      startOdometerKm: 100_000,
    });
    expect(start.status).toBe(422);
    expect(start.body.error).toBe("REQUISITION_REQUIRED");
  });
});

describe("period report (PRD §6, step 7)", () => {
  it("aggregates cost/km per driver over a period", async () => {
    const { orgId, vehicleId, driverId } = await seed();
    async function fullShift(startKm: number, endKm: number, liters: number, costCents: number) {
      const s = await json("POST", `/orgs/${orgId}/shifts/start`, {
        vehicleId,
        driverId,
        startOdometerKm: startKm,
        startedAt: "2026-02-01T08:00:00.000Z",
      });
      await json("POST", `/orgs/${orgId}/shifts/${s.body.id}/fuel`, {
        liters,
        costCents,
        odometerKm: startKm + 1,
      });
      await json("POST", `/orgs/${orgId}/shifts/${s.body.id}/end`, {
        endOdometerKm: endKm,
        endedAt: "2026-02-01T16:00:00.000Z",
      });
    }
    await fullShift(100_000, 100_300, 20, 200_000);
    await fullShift(100_300, 100_400, 30, 300_000);

    const report = await json(
      "GET",
      `/orgs/${orgId}/reports/period?from=2026-02-01T00:00:00.000Z&to=2026-02-02T00:00:00.000Z&groupBy=driver`,
    );
    expect(report.status).toBe(200);
    expect(report.body.rows).toHaveLength(1);
    const row = report.body.rows[0];
    expect(row.groupId).toBe(driverId);
    expect(row.distanceKm).toBe(400); // 300 + 100
    expect(row.fuel.liters).toBe(50);
    expect(row.kmPerLiter).toBe(8); // pooled 400/50, not averaged
  });
});
