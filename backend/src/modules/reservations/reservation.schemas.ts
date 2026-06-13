import { PaymentStatus, ReservationStatus } from "@prisma/client";
import { z } from "zod";

const dateField = z.union([z.string().datetime(), z.string().date()]).transform((value) => new Date(value));
const money = z.coerce.number().min(0);
const optionalMoney = z.coerce.number().min(0).optional().nullable();
const fuelLevel = z.coerce.number().int().min(0).max(100).optional().nullable();
const mileage = z.coerce.number().int().min(0).optional().nullable();

function requireDateOrder<T extends { startDate: Date; endDate: Date }>(value: T, ctx: z.RefinementCtx) {
  if (value.startDate >= value.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "endDate must be after startDate" });
  }
}

export const reservationQuerySchema = z.object({
  agencyId: z.string().optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  date: z.string().date().optional()
});

export const createReservationSchema = z
  .object({
    agencyId: z.string().optional(),
    clientId: z.string().min(1),
    carId: z.string().min(1),
    startDate: dateField,
    endDate: dateField,
    dailyPrice: money.optional(),
    advanceAmount: money.default(0),
    depositAmount: optionalMoney,
    notes: z.string().max(2000).optional().nullable()
  })
  .superRefine(requireDateOrder);

export const updateReservationSchema = z
  .object({
    clientId: z.string().min(1).optional(),
    carId: z.string().min(1).optional(),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
    dailyPrice: money.optional(),
    advanceAmount: money.optional(),
    depositAmount: optionalMoney,
    notes: z.string().max(2000).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate) requireDateOrder(value as { startDate: Date; endDate: Date }, ctx);
  });

export const checkAvailabilitySchema = z
  .object({
    agencyId: z.string().optional(),
    carId: z.string().min(1),
    startDate: dateField,
    endDate: dateField,
    excludeReservationId: z.string().optional()
  })
  .superRefine(requireDateOrder);

export const startReservationSchema = z.object({
  pickupMileage: mileage,
  pickupFuelLevel: fuelLevel,
  pickupCondition: z.string().max(2000).optional().nullable()
});

export const completeReservationSchema = z.object({
  returnMileage: mileage,
  returnFuelLevel: fuelLevel,
  returnCondition: z.string().max(2000).optional().nullable()
});

export const cancelReservationSchema = z.object({
  notes: z.string().max(2000).optional().nullable()
});

export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type StartReservationInput = z.infer<typeof startReservationSchema>;
export type CompleteReservationInput = z.infer<typeof completeReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
