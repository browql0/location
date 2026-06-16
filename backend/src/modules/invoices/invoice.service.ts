import { AuditAction, InvoiceStatus, InvoiceType, Prisma, ReservationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, canAccessAgency, requireAgencyScope } from "../../shared/utils/authz.js";
import { formatDocumentNumber, nextSequenceValue } from "../../shared/utils/number-sequence.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { EmailService } from "./email.service.js";
import { generateInvoicePdf } from "./invoice-pdf.service.js";
import type { InvoiceQueryInput } from "./invoice.schemas.js";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const invoiceInclude = {
  agency: true,
  reservation: { include: { agency: true, client: true, car: true } },
  subscription: { include: { agency: true, plan: true } }
};

function assertCanMutateInvoice(invoice: { type: InvoiceType; agencyId: string | null }, auth: AuthContext) {
  if (auth.role === UserRole.SUPER_ADMIN) return;
  if (invoice.type === InvoiceType.SAAS_INVOICE) throw new AppError("SaaS invoices are read-only for agencies", 403, "SAAS_INVOICE_READ_ONLY");
  assertPermissionOrOwner(auth, "invoices:update");
  if (!canAccessAgency(auth, invoice.agencyId)) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient, year: number) {
  const next = await nextSequenceValue(tx, { scope: "GLOBAL", type: "INVOICE", year });
  return formatDocumentNumber("INV", year, next);
}

async function getScopedInvoice(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "invoices:read");
  const agencyId = requireAgencyScope(auth);
  const invoice = await prisma.invoice.findFirst({
    where: { id, ...(agencyId ? { OR: [{ agencyId }, { subscription: { agencyId } }] } : {}) },
    include: invoiceInclude
  });
  if (!invoice) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  return invoice;
}

export async function listInvoices(query: InvoiceQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "invoices:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.invoice.findMany({
    where: {
      ...(agencyId ? { OR: [{ agencyId }, { subscription: { agencyId } }] } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to ? { issuedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: "insensitive" } },
              { agency: { name: { contains: query.search, mode: "insensitive" } } },
              { reservation: { client: { firstName: { contains: query.search, mode: "insensitive" } } } },
              { reservation: { client: { lastName: { contains: query.search, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: invoiceInclude,
    orderBy: { issuedAt: "desc" },
    ...paginationArgs(query)
  });
}

export async function getInvoice(id: string, auth: AuthContext) {
  return getScopedInvoice(id, auth);
}

export async function generateRentalInvoice(reservationId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "invoices:create");
  const agencyId = requireAgencyScope(auth);
  const invoice = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id: reservationId, ...(agencyId ? { agencyId } : {}) },
      include: { agency: true, client: true, car: true }
    });
    if (!reservation) throw new AppError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
    if (reservation.status === ReservationStatus.CANCELLED) throw new AppError("Cancelled reservations cannot be invoiced", 409, "RESERVATION_CANCELLED");
    const existing = await tx.invoice.findFirst({ where: { reservationId, type: InvoiceType.RENTAL_INVOICE, status: { not: InvoiceStatus.CANCELLED } } });
    if (existing) throw new AppError("A rental invoice already exists for this reservation", 409, "INVOICE_ALREADY_EXISTS");

    const isPaid = reservation.remainingAmount.lte(0);
    return tx.invoice.create({
      data: {
        agencyId: reservation.agencyId,
        reservationId: reservation.id,
        type: InvoiceType.RENTAL_INVOICE,
        invoiceNumber: await nextInvoiceNumber(tx, new Date().getFullYear()),
        status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
        totalAmount: reservation.totalAmount,
        paidAmount: reservation.advanceAmount,
        remainingAmount: reservation.remainingAmount,
        currency: "MAD",
        paidAt: isPaid ? new Date() : null
      },
      include: invoiceInclude
    });
  });
  const pdfStorageKey = await generateInvoicePdf(invoice);
  const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStorageKey }, include: invoiceInclude });
  await createAuditLog({ action: AuditAction.CREATE, entity: "Invoice", entityId: updated.id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "invoice_generated", invoiceId: updated.id, invoiceType: updated.type, reservationId, agencyId: updated.agencyId, amount: Number(updated.totalAmount) }, ...meta });
  return updated;
}

