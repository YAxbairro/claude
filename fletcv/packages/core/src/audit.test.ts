import { describe, expect, it } from "vitest";
import { buildAuditEntry, diffFields } from "./audit.js";

describe("diffFields", () => {
  it("returns only the fields that actually changed", () => {
    const before = { startOdometerKm: 1000, endOdometerKm: 1200, note: "x" };
    const after = { endOdometerKm: 1250, note: "x" };
    const changes = diffFields(before, after, ["startOdometerKm", "endOdometerKm", "note"]);
    expect(changes).toEqual([{ field: "endOdometerKm", oldValue: 1200, newValue: 1250 }]);
  });

  it("ignores fields absent from the patch", () => {
    const before = { a: 1, b: 2 };
    expect(diffFields(before, { a: 9 }, ["a", "b"])).toEqual([
      { field: "a", oldValue: 1, newValue: 9 },
    ]);
  });
});

describe("buildAuditEntry", () => {
  it("captures who/when/old-vs-new for a correction", () => {
    const entry = buildAuditEntry({
      id: "a1",
      orgId: "o1",
      entityType: "shift",
      entityId: "s1",
      changedByUserId: "u-manager",
      changedAt: "2026-01-02T09:00:00.000Z",
      before: { endOdometerKm: 1200 },
      after: { endOdometerKm: 1250 },
      fields: ["endOdometerKm"],
      reason: "Condutor reportou km final errado",
    });
    expect(entry).not.toBeNull();
    expect(entry!.changedByUserId).toBe("u-manager");
    expect(entry!.changes).toHaveLength(1);
    expect(entry!.reason).toBe("Condutor reportou km final errado");
  });

  it("returns null when nothing changed (no empty edits persisted)", () => {
    const entry = buildAuditEntry({
      id: "a1",
      orgId: "o1",
      entityType: "fuel_record",
      entityId: "f1",
      changedByUserId: "u1",
      changedAt: "2026-01-02T09:00:00.000Z",
      before: { liters: 40 },
      after: { liters: 40 },
      fields: ["liters"],
    });
    expect(entry).toBeNull();
  });
});
