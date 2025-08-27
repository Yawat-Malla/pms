/*
  Warnings:

  - You are about to drop the column `fiscalYear` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `fundingSource` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programType` on the `Program` table. All the data in the column will be lost.
  - Added the required column `fiscalYearId` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fundingSourceId` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programTypeId` to the `Program` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Program_fiscalYear_idx";

-- AlterTable
ALTER TABLE "public"."Program" DROP COLUMN "fiscalYear",
DROP COLUMN "fundingSource",
DROP COLUMN "programType",
ADD COLUMN     "fiscalYearId" TEXT NOT NULL,
ADD COLUMN     "fundingSourceId" TEXT NOT NULL,
ADD COLUMN     "programTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."FundingSource";

-- DropEnum
DROP TYPE "public"."ProgramType";

-- CreateTable
CREATE TABLE "public"."ProgramType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FundingSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FiscalYear" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramType_name_key" ON "public"."ProgramType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramType_code_key" ON "public"."ProgramType"("code");

-- CreateIndex
CREATE INDEX "ProgramType_code_idx" ON "public"."ProgramType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FundingSource_name_key" ON "public"."FundingSource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FundingSource_code_key" ON "public"."FundingSource"("code");

-- CreateIndex
CREATE INDEX "FundingSource_code_idx" ON "public"."FundingSource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_year_key" ON "public"."FiscalYear"("year");

-- CreateIndex
CREATE INDEX "FiscalYear_year_idx" ON "public"."FiscalYear"("year");

-- CreateIndex
CREATE INDEX "Program_fiscalYearId_idx" ON "public"."Program"("fiscalYearId");

-- CreateIndex
CREATE INDEX "Program_fundingSourceId_idx" ON "public"."Program"("fundingSourceId");

-- CreateIndex
CREATE INDEX "Program_programTypeId_idx" ON "public"."Program"("programTypeId");

-- AddForeignKey
ALTER TABLE "public"."Program" ADD CONSTRAINT "Program_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "public"."FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Program" ADD CONSTRAINT "Program_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "public"."FundingSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Program" ADD CONSTRAINT "Program_programTypeId_fkey" FOREIGN KEY ("programTypeId") REFERENCES "public"."ProgramType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
