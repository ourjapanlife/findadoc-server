/* eslint-disable no-plusplus */
/* eslint-disable no-console */
// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';
import loadCSVFromFile from './loadCSV';
import devSetup from './devSetup';

const prisma = new PrismaClient();

async function seedSpokenLanguages(verbose = false) {
  const iso639Col = 0;
  const enCol = 1;
  const jaCol = 3;

  const spokenLanguages:string[][] = loadCSVFromFile('./prisma/seedData/spokenLanguages.csv');

  spokenLanguages.forEach(async (language: string[]) => {
    const upserted = await prisma.spokenLanguage.upsert({
      where: { iso639_3: language[iso639Col] },
      update: {},
      create: {
        iso639_3: language[iso639Col],
        nameEn: language[enCol],
        nameJa: language[jaCol],
      },
    });

    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`Inserted ${upserted.nameEn} into SpokenLanguages`);
    }
  });
}

async function seedSpecialties(verbose = false) {
  const enCol = 0;
  const jaCol = 1;

  const specialties:string[][] = loadCSVFromFile('./prisma/seedData/specialties.csv');

  let count = 0;
  specialties.forEach(async (specialty: string[]) => {
    const upserted = await prisma.specialty.upsert({
      where: { id: count },
      update: {},
      create: {
        nameEn: specialty[enCol],
        nameJa: specialty[jaCol],
      },
    });

    count++;

    if (verbose) {
      console.log(`Inserted ${upserted.nameEn} into Specialties`);
    }
  });
}

async function seedDegrees(verbose = false) {
  const enCol = 0;
  const abbrCol = 1;
  const jaCol = 2;

  const degrees:string[][] = loadCSVFromFile('./prisma/seedData/degrees.csv');

  let count = 0;
  degrees.forEach(async (degree: string[]) => {
    const upserted = await prisma.degree.upsert({
      where: { id: count },
      update: {},
      create: {
        nameEn: degree[enCol],
        nameJa: degree[jaCol],
        abbreviation: degree[abbrCol],
      },
    });

    count++;

    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`Inserted ${upserted.nameEn} into Degrees`);
    }
  });
}

async function main() {
  const verbose = true;
  await seedSpokenLanguages(verbose);
  await seedSpecialties(verbose);
  await seedDegrees(verbose);

  if (process.env.NODE_ENV === 'development') {
    await devSetup.seedHealthcareProfessionals(prisma, verbose);
    await devSetup.seedFacilities(prisma, verbose);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
