-- CreateTable
CREATE TABLE "PersonName" (
    "id" SERIAL NOT NULL,
    "firstEn" TEXT NOT NULL,
    "middleEn" TEXT NOT NULL,
    "lastEn" TEXT NOT NULL,
    "firstJa" TEXT NOT NULL,
    "middleJa" TEXT NOT NULL,
    "lastJa" TEXT NOT NULL,

    CONSTRAINT "PersonName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpokenLanguage" (
    "isoCode" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "healthcareProfessionalId" INTEGER,

    CONSTRAINT "SpokenLanguage_pkey" PRIMARY KEY ("isoCode")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "healthcareProfessionalId" INTEGER,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Degree" (
    "id" SERIAL NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "healthcareProfessionalId" INTEGER,

    CONSTRAINT "Degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareProfessional" (
    "id" SERIAL NOT NULL,
    "personNameId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "HealthcareProfessional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "mapsLink" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpokenLanguage" ADD CONSTRAINT "SpokenLanguage_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessional" ADD CONSTRAINT "HealthcareProfessional_personNameId_fkey" FOREIGN KEY ("personNameId") REFERENCES "PersonName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessional" ADD CONSTRAINT "HealthcareProfessional_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
