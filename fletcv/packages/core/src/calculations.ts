import type { FuelRecord, Shift } from "./types.js";

/**
 * The automatic calculations that are FletCV's core value (PRD §6, step 6):
 * km travelled, consumption (km per litre) and cost per km. Getting these
 * right is what lets a manager — or the Tribunal de Contas — trust the numbers,
 * so they live here, pure and unit-tested, and nowhere else.
 */

export interface FuelTotals {
  liters: number;
  costCents: number;
  fuellings: number;
}

export function sumFuel(records: readonly FuelRecord[]): FuelTotals {
  return records.reduce<FuelTotals>(
    (acc, r) => ({
      liters: acc.liters + r.liters,
      costCents: acc.costCents + r.costCents,
      fuellings: acc.fuellings + 1,
    }),
    { liters: 0, costCents: 0, fuellings: 0 },
  );
}

/** Km travelled during a shift. Undefined until the shift has a final reading. */
export function shiftDistanceKm(shift: Shift): number | undefined {
  if (shift.endOdometerKm === undefined) return undefined;
  return round2(shift.endOdometerKm - shift.startOdometerKm);
}

export interface ShiftSummary {
  shiftId: string;
  distanceKm?: number;
  durationMs?: number;
  fuel: FuelTotals;
  /** Consumption in km per litre. Undefined when it cannot be computed. */
  kmPerLiter?: number;
  /** Litres per 100km — the common European metric. */
  litersPer100Km?: number;
  /** Fuel cost per km, in cents (CVE). */
  costPerKmCents?: number;
}

/**
 * Summarise a single shift from its fuel records. `records` should be the
 * fuellings attributed to the shift; the caller decides that attribution.
 */
export function summarizeShift(shift: Shift, records: readonly FuelRecord[]): ShiftSummary {
  const distanceKm = shiftDistanceKm(shift);
  const fuel = sumFuel(records);
  const durationMs = shift.endedAt
    ? new Date(shift.endedAt).getTime() - new Date(shift.startedAt).getTime()
    : undefined;

  const summary: ShiftSummary = { shiftId: shift.id, fuel };
  if (distanceKm !== undefined) summary.distanceKm = distanceKm;
  if (durationMs !== undefined) summary.durationMs = durationMs;

  if (distanceKm !== undefined && distanceKm > 0) {
    if (fuel.liters > 0) {
      summary.kmPerLiter = round2(distanceKm / fuel.liters);
      summary.litersPer100Km = round2((fuel.liters / distanceKm) * 100);
    }
    if (fuel.costCents > 0) {
      summary.costPerKmCents = Math.round(fuel.costCents / distanceKm);
    }
  }
  return summary;
}

export interface PeriodAggregate {
  distanceKm: number;
  fuel: FuelTotals;
  shifts: number;
  kmPerLiter?: number;
  litersPer100Km?: number;
  costPerKmCents?: number;
}

/**
 * Aggregate several shift summaries into a period total (per driver, per
 * vehicle, per department, per day/week/month — PRD §6, step 7). Consumption
 * and cost/km are recomputed from the pooled totals, not averaged, so a long
 * cheap trip is not diluted by a short expensive one.
 */
export function aggregatePeriod(summaries: readonly ShiftSummary[]): PeriodAggregate {
  const distanceKm = round2(summaries.reduce((s, x) => s + (x.distanceKm ?? 0), 0));
  const fuel = summaries.reduce<FuelTotals>(
    (acc, x) => ({
      liters: acc.liters + x.fuel.liters,
      costCents: acc.costCents + x.fuel.costCents,
      fuellings: acc.fuellings + x.fuel.fuellings,
    }),
    { liters: 0, costCents: 0, fuellings: 0 },
  );

  const agg: PeriodAggregate = { distanceKm, fuel, shifts: summaries.length };
  if (distanceKm > 0) {
    if (fuel.liters > 0) {
      agg.kmPerLiter = round2(distanceKm / fuel.liters);
      agg.litersPer100Km = round2((fuel.liters / distanceKm) * 100);
    }
    if (fuel.costCents > 0) {
      agg.costPerKmCents = Math.round(fuel.costCents / distanceKm);
    }
  }
  return agg;
}

/** Round to 2 decimals, avoiding negative-zero and binary-float noise. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100 + 0;
}
