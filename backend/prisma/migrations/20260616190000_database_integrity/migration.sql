-- Atomic counters for human-readable document numbers.
CREATE TABLE "NumberSequence" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "currentValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NumberSequence_scope_type_year_key" ON "NumberSequence"("scope", "type", "year");
CREATE INDEX "NumberSequence_type_year_idx" ON "NumberSequence"("type", "year");

-- PostgreSQL-only protection against concurrent overlapping active reservations.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_no_active_car_overlap"
  EXCLUDE USING gist (
    "carId" WITH =,
    tsrange("startDate", "endDate", '[)') WITH &&
  )
  WHERE ("status" IN ('CONFIRMED', 'IN_PROGRESS'));

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_start_before_end" CHECK ("startDate" < "endDate"),
  ADD CONSTRAINT "Reservation_money_non_negative" CHECK (
    "totalDays" >= 1
    AND "dailyPrice" >= 0
    AND "totalAmount" >= 0
    AND "advanceAmount" >= 0
    AND "remainingAmount" >= 0
    AND ("depositAmount" IS NULL OR "depositAmount" >= 0)
  );

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_money_non_negative" CHECK (
    "totalAmount" >= 0
    AND "paidAmount" >= 0
    AND "remainingAmount" >= 0
  );

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_non_negative" CHECK ("amount" >= 0);

ALTER TABLE "SecurityDeposit"
  ADD CONSTRAINT "SecurityDeposit_money_non_negative" CHECK (
    "amount" >= 0
    AND "collectedAmount" >= 0
    AND "refundedAmount" >= 0
    AND "retainedAmount" >= 0
  );

ALTER TABLE "MaintenanceRecord"
  ADD CONSTRAINT "Maintenance_cost_non_negative" CHECK ("cost" IS NULL OR "cost" >= 0);

CREATE INDEX "User_agencyId_status_createdAt_idx" ON "User"("agencyId", "status", "createdAt");
CREATE INDEX "Car_agencyId_status_createdAt_idx" ON "Car"("agencyId", "status", "createdAt");
CREATE INDEX "Client_agencyId_createdAt_idx" ON "Client"("agencyId", "createdAt");
CREATE INDEX "Reservation_agencyId_status_startDate_idx" ON "Reservation"("agencyId", "status", "startDate");
CREATE INDEX "Reservation_agencyId_paymentStatus_startDate_idx" ON "Reservation"("agencyId", "paymentStatus", "startDate");
CREATE INDEX "Reservation_agencyId_createdAt_idx" ON "Reservation"("agencyId", "createdAt");
CREATE INDEX "Contract_agencyId_status_generatedAt_idx" ON "Contract"("agencyId", "status", "generatedAt");
CREATE INDEX "Invoice_agencyId_status_issuedAt_idx" ON "Invoice"("agencyId", "status", "issuedAt");
CREATE INDEX "Invoice_agencyId_type_issuedAt_idx" ON "Invoice"("agencyId", "type", "issuedAt");
CREATE INDEX "MaintenanceRecord_agencyId_status_scheduledDate_idx" ON "MaintenanceRecord"("agencyId", "status", "scheduledDate");
CREATE INDEX "MaintenanceRecord_agencyId_carId_scheduledDate_idx" ON "MaintenanceRecord"("agencyId", "carId", "scheduledDate");

CREATE UNIQUE INDEX "Invoice_active_rental_reservation_key"
  ON "Invoice"("reservationId")
  WHERE "reservationId" IS NOT NULL
    AND "type" = 'RENTAL_INVOICE'
    AND "status" <> 'CANCELLED';
