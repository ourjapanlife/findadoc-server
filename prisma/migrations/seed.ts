// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TODO: read from CSV file and insert the values

async function main() {
  console.log('hello');
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
