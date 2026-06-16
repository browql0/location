import { AuditAction, MaintenanceStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, assertSameAgency, requireAgencyForCreate, requireAgencyScope } from "../../shared/utils/authz.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { detectCarAnomalies } from "../vehicle-anomalies/vehicle-anomaly.service.js";
import type { CompleteMaintenanceInput, CreateMaintenanceInput, MaintenanceQueryInput, UpdateMaintenanceInput } from "./maintenance.schemas.js";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const maintenanceInclude = {
  agency: { select: { id: true, name: true } },
  car: { select: { id: true, brand: true, model: true, registrationNumber: true, currentMileage: true } },
  documents: { orderBy: { createdAt: "desc" as const } }
};

async function assertCarInAgency(carId: string, agencyId: string) {
  const car = await prisma.car.findFirst({ where: { id: carId, agencyId, deletedAt: null } });
  if (!car) throw new AppError("Car not found", 404, "CAR_NOT_FOUND");
  return car;
}

async function getScopedMaintenance(id: string, auth: AuthContext) {
  const agencyId = requireAgencyScope(auth);
  const record = await prisma.maintenanceRecord.findFirst({
    where: { id, deletedAt: null, ...(agencyId ? { agencyId } : {}) },
    include: maintenanceInclude
  });
  if (!record) throw new AppError("Maintenance record not found", 404, "MAINTENANCE_NOT_FOUND");
  return record;
}

function auditMeta(record: { id: string; agencyId: string; carId: string; type: unknown; status: unknown }, extra: Record<string, string | number | boolean | null> = {}) {
  return { maintenanceId: record.id, agencyId: record.agencyId, carId: record.carId, type: String(record.type), status: String(record.status), ...extra };
}

