import { CarStatus, VehicleAnomalySeverity, VehicleAnomalyType } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, requireAgencyScope } from "../../shared/utils/authz.js";

export type AnomalyQueryInput = {
  agencyId?: string;
  carId?: string;
  type?: VehicleAnomalyType;
  severity?: VehicleAnomalySeverity;
  resolved?: boolean;
};

const anomalyInclude = {
  agency: { select: { id: true, name: true } },
  car: { select: { id: true, brand: true, model: true, registrationNumber: true, currentMileage: true, status: true } }
};

export async function ensureVehicleAnomaly(input: {
  agencyId: string;
  carId: string;
  type: VehicleAnomalyType;
  severity: VehicleAnomalySeverity;
  title: string;
  description?: string | null;
}) {
  const existing = await prisma.vehicleAnomaly.findFirst({
    where: { agencyId: input.agencyId, carId: input.carId, type: input.type, resolved: false }
  });
  if (existing) return existing;
  return prisma.vehicleAnomaly.create({ data: input });
}

export async function detectCarAnomalies(carId: string) {
  const car = await prisma.car.findFirst({ where: { id: carId, deletedAt: null } });
  if (!car) return;
  const now = new Date();
  if (car.nextOilChangeKm !== null && car.currentMileage > car.nextOilChangeKm) {
    await ensureVehicleAnomaly({ agencyId: car.agencyId, carId: car.id, type: VehicleAnomalyType.OVERDUE_OIL_CHANGE, severity: VehicleAnomalySeverity.HIGH, title: "Vidange en retard", description: `Kilometrage actuel ${car.currentMileage} km > prochaine vidange ${car.nextOilChangeKm} km.` });
  }
  if (car.nextMaintenanceKm !== null && car.currentMileage > car.nextMaintenanceKm) {
    await ensureVehicleAnomaly({ agencyId: car.agencyId, carId: car.id, type: VehicleAnomalyType.OVERDUE_MAINTENANCE, severity: VehicleAnomalySeverity.HIGH, title: "Maintenance en retard", description: `Kilometrage actuel ${car.currentMileage} km > prochain entretien ${car.nextMaintenanceKm} km.` });
  }
  if (car.insuranceExpiryDate && car.insuranceExpiryDate < now) {
    await ensureVehicleAnomaly({ agencyId: car.agencyId, carId: car.id, type: VehicleAnomalyType.INSURANCE_EXPIRED, severity: VehicleAnomalySeverity.CRITICAL, title: "Assurance expiree", description: `Assurance expiree le ${car.insuranceExpiryDate.toISOString()}.` });
  }
  if (car.technicalVisitExpiryDate && car.technicalVisitExpiryDate < now) {
    await ensureVehicleAnomaly({ agencyId: car.agencyId, carId: car.id, type: VehicleAnomalyType.TECHNICAL_INSPECTION_EXPIRED, severity: VehicleAnomalySeverity.CRITICAL, title: "Visite technique expiree", description: `Visite technique expiree le ${car.technicalVisitExpiryDate.toISOString()}.` });
  }
  if (car.status === CarStatus.INACTIVE) return;
}

export async function listAnomalies(query: AnomalyQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.vehicleAnomaly.findMany({
    where: {
      ...(agencyId ? { agencyId } : {}),
      ...(query.carId ? { carId: query.carId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.resolved !== undefined ? { resolved: query.resolved } : {})
    },
    include: anomalyInclude,
    orderBy: [{ resolved: "asc" }, { severity: "desc" }, { createdAt: "desc" }]
  });
}

export async function getAnomaly(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:read");
  const agencyId = requireAgencyScope(auth);
  const anomaly = await prisma.vehicleAnomaly.findFirst({ where: { id, ...(agencyId ? { agencyId } : {}) }, include: anomalyInclude });
  if (!anomaly) throw new AppError("Vehicle anomaly not found", 404, "VEHICLE_ANOMALY_NOT_FOUND");
  return anomaly;
}

export async function resolveAnomaly(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:update");
  await getAnomaly(id, auth);
  return prisma.vehicleAnomaly.update({ where: { id }, data: { resolved: true, resolvedAt: new Date() }, include: anomalyInclude });
}
