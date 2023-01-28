import { Degree } from '../typeDefs/gqlTypes';
import {Degree as PrismaDegree } from '@prisma/client';

import prisma from '../db/client';

function convertPrismaToGraphQLDegree(input: PrismaDegree | null) {
    if (!input) { return null; }
    return {
        id: String(input.id),
        nameJa: input.nameJa,
        nameEn: input.nameEn,
        abbreviation: input.abbreviation
    } as Degree;
}

// TODO: add a validation step for incoming parameters
export const getDegreeById = async (id: string) => {
    const degree = await prisma.degree.findUnique(
        {where: {id: parseInt(id)}}
    );

    return convertPrismaToGraphQLDegree(degree);
};

export const getDegrees = async () => {
    const degrees = await prisma.degree.findMany();

    const gqlDegrees = Array<Degree>();

    degrees.forEach(degree => {
        const gqlDegree = convertPrismaToGraphQLDegree(degree);

        if (gqlDegree) { gqlDegrees.push(gqlDegree); }
    });

    return gqlDegrees;
};
