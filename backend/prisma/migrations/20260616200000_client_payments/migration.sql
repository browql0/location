CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'PAYPAL', 'CARD_MANUAL', 'CHECK', 'OTHER');
CREATE TYPE "PaymentRecordStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

ALTER TABLE "Payment"
  ADD COLUMN "agencyId" TEXT,
  ADD COLUMN "status" "PaymentRecordStatus" NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "reference" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "proofStorageKey" TEXT,
  ADD COLUMN "proofFileName" TEXT,
  ADD COLUMN "proofMimeType" TEXT,
  ADD COLUMN "proofSize" INTEGER,
  ADD COLUMN "paypalOrderId" TEXT,
  ADD COLUMN "paypalCaptureId" TEXT,
  ADD COLUMN "paypalRawResponse" JSONB,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Payment" p
SET "agencyId" = r."agencyId",
    "confirmedAt" = COALESCE(p."paidAt", p."createdAt"),
    "notes" = p."note"
FROM "Reservation" r
WHERE p."reservationId" = r."id";

ALTER TABLE "Payment" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod" USING (
  CASE
    WHEN UPPER(COALESCE("method", 'CASH')) IN ('CASH', 'BANK_TRANSFER', 'PAYPAL', 'CARD_MANUAL', 'CHECK', 'OTHER')
      THEN UPPER(COALESCE("method", 'CASH'))::"PaymentMethod"
    ELSE 'OTHER'::"PaymentMethod"
  END
);
ALTER TABLE "Payment" ALTER COLUMN "method" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "paidAt" DROP DEFAULT;
ALTER TABLE "Payment" DROP COLUMN "note";

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_paypal_requires_pending_or_final" CHECK (
    "method" <> 'PAYPAL'
    OR "status" IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED')
  );

CREATE INDEX "Payment_agencyId_idx" ON "Payment"("agencyId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_method_idx" ON "Payment"("method");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_paypalOrderId_idx" ON "Payment"("paypalOrderId");
CREATE UNIQUE INDEX "Payment_paypalOrderId_key" ON "Payment"("paypalOrderId") WHERE "paypalOrderId" IS NOT NULL;
CREATE UNIQUE INDEX "Payment_paypalCaptureId_key" ON "Payment"("paypalCaptureId") WHERE "paypalCaptureId" IS NOT NULL;
