-- Client profile fields for Phase 6.
ALTER TABLE "Client"
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "nationality" TEXT,
ADD COLUMN "notes" TEXT;

CREATE INDEX "Client_drivingLicense_idx" ON "Client"("drivingLicense");

-- Store MVP client documents directly with local storage metadata.
ALTER TABLE "ClientDocument" DROP CONSTRAINT IF EXISTS "ClientDocument_fileId_fkey";
ALTER TABLE "ClientDocument" DROP COLUMN IF EXISTS "fileId";
ALTER TABLE "ClientDocument"
ADD COLUMN "fileName" TEXT NOT NULL DEFAULT 'document',
ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
ADD COLUMN "size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "storageKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN "fileUrl" TEXT;

CREATE INDEX "ClientDocument_storageKey_idx" ON "ClientDocument"("storageKey");
