CREATE TABLE "AdminAuthLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "event" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "identifier" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuthLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuthLog_adminUserId_createdAt_idx" ON "AdminAuthLog"("adminUserId", "createdAt");
CREATE INDEX "AdminAuthLog_event_createdAt_idx" ON "AdminAuthLog"("event", "createdAt");
CREATE INDEX "AdminAuthLog_outcome_createdAt_idx" ON "AdminAuthLog"("outcome", "createdAt");

ALTER TABLE "AdminAuthLog" ADD CONSTRAINT "AdminAuthLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
