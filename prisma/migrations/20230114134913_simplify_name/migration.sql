/*
  Warnings:

  - You are about to drop the column `personNameId` on the `HealthcareProfessional` table. All the data in the column will be lost.
  - You are about to drop the column `personNameId` on the `LocaleName` table. All the data in the column will be lost.
  - You are about to drop the `PersonName` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[locale,healthcareProfessionalId]` on the table `LocaleName` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[locale,specialtyId]` on the table `SpecialtyName` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "HealthcareProfessional" DROP CONSTRAINT "HealthcareProfessional_personNameId_fkey";

-- DropForeignKey
ALTER TABLE "LocaleName" DROP CONSTRAINT "LocaleName_personNameId_fkey";

-- DropIndex
DROP INDEX "HealthcareProfessional_personNameId_key";

-- DropIndex
DROP INDEX "LocaleName_locale_personNameId_key";

-- AlterTable
ALTER TABLE "HealthcareProfessional" DROP COLUMN "personNameId";

-- AlterTable
ALTER TABLE "LocaleName" DROP COLUMN "personNameId",
ADD COLUMN     "healthcareProfessionalId" INTEGER;

-- DropTable
DROP TABLE "PersonName";

-- CreateIndex
CREATE UNIQUE INDEX "LocaleName_locale_healthcareProfessionalId_key" ON "LocaleName"("locale", "healthcareProfessionalId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialtyName_locale_specialtyId_key" ON "SpecialtyName"("locale", "specialtyId");

-- AddForeignKey
ALTER TABLE "LocaleName" ADD CONSTRAINT "LocaleName_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
