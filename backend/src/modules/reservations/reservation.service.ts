import { AuditAction, CarStatus, InvoiceStatus, InvoiceType, PaymentStatus, Prisma, ReservationStatus, VehicleAnomalySeverity, VehicleAnomalyType } from "@prisma/client";
import { prisma } from "../../prisma/prisma.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthContext } from "../../shared/types/auth.js";
import { assertPermissionOrOwner, assertSameAgency, requireAgencyForCreate, requireAgencyScope } from "../../shared/utils/authz.js";
import { paginationArgs } from "../../shared/utils/pagination.js";
import { createAuditLog } from "../audit/audit.service.js";
import { PlanLimitService } from "../subscriptions/plan-limit.service.js";
import { detectCarAnomalies, ensureVehicleAnomaly } from "../vehicle-anomalies/vehicle-anomaly.service.js";
import { assertCarAvailable, checkCarAvailability } from "./availability.service.js";
import type {
  CancelReservationInput,
  CheckAvailabilityInput,
  CompleteReservationInput,
  CreateReservationInput,
  ReservationQueryInput,
  StartReservationInput,
  UpdateReservationInput
} from "./reservation.schemas.js";

type RequestMeta = { ipAddress?: string; userAgent?: string };

const reservationInclude = {
  agency: { select: { id: true, name: true } },
  client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
  car: { select: { id: true, brand: true, model: true, registrationNumber: true, status: true, dailyPrice: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  contract: { select: { id: true, contractNumber: true, generatedAt: true, pdfStorageKey: true, status: true, signedAt: true } },
  invoices: {
    where: { type: InvoiceType.RENTAL_INVOICE, status: { not: InvoiceStatus.CANCELLED } },
    orderBy: { issuedAt: "desc" as const },
    take: 1,
    select: { id: true, invoiceNumber: true, status: true, issuedAt: true, pdfStorageKey: true, sentToClientAt: true }
  }
};

function totalDays(startDate: Date, endDate: Date) {
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function toDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

function paymentStatus(totalAmount: Prisma.Decimal, advanceAmount: Prisma.Decimal) {
  if (advanceAmount.lte(0)) return PaymentStatus.UNPAID;
  if (advanceAmount.gte(totalAmount)) return PaymentStatus.PAID;
  return PaymentStatus.PARTIAL;
}

function financials(input: { startDate: Date; endDate: Date; dailyPrice: number | string | Prisma.Decimal; advanceAmount: number | string | Prisma.Decimal }) {
  const days = totalDays(input.startDate, input.endDate);
  const dailyPrice = toDecimal(input.dailyPrice);
  const advanceAmount = toDecimal(input.advanceAmount);
  const totalAmount = dailyPrice.mul(days);
  const rawRemainingAmount = totalAmount.minus(advanceAmount);
  const remainingAmount = rawRemainingAmount.isNegative() ? new Prisma.Decimal(0) : rawRemainingAmount;
  return { totalDays: days, totalAmount, remainingAmount, paymentStatus: paymentStatus(totalAmount, advanceAmount) };
}

async function getScopedReservation(id: string, auth: AuthContext) {
  const agencyId = requireAgencyScope(auth);
  const reservation = await prisma.reservation.findFirst({
    where: { id, ...(agencyId ? { agencyId } : {}) },
    include: reservationInclude
  });
  if (!reservation) throw new AppError("Reservation not found", 404, "RESERVATION_NOT_FOUND");
  return reservation;
}

async function assertClientInAgency(tx: Prisma.TransactionClient, clientId: string, agencyId: string) {
  const client = await tx.client.findFirst({ where: { id: clientId, agencyId, deletedAt: null } });
  if (!client) throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
  return client;
}

function auditMeta(reservation: { id: string; carId: string; clientId: string; startDate: Date; endDate: Date; totalAmount: unknown }, extra = {}) {
  return {
    reservationId: reservation.id,
    carId: reservation.carId,
    clientId: reservation.clientId,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    totalAmount: Number(reservation.totalAmount),
    ...extra
  };
}

export async function listReservations(query: ReservationQueryInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "reservations:read");
  const agencyId = requireAgencyScope(auth, query.agencyId);
  const dayStart = query.date ? new Date(`${query.date}T00:00:00.000Z`) : null;
  const dayEnd = dayStart ? new Date(dayStart.getTime() + 86_400_000) : null;
  return prisma.reservation.findMany({
    where: {
      ...(agencyId ? { agencyId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(dayStart && dayEnd ? { startDate: { lt: dayEnd }, endDate: { gt: dayStart } } : {}),
      ...(query.search
        ? {
            OR: [
              { client: { firstName: { contains: query.search, mode: "insensitive" } } },
              { client: { lastName: { contains: query.search, mode: "insensitive" } } },
              { car: { brand: { contains: query.search, mode: "insensitive" } } },
              { car: { model: { contains: query.search, mode: "insensitive" } } },
              { car: { registrationNumber: { contains: query.search, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: reservationInclude,
    orderBy: { startDate: "desc" },
    ...paginationArgs(query)
  });
}

export async function createReservation(input: CreateReservationInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:create");
  const agencyId = requireAgencyForCreate(auth, input.agencyId, "RESERVATION_AGENCY_REQUIRED");
  await PlanLimitService.assertCanCreateReservation(agencyId);

  const reservation = await prisma.$transaction(async (tx) => {
    await assertClientInAgency(tx, input.clientId, agencyId);
    const car = await assertCarAvailable(tx, { agencyId, carId: input.carId, startDate: input.startDate, endDate: input.endDate });
    const dailyPrice = input.dailyPrice ?? car.dailyPrice;
    const depositAmount = input.depositAmount ?? car.defaultDeposit;
    const totals = financials({ startDate: input.startDate, endDate: input.endDate, dailyPrice, advanceAmount: input.advanceAmount });
    return tx.reservation.create({
      data: {
        agencyId,
        clientId: input.clientId,
        carId: input.carId,
        createdById: auth.userId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays: totals.totalDays,
        dailyPrice,
        totalAmount: totals.totalAmount,
        advanceAmount: input.advanceAmount,
        remainingAmount: totals.remainingAmount,
        depositAmount,
        status: ReservationStatus.CONFIRMED,
        paymentStatus: totals.paymentStatus,
        notes: input.notes ?? null
      },
      include: reservationInclude
    });
  });

  await createAuditLog({ action: AuditAction.CREATE, entity: "Reservation", entityId: reservation.id, userId: auth.userId, agencyId, metadata: { event: "reservation_created", ...auditMeta(reservation) }, ...meta });
  return reservation;
}

export async function getReservation(id: string, auth: AuthContext) {
  assertPermissionOrOwner(auth, "reservations:read");
  return getScopedReservation(id, auth);
}

export async function updateReservation(id: string, input: UpdateReservationInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:update");
  const current = await getScopedReservation(id, auth);
  if (current.status !== ReservationStatus.CONFIRMED) throw new AppError("Only confirmed reservations can be updated", 409, "RESERVATION_NOT_EDITABLE");

  const updated = await prisma.$transaction(async (tx) => {
    const agencyId = current.agencyId;
    const clientId = input.clientId ?? current.clientId;
    const carId = input.carId ?? current.carId;
    const startDate = input.startDate ?? current.startDate;
    const endDate = input.endDate ?? current.endDate;
    await assertClientInAgency(tx, clientId, agencyId);
    const car = await assertCarAvailable(tx, { agencyId, carId, startDate, endDate, excludeReservationId: id });
    const dailyPrice = input.dailyPrice ?? current.dailyPrice ?? car.dailyPrice;
    const advanceAmount = input.advanceAmount ?? current.advanceAmount;
    const totals = financials({ startDate, endDate, dailyPrice, advanceAmount });
    return tx.reservation.update({
      where: { id },
      data: {
        clientId,
        carId,
        startDate,
        endDate,
        totalDays: totals.totalDays,
        dailyPrice,
        totalAmount: totals.totalAmount,
        advanceAmount,
        remainingAmount: totals.remainingAmount,
        depositAmount: input.depositAmount === undefined ? current.depositAmount : input.depositAmount,
        paymentStatus: totals.paymentStatus,
        notes: input.notes === undefined ? current.notes : input.notes
      },
      include: reservationInclude
    });
  });

  await createAuditLog({ action: AuditAction.UPDATE, entity: "Reservation", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "reservation_updated", ...auditMeta(updated), oldStatus: current.status, newStatus: updated.status }, ...meta });
  return updated;
}

export async function cancelReservation(id: string, _input: CancelReservationInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:update");
  const current = await getScopedReservation(id, auth);
  const updated = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.update({ where: { id }, data: { status: ReservationStatus.CANCELLED, cancelledAt: new Date() }, include: reservationInclude });
    if (current.status === ReservationStatus.IN_PROGRESS) await tx.car.update({ where: { id: current.carId }, data: { status: CarStatus.AVAILABLE } });
    return reservation;
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Reservation", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "reservation_cancelled", ...auditMeta(updated), oldStatus: current.status, newStatus: updated.status }, ...meta });
  return updated;
}

export async function startReservation(id: string, input: StartReservationInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:update");
  const current = await getScopedReservation(id, auth);
  if (current.status !== ReservationStatus.CONFIRMED) throw new AppError("Reservation cannot be started", 409, "RESERVATION_CANNOT_START");
  const updated = await prisma.$transaction(async (tx) => {
    await assertCarAvailable(tx, { agencyId: current.agencyId, carId: current.carId, startDate: current.startDate, endDate: current.endDate, excludeReservationId: id });
    await tx.car.update({ where: { id: current.carId }, data: { status: CarStatus.RENTED } });
    return tx.reservation.update({ where: { id }, data: { status: ReservationStatus.IN_PROGRESS, pickupMileage: input.pickupMileage ?? null, pickupFuelLevel: input.pickupFuelLevel ?? null, pickupCondition: input.pickupCondition ?? null }, include: reservationInclude });
  });
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Reservation", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "reservation_started", ...auditMeta(updated), oldStatus: current.status, newStatus: updated.status }, ...meta });
  return updated;
}

export async function completeReservation(id: string, input: CompleteReservationInput, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:update");
  const current = await getScopedReservation(id, auth);
  if (current.status !== ReservationStatus.IN_PROGRESS) throw new AppError("Reservation cannot be completed", 409, "RESERVATION_CANNOT_COMPLETE");
  const car = await prisma.car.findUnique({ where: { id: current.carId }, select: { id: true, agencyId: true, currentMileage: true, registrationNumber: true } });
  if (!car) throw new AppError("Car not found", 404, "CAR_NOT_FOUND");
  assertSameAgency(car.agencyId, auth, "CAR_NOT_FOUND");
  if (input.returnMileage !== undefined && input.returnMileage !== null && input.returnMileage < car.currentMileage) {
    await ensureVehicleAnomaly({
      agencyId: current.agencyId,
      carId: current.carId,
      type: VehicleAnomalyType.MILEAGE_ROLLBACK,
      severity: VehicleAnomalySeverity.CRITICAL,
      title: "Kilometrage retour inferieur",
      description: `Retour ${input.returnMileage} km < kilometrage actuel ${car.currentMileage} km pour ${car.registrationNumber}.`
    });
    throw new AppError("Return mileage cannot be lower than current car mileage", 409, "MILEAGE_ROLLBACK_DETECTED");
  }
  const updated = await prisma.$transaction(async (tx) => {
    await tx.car.update({ where: { id: current.carId }, data: { status: CarStatus.AVAILABLE, ...(input.returnMileage !== undefined && input.returnMileage !== null ? { currentMileage: input.returnMileage, mileage: input.returnMileage } : {}) } });
    if (input.returnMileage !== undefined && input.returnMileage !== null) {
      await tx.vehicleMileageLog.create({ data: { agencyId: current.agencyId, carId: current.carId, reservationId: current.id, mileage: input.returnMileage, loggedAt: new Date(), note: "Retour reservation" } });
    }
    return tx.reservation.update({ where: { id }, data: { status: ReservationStatus.COMPLETED, returnMileage: input.returnMileage ?? null, returnFuelLevel: input.returnFuelLevel ?? null, returnCondition: input.returnCondition ?? null }, include: reservationInclude });
  });
  await detectCarAnomalies(current.carId);
  await createAuditLog({ action: AuditAction.UPDATE, entity: "Reservation", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "reservation_completed", ...auditMeta(updated), oldStatus: current.status, newStatus: updated.status }, ...meta });
  return updated;
}

export async function deleteReservation(id: string, auth: AuthContext, meta: RequestMeta) {
  assertPermissionOrOwner(auth, "reservations:delete");
  const updated = await cancelReservation(id, {}, auth, meta);
  await createAuditLog({ action: AuditAction.DELETE, entity: "Reservation", entityId: id, userId: auth.userId, agencyId: updated.agencyId, metadata: { event: "reservation_deleted", ...auditMeta(updated) }, ...meta });
  return updated;
}

export async function checkAvailability(input: CheckAvailabilityInput, auth: AuthContext) {
  assertPermissionOrOwner(auth, "reservations:read");
  const agencyId = requireAgencyForCreate(auth, input.agencyId, "RESERVATION_AGENCY_REQUIRED");
  return prisma.$transaction((tx) => checkCarAvailability(tx, { agencyId, carId: input.carId, startDate: input.startDate, endDate: input.endDate, excludeReservationId: input.excludeReservationId }));
}

export async function calendar(query: ReservationQueryInput, auth: AuthContext) {
  const reservations = await listReservations(query, auth);
  return reservations.map((reservation) => ({
    id: reservation.id,
    title: `${reservation.car.registrationNumber} - ${reservation.client.firstName} ${reservation.client.lastName}`,
    start: reservation.startDate,
    end: reservation.endDate,
    status: reservation.status,
    reservation
  }));
}
