import { DomainError } from "./errors.js";
import type { FuelType } from "./types.js";

/**
 * Plausibility limits (PRD §7: "limites plausíveis de litros/custo").
 *
 * These are deliberately generous — the goal is to catch fat-finger errors
 * (a fuel entry of 5000 litres, a km reading typed with an extra digit), not
 * to second-guess legitimate operations. Managers can still correct any record
 * afterwards, with an audit trail.
 */
export interface PlausibilityLimits {
  /** Max litres in a single fuelling when tank capacity is unknown. */
  maxLitersPerFuelling: number;
  /** Max cost in cents (CVE) for a single fuelling. */
  maxCostCentsPerFuelling: number;
  /** Max plausible km driven in a single shift. */
  maxKmPerShift: number;
}

export const DEFAULT_LIMITS: PlausibilityLimits = {
  maxLitersPerFuelling: 500,
  maxCostCentsPerFuelling: 5_000_000, // 50 000 CVE
  maxKmPerShift: 2_000,
};

/** A litres value is plausible when 0 < liters <= (tank ?? global cap). */
export function assertPlausibleLiters(
  liters: number,
  opts: { tankCapacityLiters?: number; limits?: PlausibilityLimits } = {},
): void {
  const limits = opts.limits ?? DEFAULT_LIMITS;
  if (!Number.isFinite(liters) || liters <= 0) {
    throw new DomainError("IMPLAUSIBLE_LITERS", "Litros deve ser um valor positivo.", { liters });
  }
  const cap = opts.tankCapacityLiters ?? limits.maxLitersPerFuelling;
  if (liters > cap) {
    throw new DomainError("IMPLAUSIBLE_LITERS", `Litros (${liters}) acima do limite plausível (${cap}).`, {
      liters,
      cap,
    });
  }
}

export function assertPlausibleCost(costCents: number, limits: PlausibilityLimits = DEFAULT_LIMITS): void {
  if (!Number.isInteger(costCents) || costCents < 0) {
    throw new DomainError("IMPLAUSIBLE_COST", "Custo deve ser um número inteiro de cêntimos não-negativo.", {
      costCents,
    });
  }
  if (costCents > limits.maxCostCentsPerFuelling) {
    throw new DomainError("IMPLAUSIBLE_COST", `Custo acima do limite plausível.`, {
      costCents,
      max: limits.maxCostCentsPerFuelling,
    });
  }
}

/** An odometer reading must be a finite, non-negative number. */
export function assertValidOdometer(km: number, field = "odometer"): void {
  if (!Number.isFinite(km) || km < 0) {
    throw new DomainError("INVALID_VALUE", `Valor de ${field} inválido.`, { km, field });
  }
}

export function isElectric(fuelType: FuelType): boolean {
  return fuelType === "electric";
}
