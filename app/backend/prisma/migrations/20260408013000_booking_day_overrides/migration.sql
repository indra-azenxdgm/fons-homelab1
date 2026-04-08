-- CreateEnum
CREATE TYPE "BookingDayStatus" AS ENUM ('OPEN', 'FULL_BOOKED', 'CLOSED');

-- CreateTable
CREATE TABLE "BookingDayOverride" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "BookingDayStatus" NOT NULL,
    "reason" TEXT,
    "createdByAdminUserId" TEXT NOT NULL,
    "updatedByAdminUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDayOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingDayOverride_date_key" ON "BookingDayOverride"("date");

-- CreateIndex
CREATE INDEX "BookingDayOverride_status_date_idx" ON "BookingDayOverride"("status", "date");

-- AddForeignKey
ALTER TABLE "BookingDayOverride" ADD CONSTRAINT "BookingDayOverride_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDayOverride" ADD CONSTRAINT "BookingDayOverride_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
