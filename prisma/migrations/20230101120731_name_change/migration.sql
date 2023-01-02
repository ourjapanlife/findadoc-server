/*
  Warnings:

  - You are about to drop the column `physicalAddressId` on the `Contact` table. All the data in the column will be lost.
  - Added the required column `addressId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_physicalAddressId_fkey";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "physicalAddressId",
ADD COLUMN     "addressId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "PhysicalAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
