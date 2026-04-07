CREATE TYPE "ExpenseCategory" AS ENUM (
  'OPERATIONAL',
  'SPARE_PART',
  'MAINTENANCE',
  'OFFICE',
  'SUBSCRIPTION',
  'TRANSPORTATION',
  'TOOLS',
  'OTHER'
);

CREATE TYPE "ExpensePaymentMethod" AS ENUM (
  'CASH',
  'BANK_TRANSFER',
  'QRIS',
  'OTHER'
);

ALTER TABLE "ExpenseRecord"
ADD COLUMN "billCode" TEXT,
ADD COLUMN "category" "ExpenseCategory",
ADD COLUMN "paymentMethod" "ExpensePaymentMethod";

CREATE UNIQUE INDEX "ExpenseRecord_billCode_key" ON "ExpenseRecord"("billCode");
CREATE INDEX "ExpenseRecord_billCode_idx" ON "ExpenseRecord"("billCode");
CREATE INDEX "ExpenseRecord_category_idx" ON "ExpenseRecord"("category");