export async function listMaintenance(query: MaintenanceQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.maintenanceRecord.findMany({
    where: {
      deletedAt: null,
      ...(agencyId ? { agencyId } : {}),
      ...(query.carId ? { carId: query.carId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to ? { scheduledDate: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { vendor: { contains: query.search, mode: "insensitive" } },
              { car: { registrationNumber: { contains: query.search, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: maintenanceInclude,
    orderBy: { scheduledDate: "desc" },
    ...paginationArgs(query)
  });
}

export async function createMaintenance(input: CreateMaintenanceInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:create");
  const agencyId = requireAgencyForCreate(auth, input.agencyId, "MAINTENANCE_AGENCY_REQUIRED");
  await assertCarInAgency(input.carId, agencyId);
  const record = await prisma.maintenanceRecord.create({
    data: {
      agencyId,
      carId: input.carId,
      type: input.type,
      status: input.status,
      title: input.title,
      description: input.description ?? null,
      scheduledDate: input.scheduledDate,
      completedDate: input.completedDate ?? null,
      mileageAtService: input.mileageAtService ?? null,
      cost: input.cost ?? null,
      vendor: input.vendor ?? null,
      notes: input.notes ?? null,
      createdBy: auth.userId
    },
    include: maintenanceInclude
  });
  await createAuditLog({ action: AuditAction.CREATE, entity: "MaintenanceRecord", entityId: record.id, userId: auth.userId, agencyId, metadata: { event: "maintenance_created", ...auditMeta(record) }, ...meta });
  return record;
}

export async function getMaintenance(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:read");
  return getScopedMaintenance(id, auth);
}

export async function updateMaintenance(id: string, input: UpdateMaintenanceInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:update");
  const current = await getScopedMaintenance(id, auth);
  if (input.carId) await assertCarInAgency(input.carId, current.agencyId);
  const updated = await prisma.maintenanceRecord.update({
    where: { id },
    data: {
      carId: input.carId,
      type: input.type,
      status: input.status,
      title: input.title,
      description: input.description === undefined ? undefined : input.description ?? null,
      scheduledDate: input.scheduledDate,
      completedDate: input.completedDate === undefined ? undefined : input.completedDate ?? null,
      mileageAtService: input.mileageAtService === undefined ? undefined : input.mileageAtService ?? null,
      cost: input.cost === undefined ? undefined : input.cost ?? null,
      vendor: input.vendor === undefined ? undefined : input.vendor ?? null,
      notes: input.notes === undefined ? undefined : input.notes ?? null
    },
    include: maintenanceInclude
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "MaintenanceRecord", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "maintenance_updated", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function startMaintenance(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:update");
  await getScopedMaintenance(id, auth);
  const updated = await prisma.maintenanceRecord.update({ where: { id }, data: { status: MaintenanceStatus.IN_PROGRESS }, include: maintenanceInclude });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "MaintenanceRecord", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "maintenance_started", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function completeMaintenance(id: string, input: CompleteMaintenanceInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:update");
  const current = await getScopedMaintenance(id, auth);
  const completedDate = input.completedDate ?? new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedDate,
        mileageAtService: input.mileageAtService ?? current.mileageAtService,
        cost: input.cost === undefined ? current.cost : input.cost,
        notes: input.notes === undefined ? current.notes : input.notes
      },
      include: maintenanceInclude
    });
    if (input.mileageAtService !== undefined && input.mileageAtService !== null) {
      await tx.car.update({ where: { id: record.carId }, data: { currentMileage: input.mileageAtService, mileage: input.mileageAtService } });
      await tx.vehicleMileageLog.create({ data: { agencyId: record.agencyId, carId: record.carId, mileage: input.mileageAtService, loggedAt: completedDate, note: `Maintenance ${record.title}` } });
    }
    return record;
  });
  await detectCarAnomalies(updated.carId);
  await createAuditLog({ action: AuditAction.UPDATE, entity: "MaintenanceRecord", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "maintenance_completed", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function cancelMaintenance(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:update");
  await getScopedMaintenance(id, auth);
  const updated = await prisma.maintenanceRecord.update({ where: { id }, data: { status: MaintenanceStatus.CANCELLED }, include: maintenanceInclude });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "MaintenanceRecord", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "maintenance_cancelled", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function deleteMaintenance(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:delete");
  const current = await getScopedMaintenance(id, auth);
  const updated = await prisma.maintenanceRecord.update({ where: { id }, data: { deletedAt: new Date() }, include: maintenanceInclude });
  await createAuditLog({ action: AuditAction.DELETE, entity: "MaintenanceRecord", entityId: id, userId: auth.userId, agencyId: current.agencyId, metadata: { event: "maintenance_deleted", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function calendar(query: MaintenanceQueryInput, auth: AuthContext) {
  const records = await listMaintenance(query, auth);
  return records.map((record) => ({
    id: record.id,
    title: `${record.car.registrationNumber} - ${record.title}`,
    start: record.scheduledDate,
    end: record.completedDate ?? record.scheduledDate,
    status: record.status,
    maintenance: record
  }));
}

async function getScopedDocument(id: string, auth: AuthContext) {
  const document = await prisma.maintenanceDocument.findUnique({ where: { id }, include: { maintenance: true } });
  if (!document || document.maintenance.deletedAt) throw new AppError("Maintenance document not found", 404, "MAINTENANCE_DOCUMENT_NOT_FOUND");
  assertSameAgency(document.maintenance.agencyId, auth, "MAINTENANCE_DOCUMENT_NOT_FOUND");
  return document;
}

export async function addDocument(id: string, file: Express.Multer.File | undefined, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "maintenance:update");
  const record = await getScopedMaintenance(id, auth);
  if (!file) throw new AppError("Document file is required", 400, "MAINTENANCE_DOCUMENT_REQUIRED");
  const saved = await FileStorageService.saveFile(file, { agencyId: record.agencyId, maintenanceId: record.id });
  const document = await prisma.maintenanceDocument.create({
    data: { maintenanceId: record.id, fileName: file.originalname, mimeType: file.mimetype, size: file.size, storageKey: saved.storageKey }
  });
  await createAuditLog({ action: AuditAction.CREATE, entity: "MaintenanceDocument", entityId: document.id, userId: auth.userId, agencyId: record.agencyId, metadata: { event: "maintenance_document_uploaded", maintenanceId: record.id, documentId: document.id }, ...meta });
  return document;
}

export async function downloadDocument(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:read");
  const document = await getScopedDocument(id, auth);
  return { document, stream: await FileStorageService.getFileStream(document.storageKey) };
}

export async function deleteDocument(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "maintenance:update");
  const document = await getScopedDocument(id, auth);
  const deleted = await prisma.maintenanceDocument.delete({ where: { id } });
  try {
    await FileStorageService.deleteFile(document.storageKey);
  } catch (error) {
    console.warn("Maintenance document deletion failed:", error);
  }
  return deleted;
}
