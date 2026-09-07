import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { endShift, isResumable, markNeedsReview, startShift } from "./shift.js";
import type { Requisition } from "./types.js";

const baseStart = {
  id: "s1",
  orgId: "o1",
  vehicleId: "v1",
  driverId: "d1",
  startOdometerKm: 1000,
  startOdometerSource: "manual" as const,
  startedAt: "2026-01-01T08:00:00.000Z",
};

function approvedReq(partial: Partial<Requisition> = {}): Requisition {
  return {
    id: "r1",
    orgId: "o1",
    vehicleId: "v1",
    driverId: "d1",
    reason: "Reunião",
    destination: "Praia",
    requestedFor: "2026-01-01T08:00:00.000Z",
    status: "approved",
    createdAt: "2026-01-01T07:00:00.000Z",
    ...partial,
  };
}

describe("startShift — free mode", () => {
  it("starts directly without a requisition", () => {
    const s = startShift({ ...baseStart, mode: "free" });
    expect(s.status).toBe("open");
    expect(s.startOdometerKm).toBe(1000);
    expect(s.requisitionId).toBeUndefined();
  });

  it("rejects an invalid start odometer", () => {
    expect(() => startShift({ ...baseStart, startOdometerKm: -5, mode: "free" })).toThrow(DomainError);
  });
});

describe("startShift — controlled mode", () => {
  it("requires a requisition", () => {
    expect(() => startShift({ ...baseStart, mode: "controlled" })).toThrowError(
      /requisição aprovada/i,
    );
  });

  it("rejects a pending requisition", () => {
    try {
      startShift({ ...baseStart, mode: "controlled", requisition: approvedReq({ status: "pending" }) });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(DomainError);
      expect((e as DomainError).code).toBe("REQUISITION_NOT_APPROVED");
    }
  });

  it("rejects a requisition for a different vehicle", () => {
    expect(() =>
      startShift({ ...baseStart, mode: "controlled", requisition: approvedReq({ vehicleId: "other" }) }),
    ).toThrow(DomainError);
  });

  it("starts with a matching approved requisition and links it", () => {
    const s = startShift({ ...baseStart, mode: "controlled", requisition: approvedReq() });
    expect(s.status).toBe("open");
    expect(s.requisitionId).toBe("r1");
  });
});

describe("endShift", () => {
  const open = () => startShift({ ...baseStart, mode: "free" });

  it("closes a shift and records the final reading", () => {
    const s = endShift(open(), {
      endOdometerKm: 1200,
      endOdometerSource: "photo",
      endedAt: "2026-01-01T16:00:00.000Z",
    });
    expect(s.status).toBe("closed");
    expect(s.endOdometerKm).toBe(1200);
    expect(s.endOdometerSource).toBe("photo");
  });

  it("rejects a final odometer below the start", () => {
    try {
      endShift(open(), { endOdometerKm: 900, endOdometerSource: "manual", endedAt: "2026-01-01T16:00:00.000Z" });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as DomainError).code).toBe("END_ODOMETER_BEFORE_START");
    }
  });

  it("allows a zero-distance shift (start === end)", () => {
    const s = endShift(open(), {
      endOdometerKm: 1000,
      endOdometerSource: "manual",
      endedAt: "2026-01-01T16:00:00.000Z",
    });
    expect(s.status).toBe("closed");
    expect(s.endOdometerKm).toBe(1000);
  });

  it("rejects an implausible distance", () => {
    try {
      endShift(open(), { endOdometerKm: 99_999, endOdometerSource: "manual", endedAt: "2026-01-01T16:00:00.000Z" });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as DomainError).code).toBe("IMPLAUSIBLE_ODOMETER_JUMP");
    }
  });

  it("refuses to close an already-closed shift", () => {
    const closed = endShift(open(), {
      endOdometerKm: 1200,
      endOdometerSource: "manual",
      endedAt: "2026-01-01T16:00:00.000Z",
    });
    expect(() =>
      endShift(closed, { endOdometerKm: 1300, endOdometerSource: "manual", endedAt: "2026-01-01T17:00:00.000Z" }),
    ).toThrow(DomainError);
  });

  it("can close a shift that was flagged for review", () => {
    const review = markNeedsReview(open(), "bateria acabou");
    const s = endShift(review, {
      endOdometerKm: 1150,
      endOdometerSource: "manual",
      endedAt: "2026-01-01T15:00:00.000Z",
    });
    expect(s.status).toBe("closed");
  });
});

describe("markNeedsReview / isResumable", () => {
  it("flags an open shift for review", () => {
    const s = markNeedsReview(startShift({ ...baseStart, mode: "free" }), "sem bateria");
    expect(s.status).toBe("needs_review");
    expect(s.note).toBe("sem bateria");
    expect(isResumable(s)).toBe(true);
  });

  it("open shifts are resumable, closed ones are not", () => {
    const open = startShift({ ...baseStart, mode: "free" });
    expect(isResumable(open)).toBe(true);
    const closed = endShift(open, {
      endOdometerKm: 1100,
      endOdometerSource: "manual",
      endedAt: "2026-01-01T12:00:00.000Z",
    });
    expect(isResumable(closed)).toBe(false);
  });
});
