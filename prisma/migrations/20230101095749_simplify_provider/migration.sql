-- DropForeignKey
ALTER TABLE "HealthcareProfessional" DROP CONSTRAINT "HealthcareProfessional_contactId_fkey";

-- AlterTable
ALTER TABLE "HealthcareProfessional" ALTER COLUMN "contactId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HealthcareProfessional" ADD CONSTRAINT "HealthcareProfessional_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
