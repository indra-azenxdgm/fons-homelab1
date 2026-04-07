CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

ALTER TABLE "AdminUser" RENAME COLUMN "fullName" TO "name";

ALTER TABLE "AdminUser"
ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");
