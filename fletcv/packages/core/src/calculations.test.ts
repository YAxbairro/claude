import { describe, expect, it } from "vitest";
import { aggregatePeriod, shiftDistanceKm, summarizeShift } from "./calculations.js";
import type { FuelRecord, Shift } from "./types.js";

function shift(partial: Partial<Shift> = {}): Shift {
  return {
    id: "s1",
    orgId: "o1",
    vehicleId: "v1",
    driverId: "d1",
    status: "closed",
    startedAt: "2026-01-01T08:00:00.000Z",
    endedAt: "2026-01-01T16:00:00.000Z",
    startOdometerKm: 1000,
    endOdometerKm: 1200,
    startOdometerSource: "manual",
    endOdometerSource: "manual",
    createdAt: "2026-01-01T08:00:00.000Z",
    ...partial,
  };
}

function fuel(partial: Partial<FuelRecord> = {}): FuelRecord {
  return {
    id: "f1",
    orgId: "o1",
    vehicleId: "v1",
    shiftId: "s1",
    liters: 20,
    costCents: 300_000, // 3000 CVE
    odometerKm: 1100,
    source: "manual",
    recordedAt: "2026-01-01T12:00:00.000Z",
    ...partial,
  };
}

describe("shiftDistanceKm", () => {
  it("returns the odometer delta", () => {
    expect(shiftDistanceKm(shift())).toBe(200);
  });
  it("is undefined for an open shift", () => {
    expect(shiftDistanceKm(shift({ status: "open", endOdometerKm: undefined }))).toBeUndefined();
  });
});

describe("summarizeShift", () => {
  it("computes km, consumption and cost/km", () => {
    // 200 km on 20 L for 3000 CVE => 10 km/L, 15 CVE/km
    const s = summarizeShift(shift(), [fuel()]);
    expect(s.distanceKm).toBe(200);
    expect(s.kmPerLiter).toBe(10);
    expect(s.litersPer100Km).toBe(10);
    expect(s.costPerKmCents).toBe(1500); // 300000 / 200
    expect(s.durationMs).toBe(8 * 3_600_000);
    expect(s.fuel).toEqual({ liters: 20, costCents: 300_000, fuellings: 1 });
  });

  it("sums multiple fuellings in the shift", () => {
    const s = summarizeShift(shift(), [
      fuel({ id: "f1", liters: 10, costCents: 150_000 }),
      fuel({ id: "f2", liters: 10, costCents: 150_000, odometerKm: 1150 }),
    ]);
    expect(s.fuel.liters).toBe(20);
    expect(s.fuel.costCents).toBe(300_000);
    expect(s.kmPerLiter).toBe(10);
  });

  it("omits consumption when there is no fuel", () => {
    const s = summarizeShift(shift(), []);
    expect(s.distanceKm).toBe(200);
    expect(s.kmPerLiter).toBeUndefined();
    expect(s.costPerKmCents).toBeUndefined();
  });

  it("omits consumption for a zero-distance shift", () => {
    const s = summarizeShift(shift({ endOdometerKm: 1000 }), [fuel()]);
    expect(s.distanceKm).toBe(0);
    expect(s.kmPerLiter).toBeUndefined();
  });
});

describe("aggregatePeriod", () => {
  it("recomputes ratios from pooled totals, not by averaging", () => {
    // Trip A: 300 km, 20 L. Trip B: 100 km, 20 L.
    // Pooled: 400 km / 40 L = 10 km/L (a naive average of 15 & 5 would give 10
    // here by luck, so use asymmetric numbers to prove pooling).
    const a = summarizeShift(
      shift({ id: "a", startOdometerKm: 0, endOdometerKm: 300 }),
      [fuel({ id: "fa", liters: 20, costCents: 200_000, odometerKm: 100 })],
    );
    const b = summarizeShift(
      shift({ id: "b", startOdometerKm: 0, endOdometerKm: 100 }),
      [fuel({ id: "fb", liters: 30, costCents: 300_000, odometerKm: 50 })],
    );
    const agg = aggregatePeriod([a, b]);
    expect(agg.distanceKm).toBe(400);
    expect(agg.fuel.liters).toBe(50);
    expect(agg.fuel.costCents).toBe(500_000);
    expect(agg.shifts).toBe(2);
    expect(agg.kmPerLiter).toBe(8); // 400 / 50, NOT (15+3.33)/2
    expect(agg.costPerKmCents).toBe(1250); // 500000 / 400
  });

  it("handles an empty period", () => {
    const agg = aggregatePeriod([]);
    expect(agg.distanceKm).toBe(0);
    expect(agg.shifts).toBe(0);
    expect(agg.kmPerLiter).toBeUndefined();
  });
});
