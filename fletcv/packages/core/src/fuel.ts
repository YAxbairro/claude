import { DomainError } from "./errors.js";
import type { FuelRecord, OdometerSource, Shift, Vehicle } from "./types.js";
import {
  type PlausibilityLimits,
  assertPlausibleCost,
  assertPlausibleLiters,
  assertValidOdometer,
} from "./validation.js";

export interface RecordFuellingInput {
  id: string;
  orgId: string;
  vehicle: Pick<Vehicle, "id" | "tankCapacityLiters">;
  liters: number;
  costCents: number;
  odometerKm: number;
  source: OdometerSource;
  recordedAt: string;
  driverId?: string;
  shift?: Shift;
  photoRef?: string;
  limits?: PlausibilityLimits;
}

/**
 * Register an abastecimento (PRD §6, step 4). Runs the plausibility checks and,
 * when tied to a shift, verifies the odometer falls within the shift's range so
 * a mistyped reading can't silently corrupt the consumption maths.
 */
export function recordFuelling(input: RecordFuellingInput): FuelRecord {
  assertPlausibleLiters(input.liters, {
    tankCapacityLiters: input.vehicle.tankCapacityLiters,
    limits: input.limits,
  });
  assertPlausibleCost(input.costCents, input.limits);
  assertValidOdometer(input.odometerKm, "km do abastecimento");

  if (input.shift) {
    const { startOdometerKm, endOdometerKm } = input.shift;
    if (input.odometerKm < startOdometerKm) {
      throw new DomainError(
        "ODOMETER_OUT_OF_RANGE",
        "Km do abastecimento é menor que o km inicial do turno.",
        { odometerKm: input.odometerKm, startOdometerKm },
      );
    }
    if (endOdometerKm !== undefined && input.odometerKm > endOdometerKm) {
      throw new DomainError(
        "ODOMETER_OUT_OF_RANGE",
        "Km do abastecimento é maior que o km final do turno.",
        { odometerKm: input.odometerKm, endOdometerKm },
      );
    }
  }

  const record: FuelRecord = {
    id: input.id,
    orgId: input.orgId,
    vehicleId: input.vehicle.id,
    liters: input.liters,
    costCents: input.costCents,
    odometerKm: input.odometerKm,
    source: input.source,
    recordedAt: input.recordedAt,
  };
  if (input.shift) record.shiftId = input.shift.id;
  if (input.driverId) record.driverId = input.driverId;
  if (input.photoRef) record.photoRef = input.photoRef;
  return record;
}
