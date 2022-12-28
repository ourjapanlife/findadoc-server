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

async function main() {
  const spokenLanguages:string[][] = loadCSVFromFile('./prisma/seedData/spokenLanguages.csv');

  // TODO: this depends on "magic values" -- refactor later to use headers to build objects
  spokenLanguages.forEach(async (language: string[]) => {
    const upserted = await prisma.spokenLanguage.upsert({
      where: { iso639_3: language[0] },
      update: {},
      create: {
        iso639_3: language[0],
        nameEn: language[1],
        nameJa: language[3],
      },
    });

    console.log(`Inserting ${upserted.nameEn}`);
  });
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
