import { AuditAction } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, assertSameAgency, requireAgencyForCreate, requireAgencyScope } from "../../shared/utils/authz.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { PlanLimitService } from "../subscriptions/plan-limit.service.js";
import type { ClientQueryInput, CreateClientDocumentInput, CreateClientInput, UpdateClientInput } from "./client.schemas.js";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

const clientInclude = {
  agency: { select: { id: true, name: true } },
  documents: { orderBy: { createdAt: "desc" as const } }
};

function cleanIdentity(value: string | null | undefined, uppercase = true) {
  if (!value) return null;
  const cleaned = value.trim().replace(/[\s-]+/g, "");
  return uppercase ? cleaned.toUpperCase() : cleaned;
}

export function normalizeClientIdentity(client: {
  cinOrPassport?: string | null;
  drivingLicense?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  return (
    cleanIdentity(client.cinOrPassport) ??
    cleanIdentity(client.drivingLicense) ??
    cleanIdentity(client.phone, false) ??
    cleanIdentity(client.email, false)?.toLowerCase() ??
    null
  );
}

async function getScopedClient(id: string, auth: AuthContext) {
  const agencyId = requireAgencyScope(auth);
  const client = await prisma.client.findFirst({
    where: { id, deletedAt: null, ...(agencyId ? { agencyId } : {}) },
    include: clientInclude
  });
  if (!client) throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
  return client;
}

async function getScopedDocument(documentId: string, auth: AuthContext) {
  const document = await prisma.clientDocument.findUnique({ where: { id: documentId }, include: { client: true } });
  if (!document || document.client.deletedAt) throw new AppError("Client document not found", 404, "CLIENT_DOCUMENT_NOT_FOUND");
  assertSameAgency(document.client.agencyId, auth, "CLIENT_DOCUMENT_NOT_FOUND");
  return document;
}

function clientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export async function listClients(query: ClientQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "clients:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.client.findMany({
    where: {
      deletedAt: null,
      ...(agencyId ? { agencyId } : {}),
      ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
      ...(query.hasCin === true ? { cinOrPassport: { not: null } } : {}),
      ...(query.hasCin === false ? { cinOrPassport: null } : {}),
      ...(query.hasDrivingLicense === true ? { drivingLicense: { not: null } } : {}),
      ...(query.hasDrivingLicense === false ? { drivingLicense: null } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { cinOrPassport: { contains: query.search, mode: "insensitive" } },
              { drivingLicense: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: clientInclude,
    orderBy: { createdAt: "desc" },
    ...paginationArgs(query)
  });
}

export async function createClient(input: CreateClientInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:create");
  const agencyId = requireAgencyForCreate(auth, input.agencyId, "CLIENT_AGENCY_REQUIRED");
  await PlanLimitService.assertCanCreateClient(agencyId);
  const normalizedIdentity = normalizeClientIdentity(input);

  const client = await prisma.client.create({
    data: { ...input, agencyId, normalizedIdentity },
    include: clientInclude
  });

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "Client",
    entityId: client.id,
    userId: auth.userId,
    agencyId,
    metadata: { event: "client_created", clientId: client.id, clientName: clientName(client), normalizedIdentity },
    ...meta
  });
  return client;
}

export async function getClient(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "clients:read");
  return getScopedClient(id, auth);
}

export async function getClientSummary(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "clients:read");
  const client = await getScopedClient(id, auth);
  return {
    clientId: client.id,
    clientName: clientName(client),
    normalizedIdentity: client.normalizedIdentity,
    documentCount: client.documents.length,
    reservationCount: 0,
    incidentCount: 0,
    risk: {
      riskScore: 0,
      trustScore: 50,
      trustLevel: "WATCHLIST",
      trustedClient: false
    }
  };
}

export async function updateClient(id: string, input: UpdateClientInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:update");
  const current = await getScopedClient(id, auth);
  const normalizedIdentity = normalizeClientIdentity({ ...current, ...input });
  const updated = await prisma.client.update({
    where: { id },
    data: { ...input, normalizedIdentity },
    include: clientInclude
  });

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: "Client",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "client_updated", clientId: id, clientName: clientName(updated), normalizedIdentity },
    ...meta
  });
  return updated;
}

export async function softDeleteClient(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:delete");
  const current = await getScopedClient(id, auth);
  const updated = await prisma.client.update({ where: { id }, data: { deletedAt: new Date() }, include: clientInclude });
  await createAuditLog({
    action: AuditAction.DELETE,
    entity: "Client",
    entityId: id,
    userId: auth.userId,
    agencyId: updated.agencyId,
    metadata: { event: "client_deleted", clientId: id, clientName: clientName(current), normalizedIdentity: current.normalizedIdentity },
    ...meta
  });
  return updated;
}

export async function listDocuments(clientId: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "clients:read");
  await getScopedClient(clientId, auth);
  return prisma.clientDocument.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } });
}

export async function addDocument(clientId: string, input: CreateClientDocumentInput, file: Express.Multer.File | undefined, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:update");
  const client = await getScopedClient(clientId, auth);
  if (!file) throw new AppError("File is required", 400, "CLIENT_DOCUMENT_FILE_REQUIRED");

  const saved = await FileStorageService.saveFile(file, { agencyId: client.agencyId, clientId });
  const document = await prisma.clientDocument.create({
    data: {
      clientId,
      type: input.type,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: saved.storageKey
    }
  });

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: "ClientDocument",
    entityId: document.id,
    userId: auth.userId,
    agencyId: client.agencyId,
    metadata: { event: "client_document_added", clientId, clientName: clientName(client), documentType: document.type },
    ...meta
  });
  return document;
}

export async function getDocumentDownload(documentId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:read");
  const document = await getScopedDocument(documentId, auth);
  const stream = await FileStorageService.getFileStream(document.storageKey);
  await createAuditLog({
    action: AuditAction.DOWNLOAD,
    entity: "ClientDocument",
    entityId: document.id,
    userId: auth.userId,
    agencyId: document.client.agencyId,
    metadata: { event: "client_document_downloaded", clientId: document.clientId, documentType: document.type },
    ...meta
  });
  return { document, stream };
}

export async function deleteDocument(documentId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:update");
  const document = await getScopedDocument(documentId, auth);
  const deleted = await prisma.clientDocument.delete({ where: { id: documentId } });
  try {
    await FileStorageService.deleteFile(document.storageKey);
  } catch (error) {
    console.warn("Client document file deletion failed:", error);
  }
  await createAuditLog({
    action: AuditAction.DELETE,
    entity: "ClientDocument",
    entityId: documentId,
    userId: auth.userId,
    agencyId: document.client.agencyId,
    metadata: { event: "client_document_deleted", clientId: document.clientId, documentType: document.type },
    ...meta
  });
  return deleted;
}

export async function riskCheck(identity: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "clients:read");
  const normalizedIdentity = cleanIdentity(identity) ?? "";
  const profile = normalizedIdentity
    ? await prisma.clientRiskProfile.findUnique({ where: { normalizedIdentity } })
    : null;
  await createAuditLog({
    action: AuditAction.VALIDATE,
    entity: "ClientRiskProfile",
    userId: auth.userId,
    agencyId: requireAgencyScope(auth),
    metadata: { event: "client_risk_checked", normalizedIdentity },
    ...meta
  });
  return (
    profile ?? {
      normalizedIdentity,
      riskScore: 0,
      trustScore: 50,
      trustLevel: "WATCHLIST",
      validatedIncidentCount: 0,
      trustedClient: false
    }
  );
}
