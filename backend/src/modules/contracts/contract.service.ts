import { AuditAction, CarStatus, ContractStatus, ReservationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import type { Permission } from "../../shared/utils/permissions.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { generateContractPdf } from "./contract-pdf.service.js";
import type { ContractQueryInput } from "./contract.schemas.js";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const contractInclude = {
  agency: true,
  reservation: {
    include: {
      client: true,
      createdBy: { select: { firstName: true, lastName: true } },
      car: { include: { photos: { orderBy: [{ isPrimary: "desc" as const }, { createdAt: "asc" as const }] } } }
    }
  }
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

async function nextContractNumber(agencyId: string, year: number) {
  const prefix = `CTR-${year}-`;
  const latest = await prisma.contract.findFirst({
    where: { agencyId, contractNumber: { startsWith: prefix } },
    orderBy: { contractNumber: "desc" },
    select: { contractNumber: true }
  });
  const next = latest ? Number(latest.contractNumber.replace(prefix, "")) + 1 : 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}

async function getScopedContract(id: string, auth: AuthContext) {
  const agencyId = agencyScope(auth);
  const contract = await prisma.contract.findFirst({
    where: { id, ...(agencyId ? { agencyId } : {}) },
    include: contractInclude
  });
  if (!contract) throw new AppError("Contract not found", 404, "CONTRACT_NOT_FOUND");
  return contract;
}

export async function listContracts(query: ContractQueryInput, auth: AuthContext) {
  assertPermission(auth, "contracts:read");
  const agencyId = agencyScope(auth, query.agencyId);
  return prisma.contract.findMany({
    where: {
      ...(agencyId ? { agencyId } : {}),
      ...(query.search
        ? {
            OR: [
              { contractNumber: { contains: query.search, mode: "insensitive" } },
              { reservation: { client: { firstName: { contains: query.search, mode: "insensitive" } } } },
              { reservation: { client: { lastName: { contains: query.search, mode: "insensitive" } } } },
              { reservation: { car: { registrationNumber: { contains: query.search, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: contractInclude,
    orderBy: { generatedAt: "desc" }
  });
}

export async function getContract(id: string, auth: AuthContext) {
  assertPermission(auth, "contracts:read");
  return getScopedContract(id, auth);
}

export async function generateContract(reservationId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:create");
  const agencyId = agencyScope(auth);
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, ...(agencyId ? { agencyId } : {}) },
    include: {
      client: true,
      car: { include: { photos: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } } },
      agency: true,
      contract: true
    }
  });
  if (!reservation) throw new AppError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
  if (reservation.contract && reservation.contract.status !== ContractStatus.ARCHIVED && reservation.contract.status !== ContractStatus.CANCELLED) throw new AppError("A contract already exists for this reservation", 409, "CONTRACT_ALREADY_EXISTS");
  if (reservation.status === ReservationStatus.CANCELLED) throw new AppError("Cancelled reservations cannot have contracts", 409, "RESERVATION_CANCELLED");
  if (reservation.car.status === CarStatus.INACTIVE || reservation.car.deletedAt) throw new AppError("Inactive cars cannot have contracts", 409, "CAR_INACTIVE");
  if (reservation.client.deletedAt) throw new AppError("Deleted clients cannot have contracts", 409, "CLIENT_DELETED");

  const now = new Date();
  const contract = await prisma.contract.create({
    data: {
      agencyId: reservation.agencyId,
      reservationId: reservation.id,
      contractNumber: await nextContractNumber(reservation.agencyId, now.getFullYear()),
      generatedAt: now,
      status: ContractStatus.GENERATED
    },
    include: contractInclude
  });

  const pdfStorageKey = await generateContractPdf(contract);
  const updated = await prisma.contract.update({ where: { id: contract.id }, data: { pdfStorageKey }, include: contractInclude });
  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "Contract",
    entityId: updated.id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "contract_generated", contractNumber: updated.contractNumber, reservationId },
    ...meta
  });
  return updated;
}

export async function downloadContract(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:read");
  const contract = await getScopedContract(id, auth);
  if (!contract.pdfStorageKey) throw new AppError("Contract PDF is not available", 404, "CONTRACT_PDF_NOT_FOUND");
  try {
    const stream = await FileStorageService.getFileStream(contract.pdfStorageKey);
    await createAuditLog({
      action: AuditAction.DOWNLOAD,
      entity: "Contract",
      entityId: contract.id,
      userId: auth.userId,
      agencyId: contract.agencyId,
      metadata: { event: "contract_downloaded", contractNumber: contract.contractNumber },
      ...meta
    });
    return {
      contract,
      fileName: `${contract.contractNumber}.pdf`,
      stream,
      contentType: "application/pdf"
    };
  } catch {
    throw new AppError("Contract PDF is not available", 404, "CONTRACT_PDF_NOT_FOUND");
  }
}

export async function signClient(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:update");
  const contract = await getScopedContract(id, auth);
  if (contract.status === ContractStatus.ARCHIVED || contract.status === ContractStatus.CANCELLED) throw new AppError("Contract cannot be signed", 409, "CONTRACT_NOT_SIGNABLE");
  const signedByAgency = contract.signedByAgency;
  const signedAt = signedByAgency ? new Date() : contract.signedAt;
  const updated = await prisma.contract.update({
    where: { id },
    data: { signedByClient: true, signedAt, status: signedByAgency ? ContractStatus.SIGNED : contract.status },
    include: contractInclude
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Contract", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "contract_signed_client", contractId: id }, ...meta });
  return updated;
}

export async function signAgency(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:update");
  const contract = await getScopedContract(id, auth);
  if (contract.status === ContractStatus.ARCHIVED || contract.status === ContractStatus.CANCELLED) throw new AppError("Contract cannot be signed", 409, "CONTRACT_NOT_SIGNABLE");
  const signedByClient = contract.signedByClient;
  const signedAt = signedByClient ? new Date() : contract.signedAt;
  const updated = await prisma.contract.update({
    where: { id },
    data: { signedByAgency: true, signedAt, status: signedByClient ? ContractStatus.SIGNED : contract.status },
    include: contractInclude
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Contract", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "contract_signed_agency", contractId: id }, ...meta });
  return updated;
}

export async function archiveContract(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:update");
  const contract = await getScopedContract(id, auth);
  const updated = await prisma.contract.update({ where: { id }, data: { status: ContractStatus.ARCHIVED, archivedAt: new Date() }, include: contractInclude });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Contract", entityId: id, userId: auth.userId, agencyId: contract.agencyId, metadata: { event: "contract_archived", contractId: id }, ...meta });
  return updated;
}

export async function cancelContract(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermission(auth, "contracts:update");
  const contract = await getScopedContract(id, auth);
  const updated = await prisma.contract.update({ where: { id }, data: { status: ContractStatus.CANCELLED }, include: contractInclude });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Contract", entityId: id, userId: auth.userId, agencyId: contract.agencyId, metadata: { event: "contract_cancelled", contractId: id }, ...meta });
  return updated;
}
