import { AuditAction, CarStatus, ReservationStatus, UserRole } from "@prisma/client";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import type { Permission } from "../../shared/utils/permissions.js";
import { createAuditLog } from "../audit/audit.service.js";
import { generateContractPdf, resolveContractPdfPath } from "./contract-pdf.service.js";
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
  const prefix = `LOC-${year}-`;
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
  if (reservation.contract) throw new AppError("A contract already exists for this reservation", 409, "CONTRACT_ALREADY_EXISTS");
  if (reservation.status === ReservationStatus.CANCELLED) throw new AppError("Cancelled reservations cannot have contracts", 409, "RESERVATION_CANCELLED");
  if (reservation.car.status === CarStatus.INACTIVE || reservation.car.deletedAt) throw new AppError("Inactive cars cannot have contracts", 409, "CAR_INACTIVE");
  if (reservation.client.deletedAt) throw new AppError("Deleted clients cannot have contracts", 409, "CLIENT_DELETED");

  const now = new Date();
  const contract = await prisma.contract.create({
    data: {
      agencyId: reservation.agencyId,
      reservationId: reservation.id,
      contractNumber: await nextContractNumber(reservation.agencyId, now.getFullYear()),
      generatedAt: now
    },
    include: contractInclude
  });

  const pdfPath = await generateContractPdf(contract);
  const updated = await prisma.contract.update({ where: { id: contract.id }, data: { pdfPath }, include: contractInclude });
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
  if (!contract.pdfPath) throw new AppError("Contract PDF is not available", 404, "CONTRACT_PDF_NOT_FOUND");
  const filePath = resolveContractPdfPath(contract.pdfPath);
  try {
    await access(filePath);
  } catch {
    throw new AppError("Contract PDF is not available", 404, "CONTRACT_PDF_NOT_FOUND");
  }
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
    filePath,
    stream: createReadStream(filePath),
    contentType: "application/pdf"
  };
}
