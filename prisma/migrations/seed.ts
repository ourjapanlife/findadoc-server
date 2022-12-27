// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

  console.log(japanese);
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
