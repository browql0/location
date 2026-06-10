import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";

type AuditInput = {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  agencyId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId,
      agencyId: input.agencyId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
