import { GraphQLError } from 'graphql'
import * as authService from './services/authService.js'
import * as facilityService from './services/facilityService.js'
import * as healthcareProfessionalService from './services/healthcareProfessionalService.js'
import * as gqlType from './typeDefs/gqlTypes.js'
import * as submissionService from './services/submissionService.js'
import { Result } from './result.js'
import { AuthContext, hasAdminRole } from './auth.js'
import { logger } from './logger.js'
import { envVariables } from '../utils/environmentVariables.js'
import jwt from 'jsonwebtoken'

const resolvers = {
    Query: {
        facility: async (_parent: gqlType.Facility, args: { id: string; })
        : Promise<gqlType.Facility> => {
            const queryResults = await facilityService.getFacilityById(args.id)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        facilities: async (_parent: unknown, args: { filters: gqlType.FacilitySearchFilters })
        : Promise<gqlType.Facility[]> => {
            const queryResults = await facilityService.searchFacilities(args.filters)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        healthcareProfessional: async (_parent: unknown, args: { id: string; })
        : Promise<gqlType.HealthcareProfessional> => {
            const matchingHealthcareProfessionalResult =
                await healthcareProfessionalService.getHealthcareProfessionalById(args.id)

            convertErrorsToGqlErrors(matchingHealthcareProfessionalResult)
            return matchingHealthcareProfessionalResult.data
        },
        healthcareProfessionals: async (_parent: unknown, args: {
            filters: gqlType.HealthcareProfessionalSearchFilters
        })
        : Promise<gqlType.HealthcareProfessional[]> => {
            const queryResults =
                await healthcareProfessionalService.searchProfessionals(args.filters)

            convertErrorsToGqlErrors(queryResults)
            return queryResults.data
        },
        submission: async (_parent: unknown, args: { id: string }, context: AuthContext)
        : Promise<gqlType.Submission | undefined> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }
            const matchingSubmissionResult = await submissionService.getSubmissionById(args.id)

            convertErrorsToGqlErrors(matchingSubmissionResult)
            return matchingSubmissionResult.data
        },
        submissions: async (_parent: unknown, args: { filters: gqlType.SubmissionSearchFilters }, context: AuthContext)
        : Promise<gqlType.Submission[]> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const matchingSubmissionsResult = await submissionService.searchSubmissions(args.filters)

            convertErrorsToGqlErrors(matchingSubmissionsResult)
            return matchingSubmissionsResult.data
        }
    },
    Mutation: {
        login: async (_parent: unknown, args: {
            input: gqlType.LoginInput
        }, context: AuthContext): Promise<gqlType.LoginResult> => {
            // check if the user is already authenticated
            if(context.isAuthenticated) {
                return {
                    success: true
                }
            }

            const loginResult = await authService.login(args.input)

            if (loginResult.data.success) {
                console.log('trying to make a cookie now')
                const jwtToken = jwt.sign({ username: args.input.username }, envVariables.authSupertokensAPIKey())
                
                // context.response.setCookie('authorization', jwtToken)
                context.response.setCookie('authorization', jwtToken, { secure: true, httpOnly: true, expires: new Date(Date.now() + 900000)})
                console.log('successfully made a cookie')
            }

            convertErrorsToGqlErrors(loginResult)
            return loginResult.data
        },
        createFacility: async (_parent: unknown, args: {
            input: gqlType.CreateFacilityInput
        }, context: AuthContext): Promise<gqlType.Facility> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const newFacilityResult = await facilityService.createFacility(args.input)

            convertErrorsToGqlErrors(newFacilityResult)
            return newFacilityResult.data
        },

        updateFacility: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateFacilityInput
        }, context: AuthContext): Promise<gqlType.Facility> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const updateFacilityResult = await facilityService.updateFacility(args.id, args.input)

            convertErrorsToGqlErrors(updateFacilityResult)
            return updateFacilityResult.data
        },

        deleteFacility: async (_parent: unknown, args: {
            id: string
        }, context: AuthContext): Promise<gqlType.DeleteResult> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const deleteFacilityResult = await facilityService.deleteFacility(args.id)

            convertErrorsToGqlErrors(deleteFacilityResult)
            return deleteFacilityResult.data
        },

        createHealthcareProfessional: async (_parent: unknown, args: {
            input: gqlType.CreateHealthcareProfessionalInput
        }, context: AuthContext): Promise<gqlType.HealthcareProfessional> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const createHealthcareProfessionalResult =
                await healthcareProfessionalService.createHealthcareProfessional(args.input)

            convertErrorsToGqlErrors(createHealthcareProfessionalResult)
            return createHealthcareProfessionalResult.data
        },

        updateHealthcareProfessional: async (_parent: unknown, args: {
            id: string,
            input: gqlType.UpdateHealthcareProfessionalInput
        }, context: AuthContext): Promise<gqlType.HealthcareProfessional> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const updateProfessionalResult =
                await healthcareProfessionalService.updateHealthcareProfessional(args.id, args.input)

            convertErrorsToGqlErrors(updateProfessionalResult)
            return updateProfessionalResult.data
        },

        deleteHealthcareProfessional: async (_parent: unknown, args: {
            id: string
        }, context: AuthContext): Promise<gqlType.DeleteResult> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const deleteHealthcareProfessionalResult
                = await healthcareProfessionalService.deleteHealthcareProfessional(args.id)

            convertErrorsToGqlErrors(deleteHealthcareProfessionalResult)
            return deleteHealthcareProfessionalResult.data
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
        }, context: AuthContext): Promise<gqlType.Submission> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }
            const updatedSubmissionResult = await submissionService.updateSubmission(args.id, args.input)

            convertErrorsToGqlErrors(updatedSubmissionResult)
            return updatedSubmissionResult.data
        },

        deleteSubmission: async (_parent: unknown, args: {
            id: string
        }, context: AuthContext): Promise<gqlType.DeleteResult> => {
            const isAdmin = context.isAdmin

            if (!isAdmin) {
                throw new GraphQLError('User is not authenticated', {
                    extensions: {
                        code: 'UNAUTHENTICATED',
                        http: { status: 401 }
                    }
                })
            }

            const deleteSubmissionResult = await submissionService.deleteSubmission(args.id)

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
