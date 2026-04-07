CREATE TABLE "BookingSquadAssignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSquadAssignment_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BookingSquadAssignment" ("id", "bookingId", "squadId", "createdAt")
SELECT
    'bsa_' || md5("id" || ':' || "assignedSquadId"),
    "id",
    "assignedSquadId",
    CURRENT_TIMESTAMP
FROM "Booking"
WHERE "assignedSquadId" IS NOT NULL;

CREATE UNIQUE INDEX "BookingSquadAssignment_bookingId_squadId_key" ON "BookingSquadAssignment"("bookingId", "squadId");
CREATE INDEX "BookingSquadAssignment_bookingId_createdAt_idx" ON "BookingSquadAssignment"("bookingId", "createdAt");
CREATE INDEX "BookingSquadAssignment_squadId_createdAt_idx" ON "BookingSquadAssignment"("squadId", "createdAt");

ALTER TABLE "BookingSquadAssignment" ADD CONSTRAINT "BookingSquadAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSquadAssignment" ADD CONSTRAINT "BookingSquadAssignment_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" DROP CONSTRAINT "Booking_assignedSquadId_fkey";
DROP INDEX "Booking_assignedSquadId_idx";
ALTER TABLE "Booking" DROP COLUMN "assignedSquadId";
