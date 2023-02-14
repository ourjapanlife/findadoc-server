import { Facility } from '../typeDefs/gqlTypes'
import {Facility as PrismaFacility, 
    Contact as PrismaContact, PhysicalAddress as PrismaPhysicalAddress } from '@prisma/client'

import prisma from '../db/client'

type FacilityAndRelations = (PrismaFacility & {
    contact: PrismaContact,
    physicalAddress: PrismaPhysicalAddress
})

function convertPrismaToGraphQLFacility(input: FacilityAndRelations | null) {
    if (!input) { return null }
    return {
        id: String(input.id),
        nameEn: input.nameEn,
        nameJa: input.nameJa,
        contact: input.contact,
        physicalAddress: input.physicalAddress,
        healthcareProfessionals: []
    } as unknown as Facility
}

// TODO: add a validation step for incoming parameters
export const getFacilityById = async (id: string) => {
    const facility = await prisma.facility.findUnique(
        {where: {
            id: parseInt(id)
        },
        include: {
            contact: true,
            physicalAddress: true
        }}
    )

    return convertPrismaToGraphQLFacility(facility)
}

export const getFacilities = async () => {
    const facilities = await prisma.facility.findMany(
        {include: {
            contact: true,
            physicalAddress: true
        }}
    )

    const gqlFacilities = Array<Facility>()

    facilities.forEach(facility => {
        const gqlFacility = convertPrismaToGraphQLFacility(facility)

        if (gqlFacility) { gqlFacilities.push(gqlFacility) }
    })

    return gqlFacilities
}
