import { AuditAction, InvoiceStatus, InvoiceType, PaymentMethod, PaymentRecordStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, assertSameAgency, requireAgencyScope } from "../../shared/utils/authz.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { capturePayPalOrder, createPayPalOrder } from "./paypal.service.js";
import type { CreatePaymentInput, PaymentQueryInput, UpdatePaymentInput } from "./payment.schemas.js";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const paymentInclude = {
  reservation: {
    select: {
      id: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      remainingAmount: true,
      paymentStatus: true,
      client: { select: { id: true, firstName: true, lastName: true } },
      car: { select: { id: true, brand: true, model: true, registrationNumber: true } }
    }
  },
  agency: { select: { id: true, name: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } }
};

function toDecimal(value: unknown) {
  return new Prisma.Decimal(value as Prisma.Decimal.Value);
}

function paymentStatusFor(totalPaid: Prisma.Decimal, totalAmount: Prisma.Decimal) {
  if (totalPaid.lte(0)) return PaymentStatus.UNPAID;
  if (totalPaid.gte(totalAmount)) return PaymentStatus.PAID;
  return PaymentStatus.PARTIAL;
}

function invoiceStatusFor(remainingAmount: Prisma.Decimal, totalPaid: Prisma.Decimal) {
  if (remainingAmount.lte(0)) return InvoiceStatus.PAID;
  if (totalPaid.gt(0)) return InvoiceStatus.PARTIAL;
  return InvoiceStatus.ISSUED;
}

export async function recalculateReservationPaymentState(tx: Prisma.TransactionClient, reservationId: string) {
  const reservation = await tx.reservation.findUnique({ where: { id: reservationId }, select: { id: true, totalAmount: true } });
  if (!reservation) throw new AppError("Reservation not found", 404, "RESERVATION_NOT_FOUND");

  const aggregate = await tx.payment.aggregate({
    where: { reservationId, status: PaymentRecordStatus.CONFIRMED },
    _sum: { amount: true }
  });
  const totalPaid = toDecimal(aggregate._sum.amount ?? 0);
  const remainingAmount = Prisma.Decimal.max(new Prisma.Decimal(0), reservation.totalAmount.minus(totalPaid));
  const paymentStatus = paymentStatusFor(totalPaid, reservation.totalAmount);

  const updated = await tx.reservation.update({
    where: { id: reservationId },
    data: { remainingAmount, paymentStatus },
    select: { id: true, totalAmount: true, remainingAmount: true, paymentStatus: true }
  });

  await tx.invoice.updateMany({
    where: { reservationId, type: InvoiceType.RENTAL_INVOICE, status: { not: InvoiceStatus.CANCELLED } },
    data: {
      paidAmount: totalPaid,
      remainingAmount,
      status: invoiceStatusFor(remainingAmount, totalPaid),
      paidAt: remainingAmount.lte(0) ? new Date() : null
    }
  });

  return { reservation: updated, totalPaid, remainingAmount, paymentStatus };
}

async function getScopedReservation(reservationId: string, auth: AuthContext) {
  const agencyId = requireAgencyScope(auth);
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, ...(agencyId ? { agencyId } : {}) },
    select: { id: true, agencyId: true, totalAmount: true, remainingAmount: true }
  });
  if (!reservation) throw new AppError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
  return reservation;
}

async function getScopedPayment(id: string, auth: AuthContext) {
  const agencyId = requireAgencyScope(auth);
  const payment = await prisma.payment.findFirst({
    where: { id, ...(agencyId ? { agencyId } : {}) },
    include: paymentInclude
  });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  return payment;
}

function initialStatus(input: CreatePaymentInput) {
  if (input.method === PaymentMethod.PAYPAL) return PaymentRecordStatus.PENDING;
  if (input.method === PaymentMethod.BANK_TRANSFER) return input.status ?? PaymentRecordStatus.PENDING;
  if (input.status === PaymentRecordStatus.CANCELLED || input.status === PaymentRecordStatus.REFUNDED) {
    throw new AppError("Invalid initial payment status", 400, "PAYMENT_INVALID_INITIAL_STATUS");
  }
  return input.status ?? PaymentRecordStatus.CONFIRMED;
}

function assertManualPayment(payment: { method: PaymentMethod }) {
  if (payment.method === PaymentMethod.PAYPAL) {
    throw new AppError("PayPal payments can only be confirmed by PayPal capture", 409, "PAYPAL_MANUAL_CONFIRM_FORBIDDEN");
  }
}

