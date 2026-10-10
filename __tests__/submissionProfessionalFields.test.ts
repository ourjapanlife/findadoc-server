import { describe, expect, test } from 'vitest'
import { Degree, Insurance, Locale, Specialty } from '../src/typeDefs/gqlTypes.js'
import { ErrorCode } from '../src/result.js'
import {
    validateApprovalProfessionalFields,
    validateUpdateSubmissionInput
} from '../src/validation/validateSubmissions.js'

const draftProfessional = {
    names: [{ locale: Locale.EnUs, firstName: 'Ada', lastName: 'Lovelace' }],
    spokenLanguages: [Locale.EnUs],
    degrees: [],
    specialties: [],
    acceptedInsurance: [],
    facilityIds: []
}

describe('submission professional fields', () => {
    test('allows an update to save empty degrees, specialties, and insurance', () => {
        const result = validateUpdateSubmissionInput({
            healthcareProfessionals: [draftProfessional]
        })

        expect(result.hasErrors).toBe(false)
    })

    test('still rejects a degree list that is too long', () => {
        const result = validateUpdateSubmissionInput({
            healthcareProfessionals: [{
                ...draftProfessional,
                degrees: Array.from({ length: 65 }, () => Degree.Dds)
            }]
        })

        expect(result.hasErrors).toBe(true)
        expect(result.errors?.[0].field).toBe('healthcareProfessionals[0].degrees')
        expect(result.errors?.[0].errorCode).toBe(ErrorCode.INVALID_LENGTH_TOO_LONG)
    })

    test('requires degrees, specialties, and insurance before approving a new professional', () => {
        const result = validateApprovalProfessionalFields({
            healthcareProfessionals: [draftProfessional]
        })

        expect(result.errors?.map(error => error.field)).toEqual([
            'healthcareProfessionals[0].degrees',
            'healthcareProfessionals[0].specialties',
            'healthcareProfessionals[0].acceptedInsurance'
        ])
    })

    test('approves when those lists are present', () => {
        const result = validateApprovalProfessionalFields({
            healthcareProfessionals: [{
                ...draftProfessional,
                degrees: [Degree.Dds],
                specialties: [Specialty.Cardiology],
                acceptedInsurance: [Insurance.JapaneseHealthInsurance]
            }]
        })

        expect(result.hasErrors).toBe(false)
    })

    test('does not require the lists when the submission already links a professional', () => {
        const result = validateApprovalProfessionalFields({
            facilityHealthcareProfessionalIds: ['professional-1'],
            healthcareProfessionals: [draftProfessional]
        })

        expect(result.hasErrors).toBe(false)
    })
})
