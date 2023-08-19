import { addFacility, getFacilityById, searchFacilities } from './services/facilityService'
import { addHealthcareProfessionalToFacility } from './services/healthcareProfessionalService'
import {getHealthcareProfessionalById,
    searchHealthcareProfessionals } from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'

const resolvers = {
    Query: {
        facilities: async () => {
            const matchingFacilities = await searchFacilities(['1'])

            return matchingFacilities
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            const matchingFacility = await getFacilityById(args.id)

            return matchingFacility
        },
        healthcareProfessionals: async () => {
            const matchingProfessionals = await searchHealthcareProfessionals(['1'])

            return matchingProfessionals
        },
        healthcareProfessional: async (_parent: gqlType.HealthcareProfessional, args: { id: string; }) => {
            const matchingHealthcareProfessional = await getHealthcareProfessionalById(args.id)

            return matchingHealthcareProfessional
        }
    },
    Mutation: {
        createFacilityWithHealthcareProfessional: async (_parent: gqlType.Facility, args: {
            input: {
                contact: gqlType.Contact,
                healthcareProfessionals: gqlType.HealthcareProfessional[],
                nameEn: string,
                nameJa: string,
            }
        }) => {
            const newFacility = await addFacility(args.input)

            return newFacility
        },
        createHealthcareProfessional: async (_parent: gqlType.HealthcareProfessional, args: {
            input:{
                facilityId: string,
                acceptedInsurance: gqlType.Insurance[],
                degrees: gqlType.Degree[],
                names: gqlType.LocaleName[]
                specialties: gqlType.Specialty[]
                spokenLanguages: gqlType.SpokenLanguage[]

            }
        }) => {
            const newHealthcareProfessional = await addHealthcareProfessionalToFacility(args.input)

            return newHealthcareProfessional
        }

    }
}

export default resolvers
