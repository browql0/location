import { AuditAction, CarStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import type { Permission } from "../../shared/utils/permissions.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { PlanLimitService } from "../subscriptions/plan-limit.service.js";
import type { CarQueryInput, CreateCarDocumentInput, CreateCarInput, UpdateCarInput } from "./car.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const carInclude = {
  agency: { select: { id: true, name: true } },
  photos: { orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }] },
  documents: { orderBy: { createdAt: "desc" as const } }
};

function assertPermission(auth: AuthContext, permission: Permission) {
  if (auth.role === UserRole.SUPER_ADMIN || auth.role === UserRole.AGENCY_ADMIN) return;
  if (!auth.permissions.includes(permission)) throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
}

function agencyScope(auth: AuthContext, requestedAgencyId?: string | null) {
  if (auth.role === UserRole.SUPER_ADMIN) return requestedAgencyId ?? null;
  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  return auth.agencyId;
}

function createAgencyId(auth: AuthContext, requestedAgencyId?: string | null) {
  if (auth.role === UserRole.SUPER_ADMIN) {
    if (!requestedAgencyId) throw new AppError("Agency is required", 400, "CAR_AGENCY_REQUIRED");
    return requestedAgencyId;
  }
  if (!auth.agencyId) throw new AppError("Agency context is required", 403, "AGENCY_REQUIRED");
  return auth.agencyId;
}

async function getScopedCar(id: string, auth: AuthContext) {
  const agencyId = agencyScope(auth);
  const car = await prisma.car.findFirst({
    where: { id, deletedAt: null, ...(agencyId ? { agencyId } : {}) },
    include: carInclude
  });
  if (!car) throw new AppError("Car not found", 404, "CAR_NOT_FOUND");
  return car;
}

async function getScopedPhoto(photoId: string, auth: AuthContext) {
  const photo = await prisma.carPhoto.findUnique({ where: { id: photoId }, include: { car: true } });
  if (!photo || photo.car.deletedAt) throw new AppError("Car photo not found", 404, "CAR_PHOTO_NOT_FOUND");
  const agencyId = agencyScope(auth);
  if (agencyId && photo.car.agencyId !== agencyId) throw new AppError("Car photo not found", 404, "CAR_PHOTO_NOT_FOUND");
  return photo;
}

async function assertUniqueCar(input: { agencyId: string; registrationNumber?: string; vin?: string | null }, currentCarId?: string) {
  if (input.registrationNumber) {
    const duplicateRegistration = await prisma.car.findFirst({
      where: {
        agencyId: input.agencyId,
        registrationNumber: input.registrationNumber,
        deletedAt: null,
        ...(currentCarId ? { id: { not: currentCarId } } : {})
      }
    });
    if (duplicateRegistration) throw new AppError("Registration number is already used by this agency", 409, "CAR_REGISTRATION_ALREADY_USED");
  }

  if (input.vin) {
    const duplicateVin = await prisma.car.findFirst({
      where: { vin: input.vin, ...(currentCarId ? { id: { not: currentCarId } } : {}) }
    });
    if (duplicateVin) throw new AppError("VIN is already used", 409, "CAR_VIN_ALREADY_USED");
  }
}

export async function listCars(query: CarQueryInput, auth: AuthContext) {
  assertPermission(auth, "cars:read");
  const agencyId = agencyScope(auth, query.agencyId);
  return prisma.car.findMany({
    where: {
      deletedAt: null,
      ...(agencyId ? { agencyId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { registrationNumber: { contains: query.search, mode: "insensitive" } },
              { brand: { contains: query.search, mode: "insensitive" } },
              { model: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: carInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function createCar(input: CreateCarInput, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "cars:create");
  const agencyId = createAgencyId(auth, input.agencyId);
  await PlanLimitService.assertCanCreateCar(agencyId);
  await assertUniqueCar({ agencyId, registrationNumber: input.registrationNumber, vin: input.vin });

  const car = await prisma.car.create({
    data: {
      agencyId,
      brand: input.brand,
      model: input.model,
      year: input.year,
      registrationNumber: input.registrationNumber,
      vin: input.vin || null,
      color: input.color || null,
      fuelType: input.fuelType,
      transmission: input.transmission,
      seats: input.seats,
      dailyPrice: input.dailyPrice,
      weeklyPrice: input.weeklyPrice,
      monthlyPrice: input.monthlyPrice,
      mileage: input.mileage,
      status: input.status,
      insuranceExpiryDate: input.insuranceExpiryDate,
      technicalVisitExpiryDate: input.technicalVisitExpiryDate,
      notes: input.notes || null
    },
    include: carInclude
  });

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "Car",
    entityId: car.id,
    userId: auth.userId,
    agencyId,
    metadata: { event: "car_created", carId: car.id, registrationNumber: car.registrationNumber },
    ...meta
  });
  return car;
}

export async function getCar(id: string, auth: AuthContext) {
  assertPermission(auth, "cars:read");
  return getScopedCar(id, auth);
}

export async function updateCar(id: string, input: UpdateCarInput, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "cars:update");
  const current = await getScopedCar(id, auth);
  await assertUniqueCar({ agencyId: current.agencyId, registrationNumber: input.registrationNumber, vin: input.vin }, id);

  const updated = await prisma.car.update({
    where: { id },
    data: {
      brand: input.brand,
      model: input.model,
      year: input.year,
      registrationNumber: input.registrationNumber,
      vin: input.vin === undefined ? undefined : input.vin || null,
      color: input.color === undefined ? undefined : input.color || null,
      fuelType: input.fuelType,
      transmission: input.transmission,
      seats: input.seats,
      dailyPrice: input.dailyPrice,
      weeklyPrice: input.weeklyPrice,
      monthlyPrice: input.monthlyPrice,
      mileage: input.mileage,
      status: input.status,
      insuranceExpiryDate: input.insuranceExpiryDate,
      technicalVisitExpiryDate: input.technicalVisitExpiryDate,
      notes: input.notes === undefined ? undefined : input.notes || null
    },
    include: carInclude
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Car",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "car_updated", carId: id, registrationNumber: updated.registrationNumber },
    ...meta
  });
  return updated;
}

export async function softDeleteCar(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "cars:delete");
  const current = await getScopedCar(id, auth);
  const updated = await prisma.car.update({
    where: { id },
    data: { deletedAt: new Date(), status: CarStatus.INACTIVE },
    include: carInclude
  });
  await createAuditLog({
    action: AuditAction.DELETE,
    entity: "Car",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: {
      event: "car_deleted",
      carId: id,
      registrationNumber: updated.registrationNumber,
      oldStatus: current.status,
      newStatus: updated.status
    },
    ...meta
  });
  return updated;
}

export async function setCarStatus(id: string, status: CarStatus, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "cars:update");
  const current = await getScopedCar(id, auth);
  const updated = await prisma.car.update({ where: { id }, data: { status }, include: carInclude });
  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Car",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: {
      event: "car_status_changed",
      carId: id,
      registrationNumber: updated.registrationNumber,
      oldStatus: current.status,
      newStatus: updated.status
    },
    ...meta
  });
  return updated;
}

