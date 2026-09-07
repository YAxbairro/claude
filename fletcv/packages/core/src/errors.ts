/**
 * Domain errors. A single error type with a machine-readable `code` keeps the
 * API and both clients able to react (and translate) without string matching.
 */

export type DomainErrorCode =
  | "END_ODOMETER_BEFORE_START"
  | "ODOMETER_OUT_OF_RANGE"
  | "IMPLAUSIBLE_LITERS"
  | "IMPLAUSIBLE_COST"
  | "IMPLAUSIBLE_ODOMETER_JUMP"
  | "SHIFT_NOT_OPEN"
  | "SHIFT_ALREADY_CLOSED"
  | "REQUISITION_REQUIRED"
  | "REQUISITION_NOT_APPROVED"
  | "MODULE_DISABLED"
  | "INVALID_VALUE";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  /** Extra context for the UI (e.g. the offending values). */
  readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    if (details) this.details = details;
  }
}
