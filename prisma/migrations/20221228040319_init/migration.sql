-- CreateTable
CREATE TABLE "PersonName" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "PersonName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocaleName" (
    "id" SERIAL NOT NULL,
    "locale" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "personNameId" INTEGER,

    CONSTRAINT "LocaleName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpokenLanguage" (
    "isoCode" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "personNameId" INTEGER NOT NULL,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "HealthcareProfessional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareProfessionalSpecialty" (
    "healthcareProfessionalId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "HealthcareProfessionalSpecialty_pkey" PRIMARY KEY ("healthcareProfessionalId","specialtyId")
);

-- CreateTable
CREATE TABLE "HealthcareProfessionalDegree" (
    "healthcareProfessionalId" INTEGER NOT NULL,
    "degreeId" INTEGER NOT NULL,

    CONSTRAINT "HealthcareProfessionalDegree_pkey" PRIMARY KEY ("healthcareProfessionalId","degreeId")
);

-- CreateTable
CREATE TABLE "HealthcareProfessionalSpokenLanguage" (
    "healthcareProfessionalId" INTEGER NOT NULL,
    "spokenLanguageIsoCode" TEXT NOT NULL,

    CONSTRAINT "HealthcareProfessionalSpokenLanguage_pkey" PRIMARY KEY ("healthcareProfessionalId","spokenLanguageIsoCode")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "contactId" INTEGER NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProfessional_personNameId_key" ON "HealthcareProfessional"("personNameId");

-- AddForeignKey
ALTER TABLE "LocaleName" ADD CONSTRAINT "LocaleName_personNameId_fkey" FOREIGN KEY ("personNameId") REFERENCES "PersonName"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Degree" ADD CONSTRAINT "Degree_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessional" ADD CONSTRAINT "HealthcareProfessional_personNameId_fkey" FOREIGN KEY ("personNameId") REFERENCES "PersonName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessional" ADD CONSTRAINT "HealthcareProfessional_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalSpecialty" ADD CONSTRAINT "HealthcareProfessionalSpecialty_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalSpecialty" ADD CONSTRAINT "HealthcareProfessionalSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalDegree" ADD CONSTRAINT "HealthcareProfessionalDegree_healthcareProfessionalId_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalDegree" ADD CONSTRAINT "HealthcareProfessionalDegree_degreeId_fkey" FOREIGN KEY ("degreeId") REFERENCES "Degree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalSpokenLanguage" ADD CONSTRAINT "HealthcareProfessionalSpokenLanguage_healthcareProfessiona_fkey" FOREIGN KEY ("healthcareProfessionalId") REFERENCES "HealthcareProfessional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthcareProfessionalSpokenLanguage" ADD CONSTRAINT "HealthcareProfessionalSpokenLanguage_spokenLanguageIsoCode_fkey" FOREIGN KEY ("spokenLanguageIsoCode") REFERENCES "SpokenLanguage"("isoCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
