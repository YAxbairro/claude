/**
 * Audit trail for corrections (PRD §7: "histórico de alteração — quem, quando,
 * valor antigo vs novo"). Any manager edit to a record produces one entry per
 * changed field, which is what makes FletCV defensible for public-sector
 * accountability.
 */

export type AuditEntityType = "shift" | "fuel_record" | "vehicle" | "driver";

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditEntry {
  id: string;
  orgId: string;
  entityType: AuditEntityType;
  entityId: string;
  changedByUserId: string;
  changedAt: string;
  changes: FieldChange[];
  reason?: string;
}

/** Compute the shallow field-level diff between two versions of a record. */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  fields: readonly (keyof T)[],
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    if (!(field in after)) continue;
    const oldValue = before[field];
    const newValue = after[field];
    if (!Object.is(oldValue, newValue)) {
      changes.push({ field: String(field), oldValue, newValue });
    }
  }
  return changes;
}

export interface BuildAuditInput<T extends Record<string, unknown>> {
  id: string;
  orgId: string;
  entityType: AuditEntityType;
  entityId: string;
  changedByUserId: string;
  changedAt: string;
  before: T;
  after: Partial<T>;
  fields: readonly (keyof T)[];
  reason?: string;
}

/**
 * Build an audit entry for a correction, returning `null` when nothing actually
 * changed (so callers never persist empty edits).
 */
export function buildAuditEntry<T extends Record<string, unknown>>(
  input: BuildAuditInput<T>,
): AuditEntry | null {
  const changes = diffFields(input.before, input.after, input.fields);
  if (changes.length === 0) return null;
  const entry: AuditEntry = {
    id: input.id,
    orgId: input.orgId,
    entityType: input.entityType,
    entityId: input.entityId,
    changedByUserId: input.changedByUserId,
    changedAt: input.changedAt,
    changes,
  };
  if (input.reason) entry.reason = input.reason;
  return entry;
}
