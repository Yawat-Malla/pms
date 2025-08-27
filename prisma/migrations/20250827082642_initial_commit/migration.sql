-- CreateEnum
CREATE TYPE "public"."ProgramType" AS ENUM ('NEW', 'CARRIED_OVER', 'EXTENSION');

-- CreateEnum
CREATE TYPE "public"."FundingSource" AS ENUM ('RED_BOOK', 'EXECUTIVE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Program" ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "fundingSource" "public"."FundingSource" NOT NULL DEFAULT 'RED_BOOK',
ADD COLUMN     "programType" "public"."ProgramType" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "responsibleOfficer" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."ProgramDocument" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramApproval" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramPayment" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramMonitoring" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramMonitoring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramDocument_programId_idx" ON "public"."ProgramDocument"("programId");

-- CreateIndex
CREATE INDEX "ProgramDocument_category_idx" ON "public"."ProgramDocument"("category");

-- CreateIndex
CREATE INDEX "ProgramDocument_uploadedById_idx" ON "public"."ProgramDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "ProgramApproval_programId_idx" ON "public"."ProgramApproval"("programId");

-- CreateIndex
CREATE INDEX "ProgramApproval_step_idx" ON "public"."ProgramApproval"("step");

-- CreateIndex
CREATE INDEX "ProgramApproval_status_idx" ON "public"."ProgramApproval"("status");

-- CreateIndex
CREATE INDEX "ProgramApproval_approvedById_idx" ON "public"."ProgramApproval"("approvedById");

-- CreateIndex
CREATE INDEX "ProgramPayment_programId_idx" ON "public"."ProgramPayment"("programId");

-- CreateIndex
CREATE INDEX "ProgramPayment_status_idx" ON "public"."ProgramPayment"("status");

-- CreateIndex
CREATE INDEX "ProgramPayment_requestedById_idx" ON "public"."ProgramPayment"("requestedById");

-- CreateIndex
CREATE INDEX "ProgramPayment_approvedById_idx" ON "public"."ProgramPayment"("approvedById");

-- CreateIndex
CREATE INDEX "ProgramMonitoring_programId_idx" ON "public"."ProgramMonitoring"("programId");

-- CreateIndex
CREATE INDEX "ProgramMonitoring_type_idx" ON "public"."ProgramMonitoring"("type");

-- CreateIndex
CREATE INDEX "ProgramMonitoring_status_idx" ON "public"."ProgramMonitoring"("status");

-- CreateIndex
CREATE INDEX "ProgramMonitoring_reportDate_idx" ON "public"."ProgramMonitoring"("reportDate");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Program_code_idx" ON "public"."Program"("code");

-- CreateIndex
CREATE INDEX "Program_wardId_idx" ON "public"."Program"("wardId");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "public"."Program"("status");

-- CreateIndex
CREATE INDEX "Program_fiscalYear_idx" ON "public"."Program"("fiscalYear");

-- CreateIndex
CREATE INDEX "Program_createdById_idx" ON "public"."Program"("createdById");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "public"."Role"("name");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_wardId_idx" ON "public"."User"("wardId");

-- CreateIndex
CREATE INDEX "Ward_code_idx" ON "public"."Ward"("code");

-- AddForeignKey
ALTER TABLE "public"."ProgramDocument" ADD CONSTRAINT "ProgramDocument_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramDocument" ADD CONSTRAINT "ProgramDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramApproval" ADD CONSTRAINT "ProgramApproval_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramApproval" ADD CONSTRAINT "ProgramApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramPayment" ADD CONSTRAINT "ProgramPayment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramPayment" ADD CONSTRAINT "ProgramPayment_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramPayment" ADD CONSTRAINT "ProgramPayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramMonitoring" ADD CONSTRAINT "ProgramMonitoring_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
