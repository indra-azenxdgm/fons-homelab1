CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL,
    "companyTagline" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyProfile_singletonKey_key" ON "CompanyProfile"("singletonKey");
CREATE INDEX "CompanyProfile_updatedAt_idx" ON "CompanyProfile"("updatedAt");
