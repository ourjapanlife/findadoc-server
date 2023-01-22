-- CreateEnum
CREATE TYPE "Insurance" AS ENUM ('JAPANESE_HEALTH_INSURANCE', 'INTERNATIONAL_HEALTH_INSURANCE', 'INSURANCE_NOT_ACCEPTED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "HealthcareProfessional" ADD COLUMN     "acceptedInsurance" "Insurance"[];
