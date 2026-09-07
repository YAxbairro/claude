/**
 * FletCV domain types.
 *
 * These describe the "núcleo fixo" (fixed core) shared by every FletCV surface:
 * the driver app, the manager dashboard and the API. Money is stored as an
 * integer number of cents (Cabo Verde escudo — CVE) to avoid floating-point
 * drift in financial totals; distances are in kilometres and volumes in litres.
 */

export type ISODateTime = string;

/** Operating mode of an organization account (PRD §5.2). */
export type OperationMode = "free" | "controlled";

/**
 * Optional modules that can be turned on/off per organization (PRD §5.3).
 * The fixed core never depends on these; they gate extra behaviour only.
 */
export type ModuleKey =
  | "requisition_approval"
  | "misuse_alerts"
  | "cost_center"
  | "audit_reports"
  | "documents_deadlines"
  | "public_dashboard"
  | "multi_driver";

export type PlanTier = "basic" | "intermediate" | "institutional";

export type FuelType = "gasoline" | "diesel" | "electric" | "lpg" | "other";

export interface Organization {
  id: string;
  name: string;
  mode: OperationMode;
  plan: PlanTier;
  /** Modules explicitly enabled for this org (beyond what the plan implies). */
  enabledModules: ModuleKey[];
  createdAt: ISODateTime;
}

export type UserRole = "manager" | "driver";

export interface User {
  id: string;
  orgId: string;
  role: UserRole;
  name: string;
  createdAt: ISODateTime;
}

export interface Vehicle {
  id: string;
  orgId: string;
  plate: string;
  label?: string;
  fuelType: FuelType;
  /** Odometer reading (km) when the vehicle was registered. */
  initialOdometerKm: number;
  /** Optional tank capacity (litres), used for plausibility validation. */
  tankCapacityLiters?: number;
  /** Optional cost-center / department id (PRD §5.3 cost_center module). */
  costCenterId?: string;
  active: boolean;
  createdAt: ISODateTime;
}

export interface Driver {
  id: string;
  orgId: string;
  /** Linked user account, when the driver logs in themselves. */
  userId?: string;
  name: string;
  licenseNumber?: string;
  active: boolean;
  createdAt: ISODateTime;
}

/**
 * A shift/turno lifecycle:
 *  - `open`         driver started the shift; GPS is tracking.
 *  - `closed`       driver ended the shift with a final odometer; totals computed.
 *  - `needs_review` shift could not be closed cleanly (e.g. dead battery) and a
 *                   manager must confirm/correct hours & km (PRD §7).
 */
export type ShiftStatus = "open" | "closed" | "needs_review";

export interface Shift {
  id: string;
  orgId: string;
  vehicleId: string;
  driverId: string;
  status: ShiftStatus;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  startOdometerKm: number;
  endOdometerKm?: number;
  /** How the start odometer was captured. */
  startOdometerSource: OdometerSource;
  endOdometerSource?: OdometerSource;
  /** Reference to the requisition that authorised this shift (controlled mode). */
  requisitionId?: string;
  /** Free-text note, e.g. why the shift needs review. */
  note?: string;
  createdAt: ISODateTime;
}

/** How an odometer value was captured (PRD §6: foto do quadrante ou manual). */
export type OdometerSource = "manual" | "photo";

export interface FuelRecord {
  id: string;
  orgId: string;
  vehicleId: string;
  /** The shift during which fuelling happened, when known. */
  shiftId?: string;
  driverId?: string;
  liters: number;
  /** Total cost in cents (CVE). */
  costCents: number;
  /** Odometer (km) at the moment of fuelling. */
  odometerKm: number;
  source: OdometerSource;
  /** Storage reference for the receipt/pump photo, when provided. */
  photoRef?: string;
  recordedAt: ISODateTime;
}

/** A single GPS sample taken during a shift (PRD §5.1 background tracking). */
export interface LocationPing {
  shiftId: string;
  lat: number;
  lng: number;
  /** Speed in km/h as reported by the device, when available. */
  speedKmh?: number;
  at: ISODateTime;
}

/** Requisition/approval flow for controlled mode (PRD §5.2 / §5.3). */
export type RequisitionStatus = "pending" | "approved" | "rejected";

export interface Requisition {
  id: string;
  orgId: string;
  vehicleId: string;
  driverId: string;
  reason: string;
  destination: string;
  requestedFor: ISODateTime;
  status: RequisitionStatus;
  decidedByUserId?: string;
  decidedAt?: ISODateTime;
  createdAt: ISODateTime;
}
