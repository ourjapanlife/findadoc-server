
import { Specialty } from '../typeDefs/gqlTypes';
import {Specialty as PrismaSpecialty, SpecialtyName} from '@prisma/client';
import prisma from '../db/client';

type SpecialtyAndNames = (PrismaSpecialty & { names: SpecialtyName[]})

function convertPrismaToGraphQLSpecialty(input: SpecialtyAndNames) {
    return {
        id: String(input.id),
        name: input.names
    } as Specialty;
}

// TODO: add a validation step for incoming parameters
export const getSpecialtyById = async (id: string) => {
    const found = await prisma.specialty.findUnique({ where: {
        id: parseInt(id)
    },
    include: {
        names: true
    }});

    if (found) {
        return convertPrismaToGraphQLSpecialty(found);
    }
    return null;
};

export const getSpecialties = async () => {
    const dbSpecialties = await prisma.specialty.findMany({ include: {
        names: true
    }});

    const ret = Array<Specialty>();

    for (let i = 0; i < dbSpecialties.length; i++) {
        ret.push(convertPrismaToGraphQLSpecialty(dbSpecialties[i]));
    }
    return ret;
};
