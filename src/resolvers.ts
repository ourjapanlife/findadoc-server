import { GraphQLError } from 'graphql'
import * as facilityService from './services/facilityService'
import * as healthcareProfessionalService from './services/healthcareProfessionalService'
import * as gqlType from './typeDefs/gqlTypes'
import * as submissionService from './services/submissionService'
import { Result } from './result'

const resolvers = {
    Query: {
        facilities: async (_parent: unknown, args: { filters: gqlType.FacilitySearchFilters })
        : Promise<gqlType.Facility[]> => {
            const queryResults = await facilityService.searchFacilities(args.filters)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        facility: async (_parent: gqlType.Facility, args: { id: string; })
        : Promise<gqlType.Facility> => {
            const queryResults = await facilityService.getFacilityById(args.id)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        // healthcareProfessionals: async () => {
        //     const matchingProfessionals = await healthcareProfessional.searchHealthcareProfessionals(['1'])
        
        //     convertErrorsToGqlErrors(queryResults)
        //     return matchingProfessionals
        // },
        healthcareProfessional: async (_parent: unknown, args: { id: string; })
            : Promise<gqlType.HealthcareProfessional> => {
            const matchingHealthcareProfessional =
                await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

            convertErrorsToGqlErrors(matchingHealthcareProfessional)
            return matchingHealthcareProfessional.data
        },
        submissions: async (_parent: unknown, args: { filters: gqlType.SubmissionSearchFilters })
        : Promise<gqlType.Submission[]> => {
            const matchingSubmissions = await submissionService.searchSubmissions(args.filters)

            convertErrorsToGqlErrors(matchingSubmissions)
            return matchingSubmissions.data
        },
        submission: async (_parent: unknown, args: { id: string }) => {
            const matchingSubmission = await submissionService.getSubmissionById(args.id)

            return matchingSubmission.data
        }
    },
    Mutation: {
        createFacility: async (_parent: unknown, args: {
            input: gqlType.CreateFacilityInput
        }): Promise<gqlType.Facility> => {
            const newFacilityResult = await facilityService.createFacility(args.input)

            convertErrorsToGqlErrors(newFacilityResult)
            return newFacilityResult.data
        },

        updateFacility: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateFacilityInput
        }): Promise<gqlType.Facility> => {
            const updateFacilityResult = await facilityService.updateFacility(args.id, args.input)

            convertErrorsToGqlErrors(updateFacilityResult)
            return updateFacilityResult.data
        },

        createHealthcareProfessional: async (_parent: unknown, args: {
            input: gqlType.CreateHealthcareProfessionalInput
        }): Promise<gqlType.HealthcareProfessional> => {
            const createHealthcareProfessionalResult =
                await healthcareProfessionalService.createHealthcareProfessional(args.input)

            convertErrorsToGqlErrors(createHealthcareProfessionalResult)
            return createHealthcareProfessionalResult.data
        },

        updateHealthcareProfessional: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateHealthcareProfessionalInput
        }): Promise<gqlType.HealthcareProfessional> => {
            const updateProfessionalResult =
                await healthcareProfessionalService.updateHealthcareProfessional(args.id, args.input)

            convertErrorsToGqlErrors(updateProfessionalResult)
            return updateProfessionalResult.data
        },

        createSubmission: async (_parent: unknown, args: {
            input: gqlType.CreateSubmissionInput
        }): Promise<gqlType.Submission> => {
            const createSubmissionResult = await submissionService.createSubmission(args.input)

            convertErrorsToGqlErrors(createSubmissionResult)
            return createSubmissionResult.data
        },

        updateSubmission: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateSubmissionInput
        }): Promise<gqlType.Submission> => {
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
