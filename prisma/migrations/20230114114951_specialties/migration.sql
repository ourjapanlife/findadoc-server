/*
  Warnings:

  - You are about to drop the column `nameEn` on the `Specialty` table. All the data in the column will be lost.
  - You are about to drop the column `nameJa` on the `Specialty` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Specialty" DROP COLUMN "nameEn",
DROP COLUMN "nameJa";

-- CreateTable
CREATE TABLE "SpecialtyName" (
    "id" SERIAL NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialtyId" INTEGER,

    CONSTRAINT "SpecialtyName_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpecialtyName" ADD CONSTRAINT "SpecialtyName_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
