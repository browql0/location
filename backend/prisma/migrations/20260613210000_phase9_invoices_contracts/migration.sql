-- Phase 8 completion + Phase 9 invoices

CREATE TYPE "ContractStatus" AS ENUM ('GENERATED', 'SIGNED', 'ARCHIVED', 'CANCELLED');
CREATE TYPE "InvoiceType" AS ENUM ('SAAS_INVOICE', 'RENTAL_INVOICE');

ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'ISSUED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

ALTER TABLE "Contract"
  ADD COLUMN "pdfStorageKey" TEXT,
  ADD COLUMN "pdfUrl" TEXT,
  ADD COLUMN "status" "ContractStatus" NOT NULL DEFAULT 'GENERATED',
  ADD COLUMN "signedByClient" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "signedByAgency" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "Contract"
SET "pdfStorageKey" = "pdfPath"
WHERE "pdfPath" IS NOT NULL AND "pdfStorageKey" IS NULL;

UPDATE "Contract"
SET "signedByClient" = true,
    "signedByAgency" = true,
    "status" = 'SIGNED'
WHERE "signedAt" IS NOT NULL;

ALTER TABLE "Contract" DROP COLUMN "pdfPath";
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

ALTER TABLE "Invoice"
  ADD COLUMN "subscriptionId" TEXT,
  ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'RENTAL_INVOICE',
  ADD COLUMN "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'MAD',
  ADD COLUMN "pdfStorageKey" TEXT,
  ADD COLUMN "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

UPDATE "Invoice"
SET "paidAmount" = "advanceAmount"
WHERE "advanceAmount" IS NOT NULL;

UPDATE "Invoice"
SET "pdfStorageKey" = "pdfUrl"
WHERE "pdfUrl" IS NOT NULL AND "pdfStorageKey" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "agencyId" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "reservationId" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'ISSUED';
ALTER TABLE "Invoice" DROP COLUMN "advanceAmount";

DROP INDEX IF EXISTS "Invoice_agencyId_invoiceNumber_key";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_reservationId_idx" ON "Invoice"("reservationId");
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");
CREATE INDEX "Invoice_type_idx" ON "Invoice"("type");
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
