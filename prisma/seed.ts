// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

const prisma = new PrismaClient();

// loads a CSV file from the filesystem, ready for parsing
function loadCSVFromFile(filename: string) {
  const input = fs.readFileSync(filename);

  // Initialize the parser
  const records = parse(input, {
    delimiter: ',',
  });
  return records;
}

// TODO: read from CSV file and insert the values
const spokenLanguages = loadCSVFromFile('seedData/spoken-languages.csv');
console.log(spokenLanguages);

async function main() {
  const japanese = await prisma.spokenLanguage.upsert({
    where: { isoCode: 'ja' },
    update: {},
    create: {
      isoCode: 'ja',
      nameEn: 'Japanese',
      nameJa: '日本語',
    },
  });
  const english = await prisma.spokenLanguage.upsert({
    where: { isoCode: 'en' },
    update: {},
    create: {
      isoCode: 'en',
      nameEn: 'English',
      nameJa: '英語',
    },
  });

  console.log(japanese, english);
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
