/*
  Warnings:

  - You are about to drop the column `healthcareProfessionalId` on the `Degree` table. All the data in the column will be lost.
  - You are about to drop the column `healthcareProfessionalId` on the `Specialty` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Degree" DROP CONSTRAINT "Degree_healthcareProfessionalId_fkey";

-- DropForeignKey
ALTER TABLE "Specialty" DROP CONSTRAINT "Specialty_healthcareProfessionalId_fkey";

-- AlterTable
ALTER TABLE "Degree" DROP COLUMN "healthcareProfessionalId";

-- AlterTable
ALTER TABLE "Specialty" DROP COLUMN "healthcareProfessionalId";
