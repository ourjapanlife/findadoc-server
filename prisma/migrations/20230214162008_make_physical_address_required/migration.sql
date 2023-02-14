/*
  Warnings:

  - Added the required column `physicalAddressId` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Made the column `addressLine2En` on table `PhysicalAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prefectureJa` on table `PhysicalAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cityJa` on table `PhysicalAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addressLine1Ja` on table `PhysicalAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addressLine2Ja` on table `PhysicalAddress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "physicalAddressId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PhysicalAddress" ALTER COLUMN "addressLine2En" SET NOT NULL,
ALTER COLUMN "prefectureJa" SET NOT NULL,
ALTER COLUMN "cityJa" SET NOT NULL,
ALTER COLUMN "addressLine1Ja" SET NOT NULL,
ALTER COLUMN "addressLine2Ja" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_physicalAddressId_fkey" FOREIGN KEY ("physicalAddressId") REFERENCES "PhysicalAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
