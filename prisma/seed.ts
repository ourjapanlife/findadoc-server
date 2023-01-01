/* eslint-disable no-plusplus */
/* eslint-disable no-console */
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

async function seedContacts(verbose = false) {
  const emailCol = 0;
  const phoneCol = 1;
  const websiteCol = 2;
  const postalCol = 3;
  const prefectureCol = 4;
  const cityCol = 5;
  const addrLine1Col = 6;
  const addrLine2Col = 7;
  const mapLinkCol = 8;

  const devData:string[][] = loadCSVFromFile('./prisma/seedData/devData.csv');

  let count = 0;
  devData.forEach(async (row: string[]) => {
    console.log(row);

    const newAddress = await prisma.physicalAddress.upsert({
      where: { id: count },
      update: {},
      create: {
        id: count,
        postalCode: row[postalCol],
        prefectureEn: row[prefectureCol],
        cityEn: row[cityCol],
        addressLine1En: row[addrLine1Col],
        addressLine2En: row[addrLine2Col],
      },
    });

    if (verbose) {
      console.log(`Inserted ${newAddress.addressLine1En} into Addresses`);
    }

    count++;

    const newContact = await prisma.contact.upsert({
      where: { id: count },
      update: {},
      create: {
        id: count,
        email: row[emailCol],
        phone: row[phoneCol],
        website: row[websiteCol],
        mapsLink: row[mapLinkCol],
        physicalAddressId: newAddress.id,
      },
    });

    count++;

    if (verbose) {
      console.log(`Inserted ${newContact.website} into Contacts`);
    }
  });
}

async function main() {
  const verbose = true;
  await seedSpokenLanguages(verbose);
  await seedSpecialties(verbose);
  await seedDegrees(verbose);

  if (process.env.NODE_ENV === 'development') {
    await seedContacts(verbose);
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
