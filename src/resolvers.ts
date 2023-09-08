import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'
import CustomErrors from './errors'

const resolvers = {
    Query: {
        facilities: async () => {
            try {
                const matchingFacilities = await facilityService.searchFacilities(['1'])

                return matchingFacilities
            } catch (error) {
                return CustomErrors.notFound(`Failed to find facilities: ${error}`)
            } 
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            try {
                if (!args.id || !args.id.trim()) {
                    throw new Error('An ID was not provided')
                }
                const matchingFacility = await facilityService.getFacilityById(args.id)

                return matchingFacility            
            } catch (error) {
                return CustomErrors.notFound(`Failed to find the facility: ${error}`)
            } 
        },
        // healthcareProfessionals: async () => {
        //     const matchingProfessionals = await healthcareProfessional.searchHealthcareProfessionals(['1'])

        //     return matchingProfessionals
        // },
        healthcareProfessional: async (_parent: gqlType.HealthcareProfessional, args: { id: string; }) => {
            try {
                if (!args.id || !args.id.trim()) {
                    throw new Error('An ID was not provided')
                }
                const matchingHealthcareProfessional = 
                await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

                return matchingHealthcareProfessional        
            } catch (error) {
                return CustomErrors.notFound(`${error}`)
            }  
        },
        submissions: async (_parent: gqlType.Submission, args: { filters: gqlType.SubmissionSearchFilters }) => {
            try {
                const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

                const matchingSubmissions = await submissionService.getSubmissions(searchFilters)

                return matchingSubmissions
            } catch (error) {
                return CustomErrors.notFound(`Failed to find submissions: ${error}`)
            }
        },
        submission: async (_parent: gqlType.Submission, args: { id: string }) => {
            try {
                if (!args.id || !args.id.trim()) {
                    throw new Error('An ID was not provided')
                }
                const matchingSubmission = await submissionService.getSubmissionById(args.id)

                return matchingSubmission           
            } catch (error) {
                return CustomErrors.notFound(`Failed to find the submission: ${error}`)
            }  
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
            try {
                const newFacility = await facilityService.addFacility(args.input)

                return newFacility
            } catch (error) {
                return CustomErrors.missingInput(`Failed to create facility with healthcare professional: ${error}`)
            }  
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
            try {
                const newHealthcareProfessional = 
                await healthcareProfessionalService.addHealthcareProfessionalToFacility(args.input)

                return newHealthcareProfessional
            } catch (error) {
                return CustomErrors.missingInput(`Failed to create healthcare professional: ${error}`)
            }
        },
        createSubmission: async (_parent: gqlType.Submission, args: {
            input:{
                googleMapsUrl: string,
                healthcareProfessionalName: string,
                spokenLanguages: gqlType.SpokenLanguage[]
            }
        }) => {
            try {
                const submissionData: gqlType.Submission = {
                    id: '',
                    googleMapsUrl: args.input.googleMapsUrl,
                    healthcareProfessionalName: args.input.healthcareProfessionalName,
                    spokenLanguages: args.input.spokenLanguages
                        .filter(lang => lang !== null)
                        .map(lang => ({
                            iso639_3: lang.iso639_3,
                            nameJa: lang.nameJa,
                            nameEn: lang.nameEn,
                            nameNative: lang.nameNative
                        })),
                    isUnderReview: true,
                    isApproved: false,
                    isRejected: false,
                    createdDate: new Date().toISOString(),
                    updatedDate: new Date().toISOString()
                }
                const newSubmission = await submissionService.addSubmission(submissionData)
    
                return newSubmission
            } catch (error) {
                return CustomErrors.missingInput(`Failed to create submission: ${error}`)
            }
        },
        updateSubmission: async (_parent: gqlType.Submission, args: {
            id: string,
            input: {
                googleMapsUrl?: string,
                healthcareProfessionalName?: string,
                spokenLanguages?: gqlType.SpokenLanguage[],
                isUnderReview?: boolean,
                isApproved?: boolean,
                isRejected?: boolean
            }
        }) => {
            try {
                const updatedSpokenLanguages = args.input.spokenLanguages ?
                    submissionService.mapAndValidateSpokenLanguages(args.input.spokenLanguages)
                    : undefined
                
                const gqlUpdatedFields: Partial<gqlType.Submission> = {
                    ...args.input,
                    spokenLanguages: updatedSpokenLanguages
                }

                const dbUpdatedFields = submissionService
                    .convertGqlSubmissionUpdateToDbSubmissionUpdate(gqlUpdatedFields)

                await submissionService.updateSubmission(args.id, dbUpdatedFields)

                const updatedSubmission = await submissionService.getSubmissionById(args.id)

                return updatedSubmission
            } catch (error) {
                return CustomErrors.missingInput(`Failed to update submission: ${error}`)
            }
        }
    }
}

export default resolvers