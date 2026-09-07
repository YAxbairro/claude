import { DomainError } from "./errors.js";
import type {
  OdometerSource,
  OperationMode,
  Requisition,
  Shift,
} from "./types.js";
import { DEFAULT_LIMITS, type PlausibilityLimits, assertValidOdometer } from "./validation.js";

/**
 * Shift/turno lifecycle rules. These are pure: they take the current values and
 * return the next state (or throw a DomainError). Persistence, IDs and clocks
 * are the caller's responsibility, which keeps the rules identical on the
 * driver phone (offline) and on the server.
 */

export interface StartShiftInput {
  id: string;
  orgId: string;
  vehicleId: string;
  driverId: string;
  startOdometerKm: number;
  startOdometerSource: OdometerSource;
  startedAt: string;
  mode: OperationMode;
  /** Required in controlled mode: the requisition authorising this shift. */
  requisition?: Requisition;
  note?: string;
}

/**
 * Begin a shift. In free mode the driver starts directly; in controlled mode an
 * approved requisition for the same vehicle & driver is required first
 * (PRD §5.2).
 */
export function startShift(input: StartShiftInput): Shift {
  assertValidOdometer(input.startOdometerKm, "km inicial");

  if (input.mode === "controlled") {
    const req = input.requisition;
    if (!req) {
      throw new DomainError("REQUISITION_REQUIRED", "Modo controlado exige requisição aprovada.");
    }
    if (req.status !== "approved") {
      throw new DomainError("REQUISITION_NOT_APPROVED", "A requisição não está aprovada.", {
        status: req.status,
      });
    }
    if (req.vehicleId !== input.vehicleId || req.driverId !== input.driverId) {
      throw new DomainError("REQUISITION_NOT_APPROVED", "Requisição não corresponde ao veículo/condutor.");
    }
  }

  const shift: Shift = {
    id: input.id,
    orgId: input.orgId,
    vehicleId: input.vehicleId,
    driverId: input.driverId,
    status: "open",
    startedAt: input.startedAt,
    startOdometerKm: input.startOdometerKm,
    startOdometerSource: input.startOdometerSource,
    createdAt: input.startedAt,
  };
  if (input.requisition) shift.requisitionId = input.requisition.id;
  if (input.note) shift.note = input.note;
  return shift;
}

export interface EndShiftInput {
  endOdometerKm: number;
  endOdometerSource: OdometerSource;
  endedAt: string;
  limits?: PlausibilityLimits;
}

/**
 * Close an open shift with a final odometer reading. Enforces the two PRD §7
 * validations: km final ≥ km inicial, and a plausible per-shift distance.
 */
export function endShift(shift: Shift, input: EndShiftInput): Shift {
  if (shift.status === "closed") {
    throw new DomainError("SHIFT_ALREADY_CLOSED", "Turno já foi fechado.");
  }
  if (shift.status !== "open" && shift.status !== "needs_review") {
    throw new DomainError("SHIFT_NOT_OPEN", "Turno não está aberto.");
  }
  assertValidOdometer(input.endOdometerKm, "km final");

  if (input.endOdometerKm < shift.startOdometerKm) {
    throw new DomainError(
      "END_ODOMETER_BEFORE_START",
      "Km final não pode ser menor que o km inicial.",
      { startOdometerKm: shift.startOdometerKm, endOdometerKm: input.endOdometerKm },
    );
  }

  const limits = input.limits ?? DEFAULT_LIMITS;
  const distance = input.endOdometerKm - shift.startOdometerKm;
  if (distance > limits.maxKmPerShift) {
    throw new DomainError(
      "IMPLAUSIBLE_ODOMETER_JUMP",
      `Distância do turno (${distance} km) acima do limite plausível (${limits.maxKmPerShift} km).`,
      { distance, max: limits.maxKmPerShift },
    );
  }

  return {
    ...shift,
    status: "closed",
    endOdometerKm: input.endOdometerKm,
    endOdometerSource: input.endOdometerSource,
    endedAt: input.endedAt,
  };
}

/**
 * Flag a shift that could not be closed cleanly (PRD §7: battery died mid-shift).
 * The last known odometer/time can be attached; a manager confirms or corrects
 * it later. Only an open shift can enter review.
 */
export function markNeedsReview(shift: Shift, reason: string): Shift {
  if (shift.status !== "open") {
    throw new DomainError("SHIFT_NOT_OPEN", "Só um turno aberto pode ir para revisão.");
  }
  return { ...shift, status: "needs_review", note: reason };
}

/**
 * Whether, on app restart, this shift should prompt the driver to confirm or
 * correct hours & km (PRD §7: "app deteta 'turno aberto' e pede confirmação").
 */
export function isResumable(shift: Shift): boolean {
  return shift.status === "open" || shift.status === "needs_review";
}
