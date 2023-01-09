/*
  Warnings:

  - Added the required column `nameNative` to the `SpokenLanguage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpokenLanguage" ADD COLUMN     "nameNative" TEXT NOT NULL;
