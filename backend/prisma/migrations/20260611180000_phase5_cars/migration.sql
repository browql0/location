CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC');
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE "DocumentType" AS ENUM ('REGISTRATION', 'INSURANCE', 'TECHNICAL_VISIT', 'OTHER');

DROP INDEX IF EXISTS "Car_agencyId_licensePlate_key";
DROP INDEX IF EXISTS "Car_insuranceExpiryDate_idx";
DROP INDEX IF EXISTS "Car_technicalVisitDate_idx";

ALTER TABLE "Car" RENAME COLUMN "licensePlate" TO "registrationNumber";
ALTER TABLE "Car" RENAME COLUMN "technicalVisitDate" TO "technicalVisitExpiryDate";
ALTER TABLE "Car" RENAME COLUMN "description" TO "notes";

ALTER TABLE "Car"
  ADD COLUMN "vin" TEXT,
  ADD COLUMN "color" TEXT,
  ADD COLUMN "fuelType" "FuelType" NOT NULL DEFAULT 'GASOLINE',
  ADD COLUMN "transmission" "TransmissionType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "seats" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "weeklyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "monthlyPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "CarPhoto" DROP COLUMN IF EXISTS "sortOrder";
ALTER TABLE "CarPhoto" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CarDocument" (
  "id" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CarDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Car_vin_key" ON "Car"("vin");
CREATE UNIQUE INDEX "Car_agencyId_registrationNumber_key" ON "Car"("agencyId", "registrationNumber");
CREATE INDEX "Car_registrationNumber_idx" ON "Car"("registrationNumber");
CREATE INDEX "Car_createdAt_idx" ON "Car"("createdAt");
CREATE INDEX "CarDocument_carId_idx" ON "CarDocument"("carId");
CREATE INDEX "CarDocument_type_idx" ON "CarDocument"("type");

ALTER TABLE "CarDocument" ADD CONSTRAINT "CarDocument_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
