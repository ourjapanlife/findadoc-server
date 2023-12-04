import request from 'supertest'
import * as gqlTypes from '../src/typeDefs/gqlTypes'
import { expect, describe, test } from 'vitest'
import { Error, ErrorCode } from '../src/result.js'
import * as testData from '../src/fakeData/fakeHealthcareProfessionals.js'
import {createHealthcareProfessionalMutation} from './healthcareProfessional.test'
import { gqlMutation} from '../utils/gqlTool.js'
import { CreateHealthcareProfessionalInput, HealthcareProfessional } from '../src/typeDefs/gqlTypes.js'
import { gqlApiUrl, sharedFacilityIds } from './testSetup.test.js'

describe('error path: validations healthcare professionals', () => {
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

    test('failing: throws an error if specialties is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [],
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

        expect(error.field).toBe('specialties')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if specialties name is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [{names: []}],
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

        expect(error.field).toBe('specialties')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if specialties name is to long', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialitieInvalidLenght()],
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

        expect(error.field).toBe('specialties[0].name')
        expect(error.errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if specialties name contains invalid alphabet', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialitieInvalidAlphabet()],
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

        const errorNameEn = createProfessionalResult.body?.errors[0].extensions.errors[0]
        const errorNameJa = createProfessionalResult.body?.errors[0].extensions.errors[1]

        expect(errorNameEn.field).toBe('specialties[0].name')
        expect(errorNameEn.errorCode).toBe(ErrorCode.CONTAINS_JAPANESE_CHARACTER)
        expect(errorNameEn.httpStatus).toBe(400)

        expect(errorNameJa.field).toBe('specialties[1].name')
        expect(errorNameJa.errorCode).toBe(ErrorCode.CONTAINS_LATIN_CHARACTER)
        expect(errorNameJa.httpStatus).toBe(400)
    })

    test('failing: throws an error if specialties name contains invalid characters', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialitieInvalidCharacters()],
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

        expect(error.field).toBe('specialties[0].name')
        expect(error.errorCode).toBe(ErrorCode.CONTAINS_INVALID_CHARACTER)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if spokenLanguages is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: [],
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

        expect(error.field).toBe('spokenLanguages')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })

    test('failing: throws an error if accepted Insurance is empty', async () => {
        const createFailingHealthcareProfessional = {
            query: createHealthcareProfessionalMutation,
            variables: {
                input: {
                    facilityIds: sharedFacilityIds,
                    names: [testData.generateLocalizedNameInput()],
                    degrees: [testData.generateDegreeInput()],
                    specialties: [testData.generateSpecialty()],
                    spokenLanguages: testData.generateSpokenLanguages(),
                    acceptedInsurance: []
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

        expect(error.field).toBe('insurance')
        expect(error.errorCode).toBe(ErrorCode.REQUIRED)
        expect(error.httpStatus).toBe(400)
    })
})