import { describe, expect, it } from "vitest";
import { detectIdlePeriods, haversineKm, routeDistanceKm } from "./geo.js";
import type { LocationPing } from "./types.js";

function ping(min: number, opts: Partial<LocationPing> = {}): LocationPing {
  return {
    shiftId: "s1",
    lat: 14.9177,
    lng: -23.5092, // Praia, Cabo Verde
    at: new Date(Date.UTC(2026, 0, 1, 8, min, 0)).toISOString(),
    ...opts,
  };
}

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(haversineKm({ lat: 14.9, lng: -23.5 }, { lat: 14.9, lng: -23.5 })).toBeCloseTo(0, 6);
  });

  it("matches a known distance (Praia ↔ Mindelo ≈ 230 km)", () => {
    const praia = { lat: 14.9177, lng: -23.5092 };
    const mindelo = { lat: 16.8901, lng: -24.9804 };
    expect(haversineKm(praia, mindelo)).toBeGreaterThan(220);
    expect(haversineKm(praia, mindelo)).toBeLessThan(280);
  });
});

describe("routeDistanceKm", () => {
  it("is 0 for fewer than two points", () => {
    expect(routeDistanceKm([])).toBe(0);
    expect(routeDistanceKm([ping(0)])).toBe(0);
  });

  it("sums segments", () => {
    const pings = [
      ping(0, { lat: 14.9, lng: -23.5 }),
      ping(1, { lat: 14.91, lng: -23.5 }),
      ping(2, { lat: 14.92, lng: -23.5 }),
    ];
    expect(routeDistanceKm(pings)).toBeCloseTo(haversineKm(pings[0]!, pings[1]!) * 2, 4);
  });
});

describe("detectIdlePeriods", () => {
  it("reports a stop of at least the threshold using reported speed", () => {
    const pings = [
      ping(0, { speedKmh: 40 }),
      ping(2, { speedKmh: 0 }),
      ping(4, { speedKmh: 0 }),
      ping(9, { speedKmh: 0 }), // stopped 2..9 => 7 min
      ping(11, { speedKmh: 50 }),
    ];
    const idle = detectIdlePeriods(pings, { minIdleMinutes: 5, stoppedSpeedKmh: 3 });
    expect(idle).toHaveLength(1);
    expect(idle[0]!.durationMs).toBe(7 * 60_000);
  });

  it("ignores stops shorter than the threshold", () => {
    const pings = [ping(0, { speedKmh: 40 }), ping(2, { speedKmh: 0 }), ping(4, { speedKmh: 40 })];
    expect(detectIdlePeriods(pings, { minIdleMinutes: 5 })).toHaveLength(0);
  });

  it("detects a trailing stop that runs to the end of the shift", () => {
    const pings = [ping(0, { speedKmh: 40 }), ping(3, { speedKmh: 0 }), ping(10, { speedKmh: 0 })];
    const idle = detectIdlePeriods(pings, { minIdleMinutes: 5 });
    expect(idle).toHaveLength(1);
  });

  it("falls back to distance when speed is absent", () => {
    // Same coordinates from min 3 to min 9 => 6 min stationary, even without
    // speed. (The first ping has no predecessor, so it counts as moving.)
    const pings = [
      ping(0, { lat: 14.9, lng: -23.5 }),
      ping(3, { lat: 14.9, lng: -23.5 }),
      ping(6, { lat: 14.9, lng: -23.5 }),
      ping(9, { lat: 14.9, lng: -23.5 }),
      ping(11, { lat: 14.95, lng: -23.5 }),
    ];
    const idle = detectIdlePeriods(pings, { minIdleMinutes: 5 });
    expect(idle).toHaveLength(1);
    expect(idle[0]!.durationMs).toBe(6 * 60_000);
  });
});
