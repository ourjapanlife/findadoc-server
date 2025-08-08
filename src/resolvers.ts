import { GraphQLError } from 'graphql'
import { authorize, UserContext, Scope } from './auth.js'
import * as facilityService from './services/facilityService-pre-migration.js'
import * as healthcareProfessionalService from './services/healthcareProfessionalService-pre-migration.js'
import * as gqlType from './typeDefs/gqlTypes.js'
import * as submissionService from './services/submissionService-pre-migration.js'
import { Result } from './result.js'
import { logger } from './logger.js'

const resolvers = {
    Query: {
        facility: async (_parent: gqlType.Facility, args: { id: string; }, context: UserContext)
        : Promise<gqlType.Facility> => {
            const isAuthorized = authorize(context.user, [Scope['read:facilities']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const queryResults = await facilityService.getFacilityById(args.id)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        facilities: async (_parent: unknown, args: { filters: gqlType.FacilitySearchFilters }, context: UserContext):
        Promise<gqlType.PaginatedFacilities> => {
            const isAuthorized = authorize(context.user, [Scope['read:facilities']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const queryResults = await facilityService.fetchPaginatedFacilities(args.filters)

            convertErrorsToGqlErrors(queryResults)

            // Complete object with facilities and totalCount
            return queryResults.data
        },
        healthcareProfessional: async (_parent: unknown, args: { id: string; }, context: UserContext)
        : Promise<gqlType.HealthcareProfessional> => {
            const isAuthorized = authorize(context.user, [Scope['read:healthcareprofessionals']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const matchingHealthcareProfessionalResult =
                await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

            convertErrorsToGqlErrors(matchingHealthcareProfessionalResult)
            return matchingHealthcareProfessionalResult.data
        },
        healthcareProfessionals: async (_parent: unknown, args: {
            filters: gqlType.HealthcareProfessionalSearchFilters
        }, context: UserContext):
        Promise<gqlType.PaginatedHealthcareProfessionals> => {
            // Authorization check
            const isAuthorized = authorize(context.user, [Scope['read:healthcareprofessionals']])
          
            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }
          
            // Use the new unified service function
            const paginatedResults =
                await healthcareProfessionalService.fetchPaginatedHealthcareProfessionals(args.filters)
          
            // Convert errors if any
            convertErrorsToGqlErrors(paginatedResults)
          
            // The service now returns an object with both the list and the total count
            return paginatedResults.data
        },
        submission: async (_parent: unknown, args: { id: string }, context: UserContext)
        : Promise<gqlType.Submission | undefined> => {
            const isAuthorized = authorize(context.user, [Scope['read:submissions']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const matchingSubmissionResult = await submissionService.getSubmissionById(args.id)

            convertErrorsToGqlErrors(matchingSubmissionResult)
            return matchingSubmissionResult.data
        },
        submissions: async (
            _parent: unknown, 
            args: { filters: gqlType.SubmissionSearchFilters }, 
            context: UserContext
        ): Promise<gqlType.PaginatedSubmissions> => {
            const isAuthorized = authorize(context.user, [Scope['read:submissions']])
          
            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }
            const queryResults = await submissionService.fetchPaginatedSubmissions(args.filters)
          
            convertErrorsToGqlErrors(queryResults)
          
            // Complete object with facilities and totalCount
            return queryResults.data
        }
    },

    Mutation: {
        createFacility: async (_parent: unknown, args: {
            input: gqlType.CreateFacilityInput
        }, context: UserContext): Promise<gqlType.Facility> => {
            const isAuthorized = authorize(context.user, [Scope['write:facilities']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const newFacilityResult = await facilityService.createFacility(args.input, context.user.sub)

            convertErrorsToGqlErrors(newFacilityResult)
            return newFacilityResult.data
        },

        updateFacility: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateFacilityInput
        }, context: UserContext): Promise<gqlType.Facility> => {
            const isAuthorized = authorize(context.user, [Scope['write:facilities']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const updateFacilityResult = await facilityService.updateFacility(args.id, args.input, context.user.sub)

            convertErrorsToGqlErrors(updateFacilityResult)
            return updateFacilityResult.data
        },

        deleteFacility: async (_parent: unknown, args: {
            id: string
        }, context: UserContext): Promise<gqlType.DeleteResult> => {
            const isAuthorized = authorize(context.user, [Scope['delete:facilities']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const deleteFacilityResult = await facilityService.deleteFacility(args.id, context.user.sub)

            convertErrorsToGqlErrors(deleteFacilityResult)
            return deleteFacilityResult.data
        },

        createHealthcareProfessional: async (_parent: unknown, args: {
            input: gqlType.CreateHealthcareProfessionalInput
        }, context: UserContext): Promise<gqlType.HealthcareProfessional> => {
            const isAuthorized = authorize(context.user, [Scope['write:healthcareprofessionals']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const newHealthcareProfessionalResult = await healthcareProfessionalService
                .createHealthcareProfessional(args.input, context.user.sub)

            convertErrorsToGqlErrors(newHealthcareProfessionalResult)
            return newHealthcareProfessionalResult.data
        },

        updateHealthcareProfessional: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateHealthcareProfessionalInput
        }, context: UserContext): Promise<gqlType.HealthcareProfessional> => {
            const isAuthorized = authorize(context.user, [Scope['write:healthcareprofessionals']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const updateHealthcareProfessionalResult = await healthcareProfessionalService
                .updateHealthcareProfessional(args.id, args.input, context.user.sub)

            convertErrorsToGqlErrors(updateHealthcareProfessionalResult)
            return updateHealthcareProfessionalResult.data
        },

        deleteHealthcareProfessional: async (_parent: unknown, args: {
            id: string
        }, context: UserContext): Promise<gqlType.DeleteResult> => {
            const isAuthorized = authorize(context.user, [Scope['delete:healthcareprofessionals']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const deleteHealthcareProfessionalResult = await healthcareProfessionalService
                .deleteHealthcareProfessional(args.id, context.user.sub)

            convertErrorsToGqlErrors(deleteHealthcareProfessionalResult)
            return deleteHealthcareProfessionalResult.data
        },

        createSubmission: async (_parent: unknown, args: {
            input: gqlType.CreateSubmissionInput
        }, context: UserContext): Promise<gqlType.Submission> => {
            const isAuthorized = authorize(context.user, [Scope['write:submissions'], Scope['create:submissions']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const createSubmissionResult = await submissionService.createSubmission(args.input)

            convertErrorsToGqlErrors(createSubmissionResult)
            return createSubmissionResult.data
        },

        updateSubmission: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateSubmissionInput
        }, context: UserContext): Promise<gqlType.Submission> => {
            const isAuthorized = authorize(context.user, [Scope['write:submissions']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const updatedSubmissionResult = await submissionService.updateSubmission(
                args.id,
                args.input,
                context.user.sub
            )

            convertErrorsToGqlErrors(updatedSubmissionResult)
            return updatedSubmissionResult.data
        },

        deleteSubmission: async (_parent: unknown, args: {
            id: string
        }, context: UserContext): Promise<gqlType.DeleteResult> => {
            const isAuthorized = authorize(context.user, [Scope['delete:submissions']])

            if (!isAuthorized) {
                throw new GraphQLError('User is not authorized', {
                    extensions: {
                        code: 'UNAUTHORIZED',
                        http: { status: 403 }
                    }
                })
            }

            const deleteSubmissionResult = await submissionService.deleteSubmission(args.id, context.user.sub)

            convertErrorsToGqlErrors(deleteSubmissionResult)
            return deleteSubmissionResult.data
        }
    }
}

function convertErrorsToGqlErrors(resultObject: Result<unknown>): void {
    if (resultObject.hasErrors) {
        logger.info(`Errors sent to user: ${JSON.stringify(resultObject.errors)}`)

        throw new GraphQLError('Validation Failed', {
            extensions: {
                code: 'BAD_USER_INPUT',
                errors: resultObject.errors
            }
        })
    }
}

export default resolvers
