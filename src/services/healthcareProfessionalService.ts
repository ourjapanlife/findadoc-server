import { HealthcareProfessional, LocaleName, Degree, Specialty, Insurance, SpokenLanguage } from '../typeDefs/gqlTypes'
import { HealthcareProfessional as PrismaHealthcareProfessional,
    LocaleName as PrismaLocaleName,
    Degree as PrismaDegree,
    Specialty as PrismaSpecialty,
    SpokenLanguage as PrismaSpokenLanguage,
    Insurance as PrismaInsurance,
    HealthcareProfessionalDegree,
    HealthcareProfessionalSpecialty,
    HealthcareProfessionalSpokenLanguage} from '@prisma/client'

import prisma from '../db/client'

type HealthcareProfessionalAndRelations = (PrismaHealthcareProfessional & 
    { 
        names: PrismaLocaleName[], 
        HealthcareProfessionalDegree: (HealthcareProfessionalDegree & { 
            Degree: PrismaDegree 
        })[],
        HealthcareProfessionalSpecialty: (HealthcareProfessionalSpecialty & { 
            Specialty: PrismaSpecialty 
        })[] 
        spokenLanguages: (HealthcareProfessionalSpokenLanguage & {
            SpokenLanguage: PrismaSpokenLanguage
        })[],
    })

function convertPrismaToGqlHealthcareProfessional(input: HealthcareProfessionalAndRelations | null) {
    if (!input) { return null }

    const healthPro = {
        id: String(input.id),
        names: Array<LocaleName>(),
        specialties: Array<Specialty>(),
        spokenLanguages: Array<SpokenLanguage>(),
        acceptedInsurance: input.acceptedInsurance,
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
        const dbDegree = input.HealthcareProfessionalDegree[i].Degree

        healthPro.degrees?.push({
            id: String(dbDegree.id),
            nameJa: dbDegree.nameJa,
            nameEn: dbDegree.nameEn,
            abbreviation: dbDegree.abbreviation
        })
    }

    for (let i = 0; i < input.HealthcareProfessionalSpecialty.length; i++) {
        const dbSpecialty = input.HealthcareProfessionalSpecialty[i].Specialty

        healthPro.specialties?.push({
            id: String(dbSpecialty.id)
        })
    }

    for (let i = 0; i < input.spokenLanguages.length; i++) {
        const dbLanguage = input.spokenLanguages[i].SpokenLanguage

        healthPro.spokenLanguages.push(dbLanguage)
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
        spokenLanguages: {
            include: {
                SpokenLanguage: true
            }
        },
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
    }})

    return convertPrismaToGqlHealthcareProfessional(healthPro)
}

export const getHealthcareProfessionals = async () => {
    const healthPros = await prisma.healthcareProfessional.findMany({
        include: {
            names: true,
            spokenLanguages: {
                include: {
                    SpokenLanguage: true
                }
            },
            HealthcareProfessionalDegree: {
                include: {
                    Degree: true
                }
            },
            HealthcareProfessionalSpecialty: {
                include: {
                    Specialty: {
                        include: {
                            names: true
                        }
                    }
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
