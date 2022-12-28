/* eslint-disable no-plusplus */
// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const prisma = new PrismaClient();

// loads a CSV file from the filesystem, ready for parsing
function loadCSVFromFile(filename: string, discardHeader = true) {
  const input = fs.readFileSync(filename);

  // Initialize the parser
  const records: string[][] = parse(input, {
    delimiter: ',',
  });

  if (discardHeader) {
    return records.slice(1);
  }

  return records;
}

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
      console.log(`Inserting ${upserted.nameEn} into SpokenLanguages`);
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
      // eslint-disable-next-line no-console
      console.log(`Inserting ${upserted.nameEn} into Specialties`);
    }
  });
}

async function seedDegrees(verbose = false) {
  const enCol = 0;
  const abbrCol = 1;
  const jaCol = 2;

  const degrees:string[][] = loadCSVFromFile('./prisma/seedData/degrees.csv');

  let count = 0;
  degrees.forEach(async (specialty: string[]) => {
    const upserted = await prisma.degree.upsert({
      where: { id: count },
      update: {},
      create: {
        nameEn: degrees[enCol],
        nameJa: degrees[jaCol],
        abbreviation: degrees[abbrCol],
      },
    });

    count++;

    if (verbose) {
      // eslint-disable-next-line no-console
      console.log(`Inserting ${upserted.nameEn} into Degrees`);
    }
  });
}

async function main() {
  const verbose = true;
  await seedSpokenLanguages(verbose);
  await seedSpecialties(verbose);
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
