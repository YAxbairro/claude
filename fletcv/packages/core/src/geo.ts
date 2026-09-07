import type { LocationPing } from "./types.js";

const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two points in kilometres (haversine).
 * Used as a sanity/estimate for route length; the authoritative distance for
 * billing is always the odometer delta, not GPS.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sum of segment lengths along an ordered list of pings (km). */
export function routeDistanceKm(pings: readonly LocationPing[]): number {
  let total = 0;
  for (let i = 1; i < pings.length; i++) {
    total += haversineKm(pings[i - 1]!, pings[i]!);
  }
  return total;
}

export interface IdlePeriod {
  from: LocationPing;
  to: LocationPing;
  durationMs: number;
}

export interface IdleOptions {
  /** A ping counts as "stopped" at/under this speed (km/h). Default 3. */
  stoppedSpeedKmh?: number;
  /** Minimum continuous stopped time to report as idle (minutes). Default 5. */
  minIdleMinutes?: number;
}

/**
 * Detect idle periods — "deteção de tempo parado (velocidade 0 por X minutos)"
 * (PRD §5.1). Each ping is classified as stopped or moving, then a maximal run
 * of consecutive stopped pings is reported when its span (first→last stopped
 * ping) meets the threshold.
 *
 * A ping is stopped when its reported speed is at/under `stoppedSpeedKmh`. When
 * speed is absent we fall back to the distance from the previous ping: barely
 * moving (<25 m) counts as stopped. The very first ping has no predecessor, so
 * without a speed reading it cannot be classified and counts as moving.
 */
export function detectIdlePeriods(
  pings: readonly LocationPing[],
  options: IdleOptions = {},
): IdlePeriod[] {
  const stoppedSpeed = options.stoppedSpeedKmh ?? 3;
  const minIdleMs = (options.minIdleMinutes ?? 5) * 60_000;

  const isStopped = (p: LocationPing, prev: LocationPing | undefined): boolean => {
    if (typeof p.speedKmh === "number") return p.speedKmh <= stoppedSpeed;
    if (!prev) return false;
    // No speed reported: treat <25 m movement between samples as stationary.
    return haversineKm(prev, p) < 0.025;
  };

  const periods: IdlePeriod[] = [];
  let runStart: LocationPing | null = null;
  let runEnd: LocationPing | null = null;

  const flush = () => {
    if (runStart && runEnd) {
      const durationMs = new Date(runEnd.at).getTime() - new Date(runStart.at).getTime();
      if (durationMs >= minIdleMs) periods.push({ from: runStart, to: runEnd, durationMs });
    }
    runStart = null;
    runEnd = null;
  };

  for (let i = 0; i < pings.length; i++) {
    const p = pings[i]!;
    if (isStopped(p, i > 0 ? pings[i - 1] : undefined)) {
      runStart ??= p;
      runEnd = p;
    } else {
      flush();
    }
  }
  flush();
  return periods;
}
