import { Facility, Contact } from '../typeDefs/gqlTypes'
import {Facility as PrismaFacility, 
    Contact as PrismaContact, PhysicalAddress as PrismaPhysicalAddress } from '@prisma/client'

import prisma from '../db/client'

type FacilityAndRelations = (PrismaFacility & {
    contact: PrismaContact & {
        address: PrismaPhysicalAddress | null;
    }})

function convertPrismaToGraphQLFacility(input: FacilityAndRelations | null) {
    if (!input) { return null }

    const contact = {
        id: String(input.contact.id),
        email: input.contact.email,
        phone: input.contact.phone, 
        website: input.contact.website,
        mapsLink: input.contact.mapsLink, 
        address: input.contact.address
    } as Contact

    const facility = {
        id: String(input.id),
        nameEn: input.nameEn,
        nameJa: input.nameJa,
        contact: contact,
        healthcareProfessionals: []
    } as Facility

    return facility
}

// TODO: add a validation step for incoming parameters
export const getFacilityById = async (id: string) => {
    const facility = await prisma.facility.findUnique(
        {where: {
            id: parseInt(id)
        },
        include: {
            contact: {
                include: {
                    address: true
                }
            }
        }}
    )

    return convertPrismaToGraphQLFacility(facility)
}

export const getFacilities = async () => {
    const facilities = await prisma.facility.findMany(
        {include: {
            contact: {
                include: {
                    address: true
                }
            }
        }}
    )

    const gqlFacilities = Array<Facility>()

    facilities.forEach(facility => {
        const gqlFacility = convertPrismaToGraphQLFacility(facility)

        if (gqlFacility) { gqlFacilities.push(gqlFacility) }
    })

    return gqlFacilities
}
