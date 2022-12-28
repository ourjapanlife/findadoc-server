/*
  Warnings:

  - You are about to drop the column `published` on the `Facility` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `HealthcareProfessional` table. All the data in the column will be lost.
  - The primary key for the `HealthcareProfessionalSpokenLanguage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `spokenLanguageIsoCode` on the `HealthcareProfessionalSpokenLanguage` table. All the data in the column will be lost.
  - The primary key for the `SpokenLanguage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isoCode` on the `SpokenLanguage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locale,personNameId]` on the table `LocaleName` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spokenLanguageIso639_3` to the `HealthcareProfessionalSpokenLanguage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LocaleName` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PersonName` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iso639_3` to the `SpokenLanguage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HealthcareProfessionalSpokenLanguage" DROP CONSTRAINT "HealthcareProfessionalSpokenLanguage_spokenLanguageIsoCode_fkey";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Facility" DROP COLUMN "published",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "HealthcareProfessional" DROP COLUMN "published",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "HealthcareProfessionalSpokenLanguage" DROP CONSTRAINT "HealthcareProfessionalSpokenLanguage_pkey",
DROP COLUMN "spokenLanguageIsoCode",
ADD COLUMN     "spokenLanguageIso639_3" TEXT NOT NULL,
ADD CONSTRAINT "HealthcareProfessionalSpokenLanguage_pkey" PRIMARY KEY ("healthcareProfessionalId", "spokenLanguageIso639_3");

-- AlterTable
ALTER TABLE "LocaleName" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "middleName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PersonName" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SpokenLanguage" DROP CONSTRAINT "SpokenLanguage_pkey",
DROP COLUMN "isoCode",
ADD COLUMN     "iso639_3" TEXT NOT NULL,
ADD CONSTRAINT "SpokenLanguage_pkey" PRIMARY KEY ("iso639_3");

-- CreateIndex
CREATE UNIQUE INDEX "LocaleName_locale_personNameId_key" ON "LocaleName"("locale", "personNameId");

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalSpokenLanguage" ADD CONSTRAINT "HealthcareProfessionalSpokenLanguage_spokenLanguageIso639__fkey" FOREIGN KEY ("spokenLanguageIso639_3") REFERENCES "SpokenLanguage"("iso639_3") ON DELETE RESTRICT ON UPDATE CASCADE;