function auditMetadata(payment: { id: string; reservationId: string; agencyId: string; amount: unknown; method: PaymentMethod; status: PaymentRecordStatus }, event: string) {
  return {
    event,
    paymentId: payment.id,
    reservationId: payment.reservationId,
    agencyId: payment.agencyId,
    amount: Number(payment.amount),
    method: payment.method,
    status: payment.status
  };
}

export async function listPayments(query: PaymentQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "payments:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  return prisma.payment.findMany({
    where: {
      ...(agencyId ? { agencyId } : {}),
      ...(query.reservationId ? { reservationId: query.reservationId } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search, mode: "insensitive" } },
              { reservation: { client: { firstName: { contains: query.search, mode: "insensitive" } } } },
              { reservation: { client: { lastName: { contains: query.search, mode: "insensitive" } } } },
              { reservation: { car: { registrationNumber: { contains: query.search, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    include: paymentInclude,
    orderBy: { createdAt: "desc" },
    ...paginationArgs(query)
  });
}

export async function createPayment(reservationId: string, input: CreatePaymentInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:create");
  const reservation = await getScopedReservation(reservationId, auth);
  const status = initialStatus(input);
  const now = new Date();

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        agencyId: reservation.agencyId,
        reservationId,
        amount: toDecimal(input.amount),
        method: input.method,
        status,
        paidAt: status === PaymentRecordStatus.CONFIRMED ? input.paidAt ?? now : input.paidAt,
        confirmedAt: status === PaymentRecordStatus.CONFIRMED ? now : null,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        createdById: auth.userId
      },
      include: paymentInclude
    });
    await recalculateReservationPaymentState(tx, reservationId);
    return created;
  });

  await createAuditLog({ action: AuditAction.CREATE, entity: "Payment", entityId: payment.id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_created"), ...meta });
  return payment;
}

export async function getPayment(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "payments:read");
  return getScopedPayment(id, auth);
}

export async function updatePayment(id: string, input: UpdatePaymentInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const current = await getScopedPayment(id, auth);
  if (current.status !== PaymentRecordStatus.PENDING) {
    throw new AppError("Only pending payments can be edited", 409, "PAYMENT_NOT_EDITABLE");
  }
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount: input.amount === undefined ? undefined : toDecimal(input.amount),
      reference: input.reference === undefined ? undefined : input.reference ?? null,
      notes: input.notes === undefined ? undefined : input.notes ?? null,
      paidAt: input.paidAt === undefined ? undefined : input.paidAt
    },
    include: paymentInclude
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Payment", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_updated"), ...meta });
  return payment;
}

export async function confirmManual(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const current = await getScopedPayment(id, auth);
  assertManualPayment(current);
  const now = new Date();
  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id },
      data: { status: PaymentRecordStatus.CONFIRMED, confirmedAt: now, paidAt: current.paidAt ?? now },
      include: paymentInclude
    });
    await recalculateReservationPaymentState(tx, updated.reservationId);
    return updated;
  });
  await createAuditLog({ action: AuditAction.VALIDATE, entity: "Payment", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_confirmed"), ...meta });
  return payment;
}

export async function cancelPayment(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:delete");
  const current = await getScopedPayment(id, auth);
  if (current.status === PaymentRecordStatus.CANCELLED) return current;
  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id },
      data: { status: PaymentRecordStatus.CANCELLED, cancelledAt: new Date() },
      include: paymentInclude
    });
    await recalculateReservationPaymentState(tx, updated.reservationId);
    return updated;
  });
  await createAuditLog({ action: AuditAction.DELETE, entity: "Payment", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_cancelled"), ...meta });
  return payment;
}

export async function refundPayment(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const current = await getScopedPayment(id, auth);
  if (current.status !== PaymentRecordStatus.CONFIRMED) throw new AppError("Only confirmed payments can be refunded", 409, "PAYMENT_NOT_REFUNDABLE");
  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({ where: { id }, data: { status: PaymentRecordStatus.REFUNDED }, include: paymentInclude });
    await recalculateReservationPaymentState(tx, updated.reservationId);
    return updated;
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Payment", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_refunded"), ...meta });
  return payment;
}

