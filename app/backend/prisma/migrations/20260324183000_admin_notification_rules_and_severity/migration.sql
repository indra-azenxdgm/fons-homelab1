ALTER TABLE "AdminNotification"
ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'info';

CREATE TABLE "AdminNotificationRuleConfig" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "rules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminNotificationRuleConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminNotificationRuleConfig_scope_key" ON "AdminNotificationRuleConfig"("scope");
