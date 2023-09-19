import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'

const resolvers = {
    Query: {
        facilities: async (_parent: gqlType.Facility, args: { filters: gqlType.FacilitySearchFilters }) => {
            const queryResults = await facilityService.searchFacilities(args.filters)

            //TODO: add validation errors to gql errors
            //TODO: add auth errors to gql errors
            //TODO: add expections to gql errors

            return queryResults.data
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            const queryResults = await facilityService.getFacilityById(args.id)

            //TODO: add validation errors to gql errors
            //TODO: add auth errors to gql errors
            //TODO: add expections to gql errors

            return queryResults.data
        },
        // healthcareProfessionals: async () => {
        //     const matchingProfessionals = await healthcareProfessional.searchHealthcareProfessionals(['1'])

        //     return matchingProfessionals
        // },
        healthcareProfessional: async (_parent: gqlType.HealthcareProfessional, args: { id: string; }) => {
            const matchingHealthcareProfessional = 
            await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

            return matchingHealthcareProfessional
        },
        submissions: async (_parent: gqlType.Submission, args: { filters: gqlType.SubmissionSearchFilters }) => {
            const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

            const matchingSubmissions = await submissionService.searchSubmissions(searchFilters)

            return matchingSubmissions
        },
        submission: async (_parent: gqlType.Submission, args: { id: string }) => {
            const matchingSubmission = await submissionService.getSubmissionById(args.id)

            return matchingSubmission
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
        },
        createSubmission: async (_parent: gqlType.Submission, args: {
            input:{
                googleMapsUrl: string,
                healthcareProfessionalName: string,
                spokenLanguages: gqlType.SpokenLanguage[]
            }
        }) => {
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
                throw new Error(`Failed to update submission: ${error}`)
            }
        }
    }
}

export default resolvers
