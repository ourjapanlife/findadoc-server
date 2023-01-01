/*
  Warnings:

  - Added the required column `physicalAddressId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "physicalAddressId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PhysicalAddress" (
    "id" SERIAL NOT NULL,
    "postalCode" TEXT NOT NULL,
    "prefectureEn" TEXT NOT NULL,
    "cityEn" TEXT NOT NULL,
    "addressLine1En" TEXT NOT NULL,
    "addressLine2En" TEXT,
    "prefectureJa" TEXT,
    "cityJa" TEXT,
    "addressLine1Ja" TEXT,
    "addressLine2Ja" TEXT,

    CONSTRAINT "PhysicalAddress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_physicalAddressId_fkey" FOREIGN KEY ("physicalAddressId") REFERENCES "PhysicalAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
