/* eslint-disable func-names */
/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import loadCSVFromFile from './loadCsv';

const seedHealthcareProfessionals = async function(prisma: PrismaClient, verbose = false) {
    const firstEn = 0;
    const middleEn = 1;
    const lastEn = 2;
    const firstJa = 3;
    const middleJa = 4;
    const lastJa = 5;
    const degreeCol = 6;
    const specialtyCol = 7;
    const spokenLangCol = 8;

    const devData:string[][] = loadCSVFromFile('./prisma/seedData/devHealthcareProfessionals.csv');

    devData.forEach(async (row: string[], index: number) => {
    // generate some unique ids using even/odd strategy
        const enID = 2 * index;
        const jaID = 2 * index + 1;

        // Make a nested write
        const newPersonName = await prisma.personName.upsert({
            where: { id: index },
            update: {},
            create: {
                id: index,
                names: {
                    create: [
                        {
                            id: enID,
                            locale: 'en',
                            firstName: row[firstEn],
                            middleName: row[middleEn],
                            lastName: row[lastEn]
                        },
                        {
                            id: jaID,
                            locale: 'ja',
                            firstName: row[firstJa],
                            middleName: row[middleJa],
                            lastName: row[lastJa]
                        }
                    ]

                }
            }
        });

        if (verbose) {
            console.log(`Inserted ${newPersonName.id} into PersonName`);
        }

        // create a healthcare professional
        const newHealthPro = await prisma.healthcareProfessional.upsert({
            where: { id: index },
            update: {},
            create: {
                id: index,
                personNameId: newPersonName.id,
                isPublished: true
            }
        });

        // Link spoken languages
        const spokenLangList = row[spokenLangCol].split(',');

        spokenLangList.forEach(async lang => {
            const dbSpokenLang = await prisma.spokenLanguage.findFirst(
                {
                    where: {
                        iso639_3: lang
                    }
                }
            );

            if (dbSpokenLang) {
                // TODO change to upsert
                await prisma.healthcareProfessionalSpokenLanguage.create(
                    {
                        data: {
                            spokenLanguageIso639_3: dbSpokenLang.iso639_3,
                            healthcareProfessionalId: newHealthPro.id
                        }
                    }
                );
            }
        });

        // Link Degrees
        const degreeList = row[degreeCol].split(',');

        degreeList.forEach(async degree => {
            const dbDegree = await prisma.degree.findFirst(
                {
                    where: {
                        abbreviation: degree
                    }
                }
            );

            if (dbDegree) {
                // TODO change to upsert
                await prisma.healthcareProfessionalDegree.create(
                    {
                        data: {
                            degreeId: dbDegree.id,
                            healthcareProfessionalId: newHealthPro.id
                        }
                    }
                );
                console.log(dbDegree);
            }
        });

        // Link Specialties
        const specialtyList = row[specialtyCol].split(',');

        specialtyList.forEach(async specialty => {
            // TODO change to upsert
            const dbSpecialtyName = await prisma.specialtyName.findFirst({
                where: {
                    locale: 'en',
                    name: specialty
                }
            });

            if (dbSpecialtyName && dbSpecialtyName.specialtyId) {
                await prisma.healthcareProfessionalSpecialty.create(
                    {
                        data: {
                            specialtyId: dbSpecialtyName.specialtyId,
                            healthcareProfessionalId: newHealthPro.id
                        }
                    }
                );
            }
        });

        if (verbose) {
            console.log(`Inserted ${newHealthPro.id} into HealthcareProfessional`);
        }
    });
};

const seedFacilities = async function(prisma: PrismaClient, verbose = false) {
    const nameEnCol = 0;
    const nameJaCol = 1;
    const emailCol = 2;
    const phoneCol = 3;
    const websiteCol = 4;
    const postalCol = 5;
    const prefectureCol = 6;
    const cityCol = 7;
    const addrLine1Col = 8;
    const addrLine2Col = 9;
    const mapLinkCol = 10;

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
                addressLine2En: row[addrLine2Col]
            }
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
                addressId: newAddress.id
            }
        });

        if (verbose) {
            console.log(`Inserted ${newContact.website} into Contacts`);
        }

        const newFacility = await prisma.facility.upsert({
            where: { id: index },
            update: {},
            create: {
                id: index,
                nameEn: row[nameEnCol],
                nameJa: row[nameJaCol],
                contactId: newContact.id,
                isPublished: true
            }
        });

        if (verbose) {
            console.log(`Inserted ${newFacility.nameEn} into Facilities`);
        }
    });
};

export default { seedFacilities, seedHealthcareProfessionals };
