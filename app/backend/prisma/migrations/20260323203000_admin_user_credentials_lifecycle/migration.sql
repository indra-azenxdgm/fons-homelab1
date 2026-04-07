ALTER TABLE "AdminUser"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3),
ADD COLUMN "invitedAt" TIMESTAMP(3);

UPDATE "AdminUser"
SET "passwordUpdatedAt" = COALESCE("passwordUpdatedAt", "createdAt")
WHERE "passwordHash" IS NOT NULL;
