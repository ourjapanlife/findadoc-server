
import { Specialty, SpecialtyName } from '../typeDefs/gqlTypes';
import {Specialty as PrismaSpecialty, SpecialtyName as PrismaSpecialtyName} from '@prisma/client';
import prisma from '../db/client';

type SpecialtyAndNames = (PrismaSpecialty & { names: PrismaSpecialtyName[]})

function convertPrismaToGraphQLSpecialty(input: SpecialtyAndNames) {
    const ret = {
        id: String(input.id),
        names: Array<SpecialtyName>()
    } as Specialty;

    for (let i = 0; i < input.names.length; i++) {
        ret.names?.push({
            name: input.names[i].name,
            locale: input.names[i].locale
        });
    }

    return ret;
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
