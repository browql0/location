-- Phase 8.1 company settings and vehicle default deposit

ALTER TABLE "Agency"
  ADD COLUMN "tradeName" TEXT,
  ADD COLUMN "ice" TEXT,
  ADD COLUMN "ifNumber" TEXT,
  ADD COLUMN "rc" TEXT,
  ADD COLUMN "patente" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "rib" TEXT,
  ADD COLUMN "website" TEXT;

ALTER TABLE "Car"
  ADD COLUMN "defaultDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "Agency"
SET "tradeName" = "name"
WHERE "tradeName" IS NULL;
