import { CarStatus, DocumentType, FuelType, TransmissionType } from "@prisma/client";
import { z } from "zod";
import { paginationQueryFields } from "../../shared/utils/pagination.js";

const optionalDate = z
  .union([z.string().datetime(), z.string().date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? new Date(value) : null));

const money = z.coerce.number().min(0);

export const carQuerySchema = z.object({
  agencyId: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(CarStatus).optional(),
  ...paginationQueryFields
});

export const createCarSchema = z.object({
  agencyId: z.string().optional(),
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  registrationNumber: z.string().min(1).max(40),
  vin: z.string().max(80).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  fuelType: z.nativeEnum(FuelType).default(FuelType.GASOLINE),
  transmission: z.nativeEnum(TransmissionType).default(TransmissionType.MANUAL),
  seats: z.coerce.number().int().min(1).max(80).default(5),
  dailyPrice: money,
  weeklyPrice: money.default(0),
  monthlyPrice: money.default(0),
  defaultDeposit: money.default(0),
  mileage: z.coerce.number().int().min(0).default(0),
  currentMileage: z.coerce.number().int().min(0).optional(),
  nextOilChangeKm: z.coerce.number().int().min(0).optional().nullable(),
  nextTireChangeKm: z.coerce.number().int().min(0).optional().nullable(),
  nextBrakeCheckKm: z.coerce.number().int().min(0).optional().nullable(),
  nextInspectionKm: z.coerce.number().int().min(0).optional().nullable(),
  nextMaintenanceKm: z.coerce.number().int().min(0).optional().nullable(),
  status: z.nativeEnum(CarStatus).default(CarStatus.AVAILABLE),
  insuranceExpiryDate: optionalDate,
  technicalVisitExpiryDate: optionalDate,
  notes: z.string().max(2000).optional().nullable()
});

export const updateCarSchema = createCarSchema.partial().omit({ agencyId: true });

export const createCarPhotoSchema = z.object({
  url: z.string().url().default("https://placehold.co/800x500?text=Voiture"),
  isPrimary: z.boolean().default(false)
});

export const createCarDocumentSchema = z.object({
  type: z.nativeEnum(DocumentType)
});

export type CarQueryInput = z.infer<typeof carQuerySchema>;
export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type CreateCarPhotoInput = z.infer<typeof createCarPhotoSchema>;
export type CreateCarDocumentInput = z.infer<typeof createCarDocumentSchema>;
