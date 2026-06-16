-- Phase 12 + 13 maintenance, mileage and vehicle anomalies

ALTER TYPE "MaintenanceType" RENAME TO "MaintenanceType_old";
CREATE TYPE "MaintenanceType" AS ENUM (
  'OIL_CHANGE',
  'TIRES',
  'BRAKES',
  'BATTERY',
  'INSURANCE',
  'TECHNICAL_INSPECTION',
  'AIR_CONDITIONING',
  'ENGINE',
  'TRANSMISSION',
  'BODYWORK',
  'CLEANING',
  'OTHER'
);

CREATE TYPE "MaintenanceStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VehicleAnomalyType" AS ENUM (
  'MILEAGE_ROLLBACK',
  'EXCESSIVE_MILEAGE',
  'OVERDUE_OIL_CHANGE',
  'OVERDUE_MAINTENANCE',
  'INSURANCE_EXPIRED',
  'TECHNICAL_INSPECTION_EXPIRED',
  'DOCUMENT_MISSING',
  'OTHER'
);
CREATE TYPE "VehicleAnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "Car"
  ADD COLUMN "currentMileage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextOilChangeKm" INTEGER,
  ADD COLUMN "nextTireChangeKm" INTEGER,
  ADD COLUMN "nextBrakeCheckKm" INTEGER,
  ADD COLUMN "nextInspectionKm" INTEGER,
  ADD COLUMN "nextMaintenanceKm" INTEGER;

UPDATE "Car"
SET "currentMileage" = "mileage"
WHERE "currentMileage" = 0;

ALTER TABLE "MaintenanceRecord"
  RENAME COLUMN "date" TO "scheduledDate";

ALTER TABLE "MaintenanceRecord"
  RENAME COLUMN "garage" TO "vendor";

ALTER TABLE "MaintenanceRecord"
  ADD COLUMN "status" "MaintenanceStatus" NOT NULL DEFAULT 'PLANNED',
  ADD COLUMN "title" TEXT,
  ADD COLUMN "completedDate" TIMESTAMP(3),
  ADD COLUMN "mileageAtService" INTEGER,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "MaintenanceRecord"
SET "title" = CASE
  WHEN "type"::text = 'OIL_CHANGE' THEN 'Vidange'
  WHEN "type"::text = 'TIRES' THEN 'Pneus'
  WHEN "type"::text = 'BRAKES' THEN 'Freins'
  WHEN "type"::text = 'ENGINE' THEN 'Moteur'
  WHEN "type"::text = 'BODYWORK' THEN 'Carrosserie'
  WHEN "type"::text = 'TECHNICAL_VISIT' THEN 'Visite technique'
  ELSE 'Maintenance'
END
WHERE "title" IS NULL;

ALTER TABLE "MaintenanceRecord"
  ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "MaintenanceRecord"
  ALTER COLUMN "type" TYPE "MaintenanceType"
  USING (CASE
    WHEN "type"::text = 'TECHNICAL_VISIT' THEN 'TECHNICAL_INSPECTION'
    WHEN "type"::text = 'GENERAL_SERVICE' THEN 'OTHER'
    ELSE "type"::text
  END)::"MaintenanceType";

DROP TYPE "MaintenanceType_old";

CREATE TABLE "MaintenanceDocument" (
  "id" TEXT NOT NULL,
  "maintenanceId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleAnomaly" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "type" "VehicleAnomalyType" NOT NULL,
  "severity" "VehicleAnomalySeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleAnomaly_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");
CREATE INDEX "MaintenanceDocument_maintenanceId_idx" ON "MaintenanceDocument"("maintenanceId");
CREATE INDEX "MaintenanceDocument_storageKey_idx" ON "MaintenanceDocument"("storageKey");
CREATE INDEX "VehicleAnomaly_agencyId_idx" ON "VehicleAnomaly"("agencyId");
CREATE INDEX "VehicleAnomaly_carId_idx" ON "VehicleAnomaly"("carId");
CREATE INDEX "VehicleAnomaly_type_idx" ON "VehicleAnomaly"("type");
CREATE INDEX "VehicleAnomaly_severity_idx" ON "VehicleAnomaly"("severity");
CREATE INDEX "VehicleAnomaly_resolved_idx" ON "VehicleAnomaly"("resolved");

ALTER TABLE "MaintenanceDocument"
  ADD CONSTRAINT "MaintenanceDocument_maintenanceId_fkey"
  FOREIGN KEY ("maintenanceId") REFERENCES "MaintenanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VehicleAnomaly"
  ADD CONSTRAINT "VehicleAnomaly_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleAnomaly"
  ADD CONSTRAINT "VehicleAnomaly_carId_fkey"
  FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
