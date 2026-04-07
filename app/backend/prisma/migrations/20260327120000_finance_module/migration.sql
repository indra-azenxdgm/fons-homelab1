CREATE TYPE "FinancePaymentMethod" AS ENUM (
  'CASH',
  'TRANSFER_BCA',
  'TRANSFER_BRI',
  'TRANSFER_BNI',
  'TRANSFER_MANDIRI',
  'OTHER'
);

CREATE TABLE "IncomeRecord" (
  "id" TEXT NOT NULL,
  "incomeCode" TEXT NOT NULL,
  "bookingId" TEXT,
  "customerName" TEXT NOT NULL,
  "transactionDate" DATE NOT NULL,
  "billNumber" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "serviceDescription" TEXT NOT NULL,
  "paymentMethod" "FinancePaymentMethod" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseRecord" (
  "id" TEXT NOT NULL,
  "transactionDate" DATE NOT NULL,
  "expenseType" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpenseRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncomeRecord_incomeCode_key" ON "IncomeRecord"("incomeCode");
CREATE UNIQUE INDEX "IncomeRecord_billNumber_key" ON "IncomeRecord"("billNumber");
CREATE INDEX "IncomeRecord_transactionDate_idx" ON "IncomeRecord"("transactionDate");
CREATE INDEX "IncomeRecord_bookingId_idx" ON "IncomeRecord"("bookingId");
CREATE INDEX "IncomeRecord_billNumber_idx" ON "IncomeRecord"("billNumber");
CREATE INDEX "ExpenseRecord_transactionDate_idx" ON "ExpenseRecord"("transactionDate");
CREATE INDEX "ExpenseRecord_expenseType_idx" ON "ExpenseRecord"("expenseType");

ALTER TABLE "IncomeRecord"
ADD CONSTRAINT "IncomeRecord_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
