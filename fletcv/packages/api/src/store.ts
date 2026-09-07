import type {
  AuditEntry,
  Driver,
  FuelRecord,
  LocationPing,
  Organization,
  Shift,
  Vehicle,
} from "@fletcv/core";

/**
 * Persistence boundary. The API depends only on this interface, so the
 * in-memory implementation used in tests and the MVP can be swapped for a
 * SQLite (single-node) or Postgres (institutional scale) implementation
 * without touching route logic. Every method is org-scoped for multi-tenancy.
 *
 * Writes accept whole entities and are idempotent on `id` (upsert) — this is
 * what lets the offline-first driver app replay its queued mutations after a
 * reconnection without creating duplicates (PRD §7).
 */
export interface Store {
  createOrg(org: Organization): Promise<Organization>;
  getOrg(orgId: string): Promise<Organization | undefined>;

  upsertVehicle(v: Vehicle): Promise<Vehicle>;
  getVehicle(orgId: string, id: string): Promise<Vehicle | undefined>;
  listVehicles(orgId: string): Promise<Vehicle[]>;

  upsertDriver(d: Driver): Promise<Driver>;
  getDriver(orgId: string, id: string): Promise<Driver | undefined>;
  listDrivers(orgId: string): Promise<Driver[]>;

  upsertShift(s: Shift): Promise<Shift>;
  getShift(orgId: string, id: string): Promise<Shift | undefined>;
  listShifts(orgId: string, filter?: ShiftFilter): Promise<Shift[]>;

  upsertFuel(f: FuelRecord): Promise<FuelRecord>;
  listFuelForShift(orgId: string, shiftId: string): Promise<FuelRecord[]>;
  listFuelForVehicle(orgId: string, vehicleId: string): Promise<FuelRecord[]>;

  appendPings(pings: LocationPing[]): Promise<void>;
  lastPing(shiftId: string): Promise<LocationPing | undefined>;
  listPings(shiftId: string): Promise<LocationPing[]>;

  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(orgId: string, entityId: string): Promise<AuditEntry[]>;
}

export interface ShiftFilter {
  status?: Shift["status"];
  /** Inclusive lower bound on startedAt (ISO). */
  from?: string;
  /** Exclusive upper bound on startedAt (ISO). */
  to?: string;
  driverId?: string;
  vehicleId?: string;
}

/** Simple, dependency-free store for tests and the single-tenant MVP pilot. */
export class InMemoryStore implements Store {
  private orgs = new Map<string, Organization>();
  private vehicles = new Map<string, Vehicle>();
  private drivers = new Map<string, Driver>();
  private shifts = new Map<string, Shift>();
  private fuel = new Map<string, FuelRecord>();
  private pings = new Map<string, LocationPing[]>();
  private audit: AuditEntry[] = [];

  private key(orgId: string, id: string): string {
    return `${orgId}:${id}`;
  }

  async createOrg(org: Organization): Promise<Organization> {
    this.orgs.set(org.id, org);
    return org;
  }
  async getOrg(orgId: string): Promise<Organization | undefined> {
    return this.orgs.get(orgId);
  }

  async upsertVehicle(v: Vehicle): Promise<Vehicle> {
    this.vehicles.set(this.key(v.orgId, v.id), v);
    return v;
  }
  async getVehicle(orgId: string, id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(this.key(orgId, id));
  }
  async listVehicles(orgId: string): Promise<Vehicle[]> {
    return [...this.vehicles.values()].filter((v) => v.orgId === orgId);
  }

  async upsertDriver(d: Driver): Promise<Driver> {
    this.drivers.set(this.key(d.orgId, d.id), d);
    return d;
  }
  async getDriver(orgId: string, id: string): Promise<Driver | undefined> {
    return this.drivers.get(this.key(orgId, id));
  }
  async listDrivers(orgId: string): Promise<Driver[]> {
    return [...this.drivers.values()].filter((d) => d.orgId === orgId);
  }

  async upsertShift(s: Shift): Promise<Shift> {
    this.shifts.set(this.key(s.orgId, s.id), s);
    return s;
  }
  async getShift(orgId: string, id: string): Promise<Shift | undefined> {
    return this.shifts.get(this.key(orgId, id));
  }
  async listShifts(orgId: string, filter: ShiftFilter = {}): Promise<Shift[]> {
    return [...this.shifts.values()]
      .filter((s) => s.orgId === orgId)
      .filter((s) => (filter.status ? s.status === filter.status : true))
      .filter((s) => (filter.driverId ? s.driverId === filter.driverId : true))
      .filter((s) => (filter.vehicleId ? s.vehicleId === filter.vehicleId : true))
      .filter((s) => (filter.from ? s.startedAt >= filter.from : true))
      .filter((s) => (filter.to ? s.startedAt < filter.to : true))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }

  async upsertFuel(f: FuelRecord): Promise<FuelRecord> {
    this.fuel.set(this.key(f.orgId, f.id), f);
    return f;
  }
  async listFuelForShift(orgId: string, shiftId: string): Promise<FuelRecord[]> {
    return [...this.fuel.values()].filter((f) => f.orgId === orgId && f.shiftId === shiftId);
  }
  async listFuelForVehicle(orgId: string, vehicleId: string): Promise<FuelRecord[]> {
    return [...this.fuel.values()].filter((f) => f.orgId === orgId && f.vehicleId === vehicleId);
  }

  async appendPings(pings: LocationPing[]): Promise<void> {
    for (const p of pings) {
      const arr = this.pings.get(p.shiftId) ?? [];
      arr.push(p);
      arr.sort((a, b) => a.at.localeCompare(b.at));
      this.pings.set(p.shiftId, arr);
    }
  }
  async lastPing(shiftId: string): Promise<LocationPing | undefined> {
    const arr = this.pings.get(shiftId);
    return arr && arr.length > 0 ? arr[arr.length - 1] : undefined;
  }
  async listPings(shiftId: string): Promise<LocationPing[]> {
    return [...(this.pings.get(shiftId) ?? [])];
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    this.audit.push(entry);
  }
  async listAudit(orgId: string, entityId: string): Promise<AuditEntry[]> {
    return this.audit.filter((a) => a.orgId === orgId && a.entityId === entityId);
  }
}
