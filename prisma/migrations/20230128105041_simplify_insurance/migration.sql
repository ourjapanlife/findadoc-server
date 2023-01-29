/*
  Warnings:

  - The values [UNKNOWN] on the enum `Insurance` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Insurance_new" AS ENUM ('JAPANESE_HEALTH_INSURANCE', 'INTERNATIONAL_HEALTH_INSURANCE', 'INSURANCE_NOT_ACCEPTED');
ALTER TABLE "HealthcareProfessional" ALTER COLUMN "acceptedInsurance" TYPE "Insurance_new"[] USING ("acceptedInsurance"::text::"Insurance_new"[]);
ALTER TYPE "Insurance" RENAME TO "Insurance_old";
ALTER TYPE "Insurance_new" RENAME TO "Insurance";
DROP TYPE "Insurance_old";
COMMIT;