export async function uploadProof(id: string, file: Express.Multer.File | undefined, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const payment = await getScopedPayment(id, auth);
  if (payment.method !== PaymentMethod.BANK_TRANSFER) throw new AppError("Proof upload is only allowed for bank transfers", 409, "PAYMENT_PROOF_METHOD_INVALID");
  if (!file) throw new AppError("Proof file is required", 400, "PAYMENT_PROOF_REQUIRED");
  const saved = await FileStorageService.saveFile(file, { agencyId: payment.agencyId, paymentId: payment.id });
  const updated = await prisma.payment.update({
    where: { id },
    data: { proofStorageKey: saved.storageKey, proofFileName: file.originalname, proofMimeType: file.mimetype, proofSize: file.size },
    include: paymentInclude
  });
  await createAuditLog({ action: AuditAction.CREATE, entity: "PaymentProof", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(updated, "payment_proof_uploaded"), ...meta });
  return updated;
}

export async function downloadProof(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:read");
  const payment = await getScopedPayment(id, auth);
  if (!payment.proofStorageKey) throw new AppError("Payment proof not found", 404, "PAYMENT_PROOF_NOT_FOUND");
  const stream = await FileStorageService.getFileStream(payment.proofStorageKey);
  await createAuditLog({ action: AuditAction.DOWNLOAD, entity: "PaymentProof", entityId: id, userId: auth.userId, agencyId: payment.agencyId, metadata: auditMetadata(payment, "payment_proof_downloaded"), ...meta });
  return { payment, stream, fileName: payment.proofFileName ?? `payment-${payment.id}-proof`, contentType: payment.proofMimeType ?? "application/octet-stream" };
}

export async function createPaypalOrder(paymentId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const payment = await getScopedPayment(paymentId, auth);
  if (payment.method !== PaymentMethod.PAYPAL) throw new AppError("Payment is not a PayPal payment", 409, "PAYMENT_NOT_PAYPAL");
  if (payment.status !== PaymentRecordStatus.PENDING) throw new AppError("Only pending PayPal payments can create orders", 409, "PAYPAL_PAYMENT_NOT_PENDING");
  const order = await createPayPalOrder({ amount: toDecimal(payment.amount).toFixed(2), paymentId: payment.id, reservationId: payment.reservationId });
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paypalOrderId: order.orderId, paypalRawResponse: order.raw },
    include: paymentInclude
  });
  await createAuditLog({ action: AuditAction.CREATE, entity: "Payment", entityId: payment.id, userId: auth.userId, agencyId: payment.agencyId, metadata: { ...auditMetadata(updated, "payment_paypal_order_created"), paypalOrderId: order.orderId }, ...meta });
  return { payment: updated, orderId: order.orderId, approvalUrl: order.approvalUrl, status: order.status };
}

export async function capturePaypal(paymentId: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "payments:update");
  const payment = await getScopedPayment(paymentId, auth);
  if (payment.method !== PaymentMethod.PAYPAL) throw new AppError("Payment is not a PayPal payment", 409, "PAYMENT_NOT_PAYPAL");
  if (!payment.paypalOrderId) throw new AppError("PayPal order has not been created", 409, "PAYPAL_ORDER_MISSING");
  if (payment.status !== PaymentRecordStatus.PENDING) throw new AppError("PayPal payment is not pending", 409, "PAYPAL_PAYMENT_NOT_PENDING");

  const capture = await capturePayPalOrder(payment.paypalOrderId);
  if (capture.status !== "COMPLETED" && capture.captureStatus !== "COMPLETED") {
    await createAuditLog({ action: AuditAction.REJECT, entity: "Payment", entityId: payment.id, userId: auth.userId, agencyId: payment.agencyId, metadata: { ...auditMetadata(payment, "payment_paypal_failed"), paypalOrderId: payment.paypalOrderId, paypalStatus: capture.status, paypalCaptureStatus: capture.captureStatus }, ...meta });
    throw new AppError("PayPal capture was not completed", 409, "PAYPAL_CAPTURE_NOT_COMPLETED", capture.raw);
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const captured = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentRecordStatus.CONFIRMED,
        paidAt: now,
        confirmedAt: now,
        paypalCaptureId: capture.captureId,
        paypalRawResponse: capture.raw
      },
      include: paymentInclude
    });
    await recalculateReservationPaymentState(tx, captured.reservationId);
    return captured;
  });
  await createAuditLog({ action: AuditAction.VALIDATE, entity: "Payment", entityId: payment.id, userId: auth.userId, agencyId: payment.agencyId, metadata: { ...auditMetadata(updated, "payment_paypal_captured"), paypalOrderId: payment.paypalOrderId, paypalCaptureId: capture.captureId }, ...meta });
  return updated;
}

export function assertPaymentAgency(paymentAgencyId: string, auth: AuthContext) {
  assertSameAgency(paymentAgencyId, auth, "PAYMENT_NOT_FOUND");
}
