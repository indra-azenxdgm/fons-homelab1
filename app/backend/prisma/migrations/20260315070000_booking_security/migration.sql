-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "clientSubmissionId" TEXT;

-- CreateTable
CREATE TABLE "SubmissionAttemptLog" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ipAddress" TEXT,
    "phone" TEXT,
    "userAgent" TEXT,
    "submissionKey" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttemptLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_clientSubmissionId_key" ON "Booking"("clientSubmissionId");

-- CreateIndex
CREATE INDEX "SubmissionAttemptLog_channel_createdAt_idx" ON "SubmissionAttemptLog"("channel", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAttemptLog_outcome_createdAt_idx" ON "SubmissionAttemptLog"("outcome", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionAttemptLog_submissionKey_idx" ON "SubmissionAttemptLog"("submissionKey");
