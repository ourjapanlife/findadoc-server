import { GraphQLError } from 'graphql';
import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'
import { CustomErrors } from './result'

const resolvers = {
    Query: {
        facilities: async (_parent: gqlType.Facility, args: { filters: gqlType.FacilitySearchFilters }) => {
            const queryResults = await facilityService.searchFacilities(args.filters)

            if (queryResults.hasErrors) {
                throw new GraphQLError('Validation Failed', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                        errors: queryResults.errors
                    }
                })
            }

            return queryResults.data
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            try {
                const queryResults = await facilityService.getFacilityById(args.id)

                //TODO: add validation errors to gql errors
                //TODO: add auth errors to gql errors
                //TODO: add expections to gql errors

                return queryResults.data
            } catch (error) {
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
                return CustomErrors.notFound('The healthcare professional does not exist.')
            }
        },
        submissions: async (_parent: gqlType.Submission, args: { filters: gqlType.SubmissionSearchFilters }) => {
            try {
                const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

                const matchingSubmissions = await submissionService.searchSubmissions(searchFilters)

                return matchingSubmissions
            } catch (error) {
                return CustomErrors.notFound('No submissions were found.')
            }
        },
        submission: async (_parent: gqlType.Submission, args: { id: string }) => {
            const matchingSubmission = await submissionService.getSubmissionById(args.id)

            return matchingSubmission.data
        }
    },
    Mutation: {
        createFacilityWithHealthcareProfessional: async (_parent: gqlType.FacilityInput, args: {
            input: {
                contact: gqlType.ContactInput,
                healthcareProfessionals: gqlType.HealthcareProfessionalInput[],
                healthcareProfessionalIds: string[],
                nameEn: string,
                nameJa: string,
            }
        }) => {
            try {
                const newFacility = await facilityService.addFacility(args.input)

                return newFacility.data
            } catch (error) {
                return CustomErrors.missingInput('Failed to create facility and Healthcare Professional.')
            }
        },
        updateFacility: async (_parent: gqlType.Facility, args: {
            id: string,
            input: {
                id: string,
                nameEn?: string,
                nameJa?: string,
                contact?: gqlType.Contact,
                healthcareProfessionalIds?: string[],
                isDeleted?: boolean,
                createdDate?: string,
                updatedDate?: string
            }
        }) => {
            const updatedFacility = await facilityService.updateFacility(args.id, args.input)

            return updatedFacility.data
        },
        createHealthcareProfessional: async (_parent: gqlType.HealthcareProfessionalInput, args: {
            input: {
                acceptedInsurance: gqlType.Insurance[],
                degrees: gqlType.Degree[],
                names: gqlType.LocaleName[]
                specialties: gqlType.Specialty[]
                spokenLanguages: gqlType.SpokenLanguage[],
                facilityIds: string[],

            }
        }) => {
            const newHealthcareProfessional =
                await healthcareProfessionalService.addHealthcareProfessionalToFacility(
                    args.input
                )

            return newHealthcareProfessional.data
        },
        createSubmission: async (_parent: gqlType.Submission, args: {
            input: {
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
                return CustomErrors.missingInput('Failed to create submission.')
            }
        },
        updateSubmission: async (_parent: gqlType.Submission, args: {
            id: string,
            input: {
                id: string,
                googleMapsUrl?: string,
                healthcareProfessionalName?: string,
                spokenLanguages?: gqlType.SpokenLanguage[],
                isUnderReview?: boolean,
                isApproved?: boolean,
                isRejected?: boolean
            }
        }) => {
            const updatedSubmission = await submissionService.updateSubmission(args.id, args.input)

            return updatedSubmission.data
        }
    }
}

export default resolvers