export async function generateSaasInvoice(subscriptionId: string, auth: AuthContext, meta: RequestMeta) {
  if (auth.role !== UserRole.SUPER_ADMIN) throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  const invoice = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({ where: { id: subscriptionId }, include: { agency: true, plan: true } });
    if (!subscription) throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    const existing = await tx.invoice.findFirst({
      where: {
        subscriptionId,
        type: InvoiceType.SAAS_INVOICE,
        status: { not: InvoiceStatus.CANCELLED },
        issuedAt: { gte: subscription.startsAt, lte: subscription.endsAt }
      }
    });
    if (existing) throw new AppError("A SaaS invoice already exists for this subscription period", 409, "INVOICE_ALREADY_EXISTS");
    const amount = subscription.amount ?? (subscription.billingInterval === "YEARLY" ? subscription.plan.priceYearly ?? subscription.plan.priceMonthly : subscription.plan.priceMonthly);
    return tx.invoice.create({
      data: {
        agencyId: subscription.agencyId,
        subscriptionId: subscription.id,
        type: InvoiceType.SAAS_INVOICE,
        invoiceNumber: await nextInvoiceNumber(tx, new Date().getFullYear()),
        status: InvoiceStatus.ISSUED,
        totalAmount: amount,
        paidAmount: 0,
        remainingAmount: amount,
        currency: subscription.currency,
        dueDate: subscription.endsAt
      },
      include: invoiceInclude
    });
  });
  const pdfStorageKey = await generateInvoicePdf(invoice);
  const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStorageKey }, include: invoiceInclude });
  await createAuditLog({ action: AuditAction.CREATE, entity: "Invoice", entityId: updated.id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "invoice_generated", invoiceId: updated.id, invoiceType: updated.type, subscriptionId, agencyId: updated.agencyId, amount: Number(updated.totalAmount) }, ...meta });
  return updated;
}

export async function downloadInvoice(id: string, auth: AuthContext, meta: RequestMeta) {
  const invoice = await getScopedInvoice(id, auth);
  if (!invoice.pdfStorageKey) throw new AppError("Invoice PDF is not available", 404, "INVOICE_PDF_NOT_FOUND");
  try {
    const stream = await FileStorageService.getFileStream(invoice.pdfStorageKey);
    await createAuditLog({ action: AuditAction.DOWNLOAD, entity: "Invoice", entityId: id, userId: auth.userId, agencyId: invoice.agencyId, metadata: { event: "invoice_downloaded", invoiceId: id, invoiceType: invoice.type }, ...meta });
    return { invoice, fileName: `${invoice.invoiceNumber}.pdf`, stream, contentType: "application/pdf" };
  } catch {
    throw new AppError("Invoice PDF is not available", 404, "INVOICE_PDF_NOT_FOUND");
  }
}

export async function markPaid(id: string, auth: AuthContext, meta: RequestMeta) {
  const invoice = await getScopedInvoice(id, auth);
  assertCanMutateInvoice(invoice, auth);
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.PAID, paidAmount: invoice.totalAmount, remainingAmount: 0, paidAt: new Date() },
    include: invoiceInclude
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Invoice", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "invoice_marked_paid", invoiceId: id, invoiceType: updated.type, amount: Number(updated.totalAmount) }, ...meta });
  return updated;
}

export async function cancelInvoice(id: string, auth: AuthContext, meta: RequestMeta) {
  const invoice = await getScopedInvoice(id, auth);
  assertCanMutateInvoice(invoice, auth);
  const updated = await prisma.invoice.update({ where: { id }, data: { status: InvoiceStatus.CANCELLED, cancelledAt: new Date() }, include: invoiceInclude });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Invoice", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "invoice_cancelled", invoiceId: id, invoiceType: updated.type }, ...meta });
  return updated;
}

export async function sendClient(id: string, auth: AuthContext, meta: RequestMeta) {
  const invoice = await getScopedInvoice(id, auth);
  assertCanMutateInvoice(invoice, auth);
  if (invoice.type !== InvoiceType.RENTAL_INVOICE) throw new AppError("Only rental invoices can be sent to clients", 409, "INVALID_INVOICE_TYPE");
  const sent = await EmailService.sendRentalInvoiceToClient(id, invoice.reservation?.client.email);
  const updated = sent ? await prisma.invoice.update({ where: { id }, data: { status: InvoiceStatus.SENT, sentToClientAt: new Date() }, include: invoiceInclude }) : invoice;
  await createAuditLog({ action: AuditAction.SEND_EMAIL, entity: "Invoice", entityId: id, userId: auth.userId, agencyId: invoice.agencyId, metadata: { event: "invoice_sent_client", invoiceId: id, invoiceType: invoice.type, sent }, ...meta });
  return updated;
}

export async function sendAgency(id: string, auth: AuthContext, meta: RequestMeta) {
  const invoice = await getScopedInvoice(id, auth);
  if (auth.role !== UserRole.SUPER_ADMIN) throw new AppError("Super admin role is required", 403, "SUPER_ADMIN_REQUIRED");
  if (invoice.type !== InvoiceType.SAAS_INVOICE) throw new AppError("Only SaaS invoices can be sent to agencies", 409, "INVALID_INVOICE_TYPE");
  const sent = await EmailService.sendSaasInvoiceToAgency(id, invoice.subscription?.agency.email ?? invoice.agency?.email);
  const updated = sent ? await prisma.invoice.update({ where: { id }, data: { status: InvoiceStatus.SENT, sentToAgencyAt: new Date() }, include: invoiceInclude }) : invoice;
  await createAuditLog({ action: AuditAction.SEND_EMAIL, entity: "Invoice", entityId: id, userId: auth.userId, agencyId: invoice.agencyId, metadata: { event: "invoice_sent_agency", invoiceId: id, invoiceType: invoice.type, sent }, ...meta });
  return updated;
}
