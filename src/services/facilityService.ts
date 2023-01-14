import { Facility } from '../typeDefs/gqlTypes';
import {Facility as PrismaFacility, Contact as PrismaContact } from '@prisma/client';

import prisma from '../db/client';

type FacilityAndRelations = (PrismaFacility & {
    contact: PrismaContact;
})

function convertPrismaToGraphQLFacility(input: FacilityAndRelations) {
    return {
        id: String(input.id),
        nameJa: input.nameJa,
        nameEn: input.nameEn,
        contact: input.contact,
        healthcareProfessionals: []
    } as Facility;
}

// TODO: add a validation step for incoming parameters
export const getFacilityById = async (id: string) => {
    const found = await prisma.facility.findUnique(
        {where: {
            id: parseInt(id)
        },
        include: {
            contact: true
        }}
    );

    return found ? convertPrismaToGraphQLFacility(found) : null;
};

export const getFacilities = async () => {
    const facilities = await prisma.facility.findMany(
        {include: {
            contact: true
        }}
    );

    const ret = Array<Facility>();

    for (let i = 0; i < facilities.length; i++) {
        ret.push(convertPrismaToGraphQLFacility(facilities[i]));
    }

    return ret;
};
