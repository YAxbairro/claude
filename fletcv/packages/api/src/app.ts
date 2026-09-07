import { randomUUID } from "node:crypto";
import {
  DomainError,
  aggregatePeriod,
  detectIdlePeriods,
  endShift,
  recordFuelling,
  routeDistanceKm,
  startShift,
  summarizeShift,
  type Driver,
  type FuelType,
  type ModuleKey,
  type OperationMode,
  type Organization,
  type PlanTier,
  type Shift,
  type Vehicle,
} from "@fletcv/core";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { InMemoryStore, type Store } from "./store.js";

const now = () => new Date().toISOString();
const id = () => randomUUID();

const odometerSource = z.enum(["manual", "photo"]);

export interface BuildAppOptions {
  store?: Store;
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const store = options.store ?? new InMemoryStore();
  const app = Fastify({ logger: options.logger ?? false });

  // Map domain & validation failures to clean HTTP responses.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof DomainError) {
      return reply.status(422).send({ error: err.code, message: err.message, details: err.details });
    }
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "VALIDATION", issues: err.issues });
    }
    reply.log.error(err);
    const e = err as { statusCode?: number; message?: string };
    return reply.status(e.statusCode ?? 500).send({ error: "INTERNAL", message: e.message });
  });

  // Ensure the org exists; used by every org-scoped route.
  async function requireOrg(orgId: string): Promise<Organization> {
    const org = await store.getOrg(orgId);
    if (!org) throw new DomainError("INVALID_VALUE", "Organização não encontrada.", { orgId });
    return org;
  }

  app.get("/health", async () => ({ ok: true }));

  // ---- Organizations (accounts) ----------------------------------------
  const createOrgBody = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    mode: z.enum(["free", "controlled"]).default("free"),
    plan: z.enum(["basic", "intermediate", "institutional"]).default("basic"),
    enabledModules: z.array(z.string()).default([]),
  });
  app.post("/orgs", async (req, reply) => {
    const b = createOrgBody.parse(req.body);
    const org: Organization = {
      id: b.id ?? id(),
      name: b.name,
      mode: b.mode as OperationMode,
      plan: b.plan as PlanTier,
      enabledModules: b.enabledModules as ModuleKey[],
      createdAt: now(),
    };
    await store.createOrg(org);
    return reply.status(201).send(org);
  });
  app.get("/orgs/:orgId", async (req) => {
    const { orgId } = req.params as { orgId: string };
    return requireOrg(orgId);
  });

  // ---- Vehicles ---------------------------------------------------------
  const vehicleBody = z.object({
    id: z.string().optional(),
    plate: z.string().min(1),
    label: z.string().optional(),
    fuelType: z.enum(["gasoline", "diesel", "electric", "lpg", "other"]).default("gasoline"),
    initialOdometerKm: z.number().nonnegative(),
    tankCapacityLiters: z.number().positive().optional(),
    costCenterId: z.string().optional(),
  });
  app.post("/orgs/:orgId/vehicles", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    const b = vehicleBody.parse(req.body);
    const vehicle: Vehicle = {
      id: b.id ?? id(),
      orgId,
      plate: b.plate,
      fuelType: b.fuelType as FuelType,
      initialOdometerKm: b.initialOdometerKm,
      active: true,
      createdAt: now(),
      ...(b.label !== undefined ? { label: b.label } : {}),
      ...(b.tankCapacityLiters !== undefined ? { tankCapacityLiters: b.tankCapacityLiters } : {}),
      ...(b.costCenterId !== undefined ? { costCenterId: b.costCenterId } : {}),
    };
    await store.upsertVehicle(vehicle);
    return reply.status(201).send(vehicle);
  });
  app.get("/orgs/:orgId/vehicles", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    return store.listVehicles(orgId);
  });

  // ---- Drivers ----------------------------------------------------------
  const driverBody = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    licenseNumber: z.string().optional(),
    userId: z.string().optional(),
  });
  app.post("/orgs/:orgId/drivers", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    const b = driverBody.parse(req.body);
    const driver: Driver = {
      id: b.id ?? id(),
      orgId,
      name: b.name,
      active: true,
      createdAt: now(),
      ...(b.licenseNumber !== undefined ? { licenseNumber: b.licenseNumber } : {}),
      ...(b.userId !== undefined ? { userId: b.userId } : {}),
    };
    await store.upsertDriver(driver);
    return reply.status(201).send(driver);
  });
  app.get("/orgs/:orgId/drivers", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    return store.listDrivers(orgId);
  });

  // ---- Shifts -----------------------------------------------------------
  const startShiftBody = z.object({
    id: z.string().optional(),
    vehicleId: z.string(),
    driverId: z.string(),
    startOdometerKm: z.number().nonnegative(),
    startOdometerSource: odometerSource.default("manual"),
    startedAt: z.string().optional(),
    note: z.string().optional(),
  });
  app.post("/orgs/:orgId/shifts/start", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    const org = await requireOrg(orgId);
    const b = startShiftBody.parse(req.body);
    const vehicle = await store.getVehicle(orgId, b.vehicleId);
    if (!vehicle) throw new DomainError("INVALID_VALUE", "Veículo não encontrado.", { id: b.vehicleId });
    const driver = await store.getDriver(orgId, b.driverId);
    if (!driver) throw new DomainError("INVALID_VALUE", "Condutor não encontrado.", { id: b.driverId });

    const shift = startShift({
      id: b.id ?? id(),
      orgId,
      vehicleId: b.vehicleId,
      driverId: b.driverId,
      startOdometerKm: b.startOdometerKm,
      startOdometerSource: b.startOdometerSource,
      startedAt: b.startedAt ?? now(),
      mode: org.mode,
      ...(b.note !== undefined ? { note: b.note } : {}),
    });
    await store.upsertShift(shift);
    return reply.status(201).send(shift);
  });

  const endShiftBody = z.object({
    endOdometerKm: z.number().nonnegative(),
    endOdometerSource: odometerSource.default("manual"),
    endedAt: z.string().optional(),
  });
  app.post("/orgs/:orgId/shifts/:shiftId/end", async (req) => {
    const { orgId, shiftId } = req.params as { orgId: string; shiftId: string };
    await requireOrg(orgId);
    const shift = await store.getShift(orgId, shiftId);
    if (!shift) throw new DomainError("INVALID_VALUE", "Turno não encontrado.", { id: shiftId });
    const b = endShiftBody.parse(req.body);
    const closed = endShift(shift, {
      endOdometerKm: b.endOdometerKm,
      endOdometerSource: b.endOdometerSource,
      endedAt: b.endedAt ?? now(),
    });
    await store.upsertShift(closed);
    const fuel = await store.listFuelForShift(orgId, shiftId);
    return { shift: closed, summary: summarizeShift(closed, fuel) };
  });

  // ---- Fuelling ---------------------------------------------------------
  const fuelBody = z.object({
    id: z.string().optional(),
    liters: z.number().positive(),
    costCents: z.number().int().nonnegative(),
    odometerKm: z.number().nonnegative(),
    source: odometerSource.default("manual"),
    photoRef: z.string().optional(),
    recordedAt: z.string().optional(),
  });
  app.post("/orgs/:orgId/shifts/:shiftId/fuel", async (req, reply) => {
    const { orgId, shiftId } = req.params as { orgId: string; shiftId: string };
    await requireOrg(orgId);
    const shift = await store.getShift(orgId, shiftId);
    if (!shift) throw new DomainError("INVALID_VALUE", "Turno não encontrado.", { id: shiftId });
    const vehicle = await store.getVehicle(orgId, shift.vehicleId);
    if (!vehicle) throw new DomainError("INVALID_VALUE", "Veículo não encontrado.", { id: shift.vehicleId });
    const b = fuelBody.parse(req.body);
    const record = recordFuelling({
      id: b.id ?? id(),
      orgId,
      vehicle,
      liters: b.liters,
      costCents: b.costCents,
      odometerKm: b.odometerKm,
      source: b.source,
      recordedAt: b.recordedAt ?? now(),
      driverId: shift.driverId,
      shift,
      ...(b.photoRef !== undefined ? { photoRef: b.photoRef } : {}),
    });
    await store.upsertFuel(record);
    return reply.status(201).send(record);
  });

  // ---- GPS pings (batch, offline-sync) ----------------------------------
  const pingsBody = z.object({
    pings: z
      .array(
        z.object({
          lat: z.number(),
          lng: z.number(),
          speedKmh: z.number().nonnegative().optional(),
          at: z.string(),
        }),
      )
      .min(1),
  });
  app.post("/orgs/:orgId/shifts/:shiftId/pings", async (req, reply) => {
    const { orgId, shiftId } = req.params as { orgId: string; shiftId: string };
    await requireOrg(orgId);
    const shift = await store.getShift(orgId, shiftId);
    if (!shift) throw new DomainError("INVALID_VALUE", "Turno não encontrado.", { id: shiftId });
    const b = pingsBody.parse(req.body);
    await store.appendPings(
      b.pings.map((p) => ({
        shiftId,
        lat: p.lat,
        lng: p.lng,
        at: p.at,
        ...(p.speedKmh !== undefined ? { speedKmh: p.speedKmh } : {}),
      })),
    );
    return reply.status(202).send({ accepted: b.pings.length });
  });

  // ---- Shift detail (with computed route + idle + summary) --------------
  app.get("/orgs/:orgId/shifts/:shiftId", async (req) => {
    const { orgId, shiftId } = req.params as { orgId: string; shiftId: string };
    await requireOrg(orgId);
    const shift = await store.getShift(orgId, shiftId);
    if (!shift) throw new DomainError("INVALID_VALUE", "Turno não encontrado.", { id: shiftId });
    const fuel = await store.listFuelForShift(orgId, shiftId);
    const pings = await store.listPings(shiftId);
    return {
      shift,
      summary: summarizeShift(shift, fuel),
      fuel,
      route: {
        points: pings.length,
        estimatedKm: routeDistanceKm(pings),
        idlePeriods: detectIdlePeriods(pings),
      },
    };
  });

  // ---- Live map: active shifts with their last known position -----------
  app.get("/orgs/:orgId/map", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    const active = await store.listShifts(orgId, { status: "open" });
    const cars = await Promise.all(
      active.map(async (s) => ({
        shiftId: s.id,
        vehicleId: s.vehicleId,
        driverId: s.driverId,
        startedAt: s.startedAt,
        lastPing: (await store.lastPing(s.id)) ?? null,
      })),
    );
    return { activeCount: cars.length, cars };
  });

  // ---- Period report (per driver or per vehicle) ------------------------
  const reportQuery = z.object({
    from: z.string(),
    to: z.string(),
    groupBy: z.enum(["driver", "vehicle"]).default("driver"),
  });
  app.get("/orgs/:orgId/reports/period", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await requireOrg(orgId);
    const q = reportQuery.parse(req.query);
    const shifts = await store.listShifts(orgId, { from: q.from, to: q.to, status: "closed" });

    const groups = new Map<string, Shift[]>();
    for (const s of shifts) {
      const gkey = q.groupBy === "driver" ? s.driverId : s.vehicleId;
      const arr = groups.get(gkey) ?? [];
      arr.push(s);
      groups.set(gkey, arr);
    }

    const rows = await Promise.all(
      [...groups.entries()].map(async ([groupId, gshifts]) => {
        const summaries = await Promise.all(
          gshifts.map(async (s) => summarizeShift(s, await store.listFuelForShift(orgId, s.id))),
        );
        return { groupId, ...aggregatePeriod(summaries) };
      }),
    );
    return { from: q.from, to: q.to, groupBy: q.groupBy, rows };
  });

  return app;
}
