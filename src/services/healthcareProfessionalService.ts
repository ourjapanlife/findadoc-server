import { HealthcareProfessional, LocaleName } from '../typeDefs/gqlTypes';
import { HealthcareProfessional as PrismaHealthcareProfessional,
    LocaleName as PrismaLocaleName } from '@prisma/client';

import prisma from '../db/client';

type HealthcareProfessionalAndRelations = (PrismaHealthcareProfessional & 
    { names: PrismaLocaleName[]})

function convertPrismaToGqlHealthcareProfessional(input: HealthcareProfessionalAndRelations) {
    // TODO: populate the rest of the fields in a later PR
    const ret = {
        id: String(input.id),
        names: Array<LocaleName>(),
        specialties: [],
        spokenLanguages: [],
        acceptedInsuranceOptions: [],
        degrees: []
    } as HealthcareProfessional;

    for (let i = 0; i < input.names.length; i++) {
        ret.names?.push(input.names[i] as LocaleName);
    }

    return ret;
}

// TODO: add a validation step for incoming parameters
export const getHealthcareProfessionalById = async (id: string) => {
    const found = await prisma.healthcareProfessional.findUnique({ where: {
        id: parseInt(id)
    }, 
    include: {
        names: true  
    }});

    return found ? convertPrismaToGqlHealthcareProfessional(found) : null;
};

export const getHealthcareProfessionals = async () => {
    const healthPros = await prisma.healthcareProfessional.findMany({
        include: {
            names: true
        }
    });

    const ret = Array<HealthcareProfessional>();

    for (let i = 0; i < healthPros.length; i++) {
        ret.push(convertPrismaToGqlHealthcareProfessional(healthPros[i]));
    }
    return ret;
};
