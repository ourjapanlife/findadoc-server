import request from 'supertest'
import * as gqlTypes from '../src/typeDefs/gqlTypes'
import { expect, describe, test } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import * as testData from '../src/fakeData/fakeHealthcareProfessionals.js'
import { generateRandomCreateHealthcareProfessionalInput as generateCreateProfessionalInput } from '../src/fakeData/fakeHealthcareProfessionals.js'
import { gqlMutation, gqlRequest } from '../utils/gqlTool.js'
import { CreateHealthcareProfessionalInput, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'
import { logger } from '../src/logger.js'

describe('createHealthcareProfessional', () => {
    test('creates a new HealthcareProfessional and adds it to the list of facilities', async () => {
        const createHealthcareProfessionalMutationRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({ facilityIds: sharedFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createHealthcareProfessionalMutationRequest)

        //should not have errors
        const errors = createProfessionalResult.body?.errors

        if (errors) {
            expect(JSON.stringify(errors)).toBeUndefined()
        }

        const createdHealthcareProfessional =
            createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        const getHealthcareProfessionalByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: createdHealthcareProfessional.id
            }
        } as gqlRequest

        const searchResult = await request(gqlApiUrl).post('').send(getHealthcareProfessionalByIdRequest)

        //should not have errors
        expect(searchResult.body?.errors).toBeUndefined()

        const searchedProfessional = searchResult.body.data.healthcareProfessional as HealthcareProfessional
        const originalInputValues = createHealthcareProfessionalMutationRequest.variables.input

        //validate the created HealthcareProfessional has the same values as the original
        expect(searchedProfessional).toBeDefined()
        expect(searchedProfessional.id).toBeDefined()
        expect(searchedProfessional.names[0].firstName).toEqual(originalInputValues.names[0].firstName)
        expect(searchedProfessional.names[0].lastName).toEqual(originalInputValues.names[0].lastName)
        expect(searchedProfessional.names[0].middleName).toEqual(originalInputValues.names[0].middleName || null)
        expect(searchedProfessional.degrees).toEqual(originalInputValues.degrees)
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.acceptedInsurance).toEqual(originalInputValues.acceptedInsurance)
        expect(searchedProfessional.createdDate).toBeDefined()
        expect(searchedProfessional.updatedDate).toBeDefined()
    })

    test('failing: throws an error if the list of facilityIds is empty', async () => {
        //send an empty facilityIds array so the empty list will throw a validation error
        const emptyFacilityIds = [] as string[]

        const createHealthcareProfessionalRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({ facilityIds: emptyFacilityIds })
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createHealthcareProfessionalRequest)
        const createdProfessional
            = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional

        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThan(0)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('facilityIds')
        expect(error.errorCode).toBe(ErrorCode.CREATEPROFFESIONAL_FACILITYIDS_REQUIRED)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if locale and characters used don\'t match', async () => {
        // I iterate through an array of locales to accommodate future language additions.
        const localeToBeTested = [gqlTypes.Locale.JaJp, gqlTypes.Locale.EnUs]

        for (const locale of localeToBeTested) {
            const createFailingHealthcareProfessional = {
                query: createHealthcareProfessionalMutation,
                variables: {
                    input: {
                        facilityIds: sharedFacilityIds,
                        names: [testData.generateFailingNameInvalidAlphabet(locale)],
                        degrees: [testData.generateDegreeInput()],
                        specialties: [testData.generateSpecialty()],
                        spokenLanguages: testData.generateSpokenLanguages(),
                        acceptedInsurance: [testData.generateAcceptedInsurance()]
                    }
                }
            } as gqlMutation<CreateHealthcareProfessionalInput>
    
            const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
            const createdProfessional
                         = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
                
            expect(createdProfessional).toBeFalsy()
            expect(createProfessionalResult.body?.errors).toBeDefined()
            expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
            expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)
    
            const errorFirstName = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error
            const errorlMiddleName = createProfessionalResult.body?.errors[0].extensions.errors[1] as Error
            const errorlLastName = createProfessionalResult.body?.errors[0].extensions.errors[2] as Error
    
            expect(errorFirstName.field).toBe('names[0].firstName')
            expect(errorFirstName.errorCode).toBeDefined()
            expect(errorFirstName.httpStatus).toBe(400)

            expect(errorlMiddleName.field).toBe('names[0].middleName')
            expect(errorlMiddleName.errorCode).toBeDefined()
            expect(errorlMiddleName.httpStatus).toBe(400)

            expect(errorlLastName.field).toBe('names[0].lastName')
            expect(errorlLastName.errorCode).toBeDefined()
            expect(errorlLastName.httpStatus).toBe(400)
        } 
    })

    test('failing: throws an error if same local is is used more than ones in name field', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: testData.generateFailingNameDuplicateLocale(),
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
            
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(1)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error

        expect(error.field).toBe('names[1].locale')
        expect(error.errorCode).toBe(ErrorCode.CONTAINS_DUPLICATE_LOCAL)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if names are to long', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateFailingNameInvalidLenght()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
            
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)

        const errorFirstName = createProfessionalResult.body?.errors[0].extensions.errors[0]
        const errorMiddleName = createProfessionalResult.body?.errors[0].extensions.errors[1]
        const errorLastName = createProfessionalResult.body?.errors[0].extensions.errors[2]

        expect(errorFirstName.field).toBe('names[0].firstName')
        expect(errorFirstName.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorFirstName.httpStatus).toBe(400)

        expect(errorMiddleName.field).toBe('names[0].middleName')
        expect(errorMiddleName.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorMiddleName.httpStatus).toBe(400)

        expect(errorLastName.field).toBe('names[0].lastName')
        expect(errorLastName.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorLastName.httpStatus).toBe(400)
    })

    test('failing: throws an error if names are empty strings', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateFailingNameEmptyString()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
            
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)

        const errorFirstName = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error
        const errorMiddleName = createProfessionalResult.body?.errors[0].extensions.errors[1] as Error
        const errorLastName = createProfessionalResult.body?.errors[0].extensions.errors[2] as Error

        expect(errorFirstName.field).toBe('names[0].firstName')
        expect(errorFirstName.errorCode).toBe(ErrorCode.MISSING_INPUT)
        expect(errorFirstName.httpStatus).toBe(400)

        expect(errorMiddleName.field).toBe('names[0].middleName')
        expect(errorMiddleName.errorCode).toBe(ErrorCode.MISSING_INPUT)
        expect(errorMiddleName.httpStatus).toBe(400)

        expect(errorLastName.field).toBe('names[0].lastName')
        expect(errorLastName.errorCode).toBe(ErrorCode.MISSING_INPUT)
        expect(errorLastName.httpStatus).toBe(400)
    })

    test('failing: throws an error if names have invalid characters', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateFailingNameInvalidCharacter()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
            
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)

        const errorFirstName = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error
        const errorMiddleName = createProfessionalResult.body?.errors[0].extensions.errors[1] as Error
        const errorLastName = createProfessionalResult.body?.errors[0].extensions.errors[2] as Error

        expect(errorFirstName.field).toBe('names[0].firstName')
        expect(errorFirstName.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorFirstName.httpStatus).toBe(400)

        expect(errorMiddleName.field).toBe('names[0].middleName')
        expect(errorMiddleName.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorMiddleName.httpStatus).toBe(400)

        expect(errorLastName.field).toBe('names[0].lastName')
        expect(errorLastName.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorLastName.httpStatus).toBe(400)
    })

    test('failing: throws an error if names is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
            
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(1)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0] as Error
        
        expect(error.field).toBe('names')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if degree name is to long', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateFailingDegreeInvalidLenght()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
        
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)
        
        const errorNameEn = createProfessionalResult.body?.errors[0].extensions.errors[0]
        const errorNameJa = createProfessionalResult.body?.errors[0].extensions.errors[1]
        const errorAbbreviation = createProfessionalResult.body?.errors[0].extensions.errors[2]

        expect(errorNameEn.field).toBe('degrees[0].nameEn')
        expect(errorNameEn.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorNameEn.httpStatus).toBe(400)

        expect(errorNameJa.field).toBe('degrees[0].nameJa')
        expect(errorNameJa.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorNameJa.httpStatus).toBe(400)

        expect(errorAbbreviation.field).toBe('degrees[0].abbreviation')
        expect(errorAbbreviation.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(errorAbbreviation.httpStatus).toBe(400)
    })

    test('failing: throws an error if degree name field doesn\'t match with characters used', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateFailingDegreeInvalidAlphabet()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
        
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(2)
        
        const errorNameEn = createProfessionalResult.body?.errors[0].extensions.errors[0]
        const errorNameJa = createProfessionalResult.body?.errors[0].extensions.errors[1]

        expect(errorNameEn.field).toBe('degrees[0].nameEn')
        expect(errorNameEn.errorCode).toBe(ErrorCode.CONTAINS_JAPANESE_CHARACTER)
        expect(errorNameEn.httpStatus).toBe(400)

        expect(errorNameJa.field).toBe('degrees[0].nameJa')
        expect(errorNameJa.errorCode).toBe(ErrorCode.CONTAINS_LATIN_CHARACTER)
        expect(errorNameJa.httpStatus).toBe(400)
    })

    test('failing: throws an error if degree contains invalid characters', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateFailingDegreeInvalidCharacter()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
        
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(3)

        const errorNameEn = createProfessionalResult.body?.errors[0].extensions.errors[0]
        const errorNameJa = createProfessionalResult.body?.errors[0].extensions.errors[1]
        const errorAbbreviation = createProfessionalResult.body?.errors[0].extensions.errors[2]

        expect(errorNameEn.field).toBe('degrees[0].nameEn')
        expect(errorNameEn.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorNameEn.httpStatus).toBe(400)

        expect(errorNameJa.field).toBe('degrees[0].nameJa')
        expect(errorNameJa.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorNameJa.httpStatus).toBe(400)

        expect(errorAbbreviation.field).toBe('degrees[0].abbreviation')
        expect(errorAbbreviation.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(errorAbbreviation.httpStatus).toBe(400)
    })

    test('failing: throws an error if degree is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: [testData.generateAcceptedInsurance()]
                }
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createProfessionalResult = await request(gqlApiUrl).post('').send(createFailingHealthcareProfessional)
        const createdProfessional
                     = createProfessionalResult.body.data.createHealthcareProfessional as HealthcareProfessional
        
        expect(createdProfessional).toBeFalsy()
        expect(createProfessionalResult.body?.errors).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors[0]).toBeDefined()
        expect(createProfessionalResult.body?.errors[0].extensions.errors.length).toBeGreaterThanOrEqual(1)

        const error = createProfessionalResult.body?.errors[0].extensions.errors[0]

        expect(error.field).toBe('degrees')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})

