/* eslint-disable no-plusplus */
/* eslint-disable no-console */
// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';
import loadCSVFromFile from './loadCSV';

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

async function seedDevHealthcareProfessionals(verbose = false) {
  const firstEn = 0;
  const middleEn = 1;
  const lastEn = 2;
  const firstJa = 3;
  const middleJa = 4;
  const lastJa = 5;

  const devData:string[][] = loadCSVFromFile('./prisma/seedData/devHealthcareProfessionals.csv');

  devData.forEach(async (row: string[], index: number) => {
    const enID = 2 * index;
    const jaID = 2 * index + 1;
    // Make a name for en and ja locales
    const newLocaleNameEn = await prisma.localeName.upsert({
      where: { id: enID },
      update: {},
      create: {
        id: enID,
        locale: 'en',
        firstName: row[firstEn],
        middleName: row[middleEn],
        lastName: row[lastEn],
      },
    });

    const newLocaleNameJa = await prisma.localeName.upsert({
      where: { id: jaID },
      update: {},
      create: {
        id: jaID,
        locale: 'ja',
        firstName: row[firstJa],
        middleName: row[middleJa],
        lastName: row[lastJa],
      },
    });

    if (verbose) {
      console.log(`Inserted ${newLocaleNameEn.lastName}, ${newLocaleNameJa.lastName} into LocaleName`);
    }

    // link them to a name

    // create a healthcare professional
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function seedDevFacilities(verbose = false) {
  const emailCol = 0;
  const phoneCol = 1;
  const websiteCol = 2;
  const postalCol = 3;
  const prefectureCol = 4;
  const cityCol = 5;
  const addrLine1Col = 6;
  const addrLine2Col = 7;
  const mapLinkCol = 8;

  const devData:string[][] = loadCSVFromFile('./prisma/seedData/devFacilities.csv');

  devData.forEach(async (row: string[], index: number) => {
    console.log(row);

    const newAddress = await prisma.physicalAddress.upsert({
      where: { id: index },
      update: {},
      create: {
        id: index,
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

    const newContact = await prisma.contact.upsert({
      where: { id: index },
      update: {},
      create: {
        id: index,
        email: row[emailCol],
        phone: row[phoneCol],
        website: row[websiteCol],
        mapsLink: row[mapLinkCol],
        physicalAddressId: newAddress.id,
      },
    });

    if (verbose) {
      console.log(`Inserted ${newContact.website} into Contacts`);
    }
  });
}

async function main() {
  const verbose = true;
  await seedSpokenLanguages();
  await seedSpecialties();
  await seedDegrees();

  if (process.env.NODE_ENV === 'development') {
    await seedDevHealthcareProfessionals(verbose);
    // await seedDevFacilities(verbose);
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
