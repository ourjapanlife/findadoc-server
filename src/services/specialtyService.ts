
import { Specialty } from '../typeDefs/gqlTypes';
import {Specialty as PrismaSpecialty } from '@prisma/client';
import prisma from '../db/client';

function convertPrismaToGraphQLSpecialty(input: PrismaSpecialty) {
    return {
        id: String(input.id),
        nameEn: input.nameEn,
        nameJa: input.nameJa
    } as Specialty;
}

// TODO: add a validation step for incoming parameters
export const getSpecialtyById = async (id: string) => {
    const found = await prisma.specialty.findUnique({ where: {
        id: parseInt(id)
    }});

    if (found) {
        return convertPrismaToGraphQLSpecialty(found);
    }
    return null;
};

export const getSpecialties = async () => {
    const dbSpecialties = await prisma.specialty.findMany();

    const ret = Array<Specialty>();

    for (let i = 0; i < dbSpecialties.length; i++) {
        ret.push(convertPrismaToGraphQLSpecialty(dbSpecialties[i]));
    }
    return ret;
};