describe('deleteHealthcareProfessional', () => {
    test('deletes a new healthcare professional', async () => {
        // -- Create a new professional that we plan to delete --
        const createRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({
                    facilityIds: sharedFacilityIds
                }) satisfies CreateHealthcareProfessionalInput
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createResult = await request(gqlApiUrl).post('').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            logger.error(JSON.stringify(createErrors))
            expect(createErrors).toBeUndefined()
        }

        const originalInputValues = createRequest.variables.input
        const newProfessional = createResult.body.data.createHealthcareProfessional as HealthcareProfessional
        const newProfessionalId = newProfessional.id

        const getByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: newProfessional.id
            }
        } as gqlRequest

        // -- Query the professional by id --
        const validQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const searchedProfessional = validQueryResult.body.data.healthcareProfessional as HealthcareProfessional

        // We want to ensure the professional was created before we delete it. 
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.id).toBeDefined()

        const deleteRequest = {
            query: deleteProfessionalMutation,
            variables: {
                id: newProfessionalId
            }
        } as gqlRequest

        // -- Let's try to delete the professional! --
        const deleteResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            logger.error(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteHealthcareProfessional.isSuccessful).toBe(true)

        // -- Let's try to fetch the professional again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getHealthcareProfessionalById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the professional again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteHealthcareProfessional).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteHealthcareProfessional')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

