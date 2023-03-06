import { HealthcareProfessional, LocaleName, Degree, Specialty } from '../typeDefs/gqlTypes'
import { HealthcareProfessional as PrismaHealthcareProfessional,
    LocaleName as PrismaLocaleName,
    Degree as PrismaDegree,
    Specialty as PrismaSpecialty,
    HealthcareProfessionalDegree as PrismaDegreeRelation,
    HealthcareProfessionalSpecialty as PrismaSpecialtyRelation } from '@prisma/client'

import prisma from '../db/client'

type HealthcareProfessionalAndRelations = (PrismaHealthcareProfessional & 
    { 
        names: PrismaLocaleName[], 
        HealthcareProfessionalDegree: (PrismaDegreeRelation & { 
            Degree: PrismaDegree 
        })[],
        HealthcareProfessionalSpecialty: (PrismaSpecialtyRelation & { 
            Specialty: PrismaSpecialty 
        })[] 
    })

function convertPrismaToGqlHealthcareProfessional(input: HealthcareProfessionalAndRelations | null) {
    // TODO: populate the rest of the fields in a later PR
    if (!input) { return null }

    const healthPro = {
        id: String(input.id),
        names: Array<LocaleName>(),
        specialties: Array<Specialty>(),
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

    for (let i = 0; i < input.HealthcareProfessionalDegree.length; i++) {
        healthPro.degrees?.push({
            id: String(input.HealthcareProfessionalDegree[i].Degree.id),
            nameJa: input.HealthcareProfessionalDegree[i].Degree.nameJa,
            nameEn: input.HealthcareProfessionalDegree[i].Degree.nameEn,
            abbreviation: input.HealthcareProfessionalDegree[i].Degree.abbreviation
        })
    }

    for (let i = 0; i < input.HealthcareProfessionalSpecialty.length; i++) {
        healthPro.specialties?.push({
            id: String(input.HealthcareProfessionalSpecialty[i].Specialty.id)
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
        HealthcareProfessionalDegree: {
            include: {
                Degree: true
            }
        },
        HealthcareProfessionalSpecialty: {
            include: {
                Specialty: {
                    id: true,
                    names: true
                }
            }
        }
    }})

    return convertPrismaToGqlHealthcareProfessional(healthPro)
}

export const getHealthcareProfessionals = async () => {
    const healthPros = await prisma.healthcareProfessional.findMany({
        include: {
            names: true,
            HealthcareProfessionalDegree: {
                include: {
                    Degree: true
                }
            },
            HealthcareProfessionalSpecialty: {
                include: {
                    Specialty: true
                }
            }
        }
    })

    const gqlHealthPros = Array<HealthcareProfessional>()

    healthPros.forEach(healthPro => {
        const gqlHealthPro = convertPrismaToGqlHealthcareProfessional(healthPro)

        if (gqlHealthPro) { gqlHealthPros.push(gqlHealthPro) }
    })
    
    return gqlHealthPros
}
