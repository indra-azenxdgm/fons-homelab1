-- CreateTable
CREATE TABLE "BookingSlotOverride" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "status" "BookingDayStatus" NOT NULL,
    "reason" TEXT,
    "createdByAdminUserId" TEXT NOT NULL,
    "updatedByAdminUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSlotOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingSlotOverride_date_timeSlot_key" ON "BookingSlotOverride"("date", "timeSlot");

-- CreateIndex
CREATE INDEX "BookingSlotOverride_date_idx" ON "BookingSlotOverride"("date");

-- CreateIndex
CREATE INDEX "BookingSlotOverride_status_date_idx" ON "BookingSlotOverride"("status", "date");

-- AddForeignKey
ALTER TABLE "BookingSlotOverride" ADD CONSTRAINT "BookingSlotOverride_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSlotOverride" ADD CONSTRAINT "BookingSlotOverride_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
