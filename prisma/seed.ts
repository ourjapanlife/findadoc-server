/* eslint-disable no-console */
// Seed data for the database
// https://www.prisma.io/docs/guides/database/seed-database
import { PrismaClient } from '@prisma/client';
import loadCSVFromFile from './loadCsv';
import devSetup from './devSetup';

const prisma = new PrismaClient();

async function seedSpokenLanguages(verbose = false) {
    const iso639Col = 0;
    const enCol = 1;
    const nativeCol = 2;
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
                nameNative: language[nativeCol]
            }
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

    specialties.forEach(async (specialty: string[], index) => {
        const upserted = await prisma.specialty.upsert({
            where: { id: index },
            update: {},
            create: {
                names: {
                    create: [
                        {locale: 'eng', name: specialty[enCol]},
                        {locale: 'jpn', name: specialty[jaCol]}
                    ]
                }
            }
        });

        if (verbose) {
            console.log(`Inserted ${upserted.id} into Specialties`);
        }
    });
}

async function seedDegrees(verbose = false) {
    const enCol = 0;
    const abbrCol = 1;
    const jaCol = 2;

    const degrees:string[][] = loadCSVFromFile('./prisma/seedData/degrees.csv');

    degrees.forEach(async (degree: string[], index) => {
        const upserted = await prisma.degree.upsert({
            where: { id: index },
            update: {},
            create: {
                nameEn: degree[enCol],
                nameJa: degree[jaCol],
                abbreviation: degree[abbrCol]
            }
        });

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
    .catch(async e => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
