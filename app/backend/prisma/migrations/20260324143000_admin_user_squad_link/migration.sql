ALTER TABLE "AdminUser"
ADD COLUMN "squadId" TEXT;

CREATE INDEX "AdminUser_squadId_idx" ON "AdminUser"("squadId");

ALTER TABLE "AdminUser"
ADD CONSTRAINT "AdminUser_squadId_fkey"
FOREIGN KEY ("squadId") REFERENCES "Squad"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
