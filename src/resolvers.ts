import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'

const resolvers = {
    Query: {
        facilities: async () => {
            const matchingFacilities = await facilityService.searchFacilities(['1'])

            return matchingFacilities
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            const matchingFacility = await facilityService.getFacilityById(args.id)

            return matchingFacility
        },
        // healthcareProfessionals: async () => {
        //     const matchingProfessionals = await healthcareProfessional.searchHealthcareProfessionals(['1'])

        //     return matchingProfessionals
        // },
        healthcareProfessional: async (_parent: gqlType.HealthcareProfessional, args: { id: string; }) => {
            const matchingHealthcareProfessional = 
            await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

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
            const newFacility = await facilityService.addFacility(args.input)

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
            const newHealthcareProfessional = 
            await healthcareProfessionalService.addHealthcareProfessionalToFacility(args.input)

            return newHealthcareProfessional
        }

    }
}

export default resolvers
