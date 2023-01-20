import { Facility } from '../typeDefs/gqlTypes';
import {Facility as PrismaFacility, Contact as PrismaContact } from '@prisma/client';

import prisma from '../db/client';

type FacilityAndRelations = (PrismaFacility & {
    contact: PrismaContact;
})

function convertPrismaToGraphQLFacility(input: FacilityAndRelations | null) {
    if (!input) { return null; }
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
    const facility = await prisma.facility.findUnique(
        {where: {
            id: parseInt(id)
        },
        include: {
            contact: true
        }}
    );

    return convertPrismaToGraphQLFacility(facility);
};

export const getFacilities = async () => {
    const facilities = await prisma.facility.findMany(
        {include: {
            contact: true
        }}
    );

    const gqlFacilities = Array<Facility>();

    facilities.forEach(facility => {
        const gqlFacility = convertPrismaToGraphQLFacility(facility);

        if (gqlFacility) { gqlFacilities.push(gqlFacility); }
    });

    return gqlFacilities;
};
