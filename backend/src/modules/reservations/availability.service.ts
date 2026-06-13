import { CarStatus, Prisma, ReservationStatus } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";

const blockingStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.IN_PROGRESS];

export async function assertCarAvailable(
  tx: Prisma.TransactionClient,
  input: { agencyId: string; carId: string; startDate: Date; endDate: Date; excludeReservationId?: string }
) {
  const car = await tx.car.findFirst({ where: { id: input.carId, agencyId: input.agencyId, deletedAt: null } });
  if (!car) throw new AppError("Car not found", 404, "CAR_NOT_FOUND");
  if (car.status === CarStatus.MAINTENANCE || car.status === CarStatus.INACTIVE) {
    throw new AppError("Car is not available", 409, "CAR_NOT_AVAILABLE");
  }

  const overlapping = await tx.reservation.findFirst({
    where: {
      agencyId: input.agencyId,
      carId: input.carId,
      status: { in: blockingStatuses },
      startDate: { lt: input.endDate },
      endDate: { gt: input.startDate },
      ...(input.excludeReservationId ? { id: { not: input.excludeReservationId } } : {})
    },
    select: { id: true, startDate: true, endDate: true, status: true }
  });

  if (overlapping) {
    throw new AppError("Car is already reserved for these dates", 409, "CAR_ALREADY_RESERVED", overlapping);
  }

  return car;
}

export async function checkCarAvailability(
  tx: Prisma.TransactionClient,
  input: { agencyId: string; carId: string; startDate: Date; endDate: Date; excludeReservationId?: string }
) {
  try {
    await assertCarAvailable(tx, input);
    return { available: true, reason: null };
  } catch (error) {
    if (error instanceof AppError) return { available: false, reason: error.code, message: error.message, details: error.details };
    throw error;
  }
}
