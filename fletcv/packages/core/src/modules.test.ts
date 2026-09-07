import { describe, expect, it } from "vitest";
import { DomainError } from "./errors.js";
import { assertModule, effectiveModules, hasModule } from "./modules.js";

describe("module gating by plan", () => {
  it("basic plan has no optional modules", () => {
    expect(effectiveModules({ plan: "basic", enabledModules: [] }).size).toBe(0);
  });

  it("institutional plan unlocks requisition approval and audit reports", () => {
    const org = { plan: "institutional" as const, enabledModules: [] };
    expect(hasModule(org, "requisition_approval")).toBe(true);
    expect(hasModule(org, "audit_reports")).toBe(true);
    expect(hasModule(org, "public_dashboard")).toBe(true);
  });

  it("a basic-plan org can have a single module switched on explicitly", () => {
    const org = { plan: "basic" as const, enabledModules: ["cost_center" as const] };
    expect(hasModule(org, "cost_center")).toBe(true);
    expect(hasModule(org, "audit_reports")).toBe(false);
  });

  it("assertModule throws MODULE_DISABLED when missing", () => {
    try {
      assertModule({ plan: "basic", enabledModules: [] }, "misuse_alerts");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(DomainError);
      expect((e as DomainError).code).toBe("MODULE_DISABLED");
    }
  });

  it("assertModule passes when the module is available", () => {
    expect(() =>
      assertModule({ plan: "institutional", enabledModules: [] }, "misuse_alerts"),
    ).not.toThrow();
  });
});
