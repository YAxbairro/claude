import { DomainError } from "./errors.js";
import type { ModuleKey, Organization, PlanTier } from "./types.js";

/**
 * Module gating (PRD §5.3 / §9). Each plan bundles a set of modules; an org can
 * additionally have specific modules switched on. The fixed core works on every
 * plan — these flags only unlock optional behaviour, so the same product scales
 * from one táxi to a whole ministry without a rewrite.
 */

export const PLAN_MODULES: Record<PlanTier, ModuleKey[]> = {
  basic: [],
  intermediate: ["cost_center", "documents_deadlines", "multi_driver"],
  institutional: [
    "requisition_approval",
    "misuse_alerts",
    "cost_center",
    "audit_reports",
    "documents_deadlines",
    "public_dashboard",
    "multi_driver",
  ],
};

/** All modules effectively available to an org (plan + explicit enables). */
export function effectiveModules(org: Pick<Organization, "plan" | "enabledModules">): Set<ModuleKey> {
  return new Set<ModuleKey>([...PLAN_MODULES[org.plan], ...org.enabledModules]);
}

export function hasModule(
  org: Pick<Organization, "plan" | "enabledModules">,
  module: ModuleKey,
): boolean {
  return effectiveModules(org).has(module);
}

/** Throw when a feature requires a module the org does not have. */
export function assertModule(
  org: Pick<Organization, "plan" | "enabledModules">,
  module: ModuleKey,
): void {
  if (!hasModule(org, module)) {
    throw new DomainError("MODULE_DISABLED", `O módulo "${module}" não está ativo nesta conta.`, {
      module,
    });
  }
}