describe('deleteHealthcareProfessional', () => {
    test('deletes a new healthcare professional', async () => {
        // -- Create a new professional that we plan to delete --
        const createRequest = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: generateCreateProfessionalInput({
                    facilityIds: sharedFacilityIds
                }) satisfies CreateHealthcareProfessionalInput
            }
        } as gqlMutation<CreateHealthcareProfessionalInput>

        const createResult = await request(gqlApiUrl).post('').send(createRequest)

        //should not have errors
        const createErrors = createResult.body?.errors

        if (createErrors) {
            logger.error(JSON.stringify(createErrors))
            expect(createErrors).toBeUndefined()
        }

        const originalInputValues = createRequest.variables.input
        const newProfessional = createResult.body.data.createHealthcareProfessional as HealthcareProfessional
        const newProfessionalId = newProfessional.id

        const getByIdRequest = {
            query: getHealthcareProfessionalByIdQuery,
            variables: {
                id: newProfessional.id
            }
        } as gqlRequest

        // -- Query the professional by id --
        const validQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should not have errors
        const queryErrors = createResult.body?.errors

        if (queryErrors) {
            logger.error(JSON.stringify(queryErrors))
            expect(queryErrors).toBeUndefined()
        }

        const searchedProfessional = validQueryResult.body.data.healthcareProfessional as HealthcareProfessional

        // We want to ensure the professional was created before we delete it. 
        expect(searchedProfessional.spokenLanguages).toEqual(originalInputValues.spokenLanguages)
        expect(searchedProfessional.id).toBeDefined()

        const deleteRequest = {
            query: deleteProfessionalMutation,
            variables: {
                id: newProfessionalId
            }
        } as gqlRequest

        // -- Let's try to delete the professional! --
        const deleteResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should not have errors
        const deleteErrors = deleteResult.body?.errors

        if (deleteErrors) {
            logger.error(JSON.stringify(deleteErrors))
            expect(deleteErrors).toBeUndefined()
        }

        // we should have a success response
        expect(deleteResult.body.data.deleteHealthcareProfessional.isSuccessful).toBe(true)

        // -- Let's try to fetch the professional again to confirm it's deleted --
        const missingQueryResult = await request(gqlApiUrl).post('').send(getByIdRequest)

        //should have an error that it doesn't exist
        const validQueryGqlErrors = missingQueryResult.body?.errors
        const validQueryErrors = validQueryGqlErrors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(validQueryErrors))
        expect(validQueryErrors.length).toBe(1)
        expect(validQueryErrors[0]).toBeDefined()
        expect(validQueryErrors[0].field).toBe('getHealthcareProfessionalById')
        expect(validQueryErrors[0].errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR)

        // -- Let's try to delete the professional again! We should receive an error now that it doesn't exist --
        const deleteAgainResult = await request(gqlApiUrl).post('').send(deleteRequest)

        //should have an error that it doesn't exist
        const deleteAgainErrors = deleteAgainResult.body?.errors[0].extensions.errors as Error[]

        logger.error(JSON.stringify(deleteAgainErrors))
        expect(deleteAgainResult.body?.deleteHealthcareProfessional).toBeFalsy()
        expect(deleteAgainErrors.length).toBe(1)
        expect(deleteAgainErrors[0]).toBeDefined()
        expect(deleteAgainErrors[0].field).toBe('deleteHealthcareProfessional')
        expect(deleteAgainErrors[0].errorCode).toBe(ErrorCode.INVALID_ID)
    })
})

export const createHealthcareProfessionalMutation = `mutation test_createHealthcareProfessional($input: CreateHealthcareProfessionalInput!) {
    createHealthcareProfessional(input: $input) {
        id
        names {
            lastName
            firstName
            middleName
            locale
        }
        degrees {
            nameJa
            nameEn
            abbreviation
        }
        specialties {
            names {
                name
                locale
            }
        }
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`

const getHealthcareProfessionalByIdQuery = `query test_getHealthcareProfessionalById($id: ID!) {
    healthcareProfessional(id: $id) {
        id
        names {
            lastName
            firstName
            middleName
            locale
        }
        degrees {
            nameJa
            nameEn
            abbreviation
        }
        specialties {
            names {
                name
                locale
            }
        }
        facilityIds
        spokenLanguages
        acceptedInsurance
        createdDate
        updatedDate
    }
}`

const deleteProfessionalMutation = `mutation test_deleteHealthcareProfessional($id: ID!) {
    deleteHealthcareProfessional(id: $id) {
        isSuccessful
    }
}`
