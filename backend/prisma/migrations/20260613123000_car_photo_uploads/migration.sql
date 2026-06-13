ALTER TABLE "CarPhoto"
ADD COLUMN "fileName" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "size" INTEGER,
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';

CREATE INDEX "CarPhoto_storageKey_idx" ON "CarPhoto"("storageKey");
