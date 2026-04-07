CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminNotification_adminUserId_createdAt_idx" ON "AdminNotification"("adminUserId", "createdAt");
CREATE INDEX "AdminNotification_adminUserId_readAt_createdAt_idx" ON "AdminNotification"("adminUserId", "readAt", "createdAt");
CREATE INDEX "AdminNotification_bookingId_createdAt_idx" ON "AdminNotification"("bookingId", "createdAt");

ALTER TABLE "AdminNotification"
ADD CONSTRAINT "AdminNotification_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminNotification"
ADD CONSTRAINT "AdminNotification_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
