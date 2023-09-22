import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'
import { CustomErrors } from './result'

const resolvers = {
    Query: {
        facilities: async (_parent: gqlType.Facility, args: { filters: gqlType.FacilitySearchFilters }) => {
            try {
                const queryResults = await facilityService.searchFacilities(args.filters)

                //TODO: add validation errors to gql errors
                //TODO: add auth errors to gql errors
                //TODO: add expections to gql errors

                return queryResults.data
            } catch (error) {
                console.log(error)
                return CustomErrors.notFound('No facilities where found.')
            } 
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            try {
                const queryResults = await facilityService.getFacilityById(args.id)

                //TODO: add validation errors to gql errors
                //TODO: add auth errors to gql errors
                //TODO: add expections to gql errors

                return queryResults.data
            } catch (error) {
                console.log(error)
                console.log('ID:', JSON.stringify(args))
                return CustomErrors.notFound('The facility does not exist.')
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
                console.log(error)
                console.log('ID:', JSON.stringify(args))
                return CustomErrors.notFound('The healthcare professional does not exist.')
            }  
        },
        submissions: async (_parent: gqlType.Submission, args: { filters: gqlType.SubmissionSearchFilters }) => {
            try {
                const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

                const matchingSubmissions = await submissionService.searchSubmissions(searchFilters)

                return matchingSubmissions
            } catch (error) {
                console.log(error)
                console.log('FILTERS:', JSON.stringify(args))
                return CustomErrors.notFound('No submissions where found.')
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
                console.log(error)
                console.log('ID:', JSON.stringify(args))
                return CustomErrors.notFound('The submission does not exist.')
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
                console.error(error)
                console.log('INPUT_FIELD:', JSON.stringify(args))
                return CustomErrors.missingInput('Failed to create facility and Healthcare Professional.')
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
                console.log(error)
                console.log('INPUT_FIELD:', JSON.stringify(args))
                return CustomErrors.missingInput('Failed to create the healthcare professional.')
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
                for (const value of Object.values(args.input)) {
                    if (value === null || value === undefined) {
                        throw new Error('Missing Input')
                    }
                }
                
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
                const addSubmissionResult = await submissionService.addSubmission(submissionData)

                if (addSubmissionResult.hasErrors) {
                    throw new Error('Failed to create submission.')
                }
                return addSubmissionResult.data
            } catch (error) {
                console.log(error)
                console.log('INPUT_FIELDS:', JSON.stringify(args))
                return CustomErrors.missingInput('Failed to create submission.')
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
                let updatedSpokenLanguages: gqlType.SpokenLanguage[] | undefined
                
                if (args.input.spokenLanguages) {
                    const spokenLanguagesResult = submissionService
                        .mapAndValidateSpokenLanguages(args.input.spokenLanguages)
                    
                    if (spokenLanguagesResult.hasErrors) {
                        throw new Error('Invalid spoken Language provided.')
                    }
                    updatedSpokenLanguages = spokenLanguagesResult.data
                }
                
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
                console.log(error)
                console.log('INPUT_FIELDS:', JSON.stringify(args))
                return CustomErrors.missingInput('Failed to update the submission.')
            }
        }
    }
}

export default resolvers
