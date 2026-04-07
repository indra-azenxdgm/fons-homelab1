ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PAID';

CREATE TABLE "IncomeRecordItem" (
    "id" TEXT NOT NULL,
    "incomeRecordId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeRecordItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IncomeRecordItem_incomeRecordId_sortOrder_idx" ON "IncomeRecordItem"("incomeRecordId", "sortOrder");

ALTER TABLE "IncomeRecordItem"
ADD CONSTRAINT "IncomeRecordItem_incomeRecordId_fkey"
FOREIGN KEY ("incomeRecordId") REFERENCES "IncomeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "IncomeRecordItem" ("id", "incomeRecordId", "sortOrder", "description", "amount", "createdAt", "updatedAt")
SELECT
    CONCAT('income_item_', LOWER(REPLACE(ir.id, '-', ''))),
    ir."id",
    0,
    COALESCE(NULLIF(BTRIM(ir."serviceDescription"), ''), 'Manual income entry'),
    ir."amount",
    ir."createdAt",
    ir."updatedAt"
FROM "IncomeRecord" ir
WHERE NOT EXISTS (
    SELECT 1
    FROM "IncomeRecordItem" item
    WHERE item."incomeRecordId" = ir."id"
);

UPDATE "Booking" booking
SET "status" = 'PAID'
WHERE booking."status" = 'COMPLETED'
  AND EXISTS (
    SELECT 1
    FROM "IncomeRecord" income
    WHERE income."bookingId" = booking."id"
  );