export async function listPhotos(carId: string, auth: AuthContext) {
  assertPermission(auth, "cars:read");
  await getScopedCar(carId, auth);
  return prisma.carPhoto.findMany({ where: { carId }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
}

export async function addPhoto(carId: string, file: Express.Multer.File | undefined, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "cars:update");
  const car = await getScopedCar(carId, auth);
  if (!file) throw new AppError("File is required", 400, "CAR_PHOTO_FILE_REQUIRED");
  const shouldBePrimary = car.photos.length === 0;
  const saved = await FileStorageService.saveFile(file, { agencyId: car.agencyId, carId });
  if (shouldBePrimary) await prisma.carPhoto.updateMany({ where: { carId }, data: { isPrimary: false } });
  const photo = await prisma.carPhoto.create({
    data: {
      carId,
      url: saved.fileUrl ?? "",
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: saved.storageKey,
      source: "UPLOAD",
      isPrimary: shouldBePrimary
    }
  });
  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "CarPhoto",
    entityId: photo.id,
    userId: auth.userId,
    agencyId: car.agencyId,
    metadata: { event: "car_photo_added", carId, registrationNumber: car.registrationNumber },
    ...meta
  });
  return photo;
}

export async function deletePhoto(id: string, auth: AuthContext) {
  assertPermission(auth, "cars:update");
  const photo = await getScopedPhoto(id, auth);
  const deleted = await prisma.carPhoto.delete({ where: { id } });
  if (photo.storageKey) {
    try {
      await FileStorageService.deleteFile(photo.storageKey);
    } catch (error) {
      console.warn("Car photo file deletion failed:", error);
    }
  }
  return deleted;
}

export async function setPrimaryPhoto(id: string, auth: AuthContext) {
  assertPermission(auth, "cars:update");
  const photo = await getScopedPhoto(id, auth);
  await prisma.carPhoto.updateMany({ where: { carId: photo.carId }, data: { isPrimary: false } });
  return prisma.carPhoto.update({ where: { id }, data: { isPrimary: true } });
}

export async function getPhotoDownload(id: string, auth: AuthContext) {
  assertPermission(auth, "cars:read");
  const photo = await getScopedPhoto(id, auth);
  if (!photo.storageKey) return { photo, stream: null };
  return { photo, stream: await FileStorageService.getFileStream(photo.storageKey) };
}

export async function listDocuments(carId: string, auth: AuthContext) {
  assertPermission(auth, "cars:read");
  await getScopedCar(carId, auth);
  return prisma.carDocument.findMany({ where: { carId }, orderBy: { createdAt: "desc" } });
}

export async function addDocument(carId: string, input: CreateCarDocumentInput, auth: AuthContext) {
  assertPermission(auth, "cars:update");
  await getScopedCar(carId, auth);
  return prisma.carDocument.create({ data: { carId, type: input.type, fileName: input.fileName, fileUrl: input.fileUrl } });
}

export async function deleteDocument(id: string, auth: AuthContext) {
  assertPermission(auth, "cars:update");
  const document = await prisma.carDocument.findUnique({ where: { id }, include: { car: true } });
  if (!document || document.car.deletedAt) throw new AppError("Car document not found", 404, "CAR_DOCUMENT_NOT_FOUND");
  await getScopedCar(document.carId, auth);
  return prisma.carDocument.delete({ where: { id } });
}
