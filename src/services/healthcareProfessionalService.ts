import { HealthcareProfessional, LocaleName, Degree } from '../typeDefs/gqlTypes'
import { HealthcareProfessional as PrismaHealthcareProfessional,
    LocaleName as PrismaLocaleName,
    Degree as PrismaDegree } from '@prisma/client'

import prisma from '../db/client'

type HealthcareProfessionalAndRelations = (PrismaHealthcareProfessional & 
    { names: PrismaLocaleName[], degrees: PrismaDegree[] })

function convertPrismaToGqlHealthcareProfessional(input: HealthcareProfessionalAndRelations | null) {
    // TODO: populate the rest of the fields in a later PR
    if (!input) { return null }

    const healthPro = {
        id: String(input.id),
        names: Array<LocaleName>(),
        specialties: [],
        spokenLanguages: [],
        acceptedInsurance: [],
        degrees: Array<Degree>()
    } as HealthcareProfessional

    for (let i = 0; i < input.names.length; i++) {
        healthPro.names?.push({
            firstName: input.names[i].firstName,
            middleName: input.names[i].middleName,
            lastName: input.names[i].lastName,
            locale: input.names[i].locale
        })
    }

    for (let i = 0; i < input.degrees.length; i++) {
        healthPro.degrees?.push({
            id: String(input.degrees[i].id),
            nameJa: input.degrees[i].nameJa,
            nameEn: input.degrees[i].nameEn,
            abbreviation: input.degrees[i].abbreviation
        })
    }

    return healthPro
}

// TODO: add a validation step for incoming parameters
export const getHealthcareProfessionalById = async (id: string) => {
    const healthPro = await prisma.healthcareProfessional.findUnique({ where: {
        id: parseInt(id)
    }, 
    include: {
        names: true,
        degrees: true
        
    }})

    return convertPrismaToGqlHealthcareProfessional(healthPro)
}

export const getHealthcareProfessionals = async () => {
    const healthPros = await prisma.healthcareProfessional.findMany({
        include: {
            names: true,
            degrees: true
         
        }
    })

    const gqlHealthPros = Array<HealthcareProfessional>()

    healthPros.forEach(healthPro => {
        const gqlHealthPro = convertPrismaToGqlHealthcareProfessional(healthPro)

        if (gqlHealthPro) { gqlHealthPros.push(gqlHealthPro) }
    })
    
    return gqlHealthPros
}
