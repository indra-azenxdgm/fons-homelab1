CREATE TABLE "ExpenseRecordItem" (
    "id" TEXT NOT NULL,
    "expenseRecordId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRecordItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExpenseRecordItem_expenseRecordId_sortOrder_idx" ON "ExpenseRecordItem"("expenseRecordId", "sortOrder");

ALTER TABLE "ExpenseRecordItem"
ADD CONSTRAINT "ExpenseRecordItem_expenseRecordId_fkey"
FOREIGN KEY ("expenseRecordId") REFERENCES "ExpenseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ExpenseRecordItem" ("id", "expenseRecordId", "sortOrder", "description", "amount", "createdAt", "updatedAt")
SELECT
  'expitem_' || substr(md5("id" || '_0'), 1, 24),
  "id",
  0,
  COALESCE(NULLIF(trim("expenseType"), ''), 'Unnamed expense'),
  "amount",
  "createdAt",
  "updatedAt"
FROM "ExpenseRecord"
WHERE NOT EXISTS (
  SELECT 1
  FROM "ExpenseRecordItem"
  WHERE "ExpenseRecordItem"."expenseRecordId" = "ExpenseRecord"."id"
);
