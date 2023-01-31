import { HealthcareProfessional, LocaleName } from '../typeDefs/gqlTypes'
import { HealthcareProfessional as PrismaHealthcareProfessional,
    LocaleName as PrismaLocaleName } from '@prisma/client'

import prisma from '../db/client'

type HealthcareProfessionalAndRelations = (PrismaHealthcareProfessional & 
    { names: PrismaLocaleName[]})

function convertPrismaToGqlHealthcareProfessional(input: HealthcareProfessionalAndRelations | null) {
    // TODO: populate the rest of the fields in a later PR
    if (!input) { return null }
    const healthPro = {
        id: String(input.id),
        names: Array<LocaleName>(),
        specialties: [],
        spokenLanguages: [],
        acceptedInsurance: [],
        degrees: []
    } as HealthcareProfessional

    for (let i = 0; i < input.names.length; i++) {
        healthPro.names?.push(input.names[i] as LocaleName)
    }

    return healthPro
}

// TODO: add a validation step for incoming parameters
export const getHealthcareProfessionalById = async (id: string) => {
    const healthPro = await prisma.healthcareProfessional.findUnique({ where: {
        id: parseInt(id)
    }, 
    include: {
        names: true  
    }})

    return convertPrismaToGqlHealthcareProfessional(healthPro)
}

export const getHealthcareProfessionals = async () => {
    const healthPros = await prisma.healthcareProfessional.findMany({
        include: {
            names: true
        }
    })

    const gqlHealthPros = Array<HealthcareProfessional>()

    healthPros.forEach(healthPro => {
        const gqlHealthPro = convertPrismaToGqlHealthcareProfessional(healthPro)

        if (gqlHealthPro) { gqlHealthPros.push() }
    })
    
    return gqlHealthPros
}
