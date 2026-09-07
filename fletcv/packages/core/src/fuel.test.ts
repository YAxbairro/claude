import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { recordFuelling } from "./fuel.js";
import type { Shift } from "./types.js";

const vehicle = { id: "v1", tankCapacityLiters: 60 };

const base = {
  id: "f1",
  orgId: "o1",
  vehicle,
  liters: 40,
  costCents: 400_000,
  odometerKm: 1100,
  source: "manual" as const,
  recordedAt: "2026-01-01T12:00:00.000Z",
};

const openShift: Shift = {
  id: "s1",
  orgId: "o1",
  vehicleId: "v1",
  driverId: "d1",
  status: "open",
  startedAt: "2026-01-01T08:00:00.000Z",
  startOdometerKm: 1000,
  startOdometerSource: "manual",
  createdAt: "2026-01-01T08:00:00.000Z",
};

describe("recordFuelling", () => {
  it("creates a valid fuel record", () => {
    const r = recordFuelling({ ...base, driverId: "d1", photoRef: "s3://receipt.jpg" });
    expect(r.liters).toBe(40);
    expect(r.costCents).toBe(400_000);
    expect(r.photoRef).toBe("s3://receipt.jpg");
  });

  it("rejects litres above tank capacity", () => {
    try {
      recordFuelling({ ...base, liters: 80 });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as DomainError).code).toBe("IMPLAUSIBLE_LITERS");
    }
  });

  it("rejects zero or negative litres", () => {
    expect(() => recordFuelling({ ...base, liters: 0 })).toThrow(DomainError);
    expect(() => recordFuelling({ ...base, liters: -1 })).toThrow(DomainError);
  });

  it("rejects a negative or non-integer cost", () => {
    expect(() => recordFuelling({ ...base, costCents: -100 })).toThrow(DomainError);
    expect(() => recordFuelling({ ...base, costCents: 12.5 })).toThrow(DomainError);
  });

  it("attributes fuelling to a shift and validates the odometer is in range", () => {
    const r = recordFuelling({ ...base, odometerKm: 1050, shift: openShift });
    expect(r.shiftId).toBe("s1");
  });

  it("rejects a fuelling odometer below the shift start", () => {
    try {
      recordFuelling({ ...base, odometerKm: 999, shift: openShift });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as DomainError).code).toBe("ODOMETER_OUT_OF_RANGE");
    }
  });

  it("rejects a fuelling odometer above a closed shift's end", () => {
    const closed: Shift = { ...openShift, status: "closed", endOdometerKm: 1200 };
    expect(() => recordFuelling({ ...base, odometerKm: 1300, shift: closed })).toThrow(DomainError);
  });

  it("without a tank capacity, falls back to the global litres cap", () => {
    const r = recordFuelling({ ...base, vehicle: { id: "v1" }, liters: 300 });
    expect(r.liters).toBe(300);
    expect(() => recordFuelling({ ...base, vehicle: { id: "v1" }, liters: 600 })).toThrow(DomainError);
  });
});
