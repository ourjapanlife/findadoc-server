import crypto from 'crypto'
// import { getDegreeById, getDegrees } from './services/degreeService'
import { addFacility, getFacilityById, searchFacilities } from './services/facilityService'
import { getHealthcareProfessionalById, searchHealthcareProfessionals } from './services/healthcareProfessionalService'
// import { getPhysicalAddressById, getPhysicalAddresses } from './services/physicalAddressService'
// import { getSpecialtyById, getSpecialties } from './services/specialtyService'
// import { getSpokenLanguageByIso, getSpokenLanguages } from './services/spokenLanguageService'
import {
    Contact,
    Degree,
    Facility,
    Insurance,
    HealthcareProfessional,
    Specialty,
    LocaleNameInput,
    HealthcareProfessionalInput,
    SpokenLanguage
} from './typeDefs/gqlTypes'

const resolvers = {
    Query: {
        // degrees: () => {
        //     const matchingDegrees = getDegrees()

        //     return matchingDegrees
        // },
        // degree: (_parent: Degree, args: { id: string; }) => {
        //     const matchingDegree = getDegreeById(args.id)

        //     return matchingDegree
        // },
        facilities: async () => {
            // TODO: add a validation step for incoming parameters
            const matchingFacilities = await searchFacilities(['1'])

            return matchingFacilities
        },
        facility: async (_parent: Facility, args: { id: string; }) => {
            // TODO: add a validation step for incoming parameters
            const matchingFacility = await getFacilityById(args.id)

            return matchingFacility
        },
        healthcareProfessionals: async () => {
            // TODO: add a validation step for incoming parameters
            const matchingProfessionals = await searchHealthcareProfessionals(['1'])

            return matchingProfessionals
        },
        healthcareProfessional: async (_parent: HealthcareProfessional, args: { id: string; }) => {
            // TODO: add a validation step for incoming parameters
            const matchingHealthcareProfessional = await getHealthcareProfessionalById(args.id)

            return matchingHealthcareProfessional
        }
        // physicalAddress: (_parent: HealthcareProfessional, args: { id: string; }) => getPhysicalAddressById(args.id),
        // physicalAddresses: () => getPhysicalAddresses(),
        // specialties: () => {
        //     // TODO: add a validation step for incoming parameters
        //     const matchingSpecialties = getSpecialties()

        //     return matchingSpecialties
        // },
        // specialty: (_parent: Specialty, args: { id: string; }) => {
        //     // TODO: add a validation step for incoming parameters
        //     const matchingSpecialty = getSpecialtyById(args.id)

        //     return matchingSpecialty
        // },
        // spokenLanguages: () => getSpokenLanguages(),
        // spokenLanguage: (_parent: SpokenLanguage, args: {iso639_3: string;}) => getSpokenLanguageByIso(args.iso639_3)
    },
    Mutation: {
        createHealthcareProfessional: (_parent: HealthcareProfessionalInput, args: {
      id: string,
      names: Array<LocaleNameInput>,
      degrees: Array<Degree>,
      spokenLanguages: Array<SpokenLanguage>,
      specialties: Array<Specialty>,
      acceptedInsurance: Array<Insurance>
    }) => {
            const id = crypto.randomUUID()

            const {
                names,
                degrees,
                spokenLanguages,
                specialties,
                acceptedInsurance
            } = args

            // TODO: Eventually this should check if a specialty already exists in the DB
            // and match it to that if it does.
            specialties.map((specialty: { id: string }) => {
                if (!specialty.id) {
                    // eslint-disable-next-line no-param-reassign
                    specialty.id = crypto.randomUUID()
                }
                return specialty.id
            })

            const healthcareProfessional = {
                id,
                names,
                degrees,
                spokenLanguages,
                specialties,
                acceptedInsurance
            }

            return healthcareProfessional
        },
        createFacility: async (_parent: any, args: any) => {
            const newFacility = await addFacility(args)

            return newFacility
        }
    }
}

export default resolvers
