import { addFacility, getFacilityById, searchFacilities } from './services/facilityService'
import { addHealthcareProfessional, 
    getHealthcareProfessionalById,
    searchHealthcareProfessionals } from './services/healthcareProfessionalService'
import {
    Contact,
    Degree,
    Facility,
    Insurance,
    HealthcareProfessional,
    Specialty,
    LocaleNameInput,
    HealthcareProfessionalInput,
    SpokenLanguage,
    LocaleName,
    DegreeInput,
    SpecialtyInput,
    SpokenLanguageInput,
    FacilityInput,
    ContactInput
} from './typeDefs/gqlTypes'

const resolvers = {
    Query: {
        facilities: async () => {
            const matchingFacilities = await searchFacilities(['1'])

            return matchingFacilities
        },
        facility: async (_parent: Facility, args: { id: string; }) => {
            const matchingFacility = await getFacilityById(args.id)

            return matchingFacility
        },
        healthcareProfessionals: async () => {
            const matchingProfessionals = await searchHealthcareProfessionals(['1'])

            return matchingProfessionals
        },
        healthcareProfessional: async (_parent: HealthcareProfessional, args: { id: string; }) => {
            const matchingHealthcareProfessional = await getHealthcareProfessionalById(args.id)

            return matchingHealthcareProfessional
        }
    },
    Mutation: {
        createFacility: async (_parent: FacilityInput, args: {
            input: {
                contact: ContactInput,
                healthcareProfessionals: HealthcareProfessionalInput[],
                nameEn: string,
                nameJa: string,
            }
        }) => {
            const newFacility = await addFacility(args.input)

            return newFacility
        },
        createHealthcareProfessional: async (_parent: HealthcareProfessionalInput, args: {
            input:{
                acceptedInsurance: Insurance[],
                degrees: Degree[],
                names: LocaleName[]
                specialties: SpecialtyInput[]
                spokenLanguages: SpokenLanguageInput[]

            }
        }) => {
            const newHealthcareProfessional = await addHealthcareProfessional(args.input)

            return newHealthcareProfessional
        }

    }
}

export default resolvers
