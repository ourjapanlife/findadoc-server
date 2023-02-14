import { PhysicalAddress } from '../typeDefs/gqlTypes'
import {PhysicalAddress as PrismaPhysicalAddress} from '@prisma/client'
import prisma from '../db/client'

function convertPrismaToGqlPhysicalAddress(input: PrismaPhysicalAddress | null) {
    if (!input) { return null }
    return {
        id: String(input.id),
        postalCode: input.postalCode,
        prefectureEn: input.prefectureEn,
        cityEn: input.cityEn,
        addressLine1En: input.addressLine1En,
        addressLine2En: input.addressLine2En,
        prefectureJa: input.prefectureJa,
        cityJa: input.cityJa,
        addressLine1Ja: input.addressLine1Ja,
        addressLine2Ja: input.addressLine2Ja
    }
}

export const getPhysicalAddresses = async () => {
    const addresses = await prisma.physicalAddress.findMany()

    const gqlAddresses = Array<PhysicalAddress>()

    addresses.forEach(address => {
        const gqlAddress = convertPrismaToGqlPhysicalAddress(address)

        if (gqlAddress) { gqlAddresses.push(gqlAddress) }
    })
    return gqlAddresses
}

export const getPhysicalAddressById = async (id: string) => {
    const address = await prisma.physicalAddress.findUnique(
        {where: {id: parseInt(id)}}
    )

    return convertPrismaToGqlPhysicalAddress(address)
}
