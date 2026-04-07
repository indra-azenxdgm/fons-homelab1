ALTER TABLE "Booking"
ADD COLUMN "serviceDisplayName" TEXT,
ADD COLUMN "serviceVariant" TEXT,
ADD COLUMN "serviceIssue" TEXT,
ADD COLUMN "serviceComplaint" TEXT;

INSERT INTO "ServiceType" (
  "id",
  "name",
  "slug",
  "description",
  "isActive",
  "estimatedDuration",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cm8s4l8acother000000000001',
  'Lainnya',
  'ac-other',
  'Kebutuhan servis lain yang dijelaskan langsung oleh pelanggan.',
  true,
  90,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = EXCLUDED."isActive",
  "estimatedDuration" = EXCLUDED."estimatedDuration",
  "updatedAt" = CURRENT_TIMESTAMP;
