-- R2-only storage cleanup: keep storage keys, remove public URL columns.

ALTER TABLE "Agency"
  ADD COLUMN IF NOT EXISTS "logoStorageKey" TEXT;

ALTER TABLE "ClientDocument"
  DROP COLUMN IF EXISTS "fileUrl";

ALTER TABLE "Contract"
  DROP COLUMN IF EXISTS "pdfUrl";

ALTER TABLE "Invoice"
  DROP COLUMN IF EXISTS "pdfUrl";

ALTER TABLE "File"
  DROP COLUMN IF EXISTS "url";

ALTER TABLE "CarDocument"
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "size" INTEGER,
  ADD COLUMN IF NOT EXISTS "storageKey" TEXT;

UPDATE "CarDocument"
SET "storageKey" = ''
WHERE "storageKey" IS NULL;

ALTER TABLE "CarDocument"
  ALTER COLUMN "storageKey" SET NOT NULL,
  DROP COLUMN IF EXISTS "fileUrl";

CREATE INDEX IF NOT EXISTS "CarDocument_storageKey_idx" ON "CarDocument"("storageKey");
