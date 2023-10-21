import { GraphQLError } from 'graphql'
import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'
import { CustomErrors, Result } from './result'

const resolvers = {
    Query: {
        facilities: async (_parent: unknown, args: { filters: gqlType.FacilitySearchFilters }) => {
            const queryResults = await facilityService.searchFacilities(args.filters)

            convertErrorsToGqlErrors(queryResults)

            return queryResults.data
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; }) => {
            const queryResults = await facilityService.getFacilityById(args.id)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        // healthcareProfessionals: async () => {
        //     const matchingProfessionals = await healthcareProfessional.searchHealthcareProfessionals(['1'])

        //     return matchingProfessionals
        // },
        healthcareProfessional: async (_parent: unknown, args: { id: string; }) => {
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
        submissions: async (_parent: unknown, args: { filters: gqlType.SubmissionSearchFilters }) => {
            try {
                const searchFilters = submissionService.mapGqlSearchFiltersToDbSearchFilters(args.filters)

                const matchingSubmissions = await submissionService.searchSubmissions(searchFilters)

                return matchingSubmissions
            } catch (error) {
                return CustomErrors.notFound('No submissions were found.')
            }
        },
        submission: async (_parent: unknown, args: { id: string }) => {
            const matchingSubmission = await submissionService.getSubmissionById(args.id)

            return matchingSubmission.data
        }
    },
    Mutation: {
        createFacility: async (_parent: unknown, args: { input: gqlType.CreateHealthcareProfessionalInput 
            }) => {
            try {
                const newFacilityResult = await facilityService.createFacility(args.input)

                convertErrorsToGqlErrors(newFacilityResult)
                return newFacilityResult.data
            } catch (error) {
                return CustomErrors.missingInput('Failed to create facility and Healthcare Professional.')
            }
        },
        updateFacility: async (_parent: unknown, args: { input: gqlType.UpdateFacilityInput 
        }) => {
            const updateFacilityResult = await facilityService.updateFacility(args.id, args.input)

            convertErrorsToGqlErrors(updateFacilityResult)
            return updateFacilityResult.data
        },
        createHealthcareProfessional: async (_parent: unknown, args: { input: gqlType.CreateHealthcareProfessionalInput
        }) => {
            const createHealthcareProfessionalResult =
                await healthcareProfessionalService.addHealthcareProfessionalToFacility(args.input)

            convertErrorsToGqlErrors(createHealthcareProfessionalResult)
            return createHealthcareProfessionalResult.data
        },
        createSubmission: async (_parent: unknown, args: { input: gqlType.CreateSubmissionInput
        }) => {
            try {
                for (const value of Object.values(args.input)) {
                    if (value === null || value === undefined) {
                        throw new Error('Missing Input')
                    }
                }
                const submissionData: gqlType.CreateSubmissionInput = {
                    googleMapsUrl: args.input.googleMapsUrl,
                    healthcareProfessionalName: args.input.healthcareProfessionalName,
                    spokenLanguages: args.input.spokenLanguages
                        .filter(lang => lang !== null)
                        .map(lang => ({
                            iso639_3: lang.iso639_3,
                            nameJa: lang.nameJa,
                            nameEn: lang.nameEn,
                            nameNative: lang.nameNative
                        }))
                }
                const createSubmissionResult = await submissionService.createSubmission(submissionData)

                convertErrorsToGqlErrors(createSubmissionResult)
                return createSubmissionResult.data
            } catch (error) {
                return CustomErrors.missingInput('Failed to create submission.')
            }
        },
        updateSubmission: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateSubmissionInput
        }) => {
            const updatedSubmissionResult = await submissionService.updateSubmission(args.id, args.input)

            convertErrorsToGqlErrors(updatedSubmissionResult)
            return updatedSubmissionResult.data
        }
    }
}

function convertErrorsToGqlErrors(resultObject: Result<unknown>): void {
    if (resultObject.hasErrors) {
        throw new GraphQLError('Validation Failed', {
            extensions: {
                code: 'BAD_USER_INPUT',
                errors: resultObject.errors
            }
        })
    }
}

export default resolvers
