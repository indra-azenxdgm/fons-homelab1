CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Booking" DROP CONSTRAINT "Booking_assignedTeamId_fkey";
DROP INDEX "Booking_assignedTeamId_idx";
ALTER TABLE "Booking" DROP COLUMN "assignedTeamId";
ALTER TABLE "Booking" ADD COLUMN "assignedSquadId" TEXT;

CREATE UNIQUE INDEX "Squad_alias_key" ON "Squad"("alias");
CREATE UNIQUE INDEX "Squad_normalizedName_key" ON "Squad"("normalizedName");
CREATE UNIQUE INDEX "Squad_code_key" ON "Squad"("code");
CREATE UNIQUE INDEX "Squad_name_key" ON "Squad"("name");
CREATE INDEX "Squad_isActive_idx" ON "Squad"("isActive");
CREATE INDEX "Booking_assignedSquadId_idx" ON "Booking"("assignedSquadId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedSquadId_fkey" FOREIGN KEY ("assignedSquadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE "Team";
