ALTER TABLE "AdminNotification"
ADD COLUMN "audienceType" TEXT NOT NULL DEFAULT 'USER_TARGETED',
ADD COLUMN "audienceRole" TEXT,
ADD COLUMN "auditMetadata" JSONB,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedReason" TEXT;

CREATE INDEX "AdminNotification_adminUserId_archivedAt_createdAt_idx"
ON "AdminNotification"("adminUserId", "archivedAt", "createdAt");
